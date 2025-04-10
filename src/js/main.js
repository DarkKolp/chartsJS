import DataTransformer from './utils/dataTransformer.js';
import LineChart from './charts/lineChart.js';
import BarChart from './charts/barChart.js';
import PieChart from './charts/pieChart.js';
import ProgressChart from './charts/ProgressChart.js';
import ChartRegistry from './charts/chartRegistry.js';
import NetworkManager from './utils/networkManager.js';
import ChartConfigManager from './utils/chartConfigManager.js';
import ChartFactory from './charts/chartFactory.js';
import ReportChartManager from './utils/reportChartManager.js';
import SankeyChartUtils from './utils/sankeyChartUtils.js';

// Global instances
const networkManager = new NetworkManager();
const chartConfigManager = new ChartConfigManager();
let currentChart = null;
let activeCategory = 'vaults'; // Default category

/**
 * Initialize network selector
 */
async function initNetworkSelector() {
  const selector = document.getElementById('network-selector');
  const networks = await networkManager.initialize();

  networks.forEach(network => {
    const option = document.createElement('option');
    option.value = network.id;
    option.text = network.name;
    selector.add(option);
  });

  selector.addEventListener('change', onNetworkChange);
}

/**
 * Event handler for network selection changes
 */
async function onNetworkChange() {
  const networkId = document.getElementById('network-selector').value;
  if (networkId) {
    await loadNetworkData(networkId);
    showReportButtons();
  } else {
    clearUI();
  }
}

/**
 * Load network data and update UI
 * @param {string} networkId - Network identifier
 */
async function loadNetworkData(networkId) {
  try {
    const data = await networkManager.loadNetwork(networkId);
    updateNetworkInfo(data);
  } catch (error) {
    console.error('Error loading network data:', error);
    displayErrorMessage('Failed to load network data.');
  }
}

/**
 * Update network information display
 * @param {Object} data - Network data
 */
function updateNetworkInfo(data) {
  const infoElement = document.getElementById('network-info');
  if (infoElement) {
    infoElement.textContent = `Network: ${data.network.name}`; // Basic info
  }
}

/**
 * Show report type selection buttons
 */
function showReportButtons() {
  const container = document.getElementById('report-buttons');
  container.innerHTML = ''; // Clear existing buttons

  const lightReportButton = createButton('Light Report', showCategoryButtons);
  const fullReportButton = createButton('Full Report', generateFullReport); // Placeholder

  container.appendChild(lightReportButton);
  container.appendChild(fullReportButton);
}

/**
 * Show category buttons for Light Report
 */
function showCategoryButtons() {
  const container = document.getElementById('category-buttons');
  container.innerHTML = ''; // Clear existing buttons

  const categories = ['Economic Security', 'Operators', 'Vaults', 'Curators'];
  categories.forEach(category => {
    const button = createButton(category, () => displayCategoryCharts(category));
    container.appendChild(button);
  });
}

/**
 * Display charts for a given category
 * @param {string} category - The category name
 */
function displayCategoryCharts(category) {
  const chartContainer = document.getElementById('chart-container');
  chartContainer.innerHTML = ''; // Clear existing charts

  const categoryId = category.toLowerCase().replace(' ', '-'); // Convert category name to ID
  const charts = chartConfigManager.getChartsByCategory(categoryId);

  if (charts && charts.length > 0) {
    // Load and display the first chart in the category for simplicity
    loadChart(charts[0].id);
  } else {
    displayErrorMessage(`No charts found for ${category}.`);
  }
}

/**
 * Generate and display a full report (placeholder)
 */
function generateFullReport() {
  const chartContainer = document.getElementById('chart-container');
  chartContainer.innerHTML = 'Full report generation is not yet implemented.';
}

/**
 * Create a button element with a click handler
 * @param {string} text - Button text
 * @param {function} onClick - Click event handler
 * @returns {HTMLButtonElement} - The created button element
 */
function createButton(text, onClick) {
  const button = document.createElement('button');
  button.textContent = text;
  button.addEventListener('click', onClick);
  return button;
}

/**
 * Display an error message in the chart container
 * @param {string} message - The error message
 */
function displayErrorMessage(message) {
  const chartContainer = document.getElementById('chart-container');
  chartContainer.innerHTML = `<div class="error-message">${message}</div>`;
}

/**
 * Clear the main UI elements
 */
function clearUI() {
  document.getElementById('network-info').textContent = '';
  document.getElementById('report-buttons').innerHTML = '';
  document.getElementById('category-buttons').innerHTML = '';
  document.getElementById('chart-container').innerHTML = '';
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
async function initializeApp() {
    await initNetworkSelector();
    await loadCollateralMeta(); // Ensure this is loaded

    // Initialize VaultReportUtils (ensure it's awaited if necessary)
    try {
        const module = await import('./utils/vaultReportUtils.js');
        const VaultReportUtils = module.default;
        VaultReportUtils.initialize(networkManager);
    } catch (err) {
        console.error('Failed to load vault report utils:', err);
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);