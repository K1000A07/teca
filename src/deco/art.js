// Librería de decoraciones de teca.
// Estilo: ilustración plana, formas redondeadas y onduladas, colores cálidos y saturados,
// detalles mínimos de línea en tinta. Cada deco devuelve un <svg> como texto, así sirve
// igual en la app y en el brandbook.

export const C = {
  coral: '#EF6F5E', pink: '#F4A7C3', blush: '#F9D3DC', mustard: '#F2B63D', yellow: '#F7D74A',
  green: '#3E9B6E', leaf: '#5DB585', sage: '#A8CFAE', teal: '#4FA3A5', cobalt: '#3C5DAA',
  sky: '#A9C6F2', lav: '#BDB5E6', cream: '#FBF1DC', terra: '#D9773F', brown: '#8B5A3C',
  ink: '#2A221E', lime: '#E6F04A', white: '#FFFFFF', gray: '#D8D2C8', black: '#1E1B1A', orange: '#E8893A',
}
const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true" style="overflow:visible;display:block">${body}</svg>`
const flame = (x, y, s = 1) => `<path d="M${x} ${y - 11 * s} C ${x + 5 * s} ${y - 5 * s}, ${x + 4 * s} ${y}, ${x} ${y} C ${x - 4 * s} ${y}, ${x - 5 * s} ${y - 5 * s}, ${x} ${y - 11 * s} Z" fill="${C.mustard}"/><path d="M${x} ${y - 6 * s} C ${x + 2 * s} ${y - 3 * s}, ${x + 2 * s} ${y}, ${x} ${y} C ${x - 2 * s} ${y}, ${x - 2 * s} ${y - 3 * s}, ${x} ${y - 6 * s} Z" fill="${C.yellow}"/><line x1="${x}" y1="${y}" x2="${x}" y2="${y + 3}" stroke="${C.ink}" stroke-width="1.4"/>`
const leafP = (cx, cy, l, w, rot, fill, vein = true) => `<g transform="rotate(${rot} ${cx} ${cy})"><path d="M${cx} ${cy} C ${cx + w} ${cy - l * .3}, ${cx + w * .6} ${cy - l * .85}, ${cx} ${cy - l} C ${cx - w * .6} ${cy - l * .85}, ${cx - w} ${cy - l * .3}, ${cx} ${cy} Z" fill="${fill}"/>${vein ? `<path d="M${cx} ${cy - 2} L ${cx} ${cy - l * .85}" stroke="${C.ink}" stroke-opacity=".35" stroke-width="1"/>` : ''}</g>`

// ---------- PLANTAS ----------
const plants = {
  monstera: { name: 'Monstera', w: 64, h: 82, draw: () => svg(64, 82, `
    ${leafP(26, 52, 40, 20, -32, C.green)}${leafP(38, 52, 44, 22, 28, C.leaf)}${leafP(32, 54, 48, 22, 2, C.green)}
    <path d="M24 30 l6 4 M40 26 l-6 5 M30 20 l4 4" stroke="${C.white}" stroke-width="3" stroke-linecap="round"/>
    <path d="M14 54 h36 l-4 28 h-28 z" fill="${C.terra}"/><rect x="12" y="52" width="40" height="7" rx="2" fill="${C.coral}"/>`) },
  serpiente: { name: 'Sansevieria', w: 46, h: 84, draw: () => svg(46, 84, `
    <path d="M14 56 C 10 30, 14 12, 18 4 C 20 20, 22 38, 22 56 Z" fill="${C.green}"/><path d="M22 56 C 22 34, 26 16, 32 8 C 32 26, 30 44, 30 56 Z" fill="${C.leaf}"/><path d="M28 56 C 32 40, 36 28, 40 22 C 38 36, 36 48, 36 56 Z" fill="${C.green}"/>
    <path d="M16 20 l3 2 M15 34 l4 2 M26 24 l3 2 M25 38 l4 2" stroke="${C.sage}" stroke-width="2" stroke-linecap="round"/>
    <path d="M8 56 h30 v24 a4 4 0 0 1 -4 4 h-22 a4 4 0 0 1 -4 -4 z" fill="${C.pink}"/><path d="M8 62 q4 -4 7.5 0 t7.5 0 t7.5 0 t7.5 0 M8 72 q4 -4 7.5 0 t7.5 0 t7.5 0 t7.5 0" stroke="${C.mustard}" stroke-width="3" fill="none"/>`) },
  potus: { name: 'Potus colgante', w: 58, h: 110, hangs: 88, draw: () => svg(58, 110, `
    <path d="M16 18 C 12 40, 18 70, 12 104 M30 22 C 34 50, 28 74, 34 96 M44 18 C 50 36, 44 56, 48 80" stroke="${C.green}" stroke-width="1.6" fill="none"/>
    ${[[12, 30], [15, 46], [12, 62], [16, 78], [12, 96], [32, 36], [30, 54], [33, 70], [33, 88], [46, 30], [46, 48], [47, 66], [48, 78]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="4.6" ry="3.4" transform="rotate(${i % 2 ? 30 : -30} ${x} ${y})" fill="${i % 3 ? C.leaf : C.green}"/>`).join('')}
    ${leafP(20, 4, 16, 8, -25, C.leaf, false)}${leafP(30, 4, 18, 8, 0, C.green, false)}${leafP(40, 4, 16, 8, 25, C.leaf, false)}
    <path d="M8 0 h42 l-4 20 h-34 z" fill="${C.cobalt}"/><path d="M14 6 l3 4 3 -4 3 4 3 -4 3 4 3 -4 3 4 3 -4 3 4" stroke="${C.sky}" stroke-width="1.6" fill="none"/>`) },
  cactus: { name: 'Cactus', w: 40, h: 66, draw: () => svg(40, 66, `
    <rect x="15" y="8" width="12" height="40" rx="6" fill="${C.green}"/><path d="M15 30 h-4 a4 4 0 0 1 -4 -4 v-8 a3 3 0 0 1 6 0 v6 h2" fill="${C.green}"/><path d="M27 24 h4 a3 3 0 0 0 3 -3 v-6 a3 3 0 0 1 6 0 v8 a5 5 0 0 1 -5 5 h-8" fill="${C.leaf}"/>
    <circle cx="21" cy="7" r="4" fill="${C.pink}"/><circle cx="21" cy="7" r="1.6" fill="${C.coral}"/>
    <path d="M19 16 l-1.5 -1 M23 22 l1.5 -1 M19 30 l-1.5 -1 M23 38 l1.5 -1" stroke="${C.ink}" stroke-width="1.2"/>
    <path d="M8 46 h26 l-3 20 h-20 z" fill="${C.mustard}"/><circle cx="16" cy="56" r="2" fill="${C.white}"/><circle cx="26" cy="54" r="2" fill="${C.white}"/>`) },
  olivo: { name: 'Olivo', w: 54, h: 92, draw: () => svg(54, 92, `
    <path d="M27 66 C 27 50, 22 40, 18 26 M27 50 C 32 40, 36 30, 38 20" stroke="${C.brown}" stroke-width="2" fill="none"/>
    ${[[18, 26, -40], [14, 34, -70], [22, 18, -10], [30, 30, 20], [38, 20, 30], [42, 28, 70], [34, 14, 10], [24, 40, -60], [34, 40, 60]].map(([x, y, r]) => leafP(x, y, 12, 5, r, C.sage, false)).join('')}
    <path d="M12 64 h30 l-3 26 h-24 z" fill="${C.blush}"/><rect x="10" y="62" width="34" height="5" rx="2" fill="${C.pink}"/>`) },
  goma: { name: 'Gomero', w: 54, h: 80, draw: () => svg(54, 80, `
    <path d="M27 54 V 16" stroke="${C.brown}" stroke-width="2"/>
    ${leafP(27, 30, 22, 10, -55, C.green)}${leafP(27, 26, 22, 10, 55, C.leaf)}${leafP(27, 40, 22, 10, -70, C.leaf)}${leafP(27, 38, 22, 10, 70, C.green)}${leafP(27, 18, 18, 8, 0, C.leaf)}
    <path d="M10 52 h34 l-3 26 h-28 z" fill="${C.terra}"/><path d="M12 58 l30 0 M13 64 l28 0 M14 70 l26 0" stroke="${C.cream}" stroke-width="1.6" stroke-dasharray="3 3"/>`) },
  tulipan: { name: 'Florero con tulipán', w: 36, h: 76, draw: () => svg(36, 76, `
    <path d="M18 42 C 17 30, 19 22, 18 14" stroke="${C.green}" stroke-width="2.2" fill="none"/>${leafP(18, 40, 16, 6, -35, C.green, false)}
    <path d="M10 8 L13 16 L18 10 L23 16 L26 8 C 28 18, 24 24, 18 24 C 12 24, 8 18, 10 8 Z" fill="${C.coral}"/>
    <path d="M12 42 h12 c0 6 8 10 8 20 a12 12 0 0 1 -12 12 h-4 a12 12 0 0 1 -12 -12 c0 -10 8 -14 8 -20 z" fill="${C.yellow}"/>
    <circle cx="18" cy="60" r="5" fill="${C.cobalt}"/><circle cx="18" cy="60" r="2" fill="${C.yellow}"/>${[0, 72, 144, 216, 288].map((a) => `<circle cx="${18 + 6 * Math.cos(a * Math.PI / 180)}" cy="${60 + 6 * Math.sin(a * Math.PI / 180)}" r="2.6" fill="${C.cobalt}"/>`).join('')}`) },
  suculenta: { name: 'Suculenta', w: 42, h: 46, draw: () => svg(42, 46, `
    ${[[-60, C.sage], [60, C.sage], [-30, C.leaf], [30, C.leaf], [0, C.green]].map(([r, f]) => leafP(21, 26, 18, 7, r, f, false)).join('')}
    <path d="M8 24 h26 v16 a6 6 0 0 1 -6 6 h-14 a6 6 0 0 1 -6 -6 z" fill="${C.lav}"/><path d="M8 30 l6 6 l6 -6 l6 6 l6 -6" stroke="${C.cobalt}" stroke-width="2" fill="none"/>`) },
}

// ---------- VELAS ----------
const candles = {
  ondulada: { name: 'Vela ondulada', w: 24, h: 60, draw: () => svg(24, 60, `
    <path d="M4 16 q8 5 0 11 t0 11 t0 11 t0 11 h16 q-8 -5 0 -11 t0 -11 t0 -11 t0 -11 z" fill="${C.pink}"/>${flame(12, 14)}`) },
  columna: { name: 'Vela con base', w: 30, h: 58, draw: () => svg(30, 58, `
    <rect x="7" y="16" width="16" height="26" rx="2" fill="${C.pink}"/><path d="M7 20 q4 3 8 0 t8 0" stroke="${C.blush}" stroke-width="2" fill="none"/>${flame(15, 14)}
    <path d="M5 42 h20 l-4 5 v4 l5 4 v3 h-22 v-3 l5 -4 v-4 z" fill="${C.green}"/>`) },
  retorcida: { name: 'Vela retorcida', w: 24, h: 84, draw: () => svg(24, 84, `
    <rect x="8" y="14" width="8" height="48" rx="3" fill="${C.sky}"/>${[18, 24, 30, 36, 42, 48, 54].map((y) => `<path d="M8 ${y} q4 4 8 -2" stroke="${C.ink}" stroke-width="1.1" fill="none"/>`).join('')}${flame(12, 12)}
    <path d="M6 62 h12 v4 c6 2 6 6 0 8 v2 c4 2 4 6 0 8 h-12 c-4 -2 -4 -6 0 -8 v-2 c-6 -2 -6 -6 0 -8 z" fill="${C.coral}"/>`) },
  burbujas: { name: 'Vela de burbujas', w: 40, h: 46, draw: () => svg(40, 46, `
    ${[[12, 38], [20, 38], [28, 38], [8, 30], [16, 30], [24, 30], [32, 30], [12, 22], [20, 22], [28, 22], [16, 15], [24, 15]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="${C.sky}" stroke="${C.cobalt}" stroke-width=".8" stroke-opacity=".5"/>`).join('')}${flame(20, 10)}`) },
  arco: { name: 'Vela arco', w: 40, h: 48, draw: () => svg(40, 48, `
    <path d="M4 48 V 26 a16 16 0 0 1 32 0 V 48 z" fill="${C.blush}"/>${[10, 16, 22].map((r) => `<path d="M${20 - r + 6} 48 V 28 a${r - 6} ${r - 6} 0 0 1 ${2 * (r - 6)} 0 V 48" stroke="${C.pink}" stroke-width="1.4" fill="none"/>`).join('')}${flame(20, 10)}`) },
  frasco: { name: 'Vela en frasco', w: 34, h: 50, draw: () => svg(34, 50, `
    <path d="M5 16 h24 v28 a6 6 0 0 1 -6 6 h-12 a6 6 0 0 1 -6 -6 z" fill="${C.blush}"/><rect x="4" y="14" width="26" height="6" rx="2" fill="${C.pink}"/>
    <rect x="9" y="26" width="16" height="14" rx="1" fill="${C.green}"/><path d="M12 33 q2 -3 4 0 t4 0" stroke="${C.cream}" stroke-width="1.3" fill="none"/>${flame(17, 13)}`) },
  alta: { name: 'Vela alta', w: 28, h: 92, draw: () => svg(28, 92, `
    <rect x="10" y="14" width="8" height="56" rx="1" fill="${C.yellow}"/><line x1="14" y1="24" x2="14" y2="40" stroke="${C.ink}" stroke-width="1" stroke-opacity=".5"/>${flame(14, 12)}
    <path d="M8 70 h12 v4 h-2 c6 3 6 7 0 10 h4 l2 8 h-20 l2 -8 h4 c-6 -3 -6 -7 0 -10 h-2 z" fill="${C.lav}"/>`) },
  trio: { name: 'Trío de velas', w: 52, h: 52, draw: () => svg(52, 52, `
    <rect x="4" y="26" width="13" height="26" rx="2" fill="${C.cream}"/>${flame(10.5, 24)}<rect x="19" y="14" width="14" height="38" rx="2" fill="${C.coral}"/>${flame(26, 12)}<rect x="35" y="32" width="13" height="20" rx="2" fill="${C.mustard}"/>${flame(41.5, 30)}`) },
}

// ---------- GATOS ----------
const cat = (fill, eye = C.yellow) => ({ fill, eye })
const cats = {
  durmiendo: { name: 'Gato durmiendo', w: 74, h: 34, draw: (o = {}) => { const f = o.fill || C.black; return svg(74, 34, `
    <path d="M6 34 C 2 20, 14 8, 34 8 C 52 8, 66 14, 66 28 L 66 34 Z" fill="${f}"/><path d="M8 32 C 0 30, -2 22, 4 18" stroke="${f}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <circle cx="60" cy="22" r="11" fill="${f}"/><path d="M52 14 l2 -9 6 6 z M63 11 l6 -6 1 9 z" fill="${f}"/>
    <path d="M55 22 q2.5 2 5 0 M63 22 q2.5 2 5 0" stroke="${C.white}" stroke-width="1.3" fill="none" stroke-linecap="round"/><ellipse cx="50" cy="32" rx="6" ry="3" fill="${f}"/><path d="M47 33 v-2 M50 33.5 v-2 M53 33 v-2" stroke="${C.white}" stroke-width=".8" stroke-opacity=".6"/>`) } },
  sentado: { name: 'Gato sentado', w: 44, h: 64, draw: (o = {}) => { const f = o.fill || C.black; return svg(44, 64, `
    <path d="M30 60 C 44 60, 44 46, 36 44" stroke="${f}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M8 64 C 6 44, 10 30, 20 28 C 30 30, 34 44, 32 64 Z" fill="${f}"/>
    <circle cx="20" cy="20" r="12" fill="${f}"/><path d="M10 14 l1 -12 9 8 z M30 14 l-1 -12 -9 8 z" fill="${f}"/>
    <ellipse cx="15.5" cy="19" rx="2.6" ry="3.4" fill="${C.yellow}"/><ellipse cx="24.5" cy="19" rx="2.6" ry="3.4" fill="${C.yellow}"/><rect x="15" y="17" width="1" height="4" rx=".5" fill="${C.ink}"/><rect x="24" y="17" width="1" height="4" rx=".5" fill="${C.ink}"/>
    <path d="M19 24 l1 1 1 -1" stroke="${C.pink}" stroke-width="1.3" fill="none"/><path d="M14 64 v-6 M26 64 v-6" stroke="${C.white}" stroke-width=".9" stroke-opacity=".4"/>`) } },
  espalda: { name: 'Gato de espaldas', w: 44, h: 66, draw: (o = {}) => { const f = o.fill || C.orange; return svg(44, 66, `
    <path d="M22 62 C 44 62, 40 30, 34 20" stroke="${f}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M6 66 C 4 46, 10 32, 20 30 C 30 32, 34 46, 32 66 Z" fill="${f}"/><circle cx="20" cy="22" r="12" fill="${f}"/><path d="M10 16 l0 -12 9 8 z M30 16 l0 -12 -9 8 z" fill="${f}"/>
    <path d="M12 40 q8 3 16 0 M10 48 q10 3 20 0 M9 56 q11 3 22 0" stroke="${C.terra}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`) } },
  estirado: { name: 'Gato estirado', w: 92, h: 22, hangs: 0, draw: (o = {}) => { const f = o.fill || C.gray; return svg(92, 40, `
    <path d="M14 22 C 8 26, 6 34, 8 40 C 10 46, 6 52, 2 56" stroke="${f}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M10 22 C 14 10, 54 10, 74 18 L 74 22 Z" fill="${f}"/><rect x="10" y="18" width="64" height="4" fill="${f}"/>
    <circle cx="78" cy="14" r="10" fill="${f}"/><path d="M70 8 l1 -9 7 6 z M82 5 l6 -6 1 9 z" fill="${f}"/>
    <path d="M73 14 q2 2 4 0 M80 14 q2 2 4 0" stroke="${C.ink}" stroke-width="1.2" fill="none" stroke-linecap="round"/><path d="M24 14 q4 -3 8 0 M40 12 q4 -3 8 0" stroke="${C.white}" stroke-width="1.5" fill="none"/>
    <ellipse cx="64" cy="20" rx="6" ry="2.6" fill="${f}"/>`) } },
  asomado: { name: 'Gato asomado', w: 46, h: 30, draw: (o = {}) => { const f = o.fill || C.black; return svg(46, 30, `
    <path d="M6 30 C 6 14, 14 8, 23 8 C 32 8, 40 14, 40 30 Z" fill="${f}"/><path d="M9 14 l2 -12 9 8 z M37 14 l-2 -12 -9 8 z" fill="${f}"/>
    <ellipse cx="17" cy="18" rx="3" ry="3.6" fill="${C.lime}"/><ellipse cx="29" cy="18" rx="3" ry="3.6" fill="${C.lime}"/><rect x="16.5" y="15.6" width="1" height="4.8" rx=".5" fill="${C.ink}"/><rect x="28.5" y="15.6" width="1" height="4.8" rx=".5" fill="${C.ink}"/>
    <ellipse cx="8" cy="28" rx="6" ry="3.5" fill="${f}"/><ellipse cx="38" cy="28" rx="6" ry="3.5" fill="${f}"/>`) } },
  pan: { name: 'Gato pancito', w: 54, h: 38, draw: (o = {}) => { const f = o.fill || C.cream; return svg(54, 38, `
    <path d="M4 38 C 2 22, 14 14, 30 14 C 44 14, 52 22, 50 38 Z" fill="${f}"/><circle cx="16" cy="18" r="11" fill="${f}"/><path d="M7 12 l1 -10 8 7 z M25 12 l-1 -10 -8 7 z" fill="${f}"/>
    <path d="M11 18 q2 2 4 0 M17 18 q2 2 4 0" stroke="${C.ink}" stroke-width="1.2" fill="none" stroke-linecap="round"/><path d="M15 22 l1 1 1 -1" stroke="${C.pink}" stroke-width="1.2" fill="none"/>
    <path d="M30 18 c2 4 4 4 6 0 M38 20 c2 4 4 4 6 0" stroke="${C.mustard}" stroke-width="2" fill="none"/>`) } },
  jugando: { name: 'Gato jugando', w: 48, h: 64, draw: (o = {}) => { const f = o.fill || C.black; return svg(48, 64, `
    <path d="M30 60 C 46 60, 46 44, 38 40" stroke="${f}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M8 64 C 6 44, 10 30, 20 28 C 30 30, 34 44, 32 64 Z" fill="${f}"/><path d="M28 38 C 34 32, 40 26, 42 18" stroke="${f}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <circle cx="20" cy="20" r="12" fill="${f}"/><path d="M10 14 l1 -12 9 8 z M30 14 l-1 -12 -9 8 z" fill="${f}"/>
    <circle cx="15.5" cy="19" r="3" fill="${C.yellow}"/><circle cx="24.5" cy="19" r="3" fill="${C.yellow}"/><circle cx="16" cy="19.5" r="1.4" fill="${C.ink}"/><circle cx="25" cy="19.5" r="1.4" fill="${C.ink}"/>
    <circle cx="44" cy="12" r="5" fill="${C.coral}"/><path d="M40 10 q4 3 8 0 M41 15 q3 -3 6 0" stroke="${C.white}" stroke-width="1"/>`) } },
  atigrado: { name: 'Gato atigrado', w: 44, h: 64, draw: () => { const f = C.orange; return svg(44, 64, `
    <path d="M30 60 C 44 60, 44 46, 36 44" stroke="${f}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M8 64 C 6 44, 10 30, 20 28 C 30 30, 34 44, 32 64 Z" fill="${f}"/><path d="M14 64 C 14 50, 16 44, 20 42 C 24 44, 26 50, 26 64 Z" fill="${C.cream}"/>
    <circle cx="20" cy="20" r="12" fill="${f}"/><path d="M10 14 l1 -12 9 8 z M30 14 l-1 -12 -9 8 z" fill="${f}"/>
    <path d="M17 9 l1 4 M20 8 v5 M23 9 l-1 4 M9 38 q4 1 6 -2 M31 38 q-4 1 -6 -2 M8 48 q4 1 6 -2 M32 48 q-4 1 -6 -2" stroke="${C.terra}" stroke-width="2" stroke-linecap="round" fill="none"/>
    <path d="M14 19 q2 -2 4 0 M22 19 q2 -2 4 0" stroke="${C.ink}" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="M19 24 l1 1 1 -1" stroke="${C.ink}" stroke-width="1.2" fill="none"/>`) } },
}

// ---------- TAZAS ----------
const mug = (fill, pattern, w = 38) => svg(w, 34, `
  <path d="M28 10 h4 a7 7 0 0 1 0 14 h-4" stroke="${fill}" stroke-width="4" fill="none"/>
  <path d="M3 4 h26 v22 a8 8 0 0 1 -8 8 h-10 a8 8 0 0 1 -8 -8 z" fill="${fill}"/>
  <clipPath id="m${pattern.length}${fill.slice(1)}"><path d="M3 4 h26 v22 a8 8 0 0 1 -8 8 h-10 a8 8 0 0 1 -8 -8 z"/></clipPath>
  <g clip-path="url(#m${pattern.length}${fill.slice(1)})">${pattern}</g><ellipse cx="16" cy="4" rx="13" ry="2.4" fill="${C.ink}" fill-opacity=".25"/>`)
const mugs = {
  lunares: { name: 'Taza de lunares', w: 38, h: 34, draw: () => mug(C.white, [[8, 12], [18, 10], [24, 20], [10, 24], [20, 28], [13, 17]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="${C.coral}"/>`).join('') + `<path d="M3 4 h26 v22 a8 8 0 0 1 -8 8 h-10 a8 8 0 0 1 -8 -8 z" fill="none" stroke="${C.gray}" stroke-width="1.2"/>`) },
  rayas: { name: 'Taza a rayas', w: 38, h: 34, draw: () => mug(C.terra, [7, 12, 17, 22, 27].map((x) => `<line x1="${x}" y1="4" x2="${x}" y2="34" stroke="${C.cream}" stroke-width="1.6"/>`).join('')) },
  corazones: { name: 'Taza de corazones', w: 38, h: 34, draw: () => mug(C.cobalt, [[10, 14], [21, 18], [12, 26]].map(([x, y]) => `<path d="M${x} ${y + 3} l-3.5 -3.5 a2 2 0 0 1 3.5 -2.5 a2 2 0 0 1 3.5 2.5 z" fill="${C.pink}"/>`).join('')) },
  flores: { name: 'Taza con flores', w: 38, h: 34, draw: () => mug(C.blush, [[11, 15], [22, 23]].map(([x, y]) => [0, 72, 144, 216, 288].map((a) => `<circle cx="${x + 3.4 * Math.cos(a * Math.PI / 180)}" cy="${y + 3.4 * Math.sin(a * Math.PI / 180)}" r="2.3" fill="${C.coral}"/>`).join('') + `<circle cx="${x}" cy="${y}" r="1.6" fill="${C.mustard}"/>`).join('')) },
  estrellas: { name: 'Taza de estrellas', w: 38, h: 34, draw: () => mug(C.ink, [[10, 14, 4], [22, 20, 3.4], [12, 27, 3]].map(([x, y, r]) => `<path d="${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * .45 : r; return `${k ? 'L' : 'M'}${(x + rr * Math.cos(a)).toFixed(1)} ${(y + rr * Math.sin(a)).toFixed(1)}` }).join(' ')} Z" fill="${C.mustard}"/>`).join('')) },
  olas: { name: 'Taza de olas', w: 38, h: 34, draw: () => mug(C.sky, [12, 20, 28].map((y) => `<path d="M2 ${y} q3.5 -3 7 0 t7 0 t7 0 t7 0" stroke="${C.white}" stroke-width="1.6" fill="none"/>`).join('')) },
  teca: { name: 'Taza teca', w: 38, h: 34, draw: () => mug(C.lime, `<text x="16" y="23" text-anchor="middle" font-family="Instrument Serif, Georgia, serif" font-style="italic" font-size="11" fill="${C.ink}">teca</text>`) },
  platito: { name: 'Taza con platito', w: 46, h: 30, draw: () => svg(46, 30, `
    <ellipse cx="22" cy="27" rx="20" ry="3.5" fill="${C.mustard}"/><path d="M33 10 h3 a5 5 0 0 1 0 10 h-3" stroke="${C.teal}" stroke-width="3" fill="none"/>
    <path d="M8 8 h26 c0 10 -4 17 -13 17 c-9 0 -13 -7 -13 -17 z" fill="${C.teal}"/><path d="M10 14 q4 -3 8 0 t8 0 t6 0" stroke="${C.cream}" stroke-width="1.4" fill="none"/>`) },
}

// ---------- OBJETOS ----------
const objects = {
  cartelera: { name: 'Cartelera', w: 66, h: 58, text: true, draw: (o = {}) => {
    const lines = (o.text || 'HOY\nVEMOS\nUNA PELI').toUpperCase().split('\n').slice(0, 4)
    const longest = Math.max(...lines.map((l) => l.length), 1)
    const fs = Math.min(lines.length > 3 ? 7 : 8.4, 52 / (longest * 0.68))
    return svg(66, 58, `<rect x="0" y="0" width="66" height="58" rx="3" fill="${C.ink}"/><rect x="4" y="4" width="58" height="50" rx="1" fill="${C.white}"/>
      ${[...Array(9)].map((_, i) => `<line x1="5" x2="61" y1="${8 + i * 5.4}" y2="${8 + i * 5.4}" stroke="${C.gray}" stroke-width=".6"/>`).join('')}
      ${lines.map((l, i) => `<text x="33" y="${29 - (lines.length - 1) * fs * .6 + i * fs * 1.2 + 3}" text-anchor="middle" font-family="Bricolage Grotesque, Archivo, sans-serif" font-weight="800" font-size="${fs}" letter-spacing=".5" fill="${C.ink}">${l.replace(/[<&]/g, '')}</text>`).join('')}`)
  } },
  globo: { name: 'Globo terráqueo', w: 46, h: 62, draw: () => svg(46, 62, `
    <path d="M6 30 a17 17 0 0 0 34 0" stroke="${C.mustard}" stroke-width="3" fill="none"/><circle cx="23" cy="26" r="15" fill="${C.sky}"/>
    <path d="M14 18 c4 -4 10 -2 9 3 c-1 4 -7 3 -8 7 c-1 3 -4 0 -3 -4 z M28 26 c4 -2 7 2 5 6 c-2 4 -6 5 -7 1 c0 -3 -1 -5 2 -7 z M24 13 c3 -1 6 0 5 2 c-2 1 -4 1 -5 -2 z" fill="${C.green}"/>
    <path d="M23 43 v8" stroke="${C.mustard}" stroke-width="3"/><path d="M13 62 c0 -6 4 -11 10 -11 c6 0 10 5 10 11 z" fill="${C.mustard}"/>`) },
  pajaro: { name: 'Pajarito', w: 44, h: 40, draw: () => svg(44, 40, `
    <path d="M4 18 C 8 10, 20 6, 28 12 L 40 8 L 34 16 C 36 24, 28 30, 18 30 C 10 30, 6 26, 2 22 Z" fill="${C.mustard}"/><circle cx="30" cy="12" r="6" fill="${C.mustard}"/><path d="M35 11 l6 2 -6 1 z" fill="${C.ink}"/><circle cx="31" cy="11" r="1" fill="${C.ink}"/>
    <path d="M14 30 l-4 10 M22 30 l4 10" stroke="${C.ink}" stroke-width="1.4"/><path d="M10 18 c4 2 10 2 14 -2" stroke="${C.yellow}" stroke-width="2" fill="none"/>`) },
  florero: { name: 'Florero con margarita', w: 40, h: 50, draw: () => svg(40, 50, `
    <path d="M12 2 h16 l-3 10 c8 4 13 10 13 20 a17 17 0 0 1 -34 0 c0 -10 5 -16 13 -20 z" fill="${C.cobalt}"/>
    ${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<ellipse cx="${20 + 5.5 * Math.cos(a * Math.PI / 180)}" cy="${31 + 5.5 * Math.sin(a * Math.PI / 180)}" rx="3.4" ry="2.2" transform="rotate(${a} ${20 + 5.5 * Math.cos(a * Math.PI / 180)} ${31 + 5.5 * Math.sin(a * Math.PI / 180)})" fill="${C.white}"/>`).join('')}<circle cx="20" cy="31" r="3" fill="${C.mustard}"/>`) },
  arcoiris: { name: 'Arcoíris', w: 46, h: 40, draw: () => svg(46, 40, `
    <path d="M2 40 V 23 a21 21 0 0 1 42 0 V 40 h-6 V 23 a15 15 0 0 0 -30 0 V 40 z" fill="${C.pink}"/><path d="M8 40 V 23 a15 15 0 0 1 30 0 V 40 h-6 V 23 a9 9 0 0 0 -18 0 V 40 z" fill="${C.green}"/><path d="M14 40 V 23 a9 9 0 0 1 18 0 V 40 h-5 V 24 a4 4 0 0 0 -8 0 V 40 z" fill="${C.mustard}"/><path d="M19 40 V 24 a4 4 0 0 1 8 0 V 40 z" fill="${C.cobalt}"/>`) },
  reloj: { name: 'Despertador', w: 40, h: 46, draw: () => svg(40, 46, `
    <circle cx="9" cy="8" r="6" fill="${C.mustard}"/><circle cx="31" cy="8" r="6" fill="${C.mustard}"/><path d="M8 42 l-3 4 M32 42 l3 4" stroke="${C.ink}" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="20" cy="26" r="17" fill="${C.mustard}"/><circle cx="20" cy="26" r="13" fill="${C.cream}"/>${[...Array(12)].map((_, i) => { const a = i * Math.PI / 6; return `<line x1="${20 + 11 * Math.cos(a)}" y1="${26 + 11 * Math.sin(a)}" x2="${20 + 12.4 * Math.cos(a)}" y2="${26 + 12.4 * Math.sin(a)}" stroke="${C.ink}" stroke-width="1"/>` }).join('')}
    <path d="M20 26 V 17 M20 26 L 26 29" stroke="${C.ink}" stroke-width="1.8" stroke-linecap="round"/><circle cx="20" cy="26" r="1.5" fill="${C.coral}"/>`) },
  mano: { name: 'Mano de paz', w: 34, h: 58, draw: () => svg(34, 58, `
    <path d="M9 30 L 6 6 a3 3 0 0 1 6 -1 L 16 24 L 19 4 a3 3 0 0 1 6 1 L 23 28 c4 0 7 3 7 8 v4 c0 6 -4 10 -10 10 h-6 c-6 0 -9 -4 -9 -9 v-6 c0 -3 1 -5 4 -5 z" fill="${C.mustard}"/>
    <path d="M10 36 h10 M10 41 h12" stroke="${C.terra}" stroke-width="1.4" stroke-linecap="round"/><rect x="5" y="50" width="24" height="8" rx="2" fill="${C.ink}"/>`) },
  difusor: { name: 'Difusor', w: 26, h: 56, draw: () => svg(26, 56, `
    <path d="M8 26 L 4 2 M13 26 L 13 0 M18 26 L 22 3" stroke="${C.brown}" stroke-width="1.3"/>
    <path d="M9 26 h8 v4 c6 3 8 8 8 14 a12 12 0 0 1 -24 0 c0 -6 2 -11 8 -14 z" fill="${C.teal}"/><rect x="8" y="24" width="10" height="4" rx="1" fill="${C.ink}"/>`) },
  lampara: { name: 'Lámpara plisada', w: 44, h: 70, draw: () => svg(44, 70, `
    <path d="M10 2 h24 l8 24 h-40 z" fill="${C.cream}"/>${[8, 14, 20, 26, 32].map((x, i) => `<line x1="${x + 3 + i * .5}" y1="2" x2="${x - 2 + i * 2.5}" y2="26" stroke="${C.mustard}" stroke-width="1"/>`).join('')}
    <rect x="20" y="26" width="4" height="10" fill="${C.brown}"/><path d="M12 70 c-4 -10 -2 -30 10 -34 c12 4 14 24 10 34 z" fill="${C.blush}"/>`) },
  lampara_lima: { name: 'Lámpara teca', w: 44, h: 78, draw: () => svg(44, 78, `
    <path d="M9 0 h26 l9 26 h-44 z" fill="${C.lime}"/><rect x="20" y="26" width="4" height="44" fill="${C.ink}"/><rect x="8" y="70" width="28" height="8" rx="4" fill="${C.ink}"/>`) },
  pila_libros: { name: 'Pila de libros', w: 60, h: 34, draw: () => svg(60, 34, `
    <rect x="2" y="24" width="56" height="10" rx="1" fill="${C.teal}"/><rect x="6" y="14" width="50" height="10" rx="1" fill="${C.coral}"/><rect x="3" y="4" width="48" height="10" rx="1" fill="${C.mustard}"/>
    <path d="M8 29 h44 M12 19 h38 M8 9 h38" stroke="${C.cream}" stroke-width="1" stroke-dasharray="2 3"/>`) },
}

// ---------- CUADROS ----------
const frames = {
  foto: { name: 'Portarretrato', w: 46, h: 58, photo: true, draw: (o = {}) => svg(46, 58, `
    <rect x="0" y="0" width="46" height="58" rx="2" fill="${C.brown}"/><rect x="5" y="5" width="36" height="48" fill="${C.cream}"/>
    ${o.photo ? `<image href="${o.photo}" x="5" y="5" width="36" height="48" preserveAspectRatio="xMidYMid slice"/>` : `<circle cx="16" cy="18" r="4" fill="${C.mustard}"/><path d="M5 53 L 18 34 L 26 44 L 32 38 L 41 53 Z" fill="${C.leaf}"/>`}`) },
  hoja: { name: 'Cuadro hoja', w: 52, h: 66, draw: () => svg(52, 66, `
    <path d="M4 0 h44 a4 4 0 0 1 4 4 v58 a4 4 0 0 1 -4 4 h-44 a4 4 0 0 1 -4 -4 v-58 a4 4 0 0 1 4 -4 z" fill="${C.terra}"/><path d="M0 6 a6 6 0 0 1 6 -6 M46 0 a6 6 0 0 1 6 6 M52 60 a6 6 0 0 1 -6 6 M6 66 a6 6 0 0 1 -6 -6" stroke="${C.brown}" stroke-width="3" fill="none"/>
    <rect x="7" y="7" width="38" height="52" fill="${C.pink}"/>
    <path d="M26 54 V 16 M26 22 l-8 -6 M26 22 l8 -6 M26 30 l-10 -5 M26 30 l10 -5 M26 38 l-11 -4 M26 38 l11 -4 M26 46 l-9 -3 M26 46 l9 -3" stroke="${C.coral}" stroke-width="3.4" stroke-linecap="round"/>`) },
  figura: { name: 'Cuadro figura', w: 58, h: 66, draw: () => svg(58, 66, `
    <rect x="0" y="0" width="58" height="66" fill="${C.sage}"/><rect x="5" y="5" width="48" height="56" fill="${C.cream}"/>
    <path d="M22 52 c-6 -2 -8 -10 -4 -16 c2 -4 0 -8 4 -12 c3 -3 8 -2 9 2 c2 5 -2 7 0 10 c4 1 10 6 8 12 c-2 4 -8 2 -10 4 c-2 2 -4 2 -7 0 z" fill="${C.cobalt}"/><circle cx="30" cy="16" r="5" fill="${C.cobalt}"/>`) },
  espejo: { name: 'Espejo', w: 40, h: 58, draw: () => svg(40, 58, `
    <path d="M20 0 c6 0 8 4 12 4 c4 0 6 4 6 8 v34 c0 4 -2 8 -6 8 c-4 0 -6 4 -12 4 c-6 0 -8 -4 -12 -4 c-4 0 -6 -4 -6 -8 v-34 c0 -4 2 -8 6 -8 c4 0 6 -4 12 -4 z" fill="${C.mustard}"/>
    <rect x="7" y="8" width="26" height="42" rx="12" fill="${C.sky}" fill-opacity=".6"/><path d="M12 18 l8 -6 M12 26 l14 -12" stroke="${C.white}" stroke-width="2" stroke-linecap="round"/>`) },
  ondulado: { name: 'Cuadro ondulado', w: 54, h: 64, draw: () => svg(54, 64, `
    <path d="M6 2 q6 -4 14 0 t14 0 t14 0 q4 4 2 12 t0 14 t0 14 t0 14 q-4 6 -14 4 t-14 0 t-14 0 q-6 -2 -4 -12 t0 -14 t0 -14 t0 -14 q-2 -2 2 -4 z" fill="${C.pink}"/>
    <rect x="9" y="9" width="36" height="46" fill="${C.cream}"/><path d="M27 48 c-1 -6 1 -12 0 -18" stroke="${C.green}" stroke-width="1.6"/><path d="M21 30 l4 4 2 -5 2 5 4 -4 c0 8 -4 10 -6 10 c-2 0 -6 -2 -6 -10 z" fill="${C.coral}"/>
    <path d="M22 40 h10 c2 4 4 6 4 10 h-18 c0 -4 2 -6 4 -10 z" fill="${C.yellow}"/>`) },
}

export const CATEGORIES = [
  { key: 'plantas', name: 'Plantas', items: plants },
  { key: 'velas', name: 'Velas', items: candles },
  { key: 'gatos', name: 'Gatos', items: cats },
  { key: 'tazas', name: 'Tazas', items: mugs },
  { key: 'objetos', name: 'Objetos', items: objects },
  { key: 'cuadros', name: 'Cuadros', items: frames },
]
// Acceso directo: ART['plantas/monstera'].draw()
export const ART = Object.fromEntries(CATEGORIES.flatMap((c) => Object.entries(c.items).map(([k, v]) => [`${c.key}/${k}`, { ...v, cat: c.key }])))

// Dibujo a una escala dada (el viewBox mantiene las proporciones)
export function drawAt(item, s = 1, opts = {}) {
  return item.draw(opts).replace(/width="([\d.]+)" height="([\d.]+)"/, (_, w, h) => `width="${(w * s).toFixed(1)}" height="${(h * s).toFixed(1)}"`)
}
// Alto que ocupa arriba del estante (lo que cuelga queda por debajo)
export const standH = (item) => item.h - (item.hangs || 0)
