// src/js/charts/chartRegistry.js
// Central registry for all charts to manage creation and cleanup
export default class ChartRegistry {
    static registry = new Map();
  
    /**
     * Register a chart instance
     * @param {string} id - Chart ID
     * @param {Chart} chart - Chart.js instance
     */
    static register(id, chart) {
      // Add performance safeguard
      if (this.registry.has(id)) {
        const existingChart = this.registry.get(id);
        if (existingChart && typeof existingChart.destroy === 'function') {
          existingChart.destroy();
        }
      }
      this.registry.set(id, chart);
      
      // Add option for automatic chart cleanup on window events
      window.addEventListener('beforeunload', () => this.destroyAll());
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
    } 
  }