// src/js/components/ChartDisplay.js
import { appState } from '../state/AppState.js';
import ChartRegistry from '../charts/chartRegistry.js';
import ChartExportUtils from '../utils/chartExportUtils.js';
import { PieChartLabelsPlugin } from '../plugins/pieChartLabelsPlugin.js';
import { PieCalloutPlugin } from '../plugins/pieCalloutPlugin.js';

Chart.register(PieChartLabelsPlugin);
Chart.register(PieCalloutPlugin);

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
    
    // Create charts container - CHANGED TO VERTICAL LAYOUT
    const chartsContainer = document.createElement('div');
    chartsContainer.className = 'charts-row'; // Changed from 'charts-grid'
    chartsContainer.style.display = 'flex';
    chartsContainer.style.flexDirection = 'row'; // Changed from 'column'
    chartsContainer.style.flexWrap = 'wrap'; // Important for responsiveness
    chartsContainer.style.gap = '24px'; // Space between charts
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
    // Removed fixed min-height from original example for flexibility
    // card.style.minHeight = '400px';
    card.style.marginBottom = '40px'; // Keep space between charts

    // Add title
    const title = document.createElement('h3');
    title.className = 'chart-title';
    title.textContent = this.formatChartTitle(chartId);
    card.appendChild(title);

    // --- Modifications Start Here ---

    // Create canvas container
    const canvasContainer = document.createElement('div');
    // Set base class for all chart containers
    canvasContainer.className = 'canvas-container';

    // ** IMPORTANT: Remove the fixed inline height **
    // canvasContainer.style.height = '350px'; // REMOVED/COMMENTED OUT

    // ** CONDITIONALLY add the specific class for aspect ratio **
    // Add other chart IDs here if needed, e.g., if (chartId === '...' || chartId === '...')
    if (chartId === 'vault_and_collateral_counts') {
      canvasContainer.classList.add('vault-count-chart-container');
      console.log(`Added vault-count-chart-container class to ${chartId}`); // For debugging
    }

    // --- Modifications End Here ---

    // Create canvas
    const canvas = document.createElement('canvas');
    const canvasId = `chart-${selectedCategory}-${index}`;
    canvas.id = canvasId;
    // Append canvas *after* potentially adding the class to the container
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

  // Updated Distribution Pie Chart with Line Callouts
  renderDistributionChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Canvas ${canvasId} not found`);
      return null;
    }
    
    // Increase canvas container height
    canvas.parentNode.style.height = '500px';
    
    // Improved label extraction
    let labels = data.map(item => {
      return item.asset || item.curator_id || item.label || item.name || 'Unknown';
    });
    
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
        smallSlices.push({ label: labels[index], value, percentage });
      } else {
        bigSlices.push({ label: labels[index], value, percentage });
      }
    });
    
    // Create new data arrays
    labels = bigSlices.map(item => item.label);
    values = bigSlices.map(item => item.value);
    
    // Add "Others" category if needed
    if (smallSlices.length > 0) {
      const othersValue = smallSlices.reduce((sum, item) => sum + item.value, 0);
      const othersPercentage = smallSlices.reduce((sum, item) => sum + item.percentage, 0);
      
      labels.push(`Others`); // No percentage here! The plugin will add it if needed
      values.push(othersValue);
    }
    
    // Colors
    const colors = [
      '#8247e5', '#a466f6', '#3b82f6', '#14b8a6', 
      '#f97316', '#ec4899', '#22c55e', '#6366f1', 
      '#a855f7', '#ef4444', '#eab308'
    ];
    
    // Create chart
    const chart = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: colors.slice(0, Math.min(labels.length, colors.length)),
          borderWidth: 1,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            top: 60,
            right: 100,
            bottom: 60,
            left: 100
          }
        },
        plugins: {
          legend: { 
            display: false
          },
          pieCallouts: {
            enabled: true
          },
          datalabels: {
            display: true,
            color: 'white',
            font: {
              weight: 'bold',
              size: 12
            },
            formatter: (value, context) => {
              const percentage = ((value / total) * 100).toFixed(1);
              // Only show percentages for slices >= 7%
              return percentage >= 7 ? `${percentage}%` : '';
            },
            anchor: 'center',
            align: 'center'
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
          }
        }
      },
      plugins: [ChartDataLabels]
    });
    
    // Register for export
    ChartRegistry.register(canvasId, chart);
    ChartExportUtils.registerChart(canvasId, chart);
    
    return chart;
  }
  
  
  // New method for Vault and Collateral Counts
  renderVaultCollateralCounts(canvasId, data, chartId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Canvas ${canvasId} not found`);
      return null;
    }

    // Prepare data (Grouping logic remains the same)
    const entities = [];
    const vaultCounts = [];
    const collateralCounts = [];

    // Get list of small entities from distribution chart
    let smallEntities = [];
    if (chartId === 'vault_and_collateral_counts') {
      const { networkData, selectedCategory } = appState.getState();
      if (networkData && networkData[selectedCategory] && networkData[selectedCategory].charts) {
        const distributionData = networkData[selectedCategory].charts.distribution;
        if (distributionData && Array.isArray(distributionData)) {
          const total = distributionData.reduce((sum, item) => sum + parseFloat(item.percentage || 0), 0);
          if (total > 0) {
             distributionData.forEach(item => {
                const percentage = (parseFloat(item.percentage || 0) / total) * 100;
                if (percentage < 5) {
                  const label = selectedCategory === 'operators'
                     ? (item.label || item.operator_id)
                     : (item.curator_id || item.label);
                  if (label) {
                     smallEntities.push(label);
                  }
                }
             });
          }
        }
      }
    }

    // Process data for main entities and group others
    const mainEntities = [];
    const othersData = {
      vaultTotal: 0,
      collateralTotal: 0,
      count: 0
    };

    data.forEach(item => {
      const label = item.label || item.operator_id || item.curator_id || 'Unknown';
      const vaultCount = parseInt(item.vault_count || 0);
      const collateralCount = parseInt(item.collateral_type_count || 0);

      if (smallEntities.includes(label)) {
        othersData.vaultTotal += vaultCount;
        othersData.collateralTotal += collateralCount;
        othersData.count++;
      } else {
        mainEntities.push({ label, vaultCount, collateralCount });
      }
    });

    // Sort entities by vault count (descending)
    mainEntities.sort((a, b) => b.vaultCount - a.vaultCount);

    // Add entities and their data
    mainEntities.forEach(entity => {
      entities.push(entity.label);
      vaultCounts.push(entity.vaultCount);
      collateralCounts.push(entity.collateralCount);
    });

    // Add Others mean if there are any
    if (othersData.count > 0) {
      entities.push(`Others (mean)`);
      vaultCounts.push(Math.round(othersData.vaultTotal / othersData.count));
      collateralCounts.push(Math.round(othersData.collateralTotal / othersData.count));
    }

    // Create chart
    const chart = new Chart(canvas, {
      type: 'bar', // Vertical bar chart
      data: {
        labels: entities,
        datasets: [
          {
            label: 'Vault Count',
            data: vaultCounts,
            backgroundColor: '#8247e5', // Purple
            borderWidth: 0,
            borderRadius: 4,
            // *** ADJUSTED FOR COMPACTNESS ***
            categoryPercentage: 0.85, // Use 85% of the category width (reduces space BETWEEN categories)
            barPercentage: 0.7       // Keep bar width relative to its slot
          },
          {
            label: 'Collateral Count',
            data: collateralCounts,
            backgroundColor: '#3b82f6', // Blue
            borderWidth: 0,
            borderRadius: 4,
            // *** ADJUSTED FOR COMPACTNESS ***
            categoryPercentage: 0.85, // Use 85% of the category width (reduces space BETWEEN categories)
            barPercentage: 0.7       // Keep bar width relative to its slot
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 12,
              font: { size: 12 }
            }
          },
          tooltip: {
             mode: 'index',
             intersect: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Count',
              font: { size: 12 }
            },
            ticks: {
              precision: 0
            },
            grid: {
              display: true,
              color: 'rgba(226, 232, 240, 0.6)'
            }
          },
          x: {
            grid: {
              display: false // Keep vertical grid lines off
            },
            ticks: {
               // Keep rotation
               maxRotation: 45,
               minRotation: 45
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
  
  // Updated Render Chart By Type
  renderChartByType(canvasId, chartId, chartData, categoryId) {
    // Special handling for vault charts
    if (categoryId === 'vaults') {
      return this.renderVaultChart(canvasId, chartData, chartId);
    }
    
    // Special handling for vault and collateral counts
    if (chartId === 'vault_and_collateral_counts') {
      return this.renderVaultCollateralCounts(canvasId, chartData, chartId);
    }
    
    // Determine chart type based on chart ID and data
    let chartType = this.detectChartType(chartId, chartData, categoryId);
    
    console.log(`Rendering chart ${chartId} as ${chartType}`);
    
    // Render the appropriate chart type
    switch(chartType) {
      case 'utilization':
        return this.renderUtilizationChart(canvasId, chartData);
      case 'distribution':
        return this.renderDistributionChart(canvasId, chartData);
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
    console.log("renderUtilizationChart called with data:", data);
    
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Canvas ${canvasId} not found`);
      return null;
    }
    
    // Create a very simple horizontal bar chart
    const labels = data.map(item => item.asset);
    const values = data.map(item => parseFloat(item.utilization_percentage || 0));
    
    // Parse limits and handle "Infinity" strings and very large values
    const limits = data.map(item => {
      if (item.max_limit === "Infinity" || item.max_limit === "∞") {
        return Infinity;
      }
      const limit = parseFloat(item.max_limit || 0);
      return limit > 1e12 ? Infinity : limit;
    });
    
    // Create a custom plugin to add percentage and limit labels on bars
    const percentageLabelsPlugin = {
      id: 'percentageLabels',
      afterDatasetsDraw(chart, args, options) {
        const { ctx } = chart;
        
        for (let i = 0; i < chart.getDatasetMeta(0).data.length; i++) {
          const value = values[i];
          const limit = limits[i];
          
          const bar = chart.getDatasetMeta(0).data[i];
          
          // Get bar dimensions
          const barWidth = bar.width;
          const barHeight = bar.height;
          
          // Format limit text
          let limitText = '';
          if (limit !== undefined) {
            if (limit === Infinity) {
              limitText = 'No Deposit Limits';
            } else if (limit >= 1e9) {
              limitText = `${(limit/1e9).toFixed(1)}B`;
            } else if (limit >= 1e6) {
              limitText = `${(limit/1e6).toFixed(1)}M`;
            } else if (limit >= 1e3) {
              limitText = `${(limit/1e3).toFixed(1)}K`;
            } else {
              limitText = `${limit.toFixed(0)}`;
            }
          }
          
          // Determine what category the bar is in based on its color/value
          const isRedBar = value >= 90;
          const isGreenBar = value >= 30 && value < 90;
          const isBlueBar = value < 30;
          
          // Draw percentage
          ctx.save();
          
          // Red bars - percentage and limit inside the bar
          if (isRedBar) {
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = 'bold 12px Arial';
            ctx.fillText(`${value.toFixed(1)}% (Max: ${limitText})`, bar.x - barWidth/2, bar.y);
          } 
          // Green bars - percentage inside, limit outside
          else if (isGreenBar) {
            // Draw percentage inside bar
            ctx.fillStyle = '#000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = 'bold 13px Arial';
            ctx.fillText(`${value.toFixed(1)}%`, bar.x - barWidth/2, bar.y);
            
            // Draw limit to the right of bar
            ctx.fillStyle = '#000';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.font = 'bold 13px Arial'; // Slightly smaller for the limit
            ctx.fillText(`(Max: ${limitText})`, bar.x + 8, bar.y);
          } 
          // Blue bars - everything outside
          else if (isBlueBar) {
            ctx.fillStyle = '#000';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.font = 'bold 13px Arial';
            ctx.fillText(`${value.toFixed(1)}% (Max: ${limitText})`, bar.x + (barWidth/2) + 3, bar.y);
          }
          
          ctx.restore();
        }
      }
    };
    
    // Create chart with simplified borderRadius
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
          borderRadius: 12,     // Simple number for compatibility
          barThickness: 18      // Fixed height in pixels
        }]
      },
      options: {
        indexAxis: 'y',         // Horizontal bars
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
                if (limit !== undefined) {
                  if (limit === Infinity) {
                    limitText = ` (Max: ∞)`;
                  } else if (limit >= 1e9) {
                    limitText = ` (Max: ${(limit/1e9).toFixed(1)}B)`;
                  } else if (limit >= 1e6) {
                    limitText = ` (Max: ${(limit/1e6).toFixed(1)}M)`;
                  } else if (limit >= 1e3) {
                    limitText = ` (Max: ${(limit/1e3).toFixed(1)}K)`;
                  } else {
                    limitText = ` (Max: ${limit.toFixed(0)})`;
                  }
                }
                
                return `Utilization: ${value.toFixed(1)}%${limitText}`;
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            ticks: {
              stepSize: 20,
              callback: function(value) {
                return value + '%';
              }
            }
          },
          y: {
            grid: {
              display: false
            }
          }
        }
      },
      plugins: [percentageLabelsPlugin]  // Add our custom plugin
    });
    
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
      colors = ['#10b981']; // Green for Slasher (seems to be single value)
    } else {
      colors = ['#6366f1', '#a855f7']; // Blue and purple for Delegator
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
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%', // Consistent cutout percentage
        layout: {
          padding: 20
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              font: { size: 12 }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                return `${label}: ${Number(value).toFixed(2)}%`;
              }
            }
          },
          datalabels: {
            display: true,
            formatter: (value) => {
              return `${Number(value).toFixed(2)}%`;
            },
            color: '#ffffff',
            font: {
              weight: 'bold',
              size: 14
            },
            anchor: 'center',
            align: 'center'
          }
        }
      },
      plugins: [ChartDataLabels]
    });

    // Consistent size for both charts
    canvas.parentNode.style.height = '400px';

    // Register for export
    ChartRegistry.register(canvasId, chart);
    ChartExportUtils.registerChart(canvasId, chart);

    return chart;
  }
}