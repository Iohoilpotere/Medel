# CHANGELOG

## v0.0.2.0 (Feature)
- Introdotto **Strategy** per sblocco step (`src/strategies/unlock-strategies.js`) e wrapper `computeUnlockedCount(...)` nel viewer.
- Estratto **Facade** di persistenza (`src/persistence/session-store.js`) e integrazione in `viewer.js`.
- Aggiunti **Decorator** per comportamenti (`src/behaviors/decorators.js`) per lock/persist su conferma.
- Creato **StagePolicy** e import in `stage.js` (centralizzazione guard).
- Introdotto file di **config** (`src/config/app-config.js`) e rimpiazzati numeri magici comuni (timeout, colori, opacity).
- Note inline per completare il wiring (non invasive).
