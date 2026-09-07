import React, { useState } from 'react';
import { ComponentCategory, ComponentType } from '../types';
import { COMPONENT_REGISTRY } from '../data/componentRegistry';
import { ComponentSymbol } from './symbols/ComponentSymbol';
import {
  Waves,
  Zap,
  Layers,
  Search,
  Plus,
  X,
} from 'lucide-react';

interface SidebarProps {
  onAddComponent: (type: ComponentType) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onAddComponent, isOpen = true, onClose }) => {
  const [activeTab, setActiveTab] = useState<'all' | ComponentCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories: Array<{ id: 'all' | ComponentCategory; label: string; icon: React.ReactNode }> = [
    { id: 'all', label: 'Todos', icon: <Layers className="w-4 h-4" /> },
    { id: 'acoustic', label: 'Acústicos', icon: <Waves className="w-4 h-4" /> },
    { id: 'electric', label: 'Elétricos', icon: <Zap className="w-4 h-4" /> },
    { id: 'general', label: 'Gerais', icon: <Plus className="w-4 h-4" /> },
  ];

  const allComponents = Object.values(COMPONENT_REGISTRY).filter(
    (comp) => comp.type !== 'pressure_arrow'
  );

  const filteredComponents = allComponents.filter((comp) => {
    const matchesTab =
      activeTab === 'all' ||
      comp.category === activeTab ||
      (activeTab === 'general' && (comp.category === 'annotation' || comp.category === 'general'));
    const matchesSearch =
      comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.defaultLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleDragStart = (e: React.DragEvent, type: ComponentType) => {
    e.dataTransfer.setData('application/circuit-component', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <aside
      id="components-sidebar"
      className={`fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] border-r border-[#e5e5e5] bg-white flex flex-col h-full shadow-2xl transition-transform duration-200 lg:static lg:w-72 lg:shadow-none lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } select-none shrink-0`}
    >
      {/* Cabeçalho da Barra Lateral */}
      <div className="p-3 border-b border-[#e5e5e5] bg-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-[#999] uppercase tracking-wider">
              Componentes ({filteredComponents.length})
            </span>
          </div>
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

        {/* Campo de Busca */}
        <div className="relative mb-2">
          <Search className="w-3.5 h-3.5 text-[#999] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            id="symbol-search-input"
            type="text"
            placeholder="Buscar componentes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 bg-[#f5f5f5] text-xs border border-transparent focus:border-black focus:bg-white outline-none rounded transition-colors placeholder:text-[#999] text-[#1a1a1a]"
          />
        </div>

        {/* Abas de Categoria (Segmented Style) */}
        <div className="grid grid-cols-4 gap-0.5 p-0.5 bg-[#f0f0f0] rounded border border-[#e5e5e5]">
          {categories.map((cat) => {
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                id={`tab-${cat.id}`}
                onClick={() => setActiveTab(cat.id)}
                className={`flex items-center justify-center py-1 text-[11px] font-medium rounded transition-all ${
                  isActive
                    ? 'bg-white text-[#1a1a1a] shadow-2xs font-semibold'
                    : 'text-[#666] hover:text-black'
                }`}
                title={cat.label}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grade de Caixas dos Componentes */}
      <div className="flex-1 overflow-y-auto p-2.5">
        <div className="grid grid-cols-2 gap-2">
          {filteredComponents.map((item) => {
            // Instância virtual para renderizar thumbnail
            const previewComp = {
              id: `preview-${item.type}`,
              type: item.type,
              x: 0,
              y: 0,
              width: item.defaultWidth,
              height: item.defaultHeight,
              rotation: 0 as const,
              label: '',
            };

            return (
              <div
                key={item.type}
                id={`palette-item-${item.type}`}
                draggable
                onDragStart={(e) => handleDragStart(e, item.type)}
                onClick={() => onAddComponent(item.type)}
                title={`${item.name}${item.unit ? ` (${item.unit})` : ''}\nArraste para o canvas ou clique para adicionar`}
                className="group relative flex flex-col items-center justify-between p-2 rounded-lg border border-[#e2e8f0] bg-white hover:border-black hover:shadow-xs cursor-grab active:cursor-grabbing transition-all select-none text-center"
              >
                {/* Botão de Adição Rápida no canto superior direito */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddComponent(item.type);
                  }}
                  title="Adicionar ao canvas"
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 rounded text-[#666] hover:text-black hover:bg-[#f1f5f9] transition-opacity z-10"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>

                {/* Caixa Thumbnail SVG do componente */}
                <div className="w-full h-15 flex items-center justify-center bg-[#f8fafc] rounded border border-[#f1f5f9] group-hover:border-[#e2e8f0] group-hover:bg-[#fafafa] overflow-hidden p-1 transition-colors">
                  <svg
                    viewBox={`-5 -5 ${item.defaultWidth + 10} ${item.defaultHeight + 10}`}
                    className="max-h-full max-w-full drop-shadow-2xs"
                  >
                    <ComponentSymbol
                      component={previewComp}
                      strokeWidth={1.5}
                      strokeColor="#171717"
                    />
                  </svg>
                </div>

                {/* Identificação completa com unidade física e sem subtexto */}
                <div className="w-full mt-1.5 flex flex-col items-center">
                  <div className="flex flex-wrap items-baseline justify-center gap-1 w-full px-0.5">
                    <span className="font-semibold text-xs text-[#1a1a1a] leading-tight text-center">
                      {item.name}
                    </span>
                    {item.unit && (
                      <span className="font-mono text-[10.5px] text-[#475569] shrink-0 font-medium">
                        ({item.unit})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredComponents.length === 0 && (
          <div className="py-8 text-center text-xs text-[#999]">
            Nenhum componente encontrado.
          </div>
        )}
      </div>
    </aside>
  );
};
