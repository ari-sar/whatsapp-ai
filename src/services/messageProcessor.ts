import prisma from '../config/prisma';
import { IncomingInput } from '../flows/types';
import { sendTextMessage } from './whatsappApi';
import {
  DbFlow,
  DbStep,
  getStep,
  handleStep,
  isAutoAdvanceStep,
  isEndStep,
  loadFlow,
  promptStep,
} from './flowEngine';

const TAG = '[messageProcessor]';

const lastMessageText = (input: IncomingInput) => input.value;

export const processMessage = async (
  phoneNumberId: string,
  from: string,
  input: IncomingInput
) => {
  console.log(`${TAG}.processMessage entry`, { phoneNumberId, from, type: input.type, value: input.value });
  try {
    const client = await prisma.client.findUnique({ where: { phone_number_id: phoneNumberId } });
    if (!client) {
      console.warn(`${TAG}.processMessage NO_CLIENT for phone_number_id`, { phoneNumberId });
      return;
    }
    if (!client.access_token) {
      console.warn(`${TAG}.processMessage NO_ACCESS_TOKEN — skipping reply`, { clientId: client.id });
      return;
    }

    const lead = await prisma.lead.upsert({
      where: { client_id_user_phone: { client_id: client.id, user_phone: from } },
      update: { last_message: lastMessageText(input), timestamp: new Date() },
      create: { client_id: client.id, user_phone: from, last_message: lastMessageText(input) },
    });
    console.log(`${TAG}.processMessage lead`, {
      leadId: lead.id,
      currentFlowId: lead.current_flow_id,
      currentStep: lead.current_step,
    });

    if (lead.current_flow_id && lead.current_step) {
      await routeToFlow(lead, client.id, client.access_token, phoneNumberId, from, input);
      return;
    }

    if (input.type !== 'text') {
      console.log(`${TAG}.processMessage ignoring non-text without active flow`, { type: input.type });
      return;
    }

    await routeToKeyword(client.id, lead.id, client.access_token, phoneNumberId, from, input.value);
  } catch (error) {
    console.error(`${TAG}.processMessage error`, error);
  }
};

const clearLeadFlow = (leadId: string) =>
  prisma.lead.update({
    where: { id: leadId },
    data: { current_flow_id: null, current_step: null, collected_data: {} },
  });

const routeToFlow = async (
  lead: { id: string; current_flow_id: string | null; current_step: string | null; collected_data: any },
  clientId: string,
  token: string,
  phoneNumberId: string,
  from: string,
  input: IncomingInput
) => {
  const flow = await loadFlow(lead.current_flow_id!);
  if (!flow) {
    console.warn(`${TAG}.routeToFlow UNKNOWN_FLOW — clearing state`, { leadId: lead.id });
    await clearLeadFlow(lead.id);
    return;
  }
  const step = getStep(flow, lead.current_step!);
  if (!step) {
    console.warn(`${TAG}.routeToFlow UNKNOWN_STEP — clearing state`, { leadId: lead.id });
    await clearLeadFlow(lead.id);
    return;
  }

  const collected = (lead.collected_data as Record<string, any>) ?? {};
  const ctx = { phoneNumberId, to: from, token };
  const result = await handleStep(step, input, collected, clientId);
  console.log(`${TAG}.routeToFlow handled`, { leadId: lead.id, stepId: step.step_id, nextStepId: result.nextStepId });

  const merged = { ...collected, ...(result.collectedPatch ?? {}) };

  if (result.reprompt) {
    if (result.invalidMessage) {
      await sendTextMessage({ ...ctx, text: result.invalidMessage });
    }
    await promptStep(step, ctx, merged);
    return;
  }

  if (result.nextStepId === null) {
    await clearLeadFlow(lead.id);
    return;
  }

  let cursor: DbStep | undefined = getStep(flow, result.nextStepId);
  let cursorCollected = merged;
  while (cursor && isAutoAdvanceStep(cursor)) {
    const r = await handleStep(cursor, input, cursorCollected, clientId);
    if (r.collectedPatch) cursorCollected = { ...cursorCollected, ...r.collectedPatch };
    if (r.nextStepId === null) {
      await clearLeadFlow(lead.id);
      return;
    }
    cursor = getStep(flow, r.nextStepId);
  }
  if (!cursor) {
    console.warn(`${TAG}.routeToFlow next step missing — clearing`, { leadId: lead.id, nextStepId: result.nextStepId });
    await clearLeadFlow(lead.id);
    return;
  }

  await prisma.lead.update({
    where: { id: lead.id },
    data: { current_step: cursor.step_id, collected_data: cursorCollected },
  });

  await promptStep(cursor, ctx, cursorCollected);

  if (isEndStep(cursor)) {
    await clearLeadFlow(lead.id);
  }
};

const findEntryStep = (flow: DbFlow): DbStep | null => {
  if (flow.initial_step_id) {
    const s = getStep(flow, flow.initial_step_id);
    if (s) return s;
  }
  return flow.steps[0] ?? null;
};

const routeToKeyword = async (
  clientId: string,
  leadId: string,
  token: string,
  phoneNumberId: string,
  from: string,
  text: string
) => {
  const trigger = text.toLowerCase().trim();
  const match = await prisma.keyword.findFirst({
    where: { client_id: clientId, trigger },
    include: { response: true },
  });
  console.log(`${TAG}.routeToKeyword match`, { trigger, matched: !!match, hasFlow: !!match?.flow_id });

  if (match?.flow_id) {
    const flow = await loadFlow(match.flow_id);
    if (!flow) {
      console.warn(`${TAG}.routeToKeyword unknown flow_id`, { trigger, flowId: match.flow_id });
      await sendTextMessage({ phoneNumberId, to: from, token, text: "Sorry, that option isn't available right now." });
      return;
    }
    let entry = findEntryStep(flow);
    if (!entry) {
      console.warn(`${TAG}.routeToKeyword flow has no steps`, { flowId: flow.id });
      return;
    }

    let collected: Record<string, any> = {};
    while (entry && isAutoAdvanceStep(entry)) {
      const r = await handleStep(entry, { type: 'text', value: '' }, collected, clientId);
      if (r.collectedPatch) collected = { ...collected, ...r.collectedPatch };
      if (r.nextStepId === null) {
        return;
      }
      entry = getStep(flow, r.nextStepId) ?? null;
    }
    if (!entry) return;

    await prisma.lead.update({
      where: { id: leadId },
      data: { current_flow_id: flow.id, current_step: entry.step_id, collected_data: collected },
    });
    const ctx = { phoneNumberId, to: from, token };
    await promptStep(entry, ctx, collected);
    if (isEndStep(entry)) {
      await clearLeadFlow(leadId);
    }
    return;
  }

  if (match?.response) {
    await sendTextMessage({ phoneNumberId, to: from, token, text: match.response.message });
    return;
  }

  const fallback = await prisma.keyword.findFirst({
    where: { client_id: clientId, trigger: 'default_fallback' },
    include: { response: true },
  });
  const fallbackText = fallback?.response?.message ?? "Sorry, I didn't understand that. How can we help you today?";
  await sendTextMessage({ phoneNumberId, to: from, token, text: fallbackText });
};
