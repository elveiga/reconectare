import React from 'react';
import { useData } from '@/contexts/DataContext';
import ListingCard from './ListingCard';

const SoldSection = () => {
  const { listings } = useData();

  const sold = listings
    .filter((l) => l.status === 'Vendido')
    .slice(0, 4);

  if (!sold.length) return null;

  return (
    <section className="py-6 bg-white border-t">
      <div className="max-w-6xl mx-auto px-3">
        <div className="mb-3">
          <h2 className="text-xl font-bold text-gray-900">
            Últimas vendas
          </h2>
          <p className="text-xs text-gray-600">
            Equipamentos vendidos recentemente.
          </p>
        </div>

  <div className="grid grid-cols-2 lg:grid-cols-3 gap-[15px]">
          {sold.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              compact
              showWhatsapp={false}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SoldSection;