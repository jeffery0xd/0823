import React from 'react';

const MetaSidebar = ({ activeTab, setActiveTab, isOpen, onClose }) => {
  const menuItems = [
    { id: 'overview', name: '数据概览', icon: '📊', desc: 'Dashboard' },
    { id: 'input', name: '数据录入', icon: '📝', desc: 'Data Input' },
    { id: 'daily', name: '每日统计', icon: '📅', desc: 'Daily Stats' },
    { id: 'roi-ranking', name: '龙虎榜', icon: '🏆', desc: 'ROI Ranking' },
    { id: 'export', name: '数据导出', icon: '📤', desc: 'Export' },
    { id: 'recharge', name: '充值管理', icon: '💰', desc: 'Recharge' },
    { id: 'daily-orders', name: '上单金额', icon: '💵', desc: 'Orders' },
    { id: 'daily-contest', name: '每日大赛', icon: '🏆', desc: 'Contest' },
    { id: 'anonymous-chat', name: '匿名聊天', icon: '💬', desc: 'Chat' },
    { id: 'product-downloader', name: '产品图片下载', icon: '📦', desc: 'Product Images' },
    { id: 'account-requests', name: '账户申请', icon: '🔐', desc: 'Account Requests' },
    { id: 'website-checker', name: '网站检测', icon: '🔍', desc: 'Website Checker' }
  ];

  return (
    <>
      {/* 移动端遮罩层 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      
      {/* 侧边栏 - 固定定位 */}
      <aside className={`
        apple-sidebar fixed inset-y-0 left-0 z-40 w-72 h-screen shadow-2xl overflow-y-auto
        transform transition-all duration-500 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        pt-16 lg:pt-0
      `}>
        <div className="flex flex-col h-full">
          {/* 侧边栏顶部 */}
          <div className="px-6 py-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">导航</h2>
                <p className="text-sm text-gray-500 mt-1">Navigation</p>
              </div>
              <button
                onClick={onClose}
                className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* 菜单项 */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {menuItems.map((item, index) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose();
                }}
                style={{ animationDelay: `${index * 0.05}s` }}
                className={`
                  apple-fade-in w-full flex items-center space-x-4 px-4 py-3.5 rounded-2xl text-left transition-all duration-300
                  ${activeTab === item.id
                    ? 'bg-blue-500 text-white shadow-lg transform scale-[1.02]'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 apple-hover'
                  }
                `}
              >
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300
                  ${activeTab === item.id 
                    ? 'bg-white bg-opacity-20 text-white' 
                    : 'bg-gray-100 text-gray-600'
                  }
                `}>
                  <span className="text-lg">{item.icon}</span>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-base">{item.name}</div>
                  <div className={`text-xs opacity-75 ${activeTab === item.id ? 'text-blue-100' : 'text-gray-500'}`}>
                    {item.desc}
                  </div>
                </div>
                {activeTab === item.id && (
                  <div className="w-2 h-2 bg-white rounded-full opacity-80"></div>
                )}
              </button>
            ))}
          </nav>

          {/* 底部信息 */}
          <div className="px-6 py-4 border-t border-gray-100">
            <div className="apple-card p-4 text-center">
              <div className="text-sm font-semibold text-gray-900">Analytics Pro</div>
              <div className="text-xs text-gray-500 mt-1">Version 2.0.1</div>
              <div className="flex items-center justify-center space-x-1 mt-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 font-medium">系统正常</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default MetaSidebar;