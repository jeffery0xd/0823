import React from 'react';
import { useTheme } from './ThemeProvider';

const ModernCard = ({ children, className = '', noPadding = false }) => {
  const { isDark } = useTheme();
  
  return (
    <div className={`
      relative overflow-hidden rounded-3xl transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl
      ${isDark 
        ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700/50' 
        : 'bg-white/80 backdrop-blur-xl border border-gray-200/50'
      }
      ${noPadding ? '' : 'p-6'}
      ${className}
    `}>
      {/* 背景渐变装饰 */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-5 blur-2xl ${
        isDark ? 'bg-purple-500' : 'bg-blue-400'
      }`}></div>
      
      <div className="relative">
        {children}
      </div>
    </div>
  );
};

export const ModernInput = ({ label, value, onChange, type = 'text', placeholder, required = false, ...props }) => {
  const { isDark } = useTheme();
  
  return (
    <div className="space-y-2">
      {label && (
        <label className={`block text-sm font-medium ${
          isDark ? 'text-gray-300' : 'text-gray-700'
        }`}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`
          w-full px-4 py-3 rounded-2xl border transition-all duration-200
          focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${isDark 
            ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' 
            : 'bg-white/80 border-gray-300 text-gray-900 placeholder-gray-500'
          }
        `}
        {...props}
      />
    </div>
  );
};

export const ModernButton = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false,
  className = '',
  ...props 
}) => {
  const { isDark } = useTheme();
  
  const variants = {
    primary: `${
      isDark 
        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700' 
        : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
    } text-white shadow-lg`,
    secondary: `${
      isDark 
        ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
    }`,
    danger: 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg'
  };
  
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        rounded-2xl font-semibold transition-all duration-200
        hover:scale-105 hover:shadow-xl
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        flex items-center justify-center space-x-2
        ${className}
      `}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      )}
      <span>{children}</span>
    </button>
  );
};

export const ModernSelect = ({ label, value, onChange, options, placeholder, required = false, ...props }) => {
  const { isDark } = useTheme();
  
  return (
    <div className="space-y-2">
      {label && (
        <label className={`block text-sm font-medium ${
          isDark ? 'text-gray-300' : 'text-gray-700'
        }`}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        className={`
          w-full px-4 py-3 rounded-2xl border transition-all duration-200
          focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${isDark 
            ? 'bg-gray-700/50 border-gray-600 text-white' 
            : 'bg-white/80 border-gray-300 text-gray-900'
          }
        `}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ModernCard;