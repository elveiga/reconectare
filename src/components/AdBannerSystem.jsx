import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useUsers } from '@/contexts/DataUser';
import { useDataPages } from '@/contexts/DataPages';
import { uploadMediaRequest } from '@/services/mediaApi';
import { getRuntimeToken } from '@/lib/authSession';
import FilePicker from '@/components/ui/file-picker';

const AdBannerSystem = ({ bannerId, position }) => {
  const { currentUser } = useUsers();
  const { adBannersConfig, updateAdBannersConfig } = useDataPages();
  const isAdmin = currentUser?.role === 'Admin';

  const [isEditing, setIsEditing] = useState(false);
  const [editing, setEditing] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [uploadingSlotIndex, setUploadingSlotIndex] = useState(null);
  const bannerRef = useRef(null);

  const banner = adBannersConfig?.[bannerId] || {
    enabled: false,
    layout: 1, // 1, 2 or 3 columns
    autoRotate: false,
    rotateInterval: 5, // seconds
    slots: [
      { id: 1, mediaUrl: '', linkUrl: '', mediaType: 'image' },
      { id: 2, mediaUrl: '', linkUrl: '', mediaType: 'image' },
      { id: 3, mediaUrl: '', linkUrl: '', mediaType: 'image' }
    ]
  };

  useEffect(() => {
    // Cria uma cópia profunda do banner para edição
    setEditing(JSON.parse(JSON.stringify(banner)));
  }, [JSON.stringify(banner)]);

  // Observar dimensões do banner
  useEffect(() => {
    if (!bannerRef.current || !isAdmin) return;

    const updateDimensions = () => {
      if (bannerRef.current) {
        const rect = bannerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        });
      }
    };

    // Atualizar inicialmente
    updateDimensions();

    // Observar mudanças de tamanho
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(bannerRef.current);

    // Observar mudanças de janela
    window.addEventListener('resize', updateDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, [isAdmin]);

  // Auto-rotate logic
  useEffect(() => {
    if (!isAdmin && banner.enabled && banner.autoRotate && banner.layout > 1) {
      // Filtra slots válidos para o carousel
      const validSlots = banner.slots.filter(slot => slot.mediaUrl?.trim()).slice(0, banner.layout);
      
      if (validSlots.length > 0) {
        const interval = setInterval(() => {
          setCurrentSlide((prev) => {
            return (prev + 1) % validSlots.length;
          });
        }, banner.rotateInterval * 1000);

        return () => clearInterval(interval);
      }
    }
  }, [banner, isAdmin]);

  // Se não é admin e banner não está habilitado, não renderiza
  if (!isAdmin && !banner.enabled) {
    return null;
  }

  // Filtra slots com mídia válida
  const validSlots = banner.slots.filter(slot => slot.mediaUrl?.trim());

  // Se não é admin e não há slots válidos, não renderiza
  if (!isAdmin && validSlots.length === 0) {
    return null;
  }

  const handleSave = () => {
    if (!window.confirm('Tem certeza que deseja salvar as alterações?')) return;
    updateAdBannersConfig({
      ...adBannersConfig,
      [bannerId]: editing
    });
    setIsEditing(false);
  };

  const handleSlotMediaUpload = async (slotIdx, event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const token = getRuntimeToken();
    if (!token) {
      alert('Faça login para enviar mídia.');
      return;
    }

    try {
      setUploadingSlotIndex(slotIdx);
      const upload = await uploadMediaRequest(token, file);
      const newSlots = [...(editing?.slots || [])];
      newSlots[slotIdx] = {
        ...newSlots[slotIdx],
        mediaUrl: upload.url
      };
      setEditing((prev) => ({ ...prev, slots: newSlots }));
    } catch (error) {
      alert(error?.message || 'Falha ao enviar mídia.');
    } finally {
      setUploadingSlotIndex(null);
    }
  };

  const renderBannerContent = () => {
    // Se carousel está ativo, mostra apenas 1 banner em largura total com animação
    if (banner.autoRotate && banner.layout > 1) {
      const carouselSlots = validSlots.slice(0, banner.layout);
      const currentSlot = carouselSlots[currentSlide % carouselSlots.length];

      if (!currentSlot) return null;

      return (
        <div className="relative w-full rounded-lg overflow-hidden bg-gray-100">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              {currentSlot.linkUrl ? (
                <a href={currentSlot.linkUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
                  {currentSlot.mediaType === 'video' ? (
                    <video
                      src={currentSlot.mediaUrl}
                      className="w-full h-auto"
                      autoPlay
                      muted
                      loop
                    />
                  ) : (
                    <img
                      src={currentSlot.mediaUrl}
                      alt={`Anúncio ${currentSlide + 1}`}
                      className="w-full h-auto"
                    />
                  )}
                </a>
              ) : (
                <>
                  {currentSlot.mediaType === 'video' ? (
                    <video
                      src={currentSlot.mediaUrl}
                      className="w-full h-auto"
                      autoPlay
                      muted
                      loop
                    />
                  ) : (
                    <img
                      src={currentSlot.mediaUrl}
                      alt={`Anúncio ${currentSlide + 1}`}
                      className="w-full h-auto"
                    />
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      );
    }

    // Layout estático (sem carousel)
    const slotsToShow = validSlots.slice(0, banner.layout);

    return (
      <div className={`grid gap-4 ${banner.layout === 1 ? 'grid-cols-1' : banner.layout === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
        {slotsToShow.map((slot, idx) => (
          <div key={slot.id || idx} className="w-full rounded-lg overflow-hidden bg-gray-100">
            {slot.linkUrl ? (
              <a href={slot.linkUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
                {slot.mediaType === 'video' ? (
                  <video
                    src={slot.mediaUrl}
                    className="w-full h-auto"
                    autoPlay
                    muted
                    loop
                  />
                ) : (
                  <img
                    src={slot.mediaUrl}
                    alt={`Anúncio ${idx + 1}`}
                    className="w-full h-auto"
                  />
                )}
              </a>
            ) : (
              <>
                {slot.mediaType === 'video' ? (
                  <video
                    src={slot.mediaUrl}
                    className="w-full h-auto"
                    autoPlay
                    muted
                    loop
                  />
                ) : (
                  <img
                    src={slot.mediaUrl}
                    alt={`Anúncio ${idx + 1}`}
                    className="w-full h-auto"
                  />
                )}
              </>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div ref={bannerRef} className={`relative ${isAdmin ? 'border-2 border-blue-300 rounded-lg p-4 min-h-[100px]' : ''}`}>
        {isAdmin && (
          <>
            <div className="text-xs text-blue-700 mb-2">
              Banner de Anúncio - {position}
              {!banner.enabled && ' (Desabilitado)'}
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="absolute top-2 right-2 text-xs px-3 py-1 rounded border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
            >
              Editar
            </button>
            {/* Indicador de dimensões */}
            <div className="absolute bottom-2 right-2 text-[10px] px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono">
              {dimensions.width}px × {dimensions.height}px
            </div>
          </>
        )}

        {(isAdmin || (banner.enabled && validSlots.length > 0)) && renderBannerContent()}
      </div>

      {/* Modal de Edição */}
      {isAdmin && isEditing && editing && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-6 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded shadow-lg p-6 relative my-6">
            <button
              onClick={() => {
                setEditing(JSON.parse(JSON.stringify(banner)));
                setIsEditing(false);
              }}
              className="absolute right-3 top-3 p-2 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold mb-2">Editar Banner - {position}</h3>
            <div className="text-xs text-gray-500 mb-4">
              Use a largura real da imagem (ex.: 1216px × 100px) — altura livre, máx. 500px
            </div>

            {/* Enabled Toggle */}
            <div className="mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.enabled}
                  onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Habilitar este banner</span>
              </label>
            </div>

            {/* Layout Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                LAYOUT DO BANNER
              </label>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setEditing({ ...editing, layout: num })}
                    className={`p-4 border-2 rounded-lg text-center transition-all ${
                      editing.layout === num
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-xs text-gray-600 mb-2">
                      {num === 1 ? '1 Banner' : `${num} Banners`}
                    </div>
                    <div className={`grid gap-1 ${num === 1 ? 'grid-cols-1' : `grid-cols-${num}`}`}>
                      {Array.from({ length: num }).map((_, i) => (
                        <div key={i} className="h-8 bg-gray-300 rounded"></div>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Auto Rotate (only for 2 or 3 layout) */}
            {editing.layout > 1 && (
              <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={editing.autoRotate}
                    onChange={(e) => setEditing({ ...editing, autoRotate: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Rotação automática (Carousel)</span>
                </label>

                {editing.autoRotate && (
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Intervalo de rotação (segundos)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={editing.rotateInterval}
                      onChange={(e) => setEditing({ ...editing, rotateInterval: parseInt(e.target.value) || 5 })}
                      className="border rounded px-3 py-2 w-32 text-sm"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Slots Configuration */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                CONFIGURAÇÃO DOS BANNERS
              </label>

              {(editing.slots || []).slice(0, editing.layout).map((slot, idx) => (
                <div key={slot.id} className="border rounded-lg p-4 mb-4 bg-gray-50">
                  <h4 className="text-sm font-semibold mb-3">Banner {idx + 1}</h4>

                  <div className="space-y-3">
                    {/* Media Type */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Tipo de Mídia</label>
                      <select
                        value={slot.mediaType || 'image'}
                        onChange={(e) => {
                          const newSlots = [...(editing.slots || [])];
                          newSlots[idx] = { ...newSlots[idx], mediaType: e.target.value };
                          setEditing({ ...editing, slots: newSlots });
                        }}
                        className="border rounded px-3 py-2 w-full text-sm"
                      >
                        <option value="image">Imagem</option>
                        <option value="video">Vídeo</option>
                      </select>
                    </div>

                    {/* Media Upload */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Arquivo de {slot.mediaType === 'video' ? 'Vídeo' : 'Imagem'}
                      </label>
                      <FilePicker
                        accept={slot.mediaType === 'video' ? 'video/*' : 'image/*'}
                        onChange={(e) => handleSlotMediaUpload(idx, e)}
                        buttonLabel={`Selecionar ${slot.mediaType === 'video' ? 'vídeo' : 'imagem'}`}
                        emptyLabel="Nenhum arquivo selecionado"
                      />
                      <p className="text-[11px] text-gray-500 mt-1">
                        {uploadingSlotIndex === idx ? 'Enviando arquivo...' : (slot.mediaUrl ? 'Arquivo enviado com sucesso.' : 'Nenhum arquivo enviado.')}
                      </p>
                      {slot.mediaUrl && (
                        <div className="mt-2 space-y-2">
                          {slot.mediaType !== 'video' && (
                            <img src={slot.mediaUrl} alt="Prévia" className="max-w-full max-h-20 object-contain rounded border bg-white" />
                          )}
                          <div className="flex items-center gap-2">
                            <p className="text-[11px] text-gray-500 break-all flex-1">{slot.mediaUrl}</p>
                            <button
                              type="button"
                              onClick={() => {
                                const newSlots = [...(editing.slots || [])];
                                newSlots[idx] = { ...newSlots[idx], mediaUrl: '' };
                                setEditing({ ...editing, slots: newSlots });
                              }}
                              className="flex-shrink-0 text-xs text-red-500 hover:text-red-700 border border-red-200 rounded px-2 py-1 hover:bg-red-50 whitespace-nowrap"
                            >
                              ✕ Remover
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Link URL */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Link de Destino (opcional)
                      </label>
                      <input
                        type="text"
                        value={slot.linkUrl || ''}
                        onChange={(e) => {
                          const newSlots = [...(editing.slots || [])];
                          newSlots[idx] = { ...newSlots[idx], linkUrl: e.target.value };
                          setEditing({ ...editing, slots: newSlots });
                        }}
                        placeholder="https://exemplo.com/destino"
                        className="border rounded px-3 py-2 w-full text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 font-medium transition-colors"
              >
                Salvar
              </button>
              <button
                onClick={() => {
                  setEditing(JSON.parse(JSON.stringify(banner)));
                  setIsEditing(false);
                }}
                className="px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdBannerSystem;
