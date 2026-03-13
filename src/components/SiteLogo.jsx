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
    <svg
      className="w-full h-full"
      viewBox="0 0 600 120"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Reconectare Digital"
      preserveAspectRatio="xMinYMid meet"
    >
      <style>{`
        text {
          font-family: 'Inter','Poppins','Montserrat',sans-serif;
          font-size: 64px;
          font-weight: 600;
          dominant-baseline: middle;
        }

        .re {
          fill: #222;
          opacity: 0;
          transform: translateX(-120px);
          animation: reSlide 1.2s cubic-bezier(.4,0,.2,1) forwards;
        }

        .conect {
          fill: #222;
          opacity: 0;
          animation: conectFade 0.6s 0.9s forwards,
            conectHighlight 1s 1.8s forwards;
        }

        .are {
          fill: #222;
          opacity: 0;
          transform: translateX(120px);
          animation: areSlide 1.2s cubic-bezier(.4,0,.2,1) forwards;
        }

        @keyframes reSlide {
          0% {
            opacity: 0;
            transform: translateX(-120px);
            filter: blur(6px);
          }
          70% {
            opacity: 1;
            filter: blur(0px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes areSlide {
          0% {
            opacity: 0;
            transform: translateX(120px);
            filter: blur(6px);
          }
          70% {
            opacity: 1;
            filter: blur(0px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes conectFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes conectHighlight {
          0% {
            fill: #222;
          }
          100% {
            fill: #60a5fa;
            font-weight: 700;
          }
        }
      `}</style>

      <text x="70" y="60" className="re">Re</text>
      <text x="152" y="60" className="conect">conect</text>
      <text x="362" y="60" className="are">are</text>
    </svg>
  );
};

export default SiteLogo;
