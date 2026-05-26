import { NextResponse } from "next/server";
import { getPendingTrophiesForGame } from "@/lib/psn-service";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");
  const gameId = searchParams.get("gameId");

  if (!username || !gameId) {
    return NextResponse.json(
      { error: "Los parámetros 'username' (PSN ID) y 'gameId' son obligatorios." },
      { status: 400 }
    );
  }

  try {
    const trophies = await getPendingTrophiesForGame(username, gameId);
    return NextResponse.json({ trophies });
  } catch (error) {
    console.error(`Error en API /api/trophies para ${username} en juego ${gameId}:`, error);
    return NextResponse.json(
      { error: "Error al obtener los trofeos del juego. Inténtalo de nuevo." },
      { status: 500 }
    );
  }
}
