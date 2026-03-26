import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import ListingCard from '@/components/ListingCard';
import FilterBar from '@/components/FilterBar';
import AdBannerSystem from '@/components/AdBannerSystem';

const ListingPage = () => {
  const { listings } = useData();
  const location = useLocation();

  const initialSearch = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return String(params.get('q') || '').trim();
  }, [location.search]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const [filters, setFilters] = useState({
    search: initialSearch,
    type: [],
    brand: [],
    model: [],
    status: ['Disponível', 'Reservado'],
    minPrice: 0,
    maxPrice: Infinity,
  });

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      search: initialSearch
    }));
  }, [initialSearch]);

  const [sortBy, setSortBy] = useState('newest');

  const filteredAndSortedListings = useMemo(() => {
    let result = listings.filter((listing) => {
      const searchTerm = String(filters.search || '').trim().toLowerCase();
      const searchMatch = !searchTerm || [
        listing.name,
        listing.code,
        listing.model,
        listing.brand,
        listing.type,
        listing.description,
        listing.location,
        listing.seller?.name
      ]
        .map((value) => String(value || '').toLowerCase())
        .some((value) => value.includes(searchTerm));

      const typeMatch =
        !filters.type.length || filters.type.includes(listing.type);

      const brandMatch =
        !filters.brand.length || filters.brand.includes(listing.brand);

      const modelMatch =
        !filters.model.length || filters.model.includes(listing.model);

      const statusMatch =
        !filters.status.length || filters.status.includes(listing.status);

      const priceMatch =
        listing.price >= filters.minPrice &&
        listing.price <= filters.maxPrice;

      return (
        searchMatch &&
        typeMatch &&
        brandMatch &&
        modelMatch &&
        statusMatch &&
        priceMatch
      );
    });

    switch (sortBy) {
      case 'price_low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        result.sort((a, b) => b.price - a.price);
        break;
      default:
        result.sort((a, b) => b.id - a.id);
    }

    return result;
  }, [listings, filters, sortBy]);

  return (
    <>
      <Helmet>
        <title>Anúncios - Reconectare</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        {/* Banner de Anúncio 5 - Acima de Todos os anúncios */}
        <AdBannerSystem bannerId="banner5" position="Acima de Todos os Anúncios" />
        
        <div className="max-w-6xl mx-auto px-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Todos os Anúncios
            </h1>
            <p className="text-sm text-gray-600 mb-4">
              Encontre o equipamento odontológico perfeito para sua clínica.
            </p>

            <FilterBar
              onFilterChange={setFilters}
              onSortChange={setSortBy}
              initialFilters={filters}
            />

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-[15px] mt-6">
              {filteredAndSortedListings.map((listing, index) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.02 }}
                >
                  <ListingCard
                    listing={listing}
                    compact
                    inlineWhatsapp
                    showWhatsapp
                    showShare
                  />
                </motion.div>
              ))}
            </div>

            {filteredAndSortedListings.length === 0 && (
              <div className="text-center py-12 text-sm text-gray-600">
                Nenhum equipamento encontrado com os filtros selecionados.
              </div>
            )}
          </motion.div>
        </div>
        
        {/* Banner de Anúncio 6 - Acima do Footer */}
        <AdBannerSystem bannerId="banner6" position="Acima do Footer" />
      </div>
    </>
  );
};

export default ListingPage;