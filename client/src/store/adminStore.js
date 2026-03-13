import { create } from 'zustand';

// Simple admin auth — credentials checked client-side
// In production you'd use a real JWT endpoint
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

export const useAdminStore = create((set) => ({
  isAdmin: sessionStorage.getItem('isAdmin') === 'true',

  login: (username, password) => {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      sessionStorage.setItem('isAdmin', 'true');
      set({ isAdmin: true });
      return true;
    }
    return false;
  },

  logout: () => {
    sessionStorage.removeItem('isAdmin');
    set({ isAdmin: false });
  },
}));