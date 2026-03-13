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
          display: inline-flex;
          align-items: center;
          justify-content: flex-start;
          white-space: nowrap;
          line-height: 1;
          font-family: 'Inter','Poppins','Montserrat',sans-serif;
          font-size: clamp(1.2rem, 2.05vw, 1.65rem);
          font-weight: 600;
          color: #222;
        }

        .logoWordmark > span {
          display: inline-block;
          opacity: 1;
        }

        .logoWordmark .re {
          margin-right: 0.34em;
          animation: reJoin 0.55s ease-out forwards;
        }

        .logoWordmark .conect {
          color: #222;
          font-weight: 700;
          animation: conectFade 0.35s 0.22s ease-out both,
            conectHighlight 0.45s 0.58s ease-out both;
        }

        .logoWordmark .are {
          margin-left: 0.34em;
          animation: areJoin 0.55s ease-out forwards;
        }

        @keyframes reJoin {
          0% {
            opacity: 0;
            margin-right: 0.54em;
          }
          100% {
            opacity: 1;
            margin-right: 0;
          }
        }

        @keyframes areJoin {
          0% {
            opacity: 0;
            margin-left: 0.54em;
          }
          100% {
            opacity: 1;
            margin-left: 0;
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
            margin: 0 !important;
          }
          .logoWordmark .conect {
            color: #60a5fa;
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
