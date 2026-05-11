import { Flow } from './types';
import { rentalBookingFlow } from './rentalBookingFlow';

export const flowRegistry: Record<string, Flow> = {
  [rentalBookingFlow.id]: rentalBookingFlow,
};

export const getFlow = (flowId: string): Flow | undefined => flowRegistry[flowId];
