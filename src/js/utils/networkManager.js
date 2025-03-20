/**
 * Network Manager
 * Manages network data loading and caching
 */
export default class NetworkManager {
    constructor() {
      this.networks = [];
      this.networkData = {}; // Cache for loaded network data
      this.currentNetwork = null;
    }
  
    /**
     * Initialize the network manager
     * @returns {Promise<Array>} Available networks
     */
    async initialize() {
      try {
        // This could be a backend call in a real app
        // For now, we'll scan the data directory or use hardcoded values
        this.networks = await this.fetchAvailableNetworks();
        return this.networks;
      } catch (error) {
        console.error('Failed to initialize NetworkManager:', error);
        return [];
      }
    }
  
    /**
     * Fetch available networks
     * @returns {Promise<Array>} Network list
     */
    async fetchAvailableNetworks() {
      try {
        const response = await fetch('/api/networks');
        if (!response.ok) {
          throw new Error(`Failed to fetch networks: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching networks:', error);
        // Fallback to hardcoded networks
        return [
          { id: 'ditto', name: 'Ditto Network', fileName: 'ditto network_reportMetrics.json' }
        ];
      }
    }
    
  
    /**
     * Load network data
     * @param {string} networkId - Network identifier
     * @returns {Promise<Object>} Network data
     */
    async loadNetwork(networkId) {
      // If already loaded, return from cache
      if (this.networkData[networkId]) {
        this.currentNetwork = networkId;
        return this.networkData[networkId];
      }
  
      try {
        const network = this.networks.find(n => n.id === networkId);
        if (!network) {
          throw new Error(`Network ${networkId} not found`);
        }
  
        const filePath = `./data/${network.name}/${network.fileName}`;
        const response = await fetch(filePath);
        
        if (!response.ok) {
          throw new Error(`Failed to load network data: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Cache the data
        this.networkData[networkId] = data;
        this.currentNetwork = networkId;
        
        return data;
      } catch (error) {
        console.error(`Error loading network ${networkId}:`, error);
        throw error;
      }
    }
  
    /**
     * Get the current network's data
     * @returns {Object|null} Current network data
     */
    getCurrentNetworkData() {
      if (!this.currentNetwork) return null;
      return this.networkData[this.currentNetwork];
    }
  }