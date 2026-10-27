import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Users,
  Laptop,
  Wrench,
  BarChart3,
  Receipt,
  Settings,
  PlusCircle,
  HelpCircle
} from 'lucide-react';
import { Customer, Equipment, Quote, ServiceOrder, User } from './types';
import { DataStore } from './services/storage';
import { Navbar } from './components/Navbar';
import { LoginPage } from './components/LoginPage';
import { DashboardView } from './components/DashboardView';
import { OrdersView } from './components/OrdersView';
import { TechniciansView } from './components/TechniciansView';
import { CustomersView } from './components/CustomersView';
import { EquipmentView } from './components/EquipmentView';
import { WorkshopView } from './components/WorkshopView';
import { QuotesView } from './components/QuotesView';
import { BillingView } from './components/BillingView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { OrderDetailModal } from './components/OrderDetailModal';
import { NewOrderModal } from './components/NewOrderModal';
import { PdfPreviewModal } from './components/PdfPreviewModal';

export default function App() {
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(
    DataStore.getAuthenticatedUser()
  );
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [ordersInitialFilter, setOrdersInitialFilter] = useState<string>('all');
  const [dataVersion, setDataVersion] = useState<number>(1);

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState<boolean>(false);
  const [pdfModalOrder, setPdfModalOrder] = useState<ServiceOrder | null>(null);
  const [pdfModalType, setPdfModalType] = useState<'folha_a5' | 'etiqueta' | 'folha_entrega' | 'orcamento'>('folha_a5');
  const [pdfModalQuote, setPdfModalQuote] = useState<Quote | undefined>(undefined);

  const triggerRefresh = () => {
    setDataVersion(v => v + 1);
    if (selectedOrder) {
      const refreshed = DataStore.getServiceOrderById(selectedOrder.id);
      if (refreshed) setSelectedOrder(refreshed);
    }
  };

  const handleOpenPdf = (
    order: ServiceOrder,
    type: 'folha_a5' | 'etiqueta' | 'folha_entrega' | 'orcamento' = 'folha_a5',
    quote?: Quote
  ) => {
    setPdfModalOrder(order);
    setPdfModalType(type);
    setPdfModalQuote(quote);
  };

  const handleLoginSuccess = (user: User) => {
    setAuthenticatedUser(user);
    triggerRefresh();
  };

  const handleLogout = () => {
    DataStore.logout();
    setAuthenticatedUser(null);
    setCurrentView('dashboard');
  };

  const handleRefreshUser = () => {
    const auth = DataStore.getAuthenticatedUser();
    if (auth) {
      setAuthenticatedUser(auth);
    }
    triggerRefresh();
  };

  // If not logged in, render the Login Page
  if (!authenticatedUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 w-full overflow-x-hidden transition-colors duration-200">
      {/* 3-Zone Top Navigation Contract */}
      <Navbar
        currentView={currentView}
        onNavigate={view => {
          if (view === 'orders') {
            setOrdersInitialFilter('all');
          }
          setCurrentView(view);
        }}
        onNewOrder={() => setIsNewOrderModalOpen(true)}
        currentUser={authenticatedUser}
        onOpenSettings={() => setCurrentView('settings')}
        onLogout={handleLogout}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 lg:py-8">
        {currentView === 'dashboard' && (
          <DashboardView
            key={`dash_${dataVersion}`}
            onOpenOrder={setSelectedOrder}
            onNewOrder={() => setIsNewOrderModalOpen(true)}
            onOpenPdf={(order, type) => handleOpenPdf(order, type)}
            onNavigateToOrders={statusFilter => {
              setOrdersInitialFilter(statusFilter || 'all');
              setCurrentView('orders');
            }}
          />
        )}

        {currentView === 'orders' && (
          <OrdersView
            key={`orders_${dataVersion}_${ordersInitialFilter}`}
            onOpenOrder={setSelectedOrder}
            onNewOrder={() => setIsNewOrderModalOpen(true)}
            onOpenPdf={(order, type) => handleOpenPdf(order, type)}
            initialFilterStatus={ordersInitialFilter}
          />
        )}

        {currentView === 'workshop' && (
          <WorkshopView
            key={`work_${dataVersion}`}
            onOpenOrder={setSelectedOrder}
            onOpenPdf={order => handleOpenPdf(order, 'folha_a5')}
          />
        )}

        {currentView === 'technicians' && (
          <TechniciansView
            key={`techs_${dataVersion}`}
            currentUser={authenticatedUser}
            onRefresh={triggerRefresh}
          />
        )}

        {currentView === 'customers' && (
          <CustomersView
            key={`cust_${dataVersion}`}
            onOpenOrder={setSelectedOrder}
          />
        )}

        {currentView === 'equipment' && (
          <EquipmentView
            key={`eq_${dataVersion}`}
            onOpenOrder={setSelectedOrder}
          />
        )}

        {currentView === 'quotes' && (
          <QuotesView
            key={`quotes_${dataVersion}`}
            onOpenOrder={setSelectedOrder}
          />
        )}

        {currentView === 'billing' && (
          <BillingView
            key={`bill_${dataVersion}`}
            onOpenOrder={setSelectedOrder}
          />
        )}

        {currentView === 'reports' && (
          <ReportsView key={`rep_${dataVersion}`} />
        )}

        {currentView === 'settings' && (
          <SettingsView
            key={`set_${dataVersion}`}
            onRefreshUser={handleRefreshUser}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 px-6 text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            FSYS360 Service — Gestão de Assistências Técnicas • FozSistemas (fozsistemas.com) • Dimensão A5 física: 148 × 210 mm
          </span>
          <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
            <span>Operador Atual: <strong className="text-slate-800 dark:text-white">{authenticatedUser.name}</strong> ({authenticatedUser.role})</span>
            <span>·</span>
            <button
              onClick={() => setCurrentView('settings')}
              className="hover:text-sky-600 dark:hover:text-sky-400 font-medium"
            >
              Definições e Cópia de Segurança
            </button>
            <span>·</span>
            <button
              onClick={handleLogout}
              className="hover:text-rose-600 dark:hover:text-rose-400 font-medium text-rose-500"
            >
              Terminar Sessão
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdate={triggerRefresh}
          onOpenPdf={(order, type) => handleOpenPdf(order, type)}
        />
      )}

      {isNewOrderModalOpen && (
        <NewOrderModal
          onClose={() => setIsNewOrderModalOpen(false)}
          onOrderCreated={order => {
            triggerRefresh();
          }}
          onOpenPdf={order => {
            setIsNewOrderModalOpen(false);
            handleOpenPdf(order, 'folha_a5');
          }}
        />
      )}

      {pdfModalOrder && (
        <PdfPreviewModal
          order={pdfModalOrder}
          documentType={pdfModalType}
          quote={pdfModalQuote}
          onClose={() => {
            setPdfModalOrder(null);
            setPdfModalQuote(undefined);
          }}
        />
      )}
    </div>
  );
}
