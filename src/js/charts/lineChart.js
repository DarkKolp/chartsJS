import ChartFactory from './chartFactory.js';
import DataTransformer from '../utils/dataTransformer.js';

/**
 * Line Chart Creator
 * Specialized in creating line charts
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
    const colors = ChartFactory.generateColors(1);
    
    const chartData = {
      labels,
      datasets: [{
        label: title || valueKey,
        data: values,
        backgroundColor: colors.backgroundColor[0],
        borderColor: colors.borderColor[0],
        borderWidth: 2,
        tension: 0.1,
        fill: false
      }]
    };
    
    const options = {
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'day',
            tooltipFormat: 'MMM d, yyyy'
          },
          title: {
            display: true,
            text: 'Date'
          }
        },
        y: {
          title: {
            display: true,
            text: valueKey
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
  static createMultiSeries(canvasId, data, { xKey, seriesConfig }) {
    const labels = [...new Set(data.map(row => row[xKey]))];
    const datasets = [];
    
    seriesConfig.forEach((config, index) => {
      const { key, label } = config;
      const filteredData = data.filter(row => row[key] !== undefined && row[key] !== null);
      const values = labels.map(label => {
        const matchingRow = filteredData.find(row => row[xKey] === label);
        return matchingRow ? matchingRow[key] : null;
      });
      
      const colors = ChartFactory.generateColors(seriesConfig.length);
      
      datasets.push({
        label: label || key,
        data: values,
        backgroundColor: colors.backgroundColor[index],
        borderColor: colors.borderColor[index],
        borderWidth: 2,
        tension: 0.1,
        fill: false
      });
    });
    
    return ChartFactory.create(canvasId, 'line', { labels, datasets });
  }
}