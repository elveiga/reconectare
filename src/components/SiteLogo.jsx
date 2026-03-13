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
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          white-space: nowrap;
          line-height: 1;
          font-family: 'Inter','Poppins','Montserrat',sans-serif;
          font-size: clamp(1.45rem, 3.1vw, 2rem);
          font-weight: 600;
          color: #222;
          overflow: hidden;
        }

        .logoWordmark > span {
          display: inline-block;
          opacity: 1;
        }

        .logoWordmark .re {
          animation: reSlide 0.65s ease-out both;
        }

        .logoWordmark .conect {
          color: #222;
          animation: conectFade 0.35s 0.35s ease-out both,
            conectHighlight 0.45s 0.7s ease-out both;
        }

        .logoWordmark .are {
          animation: areSlide 0.65s ease-out both;
        }

        @keyframes reSlide {
          0% {
            opacity: 0;
            transform: translateX(-0.55em);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes areSlide {
          0% {
            opacity: 0;
            transform: translateX(0.55em);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes conectFade {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        @keyframes conectHighlight {
          0% { color: #222; }
          100% { color: #60a5fa; }
        }

        @media (prefers-reduced-motion: reduce) {
          .logoWordmark > span {
            animation: none !important;
            opacity: 1;
            transform: none !important;
          }
          .logoWordmark .conect {
            color: #60a5fa;
          }
        }

        .logoWordmark .conect {
          font-weight: 700;
        }
      `}</style>

      <span className="re">Re</span>
      <span className="conect">conect</span>
      <span className="are">are</span>
    </div>
  );
};

export default SiteLogo;
