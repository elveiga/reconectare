import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useDataPages } from '@/contexts/DataPages';
import { useUsers } from '@/contexts/DataUser';
import { X } from 'lucide-react';

const BrandSection = () => {
  const { brands } = useData();
  const { brandSectionConfig, updateBrandSectionConfig } = useDataPages();
  const { currentUser } = useUsers();
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const isAdmin = currentUser?.role === 'Admin';

  const [isEditingBrandSection, setIsEditingBrandSection] = useState(false);
  const [editingConfig, setEditingConfig] = useState(brandSectionConfig);

  useEffect(() => {
    setEditingConfig(brandSectionConfig);
  }, [brandSectionConfig]);

  const defaultBrands = brands.filter((b) => b !== 'Outros');
  const customOptions = (brandSectionConfig.options || []).filter((b) => String(b || '').trim());
  const displayBrands = (customOptions.length ? customOptions : defaultBrands).slice(0, 10);

  const handleBrandClick = (brand) => {
    navigate(`/anuncios?brand=${encodeURIComponent(brand)}`);
  };

  return (
    <section className={`relative py-12 bg-white w-full ${isAdmin ? 'border-2 border-blue-300 rounded-lg' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {isAdmin && (
          <button
            type="button"
            onClick={() => setIsEditingBrandSection(true)}
            className="absolute top-2 right-2 text-xs px-3 py-1 rounded border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
          >
            Editar
          </button>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
            {brandSectionConfig.title}
          </h2>
          <p className="text-sm text-gray-500">
            {brandSectionConfig.subtitle}
          </p>
        </motion.div>

        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto overflow-y-visible scroll-smooth scrollbar-thin pb-6 pt-4 px-2"
        >
          {displayBrands.map((brand, index) => (
            <motion.button
              key={brand}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.04 }}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleBrandClick(brand)}
              className="relative z-0 flex-shrink-0 px-6 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm hover:border-gray-300 hover:shadow-md transition-all duration-200 hover:z-10"
            >
              {brand}
            </motion.button>
          ))}
        </div>
      </div>

      {isAdmin && isEditingBrandSection && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-6 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded shadow-lg p-6 relative my-6">
            <button onClick={() => setIsEditingBrandSection(false)} className="absolute right-3 top-3 p-2"><X /></button>
            <h3 className="text-lg font-bold mb-4">Editar Seção de Marcas</h3>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Título</label>
              <input
                type="text"
                value={editingConfig.title}
                onChange={(e) => setEditingConfig((s) => ({ ...s, title: e.target.value }))}
                className="border rounded px-3 py-2 w-full"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Subtítulo</label>
              <textarea
                value={editingConfig.subtitle}
                onChange={(e) => setEditingConfig((s) => ({ ...s, subtitle: e.target.value }))}
                className="border rounded px-3 py-2 w-full"
                rows="3"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Opções de marcas (máx. 10)</label>
              <p className="text-xs text-gray-600 mb-3">Se deixar todas vazias, a seção usa automaticamente as marcas do cadastro de produtos.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Array.from({ length: 10 }, (_, idx) => idx).map((idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={editingConfig.options?.[idx] || ''}
                    onChange={(e) => {
                      const next = [...(editingConfig.options || [])];
                      next[idx] = e.target.value;
                      setEditingConfig((s) => ({ ...s, options: next.slice(0, 10) }));
                    }}
                    className="border rounded px-3 py-2 w-full text-sm"
                    placeholder={`Opção ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  if (!window.confirm('Tem certeza que deseja salvar as alterações?')) return;
                  updateBrandSectionConfig({
                    ...editingConfig,
                    options: (editingConfig.options || []).slice(0, 10)
                  });
                  setIsEditingBrandSection(false);
                }}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
              >
                Salvar
              </button>
              <button
                onClick={() => {
                  setEditingConfig(brandSectionConfig);
                  setIsEditingBrandSection(false);
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

export default BrandSection;