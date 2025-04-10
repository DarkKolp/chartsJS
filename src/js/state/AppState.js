// src/js/state/AppState.js
export default class AppState {
  constructor() {
    this.state = {
      selectedNetwork: null,
      networkData: null,
      currentView: 'networkSelection', // Possible values: 'networkSelection', 'reportSelection', 'categorySelection', 'chartDisplay'
      selectedReport: null, // 'light' or 'full'
      selectedCategory: null // 'economic_security', 'operators', 'vaults', 'curators'
    };
    this.listeners = [];
  }

  getState() {
    return this.state;
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }
}

// Create singleton instance
const appState = new AppState();
export { appState };