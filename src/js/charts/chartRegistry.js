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
      if (this.registry.has(id)) {
        this.registry.get(id).destroy();
      }
      this.registry.set(id, chart);
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
        this.registry.get(id).destroy();
        this.registry.delete(id);
      }
    }
  
    /**
     * Destroy all charts
     */
    static destroyAll() {
      this.registry.forEach(chart => chart.destroy());
      this.registry.clear();
    }
  }