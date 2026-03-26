import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { X, User, Mail, Phone, CreditCard, Shield, Lock, Package, Tag, FileText, DollarSign, MapPin } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useDataPages } from '@/contexts/DataPages';
import { useUsers } from '@/contexts/DataUser';
import { uploadMediaRequest } from '@/services/mediaApi';
import { getRuntimeToken } from '@/lib/authSession';
import FilePicker from '@/components/ui/file-picker';
import ProductImageManager from '@/components/ProductImageManager';

const formatBRL = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);
const onlyDigits = (s) => String(s || '').replace(/\D/g, '');

// Converte o texto do input em número BRL (assume últimos 2 dígitos como centavos)
const parseCurrencyInput = (raw) => {
  const digits = onlyDigits(raw);
  const cents = Number(digits || 0);
  return cents / 100;
};

const statusOptions = ['Pendente', 'Disponível', 'Reservado', 'Vendido', 'Recusado'];

const brasileiroUFs = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const parseLocation = (loc) => {
  if (!loc) return { city: '', uf: '' };
  const parts = loc.split(' - ');
  return { city: parts[0] || '', uf: parts[1] || '' };
};

const formatLocation = (city, uf) => {
  if (!city && !uf) return '';
  if (city && uf) return `${city} - ${uf}`;
  if (city) return city;
  if (uf) return ` - ${uf}`;
  return '';
};

const formatDateTime = (value) => {
  if (!value) return 'Sem data';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Sem data';
  return parsed.toLocaleString('pt-BR');
};

const roleLabel = (r) => {
  if (r === 'Admin') return 'Administrador';
  if (r === 'Seller') return 'Vendedor';
  if (r === 'Lojista') return 'Lojista';
  return r;
};

function UsersManagement({ users, createUser, updateUser, deleteUser }) {
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [createForm, setCreateForm] = useState({ nome: '', cpf: '', email: '', telefone: '', senha: '', role: 'Seller' });

  const openEdit = (u) => { setEditingUser(u.id); setEditForm({ ...u }); };
  const closeEdit = () => { setEditingUser(null); setEditForm(null); };

  const handleSaveUser = async () => {
    if (!editForm || !editingUser) return;
    if (!window.confirm('Tem certeza que deseja salvar as alterações deste usuário?')) return;
    const payload = { ...editForm };
    const res = await updateUser(editingUser, payload);
    if (res?.success) closeEdit();
    else alert(res?.message || 'Erro ao atualizar usuário');
  };

  const openCreate = () => setCreatingUser(true);
  const closeCreate = () => { setCreatingUser(false); setCreateForm({ nome: '', cpf: '', email: '', telefone: '', senha: '', role: 'Seller' }); };
  const handleCreate = async () => {
    if (!createForm.nome || !createForm.email) { alert('Preencha nome e e-mail'); return; }
    const payload = { ...createForm };
    const res = await createUser(payload);
    if (res && res.success) closeCreate();
    else alert(res.message || 'Erro ao criar usuário');
  };

  const handleBlockToggle = async (u) => {
    const res = await updateUser(u.id, { blocked: !u.blocked });
    if (!res?.success) alert(res?.message || 'Erro ao atualizar usuário');
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">Usuários</h2>
        <div className="flex items-center gap-2">
          <button onClick={openCreate} className="px-4 py-2 bg-gray-800 text-white rounded-md text-sm font-medium hover:bg-gray-900 transition-colors">+ Adicionar Usuário</button>
        </div>
      </div>

      <div className="text-sm text-gray-600 mb-3">Gerencie usuários — editar, bloquear ou remover.</div>
      <div className="mt-4 space-y-2">
        {users.map((u) => (
              <div key={u.id} className={`flex items-center justify-between border rounded p-2 ${u.blocked ? 'opacity-60' : ''}`}>
            <div>
              <div className="font-medium">{u.nome} {u.blocked ? <span className="text-xs text-red-600">(Bloqueado)</span> : null} <span className="text-sm text-gray-500">({roleLabel(u.role)})</span></div>
              <div className="text-xs text-gray-500">{u.email} • {u.telefone}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => openEdit(u)} className="px-2 py-1 bg-blue-100 rounded text-sm">Editar</button>
              <button onClick={() => handleBlockToggle(u)} className="px-2 py-1 bg-yellow-100 rounded text-sm">{u.blocked ? 'Desbloquear' : 'Bloquear'}</button>
              <button onClick={async () => {
                const res = await deleteUser(u.id);
                if (!res?.success) alert(res?.message || 'Erro ao remover usuário');
              }} className="px-2 py-1 bg-red-100 rounded text-sm">Remover</button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit User Modal */}
      {editingUser && editForm && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-6 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-md shadow-lg p-8 relative my-6">
            <button onClick={closeEdit} className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-8 text-gray-800">Editar Usuário</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Nome</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    value={editForm.nome || ''} 
                    onChange={(e) => setEditForm((s) => ({ ...s, nome: e.target.value }))} 
                    className="w-full border border-gray-200 rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors" 
                    placeholder="Nome completo"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="email"
                    value={editForm.email || ''} 
                    onChange={(e) => setEditForm((s) => ({ ...s, email: e.target.value }))} 
                    className="w-full border border-gray-200 rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors" 
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">CPF</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    value={editForm.cpf || ''} 
                    onChange={(e) => setEditForm((s) => ({ ...s, cpf: e.target.value }))} 
                    className="w-full border border-gray-200 rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors" 
                    placeholder="00000000000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Telefone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    value={editForm.telefone || ''} 
                    onChange={(e) => setEditForm((s) => ({ ...s, telefone: e.target.value }))} 
                    className="w-full border border-gray-200 rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors" 
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Cargo</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select 
                    value={editForm.role || 'Seller'} 
                    onChange={(e) => setEditForm((s) => ({ ...s, role: e.target.value }))} 
                    className="w-full border border-gray-200 rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors"
                  >
                    <option value="Admin">Administrador</option>
                    <option value="Seller">Vendedor</option>
                    <option value="Lojista">Lojista</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Senha (deixe em branco para manter)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="password" 
                    value={editForm.senha || ''} 
                    onChange={(e) => setEditForm((s) => ({ ...s, senha: e.target.value }))} 
                    className="w-full border border-gray-200 rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors" 
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={handleSaveUser} className="px-5 py-2.5 bg-gray-800 text-white rounded-md text-sm font-medium hover:bg-gray-900 transition-colors">Salvar</button>
              <button onClick={closeEdit} className="px-5 py-2.5 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {creatingUser && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-6 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-md shadow-lg p-8 relative my-6">
            <button onClick={closeCreate} className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-8 text-gray-800">Adicionar Usuário</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Nome*</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    value={createForm.nome} 
                    onChange={(e) => setCreateForm((s) => ({ ...s, nome: e.target.value }))} 
                    className="w-full border border-gray-200 rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors" 
                    placeholder="Nome completo"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">E-mail*</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="email"
                    value={createForm.email} 
                    onChange={(e) => setCreateForm((s) => ({ ...s, email: e.target.value }))} 
                    className="w-full border border-gray-200 rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors" 
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">CPF</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    value={createForm.cpf} 
                    onChange={(e) => setCreateForm((s) => ({ ...s, cpf: e.target.value }))} 
                    className="w-full border border-gray-200 rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors" 
                    placeholder="00000000000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Telefone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    value={createForm.telefone} 
                    onChange={(e) => setCreateForm((s) => ({ ...s, telefone: e.target.value }))} 
                    className="w-full border border-gray-200 rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors" 
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="password" 
                    value={createForm.senha} 
                    onChange={(e) => setCreateForm((s) => ({ ...s, senha: e.target.value }))} 
                    className="w-full border border-gray-200 rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors" 
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Cargo</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select 
                    value={createForm.role} 
                    onChange={(e) => setCreateForm((s) => ({ ...s, role: e.target.value }))} 
                    className="w-full border border-gray-200 rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors"
                  >
                    <option value="Admin">Administrador</option>
                    <option value="Seller">Vendedor</option>
                    <option value="Lojista">Lojista</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={handleCreate} className="px-5 py-2.5 bg-gray-800 text-white rounded-md text-sm font-medium hover:bg-gray-900 transition-colors">Criar</button>
              <button onClick={closeCreate} className="px-5 py-2.5 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const AdminPage = () => {
  const navigate = useNavigate();
  const { listings, updateListingStatus, updateListing, createListing, brands, equipmentTypes, addBrand, addEquipmentType, getRecommendedListings } = useData();
  const { 
    recommendedConfig, updateRecommendedConfig, 
    testimonialsConfig, updateTestimonialsConfig,
    aboutConfig, updateAboutConfig,
    contactConfig, updateContactConfig,
    termsConfig, updateTermsConfig,
    privacyConfig, updatePrivacyConfig,
    bannersConfig, updateBannersConfig
  } = useDataPages();
  const { users, currentUser, logout, createUser, updateUser, deleteUser } = useUsers();

  const [view, setView] = useState('produtos');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingSearchQuery, setPendingSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [recommendedEditing, setRecommendedEditing] = useState(recommendedConfig);
  const [editingRecommended, setEditingRecommended] = useState(false);
  
  const [testimonialsEditing, setTestimonialsEditing] = useState(testimonialsConfig);
  const [editingTestimonials, setEditingTestimonials] = useState(false);

  const [aboutEditing, setAboutEditing] = useState(aboutConfig);
  const [editingAbout, setEditingAbout] = useState(false);

  const [contactEditing, setContactEditing] = useState(contactConfig);
  const [editingContact, setEditingContact] = useState(false);

  const [termsEditing, setTermsEditing] = useState(termsConfig);
  const [editingTerms, setEditingTerms] = useState(false);

  const [privacyEditing, setPrivacyEditing] = useState(privacyConfig);
  const [editingPrivacy, setEditingPrivacy] = useState(false);

  const [bannersEditing, setBannersEditing] = useState(bannersConfig);
  const [editingBanners, setEditingBanners] = useState(false);

  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [createForm, setCreateForm] = useState({ model: '', name: '', price: 0, image: '', images: [], videoUrl: '', type: '', brand: '', description: '', location: '', seller: { name: '', whatsapp: '', email: '' }, isPremium: false });
  const [uploadingProductMedia, setUploadingProductMedia] = useState(false);
  const [uploadingBannerIndex, setUploadingBannerIndex] = useState(null);
  const [uploadingTestimonialIndex, setUploadingTestimonialIndex] = useState(null);

  useEffect(() => setCurrentPage(1), [searchQuery, itemsPerPage]);

  useEffect(() => {
    // Sincroniza o editor com as mudanças do contexto
    setRecommendedEditing(recommendedConfig);
  }, [recommendedConfig]);

  useEffect(() => {
    // Sincroniza o editor com as mudanças do contexto
    setTestimonialsEditing(testimonialsConfig);
  }, [testimonialsConfig]);

  useEffect(() => {
    setAboutEditing(aboutConfig);
  }, [aboutConfig]);

  useEffect(() => {
    setContactEditing(contactConfig);
  }, [contactConfig]);

  useEffect(() => {
    setTermsEditing(termsConfig);
  }, [termsConfig]);

  useEffect(() => {
    setPrivacyEditing(privacyConfig);
  }, [privacyConfig]);

  useEffect(() => {
    setBannersEditing(bannersConfig);
  }, [bannersConfig]);

  const filtered = useMemo(() => {
    const q = String(searchQuery || '').trim().toLowerCase();
    if (!q) return listings;
    return listings.filter((it) => {
      return (
        (it.name || '').toLowerCase().includes(q) ||
        (it.code || '').toLowerCase().includes(q) ||
        (it.location || '').toLowerCase().includes(q)
      );
    });
  }, [listings, searchQuery]);

  const pendingListings = useMemo(() => {
    const q = String(pendingSearchQuery || '').trim().toLowerCase();
    const base = listings
      .filter((item) => item.status === 'Pendente')
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        if (dateA !== dateB) return dateB - dateA;
        return Number(b.id || 0) - Number(a.id || 0);
      });

    if (!q) return base;

    return base.filter((it) => (
      (it.name || '').toLowerCase().includes(q)
      || (it.code || '').toLowerCase().includes(q)
      || (it.location || '').toLowerCase().includes(q)
      || (it.seller?.name || '').toLowerCase().includes(q)
      || (it.seller?.email || '').toLowerCase().includes(q)
    ));
  }, [listings, pendingSearchQuery]);

  const pendingCount = pendingListings.length;

  const pageItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const models = useMemo(() => {
    try {
      return Array.from(new Set(listings.map((l) => l.model).filter(Boolean)));
    } catch (e) {
      return [];
    }
  }, [listings]);

  const openEditModal = (product) => {
    setEditingProduct(product.id);
    setEditForm({
      ...product,
      images: Array.isArray(product.images) ? product.images : (product.image ? [product.image] : []),
      videoUrl: product.videoUrl || ''
    });
  };
  const closeEditModal = () => { setEditingProduct(null); setEditForm(null); };

  const handleSaveProduct = async () => {
    if (!editForm || !editingProduct) return;
    
    if (!window.confirm('Tem certeza que deseja salvar as alterações deste produto?')) {
      return;
    }
    
    const toSave = { ...editForm };
    if (toSave.seller?.whatsapp) toSave.seller.whatsapp = onlyDigits(toSave.seller.whatsapp);
    // add brand/type to filters if new
    if (toSave.brand && !brands.includes(toSave.brand)) addBrand(toSave.brand);
    if (toSave.type && !equipmentTypes.includes(toSave.type)) addEquipmentType(toSave.type);
    
    const result = await updateListing(editingProduct, toSave);
    if (!result?.success) {
      alert(result?.message || 'Erro ao atualizar produto no banco de dados.');
      return;
    }

    closeEditModal();
    alert('Produto atualizado com sucesso!');
  };

  const openCreateModal = () => setCreatingProduct(true);
  const closeCreateModal = () => { setCreatingProduct(false); setCreateForm({ model: '', name: '', price: 0, image: '', images: [], videoUrl: '', type: '', brand: '', description: '', location: '', seller: { name: '', whatsapp: '', email: '' }, isPremium: false }); };
  const handleCreateProduct = async () => {
    if (!createForm.name || !createForm.type || !createForm.brand) { alert('Preencha Nome, Tipo e Marca'); return; }
    const payload = { ...createForm };
    if (payload.seller?.whatsapp) payload.seller.whatsapp = onlyDigits(payload.seller.whatsapp);
    // add brand/type to filters if new
    if (payload.brand && !brands.includes(payload.brand)) addBrand(payload.brand);
    if (payload.type && !equipmentTypes.includes(payload.type)) addEquipmentType(payload.type);
    const result = await createListing(payload);
    if (!result?.success) {
      alert(result?.message || 'Erro ao criar produto no banco de dados.');
      return;
    }
    closeCreateModal();
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const uploadMedia = async (file) => {
    const token = getRuntimeToken();
    if (!token) throw new Error('Sessão inválida. Faça login novamente.');
    const result = await uploadMediaRequest(token, file);
    return result.url;
  };

  const updateTargetProductForm = (targetForm, updater) => {
    const setter = targetForm === 'edit' ? setEditForm : setCreateForm;
    setter((prev) => {
      if (!prev) return prev;
      return typeof updater === 'function' ? updater(prev) : updater;
    });
  };

  const applyProductImages = (targetForm, nextImages) => {
    updateTargetProductForm(targetForm, (prev) => ({
      ...prev,
      images: nextImages,
      image: nextImages[0] || ''
    }));
  };

  const handleProductImagesChange = (targetForm, nextImages) => {
    applyProductImages(targetForm, nextImages.slice(0, 9));
  };

  const handleReplaceProductImage = async (targetForm, index, file) => {
    setUploadingProductMedia(true);
    try {
      const imageUrl = await uploadMedia(file);
      updateTargetProductForm(targetForm, (prev) => {
        const nextImages = [...(prev.images || [])];
        nextImages[index] = imageUrl;
        return {
          ...prev,
          images: nextImages,
          image: nextImages[0] || ''
        };
      });
    } catch (error) {
      throw error;
    } finally {
      setUploadingProductMedia(false);
    }
  };

  const handleBannerImageUpload = async (idx, event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      setUploadingBannerIndex(idx);
      const imageUrl = await uploadMedia(file);
      setBannersEditing((prev) => {
        const newBanners = [...prev.banners];
        newBanners[idx] = { ...newBanners[idx], imageUrl };
        return { ...prev, banners: newBanners };
      });
    } catch (error) {
      alert(error?.message || 'Falha ao enviar imagem do banner.');
    } finally {
      setUploadingBannerIndex(null);
    }
  };

  const handleTestimonialImageUpload = async (idx, event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      setUploadingTestimonialIndex(idx);
      const imageUrl = await uploadMedia(file);
      setTestimonialsEditing((prev) => {
        const next = [...prev.testimonials];
        next[idx] = { ...next[idx], image: imageUrl };
        return { ...prev, testimonials: next };
      });
    } catch (error) {
      alert(error?.message || 'Falha ao enviar imagem do depoimento.');
    } finally {
      setUploadingTestimonialIndex(null);
    }
  };

  const handleProductMediaUpload = async (mode, event, targetForm) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;

    try {
      setUploadingProductMedia(true);

      if (mode === 'images') {
        const uploaded = [];
        for (const file of files.slice(0, 9)) {
          const url = await uploadMedia(file);
          uploaded.push(url);
        }

        if (targetForm === 'edit') {
          updateTargetProductForm('edit', (prev) => {
            const nextImages = [...(prev?.images || []), ...uploaded].slice(0, 9);
            return {
              ...prev,
              images: nextImages,
              image: nextImages[0] || ''
            };
          });
        } else {
          updateTargetProductForm('create', (prev) => {
            const nextImages = [...(prev.images || []), ...uploaded].slice(0, 9);
            return {
              ...prev,
              images: nextImages,
              image: nextImages[0] || ''
            };
          });
        }
      }

      if (mode === 'video') {
        const firstFile = files[0];
        const videoUrl = await uploadMedia(firstFile);
        if (targetForm === 'edit') {
          setEditForm((prev) => ({ ...prev, videoUrl }));
        } else {
          setCreateForm((prev) => ({ ...prev, videoUrl }));
        }
      }
    } catch (error) {
      alert(error?.message || 'Falha ao enviar mídia do produto.');
    } finally {
      setUploadingProductMedia(false);
    }
  };

  return (
    <>
      <Helmet><title>Painel — Reconectare</title></Helmet>
      <div className="min-h-screen bg-white pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">{currentUser?.role === 'Admin' ? 'Painel Administrativo' : 'Painel'}</h1>
            <div className="flex items-center gap-2">
              <button onClick={handleLogout} className="px-3 py-2 bg-gray-100 rounded">Sair</button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-6 items-center">
            <button onClick={() => setView('produtos')} className={`px-4 py-2 rounded ${view === 'produtos' ? 'bg-gray-800 text-white' : 'bg-gray-100'}`}>Lista de Produtos</button>
            {(currentUser?.role === 'Admin' || currentUser?.role === 'Seller') && (
              <button onClick={() => setView('pendencias')} className={`px-4 py-2 rounded inline-flex items-center gap-2 ${view === 'pendencias' ? 'bg-gray-800 text-white' : 'bg-amber-100 text-amber-900'}`}>
                <span>Pendências de Análise</span>
                {pendingCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full bg-red-600 text-white text-xs font-semibold">
                    {pendingCount}
                  </span>
                )}
              </button>
            )}
            {currentUser?.role === 'Admin' && (
              <>
                <button onClick={() => setView('usuarios')} className={`px-4 py-2 rounded ${view === 'usuarios' ? 'bg-gray-800 text-white' : 'bg-gray-100'}`}>Usuários</button>
              </>
            )}
            {(currentUser?.role === 'Admin' || currentUser?.role === 'Seller') && (
              <button onClick={openCreateModal} className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900">+ Adicionar Produto</button>
            )}
          </div>

          {view === 'produtos' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded shadow">
                <div className="flex gap-2">
                  <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar por nome, código ou localização" className="flex-1 border rounded px-3 py-2" />
                  <button onClick={() => setCurrentPage(1)} className="px-4 py-2 bg-gray-800 text-white rounded">Buscar</button>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="text-sm text-gray-600">Mostrando {filtered.length} resultados</div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Itens por página:</label>
                    <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="border rounded px-2 py-1">
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {pageItems.length ? pageItems.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-50 p-3 rounded hover:bg-gray-100 cursor-pointer gap-2" onClick={() => openEditModal(item)}>
                    <div className="flex items-center gap-3">
                      <img src={item.image} alt={item.name} className="w-14 h-14 sm:w-20 sm:h-20 object-cover rounded flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{item.name}</div>
                        <div className="text-sm text-gray-600 truncate">{item.brand} • {item.type} • {item.location}</div>
                        <div className="text-sm text-gray-800 font-bold mt-1">{item.code} • {formatBRL(item.price)}</div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <select value={item.status} onChange={(e) => { e.stopPropagation(); updateListingStatus(item.id, e.target.value); }} className="border rounded px-2 py-1 bg-white text-sm w-full sm:w-auto">
                        {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-500">Nenhum produto encontrado</div>
                )}
              </div>

              {Math.ceil(filtered.length / itemsPerPage) > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-3 py-2 border rounded disabled:opacity-50">← Anterior</button>
                  {Array.from({ length: Math.ceil(filtered.length / itemsPerPage) }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => setCurrentPage(p)} className={`px-3 py-2 rounded ${currentPage === p ? 'bg-gray-800 text-white' : 'border'}`}>{p}</button>
                  ))}
                  <button onClick={() => setCurrentPage(Math.min(Math.ceil(filtered.length / itemsPerPage), currentPage + 1))} disabled={currentPage === Math.ceil(filtered.length / itemsPerPage)} className="px-3 py-2 border rounded disabled:opacity-50">Próximo →</button>
                </div>
              )}
            </div>
          )}

          {view === 'pendencias' && (currentUser?.role === 'Admin' || currentUser?.role === 'Seller') && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded shadow">
                <div className="flex gap-2">
                  <input
                    value={pendingSearchQuery}
                    onChange={(e) => setPendingSearchQuery(e.target.value)}
                    placeholder="Buscar pendências por nome, código, localização ou contato"
                    className="flex-1 border rounded px-3 py-2"
                  />
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  {pendingCount} solicitação(ões) aguardando análise
                </div>
              </div>

              <div className="space-y-3">
                {pendingListings.length ? pendingListings.map((item) => (
                  <div key={item.id} className="bg-amber-50 border border-amber-200 rounded p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{item.name}</div>
                          <div className="text-sm text-gray-700 truncate">{item.code} • {item.brand} • {item.type}</div>
                          <div className="text-sm text-gray-700 truncate">{item.location || 'Localização não informada'}</div>
                          <div className="text-xs text-gray-600 mt-1">Enviado em: {formatDateTime(item.createdAt)}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            Contato: {item.seller?.name || 'N/D'} • {item.seller?.email || 'N/D'} • {item.seller?.whatsapp || 'N/D'}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <button
                          onClick={async () => {
                            if (!window.confirm('Tem certeza que deseja aprovar esta solicitação?')) return;
                            const result = await updateListingStatus(item.id, 'Disponível');
                            if (!result?.success) alert(result?.message || 'Erro ao aprovar solicitação.');
                          }}
                          className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={async () => {
                            const result = await updateListingStatus(item.id, 'Recusado');
                            if (!result?.success) alert(result?.message || 'Erro ao recusar solicitação.');
                          }}
                          className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                        >
                          Recusar
                        </button>
                        <button
                          onClick={() => openEditModal(item)}
                          className="px-3 py-2 bg-gray-800 text-white rounded text-sm hover:bg-gray-900"
                        >
                          Editar Antes de Publicar
                        </button>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-500 bg-white rounded shadow">
                    Nenhuma solicitação pendente de análise.
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'usuarios' && (
            <UsersManagement users={users} createUser={createUser} updateUser={updateUser} deleteUser={deleteUser} />
          )}

          {view === 'paginas' && (
            <div className="space-y-6">
              {/* RECOMENDADOS */}
              <div className="bg-white p-6 rounded shadow">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Recomendados (Página Inicial)</h2>
                  {!editingRecommended && (
                    <button
                      onClick={() => setEditingRecommended(true)}
                      className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
                    >
                      Editar
                    </button>
                  )}
                </div>

                {editingRecommended && (
                  <>
                    <div className="mb-6">
                      <label className="block text-sm font-semibold mb-2">Ordem Padrão</label>
                      <select 
                        value={recommendedEditing.order} 
                        onChange={(e) => setRecommendedEditing((s) => ({ ...s, order: e.target.value }))}
                        className="border rounded px-3 py-2 w-full md:w-64"
                      >
                        <option value="desc">Decrescente (Mais Novos)</option>
                        <option value="asc">Crescente (Mais Antigos)</option>
                      </select>
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-semibold mb-3">Escolher até 12 Produtos (Opcional)</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((idx) => (
                          <div key={idx} className="relative">
                            <label className="block text-xs text-gray-600 mb-1">Posição {idx + 1}</label>
                            <input
                              list={`codes-list-${idx}`}
                              value={recommendedEditing.selectedCodes[idx] || ''}
                              onChange={(e) => {
                                const newCodes = [...recommendedEditing.selectedCodes];
                                newCodes[idx] = e.target.value.trim();
                                setRecommendedEditing((s) => ({ ...s, selectedCodes: newCodes }));
                              }}
                              placeholder="Ex: LP-001"
                              className="border rounded px-2 py-2 w-full text-sm"
                            />
                            <datalist id={`codes-list-${idx}`}>
                              {listings.map((l) => (
                                <option key={l.code} value={l.code}>
                                  {l.code} - {l.name}
                                </option>
                              ))}
                            </datalist>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-600 mt-2">Deixe em branco as posições que não deseja preencher. O sistema preencherá automaticamente com a ordem padrão.</p>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => {
                          if (window.confirm('Tem certeza que deseja salvar estas configurações?')) {
                            updateRecommendedConfig(recommendedEditing);
                            setEditingRecommended(false);
                            alert('Configuração de recomendados salva com sucesso!');
                          }
                        }}
                        className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
                      >
                        Salvar Configuração
                      </button>
                      <button
                        onClick={() => {
                          setRecommendedEditing(recommendedConfig);
                          setEditingRecommended(false);
                        }}
                        className="px-4 py-2 border rounded hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* COMENTÁRIOS */}
              <div className="bg-white p-6 rounded shadow">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Comentários (Página Inicial)</h2>
                  {!editingTestimonials && (
                    <button
                      onClick={() => setEditingTestimonials(true)}
                      className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
                    >
                      Editar
                    </button>
                  )}
                </div>

                {editingTestimonials && (
                  <>
                    <div className="mb-6">
                      <label className="block text-sm font-semibold mb-2">Título</label>
                      <input
                        type="text"
                        value={testimonialsEditing.title}
                        onChange={(e) => setTestimonialsEditing((s) => ({ ...s, title: e.target.value }))}
                        className="border rounded px-3 py-2 w-full"
                        placeholder="Ex: O que nossos clientes dizem?"
                      />
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-semibold mb-2">Subtítulo</label>
                      <input
                        type="text"
                        value={testimonialsEditing.subtitle}
                        onChange={(e) => setTestimonialsEditing((s) => ({ ...s, subtitle: e.target.value }))}
                        className="border rounded px-3 py-2 w-full"
                        placeholder="Ex: Depoimentos de dentistas e clínicas..."
                      />
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-semibold mb-3">Comentários (até 5)</label>
                      <p className="text-xs text-gray-600 mb-4">Os comentários vazios não aparecerão na página.</p>
                      
                      {testimonialsEditing.testimonials.map((testimonial, idx) => (
                        <div key={testimonial.id} className="border rounded p-4 mb-4 bg-gray-50">
                          <h3 className="font-semibold mb-3">Comentário {idx + 1}</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Nome</label>
                              <input
                                type="text"
                                value={testimonial.name}
                                onChange={(e) => {
                                  const newTestimonials = [...testimonialsEditing.testimonials];
                                  newTestimonials[idx] = { ...newTestimonials[idx], name: e.target.value };
                                  setTestimonialsEditing((s) => ({ ...s, testimonials: newTestimonials }));
                                }}
                                className="border rounded px-2 py-2 w-full text-sm"
                                placeholder="Ex: Dra. Ana Silva"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Cargo/Clínica</label>
                              <input
                                type="text"
                                value={testimonial.role}
                                onChange={(e) => {
                                  const newTestimonials = [...testimonialsEditing.testimonials];
                                  newTestimonials[idx] = { ...newTestimonials[idx], role: e.target.value };
                                  setTestimonialsEditing((s) => ({ ...s, testimonials: newTestimonials }));
                                }}
                                className="border rounded px-2 py-2 w-full text-sm"
                                placeholder="Ex: Proprietária — Clínica OdontoPlus"
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
                              <img src={testimonial.image} alt={`Depoimento ${idx + 1}`} className="mt-2 w-16 h-16 rounded-full object-cover border" />
                            )}
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Comentário</label>
                            <textarea
                              value={testimonial.quote}
                              onChange={(e) => {
                                const newTestimonials = [...testimonialsEditing.testimonials];
                                newTestimonials[idx] = { ...newTestimonials[idx], quote: e.target.value };
                                setTestimonialsEditing((s) => ({ ...s, testimonials: newTestimonials }));
                              }}
                              className="border rounded px-2 py-2 w-full text-sm"
                              rows="3"
                              placeholder="Escreva o comentário aqui..."
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => {
                          if (window.confirm('Tem certeza que deseja salvar estas configurações?')) {
                            updateTestimonialsConfig(testimonialsEditing);
                            setEditingTestimonials(false);
                            alert('Configuração de comentários salva com sucesso!');
                          }
                        }}
                        className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
                      >
                        Salvar Configuração
                      </button>
                      <button
                        onClick={() => {
                          setTestimonialsEditing(testimonialsConfig);
                          setEditingTestimonials(false);
                        }}
                        className="px-4 py-2 border rounded hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* SOBRE */}
              <div className="bg-white p-6 rounded shadow">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Sobre (Página Empresa)</h2>
                  {!editingAbout && (
                    <button
                      onClick={() => setEditingAbout(true)}
                      className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
                    >
                      Editar
                    </button>
                  )}
                </div>

                {editingAbout && (
                  <>
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
                        value={aboutEditing.paragraphs[0]}
                        onChange={(e) => {
                          const newParagraphs = [...aboutEditing.paragraphs];
                          newParagraphs[0] = e.target.value;
                          setAboutEditing((s) => ({ ...s, paragraphs: newParagraphs }));
                        }}
                        className="border rounded px-3 py-2 w-full"
                        rows="4"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-semibold mb-2">Parágrafo 2</label>
                      <textarea
                        value={aboutEditing.paragraphs[1]}
                        onChange={(e) => {
                          const newParagraphs = [...aboutEditing.paragraphs];
                          newParagraphs[1] = e.target.value;
                          setAboutEditing((s) => ({ ...s, paragraphs: newParagraphs }));
                        }}
                        className="border rounded px-3 py-2 w-full"
                        rows="4"
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => {
                          if (window.confirm('Salvar alterações?')) {
                            updateAboutConfig(aboutEditing);
                            setEditingAbout(false);
                            alert('Página Sobre salva com sucesso!');
                          }
                        }}
                        className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => {
                          setAboutEditing(aboutConfig);
                          setEditingAbout(false);
                        }}
                        className="px-4 py-2 border rounded hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* CONTATO */}
              <div className="bg-white p-6 rounded shadow">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Contato (Página Empresa)</h2>
                  {!editingContact && (
                    <button
                      onClick={() => setEditingContact(true)}
                      className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
                    >
                      Editar
                    </button>
                  )}
                </div>

                {editingContact && (
                  <>
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
                      <label className="block text-sm font-semibold mb-2">WhatsApp (formato: 5511999999999)</label>
                      <input
                        type="text"
                        value={contactEditing.whatsappNumber}
                        onChange={(e) => setContactEditing((s) => ({ ...s, whatsappNumber: e.target.value }))}
                        className="border rounded px-3 py-2 w-full"
                        placeholder="5511999999999"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-semibold mb-2">Telefone para exibição</label>
                      <input
                        type="text"
                        value={contactEditing.displayPhone}
                        onChange={(e) => setContactEditing((s) => ({ ...s, displayPhone: e.target.value }))}
                        className="border rounded px-3 py-2 w-full"
                        placeholder="(11) 99999-9999"
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => {
                          if (window.confirm('Salvar alterações?')) {
                            updateContactConfig(contactEditing);
                            setEditingContact(false);
                            alert('Dados de Contato salvos com sucesso!');
                          }
                        }}
                        className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => {
                          setContactEditing(contactConfig);
                          setEditingContact(false);
                        }}
                        className="px-4 py-2 border rounded hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* TERMOS DE USO */}
              <div className="bg-white p-6 rounded shadow">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Termos de Uso (Página Legal)</h2>
                  {!editingTerms && (
                    <button
                      onClick={() => setEditingTerms(true)}
                      className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
                    >
                      Editar
                    </button>
                  )}
                </div>

                {editingTerms && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-semibold mb-2">Título</label>
                      <input
                        type="text"
                        value={termsEditing.title}
                        onChange={(e) => setTermsEditing((s) => ({ ...s, title: e.target.value }))}
                        className="border rounded px-3 py-2 w-full"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-semibold mb-2">Introdução</label>
                      <textarea
                        value={termsEditing.intro}
                        onChange={(e) => setTermsEditing((s) => ({ ...s, intro: e.target.value }))}
                        className="border rounded px-3 py-2 w-full"
                        rows="3"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-semibold mb-3">Seções</label>
                      {termsEditing.sections.map((section, idx) => (
                        <div key={idx} className="border rounded p-3 mb-3 bg-gray-50">
                          <div className="mb-2">
                            <label className="block text-xs text-gray-600 mb-1">Título da Seção</label>
                            <input
                              type="text"
                              value={section.title}
                              onChange={(e) => {
                                const newSections = [...termsEditing.sections];
                                newSections[idx] = { ...newSections[idx], title: e.target.value };
                                setTermsEditing((s) => ({ ...s, sections: newSections }));
                              }}
                              className="border rounded px-2 py-1 w-full text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Conteúdo</label>
                            <textarea
                              value={section.content}
                              onChange={(e) => {
                                const newSections = [...termsEditing.sections];
                                newSections[idx] = { ...newSections[idx], content: e.target.value };
                                setTermsEditing((s) => ({ ...s, sections: newSections }));
                              }}
                              className="border rounded px-2 py-1 w-full text-sm"
                              rows="3"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => {
                          if (window.confirm('Salvar alterações?')) {
                            updateTermsConfig(termsEditing);
                            setEditingTerms(false);
                            alert('Termos de Uso salvos com sucesso!');
                          }
                        }}
                        className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => {
                          setTermsEditing(termsConfig);
                          setEditingTerms(false);
                        }}
                        className="px-4 py-2 border rounded hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* POLÍTICA DE PRIVACIDADE */}
              <div className="bg-white p-6 rounded shadow">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Política de Privacidade (Página Legal)</h2>
                  {!editingPrivacy && (
                    <button
                      onClick={() => setEditingPrivacy(true)}
                      className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
                    >
                      Editar
                    </button>
                  )}
                </div>

                {editingPrivacy && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-semibold mb-2">Título</label>
                      <input
                        type="text"
                        value={privacyEditing.title}
                        onChange={(e) => setPrivacyEditing((s) => ({ ...s, title: e.target.value }))}
                        className="border rounded px-3 py-2 w-full"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-semibold mb-2">Introdução</label>
                      <textarea
                        value={privacyEditing.intro}
                        onChange={(e) => setPrivacyEditing((s) => ({ ...s, intro: e.target.value }))}
                        className="border rounded px-3 py-2 w-full"
                        rows="3"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-semibold mb-3">Seções</label>
                      {privacyEditing.sections.map((section, idx) => (
                        <div key={idx} className="border rounded p-3 mb-3 bg-gray-50">
                          <div className="mb-2">
                            <label className="block text-xs text-gray-600 mb-1">Título da Seção</label>
                            <input
                              type="text"
                              value={section.title}
                              onChange={(e) => {
                                const newSections = [...privacyEditing.sections];
                                newSections[idx] = { ...newSections[idx], title: e.target.value };
                                setPrivacyEditing((s) => ({ ...s, sections: newSections }));
                              }}
                              className="border rounded px-2 py-1 w-full text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Conteúdo</label>
                            <textarea
                              value={section.content}
                              onChange={(e) => {
                                const newSections = [...privacyEditing.sections];
                                newSections[idx] = { ...newSections[idx], content: e.target.value };
                                setPrivacyEditing((s) => ({ ...s, sections: newSections }));
                              }}
                              className="border rounded px-2 py-1 w-full text-sm"
                              rows="3"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-semibold mb-2">Data de Atualização</label>
                      <input
                        type="text"
                        value={privacyEditing.lastUpdate}
                        onChange={(e) => setPrivacyEditing((s) => ({ ...s, lastUpdate: e.target.value }))}
                        className="border rounded px-3 py-2 w-full"
                        placeholder="dd/mm/aaaa"
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => {
                          if (window.confirm('Salvar alterações?')) {
                            updatePrivacyConfig(privacyEditing);
                            setEditingPrivacy(false);
                            alert('Política de Privacidade salva com sucesso!');
                          }
                        }}
                        className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => {
                          setPrivacyEditing(privacyConfig);
                          setEditingPrivacy(false);
                        }}
                        className="px-4 py-2 border rounded hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* ANÚDIOS */}
              <div className="bg-white p-6 rounded shadow">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Anúncios (Banners na Página Inicial)</h2>
                  {!editingBanners && (
                    <button
                      onClick={() => setEditingBanners(true)}
                      className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
                    >
                      Editar
                    </button>
                  )}
                </div>

                {!editingBanners && (
                  <p className="text-sm text-gray-600">Configure os banners publicitários que aparecem em posições estratégicas da página inicial.</p>
                )}

                {editingBanners && (
                  <>
                    <p className="text-sm text-gray-600 mb-6">Configure até 5 banners em posições estratégicas. Banners sem imagem ou link não serão exibidos.</p>
                    
                    {bannersEditing.banners.map((banner, idx) => (
                      <div key={banner.id} className="border rounded p-4 mb-4 bg-gray-50">
                        <h3 className="font-semibold mb-1">{banner.name}</h3>
                        <p className="text-xs text-gray-500 mb-3">Dimensões: {banner.width}x{banner.height}px</p>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Imagem/GIF</label>
                            <FilePicker
                              accept="image/*"
                              onChange={(e) => handleBannerImageUpload(idx, e)}
                              buttonLabel="Selecionar imagem"
                              emptyLabel="Nenhum arquivo selecionado"
                            />
                            <p className="text-[11px] text-gray-500 mt-1">
                              {uploadingBannerIndex === idx ? 'Enviando imagem...' : (banner.imageUrl ? 'Imagem enviada com sucesso.' : 'Nenhuma imagem enviada.')}
                            </p>
                          </div>
                          
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Link de Destino (Hiperlink)</label>
                            <input
                              type="text"
                              value={banner.linkUrl}
                              onChange={(e) => {
                                const newBanners = [...bannersEditing.banners];
                                newBanners[idx] = { ...newBanners[idx], linkUrl: e.target.value };
                                setBannersEditing((s) => ({ ...s, banners: newBanners }));
                              }}
                              className="border rounded px-2 py-2 w-full text-sm"
                              placeholder="https://exemplo.com"
                            />
                          </div>

                          {banner.imageUrl && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-600 mb-1">Prévia:</p>
                              <div className="border rounded p-2 bg-white inline-block">
                                <img 
                                  src={banner.imageUrl} 
                                  alt="Prévia do banner" 
                                  className="max-w-xs max-h-32 object-contain"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'block';
                                  }}
                                />
                                <p className="text-xs text-red-500" style={{display: 'none'}}>Erro ao carregar imagem</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="flex gap-2 justify-end mt-6">
                      <button
                        onClick={() => {
                          if (window.confirm('Tem certeza que deseja salvar estas configurações de banners?')) {
                            updateBannersConfig(bannersEditing);
                            setEditingBanners(false);
                            alert('Banners salvos com sucesso!');
                          }
                        }}
                        className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => {
                          setBannersEditing(bannersConfig);
                          setEditingBanners(false);
                        }}
                        className="px-4 py-2 border rounded hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {editingProduct && editForm && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-6 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-md shadow-lg p-8 relative my-6">
            <button onClick={closeEditModal} className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-8 text-gray-800">Editar Produto</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Nome</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    value={editForm.name || ''} 
                    onChange={(e) => setEditForm((s) => ({ ...s, name: e.target.value }))} 
                    className="w-full border border-gray-200 rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors" 
                    placeholder="Nome do produto"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Modelo</label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    list="models-list" 
                    value={editForm.model || ''} 
                    onChange={(e) => setEditForm((s) => ({ ...s, model: e.target.value }))} 
                    className="w-full border border-gray-200 rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors" 
                    placeholder="Ex: 2000XL"
                  />
                  <datalist id="models-list">
                    {models.map((m) => (<option key={m} value={m} />))}
                  </datalist>
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Marca</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    list="brands-list" 
                    value={editForm.brand || ''} 
                    onChange={(e) => setEditForm((s) => ({ ...s, brand: e.target.value }))} 
                    className="w-full border border-gray-200 rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors" 
                    placeholder="Marca"
                  />
                  <datalist id="brands-list">
                    {brands.map((b) => (<option key={b} value={b} />))}
                  </datalist>
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Tipo</label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    list="types-list" 
                    value={editForm.type || ''} 
                    onChange={(e) => setEditForm((s) => ({ ...s, type: e.target.value }))} 
                    className="w-full border border-gray-200 rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors" 
                    placeholder="Tipo"
                  />
                  <datalist id="types-list">
                    {equipmentTypes.map((t) => (<option key={t} value={t} />))}
                  </datalist>
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Preço</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editForm.price ? formatBRL(editForm.price) : ''}
                    onChange={(e) => setEditForm((s) => ({ ...s, price: parseCurrencyInput(e.target.value) }))}
                    placeholder="R$ 0,00"
                    className="w-full border border-gray-200 rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Status</label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select 
                    value={editForm.status || 'Disponível'} 
                    onChange={(e) => setEditForm((s) => ({ ...s, status: e.target.value }))} 
                    className="w-full border border-gray-200 rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors"
                  >
                    {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="col-span-full">
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Descrição</label>
                <textarea 
                  value={editForm.description || ''} 
                  onChange={(e) => setEditForm((s) => ({ ...s, description: e.target.value }))} 
                  className="w-full border border-gray-200 rounded-md px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors" 
                  rows={3}
                  placeholder="Descrição do produto"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Cidade</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    value={parseLocation(editForm.location).city} 
                    onChange={(e) => setEditForm((s) => ({ ...s, location: formatLocation(e.target.value, parseLocation(s.location).uf) }))} 
                    className="w-full border border-gray-200 rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors" 
                    placeholder="Ex: São Paulo" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">UF</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select 
                    value={parseLocation(editForm.location).uf} 
                    onChange={(e) => setEditForm((s) => ({ ...s, location: formatLocation(parseLocation(s.location).city, e.target.value) }))} 
                    className="w-full border border-gray-200 rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors"
                  >
                    <option value="">-- Selecione --</option>
                    {brasileiroUFs.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
              </div>
              <div className="col-span-full">
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Imagens do Produto (até 9)</label>
                <FilePicker
                  accept="image/*"
                  multiple
                  onChange={(e) => handleProductMediaUpload('images', e, 'edit')}
                  buttonLabel="Selecionar imagens"
                  emptyLabel="Nenhum arquivo selecionado"
                />
                <p className="text-[11px] text-gray-500 mt-1">{uploadingProductMedia ? 'Enviando mídias...' : 'Selecione uma ou mais imagens.'}</p>
                <ProductImageManager
                  images={editForm.images || []}
                  onChange={(nextImages) => handleProductImagesChange('edit', nextImages)}
                  onReplaceImage={(index, file) => handleReplaceProductImage('edit', index, file)}
                  disabled={uploadingProductMedia}
                />
              </div>
              <div className="col-span-full">
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Vídeo do Produto (opcional)</label>
                <FilePicker
                  accept="video/*"
                  onChange={(e) => handleProductMediaUpload('video', e, 'edit')}
                  buttonLabel="Selecionar vídeo"
                  emptyLabel="Nenhum arquivo selecionado"
                />
                {editForm.videoUrl && (
                  <video src={editForm.videoUrl} controls className="mt-3 w-full max-w-sm rounded border" />
                )}
              </div>
              <div className="col-span-full">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input 
                    type="checkbox" 
                    checked={editForm.isPremium || false} 
                    onChange={(e) => setEditForm((s) => ({ ...s, isPremium: e.target.checked }))} 
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-xs uppercase tracking-wide font-medium">Premium</span>
                </label>
              </div>
              <div className="col-span-full border-t pt-6 mt-2">
                <h3 className="text-sm font-bold mb-4 text-gray-800">Dados do Anunciante</h3>
              </div>
              <div className="col-span-full">
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Nome do Anunciante</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    value={editForm.seller?.name || ''} 
                    onChange={(e) => setEditForm((s) => ({ ...s, seller: { ...s.seller, name: e.target.value } }))} 
                    className="w-full border border-gray-200 rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors" 
                    placeholder="Nome completo"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Número do Anunciante</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    value={editForm.seller?.whatsapp || ''} 
                    onChange={(e) => setEditForm((s) => ({ ...s, seller: { ...s.seller, whatsapp: e.target.value } }))} 
                    className="w-full border border-gray-200 rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors" 
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">E-mail do Anunciante</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    value={editForm.seller?.email || ''} 
                    onChange={(e) => setEditForm((s) => ({ ...s, seller: { ...s.seller, email: e.target.value } }))} 
                    className="w-full border border-gray-200 rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors" 
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={handleSaveProduct} className="px-5 py-2.5 bg-gray-800 text-white rounded-md text-sm font-medium hover:bg-gray-900 transition-colors">Salvar</button>
              <button onClick={closeEditModal} className="px-5 py-2.5 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {creatingProduct && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-6 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-md shadow-lg p-8 relative my-6">
            <button onClick={closeCreateModal} className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-8 text-gray-800">Adicionar Produto</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Nome*</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    value={createForm.name} 
                    onChange={(e) => setCreateForm((s) => ({ ...s, name: e.target.value }))} 
                    className="w-full border border-gray-200 rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors" 
                    placeholder="Nome do produto"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Modelo</label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    list="models-list" 
                    value={createForm.model} 
                    onChange={(e) => setCreateForm((s) => ({ ...s, model: e.target.value }))} 
                    className="w-full border border-gray-200 rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors" 
                    placeholder="Ex: 2000XL"
                  />
                  <datalist id="models-list">
                    {models.map((m) => (<option key={m} value={m} />))}
                  </datalist>
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Marca*</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    list="brands-list" 
                    value={createForm.brand} 
                    onChange={(e) => setCreateForm((s) => ({ ...s, brand: e.target.value }))} 
                    className="w-full border border-gray-200 rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors" 
                    placeholder="Marca"
                  />
                  <datalist id="brands-list">
                    {brands.map((b) => (<option key={b} value={b} />))}
                  </datalist>
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Tipo*</label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    list="types-list" 
                    value={createForm.type} 
                    onChange={(e) => setCreateForm((s) => ({ ...s, type: e.target.value }))} 
                    className="w-full border border-gray-200 rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors" 
                    placeholder="Tipo"
                  />
                  <datalist id="types-list">
                    {equipmentTypes.map((t) => (<option key={t} value={t} />))}
                  </datalist>
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Preço</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={createForm.price ? formatBRL(createForm.price) : ''}
                    onChange={(e) => setCreateForm((s) => ({ ...s, price: parseCurrencyInput(e.target.value) }))}
                    placeholder="R$ 0,00"
                    className="w-full border border-gray-200 rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                  />
                </div>
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input 
                    type="checkbox" 
                    checked={createForm.isPremium} 
                    onChange={(e) => setCreateForm((s) => ({ ...s, isPremium: e.target.checked }))} 
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-xs uppercase tracking-wide font-medium">Premium</span>
                </label>
              </div>
              <div className="col-span-full">
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Descrição</label>
                <textarea 
                  value={createForm.description} 
                  onChange={(e) => setCreateForm((s) => ({ ...s, description: e.target.value }))} 
                  className="w-full border border-gray-200 rounded-md px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors" 
                  rows={3}
                  placeholder="Descrição do produto"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Cidade</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    value={parseLocation(createForm.location).city} 
                    onChange={(e) => setCreateForm((s) => ({ ...s, location: formatLocation(e.target.value, parseLocation(s.location).uf) }))} 
                    className="w-full border border-gray-200 rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors" 
                    placeholder="Ex: São Paulo" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">UF</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select 
                    value={parseLocation(createForm.location).uf} 
                    onChange={(e) => setCreateForm((s) => ({ ...s, location: formatLocation(parseLocation(s.location).city, e.target.value) }))} 
                    className="w-full border border-gray-200 rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors"
                  >
                    <option value="">-- Selecione --</option>
                    {brasileiroUFs.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
              </div>
              <div className="col-span-full">
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Imagens do Produto (até 9)</label>
                <FilePicker
                  accept="image/*"
                  multiple
                  onChange={(e) => handleProductMediaUpload('images', e, 'create')}
                  buttonLabel="Selecionar imagens"
                  emptyLabel="Nenhum arquivo selecionado"
                />
                <p className="text-[11px] text-gray-500 mt-1">{uploadingProductMedia ? 'Enviando mídias...' : 'Selecione uma ou mais imagens.'}</p>
                <ProductImageManager
                  images={createForm.images || []}
                  onChange={(nextImages) => handleProductImagesChange('create', nextImages)}
                  onReplaceImage={(index, file) => handleReplaceProductImage('create', index, file)}
                  disabled={uploadingProductMedia}
                />
              </div>
              <div className="col-span-full">
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Vídeo do Produto (opcional)</label>
                <FilePicker
                  accept="video/*"
                  onChange={(e) => handleProductMediaUpload('video', e, 'create')}
                  buttonLabel="Selecionar vídeo"
                  emptyLabel="Nenhum arquivo selecionado"
                />
                {createForm.videoUrl && (
                  <video src={createForm.videoUrl} controls className="mt-3 w-full max-w-sm rounded border" />
                )}
              </div>
              <div className="col-span-full border-t pt-6 mt-2">
                <h3 className="text-sm font-bold mb-4 text-gray-800">Dados do Anunciante</h3>
              </div>
              <div className="col-span-full">
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Nome do Anunciante</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    value={createForm.seller.name} 
                    onChange={(e) => setCreateForm((s) => ({ ...s, seller: { ...s.seller, name: e.target.value } }))} 
                    className="w-full border border-gray-200 rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors" 
                    placeholder="Nome completo"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">Número do Anunciante</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    value={createForm.seller.whatsapp} 
                    onChange={(e) => setCreateForm((s) => ({ ...s, seller: { ...s.seller, whatsapp: e.target.value } }))} 
                    className="w-full border border-gray-200 rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors" 
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-600 mb-2 font-medium">E-mail do Anunciante</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    value={createForm.seller.email} 
                    onChange={(e) => setCreateForm((s) => ({ ...s, seller: { ...s.seller, email: e.target.value } }))} 
                    className="w-full border border-gray-200 rounded-md pl-11 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors" 
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 mt-8">
              <button onClick={handleCreateProduct} className="px-5 py-2.5 bg-gray-800 text-white rounded-md text-sm font-medium hover:bg-gray-900 transition-colors">Criar</button>
              <button onClick={closeCreateModal} className="px-5 py-2.5 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminPage;
