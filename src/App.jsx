import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DataProvider } from '@/contexts/DataContext';
import { DataUserProvider } from '@/contexts/DataUser';
import { DataPagesProvider } from '@/contexts/DataPages';
import { Toaster } from '@/components/ui/toaster';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HomePage from '@/pages/HomePage';
import ListingPage from '@/pages/ListingPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import PostEquipmentPage from '@/pages/PostEquipmentPage';
import AdvertisePage from '@/pages/AdvertisePage';
import CompanyPage from '@/pages/CompanyPage';
import LegalPage from '@/pages/LegalPage';
import LoginPage from '@/pages/LoginPage';
import ForcePasswordChangePage from '@/pages/ForcePasswordChangePage';
import AdminPage from '@/pages/AdminPage';
import ProtectedRoute from '@/components/ProtectedRoute';

function App() {
  // Ativa smooth scroll fluido
  useSmoothScroll();
  return (
    <DataUserProvider>
      <DataProvider>
        <DataPagesProvider>
          <Router>
        <div className="min-h-screen bg-white">
          <Header />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/anuncios" element={<ListingPage />} />
            <Route path="/anuncios/:code" element={<ProductDetailPage />} />
            
            <Route path="/anuncie-sua-marca" element={<AdvertisePage />} />
            <Route path="/empresa" element={<CompanyPage />} />
            <Route path="/legal" element={<LegalPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/alterar-senha" element={<ForcePasswordChangePage />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["Admin", "Seller"]}>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route path="/anunciar" element={<PostEquipmentPage />} />
          </Routes>
          <Footer />
          <Toaster />
        </div>
          </Router>
        </DataPagesProvider>
      </DataProvider>
    </DataUserProvider>
  );
}

export default App;