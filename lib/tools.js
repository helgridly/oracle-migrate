const assert = require('assert');
const fs = require('fs');
const path = require('path');

const MigrationSet = require('./migrationSet');

const configFileName = '.oracle-migrate';

function log(key, msg) {
  console.log('  \033[90m%s :\033[0m \033[36m%s\033[0m', key, msg); // eslint-disable-line
}

/**
 * Abort with a message and exits process with error `1`
 *
 * @param {string} msg mesasage to show
 * @param {number} code exit code. Default is `1`
 * @returns {undefined}
 */
function abort(msg = 'Error undefined') {
  console.error('  \033[90m%s\033[0m', msg);
  process.exit(1);
}

/**
 * Slugify the given `str`
 *
 * @param {string} str string to slugify
 * @returns {string} returns string where spaces are replaced by `-`
 */
function slugify(str) {
  return str.replace(/[\s+\'\"]/g, '-');
}

/**
 * Loads all files files from `migration` directory
 * and creates a Set of migrations
 *
 * @param {string} migrationsDirectory directory path
 * @param {object} config database config
 * @param {string} config.user username
 * @param {string} config.password user password
 * @param {string} config.connectString database url with port
 *
 * @returns {Set} returns a `Set` object prepared for executing migrations
 */
function load(migrationsDirectory, config) {
  const dir = path.resolve(migrationsDirectory);
  const set = new MigrationSet(config);

  /*
   * Read all files in a 'migrations' directory,
   * sort them by name (timestamp order),
   * require and add to the migration list
   */
  fs.readdirSync(dir)
    .filter(file => file.match(/^\d+.*\.js$/))
    .sort()
    .forEach(file => {
      const mod = require(path.join(dir, file));

      set.addMigration(file, mod.up, mod.down);
    });

  return set;
};

/**
 * Reads config file as js module
 * @param  {string} path path to config file
 * @param  {string} root root folder
 * @return {undefined}
 */
function readConfig(name, root) {
  let config = readConfigJSON(name, root);

  // next try to find a config
  if(!config) {
    config = readConfigJS(`${name}.js`, root);
  }

  if(!config) {
    abort('config not found')
  }

  return config;
}

/**
 * Reads config file as js module
 * @param  {string} path path to config file
 * @param  {string} root root folder
 * @return {undefined}
 */
function readConfigJS(name, root) {
  assert(name, '\'name\' should be present');
  assert(root, '\'root\' should be present');
  assert(process.env.NODE_ENV, 'NODE_ENV should exist with valid value');

  let config;

  try {
    config = require(path.join(root, name));
  } catch(ex) {
    if (ex.code === 'MODULE_NOT_FOUND') {
      return;
    }

    abort(ex);
  }

  if (config[process.env.NODE_ENV]) {
    return config[process.env.NODE_ENV];
  }

  return config;
}

/**
 * Reads config file as json
 * @param  {string} path path to config file
 * @param  {string} root root folder
 * @return {undefined}
 */
function readConfigJSON(name, root) {
  assert(name, '\'name\' should be present');
  assert(root, '\'root\' should be present');
  assert(process.env.NODE_ENV, 'NODE_ENV should exist with valid value');

  let config;

  try {
    const file = fs.readFileSync(path.join(root, name));
    config = JSON.parse(file);
  } catch(ex) {
    if (ex.code === 'ENOENT') {
      return;
    }

    abort(ex);
  }

  if (config[process.env.NODE_ENV]) {
    return config[process.env.NODE_ENV];
  }

  return config;
}

/**
 * Reads file content
 *
 * @param {string} path path to SQL file
 * @returns {Promise} returns content of SQL file
 */
function readFile(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (error, sql) => {
      if (error) {
        return reject(error);
      }

      resolve(sql);
    });
  });
}

module.exports = {
  log,
  abort,
  slugify,
  load,
  readConfig,
  readFile
}
