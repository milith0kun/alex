// Chart.js Configuration and Initialization
window.initCharts = function (data) {
    console.log('Initializing charts with data:', data);
    // Placeholder for chart initialization if not handled by render-extensions
};

// Utilities for Charts
window.COLORS = {
    primary: '#667eea',
    secondary: '#764ba2',
    accent: '#48bb78',
    warning: '#ed8936',
    error: '#f56565',
    background: [
        'rgba(102, 126, 234, 0.5)',
        'rgba(118, 75, 162, 0.5)',
        'rgba(72, 187, 120, 0.5)',
        'rgba(237, 137, 54, 0.5)'
    ]
};

// Default Global Chart Options
if (window.Chart) {
    Chart.defaults.color = '#cbd5e0';
    Chart.defaults.borderColor = '#2d3748';
}
