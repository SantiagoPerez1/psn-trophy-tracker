const {
  exchangeNpssoForCode,
  exchangeCodeForAccessToken,
  makeUniversalSearch,
  getUserTitles
} = require("psn-api");

async function test() {
  const npsso = "uOyieZJGMxgJs40vdngVVpqcYrQCHaC0Ym11KD715HBInqXATnNyYPDTAGMecBeQ";
  const targetUser = "SantiagoPerez1"; // Probemos con tu ID de PSN o el que busques
  
  console.log("1. Autenticando...");
  try {
    const accessCode = await exchangeNpssoForCode(npsso);
    const auth = await exchangeCodeForAccessToken(accessCode);
    console.log("   Autenticación exitosa.");
    
    console.log(`2. Buscando usuario: "${targetUser}"...`);
    const searchResponse = await makeUniversalSearch(auth, targetUser, "SocialAllAccounts");
    console.log("   Resultados de búsqueda obtenidos.");
    
    const results = searchResponse.results;
    if (!results || results.length === 0) {
      console.log("   --> RESULTADOS VACÍOS: El usuario no fue encontrado.");
      return;
    }
    
    const firstResult = results[0];
    console.log("   Primer usuario encontrado:", firstResult.socialMetadata.onlineId);
    const accountId = firstResult.socialMetadata.accountId;
    console.log("   AccountId:", accountId);
    
    console.log(`3. Solicitando títulos (juegos) de AccountId: ${accountId}...`);
    try {
      const titlesResponse = await getUserTitles(auth, accountId);
      console.log("   Respuesta de títulos recibida con éxito.");
      console.log("   Cantidad de títulos:", titlesResponse.trophyTitles ? titlesResponse.trophyTitles.length : 0);
      if (titlesResponse.trophyTitles && titlesResponse.trophyTitles.length > 0) {
        console.log("   Ejemplo de juego:", titlesResponse.trophyTitles[0].trophyTitleName);
      } else {
        console.log("   La respuesta no contiene juegos (vacío).");
      }
    } catch (titleError) {
      console.error("   ❌ ERROR AL OBTENER JUEGOS:");
      console.error(titleError);
    }
  } catch (error) {
    console.error("❌ ERROR GENERAL EN EL PROCESO:");
    console.error(error);
  }
}

test();
