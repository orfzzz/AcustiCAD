import { ComponentInstance, WireConnection, WirePoint } from '../types';
import { COMPONENT_REGISTRY } from '../data/componentRegistry';

export function snapToGrid(val: number, gridSize: number = 20): number {
  return Math.round(val / gridSize) * gridSize;
}

export function snapPoint(pt: WirePoint, gridSize: number = 20): WirePoint {
  return {
    x: snapToGrid(pt.x, gridSize),
    y: snapToGrid(pt.y, gridSize),
  };
}

/**
 * Calcula a posição absoluta (no canvas) de uma porta de um componente,
 * levando em conta a rotação (0, 90, 180, 270) em torno do centro do componente.
 */
export function getRotatedPortPosition(
  comp: ComponentInstance,
  portId: string
): WirePoint | null {
  const meta = COMPONENT_REGISTRY[comp.type];
  if (!meta) return null;

  const portDef = meta.ports.find((p) => p.id === portId);
  if (!portDef) return null;

  const cx = comp.width / 2;
  const cy = comp.height / 2;

  let localX = portDef.x;
  let localY = portDef.y;

  if (comp.type === 'transformer') {
    if (portId === 'p1') {
      localX = 0;
      localY = 0;
    } else if (portId === 'p2') {
      localX = 0;
      localY = comp.height;
    } else if (portId === 'p3') {
      localX = comp.width;
      localY = 0;
    } else if (portId === 'p4') {
      localX = comp.width;
      localY = comp.height;
    }
  } else if (comp.type === 'wire_segment') {
    if (portId === 'end') {
      localX = comp.width;
    }
  }

  const dx = localX - cx;
  const dy = localY - cy;

  let rdx = dx;
  let rdy = dy;

  const rad = (comp.rotation * Math.PI) / 180;
  const cos = Math.round(Math.cos(rad));
  const sin = Math.round(Math.sin(rad));

  rdx = dx * cos - dy * sin;
  rdy = dx * sin + dy * cos;

  return {
    x: comp.x + cx + rdx,
    y: comp.y + cy + rdy,
  };
}

/**
 * Retorna todas as portas de um componente com suas coordenadas absolutas no canvas
 */
export function getAllComponentAbsolutePorts(
  comp: ComponentInstance
): Array<{ id: string; name: string; x: number; y: number }> {
  const meta = COMPONENT_REGISTRY[comp.type];
  if (!meta || !meta.ports) return [];

  return meta.ports.map((p) => {
    const pos = getRotatedPortPosition(comp, p.id);
    return {
      id: p.id,
      name: p.name,
      x: pos ? pos.x : comp.x + p.x,
      y: pos ? pos.y : comp.y + p.y,
    };
  });
}

/**
 * Encontra a porta mais próxima de um ponto no canvas
 */
export function findNearestPort(
  components: ComponentInstance[],
  point: WirePoint,
  maxDistance: number = 16
): {
  componentId: string;
  portId: string;
  point: WirePoint;
} | null {
  let nearest: {
    componentId: string;
    portId: string;
    point: WirePoint;
    dist: number;
  } | null = null;

  for (const comp of components) {
    const ports = getAllComponentAbsolutePorts(comp);
    for (const port of ports) {
      const dist = Math.hypot(port.x - point.x, port.y - point.y);
      if (dist <= maxDistance) {
        if (!nearest || dist < nearest.dist) {
          nearest = {
            componentId: comp.id,
            portId: port.id,
            point: { x: port.x, y: port.y },
            dist,
          };
        }
      }
    }
  }

  return nearest
    ? {
        componentId: nearest.componentId,
        portId: nearest.portId,
        point: nearest.point,
      }
    : null;
}

/**
 * Gera os pontos completos de um fio (início, waypoints ou rota ortogonal, e fim)
 */
export function getWirePoints(
  wire: WireConnection,
  components: ComponentInstance[]
): WirePoint[] {
  let start = { ...wire.fromPoint };
  let end = { ...wire.toPoint };

  // Atualiza dinamicamente a posição se estiver conectada a um componente
  if (wire.fromComponentId && wire.fromPortId) {
    const comp = components.find((c) => c.id === wire.fromComponentId);
    if (comp) {
      const pos = getRotatedPortPosition(comp, wire.fromPortId);
      if (pos) start = pos;
    }
  }

  if (wire.toComponentId && wire.toPortId) {
    const comp = components.find((c) => c.id === wire.toComponentId);
    if (comp) {
      const pos = getRotatedPortPosition(comp, wire.toPortId);
      if (pos) end = pos;
    }
  }

  if (wire.waypoints && wire.waypoints.length > 0) {
    return [start, ...wire.waypoints, end];
  }

  // Rota ortogonal padrão inteligente se não houver waypoints definidos:
  // Se alinhado horizontal ou verticalmente, linha reta
  if (Math.abs(start.x - end.x) < 2 || Math.abs(start.y - end.y) < 2) {
    return [start, end];
  }

  // Se não estiver alinhado, cria uma curva em L ortogonal padrão (manhattan)
  const midX = end.x;
  const midY = start.y;
  return [start, { x: midX, y: midY }, end];
}

/**
 * Converte a lista de pontos em caminho SVG `d="M ... L ..."`
 */
export function pointsToSvgPath(points: WirePoint[]): string {
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  return `M ${first.x} ${first.y} ` + rest.map((p) => `L ${p.x} ${p.y}`).join(' ');
}

/**
 * Detecta cruzamentos e junções de fios para desenhar nós/pontos pretos padrão
 */
export function detectWireJunctions(
  wires: WireConnection[],
  components: ComponentInstance[]
): WirePoint[] {
  const junctions: WirePoint[] = [];
  const pointCounts = new Map<string, number>();

  for (const wire of wires) {
    const pts = getWirePoints(wire, components);
    for (const pt of pts) {
      // Chave aproximada em passos de 2px
      const key = `${Math.round(pt.x / 4) * 4},${Math.round(pt.y / 4) * 4}`;
      pointCounts.set(key, (pointCounts.get(key) || 0) + 1);
    }
  }

  for (const [key, count] of pointCounts.entries()) {
    if (count >= 2) {
      const [x, y] = key.split(',').map(Number);
      junctions.push({ x, y });
    }
  }

  return junctions;
}

/**
 * Encontra o ponto de um fio mais próximo das coordenadas fornecidas,
 * permitindo que nós (ou novos fios) se encaixem perfeitamente em cima das linhas dos fios.
 */
export function findNearestPointOnWires(
  wires: WireConnection[],
  components: ComponentInstance[],
  targetPoint: WirePoint,
  maxDistance: number = 20,
  gridSnap: number = 20
): WirePoint | null {
  let bestPoint: WirePoint | null = null;
  let minDistance = maxDistance;

  for (const wire of wires) {
    const points = getWirePoints(wire, components);
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      // Vetor do segmento
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const lenSq = dx * dx + dy * dy;

      let projX = p1.x;
      let projY = p1.y;

      if (lenSq > 0.0001) {
        // Projeção escalar t sobre o segmento
        let t = ((targetPoint.x - p1.x) * dx + (targetPoint.y - p1.y) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));
        projX = p1.x + t * dx;
        projY = p1.y + t * dy;
      }

      const dist = Math.hypot(targetPoint.x - projX, targetPoint.y - projY);

      if (dist < minDistance) {
        minDistance = dist;

        // Se for um fio horizontal ou vertical, tenta alinhar com os múltiplos do grid
        if (Math.abs(dy) < 1) {
          // Fio horizontal: y é fixo em p1.y, x pode ser alinhado ao grid mais próximo no segmento
          const minX = Math.min(p1.x, p2.x);
          const maxX = Math.max(p1.x, p2.x);
          const snappedX = Math.round(targetPoint.x / gridSnap) * gridSnap;
          if (snappedX >= minX && snappedX <= maxX) {
            bestPoint = { x: snappedX, y: p1.y };
          } else {
            bestPoint = { x: Math.round(projX), y: p1.y };
          }
        } else if (Math.abs(dx) < 1) {
          // Fio vertical: x é fixo em p1.x, y pode ser alinhado ao grid mais próximo no segmento
          const minY = Math.min(p1.y, p2.y);
          const maxY = Math.max(p1.y, p2.y);
          const snappedY = Math.round(targetPoint.y / gridSnap) * gridSnap;
          if (snappedY >= minY && snappedY <= maxY) {
            bestPoint = { x: p1.x, y: snappedY };
          } else {
            bestPoint = { x: p1.x, y: Math.round(projY) };
          }
        } else {
          bestPoint = { x: Math.round(projX), y: Math.round(projY) };
        }
      }
    }
  }

  return bestPoint;
}

/**
 * Verifica se um ponto (x, y) está conectado / tocando qualquer um dos fios fornecidos.
 * Usado para detectar derivações (T-junctions) e fios conectados no meio de outros fios.
 */
export function isPointTouchingWires(
  pt: WirePoint,
  targetWires: WireConnection[],
  components: ComponentInstance[],
  threshold: number = 8
): boolean {
  for (const wire of targetWires) {
    const points = getWirePoints(wire, components);
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const lenSq = dx * dx + dy * dy;

      let projX = p1.x;
      let projY = p1.y;

      if (lenSq > 0.0001) {
        let t = ((pt.x - p1.x) * dx + (pt.y - p1.y) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));
        projX = p1.x + t * dx;
        projY = p1.y + t * dy;
      }

      const dist = Math.hypot(pt.x - projX, pt.y - projY);
      if (dist <= threshold) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Detecta extremidades de fios ou outros componentes próximos ao transformador
 * e calcula o ajuste automático da sua posição e altura para encaixar exatamente entre 2 extremidades.
 */
export function autoFitTransformer(
  comp: ComponentInstance,
  allComponents: ComponentInstance[],
  wires: WireConnection[]
): { x?: number; y?: number; height: number } | null {
  if (comp.type !== 'transformer') return null;

  const isVertical = comp.rotation === 0 || comp.rotation === 180;
  const otherComps = allComponents.filter((c) => c.id !== comp.id);

  if (isVertical) {
    const midX = comp.x + comp.width / 2;
    const currentTop = comp.y;
    const currentBottom = comp.y + comp.height;
    const centerY = (currentTop + currentBottom) / 2;

    const yCandidates: number[] = [];

    // 1. Fios no circuito
    for (const wire of wires) {
      const pts = getWirePoints(wire, allComponents);
      for (let i = 0; i < pts.length; i++) {
        const pt = pts[i];
        if (Math.abs(pt.x - midX) <= Math.max(100, comp.width + 40)) {
          yCandidates.push(pt.y);
        }
        if (i < pts.length - 1) {
          const next = pts[i + 1];
          if (Math.abs(pt.y - next.y) < 1) {
            const minX = Math.min(pt.x, next.x) - 40;
            const maxX = Math.max(pt.x, next.x) + 40;
            if (midX >= minX && midX <= maxX) {
              yCandidates.push(pt.y);
            }
          }
        }
      }
    }

    // 2. Portas de outros componentes
    for (const oc of otherComps) {
      const ports = getAllComponentAbsolutePorts(oc);
      for (const p of ports) {
        if (Math.abs(p.x - midX) <= Math.max(100, comp.width + 40)) {
          yCandidates.push(p.y);
        }
      }
    }

    const topCandidates = yCandidates
      .filter((y) => y <= centerY - 15)
      .sort((a, b) => Math.abs(a - currentTop) - Math.abs(b - currentTop));

    const bottomCandidates = yCandidates
      .filter((y) => y >= centerY + 15)
      .sort((a, b) => Math.abs(a - currentBottom) - Math.abs(b - currentBottom));

    if (topCandidates.length > 0 && bottomCandidates.length > 0) {
      const bestTop = topCandidates[0];
      const bestBottom = bottomCandidates[0];
      if (bestBottom > bestTop) {
        return {
          y: bestTop,
          height: Math.max(40, bestBottom - bestTop),
        };
      }
    } else if (topCandidates.length > 0) {
      return {
        y: topCandidates[0],
        height: comp.height,
      };
    } else if (bottomCandidates.length > 0) {
      const bestBottom = bottomCandidates[0];
      if (bestBottom > comp.y) {
        return {
          height: Math.max(40, bestBottom - comp.y),
        };
      }
    }
  } else {
    // Rotação horizontal (90 ou 270)
    const cx = comp.x + comp.width / 2;
    const cy = comp.y + comp.height / 2;
    const currentLeft = cx - comp.height / 2;
    const currentRight = cx + comp.height / 2;
    const centerX = cx;

    const xCandidates: number[] = [];

    for (const wire of wires) {
      const pts = getWirePoints(wire, allComponents);
      for (let i = 0; i < pts.length; i++) {
        const pt = pts[i];
        if (Math.abs(pt.y - cy) <= Math.max(100, comp.width + 40)) {
          xCandidates.push(pt.x);
        }
        if (i < pts.length - 1) {
          const next = pts[i + 1];
          if (Math.abs(pt.x - next.x) < 1) {
            const minY = Math.min(pt.y, next.y) - 40;
            const maxY = Math.max(pt.y, next.y) + 40;
            if (cy >= minY && cy <= maxY) {
              xCandidates.push(pt.x);
            }
          }
        }
      }
    }

    for (const oc of otherComps) {
      const ports = getAllComponentAbsolutePorts(oc);
      for (const p of ports) {
        if (Math.abs(p.y - cy) <= Math.max(100, comp.width + 40)) {
          xCandidates.push(p.x);
        }
      }
    }

    const leftCandidates = xCandidates
      .filter((x) => x <= centerX - 15)
      .sort((a, b) => Math.abs(a - currentLeft) - Math.abs(b - currentLeft));

    const rightCandidates = xCandidates
      .filter((x) => x >= centerX + 15)
      .sort((a, b) => Math.abs(a - currentRight) - Math.abs(b - currentRight));

    if (leftCandidates.length > 0 && rightCandidates.length > 0) {
      const bestLeft = leftCandidates[0];
      const bestRight = rightCandidates[0];
      if (bestRight > bestLeft) {
        const newHeight = Math.max(40, bestRight - bestLeft);
        const newCx = (bestLeft + bestRight) / 2;
        const newX = newCx - comp.width / 2;
        return {
          x: newX,
          height: newHeight,
        };
      }
    }
  }

  return null;
}

/**
 * Calcula a posição exata (no canvas) da alça superior ou inferior do transformador,
 * considerando a rotação e altura atual.
 */
export function getTransformerHandlePos(
  comp: ComponentInstance,
  which: 'top' | 'bottom'
): WirePoint {
  const localX = comp.width / 2;
  const localY = which === 'top' ? 0 : comp.height;
  const cx = comp.width / 2;
  const cy = comp.height / 2;
  const dx = localX - cx;
  const dy = localY - cy;
  const rad = (comp.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: Math.round(comp.x + cx + (dx * cos - dy * sin)),
    y: Math.round(comp.y + cy + (dx * sin + dy * cos)),
  };
}
