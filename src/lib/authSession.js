let runtimeToken = '';
let runtimeUser = null;

export const getRuntimeToken = () => runtimeToken;

export const getRuntimeUser = () => runtimeUser;

export const setRuntimeAuth = (token, user) => {
  runtimeToken = token || '';
  runtimeUser = user || null;
};

export const clearRuntimeAuth = () => {
  runtimeToken = '';
  runtimeUser = null;
};
