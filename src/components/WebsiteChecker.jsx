import React, { useState } from 'react';

const WebsiteChecker = () => {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleCheck = async () => {
    if (!domain.trim()) {
      alert('请输入域名');
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      // 清理域名格式
      const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
      
      // 构建检测URL
      const safeBrowsingUrl = `https://transparencyreport.google.com/safe-browsing/search?url=${encodeURIComponent(cleanDomain)}&hl=zh_CN`;
      const dnsCheckerUrl = `https://dnschecker.org/country/mx/#A/${encodeURIComponent(cleanDomain)}`;
      
      setResults({
        domain: cleanDomain,
        safeBrowsingUrl,
        dnsCheckerUrl,
        timestamp: new Date().toLocaleString('zh-CN')
      });
    } catch (error) {
      console.error('检测过程中出错:', error);
      alert('检测过程中出现错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setDomain('');
    setResults(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
        🔍 网站状态检测
      </h2>

      {/* 输入区域 */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 mb-6">
        <h3 className="font-bold text-blue-800 mb-3">域名检测</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="输入域名，例如：www.example.com"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && handleCheck()}
          />
          <div className="flex gap-2">
            <button
              onClick={handleCheck}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading ? '检测中...' : '开始检测'}
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              清空
            </button>
          </div>
        </div>
      </div>

      {/* 功能说明 */}
      <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 mb-6">
        <h3 className="font-bold text-yellow-800 mb-2">功能说明</h3>
        <div className="text-sm text-yellow-700 space-y-1">
          <p>• <strong>Google 安全浏览:</strong> 检测网站是否存在恶意软件、钓鱼等安全风险</p>
          <p>• <strong>DNS 状态检测:</strong> 检测网站在墨西哥地区的DNS解析状态</p>
          <p>• 点击下方链接将在新窗口中打开检测结果页面</p>
        </div>
      </div>

      {/* 检测结果 */}
      {results && (
        <div className="space-y-4">
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <h3 className="font-bold text-green-800 mb-3">
              ✅ 检测链接已生成 - {results.domain}
            </h3>
            <p className="text-sm text-green-600 mb-3">
              检测时间: {results.timestamp}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Google 安全浏览检测 */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                <span className="mr-2">🛡️</span>
                Google 安全浏览检测
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                检测网站是否存在安全风险、恶意软件或钓鱼内容
              </p>
              <a
                href={results.safeBrowsingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <span className="mr-2">🔗</span>
                打开 Google 安全检测
              </a>
            </div>

            {/* DNS 状态检测 */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                <span className="mr-2">🌐</span>
                DNS 状态检测 (墨西哥)
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                检测网站在墨西哥地区的DNS解析状态和可访问性
              </p>
              <a
                href={results.dnsCheckerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <span className="mr-2">🔗</span>
                打开 DNS 检测
              </a>
            </div>
          </div>

          {/* 检测提示 */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h4 className="font-bold text-gray-800 mb-2">💡 检测提示</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• 点击上方链接会在新窗口打开检测页面</p>
              <p>• Google 安全浏览: 绿色表示安全，红色表示存在风险</p>
              <p>• DNS 检测: 显示该域名在不同地区的解析情况</p>
              <p>• 如果检测页面显示异常，可能是网络连接问题或域名本身存在问题</p>
            </div>
          </div>
        </div>
      )}

      {/* 常用检测域名示例 */}
      <div className="mt-6 bg-gray-50 rounded-xl p-4 border border-gray-200">
        <h3 className="font-bold text-gray-800 mb-3">快速测试</h3>
        <div className="flex flex-wrap gap-2">
          {['www.google.com', 'www.facebook.com', 'www.mercadotodas.com'].map((example) => (
            <button
              key={example}
              onClick={() => setDomain(example)}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WebsiteChecker;