export const PieChartLabelsPlugin = {
  id: 'pieLabels',
  afterDraw: (chart) => {
    // Only apply this plugin if explicitly enabled and for the correct chart type
    if (!chart.options.plugins.pieLabels?.enabled || 
        chart.config.type !== 'pie') {
      return;
    }
    
    const { ctx, width, height } = chart;
    const dataset = chart.data.datasets[0];
    const meta = chart.getDatasetMeta(0);
    const total = dataset.data.reduce((sum, value) => sum + value, 0);
    
    const centerX = width / 2;
    const centerY = height / 2;
    
    ctx.save();
    
    // Draw text for each slice
    meta.data.forEach((element, index) => {
      const dataItem = dataset.data[index];
      if (!dataItem) return;
      
      const percentage = ((dataItem / total) * 100).toFixed(1);
      if (percentage < 1) return; // Skip very small slices
      
      // Get the center point of the slice
      const angle = element.startAngle + (element.endAngle - element.startAngle) / 2;
      
      // Calculate positions
      const insideRadius = element.outerRadius * 0.7;
      const insideX = centerX + Math.cos(angle) * insideRadius;
      const insideY = centerY + Math.sin(angle) * insideRadius;
      
      // Draw percentage inside the slice if it's big enough
      if (percentage >= 3) {
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${percentage}%`, insideX, insideY);
      }
    });
    
    ctx.restore();
  }
};