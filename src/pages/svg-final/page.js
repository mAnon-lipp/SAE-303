import { GraphView } from "@/ui/Graph";
import { DetailPanel } from "@/ui/DetailPanel/index.js";
import { HistoryPanel } from "@/ui/HistoryPanel/index.js";
import { htmlToDOM } from "@/lib/utils.js";
import { Animation } from "@/lib/animation.js";
import { user,historyStorage } from "@/data/user.js";
import { pn } from "@/data/tri.js";
import template from "./template.html?raw";

// ============================================
// M = MODEL - Gestion des données
// ============================================
let M = {
  pn: pn  // Données du PN (via tri.js)
};

/**
 * Trouve les données d'un AC par son code - Accès direct via indices
 * @param {string} acCode - Code de l'AC (ex: "AC12.01")
 * @returns {Object|null} - Données de l'AC enrichies ou null
 */
M.findACData = function(acCode) {
  try {
    const progressMap = user.loadProgressMap();
    
    return {
      code: acCode,
      libelle: M.pn.getAcLibelle(acCode),
      progress: progressMap[acCode] || 0,
      couleur: M.pn.getAcCouleur(acCode)
    };
  } catch (e) {
    console.error('AC non trouvé:', acCode, e);
    return null;
  }
};

/**
 * Récupère l'historique des modifications
 * @returns {Array} - Historique des modifications
 */
M.getHistory = function() {
  return historyStorage.loadAll();
};

/**
 * Récupère les statistiques
 * @returns {Object} - Statistiques
 */
M.getStats = function() {
  return historyStorage.getStats();
};

/**
 * Exporte les données
 */
M.exportHistory = function() {
  historyStorage.exportData();
};

// ============================================
// C = CONTROLLER - Logique métier
// ============================================
let C = {};

C.init = function() {
  // Plus besoin de buildIndex() - le système pn est déjà prêt!
  
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
  // 1. Sauvegarder la progression
  user.save(detail.acCode, detail.progress);
  
  // 2. Ajouter à l'historique
  historyStorage.add(detail.acCode, detail.oldProgress, detail.progress);
  
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
  const savedProgress = user.loadProgressMap();
  const progressToApply = [];
  
  // Pour chaque progression sauvegardée (si vide, la boucle ne s'exécute pas)
  for (const acCode in savedProgress) {
    const progress = savedProgress[acCode];
    
    // Récupérer la couleur depuis pn
    try {
      const couleur = M.pn.getAcCouleur(acCode);
      progressToApply.push({ 
        acCode: acCode, 
        progress: progress, 
        couleur: couleur 
      });
    } catch (e) {
      console.error('AC non trouvé:', acCode, e);
    }
  }
  
  // Appliquer tout à la vue
  if (progressToApply.length > 0) {
    V.graph.applyProgressMap(progressToApply);
    console.log(`[Controller] ${progressToApply.length} progressions chargées`);
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
    // Injecter les labels en utilisant les IDs des polygones SVG
    V.graph.injectACData();
    
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