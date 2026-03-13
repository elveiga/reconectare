import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { query, queryOne } from '../src/lib/database.js';
import { getEnvNumber, getEnvString } from '../src/lib/env.js';
import { ensureDatabaseBootstrap } from './bootstrap-db.js';

dotenv.config({ quiet: true });

const requireEnv = (name) => {
  const value = getEnvString(name, '');
  if (!value) {
    throw new Error(`Variavel obrigatoria ausente: ${name}`);
  }
  return value;
};

const app = express();
const PORT = getEnvNumber('PORT', 5000);
const JWT_SECRET = requireEnv('JWT_SECRET');
const IS_PRODUCTION = getEnvString('NODE_ENV', '').toLowerCase() === 'production';
const FRONTEND_ORIGINS = getEnvString('FRONTEND_ORIGINS', '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);
const IS_SAME_ORIGIN_MODE = IS_PRODUCTION && FRONTEND_ORIGINS.length === 0;

const DEV_DEFAULT_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001'
];

const ALLOWED_ORIGINS = IS_PRODUCTION
  ? FRONTEND_ORIGINS
  : Array.from(new Set([...FRONTEND_ORIGINS, ...DEV_DEFAULT_ORIGINS]));
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIGURED_UPLOADS_DIR = getEnvString('UPLOADS_DIR', '');
const UPLOADS_DIR = CONFIGURED_UPLOADS_DIR || path.resolve(__dirname, '../uploads');
const HAS_PERSISTENT_UPLOADS_CONFIG = Boolean(CONFIGURED_UPLOADS_DIR);
const DIST_DIR = path.resolve(__dirname, '../dist');
const DIST_INDEX_FILE = path.join(DIST_DIR, 'index.html');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

if (IS_PRODUCTION && !HAS_PERSISTENT_UPLOADS_CONFIG) {
  console.warn('UPLOADS_DIR nao configurado em producao. Uploads locais podem sumir apos reinicio/deploy.');
}

if (!IS_SAME_ORIGIN_MODE) {
  app.use(cors({
    origin: (origin, callback) => {
      // Permite requests server-to-server (sem Origin), como health checks.
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error('Origem nao permitida pelo CORS'));
    },
    credentials: true
  }));
} else {
  console.log('FRONTEND_ORIGINS não definido em produção. Usando modo same-origin (frontend e API no mesmo domínio).');
}
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

const LOGIN_WINDOW_MS = getEnvNumber('LOGIN_WINDOW_MS', 15 * 60 * 1000);
const LOGIN_MAX_ATTEMPTS_PER_IP = getEnvNumber('LOGIN_MAX_ATTEMPTS_PER_IP', 20);
const LOGIN_PROGRESSIVE_LOCK_SECONDS = [0, 0, 0, 30, 60, 180, 600, 1800];
const PUBLIC_ACTION_WINDOW_MS = getEnvNumber('PUBLIC_ACTION_WINDOW_MS', 15 * 60 * 1000);
const PUBLIC_MEDIA_UPLOAD_MAX_PER_IP = getEnvNumber('PUBLIC_MEDIA_UPLOAD_MAX_PER_IP', 40);
const PUBLIC_LISTING_CREATE_MAX_PER_IP = getEnvNumber('PUBLIC_LISTING_CREATE_MAX_PER_IP', 8);
const AUTO_APPROVE_NEW_LISTINGS = getEnvString('AUTO_APPROVE_NEW_LISTINGS', 'true').toLowerCase() !== 'false';

// Rate limiting state has been moved to database (login_attempts table)
// See database/db-add-login-tracking.sql for schema

const sanitizeText = (value) => String(value ?? '').trim();
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
const isValidCPF = (cpf) => /^\d{11}$/.test(String(cpf || '').replace(/\D/g, ''));
const isValidPhone = (phone) => /^\d{10,13}$/.test(String(phone || '').replace(/\D/g, ''));
const isValidRole = (role) => role === 'Admin' || role === 'Seller' || role === 'Lojista';
const isStrongEnoughPassword = (password) => String(password || '').length >= 6;
const ALLOWED_STATUS = ['Pendente', 'Disponível', 'Reservado', 'Vendido', 'Recusado'];
const publicRateLimitStore = new Map();
let hasMustChangePasswordColumnCache = null;

const getClientIp = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.length) {
    return forwardedFor.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
};

const applyInMemoryRateLimit = ({ scope, windowMs, maxRequests, message }) => (req, res, next) => {
  const ip = getClientIp(req);
  const now = Date.now();
  const key = `${scope}:${ip}`;
  const current = publicRateLimitStore.get(key) || [];
  const filtered = current.filter((timestamp) => now - timestamp < windowMs);

  if (filtered.length >= maxRequests) {
    const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - filtered[0])) / 1000));
    res.setHeader('Retry-After', String(retryAfterSeconds));
    return res.status(429).json({
      message,
      retryAfterSeconds
    });
  }

  filtered.push(now);
  publicRateLimitStore.set(key, filtered);
  return next();
};

const parseBearerToken = (req) => {
  const authHeader = req.headers.authorization || '';
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
};

const hasMustChangePasswordColumn = async () => {
  if (hasMustChangePasswordColumnCache !== null) {
    return hasMustChangePasswordColumnCache;
  }

  try {
    const result = await queryOne(
      `SELECT COUNT(1) AS total
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'users'
         AND COLUMN_NAME = 'must_change_password'`
    );
    hasMustChangePasswordColumnCache = Number(result?.total || 0) > 0;
  } catch {
    hasMustChangePasswordColumnCache = false;
  }

  return hasMustChangePasswordColumnCache;
};

const userSelectFields = async () => {
  const hasColumn = await hasMustChangePasswordColumn();
  return hasColumn
    ? 'id, nome, cpf, email, telefone, role, blocked, must_change_password, created_at, updated_at'
    : 'id, nome, cpf, email, telefone, role, blocked, FALSE AS must_change_password, created_at, updated_at';
};

const applyLoginRateLimit = async (req, res, next) => {
  try {
    const ip = getClientIp(req);
    const now = new Date();
    const windowStart = new Date(now.getTime() - LOGIN_WINDOW_MS);

    // Limpar tentativas antigas (fora da janela de rate limit)
    await query(
      'DELETE FROM login_attempts WHERE ip_address = ? AND last_attempt < ?',
      [ip, windowStart]
    );

    // Contar tentativas no período de janela
    const attempts = await queryOne(
      'SELECT COUNT(*) as count FROM login_attempts WHERE ip_address = ? AND last_attempt >= ?',
      [ip, windowStart]
    );

    const attemptCount = attempts?.count || 0;

    // Verificar se excedeu o limite
    if (attemptCount >= LOGIN_MAX_ATTEMPTS_PER_IP) {
      // Encontrar a próxima tentativa
      const nextAttempt = await queryOne(
        'SELECT last_attempt FROM login_attempts WHERE ip_address = ? AND last_attempt >= ? ORDER BY last_attempt ASC LIMIT 1',
        [ip, windowStart]
      );

      const nextAttemptTime = new Date(nextAttempt?.last_attempt || now);
      const retryAfterMs = LOGIN_WINDOW_MS - (now.getTime() - nextAttemptTime.getTime());
      const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));

      res.setHeader('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({
        message: 'Muitas tentativas de login. Tente novamente mais tarde.',
        retryAfterSeconds
      });
    }

    // Registrar esta tentativa
    await query(
      `INSERT INTO login_attempts (ip_address, attempt_count, last_attempt, created_at)
       VALUES (?, 1, ?, ?)
       ON DUPLICATE KEY UPDATE attempt_count = attempt_count + 1, last_attempt = ?`,
      [ip, now, now, now]
    );

    return next();
  } catch (error) {
    console.error('Erro no rate limiting:', error);
    return res.status(500).json({ message: 'Erro no rate limiting' });
  }
};

const registerLoginFailure = async (email) => {
  try {
    const now = new Date();
    const safeEmail = String(email || '').toLowerCase();

    // Buscar ou criar registro de tentativa para este email
    let attempt = await queryOne(
      'SELECT * FROM login_attempts WHERE email = ? ORDER BY created_at DESC LIMIT 1',
      [safeEmail]
    );

    if (!attempt) {
      await query(
        'INSERT INTO login_attempts (email, ip_address, attempt_count, locked_until, created_at, last_attempt) VALUES (?, ?, 1, ?, ?, ?)',
        [safeEmail, 'unknown', null, now, now]
      );
      attempt = await queryOne(
        'SELECT * FROM login_attempts WHERE email = ? ORDER BY created_at DESC LIMIT 1',
        [safeEmail]
      );
    }

    const failureCount = (attempt?.attempt_count || 0) + 1;
    const lockIndex = Math.min(failureCount, LOGIN_PROGRESSIVE_LOCK_SECONDS.length - 1);
    const lockSeconds = LOGIN_PROGRESSIVE_LOCK_SECONDS[lockIndex] || 0;

    let lockedUntil = null;
    if (lockSeconds > 0) {
      lockedUntil = new Date(now.getTime() + lockSeconds * 1000);
    }

    await query(
      'UPDATE login_attempts SET attempt_count = ?, locked_until = ?, last_attempt = ? WHERE email = ? ORDER BY created_at DESC LIMIT 1',
      [failureCount, lockedUntil, now, safeEmail]
    );

    return {
      locked: lockSeconds > 0,
      retryAfterSeconds: lockSeconds,
      failures: failureCount
    };
  } catch (error) {
    console.error('Erro ao registrar falha de login:', error);
    return {
      locked: false,
      retryAfterSeconds: 0,
      failures: 0
    };
  }
};

const clearLoginFailures = async (email) => {
  try {
    const safeEmail = String(email || '').toLowerCase();
    await query(
      'UPDATE login_attempts SET attempt_count = 0, locked_until = NULL WHERE email = ?',
      [safeEmail]
    );
  } catch (error) {
    console.error('Erro ao limpar tentativas de login:', error);
  }
};

const checkAccountLock = async (email) => {
  try {
    const safeEmail = String(email || '').toLowerCase();
    const now = new Date();

    const attempt = await queryOne(
      'SELECT * FROM login_attempts WHERE email = ? AND locked_until IS NOT NULL ORDER BY created_at DESC LIMIT 1',
      [safeEmail]
    );

    if (!attempt || !attempt.locked_until) {
      return { locked: false, retryAfterSeconds: 0 };
    }

    const lockedUntil = new Date(attempt.locked_until);
    if (lockedUntil > now) {
      const retryAfterMs = lockedUntil.getTime() - now.getTime();
      const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
      return { locked: true, retryAfterSeconds };
    }

    // Lock expirou, limpar
    await query(
      'UPDATE login_attempts SET locked_until = NULL WHERE email = ?',
      [safeEmail]
    );

    return { locked: false, retryAfterSeconds: 0 };
  } catch (error) {
    console.error('Erro ao verificar lock da conta:', error);
    return { locked: false, retryAfterSeconds: 0 };
  }
};

const parseJsonField = (raw, fallback) => {
  try {
    if (raw === null || raw === undefined) return fallback;
    if (typeof raw === 'object') return raw;
    if (Buffer.isBuffer(raw)) {
      const decoded = raw.toString('utf8');
      return decoded ? JSON.parse(decoded) : fallback;
    }
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      return trimmed ? JSON.parse(trimmed) : fallback;
    }
    return fallback;
  } catch {
    return fallback;
  }
};

const isSafeMediaUrl = (value) => {
  const safe = sanitizeText(value);
  if (!safe) return false;
  if (safe.startsWith('/uploads/')) return true;
  return /^https?:\/\//i.test(safe);
};

const sanitizeMediaUrl = (value) => {
  const safe = sanitizeText(value);
  return isSafeMediaUrl(safe) ? safe : '';
};

const dedupeStrings = (values) => {
  const seen = new Set();
  const unique = [];
  for (const value of values) {
    const normalized = sanitizeText(value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    unique.push(normalized);
  }
  return unique;
};

const parseListingMedia = (specsRaw, imageRaw) => {
  const specs = parseJsonField(specsRaw, {});
  const media = specs && typeof specs === 'object' ? specs.__media || {} : {};
  const baseImage = sanitizeMediaUrl(imageRaw);
  const imageList = Array.isArray(media.images)
    ? media.images.map((item) => sanitizeMediaUrl(item)).filter(Boolean)
    : [];
  const images = dedupeStrings([baseImage, ...imageList]).slice(0, 9);
  const videoUrl = sanitizeMediaUrl(media.videoUrl);

  return {
    images,
    videoUrl,
    primaryImage: images[0] || null,
    cleanSpecs: specs && typeof specs === 'object'
      ? Object.fromEntries(Object.entries(specs).filter(([key]) => key !== '__media'))
      : {}
  };
};

const buildListingSpecsWithMedia = ({ incomingSpecs, currentSpecsRaw, image, images, videoUrl }) => {
  const currentSpecs = parseJsonField(currentSpecsRaw, {});
  const baseSpecs = incomingSpecs && typeof incomingSpecs === 'object'
    ? { ...incomingSpecs }
    : { ...currentSpecs };

  const currentMedia = currentSpecs && typeof currentSpecs === 'object' && currentSpecs.__media
    ? currentSpecs.__media
    : {};

  const hasImages = Array.isArray(images);
  const hasVideo = videoUrl !== undefined;
  const hasImage = image !== undefined;

  let mergedImages = hasImages
    ? dedupeStrings((images || []).map((item) => sanitizeMediaUrl(item)).filter(Boolean)).slice(0, 9)
    : dedupeStrings((Array.isArray(currentMedia.images) ? currentMedia.images : []).map((item) => sanitizeMediaUrl(item)).filter(Boolean));

  const imageValue = sanitizeMediaUrl(image);
  if (hasImage && imageValue) {
    mergedImages = dedupeStrings([imageValue, ...mergedImages]).slice(0, 9);
  }

  const mergedVideoUrl = hasVideo
    ? sanitizeMediaUrl(videoUrl)
    : sanitizeMediaUrl(currentMedia.videoUrl);

  const finalSpecs = {
    ...baseSpecs,
    __media: {
      images: mergedImages,
      videoUrl: mergedVideoUrl
    }
  };

  return {
    finalSpecs,
    primaryImage: mergedImages[0] || null
  };
};

const toListingDTO = (row) => ({
  ...(() => {
    const media = parseListingMedia(row.specs, row.image);
    return {
      image: media.primaryImage,
      images: media.images,
      videoUrl: media.videoUrl,
      specs: media.cleanSpecs
    };
  })(),
  id: row.id,
  code: row.code,
  model: row.model,
  name: row.name,
  price: Number(row.price || 0),
  status: row.status,
  type: row.type,
  brand: row.brand,
  description: row.description,
  location: row.location,
  isPremium: Boolean(row.is_premium),
  soldDate: row.sold_date,
  seller: parseJsonField(row.seller, {}),
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const safeUser = (user) => {
  if (!user) return null;
  const { senha, passwordHash, ...rest } = user;
  const parsed = { ...rest };
  if (Object.prototype.hasOwnProperty.call(parsed, 'must_change_password')) {
    parsed.mustChangePassword = Boolean(parsed.must_change_password);
    delete parsed.must_change_password;
  }
  return parsed;
};

const signToken = (user) => jwt.sign(
  { id: user.id, email: user.email, role: user.role },
  JWT_SECRET,
  { expiresIn: '12h' }
);

const authenticate = async (req, res, next) => {
  try {
    const token = parseBearerToken(req);

    if (!token) {
      return res.status(401).json({ message: 'Não autenticado' });
    }

    const payload = jwt.verify(token, JWT_SECRET);
    const fields = await userSelectFields();
    const user = await queryOne(`SELECT ${fields} FROM users WHERE id = ?`, [payload.id]);

    if (!user || user.blocked) {
      return res.status(401).json({ message: 'Usuário inválido ou bloqueado' });
    }

    const allowWhenMustChange = req.path === '/api/auth/change-password' || req.path === '/api/auth/me';
    if (user.must_change_password && !allowWhenMustChange) {
      return res.status(403).json({ message: 'Troca de senha obrigatória antes de continuar.' });
    }

    req.user = safeUser(user);
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

const authenticateOptional = async (req, _res, next) => {
  try {
    const token = parseBearerToken(req);
    if (!token) {
      req.user = null;
      return next();
    }

    const payload = jwt.verify(token, JWT_SECRET);
    const fields = await userSelectFields();
    const user = await queryOne(`SELECT ${fields} FROM users WHERE id = ?`, [payload.id]);
    req.user = user && !user.blocked ? safeUser(user) : null;
    return next();
  } catch {
    req.user = null;
    return next();
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'Admin') {
    return res.status(403).json({ message: 'Acesso negado' });
  }
  next();
};

const MEDIA_MIME_ALLOWLIST = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/ogg'
]);

const hasSignature = (buffer, signature) => {
  if (!buffer || buffer.length < signature.length) return false;
  for (let index = 0; index < signature.length; index += 1) {
    if (buffer[index] !== signature[index]) return false;
  }
  return true;
};

const validateUploadedFileSignature = async (file) => {
  if (!file?.path || !file?.mimetype) return false;
  const streamBuffer = await fs.promises.readFile(file.path);
  if (!streamBuffer?.length) return false;

  const mimeType = String(file.mimetype).toLowerCase();
  if (mimeType === 'image/jpeg') return hasSignature(streamBuffer, [0xff, 0xd8, 0xff]);
  if (mimeType === 'image/png') return hasSignature(streamBuffer, [0x89, 0x50, 0x4e, 0x47]);
  if (mimeType === 'image/gif') {
    const gif87 = Buffer.from('GIF87a', 'ascii');
    const gif89 = Buffer.from('GIF89a', 'ascii');
    return streamBuffer.subarray(0, 6).equals(gif87) || streamBuffer.subarray(0, 6).equals(gif89);
  }
  if (mimeType === 'image/webp') {
    const riff = Buffer.from('RIFF', 'ascii');
    const webp = Buffer.from('WEBP', 'ascii');
    return streamBuffer.subarray(0, 4).equals(riff) && streamBuffer.subarray(8, 12).equals(webp);
  }
  if (mimeType === 'video/mp4') {
    const ftyp = Buffer.from('ftyp', 'ascii');
    return streamBuffer.subarray(4, 8).equals(ftyp);
  }
  if (mimeType === 'video/webm') return hasSignature(streamBuffer, [0x1a, 0x45, 0xdf, 0xa3]);
  if (mimeType === 'video/ogg') {
    const oggs = Buffer.from('OggS', 'ascii');
    return streamBuffer.subarray(0, 4).equals(oggs);
  }

  return false;
};

const publicMediaRateLimit = applyInMemoryRateLimit({
  scope: 'public-media-upload',
  windowMs: PUBLIC_ACTION_WINDOW_MS,
  maxRequests: PUBLIC_MEDIA_UPLOAD_MAX_PER_IP,
  message: 'Muitos uploads em pouco tempo. Tente novamente mais tarde.'
});

const publicListingRateLimit = applyInMemoryRateLimit({
  scope: 'public-listing-create',
  windowMs: PUBLIC_ACTION_WINDOW_MS,
  maxRequests: PUBLIC_LISTING_CREATE_MAX_PER_IP,
  message: 'Muitas solicitações de anúncio em pouco tempo. Tente novamente mais tarde.'
});

const mediaStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const originalExtension = path.extname(file.originalname || '').toLowerCase();
    const safeExtension = originalExtension || (file.mimetype.startsWith('video/') ? '.mp4' : '.jpg');
    const uniquePart = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    cb(null, `${uniquePart}${safeExtension}`);
  }
});

const mediaUpload = multer({
  storage: mediaStorage,
  limits: {
    fileSize: 50 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (!MEDIA_MIME_ALLOWLIST.has(file.mimetype)) {
      cb(new Error('Tipo de arquivo não suportado'));
      return;
    }
    cb(null, true);
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/media/upload', publicMediaRateLimit, authenticateOptional, (req, res) => {
  if (IS_PRODUCTION && !HAS_PERSISTENT_UPLOADS_CONFIG) {
    return res.status(503).json({
      message: 'Uploads persistentes nao configurados. Defina UPLOADS_DIR para um volume persistente no Railway antes de enviar imagens.'
    });
  }

  mediaUpload.single('file')(req, res, (error) => {
    const cleanupAndReject = async (message) => {
      if (req.file?.path) {
        await fs.promises.unlink(req.file.path).catch(() => {});
      }
      return res.status(400).json({ message });
    };

    const finish = async () => {
      if (error) {
        const isMulterError = error?.name === 'MulterError';
        const message = isMulterError
          ? (error.code === 'LIMIT_FILE_SIZE' ? 'Arquivo excede o limite de 50MB' : 'Falha ao enviar arquivo')
          : (error?.message || 'Falha ao enviar arquivo');
        return res.status(400).json({ message });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'Nenhum arquivo enviado' });
      }

      const hasValidSignature = await validateUploadedFileSignature(req.file);
      if (!hasValidSignature) {
        return cleanupAndReject('Arquivo inválido ou potencialmente inseguro');
      }

      const relativeUrl = `/uploads/${req.file.filename}`;
      return res.status(201).json({
        success: true,
        url: relativeUrl,
        mimeType: req.file.mimetype,
        size: req.file.size,
        originalName: req.file.originalname
      });
    };

    finish().catch((unhandledError) => {
      console.error('Erro ao processar upload:', unhandledError);
      return res.status(500).json({ message: 'Falha ao processar upload' });
    });
  });
});

app.post('/api/auth/login', applyLoginRateLimit, async (req, res) => {
  try {
    const { email, senha } = req.body || {};
    const safeEmail = sanitizeText(email).toLowerCase();

    if (!safeEmail || !senha) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    if (!isValidEmail(safeEmail)) {
      return res.status(400).json({ message: 'Email inválido' });
    }

    const lockCheck = await checkAccountLock(safeEmail);
    if (lockCheck.locked) {
      res.setHeader('Retry-After', String(lockCheck.retryAfterSeconds));
      return res.status(429).json({
        message: 'Conta temporariamente bloqueada por tentativas inválidas.',
        retryAfterSeconds: lockCheck.retryAfterSeconds
      });
    }

    const user = await queryOne('SELECT * FROM users WHERE email = ?', [safeEmail]);

    if (!user) {
      const failure = await registerLoginFailure(safeEmail);
      if (failure.locked) {
        res.setHeader('Retry-After', String(failure.retryAfterSeconds));
      }
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    if (user.blocked) {
      return res.status(403).json({ message: 'Usuário bloqueado' });
    }

    const passwordOk = await bcrypt.compare(senha, user.senha);

    if (!passwordOk) {
      const failure = await registerLoginFailure(safeEmail);
      if (failure.locked) {
        res.setHeader('Retry-After', String(failure.retryAfterSeconds));
      }
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    await clearLoginFailures(safeEmail);

    const safe = safeUser(user);
    const token = signToken(safe);
    res.json({ success: true, token, user: safe, requiresPasswordChange: Boolean(safe.mustChangePassword) });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro interno no login' });
  }
});

app.post('/api/auth/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Senha atual e nova senha são obrigatórias' });
    }

    if (!isStrongEnoughPassword(newPassword)) {
      return res.status(400).json({ message: 'Nova senha deve ter no mínimo 6 caracteres' });
    }

    const currentUser = await queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!currentUser) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const passwordOk = await bcrypt.compare(currentPassword, currentUser.senha);
    if (!passwordOk) {
      return res.status(401).json({ message: 'Senha atual inválida' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    const hasColumn = await hasMustChangePasswordColumn();
    if (hasColumn) {
      await query('UPDATE users SET senha = ?, must_change_password = FALSE WHERE id = ?', [hashed, req.user.id]);
    } else {
      await query('UPDATE users SET senha = ? WHERE id = ?', [hashed, req.user.id]);
    }

    const fields = await userSelectFields();
    const updated = await queryOne(`SELECT ${fields} FROM users WHERE id = ?`, [req.user.id]);
    res.json({ success: true, user: safeUser(updated) });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ message: 'Erro ao alterar senha' });
  }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
  res.json({ success: true, user: req.user });
});

app.get('/api/users', authenticate, requireAdmin, async (_req, res) => {
  try {
    const fields = await userSelectFields();
    const users = await query(`SELECT ${fields} FROM users ORDER BY id ASC`);
    res.json({ success: true, users });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ message: 'Erro ao listar usuários' });
  }
});

app.post('/api/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const { nome, cpf, email, telefone, senha, role = 'Seller' } = req.body || {};
    const safeNome = sanitizeText(nome);
    const safeEmail = sanitizeText(email).toLowerCase();
    const safeCpf = String(cpf || '').replace(/\D/g, '');
    const safeTelefone = String(telefone || '').replace(/\D/g, '');
    const safeRole = sanitizeText(role) || 'Seller';

    if (!safeNome || !safeEmail || !safeCpf || !safeTelefone) {
      return res.status(400).json({ message: 'Nome, email, CPF e telefone são obrigatórios' });
    }

    if (!isValidEmail(safeEmail)) {
      return res.status(400).json({ message: 'Email inválido' });
    }
    if (!isValidCPF(safeCpf)) {
      return res.status(400).json({ message: 'CPF inválido' });
    }
    if (!isValidPhone(safeTelefone)) {
      return res.status(400).json({ message: 'Telefone inválido' });
    }
    if (!isValidRole(safeRole)) {
      return res.status(400).json({ message: 'Role inválida' });
    }
    if (senha && !isStrongEnoughPassword(senha)) {
      return res.status(400).json({ message: 'Senha deve ter no mínimo 6 caracteres' });
    }

    const existing = await queryOne('SELECT id FROM users WHERE email = ? OR cpf = ?', [safeEmail, safeCpf]);
    if (existing) {
      return res.status(409).json({ message: 'Usuário já existe' });
    }

    const hashed = await bcrypt.hash(senha || 'teste', 10);
    const result = await query(
      'INSERT INTO users (nome, cpf, email, telefone, senha, role, blocked) VALUES (?, ?, ?, ?, ?, ?, FALSE)',
      [safeNome, safeCpf, safeEmail, safeTelefone, hashed, safeRole]
    );

    const fields = await userSelectFields();
    const user = await queryOne(`SELECT ${fields} FROM users WHERE id = ?`, [result.insertId]);
    res.status(201).json({ success: true, user });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ message: 'Erro ao criar usuário' });
  }
});

app.put('/api/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, cpf, email, telefone, role, blocked, senha } = req.body || {};

    const current = await queryOne('SELECT * FROM users WHERE id = ?', [id]);
    if (!current) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const nextEmail = email !== undefined ? sanitizeText(email).toLowerCase() : undefined;
    const nextCpf = cpf !== undefined ? String(cpf || '').replace(/\D/g, '') : undefined;
    const nextTelefone = telefone !== undefined ? String(telefone || '').replace(/\D/g, '') : undefined;
    const nextRole = role !== undefined ? sanitizeText(role) : undefined;

    if (nextEmail && !isValidEmail(nextEmail)) {
      return res.status(400).json({ message: 'Email inválido' });
    }
    if (nextCpf && !isValidCPF(nextCpf)) {
      return res.status(400).json({ message: 'CPF inválido' });
    }
    if (nextTelefone && !isValidPhone(nextTelefone)) {
      return res.status(400).json({ message: 'Telefone inválido' });
    }
    if (nextRole && !isValidRole(nextRole)) {
      return res.status(400).json({ message: 'Role inválida' });
    }
    if (senha && !isStrongEnoughPassword(senha)) {
      return res.status(400).json({ message: 'Senha deve ter no mínimo 6 caracteres' });
    }

    if (nextEmail && nextEmail !== current.email) {
      const emailConflict = await queryOne('SELECT id FROM users WHERE email = ? AND id <> ?', [nextEmail, id]);
      if (emailConflict) {
        return res.status(409).json({ message: 'Email já está em uso' });
      }
    }

    if (nextCpf && nextCpf !== current.cpf) {
      const cpfConflict = await queryOne('SELECT id FROM users WHERE cpf = ? AND id <> ?', [nextCpf, id]);
      if (cpfConflict) {
        return res.status(409).json({ message: 'CPF já está em uso' });
      }
    }

    const fields = [];
    const values = [];

    if (nome !== undefined) { fields.push('nome = ?'); values.push(sanitizeText(nome)); }
    if (nextCpf !== undefined) { fields.push('cpf = ?'); values.push(nextCpf); }
    if (nextEmail !== undefined) { fields.push('email = ?'); values.push(nextEmail); }
    if (nextTelefone !== undefined) { fields.push('telefone = ?'); values.push(nextTelefone); }
    if (nextRole !== undefined) { fields.push('role = ?'); values.push(nextRole); }
    if (blocked !== undefined) { fields.push('blocked = ?'); values.push(Boolean(blocked)); }
    if (senha) {
      const hashed = await bcrypt.hash(senha, 10);
      fields.push('senha = ?');
      values.push(hashed);
    }

    if (!fields.length) {
      return res.status(400).json({ message: 'Nenhum campo para atualizar' });
    }

    values.push(id);
    await query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);

    const selectFields = await userSelectFields();
    const user = await queryOne(`SELECT ${selectFields} FROM users WHERE id = ?`, [id]);
    res.json({ success: true, user });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ message: 'Erro ao atualizar usuário' });
  }
});

app.delete('/api/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (Number(id) === Number(req.user.id)) {
      return res.status(400).json({ message: 'Não é permitido remover o próprio usuário logado' });
    }

    const found = await queryOne('SELECT id FROM users WHERE id = ?', [id]);
    if (!found) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    await query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ message: 'Erro ao deletar usuário' });
  }
});

app.get('/api/catalog', async (_req, res) => {
  try {
    const [brandsRows, typesRows] = await Promise.all([
      query('SELECT name FROM brands ORDER BY name ASC'),
      query('SELECT name FROM equipment_types ORDER BY name ASC')
    ]);
    res.json({
      success: true,
      brands: brandsRows.map((row) => row.name),
      equipmentTypes: typesRows.map((row) => row.name)
    });
  } catch (error) {
    console.error('Erro ao carregar catálogo:', error);
    res.status(500).json({ message: 'Erro ao carregar catálogo' });
  }
});

app.post('/api/catalog/brands', authenticate, requireAdmin, async (req, res) => {
  try {
    const name = sanitizeText(req.body?.name);
    if (!name) return res.status(400).json({ message: 'Nome da marca é obrigatório' });

    await query('INSERT INTO brands (name) VALUES (?) ON DUPLICATE KEY UPDATE name = VALUES(name)', [name]);
    res.status(201).json({ success: true, name });
  } catch (error) {
    console.error('Erro ao criar marca:', error);
    res.status(500).json({ message: 'Erro ao criar marca' });
  }
});

app.post('/api/catalog/equipment-types', authenticate, requireAdmin, async (req, res) => {
  try {
    const name = sanitizeText(req.body?.name);
    if (!name) return res.status(400).json({ message: 'Nome do tipo é obrigatório' });

    await query('INSERT INTO equipment_types (name) VALUES (?) ON DUPLICATE KEY UPDATE name = VALUES(name)', [name]);
    res.status(201).json({ success: true, name });
  } catch (error) {
    console.error('Erro ao criar tipo:', error);
    res.status(500).json({ message: 'Erro ao criar tipo' });
  }
});

app.get('/api/listings', async (req, res) => {
  try {
    const { search, brand, type, status, isPremium } = req.query;
    const filters = [];
    const params = [];

    if (search) {
      filters.push('(name LIKE ? OR code LIKE ? OR description LIKE ?)');
      const term = `%${String(search).trim()}%`;
      params.push(term, term, term);
    }
    if (brand) {
      filters.push('brand = ?');
      params.push(String(brand));
    }
    if (type) {
      filters.push('type = ?');
      params.push(String(type));
    }
    if (status) {
      filters.push('status = ?');
      params.push(String(status));
    }
    if (isPremium !== undefined) {
      filters.push('is_premium = ?');
      params.push(String(isPremium) === 'true' ? 1 : 0);
    }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const rows = await query(
      `SELECT id, code, model, name, price, image, status, type, brand, description, location, is_premium, sold_date, specs, seller, created_at, updated_at
       FROM listings
       ${where}
       ORDER BY is_premium DESC, id DESC`,
      params
    );

    res.json({ success: true, listings: rows.map(toListingDTO) });
  } catch (error) {
    console.error('Erro ao listar anúncios:', error);
    res.status(500).json({ message: 'Erro ao listar anúncios' });
  }
});

app.post('/api/listings', publicListingRateLimit, authenticateOptional, async (req, res) => {
  try {
    const payload = req.body || {};
    const name = sanitizeText(payload.name);
    if (!name) return res.status(400).json({ message: 'Nome do anúncio é obrigatório' });

    const price = Number(payload.price || 0);
    if (Number.isNaN(price) || price < 0) {
      return res.status(400).json({ message: 'Preço inválido' });
    }

    const sellerName = sanitizeText(payload?.seller?.name);
    const sellerEmail = sanitizeText(payload?.seller?.email).toLowerCase();
    const sellerPhoneDigits = String(payload?.seller?.whatsapp || '').replace(/\D/g, '');

    if (!sellerName || sellerName.length < 3) {
      return res.status(400).json({ message: 'Nome do anunciante inválido' });
    }
    if (!isValidEmail(sellerEmail)) {
      return res.status(400).json({ message: 'Email do anunciante inválido' });
    }
    if (!isValidPhone(sellerPhoneDigits)) {
      return res.status(400).json({ message: 'WhatsApp do anunciante inválido' });
    }

    const defaultNewStatus = AUTO_APPROVE_NEW_LISTINGS ? 'Disponível' : 'Pendente';
    const listingStatus = req.user ? (ALLOWED_STATUS.includes(payload.status) ? payload.status : defaultNewStatus) : defaultNewStatus;
    const isPremiumValue = req.user ? (payload.isPremium ? 1 : 0) : 0;
    const soldDate = listingStatus === 'Vendido' ? (payload.soldDate || new Date().toISOString().slice(0, 10)) : null;
    const mediaPayload = buildListingSpecsWithMedia({
      incomingSpecs: payload.specs,
      currentSpecsRaw: null,
      image: payload.image,
      images: payload.images,
      videoUrl: payload.videoUrl
    });

    const incomingCode = req.user ? sanitizeText(payload.code) : '';
    const listingCode = incomingCode || `LP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    const result = await query(
      `INSERT INTO listings (code, model, name, price, image, status, type, brand, description, location, is_premium, sold_date, specs, seller)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        listingCode,
        sanitizeText(payload.model) || null,
        name,
        price,
        mediaPayload.primaryImage,
        listingStatus,
        sanitizeText(payload.type) || 'Outros',
        sanitizeText(payload.brand) || 'Outros',
        sanitizeText(payload.description) || null,
        sanitizeText(payload.location) || null,
        isPremiumValue,
        soldDate,
        JSON.stringify(mediaPayload.finalSpecs || {}),
        JSON.stringify({
          ...(payload.seller || {}),
          name: sellerName,
          email: sellerEmail,
          whatsapp: sellerPhoneDigits
        })
      ]
    );

    if (!incomingCode) {
      const generatedCode = `LP-${String(result.insertId).padStart(3, '0')}`;
      await query('UPDATE listings SET code = ? WHERE id = ?', [generatedCode, result.insertId]);
    }

    const row = await queryOne('SELECT * FROM listings WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, listing: toListingDTO(row) });
  } catch (error) {
    console.error('Erro ao criar anúncio:', error);
    res.status(500).json({ message: 'Erro ao criar anúncio' });
  }
});

app.put('/api/listings/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const current = await queryOne('SELECT * FROM listings WHERE id = ?', [id]);
    if (!current) return res.status(404).json({ message: 'Anúncio não encontrado' });

    const payload = req.body || {};
    const listingStatus = payload.status !== undefined
      ? (ALLOWED_STATUS.includes(payload.status) ? payload.status : current.status)
      : current.status;

    const soldDate = listingStatus === 'Vendido'
      ? (payload.soldDate || current.sold_date || new Date().toISOString().slice(0, 10))
      : null;

    const mediaPayload = buildListingSpecsWithMedia({
      incomingSpecs: payload.specs,
      currentSpecsRaw: current.specs,
      image: payload.image,
      images: payload.images,
      videoUrl: payload.videoUrl
    });

    await query(
      `UPDATE listings
       SET code = ?, model = ?, name = ?, price = ?, image = ?, status = ?, type = ?, brand = ?,
           description = ?, location = ?, is_premium = ?, sold_date = ?, specs = ?, seller = ?
       WHERE id = ?`,
      [
        sanitizeText(payload.code ?? current.code) || null,
        sanitizeText(payload.model ?? current.model) || null,
        sanitizeText(payload.name ?? current.name),
        Number(payload.price ?? current.price),
        mediaPayload.primaryImage,
        listingStatus,
        sanitizeText(payload.type ?? current.type) || 'Outros',
        sanitizeText(payload.brand ?? current.brand) || 'Outros',
        sanitizeText(payload.description ?? current.description) || null,
        sanitizeText(payload.location ?? current.location) || null,
        payload.isPremium !== undefined ? (payload.isPremium ? 1 : 0) : current.is_premium,
        soldDate,
        JSON.stringify(mediaPayload.finalSpecs || {}),
        JSON.stringify(payload.seller ?? parseJsonField(current.seller, {})),
        id
      ]
    );

    const updated = await queryOne('SELECT * FROM listings WHERE id = ?', [id]);
    res.json({ success: true, listing: toListingDTO(updated) });
  } catch (error) {
    console.error('Erro ao atualizar anúncio:', error);
    res.status(500).json({ message: 'Erro ao atualizar anúncio' });
  }
});

app.patch('/api/listings/:id/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const status = req.body?.status;
    if (!ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({ message: 'Status inválido' });
    }

    await query(
      'UPDATE listings SET status = ?, sold_date = ? WHERE id = ?',
      [status, status === 'Vendido' ? new Date().toISOString().slice(0, 10) : null, id]
    );

    const updated = await queryOne('SELECT * FROM listings WHERE id = ?', [id]);
    if (!updated) return res.status(404).json({ message: 'Anúncio não encontrado' });
    res.json({ success: true, listing: toListingDTO(updated) });
  } catch (error) {
    console.error('Erro ao atualizar status do anúncio:', error);
    res.status(500).json({ message: 'Erro ao atualizar status do anúncio' });
  }
});

app.delete('/api/listings/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await queryOne('SELECT id FROM listings WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ message: 'Anúncio não encontrado' });
    await query('DELETE FROM listings WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover anúncio:', error);
    res.status(500).json({ message: 'Erro ao remover anúncio' });
  }
});

const upsertPageConfig = async (key, value) => {
  await query(
    `INSERT INTO page_config (config_key, config_value)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)`,
    [key, JSON.stringify(value ?? {})]
  );
};

const getAllPageConfigs = async () => {
  const [
    pageConfigRows,
    testimonialRows,
    bannerRows,
    termsRows,
    privacyRows,
    footerIconRows,
    brandOptionRows,
    adBannerRows,
    adBannerSlotRows,
    recommendedRows
  ] = await Promise.all([
    query('SELECT config_key, config_value FROM page_config'),
    query('SELECT id, name, role, image, quote, display_order FROM testimonials WHERE active = TRUE ORDER BY display_order ASC'),
    query('SELECT id, name, position, width, height, image_url, link_url, active FROM banners ORDER BY display_order ASC'),
    query('SELECT id, title, content, display_order FROM terms_sections ORDER BY display_order ASC'),
    query('SELECT id, title, content, display_order FROM privacy_sections ORDER BY display_order ASC'),
    query('SELECT id, image, link, display_order FROM footer_social_icons ORDER BY display_order ASC'),
    query('SELECT id, brand_name, display_order FROM brand_section_options ORDER BY display_order ASC'),
    query('SELECT id, banner_key, enabled, layout, auto_rotate, rotate_interval FROM ad_banners ORDER BY banner_key ASC'),
    query('SELECT id, ad_banner_id, slot_number, media_url, link_url, media_type FROM ad_banner_slots ORDER BY ad_banner_id ASC, slot_number ASC'),
    query('SELECT order_type, selected_codes FROM recommended_config ORDER BY id DESC LIMIT 1')
  ]);

  const pageConfigMap = pageConfigRows.reduce((acc, row) => {
    acc[row.config_key] = parseJsonField(row.config_value, null);
    return acc;
  }, {});

  const testimonialsHeader = pageConfigMap.testimonials || pageConfigMap.testimonials_header || {};
  const termsIntro = pageConfigMap.terms || pageConfigMap.terms_intro || {};
  const privacyIntro = pageConfigMap.privacy || pageConfigMap.privacy_intro || {};

  const recommendedFromTable = recommendedRows?.[0]
    ? {
        order: recommendedRows[0].order_type || 'desc',
        selectedCodes: parseJsonField(recommendedRows[0].selected_codes, [])
      }
    : null;

  const adSlotsByBannerId = adBannerSlotRows.reduce((acc, slot) => {
    const key = Number(slot.ad_banner_id);
    if (!acc[key]) acc[key] = [];
    acc[key].push({
      id: slot.slot_number,
      mediaUrl: slot.media_url || '',
      linkUrl: slot.link_url || '',
      mediaType: slot.media_type || 'image'
    });
    return acc;
  }, {});

  const adBannersFromTable = adBannerRows.reduce((acc, banner) => {
    acc[banner.banner_key] = {
      enabled: Boolean(banner.enabled),
      layout: Number(banner.layout || 1),
      autoRotate: Boolean(banner.auto_rotate),
      rotateInterval: Number(banner.rotate_interval || 5),
      slots: adSlotsByBannerId[Number(banner.id)] || []
    };
    return acc;
  }, {});

  return {
     hero: pageConfigMap.hero && Object.keys(pageConfigMap.hero).length ? pageConfigMap.hero : null,
     about: pageConfigMap.about && Object.keys(pageConfigMap.about).length ? pageConfigMap.about : null,
     contact: pageConfigMap.contact && Object.keys(pageConfigMap.contact).length ? pageConfigMap.contact : null,
    terms: {
      title: termsIntro.title || 'Termos de Uso',
      intro: termsIntro.intro || '',
      sections: termsRows.map((item) => ({
        title: item.title,
        content: item.content
      }))
    },
    privacy: {
      title: privacyIntro.title || 'Política de Privacidade',
      intro: privacyIntro.intro || '',
      lastUpdate: privacyIntro.lastUpdate || '',
      sections: privacyRows.map((item) => ({
        title: item.title,
        content: item.content
      }))
    },
    banners: {
      banners: bannerRows.map((item) => ({
        id: item.id,
        name: item.name,
        position: item.position,
        width: item.width,
        height: item.height,
        imageUrl: item.image_url || '',
        linkUrl: item.link_url || '',
        active: Boolean(item.active)
      }))
    },
    testimonials: {
      title: testimonialsHeader.title || 'O que nossos clientes dizem?',
      subtitle: testimonialsHeader.subtitle || '',
      testimonials: testimonialRows.map((item) => ({
        id: item.id,
        name: item.name,
        role: item.role,
        image: item.image || '',
        quote: item.quote
      }))
    },
    brand_section: {
      ...(pageConfigMap.brand_section || {}),
      options: brandOptionRows.map((item) => item.brand_name)
    },
    footer: {
      ...(pageConfigMap.footer || {}),
      socialIcons: footerIconRows.map((item, index) => ({
        id: index + 1,
        image: item.image || '',
        link: item.link || ''
      }))
    },
    advertise_whatsapp: pageConfigMap.advertise_whatsapp && Object.keys(pageConfigMap.advertise_whatsapp).length ? pageConfigMap.advertise_whatsapp : null,
    post_equipment_whatsapp: pageConfigMap.post_equipment_whatsapp && Object.keys(pageConfigMap.post_equipment_whatsapp).length ? pageConfigMap.post_equipment_whatsapp : null,
    recommended: pageConfigMap.recommended || recommendedFromTable || { order: 'desc', selectedCodes: [] },
    ad_banners: Object.keys(adBannersFromTable).length ? adBannersFromTable : (pageConfigMap.ad_banners || {})
  };
};

const savePageConfigByKey = async (key, value) => {
  const safeValue = value ?? {};

  if (['hero', 'about', 'contact', 'advertise_whatsapp', 'post_equipment_whatsapp'].includes(key)) {
    await upsertPageConfig(key, safeValue);
    return true;
  }

  if (key === 'recommended') {
    const orderType = safeValue.order === 'asc' ? 'asc' : 'desc';
    const selectedCodes = Array.isArray(safeValue.selectedCodes) ? safeValue.selectedCodes : [];
    await query('DELETE FROM recommended_config');
    await query('INSERT INTO recommended_config (order_type, selected_codes) VALUES (?, ?)', [orderType, JSON.stringify(selectedCodes)]);
    await upsertPageConfig('recommended', { order: orderType, selectedCodes });
    return true;
  }

  if (key === 'terms') {
    await upsertPageConfig('terms_intro', {
      title: sanitizeText(safeValue.title) || 'Termos de Uso',
      intro: sanitizeText(safeValue.intro)
    });
    await query('DELETE FROM terms_sections');
    for (const [index, section] of (Array.isArray(safeValue.sections) ? safeValue.sections : []).entries()) {
      const title = sanitizeText(section?.title);
      const content = sanitizeText(section?.content);
      if (!title && !content) continue;
      await query(
        'INSERT INTO terms_sections (title, content, display_order) VALUES (?, ?, ?)',
        [title || `Seção ${index + 1}`, content, index + 1]
      );
    }
    return true;
  }

  if (key === 'privacy') {
    await upsertPageConfig('privacy_intro', {
      title: sanitizeText(safeValue.title) || 'Política de Privacidade',
      intro: sanitizeText(safeValue.intro),
      lastUpdate: sanitizeText(safeValue.lastUpdate)
    });
    await query('DELETE FROM privacy_sections');
    for (const [index, section] of (Array.isArray(safeValue.sections) ? safeValue.sections : []).entries()) {
      const title = sanitizeText(section?.title);
      const content = sanitizeText(section?.content);
      if (!title && !content) continue;
      await query(
        'INSERT INTO privacy_sections (title, content, display_order) VALUES (?, ?, ?)',
        [title || `Seção ${index + 1}`, content, index + 1]
      );
    }
    return true;
  }

  if (key === 'testimonials') {
    await upsertPageConfig('testimonials_header', {
      title: sanitizeText(safeValue.title) || 'O que nossos clientes dizem?',
      subtitle: sanitizeText(safeValue.subtitle)
    });
    await query('DELETE FROM testimonials');
    for (const [index, item] of (Array.isArray(safeValue.testimonials) ? safeValue.testimonials : []).entries()) {
      const name = sanitizeText(item?.name);
      const quote = sanitizeText(item?.quote);
      if (!name || !quote) continue;
      await query(
        'INSERT INTO testimonials (name, role, image, quote, display_order, active) VALUES (?, ?, ?, ?, ?, TRUE)',
        [name, sanitizeText(item?.role), sanitizeText(item?.image), quote, index + 1]
      );
    }
    return true;
  }

  if (key === 'banners') {
    await query('DELETE FROM banners');
    for (const [index, item] of (Array.isArray(safeValue.banners) ? safeValue.banners : []).entries()) {
      const imageUrl = sanitizeText(item?.imageUrl);
      const linkUrl = sanitizeText(item?.linkUrl);
      await query(
        `INSERT INTO banners (name, position, width, height, image_url, link_url, active, display_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sanitizeText(item?.name) || `Banner ${index + 1}`,
          sanitizeText(item?.position) || `banner-${index + 1}`,
          Number(item?.width || 1200),
          Number(item?.height || 200),
          imageUrl,
          linkUrl,
          imageUrl && linkUrl ? 1 : 0,
          index + 1
        ]
      );
    }
    return true;
  }

  if (key === 'brand_section') {
    await upsertPageConfig('brand_section', {
      title: sanitizeText(safeValue.title),
      subtitle: sanitizeText(safeValue.subtitle)
    });
    await query('DELETE FROM brand_section_options');
    for (const [index, option] of (Array.isArray(safeValue.options) ? safeValue.options : []).entries()) {
      const brandName = sanitizeText(option);
      if (!brandName) continue;
      await query(
        'INSERT INTO brand_section_options (brand_name, display_order) VALUES (?, ?)',
        [brandName, index + 1]
      );
    }
    return true;
  }

  if (key === 'footer') {
    await upsertPageConfig('footer', { description: sanitizeText(safeValue.description) });
    await query('DELETE FROM footer_social_icons');
    for (const [index, icon] of (Array.isArray(safeValue.socialIcons) ? safeValue.socialIcons : []).entries()) {
      await query(
        'INSERT INTO footer_social_icons (image, link, display_order) VALUES (?, ?, ?)',
        [sanitizeText(icon?.image), sanitizeText(icon?.link), index + 1]
      );
    }
    return true;
  }

  if (key === 'ad_banners') {
    await query('DELETE FROM ad_banners');
    for (const [bannerKey, banner] of Object.entries(safeValue || {})) {
      const result = await query(
        `INSERT INTO ad_banners (banner_key, enabled, layout, auto_rotate, rotate_interval)
         VALUES (?, ?, ?, ?, ?)`,
        [
          sanitizeText(bannerKey),
          banner?.enabled ? 1 : 0,
          Number(banner?.layout || 1),
          banner?.autoRotate ? 1 : 0,
          Number(banner?.rotateInterval || 5)
        ]
      );
      const adBannerId = result.insertId;
      for (const [slotIndex, slot] of (Array.isArray(banner?.slots) ? banner.slots : []).entries()) {
        await query(
          `INSERT INTO ad_banner_slots (ad_banner_id, slot_number, media_url, link_url, media_type)
           VALUES (?, ?, ?, ?, ?)`,
          [
            adBannerId,
            Number(slot?.id || slotIndex + 1),
            sanitizeText(slot?.mediaUrl),
            sanitizeText(slot?.linkUrl),
            sanitizeText(slot?.mediaType) === 'video' ? 'video' : 'image'
          ]
        );
      }
    }
    return true;
  }

  return false;
};

app.get('/api/pages/configs', async (_req, res) => {
  try {
    const configs = await getAllPageConfigs();
    res.json({ success: true, configs });
  } catch (error) {
    console.error('Erro ao carregar configs de páginas:', error);
    res.status(500).json({ message: 'Erro ao carregar configs de páginas' });
  }
});

app.get('/api/pages/config/:key', async (req, res) => {
  try {
    const key = sanitizeText(req.params.key);
    const configs = await getAllPageConfigs();
    if (!(key in configs)) {
      return res.status(404).json({ message: 'Configuração não encontrada' });
    }
    res.json({ success: true, value: configs[key] });
  } catch (error) {
    console.error('Erro ao carregar config:', error);
    res.status(500).json({ message: 'Erro ao carregar config' });
  }
});

app.put('/api/pages/config/:key', authenticate, requireAdmin, async (req, res) => {
  try {
    const key = sanitizeText(req.params.key);
    const value = req.body?.value;

    if (!key) {
      return res.status(400).json({ message: 'Chave de configuração inválida' });
    }

    const saved = await savePageConfigByKey(key, value);
    if (!saved) {
      return res.status(400).json({ message: 'Chave de configuração não suportada' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar config:', error);
    res.status(500).json({ message: 'Erro ao salvar config' });
  }
});

if (fs.existsSync(DIST_INDEX_FILE)) {
  app.use(express.static(DIST_DIR));
  app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    return res.sendFile(DIST_INDEX_FILE);
  });
} else {
  console.warn('Pasta dist não encontrada. Execute "npm run build" antes de subir em produção para servir o frontend.');
}

const startServer = async () => {
  try {
    await ensureDatabaseBootstrap();
    app.listen(PORT, () => {
      console.log(`API rodando em http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Falha ao inicializar banco de dados automaticamente:', error);
    process.exit(1);
  }
};

startServer();
