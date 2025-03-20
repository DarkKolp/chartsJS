/**
 * Chart Factory with company branding
 */
export default class ChartFactory {
  /**
   * Company brand colors
   */
  static brandColors = {
    primary: {
      blue: 'rgba(82, 113, 255, 1)',
      lightBlue: 'rgba(179, 186, 255, 1)',
      purple: 'rgba(149, 117, 205, 1)',
      lightPurple: 'rgba(208, 195, 240, 1)'
    },
    accent: {
      cyan: 'rgba(82, 196, 226, 1)', 
      red: 'rgba(255, 99, 132, 1)',
      orange: 'rgba(255, 159, 64, 1)',
      pink: 'rgba(255, 130, 204, 1)'
    },
    text: {
      dark: '#333333',
      gray: '#666666',
      light: '#999999'
    },
    background: {
      light: '#f5f7fa',
      white: '#ffffff'
    }
  };

  /**
   * Create a new chart with company branding
   */
  static create(canvasId, type, data, options = {}) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Default options that apply to all charts with company branding
    const defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            font: {
              family: "'Segoe UI', sans-serif",
              size: 12
            },
            color: this.brandColors.text.dark
          }
        },
        tooltip: {
          backgroundColor: this.brandColors.background.white,
          titleColor: this.brandColors.text.dark,
          bodyColor: this.brandColors.text.gray,
          borderColor: this.brandColors.primary.lightBlue,
          borderWidth: 1,
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += new Intl.NumberFormat('en-US', { 
                  style: 'currency', 
                  currency: 'USD',
                  maximumFractionDigits: 0
                }).format(context.parsed.y);
              }
              return label;
            }
          }
        }
      },
      elements: {
        line: {
          tension: 0.4
        }
      }
    };
    
    // Merge default options with custom options
    const mergedOptions = { ...defaultOptions, ...options };
    
    return new Chart(ctx, {
      type,
      data,
      options: mergedOptions
    });
  }
  
  /**
   * Get brand pie chart colors
   */
  static getPieChartColors() {
    return {
      backgroundColor: [
        this.brandColors.primary.blue,
        this.brandColors.primary.purple,
        this.brandColors.primary.lightBlue,
        this.brandColors.primary.lightPurple
      ],
      borderColor: this.brandColors.background.white,
      borderWidth: 2
    };
  }
  
  /**
   * Get stacked bar chart colors
   */
  static getStackedBarColors() {
    return [
      this.brandColors.primary.blue,
      this.brandColors.accent.cyan,
      this.brandColors.accent.red,
      this.brandColors.accent.orange,
      this.brandColors.accent.pink
    ];
  }
}