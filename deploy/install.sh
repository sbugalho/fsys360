#!/usr/bin/env bash
# =====================================================================
# FSYS360 SERVICE — Gestão de Assistências Técnicas
# Script de Instalação Automatizada para Servidor Local (Ubuntu / Debian)
# FozSistemas (fozsistemas.com) • Figueira da Foz, Portugal
# =====================================================================

set -eo pipefail

# Definições de Cores e Estilos para Terminal
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
CYAN="\033[0;36m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
RESET="\033[0m"

log_info() {
    echo -e "${BLUE}[INFO]${RESET} $1"
}

log_success() {
    echo -e "${GREEN}[SUCESSO]${RESET} ${BOLD}$1${RESET}"
}

log_warn() {
    echo -e "${YELLOW}[AVISO]${RESET} $1"
}

log_error() {
    echo -e "${RED}[ERRO]${RESET} ${BOLD}$1${RESET}"
}

print_banner() {
    clear || true
    echo -e "${CYAN}${BOLD}"
    echo "====================================================================="
    echo "   FSYS360 SERVICE — GESTÃO DE ASSISTÊNCIAS TÉCNICAS                "
    echo "   FozSistemas — Equipamentos e Sistemas de Informação, Lda.         "
    echo "   Instalador Automatizado de Servidor de Produção (HTTPS + Postgres)"
    echo "====================================================================="
    echo -e "${RESET}"
}

# 1. Verificação de Privilégios Root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "Este instalador tem de ser executado com privilégios de administrador (root ou sudo)."
        echo -e "Execute: ${BOLD}sudo bash $0${RESET}"
        exit 1
    fi
}

# 2. Verificação do Sistema Operativo
check_os() {
    if [[ ! -f /etc/os-release ]]; then
        log_error "Sistema operativo não reconhecido. Requer Ubuntu 20.04+, 22.04+, 24.04+ ou Debian 11/12."
        exit 1
    fi

    . /etc/os-release
    OS_ID=$ID
    OS_VERSION=$VERSION_ID

    log_info "Sistema detetado: ${BOLD}${PRETTY_NAME}${RESET}"

    if [[ "$OS_ID" != "ubuntu" && "$OS_ID" != "debian" ]]; then
        log_warn "Aviso: Este script foi otimizado para Ubuntu e Debian. Prosseguindo em modo compatível..."
    fi
}

# 3. Verificação de Recursos de Hardware
check_resources() {
    TOTAL_RAM_MB=$(free -m | awk '/^Mem:/{print $2}')
    FREE_DISK_MB=$(df -m / | awk 'NR==2 {print $4}')

    log_info "Memória RAM disponível: ${TOTAL_RAM_MB} MB"
    log_info "Espaço livre em disco: $((FREE_DISK_MB / 1024)) GB"

    if [[ $TOTAL_RAM_MB -lt 950 ]]; then
        log_warn "Atenção: A máquina possui menos de 1GB de RAM. A compilação poderá necessitar de SWAP."
        # Criar SWAP temporário de 1GB se não existir nenhum swap
        SWAP_EXIST=$(free -m | awk '/^Swap:/{print $2}')
        if [[ $SWAP_EXIST -lt 500 ]]; then
            log_info "A criar ficheiro de Swap temporário (1GB) para garantir compilação sem falhas..."
            fallocate -l 1G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=1024
            chmod 600 /swapfile
            mkswap /swapfile
            swapon /swapfile || true
            log_success "Ficheiro de Swap ativado temporariamente."
        fi
    fi
}

# 4. Assistente Interativo de Configuração
interactive_wizard() {
    echo -e "\n${BOLD}${CYAN}--- Configuração dos Parâmetros de Instalação ---${RESET}\n"

    # Detetar IP primário da rede local
    DETECTED_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")

    # Domínio ou IP
    read -rp "$(echo -e "${BOLD}1. Nome de Domínio ou Endereço IP do Servidor${RESET} [Padrão: ${DETECTED_IP}]: ")" INPUT_DOMAIN
    SERVER_DOMAIN="${INPUT_DOMAIN:-$DETECTED_IP}"

    # Porta Interna da Aplicação
    read -rp "$(echo -e "${BOLD}2. Porta Interna da Aplicação (Node.js)${RESET} [Padrão: 3000]: ")" INPUT_PORT
    APP_PORT="${INPUT_PORT:-3000}"

    # Nome da Base de Dados
    read -rp "$(echo -e "${BOLD}3. Nome da Base de Dados PostgreSQL${RESET} [Padrão: fsys360_db]: ")" INPUT_DB_NAME
    DB_NAME="${INPUT_DB_NAME:-fsys360_db}"

    # Utilizador PostgreSQL
    read -rp "$(echo -e "${BOLD}4. Utilizador da Base de Dados${RESET} [Padrão: fsys360]: ")" INPUT_DB_USER
    DB_USER="${INPUT_DB_USER:-fsys360}"

    # Senha da Base de Dados
    AUTO_PASS=$(openssl rand -base64 12 | tr -dc 'a-zA-Z0-9' | head -c 16 || echo "Fsys360SecurePass2026")
    read -rp "$(echo -e "${BOLD}5. Palavra-passe da Base de Dados${RESET} [Enter para gerar automática: ${AUTO_PASS}]: ")" INPUT_DB_PASS
    DB_PASS="${INPUT_DB_PASS:-$AUTO_PASS}"

    # Email de Administrador para Certificado HTTPS
    read -rp "$(echo -e "${BOLD}6. Email para Notificações e Certificado SSL/TLS${RESET} [Padrão: geral@fozsistemas.com]: ")" INPUT_EMAIL
    ADMIN_EMAIL="${INPUT_EMAIL:-geral@fozsistemas.com}"

    # Diretório de Instalação
    INSTALL_DIR="/opt/fsys360-service"

    echo ""
    log_info "Resumo da Configuração Selecionada:"
    echo -e "  • ${BOLD}Endereço Web / HTTPS:${RESET} https://${SERVER_DOMAIN}"
    echo -e "  • ${BOLD}Porta Interna:${RESET} ${APP_PORT}"
    echo -e "  • ${BOLD}Base de Dados:${RESET} ${DB_NAME} (utilizador: ${DB_USER})"
    echo -e "  • ${BOLD}Email Responsável:${RESET} ${ADMIN_EMAIL}"
    echo -e "  • ${BOLD}Pasta de Destino:${RESET} ${INSTALL_DIR}"
    echo ""

    read -rp "$(echo -e "${BOLD}Deseja iniciar a instalação com estes parâmetros? (S/n): ${RESET}")" CONFIRM
    if [[ "$CONFIRM" =~ ^[Nn] ]]; then
        log_warn "Instalação cancelada pelo utilizador."
        exit 0
    fi
}

# 5. Instalação de Dependências de Sistema
install_packages() {
    log_info "A atualizar repositórios e pacotes do sistema (apt update)..."
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq

    log_info "A instalar pacotes essenciais (curl, git, gnupg, build-essential, ufw)..."
    apt-get install -y -qq curl git gnupg lsb-release build-essential ufw software-properties-common ca-certificates

    # 5.1 Instalar PostgreSQL
    log_info "A verificar e instalar PostgreSQL..."
    apt-get install -y -qq postgresql postgresql-contrib
    systemctl enable postgresql
    systemctl start postgresql
    log_success "PostgreSQL instalado e em execução."

    # 5.2 Instalar Node.js LTS (v20) via NodeSource
    if ! command -v node >/dev/null 2>&1 || [[ $(node -v | cut -d'.' -f1 | tr -d 'v') -lt 20 ]]; then
        log_info "A configurar repositório oficial Node.js 20 LTS (NodeSource)..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y -qq nodejs
        log_success "Node.js $(node -v) e npm $(npm -v) instalados com sucesso."
    else
        log_info "Node.js já se encontra instalado: $(node -v)"
    fi

    # 5.3 Instalar Caddy Server
    if ! command -v caddy >/dev/null 2>&1; then
        log_info "A configurar repositório oficial do Caddy Server..."
        apt-get install -y -qq debian-keyring debian-archive-keyring apt-transport-https
        curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg --yes
        curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
        apt-get update -qq
        apt-get install -y -qq caddy
        systemctl enable caddy
        log_success "Caddy Server instalado com sucesso."
    else
        log_info "Caddy Server já se encontra instalado: $(caddy version | head -n1)"
    fi

    # 5.4 Instalar PM2 para gestão de processos
    if ! command -v pm2 >/dev/null 2>&1; then
        log_info "A instalar PM2 globalmente..."
        npm install -g pm2
        log_success "PM2 instalado."
    else
        log_info "PM2 já se encontra instalado: $(pm2 -v)"
    fi
}

# 6. Configuração da Base de Dados PostgreSQL & Esquema
configure_database() {
    log_info "A configurar o utilizador e a base de dados no PostgreSQL..."

    # Executar comandos como utilizador 'postgres'
    sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 || \
        sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"

    # Alterar senha caso o utilizador já exista
    sudo -u postgres psql -c "ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"

    # Criar base de dados
    sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 || \
        sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"

    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"
    sudo -u postgres psql -c "ALTER DATABASE ${DB_NAME} OWNER TO ${DB_USER};"

    log_success "Base de dados '${DB_NAME}' e utilizador '${DB_USER}' criados."

    # Executar o ficheiro schema.sql
    CURRENT_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    SCHEMA_FILE="${CURRENT_SCRIPT_DIR}/schema.sql"

    if [[ -f "$SCHEMA_FILE" ]]; then
        log_info "A injetar tabelas relacionais e dados padrão a partir de schema.sql..."
        PGPASSWORD="${DB_PASS}" psql -h localhost -U "${DB_USER}" -d "${DB_NAME}" -f "${SCHEMA_FILE}" >/dev/null 2>&1 || {
            # Tentativa com utilizador postgres se houver restrições de permissão inicial
            sudo -u postgres psql -d "${DB_NAME}" -f "${SCHEMA_FILE}" >/dev/null
        }
        log_success "Esquema de dados (tabelas, índices, enums e dados iniciais) aplicado com sucesso!"
    else
        log_warn "Aviso: ${SCHEMA_FILE} não encontrado. O esquema terá de ser aplicado manualmente."
    fi
}

# 7. Instalação e Compilação da Aplicação
setup_application() {
    log_info "A preparar o diretório da aplicação em ${INSTALL_DIR}..."
    mkdir -p "${INSTALL_DIR}"
    mkdir -p "/var/log/fsys360"

    # Copiar ficheiros do projeto
    PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
    
    log_info "A copiar os ficheiros da aplicação para ${INSTALL_DIR}..."
    cp -r "${PROJECT_ROOT}/package.json" "${INSTALL_DIR}/"
    cp -r "${PROJECT_ROOT}/tsconfig.json" "${INSTALL_DIR}/"
    cp -r "${PROJECT_ROOT}/vite.config.ts" "${INSTALL_DIR}/"
    cp -r "${PROJECT_ROOT}/index.html" "${INSTALL_DIR}/"
    cp -r "${PROJECT_ROOT}/src" "${INSTALL_DIR}/"
    cp -r "${PROJECT_ROOT}/public" "${INSTALL_DIR}/"
    cp -r "${PROJECT_ROOT}/deploy" "${INSTALL_DIR}/"
    cp -r "${PROJECT_ROOT}/server.ts" "${INSTALL_DIR}/" 2>/dev/null || true

    cd "${INSTALL_DIR}"

    # Gerar ficheiro de ambiente de produção .env
    log_info "A gerar o ficheiro de configuração seguro (.env)..."
    cat > "${INSTALL_DIR}/.env" <<EOF
NODE_ENV=production
PORT=${APP_PORT}
HOST=0.0.0.0
SERVER_DOMAIN=${SERVER_DOMAIN}

# Base de Dados Relacional PostgreSQL
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}
DB_HOST=localhost
DB_PORT=5432
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASS=${DB_PASS}

# Informações da Empresa e Entidade
COMPANY_NAME=FozSistemas
LEGAL_NAME=FozSistemas — Equipamentos e Sistemas de Informação, Lda.
COMPANY_NIF=504180118
ADMIN_EMAIL=${ADMIN_EMAIL}
EOF

    # Restringir permissões de leitura do ficheiro .env
    chmod 600 "${INSTALL_DIR}/.env"

    log_info "A instalar dependências npm (isto pode demorar 1-2 minutos)..."
    npm install --silent

    log_info "A compilar a aplicação React / Tailwind para produção (npm run build)..."
    npm run build

    log_success "Aplicação compilada com sucesso em ${INSTALL_DIR}/dist."
}

# 8. Configuração do Caddy Server & HTTPS
configure_caddy() {
    log_info "A configurar o Caddy Server para servir HTTPS..."
    mkdir -p /etc/caddy /var/log/caddy

    CURRENT_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    CADDY_TEMPLATE="${CURRENT_SCRIPT_DIR}/Caddyfile.template"
    if [[ ! -f "$CADDY_TEMPLATE" ]]; then
        CADDY_TEMPLATE="${INSTALL_DIR}/deploy/Caddyfile.template"
    fi

    # Determinar modo TLS:
    # Se for IP (ex: 192.168.1.50) ou localhost, usar 'tls internal' para gerar certificado TLS local
    # Se for domínio (ex: sat.empresa.pt), usar emissão automática normal do Let's Encrypt
    if [[ "${SERVER_DOMAIN}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ || "${SERVER_DOMAIN}" == "localhost" ]]; then
        TLS_RULE="tls internal"
        log_info "Endereço IP/localhost detetado. Ativando autoridade certificadora interna (TLS internal)."
    else
        TLS_RULE=""
        log_info "Domínio público detetado. O Caddy solicitará certificado válido Let's Encrypt / ZeroSSL automaticamente."
    fi

    # Gerar o /etc/caddy/Caddyfile a partir do template
    sed -e "s|__ADMIN_EMAIL__|${ADMIN_EMAIL}|g" \
        -e "s|__DOMAIN__|${SERVER_DOMAIN}|g" \
        -e "s|__APP_PORT__|${APP_PORT}|g" \
        -e "s|__TLS_CONFIG__|${TLS_RULE}|g" \
        "${CADDY_TEMPLATE}" > /etc/caddy/Caddyfile

    # Validar e reiniciar o serviço Caddy
    log_info "A testar configuração do Caddyfile..."
    caddy validate --config /etc/caddy/Caddyfile
    systemctl restart caddy
    log_success "Caddy Server configurado e operacional com HTTPS."
}

# 9. Arranque e Persistência do Serviço com PM2
configure_pm2() {
    log_info "A registar o processo no PM2..."
    cd "${INSTALL_DIR}"

    # Parar processo anterior se existir
    pm2 delete fsys360-service 2>/dev/null || true

    # Iniciar usando o ficheiro ecosystem
    pm2 start deploy/ecosystem.config.cjs

    # Guardar lista de processos para o boot
    pm2 save

    # Configurar arranque automático do PM2 no boot do systemd
    pm2 startup systemd -u root --hp /root --force >/dev/null 2>&1 || true

    log_success "Aplicação em execução contínua com PM2 e integrada no systemd."
}

# 10. Configuração de Firewall Básica (UFW)
configure_firewall() {
    if ufw status | grep -q "Status: active"; then
        log_info "Firewall UFW detetada ativa. A permitir portas 80 (HTTP) e 443 (HTTPS)..."
        ufw allow 80/tcp comment "Caddy HTTP" >/dev/null
        ufw allow 443/tcp comment "Caddy HTTPS" >/dev/null
        log_success "Portas 80 e 443 abertas na firewall."
    fi
}

# 11. Instalação de Utilitários e Atalhos de Linha de Comandos
install_cli_tools() {
    log_info "A criar atalhos de administração no sistema..."

    # Tornar scripts executáveis
    chmod +x "${INSTALL_DIR}/deploy/backup.sh" 2>/dev/null || true
    chmod +x "${INSTALL_DIR}/deploy/manage.sh" 2>/dev/null || true
    chmod +x "${INSTALL_DIR}/deploy/update.sh" 2>/dev/null || true

    # Criar atalhos simbólicos em /usr/local/bin
    ln -sf "${INSTALL_DIR}/deploy/manage.sh" /usr/local/bin/fsys360-manage
    ln -sf "${INSTALL_DIR}/deploy/backup.sh" /usr/local/bin/fsys360-backup

    # Script simples de status
    cat > /usr/local/bin/fsys360-status <<'EOF'
#!/usr/bin/env bash
echo "=== Estado dos Serviços FSYS360 Service ==="
echo -n "PostgreSQL: " && systemctl is-active postgresql
echo -n "Caddy Web:  " && systemctl is-active caddy
echo "PM2 Status: "
pm2 status fsys360-service
EOF
    chmod +x /usr/local/bin/fsys360-status

    # Agendar Cópia de Segurança Diária Automática no Crontab (às 03:00 da madrugada)
    if [[ -f "${INSTALL_DIR}/deploy/backup.sh" ]]; then
        (crontab -l 2>/dev/null | grep -v "fsys360-backup" ; echo "0 3 * * * /usr/local/bin/fsys360-backup >/dev/null 2>&1") | crontab -
        log_success "Cópia de segurança diária da base de dados agendada para as 03:00 via cron."
    fi
}

# 12. Sumário Final de Conclusão
print_summary() {
    echo ""
    echo -e "${GREEN}${BOLD}====================================================================="
    echo "       INSTALAÇÃO CONCLUÍDA COM SUCESSO NO SERVIDOR LOCAL!          "
    echo "=====================================================================${RESET}"
    echo ""
    echo -e "O ${BOLD}FSYS360 Service${RESET} está pronto para ser utilizado na sua oficina técnica:"
    echo ""
    echo -e "  🌐 ${BOLD}Endereço Web HTTPS:${RESET}  ${CYAN}${BOLD}https://${SERVER_DOMAIN}${RESET}"
    echo -e "  👤 ${BOLD}Utilizador Inicial:${RESET}   admin"
    echo -e "  🔑 ${BOLD}Palavra-passe Inicial:${RESET} 123456"
    echo -e "  🐘 ${BOLD}Base de Dados:${RESET}        PostgreSQL (${DB_NAME})"
    echo -e "  📁 ${BOLD}Pasta de Instalação:${RESET}  ${INSTALL_DIR}"
    echo -e "  📄 ${BOLD}Ficheiro .env:${RESET}        ${INSTALL_DIR}/.env"
    echo ""
    echo -e "${YELLOW}${BOLD}Comandos de Gestão Rápidos:${RESET}"
    echo -e "  • Verificar estado dos serviços: ${BOLD}fsys360-status${RESET}"
    echo -e "  • Menu de gestão interativo:     ${BOLD}fsys360-manage${RESET}"
    echo -e "  • Executar backup imediato:      ${BOLD}fsys360-backup${RESET}"
    echo -e "  • Ver logs da aplicação em tempo real: ${BOLD}pm2 logs fsys360-service${RESET}"
    echo -e "  • Reiniciar aplicação:          ${BOLD}pm2 restart fsys360-service${RESET}"
    echo ""
    echo -e "Recomenda-se alterar a palavra-passe do utilizador 'admin' após o primeiro login."
    echo -e "FozSistemas (fozsistemas.com) • Figueira da Foz"
    echo -e "${GREEN}=====================================================================${RESET}\n"
}

# Execução Principal do Instalador
main() {
    print_banner
    check_root
    check_os
    check_resources
    interactive_wizard
    install_packages
    configure_database
    setup_application
    configure_caddy
    configure_pm2
    configure_firewall
    install_cli_tools
    print_summary
}

main "$@"
