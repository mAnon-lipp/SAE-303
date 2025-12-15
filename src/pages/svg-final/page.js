import { GraphView } from "@/ui/Graph";
import { DetailPanel } from "@/ui/DetailPanel/index.js";
import { htmlToDOM } from "@/lib/utils.js";
import { Animation } from "@/lib/animation.js";
import { loadProgressMap } from "@/lib/storage.js";
import template from "./template.html?raw";


let M = {};

// Récupération du fichier JSON via fetch()
let response = await fetch('/src/data/pn.json');
M.pnData = await response.json();

let C = {};

C.init = function() {
  return V.init();
}

let V = {
  rootPage: null,
  graph: null,
  detailPanel: null
};

V.init = function(pnData = M.pnData) {
  V.rootPage = htmlToDOM(template);
  
  // Créer le graphique
  V.graph = new GraphView();
  V.rootPage.querySelector('slot[name="svg"]').replaceWith(V.graph.dom());
  
  // Créer le panneau de détails
  V.detailPanel = new DetailPanel();
  
  // Connecter le DetailPanel au GraphView pour les mises à jour de progression
  V.detailPanel.setGraphView(V.graph);
  
  // Injecter les données du PN dans le graphique
  setTimeout(() => {
    V.graph.injectACData(pnData);
    
    
    // Activer les interactions avec le DetailPanel
    V.graph.enableACInteractions((acData) => {
      V.detailPanel.open(acData);
    });
    
    // US006: Animation d'apparition du graphe au chargement
    const revealTimeline = Animation.revealGraph(V.graph.getSvgElement());
    
    // US007: Charger et appliquer les progressions APRÈS l'animation
    // pour éviter que clearProps ne réinitialise les opacités
    revealTimeline.then(() => {
      const savedProgress = loadProgressMap();
      if (savedProgress && Object.keys(savedProgress).length > 0) {
        console.log(`[Page] Chargement de ${Object.keys(savedProgress).length} progressions sauvegardées`);
        V.graph.applyProgressMap(savedProgress);
      }
    });
  }, 0);
  
  // Monter le panneau de détails dans le DOM
  setTimeout(() => {
    V.detailPanel.mount();
  }, 0);
  
  // Écouter la fermeture du panneau pour retirer l'état actif
  document.addEventListener('detailpanel:close', () => {
    V.graph.clearActiveAC();
  });
  
  // Écouter les changements de progression
  document.addEventListener('detailpanel:progresschange', (e) => {
    console.log('Progression mise à jour:', e.detail);
  });
  
  return V.rootPage;
};

export function SvgDemo1Page() {
  return C.init();
}