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
  console.log("Sending: What is the weather in London?");
  const result = await chat.sendMessageStream("What is the weather in London?");
  for await (const chunk of result.stream) { }
  await result.response;
  
  const history = await chat.getHistory();
  console.log("History after first call:", JSON.stringify(history, null, 2));

  console.log("Sending tool result...");
  try {
    const result2 = await chat.sendMessageStream([{
      functionResponse: { name: 'getWeather', response: { temp: 20 } }
    }]);
    for await (const chunk of result2.stream) {}
    console.log("Success!");
  } catch (e) {
    console.error("Error:", e.message);
  }
}
run();
