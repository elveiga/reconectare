/**
 * ============================================
 * SERVIDOR EXPRESS COMPLETO - EXEMPLO
 * Pronto para copiar e adaptar
 * ============================================
 */

// ==========================================
// DEPENDÊNCIAS
// ==========================================
// npm install express mysql2 dotenv cors bcrypt jsonwebtoken helmet express-rate-limit validator

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const validator = require('validator');
require('dotenv').config();

const app = express();

// ==========================================
// MIDDLEWARES GLOBAIS
// ==========================================

app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting geral
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requisições por IP
  message: 'Muitas requisições. Tente novamente em 15 minutos.'
});
app.use(generalLimiter);

// Rate limiting para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
});

// ==========================================
// CONEXÃO COM BANCO DE DADOS
// ==========================================

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'reconectarehtml',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Testar conexão
pool.getConnection()
  .then(connection => {
    console.log('✅ Conectado ao banco de dados MySQL');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Erro ao conectar ao banco:', err);
    process.exit(1);
  });

// ==========================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ==========================================

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido ou expirado' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }
  next();
}

// ==========================================
// FUNÇÕES DE VALIDAÇÃO
// ==========================================

function validateEmail(email) {
  return validator.isEmail(email);
}

function validateCPF(cpf) {
  return /^\d{11}$/.test(cpf);
}

function validatePhone(phone) {
  return /^\d{10,13}$/.test(phone);
}

function sanitizeString(str) {
  return validator.escape(str || '');
}

// ==========================================
// ROTAS DE AUTENTICAÇÃO
// ==========================================

/**
 * POST /api/auth/login
 * Login de usuário
 */
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND blocked = FALSE',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user = rows[0];

    // TODO: Em produção, usar bcrypt.compare
    // const isValid = await bcrypt.compare(senha, user.senha);
    const isValid = senha === user.senha; // APENAS PARA HOMOLOGAÇÃO!

    if (!isValid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/auth/logout
 * Logout (no lado cliente, remover token)
 */
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  // JWT é stateless, então logout é feito no cliente
  res.json({ success: true, message: 'Logout realizado' });
});

// ==========================================
// ROTAS DE USUÁRIOS
// ==========================================

/**
 * GET /api/users
 * Listar todos os usuários (Admin)
 */
app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nome, cpf, email, telefone, role, blocked FROM users ORDER BY id'
    );
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

/**
 * POST /api/users
 * Criar novo usuário (Admin)
 */
app.post('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { nome, cpf, email, telefone, senha, role } = req.body;

    // Validações
    if (!nome || !cpf || !email || !telefone || !senha) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    if (!validateCPF(cpf)) {
      return res.status(400).json({ error: 'CPF inválido' });
    }

    if (!validatePhone(telefone)) {
      return res.status(400).json({ error: 'Telefone inválido' });
    }

    // Verificar se já existe
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ? OR cpf = ?',
      [email, cpf]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Usuário já existe' });
    }

    // TODO: Em produção, usar bcrypt.hash
    // const hashedPassword = await bcrypt.hash(senha, 10);
    const hashedPassword = senha; // APENAS PARA HOMOLOGAÇÃO!

    const [result] = await pool.query(
      'INSERT INTO users (nome, cpf, email, telefone, senha, role, blocked) VALUES (?, ?, ?, ?, ?, ?, FALSE)',
      [nome, cpf, email, telefone, hashedPassword, role || 'Seller']
    );

    res.status(201).json({
      success: true,
      userId: result.insertId,
      message: 'Usuário criado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

/**
 * PUT /api/users/:id
 * Atualizar usuário (Admin)
 */
app.put('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, cpf, email, telefone, role, blocked } = req.body;

    const [result] = await pool.query(
      'UPDATE users SET nome = ?, cpf = ?, email = ?, telefone = ?, role = ?, blocked = ? WHERE id = ?',
      [nome, cpf, email, telefone, role, blocked, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ success: true, message: 'Usuário atualizado' });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

/**
 * DELETE /api/users/:id
 * Deletar usuário (Admin)
 */
app.delete('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Não permitir deletar o próprio usuário
    if (parseInt(id) === req.user.userId) {
      return res.status(400).json({ error: 'Não é possível deletar seu próprio usuário' });
    }

    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ success: true, message: 'Usuário deletado' });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
});

// ==========================================
// ROTAS DE EQUIPAMENTOS
// ==========================================

/**
 * GET /api/listings
 * Listar equipamentos com filtros
 */
app.get('/api/listings', async (req, res) => {
  try {
    const { status, type, brand, isPremium, minPrice, maxPrice, search } = req.query;

    let query = 'SELECT * FROM listings WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    if (brand) {
      query += ' AND brand = ?';
      params.push(brand);
    }

    if (isPremium !== undefined) {
      query += ' AND is_premium = ?';
      params.push(isPremium === 'true' || isPremium === '1');
    }

    if (minPrice) {
      query += ' AND price >= ?';
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      query += ' AND price <= ?';
      params.push(parseFloat(maxPrice));
    }

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ? OR code LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(query, params);

    // Parse JSON fields
    const listings = rows.map(row => ({
      ...row,
      specs: JSON.parse(row.specs || '{}'),
      seller: JSON.parse(row.seller || '{}')
    }));

    res.json(listings);
  } catch (error) {
    console.error('Erro ao buscar equipamentos:', error);
    res.status(500).json({ error: 'Erro ao buscar equipamentos' });
  }
});

/**
 * GET /api/listings/:id
 * Buscar equipamento por ID
 */
app.get('/api/listings/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query('SELECT * FROM listings WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Equipamento não encontrado' });
    }

    const listing = {
      ...rows[0],
      specs: JSON.parse(rows[0].specs || '{}'),
      seller: JSON.parse(rows[0].seller || '{}')
    };

    res.json(listing);
  } catch (error) {
    console.error('Erro ao buscar equipamento:', error);
    res.status(500).json({ error: 'Erro ao buscar equipamento' });
  }
});

/**
 * POST /api/listings
 * Criar equipamento (requer autenticação)
 */
app.post('/api/listings', authenticateToken, async (req, res) => {
  try {
    const { model, name, price, image, status, type, brand, description, location, is_premium, specs, seller } = req.body;

    // Gerar código
    const [maxIdResult] = await pool.query('SELECT MAX(id) as maxId FROM listings');
    const nextId = (maxIdResult[0].maxId || 0) + 1;
    const code = `LP-${String(nextId).padStart(3, '0')}`;

    const [result] = await pool.query(
      `INSERT INTO listings (code, model, name, price, image, status, type, brand, description, location, is_premium, specs, seller)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code, model, name, price, image, status || 'Disponível',
        type, brand, description, location, is_premium || false,
        JSON.stringify(specs || {}), JSON.stringify(seller || {})
      ]
    );

    res.status(201).json({
      success: true,
      id: result.insertId,
      code,
      message: 'Equipamento criado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar equipamento:', error);
    res.status(500).json({ error: 'Erro ao criar equipamento' });
  }
});

/**
 * PUT /api/listings/:id
 * Atualizar equipamento (requer autenticação)
 */
app.put('/api/listings/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { model, name, price, image, status, type, brand, description, location, is_premium, specs, seller } = req.body;

    const [result] = await pool.query(
      `UPDATE listings SET model = ?, name = ?, price = ?, image = ?, status = ?, type = ?, brand = ?,
       description = ?, location = ?, is_premium = ?, specs = ?, seller = ? WHERE id = ?`,
      [
        model, name, price, image, status, type, brand, description, location, is_premium,
        JSON.stringify(specs || {}), JSON.stringify(seller || {}), id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Equipamento não encontrado' });
    }

    res.json({ success: true, message: 'Equipamento atualizado' });
  } catch (error) {
    console.error('Erro ao atualizar equipamento:', error);
    res.status(500).json({ error: 'Erro ao atualizar equipamento' });
  }
});

/**
 * DELETE /api/listings/:id
 * Deletar equipamento (Admin)
 */
app.delete('/api/listings/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query('DELETE FROM listings WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Equipamento não encontrado' });
    }

    res.json({ success: true, message: 'Equipamento deletado' });
  } catch (error) {
    console.error('Erro ao deletar equipamento:', error);
    res.status(500).json({ error: 'Erro ao deletar equipamento' });
  }
});

/**
 * PATCH /api/listings/:id/status
 * Atualizar status do equipamento
 */
app.patch('/api/listings/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Disponível', 'Reservado', 'Vendido'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

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

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Equipamento não encontrado' });
    }

    res.json({ success: true, message: 'Status atualizado' });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

// ==========================================
// ROTAS DE CONFIGURAÇÕES
// ==========================================

/**
 * GET /api/config/:key
 * Buscar configuração
 */
app.get('/api/config/:key', async (req, res) => {
  try {
    const { key } = req.params;

    const [rows] = await pool.query(
      'SELECT config_value FROM page_config WHERE config_key = ?',
      [key]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Configuração não encontrada' });
    }

    res.json(JSON.parse(rows[0].config_value));
  } catch (error) {
    console.error('Erro ao buscar configuração:', error);
    res.status(500).json({ error: 'Erro ao buscar configuração' });
  }
});

/**
 * PUT /api/config/:key
 * Atualizar configuração (Admin)
 */
app.put('/api/config/:key', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const configValue = req.body;

    const jsonValue = JSON.stringify(configValue);

    await pool.query(
      'INSERT INTO page_config (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = ?',
      [key, jsonValue, jsonValue]
    );

    res.json({ success: true, message: 'Configuração atualizada' });
  } catch (error) {
    console.error('Erro ao atualizar configuração:', error);
    res.status(500).json({ error: 'Erro ao atualizar configuração' });
  }
});

// ==========================================
// ROTAS DE MARCAS E TIPOS
// ==========================================

/**
 * GET /api/brands
 * Listar marcas
 */
app.get('/api/brands', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM brands ORDER BY name');
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar marcas:', error);
    res.status(500).json({ error: 'Erro ao buscar marcas' });
  }
});

/**
 * GET /api/equipment-types
 * Listar tipos de equipamentos
 */
app.get('/api/equipment-types', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM equipment_types ORDER BY name');
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar tipos:', error);
    res.status(500).json({ error: 'Erro ao buscar tipos' });
  }
});

// ==========================================
// ROTAS DE DEPOIMENTOS
// ==========================================

/**
 * GET /api/testimonials
 * Listar depoimentos ativos
 */
app.get('/api/testimonials', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM testimonials WHERE active = TRUE ORDER BY display_order ASC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar depoimentos:', error);
    res.status(500).json({ error: 'Erro ao buscar depoimentos' });
  }
});

// ==========================================
// ROTA DE SAÚDE
// ==========================================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==========================================
// TRATAMENTO DE ERROS 404
// ==========================================

app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📍 API: http://localhost:${PORT}/api`);
  console.log(`❤️  Health: http://localhost:${PORT}/health\n`);
});
