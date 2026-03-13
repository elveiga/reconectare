import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Hero from '@/components/Hero';
import BrandSection from '@/components/BrandSection';
import PremiumSection from '@/components/PremiumSection';
import SoldSection from '@/components/SoldSection';
import Testimonials from '@/components/Testimonials';
import AdBanner from '@/components/AdBanner';
import AdBannerSystem from '@/components/AdBannerSystem';
import { useDataPages } from '@/contexts/DataPages';
import { useUsers } from '@/contexts/DataUser';
import { X } from 'lucide-react';
import { uploadMediaRequest } from '@/services/mediaApi';
import { getRuntimeToken } from '@/lib/authSession';
import FilePicker from '@/components/ui/file-picker';

const HomePage = () => {
  const { bannersConfig, updateBannersConfig } = useDataPages();
  const { currentUser } = useUsers();
  const [isEditingBanners, setIsEditingBanners] = useState(false);
  const [bannersEditing, setBannersEditing] = useState(bannersConfig);
  const [uploadingBannerIndex, setUploadingBannerIndex] = useState(null);
  const isAdmin = currentUser?.role === 'Admin';

  useEffect(() => {
    setBannersEditing(bannersConfig);
  }, [bannersConfig]);
  
  // Encontra banner por posição
  const getBanner = (position) => {
    return bannersConfig?.banners?.find(b => b.position === position);
  };

  const handleBannerImageUpload = async (idx, event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const token = getRuntimeToken();
    if (!token) {
      alert('Faça login para enviar imagem.');
      return;
    }

    try {
      setUploadingBannerIndex(idx);
      const upload = await uploadMediaRequest(token, file);
      setBannersEditing((prev) => {
        const next = [...prev.banners];
        next[idx] = { ...next[idx], imageUrl: upload.url };
        return { ...prev, banners: next };
      });
    } catch (error) {
      alert(error?.message || 'Erro ao enviar imagem do banner.');
    } finally {
      setUploadingBannerIndex(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>Reconectare - Equipamentos odontológicos usados com curadoria</title>
        <meta 
          name="description" 
          content="Compre e venda equipamentos odontológicos de qualidade com segurança e transparência. Curadoria profissional para dentistas e clínicas." 
        />
      </Helmet>

      <div className="min-h-screen bg-white">
        {isAdmin && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
            <div className="relative rounded-lg border-2 border-blue-300 p-3 min-h-[64px]">
              <div className="text-xs text-blue-700">Área editável de banners da página inicial</div>
              <button
                type="button"
                onClick={() => setIsEditingBanners(true)}
                className="absolute top-2 right-2 text-xs px-3 py-1 rounded border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                Editar
              </button>
            </div>
          </div>
        )}

        {/* Banner de Anúncio 1 - Antes do Hero */}
        <AdBannerSystem bannerId="banner1" position="Acima do Hero" />

        <Hero />
        <AdBanner banner={getBanner('after-hero')} />
        
        <BrandSection />
        <AdBanner banner={getBanner('after-brands')} />
        
        {/* Banner de Anúncio 4 - Após Equipamentos com Curadoria */}
        <AdBannerSystem bannerId="banner4" position="Abaixo de Equipamentos com Curadoria" />
        
        <PremiumSection />
        <AdBanner banner={getBanner('after-premium')} />
        
        {/* Banner de Anúncio 2 - Após Recomendados */}
        <AdBannerSystem bannerId="banner2" position="Abaixo dos Recomendados" />
        
        <SoldSection />
        <AdBanner banner={getBanner('after-sold')} />
        
        <Testimonials />
        <AdBanner banner={getBanner('after-testimonials')} />
        
        {/* Banner de Anúncio 3 - Após Comentários */}
        <AdBannerSystem bannerId="banner3" position="Abaixo dos Comentários" />
      </div>

      {isAdmin && isEditingBanners && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-6 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded shadow-lg p-6 relative my-6">
            <button onClick={() => setIsEditingBanners(false)} className="absolute right-3 top-3 p-2"><X /></button>
            <h3 className="text-lg font-bold mb-4">Editar Banners da Página Inicial</h3>

            <p className="text-sm text-gray-600 mb-6">Banners sem imagem ou link não serão exibidos.</p>

            {bannersEditing.banners.map((banner, idx) => (
              <div key={banner.id} className="border rounded p-4 mb-4 bg-gray-50">
                <h4 className="font-semibold mb-1">{banner.name}</h4>
                <p className="text-xs text-gray-500 mb-3">Dimensões: {banner.width}x{banner.height}px</p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Imagem/GIF</label>
                    <FilePicker
                      accept="image/*"
                      onChange={(e) => handleBannerImageUpload(idx, e)}
                      buttonLabel="Selecionar imagem"
                      emptyLabel="Nenhum arquivo selecionado"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">
                      {uploadingBannerIndex === idx ? 'Enviando imagem...' : (banner.imageUrl ? 'Imagem enviada com sucesso.' : 'Nenhuma imagem enviada ainda.')}
                    </p>
                    {banner.imageUrl && (
                      <img src={banner.imageUrl} alt={`Prévia ${banner.name}`} className="mt-2 w-full max-w-xs h-24 object-cover rounded border" />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Link de Destino</label>
                    <input
                      type="text"
                      value={banner.linkUrl}
                      onChange={(e) => {
                        const next = [...bannersEditing.banners];
                        next[idx] = { ...next[idx], linkUrl: e.target.value };
                        setBannersEditing((s) => ({ ...s, banners: next }));
                      }}
                      className="border rounded px-2 py-2 w-full text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => {
                  if (!window.confirm('Tem certeza que deseja salvar as alterações?')) return;
                  updateBannersConfig(bannersEditing);
                  setIsEditingBanners(false);
                }}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
              >
                Salvar
              </button>
              <button
                onClick={() => {
                  setBannersEditing(bannersConfig);
                  setIsEditingBanners(false);
                }}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HomePage;