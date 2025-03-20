// src/js/utils/dataLoader.js
export default class DataLoader {
  /**
   * Load network data from JSON file
   * @param {string} networkName - The name of the network
   * @returns {Promise<Object>} - The parsed JSON data
   */
  static async loadNetworkData(networkName) {
    try {
      const response = await fetch(`./data/${networkName}/reportMetrics.json`);
      if (!response.ok) {
        throw new Error(`Failed to load data: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error loading ${networkName} data:`, error);
      throw error;
    }
  }

  /**
   * Get available networks
   * @returns {Promise<Array<string>>} - Array of network names
   */
  static async getAvailableNetworks() {
    // In a real app, this would be a backend call
    // For now, we'll hardcode the available networks
    return ['Ditto Network'];
  }
}