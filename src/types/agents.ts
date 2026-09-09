export const AgentStatus = {
  Active: 0,
  Inactive: 1,
  Suspended: 2,
  Blocked: 3,
} as const;

export const ClassificationOperator = {
  Equal: 0,
  NotEqual: 1,
  GreaterThan: 2,
  GreaterThanOrEqual: 3,
  LessThan: 4,
  LessThanOrEqual: 5,
} as const;

export const AgentClassificationMetric = {
  CompletedAdvances: 0,
  TotalAdvances: 1,
  OnTimeRepaymentPercent: 2,
  LateRepaymentCount: 3,
  OverdueAdvanceCount: 4,
  DefaultCount: 5,
  TotalExtensions: 6,
  AverageRepaymentDays: 7,
  AverageExtensionCount: 8,
  CurrentOutstandingAmount: 9,
  TotalRepaidAmount: 10,
  TotalPowderValue: 11,
} as const;

export type AgentStatus = (typeof AgentStatus)[keyof typeof AgentStatus];
export type ClassificationOperator = (typeof ClassificationOperator)[keyof typeof ClassificationOperator];
export type AgentClassificationMetric = (typeof AgentClassificationMetric)[keyof typeof AgentClassificationMetric];

export interface PagedResult<T> {
  totalItems: number;
  page: number;
  pageSize: number;
  results: T[];
}

export interface AgentTypeDto {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  priority: number;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
}

export interface AgentDto {
  id: string;
  code: string;
  customerId: number;
  customer?: {
    id: number;
    fullName?: string | null;
    phone?: string | null;
    email?: string | null;
    customerTypeId?: number;
    customerType?: { id?: number; code?: string } | null;
  } | null;
  address?: string | null;
  registrationDate: string;
  status: AgentStatus;
  agentType?: AgentTypeDto | null;
  notes?: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
}

export interface AgentClassificationRuleConditionDto {
  id: string;
  metric: AgentClassificationMetric;
  operator: ClassificationOperator;
  value: number;
  logicalGroup: number;
  order: number;
}

export interface AgentClassificationRuleDto {
  id: string;
  agentTypeId: string;
  agentTypeCode?: string | null;
  name: string;
  description?: string | null;
  priority: number;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
  conditions: AgentClassificationRuleConditionDto[];
}

export interface CreateAgentRequest {
  customerId: number;
  code: string;
  agentTypeId: string;
  address?: string | null;
  registrationDate: string;
  notes?: string | null;
}

export interface UpdateAgentRequest {
  address?: string | null;
  registrationDate: string;
  notes?: string | null;
}

export interface AgentTypeRequest {
  code?: string | null;
  name: string;
  description?: string | null;
  priority: number;
}

export interface AgentTypeHistoryDto {
  id: string;
  agentId: string;
  previousType?: AgentTypeDto | null;
  newType?: AgentTypeDto | null;
  reason?: string | null;
  changedAt: string;
  changedBy: string;
}

export interface SaveAgentClassificationRuleRequest {
  agentTypeId: string;
  name: string;
  description?: string | null;
  priority: number;
  conditions: Omit<AgentClassificationRuleConditionDto, "id">[];
}
