import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { getAllPageConfigsRequest, savePageConfigRequest } from '@/services/pagesApi';
import { getRuntimeToken } from '@/lib/authSession';

const DataPagesContext = createContext();

export const useDataPages = () => {
  const context = useContext(DataPagesContext);
  if (!context) {
    throw new Error('useDataPages must be used within DataPagesProvider');
  }
  return context;
};

const DEFAULT_BANNER_SLOT = {
  enabled: false,
  layout: 1,
  autoRotate: false,
  rotateInterval: 5,
  slots: [
    { id: 1, mediaUrl: '', linkUrl: '', mediaType: 'image' },
    { id: 2, mediaUrl: '', linkUrl: '', mediaType: 'image' },
    { id: 3, mediaUrl: '', linkUrl: '', mediaType: 'image' }
  ]
};

const hasBrokenEncoding = (value) => {
  if (typeof value !== 'string') return false;
  // Common mojibake markers seen in runtime data from DB imports.
  return value.includes('�') || /\w\?\w/.test(value);
};

const sanitizeText = (value, fallback = '') => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed || hasBrokenEncoding(trimmed)) return fallback;
  return trimmed;
};

const sanitizeSections = (sections, fallbackSections = []) => {
  if (!Array.isArray(sections)) return fallbackSections;
  const normalized = sections
    .map((section) => ({
      title: sanitizeText(section?.title, ''),
      content: sanitizeText(section?.content, '')
    }))
    .filter((section) => section.title && section.content);
  return normalized.length ? normalized : fallbackSections;
};

const sanitizeHeroConfig = (incoming, fallback) => {
  if (!incoming || typeof incoming !== 'object') return fallback;
  const backgroundImage = sanitizeText(incoming.backgroundImage, fallback.backgroundImage);
  return {
    ...fallback,
    ...incoming,
    title: sanitizeText(incoming.title, fallback.title),
    subtitle: sanitizeText(incoming.subtitle, fallback.subtitle),
    backgroundImage
  };
};

export const DataPagesProvider = ({ children }) => {
  const [recommendedConfig, setRecommendedConfig] = useState({
    order: 'desc',
    selectedCodes: ['', '', '', '', '', '', '', '', '', '', '', '']
  });

  const [testimonialsConfig, setTestimonialsConfig] = useState({
      title: 'O que nossos clientes dizem?',
      subtitle: 'Depoimentos de dentistas e clínicas que confiam na Reconectare.',
      testimonials: [
        {
          id: 1,
          name: 'Dra. Ana Silva',
          role: 'Proprietária — Clínica OdontoPlus',
          image: '',
          quote: 'Encontrei equipamentos de ótima qualidade e o atendimento foi muito ágil.'
        },
        {
          id: 2,
          name: 'Dr. Carlos Pereira',
          role: 'Cirurgião-dentista — Consultório São Pedro',
          image: '',
          quote: 'Plataforma intuitiva e prática. Facilita comprar e vender equipamentos com segurança.'
        },
        {
          id: 3,
          name: 'Dra. Mariana Costa',
          role: 'Diretora clínica — Clínica Sorriso',
          image: '',
          quote: 'Excelente experiência — recomendo para colegas que precisam de equipamentos usados revisados.'
        },
        { id: 4, name: '', role: '', image: '', quote: '' },
        { id: 5, name: '', role: '', image: '', quote: '' }
      ]
  });

  const [aboutConfig, setAboutConfig] = useState({
      title: 'Sobre',
      paragraphs: [
        'A Reconectare conecta profissionais e clínicas com equipamentos odontológicos usados, revisados e com curadoria especializada. Nosso objetivo é facilitar a renovação de consultórios oferecendo transparência, garantia técnica e atendimento dedicado para compradores e vendedores.',
        'Trabalhamos com uma seleção criteriosa de anúncios, avaliações de condição e suporte durante todo o processo de negociação. Valorizamos confiança, segurança e eficiência para que você faça bons negócios com tranquilidade.'
      ]
  });

  const [contactConfig, setContactConfig] = useState({
      title: 'Contato',
      email: 'contato@reconectare.com.br',
      whatsappNumber: '551144444444',
      displayPhone: '(11) 4444-4444'
  });

  const [termsConfig, setTermsConfig] = useState({
      title: 'Termos de Uso',
      intro: 'Bem-vindo à Reconectare. Ao utilizar este site e os serviços oferecidos, você concorda com estes Termos de Uso. Leia-os atentamente antes de prosseguir.',
      sections: [
        { title: '1. Serviço', content: 'A Reconectare fornece uma plataforma para anúncios de equipamentos odontológicos usados, atuando como intermediadora para exibir anúncios e facilitar contato entre compradores e vendedores. Não atuamos como parte na transação, exceto quando explicitamente acordado.' },
        { title: '2. Responsabilidades do Usuário', content: 'O usuário é responsável pelas informações fornecidas nos anúncios, pela veracidade dos dados e pelo cumprimento das obrigações fiscais e legais relacionadas à compra e venda. Usuários concordam em não publicar conteúdo ilegal, enganoso ou que infrinja direitos de terceiros.' },
        { title: '3. Propriedade Intelectual', content: 'O conteúdo do site, incluindo textos, imagens, marca e design, é de propriedade da Reconectare ou de seus licenciadores. É proibida a reprodução não autorizada.' },
        { title: '4. Limitação de Responsabilidade', content: 'A Reconectare não se responsabiliza por danos diretos ou indiretos decorrentes das transações entre usuários, problemas de entrega, garantia oferecida pelos vendedores ou uso indevido das informações disponibilizadas.' },
        { title: '5. Alterações', content: 'Reservamo-nos o direito de alterar estes Termos a qualquer momento. Alterações serão publicadas nesta página com a data de atualização.' },
        { title: '6. Lei Aplicável', content: 'Estes Termos são regidos pelas leis brasileiras. Qualquer disputa será submetida ao foro competente, observadas as disposições legais aplicáveis.' }
      ]
  });

  const [privacyConfig, setPrivacyConfig] = useState({
      title: 'Política de Privacidade',
      intro: 'A sua privacidade é importante para nós. Esta política descreve como coletamos, usamos, armazenamos e protegemos os seus dados pessoais em conformidade com a legislação brasileira, incluindo a Lei Geral de Proteção de Dados (LGPD).',
      sections: [
        { title: '1. Dados Coletados', content: 'Coletamos informações fornecidas diretamente pelos usuários (nome, e-mail, telefone, descrições de anúncios) e dados de uso (logs, IP, comportamento no site) para melhorar a experiência e prevenir fraudes.' },
        { title: '2. Finalidade', content: 'Utilizamos os dados para a operação da plataforma, comunicação entre compradores e vendedores, suporte, análises internas e cumprimento de obrigações legais.' },
        { title: '3. Compartilhamento', content: 'Dados podem ser compartilhados com prestadores de serviço que atuam em nome da Reconectare (hospedagem, e-mail, pagamentos) e quando exigido por lei ou ordem judicial.' },
        { title: '4. Direitos do Titular', content: 'Você tem direito de acessar, corrigir, eliminar ou portar seus dados pessoais, além de revogar consentimento quando aplicável. Solicitações podem ser enviadas para contato informado no site.' },
        { title: '5. Segurança e Retenção', content: 'Adotamos medidas técnicas e administrativas razoáveis para proteger os dados. Mantemos os dados pelo tempo necessário às finalidades ou conforme obrigações legais.' },
        { title: '6. Contato', content: 'Para dúvidas sobre privacidade ou exercer direitos, entre em contato pelo e-mail disponível no site.' }
      ],
      lastUpdate: '25/02/2026'
  });

  const [bannersConfig, setBannersConfig] = useState({
      banners: [
        {
          id: 1,
          name: 'Banner Topo (após Hero)',
          position: 'after-hero',
          width: 1200,
          height: 200,
          imageUrl: '',
          linkUrl: ''
        },
        {
          id: 2,
          name: 'Banner Meio 1 (após Marcas)',
          position: 'after-brands',
          width: 728,
          height: 90,
          imageUrl: '',
          linkUrl: ''
        },
        {
          id: 3,
          name: 'Banner Meio 2 (após Recomendados)',
          position: 'after-premium',
          width: 1200,
          height: 200,
          imageUrl: '',
          linkUrl: ''
        },
        {
          id: 4,
          name: 'Banner Meio 3 (após Vendidos)',
          position: 'after-sold',
          width: 728,
          height: 90,
          imageUrl: '',
          linkUrl: ''
        },
        {
          id: 5,
          name: 'Banner Rodapé (após Depoimentos)',
          position: 'after-testimonials',
          width: 1200,
          height: 200,
          imageUrl: '',
          linkUrl: ''
        }
      ]
  });

  const [heroConfig, setHeroConfig] = useState({
      title: 'Equipamentos com Curadoria Profissional',
      subtitle: 'Compre e venda equipamentos odontológicos com segurança e transparência.',
      backgroundImage: '/uploads/banner1.jpg'
  });

  const [brandSectionConfig, setBrandSectionConfig] = useState({
      title: 'Busque por marcas',
      subtitle: 'Encontre equipamentos dos principais fabricantes do mercado.',
      options: []
  });

  const [footerConfig, setFooterConfig] = useState({
      description: 'Anúncios de equipamentos Odontológicos com curadoria profissional.',
      socialIcons: [
        { id: 1, image: '', link: '' },
        { id: 2, image: '', link: '' },
        { id: 3, image: '', link: '' },
        { id: 4, image: '', link: '' },
        { id: 5, image: '', link: '' }
      ]
  });

  const [advertiseWhatsAppConfig, setAdvertiseWhatsAppConfig] = useState({
      buttonText: 'Falar com consultor sobre planos',
      whatsappNumber: '5511913474725'
  });

  const [postEquipmentWhatsAppConfig, setPostEquipmentWhatsAppConfig] = useState({
    buttonText: 'Enviar para Análise',
    whatsappNumber: '5511913474725'
  });

  const [adBannersConfig, setAdBannersConfig] = useState({
    banner1: { ...DEFAULT_BANNER_SLOT },
    banner2: { ...DEFAULT_BANNER_SLOT },
    banner3: { ...DEFAULT_BANNER_SLOT },
    banner4: { ...DEFAULT_BANNER_SLOT },
    banner5: { ...DEFAULT_BANNER_SLOT },
    banner6: { ...DEFAULT_BANNER_SLOT },
    banner7: { ...DEFAULT_BANNER_SLOT },
    banner8: { ...DEFAULT_BANNER_SLOT }
  });

  const saveRemoteConfig = async (key, value) => {
    const token = getRuntimeToken();
    if (!token) return;
    try {
      await savePageConfigRequest(token, key, value);
    } catch (error) {
      console.error(`❌ Erro ao salvar config remota (${key}):`, error);
    }
  };

  useEffect(() => {
    const loadRemoteConfigs = async () => {
      try {
        const response = await getAllPageConfigsRequest();
        const configs = response?.configs || {};

        if (configs.recommended) setRecommendedConfig(configs.recommended);
        if (configs.testimonials) setTestimonialsConfig(configs.testimonials);
        if (configs.about) {
          setAboutConfig((prev) => ({
            ...prev,
            ...configs.about,
            title: sanitizeText(configs.about?.title, prev.title),
            paragraphs: Array.isArray(configs.about?.paragraphs)
              ? configs.about.paragraphs.map((item, index) => sanitizeText(item, prev.paragraphs?.[index] || '')).filter(Boolean)
              : prev.paragraphs
          }));
        }
        if (configs.contact) setContactConfig(configs.contact);
        if (configs.terms) {
          setTermsConfig((prev) => ({
            ...prev,
            ...configs.terms,
            title: sanitizeText(configs.terms?.title, prev.title),
            intro: sanitizeText(configs.terms?.intro, prev.intro),
            sections: sanitizeSections(configs.terms?.sections, prev.sections)
          }));
        }
        if (configs.privacy) {
          setPrivacyConfig((prev) => ({
            ...prev,
            ...configs.privacy,
            title: sanitizeText(configs.privacy?.title, prev.title),
            intro: sanitizeText(configs.privacy?.intro, prev.intro),
            lastUpdate: sanitizeText(configs.privacy?.lastUpdate, prev.lastUpdate),
            sections: sanitizeSections(configs.privacy?.sections, prev.sections)
          }));
        }
        if (configs.banners) setBannersConfig(configs.banners);
        if (configs.hero) setHeroConfig((prev) => sanitizeHeroConfig(configs.hero, prev));
          if (configs.brand_section) setBrandSectionConfig(configs.brand_section);
          if (configs.footer) setFooterConfig(configs.footer);
          if (configs.advertise_whatsapp) setAdvertiseWhatsAppConfig(prev => ({ ...prev, ...configs.advertise_whatsapp }));
          if (configs.post_equipment_whatsapp) setPostEquipmentWhatsAppConfig(prev => ({ ...prev, ...configs.post_equipment_whatsapp }));
        if (configs.ad_banners) setAdBannersConfig(configs.ad_banners);
      } catch (error) {
        console.error('❌ API de configurações indisponível.', error?.message || error);
      }
    };

    loadRemoteConfigs();
  }, []);

  const updateRecommendedConfig = (newConfig) => {
    setRecommendedConfig((prev) => {
      const updated = {
        ...prev,
        ...newConfig
      };
      saveRemoteConfig('recommended', updated);
      return updated;
    });
  };

  const updateTestimonialsConfig = (newConfig) => {
    setTestimonialsConfig((prev) => {
      const updated = {
        ...prev,
        ...newConfig
      };
      saveRemoteConfig('testimonials', updated);
      return updated;
    });
  };

  const updateAboutConfig = (newConfig) => {
    setAboutConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      saveRemoteConfig('about', updated);
      return updated;
    });
  };

  const updateContactConfig = (newConfig) => {
    setContactConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      saveRemoteConfig('contact', updated);
      return updated;
    });
  };

  const updateTermsConfig = (newConfig) => {
    setTermsConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      saveRemoteConfig('terms', updated);
      return updated;
    });
  };

  const updatePrivacyConfig = (newConfig) => {
    setPrivacyConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      saveRemoteConfig('privacy', updated);
      return updated;
    });
  };

  const updateBannersConfig = (newConfig) => {
    setBannersConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      saveRemoteConfig('banners', updated);
      return updated;
    });
  };

  const updateHeroConfig = (newConfig) => {
    setHeroConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      saveRemoteConfig('hero', updated);
      return updated;
    });
  };

  const updateBrandSectionConfig = (newConfig) => {
    setBrandSectionConfig((prev) => {
      const nextOptions = Array.isArray(newConfig.options)
        ? newConfig.options.slice(0, 10)
        : prev.options;
      const updated = {
        ...prev,
        ...newConfig,
        options: nextOptions
      };
      saveRemoteConfig('brand_section', updated);
      return updated;
    });
  };

  const updateFooterConfig = (newConfig) => {
    setFooterConfig((prev) => {
      const normalizedIcons = Array.isArray(newConfig.socialIcons)
        ? newConfig.socialIcons.slice(0, 5).map((icon, idx) => ({
            id: idx + 1,
            image: icon?.image || '',
            link: icon?.link || ''
          }))
        : prev.socialIcons;

      const updated = {
        ...prev,
        ...newConfig,
        socialIcons: normalizedIcons
      };

      saveRemoteConfig('footer', updated);
      return updated;
    });
  };

  const updateAdvertiseWhatsAppConfig = (newConfig) => {
    setAdvertiseWhatsAppConfig((prev) => {
      const updated = {
        ...prev,
        ...newConfig
      };
      saveRemoteConfig('advertise_whatsapp', updated);
      return updated;
    });
  };

  const updatePostEquipmentWhatsAppConfig = (newConfig) => {
    setPostEquipmentWhatsAppConfig((prev) => {
      const updated = {
        ...prev,
        ...newConfig
      };
      saveRemoteConfig('post_equipment_whatsapp', updated);
      return updated;
    });
  };

  const updateAdBannersConfig = (newConfig) => {
    setAdBannersConfig((prev) => {
      const updated = {
        ...prev,
        ...newConfig
      };
      saveRemoteConfig('ad_banners', updated);
      return updated;
    });
  };

  const value = useMemo(() => ({
    recommendedConfig,
    updateRecommendedConfig,
    testimonialsConfig,
    updateTestimonialsConfig,
    aboutConfig,
    updateAboutConfig,
    contactConfig,
    updateContactConfig,
    termsConfig,
    updateTermsConfig,
    privacyConfig,
    updatePrivacyConfig,
    bannersConfig,
    updateBannersConfig,
    heroConfig,
    updateHeroConfig,
    brandSectionConfig,
    updateBrandSectionConfig,
    footerConfig,
    updateFooterConfig,
    advertiseWhatsAppConfig,
    updateAdvertiseWhatsAppConfig,
    postEquipmentWhatsAppConfig,
    updatePostEquipmentWhatsAppConfig,
    adBannersConfig,
    updateAdBannersConfig
  }), [recommendedConfig, testimonialsConfig, aboutConfig, contactConfig, termsConfig, privacyConfig, bannersConfig, heroConfig, brandSectionConfig, footerConfig, advertiseWhatsAppConfig, postEquipmentWhatsAppConfig, adBannersConfig]);

  return (
    <DataPagesContext.Provider value={value}>
      {children}
    </DataPagesContext.Provider>
  );
};
