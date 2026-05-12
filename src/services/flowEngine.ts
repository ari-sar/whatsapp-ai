import prisma from '../config/prisma';
import { IncomingInput } from '../flows/types';
import {
  sendTextMessage,
  sendInteractiveListMessage,
  sendInteractiveButtonMessage,
  ListSection,
  ReplyButton,
} from './whatsappApi';

const TAG = '[flowEngine]';

export interface SendCtx {
  phoneNumberId: string;
  to: string;
  token: string;
}

export interface DbStep {
  step_id: string;
  type: string;
  config: any;
  transitions: any;
}

export interface DbFlow {
  id: string;
  initial_step_id: string | null;
  steps: DbStep[];
}

export const loadFlow = async (flowId: string): Promise<DbFlow | null> => {
  const flow = await prisma.businessFlow.findUnique({
    where: { id: flowId },
    include: { steps: true },
  });
  if (!flow) return null;
  return {
    id: flow.id,
    initial_step_id: flow.initial_step_id,
    steps: flow.steps.map((s) => ({
      step_id: s.step_id,
      type: s.type,
      config: s.config as any,
      transitions: s.transitions as any,
    })),
  };
};

const interpolate = (text: string, collected: Record<string, any>): string =>
  text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
    const v = collected[key];
    return v === undefined || v === null ? '' : String(v);
  });

const findStep = (flow: DbFlow, stepId: string): DbStep | undefined =>
  flow.steps.find((s) => s.step_id === stepId);

export const promptStep = async (
  step: DbStep,
  ctx: SendCtx,
  collected: Record<string, any>
): Promise<void> => {
  const cfg = (step.config ?? {}) as any;
  const promptText = typeof cfg.prompt === 'string' ? interpolate(cfg.prompt, collected) : '';
  console.log(`${TAG}.promptStep`, { type: step.type, stepId: step.step_id });

  switch (step.type) {
    case 'text':
    case 'end':
      if (promptText) {
        await sendTextMessage({ ...ctx, text: promptText });
      }
      return;
    case 'list': {
      const sections = (cfg.sections ?? []) as ListSection[];
      await sendInteractiveListMessage({
        ...ctx,
        bodyText: promptText || 'Pick an option',
        buttonLabel: typeof cfg.buttonLabel === 'string' && cfg.buttonLabel ? cfg.buttonLabel : 'Options',
        sections,
        headerText: typeof cfg.headerText === 'string' ? cfg.headerText : undefined,
        footerText: typeof cfg.footerText === 'string' ? cfg.footerText : undefined,
      });
      return;
    }
    case 'button': {
      const buttons = (cfg.buttons ?? []) as ReplyButton[];
      await sendInteractiveButtonMessage({
        ...ctx,
        bodyText: promptText || 'Pick an option',
        buttons,
        headerText: typeof cfg.headerText === 'string' ? cfg.headerText : undefined,
        footerText: typeof cfg.footerText === 'string' ? cfg.footerText : undefined,
      });
      return;
    }
    case 'start':
    case 'condition':
      return;
    default:
      console.warn(`${TAG}.promptStep unknown step type`, { type: step.type });
  }
};

const matchTransition = (
  transitions: any[],
  input: IncomingInput,
  collected: Record<string, any>
): string | null => {
  if (!Array.isArray(transitions) || transitions.length === 0) return null;

  for (const t of transitions) {
    if (!t || typeof t.to !== 'string') continue;
    if (!t.condition) continue;
    const c = t.condition;
    if (c.type === 'input_eq' && c.value === input.value) return t.to;
    if (c.type === 'input_in' && Array.isArray(c.values) && c.values.includes(input.value)) return t.to;
    if (c.type === 'collected_eq' && collected[c.key] === c.value) return t.to;
  }

  for (const t of transitions) {
    if (!t || typeof t.to !== 'string') continue;
    if (!t.condition) return t.to;
  }

  return null;
};

export interface AdvanceResult {
  nextStepId: string | null;
  collectedPatch?: Record<string, any>;
  reprompt?: boolean;
  invalidMessage?: string;
}

export const handleStep = (
  step: DbStep,
  input: IncomingInput,
  collected: Record<string, any>
): AdvanceResult => {
  const cfg = (step.config ?? {}) as any;
  const transitions = (step.transitions ?? []) as any[];

  switch (step.type) {
    case 'start': {
      const next = matchTransition(transitions, input, collected) ?? transitions[0]?.to ?? null;
      return { nextStepId: next };
    }
    case 'text': {
      if (input.type !== 'text') {
        return { nextStepId: step.step_id, reprompt: true, invalidMessage: cfg.invalidMessage };
      }
      const val = input.value.trim();
      if (typeof cfg.validation === 'string' && cfg.validation) {
        try {
          const re = new RegExp(cfg.validation);
          if (!re.test(val)) {
            return { nextStepId: step.step_id, reprompt: true, invalidMessage: cfg.invalidMessage };
          }
        } catch {
          /* ignore bad regex */
        }
      }
      const patch: Record<string, any> = {};
      if (typeof cfg.collectKey === 'string' && cfg.collectKey) patch[cfg.collectKey] = val;
      const next = matchTransition(transitions, input, { ...collected, ...patch });
      return { nextStepId: next, collectedPatch: patch };
    }
    case 'list': {
      if (input.type !== 'list') {
        return { nextStepId: step.step_id, reprompt: true, invalidMessage: cfg.invalidMessage };
      }
      const patch: Record<string, any> = {};
      if (typeof cfg.collectKey === 'string' && cfg.collectKey) patch[cfg.collectKey] = input.value;
      if (typeof cfg.collectLabelKey === 'string' && cfg.collectLabelKey) {
        const sections = (cfg.sections ?? []) as ListSection[];
        for (const sec of sections) {
          const row = sec.rows.find((r) => r.id === input.value);
          if (row) {
            patch[cfg.collectLabelKey] = row.title;
            break;
          }
        }
      }
      const next = matchTransition(transitions, input, { ...collected, ...patch });
      if (!next) {
        return { nextStepId: step.step_id, reprompt: true, invalidMessage: cfg.invalidMessage };
      }
      return { nextStepId: next, collectedPatch: patch };
    }
    case 'button': {
      if (input.type !== 'button') {
        return { nextStepId: step.step_id, reprompt: true, invalidMessage: cfg.invalidMessage };
      }
      const patch: Record<string, any> = {};
      if (typeof cfg.collectKey === 'string' && cfg.collectKey) patch[cfg.collectKey] = input.value;
      const next = matchTransition(transitions, input, { ...collected, ...patch });
      if (!next) {
        return { nextStepId: step.step_id, reprompt: true, invalidMessage: cfg.invalidMessage };
      }
      return { nextStepId: next, collectedPatch: patch };
    }
    case 'condition': {
      const next = matchTransition(transitions, input, collected);
      return { nextStepId: next };
    }
    case 'end':
      return { nextStepId: null };
    default:
      return { nextStepId: null };
  }
};

export const isEndStep = (step: DbStep): boolean => step.type === 'end';

export const getStep = findStep;
