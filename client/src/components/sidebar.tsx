/**
 * Sidebar Component
 * 
 * Navigation sidebar for project views, providing organized access
 * to different project sections and features. Used in both client
 * portal and freelancer project management interfaces.
 * 
 * Features:
 * - Project branding and identity
 * - Tabbed navigation system
 * - Active state management
 * - Professional visual design
 * - Responsive icon and text layout
 * 
 * @module Sidebar
 */

import { Briefcase, Home, Clock, Folder, MessageSquare, CreditCard, Star } from "lucide-react";
import type { Project } from "@shared/schema";

interface SidebarProps {
  project: Project;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

/**
 * Sidebar navigation component for project interfaces
 * Provides tabbed navigation and project branding
 */
export function Sidebar({ project, activeTab, onTabChange }: SidebarProps) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "timeline", label: "Timeline", icon: Clock },
    { id: "files", label: "Files", icon: Folder },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "invoices", label: "Invoices", icon: CreditCard },
    { id: "feedback", label: "Feedback", icon: Star },
  ];

  return (
    <div className="w-64 bg-white shadow-sm border-r border-slate-200 flex flex-col">
      {/* Branded Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Briefcase className="text-white text-lg" />
          </div>
          <div>
            <h1 className="font-semibold text-slate-900">Creative Studio</h1>
            <p className="text-sm text-slate-500">{project.name}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`sidebar-nav-item w-full text-left ${isActive ? 'active' : ''}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className={isActive ? "font-medium" : ""}>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Client Info */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
            <span className="text-slate-600 text-sm font-medium">
              {project.clientName[0].toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">{project.clientName}</p>
            <p className="text-xs text-slate-500">Client</p>
          </div>
        </div>
      </div>
    </div>
  );
}
