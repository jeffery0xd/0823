import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import { ThemeProvider } from './components/ThemeProvider';
import EnhancedHeader from './components/EnhancedHeader';
import EnhancedSidebar from './components/EnhancedSidebar';
import DataOverview from './components/DataOverview';
import ModernDataOverview from './components/ModernDataOverview';
import DailyStats from './components/DailyStats';
import ROIRanking from './components/ROIRanking';
import Leaderboard from './components/Leaderboard';
import DailySummary from './components/DailySummary';
import DataExport from './components/DataExport';
import AdvertisingDataInput from './components/AdvertisingDataInput';
import RechargeInput from './components/RechargeInput';
import RechargeManager from './components/RechargeManager';
import DailyOrders from './components/DailyOrders';
import DailyContest from './components/DailyContest';
import AnonymousChat from './components/AnonymousChat';
import ProductImageDownloader from './components/ProductImageDownloader';
import AccountReset from './components/AccountReset';
import AccountManagement from './components/AccountManagement';
import CommissionSystem from './components/CommissionSystem';
import CommissionLeaderboard from './components/CommissionLeaderboard';

import ModernDashboard from './components/ModernDashboard';

import AdDataEntry from './components/AdDataEntry';
import Dashboard from './components/Dashboard';
import UnifiedDashboard from './components/UnifiedDashboard';
import RewrittenDashboard from './components/RewrittenDashboard';
import TestData from './components/TestData';
// import ModernAccountRequests from './components/ModernAccountRequests';
import NotificationBanner from './components/NotificationBanner';
import WebsiteChecker from './components/WebsiteChecker';

// 添加错误边界和安全组件
import ErrorBoundary from './components/ErrorBoundary';
import SafeComponent from './components/SafeComponent';
import SimpleDashboard from './components/SimpleDashboard';
import FallbackDashboard from './components/FallbackDashboard';


function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Listen for navigation events from dashboard and other components
  useEffect(() => {
    const handleNavigation = (event) => {
      setActiveTab('account-requests');
    };

    const handleModuleNavigation = (event) => {
      const targetModule = event.detail;
      if (targetModule) {
        setActiveTab(targetModule);
      }
    };

    window.addEventListener('navigateToAccountRequests', handleNavigation);
    window.addEventListener('navigateToModule', handleModuleNavigation);
    return () => {
      window.removeEventListener('navigateToAccountRequests', handleNavigation);
      window.removeEventListener('navigateToModule', handleModuleNavigation);
    };
  }, []);

  // 检查登录状态
  useEffect(() => {
    const authStatus = localStorage.getItem('websiteAuth');
    if (authStatus === 'authenticated') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (status) => {
    setIsAuthenticated(status);
  };

  const handleLogout = () => {
    localStorage.removeItem('websiteAuth');
    setIsAuthenticated(false);
    setActiveTab('overview');
  };

  const renderContent = () => {
    try {
      switch (activeTab) {
        case 'overview':
          return (
            <SafeComponent 
              componentName="数据概览" 
              fallbackMessage="数据概览加载失败，正在使用简化版本"
              customFallback={
                <SafeComponent 
                  componentName="简化数据概览" 
                  fallbackMessage="正在加载基础版本仪表板"
                  customFallback={<FallbackDashboard />}
                >
                  <SimpleDashboard />
                </SafeComponent>
              }
            >
              <RewrittenDashboard />
            </SafeComponent>
          );
        case 'input':
          return (
            <SafeComponent componentName="数据录入" fallbackMessage="数据录入模块加载失败">
              <ModernDashboard />
            </SafeComponent>
          );
        case 'recharge-input':
          return (
            <SafeComponent componentName="充值录入" fallbackMessage="充值录入模块加载失败">
              <RechargeInput />
            </SafeComponent>
          );
        case 'daily':
          return (
            <SafeComponent componentName="每日统计" fallbackMessage="每日统计模块加载失败">
              <DailyStats />
            </SafeComponent>
          );
        case 'roi-ranking':
          return (
            <SafeComponent componentName="ROI排名" fallbackMessage="ROI排名模块加载失败">
              <ROIRanking />
            </SafeComponent>
          );
        case 'leaderboard':
          return (
            <SafeComponent componentName="排行榜" fallbackMessage="排行榜模块加载失败">
              <Leaderboard />
            </SafeComponent>
          );
        case 'export':
          return (
            <SafeComponent componentName="数据导出" fallbackMessage="数据导出模块加载失败">
              <DataExport />
            </SafeComponent>
          );
        case 'account-management-3d':
          return (
            <SafeComponent componentName="账户管理" fallbackMessage="账户管理模块加载失败">
              <AccountManagement />
            </SafeComponent>
          );
        case 'daily-orders':
          return (
            <SafeComponent componentName="每日订单" fallbackMessage="每日订单模块加载失败">
              <DailyOrders />
            </SafeComponent>
          );
        case 'product-downloader':
          return (
            <SafeComponent componentName="产品下载器" fallbackMessage="产品下载器模块加载失败">
              <ProductImageDownloader />
            </SafeComponent>
          );
        case 'product-image':
          return (
            <SafeComponent componentName="产品图片" fallbackMessage="产品图片模块加载失败">
              <ProductImageDownloader />
            </SafeComponent>
          );
        case 'account-reset':
          return (
            <SafeComponent componentName="账户重置" fallbackMessage="账户重置模块加载失败">
              <AccountReset />
            </SafeComponent>
          );
        case 'recharge':
          return (
            <SafeComponent componentName="充值管理" fallbackMessage="充值管理模块加载失败">
              <RechargeManager />
            </SafeComponent>
          );
        case 'ad-data':
          return (
            <SafeComponent componentName="广告数据" fallbackMessage="广告数据模块加载失败">
              <AdDataEntry />
            </SafeComponent>
          );
        case 'test-data':
          return (
            <SafeComponent componentName="测试数据" fallbackMessage="测试数据模块加载失败">
              <TestData />
            </SafeComponent>
          );
        case 'commission-system':
          return (
            <SafeComponent componentName="提成系统" fallbackMessage="提成系统模块加载失败">
              <CommissionSystem />
            </SafeComponent>
          );
        case 'commission-leaderboard':
          return (
            <SafeComponent componentName="提成排行榜" fallbackMessage="提成排行榜模块加载失败">
              <CommissionLeaderboard />
            </SafeComponent>
          );
        case 'website-checker':
          return (
            <SafeComponent componentName="网站检查" fallbackMessage="网站检查模块加载失败">
              <WebsiteChecker />
            </SafeComponent>
          );
        default:
          return (
            <SafeComponent 
              componentName="数据概览" 
              fallbackMessage="数据概览加载失败，正在使用简化版本"
              customFallback={
                <SafeComponent 
                  componentName="简化数据概览" 
                  fallbackMessage="正在加载基础版本仪表板"
                  customFallback={<FallbackDashboard />}
                >
                  <SimpleDashboard />
                </SafeComponent>
              }
            >
              <RewrittenDashboard />
            </SafeComponent>
          );
      }
    } catch (error) {
      console.error('渲染内容时发生错误:', error);
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-center">
            <div className="text-4xl mb-2">⚠️</div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">页面渲染错误</h3>
            <p className="text-red-600 text-sm mb-4">抱歉，页面无法正常显示，请刷新重试</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }
  };

  // 如果未登录，显示登录页面
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <ErrorBoundary componentName="主应用">
      <ThemeProvider>
        <div className="min-h-screen bg-gray-50 transition-colors duration-200">
          <SafeComponent componentName="通知横幅" fallbackMessage="通知横幅加载失败">
            <NotificationBanner />
          </SafeComponent>
          
          <SafeComponent componentName="页面头部" fallbackMessage="页面头部加载失败">
            <EnhancedHeader 
              onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
              onLogout={handleLogout}
              isAuthenticated={isAuthenticated}
            />
          </SafeComponent>
          
          <div className="flex">
            <SafeComponent componentName="侧边栏" fallbackMessage="侧边栏加载失败">
              <EnhancedSidebar 
                activeTab={activeTab} 
                setActiveTab={setActiveTab}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
              />
            </SafeComponent>
            
            <main className="flex-1 lg:ml-64 min-h-screen transition-all duration-200 ease-in-out">
              <div className="p-6">
                <div className="max-w-7xl mx-auto">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <ErrorBoundary componentName="页面内容">
                      {renderContent()}
                    </ErrorBoundary>
                  </div>
                </div>
              </div>
            </main>
          </div>

        <style jsx global>{`
          * {
            scrollbar-width: thin;
            scrollbar-color: #e5e7eb #f9fafb;
          }
          
          *::-webkit-scrollbar {
            width: 6px;
          }
          
          *::-webkit-scrollbar-track {
            background: #f9fafb;
          }
          
          *::-webkit-scrollbar-thumb {
            background-color: #e5e7eb;
            border-radius: 3px;
          }
          
          *::-webkit-scrollbar-thumb:hover {
            background-color: #d1d5db;
          }
          
          .material-shadow {
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
          }
          
          .material-shadow-md {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }
          
          .material-shadow-lg {
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          }
          
          .hover-lift {
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .hover-lift:hover {
            transform: translateY(-1px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          }
          
          .material-ripple {
            position: relative;
            overflow: hidden;
          }
          
          .material-ripple:before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: translate(-50%, -50%);
            transition: width 0.3s, height 0.3s;
          }
          
          .material-ripple:active:before {
            width: 300px;
            height: 300px;
          }
          
          /* 排行榜专用动效 */
          .leaderboard-entrance {
            animation: slideInFromBottom 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          
          .leaderboard-glow {
            animation: gentleGlow 3s ease-in-out infinite alternate;
          }
          
          .medal-bounce {
            animation: medalBounce 2s ease-in-out infinite;
          }
          
          .rank-pulse {
            animation: rankPulse 2s ease-in-out infinite;
          }
          
          .fade-in-up {
            animation: fadeInUp 0.6s ease-out;
          }
          
          @keyframes slideInFromBottom {
            from {
              transform: translateY(100px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          
          @keyframes gentleGlow {
            from {
              box-shadow: 0 0 20px rgba(168, 85, 247, 0.3);
            }
            to {
              box-shadow: 0 0 40px rgba(168, 85, 247, 0.6);
            }
          }
          
          @keyframes medalBounce {
            0%, 100% {
              transform: translateY(0) scale(1);
            }
            50% {
              transform: translateY(-10px) scale(1.1);
            }
          }
          
          @keyframes rankPulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.05);
            }
          }
          
          @keyframes fadeInUp {
            from {
              transform: translateY(30px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          
          /* 响应式排行榜样式 */
          @media (max-width: 768px) {
            .leaderboard-grid {
              grid-template-columns: 1fr;
            }
          }
          
          @media (min-width: 769px) and (max-width: 1024px) {
            .leaderboard-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          
          @media (min-width: 1025px) {
            .leaderboard-grid {
              grid-template-columns: repeat(3, 1fr);
            }
          }
        `}</style>
      </div>
    </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;