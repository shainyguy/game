export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement: number;
  type: 'followers' | 'buildings' | 'days' | 'special';
  unlocked: boolean;
  unlockedAt?: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_10',
    title: 'Первые шаги',
    description: 'Собери 10 подписчиков',
    icon: '👶',
    requirement: 10,
    type: 'followers',
    unlocked: false
  },
  {
    id: 'first_50',
    title: 'Растущее сообщество',
    description: 'Собери 50 подписчиков',
    icon: '🌱',
    requirement: 50,
    type: 'followers',
    unlocked: false
  },
  {
    id: 'first_100',
    title: 'Первая сотня',
    description: 'Собери 100 подписчиков',
    icon: '💯',
    requirement: 100,
    type: 'followers',
    unlocked: false
  },
  {
    id: 'first_500',
    title: 'Полтысячи!',
    description: 'Собери 500 подписчиков',
    icon: '🏘️',
    requirement: 500,
    type: 'followers',
    unlocked: false
  },
  {
    id: 'first_1000',
    title: 'Тысячник',
    description: 'Собери 1000 подписчиков',
    icon: '🏙️',
    requirement: 1000,
    type: 'followers',
    unlocked: false
  },
  {
    id: 'first_5000',
    title: 'IT-магнат',
    description: 'Собери 5000 подписчиков',
    icon: '💎',
    requirement: 5000,
    type: 'followers',
    unlocked: false
  },
  {
    id: 'first_10000',
    title: 'Легенда',
    description: 'Собери 10000 подписчиков',
    icon: '👑',
    requirement: 10000,
    type: 'followers',
    unlocked: false
  },
  {
    id: 'daily_10',
    title: 'Горячий день',
    description: '10 новых подписчиков за день',
    icon: '🔥',
    requirement: 10,
    type: 'special',
    unlocked: false
  },
  {
    id: 'daily_50',
    title: 'Вирусный рост',
    description: '50 новых подписчиков за день',
    icon: '🚀',
    requirement: 50,
    type: 'special',
    unlocked: false
  }
];

export function checkAchievements(
  achievements: Achievement[],
  followerCount: number,
  todayJoined: number
): { updated: Achievement[]; newUnlocks: Achievement[] } {
  const newUnlocks: Achievement[] = [];
  
  const updated = achievements.map(ach => {
    if (ach.unlocked) return ach;
    
    let shouldUnlock = false;
    
    if (ach.type === 'followers' && followerCount >= ach.requirement) {
      shouldUnlock = true;
    } else if (ach.id === 'daily_10' && todayJoined >= 10) {
      shouldUnlock = true;
    } else if (ach.id === 'daily_50' && todayJoined >= 50) {
      shouldUnlock = true;
    }
    
    if (shouldUnlock) {
      newUnlocks.push({ ...ach, unlocked: true, unlockedAt: Date.now() });
      return { ...ach, unlocked: true, unlockedAt: Date.now() };
    }
    
    return ach;
  });
  
  return { updated, newUnlocks };
}
