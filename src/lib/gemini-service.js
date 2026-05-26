import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Genera una guía/resumen sobre cómo conseguir un trofeo específico
 * @param {string} gameName Nombre del juego
 * @param {string} trophyName Nombre del trofeo
 * @param {string} trophyDetail Detalles oficiales del trofeo
 * @param {string} videoDesc Descripción del video de YouTube (opcional)
 */
export async function generateTrophyGuide(gameName, trophyName, trophyDetail, videoDesc = "") {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      // Inicializar el SDK de Gemini
      const ai = new GoogleGenerativeAI(apiKey);
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
Eres un experto cazador de trofeos de PlayStation. Genera una guía ultra corta y directa en español sobre cómo obtener el siguiente trofeo:

JUEGO: ${gameName}
TROFEO: ${trophyName}
DESCRIPCIÓN OFICIAL: ${trophyDetail}
${videoDesc ? `DATOS EXTRAÍDOS DEL VIDEO: ${videoDesc.slice(0, 500)}` : ""}

Instrucciones:
1. Explica brevemente qué se debe hacer para conseguir el trofeo de forma clara y directa (máximo 3 frases).
2. Agrega 2 o 3 consejos clave o advertencias rápidas (ej. si es perdible, qué dificultad requiere, o algún truco rápido) en viñetas.
3. Usa un tono amigable, directo y profesional. Evita rodeos o introducciones largas.
`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      if (text) {
        return {
          guide: text,
          source: "gemini-ai"
        };
      }
    } catch (error) {
      console.error("Error al generar guía con Gemini AI, usando fallback:", error);
    }
  }

  // Fallback local mejorado: si no hay API Key o falla, analizamos semánticamente el trofeo para dar guías útiles
  const nameLower = trophyName.toLowerCase();
  const detailLower = trophyDetail.toLowerCase();
  
  let categoryAdvice = "";
  
  if (
    detailLower.includes("defeat") || detailLower.includes("kill") || detailLower.includes("derrota") || 
    detailLower.includes("vence") || detailLower.includes("boss") || detailLower.includes("jefe") || 
    detailLower.includes("slay") || nameLower.includes("defeat") || nameLower.includes("slayer")
  ) {
    categoryAdvice = "Este trofeo requiere derrotar a un enemigo o jefe específico en combate. Te recomendamos estudiar sus patrones de ataque en el videotutorial y equipar la combinación de armas, curas o habilidades aconsejadas para contrarrestar sus mecánicas.";
  } else if (
    detailLower.includes("collect") || detailLower.includes("find") || detailLower.includes("gather") || 
    detailLower.includes("reliquia") || detailLower.includes("coleccionable") || detailLower.includes("find all") || 
    detailLower.includes("unlock all") || detailLower.includes("consigue todos") || detailLower.includes("encuentra") ||
    detailLower.includes("lockbox") || detailLower.includes("caja")
  ) {
    categoryAdvice = "Este es un trofeo de coleccionables o exploración. Te aconsejamos seguir el videotutorial paso a paso y en el mismo orden del video para no pasar por alto ningún objeto, ya que algunos coleccionables pueden ser perdibles o requerir acceso a zonas avanzadas del juego.";
  } else if (
    detailLower.includes("complete the story") || detailLower.includes("complete mission") || 
    detailLower.includes("completar la historia") || detailLower.includes("completa el capítulo") || 
    detailLower.includes("chapter") || detailLower.includes("story trophy") || detailLower.includes("misión principal") ||
    detailLower.includes("story quest")
  ) {
    categoryAdvice = "Este trofeo está ligado al progreso obligatorio de la historia o misiones principales. Se desbloqueará automáticamente a medida que completes las misiones del juego. Si tienes problemas en resolver algún acertijo o ruta del nivel, consulta la sección clave del video.";
  } else if (
    detailLower.includes("reach level") || detailLower.includes("nivel") || detailLower.includes("max level") || 
    detailLower.includes("upgrade") || detailLower.includes("mejora") || detailLower.includes("max out") ||
    detailLower.includes("equip") || detailLower.includes("level up")
  ) {
    categoryAdvice = "Este trofeo requiere subir de nivel a tu personaje, armas o habilidades. Te aconsejamos buscar guías de farmeo de experiencia o materiales recomendados en YouTube para acelerar el proceso de subida y ahorrar horas de juego.";
  } else if (
    /\b\d+\b/.test(detailLower) || detailLower.includes("times") || detailLower.includes("veces") || 
    detailLower.includes("cumulative") || detailLower.includes("acumula") || detailLower.includes("total")
  ) {
    categoryAdvice = "Este es un trofeo acumulativo (requiere realizar una acción específica un número determinado de veces). Te recomendamos hacer un seguimiento del contador en la barra de progreso de la app (para juegos de PS5 que lo soporten) o en la sección de estadísticas o desafíos internos en el menú del juego.";
  } else {
    categoryAdvice = `Para conseguir este trofeo, debes completar el objetivo oficial: *"${trophyDetail || "Ver detalles oficiales del trofeo."}"*. Te aconsejamos ver el video adjunto para replicar la ruta, mecánicas o el método de juego ilustrado por la guía.`;
  }

  let fallbackGuide = `**Guía rápida para "${trophyName}":**\n\n`;
  fallbackGuide += `1. **Objetivo oficial:** ${trophyDetail || "Ver descripción en la tarjeta."}\n`;
  fallbackGuide += `2. **Estrategia recomendada:** ${categoryAdvice}\n\n`;
  
  if (videoDesc) {
    const cleanDesc = videoDesc
      .replace(/(http|https):\/\/[^\s]+/g, "") // Limpiar enlaces
      .replace(/[\n\r]+/g, " ") // Quitar saltos de línea
      .trim();
    
    if (cleanDesc.length > 50) {
      fallbackGuide += `💡 **Detalles del tutorial:** ${cleanDesc.slice(0, 260)}...\n`;
    }
  }

  return {
    guide: fallbackGuide,
    source: "fallback"
  };
}
