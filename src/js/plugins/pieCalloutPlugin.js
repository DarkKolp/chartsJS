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
      const midPointRadius = outerRadius * 1.15;
      const midX = centerX + Math.cos(angle) * midPointRadius;
      const midY = centerY + Math.sin(angle) * midPointRadius;

      // Determine label position based on angle
      let finalLabelX, finalLabelY, textAlign, textBaseline;
      const offsetMultiplier = 15;
      const finalOffsetX = Math.cos(angle) * offsetMultiplier;
      const finalOffsetY = Math.sin(angle) * offsetMultiplier;

      // Consistent horizontal alignment
      if (Math.cos(angle) >= 0) {
        // Right side of the chart
        finalLabelX = midX + finalOffsetX;
        textAlign = 'left';
      } else {
        // Left side of the chart
        finalLabelX = midX + finalOffsetX;
        textAlign = 'right';
      }

      // Vertical positioning
      finalLabelY = midY + finalOffsetY;
      textBaseline = 'middle';

      // Boundary checks
      finalLabelX = Math.max(labelArea.left, Math.min(finalLabelX, labelArea.right));
      finalLabelY = Math.max(labelArea.top, Math.min(finalLabelY, labelArea.bottom));

      // Draw line from slice to label
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(midX, midY);
      ctx.lineTo(finalLabelX, finalLabelY);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw label text
      ctx.font = '12px Arial';
      ctx.fillStyle = '#000000';
      ctx.textAlign = textAlign;
      ctx.textBaseline = textBaseline;
      
      ctx.fillText(label, finalLabelX, finalLabelY);
    });
    
    ctx.restore();
  }
};