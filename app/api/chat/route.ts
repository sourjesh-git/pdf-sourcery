import { GoogleGenerativeAI } from "@google/generative-ai";
import { Message } from "ai";
import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { chats, messages as _messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const runtime = "edge";

// Initialize the Gemini AI client
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not defined");
}
const google = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const googleAI = google.getGenerativeModel({ model: 'gemini-2.0-flash-exp'}); // Set to the latest Gemini model you're using

export async function POST(req: Request) {
  try {
    // Retrieve the incoming request data (messages and chatId)
    const { messages, chatId } = await req.json();

    // Query for the chat record from the database
    const _chats = await db.select().from(chats).where(eq(chats.id, chatId));
    if (_chats.length !== 1) {
      return NextResponse.json({ error: "chat not found" }, { status: 404 });
    }

    const fileKey = _chats[0].fileKey;
    const lastMessage = messages[messages.length - 1];

    // Get context based on the chat's fileKey
    const context = await getContext(lastMessage.content, fileKey);

    // Prepare the prompt, combining context with system message
    const prompt = {
        role: "system",
        content: `AI assistant is a brand new, powerful, human-like artificial intelligence.
        The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
        AI is a well-behaved and well-mannered individual.
        AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
        AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
        AI assistant is a big fan of Pinecone and Vercel.
        START CONTEXT BLOCK
        ${context}
        END OF CONTEXT BLOCK
        AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
        If the context does not provide the answer to question, the AI assistant will say, "I'm sorry, but I don't know the answer to that question".
        AI assistant will not apologize for previous responses, but instead will indicated new information was gained.
        AI assistant will not invent anything that is not drawn directly from the context.
        `,
      };

    // Make a request for a single response from Gemini AI (disable streaming)
    // Make a request for a single response from Gemini AI (adjust method to 'generate' or another method)
    const result = await googleAI.generateContent([
      prompt,
      ...messages.filter((message: Message) => message.role === "user").map((message: Message) => ({
        role: message.role,
        content: message.content,
      })),
    ]);

    // Get the AI response text (assuming the result structure is like this)
    const aiResponse = result.response.text(); // Adjust this line based on the actual structure of the result

    // Save user message and AI response to the database
    await db.insert(_messages).values({
      chatId,
      content: lastMessage.content,
      role: "user",
    });

    await db.insert(_messages).values({
      chatId,
      content: aiResponse, // Store the full response from AI
      role: "system",
    });

    // Return the AI response in the Next.js response
    return NextResponse.json({ text: aiResponse });
  } catch (error) {
    console.error("Error generating content:", error);
    return new NextResponse("An error occurred while generating content", { status: 500 });
  }
}
