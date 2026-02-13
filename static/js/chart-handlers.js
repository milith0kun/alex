/**
 * Handlers for rendering specific charts using Chart.js
 * These functions are called by render-extensions.js
 */

window.renderNucleotideChart = function (analysis) {
    const ctx = document.getElementById('nucleotide-chart');
    if (!ctx) return;

    const gc = analysis.gc_content;
    const at = 100 - gc;

    // Approximate distribution (A=T, G=C)
    const a = at / 2;
    const t = at / 2;
    const g = gc / 2;
    const c = gc / 2;

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Adenina (A)', 'Timina (T)', 'Guanina (G)', 'Citosina (C)'],
            datasets: [{
                data: [a, t, g, c],
                backgroundColor: [
                    'rgba(239, 68, 68, 0.7)',  // Red
                    'rgba(59, 130, 246, 0.7)', // Blue
                    'rgba(16, 185, 129, 0.7)', // Green
                    'rgba(245, 158, 11, 0.7)'  // Yellow
                ],
                borderColor: 'transparent',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: '#e2e8f0' }
                }
            }
        }
    });
};

window.renderStrandChart = function (genes, canvasId) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const plus = genes.filter(g => g.location.strand === 1).length;
    const minus = genes.filter(g => g.location.strand === -1).length;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Hebra (+)', 'Hebra (-)'],
            datasets: [{
                label: 'Cantidad de Genes',
                data: [plus, minus],
                backgroundColor: [
                    'rgba(72, 187, 120, 0.6)',
                    'rgba(237, 137, 54, 0.6)'
                ],
                borderColor: [
                    '#48bb78',
                    '#ed8936'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
};

window.renderGeneLengthHistogram = function (genes, canvasId) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const lengths = genes.map(g => g.location.end - g.location.start);

    // Create bins
    const bins = [0, 500, 1000, 2000, 5000, 10000];
    const binCounts = new Array(bins.length).fill(0);
    const labels = ['<500', '500-1k', '1k-2k', '2k-5k', '5k-10k', '>10k'];

    lengths.forEach(l => {
        if (l < 500) binCounts[0]++;
        else if (l < 1000) binCounts[1]++;
        else if (l < 2000) binCounts[2]++;
        else if (l < 5000) binCounts[3]++;
        else if (l < 10000) binCounts[4]++;
        else binCounts[5]++;
    });

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Frecuencia',
                data: binCounts,
                backgroundColor: 'rgba(102, 126, 234, 0.2)',
                borderColor: '#667eea',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
};
