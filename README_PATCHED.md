# MEDEL (Patched) — v0.0.2.0

Questa build integra pattern e configura parametri senza rompere l'API esistente.
Refactor **incrementale**: i vecchi metodi restano (rinominati o wrappati).

## Integrazione rapida
- In `viewer.js`: usa `computeUnlockedCount(...)` (ora Strategy-based) e `saveSession/applySession` dal Facade.
- In `stage.js`: chiama `applyStagePolicy(this, this.bus)` al termine del costruttore.
- Se hai elementi custom: applica `decorate(el, LockOnConfirm(bus), PersistOnConfirm(store))`.

## Config
Vedi `src/config/app-config.js` per soglie/timeout/colori (niente numeri magici hard-coded).

