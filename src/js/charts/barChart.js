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
  static createBasic(canvasId, data, { labelKey, valueKey, title }) {
    const { labels, values } = DataTransformer.extractBasicData(data, { labelKey, valueKey });
    
    // Sort data by value in descending order if requested
    if (config?.sort === 'desc') {
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
        label: title || valueKey,
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