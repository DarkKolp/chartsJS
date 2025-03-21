// src/js/utils/chartExportUtils.js
export default class ChartExportUtils {
  // Central registry of all chart instances in the application
  static chartRegistry = new Map();
  
  // Register a chart when it's created
  static registerChart(chartId, chartInstance) {
    this.chartRegistry.set(chartId, chartInstance);
    return chartInstance;
  }
  
  /**
   * High quality export for any Chart.js chart with margins
   * @param {string} chartId - Chart identifier
   * @param {string} fileName - Name for the exported file
   * @param {Object} options - Export options including margins
   * @returns {boolean} - Success status
   */
  static exportChart(chartId, fileName = 'chart-export', options = {}) {
    const chart = this.chartRegistry.get(chartId);
    if (!chart) {
      console.error(`Chart with ID ${chartId} not found in registry`);
      return false;
    }

    try {
      // Default export options
      const defaultOptions = {
        scale: 4,            // 4x resolution
        marginTop: 40,       // Top margin in pixels
        marginRight: 40,     // Right margin
        marginBottom: 40,    // Bottom margin
        marginLeft: 40,      // Left margin
        backgroundColor: '#FFFFFF'  // Background color
      };
      
      // Apply chart-type-specific margins if not explicitly provided
      if (!options.marginLeft && !options.marginRight) {
        // For progress/utilization charts: extra space for labels and values
        if (chartId.includes('utilization') || chartId.includes('progress')) {
          defaultOptions.marginLeft = 60;
          defaultOptions.marginRight = 60;
        }
        // For pie/distribution charts: even margins
        else if (chartId.includes('distribution') || chartId.includes('pie')) {
          defaultOptions.marginLeft = 50;
          defaultOptions.marginRight = 50;
          defaultOptions.marginTop = 50;
          defaultOptions.marginBottom = 50;
        }
      }
      
      // Merge defaults with provided options
      const settings = {...defaultOptions, ...options};
      
      // Get the canvas and save original dimensions
      const canvas = chart.canvas;
      const originalWidth = canvas.width;
      const originalHeight = canvas.height;
      const originalRatio = window.devicePixelRatio;
      
      // Create a new canvas for the export with margins
      const exportCanvas = document.createElement('canvas');
      const chartWidth = canvas.clientWidth * settings.scale;
      const chartHeight = canvas.clientHeight * settings.scale;
      const totalWidth = chartWidth + (settings.marginLeft + settings.marginRight) * settings.scale;
      const totalHeight = chartHeight + (settings.marginTop + settings.marginBottom) * settings.scale;
      
      exportCanvas.width = totalWidth;
      exportCanvas.height = totalHeight;
      
      // Get context and fill background
      const ctx = exportCanvas.getContext('2d');
      ctx.fillStyle = settings.backgroundColor;
      ctx.fillRect(0, 0, totalWidth, totalHeight);
      
      // Temporarily increase resolution for chart
      window.devicePixelRatio = settings.scale;
      canvas.width = chartWidth;
      canvas.height = chartHeight;
      
      // Save original animation setting and disable for export
      const originalAnimation = chart.options.animation;
      chart.options.animation = false;
      
      // Redraw at higher resolution
      chart.resize();
      chart.draw();
      
      // Draw the chart onto the export canvas (with margins)
      ctx.drawImage(
        canvas, 
        settings.marginLeft * settings.scale,  // destination x
        settings.marginTop * settings.scale,   // destination y
        chartWidth,                           // width
        chartHeight                           // height
      );
      
      // Create download link
      const link = document.createElement('a');
      link.download = `${fileName}.png`;
      link.href = exportCanvas.toDataURL('image/png', 1.0);
      
      // Trigger download
      setTimeout(() => {
        link.click();
        
        // Restore original dimensions
        window.devicePixelRatio = originalRatio;
        canvas.width = originalWidth;
        canvas.height = originalHeight;
        
        // Restore animation setting
        chart.options.animation = originalAnimation;
        
        // Redraw at original size
        chart.resize();
        chart.draw();
      }, 100);
      
      return true;
    } catch (error) {
      console.error('Error during chart export with margins:', error);
      return false;
    }
  }
  
  // Export a container with HTML elements (using html2canvas)
  static exportContainer(container, fileName = 'chart-container') {
    if (!window.html2canvas) {
      console.error('html2canvas is required for container export');
      return false;
    }
    
    // Find and temporarily hide export buttons
    const exportButtons = container.querySelectorAll('.chart-export-btn, .export-button');
    const buttonStates = Array.from(exportButtons).map(btn => ({
      element: btn,
      display: btn.style.display
    }));
    
    // Hide buttons
    buttonStates.forEach(btn => btn.element.style.display = 'none');
    
    // Add temporary class for better export styling
    container.classList.add('exporting');
    
    // Export with html2canvas
    return html2canvas(container, {
      scale: 4,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      allowTaint: true,
      removeContainer: false
    }).then(canvas => {
      // Create download
      const link = document.createElement('a');
      link.download = `${fileName}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      
      // Restore button visibility
      buttonStates.forEach(btn => btn.element.style.display = btn.display);
      
      // Remove temporary class
      container.classList.remove('exporting');
      
      return true;
    }).catch(error => {
      console.error('Error during container export:', error);
      
      // Ensure we restore the UI even if there's an error
      buttonStates.forEach(btn => btn.element.style.display = btn.display);
      container.classList.remove('exporting');
      
      return false;
    });
  }
  
  /**
   * Export all registered charts with margins
   * @param {string} prefix - Filename prefix
   * @param {Object} options - Export options
   * @returns {boolean} - Success status
   */
  static exportAllCharts(prefix = 'chart', options = {}) {
    const chartIds = Array.from(this.chartRegistry.keys());
    
    if (chartIds.length === 0) {
      console.warn('No charts registered for export');
      return false;
    }
    
    // Export each chart with slight delay to prevent browser issues
    chartIds.forEach((chartId, index) => {
      setTimeout(() => {
        // Apply chart-specific options based on chart type
        let chartOptions = {...options};
        
        // For progress/utilization charts
        if (chartId.includes('utilization') || chartId.includes('progress')) {
          chartOptions.marginLeft = chartOptions.marginLeft || 60;
          chartOptions.marginRight = chartOptions.marginRight || 60;
        }
        // For pie/distribution charts
        else if (chartId.includes('distribution') || chartId.includes('pie')) {
          chartOptions.marginLeft = chartOptions.marginLeft || 50;
          chartOptions.marginRight = chartOptions.marginRight || 50;
          chartOptions.marginTop = chartOptions.marginTop || 50;
          chartOptions.marginBottom = chartOptions.marginBottom || 50;
        }
        
        this.exportChart(chartId, `${prefix}-${chartId}`, chartOptions);
      }, index * 300);
    });
    
    return true;
  }
}
