/**
 * Default configuration values for the editor
 */

export const ELEMENT_DEFAULTS = {
  label: {
    x: 10,
    y: 10,
    w: 30,
    h: 10,
    text: 'Etichetta',
    style: {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: 2.2,
      fontSizeUnit: 'vw',
      fontWeight: 500,
      fontStyle: 'normal',
      letterSpacing: 0,
      lineHeight: 1.2,
      textTransform: 'none',
      textColor: '#ffffff',
      textStrokeWidth: 0,
      textStrokeColor: '#000000',
      textShadow: { x: 0, y: 0, blur: 0, color: 'rgba(0,0,0,0)' },
      hAlign: 'left',
      vAlign: 'middle',
      backgroundColor: 'transparent',
      border: { color: 'rgba(255,255,255,.0)', width: 0, style: 'solid', radius: 0 },
      padding: { top: 8, right: 8, bottom: 8, left: 8 },
      opacity: 1,
    },
  },
  image: {
    x: 20,
    y: 25,
    w: 35,
    h: 25,
    src: '',
    alt: '',
    fit: 'cover',
  },
  textbox: {
    x: 12,
    y: 40,
    w: 35,
    h: 8,
    name: 'campo',
    placeholder: 'Inserisci testo…',
    align: 'left',
    isPassword: false,
    multiline: false,
    maxLength: null,
    pattern: '',
  },
  checkbox: {
    x: 12,
    y: 50,
    w: 25,
    h: 5,
    label: 'Voce',
    name: 'chk1',
    checked: false,
  },
  radiogroup: {
    x: 12,
    y: 58,
    w: 35,
    h: 10,
    name: 'opt',
    options: ['A', 'B', 'C'],
    inline: false,
  },
};

export const EDITOR_DEFAULTS = {
  grid: 16,
  maxHistorySize: 100,
  mergingTimeWindow: 500,
  minElementSize: { w: 1, h: 1 },
  snapTolerance: 0.06,
};

export const STAGE_DEFAULTS = {
  aspectRatios: {
    landscape: 16 / 9,
    portrait: 9 / 16,
  },
  defaultOrientation: 'landscape',
  gridColor: 'rgba(255, 255, 255, .12)',
  gridColorSub: 'rgba(255, 255, 255, .06)',
};