import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const apiKey = env.split('\n').find(l => l.startsWith('GEMINI_API_KEY=')).split('=')[1];
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: 'gemini-3.5-flash-lite',
  tools: [{
    functionDeclarations: [{
      name: 'getWeather',
      description: 'Get weather',
      parameters: { type: 'object', properties: { location: { type: 'string' } } }
    }]
  }]
});

async function run() {
  const result = await model.generateContentStream("What is the weather in London?");
  let chunkPart = null;
  for await (const chunk of result.stream) {
    if (chunk.candidates && chunk.candidates[0].content) {
      const fc = chunk.candidates[0].content.parts.find(p => p.functionCall);
      if (fc) chunkPart = fc;
    }
  }
  const resp = await result.response;
  console.log("Chunk Part:", JSON.stringify(chunkPart, null, 2));
  console.log("Response Parts:", JSON.stringify(resp.candidates[0].content.parts, null, 2));
}
run();
