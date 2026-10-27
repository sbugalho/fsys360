#!/usr/bin/env bash
# =====================================================================
# FSYS360 SERVICE — Menu de Gestão & Diagnóstico de Servidor
# FozSistemas (fozsistemas.com) • Figueira da Foz, Portugal
# =====================================================================

set -eo pipefail

BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
CYAN="\033[0;36m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
RESET="\033[0m"

INSTALL_DIR="/opt/fsys360-service"

show_header() {
    clear || true
    echo -e "${CYAN}${BOLD}"
    echo "====================================================================="
    echo "   FSYS360 SERVICE — PAINEL DE GESTÃO DO SERVIDOR                   "
    echo "   FozSistemas • Figueira da Foz, Portugal                          "
    echo "====================================================================="
    echo -e "${RESET}"
}

check_status() {
    echo -e "\n${BOLD}${CYAN}--- ESTADO DOS SERVIÇOS DO SISTEMA ---${RESET}\n"
    
    echo -n "1. Base de Dados PostgreSQL: "
    if systemctl is-active --quiet postgresql; then
        echo -e "${GREEN}${BOLD}OPERACIONAL (Active)${RESET}"
    else
        echo -e "${RED}${BOLD}PARADO OU EM ERRO${RESET}"
    fi

    echo -n "2. Servidor Web Caddy (HTTPS): "
    if systemctl is-active --quiet caddy; then
        echo -e "${GREEN}${BOLD}OPERACIONAL (Active)${RESET}"
    else
        echo -e "${RED}${BOLD}PARADO OU EM ERRO${RESET}"
    fi

    echo -n "3. Aplicação Node.js (PM2): "
    if pm2 show fsys360-service >/dev/null 2>&1; then
        STATUS=$(pm2 jlist | grep -o '"pm2_env":{"status":"[^"]*"' | head -n1 | cut -d'"' -f6 || echo "online")
        if [[ "$STATUS" == "online" ]]; then
            echo -e "${GREEN}${BOLD}ONLINE (Em execução)${RESET}"
        else
            echo -e "${YELLOW}${BOLD}${STATUS}${RESET}"
        fi
    else
        echo -e "${RED}${BOLD}NÃO DETETADA NO PM2${RESET}"
    fi

    echo ""
    echo -e "${BOLD}Conectividade de Portas de Rede:${RESET}"
    netstat -tlpn 2>/dev/null | grep -E ':(80|443|3000|5432)\b' || ss -tulpn | grep -E ':(80|443|3000|5432)\b' || true

    echo ""
    read -rp "Pressione [Enter] para regressar ao menu principal..."
}

test_database() {
    echo -e "\n${BOLD}${CYAN}--- TESTE DE CONEXÃO POSTGRESQL ---${RESET}\n"
    ENV_FILE="${INSTALL_DIR}/.env"
    if [[ -f "$ENV_FILE" ]]; then
        export $(grep -v '^#' "$ENV_FILE" | xargs)
        echo "A testar conexão à base de dados '${DB_NAME}' com o utilizador '${DB_USER}'..."
        if PGPASSWORD="${DB_PASS}" psql -h localhost -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT count(*) AS total_assistencias FROM service_orders;" 2>/dev/null; then
            echo -e "\n${GREEN}${BOLD}Conexão bem sucedida e tabelas validadas!${RESET}\n"
        else
            echo -e "\n${RED}${BOLD}Falha ao ligar à base de dados com as credenciais do .env.${RESET}\n"
        fi
    else
        echo -e "${YELLOW}Ficheiro .env não encontrado em ${INSTALL_DIR}.${RESET}"
    fi
    read -rp "Pressione [Enter] para regressar..."
}

reconfigure_domain() {
    echo -e "\n${BOLD}${CYAN}--- RECONFIGURAR DOMÍNIO / IP DO ACESSO HTTPS ---${RESET}\n"
    read -rp "Introduza o novo domínio ou IP (ex: sat.empresa.pt ou 192.168.1.100): " NEW_DOMAIN
    if [[ -n "$NEW_DOMAIN" ]]; then
        sed -i "s|SERVER_DOMAIN=.*|SERVER_DOMAIN=${NEW_DOMAIN}|g" "${INSTALL_DIR}/.env" 2>/dev/null || true
        
        # Atualizar Caddyfile
        if [[ "${NEW_DOMAIN}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ || "${NEW_DOMAIN}" == "localhost" ]]; then
            TLS_RULE="tls internal"
        else
            TLS_RULE=""
        fi
        
        sed -i "1,/^.*{/s|^.*{|${NEW_DOMAIN} {|" /etc/caddy/Caddyfile 2>/dev/null || true
        systemctl restart caddy
        echo -e "\n${GREEN}${BOLD}Domínio atualizado para ${NEW_DOMAIN} e Caddy reiniciado com sucesso!${RESET}\n"
    fi
    read -rp "Pressione [Enter] para regressar..."
}

main_menu() {
    while true; do
        show_header
        echo -e "Escolha uma opção de administração:"
        echo ""
        echo "  1) Verificar Estado Completo dos Serviços (Status)"
        echo "  2) Ver Logs da Aplicação em Tempo Real"
        echo "  3) Reiniciar Aplicação FSYS360"
        echo "  4) Reiniciar Servidor Web Caddy"
        echo "  5) Executar Cópia de Segurança Imediata (Backup)"
        echo "  6) Testar Conexão à Base de Dados PostgreSQL"
        echo "  7) Reconfigurar Domínio / Endereço IP do Servidor"
        echo "  8) Ver Últimos Erros do Sistema (/var/log/fsys360)"
        echo "  0) Sair"
        echo ""
        read -rp "Opção [0-8]: " OPTION

        case "$OPTION" in
            1) check_status ;;
            2) pm2 logs fsys360-service ;;
            3) pm2 restart fsys360-service && echo -e "\n${GREEN}Aplicação reiniciada com sucesso!${RESET}" && sleep 2 ;;
            4) systemctl restart caddy && echo -e "\n${GREEN}Caddy reiniciado com sucesso!${RESET}" && sleep 2 ;;
            5) "${INSTALL_DIR}/deploy/backup.sh" && read -rp "Backup concluído. Pressione [Enter]..." ;;
            6) test_database ;;
            7) reconfigure_domain ;;
            8) tail -n 50 /var/log/fsys360/error.log 2>/dev/null || echo "Sem registos de erro." && read -rp "Pressione [Enter]..." ;;
            0) exit 0 ;;
            *) echo -e "${RED}Opção inválida.${RESET}" && sleep 1 ;;
        esac
    done
}

main_menu
