/**
 * Script de Setup Automático do Banco de Dados
 * Execute com: node setup-database.js
 */

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cores para o terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  step: (msg) => console.log(`\n${colors.blue}▶${colors.reset} ${msg}`)
};

async function setupDatabase() {
  let connection;
  
  try {
    log.step('Iniciando setup do banco de dados...');
    
    // PASSO 1: Conectar como root (sem especificar database)
    log.info('Conectando ao MySQL...');
    
    // Tentar conectar (o usuário precisa ter MySQL rodando)
    try {
      connection = await mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root', // ou o usuário admin que você usa
        password: '', // IMPORTANTE: Coloque a senha do root aqui se tiver
        multipleStatements: true
      });
      log.success('Conectado ao MySQL!');
    } catch (error) {
      log.error('Erro ao conectar no MySQL');
      log.warn('Verifique se:');
      log.warn('1. O MySQL Server está rodando');
      log.warn('2. As credenciais estão corretas (edite setup-database.js se necessário)');
      log.warn('3. Você tem permissão de admin/root');
      throw error;
    }

    // PASSO 2: Criar usuário
    log.step('Criando usuário reconectarehml...');
    try {
      await connection.query(`
        CREATE USER IF NOT EXISTS 'reconectarehml'@'localhost' IDENTIFIED BY 'reconectarehml'
      `);
      log.success('Usuário criado!');
    } catch (error) {
      if (error.code === 'ER_CANNOT_USER') {
        log.warn('Usuário já existe (tudo bem!)');
      } else {
        throw error;
      }
    }

    // PASSO 3: Criar banco
    log.step('Criando banco de dados...');
    await connection.query(`
      CREATE DATABASE IF NOT EXISTS reconectarehml 
      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    log.success('Banco criado!');

    // PASSO 4: Dar permissões
    log.step('Concedendo permissões...');
    await connection.query(`
      GRANT ALL PRIVILEGES ON reconectarehml.* TO 'reconectarehml'@'localhost'
    `);
    await connection.query('FLUSH PRIVILEGES');
    log.success('Permissões concedidas!');

    // PASSO 5: Usar o banco
    await connection.query('USE reconectarehml');

    // PASSO 6: Criar tabelas
    log.step('Criando tabelas...');
    
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error('Arquivo schema.sql não encontrado!');
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Remover comandos problemáticos
    const cleanSchema = schema
      .replace(/CREATE DATABASE IF NOT EXISTS[^;]+;/gi, '')
      .replace(/USE reconectarehml;/gi, '')
      .replace(/DELIMITER \$\$/gi, '')
      .replace(/DELIMITER ;/gi, '')
      .replace(/\$\$/g, ';');

    // Executar schema limpo
    await connection.query(cleanSchema);
    log.success('Tabelas criadas!');

    // PASSO 7: Verificar tabelas
    log.step('Verificando instalação...');
    const [tables] = await connection.query('SHOW TABLES');
    log.info(`Tabelas criadas: ${tables.length}`);
    tables.forEach(t => log.success(`  - ${Object.values(t)[0]}`));

    // PASSO 8: Verificar dados
    const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
    const [brands] = await connection.query('SELECT COUNT(*) as count FROM brands');
    const [types] = await connection.query('SELECT COUNT(*) as count FROM equipment_types');

    log.info(`Usuários: ${users[0].count}`);
    log.info(`Marcas: ${brands[0].count}`);
    log.info(`Tipos: ${types[0].count}`);

    // Sucesso!
    console.log('\n' + '='.repeat(60));
    log.success('BANCO DE DADOS CONFIGURADO COM SUCESSO! 🎉');
    console.log('='.repeat(60));
    
    log.info('\nPróximos passos:');
    log.info('1. Execute: npm run dev');
    log.info('2. Acesse: http://localhost:3005');
    log.info('3. Login: teste@example.com / senha: teste');
    
  } catch (error) {
    console.log('\n' + '='.repeat(60));
    log.error('ERRO NO SETUP!');
    console.log('='.repeat(60));
    log.error(error.message);
    
    if (error.code === 'ECONNREFUSED') {
      log.warn('\n⚠️  MySQL Server não está rodando!');
      log.info('Soluções:');
      log.info('1. Inicie o MySQL Server');
      log.info('2. OU use o MySQL Workbench (mais fácil)');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      log.warn('\n⚠️  Senha do root incorreta!');
      log.info('Edite o arquivo setup-database.js e coloque a senha correta na linha 36');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Executar
setupDatabase();
