/**
 * CSV Loader Utility
 * Handles loading and parsing CSV files
 */
export default class CSVLoader {
    /**
     * Load and parse a CSV file
     * @param {string} filePath - Path to the CSV file
     * @returns {Promise<Array>} - Parsed CSV data
     */
    static async load(filePath) {
      try {
        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(`Failed to load CSV: ${response.status}`);
        }
        const csvText = await response.text();
        return this.parse(csvText);
      } catch (error) {
        console.error("Error loading CSV:", error);
        throw error;
      }
    }
  
    /**
     * Parse CSV text using PapaParse
     * @param {string} csvText - CSV content as text
     * @returns {Promise<Array>} - Parsed CSV data
     */
    static parse(csvText) {
      return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              console.warn("CSV parsing had errors:", results.errors);
            }
            resolve(results.data);
          },
          error: (error) => {
            reject(error);
          }
        });
      });
    }
  }