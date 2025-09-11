module.exports = {
  apps: [
    {
      name: 'car-marketplace-api',
      script: 'dist/app.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Performance
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      
      // Auto restart
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Health monitoring
      health_check_url: 'http://localhost:3000/health',
      health_check_grace_period: 3000,
      
      // Process management
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 3000,
      
      // Environment specific configurations
      source_map_support: true,
      instance_var: 'INSTANCE_ID'
    }
  ],
  
  // Deployment configuration
  deploy: {
    staging: {
      user: 'deploy',
      host: 'staging.carmarketplace.ph',
      ref: 'origin/develop',
      repo: 'git@github.com:your-org/car-marketplace-ph-api.git',
      path: '/var/www/car-marketplace-staging',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': ''
    },
    
    production: {
      user: 'deploy',
      host: 'api.carmarketplace.ph',
      ref: 'origin/main',
      repo: 'git@github.com:your-org/car-marketplace-ph-api.git',
      path: '/var/www/car-marketplace-production',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};