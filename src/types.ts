export type ComponentCategory = 'acoustic' | 'electric' | 'general' | 'annotation';

export type ComponentType =
  // Acústicos (Figura 4.5)
  | 'acoustic_mass'          // Massa acústica (Ma) - cilindro vertical
  | 'acoustic_compliance'    // Compliância acústica (Ca) - caixa/retângulo vazado
  | 'acoustic_resistance'    // Resistência acústica (Ra) - retângulo com hachura diagonal
  | 'pressure_source'        // Fonte de pressão (Pin) - círculo com onda senoidal
  
  // Elétricos padrão
  | 'inductor'               // Indutor - bobina em espiras/zig-zag
  | 'capacitor'              // Capacitor - placas paralelas
  | 'resistor_zigzag'        // Resistor padrão zig-zag
  | 'resistor_box'           // Resistor padrão europeu (retângulo)
  | 'voltage_source'         // Fonte de tensão AC
  | 'current_source'         // Fonte de corrente AC
  
  // Gerais
  | 'node'                   // Nó / Terminal
  | 'wire_segment'           // Fio reto
  | 'ground'                 // Terra / Referência
  | 'generic_impedance'      // Impedância genérica (retângulo vazado sem hachura)
  
  // Anotações e Indicadores
  | 'flow_arrow'             // Seta de vazão acústica (Q) ou corrente (I)
  | 'pressure_arrow'         // Seta de queda de pressão (P) ou tensão (V)
  | 'text_annotation';       // Texto com suporte a subscritos (ex: 1/j\omega C_a)

export interface PortDefinition {
  id: string;
  name: string;
  x: number; // offset relativo ao componente em pixels
  y: number;
  direction: 'top' | 'bottom' | 'left' | 'right' | 'any';
}

export interface ComponentMetadata {
  type: ComponentType;
  name: string;
  category: ComponentCategory;
  defaultLabel: string;
  defaultSublabel?: string;
  unit?: string; // unidade física ex: kg/m⁴, m⁵/N, Pa·s/m³, Pa, H, F, Ω, V, A. Omitido se adimensional
  defaultWidth: number;
  defaultHeight: number;
  description: string;
  ports: PortDefinition[];
}

export type LabelPosition = 'right' | 'top' | 'bottom' | 'left' | 'center';

export interface ComponentInstance {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: 0 | 90 | 180 | 270;
  label: string;
  sublabel?: string;
  labelPosition?: LabelPosition;
  labelOffsetX?: number;
  labelOffsetY?: number;
  showFlowArrow?: boolean;    // Seta Q / I
  flowLabel?: string;
  showPressureArrow?: boolean; // Seta P / V
  pressureLabel?: string;
  customColor?: string;
  fontSize?: number;
  labelFontSize?: number;
}

export interface WirePoint {
  x: number;
  y: number;
}

export interface WireConnection {
  id: string;
  fromComponentId?: string;
  fromPortId?: string;
  fromPoint: WirePoint;
  toComponentId?: string;
  toPortId?: string;
  toPoint: WirePoint;
  waypoints: WirePoint[]; // pontos intermediários para fios em L, ortogonais ou livres
  label?: string;
}

export interface DiagramData {
  version: number;
  title: string;
  components: ComponentInstance[];
  wires: WireConnection[];
  notes?: string;
}

export interface EditorSnapshot {
  components: ComponentInstance[];
  wires: WireConnection[];
}

export interface ExportArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ActiveTool = 'select' | 'wire' | 'node' | 'pan' | 'text' | 'export_area';
