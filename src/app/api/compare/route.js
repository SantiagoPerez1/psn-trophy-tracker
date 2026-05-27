import { NextResponse } from "next/server";
import { getGamesForUser } from "@/lib/psn-service";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const user1 = searchParams.get("user1");
  const user2 = searchParams.get("user2");

  if (!user1 || !user2) {
    return NextResponse.json(
      { error: "Los parámetros 'user1' y 'user2' (PSN IDs) son obligatorios." },
      { status: 400 }
    );
  }

  try {
    // Obtener datos del primer usuario
    let userData1;
    try {
      userData1 = await getGamesForUser(user1);
    } catch (err) {
      console.error(`Error al obtener juegos de ${user1} para comparar:`, err);
      let errMsg = `No se pudo obtener el perfil de "${user1}".`;
      if (err.message === "USER_NOT_FOUND") errMsg = `El usuario "${user1}" no existe en PSN.`;
      if (err.message === "PROFILE_PRIVATE") errMsg = `El perfil de "${user1}" es privado.`;
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }

    // Obtener datos del segundo usuario
    let userData2;
    try {
      userData2 = await getGamesForUser(user2);
    } catch (err) {
      console.error(`Error al obtener juegos de ${user2} para comparar:`, err);
      let errMsg = `No se pudo obtener el perfil de "${user2}".`;
      if (err.message === "USER_NOT_FOUND") errMsg = `El usuario "${user2}" no existe en PSN.`;
      if (err.message === "PROFILE_PRIVATE") errMsg = `El perfil de "${user2}" es privado.`;
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }

    // Calcular estadísticas globales agregadas de ambos usuarios
    const calculateAggregatedStats = (games) => {
      let totalPlatinums = 0;
      let totalGold = 0;
      let totalSilver = 0;
      let totalBronze = 0;
      let totalProgressSum = 0;

      games.forEach((game) => {
        totalPlatinums += game.earnedTrophies?.platinum || 0;
        totalGold += game.earnedTrophies?.gold || 0;
        totalSilver += game.earnedTrophies?.silver || 0;
        totalBronze += game.earnedTrophies?.bronze || 0;
        totalProgressSum += game.progress || 0;
      });

      const averageProgress = games.length > 0 ? Math.round(totalProgressSum / games.length) : 0;
      const totalEarned = totalPlatinums + totalGold + totalSilver + totalBronze;
      
      // Calcular nivel de cazador simulado
      const totalPoints = (totalBronze * 15) + (totalSilver * 30) + (totalGold * 90) + (totalPlatinums * 180);
      const hunterLevel = Math.max(1, Math.min(999, Math.floor(1 + Math.sqrt(totalPoints / 25))));

      return {
        totalPlatinums,
        totalGold,
        totalSilver,
        totalBronze,
        averageProgress,
        totalEarned,
        hunterLevel
      };
    };

    const stats1 = calculateAggregatedStats(userData1.games);
    const stats2 = calculateAggregatedStats(userData2.games);

    // Encontrar juegos en común y mapear progresos lado a lado
    const commonGames = [];
    const gamesMap2 = new Map();
    userData2.games.forEach((g) => {
      gamesMap2.set(g.titleName.toLowerCase(), g);
    });

    userData1.games.forEach((g1) => {
      const match2 = gamesMap2.get(g1.titleName.toLowerCase());
      if (match2) {
        commonGames.push({
          titleName: g1.titleName,
          conceptIconUrl: g1.conceptIconUrl,
          platform1: g1.platform,
          platform2: match2.platform,
          progress1: g1.progress,
          progress2: match2.progress,
          platinums1: g1.earnedTrophies?.platinum || 0,
          platinums2: match2.earnedTrophies?.platinum || 0
        });
      }
    });

    return NextResponse.json({
      user1: {
        onlineId: user1,
        profile: userData1.userProfile || { onlineId: user1, avatarUrl: null, isPlus: false },
        stats: stats1,
        gamesCount: userData1.games.length
      },
      user2: {
        onlineId: user2,
        profile: userData2.userProfile || { onlineId: user2, avatarUrl: null, isPlus: false },
        stats: stats2,
        gamesCount: userData2.games.length
      },
      commonGames
    });
  } catch (error) {
    console.error("Error en API /api/compare:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al procesar la comparación." },
      { status: 500 }
    );
  }
}
