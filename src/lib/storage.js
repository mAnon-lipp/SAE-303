import { pn } from '@/data/tri.js';

let storage = {};

const STORAGE_KEY = 'sae303_pn_progress';
const STORAGE_VERSION = '1.0';

// Fonctions privées (helpers internes)
function createEmpty() {
    return {
        version: STORAGE_VERSION,
        lastUpdate: new Date().toISOString(),
        progress: {},
        history: []
    };
}

function addToHistory(data, acCode, oldProgress, newProgress, label) {
    if (oldProgress === newProgress) return;
    data.history.push({
        date: new Date().toISOString(),
        ac: acCode,
        oldProgress,
        newProgress,
        label
    });
}

/**
 * Sauvegarde la progression d'un AC
 */
storage.save = function(acCode, progress, oldProgress = null) {
    const data = storage.loadAll() || createEmpty();
    
    if (oldProgress === null) {
        oldProgress = data.progress[acCode] || 0;
    }
    
    data.progress[acCode] = progress;
    data.lastUpdate = new Date().toISOString();
    
    // Ajouter à l'historique avec le libellé
    try {
        addToHistory(data, acCode, oldProgress, progress, pn.getAcLibelle(acCode));
    } catch (e) {
        addToHistory(data, acCode, oldProgress, progress, acCode);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Charge toutes les données
 */
storage.loadAll = function() {
    const rawData = localStorage.getItem(STORAGE_KEY);
    return rawData ? JSON.parse(rawData) : null;
}

/**
 * Charge le map des progressions
 */
storage.loadProgressMap = function() {
    const data = storage.loadAll();
    return data?.progress || {};
}

/**
 * Charge l'historique trié
 */
storage.loadHistory = function() {
    const data = storage.loadAll();
    return data?.history ? [...data.history].sort((a, b) => new Date(b.date) - new Date(a.date)) : [];
}

/**
 * Récupère les statistiques
 */
storage.getStats = function() {
    const data = storage.loadAll();
    return data ? {
        count: Object.keys(data.progress).length,
        lastUpdate: data.lastUpdate,
        size: new Blob([JSON.stringify(data)]).size
    } : { count: 0, lastUpdate: null, size: 0 };
}

/**
 * Exporte en JSON
 */
storage.exportData = function() {
    const data = storage.loadAll() || createEmpty();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sae303-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Efface tout
 */
storage.clearAll = function() {
    localStorage.removeItem(STORAGE_KEY);
}

export { storage };
