/**
 * Chart Configuration Manager
 * Manages available chart types and their configurations
 */
export default class ChartConfigManager {
    constructor() {
      this.chartTypes = this.getAvailableChartTypes();
    }
  
    /**
     * Get all available chart types
     * @returns {Array} Chart configurations
     */
    getAvailableChartTypes() {
      return [
        {
          id: 'collateral-distribution',
          name: 'Collateral Distribution',
          type: 'bar',
          dataPath: ['economic_security', 'collateral_distribution'],
          config: {
            labelKey: 'collateral_symbol',
            valueKey: 'usd_stake',
            title: 'USD Stake by Collateral'
          }
        },
        {
          id: 'operator-distribution',
          name: 'Operator Distribution',
          type: 'bar',
          dataPath: ['operators', 'stake_distribution'],
          config: {
            labelKey: 'label',
            valueKey: 'total_usd_stake',
            title: 'USD Stake by Operator'
          }
        },
        {
          id: 'vault-by-collateral',
          name: 'Vaults by Collateral',
          type: 'pie',
          dataPath: ['vault_configuration', 'by_collateral'],
          config: {
            labelKey: 'collateral_symbol',
            valueKey: 'vaults_count',
            title: 'Vault Count by Collateral Type'
          }
        },
        {
          id: 'operator-concentration',
          name: 'Operator Concentration',
          type: 'pie',
          dataPath: ['operators', 'concentration', 'top_5'],
          config: {
            // This would need custom data transformation
            labelKey: 'operator_count',
            valueKey: 'percentage',
            title: 'Top 5 Operators Concentration'
          }
        }
      ];
    }
  
    /**
     * Get chart configuration by ID
     * @param {string} chartId - Chart identifier
     * @returns {Object|null} Chart configuration
     */
    getChartConfig(chartId) {
      return this.chartTypes.find(chart => chart.id === chartId) || null;
    }
  }