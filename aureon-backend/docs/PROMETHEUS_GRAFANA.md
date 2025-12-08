# Prometheus & Grafana Integration Guide

## 1. Prometheus Configuration

### prometheus.yml
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'aureon-backend'
    static_configs:
      - targets: ['localhost:5000']
    metrics_path: '/metrics'
    scheme: 'http'
```

## 2. Métricas Disponíveis

### Process Metrics
- `nodejs_process_uptime_seconds` - Uptime do processo
- `nodejs_heap_size_used_bytes` - Memória heap usada
- `nodejs_heap_size_total_bytes` - Memória heap total
- `nodejs_external_memory_bytes` - Memória externa
- `nodejs_cpu_user_seconds_total` - CPU user time
- `nodejs_cpu_system_seconds_total` - CPU system time

### Application Metrics
- `aureon_events_total` - Total de eventos no sistema
- `aureon_events_pending` - Eventos aguardando processamento
- `aureon_events_processing` - Eventos em processamento
- `aureon_events_dlq` - Eventos na DLQ
- `aureon_events_failed` - Eventos permanentemente falhados
- `aureon_events_completed` - Eventos completados
- `aureon_dlq_eligible_for_retry` - Eventos DLQ prontos para retry

## 3. Grafana Dashboards

### Dashboard: AUREON ERP Overview

#### Panel 1: Request Rate
```promql
rate(http_requests_total[5m])
```

#### Panel 2: Event Queue Status
```promql
aureon_events_pending + aureon_events_processing
```

#### Panel 3: DLQ Health
```promql
aureon_events_dlq
```

#### Panel 4: Memory Usage
```promql
nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes * 100
```

#### Panel 5: CPU Usage
```promql
rate(nodejs_cpu_user_seconds_total[5m]) + rate(nodejs_cpu_system_seconds_total[5m])
```

### Dashboard JSON
```json
{
  "dashboard": {
    "title": "AUREON ERP Monitoring",
    "panels": [
      {
        "title": "Events by Status",
        "targets": [
          {
            "expr": "aureon_events_pending",
            "legendFormat": "Pending"
          },
          {
            "expr": "aureon_events_processing",
            "legendFormat": "Processing"
          },
          {
            "expr": "aureon_events_dlq",
            "legendFormat": "DLQ"
          },
          {
            "expr": "aureon_events_failed",
            "legendFormat": "Failed"
          },
          {
            "expr": "aureon_events_completed",
            "legendFormat": "Completed"
          }
        ]
      }
    ]
  }
}
```

## 4. Alertas Recomendados

### rules.yml
```yaml
groups:
  - name: aureon_alerts
    rules:
      - alert: HighDLQCount
        expr: aureon_events_dlq > 100
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High number of events in DLQ"
          description: "DLQ has {{ $value }} events"

      - alert: HighMemoryUsage
        expr: (nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes) > 0.9
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value | humanizePercentage }}"

      - alert: ServiceDown
        expr: up{job="aureon-backend"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "AUREON Backend is down"
          description: "Service has been down for more than 1 minute"
```

## 5. Deployment

### Docker Compose
```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - ./rules.yml:/etc/prometheus/rules.yml
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--web.enable-lifecycle'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana-storage:/var/lib/grafana

  aureon-backend:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000

volumes:
  grafana-storage:
```

## 6. Accessing Services

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/admin)
- **AUREON Metrics**: http://localhost:5000/metrics
- **Health Check**: http://localhost:5000/health
- **Readiness**: http://localhost:5000/ready

## 7. Next Steps

1. Import dashboard JSON into Grafana
2. Configure alert notifications (Slack, Email, PagerDuty)
3. Set up retention policies
4. Configure backup for metrics data
5. Implement custom business metrics
