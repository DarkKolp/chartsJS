// src/js/utils/chartExportUtils.js
export default class ChartExportUtils {
    static charts = new Map();
    
    /**
     * Register a chart for export functionality
     * @param {string} canvasId - Canvas ID 
     * @param {Chart} chart - Chart.js instance
     */
    static registerChart(canvasId, chart) {
      this.charts.set(canvasId, chart);
    }
    
    /**
     * Add export controls to a chart container
     * @param {HTMLElement} container - Container element
     * @param {string} canvasId - Canvas ID
     * @param {string} title - Chart title for filenames
     */
    static addExportControls(container, canvasId, title = 'chart') {
      // Create controls container
      const controlsContainer = document.createElement('div');
      controlsContainer.className = 'chart-controls';
      controlsContainer.style.display = 'flex';
      controlsContainer.style.justifyContent = 'flex-end';
      controlsContainer.style.marginTop = '8px';
      controlsContainer.style.gap = '8px';
      
      // Create CSV export button
      const csvButton = document.createElement('button');
      csvButton.textContent = 'Export CSV';
      csvButton.className = 'export-btn';
      csvButton.style.padding = '4px 8px';
      csvButton.style.fontSize = '12px';
      csvButton.style.border = '1px solid #e2e8f0';
      csvButton.style.borderRadius = '4px';
      csvButton.style.backgroundColor = '#f8fafc';
      csvButton.style.cursor = 'pointer';
      
      // Create Image export button
      const imgButton = document.createElement('button');
      imgButton.textContent = 'Export PNG';
      imgButton.className = 'export-btn';
      imgButton.style.padding = '4px 8px';
      imgButton.style.fontSize = '12px';
      imgButton.style.border = '1px solid #e2e8f0';
      imgButton.style.borderRadius = '4px';
      imgButton.style.backgroundColor = '#f8fafc';
      imgButton.style.cursor = 'pointer';
      
      // Add event listeners
      csvButton.addEventListener('click', () => this.exportCSV(canvasId, title));
      imgButton.addEventListener('click', () => this.exportImage(canvasId, title));
      
      // Add buttons to container
      controlsContainer.appendChild(csvButton);
      controlsContainer.appendChild(imgButton);
      
      // Add controls to chart container
      container.appendChild(controlsContainer);
    }
    
    /**
     * Export chart data as CSV
     * @param {string} canvasId - Canvas ID
     * @param {string} title - Filename base
     */
    static exportCSV(canvasId, title = 'chart-data') {
      const chart = this.charts.get(canvasId);
      if (!chart) return;
      
      try {
        // Build CSV content
        let csvContent = 'data:text/csv;charset=utf-8,';
        const labels = chart.data.labels;
        const datasets = chart.data.datasets;
        
        // Create header row
        let row = ['Label'];
        datasets.forEach(ds => row.push(ds.label || 'Value'));
        csvContent += row.join(',') + '\n';
        
        // Add data rows
        labels.forEach((label, i) => {
          row = [`"${label}"`];
          datasets.forEach(ds => {
            row.push(ds.data[i]);
          });
          csvContent += row.join(',') + '\n';
        });
        
        // Create download link
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error('Error exporting CSV:', err);
        alert('Failed to export CSV data');
      }
    }
    
    /**
     * Export chart as PNG image
     * @param {string} canvasId - Canvas ID
     * @param {string} title - Filename base
     */
    static exportImage(canvasId, title = 'chart-image') {
      const chart = this.charts.get(canvasId);
      if (!chart) return;
      
      try {
        // Create download link for image
        const link = document.createElement('a');
        link.download = `${title.toLowerCase().replace(/\s+/g, '-')}.png`;
        link.href = chart.toBase64Image('image/png', 1.0);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error('Error exporting image:', err);
        alert('Failed to export chart image');
      }
    }
  }