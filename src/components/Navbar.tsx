import React from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Search, List, Library, Settings } from "lucide-react";

export const Navbar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Search", icon: <Search size={20} /> },
    { path: "/queue", label: "Queue", icon: <List size={20} /> },
    { path: "/library", label: "Library", icon: <Library size={20} /> },
    { path: "/settings", label: "Settings", icon: <Settings size={20} /> },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50 backdrop-blur-md bg-white/80">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="text-2xl font-black text-blue-600 tracking-tighter">
          Serie Downloader
        </Link>
        <div className="flex items-center gap-2 md:gap-6">
          {navItems.map((item) => (
            <Link 
              key={item.path}
              to={item.path} 
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                location.pathname === item.path 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                  : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              {item.icon}
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};
