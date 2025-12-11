import { GraphView } from "@/ui/Graph";
import { DetailPanel } from "@/ui/DetailPanel/index.js";
import { htmlToDOM } from "@/lib/utils.js";
import template from "./template.html?raw";

// US002 : Chargement du Référentiel (JSON)
// US004 : Interaction et Affichage du Détail
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
  
  // Injecter les données du PN dans le graphique
  setTimeout(() => {
    V.graph.injectACData(pnData);
    
    // Activer les interactions avec le DetailPanel
    V.graph.enableACInteractions((acData) => {
      V.detailPanel.open(acData);
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
  
  return V.rootPage;
};

export function SvgDemo1Page() {
  return C.init();
}