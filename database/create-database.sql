-- ==========================================
-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS
-- Nome: reconectarehtml
-- Descrição: Migração completa de dados de contextos para SQL
-- Data: 09/03/2026
-- Ambiente: Homologação
-- ==========================================

-- Criar banco de dados se não existir
CREATE DATABASE IF NOT EXISTS reconectarehtml
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE reconectarehtml;

-- ==========================================
-- TABELA: users
-- Descrição: Gerenciamento de usuários do sistema
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  cpf VARCHAR(11) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  telefone VARCHAR(20) NOT NULL,
  senha VARCHAR(255) NOT NULL,
  role ENUM('Admin', 'Seller', 'Lojista') NOT NULL DEFAULT 'Seller',
  blocked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_blocked (blocked)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABELA: brands
-- Descrição: Marcas de equipamentos
-- ==========================================
CREATE TABLE IF NOT EXISTS brands (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABELA: equipment_types
-- Descrição: Tipos de equipamentos odontológicos
-- ==========================================
CREATE TABLE IF NOT EXISTS equipment_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABELA: listings
-- Descrição: Anúncios de equipamentos
-- ==========================================
CREATE TABLE IF NOT EXISTS listings (
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
  -- Especificações (specs) armazenadas como JSON
  specs JSON,
  -- Dados do vendedor (seller) armazenados como JSON
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABELA: page_config
-- Descrição: Configurações editáveis de páginas
-- ==========================================
CREATE TABLE IF NOT EXISTS page_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  config_key VARCHAR(100) NOT NULL UNIQUE,
  config_value JSON NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABELA: testimonials
-- Descrição: Depoimentos de clientes
-- ==========================================
CREATE TABLE IF NOT EXISTS testimonials (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABELA: banners
-- Descrição: Banners publicitários da página inicial
-- ==========================================
CREATE TABLE IF NOT EXISTS banners (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABELA: terms_sections
-- Descrição: Seções dos Termos de Uso
-- ==========================================
CREATE TABLE IF NOT EXISTS terms_sections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABELA: privacy_sections
-- Descrição: Seções da Política de Privacidade
-- ==========================================
CREATE TABLE IF NOT EXISTS privacy_sections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABELA: footer_social_icons
-- Descrição: Ícones sociais do rodapé
-- ==========================================
CREATE TABLE IF NOT EXISTS footer_social_icons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  image TEXT,
  link TEXT,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABELA: brand_section_options
-- Descrição: Opções da seção de marcas na página inicial
-- ==========================================
CREATE TABLE IF NOT EXISTS brand_section_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  brand_name VARCHAR(255) NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABELA: ad_banners
-- Descrição: Sistema de banners de anúncios (AdBannerSystem)
-- ==========================================
CREATE TABLE IF NOT EXISTS ad_banners (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABELA: ad_banner_slots
-- Descrição: Slots individuais de cada banner de anúncio
-- ==========================================
CREATE TABLE IF NOT EXISTS ad_banner_slots (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TABELA: recommended_config
-- Descrição: Configuração de produtos recomendados
-- ==========================================
CREATE TABLE IF NOT EXISTS recommended_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_type ENUM('asc', 'desc') NOT NULL DEFAULT 'desc',
  selected_codes JSON,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- INSERÇÃO DE DADOS DE HOMOLOGAÇÃO
-- ==========================================

-- Usuários de teste
INSERT INTO users (id, nome, cpf, email, telefone, senha, role, blocked) VALUES
(1, 'Admin Teste', '00000000000', 'admin@example.com', '5511999999999', '$2b$10$uUXPvZ3FfB67uDERxRUjrODAUtXkA99X7MJl74KXVdCFN5xIlS/b2', 'Admin', FALSE),
(2, 'Vendedor Teste', '11111111111', 'vendedor@example.com', '5511988888888', '$2b$10$uUXPvZ3FfB67uDERxRUjrODAUtXkA99X7MJl74KXVdCFN5xIlS/b2', 'Seller', FALSE);

-- Marcas
INSERT INTO brands (name) VALUES
('3Shape'),
('iTero'),
('DEXIS'),
('Carestream'),
('Dentsply Sirona'),
('Vatech'),
('Kavo'),
('Dabi Atlante'),
('Medit'),
('Planmeca'),
('Outros');

-- Tipos de equipamentos
INSERT INTO equipment_types (name) VALUES
('Cadeira odontológica'),
('Autoclave'),
('Compressor'),
('Fotopolimerizador'),
('Scanner intraoral'),
('Tomógrafo / RX'),
('Fresadora CAD/CAM'),
('Impressora 3D odontológica'),
('Ultrassom / Jato de bicarbonato'),
('Equipo odontológico'),
('Refletor'),
('Sugador'),
('Scanner de laboratório'),
('Nobreak / Estabilizador'),
('Outros');

-- Listings (Equipamentos)
INSERT INTO listings (id, code, model, name, price, image, status, type, brand, description, location, is_premium, sold_date, specs, seller) VALUES
(1, 'LP-001', 'G3', 'Cadeira Odontológica Gnatus G3', 12500.00, 'https://images.unsplash.com/photo-1677276048965-817179b48fc7', 'Disponível', 'Cadeira odontológica', 'Outros', 
 'Cadeira odontológica completa, estado excelente. Revisada e com garantia. Inclui mocho e refletor LED.', 'São Paulo - SP', TRUE, NULL,
 '{"Marca": "Gnatus", "Modelo": "G3", "Ano": "2020", "Condição": "Excelente", "Voltagem": "220V"}',
 '{"name": "Dr. Carlos Silva", "whatsapp": "5511999999999", "email": "carlos@example.com"}'),

(2, 'LP-002', 'MSV 6/30', 'Compressor Odontológico Schulz MSV 6/30', 3500.00, 'https://images.unsplash.com/photo-1629909613638-0e4a1fad8f81', 'Disponível', 'Compressor', 'Outros', 
 'Compressor silencioso, baixo consumo de energia. Ideal para consultórios.', 'Rio de Janeiro - RJ', TRUE, NULL,
 '{"Marca": "Schulz", "Modelo": "MSV 6/30", "Ano": "2019", "Condição": "Bom", "Capacidade": "30 litros"}',
 '{"name": "Dra. Ana Santos", "whatsapp": "5521988888888", "email": "ana@example.com"}'),

(3, 'LP-003', 'Vitale 21L', 'Autoclave Cristófoli 21L', 4200.00, 'https://images.unsplash.com/photo-1643660527076-726d42bb1a06', 'Reservado', 'Autoclave', 'Outros', 
 'Autoclave digital com ciclos programáveis. Manutenção em dia.', 'Belo Horizonte - MG', FALSE, NULL,
 '{"Marca": "Cristófoli", "Modelo": "Vitale 21L", "Ano": "2021", "Condição": "Excelente", "Capacidade": "21 litros"}',
 '{"name": "Clínica Odonto+", "whatsapp": "5531977777777", "email": "contato@odontoplus.com"}'),

(4, 'LP-004', 'LED-B', 'Fotopolimerizador LED Woodpecker', 850.00, 'https://images.unsplash.com/photo-1643660527070-03ed14b41677', 'Vendido', 'Fotopolimerizador', 'Outros', 
 'Fotopolimerizador de alta potência, bateria de longa duração.', 'Curitiba - PR', FALSE, '2026-01-15',
 '{"Marca": "Woodpecker", "Modelo": "LED-B", "Ano": "2020", "Condição": "Bom", "Potência": "1200 mW/cm²"}',
 '{"name": "Dr. Paulo Lima", "whatsapp": "5541966666666", "email": "paulo@example.com"}'),

(5, 'LP-005', 'Mega Jet', 'Sugador Odontológico Dabi Atlante', 2800.00, 'https://images.unsplash.com/photo-1643660527090-bea721ad71f8', 'Disponível', 'Sugador', 'Dabi Atlante', 
 'Sugador de alta potência, silencioso e eficiente. Revisado recentemente.', 'Porto Alegre - RS', TRUE, NULL,
 '{"Marca": "Dabi Atlante", "Modelo": "Mega Jet", "Ano": "2019", "Condição": "Excelente", "Potência": "1HP"}',
 '{"name": "Dra. Mariana Costa", "whatsapp": "5551955555555", "email": "mariana@example.com"}'),

(6, 'LP-006', 'Unik', 'Cadeira Odontológica Saevo Unik', 15800.00, 'https://images.unsplash.com/photo-1629909615957-be38d48fbbe6', 'Disponível', 'Cadeira odontológica', 'Outros', 
 'Cadeira top de linha com todos os acessórios. Menos de 2 anos de uso.', 'Brasília - DF', TRUE, NULL,
 '{"Marca": "Saevo", "Modelo": "Unik", "Ano": "2024", "Condição": "Excelente", "Voltagem": "220V"}',
 '{"name": "Dr. Roberto Alves", "whatsapp": "5561944444444", "email": "roberto@example.com"}'),

(7, 'LP-007', 'Extra 12L', 'Autoclave Stermax Extra', 3200.00, 'https://images.unsplash.com/photo-1643660527076-726d42bb1a06', 'Vendido', 'Autoclave', 'Outros', 
 'Autoclave 12 litros, pouco uso, em perfeito estado.', 'Fortaleza - CE', FALSE, '2026-01-12',
 '{"Marca": "Stermax", "Modelo": "Extra 12L", "Ano": "2022", "Condição": "Excelente", "Capacidade": "12 litros"}',
 '{"name": "Clínica Sorriso", "whatsapp": "5585933333333", "email": "contato@sorriso.com"}'),

(8, 'LP-008', 'Jet 30', 'Compressor Jet Fiac 30L', 4100.00, 'https://images.unsplash.com/photo-1629909613638-0e4a1fad8f81', 'Disponível', 'Compressor', 'Outros', 
 'Compressor profissional, super silencioso, ideal para clínicas.', 'Salvador - BA', FALSE, NULL,
 '{"Marca": "Fiac", "Modelo": "Jet 30", "Ano": "2021", "Condição": "Excelente", "Capacidade": "30 litros"}',
 '{"name": "Dr. Fernando Souza", "whatsapp": "5571922222222", "email": "fernando@example.com"}'),

(9, 'LP-009', 'VALO', 'Fotopolimerizador Ultradent VALO', 1850.00, 'https://images.unsplash.com/photo-1643660527070-03ed14b41677', 'Vendido', 'Fotopolimerizador', 'Outros', 
 'Fotopolimerizador profissional de alta performance.', 'Recife - PE', FALSE, '2026-01-10',
 '{"Marca": "Ultradent", "Modelo": "VALO", "Ano": "2021", "Condição": "Excelente", "Potência": "1400 mW/cm²"}',
 '{"name": "Dra. Juliana Rocha", "whatsapp": "5581911111111", "email": "juliana@example.com"}'),

(10, 'LP-010', 'Estetica E30', 'Cadeira Odontológica Kavo Estetica E30', 18500.00, 'https://images.unsplash.com/photo-1677276048965-817179b48fc7', 'Disponível', 'Cadeira odontológica', 'Kavo', 
 'Cadeira premium com tecnologia alemã. Estado de novo.', 'São Paulo - SP', TRUE, NULL,
 '{"Marca": "Kavo", "Modelo": "Estetica E30", "Ano": "2023", "Condição": "Excelente", "Voltagem": "220V"}',
 '{"name": "Dr. Alexandre Mendes", "whatsapp": "5511900000000", "email": "alexandre@example.com"}'),

(11, 'LP-011', 'TRIOS 3 Pod', 'Scanner Intraoral 3Shape TRIOS 3', 45000.00, 'https://images.unsplash.com/photo-1588776813677-77aa57e4352f?w=800&q=80', 'Disponível', 'Scanner intraoral', '3Shape', 
 'Scanner intraoral de alta precisão, inclui laptop e software.', 'Florianópolis - SC', TRUE, NULL,
 '{"Marca": "3Shape", "Modelo": "TRIOS 3 Pod", "Ano": "2022", "Condição": "Excelente"}',
 '{"name": "Dr. Pedro Martins", "whatsapp": "5548999999999", "email": "pedro@example.com"}'),

(12, 'LP-012', 'i700', 'Scanner Intraoral Medit i700', 38500.00, 'https://images.unsplash.com/photo-1588776813677-77aa57e4352f?w=800&q=80', 'Disponível', 'Scanner intraoral', 'Medit', 
 'Scanner rápido e preciso para fluxo digital.', 'Campinas - SP', FALSE, NULL,
 '{"Marca": "Medit", "Modelo": "i700", "Ano": "2023", "Condição": "Excelente"}',
 '{"name": "Clínica Digital Odonto", "whatsapp": "5511988887777", "email": "contato@digitalodonto.com"}'),

(13, 'LP-013', 'Element 5D', 'Scanner Intraoral iTero Element 5D', 52000.00, 'https://images.unsplash.com/photo-1588776813677-77aa57e4352f?w=800&q=80', 'Reservado', 'Scanner intraoral', 'iTero', 
 'Scanner com tecnologia NIRI e alta precisão.', 'Rio de Janeiro - RJ', TRUE, NULL,
 '{"Marca": "iTero", "Modelo": "Element 5D", "Ano": "2023", "Condição": "Excelente"}',
 '{"name": "Dr. Felipe Araujo", "whatsapp": "5521999991111", "email": "felipe@odontodigital.com"}'),

(14, 'LP-014', 'Pax-i', 'Tomógrafo Vatech Pax-i', 98000.00, 'https://images.unsplash.com/photo-1580281657521-6c1b56f47d35?w=800&q=80', 'Disponível', 'Tomógrafo / RX', 'Vatech', 
 'Tomógrafo odontológico com alta definição.', 'São Paulo - SP', TRUE, NULL,
 '{"Marca": "Vatech", "Modelo": "Pax-i", "Ano": "2022", "Condição": "Excelente"}',
 '{"name": "Clínica Radiológica Max", "whatsapp": "5511977776666", "email": "contato@radiomax.com"}'),

(15, 'LP-015', 'PlanMill 40', 'Fresadora CAD/CAM Planmeca PlanMill 40', 76000.00, 'https://images.unsplash.com/photo-1581091215367-59ab6f6d9b6b?w=800&q=80', 'Disponível', 'Fresadora CAD/CAM', 'Planmeca', 
 'Fresadora para próteses CAD/CAM de alta precisão.', 'Ribeirão Preto - SP', TRUE, NULL,
 '{"Marca": "Planmeca", "Modelo": "PlanMill 40", "Ano": "2021", "Condição": "Excelente"}',
 '{"name": "Laboratório Digital Pro", "whatsapp": "5516999998888", "email": "contato@labdigitalpro.com"}'),

(16, 'LP-016', 'Cavitron Select', 'Ultrassom Dentsply Cavitron Select', 6200.00, 'https://images.unsplash.com/photo-1588776813677-77aa57e4352f?w=800&q=80', 'Disponível', 'Ultrassom / Jato de bicarbonato', 'Dentsply Sirona', 
 'Ultrassom odontológico para profilaxia.', 'Santos - SP', FALSE, NULL,
 '{"Marca": "Dentsply Sirona", "Modelo": "Cavitron Select", "Ano": "2020", "Condição": "Excelente"}',
 '{"name": "Dra. Helena Ramos", "whatsapp": "551399998888", "email": "helena@odontocare.com"}'),

(17, 'LP-017', 'Form 3B', 'Impressora 3D Odontológica Formlabs Form 3B', 42000.00, 'https://images.unsplash.com/photo-1581091012184-5c8c5f1f1f12?w=800&q=80', 'Disponível', 'Impressora 3D odontológica', 'Outros', 
 'Impressora 3D para aplicações odontológicas.', 'São José dos Campos - SP', TRUE, NULL,
 '{"Marca": "Formlabs", "Modelo": "Form 3B", "Ano": "2022", "Condição": "Excelente"}',
 '{"name": "Lab Odonto 3D", "whatsapp": "5512988887777", "email": "contato@labodonto3d.com"}'),

(18, 'LP-018', 'DXR-500', 'Scanner de Laboratório DEXIS DXR-500', 29000.00, 'https://images.unsplash.com/photo-1677276048965-817179b48fc7', 'Disponível', 'Scanner de laboratório', 'DEXIS', 
 'Scanner de bancada para laboratórios odontológicos.', 'Curitiba - PR', FALSE, NULL,
 '{"Marca": "DEXIS", "Modelo": "DXR-500", "Ano": "2021", "Condição": "Excelente"}',
 '{"name": "Lab Dental Tech", "whatsapp": "5541999992222", "email": "contato@labdentaltech.com"}'),

(19, 'LP-019', 'BioVac', 'Sugador Odontológico BioVac', 2600.00, 'https://images.unsplash.com/photo-1643660527090-bea721ad71f8', 'Disponível', 'Sugador', 'Outros', 
 'Sugador odontológico compacto e eficiente.', 'Goiânia - GO', FALSE, NULL,
 '{"Marca": "BioVac", "Modelo": "BioVac", "Ano": "2020", "Condição": "Bom"}',
 '{"name": "Dr. Lucas Teixeira", "whatsapp": "5562999987777", "email": "lucas@odontogo.com"}'),

(20, 'LP-020', 'Silent Pro', 'Compressor Odontológico Silent Pro', 5200.00, 'https://images.unsplash.com/photo-1629909613638-0e4a1fad8f81', 'Disponível', 'Compressor', 'Outros', 
 'Compressor ultra silencioso para clínicas premium.', 'Sorocaba - SP', TRUE, NULL,
 '{"Marca": "Silent Pro", "Modelo": "Silent Pro", "Ano": "2022", "Condição": "Excelente"}',
 '{"name": "Clínica Prime Dental", "whatsapp": "5515999986666", "email": "contato@primedental.com"}'),

(21, 'LP-021', 'LED X', 'Fotopolimerizador Dabi Atlante LED X', 1200.00, 'https://images.unsplash.com/photo-1643660527070-03ed14b41677', 'Disponível', 'Fotopolimerizador', 'Dabi Atlante', 
 'Fotopolimerizador com alta intensidade luminosa.', 'Araraquara - SP', FALSE, NULL,
 '{"Marca": "Dabi Atlante", "Modelo": "LED X", "Ano": "2021", "Condição": "Excelente"}',
 '{"name": "Dra. Renata Lopes", "whatsapp": "5516999985555", "email": "renata@odontosp.com"}'),

(22, 'LP-022', 'Carestream CS 9600', 'Tomógrafo Carestream CS 9600', 115000.00, 'https://images.unsplash.com/photo-1677276048965-817179b48fc7', 'Disponível', 'Tomógrafo / RX', 'Carestream', 
 'Tomógrafo 3D de alta resolução.', 'São Paulo - SP', TRUE, NULL,
 '{"Marca": "Carestream", "Modelo": "CS 9600", "Ano": "2023", "Condição": "Excelente"}',
 '{"name": "Centro Radiológico Avançado", "whatsapp": "5511977774444", "email": "contato@radiocenter.com"}'),

(23, 'LP-023', 'N1', 'Nobreak Odontológico NHS N1', 1800.00, 'https://images.unsplash.com/photo-1677276048965-817179b48fc7', 'Disponível', 'Nobreak / Estabilizador', 'Outros', 
 'Nobreak para proteção de equipamentos odontológicos.', 'Uberlândia - MG', FALSE, NULL,
 '{"Marca": "NHS", "Modelo": "N1", "Ano": "2021", "Condição": "Excelente"}',
 '{"name": "Dr. André Farias", "whatsapp": "5534999987777", "email": "andre@odontomg.com"}'),

(24, 'LP-024', 'LED Vision', 'Refletor Odontológico LED Vision', 2400.00, 'https://images.unsplash.com/photo-1677276048965-817179b48fc7', 'Disponível', 'Refletor', 'Outros', 
 'Refletor LED com iluminação branca e fria.', 'Joinville - SC', FALSE, NULL,
 '{"Marca": "Vision", "Modelo": "LED Vision", "Ano": "2022", "Condição": "Excelente"}',
 '{"name": "Clínica Sorriso Mais", "whatsapp": "5547999986666", "email": "contato@sorrisomais.com"}'),

(25, 'LP-025', 'Equipo Plus', 'Equipo Odontológico Equipo Plus', 7200.00, 'https://images.unsplash.com/photo-1677276048965-817179b48fc7', 'Disponível', 'Equipo odontológico', 'Outros', 
 'Equipo odontológico completo com sistema de sucção.', 'Maringá - PR', FALSE, NULL,
 '{"Marca": "Equipo Plus", "Modelo": "Equipo Plus", "Ano": "2021", "Condição": "Excelente"}',
 '{"name": "Dr. Thiago Moreira", "whatsapp": "5544999985555", "email": "thiago@odontopr.com"}');

-- Configurações de páginas (page_config)
INSERT INTO page_config (config_key, config_value, description) VALUES
('hero', 
 '{"title": "Equipamentos com Curadoria Profissional", "subtitle": "Compre e venda equipamentos odontológicos com segurança e transparência.", "backgroundImage": "https://images.unsplash.com/photo-1629909615957-be38d48fbbe6"}',
 'Configuração do Hero da página inicial'),

('about', 
 '{"title": "Sobre", "paragraphs": ["A Reconectare conecta profissionais e clínicas com equipamentos odontológicos usados, revisados e com curadoria especializada. Nosso objetivo é facilitar a renovação de consultórios oferecendo transparência, garantia técnica e atendimento dedicado para compradores e vendedores.", "Trabalhamos com uma seleção criteriosa de anúncios, avaliações de condição e suporte durante todo o processo de negociação. Valorizamos confiança, segurança e eficiência para que você faça bons negócios com tranquilidade."]}',
 'Configuração da página Sobre'),

('contact', 
 '{"title": "Contato", "email": "contato@reconectare.com.br", "whatsappNumber": "551144444444", "displayPhone": "(11) 4444-4444"}',
 'Configuração da página Contato'),

('terms_intro', 
 '{"title": "Termos de Uso", "intro": "Bem-vindo à Reconectare. Ao utilizar este site e os serviços oferecidos, você concorda com estes Termos de Uso. Leia-os atentamente antes de prosseguir."}',
 'Introdução dos Termos de Uso'),

('privacy_intro', 
 '{"title": "Política de Privacidade", "intro": "A sua privacidade é importante para nós. Esta política descreve como coletamos, usamos, armazenamos e protegemos os seus dados pessoais em conformidade com a legislação brasileira, incluindo a Lei Geral de Proteção de Dados (LGPD).", "lastUpdate": "25/02/2026"}',
 'Introdução da Política de Privacidade'),

('brand_section', 
 '{"title": "Busque por marcas", "subtitle": "Encontre equipamentos dos principais fabricantes do mercado.", "options": []}',
 'Configuração da seção de marcas'),

('footer', 
 '{"description": "Anúncios de equipamentos Odontológicos com curadoria profissional."}',
 'Configuração do rodapé'),

('advertise_whatsapp', 
 '{"buttonText": "Falar com consultor sobre planos", "whatsappNumber": "5511953821255"}',
 'Configuração do botão WhatsApp da página Anunciar'),

('post_equipment_whatsapp', 
 '{"buttonText": "Enviar para Análise", "whatsappNumber": "5511953821255"}',
 'Configuração do botão WhatsApp da página Anunciar Equipamento'),

('testimonials_header', 
 '{"title": "O que nossos clientes dizem?", "subtitle": "Depoimentos de dentistas e clínicas que confiam na Reconectare."}',
 'Cabeçalho da seção de testemunhos');

-- Depoimentos (testimonials)
INSERT INTO testimonials (id, name, role, image, quote, display_order, active) VALUES
(1, 'Dra. Ana Silva', 'Proprietária — Clínica OdontoPlus', '', 'Encontrei equipamentos de ótima qualidade e o atendimento foi muito ágil.', 1, TRUE),
(2, 'Dr. Carlos Pereira', 'Cirurgião-dentista — Consultório São Pedro', '', 'Plataforma intuitiva e prática. Facilita comprar e vender equipamentos com segurança.', 2, TRUE),
(3, 'Dra. Mariana Costa', 'Diretora clínica — Clínica Sorriso', '', 'Excelente experiência — recomendo para colegas que precisam de equipamentos usados revisados.', 3, TRUE);

-- Banners publicitários
INSERT INTO banners (id, name, position, width, height, image_url, link_url, active, display_order) VALUES
(1, 'Banner Topo (após Hero)', 'after-hero', 1200, 200, '', '', FALSE, 1),
(2, 'Banner Meio 1 (após Marcas)', 'after-brands', 728, 90, '', '', FALSE, 2),
(3, 'Banner Meio 2 (após Recomendados)', 'after-premium', 1200, 200, '', '', FALSE, 3),
(4, 'Banner Meio 3 (após Vendidos)', 'after-sold', 728, 90, '', '', FALSE, 4),
(5, 'Banner Rodapé (após Depoimentos)', 'after-testimonials', 1200, 200, '', '', FALSE, 5);

-- Seções dos Termos de Uso
INSERT INTO terms_sections (title, content, display_order) VALUES
('1. Serviço', 'A Reconectare fornece uma plataforma para anúncios de equipamentos odontológicos usados, atuando como intermediadora para exibir anúncios e facilitar contato entre compradores e vendedores. Não atuamos como parte na transação, exceto quando explicitamente acordado.', 1),
('2. Responsabilidades do Usuário', 'O usuário é responsável pelas informações fornecidas nos anúncios, pela veracidade dos dados e pelo cumprimento das obrigações fiscais e legais relacionadas à compra e venda. Usuários concordam em não publicar conteúdo ilegal, enganoso ou que infrinja direitos de terceiros.', 2),
('3. Propriedade Intelectual', 'O conteúdo do site, incluindo textos, imagens, marca e design, é de propriedade da Reconectare ou de seus licenciadores. É proibida a reprodução não autorizada.', 3),
('4. Limitação de Responsabilidade', 'A Reconectare não se responsabiliza por danos diretos ou indiretos decorrentes das transações entre usuários, problemas de entrega, garantia oferecida pelos vendedores ou uso indevido das informações disponibilizadas.', 4),
('5. Alterações', 'Reservamo-nos o direito de alterar estes Termos a qualquer momento. Alterações serão publicadas nesta página com a data de atualização.', 5),
('6. Lei Aplicável', 'Estes Termos são regidos pelas leis brasileiras. Qualquer disputa será submetida ao foro competente, observadas as disposições legais aplicáveis.', 6);

-- Seções da Política de Privacidade
INSERT INTO privacy_sections (title, content, display_order) VALUES
('1. Dados Coletados', 'Coletamos informações fornecidas diretamente pelos usuários (nome, e-mail, telefone, descrições de anúncios) e dados de uso (logs, IP, comportamento no site) para melhorar a experiência e prevenir fraudes.', 1),
('2. Finalidade', 'Utilizamos os dados para a operação da plataforma, comunicação entre compradores e vendedores, suporte, análises internas e cumprimento de obrigações legais.', 2),
('3. Compartilhamento', 'Dados podem ser compartilhados com prestadores de serviço que atuam em nome da Reconectare (hospedagem, e-mail, pagamentos) e quando exigido por lei ou ordem judicial.', 3),
('4. Direitos do Titular', 'Você tem direito de acessar, corrigir, eliminar ou portar seus dados pessoais, além de revogar consentimento quando aplicável. Solicitações podem ser enviadas para contato informado no site.', 4),
('5. Segurança e Retenção', 'Adotamos medidas técnicas e administrativas razoáveis para proteger os dados. Mantemos os dados pelo tempo necessário às finalidades ou conforme obrigações legais.', 5),
('6. Contato', 'Para dúvidas sobre privacidade ou exercer direitos, entre em contato pelo e-mail disponível no site.', 6);

-- Ícones sociais do rodapé
INSERT INTO footer_social_icons (id, image, link, display_order) VALUES
(1, '', '', 1),
(2, '', '', 2),
(3, '', '', 3),
(4, '', '', 4),
(5, '', '', 5);

-- Configuração de banners de anúncios (ad_banners)
INSERT INTO ad_banners (banner_key, enabled, layout, auto_rotate, rotate_interval) VALUES
('banner1', FALSE, 1, FALSE, 5),
('banner2', FALSE, 1, FALSE, 5),
('banner3', FALSE, 1, FALSE, 5),
('banner4', FALSE, 1, FALSE, 5),
('banner5', FALSE, 1, FALSE, 5),
('banner6', FALSE, 1, FALSE, 5),
('banner7', FALSE, 1, FALSE, 5),
('banner8', FALSE, 1, FALSE, 5);

-- Slots dos banners de anúncios (ad_banner_slots)
INSERT INTO ad_banner_slots (ad_banner_id, slot_number, media_url, link_url, media_type)
SELECT id, 1, '', '', 'image' FROM ad_banners
UNION ALL
SELECT id, 2, '', '', 'image' FROM ad_banners
UNION ALL
SELECT id, 3, '', '', 'image' FROM ad_banners;

-- Configuração de produtos recomendados
INSERT INTO recommended_config (order_type, selected_codes) VALUES
('desc', '["", "", "", "", "", "", "", "", "", "", "", ""]');

-- ==========================================
-- FIM DO SCRIPT
-- ==========================================

-- Verificação final
SELECT 'Banco de dados reconectarehtml criado com sucesso!' AS status;
SELECT COUNT(*) AS total_users FROM users;
SELECT COUNT(*) AS total_listings FROM listings;
SELECT COUNT(*) AS total_brands FROM brands;
SELECT COUNT(*) AS total_equipment_types FROM equipment_types;
SELECT COUNT(*) AS total_page_configs FROM page_config;
SELECT COUNT(*) AS total_testimonials FROM testimonials;
SELECT COUNT(*) AS total_banners FROM banners;
SELECT COUNT(*) AS total_terms_sections FROM terms_sections;
SELECT COUNT(*) AS total_privacy_sections FROM privacy_sections;
