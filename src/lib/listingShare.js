const formatPrice = (price) => `R$ ${Number(price || 0).toLocaleString('pt-BR')}`;

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

  const absoluteUrl = new URL(imageUrl, window.location.origin).toString();
  const response = await fetch(absoluteUrl);
  if (!response.ok) {
    throw new Error('Nao foi possivel carregar a imagem principal para compartilhamento.');
  }

  const blob = await response.blob();
  const mimeType = blob.type || 'image/jpeg';
  const extension = mimeType.includes('png') ? 'png' : 'jpg';
  const fileName = `${listing?.code || 'anuncio'}.${extension}`;
  const file = new File([blob], fileName, { type: mimeType });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    return [file];
  }

  return null;
};

export const shareListing = async (listing) => {
  const url = buildListingUrl(listing);
  const text = buildListingShareText(listing, url);
  const title = listing?.name || 'Equipamento odontologico';

  try {
    if (navigator.share) {
      let files;
      try {
        files = await createShareFile(listing);
      } catch (_error) {
        files = null;
      }

      const shareData = files?.length
        ? { title, text, url, files }
        : { title, text, url };

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
