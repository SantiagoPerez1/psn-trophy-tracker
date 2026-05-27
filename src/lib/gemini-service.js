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

/**
 * Asistente de chat interactivo para trofeos
 */
export async function askTrophyAssistant(gameName, trophyName, trophyDetail, userMessage, history = []) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenerativeAI(apiKey);
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

      const conversationHistory = history.map(msg => 
        `${msg.sender === "user" ? "Usuario" : "Asistente"}: ${msg.text}`
      ).join("\n");

      const prompt = `
Eres un asistente de ayuda de juego de PlayStation (como la función "Game Help" de PS5) inteligente, útil y experto. Estás chateando con un usuario que intenta obtener el siguiente trofeo:

JUEGO: ${gameName}
TROFEO: ${trophyName}
DESCRIPCIÓN OFICIAL: ${trophyDetail}

Historial de la conversación actual:
${conversationHistory}

Mensaje nuevo del usuario: "${userMessage}"

Instrucciones de respuesta:
1. Responde de forma concisa, directa y en español (máximo 4-5 frases por mensaje).
2. Da consejos específicos de jugabilidad, rutas, coleccionables o trucos según lo que pregunte el usuario.
3. Si el usuario pregunta por bugs o si el trofeo es perdible, indícale de forma directa.
4. Mantén un tono amigable, entusiasta y centrado en ayudar al gamer. No uses formatos largos ni introducciones innecesarias.
`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      if (text) {
        return {
          response: text,
          source: "gemini-ai"
        };
      }
    } catch (error) {
      console.error("Error en Asistente Gemini AI, usando fallback:", error);
    }
  }

  // Fallback local: Generar una respuesta dinámica basada en palabras clave de la pregunta del usuario
  const query = userMessage.toLowerCase();
  let responseText = "";

  if (query.includes("bug") || query.includes("glitch") || query.includes("error") || query.includes("trabado") || query.includes("traba")) {
    responseText = `Para el trofeo "${trophyName}" en ${gameName}, no hay reportes graves de bugs que bloqueen el trofeo de forma permanente. Si notas que no progresa, te aconsejamos reiniciar el juego, verificar si has cumplido todos los requisitos en la misma partida o reinstalar el juego/borrar caché si el problema persiste.`;
  } else if (query.includes("combate") || query.includes("pelea") || query.includes("matar") || query.includes("derrotar") || query.includes("morir") || query.includes("dificil") || query.includes("difícil")) {
    responseText = `Para superar esta sección de combate en ${gameName}: 
1. Revisa tu equipamiento: asegúrate de tener las habilidades pasivas de daño optimizadas.
2. Si el enemigo es un jefe, memoriza su animación de ataque pesado (suele brillar o hacer un sonido) para esquivar hacia los lados en lugar de hacia atrás.
3. Te aconsejamos bajar temporalmente la dificultad en los ajustes del juego si no bloquea el trofeo, para reducir la frustración.`;
  } else if (query.includes("perdible") || query.includes("perder") || query.includes("missable")) {
    responseText = `El trofeo "${trophyName}" podría ser perdible si avanzas más allá del punto de no retorno en la historia de ${gameName}. Te sugerimos hacer un guardado manual en una ranura diferente antes de la misión final para poder regresar a limpiar trofeos si es necesario, o revisar si el juego cuenta con selección de capítulos al finalizar.`;
  } else if (query.includes("coleccionable") || query.includes("donde") || query.includes("dónde") || query.includes("ubicacion") || query.includes("ubicación") || query.includes("encontrar")) {
    responseText = `Para encontrar este objeto o coleccionable:
1. Revisa detenidamente el videotutorial adjunto en la tarjeta, ya que muestra el camino exacto desde el punto de viaje rápido más cercano.
2. Activa cualquier modo de visión especial que tenga el juego (como visión de detective, escáner, etc.) que resalte objetos brillantes a través de las paredes.`;
  } else {
    responseText = `¡Hola! Como asistente de trofeos de ${gameName}, te aconsejo enfocar el trofeo "${trophyName}" haciendo lo siguiente: revisa la videoguía para ver el método exacto en acción, asegúrate de no estar jugando en cooperativo si el trofeo es solo offline, y haz un seguimiento de tu progreso en la barra superior. ¿Tienes alguna pregunta más específica sobre este trofeo?`;
  }

  return {
    response: responseText,
    source: "fallback"
  };
}

/**
 * Genera un Roadmap dinámico de obtención del Platino basado en trofeos pendientes
 */
export async function generateTrophyRoadmap(gameName, pendingTrophies) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenerativeAI(apiKey);
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

      const listText = pendingTrophies.map(t => `- [${t.trophyType.toUpperCase()}] ${t.trophyName}: ${t.trophyDetail} (${t.activityType})`).join("\n");

      const prompt = `
Eres un redactor experto de guías de trofeos de PlayStation. Genera una ruta o "Roadmap de Platino" dinámico y secuencial en español para conseguir los trofeos pendientes del juego "${gameName}".

Lista de trofeos pendientes actuales:
${listText}

Instrucciones:
1. Agrupa y estructura los trofeos pendientes en un plan de 3 o 4 pasos ordenados cronológica y lógicamente. Por ejemplo:
   - Paso 1: Trofeos de Historia / Campaña (los obligatorios).
   - Paso 2: Trofeos de Combate, Habilidad o Acumulativos.
   - Paso 3: Coleccionables y Exploración.
   - Paso 4: Limpieza final.
2. Para cada paso, proporciona un título atractivo (ej: "Paso 1: Completar la campaña principal"), una breve descripción táctica de lo que se debe hacer y una lista corta de los trofeos pendientes que se consiguen en ese paso.
3. Formatea la respuesta en un formato JSON estructurado para que el frontend pueda renderizarlo elegantemente. El JSON debe tener exactamente este formato:
{
  "steps": [
    {
      "stepNumber": 1,
      "title": "...",
      "description": "...",
      "trophies": ["Nombre del Trofeo 1", "Nombre del Trofeo 2"]
    }
  ]
}
No agregues comentarios ni rodeos de texto, responde únicamente con el objeto JSON válido.
`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      // Limpiar marcas markdown si Gemini las genera
      const cleanJsonText = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsedData = JSON.parse(cleanJsonText);
      if (parsedData && parsedData.steps) {
        return {
          roadmap: parsedData,
          source: "gemini-ai"
        };
      }
    } catch (error) {
      console.error("Error al generar roadmap con Gemini, usando fallback local:", error);
    }
  }

  // Fallback local robusto en JS: agrupar trofeos usando heuristics de activityType
  const steps = [];
  const historyTrophies = pendingTrophies.filter(t => t.activityType === "story");
  const combatTrophies = pendingTrophies.filter(t => t.activityType === "combat" || t.activityType === "progression");
  const collectTrophies = pendingTrophies.filter(t => t.activityType === "collectible");
  const otherTrophies = pendingTrophies.filter(t => t.activityType === "online" || t.activityType === "other");

  let currentStep = 1;

  if (historyTrophies.length > 0) {
    steps.push({
      stepNumber: currentStep++,
      title: "Fase 1: Misiones de Historia y Campaña",
      description: "Enfócate en completar las misiones principales del juego. Estos trofeos se desbloquearán de forma natural a medida que avances y disfrutes de la narrativa.",
      trophies: historyTrophies.map(t => t.trophyName)
    });
  }

  if (combatTrophies.length > 0) {
    steps.push({
      stepNumber: currentStep++,
      title: "Fase 2: Retos de Combate, Habilidades y Progreso",
      description: "Dedícate a subir de nivel a tu personaje, comprar mejoras y realizar desafíos de combate específicos (por ejemplo, derrotar jefes opcionales o conseguir cierto número de bajas con un arma).",
      trophies: combatTrophies.map(t => t.trophyName)
    });
  }

  if (collectTrophies.length > 0) {
    steps.push({
      stepNumber: currentStep++,
      title: "Fase 3: Búsqueda de Coleccionables y Secretos",
      description: "Utiliza las videoguías interactivas para localizar todos los cofres, registros, cofres cerrados u objetos ocultos por el mapa. Se aconseja hacerlo tras completar la historia cuando tienes libre exploración.",
      trophies: collectTrophies.map(t => t.trophyName)
    });
  }

  if (otherTrophies.length > 0 || steps.length === 0) {
    steps.push({
      stepNumber: currentStep++,
      title: "Fase Final: Multijugador y Limpieza General",
      description: "Completa los desafíos cooperativos/online pendientes y limpia cualquier trofeo misceláneo que se te haya escapado en las fases anteriores para desbloquear finalmente el trofeo de Platino.",
      trophies: otherTrophies.length > 0 ? otherTrophies.map(t => t.trophyName) : pendingTrophies.map(t => t.trophyName)
    });
  }

  return {
    roadmap: { steps },
    source: "fallback"
  };
}
