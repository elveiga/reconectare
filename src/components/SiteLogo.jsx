import React from 'react';
import { motion } from 'framer-motion';

const wrapStyle = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  whiteSpace: 'nowrap',
  lineHeight: 1,
  fontFamily: "'Inter','Poppins','Montserrat',sans-serif",
  fontSize: 'clamp(0.95rem, 1.6vw, 1.25rem)',
  fontWeight: 600,
  color: '#1a1a1a',
};

const ease = [0.22, 1, 0.36, 1];

const SiteLogo = ({ customLogo, onCustomLogoError }) => {
  if (customLogo) {
    return (
      <img
        src={customLogo}
        alt="Reconectare Digital"
        className="w-full h-full object-contain"
        onError={onCustomLogoError}
      />
    );
  }

  return (
    <div style={wrapStyle} role="img" aria-label="Reconectare Digital">
      <motion.span
        style={{ display: 'inline-block' }}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease }}
      >
        Re
      </motion.span>
      <motion.span
        style={{ display: 'inline-block', color: '#60a5fa', fontWeight: 700 }}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.3, ease }}
      >
        conect
      </motion.span>
      <motion.span
        style={{ display: 'inline-block' }}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease }}
      >
        are
      </motion.span>
    </div>
  );
};

export default SiteLogo;
