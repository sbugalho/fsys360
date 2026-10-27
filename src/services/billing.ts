import { BillingDocument, Customer, Quote, ServiceOrder, ServicePart } from '../types';
import { DataStore } from './storage';

export interface ExternalCustomerMapping {
  externalCustomerId: string;
  taxNumber: string;
  name: string;
  alreadyExistsInBilling: boolean;
}

export interface BillingDocumentPayload {
  serviceOrderVisibleNumber: string;
  serviceOrderId: string;
  quoteId?: string;
  customerName: string;
  customerTaxNumber?: string;
  customerAddress?: string;
  lines: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    subtotal: number;
  }>;
  subtotal: number;
  taxTotal: number;
  total: number;
  idempotencyKey: string;
}

export interface BillingSyncResponse {
  success: boolean;
  externalDocNumber?: string;
  externalId?: string;
  httpStatus: number;
  message: string;
  syncedAt: string;
}

/**
 * Vendor-independent interface for external ERP/Billing integration
 * (e.g., Moloni, InvoiceXpress, PHC, Primavera, Jasmin, etc.)
 */
export interface BillingProvider {
  readonly providerName: string;
  readonly isDevelopmentAdapter: boolean;

  findOrMapCustomer(customer: Customer): Promise<ExternalCustomerMapping>;
  prepareCommercialPayload(order: ServiceOrder, customer: Customer, parts: ServicePart[], quote?: Quote): BillingDocumentPayload;
  syncDocument(payload: BillingDocumentPayload): Promise<BillingSyncResponse>;
  checkDocumentStatus(externalId: string): Promise<{ status: string; total: number }>;
}

/**
 * Safe development adapter clearly marked as non-production mock.
 * Demonstrates the full integration lifecycle, idempotency protection,
 * failure handling, and retry mechanics without emitting real tax documents.
 */
export class DevMockBillingProvider implements BillingProvider {
  readonly providerName = 'MockBilling (Dev Adapter)';
  readonly isDevelopmentAdapter = true;

  async findOrMapCustomer(customer: Customer): Promise<ExternalCustomerMapping> {
    // Simulate API round-trip
    await new Promise(r => setTimeout(r, 400));
    return {
      externalCustomerId: `EXT-CUST-${customer.taxNumber || '999999990'}`,
      taxNumber: customer.taxNumber || '999999990',
      name: customer.name,
      alreadyExistsInBilling: !!customer.taxNumber,
    };
  }

  prepareCommercialPayload(
    order: ServiceOrder,
    customer: Customer,
    parts: ServicePart[],
    quote?: Quote
  ): BillingDocumentPayload {
    const idempotencyKey = `IDEMP-${order.visibleNumber}-${order.id}`;

    if (quote && quote.lines.length > 0) {
      return {
        serviceOrderId: order.id,
        serviceOrderVisibleNumber: order.visibleNumber,
        quoteId: quote.id,
        customerName: customer.name,
        customerTaxNumber: customer.taxNumber,
        customerAddress: `${customer.address}, ${customer.postalCode} ${customer.city}`,
        lines: quote.lines.map(l => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxRate: l.taxRate,
          subtotal: l.subtotal,
        })),
        subtotal: quote.subtotal,
        taxTotal: quote.taxTotal,
        total: quote.total,
        idempotencyKey,
      };
    }

    // Otherwise compile from service parts and applied labor
    let subtotal = 0;
    let taxTotal = 0;
    const lines = parts.map(p => {
      const lineSubtotal = p.quantity * p.unitPrice;
      const lineTax = lineSubtotal * (p.taxRate / 100);
      subtotal += lineSubtotal;
      taxTotal += lineTax;
      return {
        description: p.description,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        taxRate: p.taxRate,
        subtotal: lineSubtotal,
      };
    });

    return {
      serviceOrderId: order.id,
      serviceOrderVisibleNumber: order.visibleNumber,
      customerName: customer.name,
      customerTaxNumber: customer.taxNumber,
      customerAddress: `${customer.address}, ${customer.postalCode} ${customer.city}`,
      lines,
      subtotal,
      taxTotal,
      total: subtotal + taxTotal,
      idempotencyKey,
    };
  }

  async syncDocument(payload: BillingDocumentPayload): Promise<BillingSyncResponse> {
    // Check for idempotency: if already synced with same idempotency key, return existing record
    const existing = DataStore.getBillingDocuments().find(
      d => d.idempotencyKey === payload.idempotencyKey && d.status === 'sincronizado'
    );

    if (existing) {
      return {
        success: true,
        externalDocNumber: existing.externalDocNumber,
        externalId: existing.externalId,
        httpStatus: 200,
        message: `[IDEMPOTÊNCIA] O documento para a assistência ${payload.serviceOrderVisibleNumber} já se encontra registado sob ${existing.externalDocNumber}. Nenhuma duplicação criada.`,
        syncedAt: existing.syncedAt || new Date().toISOString(),
      };
    }

    // Simulate network delay
    await new Promise(r => setTimeout(r, 600));

    // Simulate validation
    if (!payload.lines || payload.lines.length === 0) {
      return {
        success: false,
        httpStatus: 400,
        message: 'Falha de validação comercial: Não existem linhas de peças ou mão de obra para faturar.',
        syncedAt: new Date().toISOString(),
      };
    }

    // Simulated successful generation in external software
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const generatedDocNumber = `FT 2026/${randomSeq}`;
    const generatedExternalId = `EXT-MOCK-${randomSeq}`;

    return {
      success: true,
      externalDocNumber: generatedDocNumber,
      externalId: generatedExternalId,
      httpStatus: 201,
      message: `Documento rascunho criado com sucesso no software externo sob ${generatedDocNumber}.`,
      syncedAt: new Date().toISOString(),
    };
  }

  async checkDocumentStatus(externalId: string): Promise<{ status: string; total: number }> {
    await new Promise(r => setTimeout(r, 300));
    return {
      status: 'EMITIDO_EXTERNO',
      total: 100.0,
    };
  }
}

export const billingService = new DevMockBillingProvider();
