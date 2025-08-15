export default class ThemeManager {
  constructor() {
    this._themes = new Map(); // id -> instance AbstractTheme
    this.current = null;
  }
  register(themeInstance) {
    this._themes.set(themeInstance.id, themeInstance);
  }
  list() {
    return [...this._themes.values()];
  }
  apply(id) {
    const t = this._themes.get(id);
    if (!t) return;
    t.apply(document.documentElement);
    this.current = id;
    try { localStorage.setItem('medel_theme', id); } catch {}
  }
  initFromStorage(defaultId = 'dark') {
    let id = defaultId;
    try { id = localStorage.getItem('medel_theme') || defaultId; } catch {}
    this.apply(id);
  }
}
