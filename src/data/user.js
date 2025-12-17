import { pn } from "@/data/tri.js";

let user = {};
let historyStorage = {};

const USER_STORAGE_KEY = 'sae303_user_progress';
const HISTORY_STORAGE_KEY = 'sae303_history';

// Fonction privée
function createEmpty() {
    return {
        lastUpdate: new Date().toISOString(),
        progress: {}
    };
}

/**
 * Charge toutes les données utilisateur
 */
user.loadAll = function() {
    const rawData = localStorage.getItem(USER_STORAGE_KEY);
    return rawData ? JSON.parse(rawData) : null;
}

/**
 * Charge toutes les données historique
 */
historyStorage.loadAll = function() {
    const rawData = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!rawData) return [];
    
    const history = JSON.parse(rawData);
    history.sort((a, b) => new Date(b.date) - new Date(a.date));
    return history;
}

// Chargement initial une seule fois
user.data = user.loadAll() || createEmpty();
historyStorage.data = historyStorage.loadAll();

/**
 * Sauvegarde la progression d'un AC
 */
user.save = function(acCode, progress) {
    
    user.data.progress[acCode] = progress;
    user.data.lastUpdate = new Date().toISOString();
    
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user.data));
}

/**
 * Charge le map des progressions
 */
user.loadProgressMap = function() {
    return user.data?.progress || {};
}

/**
 * Efface tout
 */
user.clearAll = function() {
    user.data = createEmpty();
    localStorage.removeItem(USER_STORAGE_KEY);
}

/**
 * Ajoute une entrée à l'historique
 */
historyStorage.add = function(acCode, oldProgress, newProgress) {
    if (oldProgress === newProgress) return;
    // Récupérer le libellé
    let label = acCode;
    try {
        label = pn.getAcLibelle(acCode);
    } catch (e) {}
    
    historyStorage.data.push({
        date: new Date().toISOString(),
        ac: acCode,
        oldProgress,
        newProgress,
        label
    });
    
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyStorage.data));
}

/**
 * Retourne les statistiques de l'historique
 */
historyStorage.getStats = function() {
    return {
        count: historyStorage.data.length,
        lastUpdate: historyStorage.data[0]?.date || null,
        size: new Blob([JSON.stringify(historyStorage.data)]).size
    };
}

/**
 * Exporte l'historique en JSON
 */
historyStorage.exportData = function() {
    const blob = new Blob([JSON.stringify(historyStorage.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sae303-historique-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}
/**
 * Importe l'historique depuis un fichier JSON
 * Fusionne avec l'existant en gardant le plus récent par AC
 * @returns {Promise<Array>} Les progressions à appliquer [{acCode, progress, couleur}, ...]
 */
historyStorage.importData = function() {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        
        input.onchange = async (e) => {
            try {
                const file = e.target.files[0];
                if (!file) return reject(new Error('Aucun fichier'));
                
                const importedData = JSON.parse(await file.text());
                
                // Convertir en format historique si nécessaire
                let importedHistory = Array.isArray(importedData) ? importedData : [];
                
                if (!Array.isArray(importedData) && importedData.progress) {
                    // Format {progress: {AC: value}} → convertir en historique
                    const date = importedData.lastUpdate || new Date().toISOString();
                    for (const acCode in importedData.progress) {
                        let label = acCode;
                        try { label = pn.getAcLibelle(acCode); } catch (e) {}
                        
                        importedHistory.push({
                            date, ac: acCode, oldProgress: 0,
                            newProgress: importedData.progress[acCode], label
                        });
                    }
                } else if (importedHistory.length === 0) {
                    return reject(new Error('Format invalide'));
                }
                
                // Fusionner et extraire les progressions les plus récentes
                const allEntries = [...historyStorage.data, ...importedHistory];
                allEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
                
                const newProgress = {};
                const seen = new Set();
                
                for (const entry of allEntries) {
                    if (!seen.has(entry.ac)) {
                        newProgress[entry.ac] = entry.newProgress;
                        seen.add(entry.ac);
                    }
                }
                
                // Sauvegarder tout
                historyStorage.data = allEntries;
                user.data.progress = newProgress;
                user.data.lastUpdate = new Date().toISOString();
                localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(allEntries));
                localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user.data));
                
                // Préparer pour le graphe
                const progressToApply = [];
                for (const acCode in newProgress) {
                    try {
                        progressToApply.push({
                            acCode, progress: newProgress[acCode],
                            couleur: pn.getAcCouleur(acCode)
                        });
                    } catch (e) {}
                }
                
                resolve(progressToApply);
                
            } catch (error) {
                reject(error);
            }
        };
        
        input.click();
    });
}

/**
 * Efface tout l'historique
 */
historyStorage.clearAll = function() {
    historyStorage.data = [];
    localStorage.removeItem(HISTORY_STORAGE_KEY);
}


export { user, historyStorage };
