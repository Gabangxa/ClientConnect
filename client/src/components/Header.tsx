/**
 * Header Component
 * 
 * Main navigation header for the freelancer dashboard.
 * Displays branding, provides quick access to project creation,
 * and handles user logout functionality.
 * 
 * Features:
 * - Brand identity and logo display
 * - New project creation shortcut
 * - User logout with session cleanup
 * - Professional styling with glassmorphism effects
 * 
 * @module Header
 */

import { useLocation } from "wouter";

export default function Header() {
  const [, setLocation] = useLocation();

  const handleNewProject = () => {
    setLocation("/create-project");
  };

  const handleLogout = () => {
    // Simple logout by redirecting to the root and clearing any local data
    window.location.href = "/api/logout";
  };

  return (
    <header className="px-4 py-4 border-b bg-gradient-to-b from-transparent to-white/40">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* logo / brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-300 to-brand-500 flex items-center justify-center text-white font-bold soft-shadow">
            CC
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-800">ClientConnect</div>
            <div className="text-xs text-gray-500">Client portal & delivery</div>
          </div>
        </div>

        {/* right actions */}
        <div className="flex items-center gap-3">
          {/* Example CTA — replace with real user avatar + menu */}
          <button
            onClick={handleNewProject}
            data-testid="button-new-project"
            className="inline-flex items-center gap-2 bg-white glass px-3 py-2 rounded-lg soft-shadow hover:scale-[1.02] transition-transform"
            aria-label="New project"
          >
            <span className="text-sm font-medium text-brand-700">New Project</span>
          </button>

          <button
            onClick={handleLogout}
            data-testid="button-logout"
            className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}