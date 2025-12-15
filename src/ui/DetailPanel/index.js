import { htmlToDOM } from "@/lib/utils.js";
import template from "./template.html?raw";
import "./style.css";
import { Animation } from "@/lib/animation.js";

class DetailPanel {
  constructor() {
    this.root = htmlToDOM(template);
    this.overlay = this._createOverlay();
    this.currentAC = null;
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
    
    // Envoyer toutes les données au contrôleur
    document.dispatchEvent(new CustomEvent('detailpanel:progresschange', {
      detail: { 
        acCode: this.currentAC.code,
        progress: this.tempProgress,
        oldProgress: this.currentAC.progress || 0,
        libelle: this.currentAC.libelle,
        couleur: this.currentAC.couleur
      }
    }));
    
    this.close();
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
}

export { DetailPanel };