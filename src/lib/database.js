import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { getEnvNumber, getEnvString } from './env.js';

// Carregar variáveis de ambiente
dotenv.config({ quiet: true });

// Configuração da conexão
const dbConfig = {
  host: getEnvString('DB_HOST', 'localhost'),
  port: getEnvNumber('DB_PORT', 3306),
  user: getEnvString('DB_USER', 'reconectare_app'),
  password: getEnvString('DB_PASSWORD', ''),
  database: getEnvString('DB_NAME', 'reconectarehtml'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

const escapeIdentifier = (value) => String(value).replace(/`/g, '``');

// Criar pool de conexões
const pool = mysql.createPool(dbConfig);

export const ensureDatabaseExists = async () => {
  if (!dbConfig.database) return;

  const connection = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password
  });

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${escapeIdentifier(dbConfig.database)}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  } finally {
    await connection.end();
  }
};

// Função para testar a conexão
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexão com MySQL estabelecida com sucesso!');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar com MySQL:', error.message);
    return false;
  }
};

// Função helper para executar queries
export const query = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('❌ Erro ao executar query:', error.message);
    throw error;
  }
};

// Função helper para executar queries que retornam um único resultado
export const queryOne = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows[0] || null;
  } catch (error) {
    console.error('❌ Erro ao executar query:', error.message);
    throw error;
  }
};

// Função para iniciar uma transação
export const transaction = async (callback) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Exportar o pool para uso direto quando necessário
export default pool;
