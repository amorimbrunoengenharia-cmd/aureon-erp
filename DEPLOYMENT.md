# 🚀 AUREON ERP - Production Deployment Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- PM2 installed globally: `npm install -g pm2`
- Nginx (recommended for reverse proxy)
- SSL certificate (Let's Encrypt recommended)

---

## 1. Server Setup

### 1.1 Create Application User

```bash
sudo adduser aureon
sudo usermod -aG sudo aureon
su - aureon
```

### 1.2 Install Node.js (if not installed)

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 1.3 Install PM2

```bash
sudo npm install -g pm2
```

### 1.4 Install PostgreSQL (if not installed)

```bash
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib
```

---

## 2. Database Setup

### 2.1 Create Database and User

```bash
sudo -u postgres psql

-- In PostgreSQL shell:
CREATE DATABASE aureon_erp;
CREATE USER aureon_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE aureon_erp TO aureon_user;

-- Grant schema privileges
\c aureon_erp
GRANT ALL ON SCHEMA public TO aureon_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO aureon_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO aureon_user;

\q
```

### 2.2 Configure PostgreSQL for Remote Connections (if needed)

Edit `/etc/postgresql/14/main/postgresql.conf`:
```
listen_addresses = 'localhost'  # or '*' for all interfaces
```

Edit `/etc/postgresql/14/main/pg_hba.conf`:
```
# IPv4 local connections:
host    aureon_erp    aureon_user    127.0.0.1/32    md5
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

---

## 3. Application Deployment

### 3.1 Clone Repository

```bash
cd /var/www
sudo git clone https://github.com/your-username/aureon-erp.git
sudo chown -R aureon:aureon aureon-erp
cd aureon-erp/aureon-backend
```

### 3.2 Install Dependencies

```bash
npm install --production
```

### 3.3 Configure Environment Variables

```bash
cp .env.example .env
nano .env
```

**Required environment variables for production:**

```env
# Application
NODE_ENV=production
PORT=5000

# Database
USE_POSTGRES=true
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aureon_erp
DB_USER=aureon_user
DB_PASSWORD=your_secure_password_here
DB_SSL=false
DB_SSL_REJECT_UNAUTHORIZED=true
DB_POOL_MAX=20
DB_POOL_MIN=5

# JWT (CHANGE THESE!)
JWT_SECRET=generate_a_secure_random_string_min_32_chars
JWT_REFRESH_SECRET=generate_another_secure_random_string_min_32_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Security
CORS_ORIGIN=https://yourdomain.com
SESSION_SECRET=generate_a_secure_session_secret
MARKETPLACE_ENCRYPTION_KEY=generate_64_hex_chars_32_bytes

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email (configure your SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM_NAME=AUREON ERP

# Error Monitoring (optional but recommended)
SENTRY_DSN=your_sentry_dsn_here

# Features
ENABLE_AUDIT_LOG=true
ENABLE_MARKETPLACE_SYNC=true
ENABLE_EMAIL_NOTIFICATIONS=true

# Production
TRUST_PROXY=true
FORCE_HTTPS=true
```

**Generate secure keys:**

```bash
# Generate JWT secrets (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate encryption key (32 bytes = 64 hex chars)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.4 Run Database Migrations

```bash
# If using Sequelize migrations (recommended)
npx sequelize-cli db:migrate

# Or sync models (only once, not recommended for production updates)
# Models will auto-sync on first run if migrations not used
```

---

## 4. PM2 Process Management

### 4.1 Start Application with PM2

```bash
pm2 start ecosystem.config.cjs --env production
```

### 4.2 Save PM2 Process List

```bash
pm2 save
```

### 4.3 Setup PM2 Startup Script

```bash
pm2 startup
# Copy and run the command that PM2 outputs
```

### 4.4 Useful PM2 Commands

```bash
pm2 list                    # List all processes
pm2 logs aureon-erp         # View logs
pm2 logs aureon-erp --lines 100  # Last 100 lines
pm2 monit                   # Monitor processes
pm2 restart aureon-erp      # Restart app
pm2 reload aureon-erp       # Zero-downtime reload
pm2 stop aureon-erp         # Stop app
pm2 delete aureon-erp       # Remove from PM2
pm2 flush                   # Clear logs
```

---

## 5. Nginx Configuration

### 5.1 Install Nginx

```bash
sudo apt-get install -y nginx
```

### 5.2 Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/aureon-erp
```

**Configuration:**

```nginx
# Upstream for PM2 cluster
upstream aureon_backend {
    least_conn;
    server 127.0.0.1:5000;
    server 127.0.0.1:5001;  # If using cluster mode with 2+ instances
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name api.yourdomain.com;
    
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/aureon-erp-access.log;
    error_log /var/log/nginx/aureon-erp-error.log;

    # Client upload size
    client_max_body_size 10M;

    # Proxy settings
    location / {
        proxy_pass http://aureon_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint (no auth required)
    location /health {
        proxy_pass http://aureon_backend;
        access_log off;
    }
}
```

### 5.3 Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/aureon-erp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 6. SSL Certificate (Let's Encrypt)

### 6.1 Install Certbot

```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

### 6.2 Obtain Certificate

```bash
sudo certbot --nginx -d api.yourdomain.com
```

### 6.3 Auto-renewal

Certbot automatically sets up auto-renewal. Verify:

```bash
sudo certbot renew --dry-run
```

---

## 7. Firewall Configuration

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
sudo ufw status
```

---

## 8. Monitoring & Logging

### 8.1 PM2 Monitoring

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 8.2 Application Logs

Logs are stored in:
- PM2 logs: `~/.pm2/logs/`
- Application logs: `./logs/`
- Nginx logs: `/var/log/nginx/`

View logs:
```bash
pm2 logs aureon-erp
tail -f logs/app.log
tail -f /var/log/nginx/aureon-erp-error.log
```

### 8.3 Setup Sentry (Error Tracking)

1. Create account at https://sentry.io
2. Create new project
3. Add DSN to `.env`: `SENTRY_DSN=your_dsn_here`
4. Restart application: `pm2 restart aureon-erp`

---

## 9. Backup Strategy

### 9.1 Database Backups

Create backup script `/home/aureon/backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/aureon-erp"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/aureon_erp_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR

PGPASSWORD=your_password pg_dump -h localhost -U aureon_user aureon_erp > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

Make executable:
```bash
chmod +x /home/aureon/backup-db.sh
```

### 9.2 Setup Cron Job

```bash
crontab -e
```

Add:
```cron
# Daily database backup at 2 AM
0 2 * * * /home/aureon/backup-db.sh >> /var/log/aureon-backup.log 2>&1
```

---

## 10. Deployment Checklist

### Pre-deployment:
- [ ] All environment variables configured
- [ ] Secure secrets generated (not default values)
- [ ] Database created and accessible
- [ ] SSL certificate obtained
- [ ] Firewall configured
- [ ] Backup strategy implemented

### Deployment:
- [ ] Code deployed to server
- [ ] Dependencies installed (`npm install --production`)
- [ ] Database migrated
- [ ] PM2 configured and running
- [ ] Nginx configured and restarted
- [ ] Health check endpoint accessible

### Post-deployment:
- [ ] Application responding on HTTPS
- [ ] CORS working for frontend
- [ ] Database connections working
- [ ] Logs being written correctly
- [ ] PM2 auto-start configured
- [ ] Monitoring/alerting configured
- [ ] Backup cron job running
- [ ] Performance tested

---

## 11. Troubleshooting

### Check Application Status
```bash
pm2 list
pm2 logs aureon-erp --lines 50
```

### Check Database Connection
```bash
psql -h localhost -U aureon_user -d aureon_erp
```

### Check Nginx Status
```bash
sudo systemctl status nginx
sudo nginx -t
tail -f /var/log/nginx/aureon-erp-error.log
```

### Check Ports
```bash
sudo netstat -tlnp | grep :5000
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

### Common Issues:

**Port already in use:**
```bash
sudo lsof -i :5000
pm2 delete all
pm2 start ecosystem.config.cjs --env production
```

**Database connection failed:**
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify credentials in `.env`
- Check `pg_hba.conf` configuration

**502 Bad Gateway:**
- Check PM2 is running: `pm2 list`
- Check application logs: `pm2 logs`
- Verify Nginx upstream configuration

---

## 12. Updates & Maintenance

### Deploy New Version

```bash
cd /var/www/aureon-erp
git pull origin main
cd aureon-backend
npm install --production
pm2 reload aureon-erp
```

### Zero-Downtime Deployment

```bash
pm2 reload ecosystem.config.cjs --env production
```

### Database Migration

```bash
npx sequelize-cli db:migrate
pm2 restart aureon-erp
```

---

## 13. Performance Optimization

### Enable Gzip Compression in Nginx

Already included in configuration above.

### Database Optimization

```sql
-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_sales_tenant_id ON sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clients_tenant_id ON clients(tenant_id);

-- Analyze tables
ANALYZE;
```

### PM2 Cluster Mode

Configure in `ecosystem.config.cjs`:
```javascript
instances: 2,  // Number of CPU cores or specific number
exec_mode: 'cluster'
```

---

## 14. Security Hardening

### Fail2Ban for SSH Protection

```bash
sudo apt-get install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Regular Updates

```bash
sudo apt-get update
sudo apt-get upgrade -y
```

### Monitor for Vulnerabilities

```bash
npm audit
npm audit fix
```

---

## Support

For issues or questions:
- Check logs: `pm2 logs aureon-erp`
- Review documentation: `/docs`
- Contact support: support@aureonerp.com
