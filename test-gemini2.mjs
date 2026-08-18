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
  const chat = model.startChat();
  const result = await chat.sendMessageStream("What is the weather in London?");
  for await (const chunk of result.stream) { }
  const resp = await result.response;
  console.log("Response:", JSON.stringify(resp, null, 2));
  console.log("isValid:", resp.candidates && resp.candidates[0] && resp.candidates[0].content && resp.candidates[0].content.parts && resp.candidates[0].content.parts.length > 0);
  console.log("History:", await chat.getHistory());
}
run();
