import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Google Gemini API client with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Specify the embedding model
const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

export async function getGeminiEmbeddings(text: string) {
  try {
    // Clean the input text (remove newlines)
    const cleanedText = text.replace(/\n/g, " ");
    
    // Generate embeddings using the Gemini API
    const response = await model.embedContent(cleanedText);
    
    // Return the embedding values as a number array
    return response.embedding.values;
  } catch (error) {
    console.log("Error calling Google Gemini embeddings API:", error);
    throw error;
  }
}
