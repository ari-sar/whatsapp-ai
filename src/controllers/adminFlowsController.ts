import { Request, Response } from 'express';
import prisma from '../config/prisma';

const TAG = '[adminFlowsController]';

interface StepInput {
  step_id: string;
  type: string;
  config?: Record<string, any>;
  transitions?: Array<{ to: string; condition?: any }>;
  position_x?: number;
  position_y?: number;
}

const slugify = (s: string): string =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

export const listAdminFlows = async (_req: Request, res: Response) => {
  console.log(`${TAG}.listAdminFlows entry`);
  const flows = await prisma.businessFlow.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { steps: true } } },
  });
  return res.json(
    flows.map((f) => ({
      id: f.id,
      businessType: f.business_type,
      name: f.name,
      description: f.description,
      stepCount: f._count.steps,
      initialStepId: f.initial_step_id,
      isActive: f.is_active,
      createdAt: f.created_at.toISOString(),
      updatedAt: f.updated_at.toISOString(),
    }))
  );
};

export const getAdminFlow = async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(`${TAG}.getAdminFlow entry`, { id });
  const flow = await prisma.businessFlow.findUnique({
    where: { id: id as string },
    include: { steps: true },
  });
  if (!flow) return res.status(404).json({ error: 'Flow not found' });

  return res.json({
    id: flow.id,
    businessType: flow.business_type,
    name: flow.name,
    description: flow.description,
    stepCount: flow.steps.length,
    initialStepId: flow.initial_step_id,
    isActive: flow.is_active,
    steps: flow.steps.map((s) => ({
      stepId: s.step_id,
      type: s.type,
      config: s.config,
      transitions: s.transitions,
      positionX: s.position_x,
      positionY: s.position_y,
    })),
    createdAt: flow.created_at.toISOString(),
    updatedAt: flow.updated_at.toISOString(),
  });
};

export const createAdminFlow = async (req: Request, res: Response) => {
  const { id, businessType, name, description, initialStepId, steps, isActive } = req.body ?? {};
  console.log(`${TAG}.createAdminFlow entry`, { id, name, stepCount: Array.isArray(steps) ? steps.length : 0 });

  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'name required', code: 'INVALID_INPUT' });
  }
  if (typeof businessType !== 'string' || !businessType.trim()) {
    return res.status(400).json({ error: 'businessType required', code: 'INVALID_INPUT' });
  }

  const flowId = typeof id === 'string' && id.trim() ? slugify(id) : slugify(name);
  if (!flowId) return res.status(400).json({ error: 'Cannot derive flow id', code: 'INVALID_INPUT' });

  const existing = await prisma.businessFlow.findUnique({ where: { id: flowId } });
  if (existing) {
    return res.status(409).json({ error: `Flow id "${flowId}" already exists`, code: 'DUPLICATE' });
  }

  const stepInputs: StepInput[] = Array.isArray(steps) ? steps : [];
  const initial = typeof initialStepId === 'string' && initialStepId
    ? initialStepId
    : stepInputs[0]?.step_id ?? null;

  const flow = await prisma.businessFlow.create({
    data: {
      id: flowId,
      business_type: businessType,
      name,
      description: typeof description === 'string' ? description : '',
      step_count: stepInputs.length,
      initial_step_id: initial,
      is_active: isActive !== false,
    },
  });

  for (const s of stepInputs) {
    await prisma.flowStep.create({
      data: {
        flow_id: flow.id,
        step_id: s.step_id,
        type: s.type,
        config: s.config ?? {},
        transitions: s.transitions ?? [],
        position_x: s.position_x ?? 0,
        position_y: s.position_y ?? 0,
      },
    });
  }

  return res.status(201).json({ id: flow.id });
};

export const updateAdminFlow = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { businessType, name, description, initialStepId, steps, isActive } = req.body ?? {};
  console.log(`${TAG}.updateAdminFlow entry`, { id, stepCount: Array.isArray(steps) ? steps.length : 'unchanged' });

  const flow = await prisma.businessFlow.findUnique({ where: { id: id as string } });
  if (!flow) return res.status(404).json({ error: 'Flow not found' });

  const stepInputs: StepInput[] | null = Array.isArray(steps) ? steps : null;
  const effectiveInitial =
    typeof initialStepId === 'string' && initialStepId
      ? initialStepId
      : stepInputs
        ? stepInputs[0]?.step_id ?? null
        : flow.initial_step_id;

  await prisma.businessFlow.update({
    where: { id: flow.id },
    data: {
      ...(typeof businessType === 'string' ? { business_type: businessType } : {}),
      ...(typeof name === 'string' ? { name } : {}),
      ...(typeof description === 'string' ? { description } : {}),
      ...(typeof isActive === 'boolean' ? { is_active: isActive } : {}),
      initial_step_id: effectiveInitial,
      ...(stepInputs ? { step_count: stepInputs.length } : {}),
    },
  });

  if (stepInputs) {
    await prisma.flowStep.deleteMany({ where: { flow_id: flow.id } });
    for (const s of stepInputs) {
      await prisma.flowStep.create({
        data: {
          flow_id: flow.id,
          step_id: s.step_id,
          type: s.type,
          config: s.config ?? {},
          transitions: s.transitions ?? [],
          position_x: s.position_x ?? 0,
          position_y: s.position_y ?? 0,
        },
      });
    }
  }

  return res.json({ id: flow.id });
};

export const deleteAdminFlow = async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(`${TAG}.deleteAdminFlow entry`, { id });
  const flow = await prisma.businessFlow.findUnique({ where: { id: id as string } });
  if (!flow) return res.status(404).json({ error: 'Flow not found' });

  await prisma.businessFlow.delete({ where: { id: flow.id } });
  return res.status(204).send();
};
