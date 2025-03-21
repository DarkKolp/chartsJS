import ChartRegistry from '../charts/chartRegistry.js';
import ChartFactory from '../charts/chartFactory.js';
import ChartExportUtils from './chartExportUtils.js';

// Updated VaultReportUtils class
export default class VaultReportUtils {
  // Static property to track charts internally
  static chartInstances = new Map();

  /**
   * Add needed styles for consistent chart sizing
   */
  static injectStyles() {
    if (!document.getElementById('vault-report-styles')) {
      const style = document.createElement('style');
      style.id = 'vault-report-styles';
      style.textContent = `
        .vault-metrics-container {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .metric-card {
          flex: 1;
          min-width: 200px;
          max-width: 300px;
          background-color: #fff;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .metric-card.purple-border {
          border-left: 4px solid #5271ff;
        }
        
        .metric-card.blue-border {
          border-left: 4px solid #3b82f6;
        }
        
        .metric-title {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 8px;
        }
        
        .metric-value {
          font-size: 24px;
          font-weight: 600;
          color: #1e293b;
        }
        
        .metric-subtitle {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 4px;
        }
        
        .donut-charts-container {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .donut-chart-card {
          flex: 1;
          min-width: 450px; /* Increased width for better proportions */
          background-color: #fff;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          position: relative;
        }
        
        .donut-chart-title {
          font-size: 18px; /* Increased font size */
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 16px;
          text-align: center;
        }
        
        .donut-chart-container {
          height: 300px; /* Increased height for bigger chart */
          position: relative;
        }
        
        .chart-export-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          padding: 6px 12px;
          background-color: #5271ff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
        }
        
        .export-all-button {
          display: inline-block;
          padding: 8px 16px;
          background-color: #5271ff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          font-size: 14px;
          margin-top: 16px;
        }
        
        /* Fix for the subtitle spacing in charts */
        .chart-title {
          margin-top: 20px;
          margin-bottom: 10px;
          clear: both;
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Create donut charts for delegator and slasher types
   * @param {string} containerId - Container element ID
   * @param {Object} data - Network data
   */
  static createTypeDonutCharts(containerId, data) {
    this.injectStyles();
    
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Extract data
    const delegatorTypes = data.vault_configuration?.delegator_types || {};
    const slasherTypes = data.vault_configuration?.slasher_types || {};
    
    // Create chart container
    const chartContainer = document.createElement('div');
    chartContainer.className = 'donut-charts-container';
    
    // Create delegator types chart
    const delegatorChart = document.createElement('div');
    delegatorChart.className = 'donut-chart-card';
    
    const delegatorTitle = document.createElement('div');
    delegatorTitle.className = 'donut-chart-title';
    delegatorTitle.textContent = 'Delegator Types';
    
    const delegatorChartDiv = document.createElement('div');
    delegatorChartDiv.className = 'donut-chart-container';
    
    const delegatorCanvas = document.createElement('canvas');
    delegatorCanvas.id = 'delegator-types-chart';
    delegatorChartDiv.appendChild(delegatorCanvas);
    
    // Add export button for delegator chart
    const delegatorExportBtn = this.addExportButton(delegatorChart, 'delegator-types-chart', 'delegator-types');

    
    delegatorChart.appendChild(delegatorTitle);
    delegatorChart.appendChild(delegatorChartDiv);
    delegatorChart.appendChild(delegatorExportBtn);
    
    // Create slasher types chart
    const slasherChart = document.createElement('div');
    slasherChart.className = 'donut-chart-card';
    
    const slasherTitle = document.createElement('div');
    slasherTitle.className = 'donut-chart-title';
    slasherTitle.textContent = 'Slasher Types';
    
    const slasherChartDiv = document.createElement('div');
    slasherChartDiv.className = 'donut-chart-container';
    
    const slasherCanvas = document.createElement('canvas');
    slasherCanvas.id = 'slasher-types-chart';
    slasherChartDiv.appendChild(slasherCanvas);
    
    // Add export button for slasher chart
    const slasherExportBtn = this.addExportButton(slasherChart, 'slasher-types-chart', 'slasher-types');
    
    slasherChart.appendChild(slasherTitle);
    slasherChart.appendChild(slasherChartDiv);
    slasherChart.appendChild(slasherExportBtn);
    
    // Add charts to container
    chartContainer.appendChild(delegatorChart);
    chartContainer.appendChild(slasherChart);
    
    // Add to main container
    container.appendChild(chartContainer);
    
    // Create delegator types donut chart
    const delegatorData = Object.entries(delegatorTypes).map(([type, percentage]) => {
      return { type, percentage };
    });
    
    this.createDonutChart('delegator-types-chart', delegatorData, {
      colors: [
        '#5271ff',
        '#a466f6'
      ]
    });
    
    // Create slasher types donut chart
    const slasherData = Object.entries(slasherTypes).map(([type, percentage]) => {
      return { type, percentage };
    });
    
    this.createDonutChart('slasher-types-chart', slasherData, {
      colors: [
        '#14b8a6',
        '#f97316'
      ]
    });
  }
  
  /**
   * Export a single chart
   * @param {HTMLElement} chartElement - The chart container element
   * @param {string} filename - Base filename for the export
   */
  static exportSingleChart(chartElement, filename) {
    if (window.html2canvas) {
      // Hide export button temporarily
      const exportBtn = document.createElement('button');
        exportBtn.textContent = 'Export Chart';
        exportBtn.className = 'chart-export-btn';
        exportBtn.addEventListener('click', () => {
          // For higher quality chart-only export
          this.exportChartToHighResPNG('delegator-types-chart', 'delegator-types');
        });
      const exportBtnDisplay = exportBtn ? exportBtn.style.display : 'block';
      if (exportBtn) exportBtn.style.display = 'none';
      
      // Add temporary styles for cleaner export
      chartElement.style.padding = '10px'; // Reduce padding
      chartElement.style.backgroundColor = '#ffffff';
      
      html2canvas(chartElement, {
        scale: 4, // Increase resolution
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      }).then(canvas => {
        // Create download
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = canvas.toDataURL('image/png', 1.0); // Max quality
        link.click();
        
        // Restore original styles
        chartElement.style.padding = '';
        if (exportBtn) exportBtn.style.display = exportBtnDisplay;
      });
    } else {
      console.error("html2canvas is not available");
      alert("Export requires html2canvas library");
    }
  }
  
  // New Chart.js native method (for higher quality chart-only exports)
  static exportChartToHighResPNG(canvasId, filename) {
    const chart = this.chartInstances.get(canvasId);
    if (!chart) return;
    
    // Get original canvas and context
    const originalCanvas = chart.canvas;
    
    // Save current device pixel ratio
    const originalRatio = window.devicePixelRatio;
    const originalWidth = originalCanvas.width;
    const originalHeight = originalCanvas.height;
    
    try {
      // Temporarily increase resolution
      window.devicePixelRatio = 3;
      originalCanvas.width = originalWidth * 3;
      originalCanvas.height = originalHeight * 3;
      
      // Redraw the chart at higher resolution
      chart.resize();
      chart.draw();
      
      // Create download
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = originalCanvas.toDataURL('image/png', 1.0);
      link.click();
      
      // Restore original size and redraw
      window.devicePixelRatio = originalRatio;
      originalCanvas.width = originalWidth;
      originalCanvas.height = originalHeight;
      chart.resize();
      chart.draw();
    } catch (error) {
      console.error('Error generating high-res export:', error);
    }
  }
  
  
  /**
   * Create a donut chart
   * @param {string} canvasId - Canvas element ID
   * @param {Array} data - Chart data
   * @param {Object} config - Chart configuration
   */
  static createDonutChart(canvasId, data, config) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Clean up any existing chart
    const existingChart = this.chartInstances.get(canvasId);
    if (existingChart) {
      existingChart.destroy();
    }
    
    // Create the chart with optimized settings
    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.map(item => item[config.labelKey || 'type']),
        datasets: [{
          data: data.map(item => item[config.valueKey || 'percentage']),
          backgroundColor: config.colors || [
            '#5271ff',
            '#a466f6'
          ],
          borderWidth: 0,
          hoverOffset: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        layout: {
          padding: 10 // Reduce default padding
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              boxWidth: 16,
              boxHeight: 16,
              padding: 17,
              font: {
                size: 16,
                weight: '500'
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw;
                return `${label}: ${value}%`;
              }
            },
            bodyFont: {
              size: 14
            },
            titleFont: {
              size: 16
            }
          },
          datalabels: {
            formatter: (value) => {
              return value + '%';
            },
            color: '#fff',
            font: {
              weight: 'bold',
              size: 14
            },
            display: (context) => context.dataset.data[context.dataIndex] >= 5,
            textAlign: 'center'
          }
        },
        animation: {
          duration: 0 // Disable animations during export
        }
      },
      plugins: [window.ChartDataLabels].filter(Boolean)
    });
    
    ChartExportUtils.registerChart(canvasId, chart);

    // Store chart reference
    this.chartInstances.set(canvasId, chart);
    
    return chart;
  }
  
  
  /**
   * Add the Report button to the navigation
   */
  static addReportButtonToNav() {
    // Continuously check for the chart selector to be available (it loads dynamically)
    const observer = new MutationObserver((mutations) => {
      // Look for the third-level navigation (sub navbar after selecting Vaults)
      const vaultSubnav = document.querySelector('.chart-selector');
      
      if (vaultSubnav && !document.getElementById('report-nav-button')) {
        // Check if we're in the Vaults section (the active category button)
        const isVaultsActive = Array.from(document.querySelectorAll('.category-button'))
          .some(btn => btn.classList.contains('active') && btn.textContent.includes('Vaults'));
        
        if (isVaultsActive) {
          // Create the Report button
          const reportButton = document.createElement('button');
          reportButton.id = 'report-nav-button';
          reportButton.className = 'chart-selector-button';
          reportButton.textContent = 'Report';
          
          reportButton.addEventListener('click', () => {
            // Mark this button as active
            const buttons = document.querySelectorAll('.chart-selector-button');
            buttons.forEach(btn => btn.classList.remove('active'));
            reportButton.classList.add('active');
            
            // Get the network data and show the report
            const networkData = window.networkManager?.getCurrentNetworkData();
            if (networkData) {
              this.showReportSection(networkData);
            } else {
              alert('Please select a network first');
            }
          });
          
          // Add the button to the navbar
          vaultSubnav.appendChild(reportButton);
        }
      }
    });
    
    // Start observing the document body for changes
    observer.observe(document.body, { childList: true, subtree: true });
  }

  
  static addExportButton(chartContainer, chartId, filename) {
    const exportBtn = document.createElement('button');
    exportBtn.textContent = 'Export Chart';
    exportBtn.className = 'chart-export-btn';
    exportBtn.addEventListener('click', () => {
      // Use our new utility
      ChartExportUtils.exportChart(chartId, filename);
    });
    
    chartContainer.appendChild(exportBtn);
    return exportBtn;
  }
  
  /**
   * Show the report section
   * @param {Object} data - Network data
   */
  static showReportSection(data) {
    // Get the chart container
    const chartContainer = document.getElementById('chart-container');
    if (!chartContainer) return;
    
    // Clear existing content
    chartContainer.innerHTML = '';
    
    // Create report container
    const reportContainer = document.createElement('div');
    reportContainer.id = 'network-report-container';
    reportContainer.style.padding = '20px';
    
    // Create vault section
    const vaultSection = document.createElement('div');
    vaultSection.id = 'vault-section';
    
    // Create title
    const title = document.createElement('h2');
    title.textContent = 'Vault Configuration';
    title.style.fontSize = '20px';
    title.style.marginBottom = '20px';
    title.style.paddingTop = '10px';
    
    vaultSection.appendChild(title);
    
    // Create metrics container
    const metricsContainer = document.createElement('div');
    metricsContainer.id = 'vault-metrics-container';
    vaultSection.appendChild(metricsContainer);
    
    // Create donut charts container
    const donutContainer = document.createElement('div');
    donutContainer.id = 'vault-donut-container';
    vaultSection.appendChild(donutContainer);
    
    reportContainer.appendChild(vaultSection);
    chartContainer.appendChild(reportContainer);
    
    // Generate vault components
    this.createVaultMetricsPanel('vault-metrics-container', data);
    this.createTypeDonutCharts('vault-donut-container', data);
    
    // Highlight the report button
    const buttons = document.querySelectorAll('.chart-selector-button');
    buttons.forEach(btn => btn.classList.remove('active'));
    document.getElementById('report-nav-button')?.classList.add('active');
  }
  
  /**
   * Initialize the vault report functionality
   * @param {Object} networkManager - Network manager instance
   */
  static initialize(networkManager) {
    // Store reference to network manager for use in button handlers
    window.networkManager = networkManager;
    
    // Add the report button to navigation
    this.addReportButtonToNav();
    
    // Inject styles
    this.injectStyles();
  }
  
  /**
   * Create key metrics panel for vaults
   * @param {string} containerId - Container element ID
   * @param {Object} data - Network data
   * @returns {HTMLElement} - The created panel element
   */
  static createVaultMetricsPanel(containerId, data) {
    this.injectStyles();
    
    const container = document.getElementById(containerId);
    if (!container) return null;
    
    // Extract vault metrics
    const totalVaults = data.vault_configuration?.total_vaults || 0;
    const resolverData = data.security?.resolver_implementation || {};
    const zeroAddressPercent = resolverData.percent_with_zero_address || 0;
    
    // Create metrics container
    const metricsContainer = document.createElement('div');
    metricsContainer.className = 'vault-metrics-container';
    
    // Create total vaults card
    const vaultsCard = document.createElement('div');
    vaultsCard.className = 'metric-card purple-border';
    vaultsCard.innerHTML = `
      <div class="metric-title">Total Vaults</div>
      <div class="metric-value">${totalVaults}</div>
    `;
    
    // Create resolver status card
    const resolverCard = document.createElement('div');
    resolverCard.className = 'metric-card blue-border';
    resolverCard.innerHTML = `
      <div class="metric-title">Resolver Status</div>
      <div class="metric-value">${zeroAddressPercent}% zero address</div>
      <div class="metric-subtitle">Slashing not activated</div>
    `;
    
    metricsContainer.appendChild(vaultsCard);
    metricsContainer.appendChild(resolverCard);
    
    // Add to container
    container.innerHTML = '';
    container.appendChild(metricsContainer);
    
    return metricsContainer;
  }

  /**
   * Generate the complete vault section (backward compatibility)
   * @param {string} containerId - Container element ID
   * @param {Object} data - Network data
   */
  static generateVaultSection(containerId, data) {
    // This is just a wrapper around the new method for backward compatibility
    if (containerId === 'network-report-container') {
      // If it's called with the expected container ID, use the new method
      this.showReportSection(data);
    } else {
      // Otherwise, create the container and then show the report
      const container = document.getElementById(containerId) || document.body;
      
      // Create report container if it doesn't exist
      let reportContainer = document.getElementById('network-report-container');
      if (!reportContainer) {
        reportContainer = document.createElement('div');
        reportContainer.id = 'network-report-container';
        container.appendChild(reportContainer);
      }
      
      this.showReportSection(data);
    }
    
    return document.getElementById('vault-section');
  }  
}