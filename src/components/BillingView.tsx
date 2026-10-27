import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, ExternalLink, ShieldCheck, Code, ArrowRight } from 'lucide-react';
import { BillingDocument, IntegrationAttempt, ServiceOrder } from '../types';
import { DataStore } from '../services/storage';
import { billingService } from '../services/billing';

interface BillingViewProps {
  onOpenOrder: (order: ServiceOrder) => void;
}

export const BillingView: React.FC<BillingViewProps> = ({ onOpenOrder }) => {
  const billingDocs = DataStore.getBillingDocuments();
  const integrationLogs = DataStore.getIntegrationLogs();
  const orders = DataStore.getServiceOrders();
  const customers = DataStore.getCustomers();

  const [activeTab, setActiveTab] = useState<'documentos' | 'tentativas' | 'especificacao'>('documentos');
  const [selectedPayloadLog, setSelectedPayloadLog] = useState<IntegrationAttempt | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Integração de Faturação Externa</h2>
          <p className="text-xs text-slate-500">
            Interface independente do fornecedor (`BillingProvider`), com proteção de idempotência e registo de tentativas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded font-medium">
            Adaptador Ativo: {billingService.providerName} (Modo Seguro)
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-medium">
        <button
          onClick={() => setActiveTab('documentos')}
          className={`py-2 px-3 border-b-2 transition-colors ${
            activeTab === 'documentos'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Documentos Sincronizados ({billingDocs.length})
        </button>
        <button
          onClick={() => setActiveTab('tentativas')}
          className={`py-2 px-3 border-b-2 transition-colors ${
            activeTab === 'tentativas'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Registo de Tentativas & Logs ({integrationLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('especificacao')}
          className={`py-2 px-3 border-b-2 transition-colors ${
            activeTab === 'especificacao'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Contrato de Integração da API
        </button>
      </div>

      {/* TAB 1: DOCUMENTOS */}
      {activeTab === 'documentos' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Assistência SAT</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Referência Externa</th>
                  <th className="py-3 px-4">ID Remoto</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Total Comercial</th>
                  <th className="py-3 px-4">Data Sincronização</th>
                  <th className="py-3 px-4">Chave de Idempotência</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {billingDocs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">
                      Nenhum documento sincronizado com software externo até ao momento.
                    </td>
                  </tr>
                ) : (
                  billingDocs.map(doc => {
                    const parentOrder = orders.find(o => o.id === doc.serviceOrderId);
                    const cust = parentOrder ? customers.find(c => c.id === parentOrder.customerId) : null;

                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono font-bold text-blue-600">
                          {parentOrder?.visibleNumber || 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {cust?.name || '—'}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {doc.externalDocNumber || 'Rascunho Pendente'}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {doc.externalId || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              doc.status === 'sincronizado'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {doc.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {doc.total.toFixed(2)} €
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {doc.syncedAt ? new Date(doc.syncedAt).toLocaleString('pt-PT') : '—'}
                        </td>
                        <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                          {doc.idempotencyKey}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TENTATIVAS E AUDITORIA DE REDE */}
      {activeTab === 'tentativas' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-4">Operação</th>
                  <th className="py-3 px-4">Ordem Técnica</th>
                  <th className="py-3 px-4">Resultado</th>
                  <th className="py-3 px-4">Mensagem de Resposta da API</th>
                  <th className="py-3 px-4 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {integrationLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {new Date(log.timestamp).toLocaleString('pt-PT')}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">
                      {log.operation}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      {log.serviceOrderVisibleNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          log.success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        HTTP {log.httpStatus || 200} ({log.success ? 'OK' : 'FALHA'})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-sm truncate" title={log.message}>
                      {log.message}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedPayloadLog(log)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-[11px]"
                      >
                        Ver JSON
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ESPECIFICAÇÃO TÉCNICA */}
      {activeTab === 'especificacao' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Arquitetura de Integração com Faturação Certificada (Portaria nº 363/2010 / AT)
            </h3>
          </div>

          <p className="text-slate-600 leading-relaxed">
            A aplicação SAT não substitui nem duplica o software de faturação certificado pela Autoridade Tributária. Foi concebida com uma interface isolada <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold">BillingProvider</code> que prepara e sincroniza os dados comerciais de forma idempotente.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <strong className="text-slate-800 block text-xs">Métodos Obrigatórios da Interface:</strong>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li><code className="font-mono">findOrMapCustomer(customer)</code>: pesquisa por NIF e obtém o identificador interno da entidade externa.</li>
                <li><code className="font-mono">prepareCommercialPayload(order, customer, parts, quote)</code>: converte serviços e peças em linhas faturáveis com as devidas taxas de IVA.</li>
                <li><code className="font-mono">syncDocument(payload)</code>: envia com cabeçalho de Idempotência para prevenir duplicação de documentos fiscais.</li>
                <li><code className="font-mono">checkDocumentStatus(externalId)</code>: consulta o estado atual no ERP externo.</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <strong className="text-slate-800 block text-xs">Regras de Segurança & Idempotência:</strong>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>A chave de idempotência é composta pelo número visível da assistência e ID imutável.</li>
                <li>Se um pedido falhar por timeout de rede, a repetição com a mesma chave devolve o documento já emitido sem gerar segunda fatura.</li>
                <li>As credenciais da API externa ficam guardadas em variáveis de ambiente confidenciais no servidor.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Payload Modal */}
      {selectedPayloadLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Payload da Operação {selectedPayloadLog.operation}
              </h3>
              <button onClick={() => setSelectedPayloadLog(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            <div className="bg-slate-900 text-emerald-400 p-4 rounded-lg font-mono text-[11px] overflow-x-auto max-h-80">
              <pre>{selectedPayloadLog.payloadPreview}</pre>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedPayloadLog(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded text-xs font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
