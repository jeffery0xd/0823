import React, { useState, useEffect } from 'react';
import { useTheme } from './ThemeProvider';
import { adService, rechargeService, dailyOrderService } from '../data/supabaseService';
import { accountRequestsService } from '../data/accountRequestsService';

const ModernDataOverview = () => {
  const { isDark } = useTheme();
  const [data, setData] = useState({
    totalAdSpend: 0,
    totalCreditCard: 0,
    totalPaymentInfo: 0,
    totalROI: 0,
    dailyOrderAmount: 0,
    todayData: { adSpend: 0, creditCard: 0, paymentInfo: 0, roi: 0 },
    dailyRankings: []
  });
  const [accountRequests, setAccountRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [exchangeRate, setExchangeRate] = useState(20); // 默认汇率

  useEffect(() => {
    loadDashboardData();
    fetchExchangeRate();
    loadAccountRequests();
  }, [selectedPeriod]);

  const handleProcessRequest = (requestId) => {
    // Navigate to account requests page with the specific request
    const event = new CustomEvent('navigateToAccountRequests', { 
      detail: { requestId } 
    });
    window.dispatchEvent(event);
  };

  // 加载账户申请数据
  const loadAccountRequests = async () => {
    try {
      const requests = await accountRequestsService.getPendingRequests();
      // 只取最近的3个未处理申请
      setAccountRequests(requests.slice(0, 3));
    } catch (error) {
      console.error('加载账户申请失败:', error);
      setAccountRequests([]);
    }
  };

  // 获取实时汇率
  const fetchExchangeRate = async () => {
    try {
      // 使用免费的汇率API获取MXN到USD的实时汇率
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      const mxnRate = data.rates.MXN;
      setExchangeRate(mxnRate);
    } catch (error) {
      console.warn('获取汇率失败，使用默认汇率20:', error);
      setExchangeRate(20);
    }
  };

  const filterDataByPeriod = (data, period) => {
    const now = new Date();
    const filterDate = new Date();
    
    switch (period) {
      case '1d':
        // 今日数据
        filterDate.setHours(0, 0, 0, 0);
        return data.filter(item => {
          const itemDate = new Date(item.date || item.created_at);
          return itemDate >= filterDate;
        });
      case '7d':
        // 7天数据
        filterDate.setDate(now.getDate() - 7);
        return data.filter(item => {
          const itemDate = new Date(item.date || item.created_at);
          return itemDate >= filterDate;
        });
      case '30d':
        // 30天数据
        filterDate.setDate(now.getDate() - 30);
        return data.filter(item => {
          const itemDate = new Date(item.date || item.created_at);
          return itemDate >= filterDate;
        });
      case '90d':
        // 90天数据
        filterDate.setDate(now.getDate() - 90);
        return data.filter(item => {
          const itemDate = new Date(item.date || item.created_at);
          return itemDate >= filterDate;
        });
      default:
        return data;
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [advertisingData, rechargeData, dailyOrderData] = await Promise.all([
        adService.getAdData(),
        rechargeService.getRechargeRecords(),
        dailyOrderService.getDailyOrders()
      ]);

      // 根据选择的时间周期过滤数据
      const filteredData = filterDataByPeriod(advertisingData, selectedPeriod);
      const filteredDailyOrderData = filterDataByPeriod(dailyOrderData, selectedPeriod);

      // 计算当前周期数据
      const totalAdSpend = filteredData.reduce((sum, item) => sum + (item.ad_spend || 0), 0);
      const totalCreditCardMX = filteredData.reduce((sum, item) => sum + (item.credit_card_amount || 0), 0);
      const totalPaymentInfo = filteredData.reduce((sum, item) => sum + (item.payment_info_count || 0), 0);
      
      // 使用实时汇率进行换算
      const totalCreditCardUSD = totalCreditCardMX / exchangeRate;
      const totalROI = totalAdSpend > 0 ? parseFloat((totalCreditCardUSD / totalAdSpend).toFixed(2)) : 0;

      // 计算当前周期的上单金额
      const dailyOrderAmount = filteredDailyOrderData.reduce((sum, item) => 
        sum + (item.new_card_amount || 0) + (item.old_card_amount || 0), 0
      );

      // 计算今日数据（始终显示今日数据作为对比）
      const today = new Date().toISOString().split('T')[0];
      const todayItems = advertisingData.filter(item => 
        item.date && item.date.startsWith(today)
      );
      const todayAdSpend = todayItems.reduce((sum, item) => sum + (item.ad_spend || 0), 0);
      const todayCreditCardMX = todayItems.reduce((sum, item) => sum + (item.credit_card_amount || 0), 0);
      const todayPaymentInfo = todayItems.reduce((sum, item) => sum + (item.payment_info_count || 0), 0);
      
      const todayCreditCardUSD = todayCreditCardMX / exchangeRate;
      const todayROI = todayAdSpend > 0 ? parseFloat((todayCreditCardUSD / todayAdSpend).toFixed(2)) : 0;

      // 生成每日龙虎榜数据 (只显示今日数据，按ROI排序)
      const dailyRankings = todayItems
        .filter(item => item.ad_spend > 0) // 只包含有广告花费的数据
        .map(item => ({
          id: item.id,
          name: item.staff || '未知账户',
          revenue: item.credit_card_amount || 0,
          spend: item.ad_spend || 0,
          roi: item.ad_spend > 0 ? parseFloat(((item.credit_card_amount / exchangeRate) / item.ad_spend).toFixed(2)) : 0
        }))
        .sort((a, b) => b.roi - a.roi); // 按ROI降序排列

      setData({
        totalAdSpend,
        totalCreditCard: totalCreditCardMX,
        totalCreditCardUSD,
        totalPaymentInfo,
        totalROI,
        dailyOrderAmount,
        todayData: { 
          adSpend: todayAdSpend, 
          creditCard: todayCreditCardMX,
          creditCardUSD: todayCreditCardUSD,
          paymentInfo: todayPaymentInfo, 
          roi: todayROI 
        },
        dailyRankings
      });
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (timeString) => {
    const date = new Date(timeString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (hours > 24) return `${Math.floor(hours / 24)}天前`;
    if (hours > 0) return `${hours}小时前`;
    if (minutes > 0) return `${minutes}分钟前`;
    return '刚刚';
  };

  const getPeriodLabel = (period) => {
    switch (period) {
      case '1d': return '今日';
      case '7d': return '7天';
      case '30d': return '30天';
      case '90d': return '90天';
      default: return '当期';
    }
  };

  const StatCard = ({ title, value, change, icon, gradient, prefix = '', subValue }) => (
    <div className="relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg bg-white border border-gray-200 shadow-sm">
      {/* 背景装饰 */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-5 blur-2xl bg-gradient-to-br ${gradient}`}></div>
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg`}>
            <span className="text-2xl">{icon}</span>
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
          </div>
          {change && (
            <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${
              change > 0 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}>
              <span>{change > 0 ? '↗' : '↘'}</span>
              <span>{Math.abs(change).toFixed(1)}%</span>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-800">
            {title}
          </h3>
          <div className="text-3xl font-bold text-gray-900">
            {prefix !== '' ? `${prefix}${typeof value === 'number' ? value.toLocaleString() : value}` : value}
          </div>
          {subValue && (
            <div className="text-sm text-gray-700 mt-1">
              {subValue}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const ChartCard = ({ title, children }) => (
    <div className="rounded-2xl p-6 transition-all duration-300 bg-white border border-gray-200 shadow-sm">
      <h3 className="text-lg font-bold mb-6 text-gray-900">
        {title}
      </h3>
      {children}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative">
          <div className={`w-20 h-20 rounded-full border-4 border-t-transparent animate-spin ${
            isDark ? 'border-gray-600' : 'border-gray-300'
          }`}></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">⚡</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* 页面标题 */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
          数据概览
        </h1>
        <p className="text-lg text-gray-700">
          实时监控您的业务表现
        </p>
      </div>

      {/* 时间选择器 */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: '1d', label: '今日' },
          { key: '7d', label: '7天' },
          { key: '30d', label: '30天' },
          { key: '90d', label: '90天' }
        ].map(period => (
          <button
            key={period.key}
            onClick={() => setSelectedPeriod(period.key)}
            className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
              selectedPeriod === period.key
                ? isDark 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                  : 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                : isDark
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="广告花费"
          value={data.totalAdSpend.toFixed(2)}
          change={-3.2}
          icon="💸"
          gradient="from-red-500 to-pink-500"
          prefix="$"
        />
        <StatCard
          title="信用卡收款"
          value={`MX$${data.totalCreditCard?.toLocaleString() || 0}`}
          subValue={`≈ $${data.totalCreditCardUSD?.toLocaleString() || 0}`}
          change={12.5}
          icon="💰"
          gradient="from-green-500 to-emerald-500"
          prefix=""
        />
        <StatCard
          title="支付信息数量"
          value={data.totalPaymentInfo}
          change={8.7}
          icon="📋"
          gradient="from-blue-500 to-cyan-500"
          prefix=""
        />
        <StatCard
          title="ROI"
          value={data.totalROI.toFixed(2)}
          change={5.2}
          icon="🎯"
          gradient="from-purple-500 to-indigo-500"
          prefix=""
        />
      </div>

      {/* 账户申请提醒 */}
      {accountRequests.length > 0 && (
        <div className={`rounded-3xl p-6 transition-all duration-300 ${
          isDark 
            ? 'bg-orange-900/20 backdrop-blur-xl border border-orange-700/50' 
            : 'bg-orange-50/80 backdrop-blur-xl border border-orange-200/50'
        }`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
              <span className="text-white text-sm">📋</span>
            </div>
            <div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                待处理账户申请
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                共 {accountRequests.length} 个申请待处理
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            {accountRequests.map((request, index) => (
              <div key={request.id || index} className={`flex items-center justify-between p-3 rounded-xl ${
                isDark ? 'bg-gray-800/50' : 'bg-white/50'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    (request.type || request.request_type) === 'facebook' ? 'bg-blue-500 text-white' :
                    (request.type || request.request_type) === 'tiktok' ? 'bg-black text-white' :
                    (request.type || request.request_type) === 'google' ? 'bg-red-500 text-white' :
                    (request.type || request.request_type) === 'advertising' ? 'bg-green-500 text-white' :
                    (request.type || request.request_type) === 'page' ? 'bg-purple-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {(request.type || request.request_type) === 'facebook' ? 'F' :
                     (request.type || request.request_type) === 'tiktok' ? 'T' :
                     (request.type || request.request_type) === 'google' ? 'G' :
                     (request.type || request.request_type) === 'advertising' ? 'A' :
                     (request.type || request.request_type) === 'page' ? 'P' : '?'}
                  </div>
                  <div>
                    <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {request.requester || request.user_name || '未知用户'}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {(request.type || request.request_type)?.toUpperCase() || '未知类型'} 账户申请
                    </div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end space-y-2">
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {new Date(request.created_at).toLocaleDateString('zh-CN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="text-xs text-orange-500 font-medium">
                    {request.urgency === 'high' ? '🔥 紧急' : 
                     request.urgency === 'normal' ? '⏰ 普通' : '📝 一般'}
                  </div>
                  <button
                    onClick={() => handleProcessRequest(request.id)}
                    className="px-3 py-1 text-xs font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    一键处理
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 当期表现 */}
        <ChartCard title={`${getPeriodLabel(selectedPeriod)}表现`}>
          <div className="mb-4 text-xs text-gray-500 dark:text-gray-400">
            实时汇率: 1 USD = {exchangeRate.toFixed(2)} MXN
          </div>
          <div className="grid grid-cols-1 gap-4">
            {[
              { 
                label: `${getPeriodLabel(selectedPeriod)}花费`, 
                value: `$${data.totalAdSpend.toFixed(2)}`, 
                color: 'text-red-500', 
                bg: 'bg-red-500/10', 
                prefix: '' 
              },
              { 
                label: `${getPeriodLabel(selectedPeriod)}收款`, 
                value: `MX$${data.totalCreditCard?.toLocaleString() || 0}`, 
                subValue: `≈ $${((data.totalCreditCard || 0) / exchangeRate).toFixed(2)}`,
                color: 'text-green-500', 
                bg: 'bg-green-500/10', 
                prefix: '' 
              },
              { 
                label: `${getPeriodLabel(selectedPeriod)}支付信息`, 
                value: data.totalPaymentInfo, 
                color: 'text-blue-500', 
                bg: 'bg-blue-500/10', 
                prefix: '' 
              },
              { 
                label: `${getPeriodLabel(selectedPeriod)}ROI`, 
                value: data.totalROI.toFixed(2), 
                color: 'text-purple-500', 
                bg: 'bg-purple-500/10', 
                prefix: '' 
              },
              { 
                label: `${getPeriodLabel(selectedPeriod)}上单金额`, 
                value: `MX$${data.dailyOrderAmount?.toLocaleString() || 0}`, 
                subValue: `≈ $${((data.dailyOrderAmount || 0) / exchangeRate).toFixed(2)}`,
                color: 'text-orange-500', 
                bg: 'bg-orange-500/10', 
                prefix: '' 
              },
              { 
                label: '单次支付信息成本', 
                value: data.totalPaymentInfo > 0 ? `$${(data.totalAdSpend / data.totalPaymentInfo).toFixed(2)}` : '$0.00', 
                color: 'text-purple-600', 
                bg: 'bg-purple-600/10', 
                prefix: '' 
              }
            ].map((item, index) => (
              <div key={index} className={`p-3 rounded-xl ${item.bg}`}>
                <div className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {item.label}
                </div>
                <div className={`text-xl font-bold ${item.color}`}>
                  {item.prefix === '' 
                    ? item.value 
                    : typeof item.value === 'number' 
                      ? formatCurrency(item.value) 
                      : item.value
                  }
                </div>
                {item.subValue && (
                  <div className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    {item.subValue}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ChartCard>

        {/* 每日龙虎榜 */}
        <ChartCard title="每日龙虎榜 🏆">
          <div className="space-y-3">
            {data.dailyRankings?.map((item, index) => (
              <div key={item.id || index} className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
                index === data.dailyRankings.length - 1 
                  ? 'bg-red-50 border border-red-200' 
                  : 'bg-white border border-gray-200 shadow-sm'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                    index === 0 ? 'bg-yellow-500' : 
                    index === 1 ? 'bg-gray-400' : 
                    index === 2 ? 'bg-amber-600' : 
                    index === data.dailyRankings.length - 1 ? 'bg-red-500' : 'bg-gray-500'
                  }`}>
                    {index === data.dailyRankings.length - 1 ? '🤡' : index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {item.name}
                      {index === data.dailyRankings.length - 1 && (
                        <span className="ml-2 text-red-500 font-bold">瓜皮 🤡</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-700">
                      ROI: {item.roi?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${
                    item.roi > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    MX${item.revenue?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-gray-700">
                    花费: ${item.spend?.toFixed(2) || '0.00'}
                  </div>
                </div>
              </div>
            ))}
            
            {(!data.dailyRankings || data.dailyRankings.length === 0) && (
              <div className="text-center py-8 text-gray-700">
                <div className="text-4xl mb-2">📊</div>
                <div>暂无排行数据</div>
              </div>
            )}
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default ModernDataOverview;