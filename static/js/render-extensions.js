/**
 * Extensions para agregar gráficos a las vistas de renderizado
 * Estrategia: Interceptar displaySingleResults y agregar canvas dinámicamente
 */

document.addEventListener("DOMContentLoaded", () => {
    // Guardar referencia a displaySingleResults original
    const originalDisplaySingleResults = window.displaySingleResults;

    if (!originalDisplaySingleResults) {
        console.error('displaySingleResults no encontrada');
        return;
    }

    // Sobrescribir displaySingleResults
    window.displaySingleResults = function (analysis, aiInterpretation) {
        console.log('Interceptando displaySingleResults para agregar gráficos extendidos');
        // Llamar a la función original
        const result = originalDisplaySingleResults.call(this, analysis, aiInterpretation);

        // Guardar datos para uso posterior
        window.currentAnalysisData = analysis;

        // Agregar canvas a las pestañas después de un breve delay
        setTimeout(() => {
            addChartsToTabs(analysis);
        }, 100);

        return result;
    };

    // Interceptar switchTab para redibujar genoma cuando se activa la pestaña
    const originalSwitchTab = window.switchTab;
    window.switchTab = function(event, tabId) {
        if (originalSwitchTab) {
            originalSwitchTab.call(this, event, tabId);
        }
        
        // Si es la pestaña de genes o estructura, intentar redibujar
        if (tabId === 'genes' || tabId === 'structure') {
            console.log(`Pestaña ${tabId} activada, solicitando redibujado de genoma`);
            setTimeout(() => {
                if (window._genomeBrowserRedraw) {
                    window._genomeBrowserRedraw();
                }
            }, 100);
        }
    };

    // Función para agregar canvas a las pestañas
    function addChartsToTabs(analysis) {
        // 1. Agregar canvas a pestaña "Información Básica"
        const basicTab = document.getElementById('basic');
        if (basicTab && !document.getElementById('nucleotide-chart')) {
            const gcContent = analysis.gc_content;
            const atContent = 100 - gcContent;
            const aPercent = (atContent / 2).toFixed(1);
            const tPercent = (atContent / 2).toFixed(1);
            const cPercent = (gcContent / 2).toFixed(1);
            const gPercent = (gcContent / 2).toFixed(1);

            const chartHTML = `
                <h3 style="margin-top: 2rem; margin-bottom: 1rem;">📊 Composición de Nucleótidos</h3>
                <div style="display: flex; gap: 2rem; align-items: center; margin: 0 auto; max-width: 900px;">
                    <div class="chart-container" style="flex: 0 0 400px;">
                        <canvas id="nucleotide-chart"></canvas>
                    </div>
                    <div style="flex: 1; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px;">
                        <p style="margin: 0.5rem 0; color: rgba(255,255,255,0.9);">
                            <strong>Adenina (A):</strong> ${aPercent}%
                        </p>
                        <p style="margin: 0.5rem 0; color: rgba(255,255,255,0.9);">
                            <strong>Timina (T):</strong> ${tPercent}%
                        </p>
                        <p style="margin: 0.5rem 0; color: rgba(255,255,255,0.9);">
                            <strong>Citosina (C):</strong> ${cPercent}%
                        </p>
                        <p style="margin: 0.5rem 0; color: rgba(255,255,255,0.9);">
                            <strong>Guanina (G):</strong> ${gPercent}%
                        </p>
                        <p style="margin: 0.5rem 0; padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); font-style: italic; font-size: 0.9rem;">
                            Contenido AT: ${atContent.toFixed(1)}%<br>
                            Contenido GC: ${gcContent}%
                        </p>
                    </div>
                </div>
            `;
            basicTab.insertAdjacentHTML('beforeend', chartHTML);

            // Renderizar gráfico
            if (window.renderNucleotideChart) {
                setTimeout(() => renderNucleotideChart(analysis), 50);
            }
        }

        // 2. Agregar canvas a pestaña "Análisis de Genes"
        const genesTab = document.getElementById('genes');
        if (genesTab && !document.getElementById('strand-chart-default')) {
            const genes = analysis.genes_analysis.cds_details || [];
            
            // Si no hay genes pero hay longitud, crear un array vacío para evitar errores
            const safeGenes = genes || [];
            
            const plusStrand = safeGenes.filter(g => g.location.strand === 1).length;
            const minusStrand = safeGenes.filter(g => g.location.strand === -1).length;
            const total = plusStrand + minusStrand;
            const plusPercent = total > 0 ? ((plusStrand / total) * 100).toFixed(1) : 0;
            const minusPercent = total > 0 ? ((minusStrand / total) * 100).toFixed(1) : 0;

            // Calcular estadísticas de longitud
            const lengths = safeGenes.map(g => g.location.end - g.location.start);
            const avgLength = lengths.length > 0 ? (lengths.reduce((a, b) => a + b, 0) / lengths.length).toFixed(0) : 0;
            const minLength = lengths.length > 0 ? Math.min(...lengths) : 0;
            const maxLength = lengths.length > 0 ? Math.max(...lengths) : 0;

            const chartHTML = `
                <h3 style="margin-top: 2rem; margin-bottom: 1rem;">🧬 Distribución por Hebra</h3>
                <div style="display: flex; gap: 2rem; align-items: center; margin: 0 auto 2rem; max-width: 900px;">
                    <div class="chart-container" style="flex: 0 0 400px;">
                        <canvas id="strand-chart-default"></canvas>
                    </div>
                    <div style="flex: 1; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px;">
                        <p style="margin: 0.5rem 0; color: rgba(255,255,255,0.9);">
                            <strong>Hebra + (Forward):</strong><br>
                            ${plusStrand.toLocaleString()} genes (${plusPercent}%)
                        </p>
                        <p style="margin: 0.5rem 0; color: rgba(255,255,255,0.9);">
                            <strong>Hebra - (Reverse):</strong><br>
                            ${minusStrand.toLocaleString()} genes (${minusPercent}%)
                        </p>
                        <p style="margin: 0.5rem 0; padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); font-style: italic; font-size: 0.9rem;">
                            Total: ${total.toLocaleString()} genes CDS
                        </p>
                    </div>
                </div>
                
                <h3 style="margin-top: 2rem; margin-bottom: 1rem;">📏 Distribución de Longitud de Genes</h3>
                <div style="display: flex; gap: 2rem; align-items: center; margin: 0 auto 2rem; max-width: 1000px;">
                    <div class="chart-container" style="flex: 0 0 550px;">
                        <canvas id="gene-length-chart-default"></canvas>
                    </div>
                    <div style="flex: 1; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px;">
                        <p style="margin: 0.5rem 0; color: rgba(255,255,255,0.9);">
                            <strong>Longitud promedio:</strong><br>
                            ${parseInt(avgLength).toLocaleString()} pb
                        </p>
                        <p style="margin: 0.5rem 0; color: rgba(255,255,255,0.9);">
                            <strong>Gene más corto:</strong><br>
                            ${minLength.toLocaleString()} pb
                        </p>
                        <p style="margin: 0.5rem 0; color: rgba(255,255,255,0.9);">
                            <strong>Gene más largo:</strong><br>
                            ${maxLength.toLocaleString()} pb
                        </p>
                        <p style="margin: 0.5rem 0; padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); font-style: italic; font-size: 0.9rem;">
                            La mayoría tiene entre 500-2,000 pb
                        </p>
                    </div>
                </div>
            `;
            genesTab.insertAdjacentHTML('beforeend', chartHTML);

            // Renderizar gráficos
            if (window.renderStrandChart && genes.length > 0) {
                setTimeout(() => renderStrandChart(genes, 'strand-chart-default'), 50);
            }
            if (window.renderGeneLengthHistogram && genes.length > 0) {
                setTimeout(() => renderGeneLengthHistogram(genes, 'gene-length-chart-default'), 50);
            }
        }

        // 2b. Mapa genómico lineal — genome browser estilo profesional
        if (genesTab && !document.getElementById('genome-browser-canvas')) {
            const genes = analysis.genes_analysis.cds_details || [];
            if (genes.length > 0) {
                const sortedGenes = [...genes].sort((a, b) => a.location.start - b.location.start);
                let genomeLen = analysis.length || Math.max(...genes.map(g => g.location.end));
                if (!genomeLen || genomeLen < 100) genomeLen = 10000; // Fallback
                
                const top20 = [...genes].sort((a, b) => (b.location.end - b.location.start) - (a.location.end - a.location.start)).slice(0, 20);

                const mapHTML = `
                    <h3 style="margin-top: 2rem; margin-bottom: 1rem;">🗺️ Genome Browser — Mapa Lineal de Genes</h3>
                    <div style="margin-bottom: 1rem; padding: 1rem; background: linear-gradient(135deg, rgba(102, 126, 234, 0.08), rgba(118, 75, 162, 0.08)); border-left: 4px solid #667eea; border-radius: 0.5rem;">
                        <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6;">
                            Visualización lineal del genoma. Los genes de la <span style="color: #48bb78; font-weight: bold;">hebra (+)</span> se muestran <strong>arriba</strong> y los de la <span style="color: #ed8936; font-weight: bold;">hebra (−)</span> <strong>abajo</strong> de la línea central del genoma.<br>
                            🔍 <strong>Rueda del ratón</strong> = zoom in/out &nbsp;|&nbsp; <strong>Click + arrastrar</strong> = desplazar &nbsp;|&nbsp; <strong>Hover</strong> = info del gen
                        </p>
                    </div>
                    <div style="display: flex; gap: 8px; margin-bottom: 0.75rem; align-items: center; flex-wrap: wrap;">
                        <button onclick="window._genomeBrowser?.resetView()" style="padding: 6px 16px; background: rgba(102,126,234,0.2); color: #667eea; border: 1px solid rgba(102,126,234,0.4); border-radius: 6px; cursor: pointer; font-size: 0.85rem;">🔄 Vista completa</button>
                        <button onclick="window._genomeBrowser?.zoomIn()" style="padding: 6px 12px; background: rgba(72,187,120,0.2); color: #48bb78; border: 1px solid rgba(72,187,120,0.4); border-radius: 6px; cursor: pointer; font-size: 0.85rem;">🔍+ Zoom In</button>
                        <button onclick="window._genomeBrowser?.zoomOut()" style="padding: 6px 12px; background: rgba(237,137,54,0.2); color: #ed8936; border: 1px solid rgba(237,137,54,0.4); border-radius: 6px; cursor: pointer; font-size: 0.85rem;">🔍− Zoom Out</button>
                        <span id="genome-browser-info" style="margin-left: auto; font-size: 0.8rem; color: var(--text-muted);"></span>
                    </div>
                    <div style="position: relative; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; background: rgba(0,0,0,0.3);">
                        <canvas id="genome-browser-canvas" style="width: 100%; height: 300px; cursor: grab;"></canvas>
                    </div>
                    <!-- Minimap -->
                    <div style="margin-top: 8px; border: 1px solid var(--border); border-radius: 4px; overflow: hidden; background: rgba(0,0,0,0.2);">
                        <canvas id="genome-minimap" style="width: 100%; height: 40px; cursor: pointer;"></canvas>
                    </div>
                    <!-- Tooltip se crea dinámicamente en document.body -->
                    
                    <h3 style="margin-top: 3rem; margin-bottom: 1rem;">⭕ Advanced Circular Genome View (Circos Style)</h3>
                    <div style="margin-bottom: 1.5rem; padding: 1.25rem; background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1)); border-left: 4px solid var(--accent); border-radius: 0.5rem;">
                        <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6;">
                            <strong>Visualización Avanzada:</strong> Mapa circular profesional que muestra la densidad de genes y la composición nucleotídica. 
                            Las capas representan (de afuera hacia adentro): <span style="color: #ed8936;">Hebra (-)</span>, <span style="color: #48bb78;">Hebra (+)</span>, y <span style="color: #90cdf4;">Variación GC</span>.
                        </p>
                    </div>
                    <div style="display: flex; justify-content: center; background: rgba(0,0,0,0.2); border-radius: 12px; padding: 2rem; border: 1px solid var(--border);">
                        <canvas id="circular-genome-canvas" style="max-width: 100%; height: 600px;"></canvas>
                    </div>

                    <h3 style="margin-top: 2rem; margin-bottom: 1rem;">🏆 Top 20 Genes Más Largos</h3>
                    <div class="chart-container" style="height: 500px; margin-bottom: 2rem;">
                        <canvas id="top-genes-chart"></canvas>
                    </div>
                `;
                genesTab.insertAdjacentHTML('beforeend', mapHTML);

                // ========== Custom Genome Browser ==========
                setTimeout(() => {
                    const canvas = document.getElementById('genome-browser-canvas');
                    const miniCanvas = document.getElementById('genome-minimap');
                    const infoSpan = document.getElementById('genome-browser-info');
                    if (!canvas || !miniCanvas) return;

                    // Create tooltip on document.body to avoid overflow clipping from parent containers
                    let tooltip = document.getElementById('genome-tooltip-body');
                    if (!tooltip) {
                        tooltip = document.createElement('div');
                        tooltip.id = 'genome-tooltip-body';
                        tooltip.style.cssText = 'display: none; position: fixed; padding: 12px 16px; background: rgba(26,32,44,0.97); border: 1px solid rgba(102,126,234,0.4); border-radius: 10px; color: #e2e8f0; font-size: 0.85rem; line-height: 1.5; pointer-events: none; z-index: 10000; max-width: 400px; box-shadow: 0 8px 30px rgba(0,0,0,0.6); backdrop-filter: blur(8px);';
                        document.body.appendChild(tooltip);
                    }

                    const ctx = canvas.getContext('2d');
                    const mctx = miniCanvas.getContext('2d');

                    // Set canvas resolution
                    const dpr = window.devicePixelRatio || 1;
                    const circCanvas = document.getElementById('circular-genome-canvas');
                    const cctx = circCanvas ? circCanvas.getContext('2d') : null;

                    function setCanvasSize() {
                        if (!canvas || !miniCanvas) return false;
                        
                        const w = canvas.clientWidth;
                        const h = canvas.clientHeight;
                        
                        if (w === 0 || h === 0) {
                            console.warn('Canvas dimensions are zero. Tab might be hidden.');
                            return false;
                        }

                        canvas.width = w * dpr;
                        canvas.height = h * dpr;
                        miniCanvas.width = miniCanvas.clientWidth * dpr;
                        miniCanvas.height = miniCanvas.clientHeight * dpr;
                        
                        if (circCanvas) {
                            const cw = circCanvas.clientWidth;
                            const ch = circCanvas.clientHeight;
                            if (cw > 0 && ch > 0) {
                                circCanvas.width = cw * dpr;
                                circCanvas.height = ch * dpr;
                            }
                        }
                        return true;
                    }
                    setCanvasSize();

                    // ResizeObserver for automatic redrawing when visible
                    if (window.ResizeObserver) {
                        const ro = new ResizeObserver(entries => {
                            for (let entry of entries) {
                                if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
                                    if (setCanvasSize()) {
                                        draw();
                                        drawCircularGenome();
                                    }
                                }
                            }
                        });
                        ro.observe(canvas);
                        if (circCanvas) ro.observe(circCanvas);
                    }

                    // View state
                    let viewStart = 0;
                    let viewEnd = genomeLen;
                    // Garantizar un rango mínimo razonable y prevenir errores de escala
                    if (isNaN(viewEnd) || viewEnd <= 0) viewEnd = 10000;
                    if (viewEnd <= viewStart) viewEnd = viewStart + 10000; 

                    let isDragging = false;
                    let dragStartX = 0;
                    let dragStartView = 0;

                    // Expose redraw function globally
                    window._genomeBrowserRedraw = function() {
                        setCanvasSize();
                        draw();
                        drawCircularGenome();
                    };
                    
                    // Expose browser object for controls
                    window._genomeBrowser = {
                        resetView: () => {
                            viewStart = 0;
                            viewEnd = genomeLen;
                            draw();
                        },
                        zoomIn: () => {
                            const center = (viewStart + viewEnd) / 2;
                            const newLen = (viewEnd - viewStart) * 0.7;
                            viewStart = Math.max(0, center - newLen / 2);
                            viewEnd = Math.min(genomeLen, viewStart + newLen);
                            draw();
                        },
                        zoomOut: () => {
                            const center = (viewStart + viewEnd) / 2;
                            const newLen = Math.min(genomeLen, (viewEnd - viewStart) * 1.4);
                            viewStart = Math.max(0, center - newLen / 2);
                            viewEnd = Math.min(genomeLen, viewStart + newLen);
                            draw();
                        }
                    };

                    // Initial draw
                    setTimeout(() => {
                        setCanvasSize();
                        draw();
                        drawCircularGenome();
                    }, 100);

                    const plusColor = '#48bb78';
                    const minusColor = '#ed8936';
                    const plusColorLight = 'rgba(72, 187, 120, 0.8)';
                    const minusColorLight = 'rgba(237, 137, 54, 0.8)';

                    function drawCircularGenome() {
                        if (!cctx || !circCanvas) return;
                        const w = circCanvas.width;
                        const h = circCanvas.height;
                        if (w === 0 || h === 0) {
                            console.log('Circular canvas has 0 dimensions, skipping draw');
                            return;
                        }
                        
                        console.log(`Drawing Circular Genome: genes=${sortedGenes.length}, len=${genomeLen}, size=${w}x${h}`);
                        
                        const centerX = w / 2;
                        const centerY = h / 2;
                        const baseRadius = Math.min(w, h) * 0.4;
                        
                        cctx.clearRect(0, 0, w, h);
                        
                        // Background circle
                        cctx.beginPath();
                        cctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
                        cctx.strokeStyle = 'rgba(255,255,255,0.1)';
                        cctx.lineWidth = 1;
                        cctx.stroke();

                        // Helper to get angle from position
                        const safeGenomeLen = genomeLen > 0 ? genomeLen : 1;
                        const getAngle = (pos) => (pos / safeGenomeLen) * Math.PI * 2 - Math.PI / 2;

                        // Draw Genes in circles
                        const ringWidth = 25 * dpr;
                        
                        // Outer ring: Minus strand
                        for (const g of sortedGenes) {
                            if (g.location.strand === -1) {
                                const startAngle = getAngle(g.location.start);
                                const endAngle = getAngle(g.location.end);
                                cctx.beginPath();
                                cctx.arc(centerX, centerY, baseRadius + ringWidth, startAngle, endAngle);
                                cctx.strokeStyle = minusColorLight;
                                cctx.lineWidth = ringWidth * 0.8;
                                cctx.stroke();
                            } else {
                                // Inner ring: Plus strand
                                const startAngle = getAngle(g.location.start);
                                const endAngle = getAngle(g.location.end);
                                cctx.beginPath();
                                cctx.arc(centerX, centerY, baseRadius, startAngle, endAngle);
                                cctx.strokeStyle = plusColorLight;
                                cctx.lineWidth = ringWidth * 0.8;
                                cctx.stroke();
                            }
                        }

                        // Nucleotide Composition Ring (GC Content placeholder)
                        // In a real scenario we'd use sliding window GC, here we use analysis.nucleotide_counts if available
                        const gcRadius = baseRadius - ringWidth * 1.5;
                        cctx.beginPath();
                        cctx.arc(centerX, centerY, gcRadius, 0, Math.PI * 2);
                        cctx.strokeStyle = 'rgba(102,126,234,0.3)';
                        cctx.lineWidth = 2;
                        cctx.stroke();

                        // Center text
                        cctx.fillStyle = '#fff';
                        cctx.font = `bold ${20 * dpr}px Inter, sans-serif`;
                        cctx.textAlign = 'center';
                        cctx.fillText(analysis.accession_id || 'Genome', centerX, centerY - 10 * dpr);
                        cctx.font = `${14 * dpr}px Inter, sans-serif`;
                        cctx.fillStyle = 'rgba(255,255,255,0.6)';
                        cctx.fillText(`${(genomeLen/1000).toFixed(1)} Kb`, centerX, centerY + 20 * dpr);

                        // Position Markers (Ticks)
                        const tickCount = 8;
                        for (let i = 0; i < tickCount; i++) {
                            const angle = (i / tickCount) * Math.PI * 2 - Math.PI / 2;
                            const pos = Math.round((i / tickCount) * genomeLen);
                            const label = pos >= 1e6 ? (pos / 1e6).toFixed(1) + 'M' : pos >= 1e3 ? (pos / 1e3).toFixed(0) + 'K' : pos;
                            
                            const x1 = centerX + Math.cos(angle) * (baseRadius - ringWidth * 0.5);
                            const y1 = centerY + Math.sin(angle) * (baseRadius - ringWidth * 0.5);
                            const x2 = centerX + Math.cos(angle) * (baseRadius + ringWidth * 1.5);
                            const y2 = centerY + Math.sin(angle) * (baseRadius + ringWidth * 1.5);
                            
                            cctx.beginPath();
                            cctx.moveTo(x1, y1);
                            cctx.lineTo(x2, y2);
                            cctx.strokeStyle = 'rgba(255,255,255,0.4)';
                            cctx.lineWidth = 1 * dpr;
                            cctx.stroke();
                            
                            const lx = centerX + Math.cos(angle) * (baseRadius + ringWidth * 2.2);
                            const ly = centerY + Math.sin(angle) * (baseRadius + ringWidth * 2.2);
                            cctx.fillStyle = 'rgba(255,255,255,0.8)';
                            cctx.font = `${10 * dpr}px Inter, sans-serif`;
                            cctx.fillText(label, lx, ly);
                        }
                    }

                    function draw() {
                        const w = canvas.width;
                        const h = canvas.height;
                        if (w === 0 || h === 0) {
                            console.log('Linear canvas has 0 dimensions, skipping draw');
                            return;
                        }

                        console.log(`Drawing Linear Genome: genes=${sortedGenes.length}, view=${viewStart}-${viewEnd}, size=${w}x${h}`);
                        
                        const viewLen = viewEnd - viewStart || 1; // Prevenir división por cero
                        const centerY = h * 0.5;
                        const laneH = h * 0.18;

                        ctx.clearRect(0, 0, w, h);

                        // Background gradient - Un poco más oscuro para que resalten los elementos
                        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
                        bgGrad.addColorStop(0, 'rgba(72, 187, 120, 0.05)');
                        bgGrad.addColorStop(0.5, 'rgba(0,0,0,0)');
                        bgGrad.addColorStop(1, 'rgba(237, 137, 54, 0.05)');
                        ctx.fillStyle = bgGrad;
                        ctx.fillRect(0, 0, w, h);

                        // Labels
                        ctx.fillStyle = 'rgba(72, 187, 120, 0.9)'; // Más visible
                        ctx.font = `bold ${12 * dpr}px Inter, sans-serif`;
                        ctx.textAlign = 'left';
                        ctx.fillText('Hebra (+) →', 8 * dpr, 20 * dpr);
                        ctx.fillStyle = 'rgba(237, 137, 54, 0.9)'; // Más visible
                        ctx.fillText('← Hebra (−)', 8 * dpr, h - 10 * dpr);

                        // Center genome line
                        ctx.strokeStyle = 'rgba(255,255,255,0.6)'; // Más visible
                        ctx.lineWidth = 2 * dpr;
                        ctx.beginPath();
                        ctx.moveTo(0, centerY);
                        ctx.lineTo(w, centerY);
                        ctx.stroke();

                        // Tick marks on genome line
                        ctx.fillStyle = 'rgba(255,255,255,1)'; // Totalmente blanco
                        ctx.font = `bold ${10 * dpr}px Inter, sans-serif`;
                        ctx.textAlign = 'center';
                        const tickInterval = niceTickInterval(viewLen);
                        const firstTick = Math.ceil(viewStart / tickInterval) * tickInterval;
                        for (let t = firstTick; t <= viewEnd; t += tickInterval) {
                            const x = ((t - viewStart) / viewLen) * w;
                            ctx.beginPath();
                            ctx.moveTo(x, centerY - 6 * dpr);
                            ctx.lineTo(x, centerY + 6 * dpr);
                            ctx.strokeStyle = 'rgba(255,255,255,0.8)'; // Más visible
                            ctx.lineWidth = 1.5 * dpr;
                            ctx.stroke();
                            const label = t >= 1e6 ? (t / 1e6).toFixed(1) + 'M' : t >= 1e3 ? (t / 1e3).toFixed(0) + 'K' : t.toString();
                            ctx.fillText(label, x, centerY + 22 * dpr);
                        }

                        // Draw genes
                        const minPixelWidth = 2 * dpr; // Un poco más ancho mínimo
                        for (const g of sortedGenes) {
                            if (g.location.end < viewStart || g.location.start > viewEnd) continue;
                            const x1 = Math.max(0, ((g.location.start - viewStart) / viewLen) * w);
                            const x2 = Math.min(w, ((g.location.end - viewStart) / viewLen) * w);
                            const gw = Math.max(x2 - x1, minPixelWidth);
                            const isPlus = g.location.strand === 1;

                            if (isPlus) {
                                ctx.fillStyle = 'rgba(72, 187, 120, 0.9)'; // Más opaco
                                ctx.strokeStyle = '#fff'; // Borde blanco para resaltar
                                const y = centerY - 10 * dpr - laneH;
                                ctx.fillRect(x1, y, gw, laneH);
                                ctx.strokeRect(x1, y, gw, laneH);
                                // Gene name if wide enough
                                if (gw > 40 * dpr && g.gene) {
                                    ctx.fillStyle = '#fff';
                                    ctx.font = `bold ${Math.min(11, laneH / dpr / 1.8) * dpr}px Inter, sans-serif`;
                                    ctx.textAlign = 'center';
                                    ctx.fillText(g.gene, x1 + gw / 2, y + laneH / 2 + 4 * dpr);
                                }
                            } else {
                                ctx.fillStyle = 'rgba(237, 137, 54, 0.9)'; // Más opaco
                                ctx.strokeStyle = '#fff'; // Borde blanco
                                const y = centerY + 10 * dpr;
                                ctx.fillRect(x1, y, gw, laneH);
                                ctx.strokeRect(x1, y, gw, laneH);
                                if (gw > 40 * dpr && g.gene) {
                                    ctx.fillStyle = '#fff';
                                    ctx.font = `bold ${Math.min(11, laneH / dpr / 1.8) * dpr}px Inter, sans-serif`;
                                    ctx.textAlign = 'center';
                                    ctx.fillText(g.gene, x1 + gw / 2, y + laneH / 2 + 4 * dpr);
                                }
                            }
                        }

                        // Info text
                        if (infoSpan) {
                            const vStart = viewStart >= 1e6 ? (viewStart / 1e6).toFixed(2) + 'M' : viewStart >= 1e3 ? (viewStart / 1e3).toFixed(0) + 'K' : Math.round(viewStart);
                            const vEnd = viewEnd >= 1e6 ? (viewEnd / 1e6).toFixed(2) + 'M' : viewEnd >= 1e3 ? (viewEnd / 1e3).toFixed(0) + 'K' : Math.round(viewEnd);
                            const safeGenomeLen = genomeLen > 0 ? genomeLen : 1;
                            const zoomPct = ((safeGenomeLen / (viewEnd - viewStart || 1))).toFixed(1);
                            infoSpan.textContent = `${vStart} — ${vEnd} pb | Zoom: ${zoomPct}x`;
                        }

                        drawMinimap();
                    }

                    function drawMinimap() {
                        const w = miniCanvas.width;
                        const h = miniCanvas.height;
                        if (w === 0 || h === 0) return; // Evitar división por cero
                        
                        const centerY = h * 0.5;
                        mctx.clearRect(0, 0, w, h);
                        mctx.fillStyle = 'rgba(0,0,0,0.3)';
                        mctx.fillRect(0, 0, w, h);
                        // Genome line
                        mctx.strokeStyle = 'rgba(255,255,255,0.2)';
                        mctx.lineWidth = 1;
                        mctx.beginPath();
                        mctx.moveTo(0, centerY);
                        mctx.lineTo(w, centerY);
                        mctx.stroke();
                        // Gene ticks
                        const safeGenomeLen = genomeLen > 0 ? genomeLen : 1;
                        for (const g of sortedGenes) {
                            const x = (g.location.start / safeGenomeLen) * w;
                            const isPlus = g.location.strand === 1;
                            mctx.fillStyle = isPlus ? 'rgba(72,187,120,0.5)' : 'rgba(237,137,54,0.5)';
                            if (isPlus) {
                                mctx.fillRect(x, 2, Math.max(1, ((g.location.end - g.location.start) / safeGenomeLen) * w), centerY - 3);
                            } else {
                                mctx.fillRect(x, centerY + 1, Math.max(1, ((g.location.end - g.location.start) / safeGenomeLen) * w), centerY - 3);
                            }
                        }
                        // Viewport indicator
                        const vx1 = (viewStart / safeGenomeLen) * w;
                        const vx2 = (viewEnd / safeGenomeLen) * w;
                        mctx.strokeStyle = 'rgba(102,126,234,0.8)';
                        mctx.lineWidth = 2;
                        mctx.strokeRect(vx1, 0, vx2 - vx1, h);
                        mctx.fillStyle = 'rgba(102,126,234,0.1)';
                        mctx.fillRect(vx1, 0, vx2 - vx1, h);
                    }

                    function niceTickInterval(range) {
                        const rough = range / 8;
                        const pow = Math.pow(10, Math.floor(Math.log10(rough)));
                        const norm = rough / pow;
                        if (norm <= 1) return pow;
                        if (norm <= 2) return 2 * pow;
                        if (norm <= 5) return 5 * pow;
                        return 10 * pow;
                    }

                    function getGeneAt(mouseX, mouseY) {
                        const rect = canvas.getBoundingClientRect();
                        const x = (mouseX - rect.left) * dpr;
                        const y = (mouseY - rect.top) * dpr;
                        const w = canvas.width;
                        const h = canvas.height;
                        const viewLen = viewEnd - viewStart;
                        const centerY = h * 0.5;
                        const laneH = h * 0.18;
                        const pad = 4 * dpr;

                        for (const g of sortedGenes) {
                            if (g.location.end < viewStart || g.location.start > viewEnd) continue;
                            const x1 = Math.max(0, ((g.location.start - viewStart) / viewLen) * w);
                            const x2 = Math.min(w, ((g.location.end - viewStart) / viewLen) * w);
                            const isPlus = g.location.strand === 1;
                            const gy = isPlus ? centerY - 6 * dpr - laneH : centerY + 6 * dpr;
                            if (x >= x1 && x <= x2 && y >= (gy - pad) && y <= (gy + laneH + pad)) return g;
                        }
                        return null;
                    }

                    // Event handlers
                    canvas.addEventListener('wheel', (e) => {
                        e.preventDefault();
                        const rect = canvas.getBoundingClientRect();
                        const mouseRatio = (e.clientX - rect.left) / rect.width;
                        const viewLen = viewEnd - viewStart;
                        const zoomFactor = e.deltaY > 0 ? 1.2 : 0.8;
                        const safeGenomeLen = genomeLen > 0 ? genomeLen : 10000;
                        const newLen = Math.max(100, Math.min(safeGenomeLen, viewLen * zoomFactor));
                        const mousePos = viewStart + mouseRatio * viewLen;
                        viewStart = Math.max(0, mousePos - mouseRatio * newLen);
                        viewEnd = Math.min(safeGenomeLen, viewStart + newLen);
                        viewStart = viewEnd - newLen;
                        if (viewStart < 0) { viewStart = 0; viewEnd = newLen; }
                        draw();
                    }, { passive: false });

                    canvas.addEventListener('mousedown', (e) => {
                        isDragging = true;
                        dragStartX = e.clientX;
                        dragStartView = viewStart;
                        canvas.style.cursor = 'grabbing';
                    });

                    window.addEventListener('mousemove', (e) => {
                        if (isDragging) {
                            const dx = e.clientX - dragStartX;
                            const viewLen = viewEnd - viewStart;
                            const safeGenomeLen = genomeLen > 0 ? genomeLen : 1;
                            const shift = -(dx / canvas.clientWidth) * viewLen;
                            let newStart = dragStartView + shift;
                            newStart = Math.max(0, Math.min(safeGenomeLen - viewLen, newStart));
                            viewStart = newStart;
                            viewEnd = newStart + viewLen;
                            draw();
                            // Hide tooltip while dragging
                            if (tooltip) tooltip.style.display = 'none';
                        }
                    });

                    // Dedicated hover handler on the canvas for tooltip
                    canvas.addEventListener('mousemove', (e) => {
                        if (isDragging) return;
                        const tip = document.getElementById('genome-tooltip-body');
                        const g = getGeneAt(e.clientX, e.clientY);
                        if (g && tip) {
                            const len = g.location.end - g.location.start;
                            const strandColor = g.location.strand === 1 ? plusColor : minusColor;
                            const strandLabel = g.location.strand === 1 ? '→ (+) Forward' : '← (−) Reverse';

                            // Build rich tooltip with all general gene data
                            let html = `<div style="min-width: 280px;">`;

                            // Header: Gene name
                            html += `<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.15);">`;
                            html += `<span style="display: inline-block; width: 10px; height: 10px; border-radius: 2px; background: ${strandColor};"></span>`;
                            html += `<strong style="color: ${strandColor}; font-size: 1.05em;">${g.gene || 'Gen desconocido'}</strong>`;
                            if (g.locus_tag) html += `<span style="color: #718096; font-size: 0.8em; margin-left: auto;">${g.locus_tag}</span>`;
                            html += `</div>`;

                            // Product
                            if (g.product && g.product !== 'Unknown') {
                                html += `<div style="color: #cbd5e0; font-size: 0.9em; margin-bottom: 8px; font-style: italic;">${g.product}</div>`;
                            }

                            // Identifiers section
                            if (g.protein_id) {
                                html += `<div style="margin-bottom: 6px; font-size: 0.85em;">`;
                                html += `<span style="color: #a0aec0;">Protein ID:</span> <span style="color: #90cdf4;">${g.protein_id}</span>`;
                                html += `</div>`;
                            }

                            // Genomic position section
                            html += `<div style="padding: 6px 8px; background: rgba(255,255,255,0.05); border-radius: 4px; margin-bottom: 6px; font-size: 0.85em;">`;
                            html += `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">`;
                            html += `<div><span style="color: #a0aec0;">Inicio:</span> <strong>${g.location.start.toLocaleString()}</strong> pb</div>`;
                            html += `<div><span style="color: #a0aec0;">Fin:</span> <strong>${g.location.end.toLocaleString()}</strong> pb</div>`;
                            html += `<div><span style="color: #a0aec0;">Longitud:</span> <strong>${len.toLocaleString()}</strong> pb</div>`;
                            html += `<div><span style="color: #a0aec0;">Hebra:</span> <strong style="color: ${strandColor};">${strandLabel}</strong></div>`;
                            html += `</div></div>`;

                            // Protein info
                            if (g.protein_length > 0) {
                                html += `<div style="font-size: 0.85em; margin-bottom: 4px;">`;
                                html += `<span style="color: #a0aec0;">Proteína:</span> <strong>${g.protein_length.toLocaleString()}</strong> aa`;
                                if (g.codon_start && g.codon_start !== 1) {
                                    html += ` <span style="color: #718096;">(codon_start: ${g.codon_start})</span>`;
                                }
                                html += `</div>`;
                            }

                            // DB cross-references
                            if (g.db_xref && g.db_xref.length > 0) {
                                html += `<div style="font-size: 0.8em; color: #718096; margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.1);">`;
                                html += g.db_xref.map(ref => `<span style="background: rgba(102,126,234,0.15); padding: 1px 6px; border-radius: 3px; margin-right: 4px;">${ref}</span>`).join('');
                                html += `</div>`;
                            }

                            // Note
                            if (g.note) {
                                html += `<div style="font-size: 0.78em; color: #a0aec0; margin-top: 6px; line-height: 1.4; max-height: 40px; overflow: hidden;">${g.note}</div>`;
                            }

                            html += `</div>`;

                            tip.innerHTML = html;
                            tip.style.display = 'block';

                            // Ensure tooltip stays within viewport
                            const tipRect = tip.getBoundingClientRect();
                            let tipX = e.clientX + 15;
                            let tipY = e.clientY - 10;
                            if (tipX + tipRect.width > window.innerWidth - 10) {
                                tipX = e.clientX - tipRect.width - 15;
                            }
                            if (tipY + tipRect.height > window.innerHeight - 10) {
                                tipY = window.innerHeight - tipRect.height - 10;
                            }
                            tip.style.left = tipX + 'px';
                            tip.style.top = tipY + 'px';
                            canvas.style.cursor = 'crosshair';
                        } else if (tip) {
                            tip.style.display = 'none';
                            canvas.style.cursor = 'grab';
                        }
                    });

                    window.addEventListener('mouseup', () => {
                        isDragging = false;
                        canvas.style.cursor = 'grab';
                    });

                    canvas.addEventListener('mouseleave', () => {
                        const tip = document.getElementById('genome-tooltip-body');
                        if (tip) tip.style.display = 'none';
                    });

                    // Minimap click to navigate
                    miniCanvas.addEventListener('click', (e) => {
                        const rect = miniCanvas.getBoundingClientRect();
                        const ratio = (e.clientX - rect.left) / rect.width;
                        const viewLen = viewEnd - viewStart;
                        const safeGenomeLen = genomeLen > 0 ? genomeLen : 1;
                        viewStart = Math.max(0, Math.min(safeGenomeLen - viewLen, ratio * safeGenomeLen - viewLen / 2));
                        viewEnd = viewStart + viewLen;
                        draw();
                    });

                    // Resize handler
                    window.addEventListener('resize', () => { 
                        setCanvasSize(); 
                        draw(); 
                    });

                    // También redibujar cuando se cambia a la pestaña de genes
                    const genesTabBtn = document.querySelector('button[onclick*="showTab(\'genes\')"]');
                    if (genesTabBtn) {
                        const originalOnClick = genesTabBtn.onclick;
                        genesTabBtn.onclick = function(e) {
                            if (originalOnClick) originalOnClick.call(this, e);
                            setTimeout(() => {
                                setCanvasSize();
                                draw();
                            }, 50);
                        };
                    }

                    // API
                    window._genomeBrowser = {
                        resetView: () => { 
                            const safeGenomeLen = genomeLen > 0 ? genomeLen : 10000;
                            viewStart = 0; 
                            viewEnd = safeGenomeLen; 
                            draw(); 
                        },
                        zoomIn: () => {
                            const mid = (viewStart + viewEnd) / 2;
                            const half = (viewEnd - viewStart) / 4;
                            viewStart = Math.max(0, mid - half);
                            viewEnd = Math.min(genomeLen > 0 ? genomeLen : 10000, mid + half);
                            draw();
                        },
                        zoomOut: () => {
                            const mid = (viewStart + viewEnd) / 2;
                            const half = (viewEnd - viewStart);
                            const safeGenomeLen = genomeLen > 0 ? genomeLen : 10000;
                            viewStart = Math.max(0, mid - half);
                            viewEnd = Math.min(safeGenomeLen, mid + half);
                            draw();
                        },
                        redraw: () => {
                            setCanvasSize();
                            draw();
                        }
                    };

                    // Initial draw
                    setTimeout(() => {
                        setCanvasSize();
                        draw();
                    }, 100);
                }, 150);

                // ========== Top 20 Genes — bar chart by length ==========
                setTimeout(() => {
                    const ctx2 = document.getElementById('top-genes-chart')?.getContext('2d');
                    if (!ctx2) return;
                    window._top20Chart = new Chart(ctx2, {
                        type: 'bar',
                        data: {
                            labels: top20.map(g => g.gene || 'unknown'),
                            datasets: [{
                                label: 'Longitud (pb)',
                                data: top20.map(g => g.location.end - g.location.start),
                                backgroundColor: top20.map(g => g.location.strand === 1 ? 'rgba(72, 187, 120, 0.7)' : 'rgba(237, 137, 54, 0.7)'),
                                borderColor: top20.map(g => g.location.strand === 1 ? 'rgba(72, 187, 120, 1)' : 'rgba(237, 137, 54, 1)'),
                                borderWidth: 1
                            }]
                        },
                        options: {
                            indexAxis: 'y',
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    callbacks: {
                                        label: (item) => {
                                            const g = top20[item.dataIndex];
                                            const len = g.location.end - g.location.start;
                                            return `Longitud: ${len.toLocaleString()} pb`;
                                        },
                                        afterLabel: (item) => {
                                            const g = top20[item.dataIndex];
                                            return `Posición: ${g.location.start.toLocaleString()} — ${g.location.end.toLocaleString()} pb\nProducto: ${g.product || 'N/A'}\nHebra: ${g.location.strand === 1 ? '→ (+)' : '← (−)'}`;
                                        }
                                    }
                                },
                                zoom: {
                                    pan: { enabled: true, mode: 'x' },
                                    zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' }
                                }
                            },
                            scales: {
                                x: {
                                    beginAtZero: true,
                                    ticks: { color: '#a0aec0' },
                                    grid: { color: 'rgba(255,255,255,0.05)' },
                                    title: { display: true, text: 'Longitud (pb)', color: '#a0aec0' }
                                },
                                y: {
                                    ticks: { color: '#e2e8f0', font: { size: 11, weight: 'bold' } },
                                    grid: { display: false }
                                }
                            }
                        }
                    });
                }, 200);
            }
        }

        // 3. Agregar canvas a pestaña "Codones"
        const codonsTab = document.getElementById('codons');
        if (codonsTab && !document.getElementById('codon-chart')) {
            const codons = analysis.codons_analysis;
            const start = codons.start_codons.ATG;
            const stop = codons.stop_codons;
            const altStarts = codons.start_codons.alternative_starts || {};
            const startUsage = codons.start_codon_usage || {};

            // Usar valores FUNCIONALES para el gráfico (biológicamente correctos)
            const functionalStartATG = start.functional || 0;
            const functionalStartTotal = codons.start_codons.total_functional || startUsage.total || functionalStartATG;
            const functionalStop = stop.total_functional_stops || 0;
            const falseStart = start.false || 0;
            const totalStart = functionalStartATG + falseStart;

            const totalStops = stop.TAA.total + stop.TAG.total + stop.TGA.total;
            const falseStops = stop.total_false_stops || 0;
            const totalWithFalse = functionalStop + falseStops;

            const functionalStartPercent = totalStart > 0 ? ((functionalStartATG / totalStart) * 100).toFixed(1) : 0;
            const falseStartPercent = totalStart > 0 ? ((falseStart / totalStart) * 100).toFixed(1) : 0;
            const functionalStopPercent = totalWithFalse > 0 ? ((functionalStop / totalWithFalse) * 100).toFixed(1) : 0;
            const falseStopPercent = totalWithFalse > 0 ? ((falseStops / totalWithFalse) * 100).toFixed(1) : 0;

            // Construir HTML de codones alternativos
            let altStartsHTML = '';
            if (startUsage.GTG || startUsage.TTG || startUsage.CTG || startUsage.other) {
                const gtgCount = startUsage.GTG || 0;
                const ttgCount = startUsage.TTG || 0;
                const ctgCount = startUsage.CTG || 0;
                const otherCount = startUsage.other || 0;
                const totalAlt = gtgCount + ttgCount + ctgCount + otherCount;

                altStartsHTML = `
                    <div style="margin-top: 1rem; padding: 1rem; background: rgba(100,150,255,0.1); border-left: 3px solid #6495ED; border-radius: 4px;">
                        <p style="margin: 0.3rem 0; font-size: 0.85rem; color: rgba(255,255,255,0.7);">
                            <strong>🧬 CODONES DE INICIO ALTERNATIVOS:</strong>
                        </p>
                        <p style="margin: 0.3rem 0; color: rgba(255,255,255,0.85); font-size: 0.9rem;">
                            ${gtgCount > 0 ? `GTG: <strong>${gtgCount.toLocaleString()}</strong> genes<br>` : ''}
                            ${ttgCount > 0 ? `TTG: <strong>${ttgCount.toLocaleString()}</strong> genes<br>` : ''}
                            ${ctgCount > 0 ? `CTG: <strong>${ctgCount.toLocaleString()}</strong> genes<br>` : ''}
                            ${otherCount > 0 ? `Otros: <strong>${otherCount.toLocaleString()}</strong> genes<br>` : ''}
                        </p>
                        <p style="margin: 0.5rem 0 0; font-size: 0.8rem; color: rgba(255,255,255,0.6); font-style: italic;">
                            💡 En bacterias, ~5-15% de genes usan GTG/TTG en lugar de ATG como codón de inicio.
                            Esto explica por qué START ATG (${functionalStartATG.toLocaleString()}) ≠ STOP (${functionalStop.toLocaleString()})
                        </p>
                    </div>
                `;
            }

            const chartHTML = `
                <h3 style="margin-top: 2rem; margin-bottom: 1rem;">📊 Distribución de Codones (Funcionales vs Dentro/Fuera de CDS)</h3>
                <div style="display: flex; gap: 2rem; align-items: center; margin: 0 auto; max-width: 1000px;">
                    <div class="chart-container" style="flex: 0 0 550px;">
                        <canvas id="codon-chart"></canvas>
                    </div>
                    <div style="flex: 1; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px;">
                        <div style="margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid rgba(255,255,255,0.2);">
                            <p style="margin: 0.3rem 0; font-size: 0.85rem; color: rgba(255,255,255,0.6);">
                                <strong>🔬 CODONES FUNCIONALES (1 START + 1 STOP por gen):</strong>
                            </p>
                            <p style="margin: 0.3rem 0; color: rgba(255,255,255,0.9);">
                                START total: <strong style="color: #48bb78;">${functionalStartTotal.toLocaleString()}</strong> genes
                            </p>
                            <p style="margin: 0.3rem 0; color: rgba(255,255,255,0.85); font-size: 0.9rem; padding-left: 1rem;">
                                └ ATG: <strong>${functionalStartATG.toLocaleString()}</strong>
                                ${startUsage.GTG > 0 ? ` | GTG: <strong>${startUsage.GTG}</strong>` : ''}
                                ${startUsage.TTG > 0 ? ` | TTG: <strong>${startUsage.TTG}</strong>` : ''}
                            </p>
                            <p style="margin: 0.3rem 0; color: rgba(255,255,255,0.9);">
                                STOP total: <strong style="color: #48bb78;">${functionalStop.toLocaleString()}</strong> genes
                            </p>
                            <p style="margin: 0.3rem 0; font-size: 0.8rem; color: rgba(255,255,255,0.5); font-style: italic;">
                                ${functionalStartTotal === functionalStop ? '✓ Números coinciden correctamente' : '⚠ Diferencia debida a codones de inicio alternativos (GTG, TTG)'}
                            </p>
                        </div>
                        
                        ${altStartsHTML}
                        
                        <p style="margin: 0.5rem 0; margin-top: 1rem; font-size: 0.85rem; color: rgba(255,255,255,0.6);">
                            <strong>📊 COMPARACIÓN (Funcionales vs Dentro/Fuera de CDS):</strong>
                        </p>
                        <p style="margin: 0.5rem 0; color: rgba(255,255,255,0.9);">
                            <strong>START (ATG):</strong><br>
                            <span style="color: #48bb78;">${functionalStartATG.toLocaleString()} funcionales (${functionalStartPercent}%)</span><br>
                            <span style="color: #ed8936;">${falseStart.toLocaleString()} fuera de CDS (${falseStartPercent}%)</span>
                        </p>
                        <p style="margin: 0.5rem 0; color: rgba(255,255,255,0.9);">
                            <strong>STOP (TAA/TAG/TGA):</strong><br>
                            <span style="color: #48bb78;">${functionalStop.toLocaleString()} funcionales (${functionalStopPercent}%)</span><br>
                            <span style="color: #ed8936;">${falseStops.toLocaleString()} fuera de CDS (${falseStopPercent}%)</span>
                        </p>
                        <p style="margin: 0.5rem 0; padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); font-size: 0.85rem;">
                            Desglose STOP: TAA: ${stop.TAA.functional || 0} | TAG: ${stop.TAG.functional || 0} | TGA: ${stop.TGA.functional || 0}
                        </p>
                    </div>
                </div>
            `;
            // Insertar antes de la sección de frecuencia de 64 codones
            const h3List = codonsTab.querySelectorAll('h3');
            let insertBefore = null;
            for (const h3 of h3List) {
                if (h3.textContent.includes('Frecuencia de los 64')) {
                    insertBefore = h3;
                    break;
                }
            }
            if (insertBefore) {
                insertBefore.insertAdjacentHTML('beforebegin', chartHTML);
            } else {
                codonsTab.insertAdjacentHTML('beforeend', chartHTML);
            }

            // Renderizar gráfico
            if (window.renderCodonChart && codons) {
                setTimeout(() => renderCodonChart(codons), 50);
            }
        }

        // 4. Renderizar gráfico de frecuencia de 64 codones
        if (window.renderCodonFrequencyChart) {
            setTimeout(() => renderCodonFrequencyChart(), 150);
        }
    }

    // ==================== MODO COMPARACIÓN ====================

    // Guardar referencia a displayComparisonResults original
    const originalDisplayComparison = window.displayComparisonResults;

    if (originalDisplayComparison) {
        window.displayComparisonResults = function (comparison, genome1, genome2, aiInterpretation) {
            // Llamar a la función original
            const result = originalDisplayComparison.call(this, comparison, genome1, genome2, aiInterpretation);

            // Agregar gráficos de comparación
            setTimeout(() => {
                addComparisonCharts(genome1, genome2);
            }, 150);

            return result;
        };
    }

    // Función para agregar gráficos en modo comparación
    function addComparisonCharts(genome1, genome2) {
        // Destruir charts existentes primero
        if (window.destroyChart) {
            // Destruir charts individuales si existen
            destroyChart('nucleotide-chart');
            destroyChart('strand-chart');
            destroyChart('gene-length-histogram');
            destroyChart('codon-chart');
            // Destruir charts de comparación anteriores si existen
            destroyChart('nucleotide-comparison-g1');
            destroyChart('nucleotide-comparison-g2');
            destroyChart('strand-comparison-g1');
            destroyChart('strand-comparison-g2');
            destroyChart('length-comparison-g1');
            destroyChart('length-comparison-g2');
            destroyChart('codon-comparison-g1');
            destroyChart('codon-comparison-g2');
        }

        // 1. Composición de Nucleótidos (lado a lado)
        addNucleotideComparison(genome1, genome2);

        // 2. Distribución por Hebra (lado a lado)
        addStrandComparison(genome1, genome2);

        // 3. Longitud de Genes (lado a lado)
        addGeneLengthComparison(genome1, genome2);

        // 4. Codones con alternativos (lado a lado)
        addCodonComparison(genome1, genome2);
    }

    // 1. Composición de Nucleótidos - Comparación
    function addNucleotideComparison(genome1, genome2) {
        const basicTab = document.getElementById('basic');
        if (!basicTab || document.getElementById('nucleotide-comparison-g1')) return;

        const chartHTML = `
            <h3 style="margin-top: 3rem; margin-bottom: 1rem; border-top: 2px solid rgba(255,255,255,0.1); padding-top: 2rem;">📊 Composición de Nucleótidos - Comparación</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
                <!-- Genoma 1 -->
                <div>
                    <h4 style="color: #60a5fa; margin-bottom: 1rem;">${genome1.basic_info.organism} (Genoma 1)</h4>
                    <div class="chart-container" style="max-width: 400px; margin: 0 auto;">
                        <canvas id="nucleotide-comparison-g1"></canvas>
                    </div>
                    <div style="margin-top: 1rem; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px; font-size: 0.9rem;">
                        <p style="margin: 0.3rem 0;">A: ${((100 - genome1.gc_content) / 2).toFixed(1)}% | T: ${((100 - genome1.gc_content) / 2).toFixed(1)}%</p>
                        <p style="margin: 0.3rem 0;">C: ${(genome1.gc_content / 2).toFixed(1)}% | G: ${(genome1.gc_content / 2).toFixed(1)}%</p>
                        <p style="margin: 0.3rem 0; color: rgba(255,255,255,0.7);">GC: ${genome1.gc_content}%</p>
                    </div>
                </div>
                
                <!-- Genoma 2 -->
                <div>
                    <h4 style="color: #f472b6; margin-bottom: 1rem;">${genome2.basic_info.organism} (Genoma 2)</h4>
                    <div class="chart-container" style="max-width: 400px; margin: 0 auto;">
                        <canvas id="nucleotide-comparison-g2"></canvas>
                    </div>
                    <div style="margin-top: 1rem; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px; font-size: 0.9rem;">
                        <p style="margin: 0.3rem 0;">A: ${((100 - genome2.gc_content) / 2).toFixed(1)}% | T: ${((100 - genome2.gc_content) / 2).toFixed(1)}%</p>
                        <p style="margin: 0.3rem 0;">C: ${(genome2.gc_content / 2).toFixed(1)}% | G: ${(genome2.gc_content / 2).toFixed(1)}%</p>
                        <p style="margin: 0.3rem 0; color: rgba(255,255,255,0.7);">GC: ${genome2.gc_content}%</p>
                    </div>
                </div>
            </div>
        `;

        basicTab.insertAdjacentHTML('beforeend', chartHTML);

        // Renderizar gráficos
        if (window.renderNucleotideChart) {
            setTimeout(() => {
                renderNucleotideChart(genome1, 'nucleotide-comparison-g1');
                renderNucleotideChart(genome2, 'nucleotide-comparison-g2');
            }, 50);
        }
    }

    // 2. Distribución por Hebra - Comparación
    function addStrandComparison(genome1, genome2) {
        const genesTab = document.getElementById('genes');
        if (!genesTab || document.getElementById('strand-comparison-g1')) return;

        const genes1 = genome1.genes.genes_list || [];
        const genes2 = genome2.genes.genes_list || [];

        const chartHTML = `
            <h3 style="margin-top: 3rem; margin-bottom: 1rem; border-top: 2px solid rgba(255,255,255,0.1); padding-top: 2rem;">🧬 Distribución por Hebra - Comparación</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
                <!-- Genoma 1 -->
                <div>
                    <h4 style="color: #60a5fa; margin-bottom: 1rem;">${genome1.basic_info.organism}</h4>
                    <div class="chart-container" style="max-width: 400px; margin: 0 auto;">
                        <canvas id="strand-comparison-g1"></canvas>
                    </div>
                    <div style="margin-top: 1rem; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px; font-size: 0.9rem;">
                        <p style="margin: 0.3rem 0;">Hebra +: ${genome1.genes.distribution.plus} genes</p>
                        <p style="margin: 0.3rem 0;">Hebra -: ${genome1.genes.distribution.minus} genes</p>
                    </div>
                </div>
                
                <!-- Genoma 2 -->
                <div>
                    <h4 style="color: #f472b6; margin-bottom: 1rem;">${genome2.basic_info.organism}</h4>
                    <div class="chart-container" style="max-width: 400px; margin: 0 auto;">
                        <canvas id="strand-comparison-g2"></canvas>
                    </div>
                    <div style="margin-top: 1rem; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px; font-size: 0.9rem;">
                        <p style="margin: 0.3rem 0;">Hebra +: ${genome2.genes.distribution.plus} genes</p>
                        <p style="margin: 0.3rem 0;">Hebra -: ${genome2.genes.distribution.minus} genes</p>
                    </div>
                </div>
            </div>
            
            <h3 style="margin-top: 2rem; margin-bottom: 1rem;">📏 Distribución de Longitud de Genes - Comparación</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                <!-- Genoma 1 -->\n                <div>
                    <h4 style="color: #60a5fa; margin-bottom: 1rem;">${genome1.basic_info.organism}</h4>
                    <div class="chart-container" style="max-width: 500px; margin: 0 auto;">
                        <canvas id="length-comparison-g1"></canvas>
                    </div>
                    <div style="margin-top: 1rem; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px; font-size: 0.9rem;">
                        <p style="margin: 0.3rem 0;">Promedio: ${genome1.genes.average_gene_length?.toFixed(0) || 'N/A'} pb</p>
                        <p style="margin: 0.3rem 0;">Total genes: ${genome1.genes.total_cds}</p>
                    </div>
                </div>
                
                <!-- Genoma 2 -->
                <div>
                    <h4 style="color: #f472b6; margin-bottom: 1rem;">${genome2.basic_info.organism}</h4>
                    <div class="chart-container" style="max-width: 500px; margin: 0 auto;">
                        <canvas id="length-comparison-g2"></canvas>
                    </div>
                    <div style="margin-top: 1rem; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px; font-size: 0.9rem;">
                        <p style="margin: 0.3rem 0;">Promedio: ${genome2.genes.average_gene_length?.toFixed(0) || 'N/A'} pb</p>
                        <p style="margin: 0.3rem 0;">Total genes: ${genome2.genes.total_cds}</p>
                    </div>
                </div>
            </div>
        `;

        genesTab.insertAdjacentHTML('beforeend', chartHTML);

        // Renderizar gráficos
        if (window.renderStrandChart && genes1.length > 0) {
            setTimeout(() => renderStrandChart(genes1, 'strand-comparison-g1'), 50);
        }
        if (window.renderStrandChart && genes2.length > 0) {
            setTimeout(() => renderStrandChart(genes2, 'strand-comparison-g2'), 50);
        }
        if (window.renderGeneLengthHistogram && genes1.length > 0) {
            setTimeout(() => renderGeneLengthHistogram(genes1, 'length-comparison-g1'), 50);
        }
        if (window.renderGeneLengthHistogram && genes2.length > 0) {
            setTimeout(() => renderGeneLengthHistogram(genes2, 'length-comparison-g2'), 50);
        }
    }

    // 3. Longitud de Genes ya está incluido en addStrandComparison
    function addGeneLengthComparison(genome1, genome2) {
        // Ya implementado en addStrandComparison para mejor organización
    }

    // 4. Codones con Alternativos - Comparación
    function addCodonComparison(genome1, genome2) {
        const codonsTab = document.getElementById('codons');
        if (!codonsTab || document.getElementById('codon-comparison-g1')) return;

        const codons1 = genome1.codons_analysis;
        const codons2 = genome2.codons_analysis;
        const usage1 = codons1.start_codon_usage || {};
        const usage2 = codons2.start_codon_usage || {};

        const chartHTML = `
            <h3 style="margin-top: 3rem; margin-bottom: 1rem; border-top: 2px solid rgba(255,255,255,0.1); padding-top: 2rem;">🔬 Análisis de Codones - Comparación</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                <!-- Genoma 1 -->
                <div>
                    <h4 style="color: #60a5fa; margin-bottom: 1rem;">${genome1.basic_info.organism}</h4>
                    <div class="chart-container" style="max-width: 450px; margin: 0 auto;">
                        <canvas id="codon-comparison-g1"></canvas>
                    </div>
                    <div style="margin-top: 1rem; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px; font-size: 0.85rem;">
                        <p style="margin: 0.3rem 0; font-weight: bold; color: #60a5fa;">Codones Funcionales:</p>
                        <p style="margin: 0.3rem 0;">START total: ${usage1.total || 0}</p>
                        <p style="margin: 0.3rem 0; padding-left: 1rem; font-size: 0.8rem;">
                            ATG: ${usage1.ATG || 0}
                            ${usage1.GTG > 0 ? ` | GTG: ${usage1.GTG}` : ''}
                            ${usage1.TTG > 0 ? ` | TTG: ${usage1.TTG}` : ''}
                        </p>
                        <p style="margin: 0.3rem 0;">STOP total: ${codons1.stop_codons.total_functional_stops || 0}</p>
                        <p style="margin: 0.3rem 0; padding-left: 1rem; font-size: 0.8rem;">
                            TAA: ${codons1.stop_codons.TAA.functional || 0} | 
                            TAG: ${codons1.stop_codons.TAG.functional || 0} | 
                            TGA: ${codons1.stop_codons.TGA.functional || 0}
                        </p>
                    </div>
                </div>
                
                <!-- Genoma 2 -->
                <div>
                    <h4 style="color: #f472b6; margin-bottom: 1rem;">${genome2.basic_info.organism}</h4>
                    <div class="chart-container" style="max-width: 450px; margin: 0 auto;">
                        <canvas id="codon-comparison-g2"></canvas>
                    </div>
                    <div style="margin-top: 1rem; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px; font-size: 0.85rem;">
                        <p style="margin: 0.3rem 0; font-weight: bold; color: #f472b6;">Codones Funcionales:</p>
                        <p style="margin: 0.3rem 0;">START total: ${usage2.total || 0}</p>
                        <p style="margin: 0.3rem 0; padding-left: 1rem; font-size: 0.8rem;">
                            ATG: ${usage2.ATG || 0}
                            ${usage2.GTG > 0 ? ` | GTG: ${usage2.GTG}` : ''}
                            ${usage2.TTG > 0 ? ` | TTG: ${usage2.TTG}` : ''}
                        </p>
                        <p style="margin: 0.3rem 0;">STOP total: ${codons2.stop_codons.total_functional_stops || 0}</p>
                        <p style="margin: 0.3rem 0; padding-left: 1rem; font-size: 0.8rem;">
                            TAA: ${codons2.stop_codons.TAA.functional || 0} | 
                            TAG: ${codons2.stop_codons.TAG.functional || 0} | 
                            TGA: ${codons2.stop_codons.TGA.functional || 0}
                        </p>
                    </div>
                </div>
            </div>
        `;

        codonsTab.insertAdjacentHTML('beforeend', chartHTML);

        // Renderizar gráficos
        if (window.renderCodonChart) {
            setTimeout(() => {
                renderCodonChart(codons1, 'codon-comparison-g1');
                renderCodonChart(codons2, 'codon-comparison-g2');
            }, 50);
        }
    }
});
