module.exports = {
  apps: [{
    name: 'smtrade-soft',
    script: 'index.js',
    cwd: '/var/www/smtradeapp-soft/server',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    env_file: '/var/www/smtradeapp-soft/server/.env',
    env: {
      NODE_ENV: 'production',
    },
  }],
};
