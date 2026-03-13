import { create } from 'zustand';

export const useUserStore = create((set) => ({
  user: JSON.parse(sessionStorage.getItem('user') || 'null'),

  login: (userData) => {
    sessionStorage.setItem('user', JSON.stringify(userData));
    set({ user: userData });
  },

  logout: () => {
    sessionStorage.removeItem('user');
    set({ user: null });
  },
}));