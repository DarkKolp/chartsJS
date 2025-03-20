import ChartFactory from './chartFactory.js';
import DataTransformer from '../utils/dataTransformer.js';

/**
 * Pie Chart Creator
 * Specialized in creating pie charts
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
    const colors = ChartFactory.getPieChartColors();
    
    const chartData = {
      labels,
      datasets: [{
        label: title || valueKey,
        data: values,
        backgroundColor: colors.backgroundColor,
        borderColor: colors.borderColor,
        borderWidth: colors.borderWidth
      }]
    };
    
    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            generateLabels: (chart) => {
              const datasets = chart.data.datasets;
              return chart.data.labels.map((label, i) => {
                const meta = chart.getDatasetMeta(0);
                const style = meta.controller.getStyle(i);
                
                return {
                  text: `${label}: ${values[i].toLocaleString()} (${(values[i] / values.reduce((a, b) => a + b, 0) * 100).toFixed(1)}%)`,
                  fillStyle: style.backgroundColor,
                  strokeStyle: style.borderColor,
                  lineWidth: style.borderWidth,
                  hidden: false,
                  index: i
                };
              });
            }
          }
        },
        title: {
          display: true,
          text: title || 'Pie Chart'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value.toLocaleString()} (${percentage}%)`;
            }
          }
        }
      }
    };
    
    return ChartFactory.create(canvasId, 'pie', chartData, options);
  }
  
  /**
   * Create a doughnut chart
   * @param {string} canvasId - Canvas element ID
   * @param {Array} data - Data array
   * @param {Object} config - Chart configuration
   * @returns {Chart} - Chart.js instance
   */
  static createDoughnut(canvasId, data, config) {
    const chart = this.create(canvasId, data, config);
    // Override the type
    chart.config.type = 'doughnut';
    return chart;
  }
}