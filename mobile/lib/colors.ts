type HexColor = `#${string}`;
type RgbColor = `rgb(${number},${number},${number})`;

function parseRgb(rgb: RgbColor): number[] {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) {
    throw new Error(`Invalid RGB format ${rgb}`);
  }

  const [, r, g, b] = match.map(Number);

  return [r, g, b];
}

export function rgbToHex(rgb: RgbColor): HexColor {
  const [r, g, b] = parseRgb(rgb);

  if ([r, g, b].some((num) => num < 0 || num > 255 || isNaN(num))) {
    throw new Error('RGB values must be between 0 and 255');
  }

  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}` as HexColor;
}

export function opacity(rgb: RgbColor, opacity: number): string {
  return rgb.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
}

function rgbToHsl([r, g, b]: number[]): number[] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  // H is 0-360, S and L are 0-100
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToRgb([h, s, l]: number[]): number[] {
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h / 360 + 1 / 3);
    g = hue2rgb(p, q, h / 360);
    b = hue2rgb(p, q, h / 360 - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export function lightness(rgbColor: RgbColor, lightness: number): RgbColor {
  const [h, s] = rgbToHsl(parseRgb(rgbColor));
  const [r, g, b] = hslToRgb([h, Math.min(s, 100), lightness * 100]);

  return `rgb(${r},${g},${b})`;
}
