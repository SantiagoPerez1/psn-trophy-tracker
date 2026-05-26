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
    const { games, isMock } = await getGamesForUser(username);
    return NextResponse.json({ 
      games, 
      isSimulation: isMock,
      isLiveConnected: !!process.env.PSN_NPSSO
    });
  } catch (error) {
    console.error(`Error en API /api/games para ${username}:`, error);
    
    let userFriendlyError = "Error al obtener datos de PlayStation Network.";
    
    if (error.message === "USER_NOT_FOUND") {
      userFriendlyError = `El usuario "${username}" no existe en PlayStation Network. Por favor, verifica el nombre.`;
    } else if (error.message === "PROFILE_PRIVATE") {
      userFriendlyError = `El perfil de trofeos de "${username}" es privado. Debe cambiarse a "Público" en la configuración de privacidad de tu cuenta de PlayStation.`;
    } else if (error.message === "PSN_AUTH_FAILED") {
      userFriendlyError = "Error de autenticación con el servidor. El administrador de la web debe renovar el token NPSSO.";
    } else {
      userFriendlyError = `No se pudieron cargar los datos de PlayStation Network: ${error.message}`;
    }
    
    return NextResponse.json(
      { 
        error: userFriendlyError, 
        games: [], 
        isSimulation: false,
        isLiveConnected: !!process.env.PSN_NPSSO
      },
      { status: 400 }
    );
  }
}
