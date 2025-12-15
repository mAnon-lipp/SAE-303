import { htmlToDOM } from "@/lib/utils.js";
import { loadHistory, exportData, getStats } from "@/lib/storage.js";
import { Animation } from "@/lib/animation.js";
import template from "./template.html?raw";
import "./style.css";

class HistoryPanel {
  constructor() {
    this.root = htmlToDOM(template);
    this.isOpen = false;
    
    // Sélection groupée des éléments
    this.elements = {
      overlay: this.root.querySelector(".history-panel-overlay"),
      panel: this.root.querySelector(".history-panel__content"),
      close: this.root.querySelector(".history-panel__close"),
      export: this.root.querySelector(".history-panel__export"),
      list: this.root.querySelector(".history-panel__list"),
      count: this.root.querySelector(".history-panel__count"),
      lastUpdate: this.root.querySelector(".history-panel__last-update")
    };
    
    this._setupEvents();
  }
  
  _setupEvents() {
    // Fermeture
    const closeHandler = () => this.close();
    this.elements.close.addEventListener("click", closeHandler);
    this.elements.overlay.addEventListener("click", closeHandler);
    
    // Export avec feedback
    this.elements.export.addEventListener("click", () => {
      exportData();
      this._showExportFeedback();
    });
  }
  
  _showExportFeedback() {
    const originalText = this.elements.export.textContent;
    this.elements.export.textContent = "Exporté !";
    setTimeout(() => {
      this.elements.export.textContent = originalText;
    }, 2000);
  }
  
  dom() {
    return this.root;
  }
  
  open() {
    if (this.isOpen) return;
    
    this.isOpen = true;
    this.root.classList.add("is-open");
    this.refresh();
    
    Animation.slidePanel(this.elements.panel, this.elements.overlay, true);
  }
  
  close() {
    if (!this.isOpen) return;
    
    this.isOpen = false;
    
    const tl = Animation.slidePanel(this.elements.panel, this.elements.overlay, false);
    tl.eventCallback('onComplete', () => {
      this.root.classList.remove("is-open");
    });
  }
  
  refresh() {
    const history = loadHistory();
    const stats = getStats();
    
    // Mise à jour des stats
    this.elements.count.textContent = `${history.length} modification(s)`;
    this.elements.lastUpdate.textContent = stats.lastUpdate 
      ? `Dernière mise à jour : ${this._formatDate(new Date(stats.lastUpdate))}`
      : "Dernière mise à jour : Jamais";
    
    this._renderHistory(history);
  }
  
  _renderHistory(history) {
    if (history.length === 0) {
      this.elements.list.innerHTML = `
        <div class="history-panel__empty">
          <div class="history-panel__empty-icon">📭</div>
          <p>Aucune modification enregistrée</p>
        </div>
      `;
      return;
    }
    
    // Créer et animer les items
    this.elements.list.innerHTML = "";
    const items = history.map(entry => {
      const item = this._createItem(entry);
      this.elements.list.appendChild(item);
      return item;
    });
    
    Animation.staggerFadeIn(items);
  }
  
  _createItem(entry) {
    const item = document.createElement("div");
    item.className = "history-item";
    item.innerHTML = `
      <div class="history-item__header">
        <span class="history-item__code">${entry.ac}</span>
        <span class="history-item__date">${this._formatDate(new Date(entry.date))}</span>
      </div>
      <div class="history-item__label">${entry.label || 'Sans libellé'}</div>
      <div class="history-item__progress">
        <span>${entry.oldProgress}%</span>
        <span class="history-item__arrow">→</span>
        <span>${entry.newProgress}%</span>
      </div>
    `;
    return item;
  }
  
  _formatDate(date) {
    const diff = Date.now() - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }
}

export { HistoryPanel };