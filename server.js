import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// --- Error Handling for API Keys ---
// Check if the required API keys are present in the environment variables
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ FATAL ERROR: GEMINI_API_KEY is not defined in your .env file.");
  process.exit(1); // Exit the process with an error code
}
if (!process.env.MURF_API_KEY) {
  console.error("❌ FATAL ERROR: MURF_API_KEY is not defined in your .env file.");
  process.exit(1);
}

// --- Initialize Google Generative AI ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Use a current and valid model name. "gemini-1.5-flash" is a great choice.
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- API Endpoint ---
app.post('/simplify-and-speak', async (req, res) => {
  // Destructure text from the request body
  const { text } = req.body;

  // Basic validation to ensure text is provided
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({ error: "Text to simplify is required." });
  }

  console.log("Received text:", text);

  try {
    // --- Step 1: Simplify text with Gemini ---
const prompt = `Your goal is to simplify a sentence for a 10-year-old.

1.  Rewrite the original sentence in 1-2 very short, simple sentences.
2.  After the sentence, provide one easy-to-understand, real-world analogy.
3.  Do not use any technical words or jargon.

Original: "${text}"
Simplified:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const simplifiedText = response.text().trim();

    console.log("Simplified text:", simplifiedText);

    // --- Step 2: Convert simplified text to speech with Murf.ai ---
    const murfResponse = await fetch("https://api.murf.ai/v1/speech/generate", {
      method: "POST",
      headers: {
        "api-key": process.env.MURF_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        voice_id: "en-US-ken", // Make sure this voice_id is correct for your Murf account
        text: simplifiedText,
        // It's good practice to specify other parameters if needed, e.g., format
        format: "mp3", 
        quality: "high",
        sampleRate: 44100
      })
    });

    // Check if the Murf API call was successful
    if (!murfResponse.ok) {
        const errorBody = await murfResponse.text();
        console.error(`❌ Murf API Error (${murfResponse.status}):`, errorBody);
        throw new Error(`Murf API responded with status ${murfResponse.status}`);
    }

    const murfData = await murfResponse.json();
   // console.log("Murf API response data:", murfData);

    // --- Step 3: Send the audio URL back to the client ---
    res.json({ audioFile: murfData.audioFile });

  } catch (error) {
    // Log the detailed error on the server
    console.error("❌ An error occurred in the /simplify-and-speak endpoint:", error);
    
    // Send a generic error message to the client
    res.status(500).json({ error: "An internal server error occurred. Please check server logs." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server is running beautifully on http://localhost:${PORT}`);
});
