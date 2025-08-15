// src/ui/themes/theme-factory.js

// Classe base
export class AbstractTheme {
  constructor(id, label, tokens) {
    this.id = id;       // "dark" | "light"
    this.label = label; // "Scuro" | "Chiaro"
    this.tokens = tokens; // mappa CSS vars -> valori
  }
  apply(root = document.documentElement) {
    Object.entries(this.tokens).forEach(([k, v]) => {
      root.style.setProperty(k, v);
    });
  }
}

// === Temi concreti ==========================================================
export class DarkTheme extends AbstractTheme {
  constructor() {
    super('dark', 'Scuro', {
      /* base */
      '--bg': '#0e0f13',
      '--fg': '#e9ecef',
      '--fg-muted': '#cbd3da',

      /* pannelli */
      '--panel-bg': '#21252b',
      '--panel-border': 'rgba(255,255,255,.12)',
      '--panel-handle-bg': '#1c1f24',
      '--panel-handle-fg': '#e9ecef',
      '--panel-handle-border': 'rgba(255,255,255,.15)',

      /* stage/canvas + griglia */
      '--canvas-bg': '#0b0c10',
      '--grid-color': 'rgba(255,255,255,.12)',
      '--grid-color-sub': 'rgba(255,255,255,.06)',

      /* thumbs */
      '--thumb-bg': '#13151a',
      '--thumb-border': 'rgba(255,255,255,.14)',

      /* badge/label */
      '--badge-bg': 'rgba(255,255,255,.15)',
      '--badge-fg': '#e9ecef',

      /* pulsanti outline (toolbar/pannelli) */
      '--btn-outline-fg': '#e9ecef',
      '--btn-outline-border': 'rgba(255,255,255,.25)',
      '--btn-outline-hover-bg': 'rgba(255,255,255,.10)',
      '--btn-outline-hover-fg': '#ffffff',
      '--btn-outline-hover-border': 'rgba(255,255,255,.35)',
    });
  }
}

export class LightTheme extends AbstractTheme {
  constructor() {
    super('light', 'Chiaro', {
      /* base */
      '--bg': '#f5f7fb',
      '--fg': '#101217',
      '--fg-muted': '#4a5568',

      /* pannelli */
      '--panel-bg': '#ffffff',
      '--panel-border': 'rgba(0,0,0,.12)',
      '--panel-handle-bg': '#f0f2f6',
      '--panel-handle-fg': '#101217',
      '--panel-handle-border': 'rgba(0,0,0,.15)',

      /* stage/canvas + griglia */
      '--canvas-bg': '#ffffff',
      '--grid-color': 'rgba(0,0,0,.10)',
      '--grid-color-sub': 'rgba(0,0,0,.05)',

      /* thumbs */
      '--thumb-bg': '#f4f6f8',
      '--thumb-border': 'rgba(0,0,0,.12)',

      /* badge/label */
      '--badge-bg': 'rgba(0,0,0,.08)',
      '--badge-fg': '#101217',

      /* pulsanti outline (toolbar/pannelli) */
      '--btn-outline-fg': '#101217',
      '--btn-outline-border': 'rgba(0,0,0,.28)',
      '--btn-outline-hover-bg': 'rgba(0,0,0,.06)',
      '--btn-outline-hover-fg': '#000000',
      '--btn-outline-hover-border': 'rgba(0,0,0,.38)',
    });
  }
}

// === Factory/manager ========================================================
export class ThemeFactory {
  static _themes = [new DarkTheme(), new LightTheme()];
  static _current = null;

  static list() { return this._themes; }
  static getById(id) { return this._themes.find(t => t.id === id) || this._themes[0]; }

  static apply(themeOrId) {
    const theme = (typeof themeOrId === 'string') ? this.getById(themeOrId) : themeOrId;
    if (!theme) return;
    theme.apply(document.documentElement);
    document.documentElement.setAttribute('data-theme', theme.id);
    this._current = theme;
    try { localStorage.setItem('me_theme', theme.id); } catch {}
  }

  static get currentTheme() {
    if (this._current) return this._current;
    const saved = (() => { try { return localStorage.getItem('me_theme'); } catch { return null; } })();
    this._current = this.getById(saved || 'dark');
    return this._current;
  }

  static init(defaultId = 'dark') {
    const saved = (() => { try { return localStorage.getItem('me_theme'); } catch { return null; } })();
    const id = saved || defaultId;
    this.apply(id);
  }
}

// (compatibilità opzionale)
export const THEMES = ThemeFactory.list();
