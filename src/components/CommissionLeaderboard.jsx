import React, { useState, useEffect, useCallback } from 'react';
import { commissionService } from '../data/commissionService';

const CommissionLeaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('2025-08');
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [dataRange, setDataRange] = useState(null);
  const [animatedRankings, setAnimatedRankings] = useState([]);
  
  // 可选月份
  const availableMonths = [
    { value: '2025-07', label: '2025年7月' },
    { value: '2025-08', label: '2025年8月' }
  ];
  
  // 称号和特权配置
  const getTitleAndPrivileges = (rank) => {
    switch (rank) {
      case 1:
        return {
          title: '游艇会黑金卡',
          privilege: '顶级会员待遇',
          emoji: '🥇',
          gradient: 'from-yellow-400 via-yellow-500 to-yellow-600',
          textGradient: 'from-yellow-600 to-orange-600',
          bgGradient: 'from-yellow-50 to-orange-50',
          borderColor: 'border-yellow-300',
          shadowColor: 'shadow-yellow-200',
          glowColor: 'shadow-yellow-400/30'
        };
      case 2:
        return {
          title: '阳光国会黑金卡',
          privilege: '高级会员待遇',
          emoji: '🥈',
          gradient: 'from-gray-300 via-gray-400 to-gray-500',
          textGradient: 'from-gray-600 to-slate-600',
          bgGradient: 'from-gray-50 to-slate-50',
          borderColor: 'border-gray-300',
          shadowColor: 'shadow-gray-200',
          glowColor: 'shadow-gray-400/30'
        };
      case 3:
        return {
          title: '黑灯舞黑金卡',
          privilege: '公司提供免费体检一次',
          emoji: '🥉',
          gradient: 'from-orange-400 via-amber-500 to-orange-600',
          textGradient: 'from-orange-600 to-amber-600',
          bgGradient: 'from-orange-50 to-amber-50',
          borderColor: 'border-orange-300',
          shadowColor: 'shadow-orange-200',
          glowColor: 'shadow-orange-400/30'
        };
      default:
        return {
          title: '努力拼搏',
          privilege: '继续加油💪',
          emoji: '💪',
          gradient: 'from-blue-400 via-blue-500 to-blue-600',
          textGradient: 'from-blue-600 to-indigo-600',
          bgGradient: 'from-blue-50 to-indigo-50',
          borderColor: 'border-blue-300',
          shadowColor: 'shadow-blue-200',
          glowColor: 'shadow-blue-400/30'
        };
    }
  };
  
  // 获取排行榜数据
  const fetchLeaderboardData = useCallback(async (month) => {
    try {
      setLoading(true);
      console.log('获取排行榜数据:', month);
      
      // 获取月度提成数据
      const monthlyData = await commissionService.getCurrentMonthCommission(month);
      const range = await commissionService.getDataDateRange(month);
      
      console.log('获取到的月度数据:', monthlyData);
      console.log('数据范围:', range);
      
      // 排序并添加排名
      const sortedData = monthlyData
        .sort((a, b) => b.totalCommission - a.totalCommission)
        .map((item, index) => ({
          ...item,
          rank: index + 1,
          rankInfo: getTitleAndPrivileges(index + 1)
        }));
      
      console.log('排序后的数据:', sortedData);
      
      setLeaderboardData(sortedData);
      setDataRange(range);
      setLastRefreshed(new Date().toISOString());
      
      // 添加动画延迟效果
      setTimeout(() => {
        setAnimatedRankings(sortedData);
      }, 300);
      
    } catch (error) {
      console.error('获取排行榜数据失败:', error);
      alert(`获取排行榜数据失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // 手动刷新数据
  const handleRefresh = () => {
    fetchLeaderboardData(selectedMonth);
  };
  
  // 月份切换
  const handleMonthChange = (month) => {
    setSelectedMonth(month);
    setAnimatedRankings([]); // 重置动画
    fetchLeaderboardData(month);
  };
  
  // 组件加载时获取数据
  useEffect(() => {
    fetchLeaderboardData(selectedMonth);
  }, [fetchLeaderboardData, selectedMonth]);
  
  // 加载状态
  if (loading && leaderboardData.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-purple-700 font-medium">正在加载排行榜数据...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4 lg:p-6">
      {/* 页面头部 */}
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mb-4">
            <span className="text-4xl">🏆</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            提成排行榜
          </h1>
          <p className="text-gray-600 text-lg">员工提成收入排名与荣誉称号</p>
        </div>
        
        {/* 控制面板 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <select
                value={selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
              >
                {availableMonths.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
              
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-6 py-2 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    刷新中
                  </>
                ) : (
                  <>
                    🔄 刷新数据
                  </>
                )}
              </button>
            </div>
            
            {/* 数据信息 */}
            <div className="text-sm text-gray-600 text-center sm:text-right">
              {dataRange && (
                <div className="mb-1">
                  📅 数据范围：{dataRange.startDate} 至 {dataRange.endDate}
                </div>
              )}
              {lastRefreshed && (
                <div>
                  🔄 最后更新：{new Date(lastRefreshed).toLocaleString('zh-CN')}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* 排行榜主体 */}
        {leaderboardData.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 shadow-xl border border-white/20 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">暂无排行数据</h3>
            <p className="text-gray-500">该月份暂无提成数据，请先计算员工提成</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 前三名特殊展示 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {leaderboardData.slice(0, 3).map((item, index) => {
                const { rankInfo } = item;
                const isAnimated = animatedRankings.find(r => r.advertiser === item.advertiser);
                
                return (
                  <div
                    key={item.advertiser}
                    className={`group relative transform transition-all duration-700 hover:scale-105 ${
                      isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                    }`}
                    style={{ transitionDelay: `${index * 200}ms` }}
                  >
                    {/* 背景光晕效果 */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${rankInfo.gradient} opacity-20 blur-xl rounded-3xl group-hover:opacity-30 transition-opacity duration-300`}></div>
                    
                    {/* 主卡片 */}
                    <div className={`relative bg-gradient-to-br ${rankInfo.bgGradient} border-2 ${rankInfo.borderColor} rounded-3xl p-6 shadow-2xl ${rankInfo.glowColor} hover:shadow-3xl transition-all duration-300`}>
                      {/* 排名徽章 */}
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <div className={`bg-gradient-to-r ${rankInfo.gradient} text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2`}>
                          <span className="text-2xl">{rankInfo.emoji}</span>
                          <span className="font-bold">第{item.rank}名</span>
                        </div>
                      </div>
                      
                      {/* 员工信息 */}
                      <div className="text-center mt-4">
                        <div className="text-6xl mb-4 animate-bounce">{rankInfo.emoji}</div>
                        <h3 className={`text-2xl font-bold bg-gradient-to-r ${rankInfo.textGradient} bg-clip-text text-transparent mb-2`}>
                          {item.advertiser}
                        </h3>
                        
                        {/* 称号 */}
                        <div className={`bg-gradient-to-r ${rankInfo.gradient} text-white px-4 py-2 rounded-full text-sm font-medium mb-4 inline-block`}>
                          {rankInfo.title}
                        </div>
                        
                        {/* 提成数据 */}
                        <div className="space-y-3">
                          <div className="bg-white/50 rounded-xl p-4">
                            <div className="text-3xl font-bold text-gray-800">
                              ¥{item.totalCommission.toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-600">月度总提成</div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/30 rounded-lg p-3 text-center">
                              <div className="text-xl font-bold text-gray-800">{item.totalOrders}</div>
                              <div className="text-xs text-gray-600">总订单</div>
                            </div>
                            <div className="bg-white/30 rounded-lg p-3 text-center">
                              <div className="text-xl font-bold text-gray-800">{item.avgROI.toFixed(2)}</div>
                              <div className="text-xs text-gray-600">平均ROI</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* 特权说明 */}
                        <div className="mt-4 p-3 bg-white/40 rounded-xl">
                          <div className="text-sm font-medium text-gray-700">🎁 专属特权</div>
                          <div className="text-sm text-gray-600 mt-1">{rankInfo.privilege}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* 完整排行榜列表 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  📊 完整排行榜
                  <span className="text-lg font-normal opacity-80">({availableMonths.find(m => m.value === selectedMonth)?.label})</span>
                </h2>
              </div>
              
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">排名</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">员工</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">称号</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">月度提成</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">总订单</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">工作日</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">平均ROI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboardData.map((item, index) => {
                        const { rankInfo } = item;
                        const isAnimated = animatedRankings.find(r => r.advertiser === item.advertiser);
                        
                        return (
                          <tr
                            key={item.advertiser}
                            className={`border-b border-gray-100 hover:bg-gradient-to-r hover:${rankInfo.bgGradient} transition-all duration-300 ${
                              isAnimated ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
                            }`}
                            style={{ transitionDelay: `${index * 100}ms` }}
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{rankInfo.emoji}</span>
                                <span className={`font-bold text-lg bg-gradient-to-r ${rankInfo.textGradient} bg-clip-text text-transparent`}>
                                  #{item.rank}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="font-semibold text-gray-800 text-lg">{item.advertiser}</div>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`bg-gradient-to-r ${rankInfo.gradient} text-white px-3 py-1 rounded-full text-sm font-medium`}>
                                {rankInfo.title}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="font-bold text-lg text-gray-800">¥{item.totalCommission.toFixed(2)}</div>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="font-semibold text-gray-700">{item.totalOrders}</div>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="font-semibold text-gray-700">{item.workingDays}天</div>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="font-semibold text-gray-700">{item.avgROI.toFixed(3)}</div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {/* 统计摘要 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                📈 统计摘要
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    ¥{leaderboardData.reduce((sum, item) => sum + item.totalCommission, 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-blue-700">总提成收入</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {leaderboardData.reduce((sum, item) => sum + item.totalOrders, 0)}
                  </div>
                  <div className="text-sm text-green-700">总订单数</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.max(...leaderboardData.map(item => item.workingDays))}
                  </div>
                  <div className="text-sm text-purple-700">最多工作日</div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {(leaderboardData.reduce((sum, item) => sum + item.avgROI, 0) / Math.max(leaderboardData.length, 1)).toFixed(2)}
                  </div>
                  <div className="text-sm text-orange-700">团队平均ROI</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommissionLeaderboard;