import React, { useState } from 'react';
import { Search, Plus, UserPlus, Phone, Mail, MapPin, Laptop, FileText, X } from 'lucide-react';
import { Customer, CustomerType, Equipment, ServiceOrder } from '../types';
import { DataStore } from '../services/storage';

interface CustomersViewProps {
  onOpenOrder: (order: ServiceOrder) => void;
  onNewOrderForCustomer?: (customer: Customer) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ onOpenOrder }) => {
  const currentUser = DataStore.getCurrentUser();
  const [customers, setCustomers] = useState<Customer[]>(DataStore.getCustomers());
  const allEquipment = DataStore.getEquipment();
  const allOrders = DataStore.getServiceOrders();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // New / Edit Customer Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [formName, setFormName] = useState<string>('');
  const [formType, setFormType] = useState<CustomerType>('particular');
  const [formNif, setFormNif] = useState<string>('');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formAltPhone, setFormAltPhone] = useState<string>('');
  const [formAddress, setFormAddress] = useState<string>('');
  const [formCity, setFormCity] = useState<string>('Lisboa');
  const [formPostal, setFormPostal] = useState<string>('1000-001');
  const [formNotes, setFormNotes] = useState<string>('');

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormType('particular');
    setFormNif('');
    setFormEmail('');
    setFormPhone('');
    setFormAltPhone('');
    setFormAddress('');
    setFormCity('Lisboa');
    setFormPostal('1000-001');
    setFormNotes('');
    setShowModal(true);
  };

  const openEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setFormName(cust.name);
    setFormType(cust.type);
    setFormNif(cust.taxNumber || '');
    setFormEmail(cust.email);
    setFormPhone(cust.phone);
    setFormAltPhone(cust.altPhone || '');
    setFormAddress(cust.address);
    setFormCity(cust.city);
    setFormPostal(cust.postalCode);
    setFormNotes(cust.notes || '');
    setShowModal(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) return;

    const saved = DataStore.saveCustomer(
      {
        id: editingCustomer?.id || '',
        name: formName.trim(),
        type: formType,
        taxNumber: formNif.trim() || undefined,
        email: formEmail.trim(),
        phone: formPhone.trim(),
        altPhone: formAltPhone.trim() || undefined,
        address: formAddress.trim(),
        city: formCity.trim(),
        postalCode: formPostal.trim(),
        notes: formNotes.trim() || undefined,
        active: true,
        createdAt: editingCustomer?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      currentUser.id,
      currentUser.name
    );

    setCustomers(DataStore.getCustomers());
    setShowModal(false);
    if (selectedCustomer?.id === saved.id) {
      setSelectedCustomer(saved);
    }
  };

  const filteredCustomers = customers.filter(c => {
    if (typeFilter !== 'all' && c.type !== typeFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.taxNumber && c.taxNumber.includes(q)) ||
        c.email.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeCustomerEquipment = selectedCustomer
    ? allEquipment.filter(e => e.customerId === selectedCustomer.id)
    : [];
  const activeCustomerOrders = selectedCustomer
    ? allOrders.filter(o => o.customerId === selectedCustomer.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Gestão de Clientes</h2>
          <p className="text-xs text-slate-500">
            Registo de clientes particulares e empresariais, histórico de equipamentos e assistências
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          + Novo Cliente
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer List Column */}
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            {/* Search Filter Header */}
            <div className="p-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome, NIF, telefone ou email..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-blue-600"
                />
              </div>

              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-medium"
              >
                <option value="all">Todos os tipos</option>
                <option value="particular">Particulares</option>
                <option value="empresa">Empresas</option>
              </select>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Nenhum cliente encontrado com os critérios de pesquisa.
                </div>
              ) : (
                filteredCustomers.map(cust => {
                  const custEquipCount = allEquipment.filter(e => e.customerId === cust.id).length;
                  const custOrdersCount = allOrders.filter(o => o.customerId === cust.id).length;
                  const isSelected = selectedCustomer?.id === cust.id;

                  return (
                    <div
                      key={cust.id}
                      onClick={() => setSelectedCustomer(cust)}
                      className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between ${
                        isSelected ? 'bg-blue-50/60 border-l-4 border-l-blue-600' : ''
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 text-xs">{cust.name}</span>
                          <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {cust.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {cust.phone}
                          </span>
                          {cust.taxNumber && (
                            <span>NIF: <strong className="text-slate-700">{cust.taxNumber}</strong></span>
                          )}
                          <span>{cust.city}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500 text-[11px]">
                          {custEquipCount} equip. • {custOrdersCount} ordens
                        </span>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            openEditModal(cust);
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Customer Detail & History Column */}
        <div className="space-y-4">
          {selectedCustomer ? (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{selectedCustomer.name}</h3>
                  <span className="text-xs text-slate-400 capitalize">{selectedCustomer.type}</span>
                </div>
                <button
                  onClick={() => openEditModal(selectedCustomer)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Editar Dados
                </button>
              </div>

              {/* Contact info block */}
              <div className="text-xs text-slate-600 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedCustomer.phone} {selectedCustomer.altPhone ? `(Alt: ${selectedCustomer.altPhone})` : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedCustomer.email || 'Sem email'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedCustomer.address}, {selectedCustomer.postalCode} {selectedCustomer.city}</span>
                </div>
                {selectedCustomer.taxNumber && (
                  <div>NIF / Contribuinte: <strong>{selectedCustomer.taxNumber}</strong></div>
                )}
                {selectedCustomer.notes && (
                  <div className="p-2 bg-slate-50 rounded text-slate-600 italic">
                    Notas: {selectedCustomer.notes}
                  </div>
                )}
              </div>

              {/* Equipment Registered */}
              <div className="border-t border-slate-100 pt-3 space-y-2">
                <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-blue-600" />
                  Equipamentos Registados ({activeCustomerEquipment.length})
                </h4>
                {activeCustomerEquipment.length === 0 ? (
                  <p className="text-xs text-slate-400">Nenhum equipamento associado.</p>
                ) : (
                  <div className="space-y-1.5">
                    {activeCustomerEquipment.map(eq => (
                      <div key={eq.id} className="p-2 bg-slate-50 rounded text-xs flex justify-between items-center">
                        <div>
                          <strong className="text-slate-800">{eq.brand} {eq.model}</strong>
                          <div className="text-[11px] text-slate-400 font-mono">S/N: {eq.serialNumber || 'N/A'} • {eq.internalTag}</div>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {eq.category}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Service Orders History */}
              <div className="border-t border-slate-100 pt-3 space-y-2">
                <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  Histórico de Assistências ({activeCustomerOrders.length})
                </h4>
                {activeCustomerOrders.length === 0 ? (
                  <p className="text-xs text-slate-400">Nenhuma assistência técnica registada.</p>
                ) : (
                  <div className="space-y-1.5">
                    {activeCustomerOrders.map(ord => (
                      <div
                        key={ord.id}
                        onClick={() => onOpenOrder(ord)}
                        className="p-2 bg-slate-50 hover:bg-blue-50 rounded text-xs cursor-pointer transition-colors flex justify-between items-center"
                      >
                        <div>
                          <span className="font-mono font-bold text-slate-900 block">{ord.visibleNumber}</span>
                          <span className="text-[11px] text-slate-500 line-clamp-1">{ord.reportedFault}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(ord.createdAt).toLocaleDateString('pt-PT')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-400 text-xs">
              Selecione um cliente da lista à esquerda para consultar a respetiva ficha, equipamentos e histórico de reparações.
            </div>
          )}
        </div>
      </div>

      {/* Modal New / Edit Customer */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nome Completo / Denominação *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Tipo</label>
                  <select
                    value={formType}
                    onChange={e => setFormType(e.target.value as any)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  >
                    <option value="particular">Particular</option>
                    <option value="empresa">Empresa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Telefone Principal *</label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Contacto Alternativo</label>
                  <input
                    type="text"
                    value={formAltPhone}
                    onChange={e => setFormAltPhone(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">NIF (Contribuinte)</label>
                  <input
                    type="text"
                    value={formNif}
                    onChange={e => setFormNif(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Morada</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={e => setFormAddress(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Código Postal</label>
                  <input
                    type="text"
                    value={formPostal}
                    onChange={e => setFormPostal(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={e => setFormCity(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Notas Internas</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Preferências de contacto, horários..."
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
                >
                  Gravar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
