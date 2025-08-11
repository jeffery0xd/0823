import React from 'react';

const MetaHeader = ({ onMenuToggle, onLogout, isAuthenticated }) => {
  return (
    <header className="apple-nav sticky top-0 z-50 apple-fade-in">
      <div className="max-w-7xl mx-auto px-3 py-2 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title - 移动端优化 */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-gray-600 hover:bg-gray-100 transition-all duration-200 apple-hover"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm sm:text-lg">A</span>
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Analytics Pro
                </h1>
                <p className="hidden sm:block text-sm text-gray-500 -mt-1">数据分析平台</p>
              </div>
            </div>
          </div>

          {/* Header Actions - 移动端简化 */}
          <div className="flex items-center space-x-1 sm:space-x-3">
            <div className="hidden md:flex items-center space-x-2 bg-green-50 rounded-full px-4 py-2 border border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">实时同步中</span>
            </div>
            
            <div className="flex space-x-0.5 sm:space-x-1">
              <button className="p-1.5 sm:p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg sm:rounded-xl transition-all duration-200 apple-hover">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              
              <button className="hidden sm:block p-1.5 sm:p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg sm:rounded-xl transition-all duration-200 apple-hover">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-5 5-5-5h5v-12h10v5" />
                </svg>
              </button>
              
              <button className="p-1.5 sm:p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg sm:rounded-xl transition-all duration-200 apple-hover">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              
              {/* 登出按钮 */}
              {isAuthenticated && (
                <button
                  onClick={onLogout}
                  className="p-1.5 sm:p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg sm:rounded-xl transition-all duration-200 apple-hover"
                  title="退出登录"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default MetaHeader;