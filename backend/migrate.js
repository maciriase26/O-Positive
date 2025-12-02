#!/usr/bin/env node

const { runMigrations, rollbackMigration } = require('./migrations');

const command = process.argv[2];

(async () => {
  try {
    if (command === 'down') {
      await rollbackMigration();
    } else if (command === 'up' || !command) {
      await runMigrations();
    } else {
      console.log('Unknown command:', command);
      console.log('Usage: node migrate.js [up|down]');
      process.exit(1);
    }
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
