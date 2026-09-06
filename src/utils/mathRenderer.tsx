import React from 'react';

// Substituições comuns de símbolos gregos e operadores LaTeX
const SYMBOL_MAP: Record<string, string> = {
  '\\omega': 'ω',
  '\\Omega': 'Ω',
  '\\rho': 'ρ',
  '\\Delta': 'Δ',
  '\\delta': 'δ',
  '\\pi': 'π',
  '\\theta': 'θ',
  '\\lambda': 'λ',
  '\\cdot': '·',
  '\\approx': '≈',
  '\\infty': '∞',
  '\\pm': '±',
};

export interface FormattedToken {
  text: string;
  type: 'regular' | 'sub' | 'sup';
  italic?: boolean;
}

export function parseMathTokens(raw: string): FormattedToken[] {
  if (!raw) return [];

  // Substitui comandos LaTeX básicos
  let processed = raw;
  for (const [tex, char] of Object.entries(SYMBOL_MAP)) {
    processed = processed.replaceAll(tex, char);
  }

  const tokens: FormattedToken[] = [];
  let i = 0;

  while (i < processed.length) {
    const char = processed[i];

    if (char === '_') {
      // Subscrito
      i++;
      if (i < processed.length && processed[i] === '{') {
        const closeIdx = processed.indexOf('}', i);
        if (closeIdx !== -1) {
          tokens.push({
            text: processed.slice(i + 1, closeIdx),
            type: 'sub',
            italic: false,
          });
          i = closeIdx + 1;
        } else {
          tokens.push({ text: processed.slice(i + 1), type: 'sub', italic: false });
          break;
        }
      } else if (i < processed.length) {
        tokens.push({ text: processed[i], type: 'sub', italic: false });
        i++;
      }
    } else if (char === '^') {
      // Sobrescrito
      i++;
      if (i < processed.length && processed[i] === '{') {
        const closeIdx = processed.indexOf('}', i);
        if (closeIdx !== -1) {
          tokens.push({
            text: processed.slice(i + 1, closeIdx),
            type: 'sup',
            italic: false,
          });
          i = closeIdx + 1;
        } else {
          tokens.push({ text: processed.slice(i + 1), type: 'sup', italic: false });
          break;
        }
      } else if (i < processed.length) {
        tokens.push({ text: processed[i], type: 'sup', italic: false });
        i++;
      }
    } else {
      // Caractere normal
      // Letras isoladas ou sequências
      const isLetter = /[a-zA-Z]/.test(char);
      tokens.push({
        text: char,
        type: 'regular',
        italic: isLetter,
      });
      i++;
    }
  }

  // Agrupa tokens regulares consecutivos com o mesmo estilo
  const merged: FormattedToken[] = [];
  for (const tok of tokens) {
    const last = merged[merged.length - 1];
    if (last && last.type === tok.type && last.italic === tok.italic) {
      last.text += tok.text;
    } else {
      merged.push({ ...tok });
    }
  }

  return merged;
}

interface SvgMathTextProps {
  text: string;
  x?: number;
  y?: number;
  fontSize?: number;
  fill?: string;
  textAnchor?: 'start' | 'middle' | 'end';
  className?: string;
  dominantBaseline?: string;
}

export const SvgMathText: React.FC<SvgMathTextProps> = ({
  text,
  x = 0,
  y = 0,
  fontSize = 15,
  fill = '#111827',
  textAnchor = 'start',
  className = '',
  dominantBaseline = 'central',
}) => {
  const tokens = parseMathTokens(text);

  return (
    <text
      x={x}
      y={y}
      fill={fill}
      textAnchor={textAnchor}
      dominantBaseline={dominantBaseline}
      fontFamily="'Crimson Pro', Georgia, 'Times New Roman', serif"
      fontSize={fontSize}
      className={`select-none ${className}`}
    >
      {tokens.map((token, idx) => {
        if (token.type === 'sub') {
          return (
            <tspan
              key={idx}
              dy={fontSize * 0.28}
              fontSize={fontSize * 0.72}
              fontStyle={token.italic ? 'italic' : 'normal'}
            >
              {token.text}
            </tspan>
          );
        }
        if (token.type === 'sup') {
          return (
            <tspan
              key={idx}
              dy={-fontSize * 0.35}
              fontSize={fontSize * 0.7}
              fontStyle={token.italic ? 'italic' : 'normal'}
            >
              {token.text}
            </tspan>
          );
        }
        // Retorna ao alinhamento base caso o token anterior tenha sido sub ou sup
        const prevWasShifted = idx > 0 && (tokens[idx - 1].type === 'sub' || tokens[idx - 1].type === 'sup');
        const dyReset = prevWasShifted
          ? tokens[idx - 1].type === 'sub'
            ? -fontSize * 0.28
            : fontSize * 0.35
          : undefined;

        return (
          <tspan
            key={idx}
            dy={dyReset}
            fontSize={fontSize}
            fontStyle={token.italic ? 'italic' : 'normal'}
          >
            {token.text}
          </tspan>
        );
      })}
    </text>
  );
};
