import DataTransformer from './utils/dataTransformer.js';
import LineChart from './charts/lineChart.js';
import BarChart from './charts/barChart.js';
import PieChart from './charts/pieChart.js';
import ProgressChart from './charts/ProgressChart.js';
import ChartRegistry from './charts/chartRegistry.js';
import NetworkManager from './utils/networkManager.js';
import ChartConfigManager from './utils/chartConfigManager.js';
import ChartFactory from './charts/chartFactory.js';

// Global instances
const networkManager = new NetworkManager();
const chartConfigManager = new ChartConfigManager();
let currentChart = null;
let activeCategory = 'vaults'; // Default category

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
      document.getElementById('chart-container').innerHTML = '';
      document.getElementById('network-info').innerHTML = '';
    }
  });
}

/**
 * Initialize category navigation
 */
function initCategoryNav() {
  const navContainer = document.getElementById('category-nav');
  if (!navContainer) return;
  
  // Clear existing buttons
  navContainer.innerHTML = '';
  
  // Get categories from chart config manager
  const categories = chartConfigManager.getCategories();
  
  // Create category buttons
  Object.keys(categories).forEach(categoryId => {
    const category = categories[categoryId];
    const button = document.createElement('button');
    button.className = `category-button${categoryId === activeCategory ? ' active' : ''}`;
    button.dataset.category = categoryId;
    button.textContent = category.name;
    
    button.addEventListener('click', () => {
      // Update active state
      document.querySelectorAll('.category-button').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Update active category
      activeCategory = categoryId;
      
      // Update chart selector
      initChartSelector();
      
      // Load first chart in category if available
      const charts = chartConfigManager.getChartsByCategory(categoryId);
      if (charts.length > 0) {
        loadChart(charts[0].id);
      }
    });
    
    navContainer.appendChild(button);
  });

  // Ensure collateral category is visible when directly accessing via URL
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('category') === 'collateral') {
    document.querySelector('[data-category="collateral"]')?.classList.add('active');
    activeCategory = 'collateral';
    initChartSelector();
  }

}

/**
 * Initialize chart selector based on active category
 */
function initChartSelector() {
  const selector = document.getElementById('chart-selector');
  selector.innerHTML = '';
  
  // Get charts for active category
  const charts = chartConfigManager.getChartsByCategory(activeCategory);
  
  // Add chart type buttons
  charts.forEach(chart => {
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
 * Load collateral metadata
 * @returns {Promise<Object>} Collateral metadata
 */
async function loadCollateralMeta() {
  try {
    const response = await fetch('./data/meta/collateral_meta.json');
    if (!response.ok) {
      throw new Error(`Failed to load collateral metadata: ${response.status}`);
    }
    window.collateralMeta = await response.json();
    return window.collateralMeta;
  } catch (error) {
    console.error("Error loading collateral metadata:", error);
    window.collateralMeta = {};
    return {};
  }
}

/**
 * Load network data and initialize navigation
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
    
    // Initialize category navigation
    initCategoryNav();
    
    // Initialize chart selector for default category
    initChartSelector();

    // Add report section buttons
    addReportSectionButtons();
    
    // Auto-select the first chart in the active category
    const charts = chartConfigManager.getChartsByCategory(activeCategory);
    if (charts.length > 0) {
      const firstChartId = charts[0].id;
      document.querySelector(`[data-chart-id="${firstChartId}"]`)?.classList.add('active');
      loadChart(firstChartId);
    }
    
  } catch (error) {
    document.getElementById('chart-container').innerHTML = `<div class="error">Failed to load network: ${error.message}</div>`;
  }
}

function addReportSectionButtons() {
  const container = document.querySelector('.network-info');
  if (!container) return;
  
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'report-buttons';
  buttonContainer.style.display = 'flex';
  buttonContainer.style.gap = '10px';
  buttonContainer.style.marginTop = '15px';
  
  
  vaultBtn.addEventListener('click', async () => {
    const networkData = networkManager.getCurrentNetworkData();
    if (!networkData) return;
    
    // Create report container if it doesn't exist
    let reportContainer = document.getElementById('network-report-container');
    if (!reportContainer) {
      reportContainer = document.createElement('div');
      reportContainer.id = 'network-report-container';
      reportContainer.className = 'network-report-container';
      reportContainer.style.backgroundColor = '#f8f9fa';
      reportContainer.style.padding = '20px';
      reportContainer.style.marginTop = '20px';
      reportContainer.style.borderRadius = '8px';
      document.body.appendChild(reportContainer);
    }
    
    // Import VaultReportUtils dynamically
    const VaultReportUtils = (await import('./utils/vaultReportUtils.js')).default;
    VaultReportUtils.generateVaultSection('network-report-container', networkData);
    
    // Scroll to report section
    reportContainer.scrollIntoView({ behavior: 'smooth' });
  });
  
  buttonContainer.appendChild(vaultBtn);
  container.appendChild(buttonContainer);
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
  
  // Add chart title
  const titleDiv = document.createElement('div');
  titleDiv.className = 'chart-title';
  titleDiv.textContent = chartConfig.config.title || chartConfig.name;
  container.appendChild(titleDiv);
  
  // Create chart area
  const chartArea = document.createElement('div');
  chartArea.className = 'chart-area';
  container.appendChild(chartArea);
  
  const canvas = document.createElement('canvas');
  canvas.id = `chart-${chartId}`;
  chartArea.appendChild(canvas);
  
  // Extract data from the specified path
  let data = DataTransformer.extractFromPath(networkData, chartConfig.dataPath);
  
  // Apply custom transform if needed
  if (chartConfig.config.customTransform) {
    data = transformCustomData(data, chartConfig);
  }
  
  // Create the chart based on type
  let chart;
  switch (chartConfig.type) {
      
    case 'bar':
      if (chartId === 'collateral-limits') {
        chart = BarChart.createLogScale(canvas.id, data, {
          title: chartConfig.config.title
        });
      } else {
        chart = BarChart.createBasic(canvas.id, data, {
          labelKey: chartConfig.config.labelKey,
          valueKey: chartConfig.config.valueKey,
          title: chartConfig.config.title
        });
      }
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
      
      case 'progress':
        if (Array.isArray(data) && data.length > 0) {
          if (chartId === 'collateral-utilization') {
            // For collateral utilization, create multiple progress bars
            const progressData = data.map(collateral => ({
              label: collateral.collateral_symbol,
              percentage: collateral.utilization_percent,
              value: collateral.stake,
              limit: collateral.limit
            }));
            
            chart = ProgressChart.createMultiple(canvas.id, progressData, {
              title: 'Collateral Utilization'
            });
          } else {
            // For single collateral display
            const collateralData = data[0];
            // Use create instead of createRadial
            chart = ProgressChart.create(canvas.id, collateralData.utilization_percent, {
              title: `${collateralData.collateral_symbol} Utilization`,
              subtitle: collateralData.collateral_symbol,
              value: collateralData.stake,
              limit: collateral.limit
            });
          }
        }
        break;
      
    case 'progress-multiple':
      if (Array.isArray(data) && data.length > 0) {
        // For vault utilization, create multiple progress bars
        const collateralData = data[0]; // First collateral for demo
        const progressData = collateralData.vaults.map(vault => ({
          label: vault.label,
          percentage: vault.utilization_percent,
          value: vault.stake,
          limit: vault.limit
        }));
        
        chart = ProgressChart.createMultiple(canvas.id, progressData, {
          title: `${collateralData.collateral_symbol} Vaults Utilization`
        });
      }
      break;

    case 'progress':
      if (Array.isArray(data) && data.length > 0) {
        // For collateral utilization, create multiple progress bars
        if (chartId === 'collateral-utilization') {
          const progressData = data.map(collateral => ({
            label: collateral.collateral_symbol,
            percentage: collateral.utilization_percent,
            value: collateral.stake,
            limit: collateral.limit
          }));
          
          chart = ProgressChart.createMultiple(canvas.id, progressData, {
            title: 'Collateral Utilization'
          });
        } else {
          // For single collateral (fallback to existing behavior)
          const collateralData = data[0];
          chart = ProgressChart.create(canvas.id, collateralData.utilization_percent, {
            title: `${collateralData.collateral_symbol} Utilization`,
            value: collateralData.stake,
            limit: collateralData.limit
          });
        }
      }
      break;
      
    default:
      container.innerHTML = `<div class="error">Unsupported chart type: ${chartConfig.type}</div>`;
      return;
  }
  
  setupChartFiltering(chart, chartId);
  // Register the chart
  ChartRegistry.register(chartId, chart);
  currentChart = chartId;
}

function setupChartFiltering(chart, chartId) {
  chart.canvas.addEventListener('chartfilter', (e) => {
    const { label } = e.detail;
    
    // Apply filter to other charts
    ChartRegistry.registry.forEach((otherChart, otherId) => {
      if (otherId !== chartId) {
        // Filter logic depends on chart type and data relationship
        otherChart.data.datasets.forEach(dataset => {
          dataset.backgroundColor = dataset.data.map((_, i) => 
            otherChart.data.labels[i] === label 
              ? ChartFactory.brandColors.primary.purple 
              : ChartFactory.brandColors.primary.lightPurple
          );
        });
        otherChart.update();
      }
    });
  });
}

/**
 * Transform custom data formats
 * @param {Object} data - Raw data
 * @param {Object} chartConfig - Chart configuration
 * @returns {Array} - Transformed data
 */
function transformCustomData(data, chartConfig) {
  // Handle curator data which is in a special format
  if (chartConfig.category === 'curators') {
    if (chartConfig.id === 'curator-distribution') {
      // Transform curator stats to chart-friendly format
      return Object.entries(data).map(([curatorName, info]) => ({
        curator: curatorName.replace('_', ' '),
        vaults_count: info.vaults_count
      }));
    } else if (chartConfig.id === 'curator-collateral') {
      // Transform curator collateral data
      const result = [];
      Object.entries(data).forEach(([curatorName, info]) => {
        Object.entries(info.collaterals).forEach(([collateral, count]) => {
          result.push({
            curator: curatorName.replace('_', ' '),
            collateral_symbol: collateral,
            count: count
          });
        });
      });
      return result;
    }
  }

  // Handle collateral types by underlying asset
  if (chartConfig.category === 'collateral' && chartConfig.id === 'collateral-types') {
    // Group by underlying asset
    const assetGroups = {};
    let totalUsdStake = 0;
    
    // First pass: group and sum
    data.forEach(collateral => {
      // Carefully extract the underlying asset
      let asset = 'Unknown';
      
      // Check each vault for the underlying_asset
      if (collateral.vaults && collateral.vaults.length > 0) {
        // Find the first vault with an underlying_asset
        for (const vault of collateral.vaults) {
          if (vault.underlying_asset) {
            asset = vault.underlying_asset;
            break;
          }
        }
      }
      
      if (!assetGroups[asset]) {
        assetGroups[asset] = {
          label: asset,
          usd_stake: 0,
          percentage: 0
        };
      }
      
      assetGroups[asset].usd_stake += collateral.usd_stake;
      totalUsdStake += collateral.usd_stake;
    });
    
    // Second pass: calculate percentages
    Object.values(assetGroups).forEach(group => {
      group.percentage = (group.usd_stake / totalUsdStake) * 100;
      group.value = group.percentage.toFixed(1); // For display
    });
    
    return Object.values(assetGroups);
  }

  // Handle collateral limits with log scale
  if (chartConfig.category === 'collateral' && chartConfig.id === 'collateral-limits') {
    // Load collateral metadata for USD conversion
    let collateralMeta = {};
    try {
      // We'll make this async in production, but for this example we'll assume it's loaded
      collateralMeta = window.collateralMeta || {}; // Fallback if not loaded
    } catch (error) {
      console.error("Error loading collateral metadata:", error);
    }
    
    // Transform data to show USD values
    return data.map(collateral => {
      const symbol = collateral.collateral_symbol;
      const limit = parseFloat(collateral.limit);
      // Consider extremely large values as "infinite"
      const isInfinite = limit > 1000000000000; // > 1 trillion is likely "infinite"
      
      // Get token metadata and price
      const meta = collateralMeta[symbol] || { usdPrice: 1, underlyingAsset: 'Unknown' };
      const usdLimit = isInfinite ? null : limit * meta.usdPrice;
      
      return {
        label: symbol,
        value: usdLimit, // USD value for the chart
        rawLimit: limit, // Original token amount
        usdPrice: meta.usdPrice,
        displayValue: isInfinite ? 
          "∞" : 
          `$${(usdLimit || 0).toLocaleString()} (${limit.toLocaleString()} ${symbol})`,
        underlyingAsset: meta.underlyingAsset,
        utilization: collateral.utilization_percent
      };
    }).sort((a, b) => {
      // Handle sort with infinite values
      if (a.value === null) return 1; // Infinite values at the end
      if (b.value === null) return -1;
      return b.value - a.value; // Otherwise sort by numeric value
    });
  }
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
  const categoryId = urlParams.get('category');
  const chartId = urlParams.get('chart');

  await loadCollateralMeta();
  
  // Set active category if specified
  if (categoryId && chartConfigManager.getCategories()[categoryId]) {
    activeCategory = categoryId;
  }
  
  if (networkId) {
    // Set the network selector
    document.getElementById('network-selector').value = networkId;
    
    // Load the network
    await loadNetwork(networkId);
    
    // Load specific category if provided
    if (categoryId) {
      document.querySelector(`[data-category="${categoryId}"]`)?.click();
    }
    
    // Load the specified chart if provided
    if (chartId) {
      const chartButton = document.querySelector(`[data-chart-id="${chartId}"]`);
      if (chartButton) {
        chartButton.click();
      }
    }
  }

  import('./utils/vaultReportUtils.js').then(module => {
    const VaultReportUtils = module.default;
    VaultReportUtils.initialize(networkManager);
  }).catch(err => console.error('Failed to load vault report utils:', err));  
}

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', initApp);