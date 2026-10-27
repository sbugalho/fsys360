import React, { useEffect, useState, useMemo } from 'react';
import { Download, Printer, X, CheckCircle2, FileText, Tag, Truck } from 'lucide-react';
import { Customer, Equipment, Quote, ServiceOrder, ServicePart } from '../types';
import { DataStore } from '../services/storage';
import { PdfService } from '../services/pdfGenerator';

interface PdfPreviewModalProps {
  order: ServiceOrder;
  customer?: Customer;
  equipment?: Equipment;
  quote?: Quote;
  documentType?: 'folha_a5' | 'etiqueta' | 'folha_entrega' | 'orcamento';
  onClose: () => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  order,
  customer: propCustomer,
  equipment: propEquipment,
  quote: propQuote,
  documentType = 'folha_a5',
  onClose,
}) => {
  const [docType, setDocType] = useState<'folha_a5' | 'etiqueta' | 'folha_entrega' | 'orcamento'>(documentType);
  const [pdfDataUrl, setPdfDataUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const currentUser = DataStore.getCurrentUser();
  const settings = DataStore.getSettings();

  const customerId = order.customerId;
  const equipmentId = order.equipmentId;
  const orderId = order.id;

  const customer = useMemo(() => {
    return propCustomer || (customerId ? DataStore.getCustomerById(customerId) : undefined);
  }, [propCustomer, customerId]);

  const equipment = useMemo(() => {
    return propEquipment || (equipmentId ? DataStore.getEquipmentById(equipmentId) : undefined);
  }, [propEquipment, equipmentId]);

  const parts = useMemo(() => {
    return DataStore.getServiceParts(orderId);
  }, [orderId]);

  const quotes = useMemo(() => {
    return DataStore.getQuotes().filter(q => q.serviceOrderId === orderId);
  }, [orderId]);

  const activeQuote = propQuote || quotes[0];

  useEffect(() => {
    if (!customer || !equipment) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      let doc;
      if (docType === 'folha_a5') {
        doc = PdfService.generateA5ServiceSheet({
          order,
          customer,
          equipment,
          settings,
        });
      } else if (docType === 'etiqueta') {
        doc = PdfService.generateEquipmentTag({
          order,
          customer,
          equipment,
        });
      } else if (docType === 'orcamento' && activeQuote) {
        doc = PdfService.generateQuoteProposal({
          order,
          customer,
          equipment,
          quote: activeQuote,
          settings,
        });
      } else {
        doc = PdfService.generateDeliveryNote({
          order,
          customer,
          equipment,
          settings,
          parts,
        });
      }

      const dataUri = doc.output('datauristring');
      setPdfDataUrl(dataUri);
    } catch (e) {
      console.error('Error generating PDF:', e);
    } finally {
      setLoading(false);
    }
  }, [docType, orderId, order.status, order.createdAt, customerId, equipmentId, activeQuote]);

  const handleDownload = () => {
    if (!customer || !equipment) return;
    let doc;
    let filename = `${order.visibleNumber}_Folha_A5.pdf`;

    if (docType === 'folha_a5') {
      doc = PdfService.generateA5ServiceSheet({ order, customer, equipment, settings });
      filename = `${order.visibleNumber}_Folha_Servico_A5.pdf`;
      DataStore.recordDocument(order.id, 'folha_a5', 'Folha de Assistência Técnica A5', currentUser.id, currentUser.name);
    } else if (docType === 'etiqueta') {
      doc = PdfService.generateEquipmentTag({ order, customer, equipment });
      filename = `${order.visibleNumber}_Etiqueta.pdf`;
      DataStore.recordDocument(order.id, 'etiqueta', 'Etiqueta de Equipamento', currentUser.id, currentUser.name);
    } else if (docType === 'orcamento' && activeQuote) {
      doc = PdfService.generateQuoteProposal({ order, customer, equipment, quote: activeQuote, settings });
      filename = `${order.visibleNumber}_${activeQuote.visibleNumber}_Orcamento.pdf`;
      DataStore.recordDocument(order.id, 'orcamento', `Orçamento ${activeQuote.visibleNumber}`, currentUser.id, currentUser.name);
    } else {
      doc = PdfService.generateDeliveryNote({ order, customer, equipment, settings, parts });
      filename = `${order.visibleNumber}_Comprovativo_Entrega.pdf`;
      DataStore.recordDocument(order.id, 'folha_entrega', 'Comprovativo de Entrega', currentUser.id, currentUser.name);
    }

    doc.save(filename);
  };

  const handlePrint = () => {
    if (!customer || !equipment) return;
    let doc;
    if (docType === 'folha_a5') {
      doc = PdfService.generateA5ServiceSheet({ order, customer, equipment, settings });
      DataStore.recordDocument(order.id, 'folha_a5', 'Folha de Assistência Técnica A5', currentUser.id, currentUser.name);
    } else if (docType === 'etiqueta') {
      doc = PdfService.generateEquipmentTag({ order, customer, equipment });
    } else if (docType === 'orcamento' && activeQuote) {
      doc = PdfService.generateQuoteProposal({ order, customer, equipment, quote: activeQuote, settings });
      DataStore.recordDocument(order.id, 'orcamento', `Orçamento ${activeQuote.visibleNumber}`, currentUser.id, currentUser.name);
    } else {
      doc = PdfService.generateDeliveryNote({ order, customer, equipment, settings, parts });
      DataStore.recordDocument(order.id, 'folha_entrega', 'Comprovativo de Entrega', currentUser.id, currentUser.name);
    }

    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    const printWindow = window.open(blobUrl, '_blank');
    if (printWindow) {
      printWindow.focus();
    }
  };

  if (!customer || !equipment) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <p className="text-rose-600">Erro: Não foi possível carregar os dados de cliente ou equipamento.</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-900 text-white rounded text-sm">Fechar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-2 sm:p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[96vh] sm:max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3.5 sm:px-6 py-2.5 sm:py-4 border-b border-slate-200 bg-slate-50 gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-semibold text-slate-900 truncate">
                Documentos Técnicos — {order.visibleNumber}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                Dimensões A5 reais (148 × 210 mm) • Otimizado para impressão
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-1.5 sm:gap-2 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Descarregar</span>
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

        {/* Document Type Selector Bar */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2 bg-white border-b border-slate-100 text-xs overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg shrink-0">
            <button
              onClick={() => setDocType('folha_a5')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
                docType === 'folha_a5' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Folha de Assistência A5 (Obrigatória)
            </button>
            <button
              onClick={() => setDocType('etiqueta')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
                docType === 'etiqueta' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              Etiqueta de Equipamento (60x40mm)
            </button>
            <button
              onClick={() => setDocType('folha_entrega')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
                docType === 'folha_entrega' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              Comprovativo de Entrega
            </button>
            {activeQuote && (
              <button
                onClick={() => setDocType('orcamento')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
                  docType === 'orcamento' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Orçamento ({activeQuote.visibleNumber})
              </button>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-3 text-slate-500">
            <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Página 148×210mm ISO
            </span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Margem segura 8mm
            </span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Código opaco sem dados pessoais
            </span>
          </div>
        </div>

        {/* PDF Preview Viewport */}
        <div className="flex-1 bg-slate-200 p-4 overflow-y-auto flex items-center justify-center min-h-[500px]">
          {loading ? (
            <div className="flex flex-col items-center gap-2 text-slate-500 text-sm">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              A gerar visualização do documento em alta fidelidade...
            </div>
          ) : (
            <div className="bg-white shadow-lg rounded p-1 w-full max-w-[580px] h-[580px] flex flex-col">
              <iframe
                src={pdfDataUrl}
                title="Pré-visualização do PDF A5"
                className="w-full h-full border-0 rounded"
              />
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex items-center justify-between">
          <span>
            Equipamento: <strong className="text-slate-700">{equipment.brand} {equipment.model}</strong> ({equipment.internalTag})
          </span>
          <span>
            Cliente: <strong className="text-slate-700">{customer.name}</strong> • Tel: {customer.phone}
          </span>
        </div>
      </div>
    </div>
  );
};
