import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;
  
  try {
    // Call Google's ListModels API directly
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models?key=" + apiKey
    );
    const result = await response.json();
    
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}