import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useDataPages } from '@/contexts/DataPages';
import { useUsers } from '@/contexts/DataUser';
import PricingPlans from '@/components/PricingPlans';

const AdvertisePage = () => {
  const { toast } = useToast();
  const { advertiseWhatsAppConfig, updateAdvertiseWhatsAppConfig } = useDataPages();
  const { currentUser } = useUsers();
  const isAdmin = currentUser?.role === 'Admin';

  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editingConfig, setEditingConfig] = useState(advertiseWhatsAppConfig);

  useEffect(() => {
    setEditingConfig(advertiseWhatsAppConfig);
  }, [advertiseWhatsAppConfig]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'Lojista') return;

    setFormData((prev) => ({
      ...prev,
      companyName: prev.companyName || currentUser.nome || '',
      contactPerson: prev.contactPerson || currentUser.nome || '',
      email: prev.email || currentUser.email || '',
      phone: prev.phone || currentUser.telefone || ''
    }));
  }, [currentUser]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.companyName) newErrors.companyName = 'Informe o nome da empresa';
    if (!formData.contactPerson) newErrors.contactPerson = 'Informe o nome do contato';
    if (!formData.email) newErrors.email = 'Informe o email';
    if (!formData.phone) newErrors.phone = 'Informe o telefone';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleWhatsAppClick = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Erro no formulário",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    // Construir mensagem do WhatsApp com os dados do formulário
    const message = `Olá! Gostaria de saber mais sobre os planos de anúncio.

*Dados da empresa:*
- Empresa: ${formData.companyName}
- Contato: ${formData.contactPerson}
- Email: ${formData.email}
- Telefone: ${formData.phone}${formData.message ? `\n- Mensagem: ${formData.message}` : ''}`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${advertiseWhatsAppConfig.whatsappNumber}?text=${encodedMessage}`, '_blank');
  };

  const handleSaveConfig = () => {
    if (!window.confirm('Tem certeza que deseja salvar as alterações?')) return;
    updateAdvertiseWhatsAppConfig(editingConfig);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditingConfig(advertiseWhatsAppConfig);
    setIsEditing(false);
  };

  return (
    <>
      <Helmet>
        <title>Anuncie sua Marca - Reconectare</title>
        <meta 
          name="description" 
          content="Anuncie sua Marca na Reconectare e conecte-se com dentistas e clínicas em todo o Brasil" 
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Pricing Plans - Moved to Top */}
          <PricingPlans />

          {/* Intro Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10 mt-12"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <h1 className="text-3xl font-bold text-gray-900">
                Anuncie sua Marca
              </h1>
            </div>
            <p className="text-base text-gray-600 max-w-3xl mx-auto">
              Conecte sua marca com profissionais e clínicas odontológicas em todo o Brasil. Divulgue seus produtos e serviços em uma plataforma especializada em equipamentos odontológicos.
            </p>
          </motion.div>

          {/* Contact Form */}
          <div className="max-w-3xl mx-auto mt-8 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Entre em contato</h2>
              <p className="text-sm text-gray-600 mb-6">
                Preencha o formulário abaixo e clique no botão para iniciar uma conversa com nossa equipe comercial via WhatsApp.
              </p>

              <form onSubmit={handleWhatsAppClick} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-1.5">
                    Nome da empresa *
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Sua empresa"
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-gray-900 ${
                      errors.companyName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-1.5">
                    Nome do contato *
                  </label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    placeholder="Seu nome"
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-gray-900 ${
                      errors.contactPerson ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.contactPerson && <p className="text-red-500 text-xs mt-1">{errors.contactPerson}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-900 mb-1.5">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="seu@email.com"
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-gray-900 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-900 mb-1.5">
                      Telefone *
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="(11) 99999-9999"
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-gray-900 ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-1.5">
                    Mensagem (opcional)
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Conte-nos mais sobre sua empresa e objetivos..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-gray-900"
                  />
                </div>

                {/* Button with Admin Edit */}
                <div className={`relative mt-6 ${isAdmin ? 'border-2 border-blue-300 rounded-lg p-4' : ''}`}>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="absolute top-2 right-2 text-xs px-3 py-1 rounded border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors z-10"
                    >
                      Editar
                    </button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg font-semibold shadow-md hover:bg-green-600 transition-colors text-sm"
                  >
                    <img src="/WhatsApplogo.svg" alt="WhatsApp" className="w-5 h-5" />
                    {advertiseWhatsAppConfig.buttonText}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>

          {/* Benefits Section - Moved to Bottom */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-xl p-6 shadow-md"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-1">Público Qualificado</h3>
              <p className="text-sm text-gray-600">
                Alcance profissionais e clínicas que estão ativamente procurando equipamentos odontológicos.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-white rounded-xl p-6 shadow-md"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-1">Visibilidade Máxima</h3>
              <p className="text-sm text-gray-600">
                Destaque sua marca em posições premium e ganhe mais visibilidade.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-white rounded-xl p-6 shadow-md"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-1">Cases de Sucesso</h3>
              <p className="text-sm text-gray-600">
                Conheça clientes que ampliaram alcance e vendas anunciando conosco.
              </p>
            </motion.div>
          </div>

        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-md shadow-lg p-8 max-w-md w-full relative"
          >
            <button
              onClick={handleCancelEdit}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-6">Editar Botão WhatsApp</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-600 font-medium mb-2">
                  Texto do Botão
                </label>
                <input
                  type="text"
                  value={editingConfig.buttonText}
                  onChange={(e) => setEditingConfig({ ...editingConfig, buttonText: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  placeholder="Falar com consultor sobre planos"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-600 font-medium mb-2">
                  Número do WhatsApp
                </label>
                <input
                  type="text"
                  value={editingConfig.whatsappNumber}
                  onChange={(e) => setEditingConfig({ ...editingConfig, whatsappNumber: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  placeholder="5511999999999"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={handleSaveConfig}
                className="flex-1 px-5 py-2.5 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors"
              >
                Salvar
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex-1 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default AdvertisePage;