// src/js/utils/reportChartManager.js
import ChartExportUtils from './chartExportUtils.js';
import ChartRegistry from '../charts/chartRegistry.js';

/**
 * ReportChartManager - Unified utility for creating exportable charts across all sections
 * Creates consistent, report-ready chart layouts with export functionality
 */
export default class ReportChartManager {
  /**
   * Initialize required styles for chart layouts
   */
  static injectStyles() {
    if (!document.getElementById('report-chart-styles')) {
      const style = document.createElement('style');
      style.id = 'report-chart-styles';
      style.textContent = `
        .report-chart-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
          gap: 24px;
          margin: 20px 0;
        }
        
        .report-chart-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          padding: 24px;
          position: relative;
          min-height: 400px;
          display: flex;
          flex-direction: column;
        }
        
        /* Specific sizing for different chart types */
        .report-chart-card.pie-chart {
          height: 450px;
        }
        
        .report-chart-card.progress-chart {
          height: auto; /* Let progress charts size based on content */
          min-height: 350px;
        }
        
        .report-chart-card.bar-chart {
          height: 450px;
        }
        
        .report-chart-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 20px;
          text-align: center;
          padding: 0 40px; /* Space for export button */
        }
        
        .report-chart-container canvas {
          flex: 1;
        }
        
        .chart-export-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          padding: 6px 12px;
          background-color: #8247e5;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          z-index: 10;
          transition: background-color 0.2s;
        }
        
        .chart-export-btn:hover {
          background-color: #6d35c9;
        }
        
        .export-all-btn {
          padding: 8px 16px;
          background-color: #8247e5;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-bottom: 20px;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        
        .export-all-btn:hover {
          background-color: #6d35c9;
        }
        
        .export-all-btn:disabled {
          background-color: #9ca3af;
          cursor: not-allowed;
        }
        
        .report-section-title {
          font-size: 20px;
          font-weight: 600;
          margin: 30px 0 15px 0;
          color: #1e293b;
        }
        
        @media print {
          .chart-export-btn, .export-all-btn {
            display: none !important;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Create a fully functional export button for a chart
   * @param {HTMLElement} container - The chart container
   * @param {string} chartId - Chart canvas ID
   * @param {string} filename - Name for the exported file
   * @returns {HTMLElement} - The created button
   */
  static addExportButton(container, chartId, filename) {
    const exportBtn = document.createElement('button');
    exportBtn.className = 'chart-export-btn';
    exportBtn.textContent = 'Export';
    exportBtn.addEventListener('click', () => {
      ChartExportUtils.exportChart(chartId, filename);
    });
    container.appendChild(exportBtn);
    return exportBtn;
  }

  /**
   * Create a report-ready chart layout
   * @param {string} containerId - Container element ID
   * @param {Array} chartConfigs - Array of chart configuration objects
   * @param {string} sectionTitle - Optional section title
   * @returns {HTMLElement} - The chart container
   */
  static createReportChartLayout(containerId, chartConfigs, sectionTitle = null) {
    this.injectStyles();
    
    const mainContainer = document.getElementById(containerId);
    if (!mainContainer) return null;
    
    // Clear existing content
    mainContainer.innerHTML = '';
    
    // Add section title if provided
    if (sectionTitle) {
      const titleElement = document.createElement('h2');
      titleElement.className = 'report-section-title';
      titleElement.textContent = sectionTitle;
      mainContainer.appendChild(titleElement);
    }
    
    // Add export all button
    const exportAllBtn = document.createElement('button');
    exportAllBtn.className = 'export-all-btn';
    exportAllBtn.textContent = 'Export All Charts';
    exportAllBtn.addEventListener('click', () => {
      exportAllBtn.textContent = 'Exporting...';
      exportAllBtn.disabled = true;
      
      // Get all chart IDs in this container
      const chartIds = chartConfigs.map(config => config.canvasId);
      
      // Export each chart with a delay to prevent browser issues
      chartIds.forEach((chartId, index) => {
        setTimeout(() => {
          // Try to get title from container for export
          const chartContainer = document.getElementById(chartId).closest('.report-chart-card');
          const title = chartContainer ? chartContainer.querySelector('.report-chart-title').textContent : '';
          
          // Use our utility to export
          ChartExportUtils.exportChart(chartId, `${title || sectionTitle || 'chart'}-${index + 1}`);
          
          // Reset button after all exports
          if (index === chartIds.length - 1) {
            setTimeout(() => {
              exportAllBtn.textContent = 'Export All Charts';
              exportAllBtn.disabled = false;
            }, 500);
          }
        }, index * 500);
      });
    });
    mainContainer.appendChild(exportAllBtn);
    
    // Create chart container
    const chartContainer = document.createElement('div');
    chartContainer.className = 'report-chart-container';
    mainContainer.appendChild(chartContainer);
    
    // Create each chart card
    chartConfigs.forEach(config => {
      // Create card for the chart
      const chartCard = document.createElement('div');
      chartCard.className = 'report-chart-card';
      
      // Add specific chart type class if provided
      if (config.chartType) {
        chartCard.classList.add(`${config.chartType}-chart`);
      }
      
      // Add chart title - THIS WILL BE THE ONLY TITLE
      const chartTitle = document.createElement('div');
      chartTitle.className = 'report-chart-title';
      chartTitle.textContent = config.title;
      chartCard.appendChild(chartTitle);
      
      // Create canvas for the chart
      const canvas = document.createElement('canvas');
      canvas.id = config.canvasId;
      chartCard.appendChild(canvas);
      
      // Add export button
      const exportBtn = document.createElement('button');
      exportBtn.className = 'chart-export-btn';
      exportBtn.textContent = 'Export';
      exportBtn.addEventListener('click', () => {
        ChartExportUtils.exportChart(config.canvasId, config.filename || config.title || config.canvasId);
      });
      chartCard.appendChild(exportBtn);
      
      // Add to container
      chartContainer.appendChild(chartCard);
    });
    
    return chartContainer;
  }
  
  // Update the chart rendering functions to NOT include a title in the chart options
  // For example, in createCollateralCharts:
  
  static createCollateralCharts(containerId, networkData) {
    if (!networkData || !networkData.economic_security) return;
    
    const chartConfigs = [
      {
        canvasId: 'collateral-distribution-chart',
        title: 'Collateral Distribution',
        filename: 'collateral-distribution',
        chartType: 'pie',
        renderer: (canvasId, data) => {
          import('../charts/pieChart.js').then(module => {
            const PieChart = module.default;
            
            // Create the chart WITHOUT title parameter
            const chart = PieChart.create(canvasId, data.economic_security.collateral_distribution, {
              labelKey: 'collateral_symbol',
              valueKey: 'percentage'
              // No title parameter here!
            });
            
            // Register for export
            ChartExportUtils.registerChart(canvasId, chart);
          });
        }
      },
      {
        canvasId: 'collateral-utilization-chart',
        title: 'Collateral Utilization',
        filename: 'collateral-utilization',
        chartType: 'progress',
        renderer: (canvasId, data) => {
          import('../charts/ProgressChart.js').then(module => {
            const ProgressChart = module.default;
            
            // Prepare data for progress bars
            const collateralData = data.economic_security.by_collateral.map(collateral => ({
              label: collateral.collateral_symbol,
              percentage: collateral.utilization_percent,
              value: collateral.stake,
              limit: collateral.limit
            }));
            
            // Create the chart WITHOUT title parameter
            const chart = ProgressChart.createMultiple(canvasId, collateralData, {
              // No title parameter here!
            });
            
            // Register for export
            ChartExportUtils.registerChart(canvasId, chart);
          });
        }
      }
      // ... other chart configs
    ];
    
    // Create the layout
    const container = this.createReportChartLayout(containerId, chartConfigs, 'Collateral');
    
    // Render each chart
    chartConfigs.forEach(config => {
      config.renderer(config.canvasId, networkData);
    });
  }  

  /**
   * Create charts for Operators section
   * @param {string} containerId - Container element ID
   * @param {Object} networkData - Network data
   */
  static createOperatorsCharts(containerId, networkData) {
    if (!networkData || !networkData.operators) return;
    
    const chartConfigs = [
      {
        canvasId: 'operators-distribution-chart',
        title: 'Operator Distribution',
        filename: 'operator-distribution',
        renderer: (canvasId, data) => {
          // Import required charts dynamically
          import('../charts/barChart.js').then(module => {
            const BarChart = module.default;
            
            // Prepare data
            const operatorData = data.operators.stake_distribution;
            
            // Sort by stake in descending order
            operatorData.sort((a, b) => b.total_usd_stake - a.total_usd_stake);
            
            // Take top 8 operators
            const topOperators = operatorData.slice(0, 8);
            
            // Create the chart
            const chart = BarChart.createHorizontal(canvasId, topOperators, {
              labelKey: 'label',
              valueKey: 'total_usd_stake',
              title: 'USD Stake by Operator'
            });
            
            // Register for export
            ChartExportUtils.registerChart(canvasId, chart);
          });
        }
      },
      {
        canvasId: 'operator-concentration-chart',
        title: 'Operator Concentration',
        filename: 'operator-concentration',
        renderer: (canvasId, data) => {
          import('../charts/pieChart.js').then(module => {
            const PieChart = module.default;
            
            // Transform concentration data for pie chart
            const concentration = data.operators.concentration;
            const pieData = [
              { label: 'Top 3 Operators', percentage: concentration.top_3.percentage },
              { label: 'Top 5 Operators', percentage: concentration.top_5.percentage },
            ];
            
            // Create the chart
            const chart = PieChart.create(canvasId, pieData, {
              labelKey: 'label',
              valueKey: 'percentage',
              title: 'Stake Concentration'
            });
            
            // Register for export
            ChartExportUtils.registerChart(canvasId, chart);
          });
        }
      }
    ];
    
    // Create the layout
    const container = this.createReportChartLayout(containerId, chartConfigs, 'Operators');
    
    // Render each chart
    chartConfigs.forEach(config => {
      config.renderer(config.canvasId, networkData);
    });
  }

  /**
   * Create charts for Collateral section
   * @param {string} containerId - Container element ID
   * @param {Object} networkData - Network data
   */
  static createCollateralCharts(containerId, networkData) {
    if (!networkData || !networkData.economic_security) return;
    
    const chartConfigs = [
      {
        canvasId: 'collateral-distribution-chart',
        title: 'Collateral Distribution',
        filename: 'collateral-distribution',
        chartType: 'pie',
        renderer: (canvasId, data) => {
          import('../charts/pieChart.js').then(module => {
            const PieChart = module.default;
            
            // Create the chart WITHOUT drawing title on canvas
            const chart = PieChart.create(canvasId, data.economic_security.collateral_distribution, {
              labelKey: 'collateral_symbol',
              valueKey: 'percentage',
              // Either remove title here completely
              // title: 'Collateral Distribution',
              // Or pass this special option to prevent title from being drawn on canvas
              plugins: {
                drawTitleOnCanvas: false
              }
            });
            
            // Register for export
            ChartExportUtils.registerChart(canvasId, chart);
          });
        }
      },
      {
        canvasId: 'collateral-utilization-chart',
        title: 'Collateral Utilization',
        filename: 'collateral-utilization',
        chartType: 'progress',
        renderer: (canvasId, data) => {
          import('../charts/ProgressChart.js').then(module => {
            const ProgressChart = module.default;
            
            // Prepare data for progress bars
            const collateralData = data.economic_security.by_collateral.map(collateral => ({
              label: collateral.collateral_symbol,
              percentage: collateral.utilization_percent,
              value: collateral.stake,
              limit: collateral.limit
            }));
            
            // Calculate dynamic height based on number of items
            const container = document.getElementById(canvasId).parentElement;
            if (container && collateralData.length > 7) {
              container.style.height = `${Math.max(400, collateralData.length * 42 + 80)}px`;
            }
            
            // Create the chart with drawTitleOnCanvas set to false to prevent duplication
            const chart = ProgressChart.createMultiple(canvasId, collateralData, {
              title: 'Collateral Utilization',
              drawTitleOnCanvas: false // Prevent title duplication
            });
            
            // Register for export
            ChartExportUtils.registerChart(canvasId, chart);
          });
        }
      },
      {
        canvasId: 'underlying-assets-chart',
        title: 'Underlying Assets',
        filename: 'underlying-assets',
        chartType: 'pie',
        renderer: (canvasId, data) => {
          import('../charts/pieChart.js').then(module => {
            const PieChart = module.default;
            
            // Group by underlying asset
            const assetGroups = {};
            let totalUsdStake = 0;
            
            data.economic_security.by_collateral.forEach(collateral => {
              const asset = collateral.underlying_asset || 'Unknown';
              
              if (!assetGroups[asset]) {
                assetGroups[asset] = {
                  asset,
                  usdStake: 0,
                  percentage: 0
                };
              }
              
              assetGroups[asset].usdStake += collateral.usd_stake;
              totalUsdStake += collateral.usd_stake;
            });
            
            // Calculate percentages
            Object.values(assetGroups).forEach(group => {
              group.percentage = (group.usdStake / totalUsdStake) * 100;
            });
            
            // Create the chart WITHOUT title duplication
            const chart = PieChart.create(canvasId, Object.values(assetGroups), {
              labelKey: 'asset',
              valueKey: 'percentage',
              // Either remove title here completely
              // title: 'Underlying Assets',
              // Or pass this special option
              plugins: {
                drawTitleOnCanvas: false
              }
            });
            
            // Register for export
            ChartExportUtils.registerChart(canvasId, chart);
          });
        }
      }
    ];
    
    // Create the layout
    const container = this.createReportChartLayout(containerId, chartConfigs, 'Collateral');
    
    // Render each chart
    chartConfigs.forEach(config => {
      config.renderer(config.canvasId, networkData);
    });
  }

  /**
   * Create charts for Curators section
   * @param {string} containerId - Container element ID
   * @param {Object} networkData - Network data
   */
  static createCuratorsCharts(containerId, networkData) {
    if (!networkData || !networkData.vault_configuration) return;
    
    const chartConfigs = [
      {
        canvasId: 'curator-distribution-chart',
        title: 'Curator Distribution',
        filename: 'curator-distribution',
        renderer: (canvasId, data) => {
          import('../charts/pieChart.js').then(module => {
            const PieChart = module.default;
            
            // Transform curator data
            const curatorData = Object.entries(data.vault_configuration.curator_stats).map(([name, info]) => ({
              name: name.replace('_', ' '),
              vaultCount: info.vaults_count
            }));
            
            // Sort by vault count (descending)
            curatorData.sort((a, b) => b.vaultCount - a.vaultCount);
            
            // Calculate percentages
            const totalVaults = curatorData.reduce((sum, curator) => sum + curator.vaultCount, 0);
            curatorData.forEach(curator => {
              curator.percentage = (curator.vaultCount / totalVaults) * 100;
            });
            
            // Create the chart
            const chart = PieChart.create(canvasId, curatorData, {
              labelKey: 'name',
              valueKey: 'percentage',
              title: 'Vault Distribution by Curator'
            });
            
            // Register for export
            ChartExportUtils.registerChart(canvasId, chart);
          });
        }
      },
      {
        canvasId: 'curator-collateral-chart',
        title: 'Curator Collateral Types',
        filename: 'curator-collateral',
        renderer: (canvasId, data) => {
          import('../charts/barChart.js').then(module => {
            const BarChart = module.default;
            
            // Transform data to count collateral types per curator
            const curatorCollateralCounts = [];
            
            Object.entries(data.vault_configuration.curator_stats).forEach(([name, info]) => {
              const collateralCount = Object.keys(info.collaterals).length;
              curatorCollateralCounts.push({
                curator: name.replace('_', ' '),
                collateralCount
              });
            });
            
            // Sort by collateral count (descending)
            curatorCollateralCounts.sort((a, b) => b.collateralCount - a.collateralCount);
            
            // Create the chart
            const chart = BarChart.createHorizontal(canvasId, curatorCollateralCounts, {
              labelKey: 'curator',
              valueKey: 'collateralCount',
              title: 'Collateral Types per Curator'
            });
            
            // Register for export
            ChartExportUtils.registerChart(canvasId, chart);
          });
        }
      }
    ];
    
    // Create the layout
    const container = this.createReportChartLayout(containerId, chartConfigs, 'Curators');
    
    // Render each chart
    chartConfigs.forEach(config => {
      config.renderer(config.canvasId, networkData);
    });
  }

  /**
   * Generate all report charts for the network
   * @param {string} containerId - Container element ID
   * @param {Object} networkData - Network data
   */
  static generateFullReport(containerId, networkData) {
    if (!networkData) return;
    
    // Inject required styles
    this.injectStyles();
    
    // Get the container
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Clear existing content
    container.innerHTML = '';
    
    // Create report title
    const reportTitle = document.createElement('h1');
    reportTitle.textContent = `${networkData.network.name} Network Report`;
    reportTitle.style.fontSize = '24px';
    reportTitle.style.marginBottom = '20px';
    reportTitle.style.textAlign = 'center';
    container.appendChild(reportTitle);
    
    // Create separate sections for each chart category
    const vaultsSection = document.createElement('div');
    vaultsSection.id = 'report-vaults-section';
    container.appendChild(vaultsSection);
    
    const operatorsSection = document.createElement('div');
    operatorsSection.id = 'report-operators-section';
    container.appendChild(operatorsSection);
    
    const collateralSection = document.createElement('div');
    collateralSection.id = 'report-collateral-section';
    container.appendChild(collateralSection);
    
    const curatorsSection = document.createElement('div');
    curatorsSection.id = 'report-curators-section';
    container.appendChild(curatorsSection);
    
    // Generate charts for each section
    // For Vaults section, use the existing VaultReportUtils
    import('./vaultReportUtils.js').then(module => {
      const VaultReportUtils = module.default;
      VaultReportUtils.generateVaultSection('report-vaults-section', networkData);
    });
    
    // Generate other sections with our new utility
    this.createOperatorsCharts('report-operators-section', networkData);
    this.createCollateralCharts('report-collateral-section', networkData);
    this.createCuratorsCharts('report-curators-section', networkData);
    
    // Add button to export all charts in the report
    const exportAllBtn = document.createElement('button');
    exportAllBtn.textContent = 'Export All Charts';
    exportAllBtn.className = 'export-all-btn';
    exportAllBtn.style.display = 'block';
    exportAllBtn.style.margin = '30px auto';
    exportAllBtn.style.padding = '10px 20px';
    exportAllBtn.style.fontSize = '16px';
    
    exportAllBtn.addEventListener('click', () => {
      // Get all charts from the registry
      const charts = ChartExportUtils.chartRegistry;
      
      // Export each chart with a delay
      let index = 0;
      charts.forEach((chart, chartId) => {
        setTimeout(() => {
          ChartExportUtils.exportChart(chartId, `${networkData.network.name}-${chartId}`);
        }, index * 300);
        index++;
      });
    });
    
    container.appendChild(exportAllBtn);
    
    return container;
  }
}