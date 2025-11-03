
# Smoke tests (Playwright)

Esegui:
```bash
npm i
npm run test:smoke
```

I test aprono `index.html` in modalità file:// e verificano:
1) `lockOnSelect` su checkbox singola: dopo la selezione con lock attivo, un secondo click non deseleziona.
2) `itemsAlign` su radio/checkboxgroup: allineamento start/center/end.
3) PDF in `viewMode='page'`: lo zoom del canvas non altera la scala del contenuto PDF.

Nota: i selettori potrebbero necessitare di adeguamenti in base alla UI.
