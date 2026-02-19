import { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/engine';
import { Citizen, GameEvent } from './game/types';
import { Achievement } from './game/achievements';
import { audioManager } from './game/audio';
import { FOLLOWERS } from './data/followers';

interface Stats {
  citizens: number;
  level: number;
  levelName: string;
  progress: number;
  nextLevel: number;
  todayJoined: number;
}

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const animationRef = useRef<number>(0);
  
  const [stats, setStats] = useState<Stats>({
    citizens: 0,
    level: 1,
    levelName: 'Палатка',
    progress: 0,
    nextLevel: 100,
    todayJoined: 0
  });
  
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<{ found: boolean; username: string } | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [showWeatherMenu, setShowWeatherMenu] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  
  // Initialize game engine
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const engine = new GameEngine(canvasRef.current);
    engineRef.current = engine;
    
    engine.setOnStatsUpdate(setStats);
    engine.setOnEventUpdate(setEvents);
    engine.setOnAchievementUnlock((ach) => {
      setNewAchievement(ach);
      setAchievements(engine.getAchievements());
      setTimeout(() => setNewAchievement(null), 4000);
    });
    engine.setOnCitizenSelect((citizen) => {
      setSelectedCitizen(citizen);
      setShowActionMenu(!!citizen);
    });
    
    // Загружаем подписчиков из data/followers.ts
    engine.setFollowers(FOLLOWERS);
    setAchievements(engine.getAchievements());
    
    const gameLoop = (timestamp: number) => {
      engine.update(timestamp);
      engine.render();
      animationRef.current = requestAnimationFrame(gameLoop);
    };
    
    animationRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      cancelAnimationFrame(animationRef.current);
      engine.destroy();
      audioManager.stop();
    };
  }, []);
  
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (engineRef.current) {
      engineRef.current.searchCitizen(query);
      setSearchResult(engineRef.current.getSearchResult());
    }
  }, []);
  
  const triggerWeather = useCallback((type: 'rain' | 'snow' | 'storm') => {
    engineRef.current?.triggerWeather(type);
    setShowWeatherMenu(false);
  }, []);
  
  const toggleMusic = useCallback(async () => {
    await audioManager.init();
    const playing = audioManager.toggle();
    setIsMusicPlaying(playing);
  }, []);
  
  const handleCitizenAction = useCallback((action: 'walking' | 'idle' | 'working' | 'waving') => {
    if (selectedCitizen && engineRef.current) {
      engineRef.current.setCitizenAction(selectedCitizen.id, action);
      setShowActionMenu(false);
    }
  }, [selectedCitizen]);

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const lockedAchievements = achievements.filter(a => !a.unlocked);

  return (
    <div className="relative w-full h-screen overflow-hidden font-['Nunito',sans-serif]">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none"
      />
      
      {/* Achievement Popup */}
      {newAchievement && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-50 animate-bounce-in">
          <div className="bg-gradient-to-r from-amber-500 to-yellow-400 rounded-2xl p-4 shadow-2xl flex items-center gap-3">
            <div className="text-4xl">{newAchievement.icon}</div>
            <div>
              <div className="text-white font-bold text-lg">Достижение!</div>
              <div className="text-amber-100 font-semibold">{newAchievement.title}</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Top UI Bar */}
      <div className="absolute top-0 left-0 right-0 p-3 safe-area-inset-top">
        <div className="bg-gradient-to-b from-slate-900/90 to-slate-800/90 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-slate-700/50">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">🏙️</span>
              </div>
              <div>
                <div className="text-white font-bold text-sm">@medvedev.tech</div>
                <div className="text-slate-400 text-xs">Цифровая Империя</div>
              </div>
            </div>
            <div className="flex gap-2">
              {/* Music Button */}
              <button
                onClick={toggleMusic}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  isMusicPlaying 
                    ? 'bg-green-600/80 text-white' 
                    : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600/80'
                }`}
              >
                {isMusicPlaying ? '🔊' : '🔇'}
              </button>
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="w-9 h-9 rounded-xl bg-slate-700/80 flex items-center justify-center text-slate-300 hover:bg-slate-600/80 transition-colors"
              >
                🔍
              </button>
              <button
                onClick={() => setShowAchievements(true)}
                className="w-9 h-9 rounded-xl bg-amber-600/80 flex items-center justify-center text-white hover:bg-amber-500/80 transition-colors relative"
              >
                🏆
                {unlockedAchievements.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full text-[10px] flex items-center justify-center">
                    {unlockedAchievements.length}
                  </span>
                )}
              </button>
            </div>
          </div>
          
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="bg-slate-800/60 rounded-xl p-2 text-center">
              <div className="text-xl font-bold text-white">{stats.citizens}</div>
              <div className="text-[10px] text-slate-400">Жителей</div>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-2 text-center">
              <div className="text-xl font-bold text-amber-400">Ур.{stats.level}</div>
              <div className="text-[10px] text-slate-400">{stats.levelName}</div>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-2 text-center">
              <div className="text-xl font-bold text-green-400">+{stats.todayJoined}</div>
              <div className="text-[10px] text-slate-400">Сегодня</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="relative">
            <div className="h-3 bg-slate-700/60 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500 ease-out relative"
                style={{ width: `${stats.progress * 100}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
              </div>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-slate-400">{stats.citizens} жителей</span>
              <span className="text-[10px] text-amber-400">→ {stats.nextLevel}</span>
            </div>
          </div>
          
          {/* Search Panel */}
          {showSearch && (
            <div className="mt-3 space-y-2 animate-slide-up">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Найти жителя..."
                className="w-full px-4 py-2 bg-slate-700/60 rounded-xl text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
              {searchResult && (
                <div className={`p-3 rounded-xl text-sm ${
                  searchResult.found 
                    ? 'bg-green-600/30 text-green-300' 
                    : 'bg-red-600/30 text-red-300'
                }`}>
                  {searchResult.found ? (
                    <>
                      <div className="font-bold">✨ {searchResult.username}</div>
                      <div className="text-xs opacity-80">Ты часть империи!</div>
                    </>
                  ) : (
                    <>
                      <div className="font-bold">😢 "{searchResult.username}" не найден</div>
                      <div className="text-xs opacity-80">Подпишись, чтобы поселиться!</div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Side Buttons */}
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex flex-col gap-2">
        <button
          onClick={() => setShowWeatherMenu(!showWeatherMenu)}
          className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 shadow-lg flex items-center justify-center text-white text-xl"
        >
          🌤️
        </button>
        <button
          onClick={() => setShowEvents(!showEvents)}
          className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg flex items-center justify-center text-white text-xl relative"
        >
          📜
          {events.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
              {events.length}
            </span>
          )}
        </button>
      </div>
      
      {/* Weather Menu */}
      {showWeatherMenu && (
        <div className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-slate-900/90 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-slate-700/50 animate-slide-up">
          <div className="text-white font-bold text-sm mb-2">Погода</div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => triggerWeather('rain')}
              className="px-4 py-2 bg-blue-600/60 rounded-xl text-white text-sm hover:bg-blue-500/60 transition-colors flex items-center gap-2"
            >
              🌧️ Дождь
            </button>
            <button
              onClick={() => triggerWeather('snow')}
              className="px-4 py-2 bg-slate-600/60 rounded-xl text-white text-sm hover:bg-slate-500/60 transition-colors flex items-center gap-2"
            >
              ❄️ Снег
            </button>
            <button
              onClick={() => triggerWeather('storm')}
              className="px-4 py-2 bg-purple-600/60 rounded-xl text-white text-sm hover:bg-purple-500/60 transition-colors flex items-center gap-2"
            >
              ⛈️ Гроза
            </button>
          </div>
        </div>
      )}
      
      {/* Citizen Action Menu */}
      {showActionMenu && selectedCitizen && (
        <div className="absolute left-1/2 bottom-48 transform -translate-x-1/2 bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-slate-700/50 animate-bounce-in z-40">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-lg">
              👤
            </div>
            <div>
              <div className="text-white font-bold">{selectedCitizen.username}</div>
              <div className="text-slate-400 text-xs">Житель цифровой империи</div>
            </div>
            <button 
              onClick={() => setShowActionMenu(false)}
              className="ml-auto text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="text-slate-300 text-xs mb-2">Выбери действие:</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleCitizenAction('walking')}
              className="px-3 py-2 bg-green-600/60 rounded-xl text-white text-sm hover:bg-green-500/60 transition-colors flex items-center gap-2"
            >
              🚶 Гулять
            </button>
            <button
              onClick={() => handleCitizenAction('idle')}
              className="px-3 py-2 bg-blue-600/60 rounded-xl text-white text-sm hover:bg-blue-500/60 transition-colors flex items-center gap-2"
            >
              🧍 Стоять
            </button>
            <button
              onClick={() => handleCitizenAction('working')}
              className="px-3 py-2 bg-amber-600/60 rounded-xl text-white text-sm hover:bg-amber-500/60 transition-colors flex items-center gap-2"
            >
              🔨 Работать
            </button>
            <button
              onClick={() => handleCitizenAction('waving')}
              className="px-3 py-2 bg-pink-600/60 rounded-xl text-white text-sm hover:bg-pink-500/60 transition-colors flex items-center gap-2"
            >
              👋 Махать
            </button>
          </div>
        </div>
      )}
      
      {/* Events Panel */}
      {showEvents && events.length > 0 && (
        <div className="absolute bottom-48 right-3 w-72 bg-slate-900/90 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-slate-700/50 max-h-72 overflow-y-auto animate-slide-up">
          <div className="flex items-center justify-between mb-2">
            <div className="text-white font-bold text-sm">События</div>
            <button 
              onClick={() => setShowEvents(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2">
            {events.map((event) => (
              <div 
                key={event.id}
                className={`text-xs p-2 rounded-lg ${
                  event.type === 'level' 
                    ? 'bg-amber-600/30 text-amber-200'
                    : event.type === 'milestone'
                    ? 'bg-purple-600/30 text-purple-200'
                    : 'bg-slate-700/50 text-slate-300'
                }`}
              >
                {event.message}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Bottom Info Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-3 safe-area-inset-bottom">
        <div className="bg-gradient-to-b from-slate-900/90 to-slate-800/90 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-slate-700/50">
          <div className="text-center text-slate-400 text-xs mb-3">
            Этот город построен благодаря подписчикам @medvedev.tech
          </div>
          
          {/* Telegram Subscribe Button */}
          <a
            href="https://t.me/medvedevtech"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl text-white text-sm font-bold text-center hover:from-blue-400 hover:to-cyan-400 transition-all shadow-lg active:scale-95"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.752-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.015 3.333-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.121.1.154.234.169.334.016.1.036.324.02.499z"/>
              </svg>
              Подписаться на Telegram
            </span>
          </a>
          
          <div className="mt-2 text-center text-slate-500 text-[10px]">
            Подписчиков: {FOLLOWERS.length} • Нажми на жителя для действий
          </div>
        </div>
      </div>
      
      {/* Achievements Modal */}
      {showAchievements && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowAchievements(false)}>
          <div 
            className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-4 w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl border border-slate-700 animate-bounce-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-white font-bold text-lg">🏆 Достижения</div>
              <button 
                onClick={() => setShowAchievements(false)}
                className="text-slate-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
            
            {unlockedAchievements.length > 0 && (
              <div className="mb-4">
                <div className="text-green-400 text-sm font-semibold mb-2">Разблокировано ({unlockedAchievements.length})</div>
                <div className="space-y-2">
                  {unlockedAchievements.map(ach => (
                    <div key={ach.id} className="flex items-center gap-3 bg-green-600/20 rounded-xl p-3 border border-green-500/30">
                      <div className="text-3xl">{ach.icon}</div>
                      <div>
                        <div className="text-white font-bold text-sm">{ach.title}</div>
                        <div className="text-green-300 text-xs">{ach.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <div className="text-slate-400 text-sm font-semibold mb-2">Заблокировано ({lockedAchievements.length})</div>
              <div className="space-y-2">
                {lockedAchievements.map(ach => (
                  <div key={ach.id} className="flex items-center gap-3 bg-slate-700/30 rounded-xl p-3 border border-slate-600/30 opacity-60">
                    <div className="text-3xl grayscale">🔒</div>
                    <div>
                      <div className="text-slate-300 font-bold text-sm">{ach.title}</div>
                      <div className="text-slate-500 text-xs">{ach.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* City Level Indicator */}
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <div className="bg-slate-900/70 backdrop-blur-sm rounded-xl p-2 text-center">
          <div className="text-3xl mb-1 animate-float">
            {stats.level === 1 && '⛺'}
            {stats.level === 2 && '🏕️'}
            {stats.level === 3 && '🏘️'}
            {stats.level === 4 && '🏙️'}
            {stats.level === 5 && '🌆'}
            {stats.level === 6 && '🌃'}
          </div>
          <div className="text-white text-xs font-bold">{stats.levelName}</div>
        </div>
      </div>
      
      {/* Instructions hint */}
      <div className="absolute bottom-44 left-3 pointer-events-none">
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg px-2 py-1 text-slate-400 text-[10px]">
          👆 Тап = выбор • 🤏 Pinch = зум • 👉 Drag = двигать
        </div>
      </div>
    </div>
  );
}
