-- =====================================================================
-- FSYS360 SERVICE — Gestão de Assistências Técnicas
-- FozSistemas (fozsistemas.com) • Figueira da Foz, Portugal
-- Esquema Relacional de Base de Dados para PostgreSQL 14+ / 15+ / 16+
-- =====================================================================

-- Extensões úteis (UUID e Criptografia)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Limpeza preventiva de tabelas se existirem (para migrações limpas)
-- DROP TABLE IF EXISTS audit_logs CASCADE;
-- DROP TABLE IF EXISTS integration_attempts CASCADE;
-- DROP TABLE IF EXISTS billing_documents CASCADE;
-- DROP TABLE IF EXISTS document_records CASCADE;
-- DROP TABLE IF EXISTS quote_lines CASCADE;
-- DROP TABLE IF EXISTS quotes CASCADE;
-- DROP TABLE IF EXISTS service_parts CASCADE;
-- DROP TABLE IF EXISTS catalog_parts CASCADE;
-- DROP TABLE IF EXISTS interventions CASCADE;
-- DROP TABLE IF EXISTS service_events CASCADE;
-- DROP TABLE IF EXISTS service_orders CASCADE;
-- DROP TABLE IF EXISTS equipment CASCADE;
-- DROP TABLE IF EXISTS customers CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS app_settings CASCADE;

-- ---------------------------------------------------------------------
-- 1. TABELA DE DEFINIÇÕES DA ENTIDADE & FOLHA A5 (app_settings)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    brand_name VARCHAR(100) NOT NULL DEFAULT 'FSYS360',
    commercial_name VARCHAR(150) NOT NULL DEFAULT 'FSYS360 Service',
    brand_description VARCHAR(255) NOT NULL DEFAULT 'Gestão de Assistências Técnicas',
    company_name VARCHAR(255) NOT NULL DEFAULT 'FozSistemas — Equipamentos e Sistemas de Informação, Lda.',
    legal_name VARCHAR(255) NOT NULL DEFAULT 'FozSistemas — Equipamentos e Sistemas de Informação, Lda.',
    tax_number VARCHAR(30) NOT NULL DEFAULT '504 180 118',
    address VARCHAR(255) NOT NULL DEFAULT 'Rua Manuel Fernandes Tomaz, 132',
    postal_code VARCHAR(30) NOT NULL DEFAULT '3080-051',
    city VARCHAR(100) NOT NULL DEFAULT 'Figueira da Foz',
    phone VARCHAR(50) NOT NULL DEFAULT '(+351) 233 094 320',
    email VARCHAR(150) NOT NULL DEFAULT 'geral@fozsistemas.com',
    website VARCHAR(150) NOT NULL DEFAULT 'https://fozsistemas.com',
    default_vat_rate NUMERIC(5,2) NOT NULL DEFAULT 23.00,
    default_warranty_days INT NOT NULL DEFAULT 90,
    a5_margins_mm INT NOT NULL DEFAULT 8,
    currency_symbol VARCHAR(10) NOT NULL DEFAULT '€',
    terms_and_conditions TEXT NOT NULL DEFAULT 'O equipamento deve ser levantado no prazo máximo de 90 dias após notificação. A garantia cobre exclusivamente a anomalia reparada e peças substituídas.',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 2. TABELA DE UTILIZADORES E TÉCNICOS (users)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(150) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('admin', 'rececao', 'tecnico', 'gestao')),
    active BOOLEAN NOT NULL DEFAULT true,
    phone VARCHAR(50),
    specialty VARCHAR(150),
    is_super_admin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 3. TABELA DE CLIENTES (customers)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('particular', 'empresa')),
    tax_number VARCHAR(30), -- NIF português (9 dígitos)
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    alt_phone VARCHAR(50),
    address VARCHAR(255) NOT NULL DEFAULT '',
    city VARCHAR(100) NOT NULL DEFAULT '',
    postal_code VARCHAR(30) NOT NULL DEFAULT '',
    notes TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_tax_number ON customers(tax_number);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- ---------------------------------------------------------------------
-- 4. TABELA DE EQUIPAMENTOS (equipment)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS equipment (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    customer_id VARCHAR(50) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'portatil', 'desktop', 'servidor', 'monitor',
        'impressora', 'tablet', 'smartphone', 'periferico', 'outro'
    )),
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(150) NOT NULL,
    serial_number VARCHAR(100) NOT NULL DEFAULT '',
    internal_tag VARCHAR(50) NOT NULL DEFAULT '',
    specs_description TEXT,
    external_notes TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_equipment_customer ON equipment(customer_id);
CREATE INDEX IF NOT EXISTS idx_equipment_serial ON equipment(serial_number);
CREATE INDEX IF NOT EXISTS idx_equipment_tag ON equipment(internal_tag);

-- ---------------------------------------------------------------------
-- 5. TABELA DE ORDENS DE SERVIÇO / ASSISTÊNCIAS (service_orders)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS service_orders (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    visible_number VARCHAR(50) UNIQUE NOT NULL, -- Ex: AT-2026-00101
    customer_id VARCHAR(50) NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    equipment_id VARCHAR(50) NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by_user_id VARCHAR(50) NOT NULL REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'recebido' CHECK (status IN (
        'recebido', 'em_diagnostico', 'aguarda_aprovacao', 'aprovado_em_reparacao',
        'aguarda_pecas', 'aguarda_cliente', 'em_testes', 'pronto_levantamento',
        'entregue_fechado', 'sem_reparacao', 'devolvido_sem_reparar', 'em_garantia'
    )),
    priority VARCHAR(30) NOT NULL DEFAULT 'normal' CHECK (priority IN ('baixa', 'normal', 'alta', 'urgente')),
    is_warranty BOOLEAN NOT NULL DEFAULT false,
    reported_fault TEXT NOT NULL,
    external_damage_state TEXT NOT NULL DEFAULT 'Bom estado geral, com ligeiros sinais normais de uso.',
    accessories_received TEXT NOT NULL DEFAULT 'Apenas o equipamento.',
    assigned_technician_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    diagnosis TEXT,
    completed_work TEXT,
    estimated_delivery_date DATE,
    closed_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    delivered_to_name VARCHAR(150),
    internal_notes TEXT,
    reopening_count INT NOT NULL DEFAULT 0,
    approval_record JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON service_orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON service_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_equipment ON service_orders(equipment_id);
CREATE INDEX IF NOT EXISTS idx_orders_technician ON service_orders(assigned_technician_id);
CREATE INDEX IF NOT EXISTS idx_orders_visible_number ON service_orders(visible_number);

-- ---------------------------------------------------------------------
-- 6. HISTÓRICO DE ESTADOS DA ASSISTÊNCIA (service_events)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS service_events (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    service_order_id VARCHAR(50) NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
    from_status VARCHAR(50) NOT NULL,
    to_status VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id),
    user_name VARCHAR(150) NOT NULL,
    notes TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_events_order ON service_events(service_order_id);

-- ---------------------------------------------------------------------
-- 7. REGISTOS DE BANCADA TÉCNICA & INTERVENÇÕES (interventions)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS interventions (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    service_order_id VARCHAR(50) NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
    technician_id VARCHAR(50) NOT NULL REFERENCES users(id),
    start_date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 0,
    diagnosis_notes TEXT NOT NULL DEFAULT '',
    work_done TEXT NOT NULL DEFAULT '',
    test_results TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_interventions_order ON interventions(service_order_id);
CREATE INDEX IF NOT EXISTS idx_interventions_technician ON interventions(technician_id);

-- ---------------------------------------------------------------------
-- 8. CATÁLOGO DE ARTIGOS & PEÇAS (catalog_parts)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS catalog_parts (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    article_ref VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Geral',
    unit_cost NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    unit_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 23.00,
    stock_quantity INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 9. PEÇAS APLICADAS NA ASSISTÊNCIA (service_parts)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS service_parts (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    service_order_id VARCHAR(50) NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
    intervention_id VARCHAR(50) REFERENCES interventions(id) ON DELETE SET NULL,
    article_ref VARCHAR(50) NOT NULL,
    description VARCHAR(200) NOT NULL,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1.00,
    unit_cost NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    unit_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 23.00,
    serial_or_lot VARCHAR(100),
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    registered_by_user_id VARCHAR(50) NOT NULL REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_parts_order ON service_parts(service_order_id);

-- ---------------------------------------------------------------------
-- 10. ORÇAMENTOS E PROPOSTAS (quotes & quote_lines)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quotes (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    service_order_id VARCHAR(50) NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
    version INT NOT NULL DEFAULT 1,
    visible_number VARCHAR(50) NOT NULL, -- Ex: ORC-2026-00045-v1
    status VARCHAR(30) NOT NULL DEFAULT 'rascunho' CHECK (status IN (
        'rascunho', 'enviado', 'aprovado', 'rejeitado', 'expirado', 'substituido'
    )),
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    tax_total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    valid_until DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by_user_id VARCHAR(50) NOT NULL REFERENCES users(id),
    approval JSONB
);

CREATE INDEX IF NOT EXISTS idx_quotes_order ON quotes(service_order_id);

CREATE TABLE IF NOT EXISTS quote_lines (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    quote_id VARCHAR(50) NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL CHECK (type IN ('peca', 'mao_de_obra', 'servico', 'outro')),
    article_ref VARCHAR(50),
    description VARCHAR(255) NOT NULL,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1.00,
    unit_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 23.00,
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00
);

CREATE INDEX IF NOT EXISTS idx_quote_lines_quote ON quote_lines(quote_id);

-- ---------------------------------------------------------------------
-- 11. REGISTOS DE DOCUMENTOS EMITIDOS (document_records)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS document_records (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    service_order_id VARCHAR(50) NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('folha_a5', 'etiqueta', 'orcamento', 'relatorio_tecnico', 'folha_entrega')),
    title VARCHAR(150) NOT NULL,
    version INT NOT NULL DEFAULT 1,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    issued_by_user_id VARCHAR(50) NOT NULL REFERENCES users(id),
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_documents_order ON document_records(service_order_id);

-- ---------------------------------------------------------------------
-- 12. FATURAÇÃO & SINCRONIZAÇÃO DE DOCUMENTOS (billing_documents)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS billing_documents (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    service_order_id VARCHAR(50) NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
    quote_id VARCHAR(50) REFERENCES quotes(id) ON DELETE SET NULL,
    external_doc_number VARCHAR(100),
    external_id VARCHAR(100),
    provider VARCHAR(50) NOT NULL DEFAULT 'FozSistemas ERP / MockBilling',
    status VARCHAR(30) NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'pendente_sincronizacao', 'sincronizado', 'erro')),
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    tax_total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    synced_at TIMESTAMP WITH TIME ZONE,
    last_error_message TEXT,
    attempts_count INT NOT NULL DEFAULT 0,
    idempotency_key VARCHAR(100) UNIQUE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_billing_order ON billing_documents(service_order_id);

-- ---------------------------------------------------------------------
-- 13. AUDITORIA & REGISTO DE EVENTOS DE SEGURANÇA (audit_logs)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(50) NOT NULL,
    user_name VARCHAR(150) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);

-- =====================================================================
-- DADOS INICIAIS (SEED DATA)
-- =====================================================================

-- Inserir Definições Padrão FozSistemas
INSERT INTO app_settings (id, brand_name, commercial_name, company_name, legal_name, tax_number, address, postal_code, city, phone, email, website)
VALUES (
    'default',
    'FSYS360',
    'FSYS360 Service',
    'FozSistemas — Equipamentos e Sistemas de Informação, Lda.',
    'FozSistemas — Equipamentos e Sistemas de Informação, Lda.',
    '504 180 118',
    'Rua Manuel Fernandes Tomaz, 132',
    '3080-051',
    'Figueira da Foz',
    '(+351) 233 094 320',
    'geral@fozsistemas.com',
    'https://fozsistemas.com'
)
ON CONFLICT (id) DO NOTHING;

-- Inserir Utilizadores Iniciais (Palavra-passe padrão: '123456' criptografada com pgcrypto crypt/bf)
INSERT INTO users (id, name, username, email, password_hash, role, active, specialty, is_super_admin)
VALUES 
(
    'usr_admin_1',
    'Administrador FozSistemas',
    'admin',
    'admin@fozsistemas.com',
    crypt('123456', gen_salt('bf', 8)),
    'admin',
    true,
    'Supervisão Técnica & Gestão Global',
    true
),
(
    'usr_tech_rui',
    'Rui Silva',
    'rui.silva',
    'rui.silva@fozsistemas.com',
    crypt('123456', gen_salt('bf', 8)),
    'tecnico',
    true,
    'Hardware & Micro-soldadura',
    false
),
(
    'usr_tech_tiago',
    'Tiago Pereira',
    'tiago.pereira',
    'tiago.pereira@fozsistemas.com',
    crypt('123456', gen_salt('bf', 8)),
    'tecnico',
    true,
    'Portáteis, Apple Mac & Ecrãs',
    false
),
(
    'usr_rec_ana',
    'Ana Martins',
    'ana.martins',
    'ana.martins@fozsistemas.com',
    crypt('123456', gen_salt('bf', 8)),
    'rececao',
    true,
    'Atendimento & Triagem de Balcão',
    false
)
ON CONFLICT (username) DO NOTHING;

-- Inserir Catálogo de Peças Comuns
INSERT INTO catalog_parts (article_ref, description, category, unit_cost, unit_price, tax_rate, stock_quantity)
VALUES
('SSD-M2-500GB', 'Disco SSD Kingston NV2 500GB M.2 NVMe PCIe 4.0', 'Discos & Armazenamento', 28.50, 48.00, 23.00, 12),
('SSD-M2-1TB', 'Disco SSD Crucial P3 Plus 1TB M.2 NVMe', 'Discos & Armazenamento', 52.00, 79.90, 23.00, 8),
('SSD-25-480GB', 'Disco SSD Crucial BX500 480GB SATA 2.5"', 'Discos & Armazenamento', 24.00, 39.90, 23.00, 15),
('RAM-DDR4-8GB-SO', 'Memória RAM SODIMM DDR4 8GB 3200MHz p/ Portátil', 'Memória RAM', 16.50, 29.50, 23.00, 10),
('RAM-DDR4-16GB-SO', 'Memória RAM SODIMM DDR4 16GB 3200MHz p/ Portátil', 'Memória RAM', 29.00, 49.00, 23.00, 6),
('MASSA-TERMICA-MX4', 'Pasta Térmica Arctic MX-4 4g Alto Rendimento', 'Consumíveis & Químicos', 4.20, 9.90, 23.00, 25),
('FONTE-ATX-600W', 'Fonte de Alimentação Nox Urano VX 650W 80 Plus Bronze', 'Fontes de Alimentação', 34.00, 54.90, 23.00, 4),
('BATT-OEM-UNIV', 'Bateria OEM de Substituição para Portátil', 'Baterias & Carregadores', 38.00, 65.00, 23.00, 5),
('SERV-MO-DIAG', 'Mão de Obra de Diagnóstico Técnico de Laboratório', 'Serviços & Mão de Obra', 0.00, 25.00, 23.00, 999),
('SERV-MO-REPAR', 'Mão de Obra Técnica Especializada (por Hora)', 'Serviços & Mão de Obra', 0.00, 38.00, 23.00, 999)
ON CONFLICT (article_ref) DO NOTHING;
