import React, { useState } from 'react';
import { ActiveTool } from '../types';
import {
  MousePointer,
  GitCommit,
  CircleDot,
  Hand,
  Crop,
  RotateCw,
  Trash2,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Download,
  Save,
  Grid,
  Magnet,
  FolderOpen,
  FileCode,
  Check,
  X,
  Copy,
  Clipboard,
  ChevronDown,
  MoreHorizontal,
} from 'lucide-react';

interface ToolbarProps {
  tool: ActiveTool;
  onSetTool: (tool: ActiveTool) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  canPaste?: boolean;
  onRotateSelected: () => void;
  onDeleteSelected: () => void;
  hasSelection: boolean;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  snapGrid: boolean;
  onToggleSnapGrid: () => void;
  showGrid: boolean;
  onToggleShowGrid: () => void;
  hasExportArea: boolean;
  onClearExportArea: () => void;
  onRequestDrawExportArea?: (format: 'png' | 'svg') => void;
  onExportPng: (scale: number, transparent: boolean) => void;
  onExportSvg: () => void;
  onExportJson: () => void;
  onImportJson: () => void;
  onExportSingleHtml: () => void;
  onClearDiagram: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  tool,
  onSetTool,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  canPaste = false,
  onRotateSelected,
  onDeleteSelected,
  hasSelection,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  snapGrid,
  onToggleSnapGrid,
  showGrid,
  onToggleShowGrid,
  hasExportArea,
  onClearExportArea,
  onRequestDrawExportArea,
  onExportPng,
  onExportSvg,
  onExportJson,
  onImportJson,
  onExportSingleHtml,
  onClearDiagram,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <header
      id="main-toolbar"
      className="h-14 bg-white border-b border-[#e5e5e5] px-2 sm:px-6 py-2 flex items-center justify-between gap-1.5 sm:gap-4 select-none z-50 shadow-xs text-[#1a1a1a] shrink-0 relative"
    >
      {/* Lado Esquerdo: Identidade do App e Ferramentas Principais */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
        <div className="flex items-center gap-1 sm:gap-2 mr-0.5 sm:mr-1 shrink-0">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-black flex items-center justify-center rounded-md text-white shadow-xs shrink-0">
            <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white rounded-full flex items-center justify-center">
              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full"></div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-0 sm:gap-1 leading-none whitespace-nowrap">
            <h1 className="font-bold text-xs sm:text-base tracking-tight text-[#1a1a1a] leading-tight">
              AcustiCAD
            </h1>
            <span className="font-normal text-[#666] text-[9px] sm:text-xs leading-tight">Early</span>
            {/*<span className="hidden xl:inline text-[11px] text-[#71717a] font-normal border-l border-[#e5e5e5] pl-2 ml-1 whitespace-nowrap">
              Diagramas Acústicos & Elétricos
            </span>*/}
          </div>
        </div>

        <div className="hidden sm:block h-6 w-px bg-[#e5e5e5]" />

        {/* Seletores de Ferramenta Principal */}
        <nav className="flex bg-[#f0f0f0] rounded-md p-0.5 border border-[#e5e5e5] shrink-0">
          <button
            id="tool-select-btn"
            onClick={() => onSetTool('select')}
            className={`p-1 sm:px-3 sm:py-1.5 rounded text-xs transition-colors flex items-center gap-1.5 ${
              tool === 'select'
                ? 'bg-white text-[#1a1a1a] shadow-xs font-semibold'
                : 'text-[#666] hover:text-black font-medium'
            }`}
            title="Selecionar e mover componentes (V)"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mover</span>
          </button>

          <button
            id="tool-wire-btn"
            onClick={() => onSetTool('wire')}
            className={`p-1 sm:px-3 sm:py-1.5 rounded text-xs transition-colors flex items-center gap-1.5 ${
              tool === 'wire'
                ? 'bg-white text-[#1a1a1a] shadow-xs font-semibold'
                : 'text-[#666] hover:text-black font-medium'
            }`}
            title="Conectar com Fio condutor (W)"
          >
            <GitCommit className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fio</span>
          </button>

          <button
            id="tool-node-btn"
            onClick={() => onSetTool('node')}
            className={`p-1 sm:px-3 sm:py-1.5 rounded text-xs transition-colors flex items-center gap-1.5 ${
              tool === 'node'
                ? 'bg-white text-[#1a1a1a] shadow-xs font-semibold'
                : 'text-[#666] hover:text-black font-medium'
            }`}
            title="Adicionar Nó / Ponto preenchido (N)"
          >
            <CircleDot className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nó</span>
          </button>

          <button
            id="tool-pan-btn"
            onClick={() => onSetTool('pan')}
            className={`p-1 sm:px-3 sm:py-1.5 rounded text-xs transition-colors flex items-center gap-1.5 ${
              tool === 'pan'
                ? 'bg-white text-[#1a1a1a] shadow-xs font-semibold'
                : 'text-[#666] hover:text-black font-medium'
            }`}
            title="Mover tela / Pan (H)"
          >
            <Hand className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mão</span>
          </button>
        </nav>

        {/*
        {hasExportArea && (
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 text-amber-900 px-2.5 py-1 rounded text-xs font-medium">
            <Crop className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden sm:inline">Área Ativa</span>
            <button
              id="clear-export-area-btn"
              onClick={onClearExportArea}
              title="Remover área selecionada e voltar a exportar o diagrama inteiro"
              className="p-0.5 rounded text-red-600 hover:bg-red-100 hover:text-red-800 transition-colors ml-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        TIREI ESSA PARTE Q ERA PRA CANCELAR O 'AREA ATIVA' NA TOOLBAR E MOVI PRO CANVAS*/}

        <div className="hidden sm:block h-6 w-px bg-[#e5e5e5]" />

        {/* Desfazer / Refazer */}
        <div className="hidden sm:flex border border-[#e5e5e5] rounded overflow-hidden">
          <button
            id="undo-btn"
            onClick={onUndo}
            disabled={!canUndo}
            title="Desfazer (Ctrl+Z)"
            className="px-2 py-1 bg-white hover:bg-[#f9f9f9] border-r border-[#e5e5e5] text-xs font-medium text-[#1a1a1a] disabled:opacity-40 disabled:hover:bg-white transition-colors flex items-center gap-1"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">Undo</span>
          </button>
          <button
            id="redo-btn"
            onClick={onRedo}
            disabled={!canRedo}
            title="Refazer (Ctrl+Y)"
            className="px-2 py-1 bg-white hover:bg-[#f9f9f9] text-xs font-medium text-[#1a1a1a] disabled:opacity-40 disabled:hover:bg-white transition-colors flex items-center gap-1"
          >
            <Redo2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">Redo</span>
          </button>
        </div>

        {/* Copiar / Colar na posição do mouse */}
        <div className="hidden md:flex border border-[#e5e5e5] rounded overflow-hidden">
          <button
            id="copy-btn"
            onClick={onCopy}
            disabled={!hasSelection}
            title="Copiar selecionados (Ctrl+C)"
            className="px-2 py-1 bg-white hover:bg-[#f9f9f9] border-r border-[#e5e5e5] text-xs font-medium text-[#1a1a1a] disabled:opacity-40 disabled:hover:bg-white transition-colors flex items-center gap-1"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">Copiar</span>
          </button>
          <button
            id="paste-btn"
            onClick={onPaste}
            disabled={!canPaste}
            title="Colar na posição do mouse (Ctrl+V)"
            className="px-2 py-1 bg-white hover:bg-[#f9f9f9] text-xs font-medium text-[#1a1a1a] disabled:opacity-40 disabled:hover:bg-white transition-colors flex items-center gap-1"
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">Colar</span>
          </button>
        </div>

        {/* Rotação e Exclusão rápida para itens selecionados */}
        {hasSelection && (
          <>
            <div className="h-5 w-px bg-[#e5e5e5]" />
            <div className="flex items-center space-x-1 animate-in fade-in duration-150">
              <button
                id="rotate-btn"
                onClick={onRotateSelected}
                title="Girar 90° sentido horário (R)"
                className="px-2 py-1 rounded text-[#1a1a1a] bg-white border border-[#e5e5e5] hover:bg-[#f5f5f5] transition-colors flex items-center gap-1 text-xs font-medium"
              >
                <RotateCw className="w-3.5 h-3.5 text-[#666]" />
                <span className="hidden lg:inline">Girar</span>
              </button>
              <button
                id="delete-btn"
                onClick={onDeleteSelected}
                title="Excluir selecionado (Delete)"
                className="px-2 py-1 rounded text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors flex items-center gap-1 text-xs font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Excluir</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Lado Direito: Zoom, Grade e Exportação */}
      <div className="flex items-center space-x-1.5 sm:space-x-2">
        {/* Controle de Snap e Grade */}
        <div className="hidden md:flex items-center border border-[#e5e5e5] rounded p-1 bg-white gap-1">
          <button
            id="snap-toggle-btn"
            onClick={onToggleSnapGrid}
            title={snapGrid ? 'Snap-to-grid ativado' : 'Snap-to-grid desativado'}
            className={`p-1 rounded text-xs transition-colors ${
              snapGrid
                ? 'bg-black text-white'
                : 'text-[#888] hover:text-black'
            }`}
          >
            <Magnet className="w-3.5 h-3.5" />
          </button>
          <button
            id="grid-toggle-btn"
            onClick={onToggleShowGrid}
            title={showGrid ? 'Ocultar grade' : 'Mostrar grade'}
            className={`p-1 rounded text-xs transition-colors ${
              showGrid
                ? 'bg-black text-white'
                : 'text-[#888] hover:text-black'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Controles de Zoom */}
        <div className="hidden md:flex items-center bg-white border border-[#e5e5e5] rounded p-0.5">
          <button
            id="zoom-out-btn"
            onClick={onZoomOut}
            title="Reduzir zoom"
            className="p-1 text-[#666] hover:text-black hover:bg-[#f5f5f5] rounded transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            id="reset-zoom-btn"
            onClick={onResetZoom}
            title="Resetar zoom para 100%"
            className="px-1.5 py-0.5 text-[11px] font-mono font-medium text-[#444] hover:bg-[#f5f5f5] rounded transition-colors"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            id="zoom-in-btn"
            onClick={onZoomIn}
            title="Aumentar zoom"
            className="p-1 text-[#666] hover:text-black hover:bg-[#f5f5f5] rounded transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Botão Salvar / Carregar Projeto Rápido */}
        <div className="hidden lg:flex items-center space-x-1">
          <button
            id="quick-save-project-btn"
            onClick={onExportJson}
            title="Salvar Projeto (.json) no computador para continuar depois"
            className="px-2.5 py-1 text-xs font-medium bg-white hover:bg-[#f5f5f5] text-[#1a1a1a] border border-[#e5e5e5] rounded flex items-center gap-1.5 transition-colors"
          >
            <Save className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden lg:inline">Salvar</span>
          </button>
          <button
            id="quick-open-project-btn"
            onClick={onImportJson}
            title="Abrir Projeto (.json) salvo anteriormente"
            className="px-2 py-1 text-xs font-medium bg-white hover:bg-[#f5f5f5] text-[#1a1a1a] border border-[#e5e5e5] rounded flex items-center gap-1 transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5 text-[#666]" />
            <span className="hidden xl:inline">Abrir</span>
          </button>
        </div>

        {/* Botão e Menu de Exportação (Desktop >= md) */}
        <div className="relative hidden md:flex items-center">
          <button
            id="export-main-btn"
            onClick={() => {
              if (hasExportArea) {
                onExportPng(3, false);
              } else {
                onRequestDrawExportArea?.('png');
              }
            }}
            className="px-3 py-1.5 text-xs font-bold bg-black hover:bg-[#262626] text-white rounded-l border-r border-[#333] shadow-xs flex items-center gap-1.5 transition-colors uppercase tracking-wide cursor-pointer"
            title={hasExportArea ? 'Exportar área demarcada em PNG 3x' : 'Desenhar área no circuito e exportar'}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{hasExportArea ? 'EXPORTAR ÁREA' : 'EXPORTAR'}</span>
          </button>
          <button
            id="export-dropdown-toggle-btn"
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="px-1.5 py-1.5 bg-black hover:bg-[#262626] text-white rounded-r shadow-xs flex items-center justify-center transition-colors cursor-pointer"
            title="Mais opções de exportação"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {showExportMenu && (
            <>
              {/* Overlay invisível para fechar ao clicar fora */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowExportMenu(false)}
              />
              <div
                className="absolute right-0 top-full mt-1.5 w-68 bg-white rounded-md shadow-xl border border-[#e5e5e5] py-1.5 z-50 animate-in fade-in slide-in-from-top-1 text-xs"
                onClick={() => setShowExportMenu(false)}
              >
              {hasExportArea && (
                <div className="px-3 py-2 bg-amber-50 border-b border-amber-200 text-[11px] text-amber-900 font-medium flex items-center justify-between mb-1">
                  <span>Área delimitada ativa</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearExportArea();
                    }}
                    className="text-red-600 hover:underline text-[10px] font-semibold"
                  >
                    Remover corte
                  </button>
                </div>
              )}

              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#999]">
                Desenhar Área & Exportar
              </div>
              <button
                id="export-draw-area-png-btn"
                onClick={() => {
                  setShowExportMenu(false);
                  onRequestDrawExportArea?.('png');
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-[#eff6ff] flex items-center gap-2.5 text-[#1d4ed8] font-semibold transition-colors"
              >
                <Crop className="w-4 h-4 text-[#2563eb]" />
                <span>Desenhar Área & Exportar PNG</span>
              </button>
              <button
                id="export-draw-area-svg-btn"
                onClick={() => {
                  setShowExportMenu(false);
                  onRequestDrawExportArea?.('svg');
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-[#eff6ff] flex items-center gap-2.5 text-[#1d4ed8] font-semibold transition-colors"
              >
                <Crop className="w-4 h-4 text-[#4f46e5]" />
                <span>Desenhar Área & Exportar SVG</span>
              </button>

              <div className="my-1.5 border-t border-[#e5e5e5]" />

              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#999]">
                Salvar & Dados
              </div>
              <button
                id="export-json-btn"
                onClick={onExportJson}
                className="w-full px-3 py-1.5 text-left hover:bg-[#f5f5f5] flex items-center gap-2.5 text-[#1a1a1a]"
              >
                <Download className="w-4 h-4 text-[#666]" />
                <span>Salvar Diagrama (.json)</span>
              </button>
              <button
                id="import-json-btn"
                onClick={onImportJson}
                className="w-full px-3 py-1.5 text-left hover:bg-[#f5f5f5] flex items-center gap-2.5 text-[#1a1a1a]"
              >
                <FolderOpen className="w-4 h-4 text-[#666]" />
                <span>Carregar Diagrama (.json)</span>
              </button>
              <button
                id="export-single-html-btn"
                onClick={onExportSingleHtml}
                className="w-full px-3 py-1.5 text-left hover:bg-[#f5f5f5] flex items-center gap-2.5 text-[#1a1a1a]"
              >
                <FileCode className="w-4 h-4 text-black" />
                <span>Baixar App HTML Único (.html)</span>
              </button>

              <div className="my-1.5 border-t border-[#e5e5e5]" />
              <button
                id="clear-diagram-btn"
                onClick={onClearDiagram}
                className="w-full px-3 py-1.5 text-left hover:bg-red-50 text-red-600 flex items-center gap-2.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Limpar Canvas Inteiro</span>
              </button>
            </div>
          </>
        )}
        </div>

        {/* Botão de Exportação Rápida no Mobile (< md) */}
        <button
          type="button"
          onClick={() => {
            if (hasExportArea) {
              onExportPng(3, false);
            } else {
              onRequestDrawExportArea?.('png');
            }
          }}
          className="md:hidden p-2 text-xs font-bold bg-black text-white rounded shadow-xs flex items-center justify-center transition-colors shrink-0"
          title="Exportar imagem"
        >
          <Download className="w-3.5 h-3.5" />
        </button>

        {/* Menu '...' Mais Opções no Mobile (< md) */}
        <div className="relative md:hidden flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className={`p-2 rounded border transition-colors flex items-center justify-center ${
              showMobileMenu
                ? 'bg-black text-white border-black'
                : 'bg-white text-[#1a1a1a] border-[#e5e5e5] hover:bg-[#f5f5f5]'
            }`}
            title="Mais opções e configurações"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {showMobileMenu && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/20"
                onClick={() => setShowMobileMenu(false)}
              />
              <div
                className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-lg shadow-xl border border-[#e5e5e5] py-2 z-50 text-xs text-[#1a1a1a] animate-in fade-in"
                onClick={() => setShowMobileMenu(false)}
              >
                {/* Ações Rápidas */}
                <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#999]">
                  Ações
                </div>
                <div className="grid grid-cols-2 gap-1.5 px-3 py-1">
                  <button
                    type="button"
                    disabled={!canUndo}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUndo();
                    }}
                    className="flex items-center justify-center gap-1.5 py-1.5 border border-[#e5e5e5] rounded bg-white hover:bg-[#f5f5f5] disabled:opacity-40"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>Desfazer</span>
                  </button>
                  <button
                    type="button"
                    disabled={!canRedo}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRedo();
                    }}
                    className="flex items-center justify-center gap-1.5 py-1.5 border border-[#e5e5e5] rounded bg-white hover:bg-[#f5f5f5] disabled:opacity-40"
                  >
                    <Redo2 className="w-3.5 h-3.5" />
                    <span>Refazer</span>
                  </button>
                </div>

                <div className="my-1 border-t border-[#f0f0f0]" />

                {/* Visualização & Grade */}
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#999]">
                  Visualização & Grade
                </div>
                <div className="px-3 py-1.5 flex items-center justify-between">
                  <span>Snap à Grade</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSnapGrid();
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      snapGrid ? 'bg-black text-white' : 'bg-[#f0f0f0] text-[#666]'
                    }`}
                  >
                    {snapGrid ? 'Ativo' : 'Desligado'}
                  </button>
                </div>
                <div className="px-3 py-1.5 flex items-center justify-between">
                  <span>Grade de Fundo</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleShowGrid();
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      showGrid ? 'bg-black text-white' : 'bg-[#f0f0f0] text-[#666]'
                    }`}
                  >
                    {showGrid ? 'Visível' : 'Oculta'}
                  </button>
                </div>
                <div className="px-3 py-1.5 flex items-center justify-between border-b border-[#f0f0f0] pb-2">
                  <span>Zoom ({Math.round(zoom * 100)}%)</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onZoomOut();
                      }}
                      className="p-1 border border-[#e5e5e5] rounded hover:bg-[#f5f5f5]"
                    >
                      <ZoomOut className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onResetZoom();
                      }}
                      className="px-1.5 py-0.5 text-[10px] border border-[#e5e5e5] rounded hover:bg-[#f5f5f5]"
                    >
                      100%
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onZoomIn();
                      }}
                      className="p-1 border border-[#e5e5e5] rounded hover:bg-[#f5f5f5]"
                    >
                      <ZoomIn className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Desenhar Área & Exportar */}
                <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#999]">
                  Desenhar Área & Exportar
                </div>
                <button
                  type="button"
                  onClick={() => onRequestDrawExportArea?.('png')}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#eff6ff] flex items-center gap-2 text-blue-600 font-medium"
                >
                  <Crop className="w-3.5 h-3.5 text-[#2563eb]" />
                  <span>Desenhar Área & Exportar PNG</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRequestDrawExportArea?.('svg')}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#eff6ff] flex items-center gap-2 text-blue-600 font-medium"
                >
                  <Crop className="w-3.5 h-3.5 text-[#4f46e5]" />
                  <span>Desenhar Área & Exportar SVG</span>
                </button>

                <div className="my-1.5 border-t border-[#f0f0f0]" />

                {/* Salvar & Dados */}
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#999]">
                  Salvar & Dados
                </div>
                <button
                  type="button"
                  onClick={onExportJson}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#f5f5f5] flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5 text-[#666]" />
                  <span>Salvar Diagrama (.json)</span>
                </button>
                <button
                  type="button"
                  onClick={onImportJson}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#f5f5f5] flex items-center gap-2"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-[#666]" />
                  <span>Carregar Diagrama (.json)</span>
                </button>
                <button
                  type="button"
                  onClick={onExportSingleHtml}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#f5f5f5] flex items-center gap-2"
                >
                  <FileCode className="w-3.5 h-3.5 text-black" />
                  <span>Baixar App HTML Único (.html)</span>
                </button>

                <div className="my-1.5 border-t border-[#f0f0f0]" />
                <button
                  type="button"
                  onClick={onClearDiagram}
                  className="w-full px-3 py-1.5 text-left hover:bg-red-50 text-red-600 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpar Canvas</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

