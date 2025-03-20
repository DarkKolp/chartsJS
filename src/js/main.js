import CSVLoader from './utils/csvLoader.js';
import LineChart from './charts/lineChart.js';
import BarChart from './charts/barChart.js';

// Chart registry to keep track of all created charts
const chartRegistry = {};

/**
 * Initialize a chart container
 * @param {string} id - Container ID
 * @param {string} title - Chart title
 * @returns {Object} - Object with container, canvas and title elements
 */
function createChartContainer(id, title) {
  // Create container if it doesn't exist
  let container = document.getElementById(`chart-container-${id}`);
  
  if (!container) {
    container = document.createElement('div');
    container.id = `chart-container-${id}`;
    container.className = 'chart-container';
    
    const titleEl = document.createElement('h3');
    titleEl.textContent = title;
    container.appendChild(titleEl);
    
    const canvas = document.createElement('canvas');
    canvas.id = `chart-${id}`;
    container.appendChild(canvas);
    
    document.getElementById('charts-wrapper').appendChild(container);
    
    return { container, canvas, titleEl };
  }
  
  return {
    container,
    canvas: container.querySelector('canvas'),
    titleEl: container.querySelector('h3')
  };
}

/**
 * Load a CSV file and create a chart
 * @param {Object} config - Chart configuration
 */
async function createChartFromCSV(config) {
  const {
    id,
    title,
    filePath,
    chartType,
    chartConfig
  } = config;
  
  try {
    // Create UI elements
    const { canvas } = createChartContainer(id, title);
    
    // Load CSV data
    const data = await CSVLoader.load(filePath);
    
    // Destroy existing chart if any
    if (chartRegistry[id]) {
      chartRegistry[id].destroy();
    }
    
    // Create the appropriate chart type
    let chart;
    switch (chartType) {
      case 'line':
        chart = LineChart.createTimeSeries(canvas.id, data, chartConfig);
        break;
      case 'bar':
        chart = BarChart.createBasic(canvas.id, data, chartConfig);
        break;
      // Add more chart types as needed
      default:
        console.error(`Unsupported chart type: ${chartType}`);
        return;
    }
    
    // Register the chart
    chartRegistry[id] = chart;
    
    console.log(`Chart "${title}" created successfully`);
  } catch (error) {
    console.error(`Failed to create chart "${title}":`, error);
  }
}

/**
 * Initialize the application
 */
function initApp() {
  // Create a charts wrapper if it doesn't exist
  if (!document.getElementById('charts-wrapper')) {
    const wrapper = document.createElement('div');
    wrapper.id = 'charts-wrapper';
    document.body.appendChild(wrapper);
  }
  
  // Example charts - replace with your actual CSV files and configurations
  const chartConfigs = [
    {
      id: 'sales-trends',
      title: 'Monthly Sales Trends',
      filePath: './CSV/Ditto Network/sales.csv',
      chartType: 'line',
      chartConfig: {
        dateKey: 'date',
        valueKey: 'revenue',
        title: 'Monthly Revenue'
      }
    },
    {
      id: 'product-comparison',
      title: 'Product Performance',
      filePath: './CSV/Ditto Network/products.csv',
      chartType: 'bar',
      chartConfig: {
        labelKey: 'product',
        valueKey: 'units_sold',
        title: 'Units Sold'
      }
    }
  ];
  
  // Create all charts
  chartConfigs.forEach(config => createChartFromCSV(config));
}

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', initApp);