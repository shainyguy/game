import { Building, Citizen, Cloud, Particle, CITY_LEVELS, Follower, GameEvent, MapDecoration, RiverTile, Bridge } from './types';
import { drawTile, drawBuilding, drawCitizen, drawCloud, drawParticle, toIso, drawDecoration, drawRiverTile, drawBridge } from './renderer';
import { WeatherState, createWeatherState, updateWeather, renderWeather } from './weather';
import { Vehicle, createVehicle, updateVehicle, drawVehicle } from './vehicles';
import { Achievement, ACHIEVEMENTS, checkAchievements } from './achievements';

const MAP_SIZE = 30; // Расширенная карта

const CITIZEN_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
];

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;
  
  // Camera
  private cameraX: number = 0;
  private cameraY: number = 0;
  private targetCameraX: number = 0;
  private targetCameraY: number = 0;
  private zoom: number = 1;
  private targetZoom: number = 1;
  
  // Touch handling
  private isDragging: boolean = false;
  private lastTouchX: number = 0;
  private lastTouchY: number = 0;
  private pinchStartDistance: number = 0;
  private pinchStartZoom: number = 1;
  
  // Game state
  private buildings: Building[] = [];
  private citizens: Citizen[] = [];
  private clouds: Cloud[] = [];
  private particles: Particle[] = [];
  private followers: Follower[] = [];
  private events: GameEvent[] = [];
  private vehicles: Vehicle[] = [];
  private vehicleIdCounter: number = 0;
  
  // Map decorations
  private decorations: MapDecoration[] = [];
  private riverTiles: RiverTile[] = [];
  private bridges: Bridge[] = [];
  private avatarCache: Map<string, HTMLImageElement> = new Map();
  
  // Weather
  private weather: WeatherState = createWeatherState();
  
  // Achievements
  private achievements: Achievement[] = [...ACHIEVEMENTS];
  
  // Special citizens
  private citizenOfTheDay: string | null = null;
  private lastCitizenOfDayUpdate: number = 0;
  
  // Time
  private timeOfDay: number = 0.3;
  private lastTime: number = 0;
  private deltaTime: number = 0;
  
  // Map data
  private pathTiles: Set<string> = new Set();
  
  // Callbacks
  private onStatsUpdate: ((stats: {
    citizens: number;
    level: number;
    levelName: string;
    progress: number;
    nextLevel: number;
    todayJoined: number;
  }) => void) | null = null;
  
  private onEventUpdate: ((events: GameEvent[]) => void) | null = null;
  private onAchievementUnlock: ((achievement: Achievement) => void) | null = null;
  private onWeatherChange: ((weather: WeatherState) => void) | null = null;
  
  private highlightedCitizen: Citizen | null = null;
  private searchResult: { found: boolean; username: string } | null = null;
  private selectedCitizen: Citizen | null = null;
  private onCitizenSelect: ((citizen: Citizen | null) => void) | null = null;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    this.ctx = ctx;
    
    this.resize();
    this.setupEventListeners();
    this.initializeClouds();
    this.generatePaths();
    this.generateDecorations();
    this.generateRiver();
  }
  
  private generateDecorations() {
    // Деревья - много по краям карты и в парковых зонах
    const treePositions = [
      // Левый лес
      [1, 1], [2, 2], [1, 3], [3, 1], [2, 5], [1, 7], [3, 8], [2, 10],
      // Правый лес  
      [27, 2], [28, 3], [26, 4], [29, 1], [27, 6], [28, 8], [26, 10],
      // Нижний лес
      [2, 26], [4, 27], [3, 28], [6, 27], [8, 28], [5, 25],
      [25, 26], [27, 27], [26, 28], [23, 27], [28, 25],
      // Центральные парки
      [8, 8], [9, 7], [7, 9], [21, 8], [22, 7], [20, 9],
      [8, 21], [9, 22], [7, 20], [21, 21], [22, 22], [20, 20],
      // Аллея
      [15, 5], [15, 7], [15, 9], [15, 21], [15, 23], [15, 25]
    ];
    for (const [x, y] of treePositions) {
      this.decorations.push({
        type: 'tree',
        gridX: x,
        gridY: y,
        variant: Math.floor(Math.random() * 3)
      });
    }
    
    // Кусты
    const bushPositions = [
      [4, 4], [6, 6], [24, 5], [5, 24], [25, 26], [26, 25],
      [10, 3], [3, 10], [27, 10], [10, 27],
      [12, 6], [6, 12], [24, 12], [12, 24],
      [18, 4], [4, 18], [18, 26], [26, 18]
    ];
    for (const [x, y] of bushPositions) {
      this.decorations.push({
        type: 'bush',
        gridX: x,
        gridY: y,
        variant: Math.floor(Math.random() * 3)
      });
    }
    
    // Цветы - много разбросанных
    for (let i = 0; i < 50; i++) {
      const x = Math.floor(Math.random() * (MAP_SIZE - 4)) + 2;
      const y = Math.floor(Math.random() * (MAP_SIZE - 4)) + 2;
      // Не ставим на дорожки и реки
      const isRiver = this.riverTiles.some(r => r.gridX === x && r.gridY === y);
      if (!this.pathTiles.has(`${x},${y}`) && !isRiver) {
        this.decorations.push({
          type: 'flower',
          gridX: x,
          gridY: y,
          variant: Math.floor(Math.random() * 5)
        });
      }
    }
    
    // Камни
    const rockPositions = [
      [1, 5], [5, 1], [28, 20], [20, 28], [18, 2], [2, 18],
      [25, 5], [5, 25], [12, 1], [1, 12], [28, 12], [12, 28]
    ];
    for (const [x, y] of rockPositions) {
      this.decorations.push({
        type: 'rock',
        gridX: x,
        gridY: y,
        variant: Math.floor(Math.random() * 3)
      });
    }
    
    // Фонари вдоль дорожек
    const lampPositions = [
      [15, 5], [15, 10], [15, 20], [15, 25],
      [5, 15], [10, 15], [20, 15], [25, 15],
      [10, 10], [20, 10], [10, 20], [20, 20]
    ];
    for (const [x, y] of lampPositions) {
      this.decorations.push({
        type: 'lamp',
        gridX: x,
        gridY: y,
        variant: 0
      });
    }
    
    // Скамейки
    const benchPositions = [
      [9, 9], [21, 9], [9, 21], [21, 21],
      [15, 12], [15, 18], [12, 15], [18, 15]
    ];
    for (const [x, y] of benchPositions) {
      this.decorations.push({
        type: 'bench',
        gridX: x,
        gridY: y,
        variant: 0
      });
    }
    
    // Фонтаны
    const fountainPositions = [[15, 15], [8, 15], [22, 15]];
    for (const [x, y] of fountainPositions) {
      this.decorations.push({
        type: 'fountain',
        gridX: x,
        gridY: y,
        variant: 0
      });
    }
  }
  
  private generateRiver() {
    // Главная река с севера на юг
    const mainRiver = [
      // Верхняя часть
      [5, 0], [5, 1], [5, 2], [6, 3], [6, 4], [7, 5], [7, 6], [7, 7],
      [6, 0], [6, 1], [6, 2], [7, 3], [7, 4], [8, 5], [8, 6], [8, 7],
      // Изгиб вправо
      [8, 8], [9, 9], [10, 9], [11, 10], [12, 10], [13, 11],
      [9, 8], [10, 8], [11, 9], [12, 9], [13, 10], [14, 10],
      // Озеро в центре
      [14, 11], [15, 11], [16, 11], [14, 12], [15, 12], [16, 12], [17, 12],
      [14, 13], [15, 13], [16, 13], [17, 13],
      // Продолжение вниз
      [17, 14], [17, 15], [18, 16], [18, 17], [19, 18], [19, 19],
      [18, 14], [18, 15], [19, 16], [19, 17], [20, 18], [20, 19],
      // Уход за карту
      [20, 20], [21, 21], [22, 22], [23, 23], [24, 24],
      [21, 20], [22, 21], [23, 22], [24, 23], [25, 24]
    ];
    
    for (const [x, y] of mainRiver) {
      this.riverTiles.push({
        gridX: x,
        gridY: y,
        flowDirection: y < 10 ? 'vertical' : 'horizontal'
      });
    }
    
    // Мосты через реку
    this.bridges.push({ gridX: 6, gridY: 2, direction: 'horizontal' });
    this.bridges.push({ gridX: 7, gridY: 6, direction: 'horizontal' });
    this.bridges.push({ gridX: 10, gridY: 9, direction: 'vertical' });
    this.bridges.push({ gridX: 15, gridY: 11, direction: 'vertical' });
    this.bridges.push({ gridX: 18, gridY: 16, direction: 'horizontal' });
  }
  
  private resize() {
    const dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.scale(dpr, dpr);
    
    this.cameraX = this.width / 2;
    this.cameraY = this.height / 3;
    this.targetCameraX = this.cameraX;
    this.targetCameraY = this.cameraY;
  }
  
  private setupEventListeners() {
    window.addEventListener('resize', () => this.resize());
    
    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchend', () => this.handleTouchEnd());
    
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
    this.canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
    
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
  }
  
  private handleTouchStart(e: TouchEvent) {
    e.preventDefault();
    if (e.touches.length === 1) {
      this.isDragging = true;
      this.lastTouchX = e.touches[0].clientX;
      this.lastTouchY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      this.pinchStartDistance = this.getTouchDistance(e.touches);
      this.pinchStartZoom = this.zoom;
    }
  }
  
  private handleTouchMove(e: TouchEvent) {
    e.preventDefault();
    if (e.touches.length === 1 && this.isDragging) {
      const dx = e.touches[0].clientX - this.lastTouchX;
      const dy = e.touches[0].clientY - this.lastTouchY;
      this.targetCameraX += dx;
      this.targetCameraY += dy;
      this.lastTouchX = e.touches[0].clientX;
      this.lastTouchY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      const dist = this.getTouchDistance(e.touches);
      const scale = dist / this.pinchStartDistance;
      this.targetZoom = Math.max(0.5, Math.min(2, this.pinchStartZoom * scale));
    }
  }
  
  private handleTouchEnd() {
    this.isDragging = false;
  }
  
  private getTouchDistance(touches: TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  private handleMouseDown(e: MouseEvent) {
    this.isDragging = true;
    this.lastTouchX = e.clientX;
    this.lastTouchY = e.clientY;
  }
  
  private handleMouseMove(e: MouseEvent) {
    if (this.isDragging) {
      const dx = e.clientX - this.lastTouchX;
      const dy = e.clientY - this.lastTouchY;
      this.targetCameraX += dx;
      this.targetCameraY += dy;
      this.lastTouchX = e.clientX;
      this.lastTouchY = e.clientY;
    }
  }
  
  private handleMouseUp() {
    this.isDragging = false;
  }
  
  private handleWheel(e: WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    this.targetZoom = Math.max(0.5, Math.min(2, this.targetZoom * delta));
  }
  
  private handleClick(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    for (const citizen of this.citizens) {
      const { screenX, screenY } = toIso(citizen.x, citizen.y);
      const sx = (screenX + this.cameraX) * this.zoom + (this.width * (1 - this.zoom)) / 2;
      const sy = (screenY + this.cameraY) * this.zoom + (this.height * (1 - this.zoom)) / 2;
      
      const dist = Math.sqrt((clickX - sx) ** 2 + (clickY - sy) ** 2);
      if (dist < 30 * this.zoom) {
        this.selectCitizen(citizen);
        return;
      }
    }
    
    // Клик мимо - снимаем выделение
    if (this.selectedCitizen) {
      this.selectedCitizen = null;
      this.onCitizenSelect?.(null);
    }
    if (this.highlightedCitizen) {
      this.highlightedCitizen.isHighlighted = false;
      this.highlightedCitizen = null;
      this.searchResult = null;
    }
  }
  
  private selectCitizen(citizen: Citizen) {
    this.selectedCitizen = citizen;
    this.highlightCitizen(citizen);
    this.onCitizenSelect?.(citizen);
  }
  
  setOnCitizenSelect(callback: ((citizen: Citizen | null) => void) | null) {
    this.onCitizenSelect = callback;
  }
  
  // Установить действие для персонажа
  setCitizenAction(citizenId: string, action: Citizen['state']) {
    const citizen = this.citizens.find(c => c.id === citizenId);
    if (citizen) {
      citizen.state = action;
      citizen.stateTimer = 300; // Длительное действие
      if (action === 'walking') {
        citizen.targetX = MAP_SIZE / 2 + (Math.random() - 0.5) * 15;
        citizen.targetY = MAP_SIZE / 2 + (Math.random() - 0.5) * 15;
      }
    }
  }
  
  getSelectedCitizen(): Citizen | null {
    return this.selectedCitizen;
  }
  
  private initializeClouds() {
    for (let i = 0; i < 5; i++) {
      this.clouds.push({
        x: Math.random() * this.width * 2 - this.width / 2,
        y: Math.random() * 100 + 30,
        speed: 0.2 + Math.random() * 0.3,
        scale: 0.5 + Math.random() * 0.5,
        opacity: 0.4 + Math.random() * 0.3
      });
    }
  }
  
  private generatePaths() {
    for (let i = 0; i < MAP_SIZE; i++) {
      this.pathTiles.add(`${MAP_SIZE / 2},${i}`);
      this.pathTiles.add(`${i},${MAP_SIZE / 2}`);
    }
    
    for (let i = 0; i < MAP_SIZE / 2; i++) {
      this.pathTiles.add(`${i},${i}`);
      this.pathTiles.add(`${MAP_SIZE - 1 - i},${i}`);
    }
  }
  
  setFollowers(followers: Follower[]) {
    const prevCount = this.followers.length;
    this.followers = followers;
    
    const prevLevel = this.getCurrentLevel(prevCount);
    const newLevel = this.getCurrentLevel(followers.length);
    
    if (newLevel > prevLevel && prevCount > 0) {
      this.triggerLevelUp(newLevel);
    }
    
    this.updateBuildings();
    this.updateCitizens();
    this.updateStats();
    this.updateVehicles();
    this.checkNewAchievements();
    this.updateCitizenOfTheDay();
  }
  
  private getCurrentLevel(followerCount: number): number {
    let level = 0;
    for (let i = CITY_LEVELS.length - 1; i >= 0; i--) {
      if (followerCount >= CITY_LEVELS[i].minFollowers) {
        level = i;
        break;
      }
    }
    return level;
  }
  
  private triggerLevelUp(level: number) {
    for (let i = 0; i < 100; i++) {
      this.particles.push({
        x: this.width / 2 + (Math.random() - 0.5) * 200,
        y: this.height / 3,
        vx: (Math.random() - 0.5) * 10,
        vy: -Math.random() * 10 - 5,
        color: CITIZEN_COLORS[Math.floor(Math.random() * CITIZEN_COLORS.length)],
        life: 120,
        maxLife: 120,
        size: 6 + Math.random() * 6
      });
    }
    
    this.addEvent({
      id: `level_${Date.now()}`,
      message: `🎉 Новый уровень: ${CITY_LEVELS[level].name}!`,
      timestamp: Date.now(),
      type: 'level'
    });
  }
  
  private updateBuildings() {
    const level = this.getCurrentLevel(this.followers.length);
    const levelData = CITY_LEVELS[level];
    const neededBuildings = levelData.buildings;
    
    if (this.buildings.length !== neededBuildings.length) {
      this.buildings = [];
      
      const centerX = MAP_SIZE / 2;
      const centerY = MAP_SIZE / 2;
      
      neededBuildings.forEach((type, index) => {
        const angle = (index / neededBuildings.length) * Math.PI * 2;
        const radius = 2 + Math.floor(index / 4) * 2;
        const gx = Math.round(centerX + Math.cos(angle) * radius);
        const gy = Math.round(centerY + Math.sin(angle) * radius);
        
        this.buildings.push({
          id: index,
          type,
          gridX: gx,
          gridY: gy,
          width: 1,
          height: 1,
          constructionProgress: 0,
          isConstructing: true,
          smokeTimer: Math.random() * 1000,
          lightOn: Math.random() > 0.5
        });
      });
    }
  }
  
  private updateCitizens() {
    const existingIds = new Set(this.citizens.map(c => c.id));
    
    for (const follower of this.followers) {
      if (!existingIds.has(follower.id)) {
        const startX = MAP_SIZE / 2 + (Math.random() - 0.5) * 10;
        const startY = MAP_SIZE / 2 + (Math.random() - 0.5) * 10;
        
        // Determine if VIP (random chance for demo)
        const isVIP = Math.random() < 0.05;
        const isOldTimer = Math.random() < 0.1;
        
        const citizen: Citizen = {
          id: follower.id,
          username: follower.username,
          x: startX,
          y: startY,
          targetX: startX,
          targetY: startY,
          state: 'idle',
          stateTimer: Math.random() * 200,
          animFrame: 0,
          color: isVIP ? '#fbbf24' : isOldTimer ? '#a855f7' : CITIZEN_COLORS[Math.floor(Math.random() * CITIZEN_COLORS.length)],
          direction: Math.random() > 0.5 ? 1 : -1,
          speed: 0.02 + Math.random() * 0.02,
          scale: 0.8 + Math.random() * 0.4,
          isHighlighted: false,
          jumpOffset: 0,
          isJumping: false,
          avatar: follower.avatar
        };
        
        // Загрузка аватарки
        if (follower.avatar && follower.avatar.length > 0) {
          this.loadAvatar(citizen, follower.avatar);
        }
        
        this.citizens.push(citizen);
        
        const joinedTime = new Date(follower.joinedAt).getTime();
        const now = Date.now();
        if (now - joinedTime < 24 * 60 * 60 * 1000) {
          this.addEvent({
            id: `join_${follower.id}`,
            message: `👤 ${follower.username} присоединился к городу!`,
            timestamp: joinedTime,
            type: 'join'
          });
        }
      }
    }
    
    const followerIds = new Set(this.followers.map(f => f.id));
    this.citizens = this.citizens.filter(c => followerIds.has(c.id));
  }
  
  private loadAvatar(citizen: Citizen, url: string) {
    // Проверяем кэш
    if (this.avatarCache.has(url)) {
      citizen.avatarLoaded = this.avatarCache.get(url);
      return;
    }
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      citizen.avatarLoaded = img;
      this.avatarCache.set(url, img);
    };
    img.onerror = () => {
      // Ошибка загрузки - оставляем без аватарки
      console.warn(`Failed to load avatar for ${citizen.username}`);
    };
    img.src = url;
  }
  
  private updateVehicles() {
    const level = this.getCurrentLevel(this.followers.length);
    
    // Add vehicles based on level
    const maxVehicles = level >= 5 ? 8 : level >= 4 ? 6 : level >= 3 ? 4 : level >= 2 ? 2 : 0;
    
    while (this.vehicles.length < maxVehicles) {
      this.vehicles.push(createVehicle(this.vehicleIdCounter++, level, MAP_SIZE));
    }
  }
  
  private checkNewAchievements() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayJoined = this.followers.filter(f => new Date(f.joinedAt) >= today).length;
    
    const { updated, newUnlocks } = checkAchievements(
      this.achievements,
      this.followers.length,
      todayJoined
    );
    
    this.achievements = updated;
    
    for (const ach of newUnlocks) {
      this.onAchievementUnlock?.(ach);
      this.addEvent({
        id: `ach_${ach.id}`,
        message: `🏆 Достижение: ${ach.title}!`,
        timestamp: Date.now(),
        type: 'milestone'
      });
      
      // Confetti for achievement
      for (let i = 0; i < 50; i++) {
        this.particles.push({
          x: this.width / 2 + (Math.random() - 0.5) * 100,
          y: this.height / 4,
          vx: (Math.random() - 0.5) * 8,
          vy: -Math.random() * 8 - 3,
          color: ['#fbbf24', '#a855f7', '#22c55e'][Math.floor(Math.random() * 3)],
          life: 80,
          maxLife: 80,
          size: 5 + Math.random() * 5
        });
      }
    }
  }
  
  private updateCitizenOfTheDay() {
    const now = Date.now();
    // Update every hour
    if (now - this.lastCitizenOfDayUpdate > 3600000 && this.citizens.length > 0) {
      this.lastCitizenOfDayUpdate = now;
      
      // Remove previous highlight
      const prevCitizen = this.citizens.find(c => c.id === this.citizenOfTheDay);
      if (prevCitizen) {
        prevCitizen.isHighlighted = false;
      }
      
      // Select new citizen of the day
      const randomCitizen = this.citizens[Math.floor(Math.random() * this.citizens.length)];
      this.citizenOfTheDay = randomCitizen.id;
      
      this.addEvent({
        id: `cotd_${now}`,
        message: `⭐ Житель дня: ${randomCitizen.username}!`,
        timestamp: now,
        type: 'milestone'
      });
    }
  }
  
  private addEvent(event: GameEvent) {
    this.events.unshift(event);
    if (this.events.length > 15) {
      this.events.pop();
    }
    this.onEventUpdate?.(this.events);
  }
  
  private updateStats() {
    const level = this.getCurrentLevel(this.followers.length);
    const levelData = CITY_LEVELS[level];
    const nextLevelData = CITY_LEVELS[level + 1];
    
    const progress = nextLevelData
      ? (this.followers.length - levelData.minFollowers) / (nextLevelData.minFollowers - levelData.minFollowers)
      : 1;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayJoined = this.followers.filter(f => new Date(f.joinedAt) >= today).length;
    
    this.onStatsUpdate?.({
      citizens: this.followers.length,
      level: level + 1,
      levelName: levelData.name,
      progress: Math.min(1, progress),
      nextLevel: nextLevelData?.minFollowers || levelData.minFollowers,
      todayJoined
    });
  }
  
  setOnStatsUpdate(callback: typeof this.onStatsUpdate) {
    this.onStatsUpdate = callback;
    this.updateStats();
  }
  
  setOnEventUpdate(callback: typeof this.onEventUpdate) {
    this.onEventUpdate = callback;
  }
  
  setOnAchievementUnlock(callback: typeof this.onAchievementUnlock) {
    this.onAchievementUnlock = callback;
  }
  
  setOnWeatherChange(callback: typeof this.onWeatherChange) {
    this.onWeatherChange = callback;
  }
  
  getAchievements(): Achievement[] {
    return this.achievements;
  }
  
  getWeather(): WeatherState {
    return this.weather;
  }
  
  // Trigger weather manually
  triggerWeather(type: 'rain' | 'snow' | 'storm') {
    this.weather.type = type;
    this.weather.intensity = 0.7 + Math.random() * 0.3;
    this.weather.duration = 20000 + Math.random() * 40000;
    this.onWeatherChange?.(this.weather);
  }
  
  searchCitizen(username: string): boolean {
    const searchLower = username.toLowerCase().trim();
    if (!searchLower) {
      if (this.highlightedCitizen) {
        this.highlightedCitizen.isHighlighted = false;
        this.highlightedCitizen = null;
      }
      this.searchResult = null;
      return false;
    }
    
    const citizen = this.citizens.find(c => 
      c.username.toLowerCase().includes(searchLower)
    );
    
    if (citizen) {
      this.highlightCitizen(citizen);
      this.searchResult = { found: true, username: citizen.username };
      return true;
    } else {
      if (this.highlightedCitizen) {
        this.highlightedCitizen.isHighlighted = false;
        this.highlightedCitizen = null;
      }
      this.searchResult = { found: false, username: searchLower };
      return false;
    }
  }
  
  private highlightCitizen(citizen: Citizen) {
    if (this.highlightedCitizen) {
      this.highlightedCitizen.isHighlighted = false;
    }
    
    citizen.isHighlighted = true;
    citizen.isJumping = true;
    this.highlightedCitizen = citizen;
    
    const { screenX, screenY } = toIso(citizen.x, citizen.y);
    this.targetCameraX = this.width / 2 - screenX;
    this.targetCameraY = this.height / 2 - screenY;
    this.targetZoom = 1.5;
  }
  
  getSearchResult() {
    return this.searchResult;
  }
  
  getCitizenOfTheDay(): string | null {
    return this.citizenOfTheDay;
  }
  
  update(timestamp: number) {
    this.deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;
    
    // Time of day
    this.timeOfDay = (this.timeOfDay + 0.00001 * this.deltaTime) % 1;
    
    // Camera
    this.cameraX += (this.targetCameraX - this.cameraX) * 0.1;
    this.cameraY += (this.targetCameraY - this.cameraY) * 0.1;
    this.zoom += (this.targetZoom - this.zoom) * 0.1;
    
    // Weather
    this.weather = updateWeather(this.weather, this.width, this.height, this.deltaTime);
    
    // Clouds
    for (const cloud of this.clouds) {
      cloud.x += cloud.speed;
      if (cloud.x > this.width + 100) {
        cloud.x = -100;
        cloud.y = Math.random() * 100 + 30;
      }
    }
    
    // Buildings
    for (const building of this.buildings) {
      if (building.isConstructing && building.constructionProgress < 1) {
        building.constructionProgress += 0.005;
        if (building.constructionProgress >= 1) {
          building.constructionProgress = 1;
          building.isConstructing = false;
        }
      }
      building.smokeTimer += this.deltaTime;
      
      if (Math.random() < 0.001) {
        building.lightOn = !building.lightOn;
      }
    }
    
    // Citizens
    for (const citizen of this.citizens) {
      citizen.animFrame++;
      citizen.stateTimer--;
      
      // Citizen of the day glow
      if (citizen.id === this.citizenOfTheDay) {
        citizen.isHighlighted = true;
      }
      
      if (citizen.isJumping) {
        citizen.jumpOffset = Math.abs(Math.sin(citizen.animFrame / 5)) * 20;
        if (citizen.animFrame % 60 === 0) {
          citizen.isJumping = false;
          citizen.jumpOffset = 0;
        }
      }
      
      if (citizen.stateTimer <= 0) {
        const states: Citizen['state'][] = ['walking', 'idle', 'working', 'waving'];
        citizen.state = states[Math.floor(Math.random() * states.length)];
        citizen.stateTimer = 100 + Math.random() * 200;
        
        if (citizen.state === 'walking') {
          citizen.targetX = MAP_SIZE / 2 + (Math.random() - 0.5) * 12;
          citizen.targetY = MAP_SIZE / 2 + (Math.random() - 0.5) * 12;
        }
      }
      
      if (citizen.state === 'walking') {
        const dx = citizen.targetX - citizen.x;
        const dy = citizen.targetY - citizen.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0.1) {
          citizen.x += (dx / dist) * citizen.speed;
          citizen.y += (dy / dist) * citizen.speed;
          citizen.direction = dx > 0 ? 1 : -1;
        } else {
          citizen.state = 'idle';
        }
      }
    }
    
    // Vehicles
    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      const alive = updateVehicle(this.vehicles[i], MAP_SIZE);
      if (!alive) {
        const level = this.getCurrentLevel(this.followers.length);
        this.vehicles[i] = createVehicle(this.vehicleIdCounter++, level, MAP_SIZE);
      }
    }
    
    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.3;
      p.life--;
      
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
    
    // Random events
    if (Math.random() < 0.0001 && this.followers.length > 10) {
      const bonus = Math.floor(Math.random() * 20) + 5;
      this.addEvent({
        id: `event_${Date.now()}`,
        message: `📱 Пост набрал +${bonus} новых жителей!`,
        timestamp: Date.now(),
        type: 'join'
      });
    }
  }
  
  render() {
    const ctx = this.ctx;
    const level = this.getCurrentLevel(this.followers.length);
    const levelData = CITY_LEVELS[level];
    
    // Sky
    let skyTop: string, skyBottom: string;
    if (this.timeOfDay < 0.25) {
      const t = this.timeOfDay / 0.25;
      skyTop = this.lerpColor('#0f172a', '#f97316', t);
      skyBottom = this.lerpColor('#1e293b', '#fef08a', t);
    } else if (this.timeOfDay < 0.5) {
      const t = (this.timeOfDay - 0.25) / 0.25;
      skyTop = this.lerpColor('#f97316', '#38bdf8', t);
      skyBottom = this.lerpColor('#fef08a', '#e0f2fe', t);
    } else if (this.timeOfDay < 0.75) {
      const t = (this.timeOfDay - 0.5) / 0.25;
      skyTop = this.lerpColor('#38bdf8', '#f97316', t);
      skyBottom = this.lerpColor('#e0f2fe', '#fbbf24', t);
    } else {
      const t = (this.timeOfDay - 0.75) / 0.25;
      skyTop = this.lerpColor('#f97316', '#0f172a', t);
      skyBottom = this.lerpColor('#fbbf24', '#1e293b', t);
    }
    
    const skyGradient = ctx.createLinearGradient(0, 0, 0, this.height);
    skyGradient.addColorStop(0, skyTop);
    skyGradient.addColorStop(1, skyBottom);
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, this.width, this.height);
    
    // Clouds
    for (const cloud of this.clouds) {
      drawCloud(ctx, cloud);
    }
    
    // Zoom transform
    ctx.save();
    ctx.translate(this.width / 2, this.height / 2);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.width / 2, -this.height / 2);
    
    // River tiles first (under everything)
    for (const river of this.riverTiles) {
      drawRiverTile(ctx, river, this.cameraX, this.cameraY, Date.now());
    }
    
    // Regular tiles
    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        // Skip river tiles
        const isRiver = this.riverTiles.some(r => r.gridX === x && r.gridY === y);
        if (isRiver) continue;
        
        const isPath = this.pathTiles.has(`${x},${y}`);
        drawTile(ctx, x, y, levelData.bgColor, this.cameraX, this.cameraY, isPath);
      }
    }
    
    // Bridges over river
    for (const bridge of this.bridges) {
      drawBridge(ctx, bridge, this.cameraX, this.cameraY);
    }
    
    // Renderables (buildings, citizens, vehicles, decorations)
    const renderables: Array<{ type: 'building' | 'citizen' | 'vehicle' | 'decoration'; data: Building | Citizen | Vehicle | MapDecoration; y: number }> = [];
    
    for (const building of this.buildings) {
      renderables.push({ type: 'building', data: building, y: building.gridY });
    }
    
    for (const citizen of this.citizens) {
      renderables.push({ type: 'citizen', data: citizen, y: citizen.y });
    }
    
    for (const vehicle of this.vehicles) {
      renderables.push({ type: 'vehicle', data: vehicle, y: vehicle.y });
    }
    
    for (const decoration of this.decorations) {
      renderables.push({ type: 'decoration', data: decoration, y: decoration.gridY });
    }
    
    renderables.sort((a, b) => a.y - b.y);
    
    for (const r of renderables) {
      if (r.type === 'building') {
        drawBuilding(ctx, r.data as Building, this.cameraX, this.cameraY, this.timeOfDay);
      } else if (r.type === 'citizen') {
        drawCitizen(ctx, r.data as Citizen, this.cameraX, this.cameraY, this.zoom > 1.2);
      } else if (r.type === 'vehicle') {
        drawVehicle(ctx, r.data as Vehicle, this.cameraX, this.cameraY);
      } else if (r.type === 'decoration') {
        drawDecoration(ctx, r.data as MapDecoration, this.cameraX, this.cameraY, Date.now());
      }
    }
    
    ctx.restore();
    
    // Weather
    renderWeather(ctx, this.weather, this.width, this.height);
    
    // Particles
    for (const particle of this.particles) {
      drawParticle(ctx, particle);
    }
  }
  
  private lerpColor(color1: string, color2: string, t: number): string {
    const c1 = this.hexToRgb(color1);
    const c2 = this.hexToRgb(color2);
    if (!c1 || !c2) return color1;
    
    const r = Math.round(c1.r + (c2.r - c1.r) * t);
    const g = Math.round(c1.g + (c2.g - c1.g) * t);
    const b = Math.round(c1.b + (c2.b - c1.b) * t);
    
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : null;
  }
  
  destroy() {
    // Cleanup
  }
}
