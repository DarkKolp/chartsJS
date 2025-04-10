// src/js/components/ChartDisplay.js
import { appState } from '../state/AppState.js';
import ChartRegistry from '../charts/chartRegistry.js';

export default class ChartDisplay {
  constructor(container) {
    this.container = container;
    this.chartModules = null;
  }

  render() {
    // Clear container
    this.container.innerHTML = '';
    
    // Get current state
    const { networkData, selectedCategory } = appState.getState();
    
    // Clean up any existing charts
    ChartRegistry.destroyAll();
    
    const displayContainer = document.createElement('div');
    displayContainer.className = 'chart-display-container';
    
    // Back button
    const backButton = document.createElement('button');
    backButton.className = 'back-button';
    backButton.textContent = '← Back to Categories';
    backButton.addEventListener('click', () => {
      appState.setState({
        currentView: 'categorySelection'
      });
    });
    displayContainer.appendChild(backButton);
    
    // Category title
    const categoryTitle = document.createElement('h2');
    categoryTitle.className = 'category-title';
    categoryTitle.textContent = this.getCategoryTitle(selectedCategory);
    displayContainer.appendChild(categoryTitle);
    
    // Charts grid
    const chartsGrid = document.createElement('div');
    chartsGrid.className = 'charts-grid';
    
    // Get charts for selected category
    const chartsData = this.getCategoryCharts(networkData, selectedCategory);
    
    if (chartsData && Object.keys(chartsData).length > 0) {
      // Create charts
      Object.entries(chartsData).forEach(([chartId, chartData], index) => {
        const chartCard = this.createChartCard(chartId, chartData, index);
        chartsGrid.appendChild(chartCard);
      });
    } else {
      // No charts available message
      const noCharts = document.createElement('div');
      noCharts.className = 'no-charts-message';
      noCharts.textContent = `No charts available for ${this.getCategoryTitle(selectedCategory)}`;
      chartsGrid.appendChild(noCharts);
    }
    
    displayContainer.appendChild(chartsGrid);
    this.container.appendChild(displayContainer);
    
    // Load all chart modules at once, then render charts
    this.loadAllChartModules().then(() => {
      if (chartsData) {
        this.renderAllCharts(chartsData);
      }
    });
  }

  async loadAllChartModules() {
    if (this.chartModules) return this.chartModules;
    
    try {
      // Load all chart modules in parallel
      const [pieModule, barModule, progressModule] = await Promise.all([
        import('../charts/pieChart.js'),
        import('../charts/barChart.js'),
        import('../charts/ProgressChart.js')
      ]);
      
      // Store modules for reuse
      this.chartModules = {
        pie: pieModule.default,
        bar: barModule.default,
        progress: progressModule.default
      };
      
      return this.chartModules;
    } catch (error) {
      console.error('Failed to load chart modules:', error);
      return null;
    }
  }

  renderAllCharts(chartsData) {
    // Render each chart with a delay to prevent rendering issues
    Object.entries(chartsData).forEach(([chartId, chartData], index) => {
      const { selectedCategory } = appState.getState();
      const canvasId = `chart-${selectedCategory}-${index}`;
      
      // Delay each chart rendering slightly to prevent conflicts
      setTimeout(() => {
        this.renderChart(canvasId, chartId, chartData);
      }, index * 100);
    });
  }

  createChartCard(chartId, chartData, index) {
    const { selectedCategory } = appState.getState();
    
    const chartCard = document.createElement('div');
    chartCard.className = 'chart-card';
    
    // Chart title
    const title = document.createElement('h3');
    title.className = 'chart-title';
    title.textContent = this.formatChartTitle(chartId);
    chartCard.appendChild(title);
    
    // Canvas for chart
    const canvas = document.createElement('canvas');
    canvas.id = `chart-${selectedCategory}-${index}`;
    canvas.className = 'chart-canvas';
    chartCard.appendChild(canvas);
    
    return chartCard;
  }

  getCategoryTitle(categoryId) {
    const titles = {
      'economic_security': 'Economic Security',
      'operators': 'Operators',
      'vaults': 'Vaults',
      'curators': 'Curators'
    };
    
    return titles[categoryId] || 'Charts';
  }

  getCategoryCharts(networkData, categoryId) {
    if (!networkData || !networkData[categoryId] || !networkData[categoryId].charts) {
      return null;
    }
    
    return networkData[categoryId].charts;
  }

  formatChartTitle(chartId) {
    // Convert snake_case or camelCase to Title Case
    return chartId
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  renderChart(canvasId, chartId, chartData) {
    // Get canvas element
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Canvas element with ID "${canvasId}" not found`);
      return;
    }
    
    // Check if there's already a chart for this canvas
    const existingChart = ChartRegistry.get(canvasId);
    if (existingChart) {
      console.log(`Destroying existing chart for ${canvasId}`);
      existingChart.destroy();
      ChartRegistry.destroy(canvasId);
    }
    
    // Determine chart type
    const chartType = this.determineChartType(chartId, chartData);
    if (!this.chartModules || !this.chartModules[chartType]) {
      console.error(`Chart module for type "${chartType}" not loaded`);
      return;
    }
    
    // Get the chart class
    const ChartClass = this.chartModules[chartType];
    let chart;
    
    try {
      switch (chartType) {
        case 'pie':
          // For pie charts, we need to ensure we're using the right property names
          chart = ChartClass.create(canvasId, chartData, {
            labelKey: 'asset',
            valueKey: 'percentage',
            title: this.formatChartTitle(chartId),
            // Disable animations to prevent rendering loops
            options: {
              animation: false,
              plugins: {
                legend: {
                  display: true,
                  position: 'right'
                }
              }
            }
          });
          break;
          
        case 'bar':
          chart = ChartClass.createBasic(canvasId, chartData, {
            labelKey: 'asset',
            valueKey: 'percentage',
            title: this.formatChartTitle(chartId),
            sort: 'desc',
            // Disable animations
            options: {
              animation: false
            }
          });
          break;
          
        case 'progress':
          // Transform data for progress chart
          const progressData = Array.isArray(chartData) 
            ? chartData.map(item => ({
                label: item.asset,
                percentage: parseFloat(item.utilization_percentage || 0),
                value: parseFloat(item.usd_value || 0),
                limit: parseFloat(item.max_limit || 100)
              }))
            : [];
            
          chart = ChartClass.createMultiple(canvasId, progressData, {
            title: this.formatChartTitle(chartId),
            // Disable animations
            animation: false
          });
          break;
      }
      
      // Register chart for later cleanup
      if (chart) {
        ChartRegistry.register(canvasId, chart);
      }
    } catch (error) {
      console.error(`Error rendering chart ${chartId}:`, error);
      this.showChartError(canvasId);
    }
  }

  determineChartType(chartId, chartData) {
    // Logic to determine best chart type
    if (chartId.includes('distribution')) {
      return 'pie';
    } else if (chartId.includes('utilization')) {
      return 'progress';
    }
    
    // Examine data structure
    if (Array.isArray(chartData)) {
      // Check first item for percentage property
      if (chartData.length > 0 && 'percentage' in chartData[0]) {
        return 'pie';
      }
    }
    
    // Default to bar chart
    return 'bar';
  }

  showChartError(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (canvas) {
      const parent = canvas.parentElement;
      
      // Remove canvas
      canvas.remove();
      
      // Add error message
      const error = document.createElement('div');
      error.className = 'chart-error';
      error.textContent = 'Failed to load chart';
      
      parent.appendChild(error);
    }
  }
}