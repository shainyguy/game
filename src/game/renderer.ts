import { Building, Citizen, Cloud, Particle, BuildingType, MapDecoration, RiverTile, Bridge } from './types';

const TILE_WIDTH = 64;
const TILE_HEIGHT = 32;

export function toIso(x: number, y: number): { screenX: number; screenY: number } {
  return {
    screenX: (x - y) * (TILE_WIDTH / 2),
    screenY: (x + y) * (TILE_HEIGHT / 2),
  };
}

export function fromIso(screenX: number, screenY: number): { x: number; y: number } {
  return {
    x: (screenX / (TILE_WIDTH / 2) + screenY / (TILE_HEIGHT / 2)) / 2,
    y: (screenY / (TILE_HEIGHT / 2) - screenX / (TILE_WIDTH / 2)) / 2,
  };
}

export function drawTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  offsetX: number,
  offsetY: number,
  isPath: boolean = false
) {
  const { screenX, screenY } = toIso(x, y);
  const sx = screenX + offsetX;
  const sy = screenY + offsetY;

  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(sx + TILE_WIDTH / 2, sy + TILE_HEIGHT / 2);
  ctx.lineTo(sx, sy + TILE_HEIGHT);
  ctx.lineTo(sx - TILE_WIDTH / 2, sy + TILE_HEIGHT / 2);
  ctx.closePath();

  const gradient = ctx.createLinearGradient(sx, sy, sx, sy + TILE_HEIGHT);
  if (isPath) {
    gradient.addColorStop(0, '#d4a574');
    gradient.addColorStop(1, '#c4956a');
  } else {
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, shadeColor(color, -15));
  }
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.strokeStyle = isPath ? '#b8956a' : shadeColor(color, -25);
  ctx.lineWidth = 1;
  ctx.stroke();
}

function shadeColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

export function drawBuilding(
  ctx: CanvasRenderingContext2D,
  building: Building,
  offsetX: number,
  offsetY: number,
  timeOfDay: number
) {
  const { screenX, screenY } = toIso(building.gridX, building.gridY);
  const sx = screenX + offsetX;
  const sy = screenY + offsetY;

  const progress = building.constructionProgress;
  const scale = progress;

  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(1, scale);
  ctx.translate(-sx, -sy);

  // Draw shadow
  ctx.globalAlpha = 0.3 * progress;
  drawBuildingShadow(ctx, sx, sy, building.type);
  ctx.globalAlpha = 1;

  // Draw building based on type
  switch (building.type) {
    case 'tent':
      drawTent(ctx, sx, sy, progress);
      break;
    case 'campfire':
      drawCampfire(ctx, sx, sy, progress, Date.now());
      break;
    case 'house':
      drawHouse(ctx, sx, sy, progress, timeOfDay, building.lightOn);
      break;
    case 'tower':
      drawTower(ctx, sx, sy, progress, timeOfDay, building.lightOn);
      break;
    case 'skyscraper':
      drawSkyscraper(ctx, sx, sy, progress, timeOfDay, building.lightOn);
      break;
    case 'futuristic':
      drawFuturistic(ctx, sx, sy, progress, timeOfDay);
      break;
    case 'park':
      drawPark(ctx, sx, sy, progress);
      break;
    case 'it_center':
      drawITCenter(ctx, sx, sy, progress, timeOfDay);
      break;
    case 'plaza':
      drawPlaza(ctx, sx, sy, progress);
      break;
    case 'billboard':
      drawBillboard(ctx, sx, sy, progress);
      break;
  }

  // Draw smoke
  if ((building.type === 'house' || building.type === 'campfire') && progress >= 1) {
    drawSmoke(ctx, sx, sy - 60, building.smokeTimer);
  }

  ctx.restore();
}

function drawBuildingShadow(ctx: CanvasRenderingContext2D, x: number, y: number, _type: BuildingType) {
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(x + 20, y + 20, 30, 15, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawTent(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number) {
  const h = 50 * progress;
  
  // Tent body
  ctx.beginPath();
  ctx.moveTo(x, y - h);
  ctx.lineTo(x - 25, y + 10);
  ctx.lineTo(x + 25, y + 10);
  ctx.closePath();
  
  const gradient = ctx.createLinearGradient(x, y - h, x, y + 10);
  gradient.addColorStop(0, '#f59e0b');
  gradient.addColorStop(1, '#d97706');
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Tent entrance
  ctx.beginPath();
  ctx.moveTo(x, y + 10);
  ctx.lineTo(x - 8, y - 5);
  ctx.lineTo(x + 8, y - 5);
  ctx.closePath();
  ctx.fillStyle = '#78350f';
  ctx.fill();

  // Pole
  ctx.beginPath();
  ctx.moveTo(x, y - h);
  ctx.lineTo(x, y - h - 10);
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Flag
  ctx.beginPath();
  ctx.moveTo(x, y - h - 10);
  ctx.lineTo(x + 15, y - h - 5);
  ctx.lineTo(x, y - h);
  ctx.closePath();
  ctx.fillStyle = '#ef4444';
  ctx.fill();
}

function drawCampfire(ctx: CanvasRenderingContext2D, x: number, y: number, _progress: number, time: number) {
  // Logs
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x - 20, y - 5, 40, 8);
  ctx.fillRect(x - 15, y - 10, 30, 8);

  // Fire
  const flicker = Math.sin(time / 100) * 3;
  const gradient = ctx.createRadialGradient(x, y - 20, 0, x, y - 20, 25);
  gradient.addColorStop(0, '#fef08a');
  gradient.addColorStop(0.5, '#f97316');
  gradient.addColorStop(1, '#dc2626');
  
  ctx.beginPath();
  ctx.moveTo(x - 15, y - 5);
  ctx.quadraticCurveTo(x - 10 + flicker, y - 35, x, y - 40 - flicker);
  ctx.quadraticCurveTo(x + 10 - flicker, y - 35, x + 15, y - 5);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // Glow
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.arc(x, y - 15, 35, 0, Math.PI * 2);
  ctx.fillStyle = '#fbbf24';
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawHouse(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number, timeOfDay: number, lightOn: boolean) {
  const h = 60 * progress;
  
  // House body - left face
  ctx.beginPath();
  ctx.moveTo(x - 30, y);
  ctx.lineTo(x - 30, y - h + 20);
  ctx.lineTo(x, y - h - 10);
  ctx.lineTo(x, y + 15);
  ctx.closePath();
  ctx.fillStyle = '#fbbf24';
  ctx.fill();
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 2;
  ctx.stroke();

  // House body - right face
  ctx.beginPath();
  ctx.moveTo(x + 30, y);
  ctx.lineTo(x + 30, y - h + 20);
  ctx.lineTo(x, y - h - 10);
  ctx.lineTo(x, y + 15);
  ctx.closePath();
  ctx.fillStyle = '#f59e0b';
  ctx.fill();
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Roof
  ctx.beginPath();
  ctx.moveTo(x, y - h - 30);
  ctx.lineTo(x - 35, y - h + 15);
  ctx.lineTo(x, y - h);
  ctx.lineTo(x + 35, y - h + 15);
  ctx.closePath();
  ctx.fillStyle = '#dc2626';
  ctx.fill();
  ctx.strokeStyle = '#b91c1c';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Window
  const windowGlow = lightOn && timeOfDay > 0.7 ? '#fef08a' : '#87ceeb';
  ctx.fillStyle = windowGlow;
  ctx.fillRect(x + 8, y - h + 30, 15, 15);
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 8, y - h + 30, 15, 15);

  // Door
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x - 20, y - 20, 15, 25);
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 20, y - 20, 15, 25);

  // Chimney
  ctx.fillStyle = '#7c2d12';
  ctx.fillRect(x + 15, y - h - 15, 10, 20);
}

function drawTower(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number, timeOfDay: number, lightOn: boolean) {
  const h = 100 * progress;
  
  // Tower base - left
  ctx.beginPath();
  ctx.moveTo(x - 25, y + 10);
  ctx.lineTo(x - 20, y - h + 30);
  ctx.lineTo(x, y - h + 20);
  ctx.lineTo(x, y + 15);
  ctx.closePath();
  ctx.fillStyle = '#6366f1';
  ctx.fill();
  ctx.strokeStyle = '#4338ca';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Tower base - right
  ctx.beginPath();
  ctx.moveTo(x + 25, y + 10);
  ctx.lineTo(x + 20, y - h + 30);
  ctx.lineTo(x, y - h + 20);
  ctx.lineTo(x, y + 15);
  ctx.closePath();
  ctx.fillStyle = '#818cf8';
  ctx.fill();
  ctx.strokeStyle = '#4338ca';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Tower top
  ctx.beginPath();
  ctx.moveTo(x, y - h - 15);
  ctx.lineTo(x - 25, y - h + 25);
  ctx.lineTo(x, y - h + 15);
  ctx.lineTo(x + 25, y - h + 25);
  ctx.closePath();
  ctx.fillStyle = '#4f46e5';
  ctx.fill();
  ctx.stroke();

  // Windows
  const windowColor = lightOn && timeOfDay > 0.7 ? '#fef08a' : '#c7d2fe';
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = windowColor;
    ctx.fillRect(x + 5, y - 25 - i * 20, 12, 10);
    ctx.strokeStyle = '#4338ca';
    ctx.strokeRect(x + 5, y - 25 - i * 20, 12, 10);
  }

  // Antenna
  ctx.beginPath();
  ctx.moveTo(x, y - h - 15);
  ctx.lineTo(x, y - h - 35);
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Blinking light
  if (Math.sin(Date.now() / 500) > 0) {
    ctx.beginPath();
    ctx.arc(x, y - h - 35, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
  }
}

function drawSkyscraper(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number, _timeOfDay: number, lightOn: boolean) {
  const h = 140 * progress;
  
  // Main building - left
  ctx.beginPath();
  ctx.moveTo(x - 35, y + 10);
  ctx.lineTo(x - 30, y - h + 20);
  ctx.lineTo(x, y - h + 10);
  ctx.lineTo(x, y + 15);
  ctx.closePath();
  const gradLeft = ctx.createLinearGradient(x - 35, y, x, y);
  gradLeft.addColorStop(0, '#0ea5e9');
  gradLeft.addColorStop(1, '#0284c7');
  ctx.fillStyle = gradLeft;
  ctx.fill();
  ctx.strokeStyle = '#0369a1';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Main building - right
  ctx.beginPath();
  ctx.moveTo(x + 35, y + 10);
  ctx.lineTo(x + 30, y - h + 20);
  ctx.lineTo(x, y - h + 10);
  ctx.lineTo(x, y + 15);
  ctx.closePath();
  const gradRight = ctx.createLinearGradient(x, y, x + 35, y);
  gradRight.addColorStop(0, '#0284c7');
  gradRight.addColorStop(1, '#38bdf8');
  ctx.fillStyle = gradRight;
  ctx.fill();
  ctx.strokeStyle = '#0369a1';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Roof
  ctx.beginPath();
  ctx.moveTo(x, y - h - 10);
  ctx.lineTo(x - 35, y - h + 15);
  ctx.lineTo(x, y - h + 5);
  ctx.lineTo(x + 35, y - h + 15);
  ctx.closePath();
  ctx.fillStyle = '#0c4a6e';
  ctx.fill();
  ctx.stroke();

  // Windows grid
  const windowColor = lightOn ? '#fef08a' : '#e0f2fe';
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 2; col++) {
      ctx.fillStyle = Math.random() > 0.3 ? windowColor : '#1e3a5f';
      ctx.fillRect(x + 5 + col * 15, y - 30 - row * 18, 10, 12);
    }
  }

  // Spire
  ctx.beginPath();
  ctx.moveTo(x, y - h - 10);
  ctx.lineTo(x, y - h - 40);
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 4;
  ctx.stroke();
}

function drawFuturistic(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number, _timeOfDay: number) {
  const h = 120 * progress;
  const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
  
  // Dome base
  ctx.beginPath();
  ctx.ellipse(x, y, 40, 20, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#1e1b4b';
  ctx.fill();
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Dome
  ctx.beginPath();
  ctx.ellipse(x, y - h / 2, 35, h / 2, 0, Math.PI, 0);
  const domeGrad = ctx.createLinearGradient(x - 35, y, x + 35, y);
  domeGrad.addColorStop(0, '#312e81');
  domeGrad.addColorStop(0.5, '#4338ca');
  domeGrad.addColorStop(1, '#312e81');
  ctx.fillStyle = domeGrad;
  ctx.fill();
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Glowing rings
  ctx.globalAlpha = pulse;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(x, y - 20 - i * 25, 30 - i * 5, 10 - i * 2, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#a5b4fc';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Top orb
  ctx.beginPath();
  ctx.arc(x, y - h - 10, 12, 0, Math.PI * 2);
  const orbGrad = ctx.createRadialGradient(x, y - h - 10, 0, x, y - h - 10, 12);
  orbGrad.addColorStop(0, '#f0abfc');
  orbGrad.addColorStop(1, '#a855f7');
  ctx.fillStyle = orbGrad;
  ctx.fill();

  // Energy beam (occasional)
  if (Math.sin(Date.now() / 1000) > 0.8) {
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y - h - 22);
    ctx.lineTo(x - 5, y - h - 100);
    ctx.lineTo(x + 5, y - h - 100);
    ctx.closePath();
    ctx.fillStyle = '#c4b5fd';
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawPark(ctx: CanvasRenderingContext2D, x: number, y: number, _progress: number) {
  // Grass patch
  ctx.beginPath();
  ctx.ellipse(x, y + 5, 35, 18, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#22c55e';
  ctx.fill();
  ctx.strokeStyle = '#16a34a';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Tree trunk
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x - 5, y - 40, 10, 45);

  // Tree foliage
  ctx.beginPath();
  ctx.arc(x, y - 50, 30, 0, Math.PI * 2);
  const leafGrad = ctx.createRadialGradient(x, y - 50, 0, x, y - 50, 30);
  leafGrad.addColorStop(0, '#4ade80');
  leafGrad.addColorStop(1, '#16a34a');
  ctx.fillStyle = leafGrad;
  ctx.fill();
  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Flowers
  const flowerColors = ['#f472b6', '#fbbf24', '#f87171'];
  for (let i = 0; i < 5; i++) {
    const fx = x - 25 + Math.sin(i * 1.5) * 25;
    const fy = y - 5 + Math.cos(i * 1.2) * 10;
    ctx.beginPath();
    ctx.arc(fx, fy, 4, 0, Math.PI * 2);
    ctx.fillStyle = flowerColors[i % 3];
    ctx.fill();
  }

  // Bench
  ctx.fillStyle = '#92400e';
  ctx.fillRect(x + 15, y - 5, 20, 4);
  ctx.fillRect(x + 17, y - 5, 3, 10);
  ctx.fillRect(x + 30, y - 5, 3, 10);
}

function drawITCenter(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number, _timeOfDay: number) {
  const h = 80 * progress;
  
  // Modern building - glass effect
  ctx.beginPath();
  ctx.moveTo(x - 40, y + 10);
  ctx.lineTo(x - 35, y - h);
  ctx.lineTo(x + 35, y - h);
  ctx.lineTo(x + 40, y + 10);
  ctx.closePath();
  const glassGrad = ctx.createLinearGradient(x - 40, y, x + 40, y);
  glassGrad.addColorStop(0, '#0f172a');
  glassGrad.addColorStop(0.5, '#1e293b');
  glassGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = glassGrad;
  ctx.fill();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Glass panels with cyan glow
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    ctx.strokeRect(x - 30 + i * 18, y - h + 10, 14, h - 25);
  }

  // Logo/Sign
  ctx.fillStyle = '#22d3ee';
  ctx.font = 'bold 10px Nunito';
  ctx.textAlign = 'center';
  ctx.fillText('IT', x, y - h + 50);

  // Roof with satellite
  ctx.fillStyle = '#334155';
  ctx.fillRect(x - 38, y - h - 5, 76, 8);
  
  ctx.beginPath();
  ctx.arc(x + 20, y - h - 15, 10, 0, Math.PI, true);
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Screen glow effect
  ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 500) * 0.1;
  ctx.fillStyle = '#22d3ee';
  ctx.fillRect(x - 28, y - h + 15, 56, h - 30);
  ctx.globalAlpha = 1;
}

function drawPlaza(ctx: CanvasRenderingContext2D, x: number, y: number, _progress: number) {
  // Circular plaza base
  ctx.beginPath();
  ctx.ellipse(x, y + 5, 45, 22, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#d4a574';
  ctx.fill();
  ctx.strokeStyle = '#b8956a';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner circle
  ctx.beginPath();
  ctx.ellipse(x, y + 5, 30, 15, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#c4956a';
  ctx.fill();

  // Fountain base
  ctx.beginPath();
  ctx.ellipse(x, y - 5, 20, 10, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#64748b';
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Fountain pillar
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(x - 5, y - 35, 10, 30);

  // Water
  const waterPhase = Date.now() / 200;
  ctx.beginPath();
  ctx.moveTo(x, y - 35);
  for (let i = -15; i <= 15; i += 5) {
    const waterY = y - 35 - 20 + Math.abs(i) * 0.8 + Math.sin(waterPhase + i) * 3;
    ctx.lineTo(x + i, waterY);
  }
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Water spray particles
  ctx.globalAlpha = 0.6;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + waterPhase / 5;
    const dist = 10 + Math.sin(waterPhase + i) * 5;
    ctx.beginPath();
    ctx.arc(x + Math.cos(angle) * dist, y - 40 + Math.sin(angle) * 3, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#7dd3fc';
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawBillboard(ctx: CanvasRenderingContext2D, x: number, y: number, _progress: number) {
  // Poles
  ctx.fillStyle = '#64748b';
  ctx.fillRect(x - 30, y - 60, 6, 70);
  ctx.fillRect(x + 24, y - 60, 6, 70);

  // Billboard frame
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x - 45, y - 100, 90, 50);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 3;
  ctx.strokeRect(x - 45, y - 100, 90, 50);

  // Screen with gradient
  const screenGrad = ctx.createLinearGradient(x - 40, y - 95, x + 40, y - 55);
  screenGrad.addColorStop(0, '#7c3aed');
  screenGrad.addColorStop(1, '#db2777');
  ctx.fillStyle = screenGrad;
  ctx.fillRect(x - 40, y - 95, 80, 40);

  // Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px Nunito';
  ctx.textAlign = 'center';
  ctx.fillText('@medvedev.tech', x, y - 72);
  
  ctx.font = '8px Nunito';
  ctx.fillText('Цифровая Империя', x, y - 60);

  // Lights on top
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(x - 25 + i * 25, y - 105, 4, 0, Math.PI * 2);
    ctx.fillStyle = Math.sin(Date.now() / 300 + i) > 0 ? '#fef08a' : '#fbbf24';
    ctx.fill();
  }
}

function drawSmoke(ctx: CanvasRenderingContext2D, x: number, y: number, timer: number) {
  ctx.globalAlpha = 0.4;
  for (let i = 0; i < 3; i++) {
    const offset = (timer / 50 + i * 20) % 60;
    const size = 5 + offset / 4;
    ctx.beginPath();
    ctx.arc(x + Math.sin(offset / 5 + i) * 5, y - offset, size, 0, Math.PI * 2);
    ctx.fillStyle = '#9ca3af';
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawCitizen(
  ctx: CanvasRenderingContext2D,
  citizen: Citizen,
  offsetX: number,
  offsetY: number,
  showNames: boolean
) {
  const { screenX, screenY } = toIso(citizen.x, citizen.y);
  const sx = screenX + offsetX;
  const sy = screenY + offsetY - citizen.jumpOffset;

  const bounce = citizen.state === 'walking' ? Math.sin(citizen.animFrame / 5) * 2 : 0;
  const scale = citizen.scale * (citizen.isHighlighted ? 1.2 : 1);

  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(scale, scale);

  // Glow effect for highlighted citizen
  if (citizen.isHighlighted) {
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 20;
  }

  // Shadow
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.ellipse(0, 5, 8, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#000';
  ctx.fill();
  ctx.globalAlpha = 1;

  // Body
  ctx.beginPath();
  ctx.ellipse(0, -8 + bounce, 8, 12, 0, 0, Math.PI * 2);
  ctx.fillStyle = citizen.color;
  ctx.fill();
  ctx.strokeStyle = shadeColor(citizen.color, -30);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Head with avatar or default face
  if (citizen.avatarLoaded) {
    // Рисуем аватарку в круге
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, -24 + bounce, 8, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(citizen.avatarLoaded, -8, -32 + bounce, 16, 16);
    ctx.restore();
    
    // Обводка
    ctx.beginPath();
    ctx.arc(0, -24 + bounce, 8, 0, Math.PI * 2);
    ctx.strokeStyle = citizen.isHighlighted ? '#fbbf24' : '#d4a574';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    // Дефолтное лицо
    ctx.beginPath();
    ctx.arc(0, -24 + bounce, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#fcd9bd';
    ctx.fill();
    ctx.strokeStyle = '#d4a574';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Eyes
    const eyeDir = citizen.direction > 0 ? 1 : -1;
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(-3 + eyeDir, -25 + bounce, 1.5, 0, Math.PI * 2);
    ctx.arc(3 + eyeDir, -25 + bounce, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.beginPath();
    ctx.arc(0, -22 + bounce, 4, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Waving hand animation
  if (citizen.state === 'waving') {
    const waveAngle = Math.sin(citizen.animFrame / 3) * 0.5;
    ctx.save();
    ctx.translate(10, -15);
    ctx.rotate(waveAngle - 0.5);
    ctx.fillStyle = '#fcd9bd';
    ctx.beginPath();
    ctx.ellipse(0, -8, 3, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Working animation (hammer)
  if (citizen.state === 'working') {
    const hammerAngle = Math.sin(citizen.animFrame / 4) * 0.8;
    ctx.save();
    ctx.translate(12, -20);
    ctx.rotate(hammerAngle);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-2, 0, 4, 15);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-4, 12, 8, 6);
    ctx.restore();
  }

  ctx.restore();

  // Name tag + avatar indicator
  if (showNames || citizen.isHighlighted) {
    ctx.save();
    const nameY = sy - 50 * scale - citizen.jumpOffset;
    
    // Background
    ctx.fillStyle = citizen.isHighlighted ? 'rgba(251, 191, 36, 0.95)' : 'rgba(0, 0, 0, 0.8)';
    ctx.font = '10px Nunito';
    const textWidth = ctx.measureText(citizen.username).width;
    const padding = 6;
    const bgWidth = Math.min(textWidth + padding * 2, 90);
    
    ctx.beginPath();
    ctx.roundRect(sx - bgWidth / 2, nameY - 10, bgWidth, 20, 6);
    ctx.fill();

    // Text
    ctx.fillStyle = citizen.isHighlighted ? '#1e293b' : '#fff';
    ctx.font = 'bold 10px Nunito';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const displayName = citizen.username.length > 12 ? citizen.username.slice(0, 10) + '..' : citizen.username;
    ctx.fillText(displayName, sx, nameY);
    ctx.restore();
  }
}

export function drawCloud(ctx: CanvasRenderingContext2D, cloud: Cloud) {
  ctx.globalAlpha = cloud.opacity;
  ctx.fillStyle = '#fff';
  
  const x = cloud.x;
  const y = cloud.y;
  const s = cloud.scale;
  
  ctx.beginPath();
  ctx.arc(x, y, 20 * s, 0, Math.PI * 2);
  ctx.arc(x + 25 * s, y - 5 * s, 25 * s, 0, Math.PI * 2);
  ctx.arc(x + 50 * s, y, 20 * s, 0, Math.PI * 2);
  ctx.arc(x + 20 * s, y + 10 * s, 15 * s, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.globalAlpha = 1;
}

export function drawParticle(ctx: CanvasRenderingContext2D, particle: Particle) {
  const alpha = particle.life / particle.maxLife;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = particle.color;
  ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
  ctx.globalAlpha = 1;
}

// Функции для отрисовки декораций карты
export function drawRiverTile(
  ctx: CanvasRenderingContext2D,
  tile: RiverTile,
  offsetX: number,
  offsetY: number,
  time: number
) {
  const { screenX, screenY } = toIso(tile.gridX, tile.gridY);
  const sx = screenX + offsetX;
  const sy = screenY + offsetY;

  // Основа воды
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(sx + TILE_WIDTH / 2, sy + TILE_HEIGHT / 2);
  ctx.lineTo(sx, sy + TILE_HEIGHT);
  ctx.lineTo(sx - TILE_WIDTH / 2, sy + TILE_HEIGHT / 2);
  ctx.closePath();

  const gradient = ctx.createLinearGradient(sx - 20, sy, sx + 20, sy + TILE_HEIGHT);
  gradient.addColorStop(0, '#0ea5e9');
  gradient.addColorStop(0.5, '#38bdf8');
  gradient.addColorStop(1, '#0284c7');
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.strokeStyle = '#0369a1';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Анимированные волны
  ctx.globalAlpha = 0.4;
  ctx.strokeStyle = '#7dd3fc';
  ctx.lineWidth = 1;
  const waveOffset = Math.sin(time / 500 + tile.gridX + tile.gridY) * 3;
  ctx.beginPath();
  ctx.moveTo(sx - 15, sy + TILE_HEIGHT / 2 + waveOffset);
  ctx.quadraticCurveTo(sx, sy + TILE_HEIGHT / 2 - 3 + waveOffset, sx + 15, sy + TILE_HEIGHT / 2 + waveOffset);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

export function drawBridge(
  ctx: CanvasRenderingContext2D,
  bridge: Bridge,
  offsetX: number,
  offsetY: number
) {
  const { screenX, screenY } = toIso(bridge.gridX, bridge.gridY);
  const sx = screenX + offsetX;
  const sy = screenY + offsetY;

  // Мост
  ctx.fillStyle = '#92400e';
  ctx.beginPath();
  ctx.moveTo(sx - 25, sy - 5);
  ctx.lineTo(sx + 25, sy - 5);
  ctx.lineTo(sx + 25, sy + 10);
  ctx.lineTo(sx - 25, sy + 10);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Перила
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sx - 25, sy - 12);
  ctx.lineTo(sx + 25, sy - 12);
  ctx.stroke();

  // Столбики
  for (let i = -2; i <= 2; i++) {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(sx + i * 10 - 2, sy - 12, 4, 8);
  }
}

export function drawDecoration(
  ctx: CanvasRenderingContext2D,
  decoration: MapDecoration,
  offsetX: number,
  offsetY: number,
  time: number
) {
  const { screenX, screenY } = toIso(decoration.gridX, decoration.gridY);
  const sx = screenX + offsetX;
  const sy = screenY + offsetY;

  switch (decoration.type) {
    case 'tree':
      drawTree(ctx, sx, sy, decoration.variant, time);
      break;
    case 'bush':
      drawBush(ctx, sx, sy, decoration.variant);
      break;
    case 'flower':
      drawFlower(ctx, sx, sy, decoration.variant, time);
      break;
    case 'rock':
      drawRock(ctx, sx, sy, decoration.variant);
      break;
    case 'lamp':
      drawLamp(ctx, sx, sy, time);
      break;
    case 'bench':
      drawBenchDecor(ctx, sx, sy);
      break;
    case 'fountain':
      drawFountainDecor(ctx, sx, sy, time);
      break;
  }
}

function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, variant: number, time: number) {
  const sway = Math.sin(time / 1000 + variant) * 2;
  
  // Тень
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(x + 10, y + 5, 20, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Ствол
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x - 4, y - 35, 8, 40);
  
  // Крона дерева (несколько слоёв)
  const treeColors = ['#22c55e', '#16a34a', '#15803d'];
  const baseColor = treeColors[variant % 3];
  
  for (let i = 0; i < 3; i++) {
    const layerY = y - 45 - i * 18;
    const layerSize = 25 - i * 5;
    
    ctx.beginPath();
    ctx.arc(x + sway * (i + 1) * 0.3, layerY, layerSize, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(x, layerY, 0, x, layerY, layerSize);
    grad.addColorStop(0, shadeColor(baseColor, 20));
    grad.addColorStop(1, baseColor);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = shadeColor(baseColor, -20);
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawBush(ctx: CanvasRenderingContext2D, x: number, y: number, variant: number) {
  // Тень
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(x + 5, y + 3, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  const bushColors = ['#22c55e', '#16a34a', '#4ade80'];
  const color = bushColors[variant % 3];

  // Куст
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(x + (i - 1) * 8, y - 8, 10 + (i % 2) * 3, 0, Math.PI * 2);
    ctx.fillStyle = shadeColor(color, (i - 1) * 10);
    ctx.fill();
  }

  // Цветочки на кусте
  if (variant % 2 === 0) {
    const flowerColors = ['#f472b6', '#fbbf24', '#f87171'];
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(x - 8 + i * 6, y - 12 + (i % 2) * 5, 3, 0, Math.PI * 2);
      ctx.fillStyle = flowerColors[i % 3];
      ctx.fill();
    }
  }
}

function drawFlower(ctx: CanvasRenderingContext2D, x: number, y: number, variant: number, time: number) {
  const sway = Math.sin(time / 800 + variant) * 3;
  const flowerColors = ['#f472b6', '#fbbf24', '#f87171', '#a855f7', '#3b82f6'];
  const color = flowerColors[variant % 5];

  // Стебель
  ctx.strokeStyle = '#16a34a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + sway / 2, y - 10, x + sway, y - 18);
  ctx.stroke();

  // Лепестки
  ctx.fillStyle = color;
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(
      x + sway + Math.cos(angle) * 4,
      y - 18 + Math.sin(angle) * 4,
      3, 5, angle, 0, Math.PI * 2
    );
    ctx.fill();
  }

  // Центр
  ctx.beginPath();
  ctx.arc(x + sway, y - 18, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#fbbf24';
  ctx.fill();
}

function drawRock(ctx: CanvasRenderingContext2D, x: number, y: number, variant: number) {
  const sizes = [[20, 12], [15, 10], [25, 15]][variant % 3];
  
  // Тень
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(x + 5, y + 3, sizes[0] * 0.8, sizes[1] * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Камень
  ctx.beginPath();
  ctx.ellipse(x, y - sizes[1] / 2, sizes[0], sizes[1], 0, 0, Math.PI * 2);
  const grad = ctx.createLinearGradient(x - sizes[0], y, x + sizes[0], y);
  grad.addColorStop(0, '#64748b');
  grad.addColorStop(0.5, '#94a3b8');
  grad.addColorStop(1, '#64748b');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawLamp(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  // Столб
  ctx.fillStyle = '#374151';
  ctx.fillRect(x - 3, y - 50, 6, 55);

  // Перекладина
  ctx.fillRect(x - 12, y - 55, 24, 5);

  // Фонарь
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(x - 8, y - 55);
  ctx.lineTo(x + 8, y - 55);
  ctx.lineTo(x + 6, y - 45);
  ctx.lineTo(x - 6, y - 45);
  ctx.closePath();
  ctx.fill();

  // Свечение
  const glow = 0.3 + Math.sin(time / 500) * 0.1;
  ctx.globalAlpha = glow;
  ctx.beginPath();
  ctx.arc(x, y - 50, 20, 0, Math.PI * 2);
  const glowGrad = ctx.createRadialGradient(x, y - 50, 0, x, y - 50, 20);
  glowGrad.addColorStop(0, '#fef08a');
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.fill();
  ctx.globalAlpha = 1;

  // Лампочка
  ctx.beginPath();
  ctx.arc(x, y - 50, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#fef08a';
  ctx.fill();
}

function drawBenchDecor(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // Тень
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(x, y + 5, 18, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Сиденье
  ctx.fillStyle = '#92400e';
  ctx.fillRect(x - 18, y - 8, 36, 6);

  // Спинка
  ctx.fillRect(x - 18, y - 20, 36, 4);

  // Ножки
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x - 15, y - 8, 4, 12);
  ctx.fillRect(x + 11, y - 8, 4, 12);

  // Перекладины спинки
  ctx.fillRect(x - 15, y - 20, 4, 16);
  ctx.fillRect(x + 11, y - 20, 4, 16);
}

function drawFountainDecor(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  // Бассейн
  ctx.beginPath();
  ctx.ellipse(x, y, 30, 15, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#0ea5e9';
  ctx.fill();
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Центральная колонна
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(x - 5, y - 35, 10, 40);

  // Чаши
  ctx.beginPath();
  ctx.ellipse(x, y - 15, 12, 5, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#64748b';
  ctx.fill();

  // Вода
  const waterPhase = time / 150;
  ctx.strokeStyle = '#7dd3fc';
  ctx.lineWidth = 2;
  
  // Струи
  for (let i = -1; i <= 1; i++) {
    const offsetX = i * 8;
    const height = 25 + Math.sin(waterPhase + i) * 5;
    
    ctx.beginPath();
    ctx.moveTo(x + offsetX, y - 35);
    ctx.quadraticCurveTo(
      x + offsetX + Math.sin(waterPhase + i * 2) * 3,
      y - 35 - height / 2,
      x + offsetX,
      y - 35 - height
    );
    ctx.stroke();
  }

  // Капли
  ctx.fillStyle = '#7dd3fc';
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + waterPhase / 5;
    const dist = 15 + Math.sin(waterPhase + i) * 5;
    const dropY = y - 35 - 20 + Math.abs(Math.sin(waterPhase + i * 0.7)) * 15;
    ctx.beginPath();
    ctx.arc(x + Math.cos(angle) * dist / 2, dropY, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}
