// src/js/plugins/pieCalloutPlugin.js
export const PieCalloutPlugin = {
    id: 'pieCallouts',
    afterDraw: (chart) => {
      if (chart.options.plugins.pieCallouts?.enabled !== true) return;
      
      const { ctx, width, height } = chart;
      const meta = chart.getDatasetMeta(0);
      
      // Return if no meta data
      if (!meta || !meta.data || meta.data.length === 0) return;
      
      // Calculate center point
      const centerX = width / 2;
      const centerY = height / 2;
      
      // Get total value for percentage calculation
      const total = chart.data.datasets[0].data.reduce((sum, val) => sum + parseFloat(val), 0);
      
      // Get maximum outer radius
      const maxRadius = Math.min(centerX, centerY) * 0.85;
      
      // Track line directions for collision detection
      const placedLabels = [];
      
      ctx.save();
      
      // Define canvas area for label placement
      const padding = 30;
      const labelArea = {
        left: padding,
        top: padding,
        right: width - padding,
        bottom: height - padding
      };
      
      // Draw callout for each slice
      meta.data.forEach((element, i) => {
        const data = chart.data.datasets[0].data[i];
        if (!data) return;
        
        // Skip very small slices
        const percentage = (data / total) * 100;
        if (percentage < 1) return;
        
        const label = chart.data.labels[i];
        
        // Get angle at the middle of the slice
        const angle = element.startAngle + (element.endAngle - element.startAngle) / 2;
        
        // Calculate positions
        const outerRadius = element.outerRadius;
        
        // Starting point at the edge of the slice
        const startX = centerX + Math.cos(angle) * outerRadius;
        const startY = centerY + Math.sin(angle) * outerRadius;
        
        // Mid-point of the line
        const midDistance = maxRadius * 1.2;
        const midX = centerX + Math.cos(angle) * midDistance;
        const midY = centerY + Math.sin(angle) * midDistance;
        
        // Final label position
        let labelDistance = maxRadius * 1.3;
        let labelX = centerX + Math.cos(angle) * labelDistance;
        let labelY = centerY + Math.sin(angle) * labelDistance;
        
        // Adjust label position to stay within canvas
        if (labelX < labelArea.left) labelX = labelArea.left;
        if (labelX > labelArea.right) labelX = labelArea.right;
        if (labelY < labelArea.top) labelY = labelArea.top;
        if (labelY > labelArea.bottom) labelY = labelArea.bottom;
        
        // Draw line from slice to label
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(midX, midY);
        ctx.lineTo(labelX, labelY);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw label text
        ctx.font = '12px Arial';
        ctx.fillStyle = '#000000';
        ctx.textAlign = Math.cos(angle) > 0 ? 'left' : 'right';
        ctx.textBaseline = 'middle';
        
        // Adjust text position slightly based on angle quadrant
        const labelOffsetX = Math.cos(angle) > 0 ? 5 : -5;
        ctx.fillText(label, labelX + labelOffsetX, labelY);
        
        // Track positioned labels for collision detection
        placedLabels.push({ x: labelX, y: labelY, label, angle });
      });
      
      ctx.restore();
    }
  };