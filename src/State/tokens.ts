import { TOKEN_KEY, USER_KEY } from "../constants";
import { UserFragment } from "../graphql/apollo/types/UserFragment";

export const getToken = (): string | null =>
  localStorage.getItem(TOKEN_KEY) || null;

export const storeToken = (token: string) =>
  localStorage.setItem(TOKEN_KEY, token);

export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const storeUser = async (user: UserFragment) =>
  localStorage.setItem(USER_KEY, JSON.stringify(user));

export const getUser = (): UserFragment | null => {
  const data = localStorage.getItem(USER_KEY);

  if (data) {
    return JSON.parse(data) as UserFragment;
  }

  return null;
};

export const clearUser = async () => localStorage.removeItem(USER_KEY);
