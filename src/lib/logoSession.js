const LOGO_UPDATED_EVENT = 'loopdigital-logo-updated';

let runtimeLogo = null;

export const getRuntimeLogo = () => runtimeLogo;

export const setRuntimeLogo = (logoDataUrl) => {
  runtimeLogo = logoDataUrl || null;
  window.dispatchEvent(new Event(LOGO_UPDATED_EVENT));
};

export const clearRuntimeLogo = () => {
  runtimeLogo = null;
  window.dispatchEvent(new Event(LOGO_UPDATED_EVENT));
};

export const LOGO_SESSION_EVENT = LOGO_UPDATED_EVENT;
