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
}

export { GraphView };