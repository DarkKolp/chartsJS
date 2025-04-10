// src/js/services/DataService.js
export default class DataService {
  static async loadNetworkData(networkName) {
    try {
      // The file path appears to use spaces, not underscores in the filename part
      // Let's log the exact path being requested for debugging
      let filePath = `data/${networkName}/${networkName.toLowerCase()}_lightReport.json`;
      
      console.log(`Attempting to load data from: ${filePath}`);
      
      try {
        // Try first with the formatted name
        let response = await fetch(filePath);
        
        if (!response.ok) {
          // If that fails, try with the original name format
          filePath = `data/${networkName}/ditto network_lightReport.json`;
          console.log(`First attempt failed. Trying alternate path: ${filePath}`);
          response = await fetch(filePath);
          
          if (!response.ok) {
            throw new Error(`Failed to load data: ${response.status}`);
          }
        }
        
        return await response.json();
      } catch (error) {
        console.error(`Network data fetch error:`, error);
        throw error;
      }
    } catch (error) {
      console.error(`Error loading ${networkName} data:`, error);
      throw error;
    }
  }

  static async getAvailableNetworks() {
    try {
      // Check server endpoint first
      try {
        const response = await fetch('/api/networks');
        if (response.ok) {
          return await response.json();
        }
      } catch (e) {
        console.warn('API endpoint unavailable, using fallback networks');
      }
      
      // Fallback to hardcoded networks
      return [
        { id: 'ditto', name: 'Ditto Network' }
      ];
    } catch (error) {
      console.error('Error fetching networks:', error);
      // Final fallback
      return [
        { id: 'ditto', name: 'Ditto Network' }
      ];
    }
  }
}