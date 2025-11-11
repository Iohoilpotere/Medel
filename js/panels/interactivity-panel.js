
import { $ } from '../utils/dom.js';
import { UpdatePropertyCommand } from '../core/commands/update-prop.js';

/**
 * InteractivityPanel
 * - Rende una UI per configurare gli effetti su Indicatori/Flag al CONFIRM
 * - Salva in el.props.interactivity con schema:
 *   { checkbox:{ actions:[ {type:'indicator', id:'ID', delta:5}, {type:'flag', id:'ID', set:true} ] },
 *     options:{ '0':[...], '1':[...], ... } }
 */
export class InteractivityPanel{
  constructor(app){
    this.app = app;
    this.form = $('#interactivityForm');
  }

  _actionsFor(target, key){
    const data = target.getProp('interactivity') || {};
    if(key==='checkbox'){
      return Array.isArray(data.checkbox?.actions) ? data.checkbox.actions.slice() : [];
    }
    const opts = data.options || {};
    const arr = opts?.[String(key)] || [];
    return Array.isArray(arr) ? arr.slice() : [];
  }

  _saveActions(target, key, actions){
    const prev = target.getProp('interactivity');
    const prevCopy = prev ? JSON.parse(JSON.stringify(prev)) : null;
    const data = prev ? JSON.parse(JSON.stringify(prev)) : {};
    if(key === 'checkbox'){
      data.checkbox = { actions: actions };
    }else{
      data.options = Object.assign({}, data.options || {});
      data.options[String(key)] = actions;
    }
    const oldSnapshot = [prevCopy];
    this.app.cmd.execute(new UpdatePropertyCommand([target], 'interactivity', data, oldSnapshot));
  }

    
  /**
   * Legge la configurazione della domanda risultati per l'elemento target.
   * Mantiene backward compatibility se interactivity.question non esiste.
   */
  _getResultQuestionConfig(target){
    const inter = target.getProp('interactivity') || {};
    const q = inter.question || {};
    const mode = q.mode || (q.labelId ? 'label' : 'manual');
    return {
      mode,
      text: typeof q.text === 'string' ? q.text : '',
      labelId: q.labelId || null
    };
  }

  /**
   * Salva la configurazione della domanda risultati dentro el.props.interactivity.question.
   * - mode: 'manual' | 'label'
   * - text: testo manuale
   * - labelId: id dell'etichetta referenziata
   */
  _saveResultQuestionConfig(target, cfg){
    const prev = target.getProp('interactivity');
    const prevCopy = prev ? JSON.parse(JSON.stringify(prev)) : null;
    const data = prev ? JSON.parse(JSON.stringify(prev)) : {};

    const hasManual = !!(cfg && cfg.mode === 'manual' && cfg.text && cfg.text.trim().length);
    const hasLabel = !!(cfg && cfg.mode === 'label' && cfg.labelId);

    if(hasManual || hasLabel){
      data.question = {
        mode: cfg.mode || (cfg.labelId ? 'label' : 'manual'),
        text: cfg.mode === 'manual' ? (cfg.text || '') : '',
        labelId: cfg.mode === 'label' ? (cfg.labelId || null) : null
      };
    }else{
      // Nessuna configurazione valida → rimuovi la chiave per non sporcare il JSON
      if(data.question){
        delete data.question;
      }
    }

    const oldSnapshot = [prevCopy];
    this.app.cmd.execute(new UpdatePropertyCommand([target], 'interactivity', data, oldSnapshot));
  }

  _findElementById(id){
    if(!id || !this.app || !this.app.stage || !Array.isArray(this.app.stage.elements)){
      return null;
    }
    const elements = this.app.stage.elements;
    for(const el of elements){
      try{
        const elId = (el.getProp && el.getProp('id'))
          || (el.props && el.props.get && el.props.get('id'))
          || el.id;
        if(elId === id){
          return el;
        }
      }catch(_e){
        // ignora
      }
    }
    return null;
  }

  _getAllLabelElements(){
    if(!this.app || !this.app.stage || !Array.isArray(this.app.stage.elements)){
      return [];
    }
    return this.app.stage.elements.filter(el => {
      const t = el.constructor?.type || el.type || '';
      return t === 'label';
    });
  }

  _resolveQuestionPreviewText(target){
    const q = this._getResultQuestionConfig(target);
    if(q.mode === 'label' && q.labelId){
      const label = this._findElementById(q.labelId);
      if(label){
        try{
          const txt = (label.getProp && label.getProp('text')) || '';
          if(txt){
            return String(txt);
          }
        }catch(_e){
          // fallback sotto
        }
      }
    }
    return q.text || '';
  }

  /**
   * Mostra un piccolo menù ancorato al bottone per scegliere l'etichetta di riferimento.
   */
  _openLabelPicker(target, anchorInput, anchorBtn){
    const labels = this._getAllLabelElements();
    if(!labels.length){
      window.alert('Nessuna etichetta disponibile nello step corrente da collegare.');
      return;
    }

    // Chiudi eventuale menù precedente
    if(this._activeLabelMenu && this._activeLabelMenu.parentNode){
      this._activeLabelMenu.parentNode.removeChild(this._activeLabelMenu);
      this._activeLabelMenu = null;
    }

    const menu = document.createElement('div');
    menu.className = 'prop-inline-menu';

    const rect = anchorBtn.getBoundingClientRect();
    menu.style.position = 'absolute';
    menu.style.left = rect.left + 'px';
    menu.style.top = (rect.bottom + 4) + 'px';

    labels.forEach(el => {
      let id = null;
      let text = '';
      try{
        id = (el.getProp && el.getProp('id'))
          || (el.props && el.props.get && el.props.get('id'))
          || el.id
          || '';
      }catch(_e){
        id = '';
      }
      try{
        text = (el.getProp && el.getProp('text')) || '';
      }catch(_e){
        text = '';
      }
      const labelBtn = document.createElement('button');
      labelBtn.type = 'button';
      labelBtn.className = 'prop-inline-menu-item';
      const display = (text || id || '(senza testo)').toString();
      labelBtn.textContent = display.length > 80 ? display.slice(0,77) + '…' : display;
      labelBtn.addEventListener('click', () => {
        this._saveResultQuestionConfig(target, {
          mode: 'label',
          labelId: id,
          text: ''
        });
        if(anchorInput){
          anchorInput.value = text || '';
        }
        if(menu.parentNode){
          menu.parentNode.removeChild(menu);
        }
        this._activeLabelMenu = null;
      });
      menu.appendChild(labelBtn);
    });

    document.body.appendChild(menu);
    this._activeLabelMenu = menu;

    const close = (ev) => {
      if(!menu.contains(ev.target) && ev.target !== anchorBtn && ev.target !== anchorInput){
        if(menu.parentNode){
          menu.parentNode.removeChild(menu);
        }
        this._activeLabelMenu = null;
        document.removeEventListener('mousedown', close);
      }
    };
    // Delay per non chiudere subito sul click del bottone
    setTimeout(() => {
      document.addEventListener('mousedown', close);
    }, 0);
  }

  /**
   * Render della sezione "Domanda risultati" con input + bottone per bind etichetta.
   */
  _renderQuestionGroup(target){
    const group = document.createElement('div');
    group.className = 'prop-group';

    const title = document.createElement('h4');
    title.textContent = 'Domanda risultati';
    group.appendChild(title);

    const row = document.createElement('div');
    row.className = 'prop-row';
    group.appendChild(row);

    const label = document.createElement('div');
    label.textContent = 'Titolo sopra alla scelta';
    label.style.fontSize = '11px';
    row.appendChild(label);

    const inputWrap = document.createElement('div');
    inputWrap.className = 'prop-input-with-button';
    row.appendChild(inputWrap);

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'prop-input';
    input.placeholder = 'Inserisci il testo oppure collega un\'etichetta';
    input.value = this._resolveQuestionPreviewText(target);
    inputWrap.appendChild(input);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'prop-inline-btn';
    btn.title = 'Collega un\'etichetta esistente';
    btn.textContent = '⧉';
    inputWrap.appendChild(btn);

    // Digitazione manuale → salva in modalità "manual"
    input.addEventListener('input', () => {
      this._saveResultQuestionConfig(target, {
        mode: 'manual',
        text: input.value || '',
        labelId: null
      });
    });

    // Selezione etichetta
    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      this._openLabelPicker(target, input, btn);
    });

    return group;
  }
_renderActionRow(target, key, action, idx){
    const row = document.createElement('div');
    row.className = 'prop-row';

    // Select unificato: [I] indicatori, [F] flag
    const targetSelect = document.createElement('select');

    const indicators = (this.app && this.app.indicators && Array.isArray(this.app.indicators.items))
      ? this.app.indicators.items
      : [];
    const flags = (this.app && this.app.flags && Array.isArray(this.app.flags.items))
      ? this.app.flags.items
      : [];

    const addOption = (value, label) => {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = label;
      targetSelect.appendChild(opt);
    };

    indicators.forEach(ind => {
      addOption(`I:${ind.id}`, `[I] ${ind.name || ind.id}`);
    });

    flags.forEach(f => {
      addOption(`F:${f.id}`, `[F] ${f.name || f.id}`);
    });

    // Inizializza selezione in base all'azione esistente
    if (action && action.id) {
      const prefix = action.type === 'flag' ? 'F' : 'I';
      const keyVal = `${prefix}:${action.id}`;
      if (targetSelect.querySelector(`option[value="${keyVal}"]`)) {
        targetSelect.value = keyVal;
      }
    }

    // Se non settato o non trovato, forza primo valore disponibile
    if (!targetSelect.value && targetSelect.options.length > 0) {
      targetSelect.value = targetSelect.options[0].value;
      const [kind, id] = targetSelect.value.split(':');
      action.type = (kind === 'F') ? 'flag' : 'indicator';
      action.id = id || null;
    } else if (!action.type || !action.id) {
      // Azione vuota ma niente opzioni disponibili → mantieni nullo
      action.type = action.type || 'indicator';
      action.id = action.id || null;
    }

    row.appendChild(targetSelect);

    const commit = () => {
      const list = this._actionsFor(target, key);
      list[idx] = Object.assign({}, action);
      this._saveActions(target, key, list);
    };

    let valCtrl = null;

    const rebuildValueControl = () => {
      if (valCtrl && valCtrl.parentNode) {
        valCtrl.parentNode.removeChild(valCtrl);
      }

      if (action.type === 'flag') {
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = !!action.set;
        input.addEventListener('change', () => {
          action.set = !!input.checked;
          commit();
        });
        valCtrl = input;
      } else {
        const input = document.createElement('input');
        input.type = 'number';
        input.step = '1';
        const current = Number(action.delta || 0);
        input.value = Number.isNaN(current) ? '0' : String(current);
        input.addEventListener('input', () => {
          const raw = Number(input.value || 0);
          action.delta = Number.isNaN(raw) ? 0 : raw;
          commit();
        });
        valCtrl = input;
      }

      row.appendChild(valCtrl);
    };

    targetSelect.addEventListener('change', () => {
      const raw = targetSelect.value || '';
      const sep = raw.indexOf(':');
      if (sep > 0) {
        const kind = raw.slice(0, sep);
        const id = raw.slice(sep + 1);
        action.type = (kind === 'F') ? 'flag' : 'indicator';
        action.id = id || null;
        rebuildValueControl();
        commit();
      }
    });

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.textContent = '✕';
    delBtn.title = 'Rimuovi';
    delBtn.className = 'btn-icon danger';
    delBtn.addEventListener('click', () => {
      const list = this._actionsFor(target, key);
      list.splice(idx, 1);
      this._saveActions(target, key, list);
      this.render();
    });
    row.appendChild(delBtn);

    rebuildValueControl();
    return row;
  }

  _renderForOption(target, key, title){
    const group = document.createElement('div'); group.className='prop-group';
    const h = document.createElement('h4'); h.textContent = title; group.appendChild(h);
    const content = document.createElement('div'); content.className='prop-group-content'; group.appendChild(content);

    const actions = this._actionsFor(target, key);
    actions.forEach((a,i)=> content.appendChild(this._renderActionRow(target, key, Object.assign({},a), i)));

    const addBtn = document.createElement('button'); addBtn.textContent='Aggiungi azione'; addBtn.type='button';
    addBtn.addEventListener('click', ()=>{
      const list = this._actionsFor(target, key);
      list.push({ type:'indicator', id:(this.app.indicators?.items?.[0]?.id||null), delta:0 });
      this._saveActions(target, key, list);
      this.render();
    });
    content.appendChild(addBtn);
    return group;
  }

  render(){
    if(!this.form) return;
    const targets = (this.app.stage && this.app.stage.selected) || [];
    this.form.innerHTML = '';

    // Supportiamo la configurazione solo quando c'è un singolo elemento selezionato
    if(!targets || targets.length !== 1){
      const g = document.createElement('div');
      g.className = 'prop-group';
      const h = document.createElement('h4');
      h.textContent = 'Interattività';
      g.appendChild(h);
      const p = document.createElement('div');
      p.className = 'prop-hint';
      p.textContent = 'Seleziona un solo elemento interattivo per configurare azioni e domanda risultati.';
      g.appendChild(p);
      this.form.appendChild(g);
      return;
    }

    const target = targets[0];
    const type = target.constructor?.type || target.type || '';

    const supportsInteractivity =
      type === 'checkbox' ||
      type === 'radiogroup' ||
      type === 'checkboxgroup' ||
      type === 'tablecheck';

    if(!supportsInteractivity){
      const g = document.createElement('div');
      g.className = 'prop-group';
      const h = document.createElement('h4');
      h.textContent = 'Interattività';
      g.appendChild(h);
      const p = document.createElement('div');
      p.className = 'prop-hint';
      p.textContent = 'L\'elemento selezionato non supporta ancora configurazioni di interattività.';
      g.appendChild(p);
      this.form.appendChild(g);
      return;
    }

    // 1) Domanda risultati (titolo sopra alla scelta)
    this.form.appendChild(this._renderQuestionGroup(target));

    // 2) Azioni collegate alle scelte (logica esistente)
    if(type === 'checkbox'){
      // Checkbox singola: una sola sezione "Se selezionato"
      const g = this._renderForOption(target, 'checkbox', 'Se selezionato');
      this.form.appendChild(g);
      return;
    }

    // Multi-opzione: per ogni opzione, una sezione separata
    let items = [];
    if(type === 'radiogroup' || type === 'checkboxgroup' || type === 'tablecheck'){
      const raw = target.getProp('items');
      items = Array.isArray(raw) ? raw : [];
    }

    if(!items || items.length === 0){
      const g = document.createElement('div');
      g.className = 'prop-group';
      const h = document.createElement('h4');
      h.textContent = 'Interattività';
      g.appendChild(h);
      const p = document.createElement('div');
      p.className = 'prop-hint';
      p.textContent = 'Definisci prima le opzioni dell\'elemento per configurare le azioni per risposta.';
      g.appendChild(p);
      this.form.appendChild(g);
      return;
    }

    items.forEach((label, idx) => {
      const title = `Opzione ${idx + 1} — ${String(label)}`;
      this.form.appendChild(this._renderForOption(target, String(idx), title));
    });
  }
}
