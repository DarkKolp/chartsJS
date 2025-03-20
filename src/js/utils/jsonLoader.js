/**
 * JSON Loader Utility
 * Handles loading JSON files
 */
export default class JsonLoader {
    /**
     * Load a JSON file
     * @param {string} filePath - Path to the JSON file
     * @returns {Promise<Object>} - Parsed JSON data
     */
    static async load(filePath) {
      try {
        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(`Failed to load JSON: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error("Error loading JSON:", error);
        throw error;
      }
    }
  }