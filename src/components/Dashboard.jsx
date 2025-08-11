import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adDataService } from '../utils/supabase';

const Dashboard = () => {
  const [todayStats, setTodayStats] = useState({
    revenue: 0,
    spend: 0,
    roi: 0,
    orders: 0,
    conversions: 0
  });
  
  const [dailyAdData, setDailyAdData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');

  useEffect(() => {
    loadData();
    // 每30秒刷新数据
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      console.log('🔄 开始加载数据...');
      setLoading(true);
      
      const rawData = await adDataService.getAll();
      console.log('📊 获取到', rawData.length, '条原始数据');
      
      const today = new Date().toISOString().split('T')[0];
      console.log('📅 今日日期:', today);
      
      const todayData = rawData.filter(record => record.date === today);
      console.log('📈 今日数据:', todayData.length, '条');
      
      if (todayData.length === 0) {
        console.log('❌ 没有今日数据');
        setLoading(false);
        return;
      }
      
      // 按员工聚合数据
      const staffStats = {};
      let totalRevenue = 0;
      let totalSpend = 0;
      let totalOrders = 0;
      let totalPaymentInfo = 0;
      
      todayData.forEach(record => {
        const staff = record.staff;
        const revenue = parseFloat(record.credit_card_amount || 0);  // 信用卡收款金额
        const spend = parseFloat(record.ad_spend || 0);              // 广告花费
        const orders = parseInt(record.credit_card_orders || 0);     // 信用卡订单数量  
        const paymentInfo = parseInt(record.payment_info_count || 0); // 支付信息数量
        
        if (!staffStats[staff]) {
          staffStats[staff] = {
            name: staff,
            revenue: 0,
            spend: 0,
            orders: 0,
            paymentInfo: 0,
            roi: 0
          };
        }
        
        staffStats[staff].revenue += revenue;
        staffStats[staff].spend += spend;
        staffStats[staff].orders += orders;
        staffStats[staff].paymentInfo += paymentInfo;
        
        totalRevenue += revenue;
        totalSpend += spend;
        totalOrders += orders;
        totalPaymentInfo += paymentInfo;
      });
      
      // 计算ROI
      const processedData = Object.values(staffStats).map(stat => ({
        ...stat,
        roi: stat.spend > 0 ? (stat.revenue - stat.spend) / stat.spend : 0
      }));
      
      console.log('💰 处理后的数据:', processedData);
      
      // 更新状态
      setTodayStats({
        revenue: totalRevenue,
        spend: totalSpend,
        roi: totalSpend > 0 ? (totalRevenue - totalSpend) / totalSpend : 0,
        orders: totalOrders,
        conversions: totalPaymentInfo
      });
      
      setDailyAdData(processedData);
      setLastUpdate(new Date().toLocaleTimeString());
      setLoading(false);
      
      console.log('✅ 数据更新完成');
    } catch (error) {
      console.error('❌ 加载数据出错:', error);
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getMelonWinner = () => {
    if (!dailyAdData.length) return null;
    return dailyAdData.reduce((lowest, current) => 
      current.roi < lowest.roi ? current : lowest
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-gray-800">正在加载数据...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            📊 数据概览中心
          </h1>
          <p className="text-xl text-gray-600 font-medium">
            实时监测业务数据 · 最后更新: {lastUpdate}
          </p>
          <button 
            onClick={loadData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 刷新数据
          </button>
        </div>

        {/* Today's Performance */}
        <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="mr-3">📈</span>今日业绩数据
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-3xl p-6 shadow-xl">
              <div className="text-4xl mb-4">💰</div>
              <div className="text-3xl font-bold text-gray-800 mb-2">
                {formatCurrency(todayStats.revenue)}
              </div>
              <div className="text-gray-600 font-medium">今日收入</div>
            </div>
            
            <div className="bg-gradient-to-br from-rose-100 to-rose-200 rounded-3xl p-6 shadow-xl">
              <div className="text-4xl mb-4">💸</div>
              <div className="text-3xl font-bold text-gray-800 mb-2">
                {formatCurrency(todayStats.spend)}
              </div>
              <div className="text-gray-600 font-medium">今日支出</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-3xl p-6 shadow-xl">
              <div className="text-4xl mb-4">📦</div>
              <div className="text-3xl font-bold text-gray-800 mb-2">
                {todayStats.orders.toLocaleString()}
              </div>
              <div className="text-gray-600 font-medium">订单数量</div>
            </div>
            
            <div className="bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-3xl p-6 shadow-xl">
              <div className="text-4xl mb-4">🎯</div>
              <div className="text-3xl font-bold text-gray-800 mb-2">
                {todayStats.conversions.toLocaleString()}
              </div>
              <div className="text-gray-600 font-medium">转化数量</div>
            </div>
          </div>

          {/* ROI Showcase */}
          <div className="bg-gradient-to-r from-yellow-200 via-orange-200 to-red-200 rounded-2xl p-8 text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-4">📊 总体投资回报率 (ROI)</h3>
            <div className="text-6xl font-bold text-gray-800 mb-2">
              {(todayStats.roi * 100).toFixed(1)}%
            </div>
            <div className="text-lg text-gray-600">
              净利润: {formatCurrency(todayStats.revenue - todayStats.spend)}
            </div>
          </div>
        </div>

        {/* Staff Performance */}
        <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="mr-3">👥</span>员工业绩排行榜
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dailyAdData
              .sort((a, b) => b.roi - a.roi)
              .map((staff, index) => (
                <div
                  key={staff.name}
                  className={`rounded-2xl p-6 shadow-lg ${
                    index === 0 
                      ? 'bg-gradient-to-br from-yellow-200 to-orange-200 border-4 border-yellow-400' 
                      : index === 1
                      ? 'bg-gradient-to-br from-gray-200 to-gray-300 border-2 border-gray-400'
                      : index === 2
                      ? 'bg-gradient-to-br from-orange-200 to-yellow-100 border-2 border-orange-300'
                      : 'bg-gradient-to-br from-blue-100 to-blue-200'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-3">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👍'}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{staff.name}</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div>收入: {formatCurrency(staff.revenue)}</div>
                      <div>支出: {formatCurrency(staff.spend)}</div>
                      <div>订单: {staff.orders} 个</div>
                      <div className={`font-bold text-lg ${
                        staff.roi > 0 ? 'text-green-600' : staff.roi < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        ROI: {(staff.roi * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Melon Winner */}
        {getMelonWinner() && (
          <div className="bg-gradient-to-r from-red-200 via-orange-200 to-yellow-200 rounded-3xl p-8 shadow-2xl border-4 border-orange-400">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="mr-3">🍉</span>今日瓜皮得主
            </h2>
            
            <div className="text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-3xl font-bold text-red-600 mb-4">{getMelonWinner().name}</h3>
              <div className="bg-white/60 rounded-xl p-4 inline-block">
                <div className="text-lg text-gray-700 mb-2">
                  ROI: <span className="font-bold text-red-600">{(getMelonWinner().roi * 100).toFixed(1)}%</span>
                </div>
                <div className="text-sm text-gray-600">
                  收入: {formatCurrency(getMelonWinner().revenue)} | 
                  支出: {formatCurrency(getMelonWinner().spend)}
                </div>
              </div>
              <div className="text-4xl mt-4">🍉</div>
              <p className="text-lg text-gray-700 font-medium mt-3">
                恭喜获得今日ROI最低奖！请享用这份特殊的瓜皮荣誉！
              </p>
            </div>
          </div>
        )}

        {/* Debug Info */}
        <div className="bg-gray-100 rounded-xl p-4">
          <h3 className="font-bold mb-2">🔧 调试信息</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <div>今日员工数: {dailyAdData.length}</div>
            <div>员工列表: {dailyAdData.map(s => s.name).join(', ')}</div>
            <div>总收入: {formatCurrency(todayStats.revenue)}</div>
            <div>总支出: {formatCurrency(todayStats.spend)}</div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;