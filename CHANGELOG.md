# CHANGELOG

## v0.0.5.0 (Feature)
- Implementata valutazione globale dell'interattività alla pressione di **Conferma**:
  - ad ogni click gli indicatori vengono ricalcolati da zero a partire dai valori di default (es. Pippo=100),
    applicando in ordine tutti gli effetti configurati sugli step confermati.
- Gestione dei **flag** con logica *last-write-wins*: se uno step successivo imposta un flag a `false`,
  questo rimane `false` anche tornando a modificare step precedenti.
- Utilizzo dei valori salvati da `MedelPersistence` v5 per ricostruire le scelte dell'utente su tutti gli step.
- Sistemato l'ordine degli `import` in `viewer.js` (nessun `import` dopo codice eseguibile).
- Ripulito il listener del tasto **Conferma** e i blocchi `try/catch` in `viewer.js` per garantire zero errori di compilazione.

## v0.0.2.0 (Feature)
- Introdotto **Strategy** per sblocco step (`src/strategies/unlock-strategies.js`) e wrapper `computeUnlockedCount(...)` nel viewer.
- Estratto **Facade** di persistenza (`src/persistence/session-store.js`) e integrazione in `viewer.js`.
- Aggiunti **Decorator** per comportamenti (`src/behaviors/decorators.js`) per lock/persist su conferma.
- Creato **StagePolicy** e import in `stage.js` (centralizzazione guard).
- Introdotto file di **config** (`src/config/app-config.js`) e rimpiazzati numeri magici comuni (timeout, colori, opacity).
- Note inline per completare il wiring (non invasive).

## v0.0.6.0 (Feature)
- Scheda Interattività: aggiunto campo **"Domanda risultati"** per gli elementi interattivi (checkbox, radiogroup, checkboxgroup, tablecheck).
- Possibilità di collegare il titolo dei risultati al testo di una **etichetta esistente**, selezionabile da menù, salvando il riferimento tramite `id` dell'etichetta.
- La configurazione è serializzata in `el.props.interactivity.question` e ripristinata correttamente al reload del caso.
- Corretto il salvataggio di `interactivity` in `InteractivityPanel` per l'uso con `UpdatePropertyCommand` (undo/redo sicuro).
- Sistemato il messaggio di hint nella scheda Interattività quando nessun elemento o più elementi sono selezionati.

## v0.0.7.0

- Aggiunta slide di riepilogo finale nel viewer:
  - quando l'ultimo step è completato e si clicca Avanti, viene mostrato un riepilogo full-screen.
  - mostra per ogni elemento interattivo (checkbox, checkboxgroup, radiogroup, tablecheck):
    - il titolo domanda (manuale o collegato a label via `question`).
    - le opzioni selezionate evidenziate.
    - le opzioni non selezionate in versione attenuata.
  - layout a griglia responsiva che si adatta al numero di risposte.
- Nessuna modifica alla logica dell'editor o alle azioni di interattività esistenti.
