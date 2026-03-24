import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { useDataPages } from '@/contexts/DataPages';
import { useUsers } from '@/contexts/DataUser';
import { useToast } from '@/components/ui/use-toast';
import AdBannerSystem from '@/components/AdBannerSystem';
import FilePicker from '@/components/ui/file-picker';
import { uploadMediaRequest } from '@/services/mediaApi';
import { Check, Package, DollarSign, Tag, MapPin, User, Phone, Mail, FileText, X, Image as ImageIcon, Film } from 'lucide-react';

const STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const MAX_IMAGES = 9;
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024;
const IMAGE_MIME_ALLOWLIST = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const VIDEO_MIME_ALLOWLIST = new Set(['video/mp4', 'video/webm', 'video/ogg']);

const PostEquipmentPage = () => {
  const { equipmentTypes, brands, createListing } = useData();
  const { postEquipmentWhatsAppConfig, updatePostEquipmentWhatsAppConfig } = useDataPages();
  const { currentUser } = useUsers();
  const { toast } = useToast();
  const isAdmin = currentUser?.role === 'Admin';
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    type: '',
    brand: '',
    model: '',
    price: '',
    condition: '',
    city: '',
    state: '',
    description: '',
    sellerName: '',
    whatsapp: '',
    otherType: '',
    otherBrand: '',
    email: ''
  });

  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editingConfig, setEditingConfig] = useState(postEquipmentWhatsAppConfig);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState('');
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  useEffect(() => {
    setEditingConfig(postEquipmentWhatsAppConfig);
  }, [postEquipmentWhatsAppConfig]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'Lojista') return;

    setFormData((prev) => ({
      ...prev,
      sellerName: prev.sellerName || currentUser.nome || '',
      email: prev.email || currentUser.email || '',
      whatsapp: prev.whatsapp || String(currentUser.telefone || '').replace(/\D/g, '').slice(0, 11)
    }));
  }, [currentUser]);

  // Formatação de moeda (exibe em R$ enquanto armazena número em reais)
  const formatCurrency = (value) => {
    if (value === '' || value == null) return '';
    try {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
    } catch (e) {
      return value;
    }
  };

  const handlePriceChange = (e) => {
    const raw = String(e.target.value).replace(/\D/g, ''); // apenas dígitos
    const cents = raw ? parseInt(raw, 10) : 0;
    const numberValue = cents / 100; // converte para reais
    setFormData(prev => ({ ...prev, price: numberValue }));
    if (errors.price) setErrors(prev => ({ ...prev, price: '' }));
  };

  // Formata telefone para exibição: (XX)XXXXX-XXXX ou (XX)XXXX-XXXX
  const formatPhone = (digits) => {
    if (!digits) return '';
    const d = String(digits).replace(/\D/g, '');
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
    if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
    // 11 or more
    return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7,11)}`;
  };

  const handleWhatsAppChange = (e) => {
    const raw = String(e.target.value).replace(/\D/g, '');
    // limit to max 11 digits
    const limited = raw.slice(0, 11);
    setFormData(prev => ({ ...prev, whatsapp: limited }));
    if (errors.whatsapp) setErrors(prev => ({ ...prev, whatsapp: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.type) newErrors.type = 'Campo obrigatório';
  if (formData.type === 'Outros' && !formData.otherType) newErrors.otherType = 'Informe o tipo';
    if (!formData.brand) newErrors.brand = 'Campo obrigatório';
  if (formData.brand === 'Outros' && !formData.otherBrand) newErrors.otherBrand = 'Informe a marca';
    if (!formData.model) newErrors.model = 'Campo obrigatório';
    if (!formData.price) newErrors.price = 'Campo obrigatório';
    if (!formData.condition) newErrors.condition = 'Campo obrigatório';
    if (!formData.city) newErrors.city = 'Campo obrigatório';
    if (!formData.state) newErrors.state = 'Campo obrigatório';
    if (!formData.sellerName) newErrors.sellerName = 'Campo obrigatório';
    // whatsapp should be 10 or 11 digits
    const whatsDigits = String(formData.whatsapp || '').replace(/\D/g, '');
    if (!whatsDigits || (whatsDigits.length !== 10 && whatsDigits.length !== 11)) newErrors.whatsapp = 'Número de WhatsApp inválido';
    if (!formData.email) newErrors.email = 'Campo obrigatório';

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Erro no envio',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive'
      });
      return;
    }

    if (isUploadingImages || isUploadingVideo) {
      toast({
        title: 'Upload em andamento',
        description: 'Aguarde o upload de mídia finalizar antes de enviar.',
        variant: 'destructive'
      });
      return;
    }

    if (!window.confirm('Tem certeza que deseja criar este anuncio?')) {
      return;
    }

  const typeValue = formData.type === 'Outros' ? formData.otherType : formData.type;
  const brandValue = formData.brand === 'Outros' ? formData.otherBrand : formData.brand;
  const conditionValue = formData.condition;
  const stateValue = formData.state;

    const newListing = {
      name: `${typeValue} ${brandValue} ${formData.model}`,
      price: Number(formData.price),
      status: 'Pendente',
      type: typeValue,
      brand: brandValue,
      model: formData.model,
      description: formData.description || 'Equipamento odontológico usado.',
      specs: {
        Marca: brandValue,
        Modelo: formData.model,
        Condição: conditionValue
      },
      location: `${formData.city} - ${stateValue}`,
      seller: {
        name: formData.sellerName,
        whatsapp: formatPhone(formData.whatsapp),
        email: formData.email
      },
      image: selectedImages[0] || null,
      images: selectedImages,
      videoUrl: selectedVideoUrl
    };

    const createResult = await createListing(newListing);
    if (!createResult?.success) {
      toast({
        title: 'Erro ao enviar anúncio',
        description: createResult?.message || 'Não foi possível salvar no banco de dados.',
        variant: 'destructive'
      });
      return;
    }

    setSubmitted(true);

    toast({
      title: 'Anúncio enviado',
      description: 'Solicitação enviada. O anúncio ficará pendente até aprovação de um administrador ou vendedor.'
    });
  };

  const handleImagesUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    if (selectedImages.length + files.length > MAX_IMAGES) {
      toast({
        title: 'Limite de imagens',
        description: `Voce pode adicionar no maximo ${MAX_IMAGES} imagens por anuncio.`,
        variant: 'destructive'
      });
      return;
    }

    const invalidType = files.find((file) => !IMAGE_MIME_ALLOWLIST.has(file.type));
    if (invalidType) {
      toast({
        title: 'Formato de imagem invalido',
        description: 'Use apenas JPG, PNG, WEBP ou GIF.',
        variant: 'destructive'
      });
      return;
    }

    const oversized = files.find((file) => file.size > MAX_IMAGE_SIZE_BYTES);
    if (oversized) {
      toast({
        title: 'Imagem muito grande',
        description: 'Cada imagem deve ter no maximo 10MB.',
        variant: 'destructive'
      });
      return;
    }

    setIsUploadingImages(true);
    try {
      const uploads = await Promise.all(files.map((file) => uploadMediaRequest(null, file)));
      const uploadedUrls = uploads.map((item) => item?.url).filter(Boolean);
      setSelectedImages((prev) => {
        const deduped = Array.from(new Set([...prev, ...uploadedUrls]));
        return deduped.slice(0, MAX_IMAGES);
      });
      toast({
        title: 'Imagens enviadas',
        description: `${uploadedUrls.length} arquivo(s) enviado(s) com sucesso.`
      });
    } catch (error) {
      toast({
        title: 'Erro no upload de imagens',
        description: error?.message || 'Nao foi possivel enviar as imagens.',
        variant: 'destructive'
      });
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleVideoUpload = async (event) => {
    const file = (event.target.files || [])[0];
    if (!file) return;

    if (!VIDEO_MIME_ALLOWLIST.has(file.type)) {
      toast({
        title: 'Formato de video invalido',
        description: 'Use apenas MP4, WEBM ou OGG.',
        variant: 'destructive'
      });
      return;
    }

    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      toast({
        title: 'Video muito grande',
        description: 'O video deve ter no maximo 50MB.',
        variant: 'destructive'
      });
      return;
    }

    setIsUploadingVideo(true);
    try {
      const upload = await uploadMediaRequest(null, file);
      setSelectedVideoUrl(upload?.url || '');
      toast({
        title: 'Video enviado',
        description: 'Video adicionado ao anuncio com sucesso.'
      });
    } catch (error) {
      toast({
        title: 'Erro no upload de video',
        description: error?.message || 'Nao foi possivel enviar o video.',
        variant: 'destructive'
      });
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleRemoveImage = (urlToRemove) => {
    setSelectedImages((prev) => prev.filter((url) => url !== urlToRemove));
  };

  const handleRemoveVideo = () => {
    setSelectedVideoUrl('');
  };

  const handleSupportWhatsApp = () => {
    const targetWhatsApp = String(postEquipmentWhatsAppConfig.whatsappNumber || '').replace(/\D/g, '');
    if (!targetWhatsApp) return;

    const message = encodeURIComponent('Olá! Enviei meu anúncio para análise e tenho dúvidas sobre o processo.');
    window.open(`https://wa.me/${targetWhatsApp}?text=${message}`, '_blank');
  };

  const handleSaveConfig = () => {
    if (!window.confirm('Tem certeza que deseja salvar as alterações?')) return;
    updatePostEquipmentWhatsAppConfig(editingConfig);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditingConfig(postEquipmentWhatsAppConfig);
    setIsEditing(false);
  };

  if (submitted) {
    return (
      <>
        <Helmet>
    <title>Anúncio enviado para análise - Reconectare</title>
        </Helmet>

        <div className="min-h-screen bg-gray-50 pt-24 pb-12 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-xl shadow-lg p-10 text-center max-w-md w-full"
          >
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7 text-green-600" />
            </div>
            <h1 className="text-xl font-bold mb-2">
              Anúncio enviado com sucesso
            </h1>
            <p className="text-sm text-gray-600 mb-6">
              Sua solicitação ficará pendente para avaliação e poderá ir ao ar em até 5 dias úteis.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => (window.location.href = '/anuncios')}
                className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 rounded-md text-sm font-medium transition-colors"
              >
                Ver anúncios
              </button>
              <button
                onClick={handleSupportWhatsApp}
                className="border border-gray-300 hover:bg-gray-100 text-gray-800 px-6 py-3 rounded-md text-sm font-medium transition-colors inline-flex items-center justify-center gap-2"
              >
                <img src="/WhatsApplogo.svg" alt="WhatsApp" className="w-4 h-4" />
                Dúvidas? Falar no WhatsApp
              </button>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Anunciar equipamento - Reconectare</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        {/* Banner de Anúncio 7 - Acima do Formulário */}
        <AdBannerSystem bannerId="banner7" position="Acima do Formulário de Anúncio" />
        
        <div className="max-w-2xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <h1 className="text-3xl font-bold mb-2 text-gray-800">Formulário de Anúncio de Equipamento</h1>
            <p className="text-sm text-gray-600">
              Todos os anúncios são analisados pela nossa equipe antes da publicação.
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            onSubmit={handleSubmit}
            className="bg-white rounded-md shadow-sm p-4 sm:p-10 space-y-6 sm:space-y-10"
          >
            {/* DADOS DO EQUIPAMENTO */}
            <div>
              <h2 className="text-lg font-bold mb-6 text-gray-800">Dados do Equipamento</h2>

              <div className="space-y-6">
                {/* Tipo (select) */}
                <div>
                  <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Tipo *</label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className={`w-full border ${errors.type ? 'border-red-300' : 'border-gray-200'} rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors`}
                    >
                      <option value="">Selecionar tipo</option>
                      {equipmentTypes.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  {formData.type === 'Outros' && (
                    <input
                      name="otherType"
                      placeholder="Especifique o tipo"
                      value={formData.otherType}
                      onChange={handleChange}
                      className={`mt-3 w-full border ${errors.otherType ? 'border-red-300' : 'border-gray-200'} rounded-md px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors`}
                    />
                  )}
                </div>

                {/* Marca (select) */}
                <div>
                  <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Marca *</label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      className={`w-full border ${errors.brand ? 'border-red-300' : 'border-gray-200'} rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors`}
                    >
                      <option value="">Selecionar marca</option>
                      {brands.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  {formData.brand === 'Outros' && (
                    <input
                      name="otherBrand"
                      placeholder="Especifique a marca"
                      value={formData.otherBrand}
                      onChange={handleChange}
                      className={`mt-3 w-full border ${errors.otherBrand ? 'border-red-300' : 'border-gray-200'} rounded-md px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors`}
                    />
                  )}
                </div>

                {/* Modelo */}
                <div>
                  <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Modelo *</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      name="model"
                      placeholder="Ex: 2000XL"
                      value={formData.model}
                      onChange={handleChange}
                      className={`w-full border ${errors.model ? 'border-red-300' : 'border-gray-200'} rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors`}
                    />
                  </div>
                </div>

                {/* Preço */}
                <div>
                  <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Preço *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      name="price"
                      placeholder="R$ 0,00"
                      value={formData.price ? formatCurrency(formData.price) : ''}
                      onChange={handlePriceChange}
                      className={`w-full border ${errors.price ? 'border-red-300' : 'border-gray-200'} rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors`}
                    />
                  </div>
                </div>

                {/* Condição (select) */}
                <div>
                  <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Condição *</label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      name="condition"
                      value={formData.condition}
                      onChange={handleChange}
                      className={`w-full border ${errors.condition ? 'border-red-300' : 'border-gray-200'} rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors`}
                    >
                      <option value="">Selecionar condição</option>
                      <option value="Excelente">Excelente (sem sinais de uso)</option>
                      <option value="Bom">Bom (uso moderado)</option>
                      <option value="Regular">Regular (pode requerer reparos)</option>
                    </select>
                  </div>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Descrição</label>
                  <textarea
                    name="description"
                    placeholder="Descreva o equipamento: estado, funcionalidades, histórico, etc."
                    value={formData.description}
                    onChange={handleChange}
                    rows={6}
                    className={`w-full border ${errors.description ? 'border-red-300' : 'border-gray-200'} rounded-md px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors resize-vertical`}
                  />
                </div>
              </div>
            </div>

            {/* MIDIA DO ANUNCIO */}
            <div className="border-t pt-6 sm:pt-10">
              <h2 className="text-lg font-bold mb-6 text-gray-800">Midia do Anúncio</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Imagens (até 9)</label>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <ImageIcon className="w-4 h-4" />
                    <span>Formatos: JPG, PNG, WEBP, GIF. Máximo 10MB por imagem.</span>
                  </div>
                  <FilePicker
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    onChange={handleImagesUpload}
                    disabled={isUploadingImages || selectedImages.length >= MAX_IMAGES}
                    buttonLabel={isUploadingImages ? 'Enviando imagens...' : 'Selecionar imagens'}
                    emptyLabel={selectedImages.length ? `${selectedImages.length} imagem(ns) adicionada(s)` : 'Nenhuma imagem selecionada'}
                  />
                  {!!selectedImages.length && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedImages.map((imageUrl, index) => (
                        <div key={`${imageUrl}-${index}`} className="flex items-center justify-between gap-3 rounded-md border border-gray-200 px-3 py-2">
                          <span className="text-xs text-gray-700 truncate">Imagem {index + 1}: {imageUrl.split('/').pop()}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(imageUrl)}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            Remover
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Video (até 1)</label>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <Film className="w-4 h-4" />
                    <span>Formatos: MP4, WEBM, OGG. Máximo 50MB.</span>
                    
                  </div>
                  <FilePicker
                    accept="video/mp4,video/webm,video/ogg"
                    onChange={handleVideoUpload}
                    disabled={isUploadingVideo}
                    buttonLabel={isUploadingVideo ? 'Enviando video...' : 'Selecionar video'}
                    emptyLabel={selectedVideoUrl ? '1 video adicionado' : 'Nenhum video selecionado'}
                  />
                  {!!selectedVideoUrl && (
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-gray-200 px-3 py-2">
                      <span className="text-xs text-gray-700 truncate">{selectedVideoUrl.split('/').pop()}</span>
                      <button
                        type="button"
                        onClick={handleRemoveVideo}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* LOCALIZAÇÃO */}
            <div className="border-t pt-6 sm:pt-10">
              <h2 className="text-lg font-bold mb-6 text-gray-800">Localização</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Cidade *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      name="city"
                      placeholder="Ex: São Paulo"
                      value={formData.city}
                      onChange={handleChange}
                      className={`w-full border ${errors.city ? 'border-red-300' : 'border-gray-200'} rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Estado *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className={`w-full border ${errors.state ? 'border-red-300' : 'border-gray-200'} rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors`}
                    >
                      <option value="">Selecionar estado</option>
                      {STATES.map((uf) => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* CONTATO */}
            <div className="border-t pt-6 sm:pt-10">
              <h2 className="text-lg font-bold mb-6 text-gray-800">Dados de Contato</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Nome do anunciante *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      name="sellerName"
                      placeholder="Nome completo"
                      value={formData.sellerName}
                      onChange={handleChange}
                      className={`w-full border ${errors.sellerName ? 'border-red-300' : 'border-gray-200'} rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">WhatsApp *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      name="whatsapp"
                      placeholder="(11) 99999-9999"
                      value={formatPhone(formData.whatsapp)}
                      onChange={handleWhatsAppChange}
                      className={`w-full border ${errors.whatsapp ? 'border-red-300' : 'border-gray-200'} rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      placeholder="seu@exemplo.com"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full border ${errors.email ? 'border-red-300' : 'border-gray-200'} rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className={`relative mt-10 ${isAdmin ? 'border-2 border-blue-300 rounded-lg p-4' : ''}`}>
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
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={isUploadingImages || isUploadingVideo}
                className="w-full bg-gray-800 text-white py-3 rounded-md font-medium text-sm hover:bg-gray-900 transition-colors"
              >
                {isUploadingImages || isUploadingVideo ? 'Aguarde o upload...' : postEquipmentWhatsAppConfig.buttonText}
              </motion.button>
            </div>
          </motion.form>
        </div>
        
        {/* Banner de Anúncio 8 - Acima do Footer */}
        <AdBannerSystem bannerId="banner8" position="Acima do Footer" />
      </div>

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
                  placeholder="Enviar para Análise"
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

export default PostEquipmentPage;