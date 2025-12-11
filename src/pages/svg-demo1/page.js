import { GraphView } from "@/ui/Graph";
import { htmlToDOM } from "@/lib/utils.js";
import template from "./template.html?raw";

// US002 : Chargement du Référentiel (JSON)
let M = {};

// Récupération du fichier JSON via fetch()
let response = await fetch('/src/data/pn.json');
M.pnData = await response.json();

// Données stockées dans une variable/objet global exploitable
console.log('=== US002 : Données PN chargées ===');
console.log('Nombre de compétences:', Object.keys(M.pnData).length);

// Parcours des 5 compétences et leurs sous-niveaux dans la console
for (let key in M.pnData) {
  const competence = M.pnData[key];
  console.log(`\n${competence.numero}. ${competence.nom_court}`);
  console.log(`   Couleur: ${competence.couleur}`);
  console.log(`   Niveaux: ${competence.niveaux.length}`);
  competence.niveaux.forEach(niveau => {
    console.log(`   - ${niveau.libelle} (${niveau.annee}): ${niveau.acs.length} AC`);
  });
}

let C = {};

C.init = function() {
  return V.init();
}

let V = {
  rootPage: null,
  graph: null
};

V.init = function(pnData = M.pnData) {
  V.rootPage = htmlToDOM(template);
  
  // Un seul graph qui contient toutes les compétences
  V.graph = new GraphView();
  V.rootPage.querySelector('slot[name="svg"]').replaceWith(V.graph.dom());
  
  // Données prêtes à être mappées
  console.log('Graph initialisé avec', Object.keys(pnData).length, 'compétences');
  
  return V.rootPage;
};

export function SvgDemo1Page() {
  return C.init();
}