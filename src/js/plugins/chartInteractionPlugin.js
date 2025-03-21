export const ChartInteractionPlugin = {
    id: 'chartInteraction',
    
    beforeInit(chart) {
      // Create linked chart functionality
      chart.linkedCharts = [];
    },
    
    afterEvent(chart, args) {
      const event = args.event;
      if (event.type === 'click') {
        // Handle click events for interactive filtering
        const points = chart.getElementsAtEventForMode(
          event,
          'nearest',
          { intersect: true },
          false
        );
        
        if (points.length) {
          const firstPoint = points[0];
          const label = chart.data.labels[firstPoint.index];
          const value = chart.data.datasets[firstPoint.datasetIndex].data[firstPoint.index];
          
          // Dispatch custom event
          const filterEvent = new CustomEvent('chartfilter', {
            detail: { label, value, dataset: firstPoint.datasetIndex }
          });
          chart.canvas.dispatchEvent(filterEvent);
        }
      }
    }
  };