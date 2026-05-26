const {
  exchangeNpssoForCode,
  exchangeCodeForAccessToken,
  makeUniversalSearch
} = require("psn-api");

async function test() {
  const npsso = "uOyieZJGMxgJs40vdngVVpqcYrQCHaC0Ym11KD715HBInqXATnNyYPDTAGMecBeQ";
  const targetUser = "SantiagoPerez1";
  
  try {
    const accessCode = await exchangeNpssoForCode(npsso);
    const auth = await exchangeCodeForAccessToken(accessCode);
    console.log("Conectado con éxito.");
    
    console.log(`Buscando usuario: "${targetUser}"...`);
    const searchResponse = await makeUniversalSearch(auth, targetUser, "SocialAllAccounts");
    console.log("Respuesta completa de PlayStation:", JSON.stringify(searchResponse, null, 2));
    
    const results = searchResponse.results;
    if (!results || results.length === 0) {
      console.log("❌ RESULTADOS VACÍOS: PlayStation no devolvió ningún usuario.");
      return;
    }
    
    console.log(`Encontrados ${results.length} resultados:`);
    results.forEach((r, idx) => {
      console.log(`${idx + 1}. OnlineID: "${r.socialMetadata.onlineId}" | AccountID: ${r.socialMetadata.accountId}`);
    });
  } catch (error) {
    console.error("ERROR:", error);
  }
}

test();
