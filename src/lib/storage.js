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
 */
function saveACProgress(acCode, progress) {
    try {
        // Récupérer les données existantes
        const data = loadAll() || createEmptyData();
        
        // Mettre à jour la progression
        data.progress[acCode] = progress;
        data.lastUpdate = new Date().toISOString();
        
        // Sauvegarder dans localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        
        console.log(`[Storage] Progression sauvegardée: ${acCode} = ${progress}%`);
    } catch (error) {
        console.error('[Storage] Erreur lors de la sauvegarde:', error);
    }
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
        progress: {}
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
    clearAll,
    getStats
};
