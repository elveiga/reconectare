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
          font-size: clamp(1.75rem, 5vw, 2.35rem);
          font-weight: 600;
          color: #222;
          overflow: hidden;
        }

        .logoWordmark > span {
          display: inline-block;
          opacity: 0;
        }

        .logoWordmark .re {
          animation: reSlide 0.9s cubic-bezier(.4,0,.2,1) forwards;
        }

        .logoWordmark .conect {
          color: #222;
          animation: conectFade 0.45s 0.55s ease-out forwards,
            conectHighlight 0.6s 0.95s ease-out forwards;
        }

        .logoWordmark .are {
          animation: areSlide 0.9s cubic-bezier(.4,0,.2,1) forwards;
        }

        @keyframes reSlide {
          0% {
            opacity: 0;
            transform: translateX(-0.9em);
            filter: blur(5px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
            filter: blur(0);
          }
        }

        @keyframes areSlide {
          0% {
            opacity: 0;
            transform: translateX(0.9em);
            filter: blur(5px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
            filter: blur(0);
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
            filter: none !important;
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
