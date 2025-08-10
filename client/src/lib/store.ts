import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// User store for authentication state
interface UserState {
  user: any | null;
  isAuthenticated: boolean;
  setUser: (user: any) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      clearUser: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'user-storage',
    }
  )
);

// UI state store for global UI state
interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  notifications: Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    timestamp: number;
  }>;
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      sidebarOpen: true,
      notifications: [],
      toggleTheme: () => set((state) => ({ 
        theme: state.theme === 'light' ? 'dark' : 'light' 
      })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      addNotification: (notification) => set((state) => ({
        notifications: [
          ...state.notifications,
          {
            ...notification,
            id: Math.random().toString(36).substring(7),
            timestamp: Date.now(),
          }
        ]
      })),
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),
      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'ui-storage',
    }
  )
);

// Project state store for current project context
interface ProjectState {
  currentProject: any | null;
  projects: any[];
  isLoading: boolean;
  setCurrentProject: (project: any) => void;
  setProjects: (projects: any[]) => void;
  setLoading: (loading: boolean) => void;
  clearProjectState: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  currentProject: null,
  projects: [],
  isLoading: false,
  setCurrentProject: (project) => set({ currentProject: project }),
  setProjects: (projects) => set({ projects }),
  setLoading: (loading) => set({ isLoading: loading }),
  clearProjectState: () => set({ 
    currentProject: null, 
    projects: [], 
    isLoading: false 
  }),
}));