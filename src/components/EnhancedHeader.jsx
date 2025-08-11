import React from 'react';
import { useTheme } from './ThemeProvider';

const EnhancedHeader = ({ onMenuToggle, onLogout, isAuthenticated }) => {
  const { isDark, toggleTheme, beijingTime, mexicoTime } = useTheme();

  const formatTime = (date) => {
    if (!date) return '--:--:--';
    return date.toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    if (!date) return '--/--/--';
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        {/* 左侧：菜单和Logo */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuToggle}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 lg:hidden"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-medium text-gray-900">
                Analytics Pro
              </h1>
              <p className="text-sm text-gray-500">
                数据分析平台
              </p>
            </div>
          </div>
        </div>

        {/* 中间：时间显示 */}
        <div className="hidden md:flex items-center space-x-4">
          {/* 北京时间 */}
          <div className="flex items-center space-x-3 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <div className="text-center">
              <div className="text-xs font-medium text-gray-700">🇨🇳 北京</div>
              <div className="text-sm font-mono text-gray-900">
                {beijingTime ? formatTime(beijingTime) : '--:--:--'}
              </div>
              <div className="text-xs text-gray-500">
                {beijingTime ? formatDate(beijingTime) : '--/--/--'}
              </div>
            </div>
          </div>

          {/* 墨西哥时间 */}
          <div className="flex items-center space-x-3 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="text-center">
              <div className="text-xs font-medium text-gray-700">🇲🇽 墨西哥</div>
              <div className="text-sm font-mono text-gray-900">
                {mexicoTime ? formatTime(mexicoTime) : '--:--:--'}
              </div>
              <div className="text-xs text-gray-500">
                {mexicoTime ? formatDate(mexicoTime) : '--/--/--'}
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：控制按钮 */}
        <div className="flex items-center space-x-3">
          {/* 主题切换按钮 */}
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            title="切换主题"
          >
            {isDark ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>

          {/* 状态指示器 */}
          <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium">
              在线
            </span>
          </div>

          {/* 登出按钮 */}
          {isAuthenticated && (
            <button
              onClick={onLogout}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
              title="退出登录"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default EnhancedHeader;