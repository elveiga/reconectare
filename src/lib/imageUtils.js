/**
 * Otimiza URLs de imagens para melhor performance
 */

export const optimizeImageUrl = (url, options = {}) => {
  if (!url) return null;

  const {
    width = 800,
    quality = 75,
    format = 'auto',
  } = options;

  // Para URLs do Unsplash
  if (url.includes('unsplash.com')) {
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?w=${width}&q=${quality}&auto=${format}`;
  }

  // Para URLs do próprio servidor, se houver cdn
  if (url.startsWith('http')) {
    return url;
  }

  return url;
};

/**
 * Hook para pré-carregar imagens
 */
export const preloadImage = (src) => {
  if (!src) return;
  const img = new Image();
  img.src = src;
};

/**
 * Gera placeholder blur para imagens
 */
export const getPlaceholderStyle = (isLoading) => ({
  background: isLoading 
    ? 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)'
    : 'transparent',
  backgroundSize: isLoading ? '200% 100%' : 'auto',
  animation: isLoading ? 'pulse 2s infinite' : 'none',
});
