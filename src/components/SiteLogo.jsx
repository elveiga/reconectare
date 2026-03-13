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

        .wordmark {
          fill: #222;
          opacity: 0;
          animation: logoFade 0.9s ease-out forwards;
        }

        .conect-highlight {
          fill: #60a5fa;
          font-weight: 700;
        }

        @keyframes logoFade {
          0% {
            opacity: 0;
            filter: blur(6px);
          }
          100% {
            opacity: 1;
            filter: blur(0px);
          }
        }
      `}</style>

      <text x="36" y="60" className="wordmark">
        <tspan>Re</tspan>
        <tspan className="conect-highlight">conect</tspan>
        <tspan>are</tspan>
      </text>
    </svg>
  );
};

export default SiteLogo;
