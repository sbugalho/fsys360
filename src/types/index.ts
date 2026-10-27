export type UserRole = 'admin' | 'rececao' | 'tecnico' | 'gestao';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  password?: string;
  role: UserRole;
  active: boolean;
  phone?: string;
  specialty?: string; // e.g., "Hardware & Micro-soldadura", "Redes & Servidores", "Portáteis & Mac"
  isSuperAdmin?: boolean;
  createdAt?: string;
}

export type CustomerType = 'particular' | 'empresa';

export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  taxNumber?: string; // NIF
  email: string;
  phone: string;
  altPhone?: string;
  address: string;
  city: string;
  postalCode: string;
  notes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type EquipmentCategory = 
  | 'portatil'
  | 'desktop'
  | 'servidor'
  | 'monitor'
  | 'impressora'
  | 'tablet'
  | 'smartphone'
  | 'periferico'
  | 'outro';

export interface Equipment {
  id: string;
  customerId: string;
  category: EquipmentCategory;
  brand: string;
  model: string;
  serialNumber: string;
  internalTag: string;
  specsDescription?: string;
  externalNotes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ServiceOrderStatus = 
  | 'recebido'
  | 'em_diagnostico'
  | 'aguarda_aprovacao'
  | 'aprovado_em_reparacao'
  | 'aguarda_pecas'
  | 'aguarda_cliente'
  | 'em_testes'
  | 'pronto_levantamento'
  | 'entregue_fechado'
  | 'sem_reparacao'
  | 'devolvido_sem_reparar'
  | 'em_garantia';

export type ServiceOrderPriority = 'baixa' | 'normal' | 'alta' | 'urgente';

export interface ServiceEvent {
  id: string;
  serviceOrderId: string;
  fromStatus: ServiceOrderStatus;
  toStatus: ServiceOrderStatus;
  timestamp: string;
  userId: string;
  userName: string;
  notes: string;
}

export interface ServiceOrder {
  id: string;
  visibleNumber: string; // Ex: AT-2026-00101
  customerId: string;
  equipmentId: string;
  createdAt: string;
  createdByUserId: string;
  status: ServiceOrderStatus;
  priority: ServiceOrderPriority;
  isWarranty: boolean;
  reportedFault: string;
  externalDamageState: string;
  accessoriesReceived: string; // Ex: Carregador original, Cabo de alimentação, Mala
  assignedTechnicianId?: string;
  diagnosis?: string;
  completedWork?: string;
  estimatedDeliveryDate?: string;
  closedAt?: string;
  deliveredAt?: string;
  deliveredToName?: string;
  internalNotes?: string;
  reopeningCount: number;
  approvalRecord?: {
    approvedAt: string;
    approvedByMethod: 'presencial' | 'telefone' | 'email' | 'whatsapp';
    registeredByUserId: string;
    notes?: string;
  };
}

export interface Intervention {
  id: string;
  serviceOrderId: string;
  technicianId: string;
  startDateTime: string;
  endDateTime: string;
  durationMinutes: number;
  diagnosisNotes: string;
  workDone: string;
  testResults: string;
  createdAt: string;
}

export interface ServicePart {
  id: string;
  serviceOrderId: string;
  interventionId?: string;
  articleRef: string;
  description: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  taxRate: number; // e.g. 23 for 23%
  serialOrLot?: string;
  registeredAt: string;
  registeredByUserId: string;
}

export interface CatalogPart {
  id: string;
  articleRef: string;
  description: string;
  category: string;
  unitCost: number;
  unitPrice: number;
  taxRate: number;
  stockQuantity: number;
}

export interface QuoteLine {
  id: string;
  type: 'peca' | 'mao_de_obra' | 'servico' | 'outro';
  articleRef?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  subtotal: number;
}

export type QuoteStatus = 'rascunho' | 'enviado' | 'aprovado' | 'rejeitado' | 'expirado' | 'substituido';

export interface Quote {
  id: string;
  serviceOrderId: string;
  version: number;
  visibleNumber: string; // Ex: ORC-2026-00045-v1
  status: QuoteStatus;
  lines: QuoteLine[];
  subtotal: number;
  taxTotal: number;
  total: number;
  validUntil: string;
  createdAt: string;
  createdByUserId: string;
  approval?: {
    decision: 'aprovado' | 'rejeitado';
    decidedAt: string;
    method: 'presencial' | 'telefone' | 'email' | 'whatsapp';
    registeredByUserId: string;
    notes?: string;
  };
}

export interface DocumentRecord {
  id: string;
  serviceOrderId: string;
  type: 'folha_a5' | 'etiqueta' | 'orcamento' | 'relatorio_tecnico' | 'folha_entrega';
  title: string;
  version: number;
  issuedAt: string;
  issuedByUserId: string;
  notes?: string;
}

export type BillingStatus = 'rascunho' | 'pendente_sincronizacao' | 'sincronizado' | 'erro';

export interface BillingDocument {
  id: string;
  serviceOrderId: string;
  quoteId?: string;
  externalDocNumber?: string;
  externalId?: string;
  provider: string; // Ex: "MockBilling (Dev)", "Moloni", "InvoiceXpress"
  status: BillingStatus;
  subtotal: number;
  taxTotal: number;
  total: number;
  syncedAt?: string;
  lastErrorMessage?: string;
  attemptsCount: number;
  idempotencyKey: string;
}

export interface IntegrationAttempt {
  id: string;
  billingDocId: string;
  serviceOrderVisibleNumber: string;
  operation: string;
  timestamp: string;
  success: boolean;
  httpStatus?: number;
  message: string;
  payloadPreview: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
}

export interface AppSettings {
  brandName?: string; // "FSYS360"
  commercialName?: string; // "FSYS360 Service"
  brandDescription?: string; // "Gestão de Assistências Técnicas"
  companyName: string;
  legalName: string;
  taxNumber: string; // NIF
  address: string;
  postalCode: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  defaultVatRate: number; // 23
  defaultWarrantyDays: number; // 90
  a5MarginsMm: number; // 8
  currencySymbol: string; // "€"
  termsAndConditions: string;
}
