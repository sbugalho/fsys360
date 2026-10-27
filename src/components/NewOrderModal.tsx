import React, { useState } from 'react';
import { X, UserPlus, Laptop, Check, Printer, FileText, AlertCircle } from 'lucide-react';
import { Customer, Equipment, EquipmentCategory, ServiceOrder, ServiceOrderPriority } from '../types';
import { DataStore } from '../services/storage';
import { CustomerSearchSelect } from './CustomerSearchSelect';

interface NewOrderModalProps {
  onClose: () => void;
  onOrderCreated: (newOrder: ServiceOrder) => void;
  onOpenPdf: (order: ServiceOrder) => void;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
  onClose,
  onOrderCreated,
  onOpenPdf,
}) => {
  const currentUser = DataStore.getCurrentUser();
  const customers = DataStore.getCustomers();
  const allEquipment = DataStore.getEquipment();

  // Step / Form state
  // Initialized to empty string as requested (no customer selected by default)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isNewCustomer, setIsNewCustomer] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustType, setNewCustType] = useState<'particular' | 'empresa'>('particular');
  const [newCustNif, setNewCustNif] = useState<string>('');
  const [newCustEmail, setNewCustEmail] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');
  const [newCustAddress, setNewCustAddress] = useState<string>('');
  const [newCustCity, setNewCustCity] = useState<string>('Lisboa');
  const [newCustPostal, setNewCustPostal] = useState<string>('1000-001');

  // Equipment selection / creation
  const customerEquipment = selectedCustomerId
    ? allEquipment.filter(e => e.customerId === selectedCustomerId)
    : [];
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('');
  const [isNewEquipment, setIsNewEquipment] = useState<boolean>(true);
  const [newEquipCategory, setNewEquipCategory] = useState<EquipmentCategory>('portatil');
  const [newEquipBrand, setNewEquipBrand] = useState<string>('');
  const [newEquipModel, setNewEquipModel] = useState<string>('');
  const [newEquipSerial, setNewEquipSerial] = useState<string>('');
  const [newEquipSpecs, setNewEquipSpecs] = useState<string>('');

  const activeTechnicians = DataStore.getTechnicians(true);

  // Service Order fields
  const [reportedFault, setReportedFault] = useState<string>('');
  const [externalDamage, setExternalDamage] = useState<string>('');
  const [accessories, setAccessories] = useState<string>('Carregador original');
  const [priority, setPriority] = useState<ServiceOrderPriority>('normal');
  const [isWarranty, setIsWarranty] = useState<boolean>(false);
  const [assignedTech, setAssignedTech] = useState<string>(activeTechnicians[0]?.id || '');
  const [internalNotes, setInternalNotes] = useState<string>('');

  const [createdOrder, setCreatedOrder] = useState<ServiceOrder | null>(null);
  const [formError, setFormError] = useState<string>('');

  const handleCustomerChange = (custId: string) => {
    setSelectedCustomerId(custId);
    if (!custId) {
      setSelectedEquipmentId('');
      setIsNewEquipment(true);
      return;
    }
    const existing = allEquipment.filter(e => e.customerId === custId);
    if (existing.length > 0) {
      setSelectedEquipmentId(existing[0].id);
      setIsNewEquipment(false);
    } else {
      setSelectedEquipmentId('');
      setIsNewEquipment(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validations
    if (isNewCustomer) {
      if (!newCustName.trim()) {
        setFormError('Por favor preencha o nome do cliente.');
        return;
      }
      if (!newCustPhone.trim()) {
        setFormError('Por favor forneça um número de telefone de contacto.');
        return;
      }
    } else if (!selectedCustomerId) {
      setFormError('Selecione um cliente existente ou crie um novo.');
      return;
    }

    if (isNewEquipment) {
      if (!newEquipBrand.trim() || !newEquipModel.trim()) {
        setFormError('Por favor preencha a marca e o modelo do equipamento.');
        return;
      }
    } else if (!selectedEquipmentId) {
      setFormError('Selecione ou registe um equipamento.');
      return;
    }

    if (!reportedFault.trim()) {
      setFormError('Por favor descreva a avaria reportada pelo cliente.');
      return;
    }

    try {
      // 1. Resolve Customer
      let finalCustomerId = selectedCustomerId;
      if (isNewCustomer) {
        const createdCust = DataStore.saveCustomer(
          {
            id: '',
            name: newCustName.trim(),
            type: newCustType,
            taxNumber: newCustNif.trim() || undefined,
            email: newCustEmail.trim(),
            phone: newCustPhone.trim(),
            address: newCustAddress.trim(),
            city: newCustCity.trim(),
            postalCode: newCustPostal.trim(),
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          currentUser.id,
          currentUser.name
        );
        finalCustomerId = createdCust.id;
      }

      // 2. Resolve Equipment
      let finalEquipmentId = selectedEquipmentId;
      if (isNewEquipment) {
        const createdEquip = DataStore.saveEquipment(
          {
            id: '',
            customerId: finalCustomerId,
            category: newEquipCategory,
            brand: newEquipBrand.trim(),
            model: newEquipModel.trim(),
            serialNumber: newEquipSerial.trim() || 'S/N-PENDENTE',
            internalTag: '',
            specsDescription: newEquipSpecs.trim(),
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          currentUser.id,
          currentUser.name
        );
        finalEquipmentId = createdEquip.id;
      }

      // 3. Create Service Order
      const newOrder = DataStore.saveServiceOrder(
        {
          id: '',
          visibleNumber: '', // will be assigned next monotonic sequence
          customerId: finalCustomerId,
          equipmentId: finalEquipmentId,
          createdAt: new Date().toISOString(),
          createdByUserId: currentUser.id,
          status: 'recebido',
          priority,
          isWarranty,
          reportedFault: reportedFault.trim(),
          externalDamageState: externalDamage.trim() || 'Sem danos cosméticos visíveis.',
          accessoriesReceived: accessories.trim() || 'Apenas o equipamento.',
          assignedTechnicianId: assignedTech || undefined,
          internalNotes: internalNotes.trim(),
          reopeningCount: 0,
        },
        currentUser.id,
        currentUser.name
      );

      // Record first document version in history
      DataStore.recordDocument(
        newOrder.id,
        'folha_a5',
        'Folha de Assistência Técnica A5',
        currentUser.id,
        currentUser.name,
        'Folha física inicial gerada na receção'
      );

      setCreatedOrder(newOrder);
      onOrderCreated(newOrder);
    } catch (err: any) {
      console.error(err);
      setFormError('Erro ao gravar assistência técnica: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-2 sm:p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[95vh] sm:max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 bg-slate-50 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-blue-600 text-white rounded-lg shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-semibold text-slate-900 truncate">
                Abertura de Nova Assistência Técnica
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                Registo de entrada e emissão de número de ordem
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {createdOrder ? (
          <div className="p-8 text-center flex-1 flex flex-col items-center justify-center">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Assistência Aberta com Sucesso!
            </h3>
            <div className="mt-2 text-2xl font-mono font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg inline-block">
              {createdOrder.visibleNumber}
            </div>
            <p className="text-sm text-slate-600 mt-3 max-w-md">
              O número de ordem foi atribuído com garantia de unicidade. A folha A5 está pronta para impressão imediata e acompanhamento físico do equipamento em bancada.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-3 mt-6 w-full max-w-md">
              <button
                onClick={() => onOpenPdf(createdOrder)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm w-full sm:w-auto"
              >
                <Printer className="w-4 h-4" />
                Imprimir Folha A5 (148×210 mm)
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto text-center"
              >
                Fechar e Voltar ao Painel
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {formError}
              </div>
            )}

            {/* SECTION 1: CLIENT */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">
                    1
                  </span>
                  Cliente
                </h3>
                <button
                  type="button"
                  onClick={() => setIsNewCustomer(!isNewCustomer)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {isNewCustomer ? 'Escolher Cliente Existente' : '+ Criar Novo Cliente'}
                </button>
              </div>

              {isNewCustomer ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Nome / Empresa *</label>
                    <input
                      type="text"
                      required
                      value={newCustName}
                      onChange={e => setNewCustName(e.target.value)}
                      placeholder="Ex: Pedro Abrantes / Empresa XYZ Lda"
                      className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-md bg-white focus:outline-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Tipo</label>
                    <select
                      value={newCustType}
                      onChange={e => setNewCustType(e.target.value as any)}
                      className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-md bg-white"
                    >
                      <option value="particular">Particular</option>
                      <option value="empresa">Empresa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Telefone *</label>
                    <input
                      type="text"
                      required
                      value={newCustPhone}
                      onChange={e => setNewCustPhone(e.target.value)}
                      placeholder="912 345 678"
                      className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-md bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">NIF</label>
                    <input
                      type="text"
                      value={newCustNif}
                      onChange={e => setNewCustNif(e.target.value)}
                      placeholder="123 456 789"
                      className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-md bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={newCustEmail}
                      onChange={e => setNewCustEmail(e.target.value)}
                      placeholder="contacto@exemplo.pt"
                      className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-md bg-white"
                    />
                  </div>
                </div>
              ) : (
                <CustomerSearchSelect
                  customers={customers}
                  selectedCustomerId={selectedCustomerId}
                  onSelectCustomer={customer => handleCustomerChange(customer ? customer.id : '')}
                  onAddNewCustomer={(initialName?: string) => {
                    setIsNewCustomer(true);
                    if (initialName) setNewCustName(initialName);
                  }}
                  label="Nome do Cliente"
                  placeholder="Escreva o nome do cliente..."
                  required
                />
              )}
            </div>

            {/* SECTION 2: EQUIPMENT */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">
                    2
                  </span>
                  Equipamento
                </h3>
                <button
                  type="button"
                  onClick={() => setIsNewEquipment(!isNewEquipment)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  <Laptop className="w-3.5 h-3.5" />
                  {isNewEquipment ? 'Escolher Equipamento Registado' : '+ Novo Equipamento'}
                </button>
              </div>

              {!isNewEquipment && customerEquipment.length > 0 ? (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Equipamento Existente do Cliente</label>
                  <select
                    value={selectedEquipmentId}
                    onChange={e => setSelectedEquipmentId(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-blue-600"
                  >
                    {customerEquipment.map(eq => (
                      <option key={eq.id} value={eq.id}>
                        [{eq.category.toUpperCase()}] {eq.brand} {eq.model} — S/N: {eq.serialNumber || 'N/A'} ({eq.internalTag})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Categoria *</label>
                    <select
                      value={newEquipCategory}
                      onChange={e => setNewEquipCategory(e.target.value as any)}
                      className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-md bg-white"
                    >
                      <option value="portatil">Portátil</option>
                      <option value="desktop">Desktop / Torre</option>
                      <option value="servidor">Servidor</option>
                      <option value="monitor">Monitor</option>
                      <option value="impressora">Impressora</option>
                      <option value="tablet">Tablet</option>
                      <option value="smartphone">Smartphone</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Marca *</label>
                    <input
                      type="text"
                      required
                      value={newEquipBrand}
                      onChange={e => setNewEquipBrand(e.target.value)}
                      placeholder="Lenovo, Apple, Dell, Asus..."
                      className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-md bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Modelo *</label>
                    <input
                      type="text"
                      required
                      value={newEquipModel}
                      onChange={e => setNewEquipModel(e.target.value)}
                      placeholder="ThinkPad T14, MacBook Pro..."
                      className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-md bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Nº de Série</label>
                    <input
                      type="text"
                      value={newEquipSerial}
                      onChange={e => setNewEquipSerial(e.target.value)}
                      placeholder="PF3X89K2"
                      className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-md bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 3: ENTRY CONDITIONS & FAULT */}
            <div className="space-y-3">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">
                    3
                  </span>
                  Avaria e Condições de Receção
                </h3>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Avaria Reportada pelo Cliente *
                </label>
                <textarea
                  required
                  rows={2}
                  value={reportedFault}
                  onChange={e => setReportedFault(e.target.value)}
                  placeholder="Ex: Não liga, desliga-se após 10 minutos, ecrã azul intermitente..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Estado Exterior e Danos Visíveis
                  </label>
                  <input
                    type="text"
                    value={externalDamage}
                    onChange={e => setExternalDamage(e.target.value)}
                    placeholder="Ex: Mossa no canto esquerdo, riscos no tampo..."
                    className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-md bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Acessórios Recebidos
                  </label>
                  <input
                    type="text"
                    value={accessories}
                    onChange={e => setAccessories(e.target.value)}
                    placeholder="Ex: Carregador original, mala de transporte, cabo HDMI..."
                    className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-md bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Prioridade</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as ServiceOrderPriority)}
                    className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-md bg-white"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Técnico Atribuído</label>
                  <select
                    value={assignedTech}
                    onChange={e => setAssignedTech(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-md bg-white font-medium"
                  >
                    {activeTechnicians.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.specialty || 'Técnico SAT'})
                      </option>
                    ))}
                    <option value="">Nenhum (Triagem Pendente)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="isWarrantyCheck"
                    checked={isWarranty}
                    onChange={e => setIsWarranty(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <label htmlFor="isWarrantyCheck" className="text-xs text-slate-700 font-medium">
                    Reparação em Garantia SAT
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Observações Internas (Não imprimem na folha do cliente)
                </label>
                <input
                  type="text"
                  value={internalNotes}
                  onChange={e => setInternalNotes(e.target.value)}
                  placeholder="Ex: Cliente tem reunião na próxima segunda-feira, contactar logo que orçado."
                  className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-md bg-white"
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between pt-4 border-t border-slate-200 gap-3">
              <span className="text-xs text-slate-500 text-center sm:text-left">
                Operador: <strong className="text-slate-700">{currentUser.name}</strong> ({currentUser.role})
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-initial px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-medium transition-colors text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-initial px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm text-center whitespace-nowrap"
                >
                  Registar Entrada
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
