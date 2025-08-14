export const $ = (s, c = document) => c.querySelector(s);
export const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const uid = (p = 'el') => `${p}-${Math.random().toString(36).slice(2, 8)}`;
export const snapTo = (v, grid) => grid ? Math.round(v / grid) * grid : v;
export const pxToPct = (px, base) => (base ? (px / base * 100) : 0);
export const pctToPx = (pct, base) => (base * pct / 100);
export const clientToStage = (ev, stage) => { const r = stage.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; };