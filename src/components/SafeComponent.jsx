import React, { useState, useEffect } from 'react';
import ErrorBoundary from './ErrorBoundary';
import LoadingSpinner from './LoadingSpinner';

// 安全组件包装器，为每个组件提供错误边界和加载状态
const SafeComponent = ({ 
  children, 
  componentName, 
  fallbackMessage = '组件加载失败',
  showLoading = false,
  loadingMessage = '加载中...',
  className = '',
  customFallback = null  // 新增自定义降级组件
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted && showLoading) {
    return (
      <div className={`p-6 ${className}`}>
        <LoadingSpinner message={loadingMessage} />
      </div>
    );
  }

  const defaultFallback = (
    <div className={`p-6 bg-red-50 border border-red-200 rounded-lg ${className}`}>
      <div className="text-center">
        <div className="text-4xl mb-2">⚠️</div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          {componentName || '组件'}加载失败
        </h3>
        <p className="text-red-600 text-sm mb-4">{fallbackMessage}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
        >
          刷新页面
        </button>
      </div>
    </div>
  );
  
  // 使用自定义fallback或默认fallback
  const errorFallback = customFallback || defaultFallback;

  return (
    <ErrorBoundary 
      componentName={componentName} 
      customFallback={errorFallback}
    >
      {children}
    </ErrorBoundary>
  );
};

export default SafeComponent;