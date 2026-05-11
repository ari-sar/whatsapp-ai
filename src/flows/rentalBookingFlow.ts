import { Flow } from './types';

const SERVICES: Record<string, string> = {
  svc_ac: 'AC Repair',
  svc_heater: 'Heater Repair',
  svc_fridge: 'Fridge Repair',
};

export const rentalBookingFlow: Flow = {
  id: 'rental_booking',
  initialStep: 'Awaiting_Pincode',
  steps: {
    Awaiting_Pincode: {
      id: 'Awaiting_Pincode',
      prompt: async (ctx) => {
        await ctx.send.text({
          phoneNumberId: ctx.phoneNumberId,
          to: ctx.to,
          token: ctx.token,
          text: 'Please share your 6-digit pincode so we can check service availability.',
        });
      },
      handle: async (input, ctx) => {
        if (input.type !== 'text') {
          return { nextStep: 'Awaiting_Pincode', error: 'Pincode must be typed as text.' };
        }
        const pincode = input.value.trim();
        if (!/^\d{6}$/.test(pincode)) {
          await ctx.send.text({
            phoneNumberId: ctx.phoneNumberId,
            to: ctx.to,
            token: ctx.token,
            text: 'That does not look like a valid 6-digit pincode. Please try again.',
          });
          return { nextStep: 'Awaiting_Pincode' };
        }
        return { nextStep: 'Awaiting_Service', collectedPatch: { pincode } };
      },
    },

    Awaiting_Service: {
      id: 'Awaiting_Service',
      prompt: async (ctx) => {
        await ctx.send.list({
          phoneNumberId: ctx.phoneNumberId,
          to: ctx.to,
          token: ctx.token,
          bodyText: 'Great! Which service do you need?',
          buttonLabel: 'View services',
          sections: [
            {
              title: 'Appliances',
              rows: Object.entries(SERVICES).map(([id, title]) => ({ id, title })),
            },
          ],
        });
      },
      handle: async (input, ctx) => {
        const id = input.value;
        if (input.type !== 'list' || !SERVICES[id]) {
          await ctx.send.text({
            phoneNumberId: ctx.phoneNumberId,
            to: ctx.to,
            token: ctx.token,
            text: 'Please tap one of the options from the menu.',
          });
          return { nextStep: 'Awaiting_Service' };
        }
        return {
          nextStep: 'Awaiting_Confirmation',
          collectedPatch: { service_id: id, service_label: SERVICES[id] },
        };
      },
    },

    Awaiting_Confirmation: {
      id: 'Awaiting_Confirmation',
      prompt: async (ctx) => {
        await ctx.send.button({
          phoneNumberId: ctx.phoneNumberId,
          to: ctx.to,
          token: ctx.token,
          bodyText: `Confirm booking for *${ctx.collected.service_label}* at pincode ${ctx.collected.pincode}?`,
          buttons: [
            { id: 'confirm_yes', title: 'Yes, book it' },
            { id: 'confirm_no', title: 'Cancel' },
          ],
        });
      },
      handle: async (input, ctx) => {
        if (input.type !== 'button') {
          return { nextStep: 'Awaiting_Confirmation' };
        }
        if (input.value === 'confirm_yes') {
          await ctx.send.text({
            phoneNumberId: ctx.phoneNumberId,
            to: ctx.to,
            token: ctx.token,
            text: `Booked! Our technician for ${ctx.collected.service_label} will reach out shortly.`,
          });
          return { nextStep: null };
        }
        await ctx.send.text({
          phoneNumberId: ctx.phoneNumberId,
          to: ctx.to,
          token: ctx.token,
          text: 'No problem, your request has been cancelled.',
        });
        return { nextStep: null };
      },
    },
  },
};
