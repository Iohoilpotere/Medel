/**
 * Interactivity Mixin - Provides common drag/resize behavior
 * Reduces duplication across element types
 */

import { clientToStage, clamp, pxToPct } from '../utils/index.js';
import { MoveElementsCommand, ResizeElementsCommand } from '../../commands/element-commands.js';

/**
 * Mixin that adds drag and resize functionality to elements
 * @param {Class} BaseClass - Base class to extend
 * @returns {Class} Extended class with interactivity
 */
export function withInteractivity(BaseClass) {
  return class extends BaseClass {
    /**
     * Attach interactivity handlers
     */
    attachInteractivity() {
      if (!this.dom) return;

      this.attachDragHandlers();
      this.attachResizeHandlers();
    }

    /**
     * Attach drag handlers
     */
    attachDragHandlers() {
      this.dom.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('handle')) return;

        const wasSelected = this.selected;
        const editor = this.getEditor();

        // Handle selection
        if (e.ctrlKey || e.metaKey) {
          editor.toggleSelect(this);
          return;
        }

        if (!wasSelected) {
          editor.selectOnly(this);
        }

        this.startDrag(e, editor);
      });
    }

    /**
     * Attach resize handlers
     */
    attachResizeHandlers() {
      this.dom.addEventListener('mousedown', (e) => {
        const handle = e.target.closest('.handle');
        if (!handle) return;

        e.stopPropagation();
        e.preventDefault();

        const editor = this.getEditor();
        if (!editor.selected.includes(this)) {
          editor.selectInclude(this);
        }

        this.startResize(e, handle.dataset.dir, editor);
      });
    }

    /**
     * Start drag operation
     */
    startDrag(event, editor) {
      const stage = editor.view.getStageElements().stage;
      const startPx = clientToStage(event, stage);
      const selected = [...editor.selected];

      const starts = selected.map(s => ({ s, x: s.x, y: s.y, w: s.w, h: s.h }));
      const anchorStart = starts.find(o => o.s === this) || starts[0];

      const grid = editor.gridSnapService.getGridPercent(stage);
      const snapEnabled = editor.gridSnapService.isEnabled() && !event.shiftKey;

      let moved = false;

      const onMove = (ev) => {
        ev.preventDefault();
        const p = clientToStage(ev, stage);
        const dx = pxToPct(p.x - startPx.x, stage.clientWidth);
        const dy = pxToPct(p.y - startPx.y, stage.clientHeight);

        this.updateDragPreview(starts, anchorStart, dx, dy, grid, snapEnabled);
        moved = true;
      };

      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);

        if (moved) {
          this.commitDrag(starts, anchorStart, selected, editor);
        }
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    }

    /**
     * Update drag preview
     */
    updateDragPreview(starts, anchorStart, dx, dy, grid, snapEnabled) {
      // Calculate limits
      const dxMin = Math.max(...starts.map(o => -o.x));
      const dxMax = Math.min(...starts.map(o => 100 - o.w - o.x));
      const dyMin = Math.max(...starts.map(o => -o.y));
      const dyMax = Math.min(...starts.map(o => 100 - o.h - o.y));

      // Calculate target position with snapping
      let targetAx = anchorStart.x + dx;
      let targetAy = anchorStart.y + dy;

      if (snapEnabled) {
        targetAx = this.snapInside(targetAx, grid.x, anchorStart.x + dxMin, anchorStart.x + dxMax);
        targetAy = this.snapInside(targetAy, grid.y, anchorStart.y + dyMin, anchorStart.y + dyMax);
      } else {
        targetAx = clamp(targetAx, anchorStart.x + dxMin, anchorStart.x + dxMax);
        targetAy = clamp(targetAy, anchorStart.y + dyMin, anchorStart.y + dyMax);
      }

      const commonDx = targetAx - anchorStart.x;
      const commonDy = targetAy - anchorStart.y;

      // Apply to all selected elements
      starts.forEach(({ s, x, y, w, h }) => {
        let nx = x + commonDx;
        let ny = y + commonDy;
        nx = clamp(nx, 0, 100 - w);
        ny = clamp(ny, 0, 100 - h);
        s.x = nx;
        s.y = ny;
        s.applyTransform();
      });
    }

    /**
     * Commit drag operation
     */
    commitDrag(starts, anchorStart, selected, editor) {
      const anchorNow = selected.find(s => s === this) || selected[0];
      const finalDx = anchorNow.x - anchorStart.x;
      const finalDy = anchorNow.y - anchorStart.y;

      if (Math.abs(finalDx) < 1e-6 && Math.abs(finalDy) < 1e-6) return;

      // Restore original positions
      starts.forEach(({ s, x, y }) => {
        s.x = x;
        s.y = y;
        s.applyTransform();
      });

      // Execute command
      const cmd = new MoveElementsCommand(editor, selected, finalDx, finalDy, 'Sposta elementi');
      editor.commandManager.executeCommand(cmd);
    }

    /**
     * Start resize operation
     */
    startResize(event, direction, editor) {
      const stage = editor.view.getStageElements().stage;
      const start = clientToStage(event, stage);
      const selected = [...editor.selected];
      const isMultiple = selected.length > 1;
      const isCorner = ['ne', 'se', 'sw', 'nw'].includes(direction);

      if (isMultiple && isCorner) return; // No corner resize for multiple

      const grid = editor.gridSnapService.getGridPercent(stage);
      const snapEnabled = editor.gridSnapService.isEnabled();

      let hasResized = false;

      if (isMultiple) {
        this.startMultiResize(start, direction, selected, grid, snapEnabled, (resized) => {
          hasResized = resized;
        });
      } else {
        this.startSingleResize(start, direction, grid, snapEnabled, (resized) => {
          hasResized = resized;
        });
      }
    }

    /**
     * Snap value inside bounds
     */
    snapInside(target, step, min, max) {
      if (!step || step <= 0) {
        return clamp(target, min, max);
      }

      let snapped = Math.round(target / step) * step;
      if (snapped < min) snapped = Math.ceil(min / step) * step;
      if (snapped > max) snapped = Math.floor(max / step) * step;
      
      return clamp(snapped, min, max);
    }

    /**
     * Get editor instance (should be implemented by elements)
     */
    getEditor() {
      // This should be implemented by elements or injected
      return window.editorInstance || null;
    }

    // Additional resize methods would be implemented here...
    // startMultiResize, startSingleResize, etc.
  };
}