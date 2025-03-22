// src/js/utils/reportChartManager.js
import ChartExportUtils from './chartExportUtils.js';
import ChartRegistry from '../charts/chartRegistry.js';
import ChartFactory from '../charts/chartFactory.js';
// Add import for SankeyChartUtils
import SankeyChartUtils from './sankeyChartUtils.js';

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

        .report-section-subtitle {
          font-size: 18px;
          font-weight: 600;
          margin: 25px 0 10px 0;
          color: #1e293b;
        }
        
        /* Sankey diagram styles */
        .sankey-chart-container {
          position: relative;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          padding: 20px;
          margin: 20px 0;
        }
        
        .sankey-tooltip {
          position: absolute;
          background-color: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 8px;
          pointer-events: none;
          font-size: 12px;
          z-index: 1000;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        @media print {
          .chart-export-btn, .export-all-btn {
            display: none !important;
          }
        }
        
        /* For export mode */
        .exporting .chart-export-btn,
        .exporting .sankey-tooltip,
        .exporting .export-all-btn {
          display: none !important;
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

  /**
   * Create charts for Operators section with Sankey diagram
   * @param {string} containerId - Container element ID
   * @param {Object} networkData - Network data
   */
  static createOperatorsCharts(containerId, networkData) {
    if (!networkData || !networkData.operators) return;
    
    // Ensure styles are injected
    this.injectStyles();
    
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Clear existing content
    container.innerHTML = '';
    
    // Add section title
    const titleElement = document.createElement('h2');
    titleElement.className = 'report-section-title';
    titleElement.textContent = 'Operators';
    container.appendChild(titleElement);
    
    // Add export all button
    const exportAllBtn = document.createElement('button');
    exportAllBtn.className = 'export-all-btn';
    exportAllBtn.textContent = 'Export All Charts';
    exportAllBtn.addEventListener('click', () => {
      // Get all chart elements in this container
      const chartElements = container.querySelectorAll('[id^="operators-"]');
      const sankeyContainer = document.getElementById('operator-sankey-container');
      
      // Disable button during export
      exportAllBtn.textContent = 'Exporting...';
      exportAllBtn.disabled = true;
      
      // Export each chart with delay
      chartElements.forEach((chartElement, index) => {
        setTimeout(() => {
          ChartExportUtils.exportChart(chartElement.id, `operator-chart-${index + 1}`);
        }, index * 500);
      });
      
      // Export Sankey diagram
      setTimeout(() => {
        if (sankeyContainer) {
          SankeyChartUtils.exportSankeyAsPNG('operator-sankey-container');
        }
        
        // Reset button after all exports
        setTimeout(() => {
          exportAllBtn.textContent = 'Export All Charts';
          exportAllBtn.disabled = false;
        }, 500);
      }, chartElements.length * 500);
    });
    container.appendChild(exportAllBtn);
    
    // Create standard charts section
    const chartConfigs = [
      {
        canvasId: 'operators-stake-distribution-chart',
        title: 'Operator Stake Distribution',
        filename: 'operator-stake-distribution',
        chartType: 'pie',
        renderer: (canvasId, data) => {
          import('../charts/pieChart.js').then(module => {
            const PieChart = module.default;
            
            // Extract operators data
            const operatorData = data.operators.stake_distribution;
            
            // Sort by stake in descending order
            operatorData.sort((a, b) => b.total_usd_stake - a.total_usd_stake);
            
            // Take top 5 operators
            const topOperators = operatorData.slice(0, 5);
            const otherOperators = operatorData.slice(5);
            
            // Calculate total stake for "Others" category
            const othersStake = otherOperators.reduce((sum, op) => sum + op.total_usd_stake, 0);
            const totalStake = operatorData.reduce((sum, op) => sum + op.total_usd_stake, 0);
            
            // Prepare chart data
            const chartData = [
              ...topOperators.map(op => ({
                label: op.label,
                stake: op.total_usd_stake,
                percentage: (op.total_usd_stake / totalStake) * 100
              }))
            ];
            
            // Add "Others" category if there are more than 5 operators
            if (otherOperators.length > 0) {
              chartData.push({
                label: 'Others',
                stake: othersStake,
                percentage: (othersStake / totalStake) * 100
              });
            }
            
            // Create the chart
            const chart = PieChart.create(canvasId, chartData, {
              labelKey: 'label',
              valueKey: 'percentage'
            });
            
            // Register for export
            ChartExportUtils.registerChart(canvasId, chart);
          });
        }
      },
      {
        canvasId: 'vaults-per-operator-chart',
        title: 'Vaults & Collateral Types per Operator',
        filename: 'operator-metrics',
        chartType: 'bar',
        renderer: (canvasId, data) => {
          // Extract operator data
          const operatorData = data.operators?.stake_distribution || [];
          const operatorDetails = data.operators?.operator_details || [];
          
          // Calculate vaults per operator and collateral diversity
          const operatorMetrics = {};
          
          // Initialize metrics for all operators
          operatorDetails.forEach(op => {
            operatorMetrics[op.operator_id] = {
              id: op.operator_id,
              label: op.label || 'Unknown',
              vaultCount: 0,
              collateralTypes: new Set()
            };
          });
          
          // Get the vault-operator mapping
          const vaultOperatorMapping = data.vault_operator_correlations?.mapping || {};
          
          // Get collateral info from economic_security data
          const collateralData = data.economic_security?.by_collateral || [];
          
          // Create a lookup map for vault to collateral
          const vaultCollateralMap = {};
          collateralData.forEach(collateral => {
            const collateralSymbol = collateral.collateral_symbol;
            (collateral.vaults || []).forEach(vault => {
              vaultCollateralMap[vault.vault_id] = collateralSymbol;
            });
          });
          
          // Count vaults for each operator and track collateral types
          // ONLY COUNT VAULTS ONCE
          Object.entries(vaultOperatorMapping).forEach(([vaultId, vaultInfo]) => {
            const operators = vaultInfo.operators || {};
            const collateralSymbol = vaultCollateralMap[vaultId];
            
            // Each operator managing this vault gets a count increment
            Object.keys(operators).forEach(operatorId => {
              if (operatorMetrics[operatorId]) {
                // Count the vault
                operatorMetrics[operatorId].vaultCount++;
                
                // Track the collateral type if we have that info
                if (collateralSymbol) {
                  operatorMetrics[operatorId].collateralTypes.add(collateralSymbol);
                }
              }
            });
          });
          
          // Convert to array and sort by vault count
          const metricsArray = Object.values(operatorMetrics)
            .filter(op => op.vaultCount > 0 || op.collateralTypes.size > 0)
            .map(op => ({
              ...op,
              collateralCount: op.collateralTypes.size
            }))
            .sort((a, b) => b.vaultCount - a.vaultCount);
          
          // Take top 5 operators
          const topOperators = metricsArray.slice(0, 5);
          const otherOperators = metricsArray.slice(5);
          
          // Calculate means for others - only include non-zero values
          let othersVaultMean = 1; // Default to 1 if there are no "other" operators
          let othersCollateralMean = 1;
          
          if (otherOperators.length > 0) {
            // Only include operators with non-zero vaults in the mean calculation
            const nonZeroVaultOperators = otherOperators.filter(op => op.vaultCount > 0);
            othersVaultMean = nonZeroVaultOperators.length > 0 
              ? Math.ceil(nonZeroVaultOperators.reduce((sum, op) => sum + op.vaultCount, 0) / nonZeroVaultOperators.length)
              : 1;
            
            // Same for collateral types
            const nonZeroCollateralOperators = otherOperators.filter(op => op.collateralCount > 0);
            othersCollateralMean = nonZeroCollateralOperators.length > 0
              ? Math.ceil(nonZeroCollateralOperators.reduce((sum, op) => sum + op.collateralCount, 0) / nonZeroCollateralOperators.length)
              : 1;
          }
          
          // Ensure we have at least 1 for the mean values
          othersVaultMean = Math.max(1, othersVaultMean);
          othersCollateralMean = Math.max(1, othersCollateralMean);
          
          // Prepare data for chart
          const chartLabels = [
            ...topOperators.map(op => op.label),
            ...(otherOperators.length > 0 ? ['Others (mean)'] : [])
          ];
          
          const vaultCounts = [
            ...topOperators.map(op => op.vaultCount),
            ...(otherOperators.length > 0 ? [othersVaultMean] : [])
          ];
          
          const collateralCounts = [
            ...topOperators.map(op => op.collateralCount),
            ...(otherOperators.length > 0 ? [othersCollateralMean] : [])
          ];
          
          // Find the maximum value to set an appropriate y-axis scale
          const maxValue = Math.max(
            ...vaultCounts,
            ...collateralCounts
          );
          
          // Calculate a clean max value for the y-axis (round up to next multiple of 2)
          const yAxisMax = Math.ceil(maxValue / 2) * 2;
          
          const container = document.getElementById(canvasId).parentElement;
          if (container) {
            container.style.minWidth = '600px';
            container.style.maxWidth = '750px';
            container.style.height = '400px';
          }

          // Create chart
          const ctx = document.getElementById(canvasId).getContext('2d');
          
          const chart = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: chartLabels,
              datasets: [
                {
                  label: 'Vaults',
                  data: vaultCounts,
                  backgroundColor: ChartFactory.brandColors.primary.purple,
                  borderWidth: 0,
                  borderRadius: 6,
                  maxBarThickness: 30
                },
                {
                  label: 'Collateral Types',
                  data: collateralCounts,
                  backgroundColor: ChartFactory.brandColors.primary.blue,
                  borderWidth: 0,
                  borderRadius: 6,
                  maxBarThickness: 30
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: {
                  display: false
                },
                legend: {
                  position: 'top'
                }
              },
              scales: {
                x: {
                  grid: {
                    display: false
                  },
                  ticks: {
                    maxRotation: 45,
                    minRotation: 45
                  }
                },
                y: {
                  type: 'linear',
                  display: true,
                  title: {
                    display: true,
                    text: 'Count',
                    font: {
                      size: 12
                    }
                  },
                  grid: {
                    color: 'rgba(226, 232, 240, 0.6)'
                  },
                  beginAtZero: true,
                  max: yAxisMax, // Set the maximum value for the y-axis
                  ticks: {
                    precision: 0, // Show only integer values
                    stepSize: 1
                  }
                }
              },
              // Ensure bars are grouped side by side
              barPercentage: 0.8,
              categoryPercentage: 0.8
            }
          });
          
          // Register for export
          ChartExportUtils.registerChart(canvasId, chart);
        }
      },
      {
        canvasId: 'operators-distribution-chart',
        title: 'Operator Distribution',
        filename: 'operator-distribution',
        chartType: 'pie',
        renderer: (canvasId, data) => {
          // Import required charts dynamically
          import('../charts/pieChart.js').then(module => {
            const PieChart = module.default;
            
            // Prepare data
            const operatorData = data.operators.stake_distribution;
            
            // Sort by stake in descending order
            operatorData.sort((a, b) => b.total_usd_stake - a.total_usd_stake);
            
            // Take top 8 operators
            const topOperators = operatorData.slice(0, 8);
            
            // Calculate total stake for top operators
            const topStake = topOperators.reduce((sum, op) => sum + op.total_usd_stake, 0);
            const totalStake = operatorData.reduce((sum, op) => sum + op.total_usd_stake, 0);
            
            // Add "Others" category if needed
            const pieData = [...topOperators];
            if (topStake < totalStake) {
              pieData.push({
                label: 'Others',
                total_usd_stake: totalStake - topStake
              });
            }
            
            // Calculate percentages
            pieData.forEach(item => {
              item.percentage = ((item.total_usd_stake / totalStake) * 100).toFixed(1);
            });
            
            // Create the chart
            const chart = PieChart.create(canvasId, pieData, {
              labelKey: 'label',
              valueKey: 'percentage',
              title: 'Stake Distribution by Operator'
            });
            
            // Register for export
            ChartExportUtils.registerChart(canvasId, chart);
          });
        }
      },
      {
        canvasId: 'operators-concentration-chart',
        title: 'Stake Concentration',
        filename: 'operator-concentration',
        chartType: 'bar',
        renderer: (canvasId, data) => {
          import('../charts/barChart.js').then(module => {
            const BarChart = module.default;
            
            // Extract concentration data
            const concentration = data.operators.concentration;
            
            // Create data for bar chart
            const concentrationData = [
              { 
                category: 'Top 3 Operators', 
                percentage: concentration.top_3.percentage,
                usd_value: concentration.top_3.usd_stake
              },
              { 
                category: 'Top 5 Operators', 
                percentage: concentration.top_5.percentage,
                usd_value: concentration.top_5.usd_stake
              },
              { 
                category: 'Others', 
                percentage: 100 - concentration.top_5.percentage,
                usd_value: data.economic_security.total_usd_stake - concentration.top_5.usd_stake
              }
            ];
            
            // Create the chart
            const chart = BarChart.createHorizontal(canvasId, concentrationData, {
              labelKey: 'category',
              valueKey: 'percentage',
              title: 'Operator Concentration (%)'
            });
            
            // Register for export
            ChartExportUtils.registerChart(canvasId, chart);
          });
        }
      }
    ];
    
    // Create basic charts container
    const chartContainer = document.createElement('div');
    chartContainer.className = 'report-chart-container';
    container.appendChild(chartContainer);
    
    // Create and render basic charts
    chartConfigs.forEach(config => {
      const chartCard = document.createElement('div');
      chartCard.className = `report-chart-card ${config.chartType || ''}-chart`;
      
      const chartTitle = document.createElement('div');
      chartTitle.className = 'report-chart-title';
      chartTitle.textContent = config.title;
      chartCard.appendChild(chartTitle);
      
      const canvas = document.createElement('canvas');
      canvas.id = config.canvasId;
      chartCard.appendChild(canvas);
      
      // Add export button
      const exportBtn = document.createElement('button');
      exportBtn.className = 'chart-export-btn';
      exportBtn.textContent = 'Export';
      exportBtn.addEventListener('click', () => {
        ChartExportUtils.exportChart(config.canvasId, config.filename || config.title);
      });
      chartCard.appendChild(exportBtn);
      
      chartContainer.appendChild(chartCard);
      
      // Render chart
      config.renderer(config.canvasId, networkData);
    });
    
    // Add subtitle for Sankey diagram
    const sankeyTitle = document.createElement('h3');
    sankeyTitle.className = 'report-section-subtitle';
    sankeyTitle.textContent = 'Economic Security Allocation by Operators';
    sankeyTitle.style.marginTop = '40px';
    sankeyTitle.style.marginBottom = '15px';
    container.appendChild(sankeyTitle);
    
    // Add description for Sankey diagram
    const sankeyDescription = document.createElement('p');
    sankeyDescription.className = 'report-chart-description';
    sankeyDescription.textContent = 'This diagram shows how economic security is allocated from operators to different collateral types. The width of each flow represents the amount of stake.';
    sankeyDescription.style.marginBottom = '20px';
    sankeyDescription.style.color = '#64748b';
    container.appendChild(sankeyDescription);
    
    // Create Sankey diagram container
    const sankeyContainer = document.createElement('div');
    sankeyContainer.id = 'operator-sankey-container';
    sankeyContainer.className = 'sankey-chart-container';
    sankeyContainer.style.height = '600px';
    sankeyContainer.style.position = 'relative';
    sankeyContainer.style.marginBottom = '40px';
    container.appendChild(sankeyContainer);
    
    // Create Sankey diagram
    SankeyChartUtils.createOperatorCollateralSankey('operator-sankey-container', networkData);
    
    return container;
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
        canvasId: 'curator-metrics-chart',
        title: 'Vaults and Collateral Types per Curator',
        filename: 'curator-metrics',
        chartType: 'bar',
        renderer: (canvasId, data) => {
          // Extract curator data
          const curatorStats = data.vault_configuration.curator_stats || {};
          
          // Process curator data
          const curatorsData = Object.entries(curatorStats).map(([name, stats]) => {
            // Count unique collaterals
            const collateralCount = Object.keys(stats.collaterals || {}).length;
            
            return {
              name: name.replace(/_/g, ' '), // Replace underscores with spaces
              vaults: stats.vaults_count || 0,
              collaterals: collateralCount
            };
          });
          
          // Sort by vault count (descending)
          curatorsData.sort((a, b) => b.vaults - a.vaults);
          
          // Extract data for chart
          const labels = curatorsData.map(c => c.name);
          const vaultCounts = curatorsData.map(c => c.vaults);
          const collateralCounts = curatorsData.map(c => c.collaterals);
          
          // Create chart
          const ctx = document.getElementById(canvasId).getContext('2d');
          const chart = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: labels,
              datasets: [
                {
                  label: 'Vaults',
                  data: vaultCounts,
                  backgroundColor: ChartFactory.brandColors.primary.purple,
                  borderWidth: 0,
                  borderRadius: 6,
                  order: 1
                },
                {
                  label: 'Collateral Types',
                  data: collateralCounts,
                  backgroundColor: ChartFactory.brandColors.primary.blue,
                  borderWidth: 0,
                  borderRadius: 6,
                  order: 0,
                  yAxisID: 'y1'
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: {
                  display: false
                },
                legend: {
                  position: 'top'
                }
              },
              scales: {
                x: {
                  grid: {
                    display: false
                  },
                  ticks: {
                    maxRotation: 45,
                    minRotation: 45
                  }
                },
                y: {
                  type: 'linear',
                  display: true,
                  position: 'left',
                  title: {
                    display: true,
                    text: 'Number of Vaults'
                  },
                  grid: {
                    color: 'rgba(226, 232, 240, 0.6)'
                  }
                },
                y1: {
                  type: 'linear',
                  display: true,
                  position: 'right',
                  title: {
                    display: true,
                    text: 'Collateral Diversity'
                  },
                  grid: {
                    drawOnChartArea: false
                  }
                }
              }
            }
          });
          
          // Register for export
          ChartExportUtils.registerChart(canvasId, chart);
        }
      },
      {
        canvasId: 'curator-stake-chart',
        title: 'Stake Distribution by Curator',
        filename: 'curator-stake-distribution',
        chartType: 'pie',
        renderer: (canvasId, data) => {
          import('../charts/pieChart.js').then(module => {
            const PieChart = module.default;
            
            const curatorsStats = data.vault_configuration.curator_stats || {};
            const economicSecurity = data.economic_security || {};
            const totalNetworkStake = economicSecurity.total_usd_stake || 0;
            
            // Calculate stake for each curator
            const curatorStakes = [];
            let unknownStake = 0;
            
            // First get all vaults to check for unmapped vaults
            const allVaults = new Set();
            const mappedVaults = new Set();
            
            // Collect all vaults from collateral data
            (economicSecurity.by_collateral || []).forEach(collateral => {
              (collateral.vaults || []).forEach(vault => {
                allVaults.add(vault.vault_id);
              });
            });
            
            // Calculate stake for each curator and track mapped vaults
            Object.entries(curatorsStats).forEach(([name, stats]) => {
              let curatorUsdStake = 0;
              
              // Process each vault under this curator
              (stats.vaults || []).forEach(vault => {
                mappedVaults.add(vault.vault_id);
                
                // Find vault in economic security data to get USD stake
                (economicSecurity.by_collateral || []).forEach(collateral => {
                  const matchingVault = (collateral.vaults || []).find(v => 
                    v.vault_id === vault.vault_id
                  );
                  
                  if (matchingVault) {
                    curatorUsdStake += matchingVault.usd_stake || 0;
                  }
                });
              });
              
              // Add to curator stakes array
              curatorStakes.push({
                name: name.replace(/_/g, ' '),
                usdStake: curatorUsdStake,
                percentage: (curatorUsdStake / totalNetworkStake) * 100
              });
            });
            
            // Find unmapped vaults and calculate their stake
            const unmappedVaults = [...allVaults].filter(vaultId => !mappedVaults.has(vaultId));
            
            if (unmappedVaults.length > 0) {
              unmappedVaults.forEach(vaultId => {
                (economicSecurity.by_collateral || []).forEach(collateral => {
                  const matchingVault = (collateral.vaults || []).find(v => 
                    v.vault_id === vaultId
                  );
                  
                  if (matchingVault) {
                    unknownStake += matchingVault.usd_stake || 0;
                  }
                });
              });
              
              // Add unknown curator if there are unmapped vaults
              if (unknownStake > 0) {
                curatorStakes.push({
                  name: 'Unknown',
                  usdStake: unknownStake,
                  percentage: (unknownStake / totalNetworkStake) * 100
                });
              }
            }
            
            // Sort by stake percentage (descending)
            curatorStakes.sort((a, b) => b.percentage - a.percentage);
            
            // Create the chart
            const chart = PieChart.create(canvasId, curatorStakes, {
              labelKey: 'name',
              valueKey: 'percentage'
            });
            
            // Register for export
            ChartExportUtils.registerChart(canvasId, chart);
          });
        }
      },     
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