import bcrypt from 'bcryptjs';
import { ensureDatabaseExists, query, queryOne } from '../src/lib/database.js';
import { getEnvString } from '../src/lib/env.js';

const DEFAULT_ADMIN_EMAIL = getEnvString('DEFAULT_ADMIN_EMAIL', 'admin@reconectare.com.br');
const DEFAULT_ADMIN_PASSWORD = getEnvString('DEFAULT_ADMIN_PASSWORD', '');
const DEFAULT_ADMIN_NAME = getEnvString('DEFAULT_ADMIN_NAME', 'Administrador Reconectare');
const DEFAULT_ADMIN_PHONE = getEnvString('DEFAULT_ADMIN_PHONE', '5511999999999');
const DEFAULT_ADMIN_CPF = getEnvString('DEFAULT_ADMIN_CPF', '99999999999');

const TABLES_SQL = [
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(11) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefone VARCHAR(20) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Seller', 'Lojista') NOT NULL DEFAULT 'Seller',
    blocked BOOLEAN NOT NULL DEFAULT FALSE,
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_blocked (blocked)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS brands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS equipment_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS listings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    model VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    image TEXT,
    status ENUM('Pendente', 'Disponível', 'Reservado', 'Vendido', 'Recusado') NOT NULL DEFAULT 'Pendente',
    type VARCHAR(255) NOT NULL,
    brand VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    is_premium BOOLEAN NOT NULL DEFAULT FALSE,
    sold_date DATE NULL,
    specs JSON,
    seller JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_status (status),
    INDEX idx_status_created_at (status, created_at),
    INDEX idx_type (type),
    INDEX idx_brand (brand),
    INDEX idx_is_premium (is_premium),
    INDEX idx_sold_date (sold_date)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS page_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value JSON NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_config_key (config_key)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS testimonials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255),
    image TEXT,
    quote TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_display_order (display_order),
    INDEX idx_active (active)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS banners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    position VARCHAR(100) NOT NULL,
    width INT NOT NULL,
    height INT NOT NULL,
    image_url TEXT,
    link_url TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_position (position),
    INDEX idx_active (active),
    INDEX idx_display_order (display_order)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS terms_sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_display_order (display_order)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS privacy_sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_display_order (display_order)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS footer_social_icons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    image TEXT,
    link TEXT,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_display_order (display_order)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS brand_section_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brand_name VARCHAR(255) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_display_order (display_order)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS ad_banners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    banner_key VARCHAR(50) NOT NULL UNIQUE,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    layout INT NOT NULL DEFAULT 1,
    auto_rotate BOOLEAN NOT NULL DEFAULT FALSE,
    rotate_interval INT NOT NULL DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_banner_key (banner_key),
    INDEX idx_enabled (enabled)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS ad_banner_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ad_banner_id INT NOT NULL,
    slot_number INT NOT NULL,
    media_url TEXT,
    link_url TEXT,
    media_type ENUM('image', 'video') NOT NULL DEFAULT 'image',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ad_banner_id) REFERENCES ad_banners(id) ON DELETE CASCADE,
    INDEX idx_ad_banner_id (ad_banner_id),
    INDEX idx_slot_number (slot_number)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS recommended_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_type ENUM('asc', 'desc') NOT NULL DEFAULT 'desc',
    selected_codes JSON,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS login_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    email VARCHAR(255),
    attempt_count INT DEFAULT 0,
    locked_until DATETIME,
    last_attempt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    KEY idx_ip_address (ip_address),
    KEY idx_email (email),
    KEY idx_locked_until (locked_until),
    KEY idx_last_attempt (last_attempt),
    UNIQUE KEY unique_ip_email (ip_address, email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
];

const canIgnoreBootstrapError = (error) => {
  const code = String(error?.code || '');
  return [
    'ER_TABLEACCESS_DENIED_ERROR',
    'ER_DBACCESS_DENIED_ERROR',
    'ER_SPECIFIC_ACCESS_DENIED_ERROR',
    'ER_ACCESS_DENIED_ERROR'
  ].includes(code);
};

const runBootstrapStep = async (label, action) => {
  try {
    await action();
    return { success: true };
  } catch (error) {
    if (canIgnoreBootstrapError(error)) {
      console.warn(`[bootstrap] Permissão insuficiente em ${label}. Seguindo sem interromper a API.`);
      return { success: false, skipped: true };
    }
    throw error;
  }
};

const DEFAULT_BRANDS = [
  '3Shape', 'iTero', 'DEXIS', 'Carestream', 'Dentsply Sirona',
  'Vatech', 'Kavo', 'Dabi Atlante', 'Medit', 'Planmeca', 'Outros'
];

const DEFAULT_TYPES = [
  'Cadeira odontológica', 'Autoclave', 'Compressor', 'Fotopolimerizador',
  'Scanner intraoral', 'Tomógrafo / RX', 'Fresadora CAD/CAM',
  'Impressora 3D odontológica', 'Ultrassom / Jato de bicarbonato',
  'Equipo odontológico', 'Refletor', 'Sugador', 'Scanner de laboratório',
  'Nobreak / Estabilizador', 'Outros'
];

const DEFAULT_CONFIGS = [
  ['hero', { title: 'Reconectare', subtitle: 'Marketplace de equipamentos odontológicos' }],
  ['about', { title: 'Sobre a Reconectare', paragraphs: [] }],
  ['contact', { title: 'Contato', email: 'contato@reconectare.com.br', whatsappNumber: '5511999999999', displayPhone: '(11) 99999-9999' }],
  ['advertise_whatsapp', { buttonText: 'Divulgar agora', whatsappNumber: '5511999999999' }],
  ['post_equipment_whatsapp', { buttonText: 'Enviar para Análise', whatsappNumber: '5511999999999' }],
  ['testimonials_header', { title: 'O que nossos clientes dizem?', subtitle: '' }],
  ['terms_intro', { title: 'Termos de Uso', intro: '' }],
  ['privacy_intro', { title: 'Política de Privacidade', intro: '', lastUpdate: '' }],
  ['footer', { description: '' }],
  ['brand_section', { title: 'Marcas', subtitle: '' }],
  ['recommended', { order: 'desc', selectedCodes: [] }]
];

const DEFAULT_BANNERS = [
  { name: 'Banner 1', position: 'Topo Home', width: 1200, height: 280, display_order: 1 },
  { name: 'Banner 2', position: 'Meio Home', width: 1200, height: 280, display_order: 2 },
  { name: 'Banner 3', position: 'Fim Home', width: 1200, height: 280, display_order: 3 },
  { name: 'Banner 4', position: 'Topo Listagem', width: 1200, height: 200, display_order: 4 },
  { name: 'Banner 5', position: 'Rodapé', width: 1200, height: 200, display_order: 5 }
];

const ensureMustChangePasswordColumn = async () => {
  const existing = await queryOne(
    `SELECT COUNT(1) AS total
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'users'
       AND COLUMN_NAME = 'must_change_password'`
  );

  if (!Number(existing?.total || 0)) {
    await query('ALTER TABLE users ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT FALSE AFTER blocked');
  }
};

const seedReferenceData = async () => {
  for (const brand of DEFAULT_BRANDS) {
    await query('INSERT IGNORE INTO brands (name) VALUES (?)', [brand]);
  }

  for (const type of DEFAULT_TYPES) {
    await query('INSERT IGNORE INTO equipment_types (name) VALUES (?)', [type]);
  }

  for (const [key, value] of DEFAULT_CONFIGS) {
    await query(
      `INSERT INTO page_config (config_key, config_value)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)`,
      [key, JSON.stringify(value)]
    );
  }

  for (const item of DEFAULT_BANNERS) {
    await query(
      `INSERT INTO banners (name, position, width, height, image_url, link_url, active, display_order)
       SELECT ?, ?, ?, ?, '', '', FALSE, ?
       FROM DUAL
       WHERE NOT EXISTS (
         SELECT 1 FROM banners WHERE display_order = ?
       )`,
      [item.name, item.position, item.width, item.height, item.display_order, item.display_order]
    );
  }

  await query(
    `INSERT INTO recommended_config (order_type, selected_codes)
     SELECT 'desc', JSON_ARRAY()
     FROM DUAL
     WHERE NOT EXISTS (SELECT 1 FROM recommended_config)`
  );
};

const ensureDefaultAdminUser = async () => {
  const safeEmail = String(DEFAULT_ADMIN_EMAIL || '').trim().toLowerCase();
  const safePassword = String(DEFAULT_ADMIN_PASSWORD || '').trim();
  if (!safeEmail) return;

  if (!safePassword) {
    console.warn('DEFAULT_ADMIN_PASSWORD nao definido. Criacao automatica de admin padrao foi ignorada.');
    return;
  }

  const existingByEmail = await queryOne('SELECT id FROM users WHERE email = ?', [safeEmail]);
  if (existingByEmail) return;

  const passwordHash = await bcrypt.hash(safePassword, 10);
  const hasMustChangePassword = Number((await queryOne(
    `SELECT COUNT(1) AS total
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'users'
       AND COLUMN_NAME = 'must_change_password'`
  ))?.total || 0) > 0;

  if (hasMustChangePassword) {
    await query(
      `INSERT INTO users (nome, cpf, email, telefone, senha, role, blocked, must_change_password)
       VALUES (?, ?, ?, ?, ?, 'Admin', FALSE, TRUE)`,
      [DEFAULT_ADMIN_NAME, String(DEFAULT_ADMIN_CPF).replace(/\D/g, '').slice(0, 11), safeEmail, String(DEFAULT_ADMIN_PHONE).replace(/\D/g, ''), passwordHash]
    );
  } else {
    await query(
      `INSERT INTO users (nome, cpf, email, telefone, senha, role, blocked)
       VALUES (?, ?, ?, ?, ?, 'Admin', FALSE)`,
      [DEFAULT_ADMIN_NAME, String(DEFAULT_ADMIN_CPF).replace(/\D/g, '').slice(0, 11), safeEmail, String(DEFAULT_ADMIN_PHONE).replace(/\D/g, ''), passwordHash]
    );
  }

  console.log(hasMustChangePassword
    ? 'Admin padrão criado com troca obrigatória de senha no primeiro login.'
    : 'Admin padrão criado (coluna de troca obrigatória ausente neste banco).');
};

export const ensureDatabaseBootstrap = async () => {
  await runBootstrapStep('ensure-database-exists', ensureDatabaseExists);

  for (const [index, statement] of TABLES_SQL.entries()) {
    await runBootstrapStep(`create-table-${index + 1}`, async () => {
      await query(statement);
    });
  }

  await runBootstrapStep('ensure-must-change-password-column', ensureMustChangePasswordColumn);
  await runBootstrapStep('seed-reference-data', seedReferenceData);
  await runBootstrapStep('ensure-default-admin-user', ensureDefaultAdminUser);
};
