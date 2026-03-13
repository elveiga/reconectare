import React from 'react';

/**
 * Componente de Banner Publicitário
 * Só renderiza se tiver imageUrl e linkUrl preenchidos
 */
const AdBanner = ({ banner }) => {
  // Não renderiza se não tiver imagem ou link
  if (!banner?.imageUrl?.trim() || !banner?.linkUrl?.trim()) {
    return null;
  }

  return (
    <div className="w-full py-8 flex justify-center items-center bg-gray-50">
      <a
        href={banner.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block transition-opacity hover:opacity-90"
        aria-label={banner.name || 'Banner publicitário'}
      >
        <img
          src={banner.imageUrl}
          alt={banner.name || 'Banner publicitário'}
          className="max-w-full h-auto mx-auto"
          style={{
            maxWidth: `${banner.width}px`,
            maxHeight: `${banner.height}px`
          }}
          loading="lazy"
          decoding="async"
        />
      </a>
    </div>
  );
};

export default AdBanner;
