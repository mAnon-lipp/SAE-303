import { htmlToDOM } from "@/lib/utils.js";
import template from "./template.html?raw";
import "./style.css";

/**
 * US001: Structure et Intégration du SVG (Le "Plateau de jeu")
 * US004: Interaction et Affichage du Détail
 * 
 * Cette classe gère l'affichage et l'interaction avec le SVG du Programme National.
 * Le SVG est affiché inline et tous les éléments sont accessibles via querySelector.
 */
class GraphView {

  constructor() {
    // Charger le template et le convertir en DOM
    // Le SVG est directement l'élément racine du template
    this.root = htmlToDOM(template);
    
    // État pour suivre l'élément actuellement sélectionné
    this.selectedElement = null;
  }

  html() {
    return template;
  }

  dom() {
    return this.root;
  }

  // ============================================
  // Méthodes d'accès aux AC (Apprentissages Critiques)
  // ============================================
  
  /**
   * Récupère un AC par son code
   * @param {string} code - Code de l'AC (ex: "AC11.01", "AC22.03")
   * @returns {Element|null}
   */
  getAC(code) {
    return this.root.querySelector(`[id="${code}"]`);
  }

  /**
   * Récupère tous les AC du SVG
   * @returns {NodeList}
   */
  getAllACs() {
    return this.root.querySelectorAll('path[id^="AC"]');
  }

  /**
   * Récupère l'élément SVG racine
   * @returns {Element}
   */
  getSvgElement() {
    return this.root;
  }


  /**
   * Injecte les codes AC dans le SVG
   * @param {Object} pnData - Données du programme national (JSON)
   */
  injectACData(pnData) {
    for (let compId in pnData) {
      const competence = pnData[compId];
      
      for (let niveau of competence.niveaux) {
        for (let ac of niveau.acs) {
          const acElement = this.getAC(ac.code);
          if (!acElement) continue;
          
          const bbox = acElement.getBBox();
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          
          text.textContent = ac.code;
          text.classList.add('ac-label');
          text.setAttribute('x', bbox.x + bbox.width / 2);
          text.setAttribute('y', bbox.y + bbox.height / 2);
          text.setAttribute('text-anchor', 'middle');
          text.setAttribute('dominant-baseline', 'middle');
          text.setAttribute('fill', 'black');
          text.setAttribute('font-size', '12');
          text.setAttribute('pointer-events', 'none');
          
          acElement.parentElement.appendChild(text);
        }
      }
    }
  }

  // ============================================
  // US004: Méthodes d'interaction
  // ============================================
  
  /**
   * Active les interactions de clic sur tous les AC
   * @param {Function} callback - Fonction appelée lors du clic avec le code de l'AC
   */
  enableACInteractions(callback) {
    const allACs = this.getAllACs();
    
    for (let i = 0; i < allACs.length; i++) {
      const acElement = allACs[i];
      acElement.style.cursor = 'pointer';
      
      acElement.addEventListener('click', () => {
        callback(acElement.getAttribute('id'));
      });
      
      acElement.addEventListener('mouseenter', () => {
        if (!acElement.classList.contains('ac-active')) {
          acElement.classList.add('ac-hover');
        }
      });
      
      acElement.addEventListener('mouseleave', () => {
        acElement.classList.remove('ac-hover');
      });
    }
  }



  /**
   * Définit un AC comme actif visuellement
   * @param {string} acCode - Code de l'AC à activer
   * @param {string} couleur - Couleur de la compétence (c1, c2, etc.)
   */
  setActiveAC(acCode, couleur = 'c1') {
    // Retirer l'état actif de l'élément précédent
    if (this.selectedElement) {
      this.selectedElement.classList.remove('ac-active');
      this.selectedElement.removeAttribute('data-color');
    }
    
    // Ajouter l'état actif au nouvel élément
    const acElement = this.getAC(acCode);
    if (acElement) {
      acElement.classList.add('ac-active');
      acElement.setAttribute('data-color', couleur);
      this.selectedElement = acElement;
    }
  }

  /**
   * Retire l'état actif de tous les AC
   */
  clearActiveAC() {
    if (this.selectedElement) {
      this.selectedElement.classList.remove('ac-active');
      this.selectedElement = null;
    }
  }

  // ============================================
  // US005: Gestion de la Progression
  // ============================================

  /**
   * Met à jour la progression visuelle d'un AC dans le SVG
   * @param {string} acCode - Code de l'AC (ex: "AC12.01")
   * @param {number} progress - Progression en pourcentage (0-100)
   * @param {string} couleur - Couleur de la compétence (c1, c2, c3, c4, c5)
   */
  updateACProgress(acCode, progress, couleur) {
    const acElement = this.getAC(acCode);
    if (!acElement) return;

    // Retirer les classes de couleur et d'état existantes
    acElement.classList.remove('ac-color-c1', 'ac-color-c2', 'ac-color-c3', 'ac-color-c4', 'ac-color-c5');
    acElement.classList.remove('ac-has-progress', 'ac-complete');
    
    // Calculer l'opacité progressive (0.3 minimum → 1.0 maximum)
    const opacity = 0.3 + (progress / 100) * 0.7;
    
    // Appliquer la classe de couleur et l'opacité
    if (progress > 0) {
      acElement.classList.add('ac-has-progress');
      acElement.classList.add(`ac-color-${couleur}`);
      acElement.style.opacity = opacity;
      
      // Ajouter l'effet de glow pour les AC à 100%
      if (progress === 100) {
        acElement.classList.add('ac-complete');
      }
    } else {
      // État non acquis
      acElement.style.opacity = 0.3;
      // La couleur par défaut #D9D9D9 est dans le CSS
    }
  }

  /**
   * US007: Applique un ensemble de progressions depuis le localStorage
   * @param {Array} progressEntries - Tableau d'entrées [{acCode, progress, couleur}, ...]
   */
  applyProgressMap(progressEntries) {
    for (let i = 0; i < progressEntries.length; i++) {
      this.updateACProgress(progressEntries[i].acCode, progressEntries[i].progress, progressEntries[i].couleur);
    }
    console.log(`[GraphView] ${progressEntries.length} progressions appliquées`);
  }
}

export { GraphView };