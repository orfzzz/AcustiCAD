/**
 * Gera um arquivo HTML único, 100% autônomo (HTML+CSS+JS inline)
 * com o mesmo editor de diagramas vetoriais de circuitos acústicos e elétricos,
 * funcionando sem necessidade de servidor ou conexão externa.
 */
export function exportSingleHtmlApp(): void {
  const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Editor de Diagramas Acústicos e Elétricos (Arquivo Único)</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; height: 100vh; overflow: hidden; background: #f3f4f6; color: #111827; }
    header { height: 50px; background: #fff; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; font-size: 13px; font-weight: 500; }
    .main-area { display: flex; flex: 1; overflow: hidden; }
    aside { width: 260px; background: #fff; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column; overflow-y: auto; padding: 12px; gap: 8px; }
    .canvas-container { flex: 1; position: relative; background: #f9fafb; overflow: hidden; cursor: default; }
    svg { width: 100%; height: 100%; display: block; }
    .btn { padding: 6px 12px; border-radius: 6px; border: 1px solid #d1d5db; background: #fff; cursor: pointer; font-size: 12px; font-weight: 500; display: inline-flex; align-items: center; gap: 4px; }
    .btn:hover { background: #f3f4f6; }
    .btn-primary { background: #111827; color: #fff; border-color: #111827; }
    .btn-primary:hover { background: #1f2937; }
    .palette-card { display: flex; align-items: center; padding: 8px; border: 1px solid #e5e7eb; border-radius: 6px; cursor: pointer; background: #fff; gap: 10px; }
    .palette-card:hover { border-color: #9ca3af; background: #fafafa; }
    .palette-icon { width: 44px; height: 50px; border: 1px solid #f3f4f6; border-radius: 4px; display: flex; align-items: center; justify-content: center; background: #fff; }
    .math-text { font-family: 'Crimson Pro', Georgia, serif; font-style: italic; }
    .active-tool { background: #e5e7eb; }
  </style>
</head>
<body>
  <header>
    <div style="display:flex; align-items:center; gap:8px;">
      <strong style="font-size:14px;">Editor Acústico & Elétrico</strong>
      <span style="color:#6b7280; font-size:12px;">(Analogias Acústicas - Figura 4.5)</span>
    </div>
    <div style="display:flex; gap:8px;">
      <button class="btn" id="btn-undo">Desfazer</button>
      <button class="btn" id="btn-rotate">Girar 90° (R)</button>
      <button class="btn" id="btn-delete" style="color:#dc2626;">Excluir</button>
      <button class="btn" id="btn-clear">Limpar</button>
      <button class="btn btn-primary" id="btn-export-png">Exportar PNG (3x)</button>
    </div>
  </header>

  <div class="main-area">
    <aside id="palette">
      <h3 style="font-size:11px; text-transform:uppercase; color:#6b7280; letter-spacing:0.05em; margin-bottom:4px;">Componentes Acústicos</h3>
      <div class="palette-card" data-type="acoustic_mass">
        <div class="palette-icon">
          <svg viewBox="0 0 40 70" width="30" height="45">
            <line x1="27" y1="0" x2="27" y2="52" stroke="#111" stroke-width="2"/>
            <line x1="13" y1="18" x2="13" y2="70" stroke="#111" stroke-width="2"/>
            <ellipse cx="20" cy="18" rx="7" ry="3.5" fill="#fff" stroke="#111" stroke-width="2"/>
            <ellipse cx="20" cy="52" rx="7" ry="3.5" fill="#fff" stroke="#111" stroke-width="2"/>
          </svg>
        </div>
        <div>
          <div style="font-weight:600; font-size:12px;">Massa Acústica</div>
          <div style="font-size:11px; color:#6b7280;">Símbolo: M_a</div>
        </div>
      </div>

      <div class="palette-card" data-type="acoustic_compliance">
        <div class="palette-icon">
          <svg viewBox="0 0 40 70" width="30" height="45">
            <line x1="20" y1="0" x2="20" y2="20" stroke="#111" stroke-width="2"/>
            <path d="M 12 20 H 5 V 50 H 35 V 20 H 20" fill="none" stroke="#111" stroke-width="2"/>
            <line x1="20" y1="50" x2="20" y2="70" stroke="#111" stroke-width="2"/>
          </svg>
        </div>
        <div>
          <div style="font-weight:600; font-size:12px;">Compliância Acústica</div>
          <div style="font-size:11px; color:#6b7280;">Símbolo: C_a</div>
        </div>
      </div>

      <div class="palette-card" data-type="acoustic_resistance">
        <div class="palette-icon">
          <svg viewBox="0 0 40 70" width="30" height="45">
            <defs>
              <pattern id="hatch-icon" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="6" stroke="#111" stroke-width="1.5" />
              </pattern>
            </defs>
            <line x1="20" y1="0" x2="20" y2="20" stroke="#111" stroke-width="2"/>
            <rect x="5" y="20" width="30" height="30" fill="url(#hatch-icon)" stroke="#111" stroke-width="2"/>
            <line x1="20" y1="50" x2="20" y2="70" stroke="#111" stroke-width="2"/>
          </svg>
        </div>
        <div>
          <div style="font-weight:600; font-size:12px;">Resistência Acústica</div>
          <div style="font-size:11px; color:#6b7280;">Símbolo: R_a</div>
        </div>
      </div>

      <div class="palette-card" data-type="pressure_source">
        <div class="palette-icon">
          <svg viewBox="0 0 40 70" width="30" height="45">
            <line x1="20" y1="0" x2="20" y2="17" stroke="#111" stroke-width="2"/>
            <circle cx="20" cy="35" r="18" fill="#fff" stroke="#111" stroke-width="2"/>
            <path d="M 10 35 C 13 25, 17 25, 20 35 C 23 45, 27 45, 30 35" fill="none" stroke="#111" stroke-width="2"/>
            <line x1="20" y1="53" x2="20" y2="70" stroke="#111" stroke-width="2"/>
          </svg>
        </div>
        <div>
          <div style="font-weight:600; font-size:12px;">Fonte Pressão (Pin)</div>
          <div style="font-size:11px; color:#6b7280;">Fonte AC</div>
        </div>
      </div>

      <h3 style="font-size:11px; text-transform:uppercase; color:#6b7280; letter-spacing:0.05em; margin-top:8px; margin-bottom:4px;">Componentes Elétricos</h3>
      <div class="palette-card" data-type="inductor">
        <div class="palette-icon">
          <svg viewBox="0 0 32 70" width="25" height="45">
            <line x1="16" y1="0" x2="16" y2="15" stroke="#111" stroke-width="2"/>
            <path d="M 16 15 C 27 15, 27 25, 16 25 C 27 25, 27 35, 16 35 C 27 35, 27 45, 16 45 C 27 45, 27 55, 16 55" fill="none" stroke="#111" stroke-width="2"/>
            <line x1="16" y1="55" x2="16" y2="70" stroke="#111" stroke-width="2"/>
          </svg>
        </div>
        <div>
          <div style="font-weight:600; font-size:12px;">Indutor (L)</div>
          <div style="font-size:11px; color:#6b7280;">Eq. M.D. da Massa</div>
        </div>
      </div>

      <div class="palette-card" data-type="capacitor">
        <div class="palette-icon">
          <svg viewBox="0 0 40 70" width="30" height="45">
            <line x1="20" y1="0" x2="20" y2="31" stroke="#111" stroke-width="2"/>
            <line x1="4" y1="31" x2="36" y2="31" stroke="#111" stroke-width="2.5"/>
            <line x1="4" y1="39" x2="36" y2="39" stroke="#111" stroke-width="2.5"/>
            <line x1="20" y1="39" x2="20" y2="70" stroke="#111" stroke-width="2"/>
          </svg>
        </div>
        <div>
          <div style="font-weight:600; font-size:12px;">Capacitor (C)</div>
          <div style="font-size:11px; color:#6b7280;">Eq. M.D. Compliância</div>
        </div>
      </div>

      <div class="palette-card" data-type="resistor">
        <div class="palette-icon">
          <svg viewBox="0 0 30 70" width="25" height="45">
            <line x1="15" y1="0" x2="15" y2="16" stroke="#111" stroke-width="2"/>
            <path d="M 15 16 L 24 21 L 6 27 L 24 33 L 6 39 L 24 45 L 6 51 L 15 54" fill="none" stroke="#111" stroke-width="2"/>
            <line x1="15" y1="54" x2="15" y2="70" stroke="#111" stroke-width="2"/>
          </svg>
        </div>
        <div>
          <div style="font-weight:600; font-size:12px;">Resistor (R)</div>
          <div style="font-size:11px; color:#6b7280;">Eq. M.D. Resistência</div>
        </div>
      </div>

      <div class="palette-card" data-type="ground">
        <div class="palette-icon">
          <svg viewBox="0 0 36 40" width="28" height="35">
            <line x1="18" y1="0" x2="18" y2="16" stroke="#111" stroke-width="2"/>
            <line x1="5" y1="16" x2="31" y2="16" stroke="#111" stroke-width="2"/>
            <line x1="9" y1="22" x2="27" y2="22" stroke="#111" stroke-width="2"/>
            <line x1="13" y1="28" x2="23" y2="28" stroke="#111" stroke-width="2"/>
          </svg>
        </div>
        <div>
          <div style="font-weight:600; font-size:12px;">Terra / Referência</div>
          <div style="font-size:11px; color:#6b7280;">Aterramento</div>
        </div>
      </div>
    </aside>

    <div class="canvas-container" id="canvas-wrap">
      <svg id="main-svg">
        <defs>
          <pattern id="grid-dots" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="1" fill="#d1d5db" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-dots)" />
        <g id="circuit-root"></g>
      </svg>
    </div>
  </div>

  <script>
    const svgRoot = document.getElementById('circuit-root');
    let components = [
      { id: '1', type: 'acoustic_mass', x: 100, y: 100, rot: 0, label: 'M_a' },
      { id: '2', type: 'inductor', x: 260, y: 100, rot: 0, label: 'j\\u03C9M_a' },
      { id: '3', type: 'acoustic_compliance', x: 100, y: 260, rot: 0, label: 'C_a' },
      { id: '4', type: 'capacitor', x: 260, y: 260, rot: 0, label: '1/j\\u03C9C_a' },
      { id: '5', type: 'acoustic_resistance', x: 100, y: 420, rot: 0, label: 'R_a' },
      { id: '6', type: 'resistor', x: 260, y: 420, rot: 0, label: 'R_a' }
    ];
    let selectedId = null;

    function render() {
      svgRoot.innerHTML = '';
      components.forEach(comp => {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('transform', \`translate(\${comp.x}, \${comp.y}) rotate(\${comp.rot}, 20, 35)\`);
        g.style.cursor = 'move';
        
        let shape = '';
        if (comp.type === 'acoustic_mass') {
          shape = '<line x1="27" y1="0" x2="27" y2="52" stroke="#111" stroke-width="1.8"/><line x1="13" y1="18" x2="13" y2="70" stroke="#111" stroke-width="1.8"/><ellipse cx="20" cy="18" rx="7" ry="3.5" fill="#fff" stroke="#111" stroke-width="1.8"/><ellipse cx="20" cy="52" rx="7" ry="3.5" fill="#fff" stroke="#111" stroke-width="1.8"/>';
        } else if (comp.type === 'acoustic_compliance') {
          shape = '<line x1="20" y1="0" x2="20" y2="20" stroke="#111" stroke-width="1.8"/><polygon points="5,20 5,50 35,50 35,20" fill="#fff" stroke="none"/><path d="M 12 20 H 5 V 50 H 35 V 20 H 20" fill="none" stroke="#111" stroke-width="1.8"/><line x1="20" y1="50" x2="20" y2="70" stroke="#111" stroke-width="1.8"/>';
        } else if (comp.type === 'acoustic_resistance') {
          shape = '<defs><pattern id="hatch-canvas" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="0" y2="6" stroke="#111" stroke-width="1.5"/></pattern></defs><line x1="20" y1="0" x2="20" y2="20" stroke="#111" stroke-width="1.8"/><rect x="5" y="20" width="30" height="30" fill="url(#hatch-canvas)" stroke="#111" stroke-width="1.8"/><line x1="20" y1="50" x2="20" y2="70" stroke="#111" stroke-width="1.8"/>';
        } else if (comp.type === 'inductor') {
          shape = '<line x1="16" y1="0" x2="16" y2="15" stroke="#111" stroke-width="1.8"/><path d="M 16 15 C 27 15, 27 25, 16 25 C 27 25, 27 35, 16 35 C 27 35, 27 45, 16 45 C 27 45, 27 55, 16 55" fill="none" stroke="#111" stroke-width="1.8"/><line x1="16" y1="55" x2="16" y2="70" stroke="#111" stroke-width="1.8"/>';
        } else if (comp.type === 'capacitor') {
          shape = '<line x1="20" y1="0" x2="20" y2="31" stroke="#111" stroke-width="1.8"/><line x1="4" y1="31" x2="36" y2="31" stroke="#111" stroke-width="2.2"/><line x1="4" y1="39" x2="36" y2="39" stroke="#111" stroke-width="2.2"/><line x1="20" y1="39" x2="20" y2="70" stroke="#111" stroke-width="1.8"/>';
        } else if (comp.type === 'resistor') {
          shape = '<line x1="15" y1="0" x2="15" y2="16" stroke="#111" stroke-width="1.8"/><path d="M 15 16 L 24 21 L 6 27 L 24 33 L 6 39 L 24 45 L 6 51 L 15 54" fill="none" stroke="#111" stroke-width="1.8"/><line x1="15" y1="54" x2="15" y2="70" stroke="#111" stroke-width="1.8"/>';
        } else if (comp.type === 'ground') {
          shape = '<line x1="18" y1="0" x2="18" y2="16" stroke="#111" stroke-width="1.8"/><line x1="5" y1="16" x2="31" y2="16" stroke="#111" stroke-width="1.8"/><line x1="9" y1="22" x2="27" y2="22" stroke="#111" stroke-width="1.8"/><line x1="13" y1="28" x2="23" y2="28" stroke="#111" stroke-width="1.8"/>';
        }

        const isSel = comp.id === selectedId;
        const selRect = isSel ? '<rect x="-4" y="-4" width="48" height="78" fill="none" stroke="#2563eb" stroke-dasharray="3 3"/>' : '';
        const labelText = \`<text x="48" y="38" font-family="Georgia, serif" font-size="18" fill="#111">\${comp.label}</text>\`;

        g.innerHTML = selRect + shape + labelText;

        // Arrasto
        g.addEventListener('mousedown', (e) => {
          e.stopPropagation();
          selectedId = comp.id;
          render();
          const startX = e.clientX - comp.x;
          const startY = e.clientY - comp.y;
          function onMove(ev) {
            comp.x = Math.round((ev.clientX - startX) / 20) * 20;
            comp.y = Math.round((ev.clientY - startY) / 20) * 20;
            render();
          }
          function onUp() {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
          }
          window.addEventListener('mousemove', onMove);
          window.addEventListener('mouseup', onUp);
        });

        svgRoot.appendChild(g);
      });
    }

    // Clique no fundo para desselecionar
    document.getElementById('main-svg').addEventListener('mousedown', () => {
      selectedId = null;
      render();
    });

    // Inserção da paleta
    document.querySelectorAll('.palette-card').forEach(card => {
      card.addEventListener('click', () => {
        const type = card.getAttribute('data-type');
        components.push({
          id: String(Date.now()),
          type,
          x: 200,
          y: 200,
          rot: 0,
          label: type === 'acoustic_mass' ? 'M_a' : type === 'acoustic_compliance' ? 'C_a' : type === 'acoustic_resistance' ? 'R_a' : 'Z'
        });
        render();
      });
    });

    // Ações
    document.getElementById('btn-rotate').addEventListener('click', () => {
      const c = components.find(item => item.id === selectedId);
      if (c) {
        c.rot = (c.rot + 90) % 360;
        render();
      }
    });

    document.getElementById('btn-delete').addEventListener('click', () => {
      components = components.filter(item => item.id !== selectedId);
      selectedId = null;
      render();
    });

    document.getElementById('btn-clear').addEventListener('click', () => {
      if (confirm('Limpar todo o diagrama?')) {
        components = [];
        selectedId = null;
        render();
      }
    });

    // Exportar PNG 3x
    document.getElementById('btn-export-png').addEventListener('click', () => {
      const svg = document.getElementById('main-svg');
      const cloned = svg.cloneNode(true);
      const xml = new XMLSerializer().serializeToString(cloned);
      const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = svg.clientWidth * 3;
        canvas.height = svg.clientHeight * 3;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const a = document.createElement('a');
        a.download = 'circuito_acustico_3x.png';
        a.href = canvas.toDataURL('image/png');
        a.click();
      };
      img.src = url;
    });

    render();
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'editor_circuitos_acusticos_autonomo.html';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
