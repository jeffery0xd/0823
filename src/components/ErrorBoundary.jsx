import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // 更新state，下次渲染将显示错误UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 记录错误信息
    console.error('错误边界捕获到错误:', error);
    console.error('错误详情:', errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      const { customFallback, componentName } = this.props;
      
      // 如果有自定义fallback，使用它
      if (customFallback) {
        return customFallback;
      }
      
      // 默认错误UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                页面遇到了渲染问题
              </h2>
              <p className="text-gray-600 mb-6">
                {componentName ? `${componentName}组件` : '应用'}发生了错误，请刷新页面重试。
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  🔄 刷新页面
                </button>
                
                <button
                  onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  🔄 重试
                </button>
              </div>
              
              {/* 开发环境显示错误详情 */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-red-600 font-medium">
                    错误详情 (开发模式)
                  </summary>
                  <div className="mt-2 p-3 bg-red-50 rounded border text-sm">
                    <div className="font-bold text-red-800">错误消息:</div>
                    <div className="text-red-700 mb-2">{this.state.error.toString()}</div>
                    
                    <div className="font-bold text-red-800">组件堆栈:</div>
                    <pre className="text-red-600 text-xs overflow-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;