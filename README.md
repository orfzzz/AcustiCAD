# AcustiCAD

Editor de diagramas para **analogias acústico-elétricas**, feito para ajudar nos estudos e na produção de figuras para relatórios e trabalhos acadêmicos.

> ⚠️ **Aviso:** este projeto foi inteiramente **vibecoded** (desenvolvido com auxílio intensivo de IA, sem revisão profunda linha a linha do código). Funciona bem para o propósito de uso pessoal e acadêmico, mas **não deve ser tratado como software de produção**: pode conter bugs, código redundante ou práticas não convencionais. Use por sua conta, principalmente se for adaptar ou expandir o código.

## O que ele faz

O AcustiCAD é um editor visual (canvas SVG interativo) para montar diagramas de circuitos elétricos e suas analogias acústicas — pensado para quem estuda a **Analogia Eletroacústica** (correspondência entre grandezas elétricas e acústicas: tensão↔pressão, corrente↔vazão, resistência/indutância/capacitância↔seus análogos acústicos).

### Principais funcionalidades

- **Componentes prontos**: resistores, indutores, capacitores, nós, terras (ground), entre outros, com símbolos desenhados em SVG.
- **Rótulos com notação matemática**: suporte a subscritos, símbolos gregos (ω, ρ, Δ) e atalhos rápidos para montar expressões como `1/jωC_a`.
- **Edição individual e em lote**: ajuste de tamanho de fonte, orientação (rotação em 90°), posição do rótulo (acima, abaixo, esquerda, direita, centro) — tanto por componente quanto para múltiplos selecionados de uma vez.
- **Fios e conexões**: desenho interativo de fios entre terminais dos componentes, com detecção automática de junções.
- **Grade e snap**: alinhamento automático a uma grade configurável, para manter os diagramas organizados.
- **Setas de indicação**: marcação de fluxo (Q/I) e queda de pressão/tensão (P/V) sobre os componentes.
- **Copiar/colar, desfazer/refazer**: fluxo de edição parecido com o de outros editores gráficos (Ctrl+C, Ctrl+V, Ctrl+Z).
- **Exportação**: PNG, SVG, JSON (para salvar/reabrir o diagrama depois) e HTML único (aplicativo standalone).
- **Área de exportação recortada**: possibilidade de demarcar manualmente a área do diagrama que será exportada, por dois cliques no canvas.

## Para que serve

Este projeto **não pretende ser uma ferramenta profissional de CAD** — é um auxiliar simples para:

- Montar rapidamente diagramas de circuitos acústicos/elétricos durante o estudo da disciplina.
- Gerar figuras limpas para incluir em relatórios, listas de exercícios ou trabalhos acadêmicos, sem precisar desenhar à mão ou depender de ferramentas mais complexas (como LaTeX/TikZ ou softwares pagos de CAD).

## Tecnologias

- React + TypeScript
- Vite
- Tailwind CSS
- SVG nativo para renderização do canvas (sem bibliotecas externas de diagramação)

## Como rodar localmente

```bash
npm install
npm run dev
```

## Licença / Uso

Projeto pessoal, sem garantias. Sinta-se livre para usar, adaptar ou estudar o código, mas lembre-se do aviso acima sobre a origem "vibecoded" do projeto.