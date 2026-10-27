#!/usr/bin/env bash
# =====================================================================
# FSYS360 SERVICE — Script de Atualização Segura do Sistema
# FozSistemas (fozsistemas.com) • Figueira da Foz, Portugal
# =====================================================================

set -eo pipefail

INSTALL_DIR="/opt/fsys360-service"

echo "=== A iniciar processo de atualização do FSYS360 Service ==="

# 1. Executar cópia de segurança preventiva antes de atualizar
if [[ -f "${INSTALL_DIR}/deploy/backup.sh" ]]; then
    echo "1. A criar cópia de segurança de salvaguarda da base de dados..."
    bash "${INSTALL_DIR}/deploy/backup.sh"
fi

cd "${INSTALL_DIR}"

# 2. Se for um repositório git, efetuar git pull
if [[ -d ".git" ]]; then
    echo "2. A descarregar as atualizações mais recentes do repositório..."
    git pull
else
    echo "2. Diretório local pronto para atualização."
fi

# 3. Instalar novas dependências se houver
echo "3. A atualizar dependências npm..."
npm install --silent

# 4. Compilar aplicação para produção
echo "4. A compilar a aplicação..."
npm run build

# 5. Reiniciar o serviço no PM2
echo "5. A reiniciar o serviço no PM2 com zero downtime..."
pm2 reload fsys360-service || pm2 restart fsys360-service

echo "=== Atualização concluída com sucesso! ==="
pm2 status fsys360-service
