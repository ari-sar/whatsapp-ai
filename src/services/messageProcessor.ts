import prisma from '../config/prisma';
import { getFlow } from '../flows';
import { FlowContext, IncomingInput, Step } from '../flows/types';
import {
  sendTextMessage,
  sendInteractiveListMessage,
  sendInteractiveButtonMessage,
} from './whatsappApi';

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
  try {
    const client = await prisma.client.findUnique({ where: { phone_number_id: phoneNumberId } });
    if (!client) {
      console.warn(`No client found for phone_number_id: ${phoneNumberId}`);
      return;
    }

    const lead = await prisma.lead.upsert({
      where: { client_id_user_phone: { client_id: client.id, user_phone: from } },
      update: { last_message: lastMessageText(input), timestamp: new Date() },
      create: { client_id: client.id, user_phone: from, last_message: lastMessageText(input) },
    });

    if (lead.current_flow_id && lead.current_step) {
      await routeToFlow(lead, client.access_token, phoneNumberId, from, input);
      return;
    }

    if (input.type !== 'text') {
      console.log(`Ignoring non-text input without active flow: ${input.type}=${input.value}`);
      return;
    }

    await routeToKeyword(client.id, lead.id, client.access_token, phoneNumberId, from, input.value);
  } catch (error) {
    console.error('Error processing message:', error);
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
    console.warn(`Unknown flow_id "${lead.current_flow_id}" on lead ${lead.id} — clearing state.`);
    await prisma.lead.update({
      where: { id: lead.id },
      data: { current_flow_id: null, current_step: null, collected_data: {} },
    });
    return;
  }

  const step: Step | undefined = flow.steps[lead.current_step!];
  if (!step) {
    console.warn(`Unknown step "${lead.current_step}" in flow "${flow.id}" — clearing state.`);
    await prisma.lead.update({
      where: { id: lead.id },
      data: { current_flow_id: null, current_step: null, collected_data: {} },
    });
    return;
  }

  const collected = (lead.collected_data as Record<string, any>) ?? {};
  const ctx = buildCtx(phoneNumberId, from, token, collected);
  const result = await step.handle(input, ctx);
  const mergedCollected = { ...collected, ...(result.collectedPatch ?? {}) };

  if (result.nextStep === null) {
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
      const nextCtx = buildCtx(phoneNumberId, from, token, mergedCollected);
      await nextStepDef.prompt(nextCtx);
    }
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

  const match = await prisma.keyword.findFirst({
    where: { client_id: clientId, trigger },
    include: { response: true },
  });

  if (match?.flow_id) {
    const flow = getFlow(match.flow_id);
    if (!flow) {
      console.warn(`Keyword "${trigger}" references unknown flow_id "${match.flow_id}".`);
      await sendTextMessage({ phoneNumberId, to: from, token, text: "Sorry, that option isn't available right now." });
      return;
    }
    await prisma.lead.update({
      where: { id: leadId },
      data: { current_flow_id: flow.id, current_step: flow.initialStep, collected_data: {} },
    });
    const ctx = buildCtx(phoneNumberId, from, token, {});
    await flow.steps[flow.initialStep].prompt(ctx);
    return;
  }

  if (match?.response) {
    if (match.response.media_url) {
      await sendTextMessage({ phoneNumberId, to: from, token, text: match.response.message });
    } else {
      await sendTextMessage({ phoneNumberId, to: from, token, text: match.response.message });
    }
    return;
  }

  const fallback = await prisma.keyword.findFirst({
    where: { client_id: clientId, trigger: 'default_fallback' },
    include: { response: true },
  });
  const fallbackText = fallback?.response?.message ?? "Sorry, I didn't understand that. How can we help you today?";
  await sendTextMessage({ phoneNumberId, to: from, token, text: fallbackText });
};
