import ChartFactory from './chartFactory.js';
import DataTransformer from '../utils/dataTransformer.js';

/**
 * Line Chart Creator with updated styling
 * Specialized in creating beautiful line and area charts
 */
export default class LineChart {
  /**
   * Create a time series line chart
   * @param {string} canvasId - Canvas element ID
   * @param {Array} data - CSV data
   * @param {Object} config - Chart configuration
   * @returns {Chart} - Chart.js instance
   */
  static createTimeSeries(canvasId, data, { dateKey, valueKey, title }) {
    const { labels, values } = DataTransformer.timeSeriesData(data, { dateKey, valueKey });
    
    // Create gradient for the line
    const ctx = document.getElementById(canvasId).getContext('2d');
    const gradientLine = ctx.createLinearGradient(0, 0, 0, 400);
    gradientLine.addColorStop(0, ChartFactory.brandColors.primary.purple);
    gradientLine.addColorStop(1, ChartFactory.brandColors.primary.lightPurple);
    
    const chartData = {
      labels,
      datasets: [{
        label: title || valueKey,
        data: values,
        backgroundColor: gradientLine,
        borderColor: ChartFactory.brandColors.primary.purple,
        borderWidth: 2,
        tension: 0.4,
        fill: false,
        pointBackgroundColor: ChartFactory.brandColors.primary.purple,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: ChartFactory.brandColors.primary.purple,
        pointRadius: 0,
        pointHoverRadius: 6
      }]
    };
    
    const options = {
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'day',
            tooltipFormat: 'MMM d, yyyy',
            displayFormats: {
              day: 'MMM d'
            }
          },
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
            color: ChartFactory.brandColors.text.gray
          },
          title: {
            display: true,
            text: 'Date',
            font: {
              family: "'Inter', 'Segoe UI', sans-serif",
              size: 13,
              weight: '500'
            },
            color: ChartFactory.brandColors.text.dark
          }
        },
        y: {
          grid: {
            color: 'rgba(226, 232, 240, 0.6)',
            drawBorder: false
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
                  valueKey.toLowerCase().includes('price') || 
                  title?.toLowerCase().includes('usd')) {
                if (value >= 1000000) {
                  return '$' + (value / 1000000).toFixed(1) + 'M';
                } else if (value >= 1000) {
                  return '$' + (value / 1000).toFixed(1) + 'K';
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
            color: ChartFactory.brandColors.text.dark
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              
              if (valueKey.toLowerCase().includes('usd') || 
                  valueKey.toLowerCase().includes('price') || 
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
        },
        legend: {
          position: 'top',
          align: 'start',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 20
          }
        }
      }
    };
    
    return ChartFactory.create(canvasId, 'line', chartData, options);
  }
  
  /**
   * Create a multi-series line chart
   * @param {string} canvasId - Canvas element ID
   * @param {Array} data - CSV data
   * @param {Object} config - Chart configuration
   * @returns {Chart} - Chart.js instance
   */
  static createMultiSeries(canvasId, data, { xKey, seriesConfig, title }) {
    const labels = [...new Set(data.map(row => row[xKey]))];
    const datasets = [];
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    seriesConfig.forEach((config, index) => {
      const { key, label } = config;
      const filteredData = data.filter(row => row[key] !== undefined && row[key] !== null);
      const values = labels.map(label => {
        const matchingRow = filteredData.find(row => row[xKey] === label);
        return matchingRow ? matchingRow[key] : null;
      });
      
      // Create gradient for this series
      let borderColor, backgroundColor;
      
      if (index === 0) {
        borderColor = ChartFactory.brandColors.primary.purple;
        
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(130, 71, 229, 0.4)');
        gradient.addColorStop(1, 'rgba(130, 71, 229, 0.0)');
        backgroundColor = gradient;
      } else if (index === 1) {
        borderColor = ChartFactory.brandColors.primary.blue;
        
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
        backgroundColor = gradient;
      } else if (index === 2) {
        borderColor = ChartFactory.brandColors.accent.teal;
        
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(20, 184, 166, 0.4)');
        gradient.addColorStop(1, 'rgba(20, 184, 166, 0.0)');
        backgroundColor = gradient;
      } else {
        borderColor = ChartFactory.brandColors.accent.orange;
        
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(249, 115, 22, 0.4)');
        gradient.addColorStop(1, 'rgba(249, 115, 22, 0.0)');
        backgroundColor = gradient;
      }
      
      datasets.push({
        label: label || key,
        data: values,
        backgroundColor: config.fill !== false ? backgroundColor : 'transparent',
        borderColor: borderColor,
        borderWidth: 2,
        tension: 0.4,
        fill: config.fill !== false,
        pointBackgroundColor: borderColor,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: borderColor,
        pointRadius: 0,
        pointHoverRadius: 6
      });
    });
    
    const options = {
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false
        },
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
      },
      scales: {
        y: {
          grid: {
            color: 'rgba(226, 232, 240, 0.6)',
            drawBorder: false
          }
        }
      }
    };
    
    return ChartFactory.create(canvasId, 'line', { labels, datasets }, options);
  }
  
  /**
   * Create an area chart (line chart with fill)
   * @param {string} canvasId - Canvas element ID
   * @param {Array} data - CSV data
   * @param {Object} config - Chart configuration
   * @returns {Chart} - Chart.js instance
   */
  static createArea(canvasId, data, config) {
    // First create a regular line chart
    const chart = this.createTimeSeries(canvasId, data, config);
    
    // Modify it to be an area chart
    chart.data.datasets.forEach(dataset => {
      dataset.fill = true;
      
      // Create gradient fill
      const ctx = document.getElementById(canvasId).getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, 'rgba(130, 71, 229, 0.4)');
      gradient.addColorStop(1, 'rgba(130, 71, 229, 0.0)');
      dataset.backgroundColor = gradient;
    });
    
    chart.update();
    return chart;
  }
  
  /**
   * Create a multi-series area chart
   * @param {string} canvasId - Canvas element ID
   * @param {Array} data - CSV data
   * @param {Object} config - Chart configuration
   * @returns {Chart} - Chart.js instance
   */
  static createMultiArea(canvasId, data, config) {
    // Set fill to true for all series
    if (config.seriesConfig) {
      config.seriesConfig.forEach(series => {
        series.fill = true;
      });
    }
    
    return this.createMultiSeries(canvasId, data, config);
  }
}