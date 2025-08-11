import React, { useState, useEffect, useCallback } from 'react';

const ImagePreviewModal = ({ isOpen, onClose, imageUrl, imageName }) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // 调试函数
  const logDebugInfo = useCallback((message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    const debugMessage = `[${timestamp}] ${message}`;
    console.log(debugMessage, data);
    setDebugInfo(prev => prev ? `${prev}\n${debugMessage}` : debugMessage);
  }, []);

  // 每次模态框打开时重置所有状态
  useEffect(() => {
    if (isOpen) {
      logDebugInfo('模态框打开', { imageUrl, imageName });
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);
      setImageLoading(true);
      setImageError(false);
      setDebugInfo(null);
      setRetryCount(0);
    }
  }, [isOpen, imageUrl, logDebugInfo, imageName]);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        logDebugInfo('用户按ESC键关闭模态框');
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose, logDebugInfo]);

  // 焦点管理
  useEffect(() => {
    if (isOpen) {
      // 保存当前焦点元素
      const previousFocus = document.activeElement;
      
      // 将焦点设置到模态框
      const modal = document.querySelector('[data-modal="image-preview"]');
      if (modal) {
        modal.focus();
      }
      
      return () => {
        // 恢复之前的焦点
        if (previousFocus && typeof previousFocus.focus === 'function') {
          previousFocus.focus();
        }
      };
    }
  }, [isOpen]);

  if (!isOpen) {
    logDebugInfo('模态框未打开，返回null');
    return null;
  }
  
  // 如果没有imageUrl，显示错误状态
  if (!imageUrl) {
    logDebugInfo('图片URL无效', imageUrl);
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[9999] p-4"
        onClick={onClose}
        data-modal="image-preview"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="bg-white rounded-lg p-6 text-center max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 id="modal-title" className="text-lg font-semibold text-gray-800 mb-2">图片地址无效</h3>
          <p className="text-gray-600 text-sm mb-4">没有找到有效的图片地址。</p>
          <button
            onClick={onClose}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            autoFocus
          >
            关闭
          </button>
        </div>
      </div>
    );
  }

  // 处理图片下载
  const handleDownload = useCallback(() => {
    logDebugInfo('开始下载图片', imageUrl);
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = imageName || '清零截图.jpg';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      logDebugInfo('图片下载链接已触发');
    } catch (error) {
      logDebugInfo('下载失败', error);
    }
  }, [imageUrl, imageName, logDebugInfo]);

  // 缩放功能
  const handleZoomIn = useCallback(() => {
    setZoom(prev => {
      const newZoom = Math.min(prev + 0.25, 3);
      logDebugInfo(`放大到 ${Math.round(newZoom * 100)}%`);
      return newZoom;
    });
  }, [logDebugInfo]);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => {
      const newZoom = Math.max(prev - 0.25, 0.5);
      logDebugInfo(`缩小到 ${Math.round(newZoom * 100)}%`);
      return newZoom;
    });
  }, [logDebugInfo]);

  const resetZoom = useCallback(() => {
    logDebugInfo('重置缩放');
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [logDebugInfo]);

  // 拖拽功能
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    logDebugInfo('开始拖拽');
  }, [position.x, position.y, logDebugInfo]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart.x, dragStart.y]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      logDebugInfo('结束拖拽');
    }
  }, [isDragging, logDebugInfo]);

  // 处理遮罩层点击
  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      logDebugInfo('用户点击遮罩层关闭模态框');
      onClose();
    }
  }, [onClose, logDebugInfo]);

  // 鼠标事件监听
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isOpen, handleMouseMove, handleMouseUp]);

  // 处理图片加载完成
  const handleImageLoad = useCallback((e) => {
    logDebugInfo('图片加载成功', {
      naturalWidth: e.target.naturalWidth,
      naturalHeight: e.target.naturalHeight,
      src: e.target.src
    });
    setImageLoading(false);
    setImageError(false);
  }, [logDebugInfo]);

  // 处理图片加载失败
  const handleImageError = useCallback((e) => {
    const error = {
      src: e.target.src,
      error: e.target.error,
      retryCount: retryCount
    };
    logDebugInfo('图片加载失败', error);
    setImageLoading(false);
    setImageError(true);
  }, [logDebugInfo, retryCount]);

  // 重试加载图片
  const retryLoadImage = useCallback(() => {
    logDebugInfo(`重试加载图片 (第${retryCount + 1}次)`, imageUrl);
    setImageError(false);
    setImageLoading(true);
    setRetryCount(prev => prev + 1);
    
    // 强制重新加载图片
    const img = new Image();
    img.onload = () => {
      logDebugInfo('重试加载成功');
      setImageLoading(false);
      setImageError(false);
    };
    img.onerror = (e) => {
      logDebugInfo('重试加载失败', e);
      setImageLoading(false);
      setImageError(true);
    };
    
    // 添加时间戳避免缓存
    const urlWithTimestamp = imageUrl.includes('?') 
      ? `${imageUrl}&_retry=${Date.now()}` 
      : `${imageUrl}?_retry=${Date.now()}`;
    
    img.src = urlWithTimestamp;
  }, [imageUrl, retryCount, logDebugInfo]);

  // 在新窗口打开图片
  const openInNewWindow = useCallback(() => {
    logDebugInfo('在新窗口打开图片', imageUrl);
    try {
      window.open(imageUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      logDebugInfo('新窗口打开失败', error);
    }
  }, [imageUrl, logDebugInfo]);

  // 验证图片URL格式
  const validateImageUrl = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // 检查URL有效性
  const isValidUrl = validateImageUrl(imageUrl);
  if (!isValidUrl) {
    logDebugInfo('URL格式无效', imageUrl);
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[9999] p-4"
      onClick={handleOverlayClick}
      data-modal="image-preview"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-modal-title"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 9999
      }}
    >
      {/* 控制面板 */}
      <div className="absolute top-4 right-4 z-10 bg-white bg-opacity-90 rounded-lg shadow-lg p-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomOut}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-bold"
            title="缩小"
            aria-label="缩小图片"
          >
            -
          </button>
          
          <span className="text-sm font-medium px-2 py-1 bg-gray-100 rounded min-w-[50px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          
          <button
            onClick={handleZoomIn}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-bold"
            title="放大"
            aria-label="放大图片"
          >
            +
          </button>
          
          <button
            onClick={resetZoom}
            className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors text-xs px-3"
            title="重置缩放"
            aria-label="重置缩放"
          >
            重置
          </button>
          
          <button
            onClick={handleDownload}
            className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-colors text-xs px-3"
            title="下载图片"
            aria-label="下载图片"
          >
            下载
          </button>
          
          <button
            onClick={onClose}
            className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors text-lg font-bold"
            title="关闭"
            aria-label="关闭模态框"
          >
            ×
          </button>
        </div>
      </div>

      {/* 图片容器 */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* 加载状态 */}
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
            <div className="bg-white bg-opacity-90 rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
              <p className="text-gray-700 text-sm">加载中...</p>
              <p className="text-gray-500 text-xs mt-1">请稍候</p>
            </div>
          </div>
        )}
        
        {/* 错误状态 */}
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
            <div className="bg-white bg-opacity-95 rounded-lg p-6 text-center max-w-md mx-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2" id="image-modal-title">图片加载失败</h3>
              <p className="text-gray-600 text-sm mb-3">无法加载图片，可能的原因：</p>
              <ul className="text-left text-gray-600 text-xs mb-4 space-y-1 bg-gray-50 p-3 rounded">
                <li>• 网络连接问题或超时</li>
                <li>• 图片文件不存在或已被删除</li>
                <li>• 服务器访问权限限制</li>
                <li>• 图片格式不支持或损坏</li>
                {!isValidUrl && <li>• 图片URL格式无效</li>}
              </ul>
              
              {/* URL 调试信息 */}
              <div className="text-xs text-gray-500 mb-4 p-2 bg-gray-100 rounded break-all">
                <strong>URL:</strong> {imageUrl}
              </div>
              
              <div className="flex flex-col space-y-2">
                <button
                  onClick={retryLoadImage}
                  disabled={retryCount >= 3}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  {retryCount >= 3 ? '已达最大重试次数' : `重试加载 (${retryCount}/3)`}
                </button>
                
                <div className="flex space-x-2">
                  <button
                    onClick={openInNewWindow}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    新窗口打开
                  </button>
                  
                  <button
                    onClick={onClose}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    关闭
                  </button>
                </div>
              </div>
              
              {/* 调试信息切换 */}
              {debugInfo && (
                <details className="mt-4 text-left">
                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                    显示调试信息
                  </summary>
                  <pre className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded overflow-auto max-h-32">
                    {debugInfo}
                  </pre>
                </details>
              )}
            </div>
          </div>
        )}
        
        {/* 图片 */}
        {isValidUrl && (
          <img
            src={imageUrl}
            alt={imageName || '清零截图预览'}
            className={`max-w-none transition-all duration-200 ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            } ${imageLoading || imageError ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            style={{
              transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
              maxHeight: zoom === 1 ? '85vh' : 'none',
              maxWidth: zoom === 1 ? '85vw' : 'none',
              imageRendering: 'high-quality'
            }}
            onMouseDown={handleMouseDown}
            onLoad={handleImageLoad}
            onError={handleImageError}
            draggable={false}
            loading="eager"
          />
        )}
      </div>

      {/* 图片信息 */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-lg shadow-lg p-3 max-w-xs">
        <div className="text-sm text-gray-600 break-all">
          {imageName || '清零截图'}
        </div>
        {debugInfo && (
          <div className="text-xs text-gray-500 mt-1">
            调试模式已启用
          </div>
        )}
      </div>
    </div>
  );
};

export default ImagePreviewModal;
