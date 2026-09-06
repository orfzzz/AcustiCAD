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

  const dx = portDef.x - cx;
  const dy = portDef.y - cy;

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
