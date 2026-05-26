import { NextResponse } from "next/server";
import { searchTrophyVideo } from "@/lib/youtube-service";
import { generateTrophyGuide } from "@/lib/gemini-service";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const gameName = searchParams.get("gameName");
  const trophyName = searchParams.get("trophyName");
  const trophyDetail = searchParams.get("trophyDetail") || "";

  if (!gameName || !trophyName) {
    return NextResponse.json(
      { error: "Los parámetros 'gameName' y 'trophyName' son obligatorios." },
      { status: 400 }
    );
  }

  try {
    const video = await searchTrophyVideo(gameName, trophyName);
    
    // Generar la guía/resumen paso a paso basada en IA o en plantilla local
    const guideResult = await generateTrophyGuide(
      gameName,
      trophyName,
      trophyDetail,
      video.description || ""
    );

    return NextResponse.json({ 
      video,
      guide: guideResult.guide,
      guideSource: guideResult.source
    });
  } catch (error) {
    console.error(`Error en API /api/video para ${gameName} - ${trophyName}:`, error);
    return NextResponse.json(
      { error: "Error al buscar el videotutorial en YouTube." },
      { status: 500 }
    );
  }
}
