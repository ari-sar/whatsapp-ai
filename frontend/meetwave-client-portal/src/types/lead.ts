export interface LeadStats {
  total: number;
  monthly: MonthlyLeadCount[];
}

export interface MonthlyLeadCount {
  month: string;
  count: number;
}

export interface Lead {
  id: string;
  userPhone: string;
  lastMessage: string;
  currentFlowId?: string;
  currentStep?: string;
  timestamp: string;
}
