import { NextResponse } from "next/server";
import { searchTrophyVideo } from "@/lib/youtube-service";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const gameName = searchParams.get("gameName");
  const trophyName = searchParams.get("trophyName");

  if (!gameName || !trophyName) {
    return NextResponse.json(
      { error: "Los parámetros 'gameName' y 'trophyName' son obligatorios." },
      { status: 400 }
    );
  }

  try {
    const video = await searchTrophyVideo(gameName, trophyName);
    return NextResponse.json({ video });
  } catch (error) {
    console.error(`Error en API /api/video para ${gameName} - ${trophyName}:`, error);
    return NextResponse.json(
      { error: "Error al buscar el videotutorial en YouTube." },
      { status: 500 }
    );
  }
}
