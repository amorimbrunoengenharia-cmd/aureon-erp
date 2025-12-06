/**
 * PM2 Ecosystem File for AUREON ERP
 * 
 * Usage:
 *   Development: pm2 start ecosystem.config.cjs --env development
 *   Production:  pm2 start ecosystem.config.cjs --env production
 *   Staging:     pm2 start ecosystem.config.cjs --env staging
 * 
 * Commands:
 *   pm2 list           - List all processes
 *   pm2 logs aureon    - View logs
 *   pm2 monit          - Monitor processes
 *   pm2 restart aureon - Restart application
 *   pm2 stop aureon    - Stop application
 *   pm2 delete aureon  - Remove from PM2
 *   pm2 save           - Save current process list
 *   pm2 startup        - Generate startup script
 */

module.exports = {
  apps: [
    {
      name: 'aureon-erp',
      script: './server.js',
      
      // ===== EXECUTION MODE =====
      instances: process.env.PM2_INSTANCES || 2, // Number of instances (cluster mode)
      exec_mode: 'cluster', // 'cluster' for load balancing, 'fork' for single instance
      
      // ===== ENVIRONMENT VARIABLES =====
      env_development: {
        NODE_ENV: 'development',
        PORT: 5000,
        USE_POSTGRES: false
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 5000,
        USE_POSTGRES: true
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        USE_POSTGRES: true
      },
      
      // ===== AUTO-RESTART & WATCH =====
      watch: false, // Set to true for development, false for production
      ignore_watch: [
        'node_modules',
        'logs',
        'backups',
        'database.sqlite',
        '.git'
      ],
      
      // ===== RESTART POLICIES =====
      max_restarts: 10, // Max number of restarts within restart_delay
      min_uptime: '10s', // Min uptime to consider app as stable
      max_memory_restart: '500M', // Restart if memory exceeds this
      restart_delay: 4000, // Delay between restarts
      autorestart: true, // Auto restart on crash
      
      // ===== EXPONENTIAL BACKOFF =====
      exp_backoff_restart_delay: 100, // Initial delay (ms)
      
      // ===== LOGGING =====
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      merge_logs: true, // Merge logs from all instances
      
      // ===== ADVANCED FEATURES =====
      listen_timeout: 3000, // Timeout before killing app if not listening
      kill_timeout: 5000, // Timeout before force killing
      shutdown_with_message: false,
      
      // ===== SOURCE MAP SUPPORT =====
      source_map_support: true,
      
      // ===== CRON RESTART (optional) =====
      // cron_restart: '0 0 * * *', // Restart every day at midnight
      
      // ===== INTERPRETER =====
      interpreter: 'node', // Use 'node' or specify node version
      node_args: '--max-old-space-size=2048', // Node.js arguments
      
      // ===== INSTANCE VAR (cluster mode) =====
      instance_var: 'INSTANCE_ID',
      
      // ===== WAIT FOR READY =====
      wait_ready: true, // Wait for 'ready' event before considering app as online
      
      // ===== TIME =====
      time: true // Prefix logs with timestamp
    }
  ],
  
  // ===== DEPLOYMENT CONFIGURATION =====
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-production-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/aureon-erp.git',
      path: '/var/www/aureon-erp',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.cjs --env production',
      'pre-setup': 'echo "Setting up deployment..."',
      'post-setup': 'echo "Deployment setup complete"',
      env: {
        NODE_ENV: 'production'
      }
    },
    staging: {
      user: 'deploy',
      host: 'your-staging-server.com',
      ref: 'origin/develop',
      repo: 'git@github.com:your-username/aureon-erp.git',
      path: '/var/www/aureon-erp-staging',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.cjs --env staging',
      env: {
        NODE_ENV: 'staging'
      }
    }
  }
};
