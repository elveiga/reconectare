import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUsers } from '@/contexts/DataUser';
import SiteLogo from '@/components/SiteLogo';
import { clearRuntimeLogo, getRuntimeLogo, LOGO_SESSION_EVENT, setRuntimeLogo } from '@/lib/logoSession';

const ACCEPTED_LOGO_TYPES = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp'];
const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [customLogo, setCustomLogo] = useState(null);
  const [showLogoOptions, setShowLogoOptions] = useState(false);
  const logoWrapperRef = useRef(null);
  const location = useLocation();
  const { currentUser } = useUsers();
  const isAdmin = currentUser?.role === 'Admin';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const storedLogo = getRuntimeLogo();
    if (storedLogo && storedLogo.startsWith('data:image/')) {
      setCustomLogo(storedLogo);
      return;
    }
    setCustomLogo(null);
  }, []);

  useEffect(() => {
    if (!showLogoOptions) return;

    const handleOutsideClick = (event) => {
      if (!logoWrapperRef.current?.contains(event.target)) {
        setShowLogoOptions(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showLogoOptions]);

  const resetToDefaultLogo = () => {
    setCustomLogo(null);
    clearRuntimeLogo();
  };

  const handleCustomLogoError = () => {
    resetToDefaultLogo();
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      resetToDefaultLogo();
      return;
    }

    const isTypeValid = ACCEPTED_LOGO_TYPES.includes(file.type);
    const isSizeValid = file.size <= MAX_LOGO_SIZE_BYTES;

    if (!isTypeValid || !isSizeValid) {
      resetToDefaultLogo();
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string' || !result.startsWith('data:image/')) {
        resetToDefaultLogo();
        return;
      }

      const previewImage = new Image();
      previewImage.onload = () => {
        setCustomLogo(result);
        setRuntimeLogo(result);
      };
      previewImage.onerror = resetToDefaultLogo;
      previewImage.src = result;
    };

    reader.onerror = resetToDefaultLogo;
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const syncLogo = () => {
      const logo = getRuntimeLogo();
      setCustomLogo(logo && logo.startsWith('data:image/') ? logo : null);
    };

    window.addEventListener(LOGO_SESSION_EVENT, syncLogo);
    return () => window.removeEventListener(LOGO_SESSION_EVENT, syncLogo);
  }, []);

  const navLinks = [
    { to: '/anuncios', label: 'Ver Anúncios' },
    { to: '/anunciar', label: 'Anunciar Equipamento' },
    { to: '/anuncie-sua-marca', label: 'Divulgue sua Marca' },
  ];

  const isPanelUser = currentUser?.role === 'Admin' || currentUser?.role === 'Seller';
  const mustChangePassword = Boolean(currentUser?.mustChangePassword);
  const mobileAuthTarget = currentUser
    ? (mustChangePassword ? '/alterar-senha' : (isPanelUser ? '/admin' : '/anunciar'))
    : '/login';
  const mobileAuthLabel = currentUser
    ? (mustChangePassword ? 'Alterar Senha' : (isPanelUser ? 'Ir para Painel' : 'Meu Perfil'))
    : 'Entrar';

  const handleNavClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-white'
      } group`}
    >
  <nav className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div ref={logoWrapperRef} className="relative -ml-1 sm:-ml-2">
            <Link to="/" className="flex items-center">
              <div
                className={`relative w-[160px] sm:w-[220px] h-10 sm:h-12 rounded-md ${
                  isAdmin ? 'border-2 border-blue-400' : ''
                }`}
              >
                <SiteLogo customLogo={customLogo} onCustomLogoError={handleCustomLogoError} />
              </div>
            </Link>

            {isAdmin && (
              <div className="absolute right-0 top-0 mt-1 mr-1 flex flex-col items-end gap-1 z-50">
                <button
                  type="button"
                  onClick={() => setShowLogoOptions((prev) => !prev)}
                  className="text-[11px] leading-none px-2 py-1 rounded border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                >
                  Editar
                </button>

                {showLogoOptions && (
                  <div className="w-52 bg-white border border-gray-200 rounded-lg shadow-md p-2 absolute right-0 top-full mt-1">
                    <label className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded cursor-pointer">
                      Upload novo logo
                      <input
                        type="file"
                        accept="image/svg+xml,image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={resetToDefaultLogo}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                    >
                      Usar logo padrão
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Navigation: inline links revealed on header hover (keep positions) */}
          <div className="hidden md:flex items-center space-x-1">
            <div className="opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transform translate-y-1 group-hover:translate-y-0 transition-all duration-200 flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={handleNavClick}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform ${
                    location.pathname === link.to
                      ? 'text-gray-900 bg-gray-100'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {/* show auth feedback only on header hover, aligned with nav links */}
              <div className="flex items-center pl-2">
                <AuthFeedback />
              </div>
            </div>
          </div>


          {/* three-line indicator positioned at the right side of the nav (doesn't affect layout) */}
          <div className="hidden md:block absolute right-6 top-1/2 transform -translate-y-1/2 transition-opacity duration-200 opacity-100 group-hover:opacity-0 pointer-events-none">
            <div className="flex flex-col justify-center gap-1">
              <span className="block w-5 h-[2px] bg-gray-700 rounded" />
              <span className="block w-5 h-[2px] bg-gray-700 rounded" />
              <span className="block w-5 h-[2px] bg-gray-700 rounded" />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-900" />
            ) : (
              <Menu className="w-6 h-6 text-gray-900" />
            )}
          </button>
          </div>

          {/* dropdown removed: inline nav is shown on header hover instead */}
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-white border-t border-gray-100"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => {
                    handleNavClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === link.to
                      ? 'text-gray-900 bg-gray-100'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <Link
                to={mobileAuthTarget}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === mobileAuthTarget
                    ? 'text-gray-900 bg-gray-100'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {mobileAuthLabel}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;

const AuthFeedback = () => {
  const { currentUser } = useUsers();
  if (!currentUser) {
    return (
      <div className="text-sm text-gray-600"> 
        <Link to="/login" className="hover:text-gray-900">Entrar</Link>
      </div>
    );
  }

  const initials = currentUser.nome
    .split(' ')
    .map((n) => n[0])
    .slice(0,2)
    .join('')
    .toUpperCase();

  const isPanelUser = currentUser.role === 'Admin' || currentUser.role === 'Seller';
  const profileTarget = currentUser.mustChangePassword ? '/alterar-senha' : (isPanelUser ? '/admin' : '/anunciar');

  return (
    <Link to={profileTarget} className="flex items-center gap-3 text-sm text-gray-700 hover:text-green-700">
      <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-semibold">{initials}</div>
      <div className="hidden md:block">{currentUser.nome}</div>
    </Link>
  );
};