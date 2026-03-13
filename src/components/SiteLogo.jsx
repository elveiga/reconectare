import React from 'react';

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
    <div className="logoWordmark" role="img" aria-label="Reconectare Digital">
      <style>{`
        .logoWordmark {
          display: inline-flex;
          align-items: center;
          justify-content: flex-start;
          white-space: nowrap;
          overflow: hidden;
          line-height: 1;
          font-family: 'Inter','Poppins','Montserrat',sans-serif;
          font-size: clamp(0.95rem, 1.6vw, 1.25rem);
          font-weight: 600;
          color: #222;
        }

        .logoWordmark > span {
          display: inline-block;
        }

        .logoWordmark .re {
          animation: logoSlideLeft 0.5s ease-out both;
        }

        .logoWordmark .conect {
          color: #60a5fa;
          font-weight: 700;
          animation: logoFadeIn 0.4s 0.25s ease-out both;
        }

        .logoWordmark .are {
          animation: logoSlideRight 0.5s ease-out both;
        }

        @keyframes logoSlideLeft {
          from { opacity: 0; transform: translateX(-0.5em); }
          to   { opacity: 1; transform: translateX(0); }
        }

        @keyframes logoSlideRight {
          from { opacity: 0; transform: translateX(0.5em); }
          to   { opacity: 1; transform: translateX(0); }
        }

        @keyframes logoFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
          .logoWordmark .re,
          .logoWordmark .are,
          .logoWordmark .conect {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>

      <span className="re">Re</span>
      <span className="conect">conect</span>
      <span className="are">are</span>
    </div>
  );
};

export default SiteLogo;
