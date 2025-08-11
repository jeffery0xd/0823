import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { adDataService, dailyStatsService, leaderboardService } from '../data/supabaseService';

const UnifiedDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    todayStats: {
      totalSpend: 0,
      totalRevenue: 0,
      totalROI: 0,
      activeStaff: 0
    },
    recentEntries: [],
    topPerformers: [],
    dailyTrend: [],
    loading: true,
    error: null
  });

  // 统一的数据字段映射
  const fieldMapping = {
    staff: 'staff',           // 员工姓名
    date: 'date',            // 日期
    spend: 'ad_spend',       // 花费 - 修正字段名
    revenue: 'credit_card_amount', // 收入 - 修正字段名
    roi: 'roi',              // ROI
    platform: 'platform',   // 平台
    product: 'product',      // 产品
    account: 'account'       // 账户
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setDashboardData(prev => ({ ...prev, loading: true, error: null }));

      // 并行加载所有数据
      const [adData, statsData, leaderData] = await Promise.all([
        adDataService.getAll(),
        dailyStatsService.getAll(), 
        leaderboardService.getAll()
      ]);

      // 计算今日统计
      const today = new Date().toISOString().split('T')[0];
      const todayEntries = adData.filter(entry => 
        entry[fieldMapping.date] === today
      );

      const todayStats = {
        totalSpend: todayEntries.reduce((sum, entry) => 
          sum + (parseFloat(entry[fieldMapping.spend]) || 0), 0),
        totalRevenue: todayEntries.reduce((sum, entry) => 
          sum + (parseFloat(entry[fieldMapping.revenue]) || 0), 0),
        totalROI: 0,
        activeStaff: new Set(todayEntries.map(entry => entry[fieldMapping.staff])).size
      };

      // 计算总ROI
      todayStats.totalROI = todayStats.totalSpend > 0 
        ? ((todayStats.totalRevenue - todayStats.totalSpend) / todayStats.totalSpend * 100)
        : 0;

      // 获取最近条目（最新5条）
      const recentEntries = adData
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
        .map(entry => ({
          id: entry.id,
          staff: entry[fieldMapping.staff],
          date: entry[fieldMapping.date],
          spend: parseFloat(entry[fieldMapping.spend]) || 0,
          revenue: parseFloat(entry[fieldMapping.revenue]) || 0,
          roi: parseFloat(entry[fieldMapping.roi]) || 0,
          platform: entry[fieldMapping.platform],
          product: entry[fieldMapping.product]
        }));

      // 计算员工排行（按ROI）
      const staffPerformance = {};
      adData.forEach(entry => {
        const staff = entry[fieldMapping.staff];
        if (!staff) return;

        if (!staffPerformance[staff]) {
          staffPerformance[staff] = {
            staff,
            totalSpend: 0,
            totalRevenue: 0,
            entries: 0
          };
        }

        staffPerformance[staff].totalSpend += parseFloat(entry[fieldMapping.spend]) || 0;
        staffPerformance[staff].totalRevenue += parseFloat(entry[fieldMapping.revenue]) || 0;
        staffPerformance[staff].entries += 1;
      });

      const topPerformers = Object.values(staffPerformance)
        .map(staff => ({
          ...staff,
          roi: staff.totalSpend > 0 
            ? ((staff.totalRevenue - staff.totalSpend) / staff.totalSpend * 100)
            : 0,
          avgSpend: staff.entries > 0 ? staff.totalSpend / staff.entries : 0
        }))
        .sort((a, b) => b.roi - a.roi)
        .slice(0, 5);

      // 计算7天趋势
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayEntries = adData.filter(entry => 
          entry[fieldMapping.date] === dateStr
        );

        const dayStats = {
          date: dateStr,
          spend: dayEntries.reduce((sum, entry) => 
            sum + (parseFloat(entry[fieldMapping.spend]) || 0), 0),
          revenue: dayEntries.reduce((sum, entry) => 
            sum + (parseFloat(entry[fieldMapping.revenue]) || 0), 0),
          entries: dayEntries.length
        };

        dayStats.roi = dayStats.spend > 0 
          ? ((dayStats.revenue - dayStats.spend) / dayStats.spend * 100)
          : 0;

        last7Days.push(dayStats);
      }

      setDashboardData({
        todayStats,
        recentEntries,
        topPerformers,
        dailyTrend: last7Days,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('加载仪表板数据失败:', error);
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: '数据加载失败，请刷新重试'
      }));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercent = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getROIColor = (roi) => {
    if (roi >= 20) return 'text-green-600';
    if (roi >= 10) return 'text-blue-600';
    if (roi >= 0) return 'text-yellow-600';
    return 'text-red-600';
  };

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

  const { todayStats, recentEntries, topPerformers, dailyTrend } = dashboardData;

  return (
    <div className="p-6 space-y-6">
      {/* 头部统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日花费</CardTitle>
            <div className="text-2xl">💰</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(todayStats.totalSpend)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              相比昨日 {dailyTrend.length > 1 ? 
                formatPercent(((todayStats.totalSpend - dailyTrend[dailyTrend.length - 2]?.spend || 0) / (dailyTrend[dailyTrend.length - 2]?.spend || 1)) * 100)
                : '+0.0%'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日收入</CardTitle>
            <div className="text-2xl">📈</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(todayStats.totalRevenue)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              相比昨日 {dailyTrend.length > 1 ? 
                formatPercent(((todayStats.totalRevenue - dailyTrend[dailyTrend.length - 2]?.revenue || 0) / (dailyTrend[dailyTrend.length - 2]?.revenue || 1)) * 100)
                : '+0.0%'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日ROI</CardTitle>
            <div className="text-2xl">🎯</div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getROIColor(todayStats.totalROI)}`}>
              {formatPercent(todayStats.totalROI)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              投资回报率
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃员工</CardTitle>
            <div className="text-2xl">👥</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {todayStats.activeStaff}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              今日录入数据的员工数
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近录入 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📝 最近录入数据
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentEntries.length > 0 ? recentEntries.map((entry, index) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{entry.staff}</div>
                    <div className="text-sm text-gray-500">
                      {entry.platform} • {entry.product}
                    </div>
                    <div className="text-xs text-gray-400">{entry.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(entry.revenue)}</div>
                    <div className={`text-sm ${getROIColor(entry.roi)}`}>
                      ROI {formatPercent(entry.roi)}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  暂无数据
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 员工排行榜 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🏆 员工ROI排行榜
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.length > 0 ? topPerformers.map((performer, index) => (
                <div key={performer.staff} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-orange-400' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{performer.staff}</div>
                      <div className="text-sm text-gray-500">
                        {performer.entries} 条记录
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${getROIColor(performer.roi)}`}>
                      {formatPercent(performer.roi)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatCurrency(performer.totalRevenue)}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  暂无排行数据
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 7天趋势 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 7天数据趋势
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">日期</th>
                  <th className="text-right py-2">花费</th>
                  <th className="text-right py-2">收入</th>
                  <th className="text-right py-2">ROI</th>
                  <th className="text-right py-2">条目数</th>
                </tr>
              </thead>
              <tbody>
                {dailyTrend.map((day, index) => (
                  <tr key={day.date} className="border-b last:border-b-0">
                    <td className="py-2">
                      {new Date(day.date).toLocaleDateString('zh-CN', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="text-right py-2 text-red-600">
                      {formatCurrency(day.spend)}
                    </td>
                    <td className="text-right py-2 text-green-600">
                      {formatCurrency(day.revenue)}
                    </td>
                    <td className={`text-right py-2 ${getROIColor(day.roi)}`}>
                      {formatPercent(day.roi)}
                    </td>
                    <td className="text-right py-2 text-gray-600">
                      {day.entries}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
              onClick={() => window.dispatchEvent(new CustomEvent('navigateToModule', { detail: 'export' }))}
              className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition-colors"
            >
              <div className="text-2xl mb-2">📊</div>
              <div className="font-medium text-purple-800">导出报表</div>
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

export default UnifiedDashboard;