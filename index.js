const tools = require('./lib/tools');
const commands = require('./lib/commands');

module.exports = {
  readFile: tools.readFile,
  readConfig: tools.readConfig,
  performMigration: commands.performMigration,
  migrationHistory: commands.migrationHistory,
  listLocalMigrations: commands.listLocalMigrations
};
