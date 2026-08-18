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
  const contents = [
    { role: 'user', parts: [{ text: "What is the weather in London?" }] }
  ];

  const result = await model.generateContentStream({ contents });
  for await (const chunk of result.stream) {}
  
  const resp = await result.response;
  const cleanParts = resp.candidates[0].content.parts.filter(p => !('text' in p) || p.text !== "");
  
  console.log("cleanParts:", JSON.stringify(cleanParts, null, 2));
  
  contents.push({
    role: 'model',
    parts: cleanParts.length > 0 ? cleanParts : resp.candidates[0].content.parts
  });

  contents.push({ 
    role: 'user', 
    parts: [{ functionResponse: { name: 'getWeather', response: { temp: 20 } } }] 
  });
  
  console.log("Sending contents:", JSON.stringify(contents, null, 2));
  
  try {
    const result2 = await model.generateContentStream({ contents });
    for await (const chunk of result2.stream) { }
    console.log("Success!");
  } catch (e) {
    console.log("Error:", e.message);
  }
}
run();
