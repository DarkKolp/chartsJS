// src/js/plugins/pieChartLabelsPlugin.js
export const PieChartLabelsPlugin = {
    id: 'pieLabels',
    afterDraw: (chart) => {
      const { ctx, width, height } = chart;
      
      // Only apply this plugin if explicitly enabled for this chart
      if (!chart.options.plugins.pieLabels?.enabled) {
        return;
      }
      
      if (chart.config.type !== 'pie' && chart.config.type !== 'doughnut') {
        return;
      }
      
      // Get chart data
      const dataset = chart.data.datasets[0];
      const meta = chart.getDatasetMeta(0);
      const total = dataset.data.reduce((sum, value) => sum + value, 0);
      
      // Calculate center of chart
      const centerX = width / 2;
      const centerY = height / 2;
      
      // Get chart options
      const showLabels = chart.options.plugins.pieLabels?.show !== false;
      const showPercentages = chart.options.plugins.pieLabels?.showPercentages !== false;
      
      if (!showLabels && !showPercentages) return;
      
      ctx.save();
      
      // Draw text for each slice
      meta.data.forEach((element, index) => {
        const dataItem = dataset.data[index];
        if (!dataItem) return;
        
        const percentage = ((dataItem / total) * 100).toFixed(1);
        if (percentage < 1) return; // Skip very small slices
        
        // Get the center point of the slice
        const angle = element.startAngle + (element.endAngle - element.startAngle) / 2;
        
        // For labels, calculate position at 75% of radius for percentages inside
        const insideRadius = element.outerRadius * (chart.config.type === 'doughnut' ? 0.75 : 0.65);
        const insideX = centerX + Math.cos(angle) * insideRadius;
        const insideY = centerY + Math.sin(angle) * insideRadius;
        
        // For lines, calculate position outside the pie
        const labelRadius = element.outerRadius * 1.2;
        const labelX = centerX + Math.cos(angle) * labelRadius;
        const labelY = centerY + Math.sin(angle) * labelRadius;
        
        // Calculate optimal label position with slight offset based on quadrant
        const labelOffsetX = Math.cos(angle) * 15;
        const labelOffsetY = Math.sin(angle) * 15;
        const finalLabelX = labelX + labelOffsetX;
        const finalLabelY = labelY + labelOffsetY;
        
        // Draw percentage inside the slice if it's big enough
        if (showPercentages && percentage >= 3) {
          ctx.font = 'bold 12px Arial';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${percentage}%`, insideX, insideY);
        }
        
        // Draw label lines and text if enabled
        if (showLabels && percentage >= 2) {
          // Draw line from slice to label
          ctx.beginPath();
          ctx.moveTo(centerX + Math.cos(angle) * element.outerRadius, centerY + Math.sin(angle) * element.outerRadius);
          ctx.lineTo(labelX, labelY);
          ctx.lineTo(finalLabelX, finalLabelY);
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.lineWidth = 1;
          ctx.stroke();
          
          // Draw label text
          ctx.font = '11px Arial';
          ctx.fillStyle = '#000000';
          ctx.textAlign = Math.cos(angle) > 0 ? 'left' : 'right';
          ctx.textBaseline = 'middle';
          
          const label = chart.data.labels[index] || '';
          ctx.fillText(label, finalLabelX, finalLabelY);
        }
      });
      
      ctx.restore();
    }
  };