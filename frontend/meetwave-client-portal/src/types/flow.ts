export type StepType = 'start' | 'text' | 'list' | 'button' | 'condition' | 'end';

export interface ListOption {
  id: string;
  label: string;
}

export interface StepConfig {
  type: StepType;
  label: string;
  prompt?: string;           // For text/list/button steps
  options?: ListOption[];    // For list/button steps
  validation?: string;       // Regex or validation rule
  nextStepId?: string;       // Default next step (overridable by edges)
  metadata?: Record<string, any>;
}

export interface Step {
  id: string;
  config: StepConfig;
}

export interface Flow {
  id: string;
  name: string;
  description: string;
  initialStepId: string;
  steps: Record<string, Step>;
  edges: Array<{
    from: string;            // step id
    to: string;              // step id
    condition?: string;       // Optional: "list_option_id=svc_ac"
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface StepResult {
  nextStepId: string | null;
  collectedPatch?: Record<string, any>;
  error?: string;
}
