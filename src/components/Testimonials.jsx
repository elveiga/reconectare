import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDataPages } from '@/contexts/DataPages';
import { Quote, User } from 'lucide-react';
import { useUsers } from '@/contexts/DataUser';
import { X } from 'lucide-react';
import { uploadMediaRequest } from '@/services/mediaApi';
import { getRuntimeToken } from '@/lib/authSession';
import FilePicker from '@/components/ui/file-picker';

const EMPTY_SLOT = (id) => ({ id, name: '', role: '', image: '', quote: '' });

const ensureSlots = (config) => {
  const raw = Array.isArray(config?.testimonials) ? config.testimonials : [];
  const slots = raw.map((item, idx) => ({
    id: Number(item?.id) || idx + 1,
    name: typeof item?.name === 'string' ? item.name : '',
    role: typeof item?.role === 'string' ? item.role : '',
    image: typeof item?.image === 'string' ? item.image : '',
    quote: typeof item?.quote === 'string' ? item.quote : '',
  }));
  while (slots.length < 5) slots.push(EMPTY_SLOT(slots.length + 1));
  return {
    title: typeof config?.title === 'string' ? config.title : 'O que nossos clientes dizem?',
    subtitle: typeof config?.subtitle === 'string'
      ? config.subtitle
      : 'Depoimentos de dentistas e clínicas que confiam na Reconectare.',
    testimonials: slots.slice(0, 5),
  };
};

const Testimonials = () => {
  const { testimonialsConfig, updateTestimonialsConfig } = useDataPages();
  const { currentUser } = useUsers();
  const isAdmin = currentUser?.role === 'Admin';
  const normalizedConfig = ensureSlots(testimonialsConfig);
  const [isEditingTestimonials, setIsEditingTestimonials] = useState(false);
  const [editingConfig, setEditingConfig] = useState(() => normalizedConfig);
  const [uploadingTestimonialIndex, setUploadingTestimonialIndex] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    setEditingConfig(normalizedConfig);
  }, [normalizedConfig]);
  
  // Filtrar apenas comentários preenchidos (que têm nome e quote)
  const testimonials = normalizedConfig.testimonials.filter(
    (t) => t.name.trim() && t.quote.trim()
  );

  if (!testimonials.length && !isAdmin) return null;

  const handleTestimonialImageUpload = async (idx, event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const token = getRuntimeToken();
    if (!token) {
      alert('Faça login para enviar imagem.');
      return;
    }

    try {
      setUploadingTestimonialIndex(idx);
      const upload = await uploadMediaRequest(token, file);
      setEditingConfig((prev) => {
        const next = [...prev.testimonials];
        next[idx] = { ...next[idx], image: upload.url };
        return { ...prev, testimonials: next };
      });
    } catch (error) {
      alert(error?.message || 'Falha ao enviar imagem do comentário.');
    } finally {
      setUploadingTestimonialIndex(null);
    }
  };

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`relative rounded-lg ${isAdmin ? 'border-2 border-blue-300 p-4' : ''}`}>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setIsEditingTestimonials(true)}
            className="absolute top-2 right-2 text-xs px-3 py-1 rounded border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
          >
            Editar
          </button>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {normalizedConfig.title}
          </h2>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto">
            {normalizedConfig.subtitle}
          </p>
        </motion.div>

        <div className="mt-6">
          {testimonials.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
              <Quote className="w-10 h-10 mb-3 text-gray-300" />
              <p className="text-sm font-medium">Nenhum depoimento cadastrado ainda.</p>
              <p className="text-xs mt-1">Clique em <strong>Editar</strong> para adicionar depoimentos.</p>
            </div>
          ) : (
          <div
            className="marquee"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div
              className="marquee-track"
              style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
            >
              {testimonials.concat(testimonials).map((testimonial, idx) => (
                <div
                  key={`${testimonial.id}-${idx}`}
                  className="marquee-item bg-white rounded-lg p-6 shadow-md overflow-hidden flex flex-col justify-between w-[320px] sm:w-[360px] md:w-[420px] lg:w-[460px] h-[220px] transform transition-transform duration-200 ease-out hover:scale-105 hover:z-20"
                >
                  <Quote className="w-6 h-6 text-gray-300 mb-3" />
                  <p className="text-gray-700 mb-4 italic text-sm overflow-hidden">
                    “{testimonial.quote}”
                  </p>
                  <div className="flex items-center gap-3">
                    {testimonial.image ? (
                      <img
                        src={testimonial.image}
                        alt={testimonial.name}
                        loading="lazy"
                        decoding="async"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-400" />
                      </div>
                    )}

                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {testimonial.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}
        </div>
        </div>
      </div>

      {isAdmin && isEditingTestimonials && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-6 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded shadow-lg p-6 relative my-6">
            <button onClick={() => setIsEditingTestimonials(false)} className="absolute right-3 top-3 p-2"><X /></button>
            <h3 className="text-lg font-bold mb-4">Editar Comentários</h3>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">Título</label>
              <input
                type="text"
                value={editingConfig.title}
                onChange={(e) => setEditingConfig((s) => ({ ...s, title: e.target.value }))}
                className="border rounded px-3 py-2 w-full"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">Subtítulo</label>
              <input
                type="text"
                value={editingConfig.subtitle}
                onChange={(e) => setEditingConfig((s) => ({ ...s, subtitle: e.target.value }))}
                className="border rounded px-3 py-2 w-full"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-3">Comentários (até 5)</label>
              {(editingConfig.testimonials || []).map((testimonial, idx) => (
                <div key={testimonial.id} className="border rounded p-4 mb-4 bg-gray-50">
                  <h4 className="font-semibold mb-3">Comentário {idx + 1}</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Nome</label>
                      <input
                        type="text"
                        value={testimonial.name}
                        onChange={(e) => {
                          const next = [...editingConfig.testimonials];
                          next[idx] = { ...next[idx], name: e.target.value };
                          setEditingConfig((s) => ({ ...s, testimonials: next }));
                        }}
                        className="border rounded px-2 py-2 w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Cargo/Clínica</label>
                      <input
                        type="text"
                        value={testimonial.role}
                        onChange={(e) => {
                          const next = [...editingConfig.testimonials];
                          next[idx] = { ...next[idx], role: e.target.value };
                          setEditingConfig((s) => ({ ...s, testimonials: next }));
                        }}
                        className="border rounded px-2 py-2 w-full text-sm"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="block text-xs text-gray-600 mb-1">Imagem (opcional)</label>
                    <FilePicker
                      accept="image/*"
                      onChange={(e) => handleTestimonialImageUpload(idx, e)}
                      buttonLabel="Selecionar imagem"
                      emptyLabel="Nenhum arquivo selecionado"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">
                      {uploadingTestimonialIndex === idx ? 'Enviando imagem...' : (testimonial.image ? 'Imagem enviada com sucesso.' : 'Sem imagem enviada.')}
                    </p>
                    {testimonial.image && (
                      <img src={testimonial.image} alt={`Prévia comentário ${idx + 1}`} className="mt-2 w-12 h-12 rounded-full object-cover border" />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Comentário</label>
                    <textarea
                      value={testimonial.quote}
                      onChange={(e) => {
                        const next = [...editingConfig.testimonials];
                        next[idx] = { ...next[idx], quote: e.target.value };
                        setEditingConfig((s) => ({ ...s, testimonials: next }));
                      }}
                      className="border rounded px-2 py-2 w-full text-sm"
                      rows="3"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  if (!window.confirm('Tem certeza que deseja salvar as alterações?')) return;
                  updateTestimonialsConfig(editingConfig);
                  setIsEditingTestimonials(false);
                }}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
              >
                Salvar
              </button>
              <button
                onClick={() => {
                  setEditingConfig(normalizedConfig);
                  setIsEditingTestimonials(false);
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

export default Testimonials;