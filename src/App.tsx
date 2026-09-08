import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ComponentInstance,
  WireConnection,
  ComponentType,
  ActiveTool,
  EditorSnapshot,
  ExportArea,
  LabelPosition,
  WirePoint,
} from './types';
import { COMPONENT_REGISTRY } from './data/componentRegistry';
import { Canvas } from './components/Canvas';
import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';
import { PropertyPanel } from './components/PropertyPanel';
import { exportToPng, exportToSvg, exportToJson } from './utils/exportUtils';
import { exportSingleHtmlApp } from './utils/singleHtmlExport';
import { snapToGrid, findNearestPointOnWires } from './utils/geometry';
import { Layers, Sliders } from 'lucide-react';

const MAX_HISTORY = 30;

export default function App() {
  // Inicia com o canvas limpo conforme solicitação do usuário
  const [components, setComponents] = useState<ComponentInstance[]>([]);
  const [wires, setWires] = useState<WireConnection[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [tool, setTool] = useState<ActiveTool>('select');
  const [highlightedComponentId, setHighlightedComponentId] = useState<string | null>(null); // NOVO
  const [mobileDrawer, setMobileDrawer] = useState<'components' | 'properties' | null>(null); // Gaveta mobile/tablet

  // Área demarcada de exportação selecionada pelo usuário
  const [exportArea, setExportArea] = useState<ExportArea | null>(null);

  // Navegação do Canvas (Pan e Zoom)
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 40, y: 30 });

  // Configurações de Grade
  const [snapGrid, setSnapGrid] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [gridSize, setGridSize] = useState<number>(20);

  // Padrões Globais para Novos Componentes e Diagrama
  const [defaultOrientation, setDefaultOrientation] = useState<0 | 90 | 180 | 270>(0);
  const [defaultLabelPosition, setDefaultLabelPosition] = useState<LabelPosition>('right');

  // Área de Transferência para Copiar / Colar na posição do mouse
  const lastCanvasMousePosRef = useRef<WirePoint | null>(null);
  const consecutivePasteCountRef = useRef(0);
  const lastPastedMousePosRef = useRef<{ x: number; y: number } | null>(null);
  const clipboardRef = useRef<{
    components: ComponentInstance[];
    wires: WireConnection[];
    center: { x: number; y: number };
  } | null>(null);
  const [canPaste, setCanPaste] = useState(false);

  // Modo de desenho de área de exportação solicitada pelo usuário
  const [drawingExportArea, setDrawingExportArea] = useState<{ format: 'png' | 'svg' } | null>(null);

  // Pilha de Desfazer/Refazer (Undo/Redo)
  const [historyPast, setHistoryPast] = useState<EditorSnapshot[]>([]);
  const [historyFuture, setHistoryFuture] = useState<EditorSnapshot[]>([]);

  // Referência ao SVG do canvas para renderização/exportação
  const svgRef = useRef<SVGSVGElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Salva snapshot no histórico antes de mutações
  const pushHistory = useCallback(() => {
    setHistoryPast((past) => {
      const currentSnapshot: EditorSnapshot = {
        components: JSON.parse(JSON.stringify(components)),
        wires: JSON.parse(JSON.stringify(wires)),
      };
      const updated = [...past, currentSnapshot];
      if (updated.length > MAX_HISTORY) {
        return updated.slice(updated.length - MAX_HISTORY);
      }
      return updated;
    });
    // Limpa pilha de refazer
    setHistoryFuture([]);
  }, [components, wires]);

  // Ação de Desfazer
  const handleUndo = useCallback(() => {
    if (historyPast.length === 0) return;
    const previous = historyPast[historyPast.length - 1];
    const newPast = historyPast.slice(0, historyPast.length - 1);

    setHistoryFuture((future) => [
      {
        components: JSON.parse(JSON.stringify(components)),
        wires: JSON.parse(JSON.stringify(wires)),
      },
      ...future,
    ]);

    setComponents(previous.components);
    setWires(previous.wires);
    setHistoryPast(newPast);
    setSelectedIds([]);
  }, [historyPast, components, wires]);

  // Ação de Refazer
  const handleRedo = useCallback(() => {
    if (historyFuture.length === 0) return;
    const next = historyFuture[0];
    const newFuture = historyFuture.slice(1);

    setHistoryPast((past) => [
      ...past,
      {
        components: JSON.parse(JSON.stringify(components)),
        wires: JSON.parse(JSON.stringify(wires)),
      },
    ]);

    setComponents(next.components);
    setWires(next.wires);
    setHistoryFuture(newFuture);
    setSelectedIds([]);
  }, [historyFuture, components, wires]);

  // Seleção de elementos
  const handleSelect = useCallback((ids: string[], isMulti: boolean = false) => {
    if (isMulti) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => {
          if (next.has(id)) next.delete(id);
          else next.add(id);
        });
        return Array.from(next);
      });
    } else {
      setSelectedIds(ids);
    }
  }, []);

  // Adiciona novo componente no centro ou em posição específica
  const handleAddComponent = useCallback(
    (type: ComponentType, pos?: { x: number; y: number }) => {
      pushHistory();
      const meta = COMPONENT_REGISTRY[type];
      if (!meta) return;

      let targetX = 240;
      let targetY = 180;

      if (pos) {
        if (type === 'node' && wires.length > 0) {
          // Se for nó, tenta encaixar o centro (pos.x, pos.y) diretamente na linha do fio
          const nearWire = findNearestPointOnWires(wires, components, { x: pos.x, y: pos.y }, 24, gridSize);
          if (nearWire) {
            targetX = nearWire.x - 10;
            targetY = nearWire.y - 10;
          } else {
            targetX = snapGrid ? snapToGrid(pos.x, gridSize) : pos.x;
            targetY = snapGrid ? snapToGrid(pos.y, gridSize) : pos.y;
          }
        } else {
          targetX = snapGrid ? snapToGrid(pos.x, gridSize) : pos.x;
          targetY = snapGrid ? snapToGrid(pos.y, gridSize) : pos.y;
        }
      } else {
        // Centralizado relativo ao viewport
        targetX = snapToGrid(-pan.x + 300, gridSize);
        targetY = snapToGrid(-pan.y + 200, gridSize);
      }

      const newId = `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newComp: ComponentInstance = {
        id: newId,
        type,
        x: targetX,
        y: targetY,
        width: meta.defaultWidth,
        height: meta.defaultHeight,
        rotation: defaultOrientation,
        label: meta.defaultLabel,
        labelPosition: defaultLabelPosition,
        sublabel: meta.defaultSublabel,
      };

      setComponents((prev) => [...prev, newComp]);
      setSelectedIds([newId]);
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setMobileDrawer(null);
      }
    },
    [pushHistory, snapGrid, gridSize, pan, wires, components, defaultOrientation, defaultLabelPosition]
  );

  // Copiar elementos selecionados
  const handleCopy = useCallback(() => {
    if (selectedIds.length === 0) return;

    const selectedComps = components.filter((c) => selectedIds.includes(c.id));
    const selectedCompIdSet = new Set(selectedComps.map((c) => c.id));
    const selectedWireList = wires.filter(
      (w) =>
        selectedIds.includes(w.id) ||
        (w.fromComponentId &&
          selectedCompIdSet.has(w.fromComponentId) &&
          w.toComponentId &&
          selectedCompIdSet.has(w.toComponentId))
    );

    if (selectedComps.length === 0 && selectedWireList.length === 0) return;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    selectedComps.forEach((c) => {
      minX = Math.min(minX, c.x);
      minY = Math.min(minY, c.y);
      maxX = Math.max(maxX, c.x + c.width);
      maxY = Math.max(maxY, c.y + c.height);
    });

    selectedWireList.forEach((w) => {
      [w.fromPoint, w.toPoint, ...(w.waypoints || [])].forEach((pt) => {
        minX = Math.min(minX, pt.x);
        minY = Math.min(minY, pt.y);
        maxX = Math.max(maxX, pt.x);
        maxY = Math.max(maxY, pt.y);
      });
    });

    const centerX = snapToGrid((minX + maxX) / 2, gridSize);
    const centerY = snapToGrid((minY + maxY) / 2, gridSize);

    clipboardRef.current = {
      components: JSON.parse(JSON.stringify(selectedComps)),
      wires: JSON.parse(JSON.stringify(selectedWireList)),
      center: { x: centerX, y: centerY },
    };
    consecutivePasteCountRef.current = 0;
    lastPastedMousePosRef.current = null;
    setCanPaste(true);
  }, [components, wires, selectedIds, gridSize]);

  // Colar elementos copiados na posição do cursor do mouse no canvas
  const handlePaste = useCallback(() => {
    if (!clipboardRef.current) return;
    const { components: clipComps, wires: clipWires, center: clipCenter } = clipboardRef.current;
    if (clipComps.length === 0 && clipWires.length === 0) return;

    pushHistory();

    let targetX: number;
    let targetY: number;

    if (lastCanvasMousePosRef.current) {
      targetX = snapToGrid(lastCanvasMousePosRef.current.x, gridSize);
      targetY = snapToGrid(lastCanvasMousePosRef.current.y, gridSize);

      // Se o usuário colou novamente sem mover o mouse, aplica um pequeno deslocamento de 1 grid
      if (
        lastPastedMousePosRef.current &&
        lastPastedMousePosRef.current.x === targetX &&
        lastPastedMousePosRef.current.y === targetY
      ) {
        consecutivePasteCountRef.current += 1;
        targetX += consecutivePasteCountRef.current * gridSize;
        targetY += consecutivePasteCountRef.current * gridSize;
      } else {
        consecutivePasteCountRef.current = 0;
        lastPastedMousePosRef.current = { x: targetX, y: targetY };
      }
    } else {
      consecutivePasteCountRef.current += 1;
      targetX = clipCenter.x + consecutivePasteCountRef.current * gridSize * 2;
      targetY = clipCenter.y + consecutivePasteCountRef.current * gridSize * 2;
    }

    const dx = targetX - clipCenter.x;
    const dy = targetY - clipCenter.y;

    const idMap = new Map<string, string>();
    const newCompIds: string[] = [];
    const newWireIds: string[] = [];

    const newComps: ComponentInstance[] = clipComps.map((comp) => {
      const newId = `${comp.type}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      idMap.set(comp.id, newId);
      newCompIds.push(newId);

      return {
        ...comp,
        id: newId,
        x: snapToGrid(comp.x + dx, gridSize),
        y: snapToGrid(comp.y + dy, gridSize),
      };
    });

    const newWiresList: WireConnection[] = clipWires.map((wire) => {
      const newId = `wire_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      newWireIds.push(newId);

      return {
        ...wire,
        id: newId,
        fromComponentId: wire.fromComponentId ? idMap.get(wire.fromComponentId) || wire.fromComponentId : undefined,
        toComponentId: wire.toComponentId ? idMap.get(wire.toComponentId) || wire.toComponentId : undefined,
        fromPoint: {
          x: wire.fromPoint.x + dx,
          y: wire.fromPoint.y + dy,
        },
        toPoint: {
          x: wire.toPoint.x + dx,
          y: wire.toPoint.y + dy,
        },
        waypoints: (wire.waypoints || []).map((pt) => ({
          x: pt.x + dx,
          y: pt.y + dy,
        })),
      };
    });

    setComponents((prev) => [...prev, ...newComps]);
    setWires((prev) => [...prev, ...newWiresList]);
    setSelectedIds([...newCompIds, ...newWireIds]);
  }, [pushHistory, gridSize]);

  // Aplica uma posição de rótulo para todos os componentes do diagrama
  const handleApplyLabelPositionToAll = useCallback(
    (pos: LabelPosition) => {
      if (components.length === 0) return;
      pushHistory();
      setDefaultLabelPosition(pos);
      setComponents((prev) =>
        prev.map((c) => ({
          ...c,
          labelPosition: pos,
          labelOffsetX: 0,
          labelOffsetY: 0,
        }))
      );
    },
    [components.length, pushHistory]
  );

  // Atualiza um componente
  const handleUpdateComponent = useCallback(
    (id: string, updates: Partial<ComponentInstance>) => {
      setComponents((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );
    },
    []
  );

  // Atualização em lote de componentes (durante arrasto)
  const handleUpdateComponents = useCallback(
    (updates: Array<{ id: string; updates: Partial<ComponentInstance> }>) => {
      const updateMap = new Map(updates.map((u) => [u.id, u.updates]));
      setComponents((prev) =>
        prev.map((c) => {
          const u = updateMap.get(c.id);
          return u ? { ...c, ...u } : c;
        })
      );
    },
    []
  );

  // Atualiza os waypoints de um ou mais fios (usado ao mover componentes conectados, para arrastar as dobras junto)
  const handleUpdateWires = useCallback(
    (updates: Array<{ id: string; waypoints: WirePoint[] }>) => {
      const updateMap = new Map(updates.map((u) => [u.id, u.waypoints]));
      setWires((prev) =>
        prev.map((w) => {
          const wp = updateMap.get(w.id);
          return wp ? { ...w, waypoints: wp } : w;
        })
      );
    },
    []
  );

  // Rotação dos componentes selecionados (90° horário)
  const handleRotateSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    pushHistory();

    const rotationSteps: Array<0 | 90 | 180 | 270> = [0, 90, 180, 270];

    setComponents((prev) =>
      prev.map((c) => {
        if (!selectedIds.includes(c.id)) return c;
        const currentIdx = rotationSteps.indexOf(c.rotation);
        const nextRot = rotationSteps[(currentIdx + 1) % 4];
        return { ...c, rotation: nextRot };
      })
    );
  }, [selectedIds, pushHistory]);

  // Adiciona novo fio de conexão
  const handleAddWire = useCallback(
    (wire: WireConnection) => {
      pushHistory();
      setWires((prev) => [...prev, wire]);
    },
    [pushHistory]
  );

  // Exclui elementos selecionados
  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    pushHistory();

    const selectedSet = new Set(selectedIds);

    // Remove componentes
    setComponents((prev) => prev.filter((c) => !selectedSet.has(c.id)));

    // Remove fios explicitamente selecionados OU conectados a componentes removidos
    setWires((prev) =>
      prev.filter(
        (w) =>
          !selectedSet.has(w.id) &&
          (!w.fromComponentId || !selectedSet.has(w.fromComponentId)) &&
          (!w.toComponentId || !selectedSet.has(w.toComponentId))
      )
    );

    setSelectedIds([]);
  }, [selectedIds, pushHistory]);

  // Limpa o canvas inteiro
  const handleClearDiagram = useCallback(() => {
    if (components.length === 0 && wires.length === 0) return;
    if (window.confirm('Tem certeza que deseja limpar todo o diagrama?')) {
      pushHistory();
      setComponents([]);
      setWires([]);
      setSelectedIds([]);
      setExportArea(null);
    }
  }, [components, wires, pushHistory]);

  // Atalhos de teclado globais
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora se estiver digitando em inputs de texto
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopy();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        handlePaste();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteSelected();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleRotateSelected();
      } else if (e.key.toLowerCase() === 'v') {
        setTool('select');
      } else if (e.key.toLowerCase() === 'w') {
        setTool('wire');
      } else if (e.key.toLowerCase() === 'h') {
        setTool('pan');
      } else if (e.key === 'Escape') {
        setSelectedIds([]);
        if (tool === 'wire') setTool('select');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setSelectedIds(components.map((c) => c.id));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, handleDeleteSelected, handleRotateSelected, handleCopy, handlePaste, tool, components]);

  // Exportações com suporte a área selecionada
  const handleExportPng = (scale: number = 3, transparent: boolean = false) => {
    if (!svgRef.current) return;
    exportToPng(svgRef.current, components, wires, {
      scale,
      transparentBg: transparent,
      padding: 40,
      customBounds: exportArea || undefined,
    });
  };

  const handleExportSvg = () => {
    if (!svgRef.current) return;
    exportToSvg(svgRef.current, components, wires, exportArea || 40);
  };

  // Finalização do desenho de área de exportação acionada pelo botão Exportar
  const handleFinishDrawExportArea = useCallback(
    (bounds: { x: number; y: number; width: number; height: number }) => {
      setExportArea(bounds);
      const format = drawingExportArea?.format || 'png';
      setDrawingExportArea(null);

      setTimeout(() => {
        if (!svgRef.current) return;
        if (format === 'svg') {
          exportToSvg(svgRef.current, components, wires, bounds);
        } else {
          exportToPng(svgRef.current, components, wires, {
            scale: 3,
            transparentBg: false,
            padding: 20,
            customBounds: bounds,
          });
        }
      }, 60);
    },
    [drawingExportArea, components, wires]
  );

  const handleExportJson = () => {
    exportToJson(components, wires);
  };

  const handleImportJson = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.components && Array.isArray(parsed.components)) {
          pushHistory();
          setComponents(parsed.components);
          setWires(parsed.wires || []);
          setSelectedIds([]);
        } else {
          alert('Arquivo JSON com estrutura de diagrama inválida.');
        }
      } catch {
        alert('Erro ao interpretar o arquivo JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Itens selecionados para o painel de propriedades
  const selectedComponents = components.filter((c) => selectedIds.includes(c.id));
  const selectedWires = wires.filter((w) => selectedIds.includes(w.id));

  return (
    <div id="circuit-editor-app" className="flex flex-col h-screen w-screen bg-[#fdfdfd] text-[#1a1a1a] overflow-hidden font-sans select-none">
      {/* Barra de Ferramentas Superior */}
      <Toolbar
        tool={tool}
        onSetTool={setTool}
        canUndo={historyPast.length > 0}
        canRedo={historyFuture.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onCopy={handleCopy}
        onPaste={handlePaste}
        canPaste={canPaste}
        onRotateSelected={handleRotateSelected}
        onDeleteSelected={handleDeleteSelected}
        hasSelection={selectedIds.length > 0}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(Number((z + 0.15).toFixed(2)), 3))}
        onZoomOut={() => setZoom((z) => Math.max(Number((z - 0.15).toFixed(2)), 0.3))}
        onResetZoom={() => setZoom(1)}
        snapGrid={snapGrid}
        onToggleSnapGrid={() => setSnapGrid(!snapGrid)}
        showGrid={showGrid}
        onToggleShowGrid={() => setShowGrid(!showGrid)}
        hasExportArea={!!exportArea}
        onClearExportArea={() => setExportArea(null)}
        onRequestDrawExportArea={(format) => setDrawingExportArea({ format })}
        onExportPng={handleExportPng}
        onExportSvg={handleExportSvg}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onExportSingleHtml={exportSingleHtmlApp}
        onClearDiagram={handleClearDiagram}
      />

      {/* Área Central: Sidebar Esquerda + Canvas + Painel de Propriedades à Direita */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Backdrop para fechar gavetas no mobile/tablet */}
        {mobileDrawer && (
          <div
            className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawer(null)}
          />
        )}

        <Sidebar
          isOpen={mobileDrawer === 'components'}
          onClose={() => setMobileDrawer(null)}
          onAddComponent={(type) => handleAddComponent(type)}
        />

        <Canvas
          components={components}
          wires={wires}
          selectedIds={selectedIds}
          highlightedId={highlightedComponentId}   // NOVO
          tool={tool}
          onSetTool={setTool}
          onBeginDrag={pushHistory}   // NOVO
          onUpdateWires={handleUpdateWires}   // NOVO
          exportArea={exportArea}
          onClearExportArea={() => setExportArea(null)}   // NOVO
          onExportAreaChange={setExportArea}   // NOVO
          isDrawingExportArea={!!drawingExportArea}
          onFinishDrawExportArea={handleFinishDrawExportArea}
          onCancelDrawExportArea={() => setDrawingExportArea(null)}
          gridSize={gridSize}
          snapGrid={snapGrid}
          showGrid={showGrid}
          zoom={zoom}
          pan={pan}
          svgRef={svgRef}
          onSelect={handleSelect}
          onUpdateComponent={handleUpdateComponent}
          onUpdateComponents={handleUpdateComponents}
          onAddWire={handleAddWire}
          onDeleteSelected={handleDeleteSelected}
          onPanChange={setPan}
          onZoomChange={setZoom}
          onAddComponentAt={(type, pos) => handleAddComponent(type, pos)}
          onCanvasMouseMove={(pt) => {
            lastCanvasMousePosRef.current = pt;
          }}
        />

        <PropertyPanel
          isOpen={mobileDrawer === 'properties'}
          onClose={() => setMobileDrawer(null)}
          selectedComponents={selectedComponents}
          selectedWires={selectedWires}
          onUpdateComponent={handleUpdateComponent}
          onUpdateComponents={handleUpdateComponents}
          onHighlightComponent={setHighlightedComponentId}   // NOVO
          onRotateSelected={handleRotateSelected}
          onDeleteSelected={handleDeleteSelected}
          snapGrid={snapGrid}
          onToggleSnapGrid={() => setSnapGrid(!snapGrid)}
          showGrid={showGrid}
          onToggleShowGrid={() => setShowGrid(!showGrid)}
          gridSize={gridSize}
          onChangeGridSize={setGridSize}
          defaultOrientation={defaultOrientation}
          onChangeDefaultOrientation={setDefaultOrientation}
          defaultLabelPosition={defaultLabelPosition}
          onChangeDefaultLabelPosition={setDefaultLabelPosition}
          onApplyLabelPositionToAll={handleApplyLabelPositionToAll}
        />
      </div>

      {/* Barra flutuante de navegação rápida para Celulares e Tablets (< lg) */}
      <div className="lg:hidden fixed bottom-9 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-[#e5e5e5] shadow-lg px-2.5 py-1.5 rounded-full text-xs font-medium select-none">
        <button
          type="button"
          onClick={() => setMobileDrawer(mobileDrawer === 'components' ? null : 'components')}
          className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer ${
            mobileDrawer === 'components'
              ? 'bg-black text-white'
              : 'text-[#1a1a1a] hover:bg-[#f5f5f5]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Componentes</span>
        </button>
        <div className="w-px h-4 bg-[#e5e5e5]" />
        <button
          type="button"
          onClick={() => setMobileDrawer(mobileDrawer === 'properties' ? null : 'properties')}
          className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer ${
            mobileDrawer === 'properties'
              ? 'bg-black text-white'
              : 'text-[#1a1a1a] hover:bg-[#f5f5f5]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Propriedades</span>
          {selectedIds.length > 0 && (
            <span className="px-1.5 py-0.2 bg-blue-600 text-white rounded-full text-[10px] font-bold">
              {selectedIds.length}
            </span>
          )}
        </button>
      </div>

      {/* Barra de Status */}
      <footer className="h-6 bg-[#f5f5f5] border-t border-[#e5e5e5] flex items-center justify-between px-3 sm:px-3.5 text-[10px] text-[#888] shrink-0 select-none overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          </span>
          <span>Grade: {gridSize}px ({snapGrid ? 'Snap Ativo' : 'Snap Off'})</span>
          <span className="hidden sm:inline">Elementos: {components.length} | Conexões: {wires.length}</span>
          {exportArea && (
            <span className="text-amber-700 font-medium">
              Área: {Math.round(exportArea.width)}×{Math.round(exportArea.height)}px
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden md:inline font-medium text-[#444]">Editor de Diagramas Acústicos &amp; Elétricos</span>
          <div className="hidden md:block w-px h-3 bg-[#ddd]"></div>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"> github.com/orfzzz </a>
        </div>
      </footer>

      {/* Input Oculto para Importação JSON */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
