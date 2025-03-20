import ChartFactory from './chartFactory.js';
import DataTransformer from '../utils/dataTransformer.js';

/**
 * Bar Chart Creator
 * Specialized in creating bar charts
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
    const colors = ChartFactory.generateColors(1);
    
    const chartData = {
      labels,
      datasets: [{
        label: title || valueKey,
        data: values,
        backgroundColor: colors.backgroundColor,
        borderColor: colors.borderColor,
        borderWidth: 1
      }]
    };
    
    const options = {
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: valueKey
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
  static createGrouped(canvasId, data, { categoryKey, groups }) {
    const categories = [...new Set(data.map(row => row[categoryKey]))];
    const datasets = [];
    
    groups.forEach((group, index) => {
      const values = categories.map(category => {
        const matchingRow = data.find(row => row[categoryKey] === category);
        return matchingRow ? matchingRow[group.key] : 0;
      });
      
      const colors = ChartFactory.generateColors(groups.length);
      
      datasets.push({
        label: group.label || group.key,
        data: values,
        backgroundColor: colors.backgroundColor[index],
        borderColor: colors.borderColor[index],
        borderWidth: 1
      });
    });
    
    return ChartFactory.create(canvasId, 'bar', { labels: categories, datasets });
  }
}