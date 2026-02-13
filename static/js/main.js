document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const modeBtns = document.querySelectorAll('.mode-btn');
    const inputModes = document.querySelectorAll('.input-mode');
    const genomePreset = document.getElementById('genome-preset');
    const customGenomeGroup = document.getElementById('custom-genome-group');
    const analyzeBtn = document.getElementById('analyze-btn');
    const compareBtn = document.getElementById('compare-btn');
    const loading = document.getElementById('loading');
    const resultsContainer = document.getElementById('results');

    // State
    let currentMode = 'single';

    // Initialize Mode Logic
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update UI buttons
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Show relevant form
            currentMode = btn.dataset.mode;
            inputModes.forEach(mode => {
                mode.style.display = 'none';
                if (mode.id === `${currentMode}-mode`) {
                    mode.style.display = 'block';
                    // Animation
                    mode.style.opacity = '0';
                    setTimeout(() => mode.style.opacity = '1', 10);
                }
            });
        });
    });

    // Handle Preset Selectors (Single Mode)
    if (genomePreset) {
        genomePreset.addEventListener('change', (e) => {
            const val = e.target.value;
            const customInput = document.getElementById('genome-id');

            if (val === 'custom') {
                customGenomeGroup.style.display = 'block';
                customInput.value = '';
                customInput.focus();
            } else {
                customGenomeGroup.style.display = 'none';
                if (val) customInput.value = val;
            }
        });
    }

    // Handle Preset Selectors (Compare Mode)
    ['1', '2'].forEach(num => {
        const preset = document.getElementById(`genome${num}-preset`);
        const group = document.getElementById(`custom-genome${num}-group`);
        const input = document.getElementById(`genome${num}-id`);

        if (preset) {
            preset.addEventListener('change', (e) => {
                const val = e.target.value;
                if (val === `custom${num}`) {
                    group.style.display = 'block';
                    input.value = '';
                    input.focus();
                } else {
                    group.style.display = 'none';
                    if (val) input.value = val;
                }
            });
        }
    });

    // Main Analysis Handler
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', async () => {
            const genomeId = document.getElementById('genome-id').value.trim();
            const includeAI = document.getElementById('include-ai-single').checked;

            if (!genomeId) {
                alert('Por favor, ingresa un ID de genoma o selecciona uno de la lista.');
                return;
            }

            setLoading(true);
            resultsContainer.innerHTML = '';
            resultsContainer.classList.add('hidden');

            try {
                // Determine API endpoint based on ID (simple heuristic or always same)
                const endpoint = '/api/analyze'; // Adjust if backend differentiates

                const formData = new FormData();
                formData.append('genome_id', genomeId); // Sending regular form data, but backend expects JSON? Let's check.
                // Wait, the backend code shows request.get_json(), so we must send JSON.

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        genome_id: genomeId,
                        include_ai: includeAI
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Error en el análisis');
                }

                displaySingleResults(data, includeAI);

            } catch (error) {
                console.error(error);
                resultsContainer.innerHTML = `
                    <div class="result-card" style="border-color: var(--error);">
                        <h3 class="text-error">Error en el análisis</h3>
                        <p>${error.message}</p>
                    </div>
                `;
                resultsContainer.classList.remove('hidden');
            } finally {
                setLoading(false);
            }
        });
    }

    // Compare Handler
    if (compareBtn) {
        compareBtn.addEventListener('click', async () => {
            const id1 = document.getElementById('genome1-id').value.trim();
            const id2 = document.getElementById('genome2-id').value.trim();
            const includeAI = document.getElementById('include-ai-compare').checked;

            if (!id1 || !id2) {
                alert('Por favor, selecciona dos genomas para comparar.');
                return;
            }

            setLoading(true);
            resultsContainer.innerHTML = '';
            resultsContainer.classList.add('hidden');

            try {
                const response = await fetch('/api/compare', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        genome1_id: id1,
                        genome2_id: id2,
                        include_ai: includeAI
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Error en la comparación');
                }

                displayCompareResults(data, includeAI);

            } catch (error) {
                console.error(error);
                resultsContainer.innerHTML = `
                    <div class="result-card" style="border-color: var(--error);">
                        <h3 class="text-error">Error en la comparación</h3>
                        <p>${error.message}</p>
                    </div>
                `;
                resultsContainer.classList.remove('hidden');
            } finally {
                setLoading(false);
            }
        });
    }

    // Helper: Loading State
    function setLoading(isLoading) {
        if (isLoading) {
            loading.classList.remove('hidden');
            document.querySelector('.input-card').style.opacity = '0.5';
            document.querySelector('.input-card').style.pointerEvents = 'none';
        } else {
            loading.classList.add('hidden');
            document.querySelector('.input-card').style.opacity = '1';
            document.querySelector('.input-card').style.pointerEvents = 'all';
        }
    }

    // Helper: Display Single Results
    window.displaySingleResults = function (data, aiRequested) {
        // Build Tabs UI
        let html = `
            <div class="result-card analysis-section">
                <div class="header-content" style="margin-bottom: 2rem;">
                    <div>
                        <h2 class="hero-title" style="font-size: 2rem; margin: 0;">Resultados del Análisis</h2>
                        <p class="text-secondary">${data.description || data.accession_id}</p>
                    </div>
                    <button class="btn btn-primary" onclick="window.print()">
                        Exportar PDF
                    </button>
                </div>

                <div class="tab-container">
                    <div class="tab-list">
                        <button class="tab-btn active" onclick="showTab('basic')">Información Básica</button>
                        <button class="tab-btn" onclick="showTab('genes')">Genes y Estructura</button>
                        <button class="tab-btn" onclick="showTab('ai')">Interpretación IA</button>
                    </div>

                    <div id="basic" class="tab-content active">
                        <div class="data-grid">
                            ${createDataItem('ID Acceso', data.accession_id)}
                            ${createDataItem('Longitud', formatNumber(data.length) + ' pb')}
                            ${createDataItem('Tipo', data.molecule_type || 'N/A')}
                            ${createDataItem('Topología', data.topology || 'Lineal')}
                            ${createDataItem('Contenido GC', data.gc_content + '%')}
                            ${createDataItem('Genes Totales', data.genes_analysis ? data.genes_analysis.total_genes : 'N/A')}
                        </div>
                    </div>

                    <div id="genes" class="tab-content">
                        ${renderGenesTable(data.genes_analysis)}
                    </div>

                    <div id="ai" class="tab-content">
                        ${renderAIContent(data.ai_interpretation)}
                    </div>
                </div>
            </div>
        `;

        resultsContainer.innerHTML = html;
        resultsContainer.classList.remove('hidden');

        // This is where render-extensions.js usually hooks in
    };

    // Helper: Display Compare Results
    function displayCompareResults(data, aiRequested) {
        // Simplified Logic for Comparison
        let html = `
            <div class="result-card analysis-section">
                 <div class="header-content" style="margin-bottom: 2rem;">
                    <h2 class="hero-title" style="font-size: 2rem; margin: 0;">Comparación Genómica</h2>
                </div>
                
                <div class="data-grid" style="grid-template-columns: 1fr 1fr; gap: 2rem;">
                    <div class="col">
                        <h3 class="card-title">${data.genome1.accession_id}</h3>
                        <p>${formatNumber(data.genome1.length)} pb</p>
                        <p>GC: ${data.genome1.gc_content}%</p>
                    </div>
                    <div class="col">
                        <h3 class="card-title">${data.genome2.accession_id}</h3>
                        <p>${formatNumber(data.genome2.length)} pb</p>
                        <p>GC: ${data.genome2.gc_content}%</p>
                    </div>
                </div>

                <div class="ai-message" style="margin-top: 2rem;">
                    <div class="ai-header">🤖 Análisis Comparativo IA</div>
                    <div class="markdown-body">
                         ${marked.parse(data.ai_comparison || 'No hay interpretación disponible.')}
                    </div>
                </div>
            </div>
        `;
        resultsContainer.innerHTML = html;
        resultsContainer.classList.remove('hidden');
    }

    // Helper Functions
    function createDataItem(label, value) {
        return `
            <div class="data-item">
                <div class="data-label">${label}</div>
                <div class="data-value">${value}</div>
            </div>
        `;
    }

    function formatNumber(num) {
        return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : '0';
    }

    function renderGenesTable(genesData) {
        if (!genesData || !genesData.cds_details) return '<p>No se encontraron datos de genes.</p>';
        return `
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
                    <thead>
                        <tr style="border-bottom: 1px solid var(--border); text-align: left;">
                            <th style="padding: 1rem;">Gen</th>
                            <th style="padding: 1rem;">Inicio</th>
                            <th style="padding: 1rem;">Fin</th>
                            <th style="padding: 1rem;">Hebra</th>
                            <th style="padding: 1rem;">Producto</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${genesData.cds_details.slice(0, 10).map(g => `
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                                <td style="padding: 1rem; color: var(--primary); font-weight: 500;">${g.gene || '-'}</td>
                                <td style="padding: 1rem;">${formatNumber(g.location.start)}</td>
                                <td style="padding: 1rem;">${formatNumber(g.location.end)}</td>
                                <td style="padding: 1rem;">${g.location.strand === 1 ? '+' : '-'}</td>
                                <td style="padding: 1rem; color: var(--text-secondary);">${g.product || 'Unknown'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <p style="margin-top: 1rem; color: var(--text-muted); font-size: 0.9rem;">Mostrando primeros 10 genes...</p>
            </div>
        `;
    }

    function renderAIContent(aiText) {
        if (!aiText) return '<p>No se solicitó interpretación de IA.</p>';

        // Handle if aiText is an object (e.g. error received from backend)
        let textContent = aiText;
        if (typeof aiText === 'object') {
            if (aiText.error) {
                textContent = `**Error:** ${aiText.error}`;
            } else {
                textContent = JSON.stringify(aiText, null, 2);
            }
        }

        // Simple markdown parsing fallback if library not loaded
        // Ensure textContent is a string before calling replace
        textContent = String(textContent);

        const parsed = window.marked ? window.marked.parse(textContent) : textContent.replace(/\n/g, '<br>');
        return `
            <div class="ai-message">
                <div class="ai-header">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z"/>
                        <path d="M12 6v6l4 2"/>
                    </svg>
                    Interpretación Gemini AI
                </div>
                <div class="markdown-body" style="line-height: 1.8;">
                    ${parsed}
                </div>
            </div>
        `;
    }

    // Global Tab Switcher
    window.showTab = function (tabId) {
        // Toggle buttons
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        const activeBtn = document.querySelector(`button[onclick="showTab('${tabId}')"]`);
        if (activeBtn) activeBtn.classList.add('active');

        // Toggle content
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        const activeContent = document.getElementById(tabId);
        if (activeContent) activeContent.classList.add('active');

        // Dispatch event for canvas redrawing hook in extensions
        if (window.switchTab) {
            // Mock event if needed or just call logic
            const event = new Event('tabSwitch');
            // The extension overwrites switchTab, so this mimics the call if logic was inside
        }
    };
});
