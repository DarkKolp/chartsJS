// src/js/charts/chartRegistry.js
export default class ChartRegistry {
  static registry = new Map();
  static resizeHandler = null;
  
  /**
   * Register a chart instance
   * @param {string} id - Chart ID
   * @param {Chart} chart - Chart.js instance
   */
  static register(id, chart) {
    // Clear any existing chart with same ID
    if (this.registry.has(id)) {
      this.destroy(id);
    }
    
    // Register new chart
    this.registry.set(id, chart);
    
    // Set up resize handler if not already done
    if (!this.resizeHandler) {
      this.resizeHandler = this.handleResize.bind(this);
      window.addEventListener('resize', this.resizeHandler);
      window.addEventListener('beforeunload', () => this.destroyAll());
    }
    
    return chart;
  }
  
  /**
   * Handle window resize events
   */
  static handleResize() {
    // Use debounce to prevent excessive updates
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      this.registry.forEach(chart => {
        if (chart && typeof chart.resize === 'function') {
          try {
            chart.resize();
          } catch (e) {
            console.warn(`Error resizing chart:`, e);
          }
        }
      });
    }, 250);
  }
  
  /**
   * Get a chart instance by ID
   * @param {string} id - Chart ID
   * @returns {Chart|undefined} - Chart.js instance if found
   */
  static get(id) {
    return this.registry.get(id);
  }
  
  /**
   * Destroy a chart by ID
   * @param {string} id - Chart ID
   */
  static destroy(id) {
    if (this.registry.has(id)) {
      try {
        const chart = this.registry.get(id);
        if (chart && typeof chart.destroy === 'function') {
          chart.destroy();
        }
      } catch (e) {
        console.warn(`Error destroying chart ${id}:`, e);
      }
      this.registry.delete(id);
    }
  }
  
  /**
   * Destroy all charts
   */
  static destroyAll() {
    console.log("Destroying all charts");
    this.registry.forEach((chart, id) => {
      try {
        if (chart && typeof chart.destroy === 'function') {
          chart.destroy();
        }
      } catch (e) {
        console.warn(`Error destroying chart ${id}:`, e);
      }
    });
    this.registry.clear();
    
    // Clean up event listeners
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
  }
}