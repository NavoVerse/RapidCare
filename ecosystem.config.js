module.exports = {
  apps: [
    {
      name: 'rapidcare-backend',
      script: './server.js',
      cwd: './Backend',
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster', // Enable clustering
      watch: false, // Don't restart on file changes in production
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true
    }
  ]
};
