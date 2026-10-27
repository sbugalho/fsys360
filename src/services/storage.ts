import {
  AppSettings,
  AuditLog,
  BillingDocument,
  CatalogPart,
  Customer,
  DocumentRecord,
  Equipment,
  IntegrationAttempt,
  Intervention,
  Quote,
  ServiceEvent,
  ServiceOrder,
  ServiceOrderStatus,
  ServicePart,
  User
} from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'sat_app_settings_v1',
  CURRENT_USER: 'sat_current_user_v1',
  AUTH_USER: 'sat_auth_user_v2',
  USERS: 'sat_users_v2',
  CUSTOMERS: 'sat_customers_v1',
  EQUIPMENT: 'sat_equipment_v1',
  SERVICE_ORDERS: 'sat_orders_v1',
  SERVICE_EVENTS: 'sat_events_v1',
  INTERVENTIONS: 'sat_interventions_v1',
  SERVICE_PARTS: 'sat_parts_v1',
  CATALOG: 'sat_catalog_v1',
  QUOTES: 'sat_quotes_v1',
  DOCUMENTS: 'sat_documents_v1',
  BILLING_DOCS: 'sat_billing_docs_v1',
  INTEGRATION_LOGS: 'sat_integration_logs_v1',
  AUDIT_LOGS: 'sat_audit_logs_v1',
  ORDER_SEQUENCE: 'sat_order_seq_2026',
};

export const INITIAL_SETTINGS: AppSettings = {
  brandName: 'FSYS360',
  commercialName: 'FSYS360 Service',
  brandDescription: 'Gestão de Assistências Técnicas',
  companyName: 'FSYS360 Service',
  legalName: 'FozSistemas - Equipamentos e Sistemas de Informação, Lda.',
  taxNumber: '504 180 118',
  address: 'Rua Manuel Fernandes Tomaz, 132',
  postalCode: '3080-051',
  city: 'Figueira da Foz',
  phone: '(+351) 233 094 320',
  email: 'geral@fozsistemas.com',
  website: 'https://fozsistemas.com',
  defaultVatRate: 23,
  defaultWarrantyDays: 90,
  a5MarginsMm: 8,
  currencySymbol: '€',
  termsAndConditions:
    '1. O diagnóstico inicial é comunicado no prazo máximo de 48h úteis pela equipa técnica da FozSistemas.\n2. Equipamentos não levantados após 90 dias da notificação de conclusão incorrem em taxa diária de armazenagem.\n3. A reparação efetuada goza de 90 dias de garantia sobre as peças e mão de obra indicadas na folha de serviço FSYS360 Service / FozSistemas.\n4. A FozSistemas não se responsabiliza por perdas de dados em suportes de armazenamento. O cliente confirma que efetuou salvaguarda prévia.',
};

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_superadmin',
    name: 'Super Administrador',
    username: 'admin',
    email: 'admin@fozsistemas.com',
    password: '123456',
    role: 'admin',
    active: true,
    isSuperAdmin: true,
    specialty: 'Gestão Global & Arquitetura de Sistemas',
    phone: '(+351) 233 094 320',
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'usr_tecnico_rui',
    name: 'Rui Duarte',
    username: 'rui',
    email: 'rui.duarte@fozsistemas.com',
    password: '123456',
    role: 'tecnico',
    active: true,
    specialty: 'Hardware, Eletrónica & Micro-soldadura',
    phone: '918 234 567',
    createdAt: '2026-01-15T09:00:00Z',
  },
  {
    id: 'usr_tecnico_miguel',
    name: 'Miguel Bastos',
    username: 'miguel',
    email: 'miguel.bastos@fozsistemas.com',
    password: '123456',
    role: 'tecnico',
    active: true,
    specialty: 'Portáteis, Apple Mac & Ecrãs OLED',
    phone: '934 890 123',
    createdAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'usr_rececao_ana',
    name: 'Ana Silva',
    username: 'ana',
    email: 'ana.silva@fozsistemas.com',
    password: '123456',
    role: 'rececao',
    active: true,
    specialty: 'Atendimento ao Cliente & Triagem de Equipamentos',
    phone: '965 432 109',
    createdAt: '2026-01-10T08:30:00Z',
  },
  {
    id: 'usr_gestao_marta',
    name: 'Marta Ferreira',
    username: 'marta',
    email: 'marta.ferreira@fozsistemas.com',
    password: '123456',
    role: 'gestao',
    active: true,
    specialty: 'Coordenação Financeira & Orçamentos',
    phone: '921 765 432',
    createdAt: '2026-01-20T09:30:00Z',
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust_001',
    name: 'Pedro Manuel Abrantes',
    type: 'particular',
    taxNumber: '214589632',
    email: 'pedro.abrantes@gmail.com',
    phone: '912 345 678',
    address: 'Rua Castilho, 45, 3º Dto',
    city: 'Lisboa',
    postalCode: '1250-068',
    notes: 'Cliente habitual. Prefere contacto por WhatsApp durante a tarde.',
    active: true,
    createdAt: '2026-03-10T09:30:00Z',
    updatedAt: '2026-03-10T09:30:00Z',
  },
  {
    id: 'cust_002',
    name: 'Soluções Digitais Atlântico Lda',
    type: 'empresa',
    taxNumber: '508741258',
    email: 'it@solucoesatlantico.pt',
    phone: '218 901 234',
    altPhone: '967 890 123',
    address: 'Parque das Nações, Alameda dos Oceanos, Lote 1.05',
    city: 'Lisboa',
    postalCode: '1990-203',
    notes: 'Contrato de manutenção prioritário. Faturação mensal.',
    active: true,
    createdAt: '2026-02-14T11:15:00Z',
    updatedAt: '2026-02-14T11:15:00Z',
  },
  {
    id: 'cust_003',
    name: 'Maria Helena Moreira',
    type: 'particular',
    taxNumber: '238965412',
    email: 'mhelena.moreira@outlook.com',
    phone: '934 567 890',
    address: 'Avenida de Roma, 82, 1º Esq',
    city: 'Lisboa',
    postalCode: '1700-349',
    notes: 'Equipamento de trabalho urgente para lecionar aulas.',
    active: true,
    createdAt: '2026-03-28T14:20:00Z',
    updatedAt: '2026-03-28T14:20:00Z',
  },
  {
    id: 'cust_004',
    name: 'Gabinete de Arquitetura Traço Nobre',
    type: 'empresa',
    taxNumber: '510258741',
    email: 'geral@traconobre.pt',
    phone: '213 456 789',
    address: 'Rua do Alecrim, 12',
    city: 'Lisboa',
    postalCode: '1200-017',
    notes: 'Workstations de render 3D e edição gráfica.',
    active: true,
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z',
  },
];

export const INITIAL_EQUIPMENT: Equipment[] = [
  {
    id: 'eq_001',
    customerId: 'cust_001',
    category: 'portatil',
    brand: 'Lenovo',
    model: 'ThinkPad T14 Gen 3',
    serialNumber: 'PF3X89K2',
    internalTag: 'EQ-2026-01',
    specsDescription: 'Intel Core i7-1260P, 32GB RAM, 1TB NVMe, Ecrã 14" FHD IPS',
    externalNotes: 'Marcas ligeiras de uso no tampo superior. Teclado intacto.',
    active: true,
    createdAt: '2026-03-10T09:35:00Z',
    updatedAt: '2026-03-10T09:35:00Z',
  },
  {
    id: 'eq_002',
    customerId: 'cust_002',
    category: 'desktop',
    brand: 'Dell',
    model: 'Precision 3660 Tower',
    serialNumber: 'DL-9874-PRC',
    internalTag: 'EQ-2026-02',
    specsDescription: 'Core i9-13900K, 64GB DDR5, RTX A4000 16GB, 2TB RAID1',
    externalNotes: 'Chassis metálico com selo de garantia interno.',
    active: true,
    createdAt: '2026-02-14T11:20:00Z',
    updatedAt: '2026-02-14T11:20:00Z',
  },
  {
    id: 'eq_003',
    customerId: 'cust_003',
    category: 'portatil',
    brand: 'Apple',
    model: 'MacBook Air M2 13"',
    serialNumber: 'C02G90XAQ6L4',
    internalTag: 'EQ-2026-03',
    specsDescription: 'Apple M2, 16GB RAM Unificada, 512GB SSD, Cor Meia-Noite',
    externalNotes: 'Pequena mossa no canto inferior esquerdo junto à dobradiça.',
    active: true,
    createdAt: '2026-03-28T14:25:00Z',
    updatedAt: '2026-03-28T14:25:00Z',
  },
  {
    id: 'eq_004',
    customerId: 'cust_004',
    category: 'servidor',
    brand: 'HP',
    model: 'ProLiant ML350 Gen10',
    serialNumber: 'CZ2049B71Z',
    internalTag: 'EQ-2026-04',
    specsDescription: 'Dual Xeon Silver 4210R, 128GB ECC, Smart Array P408i-a, 8x SAS',
    externalNotes: 'Servidor de ficheiros central com chaves de gaveta incluídas.',
    active: true,
    createdAt: '2026-01-20T10:15:00Z',
    updatedAt: '2026-01-20T10:15:00Z',
  },
  {
    id: 'eq_005',
    customerId: 'cust_001',
    category: 'monitor',
    brand: 'Dell',
    model: 'UltraSharp U2723QE 4K',
    serialNumber: 'CN-0K79D-742',
    internalTag: 'EQ-2026-05',
    specsDescription: '27 Polegadas 4K IPS Black, USB-C Hub 90W PD',
    externalNotes: 'Sem riscos no painel. Cabo USB-C original entregue.',
    active: true,
    createdAt: '2026-03-12T16:00:00Z',
    updatedAt: '2026-03-12T16:00:00Z',
  },
];

export const INITIAL_CATALOG: CatalogPart[] = [
  {
    id: 'cat_01',
    articleRef: 'SSD-NVME-1TB-KNG',
    description: 'SSD Kingston KC3000 1TB M.2 NVMe PCIe 4.0 7000MB/s',
    category: 'Armazenamento',
    unitCost: 65.0,
    unitPrice: 94.9,
    taxRate: 23,
    stockQuantity: 12,
  },
  {
    id: 'cat_02',
    articleRef: 'BAT-LEN-T14-G3',
    description: 'Bateria Original Lenovo 52.5Wh ThinkPad T14 Gen3',
    category: 'Baterias',
    unitCost: 52.0,
    unitPrice: 85.0,
    taxRate: 23,
    stockQuantity: 4,
  },
  {
    id: 'cat_03',
    articleRef: 'PAST-NOCT-NT-H2',
    description: 'Composto Térmico Premium Noctua NT-H2 3.5g',
    category: 'Consumíveis',
    unitCost: 5.5,
    unitPrice: 12.5,
    taxRate: 23,
    stockQuantity: 28,
  },
  {
    id: 'cat_04',
    articleRef: 'FONTE-CORSAIR-RM750e',
    description: 'Fonte de Alimentação Modular Corsair RM750e 750W 80+ Gold ATX 3.0',
    category: 'Fontes',
    unitCost: 78.0,
    unitPrice: 119.0,
    taxRate: 23,
    stockQuantity: 6,
  },
  {
    id: 'cat_05',
    articleRef: 'SERV-MO-HORA',
    description: 'Mão de Obra Técnica Especializada (1 Hora)',
    category: 'Serviços',
    unitCost: 0.0,
    unitPrice: 38.0,
    taxRate: 23,
    stockQuantity: 9999,
  },
  {
    id: 'cat_06',
    articleRef: 'SERV-DIAG-EXPRESS',
    description: 'Diagnóstico e Benchmarking de Hardware em Laboratório',
    category: 'Serviços',
    unitCost: 0.0,
    unitPrice: 25.0,
    taxRate: 23,
    stockQuantity: 9999,
  },
  {
    id: 'cat_07',
    articleRef: 'SERV-LIMPEZA-THERMAL',
    description: 'Desmontagem, Desoxidação Ultrassónica e Repastagem Térmica',
    category: 'Serviços',
    unitCost: 3.5,
    unitPrice: 45.0,
    taxRate: 23,
    stockQuantity: 9999,
  },
];

export const INITIAL_ORDERS: ServiceOrder[] = [
  {
    id: 'ord_001',
    visibleNumber: 'AT-2026-00101',
    customerId: 'cust_001',
    equipmentId: 'eq_001',
    createdAt: '2026-04-10T10:15:00Z',
    createdByUserId: 'usr_rececao',
    status: 'em_diagnostico',
    priority: 'alta',
    isWarranty: false,
    reportedFault:
      'Portátil desliga-se subitamente após 10 a 15 minutos de utilização intensa. Ventoinha faz ruído estranho tipo atrito.',
    externalDamageState: 'Bom estado geral. Desgaste normal nas quinas da tampa.',
    accessoriesReceived: 'Carregador Lenovo USB-C 65W original e cabo tripolar.',
    assignedTechnicianId: 'usr_tecnico',
    diagnosis:
      'Sobre-aquecimento no processador Core i7 a atingir 100ºC em throttle térmico. Rolamento da ventoinha da turbina com folga.',
    estimatedDeliveryDate: '2026-04-14',
    internalNotes: 'Cliente tem viagem na próxima semana, solicitou urgência.',
    reopeningCount: 0,
  },
  {
    id: 'ord_002',
    visibleNumber: 'AT-2026-00102',
    customerId: 'cust_002',
    equipmentId: 'eq_002',
    createdAt: '2026-04-08T09:00:00Z',
    createdByUserId: 'usr_rececao',
    status: 'aguarda_aprovacao',
    priority: 'urgente',
    isWarranty: false,
    reportedFault:
      'Não liga. LED da fonte pisca em código de erro âmbar (2 piscadelas, pausa, 4 piscadelas). Cheiro a componente queimado.',
    externalDamageState: 'Excelente estado, instalado em bastidor com calhas.',
    accessoriesReceived: 'Chassis completo, sem cabos externos.',
    assignedTechnicianId: 'usr_tecnico',
    diagnosis:
      'Curto-circuito na linha secundária de 12V da fonte ATX interna. Motherboard sem danos após teste com fonte de bancada.',
    estimatedDeliveryDate: '2026-04-12',
    internalNotes: 'Orçamento enviado para aprovação por email da direção de TI.',
    reopeningCount: 0,
  },
  {
    id: 'ord_003',
    visibleNumber: 'AT-2026-00103',
    customerId: 'cust_003',
    equipmentId: 'eq_003',
    createdAt: '2026-04-05T14:30:00Z',
    createdByUserId: 'usr_rececao',
    status: 'pronto_levantamento',
    priority: 'normal',
    isWarranty: false,
    reportedFault: 'Teclado com teclas "Espaço" e "Enter" presas e pegajosas após derrame ligeiro de sumo.',
    externalDamageState: 'Pequena mossa no canto inferior esquerdo já registada na receção.',
    accessoriesReceived: 'Carregador MagSafe 3 Apple 35W Dual USB-C.',
    assignedTechnicianId: 'usr_tecnico',
    diagnosis: 'Resíduos açucarados sob os mecanismos de tesoura. Sem oxidação na placa lógica.',
    completedWork:
      'Desmontagem completa, limpeza e desoxidação por ultrassons dos mecanismos individuais de teclas, testes de acionamento 100% OK.',
    estimatedDeliveryDate: '2026-04-09',
    internalNotes: 'SMS e email de notificação de pronto enviados.',
    reopeningCount: 0,
    approvalRecord: {
      approvedAt: '2026-04-06T11:00:00Z',
      approvedByMethod: 'telefone',
      registeredByUserId: 'usr_rececao',
      notes: 'Cliente aprovou valor de 45€ + IVA por chamada telefónica.',
    },
  },
  {
    id: 'ord_004',
    visibleNumber: 'AT-2026-00104',
    customerId: 'cust_004',
    equipmentId: 'eq_004',
    createdAt: '2026-03-25T11:00:00Z',
    createdByUserId: 'usr_admin',
    status: 'entregue_fechado',
    priority: 'alta',
    isWarranty: true,
    reportedFault: 'Disco 4 do arranjo RAID em estado de degradação preditiva (SMART amber light).',
    externalDamageState: 'Sem danos.',
    accessoriesReceived: 'Servidor completo com tampas e chaves.',
    assignedTechnicianId: 'usr_tecnico',
    diagnosis: 'Disco SAS 1.2TB com setores pendentes de realocação excessivos.',
    completedWork: 'Substituição do disco SAS hot-plug em garantia da reparação anterior, rebuild do RAID concluído com êxito.',
    closedAt: '2026-03-28T17:30:00Z',
    deliveredAt: '2026-03-29T10:00:00Z',
    deliveredToName: 'Eng. Fernando Costa (Diretor Técnico Traço Nobre)',
    internalNotes: 'Equipamento em garantia. Sem custos para o cliente.',
    reopeningCount: 0,
  },
  {
    id: 'ord_005',
    visibleNumber: 'AT-2026-00105',
    customerId: 'cust_001',
    equipmentId: 'eq_005',
    createdAt: '2026-04-12T16:20:00Z',
    createdByUserId: 'usr_rececao',
    status: 'recebido',
    priority: 'normal',
    isWarranty: false,
    reportedFault: 'Monitor apaga o ecrã aleatoriamente e faz estalidos na zona da entrada de alimentação.',
    externalDamageState: 'Impecável.',
    accessoriesReceived: 'Cabo USB-C e cabo de alimentação schuko.',
    assignedTechnicianId: undefined,
    internalNotes: 'Aguardar alocação de bancada de eletrónica.',
    reopeningCount: 0,
  },
];

export const INITIAL_EVENTS: ServiceEvent[] = [
  {
    id: 'evt_01',
    serviceOrderId: 'ord_001',
    fromStatus: 'recebido',
    toStatus: 'em_diagnostico',
    timestamp: '2026-04-10T11:00:00Z',
    userId: 'usr_tecnico',
    userName: 'Rui Duarte',
    notes: 'Iniciado diagnóstico de stress térmico e desmontagem do dissipador.',
  },
  {
    id: 'evt_02',
    serviceOrderId: 'ord_002',
    fromStatus: 'recebido',
    toStatus: 'em_diagnostico',
    timestamp: '2026-04-08T10:30:00Z',
    userId: 'usr_tecnico',
    userName: 'Rui Duarte',
    notes: 'Abertura do chassis e medições nas linhas de alimentação com multímetro.',
  },
  {
    id: 'evt_03',
    serviceOrderId: 'ord_002',
    fromStatus: 'em_diagnostico',
    toStatus: 'aguarda_aprovacao',
    timestamp: '2026-04-09T15:00:00Z',
    userId: 'usr_rececao',
    userName: 'Ana Silva',
    notes: 'Orçamento ORC-2026-00045 emitido e enviado por email.',
  },
  {
    id: 'evt_04',
    serviceOrderId: 'ord_003',
    fromStatus: 'em_testes',
    toStatus: 'pronto_levantamento',
    timestamp: '2026-04-08T18:00:00Z',
    userId: 'usr_tecnico',
    userName: 'Rui Duarte',
    notes: 'Bateria de testes de escrita de 10 páginas e calibragem OK. Equipamento limpo e embalado.',
  },
];

export const INITIAL_INTERVENTIONS: Intervention[] = [
  {
    id: 'int_001',
    serviceOrderId: 'ord_001',
    technicianId: 'usr_tecnico',
    startDateTime: '2026-04-10T11:00:00Z',
    endDateTime: '2026-04-10T12:15:00Z',
    durationMinutes: 75,
    diagnosisNotes: 'Teste sob AIDA64 revelou thermal throttling imediato a 100ºC. Ventoinha presa com sujidade compactada.',
    workDone: 'Desmontagem de heatpipes, aspiração ionizada da turbina, limpeza de restos de pasta ressequida com álcool isopropílico 99%.',
    testResults: 'Temperatura idle baixou de 65ºC para 41ºC. Ruído mecânico reduzido mas rolamento ainda apresenta vibração.',
    createdAt: '2026-04-10T12:20:00Z',
  },
  {
    id: 'int_002',
    serviceOrderId: 'ord_003',
    technicianId: 'usr_tecnico',
    startDateTime: '2026-04-07T14:00:00Z',
    endDateTime: '2026-04-07T15:45:00Z',
    durationMinutes: 105,
    diagnosisNotes: 'Teclas presas devido a derrame açucarado localizado.',
    workDone: 'Remoção cautelosa das capas de tecla, banho ultrassónico dos mecanismos, secagem e remontagem.',
    testResults: 'Todas as teclas 100% responsivas em teste de digitação online.',
    createdAt: '2026-04-07T16:00:00Z',
  },
];

export const INITIAL_PARTS: ServicePart[] = [
  {
    id: 'part_001',
    serviceOrderId: 'ord_001',
    interventionId: 'int_001',
    articleRef: 'PAST-NOCT-NT-H2',
    description: 'Composto Térmico Premium Noctua NT-H2 (Aplicação em Laboratório)',
    quantity: 1,
    unitCost: 2.5,
    unitPrice: 9.5,
    taxRate: 23,
    registeredAt: '2026-04-10T11:45:00Z',
    registeredByUserId: 'usr_tecnico',
  },
  {
    id: 'part_002',
    serviceOrderId: 'ord_001',
    interventionId: 'int_001',
    articleRef: 'SERV-MO-HORA',
    description: 'Mão de Obra Técnica Especializada (1h15m)',
    quantity: 1.25,
    unitCost: 0.0,
    unitPrice: 38.0,
    taxRate: 23,
    registeredAt: '2026-04-10T12:15:00Z',
    registeredByUserId: 'usr_tecnico',
  },
  {
    id: 'part_003',
    serviceOrderId: 'ord_003',
    interventionId: 'int_002',
    articleRef: 'SERV-LIMPEZA-THERMAL',
    description: 'Desoxidação Ultrassónica e Limpeza de Teclado',
    quantity: 1,
    unitCost: 3.5,
    unitPrice: 45.0,
    taxRate: 23,
    registeredAt: '2026-04-07T15:45:00Z',
    registeredByUserId: 'usr_tecnico',
  },
];

export const INITIAL_QUOTES: Quote[] = [
  {
    id: 'quote_001',
    serviceOrderId: 'ord_002',
    version: 1,
    visibleNumber: 'ORC-2026-00045-v1',
    status: 'enviado',
    lines: [
      {
        id: 'ql_01',
        type: 'peca',
        articleRef: 'FONTE-CORSAIR-RM750e',
        description: 'Fonte de Alimentação Modular Corsair RM750e 750W 80+ Gold ATX 3.0',
        quantity: 1,
        unitPrice: 119.0,
        taxRate: 23,
        subtotal: 119.0,
      },
      {
        id: 'ql_02',
        type: 'mao_de_obra',
        articleRef: 'SERV-MO-HORA',
        description: 'Instalação, montagem em bastidor e cable management',
        quantity: 1.5,
        unitPrice: 38.0,
        taxRate: 23,
        subtotal: 57.0,
      },
    ],
    subtotal: 176.0,
    taxTotal: 40.48,
    total: 216.48,
    validUntil: '2026-04-24',
    createdAt: '2026-04-09T14:45:00Z',
    createdByUserId: 'usr_rececao',
  },
];

export const INITIAL_DOCS: DocumentRecord[] = [
  {
    id: 'doc_001',
    serviceOrderId: 'ord_001',
    type: 'folha_a5',
    title: 'Folha de Assistência Técnica A5 - Versão 1',
    version: 1,
    issuedAt: '2026-04-10T10:16:00Z',
    issuedByUserId: 'usr_rececao',
    notes: 'Emitida fisicamente na receção para acompanhar o equipamento em bancada.',
  },
  {
    id: 'doc_002',
    serviceOrderId: 'ord_003',
    type: 'folha_a5',
    title: 'Folha de Assistência Técnica A5 - Versão 1',
    version: 1,
    issuedAt: '2026-04-05T14:31:00Z',
    issuedByUserId: 'usr_rececao',
    notes: 'Impressa na receção.',
  },
];

export const INITIAL_BILLING_DOCS: BillingDocument[] = [
  {
    id: 'bill_001',
    serviceOrderId: 'ord_004',
    provider: 'MockBilling (Dev Adapter)',
    status: 'sincronizado',
    externalDocNumber: 'FT 2026/0894',
    externalId: 'EXT-MOLONI-89412',
    subtotal: 0.0,
    taxTotal: 0.0,
    total: 0.0,
    syncedAt: '2026-03-29T10:05:00Z',
    attemptsCount: 1,
    idempotencyKey: 'IDEMP-ORD-004-20260329',
  },
  {
    id: 'bill_002',
    serviceOrderId: 'ord_003',
    quoteId: undefined,
    provider: 'MockBilling (Dev Adapter)',
    status: 'pendente_sincronizacao',
    subtotal: 45.0,
    taxTotal: 10.35,
    total: 55.35,
    attemptsCount: 0,
    idempotencyKey: 'IDEMP-ORD-003-20260408',
  },
];

export const INITIAL_INTEGRATION_LOGS: IntegrationAttempt[] = [
  {
    id: 'log_001',
    billingDocId: 'bill_001',
    serviceOrderVisibleNumber: 'AT-2026-00104',
    operation: 'EXPORT_INVOICE_RECORD',
    timestamp: '2026-03-29T10:05:00Z',
    success: true,
    httpStatus: 200,
    message: 'Documento criado e mapeado com sucesso no software externo sob a referência FT 2026/0894.',
    payloadPreview: '{"customerNif": "510258741", "total": 0.00, "isWarranty": true}',
  },
];

export const INITIAL_AUDIT: AuditLog[] = [
  {
    id: 'aud_01',
    timestamp: '2026-04-12T16:20:00Z',
    userId: 'usr_rececao',
    userName: 'Ana Silva',
    action: 'CRIAR_ASSISTENCIA',
    entity: 'service_order',
    entityId: 'AT-2026-00105',
    details: 'Abertura de nova assistência técnica para equipamento Monitor Dell UltraSharp.',
  },
  {
    id: 'aud_02',
    timestamp: '2026-04-10T10:15:00Z',
    userId: 'usr_rececao',
    userName: 'Ana Silva',
    action: 'IMPRIMIR_FOLHA_A5',
    entity: 'service_order',
    entityId: 'AT-2026-00101',
    details: 'Geração e emissão de folha A5 para acompanhamento físico.',
  },
  {
    id: 'aud_03',
    timestamp: '2026-04-09T14:45:00Z',
    userId: 'usr_rececao',
    userName: 'Ana Silva',
    action: 'CRIAR_ORCAMENTO',
    entity: 'quote',
    entityId: 'ORC-2026-00045-v1',
    details: 'Emissão de orçamento no valor de 216.48€ para substituição de fonte.',
  },
];

// Helper to safely read from localStorage
function readStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error reading ${key}:`, e);
    return defaultValue;
  }
}

// Helper to safely write to localStorage
function writeStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key}:`, e);
  }
}

export class DataStore {
  // Authentication & Session
  static getAuthenticatedUser(): User | null {
    return readStorage<User | null>(STORAGE_KEYS.AUTH_USER, null);
  }

  static setAuthenticatedUser(user: User | null): void {
    writeStorage(STORAGE_KEYS.AUTH_USER, user);
    if (user) {
      writeStorage(STORAGE_KEYS.CURRENT_USER, user);
    }
  }

  static logout(): void {
    writeStorage(STORAGE_KEYS.AUTH_USER, null);
  }

  static authenticate(identifier: string, password: string): { success: boolean; user?: User; error?: string } {
    if (!identifier.trim() || !password) {
      return { success: false, error: 'Por favor preencha o utilizador/email e a palavra-passe.' };
    }

    const users = this.getUsers();
    const cleanId = identifier.trim().toLowerCase();
    const found = users.find(
      u => u.username?.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId
    );

    if (!found) {
      return { success: false, error: 'Utilizador ou email não registado no sistema.' };
    }

    if (!found.active) {
      return { success: false, error: 'Esta conta de utilizador encontra-se desativada pela administração.' };
    }

    if (found.password !== password) {
      return { success: false, error: 'Palavra-passe incorreta. Tente novamente.' };
    }

    // Set authenticated
    this.setAuthenticatedUser(found);
    return { success: true, user: found };
  }

  // Current user state
  static getCurrentUser(): User {
    const auth = this.getAuthenticatedUser();
    if (auth) return auth;
    const saved = readStorage<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (saved) return saved;
    return INITIAL_USERS[0];
  }

  static setCurrentUser(user: User): void {
    writeStorage(STORAGE_KEYS.CURRENT_USER, user);
  }

  static getUsers(): User[] {
    const list = readStorage<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    // Ensure super admin exists with user 'admin' and pass '123456'
    const hasAdmin = list.some(u => u.username === 'admin');
    if (!hasAdmin) {
      writeStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
      return INITIAL_USERS;
    }
    return list;
  }

  static getTechnicians(onlyActive = true): User[] {
    const all = this.getUsers().filter(u => u.role === 'tecnico');
    if (!onlyActive) return all;
    return all.filter(u => u.active);
  }

  static saveUser(user: User, actorId?: string, actorName?: string): User {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    const now = new Date().toISOString();

    if (index >= 0) {
      users[index] = { ...user };
      writeStorage(STORAGE_KEYS.USERS, users);
      if (actorId && actorName) {
        this.addAuditLog(actorId, actorName, 'EDITAR_UTILIZADOR', 'user', user.username || user.name, `Utilizador/Técnico ${user.name} atualizado`);
      }
      return users[index];
    } else {
      const newUser: User = {
        ...user,
        id: user.id || `usr_${Date.now()}`,
        active: user.active !== undefined ? user.active : true,
        createdAt: now,
      };
      users.push(newUser);
      writeStorage(STORAGE_KEYS.USERS, users);
      if (actorId && actorName) {
        this.addAuditLog(actorId, actorName, 'CRIAR_UTILIZADOR', 'user', newUser.username || newUser.name, `Novo utilizador/técnico criado: ${newUser.name} (${newUser.role})`);
      }
      return newUser;
    }
  }

  static toggleUserActive(userId: string, actorId: string, actorName: string): { success: boolean; user?: User; error?: string } {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return { success: false, error: 'Utilizador não encontrado.' };

    if (user.isSuperAdmin || user.username === 'admin') {
      return { success: false, error: 'Não é permitido desativar a conta do Super Administrador principal.' };
    }

    user.active = !user.active;
    writeStorage(STORAGE_KEYS.USERS, users);
    const action = user.active ? 'REATIVAR_UTILIZADOR' : 'DESATIVAR_UTILIZADOR';
    this.addAuditLog(actorId, actorName, action, 'user', user.username || user.name, `Conta de ${user.name} foi ${user.active ? 'reativada' : 'desativada'}`);
    return { success: true, user };
  }

  static deleteUser(userId: string, actorId: string, actorName: string): { success: boolean; error?: string } {
    const users = this.getUsers();
    const target = users.find(u => u.id === userId);
    if (!target) return { success: false, error: 'Utilizador não encontrado.' };

    if (target.isSuperAdmin || target.username === 'admin') {
      return { success: false, error: 'Não é permitido eliminar a conta do Super Administrador principal.' };
    }

    const filtered = users.filter(u => u.id !== userId);
    writeStorage(STORAGE_KEYS.USERS, filtered);
    this.addAuditLog(actorId, actorName, 'ELIMINAR_UTILIZADOR', 'user', target.username || target.name, `Utilizador/Técnico ${target.name} eliminado`);
    return { success: true };
  }

  // Settings
  static getSettings(): AppSettings {
    const current = readStorage<AppSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    if (
      !current.brandName ||
      !current.commercialName ||
      current.companyName?.includes('InfoTech') ||
      current.companyName === 'Foz Sistemas - Tecnologias de Informação'
    ) {
      const merged: AppSettings = {
        ...INITIAL_SETTINGS,
        ...current,
        brandName: 'FSYS360',
        commercialName: 'FSYS360 Service',
        brandDescription: 'Gestão de Assistências Técnicas',
        companyName:
          current.companyName === 'Foz Sistemas - Tecnologias de Informação'
            ? 'FSYS360 Service'
            : current.companyName || 'FSYS360 Service',
        legalName: current.legalName?.includes('Foz')
          ? 'FozSistemas - Equipamentos e Sistemas de Informação, Lda.'
          : current.legalName || 'FozSistemas - Equipamentos e Sistemas de Informação, Lda.',
      };
      writeStorage(STORAGE_KEYS.SETTINGS, merged);
      return merged;
    }
    return current;
  }

  static saveSettings(settings: AppSettings, userId: string, userName: string): void {
    writeStorage(STORAGE_KEYS.SETTINGS, settings);
    this.addAuditLog(userId, userName, 'ATUALIZAR_DEFINICOES', 'app_settings', 'company', 'Definições da empresa atualizadas');
  }

  // Customers
  static getCustomers(): Customer[] {
    return readStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  }

  static getCustomerById(id: string): Customer | undefined {
    return this.getCustomers().find(c => c.id === id);
  }

  static saveCustomer(customer: Customer, userId: string, userName: string): Customer {
    const customers = this.getCustomers();
    const index = customers.findIndex(c => c.id === customer.id);
    const now = new Date().toISOString();
    
    if (index >= 0) {
      customers[index] = { ...customer, updatedAt: now };
      writeStorage(STORAGE_KEYS.CUSTOMERS, customers);
      this.addAuditLog(userId, userName, 'EDITAR_CLIENTE', 'customer', customer.id, `Cliente ${customer.name} atualizado`);
      return customers[index];
    } else {
      const newCustomer: Customer = {
        ...customer,
        id: customer.id || `cust_${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      };
      customers.unshift(newCustomer);
      writeStorage(STORAGE_KEYS.CUSTOMERS, customers);
      this.addAuditLog(userId, userName, 'CRIAR_CLIENTE', 'customer', newCustomer.id, `Novo cliente criado: ${newCustomer.name}`);
      return newCustomer;
    }
  }

  // Equipment
  static getEquipment(): Equipment[] {
    return readStorage<Equipment[]>(STORAGE_KEYS.EQUIPMENT, INITIAL_EQUIPMENT);
  }

  static getEquipmentById(id: string): Equipment | undefined {
    return this.getEquipment().find(e => e.id === id);
  }

  static getEquipmentByCustomerId(customerId: string): Equipment[] {
    return this.getEquipment().filter(e => e.customerId === customerId);
  }

  static saveEquipment(equipment: Equipment, userId: string, userName: string): Equipment {
    const list = this.getEquipment();
    const index = list.findIndex(e => e.id === equipment.id);
    const now = new Date().toISOString();

    if (index >= 0) {
      list[index] = { ...equipment, updatedAt: now };
      writeStorage(STORAGE_KEYS.EQUIPMENT, list);
      this.addAuditLog(userId, userName, 'EDITAR_EQUIPAMENTO', 'equipment', equipment.id, `Equipamento ${equipment.brand} ${equipment.model} (${equipment.internalTag}) atualizado`);
      return list[index];
    } else {
      const newEquip: Equipment = {
        ...equipment,
        id: equipment.id || `eq_${Date.now()}`,
        internalTag: equipment.internalTag || `EQ-2026-${String(list.length + 1).padStart(2, '0')}`,
        createdAt: now,
        updatedAt: now,
      };
      list.unshift(newEquip);
      writeStorage(STORAGE_KEYS.EQUIPMENT, list);
      this.addAuditLog(userId, userName, 'CRIAR_EQUIPAMENTO', 'equipment', newEquip.id, `Novo equipamento registado: ${newEquip.brand} ${newEquip.model} (${newEquip.serialNumber})`);
      return newEquip;
    }
  }

  // Service Orders & Unique Sequence
  static getNextOrderNumber(): string {
    const currentSeq = readStorage<number>(STORAGE_KEYS.ORDER_SEQUENCE, 105);
    const nextSeq = currentSeq + 1;
    writeStorage(STORAGE_KEYS.ORDER_SEQUENCE, nextSeq);
    return `AT-2026-${String(nextSeq).padStart(5, '0')}`;
  }

  static getServiceOrders(): ServiceOrder[] {
    return readStorage<ServiceOrder[]>(STORAGE_KEYS.SERVICE_ORDERS, INITIAL_ORDERS);
  }

  static getServiceOrderById(id: string): ServiceOrder | undefined {
    return this.getServiceOrders().find(o => o.id === id);
  }

  static saveServiceOrder(order: ServiceOrder, userId: string, userName: string): ServiceOrder {
    const orders = this.getServiceOrders();
    const index = orders.findIndex(o => o.id === order.id);

    if (index >= 0) {
      const old = orders[index];
      orders[index] = order;
      writeStorage(STORAGE_KEYS.SERVICE_ORDERS, orders);

      if (old.status !== order.status) {
        this.addServiceEvent(order.id, old.status, order.status, userId, userName, `Transição de estado para ${order.status}`);
      }
      this.addAuditLog(userId, userName, 'EDITAR_ASSISTENCIA', 'service_order', order.visibleNumber, `Assistência ${order.visibleNumber} atualizada`);
      return order;
    } else {
      const visibleNum = order.visibleNumber || this.getNextOrderNumber();
      const newOrder: ServiceOrder = {
        ...order,
        id: order.id || `ord_${Date.now()}`,
        visibleNumber: visibleNum,
        createdAt: order.createdAt || new Date().toISOString(),
        reopeningCount: 0,
      };
      orders.unshift(newOrder);
      writeStorage(STORAGE_KEYS.SERVICE_ORDERS, orders);

      this.addServiceEvent(newOrder.id, 'recebido', newOrder.status, userId, userName, 'Registo de entrada de equipamento e abertura de ordem técnica');
      this.addAuditLog(userId, userName, 'CRIAR_ASSISTENCIA', 'service_order', newOrder.visibleNumber, `Nova assistência aberta: ${newOrder.visibleNumber}`);
      return newOrder;
    }
  }

  static updateOrderStatus(
    orderId: string,
    newStatus: ServiceOrderStatus,
    notes: string,
    userId: string,
    userName: string
  ): ServiceOrder | undefined {
    const orders = this.getServiceOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index < 0) return undefined;

    const currentOrder = orders[index];
    const prevStatus = currentOrder.status;
    if (prevStatus === newStatus) return currentOrder;

    const updated: ServiceOrder = {
      ...currentOrder,
      status: newStatus,
    };

    if (newStatus === 'entregue_fechado') {
      updated.closedAt = new Date().toISOString();
      updated.deliveredAt = updated.deliveredAt || new Date().toISOString();
    }

    orders[index] = updated;
    writeStorage(STORAGE_KEYS.SERVICE_ORDERS, orders);

    this.addServiceEvent(orderId, prevStatus, newStatus, userId, userName, notes || `Estado alterado para ${newStatus}`);
    this.addAuditLog(userId, userName, 'ALTERAR_ESTADO', 'service_order', updated.visibleNumber, `Estado mudado de ${prevStatus} para ${newStatus}. Obs: ${notes}`);
    return updated;
  }

  // Service Events (History)
  static getServiceEvents(serviceOrderId?: string): ServiceEvent[] {
    const all = readStorage<ServiceEvent[]>(STORAGE_KEYS.SERVICE_EVENTS, INITIAL_EVENTS);
    if (!serviceOrderId) return all;
    return all.filter(e => e.serviceOrderId === serviceOrderId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  static addServiceEvent(
    serviceOrderId: string,
    fromStatus: ServiceOrderStatus,
    toStatus: ServiceOrderStatus,
    userId: string,
    userName: string,
    notes: string
  ): ServiceEvent {
    const events = this.getServiceEvents();
    const newEvent: ServiceEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      serviceOrderId,
      fromStatus,
      toStatus,
      timestamp: new Date().toISOString(),
      userId,
      userName,
      notes,
    };
    events.unshift(newEvent);
    writeStorage(STORAGE_KEYS.SERVICE_EVENTS, events);
    return newEvent;
  }

  // Interventions
  static getInterventions(serviceOrderId?: string): Intervention[] {
    const all = readStorage<Intervention[]>(STORAGE_KEYS.INTERVENTIONS, INITIAL_INTERVENTIONS);
    if (!serviceOrderId) return all;
    return all.filter(i => i.serviceOrderId === serviceOrderId).sort((a, b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime());
  }

  static saveIntervention(intervention: Intervention, userId: string, userName: string): Intervention {
    const list = this.getInterventions();
    const index = list.findIndex(i => i.id === intervention.id);

    if (index >= 0) {
      list[index] = intervention;
      writeStorage(STORAGE_KEYS.INTERVENTIONS, list);
      this.addAuditLog(userId, userName, 'EDITAR_INTERVENCAO', 'intervention', intervention.id, `Intervenção técnica atualizada (${intervention.durationMinutes} min)`);
      return list[index];
    } else {
      const newIntervention: Intervention = {
        ...intervention,
        id: intervention.id || `int_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      list.unshift(newIntervention);
      writeStorage(STORAGE_KEYS.INTERVENTIONS, list);
      this.addAuditLog(userId, userName, 'REGISTAR_INTERVENCAO', 'intervention', newIntervention.id, `Registo de intervenção técnica: ${newIntervention.durationMinutes} minutos`);
      return newIntervention;
    }
  }

  // Parts
  static getServiceParts(serviceOrderId?: string): ServicePart[] {
    const all = readStorage<ServicePart[]>(STORAGE_KEYS.SERVICE_PARTS, INITIAL_PARTS);
    if (!serviceOrderId) return all;
    return all.filter(p => p.serviceOrderId === serviceOrderId);
  }

  static addServicePart(part: ServicePart, userId: string, userName: string): ServicePart {
    const parts = this.getServiceParts();
    const newPart: ServicePart = {
      ...part,
      id: part.id || `part_${Date.now()}`,
      registeredAt: new Date().toISOString(),
      registeredByUserId: userId,
    };
    parts.unshift(newPart);
    writeStorage(STORAGE_KEYS.SERVICE_PARTS, parts);

    // Deduct stock if in catalog
    const catalog = this.getCatalog();
    const catItem = catalog.find(c => c.articleRef === part.articleRef);
    if (catItem && catItem.category !== 'Serviços') {
      catItem.stockQuantity = Math.max(0, catItem.stockQuantity - part.quantity);
      writeStorage(STORAGE_KEYS.CATALOG, catalog);
    }

    this.addAuditLog(userId, userName, 'ADICIONAR_PECA', 'service_part', newPart.articleRef, `Peça/Serviço adicionado: ${newPart.description} (Qtd: ${newPart.quantity})`);
    return newPart;
  }

  static removeServicePart(partId: string, userId: string, userName: string): void {
    const parts = this.getServiceParts();
    const target = parts.find(p => p.id === partId);
    if (target) {
      const filtered = parts.filter(p => p.id !== partId);
      writeStorage(STORAGE_KEYS.SERVICE_PARTS, filtered);
      this.addAuditLog(userId, userName, 'REMOVER_PECA', 'service_part', target.articleRef, `Artigo removido da assistência: ${target.description}`);
    }
  }

  // Catalog
  static getCatalog(): CatalogPart[] {
    return readStorage<CatalogPart[]>(STORAGE_KEYS.CATALOG, INITIAL_CATALOG);
  }

  static saveCatalogPart(part: CatalogPart, userId: string, userName: string): CatalogPart {
    const cat = this.getCatalog();
    const index = cat.findIndex(c => c.id === part.id);
    if (index >= 0) {
      cat[index] = part;
      writeStorage(STORAGE_KEYS.CATALOG, cat);
      this.addAuditLog(userId, userName, 'EDITAR_CATALOGO', 'catalog', part.articleRef, `Artigo de catálogo atualizado: ${part.description}`);
      return cat[index];
    } else {
      const newPart: CatalogPart = {
        ...part,
        id: part.id || `cat_${Date.now()}`,
      };
      cat.push(newPart);
      writeStorage(STORAGE_KEYS.CATALOG, cat);
      this.addAuditLog(userId, userName, 'CRIAR_ARTIGO_CATALOGO', 'catalog', newPart.articleRef, `Novo artigo adicionado ao catálogo: ${newPart.description}`);
      return newPart;
    }
  }

  // Quotes
  static getQuotes(serviceOrderId?: string): Quote[] {
    const all = readStorage<Quote[]>(STORAGE_KEYS.QUOTES, INITIAL_QUOTES);
    if (!serviceOrderId) return all;
    return all.filter(q => q.serviceOrderId === serviceOrderId).sort((a, b) => b.version - a.version);
  }

  static saveQuote(quote: Quote, userId: string, userName: string): Quote {
    const quotes = this.getQuotes();
    const index = quotes.findIndex(q => q.id === quote.id);

    if (index >= 0) {
      quotes[index] = quote;
      writeStorage(STORAGE_KEYS.QUOTES, quotes);
      this.addAuditLog(userId, userName, 'ATUALIZAR_ORCAMENTO', 'quote', quote.visibleNumber, `Orçamento ${quote.visibleNumber} atualizado (Estado: ${quote.status})`);
      return quotes[index];
    } else {
      const newQuote: Quote = {
        ...quote,
        id: quote.id || `quote_${Date.now()}`,
        visibleNumber: quote.visibleNumber || `ORC-2026-${String(quotes.length + 46).padStart(5, '0')}-v${quote.version || 1}`,
        createdAt: quote.createdAt || new Date().toISOString(),
      };
      quotes.unshift(newQuote);
      writeStorage(STORAGE_KEYS.QUOTES, quotes);
      this.addAuditLog(userId, userName, 'CRIAR_ORCAMENTO', 'quote', newQuote.visibleNumber, `Novo orçamento emitido no valor de ${newQuote.total.toFixed(2)}€`);
      return newQuote;
    }
  }

  // Documents
  static getDocuments(serviceOrderId?: string): DocumentRecord[] {
    const all = readStorage<DocumentRecord[]>(STORAGE_KEYS.DOCUMENTS, INITIAL_DOCS);
    if (!serviceOrderId) return all;
    return all.filter(d => d.serviceOrderId === serviceOrderId).sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
  }

  static recordDocument(
    serviceOrderId: string,
    type: 'folha_a5' | 'etiqueta' | 'orcamento' | 'relatorio_tecnico' | 'folha_entrega',
    title: string,
    userId: string,
    userName: string,
    notes?: string
  ): DocumentRecord {
    const docs = this.getDocuments();
    const existingVersionCount = docs.filter(d => d.serviceOrderId === serviceOrderId && d.type === type).length;
    const newDoc: DocumentRecord = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      serviceOrderId,
      type,
      title: `${title} (v${existingVersionCount + 1})`,
      version: existingVersionCount + 1,
      issuedAt: new Date().toISOString(),
      issuedByUserId: userId,
      notes: notes || `Documento gerado e arquivado no histórico da assistência`,
    };
    docs.unshift(newDoc);
    writeStorage(STORAGE_KEYS.DOCUMENTS, docs);
    this.addAuditLog(userId, userName, 'EMISSAO_DOCUMENTO', 'document', newDoc.id, `Emissão de ${title} v${newDoc.version}`);
    return newDoc;
  }

  // Billing
  static getBillingDocuments(): BillingDocument[] {
    return readStorage<BillingDocument[]>(STORAGE_KEYS.BILLING_DOCS, INITIAL_BILLING_DOCS);
  }

  static saveBillingDocument(doc: BillingDocument): void {
    const docs = this.getBillingDocuments();
    const index = docs.findIndex(d => d.id === doc.id);
    if (index >= 0) {
      docs[index] = doc;
    } else {
      docs.unshift(doc);
    }
    writeStorage(STORAGE_KEYS.BILLING_DOCS, docs);
  }

  static getIntegrationLogs(): IntegrationAttempt[] {
    return readStorage<IntegrationAttempt[]>(STORAGE_KEYS.INTEGRATION_LOGS, INITIAL_INTEGRATION_LOGS);
  }

  static addIntegrationLog(attempt: Omit<IntegrationAttempt, 'id'>): IntegrationAttempt {
    const logs = this.getIntegrationLogs();
    const newLog: IntegrationAttempt = {
      ...attempt,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    logs.unshift(newLog);
    writeStorage(STORAGE_KEYS.INTEGRATION_LOGS, logs);
    return newLog;
  }

  // Audit Logs
  static getAuditLogs(): AuditLog[] {
    return readStorage<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  static addAuditLog(
    userId: string,
    userName: string,
    action: string,
    entity: string,
    entityId: string,
    details: string
  ): void {
    const logs = this.getAuditLogs();
    const newEntry: AuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      userId,
      userName,
      action,
      entity,
      entityId,
      details,
    };
    logs.unshift(newEntry);
    // Keep last 500 audit logs
    if (logs.length > 500) logs.pop();
    writeStorage(STORAGE_KEYS.AUDIT_LOGS, logs);
  }

  // Backup & Restore
  static exportFullBackup(): string {
    const payload = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      users: this.getUsers(),
      customers: this.getCustomers(),
      equipment: this.getEquipment(),
      orders: this.getServiceOrders(),
      events: this.getServiceEvents(),
      interventions: this.getInterventions(),
      parts: this.getServiceParts(),
      catalog: this.getCatalog(),
      quotes: this.getQuotes(),
      documents: this.getDocuments(),
      billingDocs: this.getBillingDocuments(),
      integrationLogs: this.getIntegrationLogs(),
      auditLogs: this.getAuditLogs(),
    };
    return JSON.stringify(payload, null, 2);
  }

  static importFullBackup(jsonString: string, userId: string, userName: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (!data.settings || !data.customers || !data.orders) {
        throw new Error('Ficheiro de backup inválido: entidades estruturais ausentes.');
      }
      writeStorage(STORAGE_KEYS.SETTINGS, data.settings);
      if (data.users) writeStorage(STORAGE_KEYS.USERS, data.users);
      writeStorage(STORAGE_KEYS.CUSTOMERS, data.customers);
      writeStorage(STORAGE_KEYS.EQUIPMENT, data.equipment || []);
      writeStorage(STORAGE_KEYS.SERVICE_ORDERS, data.orders);
      writeStorage(STORAGE_KEYS.SERVICE_EVENTS, data.events || []);
      writeStorage(STORAGE_KEYS.INTERVENTIONS, data.interventions || []);
      writeStorage(STORAGE_KEYS.SERVICE_PARTS, data.parts || []);
      writeStorage(STORAGE_KEYS.CATALOG, data.catalog || []);
      writeStorage(STORAGE_KEYS.QUOTES, data.quotes || []);
      writeStorage(STORAGE_KEYS.DOCUMENTS, data.documents || []);
      writeStorage(STORAGE_KEYS.BILLING_DOCS, data.billingDocs || []);
      writeStorage(STORAGE_KEYS.INTEGRATION_LOGS, data.integrationLogs || []);
      writeStorage(STORAGE_KEYS.AUDIT_LOGS, data.auditLogs || []);

      this.addAuditLog(userId, userName, 'RESTAURAR_BACKUP', 'system', 'backup', 'Restauro completo da base de dados efetuado com sucesso');
      return true;
    } catch (e) {
      console.error('Erro ao restaurar backup:', e);
      return false;
    }
  }

  // Reset to initial demo data
  static resetToDemo(userId: string, userName: string): void {
    writeStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    writeStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
    writeStorage(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    writeStorage(STORAGE_KEYS.EQUIPMENT, INITIAL_EQUIPMENT);
    writeStorage(STORAGE_KEYS.SERVICE_ORDERS, INITIAL_ORDERS);
    writeStorage(STORAGE_KEYS.SERVICE_EVENTS, INITIAL_EVENTS);
    writeStorage(STORAGE_KEYS.INTERVENTIONS, INITIAL_INTERVENTIONS);
    writeStorage(STORAGE_KEYS.SERVICE_PARTS, INITIAL_PARTS);
    writeStorage(STORAGE_KEYS.CATALOG, INITIAL_CATALOG);
    writeStorage(STORAGE_KEYS.QUOTES, INITIAL_QUOTES);
    writeStorage(STORAGE_KEYS.DOCUMENTS, INITIAL_DOCS);
    writeStorage(STORAGE_KEYS.BILLING_DOCS, INITIAL_BILLING_DOCS);
    writeStorage(STORAGE_KEYS.INTEGRATION_LOGS, INITIAL_INTEGRATION_LOGS);
    writeStorage(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT);
    writeStorage(STORAGE_KEYS.ORDER_SEQUENCE, 105);

    this.addAuditLog(userId, userName, 'RESET_DEMO', 'system', 'demo', 'Reposição dos dados de demonstração originais');
  }
}
