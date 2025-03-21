import { ChartInteractionPlugin } from '../plugins/chartInteractionPlugin.js';
/**
 * Chart Factory with updated branding
 */
export default class ChartFactory {
  /**
   * Company brand colors - updated to match mockups
   */
  static brandColors = {
    primary: {
      purple: 'rgba(130, 71, 229, 1)',
      lightPurple: 'rgba(164, 102, 246, 1)',
      blue: 'rgba(59, 130, 246, 1)',
      darkPurple: 'rgba(93, 37, 203, 1)'
    },
    gradient: {
      purpleStart: 'rgba(130, 71, 229, 0.8)',
      purpleEnd: 'rgba(164, 102, 246, 0.2)',
      blueStart: 'rgba(59, 130, 246, 0.8)',
      blueEnd: 'rgba(59, 130, 246, 0.2)'
    },
    accent: {
      teal: 'rgba(20, 184, 166, 1)', 
      red: 'rgba(244, 63, 94, 1)',
      orange: 'rgba(249, 115, 22, 1)',
      pink: 'rgba(236, 72, 153, 1)'
    },
    text: {
      dark: '#1E293B',
      gray: '#64748B',
      light: '#94A3B8'
    },
    background: {
      light: '#F8FAFC',
      white: '#FFFFFF',
      card: '#F1F5F9'
    }
  };

  /**
   * Create a new chart with updated company branding
   */
  static create(canvasId, type, data, options = {}) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Default options that apply to all charts with updated branding
    const defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right', // Better for pie charts
          align: 'start',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 8,
            boxHeight: 8,
            padding: 15,
            // Truncate long labels
            generateLabels: function(chart) {
              const original = Chart.defaults.plugins.legend.labels.generateLabels(chart);
              original.forEach(label => {
                if (label.text.length > 25) {
                  label.text = label.text.substring(0, 22) + '...';
                }
              });
              return original;
            }
          }
        },
        layout: {
          padding: {
            // Dynamic padding based on screen size
            top: window.innerWidth < 768 ? 10 : 20,
            right: window.innerWidth < 768 ? 10 : 20,
            bottom: window.innerWidth < 768 ? 10 : 20,
            left: window.innerWidth < 768 ? 10 : 20
          }
        },     
        tooltip: {
          backgroundColor: this.brandColors.background.white,
          titleColor: this.brandColors.text.dark,
          bodyColor: this.brandColors.text.gray,
          bodyFont: {
            family: "'Inter', 'Segoe UI', sans-serif",
            size: 12
          },
          titleFont: {
            family: "'Inter', 'Segoe UI', sans-serif",
            size: 14,
            weight: '600'
          },
          borderColor: this.brandColors.primary.lightPurple,
          borderWidth: 1,
          cornerRadius: 8,
          padding: 12,
          boxPadding: 6,
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
        },
        accessibility: {
          enabled: true,
          description: 'Chart displaying network metrics',
          focusBorder: {
            color: 'rgba(130, 71, 229, 0.8)',
            width: 2
          }
        }
      },
      elements: {
        line: {
          tension: 0.4,
          borderWidth: 2
        },
        point: {
          radius: 0,
          hoverRadius: 6
        },
        bar: {
          borderRadius: 6
        }
      },
      scales: {
        x: {
          grid: {
            display: false,
            drawBorder: false
          },
          ticks: {
            padding: 10,
            font: {
              family: "'Inter', 'Segoe UI', sans-serif",
              size: 12
            },
            color: this.brandColors.text.gray
          }
        },
        y: {
          grid: {
            color: 'rgba(226, 232, 240, 0.6)',
            drawBorder: false
          },
          ticks: {
            padding: 10,
            font: {
              family: "'Inter', 'Segoe UI', sans-serif",
              size: 12
            },
            color: this.brandColors.text.gray,
            callback: function(value) {
              if (value >= 1000000) {
                return '$' + (value / 1000000).toFixed(1) + 'M';
              } else if (value >= 1000) {
                return '$' + (value / 1000).toFixed(1) + 'K';
              }
              return '$' + value;
            }
          }
        }
      }
    };
    
    // Merge default options with custom options
    const mergedOptions = this.mergeDeep({ ...defaultOptions }, options);
    
    // Create gradient for line/area charts
    if (type === 'line') {
      data.datasets.forEach((dataset, index) => {
        // Create gradient fill for area charts
        if (dataset.fill !== false) {
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          const colorIndex = index % 4;
          let gradientStart, gradientEnd;
          
          if (colorIndex === 0) {
            gradientStart = this.brandColors.gradient.purpleStart;
            gradientEnd = this.brandColors.gradient.purpleEnd;
          } else if (colorIndex === 1) {
            gradientStart = this.brandColors.gradient.blueStart;
            gradientEnd = this.brandColors.gradient.blueEnd;
          } else if (colorIndex === 2) {
            gradientStart = this.hexToRgba(this.brandColors.accent.teal, 0.8);
            gradientEnd = this.hexToRgba(this.brandColors.accent.teal, 0.1);
          } else {
            gradientStart = this.hexToRgba(this.brandColors.accent.pink, 0.8);
            gradientEnd = this.hexToRgba(this.brandColors.accent.pink, 0.1);
          }
          
          gradient.addColorStop(0, gradientStart);
          gradient.addColorStop(1, gradientEnd);
          dataset.backgroundColor = gradient;
        }
      });
    }
    
    return new Chart(ctx, {
      type,
      data,
      options: mergedOptions,
      plugins: [ChartInteractionPlugin]
    });
  }
  
  /**
   * Helper to convert hex to rgba
   */
  static hexToRgba(hex, alpha = 1) {
    const [r, g, b] = hex.match(/\w\w/g).map(x => parseInt(x, 16));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  
  /**
   * Deep merge of objects
   */
  static mergeDeep(target, source) {
    const isObject = obj => obj && typeof obj === 'object';
    
    if (!isObject(target) || !isObject(source)) {
      return source;
    }
    
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        this.mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    });
    
    return target;
  }
  
  /**
   * Generate colors for datasets
   * @param {number} count - Number of colors to generate
   * @returns {Object} Background and border colors
   */
  static generateColors(count) {
    const backgroundColor = [];
    const borderColor = [];
    
    const primaryColors = [
      this.brandColors.primary.purple,
      this.brandColors.primary.blue,
      this.brandColors.primary.lightPurple,
      this.brandColors.primary.darkPurple
    ];
    
    const accentColors = [
      this.brandColors.accent.teal,
      this.brandColors.accent.red,
      this.brandColors.accent.orange,
      this.brandColors.accent.pink
    ];
    
    const allColors = [...primaryColors, ...accentColors];
    
    for (let i = 0; i < count; i++) {
      const color = allColors[i % allColors.length];
      backgroundColor.push(color);
      
      // Create a slightly darker version for borders
      if (typeof color === 'string' && color.startsWith('rgba')) {
        const borderColorMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*(\d*\.?\d*)\)/);
        if (borderColorMatch) {
          const [, r, g, b, a] = borderColorMatch;
          borderColor.push(`rgba(${Math.max(0, r-20)}, ${Math.max(0, g-20)}, ${Math.max(0, b-20)}, ${a})`);
        } else {
          borderColor.push(color);
        }
      } else {
        borderColor.push(color);
      }
    }
    
    return { backgroundColor, borderColor };
  }

  /**
   * Get brand pie chart colors
   */
  static getPieChartColors() {
    return {
      backgroundColor: [
        this.brandColors.primary.purple,
        this.brandColors.primary.blue,
        this.brandColors.primary.lightPurple,
        this.brandColors.accent.teal,
        this.brandColors.accent.red,
        this.brandColors.accent.orange,
        this.brandColors.primary.darkPurple,
        this.brandColors.accent.pink
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
      this.brandColors.primary.purple,
      this.brandColors.primary.blue,
      this.brandColors.accent.teal,
      this.brandColors.accent.red,
      this.brandColors.accent.orange
    ];
  }
  
  /**
   * Create a line chart with area fill
   */
  static createAreaChart(canvasId, data, options = {}) {
    // Set fill to true for all datasets
    data.datasets.forEach(dataset => {
      dataset.fill = true;
    });
    
    // Apply custom styling for area charts
    const areaOptions = {
      elements: {
        line: {
          tension: 0.4,
          borderWidth: 2
        },
        point: {
          radius: 0,
          hoverRadius: 6
        }
      }
    };
    
    return this.create(canvasId, 'line', data, { ...areaOptions, ...options });
  }
}