import { NextResponse } from "next/server";
import { getGamesForUser } from "@/lib/psn-service";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { error: "El parámetro 'username' (PSN ID) es obligatorio." },
      { status: 400 }
    );
  }

  try {
    const games = await getGamesForUser(username);
    return NextResponse.json({ 
      games, 
      isSimulation: !process.env.PSN_NPSSO 
    });
  } catch (error) {
    console.error(`Error en API /api/games para ${username}:`, error);
    return NextResponse.json(
      { error: "Error al obtener los juegos del usuario. Inténtalo de nuevo." },
      { status: 500 }
    );
  }
}
