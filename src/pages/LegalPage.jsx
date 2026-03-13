import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useDataPages } from '@/contexts/DataPages';
import { useUsers } from '@/contexts/DataUser';
import { X } from 'lucide-react';

const LegalPage = () => {
  const { termsConfig, privacyConfig, updateTermsConfig, updatePrivacyConfig } = useDataPages();
  const { currentUser } = useUsers();
  const location = useLocation();
  const isAdmin = currentUser?.role === 'Admin';

  const [isEditingTerms, setIsEditingTerms] = useState(false);
  const [isEditingPrivacy, setIsEditingPrivacy] = useState(false);
  const [termsEditing, setTermsEditing] = useState(termsConfig);
  const [privacyEditing, setPrivacyEditing] = useState(privacyConfig);

  useEffect(() => {
    setTermsEditing(termsConfig);
  }, [termsConfig]);

  useEffect(() => {
    setPrivacyEditing(privacyConfig);
  }, [privacyConfig]);

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        const header = document.querySelector('header');
        const headerOffset = header ? header.offsetHeight : 80;
        const extraGap = 16;
        const top = el.getBoundingClientRect().top + window.pageYOffset - headerOffset - extraGap;
        try {
          window.scrollTo({ top, behavior: 'smooth' });
        } catch (e) {
          window.scrollTo(0, top);
        }
        return;
      }
    }

    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      window.scrollTo(0, 0);
    }
  }, [location]);

  return (
    <>
      <Helmet>
        <title>Legal — Reconectare</title>
        <meta name="description" content="Termos de Uso e Política de Privacidade — Reconectare" />
      </Helmet>

      <div className="min-h-screen bg-white pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 space-y-8">
          <motion.section
            id="termos"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`bg-white rounded-lg shadow-sm p-6 relative ${isAdmin ? 'border-2 border-blue-300' : ''}`}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <h1 className="text-2xl font-bold">{termsConfig.title}</h1>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsEditingTerms(true)}
                  className="absolute top-3 right-3 text-xs px-3 py-1 rounded border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                >
                  Editar
                </button>
              )}
            </div>

            <p className="text-gray-700 mb-3">
              {termsConfig.intro}
            </p>

            {termsConfig.sections.map((section, idx) => (
              <React.Fragment key={idx}>
                <h3 className="font-semibold mt-4">{section.title}</h3>
                <p className="text-gray-700">{section.content}</p>
              </React.Fragment>
            ))}
          </motion.section>

          <motion.section
            id="privacidade"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.06 }}
            className={`bg-white rounded-lg shadow-sm p-6 relative ${isAdmin ? 'border-2 border-blue-300' : ''}`}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <h2 className="text-2xl font-bold">{privacyConfig.title}</h2>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsEditingPrivacy(true)}
                  className="absolute top-3 right-3 text-xs px-3 py-1 rounded border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                >
                  Editar
                </button>
              )}
            </div>

            <p className="text-gray-700 mb-3">{privacyConfig.intro}</p>

            {privacyConfig.sections.map((section, idx) => (
              <React.Fragment key={idx}>
                <h3 className="font-semibold mt-4">{section.title}</h3>
                <p className="text-gray-700">{section.content}</p>
              </React.Fragment>
            ))}

            <p className="text-sm text-gray-500 mt-4">Última atualização: {privacyConfig.lastUpdate}</p>
          </motion.section>
        </div>
      </div>

      {isAdmin && isEditingTerms && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-6 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded shadow-lg p-6 relative my-6">
            <button onClick={() => setIsEditingTerms(false)} className="absolute right-3 top-3 p-2"><X /></button>
            <h3 className="text-lg font-bold mb-4">Editar Termos de Uso</h3>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Título</label>
              <input type="text" value={termsEditing.title} onChange={(e) => setTermsEditing((s) => ({ ...s, title: e.target.value }))} className="border rounded px-3 py-2 w-full" />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Introdução</label>
              <textarea value={termsEditing.intro} onChange={(e) => setTermsEditing((s) => ({ ...s, intro: e.target.value }))} className="border rounded px-3 py-2 w-full" rows="3" />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Seções</label>
              {termsEditing.sections.map((section, idx) => (
                <div key={idx} className="border rounded p-3 mb-3 bg-gray-50">
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => {
                      const next = [...termsEditing.sections];
                      next[idx] = { ...next[idx], title: e.target.value };
                      setTermsEditing((s) => ({ ...s, sections: next }));
                    }}
                    className="border rounded px-2 py-1 w-full text-sm mb-2"
                    placeholder="Título da seção"
                  />
                  <textarea
                    value={section.content}
                    onChange={(e) => {
                      const next = [...termsEditing.sections];
                      next[idx] = { ...next[idx], content: e.target.value };
                      setTermsEditing((s) => ({ ...s, sections: next }));
                    }}
                    className="border rounded px-2 py-1 w-full text-sm"
                    rows="3"
                    placeholder="Conteúdo da seção"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => { if (!window.confirm('Tem certeza que deseja salvar as alterações?')) return; updateTermsConfig(termsEditing); setIsEditingTerms(false); }} className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900">Salvar</button>
              <button onClick={() => { setTermsEditing(termsConfig); setIsEditingTerms(false); }} className="px-4 py-2 border rounded hover:bg-gray-50">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {isAdmin && isEditingPrivacy && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-6 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded shadow-lg p-6 relative my-6">
            <button onClick={() => setIsEditingPrivacy(false)} className="absolute right-3 top-3 p-2"><X /></button>
            <h3 className="text-lg font-bold mb-4">Editar Política de Privacidade</h3>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Título</label>
              <input type="text" value={privacyEditing.title} onChange={(e) => setPrivacyEditing((s) => ({ ...s, title: e.target.value }))} className="border rounded px-3 py-2 w-full" />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Introdução</label>
              <textarea value={privacyEditing.intro} onChange={(e) => setPrivacyEditing((s) => ({ ...s, intro: e.target.value }))} className="border rounded px-3 py-2 w-full" rows="3" />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Seções</label>
              {privacyEditing.sections.map((section, idx) => (
                <div key={idx} className="border rounded p-3 mb-3 bg-gray-50">
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => {
                      const next = [...privacyEditing.sections];
                      next[idx] = { ...next[idx], title: e.target.value };
                      setPrivacyEditing((s) => ({ ...s, sections: next }));
                    }}
                    className="border rounded px-2 py-1 w-full text-sm mb-2"
                    placeholder="Título da seção"
                  />
                  <textarea
                    value={section.content}
                    onChange={(e) => {
                      const next = [...privacyEditing.sections];
                      next[idx] = { ...next[idx], content: e.target.value };
                      setPrivacyEditing((s) => ({ ...s, sections: next }));
                    }}
                    className="border rounded px-2 py-1 w-full text-sm"
                    rows="3"
                    placeholder="Conteúdo da seção"
                  />
                </div>
              ))}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Última atualização</label>
              <input type="text" value={privacyEditing.lastUpdate} onChange={(e) => setPrivacyEditing((s) => ({ ...s, lastUpdate: e.target.value }))} className="border rounded px-3 py-2 w-full" />
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => { if (!window.confirm('Tem certeza que deseja salvar as alterações?')) return; updatePrivacyConfig(privacyEditing); setIsEditingPrivacy(false); }} className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900">Salvar</button>
              <button onClick={() => { setPrivacyEditing(privacyConfig); setIsEditingPrivacy(false); }} className="px-4 py-2 border rounded hover:bg-gray-50">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LegalPage;
