import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDataPages } from '@/contexts/DataPages';
import { useUsers } from '@/contexts/DataUser';
import { X } from 'lucide-react';
import { uploadMediaRequest } from '@/services/mediaApi';
import { getRuntimeToken } from '@/lib/authSession';
import FilePicker from '@/components/ui/file-picker';

const HERO_FALLBACK_IMAGE = '/uploads/banner1.jpg';

const Hero = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const { heroConfig, updateHeroConfig } = useDataPages();
  const { currentUser } = useUsers();
  const isAdmin = currentUser?.role === 'Admin';

  const [isEditingHero, setIsEditingHero] = useState(false);
  const [editingHero, setEditingHero] = useState(heroConfig);
  const [isUploadingHeroImage, setIsUploadingHeroImage] = useState(false);

  useEffect(() => {
    setEditingHero(heroConfig);
  }, [heroConfig]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    navigate(`/anuncios?${params.toString()}`);
  };

  const handleHeroImageUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const token = getRuntimeToken();
    if (!token) {
      alert('Faça login para enviar imagem.');
      return;
    }

    try {
      setIsUploadingHeroImage(true);
      const upload = await uploadMediaRequest(token, file);
      setEditingHero((prev) => ({ ...prev, backgroundImage: upload.url }));
    } catch (error) {
      alert(error?.message || 'Não foi possível enviar a imagem.');
    } finally {
      setIsUploadingHeroImage(false);
    }
  };

  return (
    <section className="relative w-full bg-gray-50 overflow-hidden">
      {/* BANNER */}
      <div className={`relative w-full min-h-[380px] md:h-[340px] ${isAdmin ? 'border-2 border-blue-300 rounded-lg overflow-hidden' : ''}`}>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setIsEditingHero(true)}
            className="absolute top-2 right-2 z-30 text-xs px-3 py-1 rounded border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
          >
            Editar
          </button>
        )}

        {/* IMAGEM */}
        <div className="absolute inset-0">
          <img
            src={heroConfig.backgroundImage || HERO_FALLBACK_IMAGE}
            alt="Equipamentos odontológicos"
            className="w-full h-full object-cover"
            onError={(event) => {
              if (event.currentTarget.src.includes(HERO_FALLBACK_IMAGE)) return;
              event.currentTarget.src = HERO_FALLBACK_IMAGE;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80" />
        </div>

        {/* CONTEÚDO */}
        <div className="relative z-10 flex items-center justify-center h-full px-4
                pt-28 sm:pt-12 md:pt-0
                translate-y-0 md:translate-y-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-center max-w-3xl w-full"
          >
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-3 leading-tight">
              {heroConfig.title}
            </h1>

            <p className="text-sm md:text-base text-gray-200 mb-6">
              {heroConfig.subtitle}
            </p>

            <div className="flex justify-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/anunciar')}
                className="px-6 py-2.5 bg-white text-gray-900 rounded-lg font-semibold text-sm shadow hover:shadow-lg transition w-full sm:w-auto max-w-xs"
              >
                Anunciar Equipamento
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

  {/* BARRA DE BUSCA */}
  <div className="w-full bg-white border-t relative z-20">
        <div className="max-w-6xl mx-auto px-3 py-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              placeholder="O que você está buscando?"
              className="h-11 px-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />

            <button
              onClick={handleSearch}
              className="h-11 px-6 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition"
            >
              Buscar
            </button>
          </div>
        </div>
      </div>

      {isAdmin && isEditingHero && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-6 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded shadow-lg p-6 relative my-6">
            <button onClick={() => setIsEditingHero(false)} className="absolute right-3 top-3 p-2"><X /></button>
            <h3 className="text-lg font-bold mb-4">Editar Banner Inicial</h3>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Título</label>
              <input
                type="text"
                value={editingHero.title}
                onChange={(e) => setEditingHero((s) => ({ ...s, title: e.target.value }))}
                className="border rounded px-3 py-2 w-full"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Subtítulo</label>
              <textarea
                value={editingHero.subtitle}
                onChange={(e) => setEditingHero((s) => ({ ...s, subtitle: e.target.value }))}
                className="border rounded px-3 py-2 w-full"
                rows="3"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Imagem de fundo</label>
              <FilePicker
                accept="image/*"
                onChange={handleHeroImageUpload}
                buttonLabel="Selecionar imagem"
                emptyLabel="Nenhum arquivo selecionado"
              />
              <p className="text-xs text-gray-600 mt-2">
                {isUploadingHeroImage ? 'Enviando imagem...' : 'Envie uma imagem para substituir o banner principal.'}
              </p>
              {editingHero.backgroundImage && (
                <img
                  src={editingHero.backgroundImage}
                  alt="Prévia do banner principal"
                  className="mt-3 w-full h-40 object-cover rounded border"
                />
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  if (!window.confirm('Tem certeza que deseja salvar as alterações?')) return;
                  updateHeroConfig(editingHero);
                  setIsEditingHero(false);
                }}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
              >
                Salvar
              </button>
              <button
                onClick={() => {
                  setEditingHero(heroConfig);
                  setIsEditingHero(false);
                }}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Hero;