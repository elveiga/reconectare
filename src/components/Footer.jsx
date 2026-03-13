import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SiteLogo from '@/components/SiteLogo';
import { useDataPages } from '@/contexts/DataPages';
import { useUsers } from '@/contexts/DataUser';
import { X } from 'lucide-react';
import { clearRuntimeLogo, getRuntimeLogo, LOGO_SESSION_EVENT } from '@/lib/logoSession';

const Footer = () => {
  const [customLogo, setCustomLogo] = useState(null);
  const { footerConfig, updateFooterConfig } = useDataPages();
  const { currentUser } = useUsers();
  const isAdmin = currentUser?.role === 'Admin';
  const [isEditingFooter, setIsEditingFooter] = useState(false);
  const [editingFooter, setEditingFooter] = useState(footerConfig);

  useEffect(() => {
    setEditingFooter(footerConfig);
  }, [footerConfig]);

  useEffect(() => {
    const loadLogo = () => {
      const storedLogo = getRuntimeLogo();
      if (storedLogo && storedLogo.startsWith('data:image/')) {
        setCustomLogo(storedLogo);
        return;
      }
      setCustomLogo(null);
    };

    loadLogo();
    window.addEventListener(LOGO_SESSION_EVENT, loadLogo);

    return () => {
      window.removeEventListener(LOGO_SESSION_EVENT, loadLogo);
    };
  }, []);

  const handleCustomLogoError = () => {
    setCustomLogo(null);
    clearRuntimeLogo();
  };

  const handleNavClickTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleIconUpload = (event, index) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Arquivo inválido. Envie uma imagem (SVG, PNG, JPG, WEBP, ICO).');
      return;
    }

    if (file.size > 1024 * 1024) {
      alert('Ícone muito grande. Tamanho máximo: 1MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string' || !result.startsWith('data:image/')) return;

      setEditingFooter((prev) => {
        const nextIcons = [...(prev.socialIcons || [])];
        while (nextIcons.length < 5) nextIcons.push({ id: nextIcons.length + 1, image: '', link: '' });
        nextIcons[index] = { ...nextIcons[index], image: result };
        return { ...prev, socialIcons: nextIcons.slice(0, 5) };
      });
    };
    reader.readAsDataURL(file);
  };

  const visibleIcons = (footerConfig.socialIcons || []).filter((icon) => icon?.image);

  return (
    <footer className="w-full bg-gray-50 border-t border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-4">
            <div>
              <div className="flex items-center gap-3 -ml-1 sm:-ml-2">
                <div className="w-[160px] h-10 overflow-hidden">
                  <SiteLogo customLogo={customLogo} onCustomLogoError={handleCustomLogoError} />
                </div>
              </div>

              <div className={`relative mt-4 w-full max-w-xs ${isAdmin ? 'border-2 border-blue-300 rounded-md p-3' : ''}`}>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsEditingFooter(true)}
                    className="absolute top-2 right-2 text-xs px-3 py-1 rounded border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                  >
                    Editar
                  </button>
                )}

                <p className={`text-sm text-gray-600 ${isAdmin ? 'pr-20' : ''}`}>
                  {footerConfig.description}
                </p>

                {visibleIcons.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    {visibleIcons.map((icon, idx) => (
                      <a
                        key={`${icon.id}-${idx}`}
                        href={icon.link || '#'}
                        target={icon.link ? '_blank' : undefined}
                        rel={icon.link ? 'noreferrer' : undefined}
                        onClick={(e) => {
                          if (!icon.link) e.preventDefault();
                        }}
                        className="w-8 h-8 flex items-center justify-center flex-shrink-0"
                      >
                        <img src={icon.image} alt={`Ícone ${idx + 1}`} className="w-6 h-6 object-contain flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-3 w-full grid grid-cols-1 sm:grid-cols-2 gap-6 md:flex md:justify-start md:items-stretch md:gap-4 md:divide-x md:divide-gray-200 md:border-l md:border-gray-200/30 md:pl-6">
              <div className="w-full md:w-48 px-0 md:px-4 flex flex-col items-start">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 text-left">
                  Navegação
                </h3>
                <ul className="space-y-2 text-left">
                  <li>
                    <Link to="/anuncios" className="text-sm text-gray-600 hover:text-gray-900 transition-colors md:whitespace-nowrap break-words">
                      Ver Anúncios
                    </Link>
                  </li>
                  <li>
                    <Link to="/anunciar" onClick={handleNavClickTop} className="text-sm text-gray-600 hover:text-gray-900 transition-colors md:whitespace-nowrap break-words">
                      Anunciar Equipamento
                    </Link>
                  </li>
                  <li>
                    <Link to="/anuncie-sua-marca" onClick={handleNavClickTop} className="text-sm text-gray-600 hover:text-gray-900 transition-colors md:whitespace-nowrap break-words">
                      Anuncie sua Marca
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="w-full md:w-48 px-0 md:px-4 flex flex-col items-start">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 text-left">
                  Empresa
                </h3>
                <ul className="space-y-2 text-left">
                  <li>
                    <Link to="/empresa#sobre" className="text-sm text-gray-600 hover:text-gray-900 transition-colors md:whitespace-nowrap break-words">
                      Sobre
                    </Link>
                  </li>
                  <li>
                    <Link to="/empresa#contato" className="text-sm text-gray-600 hover:text-gray-900 transition-colors md:whitespace-nowrap break-words">
                      Contato
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="w-full md:w-48 px-0 md:px-4 flex flex-col items-start sm:col-span-2 md:col-span-1">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 text-left">
                  Legal
                </h3>
                <ul className="space-y-2 text-left">
                  <li>
                    <Link to="/legal#termos" className="text-sm text-gray-600 hover:text-gray-900 transition-colors md:whitespace-nowrap break-words">
                      Termos de Uso
                    </Link>
                  </li>
                  <li>
                    <Link to="/legal#privacidade" className="text-sm text-gray-600 hover:text-gray-900 transition-colors md:whitespace-nowrap break-words">
                      Política de Privacidade
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              © {new Date().getFullYear()} Reconectare. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>

      {isAdmin && isEditingFooter && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-6 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded shadow-lg p-6 relative my-6">
            <button onClick={() => setIsEditingFooter(false)} className="absolute right-3 top-3 p-2"><X /></button>
            <h3 className="text-lg font-bold mb-4">Editar Rodapé</h3>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Texto descritivo</label>
              <textarea
                value={editingFooter.description}
                onChange={(e) => setEditingFooter((s) => ({ ...s, description: e.target.value }))}
                rows="3"
                className="border rounded px-3 py-2 w-full"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Ícones sociais (até 5, opcionais)</label>
              <div className="space-y-3">
                {Array.from({ length: 5 }, (_, idx) => idx).map((idx) => {
                  const icon = editingFooter.socialIcons?.[idx] || { id: idx + 1, image: '', link: '' };
                  return (
                    <div key={idx} className="border rounded p-3 bg-gray-50">
                      <div className="text-xs font-semibold text-gray-700 mb-2">Ícone {idx + 1}</div>
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2 items-center">
                        <label className="text-sm px-3 py-2 border rounded bg-white cursor-pointer hover:bg-gray-50 text-center">
                          Upload
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleIconUpload(e, idx)}
                          />
                        </label>

                        <input
                          type="text"
                          value={icon.link || ''}
                          onChange={(e) => {
                            const nextIcons = [...(editingFooter.socialIcons || [])];
                            while (nextIcons.length < 5) nextIcons.push({ id: nextIcons.length + 1, image: '', link: '' });
                            nextIcons[idx] = { ...nextIcons[idx], link: e.target.value };
                            setEditingFooter((s) => ({ ...s, socialIcons: nextIcons.slice(0, 5) }));
                          }}
                          className="border rounded px-3 py-2 w-full text-sm"
                          placeholder="https://..."
                        />

                        <button
                          type="button"
                          onClick={() => {
                            const nextIcons = [...(editingFooter.socialIcons || [])];
                            while (nextIcons.length < 5) nextIcons.push({ id: nextIcons.length + 1, image: '', link: '' });
                            nextIcons[idx] = { ...nextIcons[idx], image: '', link: '' };
                            setEditingFooter((s) => ({ ...s, socialIcons: nextIcons.slice(0, 5) }));
                          }}
                          className="px-3 py-2 border rounded hover:bg-gray-100 text-sm"
                        >
                          Limpar
                        </button>
                      </div>

                      {icon.image && (
                        <div className="mt-2">
                          <img src={icon.image} alt={`Prévia ${idx + 1}`} className="w-8 h-8 object-contain" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  if (!window.confirm('Tem certeza que deseja salvar as alterações?')) return;
                  updateFooterConfig({
                    ...editingFooter,
                    socialIcons: (editingFooter.socialIcons || []).slice(0, 5)
                  });
                  setIsEditingFooter(false);
                }}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
              >
                Salvar
              </button>
              <button
                onClick={() => {
                  setEditingFooter(footerConfig);
                  setIsEditingFooter(false);
                }}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;