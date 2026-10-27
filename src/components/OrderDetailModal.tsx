import React, { useState } from 'react';
import {
  X,
  Printer,
  Clock,
  Wrench,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Send,
  Plus,
  Trash2,
  UserCheck,
  Building,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  History,
  Tag,
  Mail,
  Copy,
  Check
} from 'lucide-react';
import {
  Customer,
  Equipment,
  Intervention,
  Quote,
  QuoteLine,
  ServiceOrder,
  ServiceOrderStatus,
  ServicePart
} from '../types';
import { DataStore } from '../services/storage';
import { billingService } from '../services/billing';
import { EmailService } from '../services/emailService';
import { StatusBadge, PriorityBadge } from './StatusBadge';

interface OrderDetailModalProps {
  order: ServiceOrder;
  onClose: () => void;
  onUpdate: () => void;
  onOpenPdf: (order: ServiceOrder, type?: 'folha_a5' | 'etiqueta' | 'folha_entrega' | 'orcamento', quote?: Quote) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  onClose,
  onUpdate,
  onOpenPdf,
}) => {
  const currentUser = DataStore.getCurrentUser();
  const customer = DataStore.getCustomerById(order.customerId);
  const equipment = DataStore.getEquipmentById(order.equipmentId);
  const settings = DataStore.getSettings();
  const events = DataStore.getServiceEvents(order.id);
  const interventions = DataStore.getInterventions(order.id);
  const parts = DataStore.getServiceParts(order.id);
  const quotes = DataStore.getQuotes(order.id);
  const documents = DataStore.getDocuments(order.id);
  const catalog = DataStore.getCatalog();
  const billingDocs = DataStore.getBillingDocuments().filter(b => b.serviceOrderId === order.id);

  // Tabs
  const [activeTab, setActiveTab] = useState<
    'resumo' | 'intervencoes' | 'pecas' | 'orcamento' | 'documentos' | 'faturacao' | 'auditoria'
  >('resumo');

  // Change Status State
  const [newStatus, setNewStatus] = useState<ServiceOrderStatus>(order.status);
  const [statusComment, setStatusComment] = useState<string>('');
  const [statusSuccessMessage, setStatusSuccessMessage] = useState<string>('');

  // New Intervention State
  const [showNewIntervention, setShowNewIntervention] = useState<boolean>(false);
  const [intDurationMinutes, setIntDurationMinutes] = useState<number>(60);
  const [intDiagnosis, setIntDiagnosis] = useState<string>('');
  const [intWorkDone, setIntWorkDone] = useState<string>('');
  const [intTests, setIntTests] = useState<string>('Testes de stress normais OK.');

  // Add Part State
  const [showAddPart, setShowAddPart] = useState<boolean>(false);
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>(catalog[0]?.id || '');
  const [partQty, setPartQty] = useState<number>(1);
  const [partCustomDesc, setPartCustomDesc] = useState<string>('');
  const [partCustomPrice, setPartCustomPrice] = useState<number>(35.0);

  // New Quote State
  const [showNewQuote, setShowNewQuote] = useState<boolean>(false);
  const [quoteLines, setQuoteLines] = useState<QuoteLine[]>([
    {
      id: 'ql_new_1',
      type: 'mao_de_obra',
      description: 'Mão de Obra Técnica Especializada',
      quantity: 1,
      unitPrice: 38.0,
      taxRate: 23,
      subtotal: 38.0,
    },
  ]);
  const [autoOpenEmail, setAutoOpenEmail] = useState<boolean>(true);
  const [quoteActionMessage, setQuoteActionMessage] = useState<string>('');

  // Approval registration
  const [approvalMethod, setApprovalMethod] = useState<'telefone' | 'email' | 'presencial' | 'whatsapp'>('telefone');
  const [approvalNotes, setApprovalNotes] = useState<string>('Cliente aprovou o valor por telefone');

  // Billing sync state
  const [isSyncingBilling, setIsSyncingBilling] = useState<boolean>(false);
  const [billingResultMsg, setBillingResultMsg] = useState<string>('');

  // Delivery confirmation
  const [deliveredToInput, setDeliveredToInput] = useState<string>(customer?.name || '');

  const handleStatusChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStatus === order.status) return;

    DataStore.updateOrderStatus(order.id, newStatus, statusComment, currentUser.id, currentUser.name);
    setStatusSuccessMessage(`Estado alterado para ${newStatus} com sucesso.`);
    setStatusComment('');
    onUpdate();
    setTimeout(() => setStatusSuccessMessage(''), 3000);
  };

  const handleAddIntervention = (e: React.FormEvent) => {
    e.preventDefault();
    if (!intWorkDone.trim()) return;

    const now = new Date();
    const start = new Date(now.getTime() - intDurationMinutes * 60000);

    DataStore.saveIntervention(
      {
        id: '',
        serviceOrderId: order.id,
        technicianId: currentUser.id,
        startDateTime: start.toISOString(),
        endDateTime: now.toISOString(),
        durationMinutes: intDurationMinutes,
        diagnosisNotes: intDiagnosis.trim(),
        workDone: intWorkDone.trim(),
        testResults: intTests.trim(),
        createdAt: now.toISOString(),
      },
      currentUser.id,
      currentUser.name
    );

    // If order was in diagnosis or approved, transition or update diagnosis
    if (intDiagnosis.trim() && !order.diagnosis) {
      order.diagnosis = intDiagnosis.trim();
      DataStore.saveServiceOrder(order, currentUser.id, currentUser.name);
    }

    setShowNewIntervention(false);
    setIntDiagnosis('');
    setIntWorkDone('');
    onUpdate();
  };

  const handleAddPart = (e: React.FormEvent) => {
    e.preventDefault();
    const catItem = catalog.find(c => c.id === selectedCatalogId);

    if (catItem) {
      DataStore.addServicePart(
        {
          id: '',
          serviceOrderId: order.id,
          articleRef: catItem.articleRef,
          description: catItem.description,
          quantity: partQty,
          unitCost: catItem.unitCost,
          unitPrice: catItem.unitPrice,
          taxRate: catItem.taxRate,
          registeredAt: new Date().toISOString(),
          registeredByUserId: currentUser.id,
        },
        currentUser.id,
        currentUser.name
      );
    } else if (partCustomDesc.trim()) {
      DataStore.addServicePart(
        {
          id: '',
          serviceOrderId: order.id,
          articleRef: 'ART-AVULSO',
          description: partCustomDesc.trim(),
          quantity: partQty,
          unitCost: 0,
          unitPrice: partCustomPrice,
          taxRate: 23,
          registeredAt: new Date().toISOString(),
          registeredByUserId: currentUser.id,
        },
        currentUser.id,
        currentUser.name
      );
    }

    setShowAddPart(false);
    setPartQty(1);
    onUpdate();
  };

  const handleRemovePart = (partId: string) => {
    DataStore.removeServicePart(partId, currentUser.id, currentUser.name);
    onUpdate();
  };

  const handleCreateQuote = (e: React.FormEvent) => {
    e.preventDefault();
    let subtotal = 0;
    let taxTotal = 0;

    quoteLines.forEach(l => {
      subtotal += l.quantity * l.unitPrice;
      taxTotal += l.quantity * l.unitPrice * (l.taxRate / 100);
    });

    const version = quotes.length + 1;
    const newQuote: Quote = {
      id: '',
      serviceOrderId: order.id,
      version,
      visibleNumber: `ORC-2026-${order.visibleNumber.replace('AT-2026-', '')}-v${version}`,
      status: 'enviado',
      lines: quoteLines,
      subtotal,
      taxTotal,
      total: subtotal + taxTotal,
      validUntil: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      createdByUserId: currentUser.id,
    };

    const saved = DataStore.saveQuote(
      newQuote,
      currentUser.id,
      currentUser.name
    );

    // Auto update status to 'aguarda_aprovacao'
    DataStore.updateOrderStatus(
      order.id,
      'aguarda_aprovacao',
      `Orçamento de ${(subtotal + taxTotal).toFixed(2)}€ emitido e enviado ao cliente.`,
      currentUser.id,
      currentUser.name
    );

    if (autoOpenEmail && customer?.email) {
      EmailService.openQuoteEmailClient(order, saved, customer, equipment, settings);
      setQuoteActionMessage(`Orçamento emitido com sucesso! O cliente de email foi aberto com proposta para ${customer.email}.`);
    } else if (customer?.email) {
      setQuoteActionMessage(`Orçamento emitido com sucesso (Email do cliente: ${customer.email}).`);
    } else {
      setQuoteActionMessage('Orçamento emitido com sucesso. (Nota: O cliente não tem email registado).');
    }
    setTimeout(() => setQuoteActionMessage(''), 5000);

    setShowNewQuote(false);
    onUpdate();
  };

  const handleApproveQuote = (quote: Quote, decision: 'aprovado' | 'rejeitado') => {
    quote.status = decision;
    quote.approval = {
      decision,
      decidedAt: new Date().toISOString(),
      method: approvalMethod,
      registeredByUserId: currentUser.id,
      notes: approvalNotes,
    };

    DataStore.saveQuote(quote, currentUser.id, currentUser.name);

    if (decision === 'aprovado') {
      DataStore.updateOrderStatus(
        order.id,
        'aprovado_em_reparacao',
        `Orçamento ${quote.visibleNumber} aprovado pelo cliente via ${approvalMethod}.`,
        currentUser.id,
        currentUser.name
      );
    } else {
      DataStore.updateOrderStatus(
        order.id,
        'sem_reparacao',
        `Orçamento ${quote.visibleNumber} rejeitado pelo cliente via ${approvalMethod}.`,
        currentUser.id,
        currentUser.name
      );
    }

    onUpdate();
  };

  const handleSyncBilling = async () => {
    if (!customer) return;
    setIsSyncingBilling(true);
    setBillingResultMsg('');

    try {
      const activeQuote = quotes.find(q => q.status === 'aprovado') || quotes[0];
      const payload = billingService.prepareCommercialPayload(order, customer, parts, activeQuote);
      const res = await billingService.syncDocument(payload);

      // Record in store
      DataStore.saveBillingDocument({
        id: `bill_${Date.now()}`,
        serviceOrderId: order.id,
        quoteId: activeQuote?.id,
        provider: billingService.providerName,
        status: res.success ? 'sincronizado' : 'erro',
        externalDocNumber: res.externalDocNumber,
        externalId: res.externalId,
        subtotal: payload.subtotal,
        taxTotal: payload.taxTotal,
        total: payload.total,
        syncedAt: res.syncedAt,
        lastErrorMessage: res.success ? undefined : res.message,
        attemptsCount: 1,
        idempotencyKey: payload.idempotencyKey,
      });

      DataStore.addIntegrationLog({
        billingDocId: `bill_${Date.now()}`,
        serviceOrderVisibleNumber: order.visibleNumber,
        operation: 'SYNC_BILLING_DOCUMENT',
        timestamp: res.syncedAt,
        success: res.success,
        httpStatus: res.httpStatus,
        message: res.message,
        payloadPreview: JSON.stringify(payload).substring(0, 150) + '...',
      });

      setBillingResultMsg(res.message);
      onUpdate();
    } catch (e: any) {
      setBillingResultMsg('Erro de integração: ' + e.message);
    } finally {
      setIsSyncingBilling(false);
    }
  };

  const handleMarkAsDelivered = () => {
    order.deliveredToName = deliveredToInput;
    order.deliveredAt = new Date().toISOString();
    order.closedAt = new Date().toISOString();
    DataStore.updateOrderStatus(
      order.id,
      'entregue_fechado',
      `Equipamento entregue a ${deliveredToInput}. Assistência concluída.`,
      currentUser.id,
      currentUser.name
    );
    onUpdate();
  };

  const totalPartsAmount = parts.reduce(
    (sum, p) => sum + p.quantity * p.unitPrice * (1 + p.taxRate / 100),
    0
  );
  const totalInterventionMinutes = interventions.reduce((sum, i) => sum + i.durationMinutes, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-2 sm:p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[96vh] sm:max-h-[94vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3.5 sm:px-6 py-2.5 sm:py-3.5 border-b border-slate-200 bg-slate-50 gap-2.5">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
            <span className="text-lg sm:text-xl font-mono font-bold text-slate-900">{order.visibleNumber}</span>
            <StatusBadge status={order.status} />
            <div className="text-xs text-slate-600 flex items-center gap-1">
              <span className="hidden sm:inline text-slate-300">|</span>
              <span>Prioridade:</span>
              <PriorityBadge priority={order.priority} />
            </div>
            {order.isWarranty && (
              <span className="text-[10px] sm:text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Garantia
              </span>
            )}
          </div>

          <div className="flex items-center justify-end gap-1.5 sm:gap-2 w-full sm:w-auto">
            <button
              onClick={() => onOpenPdf(order, 'folha_a5')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden xs:inline sm:inline">Imprimir </span>Folha A5
            </button>
            <button
              onClick={() => onOpenPdf(order, 'etiqueta')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              <Tag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Etiqueta</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors ml-1"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-3 sm:px-6 bg-white border-b border-slate-200 overflow-x-auto text-xs font-medium text-slate-600 scrollbar-none">
          <button
            onClick={() => setActiveTab('resumo')}
            className={`py-3 px-3 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'resumo'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Resumo & Estado
          </button>
          <button
            onClick={() => setActiveTab('intervencoes')}
            className={`py-3 px-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'intervencoes'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Intervenções ({interventions.length})
          </button>
          <button
            onClick={() => setActiveTab('pecas')}
            className={`py-3 px-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'pecas'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Peças Utilizadas ({parts.length})
          </button>
          <button
            onClick={() => setActiveTab('orcamento')}
            className={`py-3 px-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'orcamento'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Orçamentos ({quotes.length})
          </button>
          <button
            onClick={() => setActiveTab('documentos')}
            className={`py-3 px-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'documentos'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Documentos & A5 ({documents.length})
          </button>
          <button
            onClick={() => setActiveTab('faturacao')}
            className={`py-3 px-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'faturacao'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Faturação Externa
          </button>
          <button
            onClick={() => setActiveTab('auditoria')}
            className={`py-3 px-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'auditoria'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Histórico & Eventos ({events.length})
          </button>
        </div>

        {/* Tab Content Viewport */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6">
          {/* TAB 1: RESUMO & ESTADO */}
          {activeTab === 'resumo' && (
            <div className="space-y-6">
              {/* Quick Status Bar */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Transição de Estado Atual
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={order.status} />
                    <span className="text-xs text-slate-500">
                      Entrada em: {new Date(order.createdAt).toLocaleString('pt-PT')}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleStatusChange} className="flex flex-wrap items-center gap-2">
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as ServiceOrderStatus)}
                    className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white focus:outline-blue-600 font-medium"
                  >
                    <option value="recebido">1. Recebido</option>
                    <option value="em_diagnostico">2. Em Diagnóstico</option>
                    <option value="aguarda_aprovacao">3. Aguarda Aprovação</option>
                    <option value="aprovado_em_reparacao">4. Aprovado / Em Reparação</option>
                    <option value="aguarda_pecas">5. Aguarda Peças</option>
                    <option value="aguarda_cliente">6. Aguarda Cliente</option>
                    <option value="em_testes">7. Em Testes Finais</option>
                    <option value="pronto_levantamento">8. Pronto para Levantamento</option>
                    <option value="entregue_fechado">9. Entregue / Fechado</option>
                    <option value="sem_reparacao">10. Sem Reparação</option>
                    <option value="devolvido_sem_reparar">11. Devolvido sem Reparar</option>
                    <option value="em_garantia">12. Em Garantia</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Motivo / Nota da transição..."
                    value={statusComment}
                    onChange={e => setStatusComment(e.target.value)}
                    className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white w-48"
                  />

                  <button
                    type="submit"
                    disabled={newStatus === order.status}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-md text-xs font-medium transition-colors"
                  >
                    Mudar Estado
                  </button>
                </form>
              </div>

              {statusSuccessMessage && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {statusSuccessMessage}
                </div>
              )}

              {/* Delivery Action Card if ready for pickup */}
              {order.status === 'pronto_levantamento' && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex flex-col md:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-semibold text-emerald-900">
                        Equipamento pronto para levantamento pelo cliente!
                      </h4>
                      <p className="text-xs text-emerald-700">
                        Pode imprimir o comprovativo de entrega com a assinatura de conformidade.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Nome de quem levanta"
                      value={deliveredToInput}
                      onChange={e => setDeliveredToInput(e.target.value)}
                      className="text-xs px-2.5 py-1.5 border border-emerald-300 rounded bg-white"
                    />
                    <button
                      onClick={handleMarkAsDelivered}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-medium whitespace-nowrap"
                    >
                      Registar Entrega e Fechar
                    </button>
                    <button
                      onClick={() => onOpenPdf(order, 'folha_entrega')}
                      className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded text-xs font-medium whitespace-nowrap"
                    >
                      Folha de Entrega A5
                    </button>
                  </div>
                </div>
              )}

              {/* Client & Equipment info grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Client Box */}
                <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" />
                      Dados do Cliente
                    </span>
                    <span className="text-[11px] text-slate-400 capitalize">{customer?.type}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{customer?.name}</p>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p>Telefone: <strong className="text-slate-800">{customer?.phone}</strong></p>
                    <p>Email: {customer?.email || 'N/A'}</p>
                    <p>NIF: {customer?.taxNumber || 'Consumidor Final'}</p>
                    <p>Morada: {customer?.address}, {customer?.postalCode} {customer?.city}</p>
                  </div>
                </div>

                {/* Equipment Box */}
                <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5" />
                      Equipamento Identificado
                    </span>
                    <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {equipment?.internalTag}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    {equipment?.brand} {equipment?.model}
                  </p>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p>Categoria: <span className="uppercase font-medium">{equipment?.category}</span></p>
                    <p>Nº de Série: <strong className="text-slate-800 font-mono">{equipment?.serialNumber || 'N/A'}</strong></p>
                    <p>Especificações: {equipment?.specsDescription || 'Sem detalhes adicionais'}</p>
                    <p>Notas cosméticas: {equipment?.externalNotes || 'Sem notas'}</p>
                  </div>
                </div>
              </div>

              {/* Conditions & Fault */}
              <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block border-b border-slate-100 pb-2">
                  Condições de Entrada & Avarias
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded border border-slate-100">
                    <strong className="text-slate-700 block mb-1">Avaria Reportada pelo Cliente:</strong>
                    <p className="text-slate-900 font-medium">{order.reportedFault}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded border border-slate-100">
                    <strong className="text-slate-700 block mb-1">Estado Exterior / Danos:</strong>
                    <p className="text-slate-800">{order.externalDamageState || 'Sem danos visíveis.'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded border border-slate-100">
                    <strong className="text-slate-700 block mb-1">Acessórios Recebidos:</strong>
                    <p className="text-slate-800">{order.accessoriesReceived || 'Apenas o equipamento.'}</p>
                  </div>
                </div>

                {order.internalNotes && (
                  <div className="p-2.5 bg-amber-50/60 border border-amber-200/60 rounded text-xs text-amber-900">
                    <strong>Observações Internas da Oficina:</strong> {order.internalNotes}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: INTERVENÇÕES */}
          {activeTab === 'intervencoes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Registo de Intervenções e Tempos de Trabalho
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tempo total acumulado em bancada: <strong className="text-slate-800">{Math.floor(totalInterventionMinutes / 60)}h {totalInterventionMinutes % 60}m</strong>
                  </p>
                </div>
                <button
                  onClick={() => setShowNewIntervention(!showNewIntervention)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Registar Nova Intervenção
                </button>
              </div>

              {showNewIntervention && (
                <form onSubmit={handleAddIntervention} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                  <h4 className="text-xs font-bold text-slate-900">Nova Intervenção Técnica</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Duração (Minutos) *</label>
                      <input
                        type="number"
                        min="5"
                        step="5"
                        required
                        value={intDurationMinutes}
                        onChange={e => setIntDurationMinutes(Number(e.target.value))}
                        className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded bg-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-1">Diagnóstico / Descoberta Técnica</label>
                      <input
                        type="text"
                        value={intDiagnosis}
                        onChange={e => setIntDiagnosis(e.target.value)}
                        placeholder="Ex: Condensador em curto-circuito na linha 5V..."
                        className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Trabalho Efetuado *</label>
                    <textarea
                      required
                      rows={2}
                      value={intWorkDone}
                      onChange={e => setIntWorkDone(e.target.value)}
                      placeholder="Ex: Dessoldagem do componente danificado, limpeza com fluxo, soldagem de novo componente..."
                      className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Testes Realizados e Resultados</label>
                    <input
                      type="text"
                      value={intTests}
                      onChange={e => setIntTests(e.target.value)}
                      placeholder="Ex: 30 minutos em benchmark FurMark a 65ºC estável."
                      className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded bg-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowNewIntervention(false)}
                      className="px-3 py-1.5 border border-slate-300 text-slate-600 rounded text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-blue-600 text-white rounded text-xs font-medium"
                    >
                      Gravar Intervenção
                    </button>
                  </div>
                </form>
              )}

              {interventions.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-300 rounded-lg text-slate-500 text-xs">
                  Nenhuma intervenção técnica registada ainda para esta assistência.
                </div>
              ) : (
                <div className="space-y-3">
                  {interventions.map((intv, idx) => (
                    <div key={intv.id} className="p-4 bg-white border border-slate-200 rounded-lg space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-2">
                        <span className="font-semibold text-slate-800">
                          Intervenção #{interventions.length - idx} • Técnico: Rui Duarte
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {intv.durationMinutes} minutos ({new Date(intv.startDateTime).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })})
                        </span>
                      </div>
                      <div className="text-xs space-y-1">
                        {intv.diagnosisNotes && (
                          <p><strong className="text-slate-700">Diagnóstico:</strong> {intv.diagnosisNotes}</p>
                        )}
                        <p><strong className="text-slate-700">Trabalho Realizado:</strong> {intv.workDone}</p>
                        <p><strong className="text-slate-700">Resultado dos Testes:</strong> <span className="text-emerald-700 font-medium">{intv.testResults}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PEÇAS & SERVIÇOS */}
          {activeTab === 'pecas' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Artigos, Peças e Serviços Utilizados
                  </h3>
                  <p className="text-xs text-slate-500">
                    Retrato histórico com preços e taxas de IVA retidas no momento da aplicação
                  </p>
                </div>
                <button
                  onClick={() => setShowAddPart(!showAddPart)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Peça / Mão de Obra
                </button>
              </div>

              {showAddPart && (
                <form onSubmit={handleAddPart} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                  <h4 className="text-xs font-bold text-slate-900">Adicionar Artigo à Assistência</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-1">Selecionar do Catálogo</label>
                      <select
                        value={selectedCatalogId}
                        onChange={e => setSelectedCatalogId(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded bg-white"
                      >
                        {catalog.map(c => (
                          <option key={c.id} value={c.id}>
                            [{c.articleRef}] {c.description} — {c.unitPrice.toFixed(2)}€ (Stock: {c.stockQuantity})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Quantidade</label>
                      <input
                        type="number"
                        min="0.25"
                        step="0.25"
                        required
                        value={partQty}
                        onChange={e => setPartQty(Number(e.target.value))}
                        className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded bg-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddPart(false)}
                      className="px-3 py-1.5 border border-slate-300 text-slate-600 rounded text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-blue-600 text-white rounded text-xs font-medium"
                    >
                      Confirmar e Aplicar
                    </button>
                  </div>
                </form>
              )}

              {/* Parts Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-2.5 px-3">Referência</th>
                      <th className="py-2.5 px-3">Descrição do Artigo / Serviço</th>
                      <th className="py-2.5 px-3 text-right">Qtd</th>
                      <th className="py-2.5 px-3 text-right">Preço Unit.</th>
                      <th className="py-2.5 px-3 text-right">IVA</th>
                      <th className="py-2.5 px-3 text-right">Total c/ IVA</th>
                      <th className="py-2.5 px-3 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-6 text-slate-400">
                          Nenhuma peça ou serviço cobrável adicionado ainda.
                        </td>
                      </tr>
                    ) : (
                      parts.map(p => {
                        const totalLine = p.quantity * p.unitPrice * (1 + p.taxRate / 100);
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-3 font-mono font-medium text-slate-700">{p.articleRef}</td>
                            <td className="py-2.5 px-3 text-slate-900 font-medium">{p.description}</td>
                            <td className="py-2.5 px-3 text-right font-mono-numbers">{p.quantity}</td>
                            <td className="py-2.5 px-3 text-right font-mono-numbers">{p.unitPrice.toFixed(2)} €</td>
                            <td className="py-2.5 px-3 text-right font-mono-numbers">{p.taxRate}%</td>
                            <td className="py-2.5 px-3 text-right font-mono-numbers font-bold text-slate-900">
                              {totalLine.toFixed(2)} €
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                onClick={() => handleRemovePart(p.id)}
                                title="Remover"
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {parts.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-50 font-semibold border-t border-slate-200">
                        <td colSpan={5} className="py-2.5 px-3 text-right text-slate-700">
                          Total Geral dos Artigos e Serviços:
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-numbers text-sm text-blue-700 font-bold">
                          {totalPartsAmount.toFixed(2)} €
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ORÇAMENTOS & APROVAÇÃO */}
          {activeTab === 'orcamento' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Orçamentos de Reparação e Aprovações
                  </h3>
                  <p className="text-xs text-slate-500">
                    Controlo de versões, decisão do cliente com evidência e método de contacto
                  </p>
                </div>
                <button
                  onClick={() => setShowNewQuote(!showNewQuote)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Criar Novo Orçamento
                </button>
              </div>

              {quoteActionMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center justify-between animate-fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{quoteActionMessage}</span>
                  </div>
                  <button
                    onClick={() => setQuoteActionMessage('')}
                    className="text-emerald-700 hover:text-emerald-900 font-bold"
                  >
                    ×
                  </button>
                </div>
              )}

              {showNewQuote && (
                <form onSubmit={handleCreateQuote} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">
                      Emissão de Orçamento v{quotes.length + 1}
                    </h4>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Ref: ORC-2026-{order.visibleNumber.replace('AT-2026-', '')}-v{quotes.length + 1}
                    </span>
                  </div>

                  {/* Recipient & Email Dispatch Option */}
                  <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-lg text-xs space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="text-slate-700">
                          Destinatário:{' '}
                          <strong className="text-slate-900">{customer?.name || 'Cliente'}</strong>
                          {customer?.email ? (
                            <span className="ml-1 text-blue-700 font-mono font-medium">({customer.email})</span>
                          ) : (
                            <span className="ml-1 text-amber-700 font-medium">(⚠️ Sem email cadastrado na conta do cliente)</span>
                          )}
                        </span>
                      </div>
                      {customer?.email ? (
                        <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-700 select-none">
                          <input
                            type="checkbox"
                            checked={autoOpenEmail}
                            onChange={e => setAutoOpenEmail(e.target.checked)}
                            className="rounded text-blue-600"
                          />
                          <span>Abrir cliente de email (mailto) ao emitir</span>
                        </label>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">
                          (Pode adicionar email na ficha do cliente para envio direto)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {quoteLines.map((line, idx) => (
                      <div key={line.id} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-6">
                          <input
                            type="text"
                            required
                            placeholder="Descrição do serviço / peça"
                            value={line.description}
                            onChange={e => {
                              const updated = [...quoteLines];
                              updated[idx].description = e.target.value;
                              setQuoteLines(updated);
                            }}
                            className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            min="1"
                            placeholder="Qtd"
                            value={line.quantity}
                            onChange={e => {
                              const updated = [...quoteLines];
                              updated[idx].quantity = Number(e.target.value);
                              setQuoteLines(updated);
                            }}
                            className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white text-right"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Preço Unit. €"
                            value={line.unitPrice}
                            onChange={e => {
                              const updated = [...quoteLines];
                              updated[idx].unitPrice = Number(e.target.value);
                              setQuoteLines(updated);
                            }}
                            className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white text-right"
                          />
                        </div>
                        <div className="col-span-1 text-center">
                          {quoteLines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setQuoteLines(quoteLines.filter((_, i) => i !== idx))}
                              className="text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setQuoteLines([
                        ...quoteLines,
                        {
                          id: `ql_${Date.now()}`,
                          type: 'peca',
                          description: '',
                          quantity: 1,
                          unitPrice: 20,
                          taxRate: 23,
                          subtotal: 20,
                        },
                      ])
                    }
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                  >
                    + Adicionar Linha ao Orçamento
                  </button>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setShowNewQuote(false)}
                      className="px-3 py-1.5 border border-slate-300 text-slate-600 rounded text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Emitir Orçamento & Enviar
                    </button>
                  </div>
                </form>
              )}

              {quotes.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-300 rounded-lg text-slate-500 text-xs">
                  Nenhum orçamento emitido ainda para esta assistência.
                </div>
              ) : (
                <div className="space-y-4">
                  {quotes.map(q => (
                    <div key={q.id} className="p-4 bg-white border border-slate-200 rounded-lg space-y-3 shadow-xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 text-sm">{q.visibleNumber}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                              q.status === 'aprovado'
                                ? 'bg-emerald-50 text-emerald-700'
                                : q.status === 'rejeitado'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {q.status}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          Válido até: {q.validUntil}
                        </span>
                      </div>

                      <div className="divide-y divide-slate-100 text-xs">
                        {q.lines.map((l, i) => (
                          <div key={i} className="py-1.5 flex justify-between items-center text-slate-700">
                            <span>
                              {l.description} (x{l.quantity})
                            </span>
                            <span className="font-mono font-medium">
                              {(l.quantity * l.unitPrice).toFixed(2)} €
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
                        <span className="text-slate-500">
                          Subtotal: {q.subtotal.toFixed(2)}€ | IVA (23%): {q.taxTotal.toFixed(2)}€
                        </span>
                        <span className="text-sm font-bold font-mono text-slate-900">
                          Total: {q.total.toFixed(2)} €
                        </span>
                      </div>

                      {/* Quick Communication & PDF Actions */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            if (customer) {
                              const opened = EmailService.openQuoteEmailClient(order, q, customer, equipment, settings);
                              if (opened) {
                                setQuoteActionMessage(`Aplicação de email aberta com o orçamento preparado para ${customer.email}.`);
                              } else {
                                setQuoteActionMessage('Aviso: O cliente não tem endereço de email registado.');
                              }
                              setTimeout(() => setQuoteActionMessage(''), 4500);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors"
                          title={customer?.email ? `Enviar email para ${customer.email}` : 'Cliente sem email registado'}
                        >
                          <Mail className="w-3.5 h-3.5 text-blue-600" />
                          Enviar p/ Email {customer?.email ? `(${customer.email})` : '(Sem email)'}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (customer) {
                              const body = EmailService.buildQuoteEmailBody(order, q, customer, equipment, settings);
                              navigator.clipboard.writeText(body);
                              setQuoteActionMessage('Texto completo do email de orçamento copiado para a área de transferência!');
                              setTimeout(() => setQuoteActionMessage(''), 4000);
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-md border border-slate-300 transition-colors"
                          title="Copiar texto formatado do orçamento"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Copiar Mensagem
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenPdf(order, 'orcamento', q)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-md border border-slate-300 transition-colors"
                          title="Visualizar e Imprimir proposta formal de orçamento em PDF"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          Ver / Imprimir PDF
                        </button>
                      </div>

                      {/* Approval Box */}
                      {q.status === 'enviado' && (
                        <div className="p-3 bg-amber-50/60 border border-amber-200 rounded text-xs space-y-2">
                          <strong className="text-amber-900 block">
                            Registar Decisão do Cliente:
                          </strong>
                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              value={approvalMethod}
                              onChange={e => setApprovalMethod(e.target.value as any)}
                              className="px-2 py-1 border border-slate-300 rounded bg-white"
                            >
                              <option value="telefone">Via Telefone</option>
                              <option value="email">Via Email</option>
                              <option value="presencial">Presencial no Balcão</option>
                              <option value="whatsapp">Via WhatsApp</option>
                            </select>
                            <input
                              type="text"
                              value={approvalNotes}
                              onChange={e => setApprovalNotes(e.target.value)}
                              placeholder="Notas da decisão..."
                              className="px-2 py-1 border border-slate-300 rounded bg-white flex-1 min-w-[200px]"
                            />
                            <button
                              onClick={() => handleApproveQuote(q, 'aprovado')}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium"
                            >
                              Aprovar
                            </button>
                            <button
                              onClick={() => handleApproveQuote(q, 'rejeitado')}
                              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium"
                            >
                              Rejeitar
                            </button>
                          </div>
                        </div>
                      )}

                      {q.approval && (
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 flex items-center justify-between">
                          <span>
                            Decisão: <strong className="text-slate-800 capitalize">{q.approval.decision}</strong> em {new Date(q.approval.decidedAt).toLocaleString('pt-PT')} via {q.approval.method}
                          </span>
                          <span className="text-slate-500 italic">{q.approval.notes}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: DOCUMENTOS & IMPRESSÃO A5 */}
          {activeTab === 'documentos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Arquivo de Documentos e Emissões Físicas
                  </h3>
                  <p className="text-xs text-slate-500">
                    Histórico reproduzível de versões emitidas. Cada reimpressão mantém o número e rastreabilidade.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenPdf(order, 'folha_a5')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Abrir / Imprimir Folha A5
                  </button>
                  <button
                    onClick={() => onOpenPdf(order, 'etiqueta')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    Etiqueta
                  </button>
                  <button
                    onClick={() => onOpenPdf(order, 'folha_entrega')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Comprovativo Entrega
                  </button>
                </div>
              </div>

              {/* Physical A5 Compliance Card */}
              <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-lg text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold text-blue-900">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Especificação Física da Folha de Assistência Técnica (A5 ISO 216)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-slate-600 pt-1">
                  <div>• Dimensões: <strong>148 × 210 mm</strong></div>
                  <div>• Orientação: <strong>Retrato (Portrait)</strong></div>
                  <div>• Margem: <strong>8 mm segura</strong></div>
                  <div>• Monocromático: <strong>Alto contraste</strong></div>
                </div>
              </div>

              {/* Documents History Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-2.5 px-3">Tipo de Documento</th>
                      <th className="py-2.5 px-3">Versão</th>
                      <th className="py-2.5 px-3">Data / Hora de Emissão</th>
                      <th className="py-2.5 px-3">Operador</th>
                      <th className="py-2.5 px-3">Observações</th>
                      <th className="py-2.5 px-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {documents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-slate-400">
                          Nenhum documento emitido até ao momento.
                        </td>
                      </tr>
                    ) : (
                      documents.map(d => (
                        <tr key={d.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3 font-semibold text-slate-900 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            {d.title}
                          </td>
                          <td className="py-2.5 px-3 font-mono">v{d.version}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">
                            {new Date(d.issuedAt).toLocaleString('pt-PT')}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">Ana Silva</td>
                          <td className="py-2.5 px-3 text-slate-500 italic">{d.notes}</td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => onOpenPdf(order, d.type as any)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Visualizar
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: FATURAÇÃO EXTERNA */}
          {activeTab === 'faturacao' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Integração com Software de Faturação Externo
                  </h3>
                  <p className="text-xs text-slate-500">
                    Camada de integração isolada (BillingProvider). Não duplica números fiscais nem substitui o sistema certificado.
                  </p>
                </div>
                <button
                  onClick={handleSyncBilling}
                  disabled={isSyncingBilling}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingBilling ? 'animate-spin' : ''}`} />
                  {isSyncingBilling ? 'A sincronizar...' : 'Sincronizar Documento Comercial'}
                </button>
              </div>

              {billingResultMsg && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
                  {billingResultMsg}
                </div>
              )}

              {/* Status and Idempotency Notice */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                  <strong className="text-slate-800 block">Adaptador em Utilização:</strong>
                  <p className="text-slate-600">
                    Fornecedor: <span className="font-semibold">{billingService.providerName}</span>
                  </p>
                  <p className="text-slate-600">
                    Ambiente: <span className="text-amber-600 font-medium">Desenvolvimento / Sandbox Isolado</span>
                  </p>
                  <p className="text-slate-600">
                    Chave de Idempotência: <span className="font-mono text-slate-800">IDEMP-{order.visibleNumber}-{order.id}</span>
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                  <strong className="text-slate-800 block">Resumo Comercial para Faturação:</strong>
                  <p className="text-slate-600">
                    Cliente a faturar: <span className="font-semibold">{customer?.name} (NIF: {customer?.taxNumber || '999999990'})</span>
                  </p>
                  <p className="text-slate-600">
                    Total discriminado: <span className="font-mono font-bold text-slate-900">{totalPartsAmount.toFixed(2)} €</span>
                  </p>
                  <p className="text-slate-500 italic">
                    Garante que não existem documentos duplicados em caso de retransmissão de rede.
                  </p>
                </div>
              </div>

              {/* Billing Records Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-2.5 px-3">Nº Documento Externo</th>
                      <th className="py-2.5 px-3">ID Remoto</th>
                      <th className="py-2.5 px-3">Estado</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                      <th className="py-2.5 px-3">Data Sincronização</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {billingDocs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-slate-400">
                          Nenhum documento sincronizado com software externo até ao momento.
                        </td>
                      </tr>
                    ) : (
                      billingDocs.map(b => (
                        <tr key={b.id}>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                            {b.externalDocNumber || 'Rascunho Pendente'}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">{b.externalId || '—'}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                b.status === 'sincronizado'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold">{b.total.toFixed(2)} €</td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">
                            {b.syncedAt ? new Date(b.syncedAt).toLocaleString('pt-PT') : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: HISTÓRICO & AUDITORIA */}
          {activeTab === 'auditoria' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Registo de Eventos e Trilha de Auditoria
              </h3>

              <div className="space-y-3">
                {events.map(ev => (
                  <div key={ev.id} className="p-3 bg-white border border-slate-200 rounded-lg flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <div className="flex-1 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">
                          {ev.fromStatus} → <span className="text-blue-600">{ev.toStatus}</span>
                        </span>
                        <span className="text-slate-400 font-mono">
                          {new Date(ev.timestamp).toLocaleString('pt-PT')}
                        </span>
                      </div>
                      <p className="text-slate-600">{ev.notes}</p>
                      <p className="text-[11px] text-slate-400">Operador: {ev.userName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
