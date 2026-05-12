/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PLANS = [
  {
    name: 'Starter',
    price_in_paise: 49900,
    currency: 'INR',
    billing_cycle: 'monthly',
    duration_days: 30,
    description: 'Starter plan for new businesses.',
    features: ['1 active flow', '50 keywords', 'Up to 200 leads/month'],
  },
  {
    name: 'Pro',
    price_in_paise: 149900,
    currency: 'INR',
    billing_cycle: 'monthly',
    duration_days: 30,
    description: 'Pro plan for growing businesses.',
    features: ['Unlimited flows', 'Unlimited keywords', 'Up to 2000 leads/month', 'Priority support'],
  },
];

const RENTAL_BOOKING_FLOW = {
  id: 'rental_booking',
  business_type: 'Appliance Rental',
  name: 'Rental Booking',
  description: 'Pincode -> service selection -> confirm booking.',
  initial_step_id: 'start-node',
  steps: [
    {
      step_id: 'start-node',
      type: 'start',
      config: { label: 'Start' },
      transitions: [{ to: 'Awaiting_Pincode' }],
      position_x: 100,
      position_y: 100,
    },
    {
      step_id: 'Awaiting_Pincode',
      type: 'text',
      config: {
        label: 'Awaiting Pincode',
        prompt: 'Please share your 6-digit pincode so we can check service availability.',
        validation: '^\\d{6}$',
        invalidMessage: 'That does not look like a valid 6-digit pincode. Please try again.',
        collectKey: 'pincode',
      },
      transitions: [{ to: 'Awaiting_Service' }],
      position_x: 100,
      position_y: 240,
    },
    {
      step_id: 'Awaiting_Service',
      type: 'list',
      config: {
        label: 'Awaiting Service',
        prompt: 'Great! Which service do you need?',
        buttonLabel: 'View services',
        sections: [
          {
            title: 'Appliances',
            rows: [
              { id: 'svc_ac', title: 'AC Repair' },
              { id: 'svc_heater', title: 'Heater Repair' },
              { id: 'svc_fridge', title: 'Fridge Repair' },
            ],
          },
        ],
        collectKey: 'service_id',
        collectLabelKey: 'service_label',
        invalidMessage: 'Please tap one of the options from the menu.',
      },
      transitions: [
        { to: 'Awaiting_Confirmation', condition: { type: 'input_in', values: ['svc_ac', 'svc_heater', 'svc_fridge'] } },
      ],
      position_x: 100,
      position_y: 380,
    },
    {
      step_id: 'Awaiting_Confirmation',
      type: 'button',
      config: {
        label: 'Awaiting Confirmation',
        prompt: 'Confirm booking for *{{service_label}}* at pincode {{pincode}}?',
        buttons: [
          { id: 'confirm_yes', title: 'Yes, book it' },
          { id: 'confirm_no', title: 'Cancel' },
        ],
        invalidMessage: 'Please pick one of the buttons.',
      },
      transitions: [
        {
          to: 'End_Booked',
          condition: { type: 'input_eq', value: 'confirm_yes' },
        },
        {
          to: 'End_Cancelled',
          condition: { type: 'input_eq', value: 'confirm_no' },
        },
      ],
      position_x: 100,
      position_y: 520,
    },
    {
      step_id: 'End_Booked',
      type: 'end',
      config: {
        label: 'Booked',
        prompt: 'Booked! Our technician for {{service_label}} will reach out shortly.',
      },
      transitions: [],
      position_x: 100,
      position_y: 660,
    },
    {
      step_id: 'End_Cancelled',
      type: 'end',
      config: {
        label: 'Cancelled',
        prompt: 'No problem, your request has been cancelled.',
      },
      transitions: [],
      position_x: 320,
      position_y: 660,
    },
  ],
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
          duration_days: p.duration_days,
          description: p.description,
          features: p.features,
          is_active: true,
        },
      });
    } else {
      await prisma.plan.create({ data: { ...p, is_active: true } });
    }
  }
}

async function seedRentalBookingFlow() {
  const f = RENTAL_BOOKING_FLOW;

  await prisma.businessFlow.upsert({
    where: { id: f.id },
    create: {
      id: f.id,
      business_type: f.business_type,
      name: f.name,
      description: f.description,
      step_count: f.steps.length,
      initial_step_id: f.initial_step_id,
      is_active: true,
    },
    update: {
      business_type: f.business_type,
      name: f.name,
      description: f.description,
      step_count: f.steps.length,
      initial_step_id: f.initial_step_id,
      is_active: true,
    },
  });

  await prisma.flowStep.deleteMany({ where: { flow_id: f.id } });

  for (const s of f.steps) {
    await prisma.flowStep.create({
      data: {
        flow_id: f.id,
        step_id: s.step_id,
        type: s.type,
        config: s.config,
        transitions: s.transitions,
        position_x: s.position_x,
        position_y: s.position_y,
      },
    });
  }
}

async function main() {
  await seedPlans();
  await seedRentalBookingFlow();
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
