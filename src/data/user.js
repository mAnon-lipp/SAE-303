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

historyStorage.importData = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.addEventListener('change', async () => {
        const file = input.files[0];
        if (!file) return;
        
        const text = await file.text();
        const data = JSON.parse(text);
        
        historyStorage.data = data;
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyStorage.data));
        
        // Reconstruire les progressions utilisateur à partir de l'historique
        historyStorage.rebuildProgressFromHistory();
        
        document.dispatchEvent(new CustomEvent('historystorage:imported', { detail: data }));
    });
    
    input.click();
}


/**
 * Reconstruit les progressions utilisateur à partir de l'historique
 */
historyStorage.rebuildProgressFromHistory = function() {
    const progressMap = {};
    
    // Prendre la dernière progression de chaque AC
    historyStorage.data.forEach(entry => {
        progressMap[entry.ac] = entry.newProgress;
    });
    
    // Sauvegarder dans user.data et localStorage
    user.data.progress = progressMap;
    user.data.lastUpdate = new Date().toISOString();
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user.data));
}

/**
 * Efface tout l'historique
 */
historyStorage.clearAll = function() {
    historyStorage.data = [];
    localStorage.removeItem(HISTORY_STORAGE_KEY);
}


export { user, historyStorage };
