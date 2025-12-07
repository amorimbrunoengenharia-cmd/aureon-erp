# ⚡ Quick Commands - AUREON ERP

Comandos úteis do dia-a-dia.

---

## 🚀 Development

### Start Services

```bash
# Backend (Terminal 1)
cd aureon-backend
npm run dev

# Frontend (Terminal 2)
cd aureon-os
npm run dev
```

### Quick Test

```bash
# Health check
curl http://localhost:5000/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aureon.com","password":"admin123"}'

# Dashboard (substitua TOKEN)
curl http://localhost:5000/api/financial/dashboard?startDate=2024-01-01&endDate=2024-12-31 \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Database

```bash
# Reset database (SQLite)
cd aureon-backend
rm database.sqlite
npm run migrate

# PostgreSQL backup
pg_dump -U aureon aureon_erp > backup_$(date +%Y%m%d).sql

# PostgreSQL restore
psql -U aureon aureon_erp < backup_20241206.sql
```

---

## 🔍 Debugging

### View Logs

```bash
# Backend logs
cd aureon-backend
npm run dev  # Logs aparecem no terminal

# PM2 logs (produção)
pm2 logs aureon-backend
pm2 logs aureon-backend --lines 100
pm2 logs aureon-backend --err  # Apenas erros

# Nginx logs
sudo tail -f /var/log/nginx/aureon-api-access.log
sudo tail -f /var/log/nginx/aureon-api-error.log
```

### Check Status

```bash
# PM2 status
pm2 status
pm2 monit  # Monitoring em tempo real

# Database
psql -U aureon -d aureon_erp -c "\dt"  # List tables
psql -U aureon -d aureon_erp -c "SELECT COUNT(*) FROM sales;"

# Redis
redis-cli ping
redis-cli info stats
redis-cli keys "cache:*"
```

### Common Issues

```bash
# Port 5000 already in use
netstat -ano | findstr :5000
# ou
lsof -ti:5000 | xargs kill -9

# Node modules issues
cd aureon-backend
rm -rf node_modules package-lock.json
npm install

# Database connection failed
sudo systemctl status postgresql
sudo systemctl restart postgresql
```

---

## 🗄️ Database Management

### SQLite (Development)

```bash
# Open SQLite console
cd aureon-backend
sqlite3 database.sqlite

# Useful queries
.tables                          # List tables
.schema sales                    # Show table structure
SELECT * FROM sales LIMIT 10;    # View data
.quit                            # Exit
```

### PostgreSQL (Production)

```bash
# Connect to database
psql -U aureon -d aureon_erp

# Useful queries
\dt                              # List tables
\d+ sales                        # Describe table
SELECT COUNT(*) FROM sales;      # Count records
\q                               # Quit

# Create index
psql -U aureon -d aureon_erp -f scripts/add-indexes.sql

# Vacuum (optimize)
psql -U aureon -d aureon_erp -c "VACUUM ANALYZE;"
```

---

## 🧹 Maintenance

### Clean Cache

```bash
# Redis cache
redis-cli flushall

# Node modules
cd aureon-backend && rm -rf node_modules && npm ci
cd aureon-os && rm -rf node_modules && npm ci

# Build cache
cd aureon-os && rm -rf dist && npm run build
```

### Update Dependencies

```bash
# Check outdated
cd aureon-backend
npm outdated

# Update all (CAREFUL!)
npm update

# Update specific package
npm install package-name@latest
```

### Backup Everything

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$HOME/backups/aureon_$DATE"

mkdir -p $BACKUP_DIR

# Database
pg_dump -U aureon aureon_erp | gzip > $BACKUP_DIR/db.sql.gz

# Code
tar -czf $BACKUP_DIR/code.tar.gz /path/to/aureon-erp

# Config
cp /path/to/aureon-erp/aureon-backend/.env $BACKUP_DIR/

echo "✅ Backup completed: $BACKUP_DIR"
```

---

## 📊 Performance

### Redis Monitoring

```bash
# Watch cache hits/misses in real-time
redis-cli monitor

# Get statistics
redis-cli info stats | grep hits

# See all cache keys
redis-cli keys "cache:*" | wc -l

# Clear specific pattern
redis-cli --scan --pattern "cache:financial:*" | xargs redis-cli del
```

### Database Performance

```bash
# Slow queries (PostgreSQL)
psql -U aureon -d aureon_erp -c "
  SELECT query, calls, total_time, mean_time 
  FROM pg_stat_statements 
  ORDER BY mean_time DESC 
  LIMIT 10;"

# Index usage
psql -U aureon -d aureon_erp -c "
  SELECT schemaname, tablename, indexname, idx_scan 
  FROM pg_stat_user_indexes 
  ORDER BY idx_scan DESC;"

# Table sizes
psql -U aureon -d aureon_erp -c "
  SELECT tablename, 
         pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
  FROM pg_tables 
  WHERE schemaname = 'public' 
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

### Lighthouse Performance

```bash
# Install (once)
npm install -g lighthouse

# Run audit
lighthouse http://localhost:5173 --view

# Headless mode (JSON output)
lighthouse http://localhost:5173 --output json --output-path ./report.json
```

---

## 🚢 Deployment

### Quick Deploy

```bash
# Pull latest code
cd /home/aureon/aureon-erp
git pull origin main

# Update backend
cd aureon-backend
npm ci --production
pm2 restart aureon-backend

# Update frontend
cd ../aureon-os
npm ci
npm run build

echo "✅ Deploy completed!"
```

### Rollback

```bash
# Rollback to previous commit
git reset --hard HEAD~1
git push -f origin main

# Rollback PM2
pm2 restart aureon-backend
```

### Check Deployment

```bash
# API version
curl http://localhost:5000/health

# Frontend version
curl http://localhost:5173/index.html | grep version

# PM2 status
pm2 status

# Nginx status
sudo systemctl status nginx
```

---

## 🧪 Testing

### Unit Tests

```bash
cd aureon-backend
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### API Tests

```bash
# Install httpie (better than curl)
sudo apt install httpie

# Login
http POST localhost:5000/api/auth/login email=admin@aureon.com password=admin123

# Dashboard
http GET localhost:5000/api/financial/dashboard startDate==2024-01-01 endDate==2024-12-31 "Authorization:Bearer TOKEN"
```

### Load Testing

```bash
# Install k6
sudo apt install k6

# Create test script (load-test.js)
cat > load-test.js << 'EOF'
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 10,           // 10 virtual users
  duration: '30s',   // 30 seconds
};

export default function () {
  let res = http.get('http://localhost:5000/health');
  check(res, { 'status is 200': (r) => r.status === 200 });
}
EOF

# Run test
k6 run load-test.js
```

---

## 🔐 Security

### Generate Secrets

```bash
# JWT secrets (add to .env)
openssl rand -base64 48

# Marketplace encryption key
openssl rand -hex 32
```

### SSL Certificate

```bash
# Install Let's Encrypt
sudo certbot --nginx -d api.seudominio.com -d app.seudominio.com

# Renew (automatic, but test)
sudo certbot renew --dry-run

# Check expiration
openssl s_client -connect api.seudominio.com:443 -servername api.seudominio.com | openssl x509 -noout -dates
```

---

## 🔥 Emergency Commands

### Service Down

```bash
# Check what's running
sudo systemctl status nginx
sudo systemctl status postgresql
pm2 status

# Restart everything
sudo systemctl restart nginx
sudo systemctl restart postgresql
pm2 restart all

# Check ports
sudo netstat -tlnp | grep -E ':(5000|5173|5432|6379)'
```

### Database Recovery

```bash
# Restore from backup
sudo systemctl stop postgresql
sudo -u postgres psql -c "DROP DATABASE aureon_erp;"
sudo -u postgres psql -c "CREATE DATABASE aureon_erp OWNER aureon;"
gunzip -c backup_20241206.sql.gz | psql -U aureon aureon_erp
sudo systemctl start postgresql
```

### Clear Everything and Start Fresh

```bash
# ⚠️ WARNING: This will delete all data!

# Stop services
pm2 stop all
sudo systemctl stop nginx

# Clean backend
cd aureon-backend
rm -rf node_modules database.sqlite
npm ci
npm run migrate

# Clean frontend
cd ../aureon-os
rm -rf node_modules dist
npm ci
npm run build

# Start services
pm2 start all
sudo systemctl start nginx
```

---

## 📱 Useful Aliases (Add to ~/.bashrc)

```bash
# Aureon aliases
alias aureon-start='cd ~/aureon-erp/aureon-backend && npm run dev'
alias aureon-logs='pm2 logs aureon-backend'
alias aureon-status='pm2 status && redis-cli ping && psql -U aureon -d aureon_erp -c "\dt"'
alias aureon-backup='pg_dump -U aureon aureon_erp | gzip > ~/backups/aureon_$(date +%Y%m%d).sql.gz'
alias aureon-deploy='cd ~/aureon-erp && git pull && cd aureon-backend && npm ci --production && pm2 restart aureon-backend && cd ../aureon-os && npm ci && npm run build'

# Reload aliases
source ~/.bashrc
```

---

## 🎯 Daily Tasks

### Morning Checklist

```bash
# Check status
pm2 status
redis-cli ping
psql -U aureon -d aureon_erp -c "SELECT 1;"

# Check logs for errors
pm2 logs aureon-backend --lines 100 --err

# Check Sentry (browser)
# https://sentry.io/organizations/your-org/issues/

# Check performance
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:5000/health
```

**curl-format.txt:**
```
     time_total:  %{time_total}s
   time_connect:  %{time_connect}s
time_starttransfer:  %{time_starttransfer}s
           size:  %{size_download} bytes
```

### Weekly Checklist

```bash
# Update dependencies
cd aureon-backend && npm outdated

# Run tests
npm test

# Database maintenance
psql -U aureon -d aureon_erp -c "VACUUM ANALYZE;"

# Check disk space
df -h

# Backup
aureon-backup  # (if alias configured)
```

---

## 📚 Resources

- **API Docs**: http://localhost:5000/api-docs
- **Sentry**: https://sentry.io
- **Uptime Robot**: https://uptimerobot.com
- **PM2 Docs**: https://pm2.keymetrics.io/docs/
- **Redis Docs**: https://redis.io/docs/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

---

**Última atualização:** 2025-12-06

💡 **Dica**: Adicione este arquivo aos seus favoritos do navegador!
