// src/js/components/ChartDisplay.js
import { appState } from '../state/AppState.js';

export default class ChartDisplay {
  constructor(container) {
    this.container = container;
    this.charts = [];
  }

  render() {
    // Clear container and destroy any existing charts
    this.container.innerHTML = '';
    this.destroyCharts();
    
    // Get current state
    const { networkData, selectedCategory } = appState.getState();
    
    // Create container structure
    const displayContainer = document.createElement('div');
    displayContainer.className = 'chart-display-container';
    
    // Back button
    const backButton = document.createElement('button');
    backButton.className = 'back-button';
    backButton.textContent = '← Back to Categories';
    backButton.addEventListener('click', () => {
      this.destroyCharts();
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
    
    // Get charts data
    const chartsData = this.getCategoryCharts(networkData, selectedCategory);
    
    if (!chartsData || Object.keys(chartsData).length === 0) {
      const noCharts = document.createElement('div');
      noCharts.className = 'no-charts-message';
      noCharts.textContent = `No charts available for ${this.getCategoryTitle(selectedCategory)}`;
      displayContainer.appendChild(noCharts);
      this.container.appendChild(displayContainer);
      return;
    }
    
    // Create charts container
    const chartsContainer = document.createElement('div');
    chartsContainer.className = 'charts-grid';
    displayContainer.appendChild(chartsContainer);
    
    // Add container to DOM
    this.container.appendChild(displayContainer);
    
    // Render charts with delay to ensure DOM is ready
    setTimeout(() => {
      // Create each chart
      Object.entries(chartsData).forEach(([chartId, chartData], index) => {
        this.createChartCard(chartsContainer, chartId, chartData, index);
      });
    }, 100);
  }
  
  createChartCard(container, chartId, chartData, index) {
    const { selectedCategory } = appState.getState();
    
    // Create card
    const card = document.createElement('div');
    card.className = 'chart-card';
    
    // Add title
    const title = document.createElement('h3');
    title.className = 'chart-title';
    title.textContent = this.formatChartTitle(chartId);
    card.appendChild(title);
    
    // Create canvas container
    const canvasContainer = document.createElement('div');
    canvasContainer.className = 'canvas-container';
    canvasContainer.style.height = '300px';
    
    // Create canvas
    const canvas = document.createElement('canvas');
    const canvasId = `chart-${selectedCategory}-${index}`;
    canvas.id = canvasId;
    canvasContainer.appendChild(canvas);
    card.appendChild(canvasContainer);
    
    // Add card to container
    container.appendChild(card);
    
    // Determine chart type and render
    this.renderChartByType(canvasId, chartId, chartData, selectedCategory);
  }

  renderChartByType(canvasId, chartId, chartData, categoryId) {
    // First determine chart type based on chart ID and data
    let chartType = this.detectChartType(chartId, chartData, categoryId);
    
    console.log(`Rendering chart ${chartId} as ${chartType}`);
    
    // Render the appropriate chart type
    switch(chartType) {
      case 'utilization':
        this.renderUtilizationChart(canvasId, chartData);
        break;
      case 'distribution':
        this.renderDistributionChart(canvasId, chartData);
        break;
      case 'bar':
        this.renderBarChart(canvasId, chartData, chartId);
        break;
      case 'pie':
        this.renderPieChart(canvasId, chartData, chartId);
        break;
      default:
        this.renderGenericChart(canvasId, chartData, chartId);
        break;
    }
  }
  
  detectChartType(chartId, chartData, categoryId) {
    // Check chart ID first
    if (chartId.includes('utilization')) {
      return 'utilization';
    }
    
    if (chartId.includes('distribution')) {
      return 'distribution';
    }
    
    // For Operators section
    if (categoryId === 'operators') {
      if (chartId === 'distribution' || chartId === 'concentration') {
        return 'pie';
      }
      return 'bar';
    }
    
    // For Vaults section
    if (categoryId === 'vaults') {
      return 'pie';
    }
    
    // For Curators section
    if (categoryId === 'curators') {
      if (chartId.includes('distribution')) {
        return 'pie';
      }
      return 'bar';
    }
    
    // Fallback based on data structure
    if (Array.isArray(chartData)) {
      if (chartData.length > 0 && 'percentage' in chartData[0]) {
        return 'pie';
      }
    }
    
    // Default to bar chart
    return 'bar';
  }
  
  renderUtilizationChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Canvas ${canvasId} not found`);
      return;
    }
    
    // Create a very simple horizontal bar chart
    const labels = data.map(item => item.asset);
    const values = data.map(item => parseFloat(item.utilization_percentage || 0));
    
    // Create chart with minimal configuration
    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: values.map(v => {
            if (v >= 90) return '#ef4444'; // Red for high utilization
            if (v >= 60) return '#f97316'; // Orange for medium-high
            if (v >= 30) return '#22c55e'; // Green for medium
            return '#3b82f6';              // Blue for low
          }),
          borderWidth: 0
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `${context.raw}%`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
    
    // Save reference for cleanup
    this.charts.push(chart);
  }
  
  renderDistributionChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Canvas ${canvasId} not found`);
      return;
    }
    
    // Create a simple pie chart
    const labels = data.map(item => item.asset);
    const values = data.map(item => parseFloat(item.percentage || 0));
    
    // Fixed colors
    const colors = [
      '#8247e5', '#a466f6', '#3b82f6', '#14b8a6', 
      '#f97316', '#ec4899', '#8b5cf6', '#6366f1', 
      '#a855f7', '#22c55e', '#ef4444', '#eab308'
    ];
    
    // Create chart with minimal configuration
    const chart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { 
            position: 'right',
            labels: {
              boxWidth: 12,
              font: { size: 11 }
            }
          }
        }
      }
    });
    
    // Save reference for cleanup
    this.charts.push(chart);
  }
  
  renderBarChart(canvasId, data, chartId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Canvas ${canvasId} not found`);
      return;
    }
    
    // Extract data based on common patterns
    let labels = [];
    let values = [];
    let labelKey = 'label';
    let valueKey = 'value';
    
    // Operators sections
    if (chartId === 'distribution' || chartId === 'vault_and_collateral_counts') {
      labelKey = 'operator_id' in data[0] ? 'label' : 'name';
      valueKey = chartId === 'distribution' ? 'usd_value' : 'vault_count';
    } 
    // Curators section
    else if (chartId === 'vault_and_collateral_counts' && data[0].curator_id) {
      labelKey = 'curator_id';
      valueKey = 'vault_count';
    }
    
    // Extract data
    data.forEach(item => {
      // Use fallbacks for key names
      const label = item[labelKey] || item.name || item.label || item.operator_id || item.curator_id || 'Unknown';
      
      // For value, try different common keys
      let value = item[valueKey];
      if (value === undefined) {
        // Try fallbacks
        value = item.percentage || item.value || item.usd_value || item.vault_count || 0;
      }
      
      labels.push(label);
      values.push(parseFloat(value));
    });
    
    // Create chart
    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: '#8247e5',
          borderWidth: 0,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
    
    // Save reference for cleanup
    this.charts.push(chart);
  }
  
  renderPieChart(canvasId, data, chartId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Canvas ${canvasId} not found`);
      return;
    }
    
    // Extract data based on common patterns
    let labels = [];
    let values = [];
    let labelKey = 'label';
    let valueKey = 'value';
    
    // For operators section
    if (chartId === 'distribution' || chartId === 'concentration') {
      labelKey = 'operator_id' in data[0] ? 'label' : 'name';
      valueKey = 'percentage';
    } 
    // For curators section
    else if (data[0].curator_id) {
      labelKey = 'curator_id';
      valueKey = 'percentage';
    }
    
    // Extract data
    data.forEach(item => {
      const label = item[labelKey] || item.name || item.label || item.operator_id || item.curator_id || 'Unknown';
      
      // For value, try different common keys
      let value = item[valueKey];
      if (value === undefined) {
        // Try fallbacks
        value = item.percentage || item.value || 0;
      }
      
      labels.push(label);
      values.push(parseFloat(value));
    });
    
    // Colors
    const colors = [
      '#8247e5', '#a466f6', '#3b82f6', '#14b8a6', 
      '#f97316', '#ec4899', '#8b5cf6', '#6366f1', 
      '#a855f7', '#22c55e', '#ef4444', '#eab308'
    ];
    
    // Create chart
    const chart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { 
            position: 'right',
            labels: {
              boxWidth: 12,
              font: { size: 11 }
            }
          }
        }
      }
    });
    
    // Save reference for cleanup
    this.charts.push(chart);
  }
  
  renderGenericChart(canvasId, data, chartId) {
    // Fallback for any other chart type
    // Just render a bar chart with whatever data we can extract
    
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Canvas ${canvasId} not found`);
      return;
    }
    
    // Try to extract meaningful data
    let labels = [];
    let values = [];
    
    try {
      if (Array.isArray(data)) {
        // Try to find property pairs that look like label/value
        const sampleItem = data[0] || {};
        const keys = Object.keys(sampleItem);
        
        // Find likely label and value keys
        let labelKey = keys.find(k => ['name', 'label', 'id', 'type', 'category'].includes(k.toLowerCase())) || keys[0];
        let valueKey = keys.find(k => ['value', 'count', 'total', 'amount', 'percentage', 'score'].includes(k.toLowerCase()));
        
        if (!valueKey) {
          // If no obvious value key, take the second key or find a numeric one
          valueKey = keys.find(k => typeof sampleItem[k] === 'number') || keys[1] || keys[0];
        }
        
        // Extract data
        data.forEach(item => {
          labels.push(item[labelKey] || 'Unknown');
          values.push(parseFloat(item[valueKey] || 0));
        });
      } else {
        // For non-array data, try to convert object to pairs
        labels = Object.keys(data);
        values = Object.values(data).map(v => parseFloat(v) || 0);
      }
    } catch (e) {
      console.error('Error extracting data for generic chart:', e);
      
      // Fallback to empty chart
      labels = ['No data'];
      values = [0];
    }
    
    // Create chart
    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: this.formatChartTitle(chartId),
          data: values,
          backgroundColor: '#8247e5',
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false
      }
    });
    
    // Save reference for cleanup
    this.charts.push(chart);
  }
  
  destroyCharts() {
    this.charts.forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        try {
          chart.destroy();
        } catch (e) {
          console.warn('Error destroying chart:', e);
        }
      }
    });
    this.charts = [];
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
    return chartId
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}