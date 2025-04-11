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

      // --- Button Styling (Consider moving to CSS) ---
      const buttonStyle = `
          padding: 4px 8px;
          font-size: 12px;
          border: 1px solid #e2e8f0; /* cool-gray-200 */
          border-radius: 4px;
          background-color: #f8fafc; /* cool-gray-50 */
          cursor: pointer;
          transition: background-color 0.2s;
      `;
      const buttonHoverStyle = `background-color: #f1f5f9;`; // cool-gray-100

      // Create CSV export button
      const csvButton = document.createElement('button');
      csvButton.textContent = 'Export CSV';
      csvButton.className = 'export-btn export-csv-btn';
      csvButton.style.cssText = buttonStyle;
      csvButton.onmouseover = () => csvButton.style.backgroundColor = '#f1f5f9';
      csvButton.onmouseout = () => csvButton.style.backgroundColor = '#f8fafc';


      // Create Image export button
      const imgButton = document.createElement('button');
      imgButton.textContent = 'Export PNG';
      imgButton.className = 'export-btn export-png-btn';
      imgButton.style.cssText = buttonStyle;
      imgButton.onmouseover = () => imgButton.style.backgroundColor = '#f1f5f9';
      imgButton.onmouseout = () => imgButton.style.backgroundColor = '#f8fafc';


      // Add event listeners
      csvButton.addEventListener('click', () => this.exportCSV(canvasId, title));
      // Pass the desired scale factor (e.g., 3 for 3x resolution) to exportImage
      imgButton.addEventListener('click', () => this.exportImage(canvasId, title, 3));

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
      if (!chart) {
          console.error(`Chart with ID ${canvasId} not found for CSV export.`);
          // Consider showing a user-friendly message here
          return;
      }

      try {
          // Build CSV content
          let csvContent = 'data:text/csv;charset=utf-8,';
          const labels = chart.data.labels || [];
          const datasets = chart.data.datasets || [];

          // Create header row more robustly
          let headerRow = ['Label'];
          datasets.forEach((ds, index) => headerRow.push(ds.label || `Dataset ${index + 1}`));
          csvContent += headerRow.map(h => `"${h.replace(/"/g, '""')}"`).join(',') + '\n'; // Quote headers

          // Add data rows
          labels.forEach((label, i) => {
              let dataRow = [`"${label.toString().replace(/"/g, '""')}"`]; // Quote labels
              datasets.forEach(ds => {
                  // Handle potential missing data points
                  const value = (ds.data && ds.data.length > i) ? ds.data[i] : '';
                  // Quote numeric values as well for consistency, or handle based on type
                  dataRow.push(`"${value.toString().replace(/"/g, '""')}"`);
              });
              csvContent += dataRow.join(',') + '\n';
          });

          // Create download link
          const encodedUri = encodeURI(csvContent);
          const link = document.createElement('a');
          link.setAttribute('href', encodedUri);
          const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-'); // Sanitize filename
          link.setAttribute('download', `${safeTitle}.csv`);
          document.body.appendChild(link); // Required for Firefox
          link.click();
          document.body.removeChild(link);
      } catch (err) {
          console.error('Error exporting CSV:', err);
          // Consider showing a user-friendly message here
          // alert('Failed to export CSV data'); // Avoid alert if possible
      }
  }

  /**
   * Export chart as high-resolution PNG image
   * @param {string} canvasId - Canvas ID
   * @param {string} title - Filename base
   * @param {number} scaleFactor - Multiplier for resolution (e.g., 2 for 2x, 3 for 3x)
   */
  static exportImage(canvasId, title = 'chart-image', scaleFactor = 3) {
      const chart = this.charts.get(canvasId);
      const canvas = chart?.canvas; // Use optional chaining

      if (!chart || !canvas) {
          console.error(`Chart or Canvas with ID ${canvasId} not found for image export.`);
          // Consider showing a user-friendly message here
          return;
      }

      // Store original properties
      const originalWidth = canvas.width;
      const originalHeight = canvas.height;
      // Store original CSS size if needed (usually not required for export resolution)
      // const originalStyleWidth = canvas.style.width;
      // const originalStyleHeight = canvas.style.height;
      const originalMaintainAspectRatio = chart.options.maintainAspectRatio;

      try {
          // --- Prepare for High-Res Render ---
          // Set render size based on scale factor
          canvas.width = originalWidth * scaleFactor;
          canvas.height = originalHeight * scaleFactor;

          // Optional: If you want the aspect ratio preserved based on CSS size,
          // you might need to adjust canvas width/height based on originalStyleWidth/Height here.
          // For now, we scale the render dimensions directly.

          // Maintain display size using CSS (important!)
          // Ensure CSS size doesn't change, so it still fits in the layout.
          // This should already be set by Chart.js or your CSS.
          // canvas.style.width = originalStyleWidth;
          // canvas.style.height = originalStyleHeight;


          // Temporarily disable aspect ratio maintenance for full redraw at new dimensions
          chart.options.maintainAspectRatio = false;

          // Resize chart instance to redraw at the new higher resolution
          chart.resize();

          // --- Export After Delay ---
          // IMPORTANT: Wait for the re-render to complete before exporting.
          // Chart.js rendering can be async. 100ms is usually safe.
          setTimeout(() => {
              try {
                  // Export the upscaled image data
                  const imageBase64 = chart.toBase64Image('image/png', 1.0); // Quality argument (1.0) is max for PNG

                  // Create download link
                  const link = document.createElement('a');
                  const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-'); // Sanitize filename
                  link.download = `${safeTitle}.png`;
                  link.href = imageBase64;
                  document.body.appendChild(link); // Required for Firefox
                  link.click();
                  document.body.removeChild(link);

              } catch (exportError) {
                  console.error('Error during image export/download:', exportError);
                  // Consider showing a user-friendly message here
                  // alert('Failed to export chart image.');
              } finally {
                  // --- Cleanup: Restore Original State (CRITICAL) ---
                  // Restore original canvas render size
                  canvas.width = originalWidth;
                  canvas.height = originalHeight;

                  // Restore original aspect ratio setting
                  chart.options.maintainAspectRatio = originalMaintainAspectRatio;

                  // Resize chart back to original size for on-screen display
                  // This might trigger another animation, consider disabling animation temporarily if needed
                  chart.resize();
                  // --- End Cleanup ---
              }
          }, 100); // 100ms delay - adjust if needed, e.g., for very complex charts

      } catch (err) {
          console.error('Error preparing image export:', err);
          // Consider showing a user-friendly message here
          // alert('Failed to prepare chart image for export.');

          // Optional: Attempt cleanup even if initial setup fails
          canvas.width = originalWidth;
          canvas.height = originalHeight;
          chart.options.maintainAspectRatio = originalMaintainAspectRatio;
          // Don't resize if chart instance might be broken
          if (chart.ctx) {
               chart.resize();
          }
      }
  }
}
