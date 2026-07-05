const TOKEN_KEY = 'carelink_token';

export const getToken = () => sessionStorage.getItem(TOKEN_KEY);

export const setToken = (token) => {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = () => sessionStorage.removeItem(TOKEN_KEY);

export const captureTokenFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const queryToken = params.get('token');
  if (queryToken) {
    setToken(queryToken);
    params.delete('token');
    const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}`;
    window.history.replaceState({}, '', next);
    return queryToken;
  }

  const hash = window.location.hash;
  if (hash.startsWith('#token=')) {
    const hashToken = decodeURIComponent(hash.slice(7));
    setToken(hashToken);
    window.history.replaceState({}, '', window.location.pathname + window.location.search);
    return hashToken;
  }

  return null;
};
