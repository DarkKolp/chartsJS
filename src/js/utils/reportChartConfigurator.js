// Create a new file: src/js/utils/reportChartConfigurator.js
import ChartFactory from '../charts/chartFactory.js';
import PieChart from '../charts/pieChart.js';
import BarChart from '../charts/barChart.js';
import DataTransformer from '../utils/dataTransformer.js';
import ReportExporter from './reportExporter.js';

export default class ReportChartConfigurator {
  /**
   * Generate the underlying assets distribution pie chart
   */
  static createAssetsDistributionChart(canvasId, networkData) {
    // Transform data to match report format
    const collateralData = networkData.economic_security.collateral_distribution;
    const assetTypeMap = {
      'wstETH': 'ETH',
      'rETH': 'ETH',
      'swETH': 'ETH',
      'cbETH': 'ETH',
      'WBTC': 'BTC',
      'LBTC': 'BTC',
      'lvlwaUSDC': 'USD',
      'lvlwaUSDT': 'USD'
    };
    
    // Group by asset type
    const aggregatedData = {};
    collateralData.forEach(item => {
      const assetType = assetTypeMap[item.collateral_symbol] || 'Other';
      if (!aggregatedData[assetType]) {
        aggregatedData[assetType] = {
          assetType: assetType,
          usd_stake: 0,
          percentage: 0
        };
      }
      aggregatedData[assetType].usd_stake += item.usd_stake;
      aggregatedData[assetType].percentage += item.percentage;
    });
    
    const pieData = Object.values(aggregatedData);
    
    // Create chart config
    const config = {
      type: 'pie',
      data: {
        labels: pieData.map(d => d.assetType),
        datasets: [{
          data: pieData.map(d => d.percentage),
          backgroundColor: pieData.map(d => {
            switch(d.assetType) {
              case 'ETH': return ChartFactory.brandColors.assets.eth;
              case 'BTC': return ChartFactory.brandColors.assets.btc;
              case 'USD': return ChartFactory.brandColors.assets.usd;
              default: return 'rgba(150, 150, 150, 1)';
            }
          }),
          borderWidth: 0
        }]
      },
      options: {
        plugins: {
          legend: {
            position: 'right',
            labels: {
              font: {
                family: 'Arial, sans-serif',
                size: 12
              }
            }
          },
          title: {
            display: true,
            text: 'Underlying Assets\' Distribution',
            font: {
              family: 'Arial, sans-serif',
              size: 16,
              weight: 'bold'
            },
            padding: {
              top: 10,
              bottom: 20
            }
          },
          datalabels: {
            formatter: (value) => {
              return value.toFixed(1) + '%';
            },
            color: '#fff',
            font: {
              weight: 'bold'
            },
            // Only show labels for values >= 5%
            display: (context) => context.dataset.data[context.dataIndex] >= 5
          }
        },
        layout: {
          padding: 20
        }
      }
    };
    
    const chart = new Chart(document.getElementById(canvasId).getContext('2d'), config);
    return chart;
  }
  
  /**
   * Generate the operator asset concentration pie chart
   */
  static createOperatorConcentrationChart(canvasId, networkData) {
    const operatorData = networkData.operators.stake_distribution;
    
    // Sort by value descending
    operatorData.sort((a, b) => b.total_usd_stake - a.total_usd_stake);
    
    // Take top 4 plus others
    const topOperators = operatorData.slice(0, 4);
    const otherOperators = operatorData.slice(4);
    
    const chartData = [...topOperators];
    
    // Add "Others" if needed
    if (otherOperators.length > 0) {
      const othersTotal = otherOperators.reduce((sum, op) => sum + op.total_usd_stake, 0);
      const totalStake = operatorData.reduce((sum, op) => sum + op.total_usd_stake, 0);
      const othersPercentage = (othersTotal / totalStake) * 100;
      
      chartData.push({
        label: 'Others (mean)',
        total_usd_stake: othersTotal,
        percentage: othersPercentage
      });
    }
    
    // Calculate percentages
    const totalStake = chartData.reduce((sum, op) => sum + op.total_usd_stake, 0);
    chartData.forEach(op => {
      op.percentage = (op.total_usd_stake / totalStake) * 100;
    });
    
    const config = {
      type: 'pie',
      data: {
        labels: chartData.map(d => d.label),
        datasets: [{
          data: chartData.map(d => d.percentage.toFixed(1)),
          backgroundColor: ChartFactory.brandColors.operators.slice(0, chartData.length),
          borderWidth: 0
        }]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: 'Assets Concentration per Node Operator',
            font: {
              family: 'Arial, sans-serif',
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            position: 'right'
          },
          datalabels: {
            formatter: (value) => {
              return value + '%';
            },
            color: '#fff',
            font: {
              weight: 'bold'
            }
          }
        }
      }
    };
    
    const chart = new Chart(document.getElementById(canvasId).getContext('2d'), config);
    return chart;
  }
  
  /**
   * Generate the operators bar chart
   */
  static createOperatorsBarChart(canvasId, networkData) {
    const operatorData = networkData.operators.stake_distribution;
    
    // Sort by value descending
    operatorData.sort((a, b) => b.total_usd_stake - a.total_usd_stake);
    
    // Take top 6 plus combine others
    const topOperators = operatorData.slice(0, 6);
    const otherOperators = operatorData.slice(6);
    
    const chartData = [...topOperators];
    
    // Add "Others" if needed
    if (otherOperators.length > 0) {
      const othersAvg = otherOperators.reduce((sum, op) => sum + op.total_usd_stake, 0) / otherOperators.length;
      
      chartData.push({
        label: 'Others (mean)',
        total_usd_stake: othersAvg
      });
    }
    
    const config = {
      type: 'bar',
      data: {
        labels: chartData.map(d => d.label),
        datasets: [{
          label: 'USD Stake (Millions)',
          data: chartData.map(d => d.total_usd_stake / 1000000), // Convert to millions
          backgroundColor: '#3b82f6',
          borderWidth: 0,
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'AVS Secured per Operator with ES',
            font: {
              family: 'Arial, sans-serif',
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              callback: function(value) {
                return value;
              }
            }
          },
          y: {
            grid: {
              display: false
            }
          }
        }
      }
    };
    
    const chart = new Chart(document.getElementById(canvasId).getContext('2d'), config);
    return chart;
  }
  
  /**
   * Generate the curators pie chart
   */
  static createCuratorsChart(canvasId, networkData) {
    const curatorStats = networkData.vault_configuration.curator_stats;
    
    const curatorData = Object.entries(curatorStats).map(([name, data]) => {
      // Calculate total USD stake for this curator
      let totalUsdStake = 0;
      data.vaults.forEach(vault => {
        const collSymbol = vault.collateral.symbol;
        const matchingCollateral = networkData.economic_security.by_collateral.find(
          c => c.collateral_symbol === collSymbol
        );
        
        if (matchingCollateral) {
          const matchingVault = matchingCollateral.vaults.find(v => v.vault_id === vault.vault_id);
          if (matchingVault) {
            totalUsdStake += matchingVault.usd_stake;
          }
        }
      });
      
      return {
        name: name.replace('_', ' '),
        vaults_count: data.vaults_count,
        usd_stake: totalUsdStake
      };
    });
    
    // Sort by USD stake
    curatorData.sort((a, b) => b.usd_stake - a.usd_stake);
    
    // Take top 5 and combine others
    const topCurators = curatorData.slice(0, 5);
    const otherCurators = curatorData.slice(5);
    
    const chartData = [...topCurators];
    
    // Add "Others" if needed
    if (otherCurators.length > 0) {
      const othersTotal = otherCurators.reduce((sum, c) => sum + c.usd_stake, 0);
      chartData.push({
        name: 'Others',
        vaults_count: otherCurators.reduce((sum, c) => sum + c.vaults_count, 0),
        usd_stake: othersTotal
      });
    }
    
    // Calculate percentages
    const totalStake = chartData.reduce((sum, c) => sum + c.usd_stake, 0);
    chartData.forEach(c => {
      c.percentage = (c.usd_stake / totalStake) * 100;
    });
    
    // Map curator names to colors
    const colorMap = {
      'R7 Labs': ChartFactory.brandColors.curators.r7Labs,
      'Renzo': ChartFactory.brandColors.curators.renzo,
      'EtherFi': ChartFactory.brandColors.curators.etherFi,
      'MEV Capital': ChartFactory.brandColors.curators.mevCapital,
      'Gauntlet': ChartFactory.brandColors.curators.gauntlet,
      'Others': ChartFactory.brandColors.curators.others
    };
    
    const config = {
      type: 'pie',
      data: {
        labels: chartData.map(d => d.name),
        datasets: [{
          data: chartData.map(d => d.percentage.toFixed(1)),
          backgroundColor: chartData.map(d => colorMap[d.name] || '#999'),
          borderWidth: 0
        }]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: 'Curators\' asset distribution',
            font: {
              family: 'Arial, sans-serif',
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            position: 'right'
          },
          datalabels: {
            formatter: (value) => {
              return value + '%';
            },
            color: '#fff',
            font: {
              weight: 'bold'
            },
            display: (context) => context.dataset.data[context.dataIndex] >= 5
          }
        }
      }
    };
    
    const chart = new Chart(document.getElementById(canvasId).getContext('2d'), config);
    return chart;
  }
  
  /**
   * Create geographical distribution bar chart
   */
  static createGeoDistributionChart(canvasId, networkData) {
    // We need to extract geographical data from operators
    // This would likely come from a mapping of operator IDs to locations
    // Since we don't have that data directly, I'll create a placeholder
    
    // Placeholder for demonstration
    const geoData = [
      { location: 'Australia', count: 1 },
      { location: 'Canada', count: 2 },
      { location: 'Estonia', count: 1 },
      { location: 'France', count: 1 },
      { location: 'Germany', count: 1 },
      { location: 'South Korea', count: 1 },
      { location: 'Spain', count: 1 },
      { location: 'Switzerland', count: 2 }
    ];
    
    const config = {
      type: 'bar',
      data: {
        labels: geoData.map(d => d.location),
        datasets: [{
          label: 'Number of validators',
          data: geoData.map(d => d.count),
          backgroundColor: '#3b82f6',
          borderWidth: 0,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Geographical Distribution of Validators',
            font: {
              family: 'Arial, sans-serif',
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    };
    
    const chart = new Chart(document.getElementById(canvasId).getContext('2d'), config);
    return chart;
  }
  
  /**
   * Initialize report chart export interface
   */
  static initReportChartInterface() {
    // Add CSS for report interface
    const style = document.createElement('style');
    style.textContent = `
      .report-charts-container {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
        padding: 20px;
      }
      .report-chart-card {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        padding: 15px;
        position: relative;
      }
      .report-chart-canvas {
        width: 100%;
        height: 300px;
      }
      .report-export-btn {
        position: absolute;
        top: 10px;
        right: 10px;
        padding: 4px 8px;
        background: #8247e5;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      }
    `;
    document.head.appendChild(style);
    
    // Add report interface to page
    const reportContainer = document.createElement('div');
    reportContainer.className = 'report-charts-container';
    
    // Add template for each chart needed for report
    const charts = [
      { id: 'assets-distribution', title: 'Underlying Assets\' Distribution' },
      { id: 'operator-concentration', title: 'Assets Concentration per Node Operator' },
      { id: 'operators-bar', title: 'AVS Secured per Operator with ES' },
      { id: 'curators-distribution', title: 'Curators\' asset distribution' },
      { id: 'geo-distribution', title: 'Geographical Distribution of Validators' }
    ];
    
    charts.forEach(chart => {
      const chartCard = document.createElement('div');
      chartCard.className = 'report-chart-card';
      
      const chartTitle = document.createElement('h3');
      chartTitle.textContent = chart.title;
      chartTitle.style.marginTop = '0';
      chartTitle.style.marginBottom = '15px';
      
      const canvas = document.createElement('canvas');
      canvas.id = `report-chart-${chart.id}`;
      canvas.className = 'report-chart-canvas';
      
      const exportBtn = document.createElement('button');
      exportBtn.className = 'report-export-btn';
      exportBtn.textContent = 'Export';
      exportBtn.onclick = () => ReportExporter.exportChartAsPNG(`report-chart-${chart.id}`, chart.id);
      
      chartCard.appendChild(chartTitle);
      chartCard.appendChild(canvas);
      chartCard.appendChild(exportBtn);
      reportContainer.appendChild(chartCard);
    });
    
    // Add the container to the page
    document.body.appendChild(reportContainer);
    
    return true;
  }
  
  /**
   * Generate all report charts for a network
   */
  static generateAllReportCharts(networkData) {
    // First create the interface if it doesn't exist
    if (!document.querySelector('.report-charts-container')) {
      this.initReportChartInterface();
    }
    
    // Generate each chart type
    this.createAssetsDistributionChart('report-chart-assets-distribution', networkData);
    this.createOperatorConcentrationChart('report-chart-operator-concentration', networkData);
    this.createOperatorsBarChart('report-chart-operators-bar', networkData);
    this.createCuratorsChart('report-chart-curators-distribution', networkData);
    this.createGeoDistributionChart('report-chart-geo-distribution', networkData);
  }
}