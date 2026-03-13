import React from 'react';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { Check, Star } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

/**
 * Fallback TOTAL
 * Protege contra:
 * - plans inexistente
 * - features inexistente
 */
const DEFAULT_PLANS = [
  {
    id: 1,
    name: 'Básico',
    price: 'R$ 299',
    period: '/mês',
    recommended: false,
    features: [
      '1 anúncio ativo',
      'Visibilidade padrão',
      'Suporte por e-mail'
    ]
  },
  {
    id: 2,
    name: 'Profissional',
    price: 'R$ 699',
    period: '/mês',
    recommended: true,
    features: [
      'Até 5 anúncios',
      'Destaque nos resultados',
      'Selo Premium',
      'Suporte prioritário'
    ]
  },
  {
    id: 3,
    name: 'Enterprise',
    price: 'Sob consulta',
    period: '',
    recommended: false,
    features: [
      'Anúncios ilimitados',
      'Exposição máxima',
      'Página dedicada',
      'Gerente de conta'
    ]
  }
];

const PricingPlans = () => {
  const data = useData();
  const { toast } = useToast();

  // 🔒 Blindagem absoluta
  const plans = Array.isArray(data?.plans) && data.plans.length
    ? data.plans
    : DEFAULT_PLANS;

  const handlePlanClick = () => {
    toast({
      title: '🚧 Funcionalidade em desenvolvimento',
      description: 'A contratação de planos estará disponível em breve.'
    });
  };

  // Plans section removed — component kept for compatibility.
  // If needed later, restore rendering using the `plans` array.
  return null;
};

export default PricingPlans;