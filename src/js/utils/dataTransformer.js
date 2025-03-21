/**
 * Data Transformer Utility
 * Transforms JSON data for Chart.js
 */
export default class DataTransformer {
    /**
     * Extract basic data for bar/pie charts
     * @param {Object|Array} data - JSON data
     * @param {Object} config - Configuration options
     * @returns {Object} Extracted labels and values
     */
    static extractBasicData(data, { labelKey, valueKey }) {
      if (Array.isArray(data)) {
        return {
          labels: data.map(item => item[labelKey]),
          values: data.map(item => item[valueKey])
        };
      }
      
      // If we need to extract from a specific path in the JSON
      console.warn('Data is not an array, returning empty result');
      return { labels: [], values: [] };
    }
    
    /**
     * Extract time series data
     * @param {Object|Array} data - JSON data
     * @param {Object} config - Configuration options
     * @returns {Object} Extracted dates and values
     */
    static timeSeriesData(data, { dateKey, valueKey }) {
      if (Array.isArray(data)) {
        return {
          labels: data.map(item => new Date(item[dateKey])),
          values: data.map(item => item[valueKey])
        };
      }
      
      console.warn('Data is not an array, returning empty result');
      return { labels: [], values: [] };
    }
    
    /**
     * Extract data from a nested path in JSON
     * @param {Object} data - JSON object
     * @param {Array<string>} path - Path to the data array
     * @returns {Array} Data at the specified path
     */
    static extractFromPath(data, path) {
      let result = data;
      
      for (const key of path) {
        if (result && result[key] !== undefined) {
          result = result[key];
        } else {
          console.error(`Path ${path.join('.')} not found in data`);
          return [];
        }
      }
      
      return result;
    }

    static dataCache = new Map();

    static extractFromPath(data, path, cacheKey) {
      if (cacheKey && this.dataCache.has(cacheKey)) {
        return this.dataCache.get(cacheKey);
      }
      
      let result = data;
      for (const key of path) {
        if (result && result[key] !== undefined) {
          result = result[key];
        } else {
          console.error(`Path ${path.join('.')} not found in data`);
          return [];
        }
      }
      
      if (cacheKey) {
        this.dataCache.set(cacheKey, result);
      }
      return result;
    }
  }