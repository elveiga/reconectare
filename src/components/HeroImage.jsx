import React, { useState } from 'react';

const HeroImage = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-gray-200 to-gray-100">
      <img
        src="https://images.unsplash.com/photo-1629909615957-be38d48fbbe6?w=400&q=75&auto=format"
        alt="Dental equipment"
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-500 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ width: '356px', height: '276px' }}
      />
    </div>
  );
};

export default HeroImage;