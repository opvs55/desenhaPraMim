import { lerpColor } from './color';

const ditherPattern = [
  [ 0,  8,  2, 10],
  [12,  4, 14,  6],
  [ 3, 11,  1,  9],
  [15,  7, 13,  5]
];

const getPixelColor = (x, y, shape) => {
  const { fill } = shape;
  const fallbackColor = '#FF00FF'; // Rosa choque para identificar erros

  if (!fill || !fill.type) return fallbackColor;

  switch (fill.type) {
    case 'linear-gradient': {
      if (!Array.isArray(fill.colors) || fill.colors.length < 2 || typeof fill.colors[0] !== 'string' || typeof fill.colors[1] !== 'string') {
        return fallbackColor;
      }
      const angleRad = (fill.angle || 0) * (Math.PI / 180);
      const dx = x - shape.x;
      const dy = y - shape.y;
      
      const projected = dx * Math.cos(angleRad) + dy * Math.sin(angleRad);
      const size = shape.radius ? shape.radius * 2 : Math.max(shape.width, shape.height);
      const factor = Math.max(0, Math.min(1, size > 0 ? (projected + size / 2) / size : 0));
      
      return lerpColor(fill.colors[0], fill.colors[1], factor);
    }
    case 'dither': {
      if (!Array.isArray(fill.colors) || fill.colors.length < 2 || typeof fill.colors[0] !== 'string' || typeof fill.colors[1] !== 'string') {
        return fallbackColor;
      }
      const threshold = ditherPattern[y % 4][x % 4] / 16;
      return threshold < 0.5 ? fill.colors[0] : fill.colors[1];
    }
    case 'solid':
    default:
      return typeof fill.color === 'string' ? fill.color : fallbackColor;
  }
};

// Função que "normaliza" uma forma, garantindo que ela tenha a estrutura que esperamos.
const normalizeShape = (shape) => {
  const newShape = { ...shape };

  // TRADUÇÃO 1: Converte o formato antigo (color) para o novo (fill)
  if (!newShape.fill && typeof newShape.color === 'string') {
    newShape.fill = { type: 'solid', color: newShape.color };
  }

  // TRADUÇÃO 2: Converte 'cx' e 'cy' para 'x' e 'y'
  if (newShape.type === 'circle') {
    if (newShape.cx !== undefined && newShape.x === undefined) {
      newShape.x = newShape.cx;
    }
    if (newShape.cy !== undefined && newShape.y === undefined) {
      newShape.y = newShape.cy;
    }
  }

  return newShape;
};

const drawRect = (grid, shape) => {
  if (typeof shape.x !== 'number' || typeof shape.y !== 'number' || typeof shape.width !== 'number' || typeof shape.height !== 'number') {
    console.warn("Retângulo inválido recebido da IA, ignorando:", shape);
    return;
  }

  for (let y = shape.y; y < shape.y + shape.height; y++) {
    for (let x = shape.x; x < shape.x + shape.width; x++) {
      if (grid[y] && grid[y][x] !== undefined) {
        grid[y][x] = getPixelColor(x, y, shape);
      }
    }
  }
};

const drawCircle = (grid, shape) => {
  if (typeof shape.x !== 'number' || typeof shape.y !== 'number' || typeof shape.radius !== 'number') {
    console.warn("Círculo inválido recebido da IA, ignorando:", shape);
    return;
  }

  const startX = Math.max(0, shape.x - shape.radius);
  const endX = Math.min(grid[0].length - 1, shape.x + shape.radius);
  const startY = Math.max(0, shape.y - shape.radius);
  const endY = Math.min(grid.length - 1, shape.y + shape.radius);

  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      const dx = x - shape.x;
      const dy = y - shape.y;
      if (dx * dx + dy * dy <= shape.radius * shape.radius) {
        if (grid[y] && grid[y][x] !== undefined) {
            grid[y][x] = getPixelColor(x, y, shape);
        }
      }
    }
  }
};

export const renderShapesToGrid = (scene, frameIndex = 0) => {
  if (!scene || !scene.gridDimensions) {
    console.error("Cena ou dimensões do grid ausentes.");
    return [[]]; // Retorna um grid vazio seguro
  }
  
  const { width, height } = scene.gridDimensions;
  const frameShapes = scene.frames ? scene.frames[frameIndex] : [];

  if (!frameShapes || !Array.isArray(frameShapes)) {
    console.error("Dados de frame inválidos ou ausentes recebidos da IA.");
    return Array.from({ length: height }, () => Array(width).fill(scene.background || '#000000'));
  }

  const grid = Array.from({ length: height }, () => Array(width).fill(scene.background));

  frameShapes.forEach(rawShape => {
    // APLICA A NORMALIZAÇÃO ANTES DE DESENHAR
    const shape = normalizeShape(rawShape);

    if (shape.type === 'rect') {
      drawRect(grid, shape);
    } else if (shape.type === 'circle') {
      drawCircle(grid, shape);
    }
  });

  return grid;
};