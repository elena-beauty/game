// Bảng màu + style chữ dùng chung.
export const FONT = '"Baloo 2", "Nunito", system-ui, sans-serif';

export const COLORS = {
  ink: '#3a2a3f',
  cream: '#fff8ee',
  pink: '#ff6f9f',
  pinkDark: '#d94a7b',
  sun: '#ffd166',
  sunDark: '#f2a93b',
  sea: '#2ec4d6',
  seaDark: '#1b8ea6',
  leaf: '#5fc36a',
  leafDark: '#33914a',
  grey: '#9aa3b5',
  panel: 0xfff8ee,
  panelEdge: 0x3a2a3f,
};

export const BUTTON_THEMES = {
  primary: { top: 0xffb3cb, bottom: 0xff5c93, edge: 0xb83266, text: '#ffffff' },
  sun: { top: 0xffe39a, bottom: 0xffb733, edge: 0xb7741a, text: '#5a3410' },
  sea: { top: 0x8fe9f2, bottom: 0x23aecb, edge: 0x166f86, text: '#ffffff' },
  leaf: { top: 0xa6ec9b, bottom: 0x48b75a, edge: 0x2a7339, text: '#ffffff' },
  ghost: { top: 0xffffff, bottom: 0xeae3f0, edge: 0x8a7a99, text: '#3a2a3f' },
};

/** Style chữ tiêu đề: viền dày + bóng đổ, kiểu game mobile. */
export function titleStyle(size = 64, color = '#ffffff', stroke = '#3a2a3f') {
  return {
    fontFamily: FONT,
    fontSize: `${size}px`,
    fontStyle: '800',
    color,
    stroke,
    strokeThickness: Math.round(size / 6),
    shadow: { offsetX: 0, offsetY: Math.round(size / 12), color: 'rgba(0,0,0,0.35)', blur: 0, fill: true, stroke: true },
    align: 'center',
    padding: { x: 8, y: 6 },
  };
}

export function textStyle(size = 22, color = COLORS.ink, extra = {}) {
  return { fontFamily: FONT, fontSize: `${size}px`, fontStyle: '600', color, padding: { x: 2, y: 3 }, ...extra };
}
