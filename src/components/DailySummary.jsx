import React, { useState } from 'react';
import { getDailySummary, getDailyLeaderboard, exchangeRate } from '../data/advertisingData';

const DailySummary = () => {
  const [selectedDate, setSelectedDate] = useState('2025-01-14');
  const summaryData = getDailySummary(selectedDate);
  const leaderboard = getDailyLeaderboard(selectedDate);

  const formatMXN = (value) => `MX$${value.toLocaleString()}`;
  const formatUSD = (value) => `$${value.toLocaleString()}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">每日总结</h2>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <label className="text-sm font-medium text-gray-700">选择日期:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      {/* 毛玻璃效果总结卡片 */}
      <div className="relative">
        {/* 背景渐变 */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl"></div>
        
        {/* 毛玻璃效果内容 */}
        <div className="relative backdrop-blur-xl bg-white bg-opacity-20 border border-white border-opacity-30 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">{selectedDate} 数据总结</h3>
            <p className="text-blue-100">Daily Performance Summary</p>
          </div>

          {/* 核心指标网格 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20">
              <div className="text-center">
                <div className="text-3xl mb-2">💰</div>
                <div className="text-white text-sm opacity-80">总信用卡金额</div>
                <div className="text-2xl font-bold text-white">{formatMXN(summaryData.totalCreditCardAmount)}</div>
                <div className="text-blue-200 text-sm">≈ {formatUSD((summaryData.totalCreditCardAmount * exchangeRate.mxnToUsd).toFixed(2))}</div>
              </div>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20">
              <div className="text-center">
                <div className="text-3xl mb-2">📊</div>
                <div className="text-white text-sm opacity-80">总广告花费</div>
                <div className="text-2xl font-bold text-white">{formatUSD(summaryData.totalAdSpend)}</div>
                <div className="text-blue-200 text-sm">Active Campaigns</div>
              </div>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20">
              <div className="text-center">
                <div className="text-3xl mb-2">🛍️</div>
                <div className="text-white text-sm opacity-80">总订单数量</div>
                <div className="text-2xl font-bold text-white">{summaryData.totalOrders}</div>
                <div className="text-blue-200 text-sm">Orders Completed</div>
              </div>
            </div>
          </div>

          {/* 绩效指标 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-gradient-to-r from-green-500 to-green-600 bg-opacity-90 rounded-xl p-6">
              <div className="text-center text-white">
                <div className="text-xl font-bold">平均订单价值</div>
                <div className="text-2xl font-bold mt-2">
                  {formatMXN((summaryData.totalCreditCardAmount / summaryData.totalOrders).toFixed(2))}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 bg-opacity-90 rounded-xl p-6">
              <div className="text-center text-white">
                <div className="text-xl font-bold">ROI 指标</div>
                <div className="text-2xl font-bold mt-2">
                  {((summaryData.totalCreditCardAmount * exchangeRate.mxnToUsd / summaryData.totalAdSpend) * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 bg-opacity-90 rounded-xl p-6">
              <div className="text-center text-white">
                <div className="text-xl font-bold">活跃投放人员</div>
                <div className="text-2xl font-bold mt-2">{summaryData.advertiserCount}</div>
              </div>
            </div>
          </div>

          {/* 今日之星 */}
          {leaderboard.length > 0 && (
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20">
              <h4 className="text-xl font-bold text-white text-center mb-4">🌟 今日之星 🌟</h4>
              <div className="flex items-center justify-center space-x-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl font-bold text-white">{leaderboard[0].advertiser}</span>
                  </div>
                  <div className="text-white font-semibold">{leaderboard[0].advertiser}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-300">{formatMXN(leaderboard[0].creditCardAmount)}</div>
                  <div className="text-blue-200 text-sm">最高信用卡金额</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-300">{leaderboard[0].orderCount}</div>
                  <div className="text-blue-200 text-sm">订单数量</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 详细分析 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">成本效率分析</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">总支付信息数量</span>
              <span className="font-semibold text-blue-600">{summaryData.totalPaymentInfo}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">平均支付成本</span>
              <span className="font-semibold text-green-600">
                {formatMXN((summaryData.totalCreditCardAmount / summaryData.totalPaymentInfo).toFixed(2))}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">广告支出回报率</span>
              <span className="font-semibold text-purple-600">
                {((summaryData.totalCreditCardAmount * exchangeRate.mxnToUsd / summaryData.totalAdSpend)).toFixed(2)}x
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">充值统计</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">总充值金额</span>
              <span className="font-semibold text-yellow-600">{formatUSD(summaryData.totalRecharge)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">平均每人充值</span>
              <span className="font-semibold text-orange-600">
                {formatUSD((summaryData.totalRecharge / summaryData.advertiserCount).toFixed(2))}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">充值效率</span>
              <span className="font-semibold text-red-600">
                {((summaryData.totalRecharge / summaryData.totalAdSpend) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailySummary;