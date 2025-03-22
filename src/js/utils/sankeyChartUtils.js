// WITH THIS COMMENT (no imports needed):
// D3 and d3-sankey are loaded from CDN as global variables
import ChartExportUtils from './chartExportUtils.js';

export default class SankeyChartUtils {
  /**
   * Create a Sankey diagram for operator collateral flows
   * @param {string} containerId - Container element ID
   * @param {Object} networkData - Network data
   * @returns {Object} - Created visualization references
   */
  static createOperatorCollateralSankey(containerId, networkData) {
    const container = document.getElementById(containerId);
    if (!container) return null;
    
    // Clear existing content
    container.innerHTML = '';
    
    // Create SVG container with specified dimensions
    const margin = {top: 20, right: 150, bottom: 20, left: 150};
    const width = Math.max(800, container.clientWidth - margin.left - margin.right);
    const height = 560 - margin.top - margin.bottom;
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Create tooltip div
    const tooltip = d3.select(container)
      .append('div')
      .attr('class', 'sankey-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background-color', 'white')
      .style('border', '1px solid #ddd')
      .style('border-radius', '4px')
      .style('padding', '8px')
      .style('pointer-events', 'none')
      .style('font-size', '12px')
      .style('z-index', 1000);
    
    // Add export button
    const exportBtn = document.createElement('button');
    exportBtn.className = 'chart-export-btn';
    exportBtn.textContent = 'Export as PNG';
    exportBtn.style.position = 'absolute';
    exportBtn.style.top = '10px';
    exportBtn.style.right = '10px';
    exportBtn.onclick = () => this.exportSankeyAsPNG(containerId);
    container.appendChild(exportBtn);
    
    // Prepare data
    const nodes = [];
    const links = [];
    
    // Process operators data for left side nodes
    const operatorData = networkData.operators.stake_distribution;
    
    // Sort operators by stake for better visualization
    operatorData.sort((a, b) => b.total_usd_stake - a.total_usd_stake);
    
    // Add operator nodes
    operatorData.forEach((operator, index) => {
      nodes.push({
        id: `operator-${index}`,
        name: operator.label,
        category: 'operator',
        value: operator.total_usd_stake
      });
      
      // Process collateral stakes
      Object.entries(operator.stakes_by_collateral).forEach(([collateralType, stakeInfo]) => {
        // Find or create collateral node
        let collateralIndex = nodes.findIndex(n => n.name === collateralType && n.category === 'collateral');
        if (collateralIndex === -1) {
          collateralIndex = nodes.length;
          nodes.push({
            id: `collateral-${collateralType}`,
            name: collateralType,
            category: 'collateral',
            value: 0 // Will accumulate
          });
        }
        
        // Add link between operator and collateral
        links.push({
          source: `operator-${index}`,
          target: `collateral-${collateralType}`,
          value: stakeInfo.usd_stake,
          sourceName: operator.label,
          targetName: collateralType,
          usdValue: stakeInfo.usd_stake
        });
      });
    });
    
    // Format data for d3-sankey
    const graph = {
      nodes: nodes,
      links: links
    };
    
    // Set up colors based on your existing palette
    const operatorColor = '#5271FF'; // Blue
    const collateralColors = {
      'wstETH': '#7B61FF',    // Purple
      'WBTC': '#F7931A',      // Bitcoin orange
      'LBTC': '#F7931A',      // Bitcoin orange (same as WBTC)
      'swETH': '#A78BFA',     // Light purple
      'cbETH': '#00A3FF',     // Light blue
      'lvlwaUSDC': '#2775CA', // USDC blue
      'lvlwaUSDT': '#26A17B', // USDT green
      'wBETH': '#9061FF',     // Another purple shade
      'osETH': '#7B61FF',     // Purple
      'rETH': '#F472B6'       // Pink
    };
    
    // Create sankey generator
    const sankeyGenerator = d3.sankey()
      .nodeId(d => d.id)
      .nodeWidth(20)
      .nodePadding(10)
      .extent([[0, 0], [width, height]]);
    
    // Generate layout
    const {nodes: sankeyNodes, links: sankeyLinks} = sankeyGenerator(graph);
    
    // Draw the links
    const link = svg.append('g')
      .selectAll('path')
      .data(sankeyLinks)
      .enter()
      .append('path')
      .attr('d', d3.sankeyLinkHorizontal())
      .attr('stroke', d => {
        // Get color based on target (collateral type)
        const collateralName = d.target.name;
        return collateralColors[collateralName] || '#aaa';
      })
      .attr('stroke-width', d => Math.max(1, d.width))
      .attr('fill', 'none')
      .attr('opacity', 0.7)
      .on('mouseover', function(event, d) {
        // Highlight on hover
        d3.select(this)
          .attr('opacity', 1)
          .attr('stroke-width', d => Math.max(1, d.width + 2));
          
        // Show tooltip
        const formattedValue = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0
        }).format(d.value);
        
        tooltip.transition()
          .duration(200)
          .style('opacity', 0.9);
          
        tooltip.html(`
          <strong>${d.sourceName}</strong> → <strong>${d.targetName}</strong><br/>
          Stake: ${formattedValue}
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function() {
        // Reset on mouseout
        d3.select(this)
          .attr('opacity', 0.7)
          .attr('stroke-width', d => Math.max(1, d.width));
          
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });
    
    // Draw the nodes
    const node = svg.append('g')
      .selectAll('rect')
      .data(sankeyNodes)
      .enter()
      .append('rect')
      .attr('x', d => d.x0)
      .attr('y', d => d.y0)
      .attr('height', d => d.y1 - d.y0)
      .attr('width', d => d.x1 - d.x0)
      .attr('fill', d => {
        // Color based on node type
        if (d.category === 'operator') {
          return operatorColor;
        } else {
          return collateralColors[d.name] || '#aaa';
        }
      })
      .attr('stroke', '#000')
      .attr('opacity', 0.8);
    
    // Add node labels
    const nodeLabels = svg.append('g')
      .selectAll('text')
      .data(sankeyNodes)
      .enter()
      .append('text')
      .attr('x', d => d.category === 'operator' ? d.x0 - 8 : d.x1 + 8)
      .attr('y', d => (d.y1 + d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', d => d.category === 'operator' ? 'end' : 'start')
      .text(d => {
        // Format the label
        const name = d.name;
        const value = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          notation: 'compact',
          compactDisplay: 'short',
          maximumFractionDigits: 1
        }).format(d.value);
        
        return `${name} | ${value}`;
      })
      .style('font-size', '12px')
      .style('font-weight', '500')
      .style('fill', '#1E293B');
    
    // Register with our export utility
    ChartExportUtils.registerChart(containerId, {
      canvas: svg.node().parentNode, // The SVG element
      type: 'svg', // Mark as SVG for special handling
      // Custom export method for SVG
      toDataURL: (type, quality) => {
        // Convert SVG to data URL
        const svgNode = svg.node().parentNode;
        const serializer = new XMLSerializer();
        let source = serializer.serializeToString(svgNode);
        
        // Add XML declaration
        source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
        
        // Convert SVG to data URL
        const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);
        return url;
      }
    });
    
    return {
      svg: svg,
      container: container,
      tooltip: tooltip
    };
  }
  
  /**
   * Export Sankey diagram as PNG
   * @param {string} containerId - Container element ID
   */
  static exportSankeyAsPNG(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Use html2canvas for the export
    if (!window.html2canvas) {
      console.error('html2canvas is required for SVG export');
      alert('Export library not available. Please include html2canvas.');
      return;
    }
    
    // Add temporary class for export
    container.classList.add('exporting');
    
    // Use html2canvas to capture the SVG and its styling
    html2canvas(container, {
      scale: 3, // Higher resolution
      backgroundColor: '#ffffff',
      logging: false,
      allowTaint: true,
      useCORS: true
    }).then(canvas => {
      // Create download link
      const link = document.createElement('a');
      link.download = 'operator-allocation-sankey.png';
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      
      // Remove temporary class
      container.classList.remove('exporting');
    }).catch(error => {
      console.error('Error exporting Sankey diagram:', error);
      container.classList.remove('exporting');
    });
  }
}