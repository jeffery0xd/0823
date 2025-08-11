import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { exchangeService } from './RealTimeExchangeService';
import { supabase } from '../data/supabaseService';

const RewrittenDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    todayStats: {
      adSpend: 0,           // 今日广告花费 (USD)
      creditCardAmount: 0,  // 今日信用卡收款 (MXN)
      creditCardAmountUSD: 0, // 今日信用卡收款 (USD)
      paymentInfoCount: 0,  // 今日支付信息数量
      creditCardOrders: 0,  // 今日信用卡订单数
      costPerPaymentInfo: 0, // 单次支付信息成本
      activeStaff: 0        // 活跃员工数
    },
    last7DaysStats: {
      totalAdSpend: 0,
      totalCreditCardAmount: 0,
      totalCreditCardAmountUSD: 0,
      totalPaymentInfoCount: 0,
      totalCreditCardOrders: 0,
      avgCostPerPaymentInfo: 0
    },
    staffPerformance: [],
    dailyTrend: [],
    exchangeRate: 20.0,
    pendingAccountRequests: 0, // 待处理账户申请数量
    pendingRequestsDetail: [], // 待处理申请详情
    loading: true,
    error: null,
    lastUpdate: ''
  });

  useEffect(() => {
    loadDashboardData();
    // 每5分钟更新一次数据
    const interval = setInterval(loadDashboardData, 300000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setDashboardData(prev => ({ ...prev, loading: true, error: null }));

      // 获取最新汇率
      const currentRate = await exchangeService.getExchangeRate('USD', 'MXN');
      
      // 先获取所有账户申请来调试
      console.log('=== 开始调试账户申请 ===');
      const { data: allRequests, error: allError } = await supabase
        .from('app_e87b41cfe355428b8146f8bae8184e10_account_requests')
        .select('*');
      
      console.log('所有申请数据:', allRequests);
      console.log('所有申请错误:', allError);
      console.log('数据长度:', allRequests?.length);
      
      if (allRequests && allRequests.length > 0) {
        console.log('所有状态值:', allRequests.map(r => r.status));
        console.log('第一条记录完整信息:', allRequests[0]);
        console.log('字段列表:', Object.keys(allRequests[0]));
      }
      
      // 获取待处理账户申请数量和详情 - 使用英文状态值
      const accountRequests = allRequests?.filter(r => ['pending'].includes(r.status)) || [];
      const requestError = allError;
      
      if (requestError) {
        console.error('获取账户申请数据错误:', requestError);
      }
      
      console.log('账户申请原始数据:', accountRequests);
      console.log('账户申请错误:', requestError);
      
      const pendingRequestsCount = accountRequests?.length || 0;
      const pendingRequestsDetail = accountRequests || [];
      
      console.log('待处理请求数量:', pendingRequestsCount);
      console.log('待处理请求详情:', pendingRequestsDetail);
      
      // 强制显示待处理申请详情
      if (pendingRequestsDetail && pendingRequestsDetail.length > 0) {
        console.log('第一个申请详情:', pendingRequestsDetail[0]);
        console.log('申请字段:', Object.keys(pendingRequestsDetail[0]));
      }
      
      // 获取广告数据 - 使用正确的表名
      const { data: adData, error } = await supabase
        .from('app_e87b41cfe355428b8146f8bae8184e10_ad_data_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('获取数据错误:', error);
        throw error;
      }

      console.log('获取到数据:', adData?.length || 0, '条');

      if (!adData || adData.length === 0) {
        setDashboardData(prev => ({
          ...prev,
          loading: false,
          error: '暂无数据，请先录入一些数据',
          exchangeRate: currentRate,
          pendingAccountRequests: pendingRequestsCount,
          pendingRequestsDetail: pendingRequestsDetail
        }));
        return;
      }

      // 计算今日统计
      const today = new Date().toISOString().split('T')[0];
      const todayData = adData.filter(item => item.date === today);

      console.log('今日数据:', todayData.length, '条');

      let todayStats = {
        adSpend: 0,
        creditCardAmount: 0,
        creditCardAmountUSD: 0,
        paymentInfoCount: 0,
        creditCardOrders: 0,
        costPerPaymentInfo: 0,
        activeStaff: new Set(todayData.map(item => item.staff)).size
      };

      todayData.forEach(item => {
        todayStats.adSpend += parseFloat(item.ad_spend || 0);
        todayStats.creditCardAmount += parseFloat(item.credit_card_amount || 0);
        todayStats.paymentInfoCount += parseInt(item.payment_info_count || 0);
        todayStats.creditCardOrders += parseInt(item.credit_card_orders || 0);
      });

      // 信用卡收款转换为USD
      todayStats.creditCardAmountUSD = await exchangeService.mxnToUsd(todayStats.creditCardAmount);
      
      // 计算单次支付信息成本
      todayStats.costPerPaymentInfo = todayStats.paymentInfoCount > 0 
        ? todayStats.adSpend / todayStats.paymentInfoCount 
        : 0;

      // 计算7天统计
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
      
      const last7DaysData = adData.filter(item => item.date >= sevenDaysAgoStr);

      let last7DaysStats = {
        totalAdSpend: 0,
        totalCreditCardAmount: 0,
        totalCreditCardAmountUSD: 0,
        totalPaymentInfoCount: 0,
        totalCreditCardOrders: 0,
        avgCostPerPaymentInfo: 0
      };

      last7DaysData.forEach(item => {
        last7DaysStats.totalAdSpend += parseFloat(item.ad_spend || 0);
        last7DaysStats.totalCreditCardAmount += parseFloat(item.credit_card_amount || 0);
        last7DaysStats.totalPaymentInfoCount += parseInt(item.payment_info_count || 0);
        last7DaysStats.totalCreditCardOrders += parseInt(item.credit_card_orders || 0);
      });

      // 7天信用卡收款转换为USD
      last7DaysStats.totalCreditCardAmountUSD = await exchangeService.mxnToUsd(last7DaysStats.totalCreditCardAmount);
      
      // 计算7天平均单次支付信息成本
      last7DaysStats.avgCostPerPaymentInfo = last7DaysStats.totalPaymentInfoCount > 0 
        ? last7DaysStats.totalAdSpend / last7DaysStats.totalPaymentInfoCount 
        : 0;

      // 计算员工表现 - 改为使用今日数据而不是7天数据
      const staffPerformanceMap = {};
      todayData.forEach(item => {
        const staff = item.staff;
        if (!staffPerformanceMap[staff]) {
          staffPerformanceMap[staff] = {
            name: staff,
            adSpend: 0,
            creditCardAmount: 0,
            creditCardAmountUSD: 0,
            paymentInfoCount: 0,
            creditCardOrders: 0,
            costPerPaymentInfo: 0,
            entries: 0
          };
        }

        const perf = staffPerformanceMap[staff];
        perf.adSpend += parseFloat(item.ad_spend || 0);
        perf.creditCardAmount += parseFloat(item.credit_card_amount || 0);
        perf.paymentInfoCount += parseInt(item.payment_info_count || 0);
        perf.creditCardOrders += parseInt(item.credit_card_orders || 0);
        perf.entries += 1;
      });

      // 转换员工表现的MXN到USD并计算成本
      const staffPerformance = [];
      for (const staff of Object.values(staffPerformanceMap)) {
        staff.creditCardAmountUSD = await exchangeService.mxnToUsd(staff.creditCardAmount);
        staff.costPerPaymentInfo = staff.paymentInfoCount > 0 
          ? staff.adSpend / staff.paymentInfoCount 
          : 0;
        staffPerformance.push(staff);
      }

      // 计算ROI并按ROI排序 (ROI越高越好)
      staffPerformance.forEach(staff => {
        staff.roi = staff.adSpend > 0 ? (staff.creditCardAmountUSD / staff.adSpend) : 0;
      });
      staffPerformance.sort((a, b) => b.roi - a.roi);

      // 计算每日趋势
      const dailyTrend = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayData = adData.filter(item => item.date === dateStr);
        
        let dayStats = {
          date: dateStr,
          adSpend: 0,
          creditCardAmount: 0,
          creditCardAmountUSD: 0,
          paymentInfoCount: 0,
          creditCardOrders: 0,
          costPerPaymentInfo: 0,
          entries: dayData.length
        };

        dayData.forEach(item => {
          dayStats.adSpend += parseFloat(item.ad_spend || 0);
          dayStats.creditCardAmount += parseFloat(item.credit_card_amount || 0);
          dayStats.paymentInfoCount += parseInt(item.payment_info_count || 0);
          dayStats.creditCardOrders += parseInt(item.credit_card_orders || 0);
        });

        dayStats.creditCardAmountUSD = await exchangeService.mxnToUsd(dayStats.creditCardAmount);
        dayStats.costPerPaymentInfo = dayStats.paymentInfoCount > 0 
          ? dayStats.adSpend / dayStats.paymentInfoCount 
          : 0;
        dayStats.roi = dayStats.adSpend > 0 
          ? (dayStats.creditCardAmountUSD / dayStats.adSpend) 
          : 0;

        dailyTrend.push(dayStats);
      }

      setDashboardData({
        todayStats,
        last7DaysStats,
        staffPerformance: staffPerformance.slice(0, 5), // 取前5名
        dailyTrend,
        exchangeRate: currentRate,
        pendingAccountRequests: pendingRequestsCount,
        pendingRequestsDetail: pendingRequestsDetail,
        loading: false,
        error: null,
        lastUpdate: new Date().toLocaleTimeString('zh-CN')
      });

    } catch (error) {
      console.error('加载仪表板数据失败:', error);
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: error.message || '数据加载失败，请刷新重试'
      }));
    }
  };

  const formatUSD = (amount) => exchangeService.formatUSD(amount);
  const formatMXN = (amount) => exchangeService.formatMXN(amount);

  if (dashboardData.loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">加载数据中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (dashboardData.error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-red-400">⚠️</div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">加载错误</h3>
              <p className="mt-1 text-sm text-red-700">{dashboardData.error}</p>
              <button
                onClick={loadDashboardData}
                className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
              >
                重新加载
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { todayStats, last7DaysStats, staffPerformance, dailyTrend, exchangeRate, pendingAccountRequests, pendingRequestsDetail, lastUpdate } = dashboardData;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* 汇率信息 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-blue-600">💱</span>
            <span className="font-medium text-blue-800 text-sm md:text-base">
              实时汇率: 1 USD = {exchangeRate.toFixed(2)} MXN
            </span>
          </div>
          <div className="text-xs md:text-sm text-blue-600">
            最后更新: {lastUpdate}
          </div>
        </div>
      </div>

      {/* 今日表现 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📈 今日表现
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            <div className="bg-red-50 rounded-lg p-3 md:p-4">
              <div className="text-xl md:text-2xl mb-1 md:mb-2">💸</div>
              <div className="text-lg md:text-2xl font-bold text-red-600">
                {formatUSD(todayStats.adSpend)}
              </div>
              <div className="text-xs md:text-sm text-gray-600">广告花费</div>
            </div>

            <div className="bg-green-50 rounded-lg p-3 md:p-4">
              <div className="text-xl md:text-2xl mb-1 md:mb-2">💰</div>
              <div className="text-sm md:text-lg font-bold text-green-600">
                {formatMXN(todayStats.creditCardAmount)}
              </div>
              <div className="text-xs md:text-sm text-green-500">
                ≈ {formatUSD(todayStats.creditCardAmountUSD)}
              </div>
              <div className="text-xs md:text-sm text-gray-600">信用卡收款</div>
            </div>

            <div className="bg-blue-50 rounded-lg p-3 md:p-4">
              <div className="text-xl md:text-2xl mb-1 md:mb-2">📊</div>
              <div className="text-lg md:text-2xl font-bold text-blue-600">
                {formatUSD(todayStats.costPerPaymentInfo)}
              </div>
              <div className="text-xs md:text-sm text-gray-600">单次支付信息成本</div>
            </div>

            <div className="bg-purple-50 rounded-lg p-3 md:p-4">
              <div className="text-xl md:text-2xl mb-1 md:mb-2">👥</div>
              <div className="text-lg md:text-2xl font-bold text-purple-600">
                {todayStats.activeStaff}
              </div>
              <div className="text-xs md:text-sm text-gray-600">活跃员工</div>
            </div>
          </div>

          <div className="mt-3 md:mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <div className="bg-orange-50 rounded-lg p-3 md:p-4">
              <div className="flex items-center justify-between">
                <span className="text-orange-600 text-sm md:text-base">支付信息数量</span>
                <span className="font-bold text-orange-800 text-sm md:text-base">{todayStats.paymentInfoCount}</span>
              </div>
            </div>
            <div className="bg-teal-50 rounded-lg p-3 md:p-4">
              <div className="flex items-center justify-between">
                <span className="text-teal-600 text-sm md:text-base">信用卡订单数</span>
                <span className="font-bold text-teal-800 text-sm md:text-base">{todayStats.creditCardOrders}</span>
              </div>
            </div>
            <div className={`rounded-lg p-3 md:p-4 cursor-pointer hover:opacity-80 transition-opacity ${pendingAccountRequests > 0 ? 'bg-red-50 animate-pulse' : 'bg-gray-50'}`}
                 onClick={(e) => {
                   console.log('点击待处理申请，数量:', pendingAccountRequests);
                   e.preventDefault();
                   window.dispatchEvent(new CustomEvent('navigateToModule', { detail: 'account-requests' }));
                 }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-sm md:text-base ${pendingAccountRequests > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {pendingAccountRequests > 0 ? '🚨' : '✅'} 待处理申请
                  </span>
                </div>
                <span className={`font-bold text-sm md:text-base ${pendingAccountRequests > 0 ? 'text-red-800' : 'text-gray-800'}`}>
                  {pendingAccountRequests}
                </span>
              </div>
              {pendingRequestsDetail.length > 0 && (
                <div className="mt-2 space-y-1">
                  {pendingRequestsDetail.slice(0, 2).map((request, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <span className="truncate">{request.user_name || request.applicant_name || '未知账户'}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        request.urgency === 'urgent' ? 'bg-red-200 text-red-800' :
                        request.urgency === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-green-200 text-green-800'
                      }`}>
                        {request.urgency === 'urgent' ? '紧急' : 
                         request.urgency === 'high' ? '高' :
                         request.urgency === 'medium' ? '普通' : '低'}
                      </span>
                    </div>
                  ))}
                  {pendingRequestsDetail.length > 2 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{pendingRequestsDetail.length - 2} 更多...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 7天表现 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 7天表现统计
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xl mb-2">💸</div>
              <div className="text-xl font-bold text-red-600">
                {formatUSD(last7DaysStats.totalAdSpend)}
              </div>
              <div className="text-sm text-gray-600">7天总广告花费</div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-xl mb-2">💰</div>
              <div className="text-lg font-bold text-green-600">
                {formatMXN(last7DaysStats.totalCreditCardAmount)}
              </div>
              <div className="text-sm text-green-500">
                ≈ {formatUSD(last7DaysStats.totalCreditCardAmountUSD)}
              </div>
              <div className="text-sm text-gray-600">7天总收款</div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-xl mb-2">📊</div>
              <div className="text-xl font-bold text-blue-600">
                {formatUSD(last7DaysStats.avgCostPerPaymentInfo)}
              </div>
              <div className="text-sm text-gray-600">7天平均单次成本</div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-orange-600">7天支付信息总数</span>
                <span className="font-bold text-orange-800">{last7DaysStats.totalPaymentInfoCount}</span>
              </div>
            </div>

            <div className="bg-teal-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-teal-600">7天订单总数</span>
                <span className="font-bold text-teal-800">{last7DaysStats.totalCreditCardOrders}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* ROI排行 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🏆 ROI排行 (ROI越高越好)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 md:space-y-3">
              {staffPerformance.length > 0 ? staffPerformance.map((staff, index) => {
                const isLastPlace = index === staffPerformance.length - 1 && staffPerformance.length > 1;
                const getRankTitle = () => {
                  if (index === 0) return '👑 ROI之王';
                  if (index === 1) return '🥇 金牌选手';
                  if (index === 2) return '🥈 银牌选手';
                  if (isLastPlace) return '🤡 小丑';
                  return `第${index + 1}名`;
                };
                
                return (
                  <div 
                    key={staff.name} 
                    className={`flex items-center justify-between p-2 md:p-3 rounded-lg transition-all duration-300 ${
                      isLastPlace 
                        ? 'bg-gradient-to-r from-red-100 to-orange-100 border-2 border-red-300 animate-pulse' 
                        : index === 0 
                        ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-2 border-yellow-400'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-white font-bold text-xs md:text-sm ${
                        index === 0 ? 'bg-yellow-500 animate-bounce' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-orange-400' : 
                        isLastPlace ? 'bg-red-500 animate-bounce' : 'bg-blue-500'
                      }`}>
                        {isLastPlace ? '🤡' : index + 1}
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-1 md:gap-2 text-sm md:text-base">
                          {staff.name}
                          <span className={`px-1 md:px-2 py-0.5 md:py-1 text-xs rounded-full ${
                            isLastPlace 
                              ? 'bg-red-200 text-red-800 animate-pulse' 
                              : index === 0 
                              ? 'bg-yellow-200 text-yellow-800'
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {getRankTitle()}
                          </span>
                        </div>
                        <div className="text-xs md:text-sm text-gray-500">
                          {staff.paymentInfoCount} 个支付信息
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold text-sm md:text-lg ${
                        isLastPlace ? 'text-red-600' : 
                        index === 0 ? 'text-yellow-600' : 'text-blue-600'
                      }`}>
                        {staff.roi.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">ROI</div>
                      <div className="text-xs md:text-sm text-gray-500">
                        {formatMXN(staff.creditCardAmount)}
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-8 text-gray-500">
                  暂无员工数据
                </div>
              )}
            </div>
            
            {/* 小丑特效提示 */}
            {staffPerformance.length > 1 && (
              <div className="mt-4 p-3 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <span className="text-lg animate-bounce">🤡</span>
                  <span className="font-medium">小丑称号自动颁发给ROI最低的员工！</span>
                  <span className="text-lg animate-spin">🎪</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 销售额排行 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💰 销售额排行 (信用卡收款额)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {staffPerformance.length > 0 ? [...staffPerformance].sort((a, b) => b.creditCardAmountUSD - a.creditCardAmountUSD).map((staff, index) => {
                const isLastPlace = index === staffPerformance.length - 1 && staffPerformance.length > 1;
                const getRankTitle = () => {
                  if (index === 0) return '👑 销售之王';
                  if (index === 1) return '🥇 金牌销售';
                  if (index === 2) return '🥈 银牌销售';
                  if (isLastPlace) return '🔨 你跑了个锤子';
                  return `第${index + 1}名`;
                };
                
                return (
                  <div 
                    key={staff.name} 
                    className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 ${
                      isLastPlace 
                        ? 'bg-gradient-to-r from-orange-100 to-red-100 border-2 border-orange-300 animate-pulse' 
                        : index === 0 
                        ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-2 border-yellow-400'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500 animate-bounce' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-orange-400' : 
                        isLastPlace ? 'bg-orange-500 animate-pulse' : 'bg-blue-500'
                      }`}>
                        {isLastPlace ? '🔨' : index + 1}
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {staff.name}
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            isLastPlace 
                              ? 'bg-orange-200 text-orange-800 animate-bounce' 
                              : index === 0 
                              ? 'bg-yellow-200 text-yellow-800'
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {getRankTitle()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {staff.paymentInfoCount} 个支付信息
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold text-lg ${
                        isLastPlace ? 'text-orange-600' : 
                        index === 0 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {formatUSD(staff.creditCardAmountUSD)}
                      </div>
                      <div className="text-xs text-gray-500">销售额</div>
                      <div className="text-sm text-gray-500">
                        {formatMXN(staff.creditCardAmount)}
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-8 text-gray-500">
                  暂无员工数据
                </div>
              )}
            </div>
            
            {/* 锤子特效提示 */}
            {staffPerformance.length > 1 && (
              <div className="mt-4 p-3 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 text-orange-700">
                  <span className="text-lg animate-bounce">🔨</span>
                  <span className="font-medium">"你跑了个锤子"称号自动颁发给销售额最低的员工！</span>
                  <span className="text-lg animate-spin">⚡</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 7天趋势 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📈 7天数据趋势
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">日期</th>
                  <th className="text-right py-2">花费(USD)</th>
                  <th className="text-right py-2">收款(MX$)</th>
                  <th className="text-right py-2">收款(USD)</th>
                  <th className="text-right py-2">支付信息</th>
                  <th className="text-right py-2">ROI</th>
                </tr>
              </thead>
              <tbody>
                {dailyTrend.map((day) => (
                  <tr key={day.date} className="border-b last:border-b-0">
                    <td className="py-2">
                      {new Date(day.date).toLocaleDateString('zh-CN', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="text-right py-2 text-red-600">
                      {formatUSD(day.adSpend)}
                    </td>
                    <td className="text-right py-2 text-green-600">
                      {formatMXN(day.creditCardAmount)}
                    </td>
                    <td className="text-right py-2 text-green-500">
                      {formatUSD(day.creditCardAmountUSD)}
                    </td>
                    <td className="text-right py-2 text-blue-600">
                      {day.paymentInfoCount}
                    </td>
                    <td className="text-right py-2 text-purple-600">
                      {day.roi.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 待处理申请详情 */}
      {pendingAccountRequests > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🚨 待处理申请详情 ({pendingAccountRequests})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequestsDetail.map((request, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      request.urgency === 'urgent' ? 'bg-red-500 animate-pulse' :
                      request.urgency === 'medium' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}></div>
                    <div>
                      <div className="font-medium text-sm md:text-base">
                        {request.user_name || '未知账户'}
                      </div>
                      <div className="text-xs md:text-sm text-gray-500">
                        {request.request_type === 'facebook' ? 'Facebook广告' :
                         request.request_type === 'google' ? 'Google广告' :
                         request.request_type === 'tiktok' ? 'TikTok广告' : '其他账户'} • 
                        提交时间: {new Date(request.created_at).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      request.urgency === 'urgent' ? 'bg-red-200 text-red-800' :
                      request.urgency === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-green-200 text-green-800'
                    }`}>
                      {request.urgency === 'urgent' ? '紧急' : 
                       request.urgency === 'high' ? '高' :
                       request.urgency === 'medium' ? '普通' : '低'}
                    </span>
                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent('navigateToModule', { detail: 'account-request' }))}
                      className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                    >
                      处理
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-center">
              <button
                onClick={(e) => {
                  console.log('点击处理全部申请按钮');
                  e.preventDefault();
                  window.dispatchEvent(new CustomEvent('navigateToModule', { detail: 'account-requests' }));
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                🚨 去处理全部申请 ({pendingAccountRequests})
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 快速操作 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ⚡ 快速操作
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('navigateToModule', { detail: 'ad-data' }))}
              className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors"
            >
              <div className="text-2xl mb-2">📝</div>
              <div className="font-medium text-blue-800">录入数据</div>
            </button>
            
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('navigateToModule', { detail: 'leaderboard' }))}
              className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-center transition-colors"
            >
              <div className="text-2xl mb-2">🏆</div>
              <div className="font-medium text-green-800">查看排行</div>
            </button>
            
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('navigateToModule', { detail: 'product-image' }))}
              className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition-colors"
            >
              <div className="text-2xl mb-2">🎨</div>
              <div className="font-medium text-purple-800">产品图片生成PRO</div>
            </button>
            
            <button
              onClick={loadDashboardData}
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-center transition-colors"
            >
              <div className="text-2xl mb-2">🔄</div>
              <div className="font-medium text-gray-800">刷新数据</div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RewrittenDashboard;