// src/js/components/ChartDisplay.js
import { appState } from '../state/AppState.js';
import ChartRegistry from '../charts/chartRegistry.js';
import ChartExportUtils from '../utils/chartExportUtils.js';
import { PieChartLabelsPlugin } from '../plugins/pieChartLabelsPlugin.js';

Chart.register(PieChartLabelsPlugin);

export default class ChartDisplay {
  constructor(container) {
    this.container = container;
  }

  render() {
    // Clear container
    this.container.innerHTML = '';
    
    // Destroy any existing charts
    ChartRegistry.destroyAll();
    
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
    const chart = this.renderChartByType(canvasId, chartId, chartData, selectedCategory);
    
    // Add export controls after chart is rendered
    if (chart) {
      ChartExportUtils.addExportControls(card, canvasId, this.formatChartTitle(chartId));
    }
  }

  renderChartByType(canvasId, chartId, chartData, categoryId) {
    // Special handling for vault charts
    if (categoryId === 'vaults') {
      return this.renderVaultChart(canvasId, chartData, chartId);
    }
    
    // First determine chart type based on chart ID and data
    let chartType = this.detectChartType(chartId, chartData, categoryId);
    
    console.log(`Rendering chart ${chartId} as ${chartType}`);
    
    // Render the appropriate chart type
    switch(chartType) {
      case 'utilization':
        return this.renderUtilizationChart(canvasId, chartData);
      case 'distribution':
        return this.renderDistributionChart(canvasId, chartData);
      case 'bar':
        return this.renderBarChart(canvasId, chartData, chartId);
      case 'pie':
        return this.renderPieChart(canvasId, chartData, chartId);
      default:
        return this.renderGenericChart(canvasId, chartData, chartId);
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
      return null;
    }
    
    // Create a very simple horizontal bar chart
    const labels = data.map(item => item.asset);
    const values = data.map(item => parseFloat(item.utilization_percentage || 0));
    const limits = data.map(item => parseFloat(item.max_limit || 0));
    
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
          borderWidth: 0,
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => {
                const index = context.dataIndex;
                const value = values[index];
                const limit = limits[index];
                
                let limitText = '';
                if (limit) {
                  if (limit >= 1e9) {
                    limitText = ` (Max: $${(limit/1e9).toFixed(1)}B)`;
                  } else if (limit >= 1e6) {
                    limitText = ` (Max: $${(limit/1e6).toFixed(1)}M)`;
                  } else if (limit >= 1e3) {
                    limitText = ` (Max: $${(limit/1e3).toFixed(1)}K)`;
                  } else {
                    limitText = ` (Max: $${limit.toFixed(2)})`;
                  }
                }
                
                return `Utilization: ${value.toFixed(2)}%${limitText}`;
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Utilization %',
              color: '#64748b',
              font: {
                size: 12,
                weight: 'normal'
              }
            },
            ticks: {
              callback: (value) => `${value}%`
            }
          },
          y: {
            grid: {
              display: false
            }
          }
        }
      }
    });
    
    // Register for export
    ChartRegistry.register(canvasId, chart);
    ChartExportUtils.registerChart(canvasId, chart);
    
    return chart;
  }
  
  renderDistributionChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Canvas ${canvasId} not found`);
      return null;
    }
    
    // Create a simple pie chart
    let labels = data.map(item => item.asset || item.label || 'Unknown');
    let values = data.map(item => parseFloat(item.percentage || item.value || 0));
    
    // Calculate total for percentage calculations
    const total = values.reduce((sum, val) => sum + val, 0);
    
    // Group small slices (<5%) into "Others"
    const smallSliceThreshold = 5; // 5%
    const smallSlices = [];
    const bigSlices = [];
    
    // Identify small slices
    values.forEach((value, index) => {
      const percentage = (value / total) * 100;
      if (percentage < smallSliceThreshold) {
        smallSlices.push({ label: labels[index], value });
      } else {
        bigSlices.push({ label: labels[index], value });
      }
    });
    
    // Create new data arrays
    labels = bigSlices.map(item => item.label);
    values = bigSlices.map(item => item.value);
    
    // Add "Others" category if needed
    if (smallSlices.length > 0) {
      const othersValue = smallSlices.reduce((sum, item) => sum + item.value, 0);
      labels.push('Others');
      values.push(othersValue);
    }
    
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
          backgroundColor: colors.slice(0, Math.min(labels.length, colors.length)),
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '45%',
        plugins: {
          legend: { 
            position: 'right',
            labels: {
              padding: 15,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                const percentage = ((value / total) * 100).toFixed(2);
                return `${label}: ${percentage}%`;
              }
            }
          },
          datalabels: {
            formatter: (value) => {
              const percentage = ((value / total) * 100).toFixed(2);
              return `${percentage}%`;
            },
            color: '#ffffff',
            font: {
              weight: 'bold',
              size: 12
            },
            anchor: 'center',
            align: 'center'
          }
        }
      }
    });
    
    // Register for export
    ChartRegistry.register(canvasId, chart);
    ChartExportUtils.registerChart(canvasId, chart);
    
    return chart;
  }
  
  renderBarChart(canvasId, data, chartId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Canvas ${canvasId} not found`);
      return null;
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
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw || 0;
                if (valueKey.includes('usd') || chartId.includes('distribution')) {
                  if (value >= 1e9) return `$${(value/1e9).toFixed(2)}B`;
                  if (value >= 1e6) return `$${(value/1e6).toFixed(2)}M`;
                  if (value >= 1e3) return `$${(value/1e3).toFixed(2)}K`;
                  return `$${value.toFixed(2)}`;
                }
                return value.toLocaleString();
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                if (valueKey.includes('usd') || chartId.includes('distribution')) {
                  if (value >= 1e9) return `$${(value/1e9).toFixed(1)}B`;
                  if (value >= 1e6) return `$${(value/1e6).toFixed(1)}M`;
                  if (value >= 1e3) return `$${(value/1e3).toFixed(1)}K`;
                  return `$${value}`;
                }
                return value;
              }
            }
          }
        }
      }
    });
    
    // Register for export
    ChartRegistry.register(canvasId, chart);
    ChartExportUtils.registerChart(canvasId, chart);
    
    return chart;
  }
  
  renderPieChart(canvasId, data, chartId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Canvas ${canvasId} not found`);
      return null;
    }
    
    // Extract data based on common patterns
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
    
    // Extract raw data
    let rawLabels = [];
    let rawValues = [];
    
    data.forEach(item => {
      const label = item[labelKey] || item.name || item.label || item.operator_id || item.curator_id || 'Unknown';
      let value = item[valueKey];
      if (value === undefined) {
        // Try fallbacks
        value = item.percentage || item.value || 0;
      }
      
      rawLabels.push(label);
      rawValues.push(parseFloat(value));
    });
    
    // Calculate total for percentage calculations
    const total = rawValues.reduce((sum, val) => sum + val, 0);
    
    // Group small slices (<5%) into "Others"
    const smallSliceThreshold = 5; // 5%
    const smallSlices = [];
    const bigSlices = [];
    
    // Identify small slices
    rawValues.forEach((value, index) => {
      const percentage = (value / total) * 100;
      if (percentage < smallSliceThreshold) {
        smallSlices.push({ label: rawLabels[index], value });
      } else {
        bigSlices.push({ label: rawLabels[index], value });
      }
    });
    
    // Create new data arrays
    let labels = bigSlices.map(item => item.label);
    let values = bigSlices.map(item => item.value);
    
    // Add "Others" category if needed
    if (smallSlices.length > 0) {
      const othersValue = smallSlices.reduce((sum, item) => sum + item.value, 0);
      labels.push('Others');
      values.push(othersValue);
    }
    
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
          backgroundColor: colors.slice(0, Math.min(labels.length, colors.length)),
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '45%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              padding: 15,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                const percentage = ((value / total) * 100).toFixed(2);
                return `${label}: ${percentage}%`;
              }
            }
          },
          datalabels: {
            formatter: (value) => {
              const percentage = ((value / total) * 100).toFixed(2);
              return `${percentage}%`;
            },
            color: '#ffffff',
            font: {
              weight: 'bold',
              size: 12
            },
            anchor: 'center',
            align: 'center'
          }
        }
      }
    });
    
    // Register for export
    ChartRegistry.register(canvasId, chart);
    ChartExportUtils.registerChart(canvasId, chart);
    
    return chart;
  }
  
  
  
  renderGenericChart(canvasId, data, chartId) {
    // Fallback for any other chart type
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Canvas ${canvasId} not found`);
      return null;
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
          borderWidth: 0,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
    
    // Register for export
    ChartRegistry.register(canvasId, chart);
    ChartExportUtils.registerChart(canvasId, chart);
    
    return chart;
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
    if (!networkData || !networkData[categoryId]) {
      return null;
    }
    
    // Special handling for vaults category which has a different structure
    if (categoryId === 'vaults') {
      if (!networkData.vaults.metrics) return null;
      
      // Create charts data structure from metrics
      return {
        'slasher_configuration': networkData.vaults.metrics.slasher_configuration?.types || {},
        'delegator_configuration': networkData.vaults.metrics.delegator_configuration?.types || {}
      };
    }
    
    // For other categories, use the standard charts property
    return networkData[categoryId].charts || null;
  }  
  
  formatChartTitle(chartId) {
    // Special case for vault charts
    const specialTitles = {
      'slasher_configuration': 'Slasher Configuration',
      'delegator_configuration': 'Delegator Configuration'
    };
    
    if (specialTitles[chartId]) {
      return specialTitles[chartId];
    }
    
    return chartId
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  renderVaultChart(canvasId, data, chartId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Canvas ${canvasId} not found`);
      return null;
    }
    
    // Convert object data to arrays for Chart.js
    const labels = Object.keys(data);
    const values = Object.values(data).map(val => parseFloat(val));
    
    // Define colors based on chart type
    let colors;
    if (chartId === 'slasher_configuration') {
      // Use green theme for Slasher Configuration
      colors = ['#10b981']; // Single shade of green since there's only one value
    } else {
      // Use purple/blue theme for Delegator Configuration
      colors = ['#6366f1', '#a855f7']; // Blue and purple
    }
    
    // Create the chart
    const chart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderWidth: 0,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%', // Make the donut hole larger
        plugins: {
          pieLabels: {
            enabled: false // Explicitly disable the custom plugin for vault charts
          },
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                return `${label}: ${value.toFixed(2)}%`;
              }
            }
          },
          // Add percentage in center using the datalabels plugin
          datalabels: {
            formatter: (value) => {
              return `${value.toFixed(2)}%`;
            },
            color: '#ffffff',
            font: {
              weight: 'bold',
              size: 16
            },
            anchor: 'center',
            align: 'center',
            offset: 0
          }
        }
      }
    });
    
    // Register for export
    ChartRegistry.register(canvasId, chart);
    ChartExportUtils.registerChart(canvasId, chart);
    
    return chart;
  }  
}