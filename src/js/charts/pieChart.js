import ChartFactory from './chartFactory.js';
import DataTransformer from '../utils/dataTransformer.js';

const ChartDataLabels = window.ChartDataLabels;

/**
 * Pie Chart Creator
 * Styled to exactly match mockup designs
 */
export default class PieChart {
  /**
   * Create a pie chart
   * @param {string} canvasId - Canvas element ID
   * @param {Array} data - Data array
   * @param {Object} config - Chart configuration
   * @returns {Chart} - Chart.js instance
   */
  static create(canvasId, data, config = {}) {
    // Extract data
    let { labels, values } = DataTransformer.extractBasicData(data, { 
      labelKey: config.labelKey || 'label', 
      valueKey: config.valueKey || 'value' 
    });
    
    // Calculate percentages of total
    const total = values.reduce((sum, value) => sum + parseFloat(value), 0);
    const percentages = values.map(value => ((parseFloat(value) / total) * 100));
    
    // Group small slices into "Others" if conditions are met
    const smallSliceThreshold = 5; // 5%
    const minItemsForGrouping = 5;
    
    // Find small slices
    const smallSlices = percentages.map((pct, idx) => ({ 
      index: idx, 
      value: values[idx], 
      percentage: pct,
      label: labels[idx]
    })).filter(item => item.percentage < smallSliceThreshold);
    
    // Group small slices if we have enough items and enough small slices
    if (labels.length > minItemsForGrouping && smallSlices.length >= 2) {
      // Calculate combined value for small slices
      const othersValue = smallSlices.reduce((sum, item) => sum + parseFloat(item.value), 0);
      const othersPercentage = smallSlices.reduce((sum, item) => sum + item.percentage, 0);
      
      // Remove small slices (in reverse order to avoid index shifting)
      const indicesToRemove = smallSlices.map(item => item.index).sort((a, b) => b - a);
      indicesToRemove.forEach(index => {
        labels.splice(index, 1);
        values.splice(index, 1);
        percentages.splice(index, 1);
      });
      
      // Add the "Others" slice
      labels.push('Others');
      values.push(othersValue);
      percentages.push(othersPercentage);
    }
    
    // Custom color palette (same as before)
    const colorPalette = [
      'rgba(130, 71, 229, 1)',     // Deep purple (primary)
      'rgba(164, 102, 246, 0.8)',   // Medium purple
      'rgba(186, 135, 255, 0.8)',   // Light purple
      'rgba(20, 184, 166, 1)',      // Teal - matches the mockup color
      'rgba(59, 130, 246, 1)',      // Blue
      'rgba(249, 115, 22, 1)',      // Orange
      'rgba(236, 72, 153, 1)',      // Pink
      'rgba(139, 92, 246, 0.8)'     // Another purple shade
    ];
    
    // Chart data config
    const chartData = {
      labels: labels.map(l => l || 'Unknown'),
      datasets: [{
        label: config.title || config.valueKey,
        data: values,
        backgroundColor: colorPalette.slice(0, labels.length),
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 10
      }]
    };
    
    // Configure options with datalabels disabled
    const options = {
      maintainAspectRatio: false,
      cutout: '0%',
      layout: {
        padding: {
          left: 20,
          right: 20,
          top: 20,
          bottom: 20
        }
      },
      scales: {
        x: { display: false },
        y: { display: false }
      },
      plugins: {
        // Disable datalabels to prevent rendering issues
        datalabels: {
          display: false
        },
        // Set legend to bottom with minimal display
        legend: {
          display: true,
          position: 'right',
          align: 'center',
          labels: {
            boxWidth: 12,
            padding: 15,
            font: {
              size: 11
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || 'Unknown';
              const value = context.raw;
              const percentage = ((parseFloat(value) / total) * 100).toFixed(1);
              
              if (config.valueKey && (config.valueKey.toLowerCase().includes('usd') || 
                  config.valueKey.toLowerCase().includes('stake'))) {
                return `${label}: $${parseFloat(value).toLocaleString()} (${percentage}%)`;
              }
              
              return `${label}: ${parseFloat(value).toLocaleString()} (${percentage}%)`;
            }
          }
        }
      },
      // Disable animations to prevent infinite rendering
      animation: false
    };
    
    // Set up responsive sizing
    const canvas = document.getElementById(canvasId);
    if (canvas) {
      canvas.style.height = '300px';
    }
    
    // Merge in any custom options
    if (config.options) {
      Object.assign(options, config.options);
    }
    
    // Create chart without any plugins that could cause infinite rendering
    return new Chart(document.getElementById(canvasId).getContext('2d'), {
      type: 'pie',
      data: chartData,
      options: options
    });
  }
  
  
  
  /**
   * Create a doughnut chart
   * @param {string} canvasId - Canvas element ID
   * @param {Array} data - Data array
   * @param {Object} config - Chart configuration
   * @returns {Chart} - Chart.js instance
   */
  static createDoughnut(canvasId, data, config) {
    // Start with regular pie chart config
    const chartConfig = { ...config, type: 'doughnut' };
    const chart = this.create(canvasId, data, chartConfig);
    
    // Modify for doughnut
    chart.options.cutout = '70%';
    chart.update();
    
    return chart;
  }
}