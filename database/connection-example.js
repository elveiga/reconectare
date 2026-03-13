/**
 * ============================================
 * EXEMPLO DE CONEXÃO COM O BANCO DE DADOS
 * Database: reconectarehtml
 * ============================================
 */

// ========================================
// OPÇÃO 1: Node.js + MySQL2 (Recomendado)
// ========================================

// Instalação: npm install mysql2 dotenv
const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuração da conexão
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'reconectarehtml',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Pool de conexões (melhor performance)
const pool = mysql.createPool(dbConfig);

// ========================================
// EXEMPLOS DE USO
// ========================================

/**
 * Exemplo 1: Buscar todos os usuários
 */
async function getAllUsers() {
  try {
    const [rows] = await pool.query('SELECT * FROM users');
    console.log('Usuários:', rows);
    return rows;
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    throw error;
  }
}

/**
 * Exemplo 2: Login de usuário
 */
async function loginUser(email, senha) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND senha = ? AND blocked = FALSE',
      [email, senha]
    );
    
    if (rows.length === 0) {
      return { success: false, message: 'Credenciais inválidas' };
    }
    
    const user = rows[0];
    
    if (user.blocked) {
      return { success: false, message: 'Usuário bloqueado' };
    }
    
    return { 
      success: true, 
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role
      }
    };
  } catch (error) {
    console.error('Erro no login:', error);
    throw error;
  }
}

/**
 * Exemplo 3: Buscar equipamentos com filtros
 */
async function getListings(filters = {}) {
  try {
    let query = 'SELECT * FROM listings WHERE 1=1';
    const params = [];
    
    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    
    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }
    
    if (filters.brand) {
      query += ' AND brand = ?';
      params.push(filters.brand);
    }
    
    if (filters.isPremium !== undefined) {
      query += ' AND is_premium = ?';
      params.push(filters.isPremium);
    }
    
    if (filters.minPrice) {
      query += ' AND price >= ?';
      params.push(filters.minPrice);
    }
    
    if (filters.maxPrice) {
      query += ' AND price <= ?';
      params.push(filters.maxPrice);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [rows] = await pool.query(query, params);
    
    // Parse JSON fields
    const listings = rows.map(row => ({
      ...row,
      specs: JSON.parse(row.specs || '{}'),
      seller: JSON.parse(row.seller || '{}')
    }));
    
    return listings;
  } catch (error) {
    console.error('Erro ao buscar equipamentos:', error);
    throw error;
  }
}

/**
 * Exemplo 4: Criar novo equipamento
 */
async function createListing(listingData) {
  try {
    const {
      model, name, price, image, status, type, brand,
      description, location, is_premium, specs, seller
    } = listingData;
    
    // Gerar código automático
    const [maxIdResult] = await pool.query('SELECT MAX(id) as maxId FROM listings');
    const nextId = (maxIdResult[0].maxId || 0) + 1;
    const code = `LP-${String(nextId).padStart(3, '0')}`;
    
    const query = `
      INSERT INTO listings 
      (code, model, name, price, image, status, type, brand, description, location, is_premium, specs, seller)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.query(query, [
      code, model, name, price, image, status || 'Disponível',
      type, brand, description, location, is_premium || false,
      JSON.stringify(specs), JSON.stringify(seller)
    ]);
    
    return {
      success: true,
      id: result.insertId,
      code
    };
  } catch (error) {
    console.error('Erro ao criar equipamento:', error);
    throw error;
  }
}

/**
 * Exemplo 5: Atualizar status do equipamento
 */
async function updateListingStatus(id, status) {
  try {
    let query = 'UPDATE listings SET status = ?';
    const params = [status];
    
    if (status === 'Vendido') {
      query += ', sold_date = CURDATE()';
    } else {
      query += ', sold_date = NULL';
    }
    
    query += ' WHERE id = ?';
    params.push(id);
    
    const [result] = await pool.query(query, params);
    
    return {
      success: result.affectedRows > 0,
      message: result.affectedRows > 0 ? 'Status atualizado' : 'Equipamento não encontrado'
    };
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    throw error;
  }
}

/**
 * Exemplo 6: Buscar configurações de página
 */
async function getPageConfig(configKey) {
  try {
    const [rows] = await pool.query(
      'SELECT config_value FROM page_config WHERE config_key = ?',
      [configKey]
    );
    
    if (rows.length === 0) {
      return null;
    }
    
    return JSON.parse(rows[0].config_value);
  } catch (error) {
    console.error('Erro ao buscar configuração:', error);
    throw error;
  }
}

/**
 * Exemplo 7: Atualizar configurações de página
 */
async function updatePageConfig(configKey, configValue) {
  try {
    const query = `
      INSERT INTO page_config (config_key, config_value)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE config_value = ?
    `;
    
    const jsonValue = JSON.stringify(configValue);
    const [result] = await pool.query(query, [configKey, jsonValue, jsonValue]);
    
    return {
      success: true,
      message: 'Configuração atualizada'
    };
  } catch (error) {
    console.error('Erro ao atualizar configuração:', error);
    throw error;
  }
}

/**
 * Exemplo 8: Buscar depoimentos ativos
 */
async function getActiveTestimonials() {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM testimonials WHERE active = TRUE ORDER BY display_order ASC'
    );
    return rows;
  } catch (error) {
    console.error('Erro ao buscar depoimentos:', error);
    throw error;
  }
}

/**
 * Exemplo 9: Criar usuário
 */
async function createUser(userData) {
  try {
    const { nome, cpf, email, telefone, senha, role } = userData;
    
    // Verificar se usuário já existe
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ? OR cpf = ?',
      [email, cpf]
    );
    
    if (existing.length > 0) {
      return { success: false, message: 'Usuário já existe' };
    }
    
    // TODO: HASH DA SENHA (bcrypt) - NÃO USE TEXTO SIMPLES EM PRODUÇÃO!
    // const hashedPassword = await bcrypt.hash(senha, 10);
    
    const query = `
      INSERT INTO users (nome, cpf, email, telefone, senha, role, blocked)
      VALUES (?, ?, ?, ?, ?, ?, FALSE)
    `;
    
    const [result] = await pool.query(query, [
      nome, cpf, email, telefone, senha, role || 'Seller'
    ]);
    
    return {
      success: true,
      userId: result.insertId,
      message: 'Usuário criado com sucesso'
    };
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    throw error;
  }
}

/**
 * Exemplo 10: Deletar usuário
 */
async function deleteUser(userId) {
  try {
    const [result] = await pool.query(
      'DELETE FROM users WHERE id = ?',
      [userId]
    );
    
    return {
      success: result.affectedRows > 0,
      message: result.affectedRows > 0 ? 'Usuário deletado' : 'Usuário não encontrado'
    };
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    throw error;
  }
}

// ========================================
// EXEMPLO DE API EXPRESS
// ========================================

/**
 * Exemplo de servidor Express com rotas
 * Instalação: npm install express cors
 */

// Descomente para usar:
/*
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Rotas de usuários
app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body;
  const result = await loginUser(email, senha);
  res.json(result);
});

app.get('/api/users', async (req, res) => {
  const users = await getAllUsers();
  res.json(users);
});

app.post('/api/users', async (req, res) => {
  const result = await createUser(req.body);
  res.json(result);
});

app.delete('/api/users/:id', async (req, res) => {
  const result = await deleteUser(req.params.id);
  res.json(result);
});

// Rotas de equipamentos
app.get('/api/listings', async (req, res) => {
  const listings = await getListings(req.query);
  res.json(listings);
});

app.post('/api/listings', async (req, res) => {
  const result = await createListing(req.body);
  res.json(result);
});

app.patch('/api/listings/:id/status', async (req, res) => {
  const { status } = req.body;
  const result = await updateListingStatus(req.params.id, status);
  res.json(result);
});

// Rotas de configurações
app.get('/api/config/:key', async (req, res) => {
  const config = await getPageConfig(req.params.key);
  res.json(config);
});

app.put('/api/config/:key', async (req, res) => {
  const result = await updatePageConfig(req.params.key, req.body);
  res.json(result);
});

// Rotas de depoimentos
app.get('/api/testimonials', async (req, res) => {
  const testimonials = await getActiveTestimonials();
  res.json(testimonials);
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
*/

// ========================================
// TESTES
// ========================================

async function runTests() {
  console.log('🧪 Executando testes de conexão...\n');
  
  try {
    // Teste 1: Conexão
    console.log('✅ Teste 1: Conexão com banco de dados');
    await pool.query('SELECT 1');
    console.log('   Conexão estabelecida com sucesso!\n');
    
    // Teste 2: Buscar usuários
    console.log('✅ Teste 2: Buscar usuários');
    const users = await getAllUsers();
    console.log(`   Encontrados ${users.length} usuários\n`);
    
    // Teste 3: Login
    console.log('✅ Teste 3: Login de usuário');
    const loginResult = await loginUser('admin@example.com', 'teste');
    console.log('   Resultado:', loginResult.success ? 'Sucesso' : 'Falha');
    console.log('   Usuário:', loginResult.user?.nome || 'N/A\n');
    
    // Teste 4: Buscar equipamentos
    console.log('✅ Teste 4: Buscar equipamentos');
    const listings = await getListings({ status: 'Disponível' });
    console.log(`   Encontrados ${listings.length} equipamentos disponíveis\n`);
    
    // Teste 5: Buscar configuração
    console.log('✅ Teste 5: Buscar configuração de página');
    const heroConfig = await getPageConfig('hero');
    console.log('   Hero Title:', heroConfig?.title || 'N/A\n');
    
    console.log('🎉 Todos os testes passaram com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro nos testes:', error);
  } finally {
    await pool.end();
  }
}

// Descomente para executar testes:
// runTests();

// ========================================
// EXPORTAR FUNÇÕES
// ========================================

module.exports = {
  pool,
  getAllUsers,
  loginUser,
  getListings,
  createListing,
  updateListingStatus,
  getPageConfig,
  updatePageConfig,
  getActiveTestimonials,
  createUser,
  deleteUser
};
