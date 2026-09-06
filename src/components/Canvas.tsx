import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ComponentInstance, WireConnection, WirePoint, ActiveTool } from '../types';
import { ComponentSymbol } from './symbols/ComponentSymbol';
import { COMPONENT_REGISTRY } from '../data/componentRegistry';
import {
  snapToGrid,
  findNearestPort,
  getWirePoints,
  pointsToSvgPath,
  detectWireJunctions,
  getRotatedPortPosition,
  findNearestPointOnWires,
} from '../utils/geometry';

interface CanvasProps {
  components: ComponentInstance[];
  wires: WireConnection[];
  selectedIds: string[];
  highlightedId?: string | null; // NOVO
  tool: ActiveTool;
  gridSize: number;
  snapGrid: boolean;
  showGrid: boolean;
  zoom: number;
  pan: { x: number; y: number };
  svgRef: React.RefObject<SVGSVGElement | null>;
  exportArea?: { x: number; y: number; width: number; height: number } | null;
  isDrawingExportArea?: boolean;
  onFinishDrawExportArea?: (bounds: { x: number; y: number; width: number; height: number }) => void;
  onCancelDrawExportArea?: () => void;
  onSelect: (ids: string[], isMulti?: boolean) => void;
  onUpdateComponent: (id: string, updates: Partial<ComponentInstance>) => void;
  onUpdateComponents: (updates: Array<{ id: string; updates: Partial<ComponentInstance> }>) => void;
  onAddWire: (wire: WireConnection) => void;
  onDeleteSelected: () => void;
  onPanChange: (pan: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  onAddComponentAt: (type: any, pos: { x: number; y: number }) => void;
  onComponentDoubleClick?: (comp: ComponentInstance) => void;
  onSetTool?: (tool: ActiveTool) => void;
  onCanvasMouseMove?: (pt: WirePoint) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  components,
  wires,
  selectedIds,
  highlightedId, // NOVO
  tool,
  gridSize,
  snapGrid,
  showGrid,
  zoom,
  pan,
  svgRef,
  exportArea,
  isDrawingExportArea,
  onFinishDrawExportArea,
  onCancelDrawExportArea,
  onSelect,
  onUpdateComponent,
  onUpdateComponents,
  onAddWire,
  onPanChange,
  onZoomChange,
  onAddComponentAt,
  onComponentDoubleClick,
  onSetTool,
  onCanvasMouseMove,
}) => {
  // Estados de arrasto de componentes
  const [isDraggingComp, setIsDraggingComp] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; initialPositions: Record<string, { x: number; y: number }> } | null>(null);

  // Estados de desenho de área de exportação
  const [exportDrawBox, setExportDrawBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Estados de arrasto do rótulo do componente
  const [isDraggingLabel, setIsDraggingLabel] = useState(false);
  const labelDragRef = useRef<{
    comp: ComponentInstance;
    startMouseX: number;
    startMouseY: number;
    startOffsetX: number;
    startOffsetY: number;
  } | null>(null);

  // Estados de desenho de fio interativo
  const [isDrawingWire, setIsDrawingWire] = useState(false);
  const [wireStart, setWireStart] = useState<{
    point: WirePoint;
    componentId?: string;
    portId?: string;
  } | null>(null);
  const [wireCurrentPoint, setWireCurrentPoint] = useState<WirePoint | null>(null);
  const [hoveredPort, setHoveredPort] = useState<{ componentId: string; portId: string; point: WirePoint } | null>(null);

  // Referência para distinguir entre clique no terminal (para fio) e arrasto de componente
  const portDownRef = useRef<{
    comp: ComponentInstance;
    portId: string;
    clientX: number;
    clientY: number;
  } | null>(null);

  // Função para cancelar o desenho de fio e voltar com segurança para o modo ponteiro
  const cancelWireDrawing = useCallback(() => {
    setIsDrawingWire(false);
    setWireStart(null);
    setWireCurrentPoint(null);
    portDownRef.current = null;
    if (tool === 'wire') {
      onSetTool?.('select');
    }
  }, [tool, onSetTool]);

  // Se a ferramenta mudar no toolbar (ex: clicou em 'select' ou 'pan'), cancela qualquer fio ativo
  useEffect(() => {
    if (tool !== 'wire' && isDrawingWire) {
      setIsDrawingWire(false);
      setWireStart(null);
      setWireCurrentPoint(null);
      portDownRef.current = null;
    }
  }, [tool, isDrawingWire]);

  // Atalho global de cancelamento com a tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isDrawingExportArea) {
          e.preventDefault();
          e.stopPropagation();
          setExportDrawBox(null);
          onCancelDrawExportArea?.();
          return;
        }
        if (isDrawingWire || tool === 'wire') {
          e.preventDefault();
          e.stopPropagation();
          cancelWireDrawing();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isDrawingExportArea, onCancelDrawExportArea, isDrawingWire, tool, cancelWireDrawing]);

  // Estados de panning
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ mouseX: number; mouseY: number; panX: number; panY: number } | null>(null);

  // Seleção por caixa (marquise)
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);

  // Coordenadas do cursor no espaço do canvas para o indicador High Density
  const [cursorCoords, setCursorCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Conversão de coordenadas da tela do mouse para o espaço do canvas SVG
  const screenToCanvas = useCallback(
    (clientX: number, clientY: number): WirePoint => {
      if (!svgRef.current) return { x: 0, y: 0 };
      const rect = svgRef.current.getBoundingClientRect();
      const rawX = (clientX - rect.left - pan.x) / zoom;
      const rawY = (clientY - rect.top - pan.y) / zoom;
      return {
        x: snapGrid ? snapToGrid(rawX, gridSize) : Math.round(rawX),
        y: snapGrid ? snapToGrid(rawY, gridSize) : Math.round(rawY),
      };
    },
    [pan, zoom, snapGrid, gridSize, svgRef]
  );

  const screenToCanvasExact = useCallback(
    (clientX: number, clientY: number): WirePoint => {
      if (!svgRef.current) return { x: 0, y: 0 };
      const rect = svgRef.current.getBoundingClientRect();
      return {
        x: (clientX - rect.left - pan.x) / zoom,
        y: (clientY - rect.top - pan.y) / zoom,
      };
    },
    [pan, zoom, svgRef]
  );

  // Manipulação de Zoom pelo Scroll do Mouse
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
      const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.25), 4);
      onZoomChange(Number(newZoom.toFixed(2)));
    } else {
      // Pan no scroll
      onPanChange({
        x: pan.x - e.deltaX,
        y: pan.y - e.deltaY,
      });
    }
  };

  // Início de clique no canvas
  const handleMouseDown = (e: React.MouseEvent) => {
    // Botão direito cancela desenho de fio imediatamente
    if (e.button === 2) {
      if (isDrawingWire || tool === 'wire') {
        e.preventDefault();
        cancelWireDrawing();
      }
      return;
    }

    // Botão do meio ou ferramenta Pan ou com barra de espaço
    if (e.button === 1 || tool === 'pan' || e.spaceKey) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
      return;
    }

    if (e.button !== 0) return; // apenas botão esquerdo

    // Se estiver em modo de delimitar área de exportação (Dois Cliques: 1º define o início, 2º define o fim)
    if (isDrawingExportArea) {
      e.preventDefault();
      e.stopPropagation();
      const exactPt = screenToCanvasExact(e.clientX, e.clientY);

      if (!exportDrawBox) {
        // 1º Clique: registra o ponto inicial e abre a área
        setExportDrawBox({
          startX: exactPt.x,
          startY: exactPt.y,
          currentX: exactPt.x,
          currentY: exactPt.y,
        });
      } else {
        // 2º Clique: confirma e fecha a área
        const minX = Math.min(exportDrawBox.startX, exactPt.x);
        const minY = Math.min(exportDrawBox.startY, exactPt.y);
        const width = Math.abs(exactPt.x - exportDrawBox.startX);
        const height = Math.abs(exactPt.y - exportDrawBox.startY);
        setExportDrawBox(null);

        if (width >= 10 && height >= 10) {
          onFinishDrawExportArea?.({
            x: Math.round(minX),
            y: Math.round(minY),
            width: Math.round(width),
            height: Math.round(height),
          });
        }
      }
      return;
    }

    const canvasPt = screenToCanvas(e.clientX, e.clientY);

    // Se já estiver desenhando fio (isDrawingWire ativo):
    if (isDrawingWire && wireStart) {
      const nearPort = findNearestPort(components, canvasPt, 16);
      if (nearPort) {
        // Conclui o fio ligando ao terminal
        if (nearPort.componentId !== wireStart.componentId || nearPort.portId !== wireStart.portId) {
          onAddWire({
            id: `wire_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            fromComponentId: wireStart.componentId,
            fromPortId: wireStart.portId,
            fromPoint: wireStart.point,
            toComponentId: nearPort.componentId,
            toPortId: nearPort.portId,
            toPoint: nearPort.point,
            waypoints: [],
          });
        }
        cancelWireDrawing();
      } else {
        // Clicou no espaço vazio enquanto desenhava fio: cancela o fio e libera a ferramenta!
        cancelWireDrawing();
      }
      return;
    }

    // Se estiver explicitamente na ferramenta de Fio e clicou para iniciar:
    if (tool === 'wire') {
      const nearPort = findNearestPort(components, canvasPt, 18);
      const startPt = nearPort ? nearPort.point : canvasPt;
      setIsDrawingWire(true);
      setWireStart({
        point: startPt,
        componentId: nearPort?.componentId,
        portId: nearPort?.portId,
      });
      setWireCurrentPoint(startPt);
      return;
    }

    // Se estiver com a ferramenta 'node' (Nó): cria o nó no ponto clicado, com snap a fio se próximo
    if (tool === 'node') {
      const nearWire = findNearestPointOnWires(wires, components, canvasPt, 24, gridSize);
      const nodePt = nearWire || canvasPt;
      onAddComponentAt('node', nodePt);
      onSetTool?.('select');
      return;
    }

    // Se clicou em área vazia na ferramenta de seleção:
    if (tool === 'select') {
      if (!e.shiftKey) {
        onSelect([]);
      }
      // Inicia caixa de seleção retangular
      const exactPt = screenToCanvasExact(e.clientX, e.clientY);
      setSelectionBox({
        startX: exactPt.x,
        startY: exactPt.y,
        currentX: exactPt.x,
        currentY: exactPt.y,
      });
    }
  };

  // Movimento do mouse
  const handleMouseMove = (e: React.MouseEvent) => {
    // Pan ativo
    if (isPanning && panStartRef.current) {
      const dx = e.clientX - panStartRef.current.mouseX;
      const dy = e.clientY - panStartRef.current.mouseY;
      onPanChange({
        x: panStartRef.current.panX + dx,
        y: panStartRef.current.panY + dy,
      });
      return;
    }

    const canvasPt = screenToCanvas(e.clientX, e.clientY);
    setCursorCoords(canvasPt);
    onCanvasMouseMove?.(canvasPt);

    // Se estiver delimitando área de exportação
    if (isDrawingExportArea) {
      if (exportDrawBox) {
        const exactPt = screenToCanvasExact(e.clientX, e.clientY);
        setExportDrawBox((prev) => (prev ? { ...prev, currentX: exactPt.x, currentY: exactPt.y } : null));
      }
      return;
    }

    // Se o usuário clicou num terminal mas moveu o mouse > 4px, é intenção de mover o componente!
    if (portDownRef.current) {
      const dist = Math.hypot(e.clientX - portDownRef.current.clientX, e.clientY - portDownRef.current.clientY);
      if (dist > 4) {
        // Desiste do clique no terminal, permitindo que o componente seja arrastado normalmente
        portDownRef.current = null;
      }
    }

    // Detecta se está perto de alguma porta para highlight magnético
    const near = findNearestPort(components, canvasPt, 16);
    setHoveredPort(near);

    // Se estiver desenhando fio (rubber band)
    if (isDrawingWire && wireStart) {
      setWireCurrentPoint(near ? near.point : canvasPt);
      return;
    }

    // Se estiver arrastando o rótulo de um componente no canvas
    if (isDraggingLabel && labelDragRef.current) {
      const { comp, startMouseX, startMouseY, startOffsetX, startOffsetY } = labelDragRef.current;
      const deltaX = (e.clientX - startMouseX) / zoom;
      const deltaY = (e.clientY - startMouseY) / zoom;

      // O rótulo já é contrarrotacionado no SVG (rotate(-rotation, cx, cy)) para se manter legível na horizontal.
      // Portanto, suas coordenadas relativas já estão alinhadas com os eixos X/Y do canvas/tela!
      let newOffsetX = Math.round(startOffsetX + deltaX);
      let newOffsetY = Math.round(startOffsetY + deltaY);

      if (snapGrid) {
        newOffsetX = Math.round(newOffsetX / 4) * 4;
        newOffsetY = Math.round(newOffsetY / 4) * 4;
      }

      onUpdateComponent(comp.id, {
        labelOffsetX: newOffsetX,
        labelOffsetY: newOffsetY,
      });
      return;
    }

    // Se estiver arrastando componentes selecionados
    if (isDraggingComp && dragStartRef.current) {
      const dxRaw = (e.clientX - dragStartRef.current.mouseX) / zoom;
      const dyRaw = (e.clientY - dragStartRef.current.mouseY) / zoom;

      const dx = snapGrid ? snapToGrid(dxRaw, gridSize) : Math.round(dxRaw);
      const dy = snapGrid ? snapToGrid(dyRaw, gridSize) : Math.round(dyRaw);

      // Se estiver arrastando um único componente e ele for um 'node', tenta encaixar diretamente no fio mais próximo
      const singleNodeId = selectedIds.length === 1 ? selectedIds[0] : null;
      const singleComp = singleNodeId ? components.find((c) => c.id === singleNodeId) : null;

      let wireSnapTarget: WirePoint | null = null;
      if (singleComp && singleComp.type === 'node' && wires.length > 0) {
        // Posição exata do centro do nó sob o cursor do mouse
        const rawNodeCenterX = (dragStartRef.current.initialPositions[singleComp.id]?.x ?? singleComp.x) + 10 + dxRaw;
        const rawNodeCenterY = (dragStartRef.current.initialPositions[singleComp.id]?.y ?? singleComp.y) + 10 + dyRaw;
        const nearWirePt = findNearestPointOnWires(
          wires,
          components,
          { x: rawNodeCenterX, y: rawNodeCenterY },
          24,
          gridSize
        );
        if (nearWirePt) {
          wireSnapTarget = nearWirePt;
        }
      }

      const updates = selectedIds.map((id) => {
        const initial = dragStartRef.current?.initialPositions[id];
        if (!initial) return null;

        if (id === singleNodeId && wireSnapTarget) {
          // Centro do nó (x + 10, y + 10) coincide com o fio
          return {
            id,
            updates: {
              x: Math.max(0, wireSnapTarget.x - 10),
              y: Math.max(0, wireSnapTarget.y - 10),
            },
          };
        }

        return {
          id,
          updates: {
            x: Math.max(0, initial.x + dx),
            y: Math.max(0, initial.y + dy),
          },
        };
      }).filter(Boolean) as Array<{ id: string; updates: Partial<ComponentInstance> }>;

      if (updates.length > 0) {
        onUpdateComponents(updates);
      }
      return;
    }

    // Se estiver fazendo seleção por caixa
    if (selectionBox) {
      const exactPt = screenToCanvasExact(e.clientX, e.clientY);
      setSelectionBox((prev) => (prev ? { ...prev, currentX: exactPt.x, currentY: exactPt.y } : null));
    }
  };

  // Finalização de clique / mouse up
  const handleMouseUp = (e: React.MouseEvent) => {
    if (isPanning) {
      setIsPanning(false);
      panStartRef.current = null;
    }

    // No modo de desenho de área por 2 cliques, o mouse up não fecha a área (o 2º clique fecha)
    if (isDrawingExportArea) {
      return;
    }

    // Se o usuário clicou e soltou sobre um terminal sem arrastar o componente,
    // significa que a intenção real foi clicar no terminal para puxar um fio!
    if (portDownRef.current) {
      const { comp, portId } = portDownRef.current;
      const portPos = getRotatedPortPosition(comp, portId);
      if (portPos) {
        setIsDrawingWire(true);
        setWireStart({
          point: portPos,
          componentId: comp.id,
          portId,
        });
        setWireCurrentPoint(portPos);
        onSetTool?.('wire');
      }
      portDownRef.current = null;
    }

    if (isDraggingComp) {
      setIsDraggingComp(false);
      dragStartRef.current = null;
    }

    if (isDraggingLabel) {
      setIsDraggingLabel(false);
      labelDragRef.current = null;
    }

    // Conclui seleção por caixa se houver
    if (selectionBox) {
      const x1 = Math.min(selectionBox.startX, selectionBox.currentX);
      const y1 = Math.min(selectionBox.startY, selectionBox.currentY);
      const x2 = Math.max(selectionBox.startX, selectionBox.currentX);
      const y2 = Math.max(selectionBox.startY, selectionBox.currentY);

      // Apenas seleciona se a caixa tiver tamanho significativo
      if (Math.abs(x2 - x1) > 5 || Math.abs(y2 - y1) > 5) {
        const insideIds = components
          .filter(
            (c) =>
              c.x >= x1 &&
              c.x + c.width <= x2 &&
              c.y >= y1 &&
              c.y + c.height <= y2
          )
          .map((c) => c.id);

        if (insideIds.length > 0) {
          onSelect(insideIds, e.shiftKey);
        }
      }
      setSelectionBox(null);
    }
  };

  // Início de arrasto ao clicar em um componente
  const handleComponentMouseDown = (comp: ComponentInstance, e: React.MouseEvent) => {
    if (isDrawingExportArea) {
      handleMouseDown(e);
      return;
    }

    if (isDrawingWire && wireStart) {
      // Se clicou no componente enquanto desenhava fio, deixa o evento de porta ou canvas resolver
      return;
    }

    if (tool === 'wire') {
      return;
    }

    if (e.button !== 0) return; // apenas botão esquerdo

    e.stopPropagation();

    // Se o componente não estiver selecionado, seleciona ele
    let newSelected = selectedIds;
    if (!selectedIds.includes(comp.id)) {
      if (e.shiftKey) {
        newSelected = [...selectedIds, comp.id];
        onSelect(newSelected);
      } else {
        newSelected = [comp.id];
        onSelect([comp.id]);
      }
    }

    setIsDraggingComp(true);
    const initialPositions: Record<string, { x: number; y: number }> = {};
    for (const id of newSelected) {
      const c = components.find((item) => item.id === id);
      if (c) {
        initialPositions[id] = { x: c.x, y: c.y };
      }
    }

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialPositions,
    };
  };

  // Clique em uma porta/terminal de componente
  const handlePortMouseDown = (comp: ComponentInstance, portId: string, e: React.MouseEvent) => {
    if (isDrawingExportArea) {
      handleMouseDown(e);
      return;
    }

    // Botão direito cancela fio imediatamente
    if (e.button === 2) {
      if (isDrawingWire || tool === 'wire') {
        e.preventDefault();
        cancelWireDrawing();
      }
      return;
    }

    if (e.button !== 0) return;

    e.stopPropagation();

    // 1. Se já está desenhando fio e clicou neste terminal: conclui a ligação!
    if (isDrawingWire && wireStart) {
      const portPos = getRotatedPortPosition(comp, portId);
      if (portPos && (wireStart.componentId !== comp.id || wireStart.portId !== portId)) {
        onAddWire({
          id: `wire_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          fromComponentId: wireStart.componentId,
          fromPortId: wireStart.portId,
          fromPoint: wireStart.point,
          toComponentId: comp.id,
          toPortId: portId,
          toPoint: portPos,
          waypoints: [],
        });
      }
      cancelWireDrawing();
      return;
    }

    // 2. Se estiver explicitamente na ferramenta 'wire': inicia o fio imediatamente
    if (tool === 'wire') {
      const portPos = getRotatedPortPosition(comp, portId);
      if (!portPos) return;
      setIsDrawingWire(true);
      setWireStart({
        point: portPos,
        componentId: comp.id,
        portId,
      });
      setWireCurrentPoint(portPos);
      return;
    }

    // 3. Se estiver na ferramenta de seleção (tool === 'select'):
    // Prepara seleção e arrasto do componente normalmente para que o usuário consiga mover o componente
    let newSelected = selectedIds;
    if (!selectedIds.includes(comp.id)) {
      if (e.shiftKey) {
        newSelected = [...selectedIds, comp.id];
        onSelect(newSelected);
      } else {
        newSelected = [comp.id];
        onSelect([comp.id]);
      }
    }

    setIsDraggingComp(true);
    const initialPositions: Record<string, { x: number; y: number }> = {};
    for (const id of newSelected) {
      const c = components.find((item) => item.id === id);
      if (c) {
        initialPositions[id] = { x: c.x, y: c.y };
      }
    }

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialPositions,
    };

    // Armazena o clique no terminal: caso o usuário solte o mouse sem mover (sem arrastar),
    // o handleMouseUp interpretará como um clique pontual para iniciar a ligação de fio!
    portDownRef.current = {
      comp,
      portId,
      clientX: e.clientX,
      clientY: e.clientY,
    };
  };

  // Início de arrasto do rótulo diretamente no canvas
  const handleLabelMouseDown = (comp: ComponentInstance, e: React.MouseEvent) => {
    if (isDrawingExportArea) {
      handleMouseDown(e);
      return;
    }

    if (e.button !== 0) return;
    e.stopPropagation();

    // Se o componente não estiver selecionado, seleciona ele
    if (!selectedIds.includes(comp.id)) {
      onSelect([comp.id]);
    }

    setIsDraggingLabel(true);
    labelDragRef.current = {
      comp,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startOffsetX: comp.labelOffsetX || 0,
      startOffsetY: comp.labelOffsetY || 0,
    };
  };

  // Drag and Drop da barra lateral para o canvas
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const compType = e.dataTransfer.getData('application/circuit-component');
    if (compType) {
      const pt = screenToCanvas(e.clientX, e.clientY);
      onAddComponentAt(compType, pt);
    }
  };

  // Junções de fios detectadas automaticamente
  const junctions = detectWireJunctions(wires, components);

  // Calcula tamanho do grid visível
  const gridPatternSize = gridSize;

  return (
    <div
      id="diagram-canvas-container"
      className="relative w-full h-full overflow-hidden select-none bg-[#fdfdfd] flex-1"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onContextMenu={(e) => {
        if (isDrawingExportArea) {
          e.preventDefault();
          setExportDrawBox(null);
          onCancelDrawExportArea?.();
          return;
        }
        if (isDrawingWire || tool === 'wire') {
          e.preventDefault();
          cancelWireDrawing();
        }
      }}
      style={{
        cursor: isPanning
          ? 'grabbing'
          : isDrawingExportArea
          ? 'crosshair'
          : tool === 'pan'
          ? 'grab'
          : tool === 'wire' || isDrawingWire
          ? 'crosshair'
          : 'default',
      }}
    >
      {/* Banner Flutuante para Delimitar Área de Exportação com Dois Cliques */}
      {isDrawingExportArea && (
        <div
          id="export-area-banner"
          className="absolute top-3.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 bg-black/95 text-white shadow-xl px-4 py-2 rounded-full text-xs select-none pointer-events-auto border border-white/20 animate-in fade-in slide-in-from-top-2"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping"></span>
          <span className="font-semibold text-white">Delimitar Área (2 Cliques):</span>
          {!exportDrawBox ? (
            <span className="text-zinc-300">
              <strong className="text-white font-medium">1º Clique:</strong> Clique para marcar o primeiro canto
            </span>
          ) : (
            <span className="text-zinc-300">
              <strong className="text-white font-medium">2º Clique:</strong> Clique no canto oposto para fechar ({Math.round(Math.abs(exportDrawBox.currentX - exportDrawBox.startX))} × {Math.round(Math.abs(exportDrawBox.currentY - exportDrawBox.startY))} px)
            </span>
          )}
          <div className="w-px h-3.5 bg-white/20 mx-1"></div>
          <button
            type="button"
            id="btn-cancel-draw-export"
            onClick={(e) => {
              e.stopPropagation();
              setExportDrawBox(null);
              onCancelDrawExportArea?.();
            }}
            className="px-2.5 py-0.5 bg-white/20 hover:bg-white/30 text-white rounded text-[11px] font-medium transition-colors cursor-pointer"
            title="Cancelar demarcação de área (Esc ou botão direito)"
          >
            Cancelar (Esc)
          </button>
        </div>
      )}

      {/* High Density Floating Banner para Cancelar Modo Fio */}
      {isDrawingWire && (
        <div
          id="wire-active-banner"
          className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-white/95 backdrop-blur-xs border border-[#e5e5e5] shadow-md px-3.5 py-1.5 rounded-full text-xs text-[#1a1a1a] select-none pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          <span className="font-semibold text-xs text-[#111]">Modo Fio ativo:</span>
          <span className="text-[#666] text-[11px]">Clique em outro terminal para ligar</span>
          <div className="w-px h-3.5 bg-[#e5e5e5] mx-1"></div>
          <button
            type="button"
            id="btn-cancel-wire"
            onClick={(e) => {
              e.stopPropagation();
              cancelWireDrawing();
            }}
            className="px-2.5 py-0.5 bg-[#f5f5f5] hover:bg-[#e5e5e5] active:bg-[#d4d4d4] text-[#333] border border-[#d4d4d4] rounded text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
            title="Cancelar conexão de fio (Esc ou botão direito)"
          >
            <span>✕</span>
            <span>Cancelar (Esc)</span>
          </button>
        </div>
      )}

      <svg
        id="diagram-svg"
        ref={svgRef}
        className="w-full h-full block"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <defs>
          {/* Padrão de Grade (Grid) */}
          <pattern
            id="canvas-grid-pattern"
            width={gridPatternSize}
            height={gridPatternSize}
            patternUnits="userSpaceOnUse"
          >
            <circle cx={gridPatternSize / 2} cy={gridPatternSize / 2} r="1" fill="#d4d4d4" />
          </pattern>
        </defs>

        {/* Grupo Principal Transformado com Pan e Zoom */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Fundo do Diagrama com Grade */}
          <g id="grid-layer">
            <rect
              x={-5000}
              y={-5000}
              width={10000}
              height={10000}
              fill="#fdfdfd"
            />
            {showGrid && (
              <rect
                x={-5000}
                y={-5000}
                width={10000}
                height={10000}
                fill="url(#canvas-grid-pattern)"
                className="pointer-events-none"
              />
            )}
          </g>

          {/* Camada de Fios e Conexões */}
          <g id="wires-layer">
            {wires.map((wire) => {
              const pts = getWirePoints(wire, components);
              const pathData = pointsToSvgPath(pts);
              const isSelected = selectedIds.includes(wire.id);

              return (
                <g
                  key={wire.id}
                  id={`wire-${wire.id}`}
                  className="cursor-pointer"
                  onClick={(e) => {
                    if (isDrawingExportArea) {
                      handleMouseDown(e);
                      return;
                    }
                    e.stopPropagation();
                    onSelect([wire.id], e.shiftKey);
                  }}
                >
                  {/* Área invisível mais grossa para facilitar o clique no fio */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={14}
                  />
                  {/* Linha visível do fio */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke={isSelected ? '#2563eb' : '#111827'}
                    strokeWidth={isSelected ? 2.4 : 1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              );
            })}

            {/* Junções pretas onde fios se encontram (nós elétricos padrão) */}
            {junctions.map((junc, idx) => (
              <circle
                key={`junc-${idx}`}
                cx={junc.x}
                cy={junc.y}
                r={3.2}
                fill="#111827"
                className="pointer-events-none"
              />
            ))}

            {/* Fio em construção (Live Rubber-Band Wire) */}
            {isDrawingWire && wireStart && wireCurrentPoint && (
              <g className="pointer-events-none">
                <path
                  d={pointsToSvgPath(
                    getWirePoints(
                      {
                        id: 'temp',
                        fromPoint: wireStart.point,
                        toPoint: wireCurrentPoint,
                        waypoints: [],
                      },
                      components
                    )
                  )}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth={1.8}
                  strokeDasharray="4 3"
                />
                <circle
                  cx={wireCurrentPoint.x}
                  cy={wireCurrentPoint.y}
                  r={4}
                  fill="#2563eb"
                />
              </g>
            )}
          </g>

          {/* Camada de Componentes */}
          <g id="components-layer">
            {components.map((comp) => {
              const isSelected = selectedIds.includes(comp.id);
              return (
                <g
                  key={comp.id}
                  onMouseDown={(e) => handleComponentMouseDown(comp, e)}
                  onDoubleClick={() => onComponentDoubleClick?.(comp)}
                  className="cursor-move"
                >
                  <ComponentSymbol
                    component={comp}
                    isSelected={isSelected}
                    showPorts={tool === 'wire' || isSelected || !!hoveredPort}
                    activePortId={
                      hoveredPort?.componentId === comp.id ? hoveredPort.portId : null
                    }
                    onPortMouseDown={(portId, e) => handlePortMouseDown(comp, portId, e)}
                    onLabelMouseDown={(e) => handleLabelMouseDown(comp, e)}
                  />
                </g>
              );
            })}
          </g>

          {/* Camada Interativa (Caixa de Seleção, Snapping Indicator, Área de Exportação) */}
          <g id="interactive-layer" className="pointer-events-none">
            {/* Destaque de hover vindo do painel lateral */}
            {highlightedId && (() => {
              const hComp = components.find((c) => c.id === highlightedId);
              if (!hComp) return null;
              const pad = 10;
              return (
                <rect
                  x={hComp.x - pad}
                  y={hComp.y - pad}
                  width={hComp.width + pad * 2}
                  height={hComp.height + pad * 2}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  strokeDasharray="5 3"
                  rx={6}
                  className="animate-pulse"
                />
              );
            })()}
            
            {/* Highlight magnético da porta mais próxima */}
            {hoveredPort && (
              <circle
                cx={hoveredPort.point.x}
                cy={hoveredPort.point.y}
                r={7}
                fill="none"
                stroke="#2563eb"
                strokeWidth={2}
                className="animate-ping"
              />
            )}

            {/* Caixa de seleção retangular (Marquee) */}
            {selectionBox && (
              <rect
                x={Math.min(selectionBox.startX, selectionBox.currentX)}
                y={Math.min(selectionBox.startY, selectionBox.currentY)}
                width={Math.abs(selectionBox.currentX - selectionBox.startX)}
                height={Math.abs(selectionBox.currentY - selectionBox.startY)}
                fill="rgba(59, 130, 246, 0.08)"
                stroke="#3b82f6"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            )}

            {/* Área de Exportação Persistente */}
            {exportArea && !exportDrawBox && (
              <g id="export-area-frame">
                <rect
                  x={exportArea.x}
                  y={exportArea.y}
                  width={exportArea.width}
                  height={exportArea.height}
                  fill="rgba(37, 99, 235, 0.04)"
                  stroke="#2563eb"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                />
                <g transform={`translate(${exportArea.x}, ${exportArea.y - 6})`}>
                  <rect x={0} y={-14} width={138} height={16} rx={3} fill="#2563eb" />
                  <text x={6} y={-3} fill="#ffffff" fontSize={10} fontFamily="sans-serif" fontWeight="bold">
                    Área Demarcada ({Math.round(exportArea.width)}×{Math.round(exportArea.height)})
                  </text>
                </g>
              </g>
            )}

            {/* Prévia ao vivo do retângulo de exportação sendo desenhado */}
            {exportDrawBox && (
              <g id="export-draw-box-preview">
                <rect
                  x={Math.min(exportDrawBox.startX, exportDrawBox.currentX)}
                  y={Math.min(exportDrawBox.startY, exportDrawBox.currentY)}
                  width={Math.abs(exportDrawBox.currentX - exportDrawBox.startX)}
                  height={Math.abs(exportDrawBox.currentY - exportDrawBox.startY)}
                  fill="rgba(37, 99, 235, 0.14)"
                  stroke="#2563eb"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                />
                <g
                  transform={`translate(${Math.max(
                    exportDrawBox.startX,
                    exportDrawBox.currentX
                  )}, ${Math.max(exportDrawBox.startY, exportDrawBox.currentY) + 18})`}
                >
                  <rect x={-86} y={-14} width={86} height={16} rx={3} fill="#18181b" />
                  <text
                    x={-43}
                    y={-3}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize={10}
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {Math.round(Math.abs(exportDrawBox.currentX - exportDrawBox.startX))} ×{' '}
                    {Math.round(Math.abs(exportDrawBox.currentY - exportDrawBox.startY))} px
                  </text>
                </g>
              </g>
            )}
          </g>
        </g>
      </svg>

      {/* High Density Coordinates Overlay */}
      <div className="absolute bottom-3 left-3 text-[10px] font-mono text-[#888] bg-white/90 border border-[#e5e5e5] px-2.5 py-0.5 rounded shadow-2xs z-10 pointer-events-none select-none flex items-center gap-2">
        <span>X: {cursorCoords.x}px</span>
        <span className="text-[#e5e5e5]">|</span>
        <span>Y: {cursorCoords.y}px</span>
        <span className="text-[#e5e5e5]">|</span>
        <span>ZOOM: {Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
};
