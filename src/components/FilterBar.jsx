import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SlidersHorizontal, ChevronDown, Search } from 'lucide-react';
import { useData } from '@/contexts/DataContext';

const STATUS_OPTIONS = ['Disponível', 'Reservado', 'Vendido'];

const formatCurrencyBRL = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  const amount = Number(digits) / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount);
};

const parseCurrencyToNumber = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return 0;
  return Number(digits) / 100;
};

const FilterBar = ({ onFilterChange, onSortChange, initialFilters = {} }) => {
  const { brands, equipmentTypes, listings } = useData();

  const [search, setSearch] = useState(initialFilters.search || '');
  const [types, setTypes] = useState(initialFilters.type || []);
  const [brandsSelected, setBrandsSelected] = useState(initialFilters.brand || []);
  const [modelsSelected, setModelsSelected] = useState(initialFilters.model || []);
  const [status, setStatus] = useState(
    initialFilters.status || ['Disponível', 'Reservado']
  );
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const [openType, setOpenType] = useState(false);
  const [openBrand, setOpenBrand] = useState(false);
  const [openModel, setOpenModel] = useState(false);

  useEffect(() => {
    setSearch(initialFilters.search || '');
  }, [initialFilters.search]);

  const typeRef = useRef(null);
  const brandRef = useRef(null);
  const modelRef = useRef(null);

  /* MODELOS ÚNICOS A PARTIR DOS LISTINGS */
  const models = useMemo(() => {
    const set = new Set();
    listings.forEach((l) => {
      if (l.model) set.add(l.model);
    });
    return Array.from(set).sort();
  }, [listings]);

  /* FECHAR POPUPS AO CLICAR FORA */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (typeRef.current && !typeRef.current.contains(e.target)) setOpenType(false);
      if (brandRef.current && !brandRef.current.contains(e.target)) setOpenBrand(false);
      if (modelRef.current && !modelRef.current.contains(e.target)) setOpenModel(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* DISPARA FILTRO */
  useEffect(() => {
    onFilterChange({
      search,
      type: types,
      brand: brandsSelected,
      model: modelsSelected,
      status,
      minPrice: parseCurrencyToNumber(minPrice),
      maxPrice: maxPrice ? parseCurrencyToNumber(maxPrice) : Infinity,
    });
  }, [search, types, brandsSelected, modelsSelected, status, minPrice, maxPrice]);

  const toggleItem = (value, setter) => {
    setter((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-[auto_auto_auto_2fr_1fr_1fr_auto] gap-3 md:items-end">
        <div className="flex items-center gap-2 md:col-start-1 md:col-end-5 md:row-start-1">
          <SlidersHorizontal className="w-4 h-4 text-gray-700" />
          <h3 className="text-sm font-semibold text-gray-900">Filtros</h3>
        </div>

        <div className="w-full md:col-start-5 md:col-end-8 md:row-start-1">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="O que você está buscando?"
              className="w-full h-9 pl-8 pr-8 border border-gray-300 rounded-md text-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors text-xs"
                aria-label="Limpar busca"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* TIPO */}
        <div className="relative md:col-start-1 md:col-end-2 md:row-start-2" ref={typeRef}>
          <label className="block text-xs font-medium mb-1">Tipo</label>
          <button
            type="button"
            onClick={() => setOpenType((v) => !v)}
            className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm bg-white flex items-center justify-between"
          >
            {types.length ? `${types.length} selecionado(s)` : 'Selecionar'}
            <ChevronDown className="w-4 h-4" />
          </button>

          {openType && (
            <div className="absolute z-20 mt-2 w-[min(16rem,calc(100vw-2rem))] bg-white border rounded-md shadow-lg p-2 max-h-60 overflow-y-auto">
              {equipmentTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleItem(type, setTypes)}
                  className={`w-full text-left px-2 py-1.5 rounded text-sm
                    ${types.includes(type)
                      ? 'bg-gray-900 text-white'
                      : 'hover:bg-gray-100'}
                  `}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* MARCA */}
        <div className="relative md:col-start-2 md:col-end-3 md:row-start-2" ref={brandRef}>
          <label className="block text-xs font-medium mb-1">Marca</label>
          <button
            type="button"
            onClick={() => setOpenBrand((v) => !v)}
            className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm bg-white flex items-center justify-between"
          >
            {brandsSelected.length ? `${brandsSelected.length} selecionada(s)` : 'Selecionar'}
            <ChevronDown className="w-4 h-4" />
          </button>

          {openBrand && (
            <div className="absolute z-20 mt-2 w-[min(16rem,calc(100vw-2rem))] bg-white border rounded-md shadow-lg p-2 max-h-60 overflow-y-auto">
              {brands.map((brand) => (
                <button
                  key={brand}
                  onClick={() => toggleItem(brand, setBrandsSelected)}
                  className={`w-full text-left px-2 py-1.5 rounded text-sm
                    ${brandsSelected.includes(brand)
                      ? 'bg-gray-900 text-white'
                      : 'hover:bg-gray-100'}
                  `}
                >
                  {brand}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* MODELO */}
        <div className="relative md:col-start-3 md:col-end-4 md:row-start-2" ref={modelRef}>
          <label className="block text-xs font-medium mb-1">Modelo</label>
          <button
            type="button"
            onClick={() => setOpenModel((v) => !v)}
            className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm bg-white flex items-center justify-between"
          >
            {modelsSelected.length ? `${modelsSelected.length} selecionado(s)` : 'Selecionar'}
            <ChevronDown className="w-4 h-4" />
          </button>

          {openModel && (
            <div className="absolute z-20 mt-2 w-[min(16rem,calc(100vw-2rem))] bg-white border rounded-md shadow-lg p-2 max-h-60 overflow-y-auto">
              {models.map((model) => (
                <button
                  key={model}
                  onClick={() => toggleItem(model, setModelsSelected)}
                  className={`w-full text-left px-2 py-1.5 rounded text-sm
                    ${modelsSelected.includes(model)
                      ? 'bg-gray-900 text-white'
                      : 'hover:bg-gray-100'}
                  `}
                >
                  {model}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* STATUS */}
        <div className="md:col-start-4 md:col-end-5 md:row-start-2">
          <label className="block text-xs font-medium mb-1">Status</label>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => toggleItem(option, setStatus)}
                className={`px-3 h-9 rounded-md text-xs border
                  ${status.includes(option)
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-300 hover:bg-gray-50'}
                `}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* PREÇO MIN */}
        <div className="md:col-start-5 md:col-end-6 md:row-start-2">
          <label className="block text-xs font-medium mb-1">Preço mín.</label>
          <div className="relative">
            <input
              type="text"
              value={minPrice}
              onChange={(e) => setMinPrice(formatCurrencyBRL(e.target.value))}
              placeholder="R$ 0,00"
              className="w-full h-9 px-2 pr-8 border border-gray-300 rounded-md text-sm"
            />
            {minPrice && (
              <button
                type="button"
                onClick={() => setMinPrice('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors text-xs"
                aria-label="Limpar preço mínimo"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* PREÇO MAX */}
        <div className="md:col-start-6 md:col-end-7 md:row-start-2">
          <label className="block text-xs font-medium mb-1">Preço máx.</label>
          <div className="relative">
            <input
              type="text"
              value={maxPrice}
              onChange={(e) => setMaxPrice(formatCurrencyBRL(e.target.value))}
              placeholder="R$ 0,00"
              className="w-full h-9 px-2 pr-8 border border-gray-300 rounded-md text-sm"
            />
            {maxPrice && (
              <button
                type="button"
                onClick={() => setMaxPrice('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors text-xs"
                aria-label="Limpar preço máximo"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ORDENAR */}
        <div className="md:col-start-7 md:col-end-8 md:row-start-2">
          <label className="block text-xs font-medium mb-1">Ordenar</label>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              onSortChange(e.target.value);
            }}
            className="w-full h-9 px-2 border border-gray-300 rounded-md text-sm bg-white"
          >
            <option value="newest">Mais novos</option>
            <option value="price_low">Menor preço</option>
            <option value="price_high">Maior preço</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;