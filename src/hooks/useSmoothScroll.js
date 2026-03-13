import { useEffect } from 'react';

/**
 * Hook para aprimorar smooth scroll com interpolação suave
 * Melhora a experiência de scroll em navegadores que não suportam scroll-behavior
 */
export const useSmoothScroll = () => {
  useEffect(() => {
    // Verifica suporte a scroll-behavior
    const htmlElement = document.documentElement;
    const supportsNativeSmooth = 'scrollBehavior' in htmlElement.style;

    if (supportsNativeSmooth) {
      return; // Deixa o navegador usar suporte nativo
    }

    // Fallback para navegadores antigos
    const handleSmoothScroll = (e) => {
      const target = e.target?.closest('a[href^="#"]');
      if (!target) return;

      const href = target.getAttribute('href');
      const element = document.querySelector(href);
      
      if (!element) return;

      e.preventDefault();
      smoothScrollTo(element, 500);
    };

    document.addEventListener('click', handleSmoothScroll);
    return () => document.removeEventListener('click', handleSmoothScroll);
  }, []);
};

/**
 * Função de scroll suave com easing
 */
export const smoothScrollTo = (element, duration = 500) => {
  const start = window.scrollY;
  const targetPosition = element.getBoundingClientRect().top + window.scrollY - 80; // 80px offset
  const distance = targetPosition - start;
  let startTime = null;

  const easeInOutCubic = (t) => {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  };

  const animation = (currentTime) => {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    const ease = easeInOutCubic(progress);

    window.scrollTo(0, start + distance * ease);

    if (progress < 1) {
      requestAnimationFrame(animation);
    }
  };

  requestAnimationFrame(animation);
};

/**
 * Hook para momentum scroll (como em celulares)
 * Ativa inércia ao scroll
 */
export const useMomentumScroll = () => {
  useEffect(() => {
    // Ativa -webkit-overflow-scrolling automaticamente
    const scrollElements = document.querySelectorAll('[style*="overflow"]');
    scrollElements.forEach((el) => {
      if (el.style.overflow === 'auto' || el.style.overflow === 'scroll') {
        el.style.WebkitOverflowScrolling = 'touch';
      }
    });
  }, []);
};

export default useSmoothScroll;
