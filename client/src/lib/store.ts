import { create } from "zustand";

// Simple authentication store following your pattern
type AuthState = {
  user: any;
  setUser: (u: any) => void;
  clearUser: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (u) => set({ user: u }),
  clearUser: () => set({ user: null }),
}));

// Project state store for current context
type ProjectState = {
  currentProject: any | null;
  projects: any[];
  setCurrentProject: (project: any) => void;
  setProjects: (projects: any[]) => void;
  clearProjects: () => void;
};

export const useProjectStore = create<ProjectState>((set) => ({
  currentProject: null,
  projects: [],
  setCurrentProject: (project) => set({ currentProject: project }),
  setProjects: (projects) => set({ projects }),
  clearProjects: () => set({ currentProject: null, projects: [] }),
}));

// UI state store for theme and notifications
type UIState = {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
};

export const useUIStore = create<UIState>((set) => ({
  theme: 'light',
  sidebarOpen: true,
  toggleTheme: () => set((state) => ({ 
    theme: state.theme === 'light' ? 'dark' : 'light' 
  })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));