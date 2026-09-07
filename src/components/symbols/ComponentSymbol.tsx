import React from 'react';
import { ComponentInstance } from '../../types';
import { SvgMathText } from '../../utils/mathRenderer';

interface ComponentSymbolProps {
  component: ComponentInstance;
  isSelected?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
  showPorts?: boolean;
  activePortId?: string | null;
  onPortMouseDown?: (portId: string, e: React.MouseEvent) => void;
  onPortMouseEnter?: (portId: string) => void;
  onPortMouseLeave?: (portId: string) => void;
  onLabelMouseDown?: (e: React.MouseEvent) => void;
}

export const ComponentSymbol: React.FC<ComponentSymbolProps> = ({
  component,
  isSelected = false,
  strokeColor = '#111827',
  strokeWidth = 1.6,
  showPorts = false,
  activePortId = null,
  onPortMouseDown,
  onPortMouseEnter,
  onPortMouseLeave,
  onLabelMouseDown,
}) => {
  const { type, width, height, rotation, label, sublabel, showFlowArrow, flowLabel, showPressureArrow, pressureLabel } = component;
  const hatchId = `hatch-${component.id}`;

  // Terminais (dependem do tipo)
  const renderPorts = () => {
    if (!showPorts && !isSelected) return null;

    // Coordenadas das portas relativas ao centro de rotação ou locais
    let portsList: Array<{ id: string; x: number; y: number }> = [];

    switch (type) {
      case 'acoustic_mass':
      case 'acoustic_compliance':
      case 'acoustic_resistance':
      case 'pressure_source':
      case 'capacitor':
      case 'voltage_source':
      case 'current_source':
      case 'generic_impedance':
      case 'inductor':
      case 'resistor_box':
      case 'resistor_zigzag':
        portsList = [
          { id: 'p1', x: 20, y: 0 },
          { id: 'p2', x: 20, y: 80 },
        ];
        break;
      case 'ground':
        portsList = [{ id: 'gnd', x: 20, y: 0 }];
        break;
      case 'node':
        portsList = [{ id: 'center', x: 10, y: 10 }];
        break;
      case 'wire_segment':
        portsList = [
          { id: 'start', x: 0, y: 10 },
          { id: 'end', x: width, y: 10 },
        ];
        break;
      default:
        portsList = [];
    }

    return (
      <g className="component-ports">
        {portsList.map((p) => {
          const isActive = activePortId === p.id;
          return (
            <g
              key={p.id}
              className="cursor-crosshair"
              onMouseDown={(e) => {
                e.stopPropagation();
                onPortMouseDown?.(p.id, e);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                if (e.touches.length === 1) {
                  const t = e.touches[0];
                  const fakeEvent = {
                    clientX: t.clientX,
                    clientY: t.clientY,
                    button: 0,
                    stopPropagation: () => e.stopPropagation(),
                    preventDefault: () => e.preventDefault(),
                  } as unknown as React.MouseEvent;
                  onPortMouseDown?.(p.id, fakeEvent);
                }
              }}
              onMouseEnter={() => onPortMouseEnter?.(p.id)}
              onMouseLeave={() => onPortMouseLeave?.(p.id)}
            >
              {/* Área de clique/toque generosa na porta para facilitar no mouse e mobile */}
              <circle cx={p.x} cy={p.y} r={12} fill="transparent" />
              {/* Ponto visível */}
              <circle
                cx={p.x}
                cy={p.y}
                r={isActive ? 4.5 : 3}
                fill={isActive ? '#dc2626' : '#2563eb'}
                stroke="#ffffff"
                strokeWidth={1.5}
                className="transition-transform"
              />
            </g>
          );
        })}
      </g>
    );
  };

  const renderShape = () => {
    switch (type) {
      // 1. MASSA ACÚSTICA - Cilindro vertical com terminais tangenciais
      case 'acoustic_mass':
        return (
          <g>
            {/* Máscara branca para o corpo do cilindro desenhada PRIMEIRO para não cobrir as bordas */}
            <rect x="10" y="24" width="20" height="32" fill="#ffffff" stroke="none" />

            {/* Linha guia superior ligando o terminal (x=20) à tangente direita (x=30) */}
            <path
              d="M 20 0 L 30 0 L 30 24"
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="square"
            />

            {/* Linhas verticais laterais do cilindro com espessura integral */}
            <line
              x1="10"
              y1="24"
              x2="10"
              y2="56"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="square"
            />
            <line
              x1="30"
              y1="24"
              x2="30"
              y2="56"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="square"
            />

            {/* Linha guia inferior ligando a tangente esquerda (x=10) ao terminal (x=20) */}
            <path
              d="M 10 56 L 10 80 L 20 80"
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="square"
            />

            {/* Elipse superior completa (borda do cilindro) */}
            <ellipse
              cx="20"
              cy="24"
              rx="10"
              ry="4.5"
              fill="#ffffff"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />

            {/* Elipse inferior completa */}
            <ellipse
              cx="20"
              cy="56"
              rx="10"
              ry="4.5"
              fill="#ffffff"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          </g>
        );

      // 2. COMPLIÂNCIA ACÚSTICA (Ca) - Caixa/cavidade acústica quadrada com abertura/gap superior (Figura 4.5 d da apostila)
      case 'acoustic_compliance':
        return (
          <g>
            {/* Terminal superior de entrada na cavidade (x=20) */}
            <line
              x1="20"
              y1="0"
              x2="20"
              y2="25"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="square"
            />

            {/* Máscara interna quadrada (30x30) de preenchimento para cobrir o fundo */}
            <polygon
              points="5,25 5,55 35,55 35,25"
              fill="#ffffff"
              stroke="none"
            />

            {/* Caixa aberta da compliância estritamente quadrada (30x30, com gap no teto entre x=13 e x=20) */}
            <path
              d="M 13 25 H 5 V 55 H 35 V 25 H 20"
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="square"
              strokeLinejoin="miter"
            />

            {/* Terminal inferior (x=20) */}
            <line
              x1="20"
              y1="55"
              x2="20"
              y2="80"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="square"
            />
          </g>
        );

      // 3. RESISTÊNCIA ACÚSTICA (Ra) - Caixa estritamente quadrada com hachura diagonal (Figura 4.5 g da apostila)
      case 'acoustic_resistance':
        return (
          <g>
            <defs>
              <pattern
                id={hatchId}
                width="6"
                height="6"
                patternTransform="rotate(45 0 0)"
                patternUnits="userSpaceOnUse"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="6"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth * 0.8}
                />
              </pattern>
            </defs>

            {/* Terminal superior (x=20) */}
            <line
              x1="20"
              y1="0"
              x2="20"
              y2="25"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="square"
            />

            {/* Fundo branco quadrado (30x30) para cobrir o grid */}
            <rect x="5" y="25" width="30" height="30" fill="#ffffff" stroke="none" />

            {/* Caixa estritamente quadrada (30x30) com hachura diagonal */}
            <rect
              x="5"
              y="25"
              width="30"
              height="30"
              fill={`url(#${hatchId})`}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="miter"
            />

            {/* Terminal inferior (x=20) */}
            <line
              x1="20"
              y1="55"
              x2="20"
              y2="80"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="square"
            />
          </g>
        );

      // 4. FONTE DE PRESSÃO (Pin) - Círculo com onda senoidal
      case 'pressure_source':
        return (
          <g>
            <line x1="20" y1="0" x2="20" y2="22" stroke={strokeColor} strokeWidth={strokeWidth} />
            <circle
              cx="20"
              cy="40"
              r="18"
              fill="#ffffff"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* Onda senoidal suave dentro */}
            <path
              d="M 11 40 C 14 30, 17 30, 20 40 C 23 50, 26 50, 29 40"
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            <line x1="20" y1="58" x2="20" y2="80" stroke={strokeColor} strokeWidth={strokeWidth} />
          </g>
        );

      // 5. INDUTOR ELÉTRICO (L) - Bobina em espiras (Figura 4.5 b, f)
      case 'inductor':
        return (
          <g>
            <line x1="20" y1="0" x2="20" y2="20" stroke={strokeColor} strokeWidth={strokeWidth} />
            {/* 4 espiras centralizadas */}
            <path
              d="
                M 20 20 
                C 33 20, 33 30, 20 30
                C 33 30, 33 40, 20 40
                C 33 40, 33 50, 20 50
                C 33 50, 33 60, 20 60
              "
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            <line x1="20" y1="60" x2="20" y2="80" stroke={strokeColor} strokeWidth={strokeWidth} />
          </g>
        );

      // 6. CAPACITOR ELÉTRICO (C) - Duas placas paralelas (Figura 4.5 c, e)
      case 'capacitor':
        return (
          <g>
            <line x1="20" y1="0" x2="20" y2="36" stroke={strokeColor} strokeWidth={strokeWidth} />
            {/* Placa superior */}
            <line x1="4" y1="36" x2="36" y2="36" stroke={strokeColor} strokeWidth={strokeWidth * 1.25} />
            {/* Placa inferior */}
            <line x1="4" y1="44" x2="36" y2="44" stroke={strokeColor} strokeWidth={strokeWidth * 1.25} />
            <line x1="20" y1="44" x2="20" y2="80" stroke={strokeColor} strokeWidth={strokeWidth} />
          </g>
        );

      // 7. RESISTOR ZIG-ZAG (R) - Norma IEEE/US (Figura 4.5 h, i)
      case 'resistor_zigzag':
        return (
          <g>
            <line x1="20" y1="0" x2="20" y2="20" stroke={strokeColor} strokeWidth={strokeWidth} />
            <path
              d="
                M 20 20
                L 30 24
                L 10 31
                L 30 38
                L 10 45
                L 30 52
                L 10 57
                L 20 60
              "
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="miter"
              strokeLinecap="square"
            />
            <line x1="20" y1="60" x2="20" y2="80" stroke={strokeColor} strokeWidth={strokeWidth} />
          </g>
        );

      // 8. RESISTOR BOX (R) - Norma IEC/Europeia
      case 'resistor_box':
        return (
          <g>
            <line x1="20" y1="0" x2="20" y2="22" stroke={strokeColor} strokeWidth={strokeWidth} />
            <rect
              x="9"
              y="22"
              width="22"
              height="36"
              fill="#ffffff"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <line x1="20" y1="58" x2="20" y2="80" stroke={strokeColor} strokeWidth={strokeWidth} />
          </g>
        );

      // 9. FONTE DE TENSÃO AC (Vin)
      case 'voltage_source':
        return (
          <g>
            <line x1="20" y1="0" x2="20" y2="22" stroke={strokeColor} strokeWidth={strokeWidth} />
            <circle
              cx="20"
              cy="40"
              r="18"
              fill="#ffffff"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <path
              d="M 11 40 C 14 31, 17 31, 20 40 C 23 49, 26 49, 29 40"
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            <line x1="20" y1="58" x2="20" y2="80" stroke={strokeColor} strokeWidth={strokeWidth} />
          </g>
        );

      // 10. FONTE DE CORRENTE AC (Iin)
      case 'current_source':
        return (
          <g>
            <line x1="20" y1="0" x2="20" y2="22" stroke={strokeColor} strokeWidth={strokeWidth} />
            <circle
              cx="20"
              cy="40"
              r="18"
              fill="#ffffff"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* Seta indicando direção */}
            <line x1="20" y1="28" x2="20" y2="50" stroke={strokeColor} strokeWidth={strokeWidth} />
            <polygon
              points="16,44 20,51 24,44"
              fill={strokeColor}
            />
            <line x1="20" y1="58" x2="20" y2="80" stroke={strokeColor} strokeWidth={strokeWidth} />
          </g>
        );

      // 11. NÓ / TERMINAL (P0, P1, etc.) - Ponto preenchido para marcar nós
      case 'node':
        return (
          <g>
            {/* Ponto sólido preenchido preto para nós e junções */}
            <circle cx="10" cy="10" r="4.5" fill={strokeColor} />
            {/* Área invisível expandida para facilitar clique e seleção */}
            <circle cx="10" cy="10" r="10" fill="none" stroke="transparent" />
          </g>
        );

      // 12. SEGMENTO DE FIO
      case 'wire_segment':
        return (
          <g>
            <line x1="0" y1="10" x2={width} y2="10" stroke={strokeColor} strokeWidth={strokeWidth} />
          </g>
        );

      // 13. TERRA / REFERÊNCIA
      case 'ground':
        return (
          <g>
            <line x1="20" y1="0" x2="20" y2="16" stroke={strokeColor} strokeWidth={strokeWidth} />
            {/* Três barras decrescentes centralizadas em x=20 */}
            <line x1="6" y1="16" x2="34" y2="16" stroke={strokeColor} strokeWidth={strokeWidth} />
            <line x1="11" y1="22" x2="29" y2="22" stroke={strokeColor} strokeWidth={strokeWidth} />
            <line x1="16" y1="28" x2="24" y2="28" stroke={strokeColor} strokeWidth={strokeWidth} />
          </g>
        );

      // 14. IMPEDÂNCIA GENÉRICA (Za)
      case 'generic_impedance':
        return (
          <g>
            <line x1="20" y1="0" x2="20" y2="20" stroke={strokeColor} strokeWidth={strokeWidth} />
            <rect
              x="6"
              y="20"
              width="28"
              height="40"
              fill="#ffffff"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <line x1="20" y1="60" x2="20" y2="80" stroke={strokeColor} strokeWidth={strokeWidth} />
          </g>
        );

      // 15. SETA INDICADORA (Unificada para P, Q, I, V, etc.)
      case 'flow_arrow':
      case 'pressure_arrow':
        return (
          <g>
            <line x1="12" y1="4" x2="12" y2="38" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
            <polygon points="7,32 12,44 17,32" fill={strokeColor} />
          </g>
        );

      // 17. TEXTO LIVRE
      case 'text_annotation':
        return null;

      default:
        return null;
    }
  };

  // Renderização do rótulo e sub-rótulo
  const renderLabels = () => {
    if (!label && !sublabel && type !== 'text_annotation') return null;

    if (type === 'text_annotation') {
      return (
        <SvgMathText
          text={label || 'Texto'}
          x={4}
          y={15}
          fontSize={component.fontSize || 18}
          fill={strokeColor}
          textAnchor="start"
        />
      );
    }

    // Posição de texto configurável (acima, abaixo, esquerda, direita, centro ou deslocamento livre)
    const pos = component.labelPosition || (
      type === 'node' ? 'top' :
      type === 'ground' ? 'bottom' :
      'right'
    );
    const offsetX = component.labelOffsetX || 0;
    const offsetY = component.labelOffsetY || 0;

    let baseX = width + 8;
    let baseY = height / 2;
    let textAnchor: 'start' | 'middle' | 'end' = 'start';

    switch (pos) {
      case 'top':
        baseX = width / 2;
        baseY = -12;
        textAnchor = 'middle';
        break;
      case 'bottom':
        baseX = width / 2;
        baseY = height + 16;
        textAnchor = 'middle';
        break;
      case 'left':
        baseX = -8;
        baseY = height / 2;
        textAnchor = 'end';
        break;
      case 'center':
        baseX = width / 2;
        baseY = height / 2;
        textAnchor = 'middle';
        break;
      case 'right':
      default:
        if (type === 'node') {
          baseX = 10;
          baseY = -8;
          textAnchor = 'middle';
        } else if (type === 'ground') {
          baseX = width / 2;
          baseY = 38;
          textAnchor = 'middle';
        } else if (type === 'flow_arrow' || type === 'pressure_arrow') {
          baseX = 20;
          baseY = height / 2;
          textAnchor = 'start';
        } else {
          baseX = width + 8;
          baseY = height / 2;
          textAnchor = 'start';
        }
        break;
    }

    const finalX = baseX + offsetX;
    const finalY = baseY + offsetY;

    return (
      <g
        className={`component-labels select-none ${isSelected ? 'cursor-move pointer-events-auto' : 'pointer-events-none'}`}
        onMouseDown={(e) => {
          if (isSelected && onLabelMouseDown) {
            e.stopPropagation();
            onLabelMouseDown(e);
          }
        }}
      >
        {/* Caixa de destaque sutil quando o componente está selecionado para indicar que o rótulo é arrastável */}
        {isSelected && (
          <rect
            x={finalX - (textAnchor === 'middle' ? 28 : textAnchor === 'end' ? 56 : 2) - 4}
            y={finalY - 14}
            width={textAnchor === 'middle' ? 56 : textAnchor === 'end' ? 58 : 54}
            height={sublabel ? 36 : 22}
            fill="rgba(59, 130, 246, 0.04)"
            stroke="#93c5fd"
            strokeWidth={0.8}
            strokeDasharray="2 2"
            rx={2}
            className="cursor-move"
          />
        )}

        {label && (
          <SvgMathText
            text={label}
            x={finalX}
            y={finalY}
            fontSize={component.labelFontSize || component.fontSize || 19}
            fill={strokeColor}
            textAnchor={textAnchor}
          />
        )}
        {sublabel && (
          <SvgMathText
            text={sublabel}
            x={finalX}
            y={finalY + 16}
            fontSize={Math.max(10, Math.round((component.labelFontSize || component.fontSize || 19) * 0.7))}
            fill="#4b5563"
            textAnchor={textAnchor}
          />
        )}
      </g>
    );
  };

  // Setas auxiliares de analogia (como nas figuras do livro!)
  const renderAnalogyArrows = () => {
    return (
      <g className="analogy-arrows select-none pointer-events-none">
        {showFlowArrow && (
          <g transform={`translate(-18, 0)`}>
            <line x1="6" y1="8" x2="6" y2="34" stroke="#1f2937" strokeWidth={1.2} />
            <polygon points="3.5,28 6,36 8.5,28" fill="#1f2937" />
            <SvgMathText
              text={flowLabel || 'Q'}
              x={-6}
              y={20}
              fontSize={14}
              fill="#1f2937"
              textAnchor="end"
            />
          </g>
        )}
        {showPressureArrow && (
          <g transform={`translate(${width + 12}, 0)`}>
            <line x1="8" y1="56" x2="8" y2="16" stroke="#1f2937" strokeWidth={1.2} />
            <polygon points="5.5,22 8,14 10.5,22" fill="#1f2937" />
            <SvgMathText
              text={pressureLabel || 'P'}
              x={16}
              y={34}
              fontSize={14}
              fill="#1f2937"
              textAnchor="start"
            />
          </g>
        )}
      </g>
    );
  };

  const cx = width / 2;
  const cy = height / 2;

  return (
    <g
      id={`comp-${component.id}`}
      transform={`translate(${component.x}, ${component.y}) rotate(${rotation}, ${cx}, ${cy})`}
      className={`component-group ${isSelected ? 'selected' : ''}`}
    >
      {/* Área de clique e arrasto principal do componente (cobre toda a extensão para facilitar seleção e movimentação) */}
      <rect
        x={-2}
        y={-2}
        width={width + 4}
        height={height + 4}
        fill="transparent"
        className="cursor-move"
      />

      {/* Caixa delimitadora de seleção sutil */}
      {isSelected && (
        <rect
          x={-4}
          y={-4}
          width={width + 8}
          height={height + 8}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={1}
          strokeDasharray="3 3"
          rx={2}
          className="pointer-events-none"
        />
      )}

      {/* Desenho do símbolo */}
      {renderShape()}

      {/* Setas de vazão/pressão (P/Q) acopladas se ativadas */}
      {renderAnalogyArrows()}

      {/* Rótulos matemáticos */}
      {/* Contrarrotaciona rótulo se desejado para que fique legível na horizontal */}
      {rotation !== 0 ? (
        <g transform={`rotate(${-rotation}, ${cx}, ${cy})`}>
          {renderLabels()}
        </g>
      ) : (
        renderLabels()
      )}

      {/* Portas interativas */}
      {renderPorts()}
    </g>
  );
};
