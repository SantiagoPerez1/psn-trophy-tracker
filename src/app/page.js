"use client";

import { useState } from "react";

export default function Home() {
  const [usernameInput, setUsernameInput] = useState("");
  const [activeUsername, setActiveUsername] = useState("");
  const [isSimulation, setIsSimulation] = useState(true);
  const [isLoadingGames, setIsLoadingGames] = useState(false);
  const [isLoadingTrophies, setIsLoadingTrophies] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [error, setError] = useState("");
  
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [trophies, setTrophies] = useState([]);
  const [selectedTrophy, setSelectedTrophy] = useState(null);
  const [currentVideo, setCurrentVideo] = useState(null);
  
  // Estado para la ordenación de juegos
  const [sortBy, setSortBy] = useState("progress-desc");

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!usernameInput.trim()) return;

    setIsLoadingGames(true);
    setError("");
    setSelectedGame(null);
    setTrophies([]);
    setSelectedTrophy(null);
    setCurrentVideo(null);
    
    try {
      const res = await fetch(`/api/games?username=${encodeURIComponent(usernameInput.trim())}`);
      const data = await res.json();
      
      if (res.ok) {
        setGames(data.games || []);
        setIsSimulation(data.isSimulation);
        setActiveUsername(usernameInput.trim());
      } else {
        setError(data.error || "Ocurrió un error al buscar los juegos.");
      }
    } catch (err) {
      console.error(err);
      setError("No se pudo conectar con el servidor. Inténtalo de nuevo.");
    } finally {
      setIsLoadingGames(false);
    }
  };

  const handleSelectGame = async (game) => {
    setSelectedGame(game);
    setIsLoadingTrophies(true);
    setSelectedTrophy(null);
    setCurrentVideo(null);
    setError("");

    // Auto-scroll suave a la sección de trofeos para una mejor experiencia de usuario (UX)
    setTimeout(() => {
      const element = document.getElementById("trophies-section");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 200);

    try {
      const res = await fetch(
        `/api/trophies?username=${encodeURIComponent(activeUsername)}&gameId=${game.npCommunicationId}`
      );
      const data = await res.json();

      if (res.ok) {
        setTrophies(data.trophies || []);
        // Seleccionar automáticamente el primer trofeo si hay
        if (data.trophies && data.trophies.length > 0) {
          handleSelectTrophy(data.trophies[0], game);
        }
      } else {
        setError(data.error || "Error al cargar los trofeos del juego.");
      }
    } catch (err) {
      console.error(err);
      setError("Error al conectar con la API de trofeos.");
    } finally {
      setIsLoadingTrophies(false);
    }
  };

  const handleSelectTrophy = async (trophy, gameContext = selectedGame) => {
    setSelectedTrophy(trophy);
    setIsLoadingVideo(true);
    setCurrentVideo(null);

    const game = gameContext || selectedGame;
    if (!game) return;

    try {
      const res = await fetch(
        `/api/video?gameName=${encodeURIComponent(game.titleName)}&trophyName=${encodeURIComponent(trophy.trophyName)}`
      );
      const data = await res.json();

      if (res.ok) {
        setCurrentVideo(data.video);
      } else {
        setCurrentVideo({
          title: `Buscar "${trophy.trophyName}" en YouTube`,
          videoId: null,
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(
            game.titleName + " " + trophy.trophyName + " guia trofeo"
          )}`,
          source: "error_fallback"
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingVideo(false);
    }
  };

  // SVGs incrustados para evitar dependencias extras de iconos
  const TrophyIcon = ({ type }) => {
    const colorMap = {
      bronze: "#cd7f32",
      silver: "#a1a1aa",
      gold: "#fbbf24",
      platinum: "#a855f7"
    };
    
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C7.58 2 4 5.58 4 10C4 13.91 6.8 17.17 10.5 17.84V20.5H8.5C7.95 20.5 7.5 20.95 7.5 21.5C7.5 22.05 7.95 22.5 8.5 22.5H15.5C16.05 22.5 16.5 22.05 16.5 21.5C16.5 20.95 16.05 20.5 15.5 20.5H13.5V17.84C17.2 17.17 20 13.91 20 10C20 5.58 16.42 2 12 2ZM6 10C6 6.97 8.28 4.46 11.25 4.07V15.93C7.29 15.48 6 12.87 6 10ZM18 10C18 12.87 16.71 15.48 12.75 15.93V4.07C15.72 4.46 18 6.97 18 10Z" fill={colorMap[type] || "#ffffff"}/>
      </svg>
    );
  };

  // Ordenar la lista de juegos antes de renderizarla
  const sortedGames = [...games].sort((a, b) => {
    if (sortBy === "progress-desc") return b.progress - a.progress;
    if (sortBy === "progress-asc") return a.progress - b.progress;
    if (sortBy === "name-asc") return a.titleName.localeCompare(b.titleName);
    return 0;
  });

  return (
    <div className="app-container">
      {/* Cabecera */}
      <header className="header animate-fade-in">
        <div className="logo-section">
          <div className="logo-icon">PS</div>
          <h1 className="logo-text">Trophy<span>Tracker</span></h1>
        </div>
        
        {activeUsername && (
          <div className={`status-badge ${isSimulation ? "simulation" : ""}`}>
            <span className="dot"></span>
            {isSimulation ? "Modo Demostración (Simulado)" : "PSN Conexión Activa"}
          </div>
        )}
      </header>

      {/* Buscador */}
      <section className="search-container animate-fade-in delay-1">
        <h2 className="search-title">Encuentra tus Trofeos Pendientes</h2>
        <p className="search-subtitle">
          Ingresa tu PSN ID para escanear tus juegos y ver guías personalizadas de YouTube para conseguir el Platino.
        </p>
        
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-wrapper">
            <span className="search-icon-inside">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </span>
            <input
              type="text"
              className="search-input"
              placeholder="Ej. San16_uru"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              disabled={isLoadingGames}
            />
          </div>
          <button type="submit" className="search-btn" disabled={isLoadingGames}>
            {isLoadingGames ? "Buscando..." : "Escanear"}
          </button>
        </form>
      </section>

      {/* Mensaje de Error */}
      {error && (
        <div className="error-banner animate-fade-in">
          <span className="icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Spinner de Carga de Juegos */}
      {isLoadingGames && (
        <div className="loader-wrapper animate-fade-in">
          <div className="ps-spinner"></div>
          <p className="loader-text">Conectando con la red de PlayStation y leyendo datos...</p>
        </div>
      )}

      {/* Resultados de Juegos */}
      {!isLoadingGames && games.length > 0 && (
        <div className="animate-fade-in delay-2">
          {/* Header con controles de ordenación */}
          <div className="games-controls-header">
            <h2 className="section-title">Juegos Recientes de {activeUsername}</h2>
            <div className="sort-container">
              <label htmlFor="sort-select">Ordenar por:</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="progress-desc">Progreso (Mayor a Menor)</option>
                <option value="progress-asc">Progreso (Menor a Mayor)</option>
                <option value="name-asc">Nombre (A-Z)</option>
              </select>
            </div>
          </div>
          
          <div className="games-grid">
            {sortedGames.map((game) => (
              <div
                key={game.npCommunicationId}
                className={`game-card ${selectedGame?.npCommunicationId === game.npCommunicationId ? "selected" : ""}`}
                onClick={() => handleSelectGame(game)}
              >
                <div className="game-image-container">
                  <img
                    src={game.conceptIconUrl}
                    alt={game.titleName}
                    className="game-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&q=80";
                    }}
                  />
                </div>
                <div className="game-info">
                  <span className="game-platform">{game.platform}</span>
                  <h3 className="game-title">{game.titleName}</h3>
                  
                  <div className="progress-section">
                    <div className="progress-header">
                      <span>Progreso Trofeos</span>
                      <span className="progress-percentage">{game.progress}%</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${game.progress}%` }}
                      ></div>
                    </div>
                    
                    <div className="trophies-summary">
                      <span className="trophy-mini-item platinum">
                        🏆 {game.earnedTrophies.platinum}/{game.definedTrophies.platinum}
                      </span>
                      <span className="trophy-mini-item gold">
                        🟡 {game.earnedTrophies.gold}/{game.definedTrophies.gold}
                      </span>
                      <span className="trophy-mini-item silver">
                        ⚪ {game.earnedTrophies.silver}/{game.definedTrophies.silver}
                      </span>
                      <span className="trophy-mini-item bronze">
                        🟤 {game.earnedTrophies.bronze}/{game.definedTrophies.bronze}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detalle del Juego Seleccionado (Trofeos Pendientes + Guía de YouTube) */}
      {!isLoadingGames && selectedGame && (
        <div id="trophies-section" className="animate-fade-in delay-3" style={{ scrollMarginTop: "2rem", paddingTop: "1rem" }}>
          <h2 className="section-title">Trofeos Pendientes de &quot;{selectedGame.titleName}&quot;</h2>
          
          {isLoadingTrophies ? (
            <div className="loader-wrapper">
              <div className="ps-spinner"></div>
              <p className="loader-text">Obteniendo la lista de trofeos bloqueados...</p>
            </div>
          ) : trophies.length === 0 ? (
            <div className="empty-placeholder">
              <span className="empty-icon">🎉</span>
              <p className="empty-text">¡Felicidades!</p>
              <p className="empty-subtext">Has conseguido el 100% de los trofeos de este juego o no se encontraron trofeos pendientes.</p>
            </div>
          ) : (
            <div className="detail-layout">
              {/* Columna Izquierda: Lista de Trofeos */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {trophies.map((trophy) => (
                  <div
                    key={trophy.trophyId}
                    className={`trophy-card ${selectedTrophy?.trophyId === trophy.trophyId ? "active" : ""}`}
                    onClick={() => handleSelectTrophy(trophy)}
                  >
                    <div className="trophy-icon-wrapper">
                      <img
                        src={trophy.trophyIconUrl}
                        alt="Trophy Icon"
                        className="trophy-badge-icon"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://images.unsplash.com/photo-1595303526913-c7037797ebe7?w=150&q=80";
                        }}
                      />
                      <div className={`trophy-type-indicator ${trophy.trophyType}`}></div>
                    </div>
                    
                    <div className="trophy-details">
                      <div className="trophy-name-row">
                        <span className="trophy-name">{trophy.trophyName}</span>
                        <span className={`trophy-tag ${trophy.trophyType}`}>
                          {trophy.trophyType}
                        </span>
                      </div>
                      <p className="trophy-desc">{trophy.trophyDetail}</p>
                    </div>

                    <div className="trophy-arrow">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </div>
                  </div>
                ))}
              </div>

              {/* Columna Derecha: Videotutorial (Sticky) */}
              <div className="video-section">
                {selectedTrophy && (
                  <div className="video-card animate-fade-in">
                    <div className="video-header">
                      <div className="status-badge" style={{ alignSelf: "flex-start", marginBottom: "0.5rem", background: "rgba(255, 0, 0, 0.1)", border: "1px solid rgba(255, 0, 0, 0.2)", color: "#ff4444" }}>
                        <span className="dot" style={{ backgroundColor: "#ff0000" }}></span>
                        Guía de YouTube
                      </div>
                      <h3 className="video-title-main">
                        Tutorial para: &quot;{selectedTrophy.trophyName}&quot;
                      </h3>
                      <p className="video-subtitle">Juego: {selectedGame.titleName}</p>
                    </div>

                    <div className="video-body">
                      {isLoadingVideo ? (
                        <div className="loader-wrapper" style={{ padding: "2rem 0" }}>
                          <div className="ps-spinner"></div>
                          <p className="loader-text" style={{ fontSize: "0.9rem" }}>Buscando tutorial en YouTube...</p>
                        </div>
                      ) : currentVideo ? (
                        <>
                          {currentVideo.videoId ? (
                            <>
                              <div className="video-container">
                                <iframe
                                  src={`https://www.youtube.com/embed/${currentVideo.videoId}`}
                                  title={currentVideo.title}
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                ></iframe>
                              </div>
                              <p className="video-desc">
                                <strong>Video encontrado:</strong> {currentVideo.title}
                              </p>
                            </>
                          ) : (
                            <div className="empty-placeholder" style={{ padding: "2.5rem 1.5rem", marginBottom: "1.5rem", background: "rgba(255, 0, 0, 0.03)", border: "1px solid rgba(255, 0, 0, 0.08)" }}>
                              <span style={{ fontSize: "2.5rem", marginBottom: "0.75rem", display: "block" }}>📺</span>
                              <p className="empty-text" style={{ fontSize: "1rem", fontWeight: "700", marginBottom: "0.25rem" }}>Videoguía externa disponible</p>
                              <p className="empty-subtext" style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.5rem", maxWidth: "none" }}>
                                Por directivas de seguridad de YouTube, la videoguía no se puede reproducir directamente dentro de la web en producción, pero está lista para ver en su plataforma.
                              </p>
                            </div>
                          )}

                          <div className="video-button-row">
                            <a
                              href={currentVideo.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="video-btn-link"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: "4px" }}><path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.002 3.002 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                              {currentVideo.videoId ? "Ver en YouTube" : "Buscar guía en YouTube"}
                            </a>
                          </div>
                        </>
                      ) : (
                        <p className="loader-text">Selecciona un trofeo para cargar su guía.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Página Inicial Vacía (Antes de buscar) */}
      {!isLoadingGames && games.length === 0 && (
        <section className="empty-placeholder animate-fade-in delay-2" style={{ padding: "6rem 2rem" }}>
          <div className="empty-icon" style={{ fontSize: "4rem", animation: "float 6s ease-in-out infinite" }}>🎮</div>
          <h3 className="empty-text" style={{ fontSize: "1.3rem" }}>Ningún usuario escaneado</h3>
          <p className="empty-subtext" style={{ maxWidth: "450px" }}>
            Introduce tu PSN ID arriba. Si no posees una cuenta o el bot está apagado, la aplicación te proveerá de un perfil ficticio de demostración automáticamente para probar todas las funciones.
          </p>
        </section>
      )}
    </div>
  );
}
