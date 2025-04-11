/**
 * Chart.js Plugin for Pie Chart Callout Lines and Labels
 *
 * This plugin draws lines extending from pie chart slices
 * to labels positioned outside the chart, attempting to
 * avoid overlaps.
 * V8: Keep vertical line but place text to the RIGHT for 'Others' near top.
 */
export const PieCalloutPlugin = {
  // Plugin ID
  id: 'pieCallouts',

  // Hook that runs after the chart datasets have been drawn
  afterDraw: (chart) => {
    // Check if the plugin is enabled in chart options
    if (chart.options.plugins.pieCallouts?.enabled !== true) return;

    // Get chart context and dimensions
    const { ctx, width, height } = chart;
    // Get metadata for the first dataset (assuming a pie/doughnut chart)
    const meta = chart.getDatasetMeta(0);

    // Exit if there's no data or metadata
    if (!meta || !meta.data || meta.data.length === 0) return;

    // Calculate chart center coordinates
    const centerX = width / 2;
    const centerY = height / 2;

    // Calculate the total value of the dataset for percentage calculation
    const total = chart.data.datasets[0].data.reduce((sum, val) => sum + parseFloat(val), 0);

    // Save the current canvas context state
    ctx.save();

    // Define padding around the chart area to constrain label positions
    const padding = 15;
    const labelArea = {
      left: padding,
      top: padding,
      right: width - padding,
      bottom: height - padding
    };

    // --- First Pass: Collect Label Information ---
    const labelPositions = [];
    meta.data.forEach((element, i) => {
      const data = chart.data.datasets[0].data[i];
      if (!data) return;
      const percentage = (data / total) * 100;

      const label = chart.data.labels[i];
      const angle = element.startAngle + (element.endAngle - element.startAngle) / 2;

      labelPositions.push({
        index: i, label, angle, percentage
      });
    });

    // Sort labels by angle
    labelPositions.sort((a, b) => a.angle - b.angle);

    // --- Second Pass: Calculate Positions and Draw Callouts ---
    labelPositions.forEach(({ index, label, angle, percentage }) => {
      // Skip drawing callout for very small slices if desired (e.g., < 1%)
      if (percentage < 1 && !label.startsWith('Others')) return;

      const element = meta.data[index];
      const outerRadius = element.outerRadius;

      // --- Calculate Line Points ---
      const startX = centerX + Math.cos(angle) * outerRadius;
      const startY = centerY + Math.sin(angle) * outerRadius;

      const midPointRadius = outerRadius * 1.05;
      const midX = centerX + Math.cos(angle) * midPointRadius;
      const midY = centerY + Math.sin(angle) * midPointRadius;

      let finalLabelX, finalLabelY, initialTextAlign; // Store alignment determined by line endpoint logic

      const isRightHalf = Math.cos(angle) >= 0; // Used for default angled text align
      const isTopHalf = Math.sin(angle) <= 0; // Y=0 is top in canvas

      // --- Determine Label Positioning Strategy ---
      const isNearVertical = Math.abs(Math.cos(angle)) < 0.15 && percentage >= 5;
      const isNearHorizontal = Math.abs(Math.sin(angle)) < 0.15 && percentage >= 5;

      const labelDistance = outerRadius * 0.05; // Distance from the pie chart to the label
      const standardVerticalMultiplier = 1.3;
      const angledMultiplier = 1.2;
      const othersVerticalMultiplier = 2.0; // Keep pushing 'Others' further vertically

      // Check if the 'Others' label is near the top (used later for text override)
      const isTopOthersNearVertical = label.startsWith('Others') && isTopHalf && Math.abs(Math.cos(angle)) < 0.30;

      // --- Calculate Line Endpoint Position ---
      if (isNearVertical || isTopOthersNearVertical) { // Use vertical logic if near vertical OR if it's Top Others
        // --- Vertical Placement Logic ---
        finalLabelX = midX; // Line endpoint is centered horizontally
        let currentVerticalMultiplier = standardVerticalMultiplier;
        // Use larger multiplier if it's 'Others' near vertical
        if (label.startsWith('Others') && Math.abs(Math.cos(angle)) < 0.30) { // Check specifically for Others near vertical
            currentVerticalMultiplier = othersVerticalMultiplier;
        }
        finalLabelY = midY + (isTopHalf ? -labelDistance * currentVerticalMultiplier : labelDistance * currentVerticalMultiplier);
        initialTextAlign = 'center'; // Line endpoint logic resulted in centered position

      } else if (isNearHorizontal) {
        // --- Horizontal Placement Logic ---
        finalLabelY = midY;
        finalLabelX = midX + (isRightHalf ? labelDistance * angledMultiplier : -labelDistance * angledMultiplier);
        initialTextAlign = isRightHalf ? 'left' : 'right'; // Line endpoint logic resulted in left/right position

      } else {
        // --- Angled Placement Logic (Default) ---
        const offsetX = Math.cos(angle) * labelDistance;
        const offsetY = Math.sin(angle) * labelDistance;
        finalLabelX = midX + offsetX * angledMultiplier;
        finalLabelY = midY + offsetY * angledMultiplier;
        initialTextAlign = isRightHalf ? 'left' : 'right'; // Line endpoint logic resulted in angled position
      }

      // --- Clamp Label Position ---
      finalLabelX = Math.max(labelArea.left, Math.min(finalLabelX, labelArea.right));
      finalLabelY = Math.max(labelArea.top, Math.min(finalLabelY, labelArea.bottom));

      // --- Draw Callout Line ---
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(midX, midY, finalLabelX, finalLabelY);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // --- Draw Endpoint Circle ---
      ctx.beginPath();
      ctx.arc(finalLabelX, finalLabelY, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fill();

      // --- Calculate Text Position ---
      const textPadding = 4;
      let textX = finalLabelX; // Start at line endpoint
      let textY = finalLabelY; // Start at line endpoint
      let finalTextAlign = initialTextAlign; // Use line logic alignment by default
      let textBaseline = 'middle'; // Default baseline

      // *** Special override for 'Others' at the top ***
      if (isTopOthersNearVertical) {
          finalTextAlign = 'left';    // Align text to the left (it will appear right of the point)
          textX = finalLabelX + textPadding; // Position text horizontally to the right of the endpoint
          textY = finalLabelY;        // Keep text vertically centered with the endpoint
          textBaseline = 'middle';    // Use middle vertical alignment
          console.log(`Overriding text position for top 'Others' to right side of vertical line.`); // Debug log
      }
      // Handle other centered labels (bottom 'Others', regular top/bottom)
      else if (initialTextAlign === 'center') {
          textY += isTopHalf ? -textPadding : textPadding; // Default vertical padding
          textBaseline = isTopHalf ? 'bottom' : 'top'; // Default baseline adjustment
      }
      // Handle default left/right aligned labels
      else {
          textX += initialTextAlign === 'left' ? textPadding : -textPadding; // Default horizontal padding
          textBaseline = 'middle';
      }

      // --- Draw Label Text ---
      ctx.font = '12px Arial, sans-serif';
      ctx.fillStyle = '#000000';
      ctx.textAlign = finalTextAlign; // Use potentially overridden alignment
      ctx.textBaseline = textBaseline; // Use potentially overridden baseline

      let displayText = label;
      if (percentage < 7) {
        displayText = `${label} (${percentage.toFixed(1)}%)`;
      }

      ctx.fillText(displayText, textX, textY); // Draw text at final calculated position
    });

    // Restore the canvas context state
    ctx.restore();
  }
};