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

    progressData.sort((a, b) => a.percentage - b.percentage); // Sort by percentage
    
    // Custom plugin to draw multiple progress bars
  const multiProgressPlugin = {
    id: 'multiProgress',
    beforeDraw: (chart) => {
      const ctx = chart.ctx;
      const chartArea = chart.chartArea;
      
      // Clear the chart area
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, chart.width, chart.height);
      
      // Draw title if provided
      if (title) {
        ctx.fillStyle = '#1e293b';
        ctx.font = '600 16px "Inter", "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(title, chart.width / 2, 10);
      }
      
      // Calculate positions with compact spacing
      const barHeight = 24;
      const barSpacing = 40; // Reduced spacing for compact display
      const startY = title ? 40 : 20;
      const barWidth = Math.min(600, chartArea.right - chartArea.left - 300); // Limit width, leave room for labels
      const barLeft = chartArea.left + 180; // Space for vault name on left
      
      // Draw each progress bar - show all bars, no limit
      progressData.forEach((item, i) => {
        // Format percentage to 2 decimal places
        const percentage = Math.min(Math.max(0, parseFloat((item.percentage || 0).toFixed(2))), 100);
        const y = startY + i * barSpacing;
        
        // Draw vault name on left side
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
        
        // Draw percentage text - ALWAYS OUTSIDE for low values
        const percentText = `${percentage.toFixed(2)}%`;
        const percentWidth = ctx.measureText(percentText).width;

        // Position the text near the right edge of the bar (inside)
        const textPadding = 10; // Padding from right edge
        const textPosition = barLeft + barWidth - percentWidth - textPadding; // Right aligned with padding

        // Always draw inside the bar, aligned to the right edge
        ctx.font = '600 13px "Inter", "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        // Choose text color based on percentage (will be more visible against background)
        ctx.fillStyle = '#1e293b'; // Dark text for all percentages
        ctx.fillText(percentText, textPosition, y + barHeight / 2);
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
    return new Chart(document.getElementById(canvasId).getContext('2d'), {
      type: 'bar',
      data: emptyData,
      options: options,
      plugins: [multiProgressPlugin]
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