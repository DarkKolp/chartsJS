import ChartFactory from './chartFactory.js';

/**
 * Progress Chart Creator
 * Creates compact progress bars with inline labels
 */
export default class ProgressChart {
  /**
   * Create multiple progress bars
   * @param {string} canvasId - Canvas element ID
   * @param {Array} data - Array of progress data objects
   * @param {Object} config - Chart configuration
   * @returns {Chart} - Chart.js instance
   */
  static createMultiple(canvasId, data, { title } = {}) {
    // Sanitize data
    const progressData = Array.isArray(data) ? data : [];
    
    // Sort data from highest to lowest utilization
    progressData.sort((a, b) => b.percentage - a.percentage);
    
    // Custom plugin to draw multiple progress bars
    const multiProgressPlugin = {
      id: 'multiProgress',
      beforeDraw: (chart) => {
        const ctx = chart.ctx;
        const chartArea = chart.chartArea;
        
        // Clear the chart area
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, chart.width, chart.height);
        
        // Calculate positions with compact spacing
        const barHeight = 24;
        const barSpacing = 40; // Spacing between bars
        const startY = 20; // Start without title space
        const barWidth = Math.min(600, chartArea.right - chartArea.left - 300);
        const barLeft = chartArea.left + 180; // Space for vault name on left
        
        // Draw each progress bar
        progressData.forEach((item, i) => {
          const percentage = Math.min(Math.max(0, parseFloat((item.percentage || 0).toFixed(2))), 100);
          const y = startY + i * barSpacing;
          
          // Draw token symbol on left side
          if (item.label) {
            ctx.fillStyle = '#1e293b';
            ctx.font = '500 13px "Inter", "Segoe UI", sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.label, chartArea.left, y + barHeight / 2);
          }
          
          // Draw the border/track (limit)
          ctx.fillStyle = '#f1f5f9';
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 1;
          
          ctx.beginPath();
          const radius = barHeight / 2;
          ctx.roundRect(barLeft, y, barWidth, barHeight, radius);
          ctx.fill();
          ctx.stroke();
          
          // Determine color based on percentage
          let color;
          if (percentage < 50) {
            color = '#10b981'; // Green for low utilization
          } else if (percentage < 80) {
            color = '#f59e0b'; // Amber for medium utilization
          } else {
            color = '#ef4444'; // Red for high utilization
          }
          
          // Draw the progress fill
          const fillWidth = (barWidth * percentage) / 100;
          if (fillWidth > 0) {
            ctx.fillStyle = color;
            ctx.beginPath();
            
            if (fillWidth < 2 * radius) {
              // Special case for very small percentages
              ctx.roundRect(barLeft, y, fillWidth, barHeight, [radius, 0, 0, radius]);
            } else if (fillWidth >= barWidth - 2 * radius) {
              // Special case for near 100%
              ctx.roundRect(barLeft, y, fillWidth, barHeight, radius);
            } else {
              // Normal case
              ctx.roundRect(barLeft, y, fillWidth, barHeight, [radius, 0, 0, radius]);
            }
            
            ctx.fill();
          }
          
          // Draw percentage text
          const percentText = percentage === 0 ? '0.00%' : 
                            (percentage === 100 ? '100.00%' : `${percentage.toFixed(2)}%`);
          const percentWidth = ctx.measureText(percentText).width;
  
          // Position text appropriately
          const textPadding = 8;
          const textPosition = barLeft + Math.min(
            Math.max(fillWidth - percentWidth - textPadding, 0),
            barWidth - percentWidth - textPadding
          );
  
          // Draw percentage text
          ctx.fillStyle = (fillWidth < percentWidth + textPadding * 2) ? '#1e293b' : 'white';
          ctx.font = '600 13px "Inter", "Segoe UI", sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(percentText, textPosition, y + barHeight / 2);
  
          // Draw limit value on right side
          if (item.limit !== undefined) {
            let formattedLimit;
            
            // Format limit value appropriately
            if (item.limit === Infinity || item.limit === '∞' || item.limit > 1e12) {
              formattedLimit = '∞';
            } else if (item.limit >= 1000000000) {
              formattedLimit = `${(item.limit / 1000000000).toFixed(1)}B`;
            } else if (item.limit >= 1000000) {
              formattedLimit = `${(item.limit / 1000000).toFixed(1)}M`;
            } else if (item.limit >= 1000) {
              formattedLimit = `${(item.limit / 1000).toFixed(1)}K`;
            } else {
              formattedLimit = item.limit.toLocaleString();
            }
            
            // Draw limit text
            ctx.fillStyle = '#64748b';
            ctx.font = '400 13px "Inter", "Segoe UI", sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(formattedLimit, barLeft + barWidth + 20, y + barHeight / 2);
          }
        });
      }
    };
    
    // Create an empty chart as a container for our custom rendering
    const emptyData = {
      labels: [''],
      datasets: [{
        data: [0],
        backgroundColor: 'rgba(0,0,0,0)',
        borderWidth: 0
      }]
    };
    
    const options = {
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      },
      scales: {
        x: { display: false },
        y: { display: false }
      },
      maintainAspectRatio: false,
      responsive: true,
      animation: false
    };
    
    // Calculate needed height based on number of bars
    const canvasHeight = 40 + (progressData.length * 40) + 20;
    document.getElementById(canvasId).style.height = `${canvasHeight}px`;
    
    // Create chart with our custom plugin
    const chart = new Chart(document.getElementById(canvasId).getContext('2d'), {
      type: 'bar',
      data: emptyData,
      options: options,
      plugins: [multiProgressPlugin]
    });
    
    return chart;
  }
  
  
  /**
   * Create a progress bar (single)
   * @param {string} canvasId - Canvas element ID
   * @param {number} percentage - Percentage value (0-100)
   * @param {Object} config - Chart configuration
   * @returns {Chart} - Chart.js instance
   */
  static create(canvasId, percentage, config = {}) {
    // For a single bar, reuse the multiple implementation with an array of one item
    return this.createMultiple(canvasId, [{
      percentage: percentage,
      label: config.subtitle,
      limit: config.limit,
      value: config.value
    }], { 
      title: config.title,
      drawTitleOnCanvas: config.drawTitleOnCanvas 
    });
  }
  
  
  
  /**
   * Create a progress bar (single)
   * @param {string} canvasId - Canvas element ID
   * @param {number} percentage - Percentage value (0-100)
   * @param {Object} config - Chart configuration
   * @returns {Chart} - Chart.js instance
   */
  static create(canvasId, percentage, config = {}) {
    // For a single bar, reuse the multiple implementation with an array of one item
    return this.createMultiple(canvasId, [{
      percentage: percentage,
      label: config.subtitle,
      limit: config.limit,
      value: config.value
    }], { title: config.title });
  }
}