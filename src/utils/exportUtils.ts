import { ComponentInstance, WireConnection } from '../types';

interface ExportOptions {
  scale?: number; // 3x ou 4x para alta resolução
  transparentBg?: boolean;
  padding?: number;
  customBounds?: { x: number; y: number; width: number; height: number };
}

/**
 * Calcula o bounding box de todos os componentes e fios no diagrama
 */
export function calculateDiagramBounds(
  components: ComponentInstance[],
  wires: WireConnection[],
  padding: number = 40
) {
  if (components.length === 0 && wires.length === 0) {
    return { x: 0, y: 0, width: 800, height: 600 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const c of components) {
    minX = Math.min(minX, c.x - 30);
    minY = Math.min(minY, c.y - 30);
    maxX = Math.max(maxX, c.x + c.width + 70); // conta com rótulos e setas
    maxY = Math.max(maxY, c.y + c.height + 40);
  }

  for (const w of wires) {
    minX = Math.min(minX, w.fromPoint.x, w.toPoint.x);
    minY = Math.min(minY, w.fromPoint.y, w.toPoint.y);
    maxX = Math.max(maxX, w.fromPoint.x, w.toPoint.x);
    maxY = Math.max(maxY, w.fromPoint.y, w.toPoint.y);
    for (const pt of w.waypoints) {
      minX = Math.min(minX, pt.x);
      minY = Math.min(minY, pt.y);
      maxX = Math.max(maxX, pt.x);
      maxY = Math.max(maxY, pt.y);
    }
  }

  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  return {
    x: Math.floor(minX),
    y: Math.floor(minY),
    width: Math.ceil(maxX - minX),
    height: Math.ceil(maxY - minY),
  };
}

/**
 * Exporta o SVG como arquivo PNG em alta resolução (3x / 4x)
 */
export async function exportToPng(
  svgElement: SVGSVGElement,
  components: ComponentInstance[],
  wires: WireConnection[],
  options: ExportOptions = {}
): Promise<void> {
  const scale = options.scale || 3; // Pelo menos 3x conforme solicitado
  const transparent = options.transparentBg || false;
  const padding = options.padding || 40;

  const bounds =
    options.customBounds && options.customBounds.width > 10 && options.customBounds.height > 10
      ? {
          x: Math.floor(options.customBounds.x),
          y: Math.floor(options.customBounds.y),
          width: Math.ceil(options.customBounds.width),
          height: Math.ceil(options.customBounds.height),
        }
      : calculateDiagramBounds(components, wires, padding);

  // Limite seguro de dimensões do canvas
  const MAX_CANVAS_DIMENSION = 16384;
  const MAX_CANVAS_AREA = 16777216;

  let effectiveScale = scale;

  if (
    bounds.width * effectiveScale > MAX_CANVAS_DIMENSION ||
    bounds.height * effectiveScale > MAX_CANVAS_DIMENSION
  ) {
    effectiveScale = Math.min(
      effectiveScale,
      MAX_CANVAS_DIMENSION / bounds.width,
      MAX_CANVAS_DIMENSION / bounds.height
    );
  }

  if (bounds.width * effectiveScale * (bounds.height * effectiveScale) > MAX_CANVAS_AREA) {
    effectiveScale = Math.min(
      effectiveScale,
      Math.sqrt(MAX_CANVAS_AREA / (bounds.width * bounds.height))
    );
  }

  // Clona o elemento SVG para manipular os atributos de viewBox sem mexer na tela
  const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;

  // Remove elementos interativos como seletores, grade, guias de corte e cursores do SVG exportado
  const interactiveLayer = clonedSvg.querySelector('#interactive-layer');
  if (interactiveLayer) interactiveLayer.remove();

  const gridLayer = clonedSvg.querySelector('#grid-layer');
  if (gridLayer) gridLayer.remove();

  const exportAreaOverlay = clonedSvg.querySelector('#export-area-overlay');
  if (exportAreaOverlay) exportAreaOverlay.remove();

  // Define dimensões e viewBox exatos em torno do diagrama ou área de corte
  clonedSvg.setAttribute('width', `${bounds.width}`);
  clonedSvg.setAttribute('height', `${bounds.height}`);
  clonedSvg.setAttribute(
    'viewBox',
    `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`
  );

  // Garante namespace
  clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  // Adiciona estilo de tipografia seguro (sem @import externo que causa Canvas error state)
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    text {
      font-family: 'Crimson Pro', Georgia, 'Times New Roman', serif;
    }
  `;
  clonedSvg.insertBefore(styleEl, clonedSvg.firstChild);

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clonedSvg);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const img = new Image();

  return new Promise((resolve, reject) => {
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(bounds.width * effectiveScale);
        canvas.height = Math.round(bounds.height * effectiveScale);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Falha ao criar contexto 2D do Canvas'));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Fundo branco ou transparente
        if (!transparent) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        // Desenha a imagem renderizada
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);

        canvas.toBlob(
          (pngBlob) => {
            if (!pngBlob) {
              reject(new Error('Falha ao gerar blob PNG'));
              return;
            }
            const downloadUrl = URL.createObjectURL(pngBlob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `circuito_acustico_eletrico_${effectiveScale.toFixed(
              effectiveScale % 1 === 0 ? 0 : 1
            )}x.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(downloadUrl);
            resolve();
          },
          'image/png',
          1.0
        );
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };

    img.src = url;
  });
}

/**
 * Exporta diretamente o código vetorial SVG em arquivo .svg
 */
export function exportToSvg(
  svgElement: SVGSVGElement,
  components: ComponentInstance[],
  wires: WireConnection[],
  paddingOrCustomBounds: number | { x: number; y: number; width: number; height: number } = 40
): void {
  const bounds =
    typeof paddingOrCustomBounds === 'object' &&
    paddingOrCustomBounds.width > 10 &&
    paddingOrCustomBounds.height > 10
      ? paddingOrCustomBounds
      : calculateDiagramBounds(
          components,
          wires,
          typeof paddingOrCustomBounds === 'number' ? paddingOrCustomBounds : 40
        );

  const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;

  const interactiveLayer = clonedSvg.querySelector('#interactive-layer');
  if (interactiveLayer) interactiveLayer.remove();

  const gridLayer = clonedSvg.querySelector('#grid-layer');
  if (gridLayer) gridLayer.remove();

  const exportAreaOverlay = clonedSvg.querySelector('#export-area-overlay');
  if (exportAreaOverlay) exportAreaOverlay.remove();

  clonedSvg.setAttribute('width', `${bounds.width}`);
  clonedSvg.setAttribute('height', `${bounds.height}`);
  clonedSvg.setAttribute(
    'viewBox',
    `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`
  );
  clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  const styleEl = document.createElement('style');
  styleEl.textContent = `
    text {
      font-family: 'Crimson Pro', Georgia, 'Times New Roman', serif;
    }
  `;
  clonedSvg.insertBefore(styleEl, clonedSvg.firstChild);

  // Insere um retângulo de fundo branco para ficar nítido em visualizadores
  const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bgRect.setAttribute('x', `${bounds.x}`);
  bgRect.setAttribute('y', `${bounds.y}`);
  bgRect.setAttribute('width', `${bounds.width}`);
  bgRect.setAttribute('height', `${bounds.height}`);
  bgRect.setAttribute('fill', '#ffffff');
  clonedSvg.insertBefore(bgRect, clonedSvg.firstChild);

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clonedSvg);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const downloadUrl = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = 'circuito_acustico_eletrico.svg';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}

/**
 * Salva o projeto completo em formato JSON
 */
export function exportToJson(components: ComponentInstance[], wires: WireConnection[]): void {
  const data = {
    app: 'Editor de Circuitos Acústicos e Elétricos',
    version: 1,
    exportDate: new Date().toISOString(),
    components,
    wires,
  };

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'circuito.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}