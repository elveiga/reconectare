import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import {
  addBrandRequest,
  addEquipmentTypeRequest,
  createListingRequest,
  getCatalogRequest,
  getListingsRequest,
  updateListingRequest,
  updateListingStatusRequest
} from '@/services/listingsApi';
import { getRuntimeToken } from '@/lib/authSession';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};

// Fallback global de imagem (garante que nunca quebra)
const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1588776813677-77aa57e4352f?w=800&q=80';

// Garante código mesmo se alguém esquecer no futuro
const generateCode = (id) => `LP-${String(id).padStart(3, '0')}`;

const getAuthToken = () => getRuntimeToken();

export const DataProvider = ({ children }) => {
  const [brands, setBrands] = useState([]);

  const [equipmentTypes, setEquipmentTypes] = useState([]);

  const addBrand = (b) => {
    if (!b) return;
    setBrands((prev) => (prev.includes(b) ? prev : [...prev, b]));
    const token = getAuthToken();
    if (token) {
      addBrandRequest(token, b).catch((error) => {
        console.error('❌ Erro ao salvar marca na API:', error);
      });
    }
  };

  const addEquipmentType = (t) => {
    if (!t) return;
    setEquipmentTypes((prev) => (prev.includes(t) ? prev : [...prev, t]));
    const token = getAuthToken();
    if (token) {
      addEquipmentTypeRequest(token, t).catch((error) => {
        console.error('❌ Erro ao salvar tipo na API:', error);
      });
    }
  };

  const [rawListings, setRawListings] = useState([]);

  // API-only: carregar dados exclusivamente da API
  useEffect(() => {
    const loadFromApi = async () => {
      try {
        const [listingsResponse, catalogResponse] = await Promise.all([
          getListingsRequest(),
          getCatalogRequest()
        ]);

        setRawListings(Array.isArray(listingsResponse?.listings) ? listingsResponse.listings : []);

        setBrands(Array.isArray(catalogResponse?.brands) ? catalogResponse.brands : []);

        setEquipmentTypes(Array.isArray(catalogResponse?.equipmentTypes) ? catalogResponse.equipmentTypes : []);
      } catch (error) {
        console.error('❌ API de listings indisponível. Sem fallback local (modo API-only).', error?.message || error);
        setRawListings([]);
        setBrands([]);
        setEquipmentTypes([]);
      }
    };

    loadFromApi();
  }, []);

  /**
   * NORMALIZAÇÃO FINAL (robusta)
   * - garante code
   * - garante image
   */
  const listings = useMemo(() => {
    return rawListings.map((item) => ({
      ...item,
      code: item.code || generateCode(item.id),
      image: item.image || DEFAULT_IMAGE,
      images: Array.isArray(item.images) && item.images.length
        ? item.images
        : [item.image || DEFAULT_IMAGE],
      videoUrl: item.videoUrl || ''
    }));
  }, [rawListings]);

  const updateListingStatus = async (id, status) => {
    const token = getAuthToken();
    if (!token) {
      return { success: false, message: 'Autenticação obrigatória para atualizar status.' };
    }

    try {
      const response = await updateListingStatusRequest(token, id, status);
      if (response?.listing) {
        setRawListings((prev) => prev.map((item) => (item.id === id ? response.listing : item)));
      }
      return { success: true, listing: response?.listing || null };
    } catch (error) {
      console.error('❌ Erro ao atualizar status na API:', error);
      return { success: false, message: error?.message || 'Erro ao atualizar status.' };
    }
  };

  const updateListing = async (id, updates) => {
    const token = getAuthToken();
    if (!token) {
      return { success: false, message: 'Autenticação obrigatória para atualizar anúncio.' };
    }

    try {
      const response = await updateListingRequest(token, id, updates);
      if (response?.listing) {
        setRawListings((prev) => prev.map((item) => (item.id === id ? response.listing : item)));
      }
      return { success: true, listing: response?.listing || null };
    } catch (error) {
      console.error('❌ Erro ao atualizar produto na API:', error);
      return { success: false, message: error?.message || 'Erro ao atualizar anúncio.' };
    }
  };

  const createListing = async (newProduct) => {
    const token = getAuthToken();

    try {
      const response = await createListingRequest(token, newProduct);
      if (response?.listing) {
        setRawListings((prev) => [...prev, response.listing]);
      }
      return { success: true, listing: response?.listing || null };
    } catch (error) {
      console.error('❌ Erro ao criar produto na API:', error);
      return { success: false, message: error?.message || 'Erro ao criar anúncio.' };
    }
  };

  /**
   * Retorna produtos recomendados com ordenação correta
   * Recebe a config do DataPagesContext
   */
  const getRecommendedListings = (recommendedConfig) => {
    if (!recommendedConfig) return listings;
    
    const selectedCodes = recommendedConfig.selectedCodes.filter((code) => code && code.trim());
    const selectedListings = selectedCodes
      .map((code) => listings.find((l) => l.code === code))
      .filter((l) => l !== undefined);

    // Produtos que NÃO foram selecionados (usar selectedCodes filtrado, não a array original)
    const remainingListings = listings.filter(
      (l) => !selectedCodes.includes(l.code)
    );

    // Ordena os restantes
    const sortedRemaining = [...remainingListings].sort((a, b) => {
      if (recommendedConfig.order === 'asc') {
        return a.id - b.id;
      } else {
        return b.id - a.id;
      }
    });

    // Combina: selecionados + rest
    return [...selectedListings, ...sortedRemaining];
  };

  const value = useMemo(() => ({
    listings,
    brands,
    equipmentTypes,
    updateListingStatus,
    updateListing,
    createListing,
    getRecommendedListings,
    addBrand,
    addEquipmentType
  }), [listings, brands, equipmentTypes]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};