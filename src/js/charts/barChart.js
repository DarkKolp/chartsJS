import ChartFactory from './chartFactory.js';
import DataTransformer from '../utils/dataTransformer.js';

/**
 * Bar Chart Creator with updated styling
 * Specialized in creating modern-looking bar charts
 */
export default class BarChart {
  /**
   * Create a basic bar chart
   * @param {string} canvasId - Canvas element ID
   * @param {Array} data - CSV data
   * @param {Object} config - Chart configuration
   * @returns {Chart} - Chart.js instance
   */
  static createBasic(canvasId, data, config = {}) {
    // Fix: Use the config object directly without destructuring in the parameter
    const { labelKey, valueKey, title, sort } = config;
    
    // Use the destructured variables for data extraction
    const extractedData = DataTransformer.extractBasicData(data, { 
      labelKey: labelKey || 'label', 
      valueKey: valueKey || 'value' 
    });
    
    const labels = extractedData.labels;
    const values = extractedData.values;
    
    // Sort data by value in descending order if requested
    if (sort === 'desc') {
      const combined = labels.map((label, i) => ({ label, value: values[i] }));
      combined.sort((a, b) => b.value - a.value);
      
      labels.length = 0;
      values.length = 0;
      
      combined.forEach(item => {
        labels.push(item.label);
        values.push(item.value);
      });
    }
    
    // Generate gradient colors for bars
    const ctx = document.getElementById(canvasId).getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, ChartFactory.brandColors.primary.purple);
    gradient.addColorStop(1, ChartFactory.brandColors.primary.lightPurple);
    
    const chartData = {
      labels,
      datasets: [{
        label: title || valueKey || 'Value',
        data: values,
        backgroundColor: gradient,
        borderColor: 'rgba(0, 0, 0, 0)', // Transparent border
        borderWidth: 0,
        borderRadius: 6,
        maxBarThickness: 40
      }]
    };
    
    const options = {
      indexAxis: 'x',
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            drawBorder: false,
            color: 'rgba(226, 232, 240, 0.6)'
          },
          ticks: {
            padding: 10,
            font: {
              family: "'Inter', 'Segoe UI', sans-serif",
              size: 12
            },
            color: ChartFactory.brandColors.text.gray,
            callback: function(value) {
              if (valueKey.toLowerCase().includes('usd') || 
                  valueKey.toLowerCase().includes('stake') || 
                  title?.toLowerCase().includes('usd')) {
                if (value >= 1000000) {
                  return '$' + (value / 1000000).toFixed(1) + 'M';
                } else if (value >= 1000) {
                  return '$' + (value / 1000).toFixed(0) + 'K';
                }
                return '$' + value;
              }
              return value;
            }
          },
          title: {
            display: Boolean(valueKey),
            text: valueKey,
            font: {
              family: "'Inter', 'Segoe UI', sans-serif",
              size: 13,
              weight: '500'
            },
            color: ChartFactory.brandColors.text.dark,
            padding: {
              top: 10,
              bottom: 10
            }
          }
        },
        x: {
          grid: {
            display: false,
            drawBorder: false
          },
          ticks: {
            padding: 10,
            font: {
              family: "'Inter', 'Segoe UI', sans-serif",
              size: 12
            },
            color: ChartFactory.brandColors.text.gray,
            maxRotation: 45,
            minRotation: 45
          }
        }
      },
      plugins: {
        legend: {
          display: Boolean(title),
          position: 'top',
          align: 'start',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 20,
            boxWidth: 8,
            boxHeight: 8
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              
              if (valueKey.toLowerCase().includes('usd') || 
                  valueKey.toLowerCase().includes('stake') || 
                  title?.toLowerCase().includes('usd')) {
                label += new Intl.NumberFormat('en-US', { 
                  style: 'currency', 
                  currency: 'USD',
                  maximumFractionDigits: 0
                }).format(context.parsed.y);
              } else {
                label += context.parsed.y.toLocaleString();
              }
              
              return label;
            }
          }
        }
      }
    };
    
    return ChartFactory.create(canvasId, 'bar', chartData, options);
  }
  
  /**
   * Create a grouped bar chart
   * @param {string} canvasId - Canvas element ID
   * @param {Array} data - CSV data
   * @param {Object} config - Chart configuration
   * @returns {Chart} - Chart.js instance
   */
  static createGrouped(canvasId, data, { categoryKey, groups, title }) {
    const categories = [...new Set(data.map(row => row[categoryKey]))];
    const datasets = [];
    
    groups.forEach((group, index) => {
      const values = categories.map(category => {
        const matchingRow = data.find(row => row[categoryKey] === category);
        return matchingRow ? matchingRow[group.key] : 0;
      });
      
      const ctx = document.getElementById(canvasId).getContext('2d');
      
      // Create gradient for each group
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      let colorStart, colorEnd;
      
      if (index === 0) {
        colorStart = ChartFactory.brandColors.primary.purple;
        colorEnd = ChartFactory.brandColors.primary.lightPurple;
      } else if (index === 1) {
        colorStart = ChartFactory.brandColors.primary.blue;
        colorEnd = ChartFactory.brandColors.primary.blue + '80'; // 50% opacity
      } else if (index === 2) {
        colorStart = ChartFactory.brandColors.accent.teal;
        colorEnd = ChartFactory.brandColors.accent.teal + '80';
      } else {
        colorStart = ChartFactory.brandColors.accent.orange;
        colorEnd = ChartFactory.brandColors.accent.orange + '80';
      }
      
      gradient.addColorStop(0, colorStart);
      gradient.addColorStop(1, colorEnd);
      
      datasets.push({
        label: group.label || group.key,
        data: values,
        backgroundColor: gradient,
        borderColor: 'rgba(0, 0, 0, 0)',
        borderWidth: 0,
        borderRadius: 6,
        maxBarThickness: 30
      });
    });
    
    const options = {
      indexAxis: 'x',
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            drawBorder: false,
            color: 'rgba(226, 232, 240, 0.6)'
          }
        },
        x: {
          grid: {
            display: false,
            drawBorder: false
          }
        }
      },
      plugins: {
        title: {
          display: Boolean(title),
          text: title || '',
          font: {
            family: "'Inter', 'Segoe UI', sans-serif",
            size: 16,
            weight: 'bold'
          },
          padding: {
            top: 10,
            bottom: 30
          }
        }
      }
    };
    
    return ChartFactory.create(canvasId, 'bar', { labels: categories, datasets }, options);
  }

  /**
 * Create a log scale bar chart for collateral limits
 * @param {string} canvasId - Canvas element ID
 * @param {Array} data - Transformed data
 * @param {Object} config - Chart configuration
 * @returns {Chart} - Chart.js instance
 */
  static createLogScale(canvasId, data, { title }) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Extract data
    const labels = data.map(item => item.label);
    
    // Separate finite and infinite values
    const infiniteIndices = [];
    const finiteValues = data.map((item, index) => {
      if (item.value === null || item.label === 'WBTC') {
        infiniteIndices.push(index);
        return 0; // Zero value (won't be displayed)
      }
      return item.value;
    });
    
    // Generate colors based on underlying asset
    const backgroundColor = data.map(item => {
      const asset = item.underlyingAsset || 'Unknown';
      switch(asset) {
        case 'ETH': return 'rgba(130, 71, 229, 0.8)'; // Purple for ETH
        case 'BTC': return 'rgba(247, 147, 26, 0.8)'; // Orange for BTC
        case 'USD': return 'rgba(39, 174, 96, 0.8)';  // Green for USD
        default: return 'rgba(149, 165, 166, 0.8)';   // Gray for others
      }
    });
    
    // Prepare chart data
    const chartData = {
      labels,
      datasets: [{
        label: 'Limit (USD)',
        data: finiteValues,
        backgroundColor,
        borderWidth: 0,
        borderRadius: 4,
        maxBarThickness: 30
      }]
    };
    
    // Configure options with log scale
    const options = {
      indexAxis: 'y',
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: 10,
          right: 30,
          top: 30,
          bottom: 10
        }
      },
      scales: {
        x: {
          type: 'logarithmic',
          min: 1, // Minimum value to avoid log(0) issues
          title: {
            display: true,
            text: 'Limit in USD (Log Scale)',
            font: {
              size: 12,
              weight: 'bold'
            }
          },
          grid: {
            color: 'rgba(200, 200, 200, 0.3)'
          },
          ticks: {
            callback: function(value) {
              if (value === 0) return '0';
              
              const suffixes = ['', 'K', 'M', 'B', 'T'];
              const suffixNum = Math.floor(Math.log10(value) / 3);
              const shortValue = (value / Math.pow(1000, suffixNum)).toFixed(1);
              return '$' + shortValue + suffixes[suffixNum];
            }
          }
        },
        y: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 11
            }
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const index = context.dataIndex;
              if (infiniteIndices.includes(index)) {
                return 'Limit: Infinite (∞)';
              }
              return data[index].displayValue;
            }
          }
        }
      }
    };
    
    // Adjust the container height based on number of items
    const containerHeight = Math.max(300, data.length * 35 + 100);
    document.getElementById(canvasId).parentNode.style.height = `${containerHeight}px`;
    
    // Create the chart instance
    const chart = new Chart(ctx, {
      type: 'bar',
      data: chartData,
      options: options
    });
    
    // Add a custom plugin to draw "infinite" text for specific tokens
    const infiniteLabelsPlugin = {
      id: 'infiniteLabels',
      afterDraw: (chart) => {
        const ctx = chart.ctx;
        const chartArea = chart.chartArea;
        const meta = chart.getDatasetMeta(0);
        
        infiniteIndices.forEach(index => {
          // Get the bar position
          const bar = meta.data[index];
          const y = bar.y;
          
          // Draw the infinity symbol
          ctx.save();
          ctx.fillStyle = '#1e293b';
          ctx.font = 'bold 14px "Inter", "Segoe UI", sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText('∞ (infinite)', chartArea.left + 10, y);
          ctx.restore();
        });
      }
    };
    
    // Register and attach the plugin
    Chart.register(infiniteLabelsPlugin);
    chart.update();
    
    return chart;
  }
  
  /**
   * Create a horizontal bar chart
   * @param {string} canvasId - Canvas element ID
   * @param {Array} data - CSV data
   * @param {Object} config - Chart configuration
   * @returns {Chart} - Chart.js instance
   */
  static createHorizontal(canvasId, data, { labelKey, valueKey, title }) {
    const chart = this.createBasic(canvasId, data, { labelKey, valueKey, title });
    
    // Set to horizontal orientation
    chart.options.indexAxis = 'y';
    
    // Adjust styling for horizontal bars
    chart.options.scales.x.beginAtZero = true;
    chart.options.scales.y.grid.display = false;
    chart.options.scales.x.grid.drawBorder = false;
    
    return chart;
  }
}