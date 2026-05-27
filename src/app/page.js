"use client";

import { useState, useEffect } from "react";

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
  
  // Nuevos estados para la guía de IA / Fallback
  const [trophyGuide, setTrophyGuide] = useState("");
  const [guideSource, setGuideSource] = useState("");
  
  // Estado para la ordenación de juegos
  const [sortBy, setSortBy] = useState("progress-desc");

  // Estado para filtrar solo trofeos del juego base (para el Platino)
  const [onlyBaseGame, setOnlyBaseGame] = useState(false);

  // Estado para el historial de búsquedas locales (en la PC del usuario)
  const [searchHistory, setSearchHistory] = useState([]);

  // Estados adicionales para características premium
  const [selectedActivityFilter, setSelectedActivityFilter] = useState("all");
  const [rightPanelTab, setRightPanelTab] = useState("guide"); // "guide" o "chat"
  
  // Asistente de IA (Chat)
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Roadmap del Platino
  const [roadmapData, setRoadmapData] = useState(null);
  const [isLoadingRoadmap, setIsLoadingRoadmap] = useState(false);
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);

  // Modo Companion App
  const [isCompanionMode, setIsCompanionMode] = useState(false);

  // Cargar el historial desde localStorage al montar la página
  useEffect(() => {
    const savedHistory = localStorage.getItem("psn_trophy_tracker_history");
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Error al cargar el historial desde localStorage:", e);
      }
    }
  }, []);

  const saveToHistory = (username) => {
    const formattedUsername = username.trim();
    if (!formattedUsername) return;

    setSearchHistory((prev) => {
      // Filtrar el nombre si ya existía para moverlo al principio
      const filtered = prev.filter(
        (u) => u.toLowerCase() !== formattedUsername.toLowerCase()
      );
      const updated = [formattedUsername, ...filtered].slice(0, 5); // Limitar a las últimas 5 búsquedas
      localStorage.setItem("psn_trophy_tracker_history", JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearHistory = (e) => {
    e.stopPropagation();
    setSearchHistory([]);
    localStorage.removeItem("psn_trophy_tracker_history");
  };

  const triggerSearchForUser = async (username) => {
    setIsLoadingGames(true);
    setError("");
    setSelectedGame(null);
    setTrophies([]);
    setSelectedTrophy(null);
    setCurrentVideo(null);
    setTrophyGuide("");
    setGuideSource("");
    
    try {
      const res = await fetch(`/api/games?username=${encodeURIComponent(username.trim())}`);
      const data = await res.json();
      
      if (res.ok) {
        setGames(data.games || []);
        setIsSimulation(data.isSimulation);
        setActiveUsername(username.trim());
        saveToHistory(username.trim());
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

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (!usernameInput.trim()) return;
    triggerSearchForUser(usernameInput.trim());
  };

  const handleSelectGame = async (game) => {
    // Si hacemos clic en el juego ya seleccionado, lo colapsamos
    if (selectedGame?.npCommunicationId === game.npCommunicationId) {
      setSelectedGame(null);
      setTrophies([]);
      setSelectedTrophy(null);
      setCurrentVideo(null);
      setTrophyGuide("");
      setGuideSource("");
      return;
    }

    setSelectedGame(game);
    setIsLoadingTrophies(true);
    setSelectedTrophy(null);
    setCurrentVideo(null);
    setTrophyGuide("");
    setGuideSource("");
    setError("");

    // Auto-scroll suave hacia la tarjeta de juego que se va a expandir
    setTimeout(() => {
      const element = document.getElementById(`game-card-${game.npCommunicationId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 150);

    try {
      const res = await fetch(
        `/api/trophies?username=${encodeURIComponent(activeUsername)}&gameId=${game.npCommunicationId}&platform=${encodeURIComponent(game.platform)}`
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
    setTrophyGuide("");
    setGuideSource("");
    
    // Inicializar chat para este trofeo
    setChatHistory([
      {
        sender: "assistant",
        text: `¡Hola! Soy tu asistente de juego de PlayStation. ¿Cómo te puedo ayudar hoy con el trofeo "${trophy.trophyName}"?`
      }
    ]);
    setChatInput("");
    setRightPanelTab("guide");

    const game = gameContext || selectedGame;
    if (!game) return;

    try {
      const res = await fetch(
        `/api/video?gameName=${encodeURIComponent(game.titleName)}&trophyName=${encodeURIComponent(trophy.trophyName)}&trophyDetail=${encodeURIComponent(trophy.trophyDetail)}`
      );
      const data = await res.json();

      if (res.ok) {
        setCurrentVideo(data.video);
        setTrophyGuide(data.guide || "");
        setGuideSource(data.guideSource || "");
      } else {
        setCurrentVideo({
          title: `Buscar "${trophy.trophyName}" en YouTube`,
          videoId: null,
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(
            game.titleName + " " + trophy.trophyName + " guia trofeo"
          )}`,
          source: "error_fallback"
        });
        setTrophyGuide(`Consigue el trofeo consultando la guía oficial de PlayStation.`);
        setGuideSource("fallback");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingVideo(false);
    }
  };

  const handleSendChatMessage = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isSendingChat || !selectedTrophy || !selectedGame) return;

    const userMsgText = chatInput.trim();
    const newMsg = { sender: "user", text: userMsgText };
    const updatedHistory = [...chatHistory, newMsg];
    
    setChatHistory(updatedHistory);
    setChatInput("");
    setIsSendingChat(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameName: selectedGame.titleName,
          trophyName: selectedTrophy.trophyName,
          trophyDetail: selectedTrophy.trophyDetail || "",
          message: userMsgText,
          history: chatHistory.slice(1) // Omitir saludo inicial
        })
      });

      const data = await res.json();
      if (res.ok) {
        setChatHistory(prev => [...prev, { sender: "assistant", text: data.response }]);
      } else {
        setChatHistory(prev => [
          ...prev,
          { sender: "assistant", text: "Lo siento, tuve un problema al procesar tu pregunta. Por favor, intenta de nuevo." }
        ]);
      }
    } catch (err) {
      console.error("Error al enviar mensaje de chat:", err);
      setChatHistory(prev => [
        ...prev,
        { sender: "assistant", text: "No se pudo conectar con el asistente de IA. Inténtalo de nuevo." }
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    if (!selectedGame || trophies.length === 0) return;
    
    setIsLoadingRoadmap(true);
    setRoadmapData(null);
    setShowRoadmapModal(true);

    try {
      // Para el Platino SIEMPRE se consideran únicamente los trofeos del Juego Base (grupo "default" o sin grupo)
      const pending = trophies.filter(
        t => t.trophyGroupId === "default" || !t.trophyGroupId
      );

      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameName: selectedGame.titleName,
          pendingTrophies: pending
        })
      });

      const data = await res.json();
      if (res.ok) {
        setRoadmapData(data.roadmap);
      } else {
        console.error("Error al generar roadmap:", data.error);
      }
    } catch (err) {
      console.error("Error al generar roadmap:", err);
    } finally {
      setIsLoadingRoadmap(false);
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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C7.58 2 4 5.58 4 10C4 13.91 6.8 17.17 10.5 17.84V20.5H8.5C7.95 20.5 7.5 20.95 7.5 21.5C7.5 22.05 7.95 22.5 8.5 22.5H15.5C16.05 22.5 16.5 22.05 16.5 21.5C16.5 20.95 16.05 20.5 15.5 20.5H13.5V17.84C17.2 17.17 20 13.91 20 10C20 5.58 16.42 2 12 2ZM6 10C6 6.97 8.28 4.46 11.25 4.07V15.93C7.29 15.48 6 12.87 6 10ZM18 10C18 12.87 16.71 15.48 12.75 15.93V4.07C15.72 4.46 18 6.97 18 10Z" fill={colorMap[type] || "#ffffff"}/>
      </svg>
    );
  };

  // Mapeos de actividad e iconos
  const activityIcons = {
    story: "🎬",
    collectible: "🎒",
    combat: "⚔️",
    progression: "📈",
    online: "👥",
    other: "✨"
  };

  const activityLabels = {
    all: "Todos",
    story: "Historia",
    collectible: "Coleccionables",
    combat: "Combate",
    progression: "Progreso",
    online: "Online",
    other: "Otros"
  };

  // Filtrar los trofeos según el switch de juego base y según el filtro de actividad
  const filteredTrophies = trophies.filter(t => {
    // Filtro de juego base para el Platino
    if (onlyBaseGame && t.trophyGroupId !== "default" && t.trophyGroupId) {
      return false;
    }
    // Filtro de actividad
    if (selectedActivityFilter !== "all" && t.activityType !== selectedActivityFilter) {
      return false;
    }
    return true;
  });

  const displayedTrophies = filteredTrophies;

  // Agrupar los trofeos por su grupo (Juego Base y cada DLC)
  const groupedTrophies = displayedTrophies.reduce((groups, trophy) => {
    const groupName = trophy.trophyGroupName || (trophy.trophyGroupId === "default" ? "Juego Base" : "Expansión DLC");
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(trophy);
    return groups;
  }, {});

  // Calcular estadísticas acumuladas de cazador
  const hunterStats = (() => {
    if (games.length === 0) return null;

    let totalPlatinums = 0;
    let totalGold = 0;
    let totalSilver = 0;
    let totalBronze = 0;
    let totalEarned = 0;
    let totalDefined = 0;
    let averageProgress = 0;
    let totalPoints = 0;

    games.forEach(g => {
      totalPlatinums += g.earnedTrophies.platinum || 0;
      totalGold += g.earnedTrophies.gold || 0;
      totalSilver += g.earnedTrophies.silver || 0;
      totalBronze += g.earnedTrophies.bronze || 0;
      
      const earnedCount = (g.earnedTrophies.bronze || 0) + (g.earnedTrophies.silver || 0) + (g.earnedTrophies.gold || 0) + (g.earnedTrophies.platinum || 0);
      const definedCount = (g.definedTrophies.bronze || 0) + (g.definedTrophies.silver || 0) + (g.definedTrophies.gold || 0) + (g.definedTrophies.platinum || 0);
      
      totalEarned += earnedCount;
      totalDefined += definedCount;
      totalPoints += (g.earnedTrophies.bronze || 0) * 15 + (g.earnedTrophies.silver || 0) * 30 + (g.earnedTrophies.gold || 0) * 90 + (g.earnedTrophies.platinum || 0) * 180;
    });

    averageProgress = Math.round(games.reduce((sum, g) => sum + g.progress, 0) / games.length);
    const hunterLevel = Math.max(1, Math.floor(Math.sqrt(totalPoints) / 5.5));

    return {
      totalPlatinums,
      totalGold,
      totalSilver,
      totalBronze,
      totalEarned,
      totalDefined,
      averageProgress,
      hunterLevel,
      totalPoints
    };
  })();

  // Ordenar la lista de juegos antes de renderizarla
  const sortedGames = [...games].sort((a, b) => {
    if (sortBy === "progress-desc") return b.progress - a.progress;
    if (sortBy === "progress-asc") return a.progress - b.progress;
    if (sortBy === "name-asc") return a.titleName.localeCompare(b.titleName);
    return 0;
  });

  return (
    <div className={`app-container ${isCompanionMode ? "companion-mode-active" : ""}`}>
      {/* Cabecera - Oculta en modo Companion */}
      {!isCompanionMode && (
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
      )}

      {/* Buscador - Oculto en modo Companion */}
      {!isCompanionMode && (
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
                placeholder="Ej. Kratos_PSN"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                disabled={isLoadingGames}
              />
            </div>
            <button type="submit" className="search-btn" disabled={isLoadingGames}>
              {isLoadingGames ? "Buscando..." : "Escanear"}
            </button>
          </form>

          {/* Historial de búsquedas recientes (Solo PC / LocalStorage) */}
          {searchHistory.length > 0 && (
            <div className="search-history-container">
              <span className="history-label">Búsquedas recientes:</span>
              <div className="history-tags">
                {searchHistory.map((username) => (
                  <button
                    key={username}
                    className="history-tag-btn"
                    onClick={() => {
                      setUsernameInput(username);
                      triggerSearchForUser(username);
                    }}
                    disabled={isLoadingGames}
                  >
                    {username}
                  </button>
                ))}
                <button 
                  className="clear-history-btn" 
                  onClick={handleClearHistory}
                  disabled={isLoadingGames}
                >
                  Limpiar historial
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Resumen del Cazador (Hitos y Estadísticas del Perfil) - Oculto en modo Companion */}
      {!isCompanionMode && !isLoadingGames && hunterStats && (
        <section className="hunter-stats-section animate-fade-in delay-1">
          <div className="hunter-profile-card">
            <div className="hunter-avatar-row">
              <div className="hunter-avatar">
                <span>{activeUsername ? activeUsername[0].toUpperCase() : "P"}</span>
              </div>
              <div className="hunter-meta-info">
                <h3 className="hunter-name">{activeUsername}</h3>
                <div className="hunter-level-badge">
                  <span className="star-icon">★</span> Nivel Cazador {hunterStats.hunterLevel}
                </div>
              </div>
            </div>
            
            <div className="milestones-grid">
              <div className="milestone-card animate-scale-up">
                <span className="milestone-icon">🏆</span>
                <div className="milestone-data">
                  <span className="milestone-value">{hunterStats.totalPlatinums}</span>
                  <span className="milestone-label">Platinos</span>
                </div>
              </div>
              <div className="milestone-card animate-scale-up">
                <span className="milestone-icon">📈</span>
                <div className="milestone-data">
                  <span className="milestone-value">{hunterStats.averageProgress}%</span>
                  <span className="milestone-label">Completitud</span>
                </div>
              </div>
              <div className="milestone-card animate-scale-up">
                <span className="milestone-icon">🎮</span>
                <div className="milestone-data">
                  <span className="milestone-value">{games.length}</span>
                  <span className="milestone-label">Juegos</span>
                </div>
              </div>
              <div className="milestone-card animate-scale-up">
                <span className="milestone-icon">✨</span>
                <div className="milestone-data">
                  <span className="milestone-value">{hunterStats.totalEarned}</span>
                  <span className="milestone-label">Ganados</span>
                </div>
              </div>
            </div>

            <div className="hunter-trophies-breakdown">
              <span className="breakdown-item platinum-badge">🏆 {hunterStats.totalPlatinums}</span>
              <span className="breakdown-item gold-badge">🟡 {hunterStats.totalGold}</span>
              <span className="breakdown-item silver-badge">⚪ {hunterStats.totalSilver}</span>
              <span className="breakdown-item bronze-badge">🟤 {hunterStats.totalBronze}</span>
            </div>
          </div>
        </section>
      )}

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
            {sortedGames.map((game) => {
              const isSelected = selectedGame?.npCommunicationId === game.npCommunicationId;
              
              if (isSelected) {
                // RENDER DE CARD EXPANDIDA (INLINE)
                return (
                  <div
                    key={game.npCommunicationId}
                    id={`game-card-${game.npCommunicationId}`}
                    className={`game-card expanded animate-fade-in ${game.earnedTrophies?.platinum > 0 ? "has-platinum" : ""}`}
                  >
                    {/* Barra de Acciones del Juego */}
                    <div className="game-actions-bar">
                      <button 
                        className={`action-btn companion-toggle-btn ${isCompanionMode ? "active" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCompanionMode(!isCompanionMode);
                        }}
                      >
                        {isCompanionMode ? "✕ Salir Modo Companion" : "📱 Modo Companion"}
                      </button>

                      <button 
                        className="action-btn roadmap-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateRoadmap();
                        }}
                        disabled={isLoadingTrophies || trophies.length === 0}
                      >
                        🗺️ Ruta al Platino
                      </button>

                      <button 
                        className="close-expand-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGame(null);
                          setTrophies([]);
                          setSelectedTrophy(null);
                          setCurrentVideo(null);
                          setTrophyGuide("");
                          setGuideSource("");
                          setIsCompanionMode(false);
                        }}
                      >
                        ✕ Cerrar Detalles
                      </button>
                    </div>

                    <div className="expanded-header">
                      <div className="expanded-cover-wrapper">
                        <img
                          src={game.conceptIconUrl}
                          alt={game.titleName}
                          className="expanded-game-image"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&q=80";
                          }}
                        />
                      </div>
                      <div className="expanded-game-info">
                        <span className="game-platform">{game.platform}</span>
                        <h3 className="expanded-game-title">{game.titleName}</h3>
                        
                        <div className="progress-section" style={{ maxWidth: "450px" }}>
                          <div className="progress-header" style={{ marginBottom: "0.25rem" }}>
                            <span>Progreso de Trofeos</span>
                            <span className="progress-percentage">{game.progress}%</span>
                          </div>
                          <div className="progress-bar-bg" style={{ marginBottom: "0.5rem" }}>
                            <div
                              className="progress-bar-fill"
                              style={{ width: `${game.progress}%` }}
                            ></div>
                          </div>
                          <div className="trophies-summary" style={{ border: "none", paddingTop: "0", display: "flex", gap: "1rem", justifyContent: "flex-start" }}>
                            <span className="trophy-mini-item platinum" style={{ gap: "4px" }}>
                              🏆 {game.earnedTrophies.platinum}/{game.definedTrophies.platinum}
                            </span>
                            <span className="trophy-mini-item gold" style={{ gap: "4px" }}>
                              🟡 {game.earnedTrophies.gold}/{game.definedTrophies.gold}
                            </span>
                            <span className="trophy-mini-item silver" style={{ gap: "4px" }}>
                              ⚪ {game.earnedTrophies.silver}/{game.definedTrophies.silver}
                            </span>
                            <span className="trophy-mini-item bronze" style={{ gap: "4px" }}>
                              🟤 {game.earnedTrophies.bronze}/{game.definedTrophies.bronze}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cuerpo de la Tarjeta Expandida */}
                    <div className="expanded-body">
                      {/* Columna Izquierda: Trofeos Pendientes */}
                      <div className="expanded-trophies-list">
                        <div className="expanded-list-header">
                          <h4 className="expanded-sub-title" style={{ marginBottom: 0 }}>
                            <TrophyIcon type="platinum" /> Trofeos Pendientes ({displayedTrophies.length})
                          </h4>
                          
                          <div className="filter-switch-container">
                            <span className="filter-switch-label">Solo Platino (Base)</span>
                            <label className="toggle-switch">
                              <input 
                                type="checkbox" 
                                checked={onlyBaseGame} 
                                onChange={(e) => setOnlyBaseGame(e.target.checked)} 
                              />
                              <span className="slider"></span>
                            </label>
                          </div>
                        </div>

                        {/* Filtros por Tipo de Actividad del Trofeo */}
                        {!isLoadingTrophies && trophies.length > 0 && (
                          <div className="activity-filters-bar animate-fade-in">
                            {Object.entries(activityLabels).map(([key, label]) => (
                              <button
                                key={key}
                                className={`activity-filter-btn ${selectedActivityFilter === key ? "active" : ""}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedActivityFilter(key);
                                }}
                              >
                                <span className="filter-emoji">{activityIcons[key] || "✨"}</span>
                                <span className="filter-label">{label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {isLoadingTrophies ? (
                          <div className="loader-wrapper" style={{ padding: "3rem 0" }}>
                            <div className="ps-spinner" style={{ width: "30px", height: "30px" }}></div>
                            <p className="loader-text" style={{ fontSize: "0.85rem" }}>Obteniendo trofeos bloqueados...</p>
                          </div>
                        ) : displayedTrophies.length === 0 ? (
                          <div className="empty-placeholder" style={{ padding: "2rem" }}>
                            <span style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🎉</span>
                            <p className="empty-text" style={{ fontSize: "1rem" }}>¡Juego Completado o Filtrado!</p>
                            <p className="empty-subtext" style={{ fontSize: "0.8rem" }}>No quedan trofeos pendientes que coincidan con el filtro actual.</p>
                          </div>
                        ) : (
                          <div className="trophies-scroll-container">
                            {Object.entries(groupedTrophies).map(([groupName, groupTrophies]) => (
                              <div key={groupName} className="trophy-group-section">
                                <div className="trophy-group-divider">
                                  <span>{groupName}</span>
                                </div>
                                {groupTrophies.map((trophy) => (
                                  <div
                                    key={trophy.trophyId}
                                    className={`trophy-card ${selectedTrophy?.trophyId === trophy.trophyId ? "active" : ""}`}
                                    onClick={() => handleSelectTrophy(trophy, game)}
                                  >
                                    <div className="trophy-icon-wrapper">
                                      <img
                                        src={trophy.trophyIconUrl}
                                        alt="Icon"
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
                                        <span className={`trophy-activity-tag ${trophy.activityType}`}>
                                          {activityIcons[trophy.activityType] || "✨"} {activityLabels[trophy.activityType] || "Otros"}
                                        </span>
                                        {trophy.progress && trophy.progress.target > 0 && (
                                          <span className="trophy-progress-badge">
                                            {trophy.progress.value} / {trophy.progress.target}
                                          </span>
                                        )}
                                      </div>
                                      <p className="trophy-desc">{trophy.trophyDetail}</p>

                                      {/* Doble Porcentaje de Rareza */}
                                      {trophy.trophyEarnedRate !== null && (
                                        <div className="trophy-rarity-row">
                                          <span className="rarity-item official" title="Rareza oficial de PlayStation Network">
                                            🎮 PSN: {trophy.trophyEarnedRate}%
                                          </span>
                                          <span className="rarity-item community" title="Rareza estimada en la comunidad de cazadores">
                                            👥 Comunidad: {Math.min(99.9, Math.round(trophy.trophyEarnedRate * 3.4 * 10) / 10)}%
                                          </span>
                                        </div>
                                      )}

                                      {trophy.progress && trophy.progress.target > 0 && (
                                        <div className="trophy-progress-container">
                                          <div className="trophy-progress-bar-bg">
                                            <div 
                                              className="trophy-progress-bar-fill" 
                                              style={{ width: `${trophy.progress.rate}%` }}
                                            ></div>
                                          </div>
                                          <div className="trophy-progress-text">
                                            <span>Progreso de objetivo</span>
                                            <span>{trophy.progress.rate}%</span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Columna Derecha: Videotutorial */}
                      {/* Columna Derecha: Panel de Guía / Video / Asistente */}
                      <div className="expanded-video-panel">
                        {selectedTrophy && (
                          <div className="panel-tabs animate-fade-in">
                            <button 
                              className={`panel-tab-btn ${rightPanelTab === "guide" ? "active" : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setRightPanelTab("guide");
                              }}
                            >
                              📺 Videoguía y Resumen
                            </button>
                            <button 
                              className={`panel-tab-btn ${rightPanelTab === "chat" ? "active" : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setRightPanelTab("chat");
                              }}
                            >
                              🤖 Asistente de IA Chat
                            </button>
                          </div>
                        )}

                        {selectedTrophy ? (
                          <div className="panel-tab-content">
                            {rightPanelTab === "guide" ? (
                              /* CONTENIDO DE VIDEOGUÍA Y RESUMEN */
                              <div className="video-card animate-fade-in" style={{ border: "none", background: "transparent", padding: 0, boxShadow: "none" }}>
                                <div className="video-body" style={{ padding: 0 }}>
                                  {isLoadingVideo ? (
                                    <div className="loader-wrapper" style={{ padding: "3rem 0" }}>
                                      <div className="ps-spinner" style={{ width: "30px", height: "30px" }}></div>
                                      <p className="loader-text" style={{ fontSize: "0.85rem" }}>Buscando tutorial en YouTube...</p>
                                    </div>
                                  ) : currentVideo ? (
                                    <>
                                      {currentVideo.videoId ? (
                                        <>
                                          <div className="video-container" style={{ margin: "0 0 1rem 0" }}>
                                            <iframe
                                              src={`https://www.youtube.com/embed/${currentVideo.videoId}`}
                                              title={currentVideo.title}
                                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                              allowFullScreen
                                            ></iframe>
                                          </div>
                                          <p className="video-desc" style={{ fontSize: "0.85rem", marginBottom: "1rem" }}>
                                            <strong>Video:</strong> {currentVideo.title}
                                          </p>
                                        </>
                                      ) : (
                                        <div className="empty-placeholder" style={{ padding: "2rem 1rem", marginBottom: "1rem", background: "rgba(255, 0, 0, 0.02)", border: "1px solid rgba(255, 0, 0, 0.05)" }}>
                                          <span style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📺</span>
                                          <p className="empty-text" style={{ fontSize: "0.9rem", fontWeight: "700" }}>Videoguía externa disponible</p>
                                          <p className="empty-subtext" style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                                            Por seguridad de YouTube, no se permite reproducir directamente aquí, pero puedes abrir el enlace de abajo.
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

                                      {/* Resumen explicativo del trofeo (IA Gemini o Fallback) */}
                                      {trophyGuide && (
                                        <div className="trophy-guide-box animate-fade-in" style={{ marginTop: "1.25rem", padding: "1.15rem", background: "rgba(255, 255, 255, 0.02)", borderRadius: "14px", border: "1px solid var(--border-color)" }}>
                                          <h5 style={{ fontSize: "0.9rem", fontWeight: "700", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "6px", color: "var(--text-primary)" }}>
                                            📝 Guía Rápida {guideSource === "gemini-ai" ? "🤖 (IA Gemini)" : "📖"}
                                          </h5>
                                          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                                            {trophyGuide.replace(/\*\*/g, "")}
                                          </p>
                                        </div>
                                      )}
                                    </>
                                  ) : null}
                                </div>
                              </div>
                            ) : (
                              /* CONTENIDO DE CHAT ASISTENTE DE IA */
                              <div className="assistant-chat-panel animate-fade-in">
                                <div className="chat-messages-container">
                                  {chatHistory.map((msg, index) => (
                                    <div key={index} className={`chat-message ${msg.sender}`}>
                                      <div className="message-avatar">
                                        {msg.sender === "user" ? "👤" : "🤖"}
                                      </div>
                                      <div className="message-bubble">
                                        {msg.text}
                                      </div>
                                    </div>
                                  ))}
                                  {isSendingChat && (
                                    <div className="chat-message assistant loading animate-pulse">
                                      <div className="message-avatar">🤖</div>
                                      <div className="message-bubble">
                                        <div className="chat-typing-loader">
                                          <span></span><span></span><span></span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="chat-quick-questions">
                                  <button 
                                    className="quick-question-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setChatInput("¿Cómo consigo este trofeo de forma rápida?");
                                    }}
                                    disabled={isSendingChat}
                                  >
                                    🚀 ¿Cómo conseguirlo rápido?
                                  </button>
                                  <button 
                                    className="quick-question-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setChatInput("¿Existe algún bug o problema con este trofeo?");
                                    }}
                                    disabled={isSendingChat}
                                  >
                                    ⚠️ ¿Tiene bugs?
                                  </button>
                                  <button 
                                    className="quick-question-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setChatInput("Dame 3 consejos clave de jugabilidad para este trofeo.");
                                    }}
                                    disabled={isSendingChat}
                                  >
                                    💡 3 consejos clave
                                  </button>
                                </div>

                                <form onSubmit={handleSendChatMessage} className="chat-input-form" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="text"
                                    className="chat-input"
                                    placeholder="Pregunta algo sobre este trofeo..."
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    disabled={isSendingChat}
                                  />
                                  <button type="submit" className="chat-send-btn" disabled={isSendingChat || !chatInput.trim()}>
                                    {isSendingChat ? "..." : "Enviar"}
                                  </button>
                                </form>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="empty-placeholder" style={{ padding: "3rem 1.5rem" }}>
                            <span style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>👉</span>
                            <p className="empty-subtext" style={{ fontSize: "0.85rem" }}>
                              Selecciona un trofeo de la lista de la izquierda para ver su videoguía o consultar al Asistente de IA.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              // RENDER DE CARD NORMAL (GRID)
              return (
                <div
                  key={game.npCommunicationId}
                  id={`game-card-${game.npCommunicationId}`}
                  className={`game-card ${game.earnedTrophies?.platinum > 0 ? "has-platinum" : ""}`}
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
              );
            })}
          </div>
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

      {/* Modal de la Ruta al Platino (IA) */}
      {showRoadmapModal && (
        <div className="roadmap-modal-overlay animate-fade-in" onClick={() => setShowRoadmapModal(false)}>
          <div className="roadmap-modal-content animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="roadmap-modal-header">
              <h3 className="roadmap-modal-title">🗺️ Ruta de Obtención de Platino</h3>
              <button className="close-modal-btn" onClick={() => setShowRoadmapModal(false)}>✕</button>
            </div>
            
            <div className="roadmap-modal-body">
              {isLoadingRoadmap ? (
                <div className="loader-wrapper" style={{ padding: "4rem 0" }}>
                  <div className="ps-spinner"></div>
                  <p className="loader-text" style={{ fontSize: "0.85rem", marginTop: "1rem" }}>Diseñando e hilvanando la ruta más óptima para ti...</p>
                </div>
              ) : roadmapData ? (
                <div className="roadmap-timeline">
                  <div className="timeline-introduction">
                    <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                      Esta ruta personalizada ordena tus trofeos pendientes para <strong>{selectedGame?.titleName}</strong> en fases lógicas para maximizar tu tiempo.
                    </p>
                  </div>
                  <div className="timeline-wrapper">
                    {roadmapData.steps.map((step, idx) => (
                      <div key={idx} className="timeline-step">
                        <div className="step-marker">
                          <span className="step-number">{step.stepNumber}</span>
                        </div>
                        <div className="step-details">
                          <h4 className="step-title">{step.title}</h4>
                          <p className="step-desc">{step.description}</p>
                          
                          {step.trophies && step.trophies.length > 0 && (
                            <div className="step-trophies-list">
                              <span className="step-trophies-label">Objetivos a conseguir:</span>
                              <div className="step-trophy-tags">
                                {step.trophies.map((tName, tIdx) => (
                                  <span key={tIdx} className="step-trophy-tag">
                                    🏆 {tName}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="empty-placeholder" style={{ padding: "2rem" }}>
                  <span>⚠️</span>
                  <p className="empty-text">No se pudo generar la ruta</p>
                  <p className="empty-subtext">Ha ocurrido un error al estructurar los datos del juego.</p>
                </div>
              )}
            </div>
            
            <div className="roadmap-modal-footer">
              <button className="close-btn-secondary" onClick={() => setShowRoadmapModal(false)}>
                Entendido, ¡a cazar!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer de diagnóstico de versión */}
      {!isCompanionMode && (
        <footer style={{ marginTop: "3rem", textAlign: "center", paddingBottom: "2rem", opacity: 0.4, fontSize: "0.72rem", color: "var(--text-muted)" }}>
          <p>PSN Trophy Tracker v1.1.2 - Mobile Layout Fix Active</p>
        </footer>
      )}
    </div>
  );
}
