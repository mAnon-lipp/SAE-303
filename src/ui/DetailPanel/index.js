import { htmlToDOM } from "@/lib/utils.js";
import template from "./template.html?raw";
import "./style.css";
import { Animation } from "@/lib/animation.js";
import { saveACProgress } from "@/lib/storage.js";

class DetailPanel {
  constructor() {
    this.root = htmlToDOM(template);
    this.overlay = this._createOverlay();
    this.currentAC = null;
    this.graphView = null;
    this.tempProgress = 0;
    
    // Sélection groupée des éléments DOM
    this.elements = {
      close: this.root.querySelector('.detail-panel__close'),
      code: this.root.querySelector('[data-field="code"]'),
      libelle: this.root.querySelector('[data-field="libelle"]'),
      progressFill: this.root.querySelector('[data-field="progress"]'),
      progressValue: this.root.querySelector('[data-field="progress-value"]'),
      slider: this.root.querySelector('[data-field="slider"]'),
      validateBtn: this.root.querySelector('[data-field="validate-btn"]')
    };
    
    this._setupEventListeners();
  }

  _createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'detail-panel-overlay';
    overlay.setAttribute('data-state', 'closed');
    return overlay;
  }

  _setupEventListeners() {
    // Fermeture (3 méthodes -> 1 handler)
    const closeHandler = () => this.close();
    this.elements.close.addEventListener('click', closeHandler);
    this.overlay.addEventListener('click', closeHandler);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) closeHandler();
    });
    
    // Slider et validation
    this.elements.slider.addEventListener('input', (e) => {
      this.tempProgress = parseInt(e.target.value);
      this._updateProgressVisual(this.tempProgress);
    });
    
    this.elements.validateBtn.addEventListener('click', () => this._validateProgress());
  }

  _updateProgressVisual(value) {
    this.elements.progressFill.style.width = `${value}%`;
    this.elements.progressValue.textContent = `${value}%`;
  }

  _validateProgress() {
    if (!this.currentAC) return;
    
    const oldProgress = this.currentAC.progress || 0;
    this.currentAC.progress = this.tempProgress;
    
    // Mise à jour SVG
    this.graphView?.updateACProgress(
      this.currentAC.code, 
      this.tempProgress, 
      this.currentAC.couleur
    );
    
    // Sauvegarde
    saveACProgress(
      this.currentAC.code, 
      this.tempProgress, 
      oldProgress, 
      this.currentAC.libelle
    );
    
    // Événement
    document.dispatchEvent(new CustomEvent('detailpanel:progresschange', {
      detail: { 
        ac: this.currentAC,
        progress: this.tempProgress,
        acCode: this.currentAC.code,
        couleur: this.currentAC.couleur
      }
    }));
    
    this.close();
  }

  setGraphView(graphView) {
    this.graphView = graphView;
  }

  dom() {
    return this.root;
  }

  mount(container = document.body) {
    container.appendChild(this.overlay);
    container.appendChild(this.root);
  }

  open(acData) {
    this.currentAC = acData;
    
    // Mise à jour du contenu
    this.elements.code.textContent = acData.code;
    this.elements.libelle.textContent = acData.libelle;
    
    // Progression
    const progress = acData.progress || 0;
    this.elements.slider.value = progress;
    this.tempProgress = progress;
    Animation.progressBar(this.elements.progressFill, this.elements.progressValue, progress);
    
    // Couleur
    if (acData.couleur) {
      this.root.style.setProperty('--panel-color', `var(--color-${acData.couleur})`);
    }
    
    // Ouverture
    this._setState('open');
    document.body.style.overflow = 'hidden';
    
    document.dispatchEvent(new CustomEvent('detailpanel:open', { 
      detail: { ac: acData } 
    }));
  }

  close() {
    this._setState('closed');
    document.body.style.overflow = '';
    
    document.dispatchEvent(new CustomEvent('detailpanel:close', { 
      detail: { ac: this.currentAC } 
    }));
    
    this.currentAC = null;
  }

  _setState(state) {
    this.root.setAttribute('data-state', state);
    this.overlay.setAttribute('data-state', state);
  }

  isOpen() {
    return this.root.getAttribute('data-state') === 'open';
  }

  toggle(acData) {
    this.isOpen() ? this.close() : this.open(acData);
  }

  update(acData) {
    if (!this.isOpen()) return;
    this.open(acData); // Réutilise la logique d'open
  }

  destroy() {
    this.close();
    this.root.remove();
    this.overlay.remove();
  }
}

export { DetailPanel };