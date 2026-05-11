import {
  sendTextMessage,
  sendInteractiveListMessage,
  sendInteractiveButtonMessage,
} from '../services/whatsappApi';

export type IncomingInput =
  | { type: 'text'; value: string }
  | { type: 'list'; value: string }      // list_reply.id
  | { type: 'button'; value: string };   // button_reply.id

export interface FlowContext {
  phoneNumberId: string;
  to: string;
  token: string;
  collected: Record<string, any>;
  send: {
    text: typeof sendTextMessage;
    list: typeof sendInteractiveListMessage;
    button: typeof sendInteractiveButtonMessage;
  };
}

export interface StepResult {
  nextStep: string | null;                 // null = flow complete
  collectedPatch?: Record<string, any>;    // Merged into Lead.collected_data
  error?: string;                          // If set, processor stays on current step
}

export interface Step {
  id: string;
  prompt: (ctx: FlowContext) => Promise<void>;
  handle: (input: IncomingInput, ctx: FlowContext) => Promise<StepResult>;
}

export interface Flow {
  id: string;
  initialStep: string;
  steps: Record<string, Step>;
}
