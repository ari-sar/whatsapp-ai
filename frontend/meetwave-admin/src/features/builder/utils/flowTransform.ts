import { Node, Edge } from '@xyflow/react';
import { FlowDetail, FlowStepInput } from '../../../api/flowsService';

export interface NodeData {
  type: string;
  label: string;
  prompt?: string;
  validation?: string;
  invalidMessage?: string;
  collectKey?: string;
  collectLabelKey?: string;
  buttonLabel?: string;
  sections?: any[];
  buttons?: any[];
  headerText?: string;
  footerText?: string;
  // check node:
  operator?: string;
  checkKey?: string;
  value?: string;
  values?: string[];
  pattern?: string;
  source?: string;
}

export const describeCondition = (c: any): string => {
  if (!c || typeof c !== 'object') return '';
  switch (c.type) {
    case 'input_eq':
      return `= ${c.value}`;
    case 'input_in':
      return `∈ ${(c.values ?? []).join(', ')}`;
    case 'collected_eq':
      return `${c.key}=${c.value}`;
    case 'check_pass':
      return 'pass';
    case 'check_fail':
      return 'fail';
    default:
      return JSON.stringify(c);
  }
};

export const flowToNodes = (flow: FlowDetail): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = flow.steps.map((s) => ({
    id: s.stepId,
    type: s.type,
    position: { x: s.positionX, y: s.positionY },
    data: {
      type: s.type,
      label: (s.config?.label as string) ?? s.stepId,
      prompt: s.config?.prompt,
      validation: s.config?.validation,
      invalidMessage: s.config?.invalidMessage,
      collectKey: s.config?.collectKey,
      collectLabelKey: s.config?.collectLabelKey,
      buttonLabel: s.config?.buttonLabel,
      sections: s.config?.sections,
      buttons: s.config?.buttons,
      headerText: s.config?.headerText,
      footerText: s.config?.footerText,
      operator: s.config?.operator,
      checkKey: s.config?.checkKey,
      value: s.config?.value,
      values: s.config?.values,
      pattern: s.config?.pattern,
      source: s.config?.source,
    },
  }));

  const edges: Edge[] = [];
  flow.steps.forEach((s) => {
    (s.transitions ?? []).forEach((t, i) => {
      edges.push({
        id: `${s.stepId}__${t.to}__${i}`,
        source: s.stepId,
        target: t.to,
        label: t.condition ? describeCondition(t.condition) : undefined,
        data: t.condition ? { condition: t.condition } : undefined,
      });
    });
  });

  return { nodes, edges };
};

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  initialStepId: string | null;
  steps: FlowStepInput[];
}

export const nodesToSteps = (nodes: Node[], edges: Edge[]): ValidationResult => {
  const errors: string[] = [];
  if (nodes.length === 0) {
    return { valid: false, errors: ['Flow must have at least one step'], initialStepId: null, steps: [] };
  }

  const startNodes = nodes.filter((n) => (n.data as any)?.type === 'start' || n.type === 'start');
  let initialStepId: string | null = null;
  if (startNodes.length === 1) {
    initialStepId = startNodes[0].id;
  } else if (startNodes.length === 0) {
    initialStepId = nodes[0].id;
  } else {
    errors.push('Flow can only have one start node');
  }

  const steps: FlowStepInput[] = nodes.map((n) => {
    const d = (n.data ?? {}) as NodeData;
    const outgoing = edges
      .filter((e) => e.source === n.id)
      .map((e) => ({
        to: e.target,
        condition: (e.data as any)?.condition,
      }));

    const cfg: Record<string, any> = {
      label: d.label,
    };
    if (d.prompt !== undefined) cfg.prompt = d.prompt;
    if (d.validation) cfg.validation = d.validation;
    if (d.invalidMessage) cfg.invalidMessage = d.invalidMessage;
    if (d.collectKey) cfg.collectKey = d.collectKey;
    if (d.collectLabelKey) cfg.collectLabelKey = d.collectLabelKey;
    if (d.buttonLabel) cfg.buttonLabel = d.buttonLabel;
    if (d.sections) cfg.sections = d.sections;
    if (d.buttons) cfg.buttons = d.buttons;
    if (d.headerText) cfg.headerText = d.headerText;
    if (d.footerText) cfg.footerText = d.footerText;
    if (d.operator) cfg.operator = d.operator;
    if (d.checkKey) cfg.checkKey = d.checkKey;
    if (d.value !== undefined) cfg.value = d.value;
    if (Array.isArray(d.values)) cfg.values = d.values;
    if (d.pattern) cfg.pattern = d.pattern;
    if (d.source) cfg.source = d.source;

    return {
      step_id: n.id,
      type: (d.type ?? n.type ?? 'text') as string,
      config: cfg,
      transitions: outgoing,
      position_x: n.position.x,
      position_y: n.position.y,
    };
  });

  return { valid: errors.length === 0, errors, initialStepId, steps };
};
