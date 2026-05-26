import { GoogleGenAI } from "@google/generative-ai";

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
      const ai = new GoogleGenAI({ apiKey });
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

  // Fallback local: si no hay API Key o falla, generamos consejos semi-estáticos útiles
  let fallbackGuide = `**Pasos para conseguir "${trophyName}":**\n\n`;
  fallbackGuide += `1. **Entiende el objetivo:** La descripción oficial indica: *"${trophyDetail}"*.\n`;
  
  if (videoDesc) {
    // Si tenemos la descripción del video de YouTube, intentamos extraer los primeros 250 caracteres como resumen
    const cleanDesc = videoDesc
      .replace(/(http|https):\/\/[^\s]+/g, "") // Limpiar enlaces
      .replace(/[\n\r]+/g, " ") // Quitar saltos de línea
      .trim();
    
    if (cleanDesc.length > 50) {
      fallbackGuide += `2. **Resumen de la Videoguía:** ${cleanDesc.slice(0, 300)}...\n\n`;
    } else {
      fallbackGuide += `2. **Consulta la videoguía:** Sigue el video tutorial adjunto para ver la ruta exacta o el método de combate adecuado.\n\n`;
    }
  } else {
    fallbackGuide += `2. **Consulta la videoguía:** Sigue el video tutorial adjunto para ver la ruta exacta o el método de combate adecuado.\n\n`;
  }

  fallbackGuide += `💡 **Consejos Generales:**\n`;
  fallbackGuide += `* Revisa si el trofeo es acumulable o requiere completar alguna misión secundaria específica en ${gameName}.\n`;
  fallbackGuide += `* Para trofeos de coleccionables o combates contra jefes, se recomienda pausar el video en los momentos clave para imitar la estrategia exacta.`;

  return {
    guide: fallbackGuide,
    source: "fallback"
  };
}
