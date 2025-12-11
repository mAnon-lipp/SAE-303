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
  
  // Création d'un mapping entre les codes AC et les données JSON
  const acMapping = {};
  for (let key in pnData) {
    const competence = pnData[key];
    competence.niveaux.forEach(niveau => {
      niveau.acs.forEach(ac => {
        acMapping[ac.code] = {
          code: ac.code,
          libelle: ac.libelle,
          competence: competence.nom_court,
          niveau: niveau.libelle,
          annee: niveau.annee
        };
      });
    });
  }
  
  // Ajouter des écouteurs de clic sur tous les polygones d'AC
  const allACs = V.graph.getAllACs();
  console.log(`${allACs.length} polygones d'AC trouvés dans le SVG`);
  
  allACs.forEach(acElement => {
    const acCode = acElement.id;
    
    // Ajouter un style de survol
    acElement.style.cursor = 'pointer';
    
    // Ajouter l'écouteur de clic
    acElement.addEventListener('click', () => {
      const acData = acMapping[acCode];
      if (acData) {
        console.log('====================================');
        console.log('AC CLIQUÉ:', acData.code);
        console.log('Libellé:', acData.libelle);
        console.log('Compétence:', acData.competence);
        console.log('Niveau:', acData.niveau);
        console.log('Année:', acData.annee);
        console.log('====================================');
      } else {
        console.warn(`⚠️ Aucune donnée trouvée pour l'AC: ${acCode}`);
      }
    });
    
    // Effet visuel au survol
    acElement.addEventListener('mouseenter', () => {
      acElement.style.opacity = '0.7';
    });
    
    acElement.addEventListener('mouseleave', () => {
      acElement.style.opacity = '1';
    });
  });
  
  return V.rootPage;
};

export function SvgDemo1Page() {
  return C.init();
}