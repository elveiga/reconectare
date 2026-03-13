export const normalizeEnvValue = (value) => {
  const normalized = String(value ?? '').trim();

  if (
    normalized.length >= 2 &&
    ((normalized.startsWith('"') && normalized.endsWith('"')) ||
      (normalized.startsWith("'") && normalized.endsWith("'")))
  ) {
    return normalized.slice(1, -1).trim();
  }

  return normalized;
};

export const getEnvString = (name, fallback = '') => {
  const value = normalizeEnvValue(process.env[name]);
  return value || fallback;
};

export const getEnvNumber = (name, fallback) => {
  const value = normalizeEnvValue(process.env[name]);
  if (!value) return fallback;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};