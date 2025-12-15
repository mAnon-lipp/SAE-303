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
    
    // Référence aux données du PN (sera injectée plus tard)
    this.pnData = null;
    
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
  // Méthodes d'accès aux Compétences
  // ============================================
  
  /**
   * Récupère une compétence par son ID
   * @param {string} compId - ID de la compétence (ex: "688548e4666873aa7a49491ba88a7271" pour Comprendre)
   * @returns {Element|null}
   */
  getCompetence(compId) {
    return this.root.querySelector(`#${compId}`);
  }

  /**
   * Récupère toutes les compétences
   * @returns {NodeList}
   */
  getAllCompetences() {
    // Les compétences sont les groupes racines avec des IDs longs
    return this.root.querySelectorAll(':scope > g[id]');
  }

  // ============================================
  // Méthodes d'accès aux Niveaux
  // ============================================
  
  /**
   * Récupère un niveau spécifique
   * @param {number} niveau - Numéro du niveau (1, 2 ou 3)
   * @returns {Element|null}
   */
  getNiveau(niveau) {
    return this.root.querySelector(`#niveau_${niveau}`);
  }

  /**
   * Récupère tous les niveaux d'une compétence
   * @param {string} compId - ID de la compétence
   * @returns {NodeList}
   */
  getNiveauxByCompetence(compId) {
    const comp = this.getCompetence(compId);
    if (!comp) return [];
    return comp.querySelectorAll('g[id^="niveau_"]');
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
    // Utiliser un sélecteur d'attribut car les IDs contiennent des points
    return this.root.querySelector(`[id="${code}"]`);
  }

  /**
   * Récupère tous les AC d'un niveau
   * @param {number} niveau - Numéro du niveau (1, 2 ou 3)
   * @returns {NodeList}
   */
  getACsByNiveau(niveau) {
    const niveauGroup = this.getNiveau(niveau);
    if (!niveauGroup) return [];
    return niveauGroup.querySelectorAll('path[id^="AC"]');
  }

  /**
   * Récupère tous les AC d'une compétence et d'un niveau
   * @param {number} competence - Numéro de la compétence (1-5)
   * @param {number} niveau - Numéro du niveau (1-3)
   * @returns {NodeList}
   */
  getACsByCompetenceAndNiveau(competence, niveau) {
    return this.root.querySelectorAll(`path[id^="AC${niveau}${competence}."]`);
  }

  /**
   * Récupère tous les AC du SVG
   * @returns {NodeList}
   */
  getAllACs() {
    return this.root.querySelectorAll('path[id^="AC"]');
  }

  // ============================================
  // Méthodes utilitaires pour l'interaction
  // ============================================
  
  /**
   * Ajoute une classe à un élément du SVG
   * @param {string} selector - Sélecteur CSS de l'élément
   * @param {string} className - Nom de la classe à ajouter
   */
  addClass(selector, className) {
    const element = this.root.querySelector(selector);
    if (element) {
      element.classList.add(className);
    }
  }

  /**
   * Retire une classe d'un élément du SVG
   * @param {string} selector - Sélecteur CSS de l'élément
   * @param {string} className - Nom de la classe à retirer
   */
  removeClass(selector, className) {
    const element = this.root.querySelector(selector);
    if (element) {
      element.classList.remove(className);
    }
  }

  /**
   * Change la couleur d'un élément
   * @param {string} selector - Sélecteur CSS de l'élément
   * @param {string} color - Couleur en format CSS
   */
  setColor(selector, color) {
    const element = this.root.querySelector(selector);
    if (element) {
      element.setAttribute('fill', color);
    }
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
    // Sauvegarder les données pour usage ultérieur
    this.pnData = pnData;
    
    for (let compId in pnData) {
      const competence = pnData[compId];
      
      for (let niveau of competence.niveaux) {
        for (let ac of niveau.acs) {
          const acElement = this.getAC(ac.code);
          
          if (acElement) {
            try {
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
            } catch (error) {}
          }
        }
      }
    }
  }

  // ============================================
  // US004: Méthodes d'interaction
  // ============================================
  
  /**
   * Active les interactions de clic sur tous les AC
   * @param {Function} callback - Fonction appelée lors du clic avec les données de l'AC
   */
  enableACInteractions(callback) {
    const allACs = this.getAllACs();
    
    allACs.forEach(acElement => {
      // Rendre l'élément cliquable
      acElement.style.cursor = 'pointer';
      
      // Ajouter l'événement de clic
      acElement.addEventListener('click', (event) => {
        const acCode = acElement.getAttribute('id');
        const acData = this._findACData(acCode);
        
        if (acData) {
          // Mettre à jour l'état visuel avec la couleur de la compétence
          this.setActiveAC(acCode, acData.couleur);
          
          // Appeler le callback avec les données
          if (callback && typeof callback === 'function') {
            callback(acData);
          }
        }
      });
      
      // Effets hover pour meilleure UX
      acElement.addEventListener('mouseenter', () => {
        if (!acElement.classList.contains('ac-active')) {
          acElement.classList.add('ac-hover');
        }
      });
      
      acElement.addEventListener('mouseleave', () => {
        acElement.classList.remove('ac-hover');
      });
    });
  }

  /**
   * Trouve les données d'un AC par son code
   * @param {string} acCode - Code de l'AC (ex: "AC12.01")
   * @returns {Object|null} - Données de l'AC ou null si non trouvé
   * @private
   */
  _findACData(acCode) {
    if (!this.pnData) return null;
    
    for (let compId in this.pnData) {
      const competence = this.pnData[compId];
      
      for (let niveau of competence.niveaux) {
        for (let ac of niveau.acs) {
          if (ac.code === acCode) {
            return {
              code: ac.code,
              libelle: ac.libelle,
              progress: ac.progress || 0, // Progression par défaut à 0 si non définie
              competence: competence.nom_court,
              niveau: niveau.libelle,
              couleur: competence.couleur // Ajouter la couleur de la compétence
            };
          }
        }
      }
    }
    
    return null;
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
    
    // Mettre à jour les données en mémoire
    if (this.pnData) {
      for (let compId in this.pnData) {
        const competence = this.pnData[compId];
        for (let niveau of competence.niveaux) {
          for (let ac of niveau.acs) {
            if (ac.code === acCode) {
              ac.progress = progress;
              return;
            }
          }
        }
      }
    }
  }

  /**
   * US007: Applique un ensemble de progressions depuis le localStorage
   * @param {Object} progressMap - Map des progressions {acCode: progress, ...}
   */
  applyProgressMap(progressMap) {
    if (!this.pnData) {
      console.warn('[GraphView] Impossible d\'appliquer les progressions: pnData non initialisé');
      return;
    }

    let appliedCount = 0;

    // Parcourir toutes les progressions sauvegardées
    for (const acCode in progressMap) {
      const progress = progressMap[acCode];
      
      // Trouver les données de l'AC pour obtenir sa couleur
      const acData = this._findACData(acCode);
      
      if (acData) {
        // Appliquer la progression visuellement
        this.updateACProgress(acCode, progress, acData.couleur);
        appliedCount++;
      } else {
        console.warn(`[GraphView] AC non trouvé: ${acCode}`);
      }
    }

    console.log(`[GraphView] ${appliedCount} progressions appliquées`);
  }
}

export { GraphView };