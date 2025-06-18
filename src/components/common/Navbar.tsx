import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { LogOut, BarChart, Menu, X, Sun, Moon } from "lucide-react";

const Navbar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  if (!currentUser) return null;

  // Temporarily commented out for portfolio - these features are not fully implemented
  // const navLinks = [
  //   { to: "/dashboard", icon: <BarChart size={18} />, label: "Dashboard" },
  //   { to: "/prices", icon: <FileText size={18} />, label: "Price Sheets" },
  //   { to: "/documents", icon: <FileText size={18} />, label: "Documents" },
  // ];

  // Add Invite User tab for managers and admins - temporarily commented out for portfolio
  // if (
  //   currentUser &&
  //   (currentUser.role === "manager" || currentUser.role === "admin")
  // ) {
  //   navLinks.push({
  //     to: "/invite",
  //     icon: <FileText size={18} />,
  //     label: "Invite User",
  //   });
  // }

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex-shrink-0 flex items-center">
              <BarChart className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">
                SalesDash
              </span>
            </Link>

            {/* Desktop navigation */}
            {/* Temporarily commented out for portfolio - these features are not fully implemented */}
            {/* <div className="hidden md:ml-6 md:flex md:space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  {link.icon}
                  <span className="ml-1">{link.label}</span>
                </Link>
              ))}
            </div> */}
          </div>

          <div className="flex items-center">
            <div className="hidden md:flex items-center">
              <button
                onClick={toggleDarkMode}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 mx-4">
                {currentUser.name}
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <LogOut size={18} className="mr-1" />
                Logout
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-2">
              <button
                onClick={toggleDarkMode}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${mobileMenuOpen ? "block" : "hidden"}`}>
        <div className="pt-2 pb-3 space-y-1 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800">
          {/* Temporarily commented out for portfolio - these features are not fully implemented */}
          {/* {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.icon}
              <span className="ml-2">{link.label}</span>
            </Link>
          ))} */}
          <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {currentUser.name}
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <LogOut size={18} className="mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
