import React from 'react';
import { PRESET_DIAGRAMS, PresetDiagram } from '../data/presets';
import { X, Check, BookOpen, Layers } from 'lucide-react';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadPreset: (preset: PresetDiagram) => void;
}

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  onLoadPreset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded shadow-2xl border border-[#e5e5e5] max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Cabeçalho do Modal */}
        <div className="p-3.5 border-b border-[#e5e5e5] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-black text-white rounded flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1a1a1a]">
                Modelos e Exemplos da Apostila
              </h3>
              <p className="text-[11px] text-[#888]">
                Carregue circuitos pré-construídos para estudar ou editar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#888] hover:text-black hover:bg-[#f5f5f5] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lista de Modelos */}
        <div className="p-4 overflow-y-auto space-y-2.5">
          {PRESET_DIAGRAMS.map((preset) => (
            <div
              key={preset.id}
              className="p-3 border border-[#e5e5e5] hover:border-black rounded hover:shadow-2xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-[#1a1a1a]">
                    {preset.name}
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium bg-[#f5f5f5] text-[#555] border border-[#e5e5e5] rounded">
                    {preset.data.components.length} componentes
                  </span>
                </div>
                <p className="text-[11px] text-[#666] mt-0.5">
                  {preset.description}
                </p>
              </div>

              <button
                onClick={() => {
                  onLoadPreset(preset);
                  onClose();
                }}
                className="shrink-0 px-3 py-1.5 text-xs font-bold bg-black hover:bg-[#333] text-white rounded flex items-center gap-1.5 transition-colors uppercase tracking-wide"
              >
                <Check className="w-3.5 h-3.5" />
                Carregar
              </button>
            </div>
          ))}

          {/* Dica sobre a apostila */}
          <div className="p-3 bg-[#fdfdfd] border border-[#e5e5e5] rounded text-xs text-[#333] flex items-start gap-2.5">
            <Layers className="w-4 h-4 text-black shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[11px] block mb-0.5 text-[#1a1a1a]">
                Sobre as Analogias Acústicas:
              </span>
              <p className="text-[#666] text-[11px] leading-relaxed">
                Na <strong>Analogia Direta (M.D. / Impedância)</strong>, a pressão acústica $P$ equivale à tensão $V$, e a vazão $Q$ equivale à corrente $I$ ($M_a \leftrightarrow L$, $C_a \leftrightarrow C$, $R_a \leftrightarrow R$). Na <strong>Analogia Inversa (M.I. / Mobilidade)</strong>, a pressão equivale à corrente e a vazão à tensão.
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="p-3 border-t border-[#e5e5e5] bg-[#fafafa] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-[#1a1a1a] bg-white border border-[#e5e5e5] hover:bg-[#f5f5f5] rounded transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
