/**
 * US007: Sauvegarde Persistante (LocalStorage)
 * 
 * Module de gestion de la persistance des données de progression
 * dans le localStorage du navigateur.
 */

const STORAGE_KEY = 'sae303_pn_progress';
const STORAGE_VERSION = '1.0';

/**
 * Sauvegarde la progression d'un AC dans le localStorage
 * @param {string} acCode - Code de l'AC (ex: "AC11.01")
 * @param {number} progress - Progression en pourcentage (0-100)
 * @param {number} oldProgress - Ancienne progression (pour historique)
 * @param {string} label - Libellé de l'AC (pour historique)
 */
function saveACProgress(acCode, progress, oldProgress = null, label = '') {
    try {
        // Récupérer les données existantes
        const data = loadAll() || createEmptyData();
        
        // S'assurer que les champs nécessaires existent (migration)
        if (!data.progress) data.progress = {};
        if (!data.history) data.history = [];
        
        // Récupérer l'ancienne progression si non fournie
        if (oldProgress === null) {
            oldProgress = data.progress[acCode] || 0;
        }
        
        // Mettre à jour la progression
        data.progress[acCode] = progress;
        data.lastUpdate = new Date().toISOString();
        
        // Ajouter une entrée dans l'historique
        addHistoryEntry(data, acCode, oldProgress, progress, label);
        
        // Sauvegarder dans localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        
        console.log(`[Storage] Progression sauvegardée: ${acCode} = ${progress}%`);
    } catch (error) {
        console.error('[Storage] Erreur lors de la sauvegarde:', error);
    }
}

/**
 * Ajoute une entrée dans l'historique
 * @param {Object} data - Objet de données
 * @param {string} acCode - Code de l'AC
 * @param {number} oldProgress - Ancienne progression
 * @param {number} newProgress - Nouvelle progression
 * @param {string} label - Libellé de l'AC
 * @private
 */
function addHistoryEntry(data, acCode, oldProgress, newProgress, label) {
    // Ne pas enregistrer si pas de changement
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
 * Charge toutes les données du localStorage
 * @returns {Object|null} - Objet contenant version, lastUpdate et progress
 */
function loadAll() {
    try {
        const rawData = localStorage.getItem(STORAGE_KEY);
        if (!rawData) return null;
        
        const data = JSON.parse(rawData);
        
        // Vérifier la version (pour migration future)
        if (data.version !== STORAGE_VERSION) {
            console.warn('[Storage] Version différente détectée, migration possible requise');
            // Ici on pourrait faire une migration si nécessaire
        }
        
        return data;
    } catch (error) {
        console.error('[Storage] Erreur lors du chargement:', error);
        return null;
    }
}

/**
 * Charge uniquement le map des progressions
 * @returns {Object} - Map {acCode: progress, ...}
 */
function loadProgressMap() {
    const data = loadAll();
    return data ? data.progress : {};
}

/**
 * Crée une structure de données vide
 * @returns {Object}
 * @private
 */
function createEmptyData() {
    return {
        version: STORAGE_VERSION,
        lastUpdate: new Date().toISOString(),
        progress: {},
        history: []
    };
}

/**
 * Efface toutes les données de progression
 */
function clearAll() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        console.log('[Storage] Toutes les progressions effacées');
    } catch (error) {
        console.error('[Storage] Erreur lors de l\'effacement:', error);
    }
}

/**
 * Charge l'historique trié par date (plus récent d'abord)
 * @returns {Array} - Tableau des entrées d'historique
 */
function loadHistory() {
    const data = loadAll();
    if (!data || !data.history) return [];
    
    // Trier par date décroissante (plus récent d'abord)
    return [...data.history].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
}

/**
 * Exporte toutes les données en JSON téléchargeable
 */
function exportData() {
    try {
        const data = loadAll() || createEmptyData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const date = new Date().toISOString().split('T')[0];
        a.download = `sae303-backup-${date}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        console.log('[Storage] Données exportées');
    } catch (error) {
        console.error('[Storage] Erreur lors de l\'export:', error);
    }
}

/**
 * Récupère des statistiques sur les données sauvegardées
 * @returns {Object} - Statistiques {count, lastUpdate, size}
 */
function getStats() {
    const data = loadAll();
    if (!data) {
        return { count: 0, lastUpdate: null, size: 0 };
    }
    
    return {
        count: Object.keys(data.progress).length,
        lastUpdate: data.lastUpdate,
        size: new Blob([JSON.stringify(data)]).size
    };
}

export {
    saveACProgress,
    loadAll,
    loadProgressMap,
    loadHistory,
    exportData,
    clearAll,
    getStats
};
