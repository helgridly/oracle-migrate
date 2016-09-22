const fs = require('fs')
const oracledb = require('oracledb')

/**
 * Connection configuration
 * for Oracle DB
 */
const dbConfig = {
  user: process.env.NODE_ORACLEDB_USER,
  password : process.env.NODE_ORACLEDB_PASSWORD,
  connectString : process.env.NODE_ORACLEDB_CONNECTIONSTRING,
  externalAuth : process.env.NODE_ORACLEDB_EXTERNALAUTH ? true : false
}

/**
 * Runs sql code
 */
function runsql(path) {
  return new Promise( (resolve, reject) => {
    fs.readFile(path, 'utf8', (err, sql) => {
      if(err) throw err;

      if(sql === '') return resolve()

      // exec sql
      oracledb.getConnection({
        user : dbConfig.user,
        password : dbConfig.password,
        connectString : dbConfig.connectString
      }).then( connection => {
        return connection.execute(sql)
          .then( res => {
            return resolve() && connection.release()
          })
          .catch(err => {
            console.log(`err: ${err}`)

            return reject() && connection.release()
          })
      }).catch(err => console.log(err))
    })
  })
}

/**
 * Migrates database up
 */
exports.up = function(next) {
  runsql('{up}')
    .then(next)
    .catch(next)
};

/**
 * Migrates database down
 */
exports.down = function(next) {
  runsql('{down}')
    .then(next)
    .catch(next)
};
