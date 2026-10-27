#!/usr/bin/env bash
# =====================================================================
# FSYS360 SERVICE — Cópia de Segurança Automatizada da Base de Dados
# FozSistemas (fozsistemas.com) • Figueira da Foz, Portugal
# =====================================================================

set -eo pipefail

BACKUP_DIR="/var/backups/fsys360"
ENV_FILE="/opt/fsys360-service/.env"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RETENTION_DAYS=30

mkdir -p "${BACKUP_DIR}"

# Carregar variáveis do .env se existir
if [[ -f "${ENV_FILE}" ]]; then
    export $(grep -v '^#' "${ENV_FILE}" | xargs)
fi

DB_NAME="${DB_NAME:-fsys360_db}"
DB_USER="${DB_USER:-fsys360}"
DB_PASS="${DB_PASS:-}"
BACKUP_FILE="${BACKUP_DIR}/fsys360_backup_${TIMESTAMP}.sql.gz"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] A iniciar cópia de segurança da base de dados '${DB_NAME}'..."

if [[ -n "${DB_PASS}" ]]; then
    PGPASSWORD="${DB_PASS}" pg_dump -h localhost -U "${DB_USER}" -d "${DB_NAME}" | gzip > "${BACKUP_FILE}"
else
    sudo -u postgres pg_dump "${DB_NAME}" | gzip > "${BACKUP_FILE}"
fi

BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cópia de segurança criada com sucesso:"
echo "  • Ficheiro: ${BACKUP_FILE}"
echo "  • Tamanho: ${BACKUP_SIZE}"

# Rotação e limpeza de backups com mais de 30 dias
DELETED_COUNT=$(find "${BACKUP_DIR}" -type f -name "fsys360_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete -print | wc -l)
if [[ $DELETED_COUNT -gt 0 ]]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Rotação: ${DELETED_COUNT} cópia(s) antiga(s) com mais de ${RETENTION_DAYS} dias foram removidas."
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Concluído com sucesso."
