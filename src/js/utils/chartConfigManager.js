/**
 * Updated ChartConfigManager with category structure
 */
export default class ChartConfigManager {
  constructor() {
    this.chartTypes = this.getAvailableChartTypes();
    this.categories = this.organizeCategorizedCharts();
  }

  /**
   * Get all available chart types
   * @returns {Array} Chart configurations
   */
  getAvailableChartTypes() {
    return [
      // Vault charts
      {
        id: 'vaults-by-collateral',
        name: 'Vaults by Collateral',
        type: 'pie',
        category: 'vaults',
        dataPath: ['vault_configuration', 'by_collateral'],
        config: {
          labelKey: 'collateral_symbol',
          valueKey: 'vaults_count',
          title: 'Vault Count by Collateral Type'
        }
      },
      {
        id: 'vault-utilization',
        name: 'Vault Utilization',
        type: 'progress-multiple',
        category: 'vaults',
        dataPath: ['economic_security', 'by_collateral'],
        config: {
          dataKey: 'vaults',
          title: 'Vault Utilization'
        }
      },
      {
        id: 'vault-configuration',
        name: 'Vault Configuration',
        type: 'bar',
        category: 'vaults',
        dataPath: ['vault_configuration', 'by_collateral'],
        config: {
          labelKey: 'collateral_symbol',
          valueKey: 'vaults_count',
          title: 'Vault Configuration by Collateral'
        }
      },
      
      // Operator charts
      {
        id: 'operator-distribution',
        name: 'Operator Distribution',
        type: 'bar',
        category: 'operators',
        dataPath: ['operators', 'stake_distribution'],
        config: {
          labelKey: 'label',
          valueKey: 'total_usd_stake',
          title: 'USD Stake by Operator'
        }
      },
      {
        id: 'operator-concentration',
        name: 'Operator Concentration',
        type: 'pie',
        category: 'operators',
        dataPath: ['operators', 'concentration', 'top_5'],
        config: {
          labelKey: 'operator_count',
          valueKey: 'percentage',
          title: 'Top 5 Operators Concentration'
        }
      },
      {
        id: 'operator-details',
        name: 'Operator Details',
        type: 'bar',
        category: 'operators',
        dataPath: ['operators', 'operator_details'],
        config: {
          labelKey: 'label',
          valueKey: 'operator_id',
          title: 'Operator Details'
        }
      },
      
      // Collateral charts
      {
        id: 'collateral-distribution',
        name: 'Collateral Distribution',
        type: 'pie',  // Changed from 'bar' to 'pie'
        category: 'collateral',
        dataPath: ['economic_security', 'collateral_distribution'],
        config: {
          labelKey: 'collateral_symbol',
          valueKey: 'percentage',  // Using percentage directly as it's already available
          title: 'Collateral Distribution'
        }
      },
      {
        id: 'collateral-utilization',
        name: 'Collateral Utilization',
        type: 'progress',
        category: 'collateral',
        dataPath: ['economic_security', 'by_collateral'],
        config: {
          labelKey: 'collateral_symbol',
          valueKey: 'utilization_percent',
          title: 'Collateral Utilization'
        }
      },
      {
        id: 'collateral-types',
        name: 'Collateral Types',
        type: 'pie',
        category: 'collateral',
        dataPath: ['economic_security', 'by_collateral'],
        config: {
          customTransform: true,
          labelKey: 'collateral_symbol',  // This should match your returned property
          valueKey: 'percentage',         // This should match your returned property
          title: 'Collateral Types by Underlying Asset'
        }
      },
      
      // Curator charts
      {
        id: 'curator-distribution',
        name: 'Curator Distribution',
        type: 'bar',
        category: 'curators',
        dataPath: ['vault_configuration', 'curator_stats'],
        config: {
          customTransform: true, // Need custom transform for curator stats
          title: 'Vault Distribution by Curator'
        }
      },
      {
        id: 'curator-collateral',
        name: 'Curator Collateral',
        type: 'pie',
        category: 'curators',
        dataPath: ['vault_configuration', 'curator_stats'],
        config: {
          customTransform: true, // Need custom transform for curator stats
          title: 'Collateral Types by Curator'
        }
      }
    ];
  }

  /**
   * Organize charts by category
   * @returns {Object} - Charts organized by category
   */
  organizeCategorizedCharts() {
    const categories = {
      vaults: {
        name: 'Vaults',
        charts: []
      },
      operators: {
        name: 'Operators',
        charts: []
      },
      collateral: {
        name: 'Collateral',
        charts: []
      },
      curators: {
        name: 'Curators',
        charts: []
      }
    };
    
    // Group charts by category
    this.chartTypes.forEach(chart => {
      if (chart.category && categories[chart.category]) {
        categories[chart.category].charts.push(chart);
      }
    });
    
    return categories;
  }

  /**
   * Get chart configuration by ID
   * @param {string} chartId - Chart identifier
   * @returns {Object|null} Chart configuration
   */
  getChartConfig(chartId) {
    return this.chartTypes.find(chart => chart.id === chartId) || null;
  }
  
  /**
   * Get all chart categories
   * @returns {Object} Categories with their charts
   */
  getCategories() {
    return this.categories;
  }
  
  /**
   * Get charts for a specific category
   * @param {string} categoryId - Category identifier
   * @returns {Array} Charts in the category
   */
  getChartsByCategory(categoryId) {
    return (this.categories[categoryId] || {}).charts || [];
  }
}