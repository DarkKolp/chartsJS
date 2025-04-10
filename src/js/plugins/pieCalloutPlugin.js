export const PieCalloutPlugin = {
  id: 'pieCallouts',
  afterDraw: (chart) => {
    if (chart.options.plugins.pieCallouts?.enabled !== true) return;
    
    const { ctx, width, height } = chart;
    const meta = chart.getDatasetMeta(0);
    
    if (!meta || !meta.data || meta.data.length === 0) return;
    
    const centerX = width / 2;
    const centerY = height / 2;
    
    const total = chart.data.datasets[0].data.reduce((sum, val) => sum + parseFloat(val), 0);
    
    ctx.save();
    
    const padding = 15;
    const labelArea = {
      left: padding,
      top: padding,
      right: width - padding,
      bottom: height - padding
    };
    
    // First pass: collect all label positions to avoid overlaps
    const labelPositions = [];
    
    meta.data.forEach((element, i) => {
      const data = chart.data.datasets[0].data[i];
      if (!data) return;
      
      const percentage = (data / total) * 100;
      if (percentage < 1) return;
      
      const label = chart.data.labels[i];
      const angle = element.startAngle + (element.endAngle - element.startAngle) / 2;
      
      // Store this angle and slice info for the second pass
      labelPositions.push({
        index: i,
        label,
        angle,
        percentage
      });
    });
    
    // Sort by angle for more predictable positioning
    labelPositions.sort((a, b) => a.angle - b.angle);
    
    // Second pass: draw the callouts with adjusted positions
    labelPositions.forEach(({ index, label, angle, percentage }) => {
      const element = meta.data[index];
      const outerRadius = element.outerRadius;
      
      // Starting point at the edge of the slice
      const startX = centerX + Math.cos(angle) * outerRadius;
      const startY = centerY + Math.sin(angle) * outerRadius;
      
      const midPointRadius = outerRadius * 1.05;
      const midX = centerX + Math.cos(angle) * midPointRadius;
      const midY = centerY + Math.sin(angle) * midPointRadius;

      let finalLabelX, finalLabelY, textAlign;
      
      const isRightHalf = Math.cos(angle) >= 0;
      const isTopHalf = Math.sin(angle) <= 0;
      
      // IMPORTANT: Force all small slices (< 5%) to use side positioning instead of top/bottom
      const isNearVertical = Math.abs(Math.cos(angle)) < 0.15 && percentage >= 5;
      const isNearHorizontal = Math.abs(Math.sin(angle)) < 0.15 && percentage >= 5;
      
      const labelDistance = outerRadius * 0.22;
      
      if (isNearVertical) {
        finalLabelX = midX;
        finalLabelY = midY + (isTopHalf ? -labelDistance * 1.5 : labelDistance * 1.5);
        textAlign = 'center';
      } else if (isNearHorizontal) {
        finalLabelX = midX + (isRightHalf ? labelDistance : -labelDistance);
        finalLabelY = midY;
        textAlign = isRightHalf ? 'left' : 'right';
      } else {
        // For all other slices and small slices, use angled positioning
        const offsetX = Math.cos(angle) * labelDistance;
        const offsetY = Math.sin(angle) * labelDistance;
        
        // Increase multiplier slightly for more consistent spacing
        finalLabelX = midX + offsetX * 1.4;
        finalLabelY = midY + offsetY * 1.4;
        textAlign = isRightHalf ? 'left' : 'right';
      }
      
      finalLabelX = Math.max(labelArea.left, Math.min(finalLabelX, labelArea.right));
      finalLabelY = Math.max(labelArea.top, Math.min(finalLabelY, labelArea.bottom));

      // Draw line
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(midX, midY, finalLabelX, finalLabelY);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Endpoint circle
      ctx.beginPath();
      ctx.arc(finalLabelX, finalLabelY, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fill();
      
      // Additional padding between the line endpoint and text
      const textPadding = 10;
      const textOffsetX = isRightHalf ? textPadding : -textPadding;
      const textX = finalLabelX + (textAlign === 'center' ? 0 : textOffsetX);
      
      // Draw label text
      ctx.font = '12px Arial, sans-serif';
      ctx.fillStyle = '#000000';
      ctx.textAlign = textAlign;
      ctx.textBaseline = 'middle';
      
      // Format small percentages and add to label
      let displayText = label;
      if (percentage < 7) {
        displayText = `${label} (${percentage.toFixed(1)}%)`;
      }
      
      ctx.fillText(displayText, textX, finalLabelY);
    });
    
    ctx.restore();
  }
};