// =========================================================
// POST /api/chat — Route Handler del asistente IA
// Gemini 2.5 Flash con streaming + tool use loop
// Siempre usa cliente Supabase autenticado (RLS activo)
// =========================================================

import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { AI_TOOLS } from '@/lib/ai/tools'
import { executeToolCall } from '@/lib/ai/tool-executor'
import { buildSystemPrompt } from '@/lib/ai/system-prompt'
import { toISODate } from '@/lib/utils'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const MODEL = 'gemini-2.5-flash-preview-05-20'

interface ChatMessage {
  role: 'user' | 'model'
  parts: { text: string }[]
}

export async function POST(req: Request) {
  try {
    // 1. Autenticar
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: 'No autenticado.' }, { status: 401 })
    }

    // 2. Parsear body
    const body = await req.json()
    const messages: ChatMessage[] = body.messages ?? []
    if (!messages.length) {
      return Response.json({ error: 'No se recibieron mensajes.' }, { status: 400 })
    }

    // 3. Cargar contexto del usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, default_currency, timezone')
      .eq('id', user.id)
      .single()

    const systemPrompt = buildSystemPrompt({
      userName: profile?.display_name,
      defaultCurrency: profile?.default_currency ?? 'ARS',
      timezone: profile?.timezone ?? 'America/Argentina/Buenos_Aires',
      today: toISODate(new Date()),
    })

    // 4. Configurar modelo con tools
    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction: systemPrompt,
      tools: AI_TOOLS,
    })

    // 5. Separar history del último mensaje
    const history = messages.slice(0, -1)
    const lastMessage = messages[messages.length - 1]

    const chat = model.startChat({ history })

    // 6. Streaming con tool use loop
    const encoder = new TextEncoder()
    let transactionCreated = false

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let currentParts = lastMessage.parts
          let continueLoop = true

          while (continueLoop) {
            // Llamada a Gemini con streaming
            const result = await chat.sendMessageStream(currentParts)

            let fullText = ''
            const functionCalls: { name: string; args: Record<string, unknown> }[] = []

            // Iterar chunks del stream
            for await (const chunk of result.stream) {
              const candidate = chunk.candidates?.[0]
              if (!candidate) continue

              for (const part of candidate.content?.parts ?? []) {
                if (part.text) {
                  fullText += part.text
                  // Enviar texto al cliente en tiempo real
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'text', text: part.text })}\n\n`)
                  )
                }
                if (part.functionCall) {
                  functionCalls.push({
                    name: part.functionCall.name,
                    args: part.functionCall.args as Record<string, unknown>,
                  })
                }
              }
            }

            // Si no hay tool calls, terminamos
            if (functionCalls.length === 0) {
              continueLoop = false
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'done', transactionCreated })}\n\n`)
              )
              break
            }

            // Ejecutar tool calls
            const toolResults = []
            for (const fc of functionCalls) {
              const toolResult = await executeToolCall(fc.name, fc.args, supabase, user.id)

              if (fc.name === 'create_transaction' && toolResult.transactionCreated) {
                transactionCreated = true
              }

              // Notificar al cliente que se ejecutó una tool
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: 'tool', name: fc.name, success: toolResult.success })}\n\n`
                )
              )

              toolResults.push({
                functionResponse: {
                  name: fc.name,
                  response: toolResult.success
                    ? { result: toolResult.data }
                    : { error: toolResult.error },
                },
              })
            }

            // Preparar siguiente vuelta con los resultados de las tools
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            currentParts = toolResults as unknown as typeof currentParts
          }
        } catch (err) {
          console.error('[api/chat] stream error:', err)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'error', message: 'Error al procesar la respuesta.' })}\n\n`
            )
          )
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    console.error('[api/chat] error:', err)
    return Response.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}
