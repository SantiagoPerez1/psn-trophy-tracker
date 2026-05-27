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
4. IMPORTANTE: NO uses formato de texto en negrita con asteriscos (como **texto**) en tu respuesta. Escribe en texto plano común sin decoraciones markdown.
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
    nameLower.includes("platinum") || nameLower.includes("platino") ||
    detailLower.includes("collect every") || detailLower.includes("all other trophies") ||
    detailLower.includes("obtain all trophies") || detailLower.includes("consigue todos los trofeos") ||
    detailLower.includes("conseguir todos los trofeos") || detailLower.includes("todos los demás trofeos") ||
    detailLower.includes("desbloquea todos los trofeos")
  ) {
    categoryAdvice = "¡Este es el trofeo de Platino del juego! Se desbloqueará de forma automática una vez que consigas todos los demás trofeos de la lista del juego base. ¡Felicitaciones por completar el juego!";
  } else if (
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
    categoryAdvice = `Para conseguir este trofeo, debes completar el objetivo oficial: "${trophyDetail || "Ver detalles oficiales del trofeo."}". Te aconsejamos ver el video adjunto para replicar la ruta, mecánicas o el método de juego ilustrado por la guía.`;
  }

  let fallbackGuide = `Guía rápida para "${trophyName}":\n\n`;
  fallbackGuide += `1. Objetivo oficial: ${trophyDetail || "Ver descripción en la tarjeta."}\n`;
  fallbackGuide += `2. Estrategia recomendada: ${categoryAdvice}\n\n`;
  
  if (videoDesc) {
    const cleanDesc = videoDesc
      .replace(/(http|https):\/\/[^\s]+/g, "") // Limpiar enlaces
      .replace(/[\n\r]+/g, " ") // Quitar saltos de línea
      .trim();
    
    if (cleanDesc.length > 50) {
      fallbackGuide += `💡 Detalles del tutorial: ${cleanDesc.slice(0, 260)}...\n`;
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
1. Agrupa y estructura los trofeos pendientes en un plan de 2 a 4 pasos ordenados de forma cronológica y lógica.
2. IMPORTANTE: Solo debes crear fases para las cuales existan trofeos pendientes reales en la lista provista. Por ejemplo, si no hay trofeos con etiqueta "(story)" o de historia en la lista, NO debes crear una "Fase 1: Historia / Campaña". Comienza directamente con los trofeos que sí quedan (ej: Combate, Coleccionables o Limpieza). Cada fase debe tener al menos un trofeo asignado de la lista provista.
3. Para cada paso, proporciona un título atractivo (ej. "Fase 1: Retos de Combate y Habilidades"), una breve descripción táctica de lo que se debe hacer y la lista de nombres de trofeos que pertenecen a ese paso.
4. Formatea la respuesta en un formato JSON estructurado para que el frontend pueda renderizarlo elegantemente. El JSON debe tener exactamente este formato:
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
    const stepNum = currentStep++;
    steps.push({
      stepNumber: stepNum,
      title: `Fase ${stepNum}: Misiones de Historia y Campaña`,
      description: "Enfócate en completar las misiones principales del juego. Estos trofeos se desbloquearán de forma natural a medida que avances y disfrutes de la narrativa.",
      trophies: historyTrophies.map(t => t.trophyName)
    });
  }

  if (combatTrophies.length > 0) {
    const stepNum = currentStep++;
    steps.push({
      stepNumber: stepNum,
      title: `Fase ${stepNum}: Retos de Combate, Habilidades y Progreso`,
      description: "Dedícate a subir de nivel a tu personaje, comprar mejoras y realizar desafíos de combate específicos (por ejemplo, derrotar jefes opcionales o conseguir cierto número de bajas con un arma).",
      trophies: combatTrophies.map(t => t.trophyName)
    });
  }

  if (collectTrophies.length > 0) {
    const stepNum = currentStep++;
    steps.push({
      stepNumber: stepNum,
      title: `Fase ${stepNum}: Búsqueda de Coleccionables y Secretos`,
      description: "Utiliza las videoguías interactivas para localizar todos los cofres, registros, cofres cerrados u objetos ocultos por el mapa. Se aconseja hacerlo tras completar la historia cuando tienes libre exploración.",
      trophies: collectTrophies.map(t => t.trophyName)
    });
  }

  if (otherTrophies.length > 0 || steps.length === 0) {
    const stepNum = currentStep++;
    steps.push({
      stepNumber: stepNum,
      title: `Fase ${stepNum}: Multijugador y Limpieza General`,
      description: "Completa los desafíos cooperativos/online pendientes y limpia cualquier trofeo misceláneo que se te haya escapado en las fases anteriores para desbloquear finalmente el trofeo de Platino.",
      trophies: otherTrophies.length > 0 ? otherTrophies.map(t => t.trophyName) : pendingTrophies.map(t => t.trophyName)
    });
  }

  return {
    roadmap: { steps },
    source: "fallback"
  };
}

/**
 * Obtiene la ficha técnica del platino (dificultad, tiempo, partidas), el estado de servidores y clasifica trofeos problemáticos (perdibles o con bugs)
 */
export async function fetchGameTechnicalDetails(gameName, trophiesList = []) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenerativeAI(apiKey);
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

      const listText = trophiesList.map(t => `- [${t.trophyId}] ${t.trophyName}: ${t.trophyDetail}`).join("\n");

      const prompt = `
Eres un analista experto de guías de trofeos de PlayStation. Proporciona la ficha técnica y de servidores para el juego "${gameName}" y analiza cuáles de los siguientes trofeos pendientes son problemáticos (perdibles o con bugs).

Lista de trofeos:
${listText}

Instrucciones:
1. Determina el nivel de dificultad oficial/comunidad para conseguir el platino en una escala del 1 al 10 (ej. 4) y escribe una breve etiqueta de dificultad (ej. "Moderado").
2. Estima el tiempo promedio en horas requerido para conseguir el platino (ej. "35-50 horas").
3. Especifica el número mínimo de partidas requeridas (ej. "1 partida + limpieza").
4. Analiza si el juego cuenta con servidores multijugador online activos, cerrados, o si no tiene multijugador. Si los servidores necesarios para algún trofeo de la lista están CERRADOS y por ende el Platino es imposible, especifica en status "closed". Si están abiertos o no tiene multijugador, pon "open". Escribe una descripción breve (ej. "Operativo", "No requiere online", o "Servidores cerrados - Platino imposible").
5. De la lista de trofeos provista, identifica cuáles son "perdibles" (missable - que no se pueden conseguir al avanzar la historia y requieren otra partida) o "glitchados" (buggy - que a veces no saltan debido a fallos). Para cada trofeo problemático identificado, proporciona su trophyId (número), el tipo ("missable" o "glitched") y una razón ultra breve de 1 frase del por qué.
6. Responde ÚNICAMENTE con un objeto JSON válido con la siguiente estructura, sin comentarios markdown ni introducciones:
{
  "difficulty": {
    "rating": 5,
    "label": "Moderada"
  },
  "estimatedHours": "40-50 horas",
  "minPlaythroughs": "1 partida + limpieza",
  "servers": {
    "status": "open",
    "description": "Operativo / Sin trofeos online"
  },
  "alerts": [
    {
      "trophyId": 2,
      "type": "missable",
      "reason": "Se pierde si no recoges el coleccionable antes de derrotar al jefe del Capítulo 4."
    }
  ]
}
`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      const cleanJsonText = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsedData = JSON.parse(cleanJsonText);
      if (parsedData) {
        return {
          details: parsedData,
          source: "gemini-ai"
        };
      }
    } catch (error) {
      console.error("Error al obtener detalles técnicos del juego con Gemini, usando fallback:", error);
    }
  }

  // Fallback local en JS
  // Analizar palabras clave para estimar localmente
  const alerts = [];
  trophiesList.forEach(t => {
    const nameLower = t.trophyName.toLowerCase();
    const detailLower = t.trophyDetail.toLowerCase();
    
    if (
      detailLower.includes("perdible") || detailLower.includes("perder") || 
      detailLower.includes("missable") || detailLower.includes("checkpoint") ||
      nameLower.includes("perdible") || nameLower.includes("perder")
    ) {
      alerts.push({
        trophyId: t.trophyId,
        type: "missable",
        reason: "Este trofeo puede perderse si avanzas en la historia sin cumplir el objetivo secundario."
      });
    } else if (
      detailLower.includes("bug") || detailLower.includes("glitch") || 
      detailLower.includes("error") || detailLower.includes("fallo") ||
      nameLower.includes("bug") || nameLower.includes("glitch")
    ) {
      alerts.push({
        trophyId: t.trophyId,
        type: "glitched",
        reason: "Se han reportado fallos aleatorios en la obtención de este trofeo. Se aconseja guardar partida antes."
      });
    }
  });

  // Intentar dar datos lógicos según el nombre del juego
  const gameLower = gameName.toLowerCase();
  let rating = 4;
  let label = "Moderada";
  let hours = "30-40 horas";
  let playthroughs = "1 partida";
  let serverStatus = "open";
  let serverDesc = "Sin trofeos multijugador requeridos";

  if (gameLower.includes("elden") || gameLower.includes("souls") || gameLower.includes("sekiro") || gameLower.includes("bloodborne")) {
    rating = 7;
    label = "Difícil";
    hours = "60-80 horas";
    playthroughs = "1 partida (con respaldos) o 3 partidas";
  } else if (gameLower.includes("spider-man") || gameLower.includes("spiderman")) {
    rating = 3;
    label = "Fácil";
    hours = "25-30 horas";
    playthroughs = "1 partida + limpieza";
  } else if (gameLower.includes("god of war") || gameLower.includes("ragnarok")) {
    rating = 4;
    label = "Moderada";
    hours = "40-50 horas";
    playthroughs = "1 partida";
  } else if (gameLower.includes("dead island") || gameLower.includes("zombie")) {
    rating = 4;
    label = "Moderada";
    hours = "35-45 horas";
    playthroughs = "1 partida + cooperativo";
  }

  // Si hay algún trofeo con palabra "online" o "multijugador", indicar online operativo
  const hasOnline = trophiesList.some(t => {
    const txt = (t.trophyName + " " + t.trophyDetail).toLowerCase();
    return txt.includes("online") || txt.includes("multijugador") || txt.includes("cooperativo") || txt.includes("coop");
  });
  if (hasOnline) {
    serverDesc = "Servidores operativos / Requiere suscripción PS Plus";
  }

  return {
    details: {
      difficulty: { rating, label },
      estimatedHours: hours,
      minPlaythroughs: playthroughs,
      servers: {
        status: serverStatus,
        description: serverDesc
      },
      alerts
    },
    source: "fallback"
  };
}
