import DataTransformer from './utils/dataTransformer.js';
import LineChart from './charts/lineChart.js';
import BarChart from './charts/barChart.js';
import PieChart from './charts/pieChart.js'; // You'll need to create this
import ChartRegistry from './charts/chartRegistry.js';
import NetworkManager from './utils/networkManager.js';
import ChartConfigManager from './utils/chartConfigManager.js';

// Global instances
const networkManager = new NetworkManager();
const chartConfigManager = new ChartConfigManager();
let currentChart = null;

/**
 * Initialize network selector
 * @param {Array} networks - Available networks
 */
function initNetworkSelector(networks) {
  const selector = document.getElementById('network-selector');
  
  // Clear existing options
  selector.innerHTML = '<option value="">Select Network</option>';
  
  // Add network options
  networks.forEach(network => {
    const option = document.createElement('option');
    option.value = network.id;
    option.textContent = network.name;
    selector.appendChild(option);
  });
  
  // Add event listener
  selector.addEventListener('change', async (event) => {
    const networkId = event.target.value;
    if (networkId) {
      await loadNetwork(networkId);
    } else {
      // Clear the UI when no network is selected
      document.getElementById('chart-selector').innerHTML = '';
      document.getElementById('network-info').innerHTML = '';
      document.getElementById('chart-container').innerHTML = '';
    }
  });
}

/**
 * Initialize chart selector
 */
function initChartSelector() {
  const selector = document.getElementById('chart-selector');
  selector.innerHTML = '';
  
  // Add chart type buttons
  chartConfigManager.chartTypes.forEach(chart => {
    const button = document.createElement('button');
    button.className = 'chart-selector-button';
    button.dataset.chartId = chart.id;
    button.textContent = chart.name;
    
    button.addEventListener('click', () => {
      // Highlight the selected button
      document.querySelectorAll('.chart-selector-button').forEach(btn => {
        btn.classList.remove('active');
      });
      button.classList.add('active');
      
      // Load the selected chart
      loadChart(chart.id);
    });
    
    selector.appendChild(button);
  });
}

/**
 * Load network data and initialize chart selector
 * @param {string} networkId - Network identifier
 */
async function loadNetwork(networkId) {
  try {
    // Show loading state
    document.getElementById('chart-container').innerHTML = '<div class="loading">Loading network data...</div>';
    
    // Load network data
    const data = await networkManager.loadNetwork(networkId);
    
    // Update network info
    updateNetworkInfo(data);
    
    // Initialize chart selector
    initChartSelector();
    
    // Auto-select the first chart
    const firstChartId = chartConfigManager.chartTypes[0].id;
    document.querySelector(`[data-chart-id="${firstChartId}"]`).click();
    
  } catch (error) {
    document.getElementById('chart-container').innerHTML = `<div class="error">Failed to load network: ${error.message}</div>`;
  }
}

/**
 * Update network information display
 * @param {Object} data - Network data
 */
function updateNetworkInfo(data) {
  const infoElement = document.getElementById('network-info');
  
  // Extract basic network info
  const networkName = data.network?.name || 'Unknown Network';
  const totalStake = data.economic_security?.total_usd_stake || 0;
  const formattedStake = new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(totalStake);
  
  infoElement.innerHTML = `
    <div class="network-info-header">
      <h2>${networkName}</h2>
      <div class="network-stats">
        <div class="stat-item">
          <span class="stat-label">Total Stake:</span>
          <span class="stat-value">${formattedStake}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Operators:</span>
          <span class="stat-value">${data.operators?.count || 'N/A'}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Vaults:</span>
          <span class="stat-value">${data.vault_configuration?.total_vaults || 'N/A'}</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Load and render a chart
 * @param {string} chartId - Chart identifier
 */
function loadChart(chartId) {
  // Get current network data
  const networkData = networkManager.getCurrentNetworkData();
  if (!networkData) {
    console.error('No network data available');
    return;
  }
  
  // Get chart configuration
  const chartConfig = chartConfigManager.getChartConfig(chartId);
  if (!chartConfig) {
    console.error(`Chart configuration not found for ${chartId}`);
    return;
  }
  
  // Clear existing chart
  if (currentChart) {
    ChartRegistry.destroy(currentChart);
  }
  
  // Prepare container
  const container = document.getElementById('chart-container');
  container.innerHTML = '';
  
  const canvas = document.createElement('canvas');
  canvas.id = `chart-${chartId}`;
  container.appendChild(canvas);
  
  // Extract data from the specified path
  const data = DataTransformer.extractFromPath(networkData, chartConfig.dataPath);
  
  // Create the chart based on type
  let chart;
  switch (chartConfig.type) {
    case 'bar':
      chart = BarChart.createBasic(canvas.id, data, {
        labelKey: chartConfig.config.labelKey,
        valueKey: chartConfig.config.valueKey,
        title: chartConfig.config.title
      });
      break;
    case 'pie':
      chart = PieChart.create(canvas.id, data, {
        labelKey: chartConfig.config.labelKey,
        valueKey: chartConfig.config.valueKey,
        title: chartConfig.config.title
      });
      break;
    case 'line':
      chart = LineChart.createTimeSeries(canvas.id, data, {
        dateKey: chartConfig.config.dateKey,
        valueKey: chartConfig.config.valueKey,
        title: chartConfig.config.title
      });
      break;
    default:
      container.innerHTML = `<div class="error">Unsupported chart type: ${chartConfig.type}</div>`;
      return;
  }
  
  // Register the chart
  ChartRegistry.register(chartId, chart);
  currentChart = chartId;
}

/**
 * Initialize the application
 */
async function initApp() {
  // Initialize network manager
  const networks = await networkManager.initialize();
  
  // Initialize UI
  initNetworkSelector(networks);
  
  // Update UI based on URL parameters (optional)
  const urlParams = new URLSearchParams(window.location.search);
  const networkId = urlParams.get('network');
  const chartId = urlParams.get('chart');
  
  if (networkId) {
    // Set the network selector
    document.getElementById('network-selector').value = networkId;
    
    // Load the network
    await loadNetwork(networkId);
    
    // Load the specified chart if provided
    if (chartId) {
      const chartButton = document.querySelector(`[data-chart-id="${chartId}"]`);
      if (chartButton) {
        chartButton.click();
      }
    }
  }
}

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', initApp);