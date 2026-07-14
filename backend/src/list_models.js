import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function main() {
  try {
    const response = await ai.models.list();
    for await (const model of response) {
      if (model.name.includes('embed') || model.supportedActions?.includes('embedContent')) {
         console.log(`Model: ${model.name}, Supported Actions: ${model.supportedActions}`);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

main();
