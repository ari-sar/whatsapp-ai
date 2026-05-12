import prisma from '../config/prisma';
import { getFlow } from '../flows';
import { FlowContext, IncomingInput, Step } from '../flows/types';
import {
  sendTextMessage,
  sendInteractiveListMessage,
  sendInteractiveButtonMessage,
} from './whatsappApi';

const TAG = '[messageProcessor]';

const buildCtx = (
  phoneNumberId: string,
  to: string,
  token: string,
  collected: Record<string, any>
): FlowContext => ({
  phoneNumberId,
  to,
  token,
  collected,
  send: {
    text: sendTextMessage,
    list: sendInteractiveListMessage,
    button: sendInteractiveButtonMessage,
  },
});

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
      console.log(`${TAG}.processMessage routing to active flow`, { leadId: lead.id, flowId: lead.current_flow_id, step: lead.current_step });
      await routeToFlow(lead, client.access_token, phoneNumberId, from, input);
      return;
    }

    if (input.type !== 'text') {
      console.log(`${TAG}.processMessage ignoring non-text without active flow`, { type: input.type, value: input.value });
      return;
    }

    console.log(`${TAG}.processMessage routing to keyword match`, { clientId: client.id, text: input.value });
    await routeToKeyword(client.id, lead.id, client.access_token, phoneNumberId, from, input.value);
  } catch (error) {
    console.error(`${TAG}.processMessage error`, error);
  }
};

const routeToFlow = async (
  lead: { id: string; current_flow_id: string | null; current_step: string | null; collected_data: any },
  token: string,
  phoneNumberId: string,
  from: string,
  input: IncomingInput
) => {
  const flow = getFlow(lead.current_flow_id!);
  if (!flow) {
    console.warn(`${TAG}.routeToFlow UNKNOWN_FLOW — clearing state`, { leadId: lead.id, flowId: lead.current_flow_id });
    await prisma.lead.update({
      where: { id: lead.id },
      data: { current_flow_id: null, current_step: null, collected_data: {} },
    });
    return;
  }

  const step: Step | undefined = flow.steps[lead.current_step!];
  if (!step) {
    console.warn(`${TAG}.routeToFlow UNKNOWN_STEP — clearing state`, { leadId: lead.id, flowId: flow.id, step: lead.current_step });
    await prisma.lead.update({
      where: { id: lead.id },
      data: { current_flow_id: null, current_step: null, collected_data: {} },
    });
    return;
  }

  const collected = (lead.collected_data as Record<string, any>) ?? {};
  const ctx = buildCtx(phoneNumberId, from, token, collected);
  console.log(`${TAG}.routeToFlow step.handle entry`, { leadId: lead.id, flowId: flow.id, step: step.id, input });
  const result = await step.handle(input, ctx);
  console.log(`${TAG}.routeToFlow step.handle result`, { leadId: lead.id, flowId: flow.id, step: step.id, nextStep: result.nextStep, hasPatch: !!result.collectedPatch, error: result.error });
  const mergedCollected = { ...collected, ...(result.collectedPatch ?? {}) };

  if (result.nextStep === null) {
    console.log(`${TAG}.routeToFlow flow complete — clearing state`, { leadId: lead.id, flowId: flow.id });
    await prisma.lead.update({
      where: { id: lead.id },
      data: { current_flow_id: null, current_step: null, collected_data: {} },
    });
    return;
  }

  await prisma.lead.update({
    where: { id: lead.id },
    data: { current_step: result.nextStep, collected_data: mergedCollected },
  });

  if (result.nextStep !== lead.current_step) {
    const nextStepDef = flow.steps[result.nextStep];
    if (nextStepDef) {
      console.log(`${TAG}.routeToFlow advancing → prompt`, { leadId: lead.id, flowId: flow.id, fromStep: step.id, nextStep: result.nextStep });
      const nextCtx = buildCtx(phoneNumberId, from, token, mergedCollected);
      await nextStepDef.prompt(nextCtx);
    } else {
      console.warn(`${TAG}.routeToFlow next step has no definition`, { leadId: lead.id, flowId: flow.id, nextStep: result.nextStep });
    }
  } else {
    console.log(`${TAG}.routeToFlow staying on same step`, { leadId: lead.id, flowId: flow.id, step: step.id });
  }
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
  console.log(`${TAG}.routeToKeyword lookup`, { clientId, leadId, trigger });

  const match = await prisma.keyword.findFirst({
    where: { client_id: clientId, trigger },
    include: { response: true },
  });
  console.log(`${TAG}.routeToKeyword match`, { trigger, matched: !!match, hasFlow: !!match?.flow_id, hasResponse: !!match?.response });

  if (match?.flow_id) {
    const flow = getFlow(match.flow_id);
    if (!flow) {
      console.warn(`${TAG}.routeToKeyword keyword references unknown flow_id`, { trigger, flowId: match.flow_id });
      await sendTextMessage({ phoneNumberId, to: from, token, text: "Sorry, that option isn't available right now." });
      return;
    }
    console.log(`${TAG}.routeToKeyword starting flow`, { leadId, flowId: flow.id, initialStep: flow.initialStep });
    await prisma.lead.update({
      where: { id: leadId },
      data: { current_flow_id: flow.id, current_step: flow.initialStep, collected_data: {} },
    });
    const ctx = buildCtx(phoneNumberId, from, token, {});
    await flow.steps[flow.initialStep]!.prompt(ctx);
    return;
  }

  if (match?.response) {
    console.log(`${TAG}.routeToKeyword sending static response`, { trigger, responseId: match.response.id, hasMedia: !!match.response.media_url });
    if (match.response.media_url) {
      await sendTextMessage({ phoneNumberId, to: from, token, text: match.response.message });
    } else {
      await sendTextMessage({ phoneNumberId, to: from, token, text: match.response.message });
    }
    return;
  }

  console.log(`${TAG}.routeToKeyword no match — sending fallback`, { trigger });
  const fallback = await prisma.keyword.findFirst({
    where: { client_id: clientId, trigger: 'default_fallback' },
    include: { response: true },
  });
  const fallbackText = fallback?.response?.message ?? "Sorry, I didn't understand that. How can we help you today?";
  await sendTextMessage({ phoneNumberId, to: from, token, text: fallbackText });
};
