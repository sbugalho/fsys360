import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Check, Building, User, Phone, Mail, MapPin, UserPlus } from 'lucide-react';
import { Customer } from '../types';

interface CustomerSearchSelectProps {
  customers: Customer[];
  selectedCustomerId: string;
  onSelectCustomer: (customer: Customer | null) => void;
  onAddNewCustomer?: (initialName?: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

export const CustomerSearchSelect: React.FC<CustomerSearchSelectProps> = ({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  onAddNewCustomer,
  label = 'Nome do Cliente',
  required = false,
  className = '',
  placeholder = 'Comece a escrever o nome do cliente...',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customers.find(c => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  const selectedCustomerRef = useRef<Customer | null>(selectedCustomer);
  selectedCustomerRef.current = selectedCustomer;

  // Local input text state
  const [inputValue, setInputValue] = useState<string>(() => {
    if (!selectedCustomerId) return '';
    const initial = customers.find(c => c.id === selectedCustomerId);
    return initial ? initial.name : '';
  });
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  // Track the previous selectedCustomerId to only synchronize when the ID actually changes
  const lastCustomerIdRef = useRef<string>(selectedCustomerId);

  useEffect(() => {
    if (lastCustomerIdRef.current !== selectedCustomerId) {
      lastCustomerIdRef.current = selectedCustomerId;
      if (selectedCustomerId) {
        const found = customers.find(c => c.id === selectedCustomerId);
        setInputValue(found ? found.name : '');
      } else {
        setInputValue('');
      }
    }
  }, [selectedCustomerId, customers]);

  // Filter customers ONLY when the user is typing (must have at least 1 character)
  const filteredCustomers = useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    if (!query) {
      // Per user request: do not show any clients when empty
      return [];
    }

    return customers.filter(c => {
      const matchName = c.name.toLowerCase().includes(query);
      const matchNif = c.taxNumber ? c.taxNumber.toLowerCase().includes(query) : false;
      const matchPhone = c.phone.includes(query) || (c.altPhone && c.altPhone.includes(query));
      const matchEmail = c.email ? c.email.toLowerCase().includes(query) : false;
      const matchCity = c.city ? c.city.toLowerCase().includes(query) : false;
      return matchName || matchNif || matchPhone || matchEmail || matchCity;
    }).slice(0, 8); // Max 8 matches for snappy display
  }, [customers, inputValue]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (selectedCustomerRef.current) {
          setInputValue(selectedCustomerRef.current.name);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (customer: Customer) => {
    onSelectCustomer(customer);
    setInputValue(customer.name);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleClear = () => {
    onSelectCustomer(null);
    setInputValue('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setHighlightedIndex(-1);

    // If a customer was selected and user starts modifying the text, clear selection
    if (selectedCustomer && val !== selectedCustomer.name) {
      onSelectCustomer(null);
    }

    // Only open autocomplete if there is text typed
    if (val.trim().length > 0) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredCustomers.length === 0) {
      if (e.key === 'ArrowDown' && inputValue.trim().length > 0) {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < filteredCustomers.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : filteredCustomers.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredCustomers.length) {
        handleSelect(filteredCustomers[highlightedIndex]);
      } else if (filteredCustomers.length > 0) {
        handleSelect(filteredCustomers[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={`space-y-1.5 relative ${className}`} ref={containerRef}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-700">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          {selectedCustomer ? (
            <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-600" />
              Cliente Selecionado
            </span>
          ) : (
            <span className="text-[10px] text-slate-400">
              Escreva para pesquisar ou autocompletar
            </span>
          )}
        </div>
      )}

      {/* Main Textfield with autocomplete */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (inputValue.trim().length > 0) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full pl-9 pr-10 py-2.5 text-xs rounded-lg transition-all shadow-2xs font-medium placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-slate-500 border ${
            selectedCustomer
              ? 'bg-emerald-50/40 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-slate-900 dark:text-emerald-100 focus:border-emerald-500 focus:outline-emerald-500'
              : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-sky-600 focus:outline-sky-600'
          }`}
        />

        {/* Clear button when there is text or selected customer */}
        {(inputValue || selectedCustomer) && (
          <button
            type="button"
            onClick={handleClear}
            title="Limpar campo do cliente"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown - ONLY appears when user is typing */}
      {isOpen && inputValue.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Sugestões de Clientes</span>
            <span>{filteredCustomers.length} encontrado(s)</span>
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="p-4 text-center text-xs space-y-2">
              <p className="text-slate-500">
                Nenhum cliente encontrado com «<strong className="text-slate-800">{inputValue}</strong>».
              </p>
              {onAddNewCustomer && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onAddNewCustomer(inputValue.trim());
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-2xs transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Registar «{inputValue.trim()}» como Novo Cliente
                </button>
              )}
            </div>
          ) : (
            <div>
              {filteredCustomers.map((c, index) => {
                const isSelected = c.id === selectedCustomerId;
                const isHighlighted = index === highlightedIndex;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelect(c)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-3 py-2.5 cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                      isHighlighted || isSelected
                        ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-950 dark:text-sky-200'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                        {c.type === 'empresa' ? (
                          <Building className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                        )}
                      </div>
                      <div className="min-w-0 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {c.name}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                            {c.type}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2.5 mt-0.5 truncate">
                          <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">{c.phone}</span>
                          {c.taxNumber && (
                            <span>• NIF: <strong className="font-mono text-slate-700 dark:text-slate-300">{c.taxNumber}</strong></span>
                          )}
                          {c.city && <span>• {c.city}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center">
                      {isSelected ? (
                        <span className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="text-[10px] text-sky-600 dark:text-sky-400 font-medium">Selecionar ↵</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {onAddNewCustomer && (
                <div className="p-2 bg-slate-50 dark:bg-slate-800/70 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onAddNewCustomer(inputValue.trim());
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold text-sky-700 dark:text-sky-400 hover:text-sky-900 dark:hover:text-sky-200 hover:bg-sky-100/70 dark:hover:bg-sky-950/50 rounded-lg transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    + Registar «{inputValue.trim()}» como Novo Cliente
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Selected Customer Details Card shown when a customer is chosen */}
      {selectedCustomer && (
        <div className="mt-1.5 p-2.5 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-lg flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              {selectedCustomer.type === 'empresa' ? (
                <Building className="w-3.5 h-3.5" />
              ) : (
                <User className="w-3.5 h-3.5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white truncate">
                  {selectedCustomer.name}
                </span>
                <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.2 rounded uppercase">
                  {selectedCustomer.type}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-3 mt-0.5 truncate">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {selectedCustomer.phone}
                </span>
                {selectedCustomer.taxNumber && (
                  <span>NIF: <strong className="text-slate-800 dark:text-slate-200">{selectedCustomer.taxNumber}</strong></span>
                )}
                {selectedCustomer.city && (
                  <span>• {selectedCustomer.city}</span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2 py-1 rounded transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 shrink-0"
          >
            Limpar / Trocar
          </button>
        </div>
      )}
    </div>
  );
};
