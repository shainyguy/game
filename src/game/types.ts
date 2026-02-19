export interface Follower {
  id: string;
  username: string;
  joinedAt: string;
  avatar?: string; // URL к аватарке
}

export interface Citizen {
  id: string;
  username: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  state: 'walking' | 'idle' | 'working' | 'waving' | 'entering';
  stateTimer: number;
  animFrame: number;
  color: string;
  direction: number;
  speed: number;
  homeBuilding?: number;
  scale: number;
  isHighlighted: boolean;
  jumpOffset: number;
  isJumping: boolean;
  avatar?: string;
  avatarLoaded?: HTMLImageElement;
}

export interface MapDecoration {
  type: 'tree' | 'bush' | 'flower' | 'rock' | 'lamp' | 'bench' | 'fountain';
  gridX: number;
  gridY: number;
  variant: number;
}

export interface RiverTile {
  gridX: number;
  gridY: number;
  flowDirection: 'horizontal' | 'vertical';
}

export interface Bridge {
  gridX: number;
  gridY: number;
  direction: 'horizontal' | 'vertical';
}

export interface Building {
  id: number;
  type: BuildingType;
  gridX: number;
  gridY: number;
  width: number;
  height: number;
  constructionProgress: number;
  isConstructing: boolean;
  smokeTimer: number;
  lightOn: boolean;
}

export type BuildingType = 
  | 'tent' 
  | 'campfire'
  | 'house' 
  | 'tower' 
  | 'skyscraper' 
  | 'futuristic'
  | 'park'
  | 'it_center'
  | 'plaza'
  | 'billboard';

export interface CityLevel {
  name: string;
  minFollowers: number;
  buildings: BuildingType[];
  bgColor: string;
  description: string;
}

export const CITY_LEVELS: CityLevel[] = [
  { name: 'Палатка', minFollowers: 0, buildings: ['tent'], bgColor: '#4ade80', description: 'Начало пути' },
  { name: 'Лагерь', minFollowers: 100, buildings: ['tent', 'campfire', 'tent'], bgColor: '#22c55e', description: 'Первые последователи' },
  { name: 'Посёлок', minFollowers: 500, buildings: ['house', 'house', 'park', 'house', 'billboard'], bgColor: '#16a34a', description: 'Растущее сообщество' },
  { name: 'Город', minFollowers: 1000, buildings: ['house', 'tower', 'plaza', 'house', 'it_center', 'tower'], bgColor: '#15803d', description: 'Цифровой город' },
  { name: 'Мегаполис', minFollowers: 5000, buildings: ['tower', 'skyscraper', 'it_center', 'plaza', 'skyscraper', 'tower', 'park'], bgColor: '#166534', description: 'Технологический хаб' },
  { name: 'Футуро-город', minFollowers: 10000, buildings: ['futuristic', 'futuristic', 'skyscraper', 'it_center', 'futuristic', 'plaza', 'futuristic'], bgColor: '#14532d', description: 'Город будущего' },
];

export interface Cloud {
  x: number;
  y: number;
  speed: number;
  scale: number;
  opacity: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export interface GameEvent {
  id: string;
  message: string;
  timestamp: number;
  type: 'join' | 'level' | 'milestone';
}
