import data from "./pn.json";

let pn = [];

for (let cmp in data){
    pn.push(data[cmp]);
}

pn.getLevelIndex = function(acCode){
    return acCode.charAt(2);
}

pn.getSkillIndex = function(acCode){
    return acCode.charAt(3);
}

pn.getAcIndex = function(acCode){
    return acCode.charAt(6);
}

pn.getAcLibelle = function(acCode){
    let skill = pn.getSkillIndex(acCode)-1;
    let level = pn.getLevelIndex(acCode)-1;
    let ac = pn.getAcIndex(acCode)-1;
    return pn[skill].niveaux[level].acs[ac].libelle;
}

pn.getAcCouleur = function(acCode){
    let skill = pn.getSkillIndex(acCode)-1;
    return pn[skill].couleur;
}

export { pn };