// src/js/plugins/pieCalloutPlugin.js
export const PieCalloutPlugin = {
  id: 'pieCallouts',
  afterDraw: (chart) => {
    // Check if the plugin is enabled for this chart
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
      
      // Calculate positions based on element's radius
      const outerRadius = element.outerRadius;
      
      // Starting point at the edge of the slice
      const startX = centerX + Math.cos(angle) * outerRadius;
      const startY = centerY + Math.sin(angle) * outerRadius;
      
      // Calculate the intermediate point (elbow of the line)
      const midPointRadius = outerRadius * 1.15; // Extend 15% (can adjust)
      const midX = centerX + Math.cos(angle) * midPointRadius;
      const midY = centerY + Math.sin(angle) * midPointRadius;

      // Calculate the offset for the final text position
      const offsetMultiplier = 15; // Controls length of the final line segment
      const finalOffsetX = Math.cos(angle) * offsetMultiplier;
      const finalOffsetY = Math.sin(angle) * offsetMultiplier;

      // Calculate final label position
      let finalLabelX = midX + finalOffsetX;
      let finalLabelY = midY + finalOffsetY;

      // Adjust final label position to stay within canvas boundary
      let textAlign = Math.cos(angle) >= 0 ? 'left' : 'right';
      let textBaseline = 'middle';

      if (finalLabelX < labelArea.left) {
        finalLabelX = labelArea.left;
        textAlign = 'left';
      }
      if (finalLabelX > labelArea.right) {
        finalLabelX = labelArea.right;
        textAlign = 'right';
      }
      if (finalLabelY < labelArea.top) {
        finalLabelY = labelArea.top;
        textBaseline = 'top';
      }
      if (finalLabelY > labelArea.bottom) {
        finalLabelY = labelArea.bottom;
        textBaseline = 'bottom';
      }
      
      // Draw line from slice to label
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(midX, midY); // Line to the elbow
      ctx.lineTo(finalLabelX, finalLabelY); // Line to the text position
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw label text
      ctx.font = '12px Arial';
      ctx.fillStyle = '#000000';
      ctx.textAlign = textAlign; // Use potentially adjusted alignment
      ctx.textBaseline = textBaseline; // Use potentially adjusted baseline
      
      ctx.fillText(label, finalLabelX, finalLabelY); // Draw text at the final calculated position
      
      // Track positioned labels (optional, for future collision handling)
      placedLabels.push({ x: finalLabelX, y: finalLabelY, label, angle });
    });
    
    ctx.restore();
  }
};