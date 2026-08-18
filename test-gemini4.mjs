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

  console.log("Calling API...");
  const result = await model.generateContentStream({ contents });
  
  let functionCallPart = null;
  for await (const chunk of result.stream) {
    if (chunk.candidates[0]?.content?.parts) {
      const fc = chunk.candidates[0].content.parts.find(p => p.functionCall);
      if (fc) functionCallPart = fc;
    }
  }
  
  if (functionCallPart) {
    console.log("Function call detected:", functionCallPart);
    contents.push({ role: 'model', parts: [functionCallPart] });
    
    // Add function response
    contents.push({ 
      role: 'user', 
      parts: [{ functionResponse: { name: 'getWeather', response: { temp: 20 } } }] 
    });
    
    console.log("Calling API with tool response...");
    const result2 = await model.generateContentStream({ contents });
    for await (const chunk of result2.stream) {
      console.log("Chunk text:", chunk.text());
    }
    console.log("Success!");
  }
}
run();
