import {
  exchangeNpssoForCode,
  exchangeCodeForAccessToken,
  getUserTitles,
  getUserTrophiesEarnedForTitle,
  makeUniversalSearch,
  getTitleTrophies
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
    conceptIconUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&q=80", // Respaldo estético
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
      earned: false
    },
    {
      trophyId: 2,
      trophyName: "El error del juicio",
      trophyDetail: "Derrota a la reina valquiria Gná.",
      trophyType: "silver",
      trophyIconUrl: "https://images.unsplash.com/photo-1595303526913-c7037797ebe7?w=150&q=80",
      earned: false
    },
    {
      trophyId: 3,
      trophyName: "Floristería",
      trophyDetail: "Recoge una flor de cada uno de los nueve reinos.",
      trophyType: "bronze",
      trophyIconUrl: "https://images.unsplash.com/photo-1595303526913-c7037797ebe7?w=150&q=80",
      earned: false
    }
  ],
  "NPWR31201_00": [
    {
      trophyId: 1,
      trophyName: "Al máximo",
      trophyDetail: "Compra todas las mejoras de tecnología de traje.",
      trophyType: "silver",
      trophyIconUrl: "https://images.unsplash.com/photo-1595303526913-c7037797ebe7?w=150&q=80",
      earned: false
    },
    {
      trophyId: 2,
      trophyName: "Grapas",
      trophyDetail: "Encuentra y completa todos los experimentos de la Fundación Emily-May.",
      trophyType: "bronze",
      trophyIconUrl: "https://images.unsplash.com/photo-1595303526913-c7037797ebe7?w=150&q=80",
      earned: false
    }
  ],
  "NPWR22143_00": [
    {
      trophyId: 1,
      trophyName: "Señor de Elden",
      trophyDetail: "Consigue el final 'Señor de Elden'.",
      trophyType: "gold",
      trophyIconUrl: "https://images.unsplash.com/photo-1595303526913-c7037797ebe7?w=150&q=80",
      earned: false
    },
    {
      trophyId: 2,
      trophyName: "Shardbearer Malenia",
      trophyDetail: "Derrota a la portadora de la gran runa, Malenia, Espada de Miquella.",
      trophyType: "silver",
      trophyIconUrl: "https://images.unsplash.com/photo-1595303526913-c7037797ebe7?w=150&q=80",
      earned: false
    },
    {
      trophyId: 3,
      trophyName: "Portador de esquirlas Radahn",
      trophyDetail: "Derrota al portador de la gran runa, el Azote de las Estrellas Radahn.",
      trophyType: "bronze",
      trophyIconUrl: "https://images.unsplash.com/photo-1595303526913-c7037797ebe7?w=150&q=80",
      earned: false
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
    return MOCK_GAMES;
  }

  try {
    const auth = await getAuth();
    
    // Buscar al usuario para obtener su accountId
    const searchResponse = await makeUniversalSearch(auth, psnId, "SocialAllAccounts");
    const accountId = searchResponse.results?.[0]?.socialMetadata?.accountId;
    
    if (!accountId) {
      throw new Error("USER_NOT_FOUND");
    }

    // Obtener los juegos del usuario
    const titlesResponse = await getUserTitles(auth, accountId);
    
    if (!titlesResponse.trophyTitles) {
      return [];
    }

    return titlesResponse.trophyTitles.map(title => ({
      titleName: title.trophyTitleName,
      npCommunicationId: title.npCommunicationId,
      trophyGroupId: "all",
      progress: title.progress,
      conceptIconUrl: title.trophyTitleIconUrl,
      platform: title.trophyTitlePlatform,
      earnedTrophies: title.earnedTrophies,
      definedTrophies: title.definedTrophies
    }));
  } catch (error) {
    console.error(`Error al obtener juegos reales de ${psnId}, usando fallback mock:`, error);
    // Si falla por algún problema de API o expiración del bot, retornamos el Mock para no romper la experiencia
    return MOCK_GAMES;
  }
}

/**
 * Obtiene los trofeos pendientes de un juego para un usuario específico
 */
export async function getPendingTrophiesForGame(psnId, npCommunicationId) {
  if (!process.env.PSN_NPSSO) {
    console.log(`[Modo Simulación] Devolviendo trofeos mock para: ${npCommunicationId}`);
    return MOCK_TROPHIES[npCommunicationId] || [];
  }

  try {
    const auth = await getAuth();
    
    // Obtener accountId del usuario
    const searchResponse = await makeUniversalSearch(auth, psnId, "SocialAllAccounts");
    const accountId = searchResponse.results?.[0]?.socialMetadata?.accountId;
    
    if (!accountId) {
      throw new Error("USER_NOT_FOUND");
    }

    // Obtener todos los trofeos del juego
    const allTrophiesResponse = await getTitleTrophies(auth, npCommunicationId, "all");
    
    // Obtener trofeos conseguidos por el usuario
    const earnedTrophiesResponse = await getUserTrophiesEarnedForTitle(auth, accountId, npCommunicationId, "all");

    // Mapear trofeos y detectar cuáles no han sido obtenidos
    const earnedMap = new Map();
    if (earnedTrophiesResponse.trophies) {
      earnedTrophiesResponse.trophies.forEach(t => {
        earnedMap.set(t.trophyId, t.earned);
      });
    }

    const pendingTrophies = allTrophiesResponse.trophies
      .filter(t => {
        const isEarned = earnedMap.get(t.trophyId) ?? false;
        return !isEarned; // Filtramos para dejar solo los pendientes
      })
      .map(t => ({
        trophyId: t.trophyId,
        trophyName: t.trophyName,
        trophyDetail: t.trophyDetail,
        trophyType: t.trophyType,
        trophyIconUrl: t.trophyIconUrl,
        earned: false
      }));

    return pendingTrophies;
  } catch (error) {
    console.error(`Error al obtener trofeos reales para ${npCommunicationId}, usando fallback mock:`, error);
    return MOCK_TROPHIES[npCommunicationId] || [];
  }
}
