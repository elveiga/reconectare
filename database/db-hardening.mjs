import mysql from 'mysql2/promise';

const rootPassword = process.env.MYSQL_ROOT_PASSWORD;
const appPassword = process.env.MYSQL_APP_PASSWORD;

if (!rootPassword || !appPassword) {
  console.log('HARDENING_ERR');
  console.log('Defina MYSQL_ROOT_PASSWORD e MYSQL_APP_PASSWORD no ambiente.');
  process.exit(1);
}

(async () => {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: rootPassword,
      multipleStatements: true
    });

    await connection.query("CREATE USER IF NOT EXISTS 'reconectare_app'@'localhost' IDENTIFIED BY ?", [appPassword]);
    await connection.query("REVOKE ALL PRIVILEGES, GRANT OPTION FROM 'reconectare_app'@'localhost'");
    await connection.query("GRANT SELECT, INSERT, UPDATE, DELETE ON reconectarehtml.* TO 'reconectare_app'@'localhost'");
    await connection.query('FLUSH PRIVILEGES');

    const [grants] = await connection.query("SHOW GRANTS FOR 'reconectare_app'@'localhost'");

    console.log('HARDENING_OK');
    console.log(JSON.stringify({
      user: 'reconectare_app@localhost',
      grants: grants.map((g) => Object.values(g)[0])
    }, null, 2));
  } catch (error) {
    console.log('HARDENING_ERR');
    console.log(error.code || 'NO_CODE', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
})();
