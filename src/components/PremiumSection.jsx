import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useDataPages } from '@/contexts/DataPages';
import { useUsers } from '@/contexts/DataUser';
import { X } from 'lucide-react';
import ListingCard from './ListingCard';

const ITEMS_PER_LOAD = 9;

const PremiumSection = () => {
  const { getRecommendedListings, listings } = useData();
  const { recommendedConfig, updateRecommendedConfig } = useDataPages();
  const { currentUser } = useUsers();
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [isEditingRecommended, setIsEditingRecommended] = useState(false);
  const [editingConfig, setEditingConfig] = useState(recommendedConfig);
  const isAdmin = currentUser?.role === 'Admin';

  useEffect(() => {
    setEditingConfig(recommendedConfig);
  }, [recommendedConfig]);

  const recommendedListings = useMemo(() => {
    return getRecommendedListings(recommendedConfig).filter(l => l.status === 'Disponível');
  }, [getRecommendedListings, recommendedConfig]);

  const visible = recommendedListings.slice(0, visibleCount);

  return (
    <section className="py-6 bg-gray-50">
      <div className="max-w-6xl mx-auto px-3">
        <div className={`relative rounded-lg ${isAdmin ? 'border-2 border-blue-300 p-3' : ''}`}>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setIsEditingRecommended(true)}
            className="absolute top-2 right-2 text-xs px-3 py-1 rounded border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
          >
            Editar
          </button>
        )}

        <div className={`mb-3 ${isAdmin ? 'pr-20' : ''}`}>
          <div>
          <h2 className="text-xl font-bold text-gray-900">
            Recomendados
          </h2>
          <p className="text-xs text-gray-600">
            Equipamentos premium selecionados com curadoria especial.
          </p>
          </div>
        </div>

        {/* GRID COMPACTO */}
  <div className="grid grid-cols-2 lg:grid-cols-3 gap-[15px]">
          {visible.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              compact
              inlineWhatsapp
              showWhatsapp
            />
          ))}
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/anuncios"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex px-4 py-2 text-sm font-medium text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-100 hover:scale-105 transition-all duration-200 cursor-pointer"
          >
            Ver mais
          </Link>
        </div>
        </div>
      </div>

      {isAdmin && isEditingRecommended && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-6 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded shadow-lg p-6 relative my-6">
            <button onClick={() => setIsEditingRecommended(false)} className="absolute right-3 top-3 p-2"><X /></button>
            <h3 className="text-lg font-bold mb-4">Editar Recomendados</h3>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">Ordem Padrão</label>
              <select
                value={editingConfig.order}
                onChange={(e) => setEditingConfig((s) => ({ ...s, order: e.target.value }))}
                className="border rounded px-3 py-2 w-full md:w-64"
              >
                <option value="desc">Decrescente (Mais Novos)</option>
                <option value="asc">Crescente (Mais Antigos)</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-3">Escolher até 9 Produtos (Opcional)</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
                  <div key={idx} className="relative">
                    <label className="block text-xs text-gray-600 mb-1">Posição {idx + 1}</label>
                    <input
                      list={`recommended-codes-list-${idx}`}
                      value={editingConfig.selectedCodes[idx] || ''}
                      onChange={(e) => {
                        const newCodes = [...editingConfig.selectedCodes];
                        newCodes[idx] = e.target.value.trim();
                        setEditingConfig((s) => ({ ...s, selectedCodes: newCodes }));
                      }}
                      placeholder="Ex: LP-001"
                      className="border rounded px-2 py-2 w-full text-sm"
                    />
                    <datalist id={`recommended-codes-list-${idx}`}>
                      {listings.map((item) => (
                        <option key={item.code} value={item.code}>
                          {item.code} - {item.name}
                        </option>
                      ))}
                    </datalist>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2">Posições vazias serão preenchidas automaticamente pela ordem padrão.</p>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  if (!window.confirm('Tem certeza que deseja salvar as alterações?')) return;
                  updateRecommendedConfig(editingConfig);
                  setIsEditingRecommended(false);
                }}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
              >
                Salvar
              </button>
              <button
                onClick={() => {
                  setEditingConfig(recommendedConfig);
                  setIsEditingRecommended(false);
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

export default PremiumSection;