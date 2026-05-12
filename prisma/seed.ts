/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import { flowRegistry } from '../src/flows';

const prisma = new PrismaClient();

const PLANS = [
  {
    name: 'Starter',
    price_in_paise: 49900,
    currency: 'INR',
    billing_cycle: 'monthly',
    features: ['1 active flow', '50 keywords', 'Up to 200 leads/month'],
  },
  {
    name: 'Pro',
    price_in_paise: 149900,
    currency: 'INR',
    billing_cycle: 'monthly',
    features: ['Unlimited flows', 'Unlimited keywords', 'Up to 2000 leads/month', 'Priority support'],
  },
];

const BUSINESS_FLOW_META: Record<string, { businessType: string; name: string; description: string }> = {
  rental_booking: {
    businessType: 'Appliance Rental',
    name: 'Rental Booking',
    description: 'Pincode -> service selection -> confirm booking.',
  },
};

async function seedPlans() {
  for (const p of PLANS) {
    const existing = await prisma.plan.findFirst({ where: { name: p.name } });
    if (existing) {
      await prisma.plan.update({
        where: { id: existing.id },
        data: {
          price_in_paise: p.price_in_paise,
          currency: p.currency,
          billing_cycle: p.billing_cycle,
          features: p.features,
          is_active: true,
        },
      });
    } else {
      await prisma.plan.create({ data: { ...p, is_active: true } });
    }
  }
}

async function seedBusinessFlows() {
  for (const [id, flow] of Object.entries(flowRegistry)) {
    const meta = BUSINESS_FLOW_META[id] ?? {
      businessType: id,
      name: id,
      description: 'No description.',
    };
    const stepCount = Object.keys(flow.steps).length;

    await prisma.businessFlow.upsert({
      where: { id },
      create: {
        id,
        business_type: meta.businessType,
        name: meta.name,
        description: meta.description,
        step_count: stepCount,
        is_active: true,
      },
      update: {
        business_type: meta.businessType,
        name: meta.name,
        description: meta.description,
        step_count: stepCount,
        is_active: true,
      },
    });
  }
}

async function main() {
  await seedPlans();
  await seedBusinessFlows();
  console.log('Seed complete.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
