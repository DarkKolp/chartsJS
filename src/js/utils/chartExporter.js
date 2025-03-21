export default class ChartExporter {
    static exportToPNG(chartId, filename = 'chart-export') {
      const chart = ChartRegistry.get(chartId);
      if (!chart) return;
      
      // Create a download link
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = chart.toBase64Image();
      link.click();
    }
    
    static exportToCSV(chartId, filename = 'chart-data') {
      const chart = ChartRegistry.get(chartId);
      if (!chart) return;
      
      const csvContent = this.chartDataToCSV(chart);
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.csv`;
      link.click();
    }
    
    static chartDataToCSV(chart) {
      const labels = chart.data.labels;
      const datasets = chart.data.datasets;
      let csv = 'data:text/csv;charset=utf-8,';
      
      // Headers
      csv += 'Category,' + datasets.map(ds => ds.label).join(',') + '\n';
      
      // Data rows
      labels.forEach((label, i) => {
        csv += label + ',' + datasets.map(ds => ds.data[i]).join(',') + '\n';
      });
      
      return csv;
    }
  }
  