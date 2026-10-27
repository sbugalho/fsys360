# Manual de Instalação em Servidor Local — FSYS360 Service

**FSYS360 Service** — Sistema de Gestão de Assistências Técnicas & Reparação de Equipamentos  
Desenvolvido por **FozSistemas — Equipamentos e Sistemas de Informação, Lda.** (fozsistemas.com) • Figueira da Foz, Portugal.

---

## 1. Requisitos Mínimos de Sistema

| Componente | Requisito Recomendado | Requisito Mínimo |
| :--- | :--- | :--- |
| **Sistema Operativo** | Ubuntu 24.04 LTS / 22.04 LTS | Debian 11 / 12 |
| **Processador** | 2 núcleos (x86_64 ou ARM64) | 1 núcleo |
| **Memória RAM** | 2 GB a 4 GB RAM | 1 GB RAM (com Swap) |
| **Armazenamento** | 20 GB SSD livre | 10 GB |
| **Rede & Portas** | Portas 80 (HTTP) e 443 (HTTPS) abertas | Acesso à rede local / Internet |

---

## 2. Instalação Automatizada em 1 Passo

Copie a pasta do projeto para o seu servidor e execute o instalador com privilégios `sudo`:

```bash
cd /caminho/do/projeto/deploy
sudo bash install.sh
```

### O que o script realiza automaticamente:
1. Valida o sistema operativo e recursos de hardware.
2. Instala os pacotes necessários: **Node.js 20 LTS**, **PostgreSQL 16**, **Caddy Server**, **PM2** e ferramentas de compilação.
3. Apresenta um **assistente interativo** onde pode definir:
   - O domínio público (ex: `sat.minhaempresa.pt`) ou endereço IP local (ex: `192.168.1.100` ou `localhost`).
   - Credenciais e nome da base de dados PostgreSQL.
   - Email do responsável para avisos de renovação SSL.
4. Cria o utilizador e base de dados PostgreSQL, executando o script relacional completo `schema.sql`.
5. Compila a aplicação frontend/backend (`npm run build`).
6. Configura o Caddy Server para servir **HTTPS automático** (Let's Encrypt para domínios ou autoridade interna para IPs).
7. Regista a aplicação no **PM2** com arranque automático persistente após reinício do servidor (`systemd`).
8. Agenda backups diários automáticos para as 03:00 da madrugada.

---

## 3. Acesso à Aplicação & Credenciais Iniciais

Após a conclusão da instalação:

- **Endereço Web:** `https://<o-seu-dominio-ou-ip>`
- **Utilizador Administrador Inicial:** `admin`
- **Palavra-passe Inicial:** `123456`

> **Segurança:** Recomenda-se alterar a palavra-passe do utilizador `admin` logo após o primeiro acesso através do separador de Definições.

---

## 4. Comandos de Gestão Rápida no Terminal

O instalador cria atalhos globais no sistema para facilitar a operação diária:

```bash
# 1. Abrir o menu interativo de gestão e diagnóstico
fsys360-manage

# 2. Verificar o estado dos serviços (Postgres, Caddy, Node.js)
fsys360-status

# 3. Executar uma cópia de segurança imediata da base de dados
fsys360-backup

# 4. Ver os logs da aplicação em tempo real
pm2 logs fsys360-service

# 5. Reiniciar o serviço da aplicação
pm2 restart fsys360-service

# 6. Reiniciar o servidor web Caddy (HTTPS)
sudo systemctl restart caddy
```

---

## 5. Como Funciona a Segurança HTTPS Automática

O **Caddy Server** foi escolhido como proxy reverso por ser o mais moderno e fiável do mercado:

- **Se configurou um Domínio Público (ex: `sat.empresa.pt`):**  
  O Caddy contacta automaticamente o Let's Encrypt / ZeroSSL, emite o certificado SSL de 90 dias e renova-o em segundo plano antes do fim da validade. Não necessita de configurar `certbot` nem tarefas `cron`.
- **Se configurou um Endereço IP Local ou `localhost`:**  
  O Caddy ativa automaticamente a sua CA interna (`tls internal`), emitindo um certificado SSL local seguro. Os navegadores na rede local podem aceder diretamente via `https://192.168.x.x`.

---

## 6. Estrutura de Ficheiros no Servidor

- `/opt/fsys360-service/` — Código e ficheiros da aplicação em produção.
- `/opt/fsys360-service/.env` — Variáveis de ambiente e credenciais da base de dados (protegido com permissão `600`).
- `/var/backups/fsys360/` — Ficheiros de cópia de segurança comprimidos (`.sql.gz`) com retenção de 30 dias.
- `/var/log/fsys360/` — Registos de atividade e erros da aplicação Node.js.
- `/etc/caddy/Caddyfile` — Configuração do proxy reverso e regras HTTPS.

---

## 7. Resolução de Problemas Comuns (Troubleshooting)

### A porta 80 ou 443 já está em uso por outro serviço (ex: Apache / Nginx antigo)
Se tiver um servidor antigo a correr na máquina, pare-o antes de iniciar o Caddy:
```bash
sudo systemctl stop apache2 && sudo systemctl disable apache2
# ou
sudo systemctl stop nginx && sudo systemctl disable nginx
sudo systemctl restart caddy
```

### Como repor a palavra-passe do utilizador administrador diretamente na base de dados
Se perder o acesso ao utilizador `admin`:
```bash
sudo -u postgres psql -d fsys360_db -c "UPDATE users SET password_hash = crypt('NovaSenha123', gen_salt('bf', 8)) WHERE username = 'admin';"
```

### Como restaurar uma cópia de segurança (Backup)
```bash
gunzip -c /var/backups/fsys360/fsys360_backup_DATA.sql.gz | PGPASSWORD="sua_senha" psql -h localhost -U fsys360 -d fsys360_db
```

---

Para suporte técnico ou questões adicionais:  
**FozSistemas — Equipamentos e Sistemas de Informação, Lda.**  
Website: [fozsistemas.com](https://fozsistemas.com) • Telefone: (+351) 233 094 320 • Figueira da Foz, Portugal.
