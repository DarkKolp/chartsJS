// src/js/utils/chartExportUtils.js
export default class ChartExportUtils {
    // Central registry of all chart instances in the application
    static chartRegistry = new Map();
    
    // Register a chart when it's created
    static registerChart(chartId, chartInstance) {
      this.chartRegistry.set(chartId, chartInstance);
      return chartInstance;
    }
    
    // High quality export for any Chart.js chart
    static exportChart(chartId, fileName = 'chart-export') {
      const chart = this.chartRegistry.get(chartId);
      if (!chart) {
        console.error(`Chart with ID ${chartId} not found in registry`);
        return false;
      }
  
      try {
        // Get the canvas and save original dimensions
        const canvas = chart.canvas;
        const originalWidth = canvas.width;
        const originalHeight = canvas.height;
        const originalRatio = window.devicePixelRatio;
        
        // Temporarily increase resolution for export
        window.devicePixelRatio = 4; // 4x resolution
        canvas.width = originalWidth * 4;
        canvas.height = originalHeight * 4;
        
        // Redraw at higher resolution
        chart.resize();
        chart.draw();
        
        // Create download link
        const link = document.createElement('a');
        link.download = `${fileName}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
        
        // Restore original dimensions
        window.devicePixelRatio = originalRatio;
        canvas.width = originalWidth;
        canvas.height = originalHeight;
        chart.resize();
        chart.draw();
        
        return true;
      } catch (error) {
        console.error('Error during high-resolution chart export:', error);
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
    
    // Export all registered charts
    static exportAllCharts(prefix = 'chart') {
      const chartIds = Array.from(this.chartRegistry.keys());
      
      if (chartIds.length === 0) {
        console.warn('No charts registered for export');
        return false;
      }
      
      // Export each chart with slight delay to prevent browser issues
      chartIds.forEach((chartId, index) => {
        setTimeout(() => {
          this.exportChart(chartId, `${prefix}-${chartId}`);
        }, index * 300);
      });
      
      return true;
    }
  }