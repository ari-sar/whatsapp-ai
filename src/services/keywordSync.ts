import prisma from '../config/prisma';

export const syncUserKeywordCreate = async (
  clientId: string,
  trigger: string,
  responseMessage: string
): Promise<void> => {
  const response = await prisma.response.create({
    data: { message: responseMessage },
  });
  try {
    await prisma.keyword.create({
      data: { client_id: clientId, trigger, response_id: response.id },
    });
  } catch (err) {
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
  const existing = await prisma.keyword.findUnique({
    where: { client_id_trigger: { client_id: clientId, trigger: oldTrigger } },
  });

  if (!existing) {
    await syncUserKeywordCreate(clientId, newTrigger, responseMessage);
    return;
  }

  if (existing.response_id) {
    await prisma.response.update({
      where: { id: existing.response_id },
      data: { message: responseMessage },
    });
  } else {
    const created = await prisma.response.create({ data: { message: responseMessage } });
    await prisma.keyword.update({
      where: { id: existing.id },
      data: { response_id: created.id, flow_id: null },
    });
  }

  if (oldTrigger !== newTrigger) {
    await prisma.keyword.update({
      where: { id: existing.id },
      data: { trigger: newTrigger },
    });
  }
};

export const syncUserKeywordDelete = async (clientId: string, trigger: string): Promise<void> => {
  const existing = await prisma.keyword.findUnique({
    where: { client_id_trigger: { client_id: clientId, trigger } },
  });
  if (!existing) return;

  await prisma.keyword.delete({ where: { id: existing.id } });
  if (existing.response_id) {
    await prisma.response.delete({ where: { id: existing.response_id } }).catch(() => undefined);
  }
};
