// SVG moustache definitions for the Moustachify tool
// Each moustache is a self-contained SVG string with a normalized viewBox

export const MOUSTACHE_STYLES = [
  {
    id: 'handlebar',
    label: 'Classic Handlebar',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" fill="#1a1a1a">
      <path d="M100 30 C80 10, 20 5, 5 25 C-2 38, 10 55, 30 50 C50 45, 60 38, 70 36 C80 34, 90 36, 100 42
               C110 36, 120 34, 130 36 C140 38, 150 45, 170 50 C190 55, 202 38, 195 25 C180 5, 120 10, 100 30 Z"/>
    </svg>`,
  },
  {
    id: 'pencil',
    label: 'Thin Pencil',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" fill="#1a1a1a">
      <path d="M30 38 C50 32, 75 28, 100 35 C125 28, 150 32, 170 38
               C150 44, 125 48, 100 41 C75 48, 50 44, 30 38 Z"/>
    </svg>`,
  },
  {
    id: 'walrus',
    label: 'Bushy Walrus',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" fill="#1a1a1a">
      <ellipse cx="60" cy="50" rx="55" ry="28"/>
      <ellipse cx="140" cy="50" rx="55" ry="28"/>
      <rect x="85" y="20" width="30" height="35" rx="6"/>
    </svg>`,
  },
  {
    id: 'curly',
    label: 'Curly Fancy',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" fill="none" stroke="#1a1a1a" stroke-width="7" stroke-linecap="round">
      <path d="M100 40 C85 28, 60 22, 40 28 C22 33, 8 28, 5 18 C3 10, 12 6, 22 12 C30 17, 28 28, 20 32"/>
      <path d="M100 40 C115 28, 140 22, 160 28 C178 33, 192 28, 195 18 C197 10, 188 6, 178 12 C170 17, 172 28, 180 32"/>
    </svg>`,
  },
  {
    id: 'chevron',
    label: 'Chevron',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" fill="#1a1a1a">
      <path d="M15 20 C35 20, 60 22, 80 32 C88 36, 94 40, 100 42
               C106 40, 112 36, 120 32 C140 22, 165 20, 185 20
               L185 32 C165 32, 142 34, 124 44 C114 50, 106 54, 100 55
               C94 54, 86 50, 76 44 C58 34, 35 32, 15 32 Z"/>
    </svg>`,
  },
  {
    id: 'dutch',
    label: 'Dutch / Upturned',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" fill="#1a1a1a">
      <path d="M100 45 C85 40, 65 36, 45 40 C25 44, 10 40, 8 28 C6 18, 18 12, 30 18 C42 24, 48 36, 55 40
               C68 35, 84 30, 100 35
               C116 30, 132 35, 145 40 C152 36, 158 24, 170 18 C182 12, 194 18, 192 28 C190 40, 175 44, 155 40 C135 36, 115 40, 100 45 Z"/>
    </svg>`,
  },
];

/**
 * Draw a moustache on a canvas context at the given position and size.
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {string} svgString - SVG markup string
 * @param {number} x - Center-X position on canvas
 * @param {number} y - Center-Y position on canvas
 * @param {number} width - Desired rendered width
 * @param {number} height - Desired rendered height
 * @returns {Promise<void>}
 */
export function drawMoustacheOnCanvas(ctx, svgString, x, y, width, height) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, x - width / 2, y - height / 2, width, height);
      URL.revokeObjectURL(url);
      resolve();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load moustache SVG'));
    };
    img.src = url;
  });
}
