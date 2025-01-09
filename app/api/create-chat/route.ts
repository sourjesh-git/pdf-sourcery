import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { loadS3IntoPinecone } from "@/lib/pinecone";
import { getS3Url } from "@/lib/s3";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request, res: Response) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { file_key, file_name } = body;

    if (!file_key || !file_name) {
      return NextResponse.json(
        { error: "file_key and file_name are required" },
        { status: 400 }
      );
    }

    console.log("Received file_key and file_name:", file_key, file_name);

    try {
      await loadS3IntoPinecone(file_key);
    } catch (error) {
      console.error("Error loading S3 into Pinecone:", error);
      return NextResponse.json(
        { error: "failed to process file in S3" },
        { status: 500 }
      );
    }

    const chat_id = await db
      .insert(chats)
      .values({
        fileKey: file_key,
        pdfName: file_name,
        pdfUrl: getS3Url(file_key),
        userId,
      })
      .returning({
        insertedId: chats.id,
      });

    console.log("Inserted chat_id:", chat_id);

    return NextResponse.json(
      {
        chat_id: chat_id[0]?.insertedId,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    let errorMessage = "An unknown error occurred";
  
    // Check if error is an instance of Error
    if (error instanceof Error) {
      errorMessage = error.message; // Access the message if it exists
    } else if (typeof error === "string") {
      errorMessage = error; // Handle if the error is a string
    }
  
    console.error("Error in /api/create-chat:", errorMessage, error);
  
    return NextResponse.json(
      {
        error: "internal server error",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
