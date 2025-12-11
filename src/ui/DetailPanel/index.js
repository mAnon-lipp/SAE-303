import { htmlToDOM } from "@/lib/utils.js";
import template from "./template.html?raw";
import "./style.css";
import { Animation } from "@/lib/animation.js";

/**
 * US004: Interaction et Affichage du Détail
 * 
 * Composant de panneau latéral qui affiche les détails d'un AC (Apprentissage Critique)
 * lorsqu'on clique sur un élément du graphique SVG.
 */
class DetailPanel {
  constructor() {
    this.root = htmlToDOM(template);
    this.overlay = null;
    this.currentAC = null;
    
    // Références aux éléments du DOM
    this.closeButton = this.root.querySelector('.detail-panel__close');
    this.codeElement = this.root.querySelector('[data-field="code"]');
    this.libelleElement = this.root.querySelector('[data-field="libelle"]');
    this.progressFill = this.root.querySelector('[data-field="progress"]');
    this.progressValue = this.root.querySelector('[data-field="progress-value"]');
    
    // Initialisation
    this._init();
  }

  /**
   * Initialise les écouteurs d'événements
   * @private
   */
  _init() {
    // Créer l'overlay pour fermer le panneau
    this.overlay = document.createElement('div');
    this.overlay.className = 'detail-panel-overlay';
    this.overlay.setAttribute('data-state', 'closed');
    
    // Fermeture via le bouton close
    this.closeButton.addEventListener('click', () => {
      this.close();
    });
    
    // Fermeture via l'overlay
    this.overlay.addEventListener('click', () => {
      this.close();
    });
    
    // Fermeture via la touche Échap
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });
  }

  /**
   * Retourne le HTML du composant
   * @returns {string}
   */
  html() {
    return template;
  }

  /**
   * Retourne l'élément DOM du composant
   * @returns {Element}
   */
  dom() {
    return this.root;
  }

  /**
   * Injecte le composant dans le DOM
   * @param {Element} container - Conteneur où injecter le panneau (par défaut document.body)
   */
  mount(container = document.body) {
    container.appendChild(this.overlay);
    container.appendChild(this.root);
  }

  /**
   * Ouvre le panneau avec les données d'un AC
   * @param {Object} acData - Données de l'AC
   * @param {string} acData.code - Code de l'AC (ex: "AC12.01")
   * @param {string} acData.libelle - Libellé de l'AC
   * @param {number} acData.progress - Progression en pourcentage (0-100)
   * @param {string} acData.couleur - Couleur de la compétence (c1, c2, c3, c4, c5)
   */
  open(acData) {
    // Sauvegarder l'AC actuel
    this.currentAC = acData;
    
    // Mettre à jour le contenu
    this.codeElement.textContent = acData.code;
    this.libelleElement.textContent = acData.libelle;
    
    // Gérer la progression (optionnelle)
    const progress = acData.progress || 0;
    
    // Animation de la barre de progrès avec GSAP
    Animation.progressBar(this.progressFill, this.progressValue, progress);
    
    // Appliquer la couleur de la compétence
    if (acData.couleur) {
      this.root.style.setProperty('--panel-color', `var(--color-${acData.couleur})`);
    }
    
    // Ouvrir le panneau et l'overlay
    this.root.setAttribute('data-state', 'open');
    this.overlay.setAttribute('data-state', 'open');
    
    // Empêcher le scroll du body
    document.body.style.overflow = 'hidden';
    
    // Émettre un événement personnalisé
    const event = new CustomEvent('detailpanel:open', { 
      detail: { ac: acData } 
    });
    document.dispatchEvent(event);
  }

  /**
   * Ferme le panneau
   */
  close() {
    this.root.setAttribute('data-state', 'closed');
    this.overlay.setAttribute('data-state', 'closed');
    
    // Restaurer le scroll du body
    document.body.style.overflow = '';
    
    // Émettre un événement personnalisé
    const event = new CustomEvent('detailpanel:close', { 
      detail: { ac: this.currentAC } 
    });
    document.dispatchEvent(event);
    
    // Réinitialiser l'AC actuel
    this.currentAC = null;
  }

  /**
   * Vérifie si le panneau est ouvert
   * @returns {boolean}
   */
  isOpen() {
    return this.root.getAttribute('data-state') === 'open';
  }

  /**
   * Toggle l'état du panneau
   * @param {Object} acData - Données de l'AC (requis si fermé)
   */
  toggle(acData) {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open(acData);
    }
  }

  /**
   * Met à jour les données affichées sans fermer/ouvrir le panneau
   * @param {Object} acData - Nouvelles données de l'AC
   */
  update(acData) {
    if (!this.isOpen()) return;
    
    this.currentAC = acData;
    this.codeElement.textContent = acData.code;
    this.libelleElement.textContent = acData.libelle;
    
    const progress = acData.progress || 0;
    this.progressFill.style.width = `${progress}%`;
    this.progressValue.textContent = `${progress}%`;
    
    // Mettre à jour la couleur
    if (acData.couleur) {
      this.root.style.setProperty('--panel-color', `var(--color-${acData.couleur})`);
    }
  }

  /**
   * Détruit le composant et nettoie les écouteurs
   */
  destroy() {
    this.close();
    this.root.remove();
    this.overlay.remove();
  }
}

export { DetailPanel };
