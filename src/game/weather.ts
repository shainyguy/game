export type WeatherType = 'clear' | 'rain' | 'snow' | 'storm' | 'rainbow';

export interface WeatherParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

export interface WeatherState {
  type: WeatherType;
  particles: WeatherParticle[];
  intensity: number;
  duration: number;
  rainbowOpacity: number;
  lightningTimer: number;
  lightningFlash: number;
}

export function createWeatherState(): WeatherState {
  return {
    type: 'clear',
    particles: [],
    intensity: 0,
    duration: 0,
    rainbowOpacity: 0,
    lightningTimer: 0,
    lightningFlash: 0
  };
}

export function updateWeather(
  state: WeatherState,
  width: number,
  height: number,
  deltaTime: number
): WeatherState {
  const newState = { ...state };
  
  // Decrease duration
  if (newState.duration > 0) {
    newState.duration -= deltaTime;
    
    if (newState.duration <= 0) {
      // Weather ended
      if (newState.type === 'rain' || newState.type === 'storm') {
        // Chance for rainbow after rain
        if (Math.random() > 0.5) {
          newState.type = 'rainbow';
          newState.duration = 10000;
          newState.rainbowOpacity = 0;
        } else {
          newState.type = 'clear';
        }
      } else {
        newState.type = 'clear';
      }
      newState.particles = [];
    }
  } else {
    // Random weather change
    if (Math.random() < 0.0001) {
      const weathers: WeatherType[] = ['rain', 'snow', 'storm'];
      newState.type = weathers[Math.floor(Math.random() * weathers.length)];
      newState.intensity = 0.5 + Math.random() * 0.5;
      newState.duration = 30000 + Math.random() * 60000;
    }
  }
  
  // Update particles based on weather type
  if (newState.type === 'rain' || newState.type === 'storm') {
    // Spawn rain particles
    const spawnCount = Math.floor(newState.intensity * 5);
    for (let i = 0; i < spawnCount; i++) {
      if (newState.particles.length < 200) {
        newState.particles.push({
          x: Math.random() * width * 1.5 - width * 0.25,
          y: -20,
          vx: newState.type === 'storm' ? -3 - Math.random() * 2 : -1,
          vy: 12 + Math.random() * 5,
          size: 2 + Math.random() * 2,
          opacity: 0.4 + Math.random() * 0.4
        });
      }
    }
    
    // Lightning for storm
    if (newState.type === 'storm') {
      newState.lightningTimer -= deltaTime;
      if (newState.lightningTimer <= 0) {
        newState.lightningFlash = 1;
        newState.lightningTimer = 2000 + Math.random() * 5000;
      }
      newState.lightningFlash *= 0.9;
    }
  } else if (newState.type === 'snow') {
    // Spawn snow particles
    const spawnCount = Math.floor(newState.intensity * 3);
    for (let i = 0; i < spawnCount; i++) {
      if (newState.particles.length < 150) {
        newState.particles.push({
          x: Math.random() * width * 1.2 - width * 0.1,
          y: -10,
          vx: (Math.random() - 0.5) * 2,
          vy: 1 + Math.random() * 2,
          size: 3 + Math.random() * 4,
          opacity: 0.6 + Math.random() * 0.4
        });
      }
    }
  } else if (newState.type === 'rainbow') {
    newState.rainbowOpacity = Math.min(1, newState.rainbowOpacity + 0.01);
  }
  
  // Update particle positions
  newState.particles = newState.particles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    
    // Snow sway
    if (newState.type === 'snow') {
      p.vx += (Math.random() - 0.5) * 0.1;
      p.vx = Math.max(-2, Math.min(2, p.vx));
    }
    
    return p.y < height + 20 && p.x > -50 && p.x < width + 50;
  });
  
  return newState;
}

export function renderWeather(
  ctx: CanvasRenderingContext2D,
  state: WeatherState,
  width: number,
  height: number
) {
  if (state.type === 'clear') return;
  
  ctx.save();
  
  // Lightning flash
  if (state.lightningFlash > 0.1) {
    ctx.fillStyle = `rgba(255, 255, 255, ${state.lightningFlash * 0.3})`;
    ctx.fillRect(0, 0, width, height);
  }
  
  // Rain
  if (state.type === 'rain' || state.type === 'storm') {
    ctx.strokeStyle = '#7dd3fc';
    ctx.lineWidth = 1.5;
    
    for (const p of state.particles) {
      ctx.globalAlpha = p.opacity;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.vx * 2, p.y + p.vy * 2);
      ctx.stroke();
    }
    
    // Puddle reflections at bottom
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#38bdf8';
    for (let i = 0; i < 10; i++) {
      const px = (i / 10) * width;
      const psize = 30 + Math.sin(Date.now() / 500 + i) * 10;
      ctx.beginPath();
      ctx.ellipse(px, height - 50, psize, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Snow
  if (state.type === 'snow') {
    ctx.fillStyle = '#fff';
    
    for (const p of state.particles) {
      ctx.globalAlpha = p.opacity;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Snowflake sparkle
      if (Math.random() > 0.98) {
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(p.x - p.size, p.y);
        ctx.lineTo(p.x + p.size, p.y);
        ctx.moveTo(p.x, p.y - p.size);
        ctx.lineTo(p.x, p.y + p.size);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
    
    // Snow accumulation at bottom
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let i = 0; i <= width; i += 20) {
      const h = 10 + Math.sin(i / 30) * 5 + Math.sin(i / 50) * 3;
      ctx.lineTo(i, height - h);
    }
    ctx.lineTo(width, height);
    ctx.fill();
  }
  
  // Rainbow
  if (state.type === 'rainbow') {
    ctx.globalAlpha = state.rainbowOpacity * 0.4;
    
    const rainbowColors = [
      '#ef4444', '#f97316', '#fbbf24', '#22c55e', '#3b82f6', '#6366f1', '#a855f7'
    ];
    
    const centerX = width * 0.7;
    const centerY = height * 0.8;
    const radius = width * 0.6;
    
    for (let i = 0; i < rainbowColors.length; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius - i * 15, Math.PI, 0);
      ctx.strokeStyle = rainbowColors[i];
      ctx.lineWidth = 12;
      ctx.stroke();
    }
  }
  
  ctx.restore();
}
