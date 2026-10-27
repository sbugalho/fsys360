# Script de Instalação em Servidor Local (FSYS360 Service) com PostgreSQL & Caddy HTTPS

Plano de arquitetura e implementação para automatizar a instalação, configuração e colocação em produção do **FSYS360 Service** num servidor local (Ubuntu/Debian) com base de dados relacional **PostgreSQL**, gestão de processos com **PM2** e proxy reverso **Caddy Server** com HTTPS automático.

---

## Decisões Confirmadas & Resumo das Escolhas do Utilizador

> [!IMPORTANT]
> **Decisões confirmadas com o utilizador:**
> 1. **Motor de Base de Dados**: **PostgreSQL** (com provisionamento de base de dados, utilizador dedicado e schema relacional inicial).
> 2. **Formato de Instalação**: **Script Bash Automatizado (`install.sh`)** para ambientes Ubuntu/Debian bare-metal ou VMs, com suporte a arranque persistente via **PM2/systemd**.
> 3. **Servidor Web & HTTPS**: **Caddy Server** com terminação TLS/HTTPS automática (Let's Encrypt para domínios públicos ou certificado local auto-gerado para IPs locais/intranets).
> 4. **Configuração Interativa**: Assistente interativo via CLI no terminal (pergunta domínio/IP, credenciais da BD, porta e email de administrador) gerando o ficheiro `.env` seguro.

---

## 1. Visão Geral & Conceito

### O que faz a solução
O script de instalação transforma um servidor Ubuntu/Debian recém-instalado ou existente num servidor de produção funcional com o **FSYS360 Service**, sem necessidade de intervenção técnica manual complexa:
1. **Verificação de Requisitos**: Valida versão do SO (Ubuntu 22.04/24.04 ou Debian 11/12), arquitetura (x86_64 / arm64) e privilégios `root`/`sudo`.
2. **Instalação de Dependências de Sistema**:
   - Node.js LTS (v20 ou v22 via repositório oficial NodeSource).
   - PostgreSQL (versão 15 ou 16 com serviço ativo e seguro).
   - Caddy Server (repositório oficial apt da Cloudsmith).
   - Utilitários essenciais (`curl`, `git`, `build-essential`, `ufw`).
3. **Assistente de Configuração Interativo**:
   - Recolhe ou gera automaticamente senhas seguras para a base de dados.
   - Configura o domínio (ex: `sat.empresa.pt`) ou endereço IP local (ex: `192.168.1.100` ou `localhost`).
   - Define portas e variáveis de ambiente no ficheiro `.env`.
4. **Base de Dados & Esquema Relacional**:
   - Cria o utilizador `fsys360` e a base de dados `fsys360_db`.
   - Executa o script SQL de estrutura inicial (tabelas de utilizadores, clientes, equipamentos, ordens de serviço, intervenções, orçamentos, auditoria e definições).
   - Insere as credenciais padrão do administrador FozSistemas.
5. **Compilação da Aplicação**:
   - Instalação limpa de dependências com `npm ci` / `npm install`.
   - Build de produção otimizado com `npm run build`.
6. **Gestão de Processos & Serviço Systemd**:
   - Configuração do PM2 para manter a aplicação sempre em execução e reiniciar após reboot do servidor.
7. **HTTPS & Proxy Reverso com Caddy**:
   - Geração automática de `Caddyfile`.
   - Emissão transparente de certificados TLS/HTTPS válidos sem necessidade de configurar `certbot` ou tarefas `cron`.
8. **Scripts Utilitários Auxiliares**:
   - `backup.sh`: Cópia de segurança diária da base de dados PostgreSQL.
   - `update.sh`: Atualização rápida do código com recompilação sem perda de dados.
   - `manage.sh`: Menu rápido para reiniciar serviços, ver logs ou alterar configurações.

---

## 2. Experiência do Operador & Fluxo de Instalação

```
[Início] ➜ Executar `sudo bash install.sh`
   │
   ├─► Verificação de Pré-Requisitos (Ubuntu/Debian, Memória, Espaço em Disco)
   │
   ├─► Instalação de Pacotes (Node.js LTS, PostgreSQL, Caddy, PM2)
   │
   ├─► Assistente Interativo (Perguntas com valores padrão inteligentes):
   │     • Nome de Domínio ou IP do Servidor (ex: sat.empresa.pt ou 192.168.1.50)
   │     • Porta interna da App (Padrão: 3000)
   │     • Nome da Base de Dados (Padrão: fsys360_db)
   │     • Utilizador e Palavra-passe PostgreSQL (Gera chave segura se vazia)
   │     • Email para alertas SSL Let's Encrypt
   │
   ├─► Criação da Base de Dados e Schema Relacional Inicial (`schema.sql`)
   │
   ├─► Compilação da App (`npm install` + `npm run build`)
   │
   ├─► Configuração do Caddyfile & Certificados HTTPS
   │
   ├─► Arranque com PM2 & Registo no Systemd (Boot Automático)
   │
   └─► [Sucesso] Exibe painel com URLs de acesso, credenciais e comandos de gestão
```

### Mensagem Final de Conclusão no Terminal:
O script apresentará uma caixa informativa formatada em ANSI:
- **URL de Acesso Web**: `https://<dominio-ou-ip>`
- **Utilizador Administrador**: `admin`
- **Base de Dados**: `PostgreSQL 16` (`localhost:5432/fsys360_db`)
- **Estado dos Serviços**: `PM2: Online` | `PostgreSQL: Active` | `Caddy: Active (HTTPS)`
- **Comandos Úteis**: `fsys360-status`, `fsys360-backup`, `fsys360-logs`

---

## 3. Decisões Técnicas & Trade-Offs

### 1. Caddy Server vs. Nginx + Certbot
- **Abordagem Escolhida**: Caddy Server.
- **Motivo**: O Caddy possui gestão nativa de certificados HTTPS com Let's Encrypt / ZeroSSL e gera certificados TLS locais automáticos (com ACME interno) quando o utilizador define apenas um IP ou `localhost`. No Nginx, configurar HTTPS para servidores locais exige múltiplos passos de `openssl` ou scripts de `certbot` propensos a falhas em redes fechadas.

### 2. PostgreSQL Nativo vs. Container Docker
- **Abordagem Escolhida**: PostgreSQL instalado diretamente no sistema operacional (via repositório oficial APT) gerenciado pelo `systemd`.
- **Motivo**: Melhor desempenho I/O em servidores locais físicos ou VMs dedicadas, menor consumo de memória RAM (ideal para mini-PCs ou servidores de bancada técnica com 2GB-4GB de RAM) e simplificação de cópias de segurança com `pg_dump`.

### 3. Ficheiro `.env` Centralizado com Permissões Restritas
- **Abordagem Escolhida**: Geração automática de `.env` com permissões `600` (`chown -R fsys360:fsys360 .env`).
- **Motivo**: Protege credenciais de conexão à base de dados contra leitura por utilizadores não autorizados no servidor local.

---

## 4. Arquitetura Técnica & Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                    Rede / Clientes (Navegador)              │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS (Porta 443) / HTTP (Porta 80)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Caddy Web Server (Proxy Reverso)          │
│  - Emissão automática de TLS/HTTPS                          │
│  - Compressão Gzip/Zstandard e Cabeçalhos de Segurança      │
│  - Redirecionamento automático HTTP ➜ HTTPS                 │
└──────────────────────────────┬──────────────────────────────┘
                               │ Proxy interno (127.0.0.1:3000)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              PM2 Process Manager (Node.js App)              │
│  - Executa backend/frontend FSYS360                         │
│  - Reinício automático em caso de erro                      │
│  - Persistência no reboot (systemd service)                 │
└──────────────────────────────┬──────────────────────────────┘
                               │ Conexão TCP local (5432)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 PostgreSQL Database (Local)                 │
│  - Base de dados: fsys360_db                                │
│  - Tabelas relacionais com chaves estrangeiras e índices   │
│  - Cópias de segurança diárias agendadas via cron           │
└─────────────────────────────────────────────────────────────┘
```

### Componentes e Ficheiros a Criar:

1. **`deploy/install.sh`**:
   Script principal executável em bash com menu interativo, validações, instalação de pacotes e setup completo.
2. **`deploy/schema.sql`**:
   Script DDL completo em PostgreSQL criando:
   - `app_settings` (marca, empresa, NIF, IVA, margens A5)
   - `users` (técnicos, receção, administradores, senhas com bcrypt)
   - `customers` (particulares e empresas, NIF, contactos)
   - `equipment` (marca, modelo, número de série, etiqueta interna)
   - `service_orders` (ordens de assistência, estados, prioridades, garantia)
   - `interventions` (registo de tempos de bancada, diagnósticos, testes)
   - `service_parts` (peças aplicadas e catálogo de artigos)
   - `quotes` & `quote_lines` (orçamentos e propostas A5)
   - `audit_logs` (histórico de alterações e conformidade)
3. **`deploy/Caddyfile.template`**:
   Configuração otimizada para Caddy com HTTPS automático e headers de segurança modernos (HSTS, X-Content-Type-Options, etc.).
4. **`deploy/ecosystem.config.cjs`**:
   Configuração do PM2 para gerir o processo da aplicação em modo cluster ou fork com logs rotativos.
5. **`deploy/backup.sh`**:
   Script de cópia de segurança automatizada com rotação de ficheiros `.sql.gz`.
6. **`deploy/README_INSTALACAO.md`**:
   Manual detalhado passo a passo em português para o operador do sistema na oficina/empresa.

---

## 5. Próximos Passos (Após Aprovação)

Assim que aprovar este plano:
1. Criar a pasta `/deploy` com todos os ficheiros de instalação e templates.
2. Implementar o script SQL de inicialização relacional compatível com PostgreSQL 15/16.
3. Desenvolver o script de automação `install.sh` robusto com tratamento de erros e assistente CLI.
4. Fornecer os testes de validação e o manual de utilização do servidor.
