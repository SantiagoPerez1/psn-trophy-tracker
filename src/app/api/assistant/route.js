import { NextResponse } from "next/server";
import { askTrophyAssistant } from "@/lib/gemini-service";

export async function POST(request) {
  try {
    const body = await request.json();
    const { gameName, trophyName, trophyDetail, message, history } = body;

    if (!gameName || !trophyName || !message) {
      return NextResponse.json(
        { error: "Los campos 'gameName', 'trophyName' y 'message' son obligatorios." },
        { status: 400 }
      );
    }

    const result = await askTrophyAssistant(
      gameName,
      trophyName,
      trophyDetail || "",
      message,
      history || []
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error en API /api/assistant:", error);
    return NextResponse.json(
      { error: "Error interno del servidor en el asistente de trofeos." },
      { status: 500 }
    );
  }
}
