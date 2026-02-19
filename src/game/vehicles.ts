import { toIso } from './renderer';

export interface Vehicle {
  id: number;
  type: 'car' | 'bus' | 'train' | 'drone' | 'ufo';
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  color: string;
  direction: number;
  animFrame: number;
}

const VEHICLE_COLORS = [
  '#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'
];

export function createVehicle(id: number, level: number, mapSize: number): Vehicle {
  const types: Vehicle['type'][] = level >= 5 
    ? ['car', 'bus', 'drone', 'ufo']
    : level >= 4 
    ? ['car', 'bus', 'train', 'drone']
    : level >= 3
    ? ['car', 'bus']
    : ['car'];
  
  const type = types[Math.floor(Math.random() * types.length)];
  const centerPath = mapSize / 2;
  
  // Start on a path
  const isHorizontal = Math.random() > 0.5;
  const startX = isHorizontal ? 0 : centerPath;
  const startY = isHorizontal ? centerPath : 0;
  const endX = isHorizontal ? mapSize : centerPath;
  const endY = isHorizontal ? centerPath : mapSize;
  
  return {
    id,
    type,
    x: startX,
    y: startY,
    targetX: endX,
    targetY: endY,
    speed: type === 'drone' || type === 'ufo' ? 0.08 : type === 'train' ? 0.05 : 0.04,
    color: VEHICLE_COLORS[Math.floor(Math.random() * VEHICLE_COLORS.length)],
    direction: 1,
    animFrame: 0
  };
}

export function updateVehicle(vehicle: Vehicle, _mapSize: number): boolean {
  vehicle.animFrame++;
  
  const dx = vehicle.targetX - vehicle.x;
  const dy = vehicle.targetY - vehicle.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist < 0.5) {
    // Reached destination - respawn
    return false;
  }
  
  vehicle.x += (dx / dist) * vehicle.speed;
  vehicle.y += (dy / dist) * vehicle.speed;
  vehicle.direction = dx > 0 ? 1 : -1;
  
  return true;
}

export function drawVehicle(
  ctx: CanvasRenderingContext2D,
  vehicle: Vehicle,
  offsetX: number,
  offsetY: number
) {
  const { screenX, screenY } = toIso(vehicle.x, vehicle.y);
  const sx = screenX + offsetX;
  const sy = screenY + offsetY;
  
  ctx.save();
  ctx.translate(sx, sy);
  
  switch (vehicle.type) {
    case 'car':
      drawCar(ctx, vehicle);
      break;
    case 'bus':
      drawBus(ctx, vehicle);
      break;
    case 'train':
      drawTrain(ctx, vehicle);
      break;
    case 'drone':
      drawDrone(ctx, vehicle);
      break;
    case 'ufo':
      drawUFO(ctx, vehicle);
      break;
  }
  
  ctx.restore();
}

function drawCar(ctx: CanvasRenderingContext2D, vehicle: Vehicle) {
  const bounce = Math.sin(vehicle.animFrame / 3) * 0.5;
  
  // Shadow
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(0, 8, 18, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  
  // Car body
  ctx.fillStyle = vehicle.color;
  ctx.beginPath();
  ctx.roundRect(-15, -10 + bounce, 30, 12, 3);
  ctx.fill();
  ctx.strokeStyle = shadeColor(vehicle.color, -30);
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Roof
  ctx.fillStyle = shadeColor(vehicle.color, -15);
  ctx.beginPath();
  ctx.roundRect(-10, -18 + bounce, 20, 10, 2);
  ctx.fill();
  
  // Windows
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(-8, -16 + bounce, 7, 6);
  ctx.fillRect(2, -16 + bounce, 7, 6);
  
  // Wheels
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(-10, 3 + bounce, 4, 0, Math.PI * 2);
  ctx.arc(10, 3 + bounce, 4, 0, Math.PI * 2);
  ctx.fill();
  
  // Headlights
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(vehicle.direction > 0 ? 12 : -15, -6 + bounce, 3, 3);
}

function drawBus(ctx: CanvasRenderingContext2D, vehicle: Vehicle) {
  const bounce = Math.sin(vehicle.animFrame / 4) * 0.3;
  
  // Shadow
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(0, 10, 25, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  
  // Bus body
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.roundRect(-22, -20 + bounce, 44, 22, 3);
  ctx.fill();
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  
  // Windows
  ctx.fillStyle = '#7dd3fc';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(-18 + i * 10, -17 + bounce, 7, 10);
  }
  
  // Wheels
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(-14, 5 + bounce, 5, 0, Math.PI * 2);
  ctx.arc(14, 5 + bounce, 5, 0, Math.PI * 2);
  ctx.fill();
  
  // Sign
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 6px Nunito';
  ctx.textAlign = 'center';
  ctx.fillText('BUS', 0, -22 + bounce);
}

function drawTrain(ctx: CanvasRenderingContext2D, vehicle: Vehicle) {
  // Shadow
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(0, 12, 35, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  
  // Train cars
  for (let i = 0; i < 3; i++) {
    const ox = -25 + i * 25;
    
    // Car body
    ctx.fillStyle = i === 0 ? '#ef4444' : '#64748b';
    ctx.beginPath();
    ctx.roundRect(ox - 10, -15, 22, 18, 2);
    ctx.fill();
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Windows
    if (i > 0) {
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(ox - 6, -12, 5, 5);
      ctx.fillRect(ox + 3, -12, 5, 5);
    } else {
      // Engine front
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(ox - 6, -10, 14, 8);
    }
    
    // Wheels
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(ox - 5, 5, 4, 0, Math.PI * 2);
    ctx.arc(ox + 7, 5, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Smoke from engine
  const smokePhase = vehicle.animFrame / 10;
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 3; i++) {
    const smokeY = -25 - ((smokePhase + i * 5) % 20);
    const smokeSize = 5 + ((smokePhase + i * 5) % 20) / 2;
    ctx.beginPath();
    ctx.arc(-30 + Math.sin(smokePhase + i) * 3, smokeY, smokeSize, 0, Math.PI * 2);
    ctx.fillStyle = '#9ca3af';
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawDrone(ctx: CanvasRenderingContext2D, vehicle: Vehicle) {
  const hover = Math.sin(vehicle.animFrame / 5) * 5;
  const propellerAngle = vehicle.animFrame / 2;
  
  // Shadow
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(0, 30, 15, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  
  // Body
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(-12, -20 + hover, 24, 12, 4);
  ctx.fill();
  
  // Camera/sensor
  ctx.fillStyle = '#3b82f6';
  ctx.beginPath();
  ctx.arc(0, -12 + hover, 5, 0, Math.PI * 2);
  ctx.fill();
  
  // Propeller arms
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-18, -18 + hover);
  ctx.lineTo(18, -18 + hover);
  ctx.moveTo(-18, -10 + hover);
  ctx.lineTo(18, -10 + hover);
  ctx.stroke();
  
  // Propellers (spinning)
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = '#94a3b8';
  for (let i = -1; i <= 1; i += 2) {
    for (let j = -1; j <= 1; j += 2) {
      ctx.save();
      ctx.translate(i * 18, -14 + hover + j * 4);
      ctx.rotate(propellerAngle * (i * j));
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
  
  // Lights
  if (Math.sin(vehicle.animFrame / 10) > 0) {
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(-10, -8 + hover, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(10, -8 + hover, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawUFO(ctx: CanvasRenderingContext2D, vehicle: Vehicle) {
  const hover = Math.sin(vehicle.animFrame / 8) * 8;
  const spin = vehicle.animFrame / 20;
  
  // Beam
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = '#a5f3fc';
  ctx.beginPath();
  ctx.moveTo(-8, -5 + hover);
  ctx.lineTo(8, -5 + hover);
  ctx.lineTo(20, 50);
  ctx.lineTo(-20, 50);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  
  // Shadow
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(0, 40, 20, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  
  // Saucer bottom
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.ellipse(0, -8 + hover, 25, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Saucer top (dome)
  const domeGrad = ctx.createRadialGradient(0, -20 + hover, 0, 0, -15 + hover, 15);
  domeGrad.addColorStop(0, '#c4b5fd');
  domeGrad.addColorStop(1, '#7c3aed');
  ctx.fillStyle = domeGrad;
  ctx.beginPath();
  ctx.ellipse(0, -15 + hover, 12, 10, 0, Math.PI, 0);
  ctx.fill();
  
  // Spinning lights
  ctx.fillStyle = '#fef08a';
  for (let i = 0; i < 6; i++) {
    const angle = spin + (i / 6) * Math.PI * 2;
    const lx = Math.cos(angle) * 20;
    const ly = Math.sin(angle) * 6 - 8 + hover;
    ctx.beginPath();
    ctx.arc(lx, ly, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Inner glow
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#a5f3fc';
  ctx.beginPath();
  ctx.arc(0, -15 + hover, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function shadeColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}
