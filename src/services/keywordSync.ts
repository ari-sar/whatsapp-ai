import prisma from '../config/prisma';

const TAG = '[keywordSync]';

export const syncUserKeywordCreate = async (
  clientId: string,
  trigger: string,
  responseMessage: string
): Promise<void> => {
  console.log(`${TAG}.create entry`, { clientId, trigger });
  const response = await prisma.response.create({
    data: { message: responseMessage },
  });
  try {
    await prisma.keyword.create({
      data: { client_id: clientId, trigger, response_id: response.id },
    });
    console.log(`${TAG}.create success`, { clientId, trigger, responseId: response.id });
  } catch (err) {
    console.error(`${TAG}.create FAILED — rolling back response`, { clientId, trigger, responseId: response.id, err });
    await prisma.response.delete({ where: { id: response.id } }).catch(() => undefined);
    throw err;
  }
};

export const syncUserKeywordUpdate = async (
  clientId: string,
  oldTrigger: string,
  newTrigger: string,
  responseMessage: string
): Promise<void> => {
  console.log(`${TAG}.update entry`, { clientId, oldTrigger, newTrigger });
  const existing = await prisma.keyword.findUnique({
    where: { client_id_trigger: { client_id: clientId, trigger: oldTrigger } },
  });

  if (!existing) {
    console.log(`${TAG}.update no existing mirror — creating fresh`, { clientId, newTrigger });
    await syncUserKeywordCreate(clientId, newTrigger, responseMessage);
    return;
  }

  if (existing.response_id) {
    await prisma.response.update({
      where: { id: existing.response_id },
      data: { message: responseMessage },
    });
    console.log(`${TAG}.update response updated`, { clientId, keywordId: existing.id, responseId: existing.response_id });
  } else {
    const created = await prisma.response.create({ data: { message: responseMessage } });
    await prisma.keyword.update({
      where: { id: existing.id },
      data: { response_id: created.id, flow_id: null },
    });
    console.log(`${TAG}.update response created + linked`, { clientId, keywordId: existing.id, responseId: created.id });
  }

  if (oldTrigger !== newTrigger) {
    await prisma.keyword.update({
      where: { id: existing.id },
      data: { trigger: newTrigger },
    });
    console.log(`${TAG}.update trigger renamed`, { clientId, keywordId: existing.id, oldTrigger, newTrigger });
  }
};

export const syncUserKeywordDelete = async (clientId: string, trigger: string): Promise<void> => {
  console.log(`${TAG}.delete entry`, { clientId, trigger });
  const existing = await prisma.keyword.findUnique({
    where: { client_id_trigger: { client_id: clientId, trigger } },
  });
  if (!existing) {
    console.log(`${TAG}.delete no mirror found — noop`, { clientId, trigger });
    return;
  }

  await prisma.keyword.delete({ where: { id: existing.id } });
  if (existing.response_id) {
    await prisma.response.delete({ where: { id: existing.response_id } }).catch(() => undefined);
  }
  console.log(`${TAG}.delete success`, { clientId, trigger, keywordId: existing.id });
};
