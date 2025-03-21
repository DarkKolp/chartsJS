import ChartFactory from './chartFactory.js';
import DataTransformer from '../utils/dataTransformer.js';

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
  static create(canvasId, data, { labelKey, valueKey, title }) {
    const { labels, values } = DataTransformer.extractBasicData(data, { labelKey, valueKey });
    
    // Custom color palette exactly matching mockups
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
    
    // Format values to show percentages of total
    const total = values.reduce((sum, value) => sum + value, 0);
    const percentages = values.map(value => ((value / total) * 100).toFixed(1));
    
    const chartData = {
      labels,
      datasets: [{
        label: title || valueKey,
        data: values,
        backgroundColor: colorPalette.slice(0, labels.length),
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 10
      }]
    };
    
    const options = {
      maintainAspectRatio: false,
      cutout: '0%',
      layout: {
        padding: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0
        }
      },
      scales: {
        x: {
          display: false,
          grid: {
            display: false
          }
        },
        y: {
          display: false,
          grid: {
            display: false
          }
        }
      },
      plugins: {
        legend: {
          position: 'right',
          align: 'center',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 8,
            boxHeight: 8,
            padding: 15,
            font: {
              family: "'Inter', 'Segoe UI', sans-serif",
              size: 12,
              weight: '500'
            },
            color: '#1E293B',
            formatter: (legendItem, index) => {
              const value = values[index];
              const percentage = percentages[index];
              return `${legendItem.text}: ${percentage}%`;
            }
          }
        },
        title: {
          display: false // We'll handle the title separately in the container
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw;
              const percentage = ((value / total) * 100).toFixed(1);
              
              if (valueKey && (valueKey.toLowerCase().includes('usd') || 
                  valueKey.toLowerCase().includes('stake'))) {
                return `${label}: $${value.toLocaleString()} (${percentage}%)`;
              }
              
              return `${label}: ${value.toLocaleString()} (${percentage}%)`;
            },
            title: function(context) {
              return context[0].label;
            },
            animation: {
              duration: 150
            },
            position: 'nearest'
          },
          padding: 12,
          boxPadding: 6,
          titleFont: {
            size: 13
          },
          bodyFont: {
            size: 13
          },
          cornerRadius: 6,
          backgroundColor: 'white',
          titleColor: '#1E293B',
          bodyColor: '#64748B',
          borderColor: '#E2E8F0',
          borderWidth: 1
        }
      }
    };
    
    // Create a custom plugin that adds the title to match mockup
    const titlePlugin = {
      id: 'customTitle',
      beforeDraw: (chart) => {
        if (title) {
          const ctx = chart.ctx;
          ctx.save();
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.font = "bold 16px 'Inter', 'Segoe UI', sans-serif";
          ctx.fillStyle = '#1E293B';
          ctx.fillText(title, chart.width / 2, 10);
          ctx.restore();
        }
      }
    };
    
    // Create chart with plugins
    return new Chart(document.getElementById(canvasId).getContext('2d'), {
      type: 'pie',
      data: chartData,
      options: options,
      plugins: [titlePlugin]
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