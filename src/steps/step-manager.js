import { $, $$ } from '../core/utils.js';
import { Step, Category } from './step-models.js';
import { AddStepCommand, DeleteStepCommand, ChangeStepPropertyCommand, AddCategoryCommand } from '../commands/step-commands.js';

export default class StepManager {
  constructor(editor) {
    this.editor = editor;
    this.catsWrap = $('#stepsCats');
    this.btnAddCat = $('#btnAddCat');
    this.categories = [];
    this.activeStep = null;
    this._thumbTimers = new Map();
    // ❌ niente this.init() qui
  }

  init() {
    this.btnAddCat.addEventListener('click', () => this.addCategoryWithCommand());
    const cat = this.addCategoryWithCommand('Predefinita');
    const st = this.addStepWithCommand(cat, 'Step 1');
    this.setActive(st);
  }

  addCategoryWithCommand(name = 'Nuova categoria') {
    const c = new Category(name);
    const cmd = new AddCategoryCommand(this.editor, c, 'Aggiungi categoria');
    this.editor.commandMgr.executeCommand(cmd); // presuppone che editor.commandMgr esista
    return c;
  }
  addStep(cat, name = 'Nuovo step') {
    const s = new Step(name, this.editor.stageEl.dataset.orient || 'landscape');
    s.bgUrl = this.editor.canvas.style.background?.match(/url\('(.*)'\)/)?.[1] || '';
    cat.steps.push(s); this.render(); return s;
  }
  addStepWithCommand(cat, name = 'Nuovo step') {
    const s = new Step(name, this.editor.stageEl.dataset.orient || 'landscape');
    s.bgUrl = this.editor.canvas.style.background?.match(/url\('(.*)'\)/)?.[1] || '';
    const cmd = new AddStepCommand(this.editor, cat, s, 'Aggiungi step');
    this.editor.commandMgr.executeCommand(cmd);
    return s;
  }
  duplicateStep(cat, step) {
    const copy = new Step(step.name + " (copia)", step.orient);
    copy.bgUrl = step.bgUrl;

    // ✅ clona ogni elemento passando da serialize/deserialize dell’Editor
    copy.items = step.items.map(el => {
      const obj = this.editor.serializeElement(el);
      const n = this.editor.deserializeElement(obj); // nuova istanza con tutte le props
      return n;
    });

    const idx = cat.steps.indexOf(step);
    cat.steps.splice(idx + 1, 0, copy);
    this.render();
    return copy;
  }

  deleteStep(cat, step) {
    const cmd = new DeleteStepCommand(this.editor, cat, step, 'Elimina step');
    this.editor.commandMgr.executeCommand(cmd);
  }
  setActive(step) { if (!step) return; this.activeStep = step; this.editor.loadStep(step); this.render(); }
  scheduleThumb(step) { clearTimeout(this._thumbTimers.get(step?.id)); const t = setTimeout(() => { step._thumbNeedsUpdate = true; this.render(); }, 250); this._thumbTimers.set(step?.id, t); }

  render() {
    this.catsWrap.innerHTML = '';
    this.categories.forEach(cat => {
      const catEl = document.createElement('div'); catEl.className = 'cat'; catEl.dataset.catId = cat.id;
      const head = document.createElement('div'); head.className = 'cat-head';
      const title = document.createElement('div'); title.className = 'cat-title'; title.textContent = cat.name; title.title = 'Doppio clic per rinominare';
      title.addEventListener('dblclick', () => this.renameCategory(cat, title));
      const actions = document.createElement('div'); actions.className = 'cat-actions';
      const btnToggle = document.createElement('button'); btnToggle.className = 'btn btn-outline-light btn-sm'; btnToggle.textContent = cat.collapsed ? '▶' : '▼'; btnToggle.title = 'Espandi/Collassa'; btnToggle.addEventListener('click', () => { cat.collapsed = !cat.collapsed; this.render(); });
      actions.appendChild(btnToggle);
      head.appendChild(title); head.appendChild(actions); catEl.appendChild(head);
      const body = document.createElement('div'); body.className = 'cat-body'; body.style.display = cat.collapsed ? 'none' : 'block';
      const list = document.createElement('div'); list.className = 'thumbs';
      cat.steps.forEach((step, idx) => list.appendChild(this.buildThumb(step, idx + 1, cat)));
      const add = document.createElement('div'); add.className = 'thumb add'; add.innerHTML = `<div class="mini"></div><div class="label"><span>Nuovo step</span></div>`; add.addEventListener('click', () => { const s = this.addStepWithCommand(cat, `Step ${cat.steps.length + 1}`); this.setActive(s); });
      list.appendChild(add);
      body.appendChild(list); catEl.appendChild(body);
      this.catsWrap.appendChild(catEl);
    });
  }

  renameCategory(cat, titleEl) {
    const input = document.createElement('input'); input.type = 'text'; input.value = cat.name; input.className = 'rename-input';
    titleEl.replaceWith(input); input.focus(); input.select();
    const commit = () => { cat.name = input.value.trim() || cat.name; this.render(); };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } else if (e.key === 'Escape') { this.render(); } });
    input.addEventListener('blur', commit);
  }

  buildThumb(step, index, cat) {
    if (step._thumbEl && !step._thumbNeedsUpdate) {
      const el = step._thumbEl; el.classList.toggle('active', this.activeStep?.id === step.id); el.querySelector('._num').textContent = index; return el;
    }
    const el = document.createElement('div'); el.className = 'thumb'; el.dataset.stepId = step.id; el.dataset.orient = step.orient === 'portrait' ? 'portrait' : 'landscape';
    el.innerHTML = `<div class="mini"><div class="mini-canvas"></div></div>
      <div class="label">
        <div class="title"><span class="badge text-bg-secondary _num">${index}</span><span class="_name">${step.name}</span></div>
        <div class="actions">
          <button class="btn-icon _save" title="Salva" type="button">💾</button>
          <button class="btn-icon _dup"  title="Duplica" type="button">⎘</button>
          <button class="btn-icon _del"  title="Elimina" type="button">🗑</button>
        </div>
      </div>`;
    el.addEventListener('click', (ev) => { if (ev.target.closest('.actions')) return; this.setActive(step); });
    if (this.activeStep?.id === step.id) el.classList.add('active');
    const mc = el.querySelector('.mini-canvas');
    mc.innerHTML = '';
    mc.style.background = step.bgUrl ? `center/cover no-repeat url('${step.bgUrl}')` : '';
    step.items.forEach(it => {
      const box = document.createElement('div');
      box.style.position = 'absolute'; box.style.left = it.x + '%'; box.style.top = it.y + '%'; box.style.width = it.w + '%'; box.style.height = it.h + '%';
      box.style.border = '1px solid rgba(255,255,255,.35)'; box.style.borderRadius = '2px'; box.style.background = 'rgba(255,255,255,.04)';
      mc.appendChild(box);
    });
    el.querySelector('._dup').addEventListener('click', (e) => { e.stopPropagation(); const cp = this.duplicateStep(cat, step); this.setActive(cp); });
    el.querySelector('._del').addEventListener('click', (e) => { e.stopPropagation(); const btn = e.currentTarget; if (!btn._armed) { btn._armed = true; const orig = btn.textContent; btn.textContent = '✔'; btn.title = 'Conferma elimina'; btn.classList.add('text-danger'); setTimeout(() => { btn._armed = false; btn.textContent = orig; btn.title = 'Elimina'; btn.classList.remove('text-danger'); }, 2000); } else { this.deleteStep(cat, step); } });
    el.querySelector('._save').addEventListener('click', (e) => { e.stopPropagation(); console.log('TODO: save step', step); });
    step._thumbEl = el; step._thumbNeedsUpdate = false; return el;
  }
}