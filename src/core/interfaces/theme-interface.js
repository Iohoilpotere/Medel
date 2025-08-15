/**
 * Theme interfaces and contracts
 */

/**
 * @interface ITheme
 * Interface for theme implementations
 */
export class ITheme {
  /**
   * Get theme ID
   * @returns {string}
   */
  getId() {
    throw new Error('getId must be implemented');
  }

  /**
   * Get theme label
   * @returns {string}
   */
  getLabel() {
    throw new Error('getLabel must be implemented');
  }

  /**
   * Apply theme to element
   * @param {HTMLElement} [root=document.documentElement]
   */
  apply(root) {
    throw new Error('apply must be implemented');
  }

  /**
   * Get theme tokens
   * @returns {Object<string, string>}
   */
  getTokens() {
    throw new Error('getTokens must be implemented');
  }
}

/**
 * @interface IThemeManager
 * Interface for theme management
 */
export class IThemeManager {
  /**
   * Register theme
   * @param {ITheme} theme
   */
  register(theme) {
    throw new Error('register must be implemented');
  }

  /**
   * Apply theme by ID
   * @param {string} themeId
   */
  apply(themeId) {
    throw new Error('apply must be implemented');
  }

  /**
   * Get available themes
   * @returns {Array<ITheme>}
   */
  getThemes() {
    throw new Error('getThemes must be implemented');
  }

  /**
   * Get current theme
   * @returns {ITheme|null}
   */
  getCurrentTheme() {
    throw new Error('getCurrentTheme must be implemented');
  }
}