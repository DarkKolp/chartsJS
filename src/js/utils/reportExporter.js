// Create a new file: src/js/utils/reportExporter.js
import ChartRegistry from '../charts/chartRegistry.js';

export default class ReportExporter {
  static exportChartAsPNG(chartId, fileName = 'chart') {
    const chart = ChartRegistry.get(chartId);
    if (!chart) {
      console.error(`Chart with ID ${chartId} not found`);
      return;
    }
    
    // Configure higher resolution for export
    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    
    // Get high-resolution image (2x normal resolution)
    const canvas = chart.canvas;
    const ctx = canvas.getContext('2d');
    const currentDevicePixelRatio = window.devicePixelRatio;
    
    // Temporarily increase resolution
    window.devicePixelRatio = 2.5;
    const originalWidth = canvas.width;
    const originalHeight = canvas.height;
    
    canvas.width = originalWidth * 2.5;
    canvas.height = originalHeight * 2.5;
    
    chart.resize();
    chart.draw();
    
    // Generate high-quality PNG
    link.href = canvas.toDataURL('image/png', 1.0);
    
    // Restore original size
    canvas.width = originalWidth;
    canvas.height = originalHeight;
    window.devicePixelRatio = currentDevicePixelRatio;
    chart.resize();
    chart.draw();
    
    // Download the file
    link.click();
  }
  
  // Add a button to each chart for easy export
  static addExportButtonsToCharts() {
    const chartContainer = document.getElementById('chart-container');
    if (!chartContainer) return;
    
    const exportButton = document.createElement('button');
    exportButton.className = 'export-button';
    exportButton.textContent = 'Export as PNG';
    exportButton.style.position = 'absolute';
    exportButton.style.top = '10px';
    exportButton.style.right = '20px';
    exportButton.style.zIndex = '100';
    exportButton.style.padding = '8px 15px';
    exportButton.style.backgroundColor = '#8247e5'; // Purple from your brand
    exportButton.style.color = 'white';
    exportButton.style.border = 'none';
    exportButton.style.borderRadius = '4px';
    exportButton.style.cursor = 'pointer';
    
    exportButton.addEventListener('click', () => {
      const currentChartId = document.querySelector('.chart-selector-button.active')?.dataset.chartId;
      if (currentChartId) {
        this.exportChartAsPNG(currentChartId);
      }
    });
    
    chartContainer.appendChild(exportButton);
  }
}