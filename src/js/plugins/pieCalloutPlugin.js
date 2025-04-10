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
      
      // Get radius of the pie
      const outerRadius = element.outerRadius;
      
      // Starting point at the edge of the slice
      const startX = centerX + Math.cos(angle) * outerRadius;
      const startY = centerY + Math.sin(angle) * outerRadius;
      
      // Calculate the intermediate point (elbow of the line)
      const midPointRadius = outerRadius * 1.2;
      const midX = centerX + Math.cos(angle) * midPointRadius;
      const midY = centerY + Math.sin(angle) * midPointRadius;

      // Improved positioning logic for labels
      let finalLabelX, finalLabelY, textAlign, textBaseline;
      
      // Determine which quadrant we're in
      const isRightHalf = Math.cos(angle) >= 0;
      const isTopHalf = Math.sin(angle) <= 0;
      
      // Handle special cases for top and bottom positions
      const isNearVertical = Math.abs(Math.cos(angle)) < 0.15; // Within ~8.5 degrees of vertical
      const isNearHorizontal = Math.abs(Math.sin(angle)) < 0.15; // Within ~8.5 degrees of horizontal
      
      // Fixed distance from the midpoint
      const labelDistance = outerRadius * 0.3;
      
      if (isNearVertical) {
        // Nearly vertical (top or bottom slice)
        finalLabelX = midX;
        finalLabelY = midY + (isTopHalf ? -labelDistance : labelDistance);
        textAlign = 'center';
      } else if (isNearHorizontal) {
        // Nearly horizontal (left or right slice)
        finalLabelX = midX + (isRightHalf ? labelDistance : -labelDistance);
        finalLabelY = midY;
        textAlign = isRightHalf ? 'left' : 'right';
      } else {
        // Regular angled position
        const offsetX = Math.cos(angle) * labelDistance;
        const offsetY = Math.sin(angle) * labelDistance;
        
        finalLabelX = midX + offsetX * 1.5;
        finalLabelY = midY + offsetY * 1.5;
        textAlign = isRightHalf ? 'left' : 'right';
      }
      
      textBaseline = 'middle'; // Always center vertically
      
      // Boundary checks to keep labels within view
      finalLabelX = Math.max(labelArea.left, Math.min(finalLabelX, labelArea.right));
      finalLabelY = Math.max(labelArea.top, Math.min(finalLabelY, labelArea.bottom));

      // Draw line from slice to label with nice bezier curve
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      
      // Use quadratic curve for smoother line
      ctx.quadraticCurveTo(midX, midY, finalLabelX, finalLabelY);
      
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw label text
      ctx.font = '12px Arial, sans-serif';
      ctx.fillStyle = '#000000';
      ctx.textAlign = textAlign;
      ctx.textBaseline = textBaseline;
      
      // Add small circle at the end of the line
      ctx.beginPath();
      ctx.arc(finalLabelX, finalLabelY, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fill();
      
      // Position text with slight offset from the end point
      const textOffsetX = isRightHalf ? 8 : -8;
      const textX = finalLabelX + (textAlign === 'center' ? 0 : textOffsetX);
      
      ctx.fillStyle = '#000000';
      ctx.fillText(label, textX, finalLabelY);
      
      // Add percentage ONLY for small slices (<7%)
      if (percentage < 7) {
        const percentText = `${percentage.toFixed(1)}%`;
        ctx.font = '11px Arial, sans-serif';
        ctx.fillStyle = '#555555';
        
        // Position percentage text below or next to the label
        if (textAlign === 'center') {
          ctx.fillText(percentText, textX, finalLabelY + 15);
        } else {
          const labelWidth = ctx.measureText(label).width;
          const spacer = isRightHalf ? ' ' : '';
          ctx.fillText(`${spacer}(${percentText})`, textX + (isRightHalf ? labelWidth + 4 : -4), finalLabelY);
        }
      }
    });
    
    ctx.restore();
  }
};