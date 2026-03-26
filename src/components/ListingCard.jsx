import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Award, Share2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { shareListing } from '@/lib/listingShare';
// using project root WhatsApp logo placed at /WhatsApplogo.svg

const FALLBACK_TEXT = 'Imagem disponível em breve…';
const SLIDE_INTERVAL_MS = 2000; // ms between auto-slides on hover
const MAX_FREE_SLIDES = 3;      // after this many steps blur overlay appears

const ListingCard = ({
  listing,
  compact = false,
  showWhatsapp = true,
  inlineWhatsapp = false,
  showShare = false,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const containerRef = useRef(null);
  const [portraitTransform, setPortraitTransform] = useState(null);

  // ── Carousel state ───────────────────────────────────────────────────────
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const intervalRef = useRef(null);
  const swipeTouchRef = useRef(null); // stores X on touchstart
  const didSwipeRef = useRef(false);  // prevents click-navigation after swipe

  const allImages = listing.images?.length
    ? listing.images
    : listing.image
    ? [listing.image]
    : [];
  const hasMultipleImages = allImages.length > 1;

  // Clamp displayed index to available images
  const clampedIndex = Math.max(0, Math.min(currentImageIndex, allImages.length - 1));
  const displayImage = allImages[clampedIndex];
  const hasImage = !!displayImage && !imageError;

  // Blur overlay triggers after MAX_FREE_SLIDES steps (only for multi-image listings)
  const showBlurOverlay = hasMultipleImages && currentImageIndex >= MAX_FREE_SLIDES;

  // ── Interval helpers ─────────────────────────────────────────────────────
  const stopSlideshow = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => () => stopSlideshow(), [stopSlideshow]);

  // ── Desktop hover cycling ────────────────────────────────────────────────
  const handleMouseEnter = useCallback(() => {
    if (!hasMultipleImages) return;
    stopSlideshow();
    intervalRef.current = setInterval(() => {
      setCurrentImageIndex(prev =>
        prev >= MAX_FREE_SLIDES ? prev : prev + 1
      );
    }, SLIDE_INTERVAL_MS);
  }, [hasMultipleImages, stopSlideshow]);

  const handleMouseLeave = useCallback(() => {
    stopSlideshow();
    setCurrentImageIndex(0);
  }, [stopSlideshow]);

  // ── Mobile swipe ─────────────────────────────────────────────────────────
  const handleTouchStart = useCallback((e) => {
    if (!hasMultipleImages) return;
    swipeTouchRef.current = e.touches[0].clientX;
  }, [hasMultipleImages]);

  const handleTouchEnd = useCallback((e) => {
    if (swipeTouchRef.current === null) return;
    const delta = swipeTouchRef.current - e.changedTouches[0].clientX;
    swipeTouchRef.current = null;
    if (Math.abs(delta) < 40) return; // too short → treat as tap
    didSwipeRef.current = true;       // block the subsequent click event
    setCurrentImageIndex(prev =>
      delta > 0
        ? Math.min(prev + 1, MAX_FREE_SLIDES) // swipe left → next
        : Math.max(prev - 1, 0)               // swipe right → prev
    );
  }, []);

  // ── Image load / portrait detection ──────────────────────────────────────
  const handleImageLoad = useCallback((e) => {
    const img = e.currentTarget;
    // Portrait rotation only for single-image cards at index 0
    if (!hasMultipleImages && currentImageIndex === 0 &&
        img.naturalHeight > img.naturalWidth * 1.2 && containerRef.current) {
      const W = containerRef.current.offsetWidth;
      const H = containerRef.current.offsetHeight;
      setPortraitTransform({ W, H });
    } else {
      setPortraitTransform(null);
    }
    setImageLoaded(true);
  }, [hasMultipleImages, currentImageIndex]);

  // Only apply portrait transform when single image and detected
  const applyPortrait = !hasMultipleImages && !!portraitTransform;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Disponível': return 'bg-green-100 text-green-800';
      case 'Reservado':  return 'bg-yellow-100 text-yellow-800';
      case 'Vendido':    return 'bg-red-100 text-red-800';
      default:           return 'bg-gray-100 text-gray-800';
    }
  };

  const handleWhatsAppClick = (e) => {
    e.stopPropagation();
    window.open(
      `https://wa.me/5511913474725?text=Tenho%20interesse%20no%20anúncio:%20${encodeURIComponent(listing.name)}`,
      '_blank'
    );
  };

  const handleShareClick = async (e) => {
    e.stopPropagation();
    const result = await shareListing(listing);
    if (result.status === 'copied') {
      toast({ title: 'Conteudo copiado', description: 'A mensagem do anuncio foi copiada para compartilhar.' });
    }
    if (result.status === 'prompted') {
      toast({ title: 'Compartilhamento manual', description: 'Se necessario, copie o texto exibido para compartilhar.' });
    }
  };

  const cardHeight = compact ? 'h-[190px]' : 'h-[300px]';

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.15 }}
      onClick={() => {
        if (didSwipeRef.current) { didSwipeRef.current = false; return; }
        navigate(`/anuncios/${listing.code}`);
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`bg-white rounded-lg shadow-sm hover:shadow-md cursor-pointer overflow-hidden w-full ${cardHeight} flex flex-col`}
    >
      {/* ── IMAGE AREA ─────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="relative h-[65%] flex items-center justify-center bg-gradient-to-t from-gray-100 to-white overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {hasImage ? (
          <>
            {/* Crossfade carousel */}
            <AnimatePresence mode="sync" initial={false}>
              <motion.img
                key={clampedIndex}
                src={displayImage}
                alt={listing.name}
                loading="lazy"
                decoding="async"
                onError={() => setImageError(true)}
                onLoad={handleImageLoad}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: showBlurOverlay ? 0.5 : 1,
                  filter: showBlurOverlay ? 'blur(5px)' : 'blur(0px)',
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 object-cover"
                style={applyPortrait ? {
                  position: 'absolute',
                  width: `${portraitTransform.H}px`,
                  height: `${portraitTransform.W}px`,
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%) rotate(90deg)',
                  objectFit: 'cover',
                } : {
                  width: '100%',
                  height: '100%',
                }}
              />
            </AnimatePresence>

            {/* Loading skeleton – only on first image before first load */}
            {!imageLoaded && currentImageIndex === 0 && (
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse z-10" />
            )}

            {/* "Ver mais" blur overlay */}
            {showBlurOverlay && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
              >
                <span className="bg-white/90 text-gray-900 text-[11px] font-semibold px-3 py-2 rounded-full shadow-lg text-center leading-snug">
                  Clique aqui para<br />ver mais...
                </span>
              </motion.div>
            )}

            {/* Slide dot indicators */}
            {hasMultipleImages && (
              <div className="absolute bottom-7 left-1/2 -translate-x-1/2 flex gap-1 z-10 pointer-events-none">
                {Array.from({ length: Math.min(allImages.length, MAX_FREE_SLIDES + 1) }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-full transition-all duration-200 ${
                      i === clampedIndex
                        ? 'w-2 h-2 bg-white shadow'
                        : 'w-1.5 h-1.5 bg-white/50'
                    }`}
                  />
                ))}
              </div>
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
        <div className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-semibold bg-white/90 z-30">
          <span className={getStatusColor(listing.status)}>
            {listing.status}
          </span>
        </div>

        {/* PREMIUM */}
        {listing.isPremium && (
          <div className="absolute top-2 left-2 bg-amber-500 text-white px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 z-30">
            <Award className="w-3 h-3" />
            Premium
          </div>
        )}

        {/* PREÇO */}
        <div className="absolute bottom-1 left-2 text-sm font-bold text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.9),0_0_8px_rgba(0,0,0,0.6)] z-30">
          R$ {listing.price.toLocaleString('pt-BR')}
        </div>

        {/* COD */}
        {listing.code && (
          <div className="absolute bottom-1 right-2 text-[10px] bg-black/70 text-white px-2 py-0.5 rounded font-mono z-30">
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

          <div className="flex items-center gap-1">
            {showShare && (
              <button
                onClick={handleShareClick}
                aria-label="Compartilhar anuncio"
                className="bg-gray-900 hover:bg-black p-1.5 rounded-full shadow-sm text-white"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            )}

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
        </div>

        {/* MARCA */}
        {listing.brand && (
          <span className="text-[11px] text-gray-500 mt-1">
            Marca: {listing.brand}
          </span>
        )}

        {(!inlineWhatsapp && (showWhatsapp || showShare)) && (
          <div className="mt-auto flex justify-end gap-2">
            {showShare && (
              <button
                onClick={handleShareClick}
                aria-label="Compartilhar anuncio"
                className="bg-gray-900 hover:bg-black p-2 rounded-full shadow-md text-white"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}

            {showWhatsapp && (
              <button
                onClick={handleWhatsAppClick}
                aria-label="Abrir WhatsApp"
                className="bg-green-500 hover:bg-green-600 p-2 rounded-full shadow-md"
              >
                <img src="/WhatsApplogo.svg" alt="WhatsApp" className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ListingCard;
