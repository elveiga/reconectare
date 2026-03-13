import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useDataPages } from '@/contexts/DataPages';
import { useUsers } from '@/contexts/DataUser';
import { X } from 'lucide-react';

const CompanyPage = () => {
  const { aboutConfig, contactConfig, updateAboutConfig, updateContactConfig } = useDataPages();
  const { currentUser } = useUsers();
  const location = useLocation();
  const isAdmin = currentUser?.role === 'Admin';

  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [aboutEditing, setAboutEditing] = useState(aboutConfig);
  const [contactEditing, setContactEditing] = useState(contactConfig);

  useEffect(() => {
    setAboutEditing(aboutConfig);
  }, [aboutConfig]);

  useEffect(() => {
    setContactEditing(contactConfig);
  }, [contactConfig]);

  useEffect(() => {
    // if there's a hash (e.g. /empresa#contato) try to scroll to it
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        const header = document.querySelector('header');
        const headerOffset = header ? header.offsetHeight : 80;
        const extraGap = 16; // small gap so content isn't flush against header
        const top = el.getBoundingClientRect().top + window.pageYOffset - headerOffset - extraGap;
        try {
          window.scrollTo({ top, behavior: 'smooth' });
        } catch (e) {
          window.scrollTo(0, top);
        }
        return;
      }
    }

    // fallback: scroll to top of page
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      window.scrollTo(0, 0);
    }
  }, [location]);

  return (
    <>
      <Helmet>
        <title>Sobre — Reconectare</title>
        <meta name="description" content="Sobre a Reconectare — compra e venda de equipamentos odontológicos usados com curadoria." />
      </Helmet>

      <div className="min-h-screen bg-white pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            id="sobre"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`bg-white rounded-lg shadow-sm p-6 mb-8 relative ${isAdmin ? 'border-2 border-blue-300' : ''}`}
          >
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-3xl font-bold mb-3">{aboutConfig.title}</h1>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsEditingAbout(true)}
                  className="absolute top-3 right-3 text-xs px-3 py-1 rounded border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                >
                  Editar
                </button>
              )}
            </div>
            {aboutConfig.paragraphs.map((paragraph, idx) => (
              <p key={idx} className={`text-gray-700 leading-relaxed ${idx > 0 ? 'mt-4' : ''}`}>
                {paragraph}
              </p>
            ))}
          </motion.div>

          <motion.div
            id="contato"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className={`bg-white rounded-lg shadow-sm p-6 relative ${isAdmin ? 'border-2 border-blue-300' : ''}`}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-2xl font-bold mb-3">{contactConfig.title}</h2>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsEditingContact(true)}
                  className="absolute top-3 right-3 text-xs px-3 py-1 rounded border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                >
                  Editar
                </button>
              )}
            </div>

            <div className="space-y-3 text-gray-700">
              <div>
                <h3 className="text-sm font-semibold text-gray-600">E-mail</h3>
                <a
                  href={`mailto:${contactConfig.email}`}
                  className="text-green-700 hover:underline"
                >
                  {contactConfig.email}
                </a>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-600">WhatsApp</h3>
                <a
                  href={`https://wa.me/${contactConfig.whatsappNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-green-700 hover:underline"
                >
                  {contactConfig.displayPhone}
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {isAdmin && isEditingAbout && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-6 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded shadow-lg p-6 relative my-6">
            <button onClick={() => setIsEditingAbout(false)} className="absolute right-3 top-3 p-2"><X /></button>
            <h3 className="text-lg font-bold mb-4">Editar Sobre</h3>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Título</label>
              <input
                type="text"
                value={aboutEditing.title}
                onChange={(e) => setAboutEditing((s) => ({ ...s, title: e.target.value }))}
                className="border rounded px-3 py-2 w-full"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Parágrafo 1</label>
              <textarea
                value={aboutEditing.paragraphs[0] || ''}
                onChange={(e) => {
                  const next = [...(aboutEditing.paragraphs || ['', ''])];
                  next[0] = e.target.value;
                  setAboutEditing((s) => ({ ...s, paragraphs: next }));
                }}
                className="border rounded px-3 py-2 w-full"
                rows="4"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Parágrafo 2</label>
              <textarea
                value={aboutEditing.paragraphs[1] || ''}
                onChange={(e) => {
                  const next = [...(aboutEditing.paragraphs || ['', ''])];
                  next[1] = e.target.value;
                  setAboutEditing((s) => ({ ...s, paragraphs: next }));
                }}
                className="border rounded px-3 py-2 w-full"
                rows="4"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  if (!window.confirm('Tem certeza que deseja salvar as alterações?')) return;
                  updateAboutConfig(aboutEditing);
                  setIsEditingAbout(false);
                }}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
              >
                Salvar
              </button>
              <button
                onClick={() => {
                  setAboutEditing(aboutConfig);
                  setIsEditingAbout(false);
                }}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {isAdmin && isEditingContact && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-6 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded shadow-lg p-6 relative my-6">
            <button onClick={() => setIsEditingContact(false)} className="absolute right-3 top-3 p-2"><X /></button>
            <h3 className="text-lg font-bold mb-4">Editar Contato</h3>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Título</label>
              <input
                type="text"
                value={contactEditing.title}
                onChange={(e) => setContactEditing((s) => ({ ...s, title: e.target.value }))}
                className="border rounded px-3 py-2 w-full"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">E-mail</label>
              <input
                type="email"
                value={contactEditing.email}
                onChange={(e) => setContactEditing((s) => ({ ...s, email: e.target.value }))}
                className="border rounded px-3 py-2 w-full"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">WhatsApp (somente números)</label>
              <input
                type="text"
                value={contactEditing.whatsappNumber}
                onChange={(e) => setContactEditing((s) => ({ ...s, whatsappNumber: e.target.value }))}
                className="border rounded px-3 py-2 w-full"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Telefone para exibição</label>
              <input
                type="text"
                value={contactEditing.displayPhone}
                onChange={(e) => setContactEditing((s) => ({ ...s, displayPhone: e.target.value }))}
                className="border rounded px-3 py-2 w-full"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  if (!window.confirm('Tem certeza que deseja salvar as alterações?')) return;
                  updateContactConfig(contactEditing);
                  setIsEditingContact(false);
                }}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
              >
                Salvar
              </button>
              <button
                onClick={() => {
                  setContactEditing(contactConfig);
                  setIsEditingContact(false);
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

export default CompanyPage;

