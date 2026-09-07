import React, { useState, useRef, useEffect } from 'react';
import { ComponentInstance, WireConnection, LabelPosition } from '../types';
import { COMPONENT_REGISTRY } from '../data/componentRegistry';
import {
  RotateCw,
  Trash2,
  Sliders,
  Type,
  ArrowDown,
  ArrowUp,
  ArrowRight,
  ArrowLeft,
  Tag,
  Move,
  RotateCcw,
  Globe,
  Compass,
  ListOrdered,
  Layers,
  GripVertical,
  X,
} from 'lucide-react';

// DRAG DE BARRINHA (CLAUDE)

interface PropertyPanelProps {
  selectedComponents: ComponentInstance[];
  selectedWires: WireConnection[];
  onUpdateComponent: (id: string, updates: Partial<ComponentInstance>) => void;
  onUpdateComponents?: (updates: Array<{ id: string; updates: Partial<ComponentInstance> }>) => void;
  onRotateSelected: () => void;
  onDeleteSelected: () => void;
  snapGrid: boolean;
  onToggleSnapGrid: () => void;
  showGrid: boolean;
  onToggleShowGrid: () => void;
  gridSize: number;
  onChangeGridSize: (size: number) => void;
  defaultOrientation: 0 | 90 | 180 | 270;
  onChangeDefaultOrientation: (orientation: 0 | 90 | 180 | 270) => void;
  defaultLabelPosition: LabelPosition;
  onChangeDefaultLabelPosition: (pos: LabelPosition) => void;
  onApplyLabelPositionToAll: (pos: LabelPosition) => void;
  onHighlightComponent?: (id: string | null) => void; // NOVO
  isOpen?: boolean;
  onClose?: () => void;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedComponents,
  selectedWires,
  onUpdateComponent,
  onUpdateComponents,
  onRotateSelected,
  onDeleteSelected,
  snapGrid,
  onToggleSnapGrid,
  showGrid,
  onToggleShowGrid,
  gridSize,
  onChangeGridSize,
  defaultOrientation,
  onChangeDefaultOrientation,
  defaultLabelPosition,
  onChangeDefaultLabelPosition,
  onApplyLabelPositionToAll,
  onHighlightComponent, // NOVO
  isOpen = true,
  onClose,
}) => {
  const [batchCommonLabel, setBatchCommonLabel] = useState('');
  const [batchFontSize, setBatchFontSize] = useState(19);

  // Estado local para permitir reordenar a lista por drag-and-drop
  const [orderedComponents, setOrderedComponents] = useState(selectedComponents);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    setOrderedComponents(selectedComponents);
  }, [selectedComponents]);

  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const newList = [...orderedComponents];
    const dragged = newList.splice(dragItem.current, 1)[0];
    newList.splice(dragOverItem.current, 0, dragged);
    dragItem.current = null;
    dragOverItem.current = null;
    setOrderedComponents(newList);
  };
  
  const isSingleComp = selectedComponents.length === 1 && selectedWires.length === 0;
  const isSingleWire = selectedWires.length === 1 && selectedComponents.length === 0;
  const hasMultiple = selectedComponents.length + selectedWires.length > 1;

  const currentComp = isSingleComp ? selectedComponents[0] : null;
  const currentMeta = currentComp ? COMPONENT_REGISTRY[currentComp.type] : null;



  // Símbolos rápidos para inserir no label matemático
  const mathShortcuts = [
    { label: '_a', insert: '_a' },
    { label: '_{in}', insert: '_{in}' },
    { label: '_0', insert: '_0' },
    { label: '_1', insert: '_1' },
    { label: 'ω', insert: '\\omega' },
    { label: 'jω', insert: 'j\\omega ' },
    { label: '1/jω', insert: '1/j\\omega ' },
    { label: '1/', insert: '1/' },
    { label: 'ρ', insert: '\\rho' },
    { label: 'Δ', insert: '\\Delta' },
  ];

  const handleInsertShortcut = (str: string) => {
    if (!currentComp) return;
    onUpdateComponent(currentComp.id, {
      label: (currentComp.label || '') + str,
    });
  };

  // Aplica tamanho de fonte para todos os componentes selecionados
  const handleBatchFontSize = (size: number) => {
    if (selectedComponents.length === 0) return;
    if (onUpdateComponents) {
      onUpdateComponents(
        selectedComponents.map((c) => ({
          id: c.id,
          updates: { fontSize: size, labelFontSize: size },
        }))
      );
    } else {
      selectedComponents.forEach((c) => {
        onUpdateComponent(c.id, { fontSize: size, labelFontSize: size });
      });
    }
  };

  // Aplica orientação por seta para todos os componentes selecionados
  const handleBatchOrientation = (deg: 0 | 90 | 180 | 270) => {
    if (selectedComponents.length === 0) return;
    if (onUpdateComponents) {
      onUpdateComponents(
        selectedComponents.map((c) => ({
          id: c.id,
          updates: { rotation: deg },
        }))
      );
    } else {
      selectedComponents.forEach((c) => {
        onUpdateComponent(c.id, { rotation: deg });
      });
    }
  };

  // Aplica um rótulo comum para todos os componentes selecionados
  const handleApplyBatchCommonLabel = () => {
    if (!batchCommonLabel.trim() || selectedComponents.length === 0) return;
    if (onUpdateComponents) {
      onUpdateComponents(
        selectedComponents.map((c) => ({
          id: c.id,
          updates: { label: batchCommonLabel.trim() },
        }))
      );
    } else {
      selectedComponents.forEach((c) => {
        onUpdateComponent(c.id, { label: batchCommonLabel.trim() });
      });
    }
  };

  // Numera sequencialmente os rótulos selecionados (ex: R_1, R_2, R_3...)
  const handleBatchNumberSequentially = () => {
    if (orderedComponents.length === 0) return;
    const basePrefix = batchCommonLabel.trim() || 'Z';
    const updates = orderedComponents.map((c, idx) => ({
      id: c.id,
      updates: { label: `${basePrefix}_{${idx + 1}}` },
    }));

    if (onUpdateComponents) {
      onUpdateComponents(updates);
    } else {
      updates.forEach((u) => onUpdateComponent(u.id, u.updates));
    }
  };

  // Aplica posição de rótulo para todos os selecionados
  const handleBatchLabelPosition = (pos: LabelPosition) => {
    if (selectedComponents.length === 0) return;
    const updates = selectedComponents.map((c) => ({
      id: c.id,
      updates: { labelPosition: pos, labelOffsetX: 0, labelOffsetY: 0 },
    }));

    if (onUpdateComponents) {
      onUpdateComponents(updates);
    } else {
      updates.forEach((u) => onUpdateComponent(u.id, u.updates));
    }
  };

  return (
    <aside
      id="property-panel"
      className={`fixed inset-y-0 right-0 z-40 w-72 sm:w-80 max-w-[85vw] border-l border-[#e5e5e5] bg-white flex flex-col h-full shadow-2xl transition-transform duration-200 lg:static lg:w-64 lg:shadow-none lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
      } select-none overflow-y-auto shrink-0 text-[#1a1a1a]`}
    >
      <div className="p-3 border-b border-[#e5e5e5] flex items-center justify-between bg-white">
        <div className="flex items-center space-x-2">
          <Sliders className="w-3.5 h-3.5 text-[#666]" />
          <h3 className="text-[10px] font-bold text-[#999] uppercase tracking-wider">
            Propriedades
          </h3>
        </div>

        <div className="flex items-center gap-1">
          {(selectedComponents.length > 0 || selectedWires.length > 0) && (
            <button
              id="delete-selected-prop-btn"
              onClick={onDeleteSelected}
              title="Excluir selecionado (Delete)"
              className="p-1 rounded text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1 rounded-md text-[#666] hover:bg-[#f5f5f5] hover:text-black transition-colors"
              title="Fechar painel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-3 space-y-3.5 text-xs">
        {/* CASO 1: Um único componente selecionado */}
        {currentComp && currentMeta && (
          <>
            <div>
              <span className="text-[10px] font-bold text-[#999] uppercase tracking-wider block mb-1">
                Elemento Selecionado
              </span>
              <div className="p-2 bg-[#fdfdfd] rounded border border-[#e5e5e5]">
                <div className="font-semibold text-[#1a1a1a] text-xs">
                  {currentMeta.name}
                </div>
                <div className="text-[10px] text-[#888] mt-0.5">
                  {currentMeta.description}
                </div>
              </div>
            </div>

            {/* Rótulo Principal (com formatação matemática) */}
            <div>
              <label
                htmlFor="prop-comp-label"
                className="text-[10px] font-bold text-[#666] uppercase tracking-wider flex items-center gap-1 mb-1"
              >
                <Type className="w-3 h-3 text-[#666]" />
                Rótulo do Símbolo
              </label>
              <input
                id="prop-comp-label"
                type="text"
                value={currentComp.label}
                onChange={(e) =>
                  onUpdateComponent(currentComp.id, { label: e.target.value })
                }
                placeholder="Ex: M_a, C_a, R_1, 1/j\omega C_a"
                className="w-full px-2.5 py-1.5 font-serif text-sm bg-white border border-[#e5e5e5] rounded focus:border-black outline-none transition-colors text-[#1a1a1a]"
              />

              {/* Botões de Atalho para Subscritos e Grego */}
              <div className="mt-1.5">
                <span className="text-[10px] text-[#999] block mb-1">
                  Atalhos matemáticos:
                </span>
                <div className="flex flex-wrap gap-1">
                  {mathShortcuts.map((sc) => (
                    <button
                      key={sc.label}
                      type="button"
                      onClick={() => handleInsertShortcut(sc.insert)}
                      className="px-1.5 py-0.5 text-[10px] font-mono bg-[#f5f5f5] hover:bg-[#ebebeb] text-[#333] border border-[#e5e5e5] rounded transition-colors"
                    >
                      {sc.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sub-rótulo opcional (ex: Valor numérico ou unidade) */}
            <div>
              <label
                htmlFor="prop-comp-sublabel"
                className="text-[10px] font-bold text-[#666] uppercase tracking-wider flex items-center gap-1 mb-1"
              >
                <Tag className="w-3 h-3 text-[#666]" />
                Valor / Nota Adicional (Opcional)
              </label>
              <input
                id="prop-comp-sublabel"
                type="text"
                value={currentComp.sublabel || ''}
                onChange={(e) =>
                  onUpdateComponent(currentComp.id, { sublabel: e.target.value })
                }
                placeholder="Ex: 10 kg/m⁴ ou 50 Ω"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#e5e5e5] rounded focus:border-black outline-none transition-colors text-[#1a1a1a]"
              />
            </div>

            {/* Posição do Rótulo do Símbolo */}
            <div className="pt-2 border-t border-[#e5e5e5]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-[#666] uppercase tracking-wider flex items-center gap-1">
                  <Move className="w-3 h-3 text-[#666]" />
                  Posição do Rótulo
                </span>
                {(currentComp.labelOffsetX || currentComp.labelOffsetY) ? (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateComponent(currentComp.id, {
                        labelOffsetX: 0,
                        labelOffsetY: 0,
                      })
                    }
                    className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                    title="Resetar deslocamento manual para o ponto de ancoragem"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    Resetar offset
                  </button>
                ) : null}
              </div>

              {/* Botões rápidos de ancoragem (Acima, Abaixo, Esquerda, Direita, Centro) */}
              <div className="grid grid-cols-5 gap-1 mb-2">
                {[
                  { pos: 'top' as LabelPosition, label: 'Acima' },
                  { pos: 'bottom' as LabelPosition, label: 'Abaixo' },
                  { pos: 'left' as LabelPosition, label: 'Esq.' },
                  { pos: 'right' as LabelPosition, label: 'Dir.' },
                  { pos: 'center' as LabelPosition, label: 'Centro' },
                ].map(({ pos, label }) => {
                  const defaultPos = currentComp.type === 'node' ? 'top' : currentComp.type === 'ground' ? 'bottom' : 'right';
                  const activePos = currentComp.labelPosition || defaultPos;
                  const isActive = activePos === pos;

                  return (
                    <button
                      key={pos}
                      type="button"
                      onClick={() =>
                        onUpdateComponent(currentComp.id, {
                          labelPosition: pos,
                        })
                      }
                      className={`py-1 text-[10.5px] rounded border transition-colors ${
                        isActive
                          ? 'bg-black text-white border-black font-semibold'
                          : 'bg-white text-[#444] border-[#e5e5e5] hover:border-black'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Ajuste fino de Deslocamento X e Y (Offset em pixels) */}
              <div className="grid grid-rows-2 gap-2 p-2 bg-[#fcfcfc] rounded border border-[#e5e5e5]">
                <div>
                  <div className="flex justify-between items-center text-[10px] text-[#666] mb-1">
                    <span>Deslocamento X</span>
                    <span className="font-mono text-[#333] font-medium">{currentComp.labelOffsetX || 0}px</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateComponent(currentComp.id, {
                          labelOffsetX: (currentComp.labelOffsetX || 0) - 5,
                        })
                      }
                      className="w-6 h-6 flex items-center justify-center bg-white hover:bg-[#f0f0f0] active:bg-[#e4e4e4] border border-[#d4d4d4] rounded text-xs font-bold text-[#333] transition-colors"
                      title="-5px horizontal"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={currentComp.labelOffsetX || 0}
                      onChange={(e) =>
                        onUpdateComponent(currentComp.id, {
                          labelOffsetX: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full text-center py-0.5 px-1 bg-white border border-[#e5e5e5] rounded text-xs font-mono text-[#1a1a1a]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateComponent(currentComp.id, {
                          labelOffsetX: (currentComp.labelOffsetX || 0) + 5,
                        })
                      }
                      className="w-6 h-6 flex items-center justify-center bg-white hover:bg-[#f0f0f0] active:bg-[#e4e4e4] border border-[#d4d4d4] rounded text-xs font-bold text-[#333] transition-colors"
                      title="+5px horizontal"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-[10px] text-[#666] mb-1">
                    <span>Deslocamento Y</span>
                    <span className="font-mono text-[#333] font-medium">{currentComp.labelOffsetY || 0}px</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateComponent(currentComp.id, {
                          labelOffsetY: (currentComp.labelOffsetY || 0) - 5,
                        })
                      }
                      className="w-6 h-6 flex items-center justify-center bg-white hover:bg-[#f0f0f0] active:bg-[#e4e4e4] border border-[#d4d4d4] rounded text-xs font-bold text-[#333] transition-colors"
                      title="-5px vertical"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={currentComp.labelOffsetY || 0}
                      onChange={(e) =>
                        onUpdateComponent(currentComp.id, {
                          labelOffsetY: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full text-center py-0.5 px-1 bg-white border border-[#e5e5e5] rounded text-xs font-mono text-[#1a1a1a]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateComponent(currentComp.id, {
                          labelOffsetY: (currentComp.labelOffsetY || 0) + 5,
                        })
                      }
                      className="w-6 h-6 flex items-center justify-center bg-white hover:bg-[#f0f0f0] active:bg-[#e4e4e4] border border-[#d4d4d4] rounded text-xs font-bold text-[#333] transition-colors"
                      title="+5px vertical"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <p className="mt-1 text-[9.5px] text-[#888] leading-tight">
                💡 Dica: Você também pode clicar e arrastar o rótulo diretamente no canvas para posicioná-lo.
              </p>
            </div>

            {/* Tamanho da Fonte dos Rótulos */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-[#666] uppercase tracking-wider flex items-center gap-1">
                  <Type className="w-3 h-3 text-[#666]" />
                  Tamanho do Rótulo
                </span>
                <div
                  className="flex items-center gap-0.5 bg-[#f5f5f5] hover:bg-white focus-within:bg-white border border-[#e5e5e5] focus-within:border-black rounded px-1.5 py-0.5 transition-colors cursor-text"
                  title="Clique para digitar o tamanho exato em pixels"
                >
                  <input
                    id="prop-label-fontsize-input"
                    type="number"
                    min="8"
                    max="64"
                    value={currentComp.labelFontSize || currentComp.fontSize || 19}
                    onChange={(e) => {
                      const sz = parseInt(e.target.value);
                      if (!isNaN(sz) && sz >= 6 && sz <= 100) {
                        onUpdateComponent(currentComp.id, {
                          labelFontSize: sz,
                          fontSize: sz,
                        });
                      }
                    }}
                    className="w-10 text-right font-mono text-xs font-semibold bg-transparent outline-none text-[#1a1a1a] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    //className="w-7 text-right font-mono text-xs font-semibold bg-transparent outline-none text-[#1a1a1a]"
                  />
                  <span className="text-[11px] font-mono text-[#888]">px</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="prop-label-fontsize-slider"
                  type="range"
                  min="10"
                  max="64"
                  step="1"
                  value={currentComp.labelFontSize || currentComp.fontSize || 19}
                  onChange={(e) => {
                    const sz = parseInt(e.target.value);
                    onUpdateComponent(currentComp.id, {
                      labelFontSize: sz,
                      fontSize: sz,
                    });
                  }}
                  className="w-full accent-black cursor-pointer h-2 bg-[#e5e5e5] rounded-lg"
                  title="Arraste para ajustar o tamanho do rótulo"
                />
              </div>
            </div>

            {/* Rotação / Orientação com Setas */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-[#666] uppercase tracking-wider flex items-center gap-1">
                  <Compass className="w-3 h-3 text-[#666]" />
                  Orientação
                </span>
                <button
                  type="button"
                  id="rotate-quick-btn"
                  onClick={onRotateSelected}
                  className="text-[10px] font-medium text-[#666] hover:text-black flex items-center gap-0.5 transition-colors"
                  title="Girar 90° horário (Atalho R)"
                >
                  <RotateCw className="w-3 h-3" />
                  +90° (R)
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { deg: 0 as const, label: 'Cima', icon: <ArrowUp className="w-4 h-4" /> },
                  { deg: 90 as const, label: 'Direita', icon: <ArrowRight className="w-4 h-4" /> },
                  { deg: 180 as const, label: 'Baixo', icon: <ArrowDown className="w-4 h-4" /> },
                  { deg: 270 as const, label: 'Esquerda', icon: <ArrowLeft className="w-4 h-4" /> },
                ].map(({ deg, label, icon }) => (
                  <button
                    key={deg}
                    type="button"
                    onClick={() => onUpdateComponent(currentComp.id, { rotation: deg })}
                    title={`Orientação para ${label} (${deg}°)`}
                    className={`py-2 flex flex-col items-center justify-center gap-1 rounded border transition-all ${
                      currentComp.rotation === deg
                        ? 'bg-black text-white border-black shadow-2xs font-semibold'
                        : 'bg-white text-[#444] border-[#e5e5e5] hover:border-black hover:bg-[#fafafa]'
                    }`}
                  >
                    {icon}
                    <span className="text-[9.5px] leading-none">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Indicadores de Analogia (Setas P / Q da Figura 4.5) */}
            <div className="pt-2 border-t border-[#e5e5e5]">
              <span className="text-[10px] font-bold text-[#999] uppercase tracking-wider block mb-2">
                Setas
              </span>
              <div className="space-y-1.5">
                {/* Seta de Vazão Q */}
                <div className="flex items-center justify-between p-2 bg-[#fdfdfd] rounded border border-[#e5e5e5]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!currentComp.showFlowArrow}
                      onChange={(e) =>
                        onUpdateComponent(currentComp.id, {
                          showFlowArrow: e.target.checked,
                          flowLabel: currentComp.flowLabel || 'Q',
                        })
                      }
                      className="rounded border-[#e5e5e5] text-black focus:ring-black"
                    />
                    <span className="text-xs text-[#1a1a1a] flex items-center gap-1">
                      <ArrowDown className="w-3 h-3 text-[#666]" />
                      Q/I
                    </span>
                  </label>
                  {currentComp.showFlowArrow && (
                    <input
                      type="text"
                      value={currentComp.flowLabel || 'Q'}
                      onChange={(e) =>
                        onUpdateComponent(currentComp.id, { flowLabel: e.target.value })
                      }
                      className="w-10 px-1 py-0.5 font-serif text-center text-xs bg-white border border-[#e5e5e5] rounded focus:border-black outline-none"
                    />
                  )}
                </div>

                {/* Seta de Queda de Pressão P */}
                <div className="flex items-center justify-between p-2 bg-[#fdfdfd] rounded border border-[#e5e5e5]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!currentComp.showPressureArrow}
                      onChange={(e) =>
                        onUpdateComponent(currentComp.id, {
                          showPressureArrow: e.target.checked,
                          pressureLabel: currentComp.pressureLabel || 'P',
                        })
                      }
                      className="rounded border-[#e5e5e5] text-black focus:ring-black"
                    />
                    <span className="text-xs text-[#1a1a1a] flex items-center gap-1">
                      <ArrowUp className="w-3 h-3 text-[#666]" />
                      P/V
                    </span>
                  </label>
                  {currentComp.showPressureArrow && (
                    <input
                      type="text"
                      value={currentComp.pressureLabel || 'P'}
                      onChange={(e) =>
                        onUpdateComponent(currentComp.id, { pressureLabel: e.target.value })
                      }
                      className="w-10 px-1 py-0.5 font-serif text-center text-xs bg-white border border-[#e5e5e5] rounded focus:border-black outline-none"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Ação de Exclusão */}
            <div className="pt-2 border-t border-[#e5e5e5]">
              <button
                onClick={onDeleteSelected}
                className="w-full py-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded border border-red-200 font-medium transition-colors"
              >
                Excluir Componente
              </button>
            </div>
          </>
        )}

        {/* CASO 2: Um único fio selecionado */}
        {isSingleWire && (
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-[#999] uppercase tracking-wider block">
              Conexão Selecionada
            </span>
            <div className="p-2.5 bg-[#fdfdfd] rounded border border-[#e5e5e5]">
              <div className="font-semibold text-[#1a1a1a] text-xs">
                Fio Condutor
              </div>
              <p className="text-[10px] text-[#888] mt-1">
                Conecta nós ou portas de componentes. Use Delete para remover.
              </p>
            </div>
            <button
              onClick={onDeleteSelected}
              className="w-full py-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded border border-red-200 font-medium transition-colors"
            >
              Remover Fio
            </button>
          </div>
        )}

        {/* CASO 3: Vários elementos selecionados */}
        {hasMultiple && (
          <div className="space-y-3.5">
            <div>
              <span className="text-[10px] font-bold text-[#999] uppercase tracking-wider block mb-1">
                Seleção Múltipla
              </span>
              <div className="p-2.5 bg-[#fdfdfd] rounded border border-[#e5e5e5] text-[#333]">
                <span className="font-semibold text-xs">
                  {selectedComponents.length} componente(s)
                </span>
                {selectedWires.length > 0 && (
                  <span className="text-xs text-[#666]"> e {selectedWires.length} fio(s)</span>
                )}{' '}
                selecionados.
              </div>
            </div>

            {/* Ações em Lote para Componentes Selecionados */}
            {selectedComponents.length > 0 && (
              <>
                {/* 1. Alterar Rótulos em Lote (Batch Labeling) */}
                <div className="p-2.5 bg-[#fcfcfc] rounded border border-[#e5e5e5] space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-[#666]" />
                    <span className="text-[10px] font-bold text-[#666] uppercase tracking-wider">
                      Alterar Rótulos em Lote
                    </span>
                  </div>

                  {/* Definir Rótulo Comum ou Prefixo */}
                  <div>
                    <label className="text-[10px] text-[#888] block mb-1">
                      Definir texto comum ou prefixo:
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={batchCommonLabel}
                        onChange={(e) => setBatchCommonLabel(e.target.value)}
                        placeholder="Ex: R, Z_a, C_1"
                        className="flex-1 min-w-0 px-2 py-1 font-serif text-xs bg-white border border-[#e5e5e5] rounded focus:border-black outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={handleApplyBatchCommonLabel}
                        disabled={!batchCommonLabel.trim()}
                        className="shrink-0 whitespace-nowrap px-2.5 py-1 text-[11px] font-medium bg-black text-white rounded hover:bg-[#333] disabled:opacity-40 transition-colors cursor-pointer"
                        title="Aplica este texto a todos os selecionados"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>

                  {/* Numeração Sequencial Rápida (1..N) */}
                  <button
                    type="button"
                    onClick={handleBatchNumberSequentially}
                    className="w-full py-1 text-[11px] font-medium bg-white hover:bg-[#f5f5f5] text-[#333] border border-[#d4d4d4] rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Numera sequencialmente: [Prefixo]_1, [Prefixo]_2, etc."
                  >
                    <ListOrdered className="w-3.5 h-3.5 text-[#666]" />
                    Numerar em Sequência (1..{selectedComponents.length})
                  </button>

                  {/* Lista de Edição Rápida Individual dos Selecionados */}
                  <div className="pt-2 border-t border-[#e5e5e5]">
                    <span className="text-[10px] text-[#888] block mb-1.5">
                      Editar rótulos individuais da seleção:
                    </span>
                    <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                      {orderedComponents.map((comp, idx) => {
                        const meta = COMPONENT_REGISTRY[comp.type];
                        return (
                          <div
                            key={comp.id}
                            draggable
                            onDragStart={() => handleDragStart(idx)}
                            onDragEnter={() => handleDragEnter(idx)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                            onMouseEnter={() => onHighlightComponent?.(comp.id)}
                            onMouseLeave={() => onHighlightComponent?.(null)}
                            className="flex items-center gap-1.5 p-1.5 bg-white rounded border border-[#e5e5e5] cursor-move"
                          >
                            <GripVertical className="w-3 h-3 text-[#ccc] shrink-0" />
                            <span className="w-4 text-[10px] font-mono text-[#999] text-center shrink-0">
                              {idx + 1}
                            </span>
                            <input
                              type="text"
                              value={comp.label}
                              onChange={(e) => onUpdateComponent(comp.id, { label: e.target.value })}
                              placeholder="Rótulo"
                              className="flex-[2] min-w-0 px-1.5 py-0.5 font-serif text-xs bg-[#fdfdfd] border border-[#e5e5e5] rounded focus:border-black outline-none"
                            />
                            {comp.type !== 'node' && comp.type !== 'ground' && (
                              <input
                                type="text"
                                value={comp.sublabel || ''}
                                onChange={(e) => onUpdateComponent(comp.id, { sublabel: e.target.value })}
                                placeholder="Valor"
                                className="flex-1 min-w-0 px-1 py-0.5 text-[10.5px] bg-[#fdfdfd] border border-[#e5e5e5] rounded focus:border-black outline-none"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 2. Tamanho da Fonte dos Rótulos em Lote */}
                <div className="p-2.5 bg-[#fcfcfc] rounded border border-[#e5e5e5] space-y-1.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-[#666] uppercase tracking-wider flex items-center gap-1">
                      <Type className="w-3 h-3 text-[#666]" />
                      Tamanho do Rótulo em Lote
                    </span>
                    <div
                      className="flex items-center gap-0.5 bg-[#f5f5f5] hover:bg-white focus-within:bg-white border border-[#e5e5e5] focus-within:border-black rounded px-1.5 py-0.5 transition-colors cursor-text"
                      title="Clique para digitar o tamanho exato em pixels"
                    >
                      <input
                        type="number"
                        min="8"
                        max="64"
                        value={batchFontSize}
                        onChange={(e) => {
                          const sz = parseInt(e.target.value);
                          if (!isNaN(sz) && sz >= 6 && sz <= 100) {
                            setBatchFontSize(sz);
                            handleBatchFontSize(sz);
                          }
                        }}
                        className="w-10 text-right font-mono text-xs font-semibold bg-transparent outline-none text-[#1a1a1a] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <span className="text-[11px] font-mono text-[#888]">px</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="64"
                    step="1"
                    value={batchFontSize}
                    onChange={(e) => {
                      const sz = parseInt(e.target.value);
                      setBatchFontSize(sz);
                      handleBatchFontSize(sz);
                    }}
                    className="w-full accent-black cursor-pointer h-2 bg-[#e5e5e5] rounded-lg"
                    title="Arraste para ajustar o tamanho do rótulo de todos os selecionados"
                  />
                </div>

                {/* 3. Orientação dos Selecionados com Setas */}
                <div className="p-2.5 bg-[#fcfcfc] rounded border border-[#e5e5e5] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#666] uppercase tracking-wider flex items-center gap-1">
                      <Compass className="w-3 h-3 text-[#666]" />
                      Orientação dos Selecionados
                    </span>
                    <button
                      type="button"
                      onClick={onRotateSelected}
                      className="text-[10px] font-medium text-[#666] hover:text-black flex items-center gap-0.5 transition-colors"
                      title="Girar 90° horário"
                    >
                      <RotateCw className="w-3 h-3" />
                      +90° (R)
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { deg: 0 as const, label: 'Cima', icon: <ArrowUp className="w-4 h-4" /> },
                      { deg: 90 as const, label: 'Direita', icon: <ArrowRight className="w-4 h-4" /> },
                      { deg: 180 as const, label: 'Baixo', icon: <ArrowDown className="w-4 h-4" /> },
                      { deg: 270 as const, label: 'Esquerda', icon: <ArrowLeft className="w-4 h-4" /> },
                    ].map(({ deg, label, icon }) => (
                      <button
                        key={deg}
                        type="button"
                        onClick={() => handleBatchOrientation(deg)}
                        title={`Definir orientação para ${label}`}
                        className="py-2 flex flex-col items-center justify-center gap-1 bg-white hover:bg-[#f5f5f5] text-[#444] hover:text-black border border-[#e5e5e5] hover:border-black rounded transition-all"
                      >
                        {icon}
                        <span className="text-[9.5px] leading-none">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Posição dos Rótulos em Lote */}
                <div className="p-2.5 bg-[#fcfcfc] rounded border border-[#e5e5e5] space-y-1.5">
                  <span className="text-[10px] font-bold text-[#666] uppercase tracking-wider flex items-center gap-1">
                    <Move className="w-3 h-3 text-[#666]" />
                    Posição dos Rótulos em Lote
                  </span>
                  <div className="grid grid-cols-5 gap-1">
                    {[
                      { pos: 'top' as LabelPosition, label: 'Acima' },
                      { pos: 'bottom' as LabelPosition, label: 'Abaixo' },
                      { pos: 'left' as LabelPosition, label: 'Esq.' },
                      { pos: 'right' as LabelPosition, label: 'Dir.' },
                      { pos: 'center' as LabelPosition, label: 'Centro' },
                    ].map(({ pos, label }) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => handleBatchLabelPosition(pos)}
                        className="py-1 text-[10px] bg-white text-[#444] border border-[#e5e5e5] hover:border-black rounded transition-colors"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Ações Globais de Seleção */}
            <div className="pt-2 border-t border-[#e5e5e5] space-y-1.5">
              <button
                type="button"
                onClick={onDeleteSelected}
                className="w-full py-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded border border-red-200 font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir Todos Selecionados (Delete)
              </button>
            </div>
          </div>
        )}

        {/* CASO 4: Nada selecionado (Configurações Gerais do Canvas) */}
        {!currentComp && !isSingleWire && !hasMultiple && (
          <div className="space-y-3.5">
            <span className="text-[10px] font-bold text-[#999] uppercase tracking-wider block">
              Configurações da Grade
            </span>

            {/* Snap to Grid */}
            <label className="flex items-center justify-between p-2 bg-[#fdfdfd] rounded border border-[#e5e5e5] cursor-pointer">
              <span className="text-xs text-[#1a1a1a] font-medium">
                Alinhar à Grade (Snap)
              </span>
              <input
                id="toggle-snap-grid-chk"
                type="checkbox"
                checked={snapGrid}
                onChange={onToggleSnapGrid}
                className="rounded border-[#e5e5e5] text-black focus:ring-black"
              />
            </label>

            {/* Exibir Grade */}
            <label className="flex items-center justify-between p-2 bg-[#fdfdfd] rounded border border-[#e5e5e5] cursor-pointer">
              <span className="text-xs text-[#1a1a1a] font-medium">
                Exibir Pontos da Grade
              </span>
              <input
                id="toggle-show-grid-chk"
                type="checkbox"
                checked={showGrid}
                onChange={onToggleShowGrid}
                className="rounded border-[#e5e5e5] text-black focus:ring-black"
              />
            </label>

            {/* Tamanho da Grade */}
            <div>
              <span className="text-[10px] text-[#888] block mb-1">
                Tamanho da grade: {gridSize}px
              </span>
              <div className="grid grid-cols-3 gap-1">
                {[10, 20, 40].map((size) => (
                  <button
                    key={size}
                    onClick={() => onChangeGridSize(size)}
                    className={`py-1 rounded text-xs font-medium border transition-colors ${
                      gridSize === size
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-[#444] border-[#e5e5e5] hover:border-black'
                    }`}
                  >
                    {size}px
                  </button>
                ))}
              </div>
            </div>

            {/* PADRÕES GLOBAIS DE COMPONENTES */}
            <div className="pt-3 border-t border-[#e5e5e5] space-y-3">
              <div className="flex items-center space-x-1.5 pb-1">
                <Globe className="w-3.5 h-3.5 text-[#666]" />
                <span className="text-[10px] font-bold text-[#999] uppercase tracking-wider">
                  Padrões para Novos Elementos
                </span>
              </div>

              {/* Orientação Padrão */}
              <div>
                <label className="text-[10px] font-bold text-[#666] uppercase tracking-wider flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1">
                    <Compass className="w-3 h-3 text-[#666]" />
                    Orientação Padrão
                  </span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { deg: 0 as const, label: 'Cima', icon: <ArrowUp className="w-4 h-4" /> },
                    { deg: 90 as const, label: 'Direita', icon: <ArrowRight className="w-4 h-4" /> },
                    { deg: 180 as const, label: 'Baixo', icon: <ArrowDown className="w-4 h-4" /> },
                    { deg: 270 as const, label: 'Esquerda', icon: <ArrowLeft className="w-4 h-4" /> },
                  ].map(({ deg, label, icon }) => (
                    <button
                      key={deg}
                      type="button"
                      onClick={() => onChangeDefaultOrientation(deg)}
                      title={`Padrão: ${label}`}
                      className={`py-2 flex flex-col items-center justify-center gap-1 rounded border transition-all ${
                        defaultOrientation === deg
                          ? 'bg-black text-white border-black font-semibold'
                          : 'bg-white text-[#444] border-[#e5e5e5] hover:border-black'
                      }`}
                    >
                      {icon}
                      <span className="text-[9.5px] leading-none">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Posição Padrão dos Rótulos */}
              <div>
                <label className="text-[10px] font-bold text-[#666] uppercase tracking-wider flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1">
                    <Move className="w-3 h-3 text-[#666]" />
                    Posição Padrão dos Rótulos
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-1 mb-2">
                  {[
                    { pos: 'top' as LabelPosition, label: 'Acima' },
                    { pos: 'bottom' as LabelPosition, label: 'Abaixo' },
                    { pos: 'left' as LabelPosition, label: 'Esquerda' },
                    { pos: 'right' as LabelPosition, label: 'Direita' },
                    { pos: 'center' as LabelPosition, label: 'Centro' },
                  ].map(({ pos, label }) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => onChangeDefaultLabelPosition(pos)}
                      className={`py-1 text-[10.5px] rounded border transition-colors ${
                        defaultLabelPosition === pos
                          ? 'bg-black text-white border-black font-semibold'
                          : 'bg-white text-[#444] border-[#e5e5e5] hover:border-black'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => onApplyLabelPositionToAll(defaultLabelPosition)}
                  className="w-full py-1.5 px-2 text-[11px] bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#0f172a] border border-[#cbd5e1] rounded transition-colors font-medium text-center"
                  title="Aplica esta posição de rótulo a todos os componentes do diagrama atual"
                >
                  Aplicar posição a todo o diagrama
                </button>
              </div>
            </div>

            {/* Circuit Health no estilo High Density */}
            {/*
            <div className="pt-3 border-t border-[#e5e5e5]">
              <span className="text-[10px] font-bold text-[#999] uppercase tracking-wider block mb-2">
                Estado do Circuito
              </span>
              <div className="p-2 bg-[#fdfdfd] border border-[#e5e5e5] rounded space-y-1.5 text-[11px] text-[#666]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Topologia
                  </span>
                  <span className="font-mono text-[#1a1a1a] font-medium">Válida</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Alinhamento</span>
                  <span className="font-mono text-[#1a1a1a]">{snapGrid ? 'Snap (20px)' : 'Livre'}</span>
                </div>
              </div>
            </div>*/}
          
            {/* Dica de Atalhos */}
            <div className="pt-3 border-t border-[#e5e5e5]">
              <span className="text-[10px] font-bold text-[#999] uppercase tracking-wider block mb-2">
                Atalhos do Teclado
              </span>
              <div className="space-y-1.5 text-[11px] text-[#666]">
                <div className="flex justify-between">
                  <span>Copiar seleção:</span>
                  <kbd className="px-1 py-0.5 bg-[#f5f5f5] border border-[#e5e5e5] rounded font-mono text-[10px]">Ctrl+C</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Colar no cursor:</span>
                  <kbd className="px-1 py-0.5 bg-[#f5f5f5] border border-[#e5e5e5] rounded font-mono text-[10px]">Ctrl+V</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Girar componente:</span>
                  <kbd className="px-1 py-0.5 bg-[#f5f5f5] border border-[#e5e5e5] rounded font-mono text-[10px]">R</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Excluir selecionado:</span>
                  <kbd className="px-1 py-0.5 bg-[#f5f5f5] border border-[#e5e5e5] rounded font-mono text-[10px]">Del</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Desfazer / Refazer:</span>
                  <kbd className="px-1 py-0.5 bg-[#f5f5f5] border border-[#e5e5e5] rounded font-mono text-[10px]">Ctrl+Z / Y</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Pan no canvas:</span>
                  <span className="text-[#888]">Espaço + arrastar</span>
                </div>
                <div className="flex justify-between">
                  <span>Zoom in/out:</span>
                  <span className="text-[#888]">Ctrl + Scroll</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
