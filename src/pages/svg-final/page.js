import { GraphView } from "@/ui/Graph";
import { DetailPanel } from "@/ui/DetailPanel/index.js";
import { HistoryPanel } from "@/ui/HistoryPanel/index.js";
import { htmlToDOM } from "@/lib/utils.js";
import { Animation } from "@/lib/animation.js";
import { loadProgressMap, loadHistory, getStats, exportData, saveACProgress } from "@/lib/storage.js";
import template from "./template.html?raw";

// ============================================
// M = MODEL - Gestion des données
// ============================================
let M = {
  pnData: null,      // Données originales du PN (immutables)
  workingData: null, // Copie de travail avec les progressions
  acIndex: {}        // Index rapide : {acCode: {ac, couleur, competence, niveau}}
};

// Récupération des données via fetch
let response = await fetch('/src/data/pn.json');
M.pnData = await response.json();

/**
 * Crée une copie profonde des données du PN et un index pour accès direct
 */
M.createWorkingCopy = function() {
  M.workingData = JSON.parse(JSON.stringify(M.pnData));
  M.acIndex = {};
  
  // Créer l'index des AC (une seule fois)
  for (let compId in M.workingData) {
    const competence = M.workingData[compId];
    for (let niveau of competence.niveaux) {
      for (let ac of niveau.acs) {
        M.acIndex[ac.code] = {
          ac: ac,
          couleur: competence.couleur,
          competence: competence.nom_court,
          niveau: niveau.libelle
        };
      }
    }
  }
};

/**
 * Trouve les données d'un AC par son code - Accès direct O(1)
 * @param {string} acCode - Code de l'AC (ex: "AC12.01")
 * @returns {Object|null} - Données de l'AC enrichies ou null
 */
M.findACData = function(acCode) {
  const indexed = M.acIndex[acCode];
  if (!indexed) return null;
  
  return {
    code: indexed.ac.code,
    libelle: indexed.ac.libelle,
    progress: indexed.ac.progress || 0,
    competence: indexed.competence,
    niveau: indexed.niveau,
    couleur: indexed.couleur
  };
};

/**
 * Met à jour la progression d'un AC - Accès direct O(1)
 * @param {string} acCode - Code de l'AC
 * @param {number} progress - Nouvelle progression (0-100)
 */
M.updateACProgress = function(acCode, progress) {
  const indexed = M.acIndex[acCode];
  if (indexed) {
    indexed.ac.progress = progress;
  }
};

/**
 * Récupère l'historique des modifications
 * @returns {Array} - Historique des modifications
 */
M.getHistory = function() {
  return loadHistory();
};

/**
 * Récupère les statistiques
 * @returns {Object} - Statistiques
 */
M.getStats = function() {
  return getStats();
};

/**
 * Exporte les données
 */
M.exportHistory = function() {
  exportData();
};

// ============================================
// C = CONTROLLER - Logique métier
// ============================================
let C = {};

C.init = function() {
  // Initialiser les données de travail
  M.createWorkingCopy();
  
  // Initialiser la vue
  return V.init();
};

/**
 * Gère le clic sur un AC
 * @param {string} acCode - Code de l'AC cliqué
 */
C.handleACClick = function(acCode) {
  // Récupérer les données depuis le modèle
  const acData = M.findACData(acCode);
  
  if (acData) {
    // Mettre à jour l'état visuel
    V.graph.setActiveAC(acCode, acData.couleur);
    
    // Ouvrir le panneau de détails avec les données
    V.detailPanel.open(acData);
  }
};

/**
 * Gère la mise à jour de progression depuis le DetailPanel
 * @param {Object} detail - {acCode, progress, oldProgress, libelle, couleur}
 */
C.handleProgressChange = function(detail) {
  // 1. Mettre à jour le modèle
  M.updateACProgress(detail.acCode, detail.progress);
  
  // 2. Sauvegarder dans le storage
  saveACProgress(detail.acCode, detail.progress, detail.oldProgress, detail.libelle);
  
  // 3. Mettre à jour l'affichage du graphe
  V.graph.updateACProgress(detail.acCode, detail.progress, detail.couleur);
  
  // 4. Rafraîchir l'historique
  C.refreshHistory();
};

/**
 * Rafraîchit l'historique
 */
C.refreshHistory = function() {
  const history = M.getHistory();
  const stats = M.getStats();
  V.historyPanel.setData(history, stats);
};

/**
 * Gère l'ouverture du panneau d'historique
 */
C.handleHistoryOpen = function() {
  C.refreshHistory();
};

/**
 * Gère l'export des données
 */
C.handleExport = function() {
  M.exportHistory();
};

/**
 * Charge et applique les progressions sauvegardées
 */
C.loadSavedProgress = function() {
  const savedProgress = loadProgressMap();
  
  if (savedProgress && Object.keys(savedProgress).length > 0) {
    console.log(`[Controller] Chargement de ${Object.keys(savedProgress).length} progressions sauvegardées`);
    
    const progressToApply = [];
    
    // Pour chaque progression sauvegardée
    for (const acCode in savedProgress) {
      const progress = savedProgress[acCode];
      
      // Mettre à jour le modèle
      M.updateACProgress(acCode, progress);
      
      // Récupérer les données complètes (avec la couleur)
      const acData = M.findACData(acCode);
      if (acData) {
        progressToApply.push({ 
          acCode: acCode, 
          progress: progress, 
          couleur: acData.couleur 
        });
      }
    }
    
    // Appliquer tout à la vue
    V.graph.applyProgressMap(progressToApply);
  }
};

// ============================================
// V = VIEW - Gestion de l'interface
// ============================================
let V = {
  rootPage: null,
  graph: null,
  detailPanel: null,
  historyPanel: null,
  historyButton: null
};

V.init = function() {
  V.rootPage = htmlToDOM(template);
  
  // Créer le graphique
  V.graph = new GraphView();
  V.rootPage.querySelector('slot[name="svg"]').replaceWith(V.graph.dom());
  
  // Créer le panneau de détails
  V.detailPanel = new DetailPanel();
  
  // Injecter les données du PN dans le graphique
  setTimeout(() => {
    // Injecter les données (lecture seule pour les labels)
    V.graph.injectACData(M.workingData);
    
    // Activer les interactions - le callback passe par le contrôleur
    V.graph.enableACInteractions((acCode) => {
      C.handleACClick(acCode);
    });
    
    // US006: Animation d'apparition du graphe au chargement
    const revealTimeline = Animation.revealGraph(V.graph.getSvgElement());
    
    // US007: Charger et appliquer les progressions APRÈS l'animation
    revealTimeline.then(() => {
      C.loadSavedProgress();
    });
  }, 0);
  
  // Monter le panneau de détails dans le DOM
  setTimeout(() => {
    V.detailPanel.mount();
  }, 0);
  
  // US008: Créer et monter le panneau d'historique
  V.historyPanel = new HistoryPanel();
  document.body.appendChild(V.historyPanel.dom());
  
  // Connecter le bouton d'historique du template
  V.historyButton = V.rootPage.querySelector('#history-toggle');
  V.historyButton.addEventListener('click', () => {
    V.historyPanel.open();
  });
  
  // Écouter la fermeture du panneau pour retirer l'état actif
  document.addEventListener('detailpanel:close', () => {
    V.graph.clearActiveAC();
  });
  
  // Écouter les changements de progression
  document.addEventListener('detailpanel:progresschange', (e) => {
    console.log('[View] Progression mise à jour:', e.detail);
    C.handleProgressChange(e.detail);
  });
  
  // Écouter l'ouverture du panneau d'historique
  document.addEventListener('historypanel:open', () => {
    C.handleHistoryOpen();
  });
  
  // Écouter l'export des données
  document.addEventListener('historypanel:export', () => {
    C.handleExport();
  });
  
  return V.rootPage;
};

export function SvgDemo1Page() {
  return C.init();
}