-- ==========================================
-- QUERIES ÚTEIS - reconectarehtml
-- ==========================================

USE reconectarehtml;

-- ==========================================
-- CONSULTAS GERAIS
-- ==========================================

-- Ver todas as tabelas do banco
SHOW TABLES;

-- Ver estrutura de uma tabela
DESCRIBE users;
DESCRIBE listings;
DESCRIBE page_config;

-- Verificar total de registros em cada tabela
SELECT 'users' AS tabela, COUNT(*) AS total FROM users
UNION ALL
SELECT 'listings', COUNT(*) FROM listings
UNION ALL
SELECT 'brands', COUNT(*) FROM brands
UNION ALL
SELECT 'equipment_types', COUNT(*) FROM equipment_types
UNION ALL
SELECT 'testimonials', COUNT(*) FROM testimonials
UNION ALL
SELECT 'banners', COUNT(*) FROM banners
UNION ALL
SELECT 'page_config', COUNT(*) FROM page_config;

-- ==========================================
-- CONSULTAS DE USUÁRIOS
-- ==========================================

-- Todos os usuários
SELECT id, nome, email, role, blocked FROM users;

-- Apenas usuários ativos (não bloqueados)
SELECT id, nome, email, role FROM users WHERE blocked = FALSE;

-- Apenas administradores
SELECT id, nome, email FROM users WHERE role = 'Admin';

-- Buscar usuário por email
SELECT * FROM users WHERE email = 'admin@example.com';

-- Contar usuários por role
SELECT role, COUNT(*) as total 
FROM users 
GROUP BY role;

-- ==========================================
-- CONSULTAS DE EQUIPAMENTOS
-- ==========================================

-- Todos os equipamentos
SELECT id, code, name, price, status, brand, type, is_premium 
FROM listings 
ORDER BY created_at DESC;

-- Equipamentos disponíveis
SELECT id, code, name, price, brand, type 
FROM listings 
WHERE status = 'Disponível'
ORDER BY price DESC;

-- Equipamentos premium
SELECT id, code, name, price, brand 
FROM listings 
WHERE is_premium = TRUE AND status = 'Disponível';

-- Equipamentos vendidos
SELECT id, code, name, price, sold_date 
FROM listings 
WHERE status = 'Vendido'
ORDER BY sold_date DESC;

-- Buscar por marca
SELECT id, code, name, price, type 
FROM listings 
WHERE brand = 'Kavo';

-- Buscar por tipo
SELECT id, code, name, price, brand 
FROM listings 
WHERE type = 'Scanner intraoral';

-- Buscar por faixa de preço
SELECT id, code, name, price, brand, type 
FROM listings 
WHERE price BETWEEN 10000 AND 50000
AND status = 'Disponível';

-- Estatísticas de equipamentos
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN status = 'Disponível' THEN 1 ELSE 0 END) as disponiveis,
  SUM(CASE WHEN status = 'Reservado' THEN 1 ELSE 0 END) as reservados,
  SUM(CASE WHEN status = 'Vendido' THEN 1 ELSE 0 END) as vendidos,
  SUM(CASE WHEN is_premium = TRUE THEN 1 ELSE 0 END) as premium
FROM listings;

-- Equipamentos por tipo (agrupado)
SELECT type, COUNT(*) as total, AVG(price) as preco_medio
FROM listings
GROUP BY type
ORDER BY total DESC;

-- Equipamentos por marca (agrupado)
SELECT brand, COUNT(*) as total, AVG(price) as preco_medio
FROM listings
GROUP BY brand
ORDER BY total DESC;

-- Top 10 equipamentos mais caros
SELECT code, name, price, brand, type 
FROM listings 
WHERE status = 'Disponível'
ORDER BY price DESC
LIMIT 10;

-- Top 10 equipamentos mais baratos
SELECT code, name, price, brand, type 
FROM listings 
WHERE status = 'Disponível'
ORDER BY price ASC
LIMIT 10;

-- ==========================================
-- CONSULTAS DE CONFIGURAÇÕES
-- ==========================================

-- Todas as configurações
SELECT config_key, description 
FROM page_config 
ORDER BY config_key;

-- Ver configuração específica
SELECT config_value 
FROM page_config 
WHERE config_key = 'hero';

-- Hero config formatado
SELECT 
  JSON_UNQUOTE(JSON_EXTRACT(config_value, '$.title')) as title,
  JSON_UNQUOTE(JSON_EXTRACT(config_value, '$.subtitle')) as subtitle,
  JSON_UNQUOTE(JSON_EXTRACT(config_value, '$.backgroundImage')) as image
FROM page_config 
WHERE config_key = 'hero';

-- Contact config formatado
SELECT 
  JSON_UNQUOTE(JSON_EXTRACT(config_value, '$.email')) as email,
  JSON_UNQUOTE(JSON_EXTRACT(config_value, '$.whatsappNumber')) as whatsapp,
  JSON_UNQUOTE(JSON_EXTRACT(config_value, '$.displayPhone')) as phone
FROM page_config 
WHERE config_key = 'contact';

-- ==========================================
-- CONSULTAS DE DEPOIMENTOS
-- ==========================================

-- Todos os depoimentos ativos
SELECT id, name, role, quote, display_order 
FROM testimonials 
WHERE active = TRUE
ORDER BY display_order ASC;

-- Todos os depoimentos (incluindo inativos)
SELECT id, name, role, quote, active, display_order 
FROM testimonials 
ORDER BY display_order ASC;

-- ==========================================
-- CONSULTAS DE BANNERS
-- ==========================================

-- Banners ativos
SELECT id, name, position, width, height, active 
FROM banners 
WHERE active = TRUE
ORDER BY display_order ASC;

-- Banners com imagens configuradas
SELECT id, name, position, image_url, link_url 
FROM banners 
WHERE image_url != '' AND image_url IS NOT NULL;

-- ==========================================
-- CONSULTAS DE TERMOS E PRIVACIDADE
-- ==========================================

-- Todas as seções dos termos
SELECT id, title, display_order 
FROM terms_sections 
ORDER BY display_order ASC;

-- Todas as seções da privacidade
SELECT id, title, display_order 
FROM privacy_sections 
ORDER BY display_order ASC;

-- ==========================================
-- CONSULTAS DE MARCAS E TIPOS
-- ==========================================

-- Todas as marcas
SELECT * FROM brands ORDER BY name;

-- Todos os tipos de equipamentos
SELECT * FROM equipment_types ORDER BY name;

-- Marcas com contagem de equipamentos
SELECT b.name, COUNT(l.id) as total_equipamentos
FROM brands b
LEFT JOIN listings l ON l.brand = b.name
GROUP BY b.name
ORDER BY total_equipamentos DESC;

-- Tipos com contagem de equipamentos
SELECT et.name, COUNT(l.id) as total_equipamentos
FROM equipment_types et
LEFT JOIN listings l ON l.type = et.name
GROUP BY et.name
ORDER BY total_equipamentos DESC;

-- ==========================================
-- RELATÓRIOS E ANÁLISES
-- ==========================================

-- Relatório de vendas (últimos 30 dias)
SELECT 
  DATE(sold_date) as data,
  COUNT(*) as total_vendas,
  SUM(price) as valor_total
FROM listings
WHERE sold_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY DATE(sold_date)
ORDER BY data DESC;

-- Vendas por mês
SELECT 
  DATE_FORMAT(sold_date, '%Y-%m') as mes,
  COUNT(*) as total_vendas,
  SUM(price) as valor_total
FROM listings
WHERE status = 'Vendido'
GROUP BY DATE_FORMAT(sold_date, '%Y-%m')
ORDER BY mes DESC;

-- Equipamentos mais populares (por views - requer campo adicional)
-- Esta query é um exemplo, você precisaria adicionar um campo 'views' na tabela
-- SELECT code, name, views FROM listings ORDER BY views DESC LIMIT 10;

-- Ticket médio por tipo de equipamento
SELECT 
  type,
  COUNT(*) as quantidade,
  AVG(price) as ticket_medio,
  MIN(price) as preco_minimo,
  MAX(price) as preco_maximo
FROM listings
WHERE status = 'Vendido'
GROUP BY type
ORDER BY ticket_medio DESC;

-- ==========================================
-- BUSCA AVANÇADA
-- ==========================================

-- Busca textual nos equipamentos
SELECT id, code, name, brand, type, price
FROM listings
WHERE 
  name LIKE '%scanner%' 
  OR description LIKE '%scanner%'
  OR type LIKE '%scanner%'
ORDER BY price ASC;

-- Busca com múltiplos critérios
SELECT id, code, name, brand, type, price, status
FROM listings
WHERE 
  status = 'Disponível'
  AND type IN ('Scanner intraoral', 'Scanner de laboratório')
  AND price BETWEEN 30000 AND 60000
ORDER BY price ASC;

-- ==========================================
-- MANUTENÇÃO E LIMPEZA
-- ==========================================

-- Resetar AUTO_INCREMENT de uma tabela (cuidado!)
-- ALTER TABLE testimonials AUTO_INCREMENT = 1;

-- Remover equipamentos sem vendedor (dados inválidos)
-- DELETE FROM listings WHERE seller IS NULL OR seller = '{}';

-- Remover banners inativos e sem imagem
-- DELETE FROM banners WHERE active = FALSE AND (image_url IS NULL OR image_url = '');

-- Atualizar todos os códigos de equipamentos (regenerar)
/*
SET @counter = 0;
UPDATE listings
SET code = CONCAT('LP-', LPAD(@counter := @counter + 1, 3, '0'))
ORDER BY id;
*/

-- ==========================================
-- BACKUP E EXPORTAÇÃO
-- ==========================================

-- Exportar apenas estrutura (execute no terminal)
-- mysqldump -u root -p --no-data reconectarehtml > estrutura.sql

-- Exportar apenas dados (execute no terminal)
-- mysqldump -u root -p --no-create-info reconectarehtml > dados.sql

-- Exportar tudo (execute no terminal)
-- mysqldump -u root -p reconectarehtml > backup_completo.sql

-- ==========================================
-- ÍNDICES E PERFORMANCE
-- ==========================================

-- Ver índices de uma tabela
SHOW INDEX FROM listings;

-- Analisar performance de uma query (usar EXPLAIN)
EXPLAIN SELECT * FROM listings WHERE brand = 'Kavo' AND status = 'Disponível';

-- Ver tamanho das tabelas
SELECT 
  table_name AS tabela,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS tamanho_mb
FROM information_schema.TABLES
WHERE table_schema = 'reconectarehtml'
ORDER BY (data_length + index_length) DESC;

-- ==========================================
-- QUERIES DE ADMINISTRAÇÃO
-- ==========================================

-- Bloquear/Desbloquear usuário
UPDATE users SET blocked = TRUE WHERE email = 'vendedor@example.com';
UPDATE users SET blocked = FALSE WHERE email = 'vendedor@example.com';

-- Promover usuário a Admin
UPDATE users SET role = 'Admin' WHERE email = 'vendedor@example.com';

-- Rebaixar Admin para Seller
UPDATE users SET role = 'Seller' WHERE email = 'admin@example.com';

-- Marcar equipamento como vendido
UPDATE listings 
SET status = 'Vendido', sold_date = CURDATE() 
WHERE code = 'LP-001';

-- Marcar equipamento como disponível novamente
UPDATE listings 
SET status = 'Disponível', sold_date = NULL 
WHERE code = 'LP-001';

-- Ativar/Desativar depoimento
UPDATE testimonials SET active = FALSE WHERE id = 1;
UPDATE testimonials SET active = TRUE WHERE id = 1;

-- ==========================================
-- FIM DAS QUERIES ÚTEIS
-- ==========================================
