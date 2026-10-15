// =========================================================
// AI TOOLS — Function declarations para Gemini
// =========================================================

import { type Tool, SchemaType } from '@google/generative-ai'

export const AI_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'create_transaction',
        description:
          'Crea una transacción real en la base de datos del usuario. ' +
          'Llamar SOLO cuando el usuario confirma todos los datos: tipo, monto, moneda, cuenta y (si aplica) categoría. ' +
          'Si falta la cuenta o la categoría y el usuario tiene más de una opción, preguntar antes de ejecutar.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            type: { type: SchemaType.STRING, description: 'Tipo: income, expense o transfer' },
            amount: { type: SchemaType.NUMBER, description: 'Monto positivo de la transacción' },
            currency: { type: SchemaType.STRING, description: 'Código ISO 4217 (ej. ARS, USD)' },
            account_id: { type: SchemaType.STRING, description: 'UUID de la cuenta origen del usuario' },
            transfer_account_id: { type: SchemaType.STRING, description: 'UUID cuenta destino (solo transfers)' },
            category_id: { type: SchemaType.STRING, description: 'UUID de la categoría (opcional para transfers)' },
            description: { type: SchemaType.STRING, description: 'Descripción breve (opcional)' },
            occurred_at: { type: SchemaType.STRING, description: 'Fecha YYYY-MM-DD. Usar fecha actual si no se especifica.' },
          },
          required: ['type', 'amount', 'currency', 'account_id', 'occurred_at'],
        },
      },
      {
        name: 'get_accounts',
        description:
          'Devuelve las cuentas activas del usuario con saldo actual y moneda. ' +
          'NUNCA sumes saldos de distintas monedas en una sola cifra.',
        parameters: { type: SchemaType.OBJECT, properties: {} },
      },
      {
        name: 'get_transactions',
        description: 'Devuelve transacciones filtradas por rango de fechas y opcionalmente categoría/tipo.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            from: { type: SchemaType.STRING, description: 'Fecha inicio YYYY-MM-DD (inclusiva)' },
            to: { type: SchemaType.STRING, description: 'Fecha fin YYYY-MM-DD (inclusiva)' },
            category_id: { type: SchemaType.STRING, description: 'UUID categoría para filtrar (opcional)' },
            type: { type: SchemaType.STRING, description: 'income, expense o transfer (opcional)' },
            limit: { type: SchemaType.NUMBER, description: 'Máximo resultados (default 50)' },
          },
          required: ['from', 'to'],
        },
      },
      {
        name: 'get_budget_status',
        description: 'Para una categoría y mes/año, devuelve presupuesto definido, gasto real y porcentaje consumido.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            category_id: { type: SchemaType.STRING, description: 'UUID de la categoría del presupuesto' },
            year: { type: SchemaType.NUMBER, description: 'Año (ej. 2025)' },
            month: { type: SchemaType.NUMBER, description: 'Mes 1-12' },
          },
          required: ['category_id', 'year', 'month'],
        },
      },
      {
        name: 'get_monthly_summary',
        description:
          'Devuelve ingresos, gastos y balance de un mes, desglosado por moneda. ' +
          'NUNCA mezcla monedas. Usar para comparativas entre meses.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            year: { type: SchemaType.NUMBER, description: 'Año' },
            month: { type: SchemaType.NUMBER, description: 'Mes 1-12' },
          },
          required: ['year', 'month'],
        },
      },
      {
        name: 'get_categories',
        description:
          'Devuelve categorías disponibles (sistema + propias) con nombre e ID. ' +
          'Llamar para resolver nombre → UUID antes de crear transacción.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            kind: { type: SchemaType.STRING, description: 'income o expense (opcional)' },
          },
        },
      },
    ],
  },
]
