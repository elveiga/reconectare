import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Award } from 'lucide-react';
// using project root WhatsApp logo placed at /WhatsApplogo.svg

const FALLBACK_TEXT = 'Imagem disponível em breve…';

const ListingCard = ({
  listing,
  compact = false,
  showWhatsapp = true,
  inlineWhatsapp = false,
}) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const containerRef = useRef(null);
  const [portraitTransform, setPortraitTransform] = useState(null);

  const handleImageLoad = (e) => {
    const img = e.currentTarget;
    if (img.naturalHeight > img.naturalWidth * 1.2 && containerRef.current) {
      const W = containerRef.current.offsetWidth;
      const H = containerRef.current.offsetHeight;
      setPortraitTransform({ W, H });
    }
    setImageLoaded(true);
  };

  const hasImage = listing.image && !imageError;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Disponível':
        return 'bg-green-100 text-green-800';
      case 'Reservado':
        return 'bg-yellow-100 text-yellow-800';
      case 'Vendido':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleWhatsAppClick = (e) => {
    e.stopPropagation();
    window.open(
      `https://wa.me/5511913474725?text=Tenho%20interesse%20no%20anúncio:%20${encodeURIComponent(
        listing.name
      )}`,
      '_blank'
    );
  };

  const cardHeight = compact ? 'h-[190px]' : 'h-[300px]';

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.15 }}
      onClick={() => navigate(`/anuncios/${listing.code}`)}
      className={`bg-white rounded-lg shadow-sm hover:shadow-md cursor-pointer overflow-hidden w-full ${cardHeight} flex flex-col`}
    >
      {/* IMAGEM / FALLBACK */}
      <div ref={containerRef} className="relative h-[65%] flex items-center justify-center bg-gradient-to-t from-gray-100 to-white overflow-hidden">

        {hasImage ? (
          <>
            <img
              src={listing.image}
              alt={listing.name}
              loading="lazy"
              decoding="async"
              onError={() => setImageError(true)}
              onLoad={handleImageLoad}
              className={`transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              } ${portraitTransform ? 'absolute object-cover' : 'w-full h-full object-cover'}`}
              style={portraitTransform ? {
                width: `${portraitTransform.H}px`,
                height: `${portraitTransform.W}px`,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(90deg)',
              } : undefined}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs text-gray-500 text-center px-4">
              {FALLBACK_TEXT}
            </span>
          </div>
        )}

        {/* STATUS */}
        <div className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-semibold bg-white/90">
          <span className={getStatusColor(listing.status)}>
            {listing.status}
          </span>
        </div>

        {/* PREMIUM */}
        {listing.isPremium && (
          <div className="absolute top-2 left-2 bg-amber-500 text-white px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1">
            <Award className="w-3 h-3" />
            Premium
          </div>
        )}

        {/* PREÇO */}
        <div className="absolute bottom-1 left-2 text-sm font-bold text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.9),0_0_8px_rgba(0,0,0,0.6)]">
          R$ {listing.price.toLocaleString('pt-BR')}
        </div>

        {/* COD */}
        {listing.code && (
          <div className="absolute bottom-1 right-2 text-[10px] bg-black/70 text-white px-2 py-0.5 rounded font-mono">
            {listing.code}
          </div>
        )}
      </div>

      {/* CONTEÚDO */}
      <div className="flex flex-col flex-1 p-2">
        <div className="flex items-start gap-2">
          <h3 className="text-xs font-semibold text-gray-900 line-clamp-2 flex-1">
            {listing.name}
          </h3>

          {inlineWhatsapp && showWhatsapp && (
            <button
              onClick={handleWhatsAppClick}
              aria-label="Abrir WhatsApp"
              className="bg-green-500 hover:bg-green-600 p-1.5 rounded-full shadow-sm"
            >
              <img src="/WhatsApplogo.svg" alt="WhatsApp" className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* MARCA */}
        {listing.brand && (
          <span className="text-[11px] text-gray-500 mt-1">
            Marca: {listing.brand}
          </span>
        )}

        {!inlineWhatsapp && showWhatsapp && (
          <div className="mt-auto flex justify-end">
            <button
              onClick={handleWhatsAppClick}
              aria-label="Abrir WhatsApp"
              className="bg-green-500 hover:bg-green-600 p-2 rounded-full shadow-md"
            >
              <img src="/WhatsApplogo.svg" alt="WhatsApp" className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ListingCard;
