import {
  exchangeNpssoForCode,
  exchangeCodeForAccessToken,
  getUserTitles,
  getUserTrophiesEarnedForTitle,
  makeUniversalSearch,
  getTitleTrophies,
  getTitleTrophyGroups,
  getProfileFromAccountId,
  getUserPlayedGames
} from "psn-api";

// Caché para evitar re-autenticar en cada petición (el token dura 1 hora)
let cachedAuth = null;
let authExpiry = null;

async function getAuth() {
  const npsso = process.env.PSN_NPSSO;
  
  if (!npsso) {
    throw new Error("PSN_NPSSO_NOT_CONFIGURED");
  }

  // Si tenemos un token válido en caché, lo reutilizamos
  if (cachedAuth && authExpiry && Date.now() < authExpiry) {
    return cachedAuth;
  }

  try {
    const accessCode = await exchangeNpssoForCode(npsso);
    const authorization = await exchangeCodeForAccessToken(accessCode);
    
    // Guardamos en caché. Restamos 5 minutos para mayor seguridad
    cachedAuth = authorization;
    authExpiry = Date.now() + (authorization.expiresIn * 1000) - (5 * 60 * 1000);
    
    return authorization;
  } catch (error) {
    console.error("Error al autenticar con PSN usando NPSSO:", error);
    throw new Error("PSN_AUTH_FAILED");
  }
}

// === DATOS MOCK (MODO SIMULACIÓN) ===
const MOCK_GAMES = [
  {
    titleName: "God of War Ragnarök",
    npCommunicationId: "NPWR28437_00",
    trophyGroupId: "all",
    progress: 72,
    conceptIconUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&q=80",
    platform: "PS5",
    earnedTrophies: { bronze: 22, silver: 8, gold: 2, platinum: 0 },
    definedTrophies: { bronze: 28, silver: 12, gold: 4, platinum: 1 }
  },
  {
    titleName: "Marvel's Spider-Man 2",
    npCommunicationId: "NPWR31201_00",
    trophyGroupId: "all",
    progress: 88,
    conceptIconUrl: "https://images.unsplash.com/photo-1608889175123-8ec330b86f84?w=400&q=80",
    platform: "PS5",
    earnedTrophies: { bronze: 32, silver: 6, gold: 2, platinum: 0 },
    definedTrophies: { bronze: 34, silver: 8, gold: 3, platinum: 1 }
  },
  {
    titleName: "Elden Ring",
    npCommunicationId: "NPWR22143_00",
    trophyGroupId: "all",
    progress: 45,
    conceptIconUrl: "https://images.unsplash.com/photo-1655821889508-30113f8d38be?w=400&q=80",
    platform: "PS5/PS4",
    earnedTrophies: { bronze: 12, silver: 6, gold: 2, platinum: 0 },
    definedTrophies: { bronze: 24, silver: 14, gold: 3, platinum: 1 }
  }
];

const MOCK_TROPHIES = {
  "NPWR28437_00": [
    {
      trophyId: 1,
      trophyName: "Coleccionista de reliquias",
      trophyDetail: "Consigue todas las reliquias y empuñaduras de espada.",
      trophyType: "gold",
      trophyIconUrl: "https://images.unsplash.com/photo-1595303526913-c7037797ebe7?w=150&q=80",
      earned: false,
      progress: { rate: 71, value: 10, target: 14 } // Datos de progreso simulados para PS5
    },
    {
      trophyId: 2,
      trophyName: "El error del juicio",
      trophyDetail: "Derrota a la reina valquiria Gná.",
      trophyType: "silver",
      trophyIconUrl: "https://images.unsplash.com/photo-1595303526913-c7037797ebe7?w=150&q=80",
      earned: false,
      progress: null // Un jefe no suele llevar un contador numérico sino sí/no
    },
    {
      trophyId: 3,
      trophyName: "Floristería",
      trophyDetail: "Recoge una flor de cada uno de los nueve reinos.",
      trophyType: "bronze",
      trophyIconUrl: "https://images.unsplash.com/photo-1595303526913-c7037797ebe7?w=150&q=80",
      earned: false,
      progress: { rate: 66, value: 6, target: 9 }
    }
  ],
  "NPWR31201_00": [
    {
      trophyId: 1,
      trophyName: "Al máximo",
      trophyDetail: "Compra todas las mejoras de tecnología de traje.",
      trophyType: "silver",
      trophyIconUrl: "https://images.unsplash.com/photo-1595303526913-c7037797ebe7?w=150&q=80",
      earned: false,
      progress: { rate: 80, value: 4, target: 5 }
    },
    {
      trophyId: 2,
      trophyName: "Grapas",
      trophyDetail: "Encuentra y completa todos los experimentos de la Fundación Emily-May.",
      trophyType: "bronze",
      trophyIconUrl: "https://images.unsplash.com/photo-1595303526913-c7037797ebe7?w=150&q=80",
      earned: false,
      progress: { rate: 55, value: 5, target: 9 }
    }
  ],
  "NPWR22143_00": [
    {
      trophyId: 1,
      trophyName: "Señor de Elden",
      trophyDetail: "Consigue el final 'Señor de Elden'.",
      trophyType: "gold",
      trophyIconUrl: "https://images.unsplash.com/photo-1595303526913-c7037797ebe7?w=150&q=80",
      earned: false,
      progress: null
    },
    {
      trophyId: 2,
      trophyName: "Shardbearer Malenia",
      trophyDetail: "Derrota a la portadora de la gran runa, Malenia, Espada de Miquella.",
      trophyType: "silver",
      trophyIconUrl: "https://images.unsplash.com/photo-1595303526913-c7037797ebe7?w=150&q=80",
      earned: false,
      progress: null
    },
    {
      trophyId: 3,
      trophyName: "Portador de esquirlas Radahn",
      trophyDetail: "Derrota al portador de la gran runa, el Azote de las Estrellas Radahn.",
      trophyType: "bronze",
      trophyIconUrl: "https://images.unsplash.com/photo-1595303526913-c7037797ebe7?w=150&q=80",
      earned: false,
      progress: null
    }
  ]
};

// === FUNCIONES DE SERVICIO PÚBLICAS ===

/**
 * Obtiene los juegos de un usuario por su PSN ID
 */
export async function getGamesForUser(psnId) {
  // Si no está configurado NPSSO, devolvemos datos mock
  if (!process.env.PSN_NPSSO) {
    console.log(`[Modo Simulación] Devolviendo juegos mock para el usuario: ${psnId}`);
    return { 
      games: MOCK_GAMES, 
      isMock: true,
      userProfile: {
        onlineId: psnId,
        avatarUrl: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&q=80",
        isPlus: true
      }
    };
  }

  try {
    const auth = await getAuth();
    
    // Buscar al usuario para obtener su accountId
    const searchResponse = await makeUniversalSearch(auth, psnId, "SocialAllAccounts");
    
    // Extraer resultados del primer dominio de búsqueda universal
    const searchResults = searchResponse.domainResponses?.[0]?.results || [];
    
    // Intentar buscar la coincidencia exacta de onlineId
    const matchedUser = searchResults.find(
      r => r.socialMetadata?.onlineId?.toLowerCase() === psnId.toLowerCase()
    );
    
    const accountId = matchedUser?.socialMetadata?.accountId || searchResults[0]?.socialMetadata?.accountId;
    
    if (!accountId) {
      throw new Error("USER_NOT_FOUND");
    }

    // Obtener el perfil detallado del usuario (avatar, PS Plus, etc.)
    let userProfile = {
      onlineId: psnId,
      avatarUrl: null,
      isPlus: false
    };

    try {
      const profileResponse = await getProfileFromAccountId(auth, accountId);
      if (profileResponse) {
        const avatarObj = profileResponse.avatarUrls?.find(
          a => a.size === "xl" || a.size === "l"
        ) || profileResponse.avatarUrls?.[0];
        userProfile.avatarUrl = avatarObj?.avatarUrl || null;
        userProfile.isPlus = profileResponse.isPlus || profileResponse.plus || false;
      }
    } catch (profileErr) {
      console.warn(`No se pudo obtener el perfil detallado del usuario de PSN:`, profileErr);
    }

    // Obtener los juegos del usuario
    const titlesResponse = await getUserTitles(auth, accountId);
    
    if (!titlesResponse.trophyTitles) {
      return { games: [], isMock: false, userProfile };
    }

    const games = titlesResponse.trophyTitles.map(title => ({
      titleName: title.trophyTitleName,
      npCommunicationId: title.npCommunicationId,
      trophyGroupId: "all",
      progress: title.progress,
      conceptIconUrl: title.trophyTitleIconUrl,
      platform: title.trophyTitlePlatform,
      earnedTrophies: title.earnedTrophies,
      definedTrophies: title.definedTrophies
    }));

    return { games, isMock: false, userProfile };
  } catch (error) {
    console.error(`Error al obtener juegos reales de ${psnId}:`, error);
    
    // Identificamos errores de privacidad u otros conocidos
    let errorMessage = "UNKNOWN_ERROR";
    const errStr = String(error).toLowerCase() + " " + String(error.message).toLowerCase();
    
    if (error.message === "USER_NOT_FOUND") {
      errorMessage = "USER_NOT_FOUND";
    } else if (
      error.status === 403 || 
      errStr.includes("403") || 
      errStr.includes("forbidden") || 
      errStr.includes("private") || 
      errStr.includes("not allowed")
    ) {
      errorMessage = "PROFILE_PRIVATE";
    } else if (error.message === "PSN_AUTH_FAILED") {
      errorMessage = "PSN_AUTH_FAILED";
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Obtiene los trofeos pendientes de un juego para un usuario específico
 */
export async function getPendingTrophiesForGame(psnId, npCommunicationId, platform) {
  if (!process.env.PSN_NPSSO) {
    console.log(`[Modo Simulación] Devolviendo trofeos mock para: ${npCommunicationId}`);
    const mockList = MOCK_TROPHIES[npCommunicationId] || [];
    return mockList.map(t => ({
      ...t,
      activityType: classifyTrophy(t.trophyName, t.trophyDetail),
      trophyEarnedRate: t.trophyEarnedRate !== undefined ? t.trophyEarnedRate : (t.trophyType === "gold" ? 2.5 : t.trophyType === "silver" ? 8.4 : 24.5)
    }));
  }

  try {
    const auth = await getAuth();
    
    // Obtener accountId del usuario
    const searchResponse = await makeUniversalSearch(auth, psnId, "SocialAllAccounts");
    
    const searchResults = searchResponse.domainResponses?.[0]?.results || [];
    
    const matchedUser = searchResults.find(
      r => r.socialMetadata?.onlineId?.toLowerCase() === psnId.toLowerCase()
    );
    const accountId = matchedUser?.socialMetadata?.accountId || searchResults[0]?.socialMetadata?.accountId;
    
    if (!accountId) {
      throw new Error("USER_NOT_FOUND");
    }

    // Determinar npServiceName basándose en la plataforma (los juegos de PS5 requieren "trophy2" para el progreso)
    const isPS5 = platform?.toUpperCase().includes("PS5");
    const npServiceName = isPS5 ? "trophy2" : "trophy";

    // Obtener todos los trofeos del juego con localización en español
    const allTrophiesResponse = await getTitleTrophies(auth, npCommunicationId, "all", { 
      npServiceName,
      headerOverrides: { "Accept-Language": "es-ES,es;q=0.9" }
    });
    
    // Obtener trofeos conseguidos por el usuario (aquí se incluyen datos de progreso de trofeos de PS5)
    const earnedTrophiesResponse = await getUserTrophiesEarnedForTitle(auth, accountId, npCommunicationId, "all", { 
      npServiceName,
      headerOverrides: { "Accept-Language": "es-ES,es;q=0.9" }
    });

    // 1. Mapear los targets (objetivos totales) de los trofeos desde la definición global del juego
    const targetMap = new Map();
    if (allTrophiesResponse.trophies) {
      allTrophiesResponse.trophies.forEach(t => {
        if (t.trophyProgressTargetValue !== undefined) {
          targetMap.set(t.trophyId, parseInt(t.trophyProgressTargetValue));
        }
      });
    }

    // Mapear trofeos y detectar cuáles no han sido obtenidos
    const earnedMap = new Map();
    const progressMap = new Map();
    
    if (earnedTrophiesResponse.trophies) {
      earnedTrophiesResponse.trophies.forEach(t => {
        earnedMap.set(t.trophyId, t.earned);
        
        // Si tiene datos de progreso de trofeo nativos (común en juegos de PS5)
        // t.progress en psn-api contiene el valor de progreso actual en formato string (ej: "4")
        // t.progressRate contiene la tasa de progreso de 0 a 100 (ej: 80)
        if (t.progressRate !== undefined || t.progress !== undefined) {
          const target = targetMap.get(t.trophyId) || 0;
          const value = t.progress ? parseInt(t.progress) : 0;
          
          if (target > 0) {
            progressMap.set(t.trophyId, {
              rate: t.progressRate ?? Math.round((value / target) * 100),
              value: value,
              target: target
            });
          }
        }
      });
    }

    // Obtener los grupos de trofeos para saber el nombre de cada grupo (juego base y DLCs)
    const groupNameMap = new Map();
    try {
      const trophyGroupsResponse = await getTitleTrophyGroups(auth, npCommunicationId, { 
        npServiceName,
        headerOverrides: { "Accept-Language": "es-ES,es;q=0.9" }
      });
      if (trophyGroupsResponse?.trophyGroups) {
        trophyGroupsResponse.trophyGroups.forEach(g => {
          // El grupo "default" representa el Juego Base
          const name = g.trophyGroupId === "default" ? "Juego Base" : g.trophyGroupName;
          groupNameMap.set(g.trophyGroupId, name);
        });
      }
    } catch (grpErr) {
      console.warn("No se pudieron obtener los nombres de los grupos de trofeos de PSN. Se usarán valores predeterminados:", grpErr);
    }

    const pendingTrophies = allTrophiesResponse.trophies
      .filter(t => {
        const isEarned = earnedMap.get(t.trophyId) ?? false;
        return !isEarned;
      })
      .map(t => ({
        trophyId: t.trophyId,
        trophyName: t.trophyName,
        trophyDetail: t.trophyDetail,
        trophyType: t.trophyType,
        trophyIconUrl: t.trophyIconUrl,
        trophyGroupId: t.trophyGroupId, // ID del grupo (para distinguir juego base "default" de expansiones/DLCs)
        trophyGroupName: groupNameMap.get(t.trophyGroupId) || (t.trophyGroupId === "default" ? "Juego Base" : `DLC - Expansión ${t.trophyGroupId}`), // Nombre descriptivo del DLC o Juego Base
        earned: false,
        progress: progressMap.get(t.trophyId) || null, // Añadir los datos de progreso real (si existen)
        activityType: classifyTrophy(t.trophyName, t.trophyDetail),
        trophyEarnedRate: t.trophyEarnedRate !== undefined ? parseFloat(t.trophyEarnedRate) : null
      }));

    return pendingTrophies;
  } catch (error) {
    console.error(`Error al obtener trofeos reales para ${npCommunicationId}:`, error);
    
    let errorMessage = "UNKNOWN_ERROR";
    const errStr = String(error).toLowerCase() + " " + String(error.message).toLowerCase();
    
    if (
      error.status === 403 || 
      errStr.includes("403") || 
      errStr.includes("forbidden") || 
      errStr.includes("private") || 
      errStr.includes("not allowed")
    ) {
      errorMessage = "PROFILE_PRIVATE";
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Clasifica semánticamente un trofeo según su nombre y descripción
 */
export function classifyTrophy(name, detail) {
  const nameLower = (name || "").toLowerCase();
  const detailLower = (detail || "").toLowerCase();

  // 0. Caso especial: Platino
  if (
    nameLower.includes("platinum") || nameLower.includes("platino") ||
    detailLower.includes("collect every") || detailLower.includes("all other trophies") ||
    detailLower.includes("obtain all trophies") || detailLower.includes("consigue todos los trofeos") ||
    detailLower.includes("conseguir todos los trofeos") || detailLower.includes("todos los demás trofeos") ||
    detailLower.includes("desbloquea todos los trofeos")
  ) {
    return "other";
  }

  // 1. Online / Multijugador
  if (
    detailLower.includes("online") || detailLower.includes("co-op") || detailLower.includes("cooperativo") ||
    detailLower.includes("multiplayer") || detailLower.includes("multijugador") || detailLower.includes("amigo") ||
    detailLower.includes("friend") || detailLower.includes("match") || detailLower.includes("partida") ||
    detailLower.includes("squad") || detailLower.includes("equipo") || nameLower.includes("online") ||
    nameLower.includes("co-op") || nameLower.includes("cooperativo") || nameLower.includes("multiplayer")
  ) {
    return "online";
  }

  // 2. Historia / Campaña
  const hasStoryKeyword = (
    detailLower.includes("chapter") || detailLower.includes("complete the story") || detailLower.includes("mision") ||
    detailLower.includes("historia") || detailLower.includes("capitulo") || detailLower.includes("campaña") ||
    detailLower.includes("prologo") || detailLower.includes("secuencia") || detailLower.includes("epilogo") ||
    detailLower.includes("story") || detailLower.includes("epilogue") || detailLower.includes("prologue") ||
    detailLower.includes("mission") || detailLower.includes("defeat the final") || detailLower.includes("derrota al jefe final") ||
    nameLower.includes("capítulo") || nameLower.includes("chapter") || nameLower.includes("prologue") ||
    nameLower.includes("epilogue")
  );

  const isOptionalOrSecondary = (
    detailLower.includes("secundaria") || detailLower.includes("secundarias") ||
    detailLower.includes("desaparecida") || detailLower.includes("desaparecidas") ||
    detailLower.includes("opcional") || detailLower.includes("opcionales") ||
    detailLower.includes("cooperativa") || detailLower.includes("cooperativas") ||
    detailLower.includes("side") || detailLower.includes("lost") ||
    nameLower.includes("secundaria") || nameLower.includes("secundarias") ||
    nameLower.includes("desaparecida") || nameLower.includes("desaparecidas") ||
    nameLower.includes("opcional") || nameLower.includes("opcionales") ||
    nameLower.includes("side") || nameLower.includes("lost")
  );

  if (hasStoryKeyword && !isOptionalOrSecondary) {
    return "story";
  }

  // 3. Coleccionables
  if (
    detailLower.includes("collect") || detailLower.includes("find") || detailLower.includes("gather") ||
    detailLower.includes("relic") || detailLower.includes("reliquia") || detailLower.includes("coleccionable") ||
    detailLower.includes("caja") || detailLower.includes("lockbox") || detailLower.includes("grabacion") ||
    detailLower.includes("audio") || detailLower.includes("mapa") || detailLower.includes("cofre") ||
    detailLower.includes("chest") || detailLower.includes("journal") || detailLower.includes("diario") ||
    detailLower.includes("treasure") || detailLower.includes("tesoro") || detailLower.includes("intel") ||
    detailLower.includes("document") || detailLower.includes("documento") || nameLower.includes("collect") ||
    nameLower.includes("colección") || nameLower.includes("reliquia") || nameLower.includes("treasure")
  ) {
    return "collectible";
  }

  // 4. Combate / Jefes
  if (
    detailLower.includes("defeat") || detailLower.includes("kill") || detailLower.includes("derrota") ||
    detailLower.includes("vence") || detailLower.includes("boss") || detailLower.includes("jefe") ||
    detailLower.includes("slay") || detailLower.includes("weapon") || detailLower.includes("combate") ||
    detailLower.includes("sigilo") || detailLower.includes("stealth") || detailLower.includes("headshot") ||
    detailLower.includes("combat") || detailLower.includes("melee") || detailLower.includes("shoot") ||
    detailLower.includes("dispara") || detailLower.includes("eliminar") || detailLower.includes("elimina") ||
    detailLower.includes("enemy") || detailLower.includes("enemigo") || detailLower.includes("counter") ||
    detailLower.includes("contraataque") || nameLower.includes("defeat") || nameLower.includes("derrota") ||
    nameLower.includes("kill") || nameLower.includes("jefe") || nameLower.includes("boss")
  ) {
    return "combat";
  }

  // 5. Progreso / Nivel
  if (
    detailLower.includes("reach level") || detailLower.includes("nivel") || detailLower.includes("upgrade") ||
    detailLower.includes("mejora") || detailLower.includes("max") || detailLower.includes("equip") ||
    detailLower.includes("habilidad") || detailLower.includes("skill") || detailLower.includes("point") ||
    detailLower.includes("puntos") || detailLower.includes("xp") || detailLower.includes("experience") ||
    detailLower.includes("experiencia") || detailLower.includes("comprar") || detailLower.includes("buy") ||
    detailLower.includes("purchase") || detailLower.includes("desbloquear") || detailLower.includes("unlock") ||
    nameLower.includes("level") || nameLower.includes("nivel") || nameLower.includes("upgrade") ||
    nameLower.includes("mejora")
  ) {
    return "progression";
  }

  return "other";
}

/**
 * Obtiene el historial de juegos jugados recientemente de un usuario y sus horas de juego
 */
export async function getPlayedGamesForUser(psnId) {
  // Si no está configurado NPSSO, devolvemos datos mock
  if (!process.env.PSN_NPSSO) {
    console.log(`[Modo Simulación] Devolviendo historial de actividad mock para: ${psnId}`);
    return {
      playedGames: [
        {
          titleName: "God of War Ragnarök",
          conceptIconUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&q=80",
          platform: "PS5",
          playDuration: "PT124H30M15S", // 124 horas
          playCount: 42,
          lastPlayedDateTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          titleName: "Marvel's Spider-Man 2",
          conceptIconUrl: "https://images.unsplash.com/photo-1608889175123-8ec330b86f84?w=400&q=80",
          platform: "PS5",
          playDuration: "PT45H12M", // 45 horas
          playCount: 18,
          lastPlayedDateTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          titleName: "Elden Ring",
          conceptIconUrl: "https://images.unsplash.com/photo-1655821889508-30113f8d38be?w=400&q=80",
          platform: "PS5/PS4",
          playDuration: "PT210H45S", // 210 horas
          playCount: 95,
          lastPlayedDateTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          titleName: "Dead Island 2",
          conceptIconUrl: "https://images.unsplash.com/photo-1595303526913-c7037797ebe7?w=400&q=80",
          platform: "PS5",
          playDuration: "PT35H", // 35 horas
          playCount: 15,
          lastPlayedDateTime: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      isMock: true
    };
  }

  try {
    const auth = await getAuth();
    
    // Obtener accountId del usuario
    const searchResponse = await makeUniversalSearch(auth, psnId, "SocialAllAccounts");
    const searchResults = searchResponse.domainResponses?.[0]?.results || [];
    const matchedUser = searchResults.find(
      r => r.socialMetadata?.onlineId?.toLowerCase() === psnId.toLowerCase()
    );
    const accountId = matchedUser?.socialMetadata?.accountId || searchResults[0]?.socialMetadata?.accountId;
    
    if (!accountId) {
      throw new Error("USER_NOT_FOUND");
    }

    // Obtener la lista de juegos jugados mediante psn-api
    const playedGamesResponse = await getUserPlayedGames(auth, accountId);
    
    // Mapear la respuesta para el frontend
    const playedGames = (playedGamesResponse.titles || []).map(game => ({
      titleName: game.name || game.titleName,
      conceptIconUrl: game.image?.url || game.conceptIconUrl,
      platform: game.platform,
      playDuration: game.playDuration, // ej: "PT124H"
      playCount: game.playCount,
      lastPlayedDateTime: game.lastPlayedDateTime
    }));

    return { playedGames, isMock: false };
  } catch (error) {
    console.error(`Error al obtener historial de juego real de ${psnId}:`, error);
    
    let errorMessage = "UNKNOWN_ERROR";
    const errStr = String(error).toLowerCase() + " " + String(error.message).toLowerCase();
    
    if (error.message === "USER_NOT_FOUND") {
      errorMessage = "USER_NOT_FOUND";
    } else if (
      error.status === 403 || 
      errStr.includes("403") || 
      errStr.includes("forbidden") || 
      errStr.includes("private") || 
      errStr.includes("not allowed")
    ) {
      errorMessage = "PROFILE_PRIVATE";
    } else if (error.message === "PSN_AUTH_FAILED") {
      errorMessage = "PSN_AUTH_FAILED";
    }
    
    throw new Error(errorMessage);
  }
}

