import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { adService, rechargeService, dailyContestService } from '../data/supabaseService';
import DailyMenu from './DailyMenu';

const DataOverview = () => {
  const [loading, setLoading] = useState(true);
  const [adData, setAdData] = useState([]);
  const [rechargeData, setRechargeData] = useState([]);
  const [advertiserStats, setAdvertiserStats] = useState([]);
  const [statsCards, setStatsCards] = useState([]);
  const [todayWinner, setTodayWinner] = useState(null);
  const [guaPiHolder, setGuaPiHolder] = useState(null);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const formatUSD = (value) => `$${value.toLocaleString()}`;

  useEffect(() => {
    loadData();
    loadTodayWinner();
    loadGuaPiHolder();
  }, []);

  const loadTodayWinner = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log('Loading today winner for:', today);
      
      const entries = await dailyContestService.getEntries(today);
      console.log('Today entries:', entries);
      
      if (entries.length > 0) {
        // 找到今日点赞最多的作品
        const winner = entries.reduce((prev, current) => 
          (prev.likes_count > current.likes_count) ? prev : current
        );
        console.log('Today winner:', winner);
        setTodayWinner(winner);
      }
    } catch (error) {
      console.error('Failed to load today winner:', error);
      setTodayWinner(null);
    }
  };

  const loadGuaPiHolder = async () => {
    try {
      console.log('Loading GuaPi holder data...');
      const [fetchedAdData, fetchedRechargeData] = await Promise.all([
        adService.getAdData(),
        rechargeService.getRechargeRecords()
      ]);

      // 计算今日数据
      const today = new Date().toISOString().split('T')[0];
      const todayAdData = fetchedAdData.filter(item => item.date === today);
      const todayRechargeData = fetchedRechargeData.filter(item => 
        item.created_at.split('T')[0] === today
      );

      // 按投放人员统计ROI数据
      const advertiserStatsMap = {};
      const advertisers = ['青', '乔', '白', '丁', '妹'];

      advertisers.forEach(advertiser => {
        const advertiserAdData = todayAdData.filter(item => item.staff === advertiser);
        const advertiserRechargeData = todayRechargeData.filter(item => item.advertiser === advertiser);

        const creditCard = advertiserAdData.reduce((sum, item) => sum + parseFloat(item.credit_card_amount || 0), 0);
        const adSpend = advertiserAdData.reduce((sum, item) => sum + parseFloat(item.ad_spend || 0), 0);
        const recharge = advertiserRechargeData.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

        // 计算ROI: (信用卡收款 + 充值金额) / 广告花费
        const roi = adSpend > 0 ? ((creditCard + recharge) / adSpend) : 0;

        advertiserStatsMap[advertiser] = {
          name: advertiser,
          creditCard,
          adSpend,
          recharge,
          roi: parseFloat(roi.toFixed(2))
        };
      });

      const advertiserStatsArray = Object.values(advertiserStatsMap);
      
      // 找到ROI最低的投放人员（瓜皮得主）
      if (advertiserStatsArray.length > 0) {
        const validStats = advertiserStatsArray.filter(stat => stat.adSpend > 0);
        if (validStats.length > 0) {
          const guaPi = validStats.reduce((prev, current) => 
            (prev.roi < current.roi) ? prev : current
          );
          console.log('GuaPi holder found:', guaPi);
          setGuaPiHolder(guaPi);
        } else {
          console.log('No valid ROI data found');
          setGuaPiHolder(null);
        }
      }
    } catch (error) {
      console.error('Failed to load GuaPi holder:', error);
      setGuaPiHolder(null);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedAdData, fetchedRechargeData] = await Promise.all([
        adService.getAdData(),
        rechargeService.getRechargeRecords()
      ]);

      setAdData(fetchedAdData);
      setRechargeData(fetchedRechargeData);

      // 计算今日数据
      const today = new Date().toISOString().split('T')[0];
      const todayAdData = fetchedAdData.filter(item => item.date === today);
      const todayRechargeData = fetchedRechargeData.filter(item => 
        item.created_at.split('T')[0] === today
      );

      // 按投放人员统计数据
      const advertiserStatsMap = {};
      const advertisers = ['青', '乔', '白', '丁', '妹'];

      advertisers.forEach(advertiser => {
        const advertiserAdData = todayAdData.filter(item => item.staff === advertiser);
        const advertiserRechargeData = todayRechargeData.filter(item => item.advertiser === advertiser);

        advertiserStatsMap[advertiser] = {
          name: advertiser,
          creditCard: advertiserAdData.reduce((sum, item) => sum + parseFloat(item.credit_card_amount || 0), 0),
          adSpend: advertiserAdData.reduce((sum, item) => sum + parseFloat(item.ad_spend || 0), 0),
          orders: advertiserAdData.reduce((sum, item) => sum + parseInt(item.credit_card_orders || 0), 0),
          recharge: advertiserRechargeData.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0),
          paymentInfo: advertiserAdData.reduce((sum, item) => sum + parseInt(item.payment_info_count || 0), 0)
        };
      });

      const advertiserStatsArray = Object.values(advertiserStatsMap);
      setAdvertiserStats(advertiserStatsArray);

      // 计算汇总统计
      const totalCreditCard = advertiserStatsArray.reduce((sum, item) => sum + item.creditCard, 0);
      const totalAdSpend = advertiserStatsArray.reduce((sum, item) => sum + item.adSpend, 0);
      const totalOrders = advertiserStatsArray.reduce((sum, item) => sum + item.orders, 0);
      const totalRecharge = advertiserStatsArray.reduce((sum, item) => sum + item.recharge, 0);

      const newStatsCards = [
        {
          title: '总信用卡收款',
          value: formatUSD(totalCreditCard),
          change: '+12.5%',
          bgGradient: 'from-blue-500 to-blue-600'
        },
        {
          title: '总广告花费',
          value: formatUSD(totalAdSpend),
          change: '+8.3%',
          bgGradient: 'from-purple-500 to-purple-600'
        },
        {
          title: '总订单数量',
          value: totalOrders.toString(),
          change: '+15.2%',
          bgGradient: 'from-green-500 to-green-600'
        },
        {
          title: '总充值金额',
          value: formatUSD(totalRecharge),
          change: '+9.1%',
          bgGradient: 'from-yellow-500 to-yellow-600'
        }
      ];

      setStatsCards(newStatsCards);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 瓜皮公告栏 */}
      <div className={`rounded-xl p-6 shadow-lg border-2 ${
        guaPiHolder 
          ? 'bg-gradient-to-r from-red-100 to-orange-200 border-red-300' 
          : 'bg-gradient-to-r from-green-100 to-green-200 border-green-300'
      }`}>
        <div className="flex items-center justify-center space-x-4">
          <div className="text-6xl animate-bounce">
            {guaPiHolder ? '🥒' : '📢'}
          </div>
          <div className="text-center">
            <h3 className={`text-2xl font-bold ${
              guaPiHolder ? 'text-red-800' : 'text-green-800'
            }`}>
              瓜皮公告栏
            </h3>
            {guaPiHolder ? (
              <div>
                <p className="text-red-700 text-xl mb-2">
                  🥒 瓜皮得主：<span className="font-bold">{guaPiHolder.name}</span>
                </p>
                <div className="flex items-center justify-center space-x-4 text-sm">
                  <div className="bg-red-200 px-3 py-1 rounded-full">
                    ROI: {guaPiHolder.roi}
                  </div>
                  <div className="bg-orange-200 px-3 py-1 rounded-full">
                    广告花费: ${guaPiHolder.adSpend.toLocaleString()}
                  </div>
                  <div className="bg-yellow-200 px-3 py-1 rounded-full">
                    收入: ${(guaPiHolder.creditCard + guaPiHolder.recharge).toLocaleString()}
                  </div>
                </div>
                <div className="text-sm text-red-600 mt-2 px-3 py-1 bg-red-300 rounded-full inline-block">
                  🥒 今日瓜皮王者
                </div>
              </div>
            ) : (
              <div>
                <p className="text-green-700 text-xl">等待花落谁家🌸</p>
                <div className="text-sm text-green-600 mt-2 px-3 py-1 bg-green-300 rounded-full inline-block">
                  📢 期待中...
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 每日大赛获胜者展示 */}
      {todayWinner && (
        <div className="apple-card p-6 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">👑</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">🏆 今日大赛冠军</h2>
                <p className="text-sm text-gray-600">点赞最多的精彩作品</p>
              </div>
            </div>
            <div className="flex items-center space-x-1 bg-gradient-to-r from-yellow-100 to-orange-100 px-4 py-2 rounded-full border border-yellow-200">
              <span className="text-yellow-600 text-sm">🥇</span>
              <span className="text-yellow-800 font-bold text-sm">WINNER</span>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
            {/* 获胜作品图片 */}
            <div className="lg:w-1/3">
              <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden shadow-xl apple-hover border-4 border-yellow-200">
                <img
                  src={todayWinner.image_url}
                  alt={todayWinner.title || '获胜作品'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Winner image failed to load:', todayWinner.image_url);
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500" style={{display: 'none'}}>
                  图片加载失败
                </div>
              </div>
            </div>
            
            {/* 作品信息 */}
            <div className="lg:w-2/3">
              <div className="flex items-center space-x-2 mb-2">
                <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                  📅 {todayWinner.contest_date || new Date().toISOString().split('T')[0]}
                </span>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                  🎯 最高人气
                </span>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {todayWinner.title || '无标题作品'}
              </h3>
              
              <div className="flex items-center space-x-6 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {todayWinner.anonymous_name?.charAt(0) || 'A'}
                    </span>
                  </div>
                  <span className="text-purple-600 font-semibold">by {todayWinner.anonymous_name}</span>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 bg-red-50 px-3 py-1 rounded-full">
                    <svg className="w-5 h-5 fill-current text-red-500" viewBox="0 0 24 24">
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="font-bold text-lg text-red-600">{todayWinner.likes_count}</span>
                    <span className="text-red-600 text-sm font-medium">个赞</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="font-medium text-blue-600">{todayWinner.comments_count}</span>
                    <span className="text-blue-600 text-sm font-medium">条评论</span>
                  </div>
                </div>
              </div>
              
              {todayWinner.description && (
                <div className="bg-white bg-opacity-50 rounded-lg p-4 mb-4">
                  <p className="text-gray-700 leading-relaxed italic">
                    "{todayWinner.description}"
                  </p>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  🕐 发布时间：{new Date(todayWinner.created_at).toLocaleString('zh-CN')}
                </div>
                <a 
                  href="#/daily-contest"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  查看完整大赛 →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 无获胜者时的占位符 */}
      {!todayWinner && (
        <div className="apple-card p-6 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 mb-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-500 text-2xl">🏆</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">今日还没有大赛获胜者</h3>
            <p className="text-gray-500 text-sm mb-4">快去每日大赛参与或为喜欢的作品点赞吧！</p>
            <a 
              href="#/daily-contest"
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-full transition-colors"
            >
              前往每日大赛 →
            </a>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">数据总览</h2>
        <button
          onClick={() => {
            loadData();
            loadTodayWinner();
            loadGuaPiHolder();
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          刷新数据
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statsCards.map((card, index) => (
          <div key={index} className={`bg-gradient-to-br ${card.bgGradient} rounded-xl p-4 sm:p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-200`}>
            <h3 className="text-sm font-medium opacity-90">{card.title}</h3>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-bold">{card.value}</div>
              {card.usdValue && (
                <div className="text-xs sm:text-sm opacity-80">≈ {card.usdValue}</div>
              )}
            </div>
            <div className="mt-3 flex items-center">
              <span className={`text-sm ${parseFloat(card.change) >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                {parseFloat(card.change) >= 0 ? '↗' : '↘'} {Math.abs(card.change)}%
              </span>
              <span className="text-xs opacity-70 ml-2">vs 昨日</span>
            </div>
          </div>
        ))}
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* 投放人员信用卡金额对比 */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">投放人员信用卡收款对比</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={advertiserStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatUSD(value)} />
              <Legend />
              <Bar dataKey="creditCard" fill="#3B82F6" name="信用卡收款($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 广告花费分布 */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">广告花费分布</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={advertiserStats}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: $${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="adSpend"
              >
                {advertiserStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatUSD(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 订单与充值对比 */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">订单数量与充值金额对比</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={advertiserStats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="orders" fill="#10B981" name="订单数量" />
            <Bar yAxisId="right" dataKey="recharge" fill="#F59E0B" name="充值金额($)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 每日菜单区域 */}
      <div className="mt-6">
        <DailyMenu isAdmin={true} />
      </div>
    </div>
  );
};

export default DataOverview;