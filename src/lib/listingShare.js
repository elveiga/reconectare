import { getRuntimeLogo } from '@/lib/logoSession';

const formatPrice = (price) => `R$ ${Number(price || 0).toLocaleString('pt-BR')}`;

const DEFAULT_LOGO_SVG = encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="420" height="120" viewBox="0 0 420 120">
    <rect width="420" height="120" rx="24" fill="rgba(255,255,255,0.92)"/>
    <text x="34" y="74" font-family="Inter, Poppins, Montserrat, Arial, sans-serif" font-size="44" font-weight="600" fill="#1a1a1a">Re</text>
    <text x="92" y="74" font-family="Inter, Poppins, Montserrat, Arial, sans-serif" font-size="44" font-weight="700" fill="#60a5fa">conect</text>
    <text x="245" y="74" font-family="Inter, Poppins, Montserrat, Arial, sans-serif" font-size="44" font-weight="600" fill="#1a1a1a">are</text>
  </svg>
`);

const DEFAULT_LOGO_DATA_URL = `data:image/svg+xml;charset=utf-8,${DEFAULT_LOGO_SVG}`;

const getExcerpt = (description) => {
  const normalized = String(description || '').replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return 'Confira este equipamento odontologico anunciado na Reconectare.';
  }
  if (normalized.length <= 120) {
    return normalized;
  }
  return `${normalized.slice(0, 120).trimEnd()}...`;
};

const getPrimaryImageUrl = (listing) => {
  if (Array.isArray(listing?.images) && listing.images.length > 0) {
    return listing.images[0];
  }
  return listing?.image || '';
};

const getAbsoluteUrl = (src) => new URL(src, window.location.origin).toString();

const fetchAsBlob = async (src) => {
  const response = await fetch(getAbsoluteUrl(src), { mode: 'cors', credentials: 'omit' });
  if (!response.ok) {
    throw new Error('Nao foi possivel baixar a imagem para compartilhamento.');
  }
  return response.blob();
};

const loadImage = (src) => new Promise((resolve, reject) => {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('Nao foi possivel carregar uma das imagens do compartilhamento.'));
  image.src = src;
});

const loadBlobImage = (blob) => {
  const objectUrl = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Nao foi possivel carregar a imagem temporaria do compartilhamento.'));
    };
    image.src = objectUrl;
  });
};

const getLogoSource = () => {
  const runtimeLogo = getRuntimeLogo();
  if (runtimeLogo && runtimeLogo.startsWith('data:image/')) {
    return runtimeLogo;
  }
  return DEFAULT_LOGO_DATA_URL;
};

const drawRoundedRect = (context, x, y, width, height, radius) => {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
};

const createWatermarkedBlob = async (imageUrl) => {
  const [baseImageBlob, logoBlob] = await Promise.all([
    fetchAsBlob(imageUrl),
    fetchAsBlob(getLogoSource())
  ]);

  const [baseImage, logoImage] = await Promise.all([
    loadBlobImage(baseImageBlob),
    loadBlobImage(logoBlob)
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = baseImage.naturalWidth || baseImage.width;
  canvas.height = baseImage.naturalHeight || baseImage.height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Nao foi possivel preparar a imagem para compartilhamento.');
  }

  context.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

  const logoWidth = Math.min(canvas.width * 0.22, 260);
  const logoHeight = logoWidth * (logoImage.height / logoImage.width);
  const padding = Math.max(20, canvas.width * 0.025);
  const boxPadding = Math.max(10, canvas.width * 0.012);
  const boxX = canvas.width - logoWidth - padding - boxPadding * 2;
  const boxY = canvas.height - logoHeight - padding - boxPadding * 2;

  context.save();
  context.fillStyle = 'rgba(255,255,255,0.72)';
  drawRoundedRect(
    context,
    boxX,
    boxY,
    logoWidth + boxPadding * 2,
    logoHeight + boxPadding * 2,
    18
  );
  context.fill();
  context.globalAlpha = 0.94;
  context.drawImage(
    logoImage,
    boxX + boxPadding,
    boxY + boxPadding,
    logoWidth,
    logoHeight
  );
  context.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Nao foi possivel gerar a imagem com marca d\'agua.'));
      }
    }, 'image/jpeg', 0.92);
  });
};

const createOriginalImageFile = async (listing) => {
  const imageUrl = getPrimaryImageUrl(listing);
  if (!imageUrl) return null;

  const blob = await fetchAsBlob(imageUrl);
  const mimeType = blob.type || 'image/jpeg';
  const extension = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
  const fileName = `${listing?.code || 'anuncio'}.${extension}`;
  return new File([blob], fileName, { type: mimeType });
};

const canShareFiles = (files) => {
  return Array.isArray(files)
    && files.length > 0
    && typeof navigator !== 'undefined'
    && typeof navigator.canShare === 'function'
    && navigator.canShare({ files });
};

export const buildListingUrl = (listing) => {
  const baseUrl = window.location.origin;
  if (listing?.code) {
    return `${baseUrl}/anuncios/${listing.code}`;
  }
  return window.location.href;
};

export const buildListingShareText = (listing, url = buildListingUrl(listing)) => {
  return [
    listing?.name || 'Equipamento odontologico',
    '',
    getExcerpt(listing?.description),
    '',
    `Por: ${formatPrice(listing?.price)}`,
    '',
    `Confira aqui 👉: ${url}`
  ].join('\n');
};

const createShareFile = async (listing) => {
  const imageUrl = getPrimaryImageUrl(listing);
  if (!imageUrl) return null;

  try {
    const blob = await createWatermarkedBlob(imageUrl);
    const fileName = `${listing?.code || 'anuncio'}.jpg`;
    const file = new File([blob], fileName, { type: 'image/jpeg' });

    if (canShareFiles([file])) {
      return [file];
    }
  } catch (_error) {
    // Falls back below to the original image if watermark composition fails.
  }

  try {
    const originalFile = await createOriginalImageFile(listing);
    if (originalFile && canShareFiles([originalFile])) {
      return [originalFile];
    }
  } catch (_error) {
    // Text-only share continues below when file sharing is unavailable.
  }

  return null;
};

export const shareListing = async (listing) => {
  const url = buildListingUrl(listing);
  const text = buildListingShareText(listing, url);
  const title = listing?.name || 'Equipamento odontologico';

  try {
    if (navigator.share) {
      const files = await createShareFile(listing).catch(() => null);

      const shareData = files?.length
        ? { title, text, files }
        : { title, text };

      await navigator.share(shareData);
      return { status: 'shared' };
    }

    await navigator.clipboard.writeText(text);
    return { status: 'copied' };
  } catch (error) {
    if (error?.name === 'AbortError') {
      return { status: 'cancelled' };
    }

    try {
      await navigator.clipboard.writeText(text);
      return { status: 'copied' };
    } catch (_copyError) {
      window.prompt('Copie a mensagem para compartilhar:', text);
      return { status: 'prompted' };
    }
  }
};
