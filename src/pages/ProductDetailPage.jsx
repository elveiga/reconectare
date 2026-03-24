import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { MapPin, ArrowLeft, ChevronLeft, ChevronRight, X } from 'lucide-react';
import ListingCard from '@/components/ListingCard';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80';

const ProductDetailPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { listings } = useData();

  // Garantir que, ao abrir um detalhe de produto, a página role para o topo
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      window.scrollTo(0, 0);
    }
  }, [code]);


  const listing = listings.find((l) => l.code === code);

  const images = listing?.images?.length
    ? listing.images
    : [listing?.image || FALLBACK_IMAGE];

  const [selectedImage, setSelectedImage] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0); // 0 = normal, 1 = 1.5x, 2 = 2.5x
  const [touchStart, setTouchStart] = useState(null);
  const [pinchDistance, setPinchDistance] = useState(null);

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-3">
            Equipamento não encontrado
          </h1>
          <button
            onClick={() => navigate('/anuncios')}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Voltar para anúncios
          </button>
        </div>
      </div>
    );
  }

  const relatedListings = listings
    .filter(
      (l) =>
        l.type === listing.type &&
        l.id !== listing.id &&
        l.status === 'Disponível'
    )
    .slice(0, 4);

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

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(
      `Olá, tenho interesse no equipamento ${listing.name} - ${listing.code}`
    );

    window.open(
      `https://wa.me/${listing.seller.whatsapp}?text=${message}`,
      '_blank'
    );
  };

  const handlePreviousImage = () => {
    setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setImageError(false);
  };

  const handleNextImage = () => {
    setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setImageError(false);
  };

  const handleCycleZoom = () => {
    setZoomLevel((prev) => (prev === 2 ? 0 : prev + 1));
  };

  const getZoomScale = () => {
    switch (zoomLevel) {
      case 1:
        return 1.5;
      case 2:
        return 2.5;
      default:
        return 1;
    }
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setTouchStart(e.touches[0].clientX);
    }
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setPinchDistance(distance);
    }
  };

  const handleTouchEnd = (e) => {
    if (!touchStart || e.changedTouches.length !== 1) {
      setTouchStart(null);
      return;
    }

    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNextImage();
      } else {
        handlePreviousImage();
      }
    }

    setTouchStart(null);
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && pinchDistance) {
      const newDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (newDistance > pinchDistance + 10) {
        setZoomLevel(2);
      } else if (newDistance < pinchDistance - 10) {
        setZoomLevel(0);
      }
    }
  };

  const currentImage =
    imageError || !images[selectedImage]
      ? FALLBACK_IMAGE
      : images[selectedImage];

  const usingFallback = currentImage === FALLBACK_IMAGE;

  return (
    <>
      <Helmet>
        <title>{listing.name} - Reconectare</title>
        <meta name="description" content={listing.description} />
      </Helmet>

      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4">

          {/* VOLTAR */}
          <button
            onClick={() => navigate('/anuncios')}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para anúncios
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-14">

            {/* GALERIA */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-white rounded-xl overflow-hidden shadow-md mb-3 relative group cursor-pointer">
                {!usingFallback && (
                  <button
                    onClick={() => setLightboxOpen(true)}
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/30 transition-opacity z-10 flex items-center justify-center"
                  >
                    <span className="text-white text-sm font-semibold">Clique para ampliar</span>
                  </button>
                )}

                <img
                  src={currentImage}
                  alt={listing.name}
                  onError={() => setImageError(true)}
                  onClick={() => !usingFallback && setLightboxOpen(true)}
                  className={`w-full aspect-[4/3] object-contain bg-gradient-to-b from-gray-50 to-white p-2 cursor-pointer ${
                    usingFallback ? 'opacity-0' : ''
                  }`}
                />

                {usingFallback && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white">
                    <span className="text-sm text-gray-500">
                      Imagens disponíveis em breve…
                    </span>
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-3">
                  {images.map((img, idx) => (
                    <button
                      type="button"
                      key={`${img}-${idx}`}
                      onClick={() => {
                        setSelectedImage(idx);
                        setImageError(false);
                      }}
                      className={`rounded border overflow-hidden ${selectedImage === idx ? 'border-gray-900' : 'border-gray-200'}`}
                    >
                      <img src={img} alt={`Miniatura ${idx + 1}`} className="w-full h-16 object-contain bg-gray-50 p-1" />
                    </button>
                  ))}
                </div>
              )}

              {listing.videoUrl && (
                <div className="bg-white rounded-xl overflow-hidden shadow-md">
                  <video src={listing.videoUrl} controls className="w-full" />
                </div>
              )}
            </motion.div>

            {/* INFORMAÇÕES */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div
                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${getStatusColor(
                  listing.status
                )}`}
              >
                {listing.status}
              </div>

              <h1 className="text-2xl md:text-3xl font-bold mb-3">
                {listing.name}
              </h1>

              <p className="text-3xl font-bold text-gray-900 mb-4">
                R$ {listing.price.toLocaleString('pt-BR')}
              </p>

              <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
                <MapPin className="w-4 h-4" />
                {listing.location}
              </div>

              {/* DESCRIÇÃO */}
              <div className="bg-gray-50 rounded-lg p-5 mb-6">
                <h2 className="text-lg font-bold mb-3">Descrição</h2>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {listing.description}
                </p>
              </div>

              {/* ESPECIFICAÇÕES */}
              <div className="bg-gray-50 rounded-lg p-5 mb-6">
                <h2 className="text-lg font-bold mb-3">
                  Especificações técnicas
                </h2>

                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-gray-600 flex-shrink-0">Código</dt>
                    <dd className="font-medium text-gray-900 font-mono text-right">
                      {listing.code}
                    </dd>
                  </div>

                  <div className="flex justify-between gap-2">
                    <dt className="text-gray-600 flex-shrink-0">Tipo</dt>
                    <dd className="font-medium text-gray-900 text-right">
                      {listing.type}
                    </dd>
                  </div>

                  <div className="flex justify-between gap-2">
                    <dt className="text-gray-600 flex-shrink-0">Marca</dt>
                    <dd className="font-medium text-gray-900 text-right">
                      {listing.specs?.Marca || listing.brand}
                    </dd>
                  </div>

                  <div className="flex justify-between gap-2">
                    <dt className="text-gray-600 flex-shrink-0">Modelo</dt>
                    <dd className="font-medium text-gray-900 text-right">
                      {listing.model}
                    </dd>
                  </div>

                  {Object.entries(listing.specs || {})
                    .filter(([key]) => key !== 'Marca' && key !== 'Modelo')
                    .map(([key, value]) => (
                      <div key={key} className="flex justify-between gap-2">
                        <dt className="text-gray-600 flex-shrink-0">{key}</dt>
                        <dd className="font-medium text-gray-900 text-right">
                          {value}
                        </dd>
                      </div>
                    ))}
                </dl>
              </div>

              {listing.status === 'Disponível' && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleWhatsAppClick}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold shadow-md inline-flex items-center justify-center gap-2"
                >
                  <img src="/WhatsApplogo.svg" alt="WhatsApp" className="w-4 h-4" />
                  Falar no WhatsApp
                </motion.button>
              )}
            </motion.div>
          </div>

          {/* PRODUTOS SIMILARES */}
          {relatedListings.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-5">
                Produtos similares
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-[15px]">
                {relatedListings.map((item) => (
                  <ListingCard
                    key={item.id}
                    listing={item}
                    compact
                    showWhatsapp={false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LIGHTBOX MODAL */}
      {lightboxOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setLightboxOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setLightboxOpen(false);
            if (e.key === 'ArrowLeft') handlePreviousImage();
            if (e.key === 'ArrowRight') handleNextImage();
          }}
          tabIndex={0}
          className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxOpen(false);
            }}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-60"
          >
            <X className="w-8 h-8" />
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
            className="relative flex items-center justify-center flex-1 w-full max-w-4xl"
          >
            {/* Imagem com zoom */}
            <motion.img
              src={currentImage}
              alt={listing.name}
              onClick={handleCycleZoom}
              className={`max-w-full max-h-[70vh] object-contain transition-transform duration-300 ${
                zoomLevel > 0 ? 'cursor-zoom-out' : 'cursor-zoom-in'
              }`}
              style={{
                scale: getZoomScale(),
                transformOrigin: 'center'
              }}
            />

            {/* Seta Esquerda */}
            {images.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreviousImage();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Seta Direita */}
            {images.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextImage();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Contador - Bem abaixo da imagem */}
          {images.length > 1 && (
            <div className="mt-6 bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm">
              {selectedImage + 1} de {images.length}
            </div>
          )}
        </motion.div>
      )}
    </>
  );
};

export default ProductDetailPage;