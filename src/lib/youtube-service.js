import youtubeSearch from "youtube-search-api";

// Videos pre-mapeados para los datos Mock para garantizar que siempre funcionen y sean rápidos en la demostración
const MOCK_VIDEOS = {
  "Coleccionista de reliquias": "https://www.youtube.com/watch?v=p4v3t8zWw8k",
  "El error del juicio": "https://www.youtube.com/watch?v=QyX3Wf7eLrg",
  "Floristería": "https://www.youtube.com/watch?v=O153lO2tC48",
  "Al máximo": "https://www.youtube.com/watch?v=7M7K7Xn62Jk",
  "Grapas": "https://www.youtube.com/watch?v=uT-XU5y1eXo",
  "Señor de Elden": "https://www.youtube.com/watch?v=rC5x9s6YmP4",
  "Shardbearer Malenia": "https://www.youtube.com/watch?v=0w53J2L2s7k",
  "Portador de esquirlas Radahn": "https://www.youtube.com/watch?v=Vl3j-6m0-74"
};

/**
 * Busca un videotutorial de YouTube relacionado con un trofeo específico de un juego
 * @param {string} gameName Nombre del juego
 * @param {string} trophyName Nombre del trofeo
 */
export async function searchTrophyVideo(gameName, trophyName) {
  // 1. Verificar si tenemos un video mock predefinido para este trofeo
  if (MOCK_VIDEOS[trophyName]) {
    const videoUrl = MOCK_VIDEOS[trophyName];
    const videoId = extractVideoId(videoUrl);
    return {
      title: `Guía del trofeo: ${trophyName}`,
      videoId: videoId,
      url: videoUrl,
      source: "mock"
    };
  }

  const query = `${gameName} trofeo ${trophyName} guia`;
  console.log(`[YouTube Search] Buscando: "${query}"`);

  // 2. Si está configurada la API Key de YouTube, la usamos por estabilidad
  if (process.env.YOUTUBE_API_KEY) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
          query
        )}&type=video&maxResults=1&key=${process.env.YOUTUBE_API_KEY}`
      );
      const data = await response.json();
      const item = data.items?.[0];
      if (item && item.id?.videoId) {
        return {
          title: item.snippet.title,
          videoId: item.id.videoId,
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          source: "official_api"
        };
      }
    } catch (e) {
      console.error("Error consultando la API oficial de YouTube, usando fallback:", e);
    }
  }

  // 3. Fallback al scraper youtube-search-api
  try {
    const results = await youtubeSearch.GetListByKeyword(query, false, 1);
    const firstResult = results?.items?.[0];
    
    if (firstResult && firstResult.id) {
      return {
        title: firstResult.title,
        videoId: firstResult.id,
        url: `https://www.youtube.com/watch?v=${firstResult.id}`,
        source: "scraper_api"
      };
    }
  } catch (error) {
    console.error("Error buscando video mediante scraper:", error);
  }

  // 4. Si todo falla, construimos un enlace genérico de búsqueda
  return {
    title: `Buscar "${trophyName}" en YouTube`,
    videoId: null,
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    source: "generic_link"
  };
}

/**
 * Función auxiliar para extraer el ID de video de una URL de YouTube
 */
function extractVideoId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}
