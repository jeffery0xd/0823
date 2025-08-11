import React, { useState, useEffect } from 'react';
import { adDataService } from '../utils/supabase';

const DailyStats = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [deleting, setDeleting] = useState(new Set());
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [filteredStats, setFilteredStats] = useState([]);
  const [dateRangeSummary, setDateRangeSummary] = useState(null);

  useEffect(() => {
    loadDailyStats();
  }, []);

  useEffect(() => {
    filterStatsByDateRange();
  }, [stats, startDate, endDate]);

  const loadDailyStats = async () => {
    try {
      setLoading(true);
      const rawData = await adDataService.getAll();
      
      // 按日期和投放人员分组统计 - 使用正确的字段名
      const statsMap = {};
      
      rawData.forEach(record => {
        const key = `${record.date}_${record.staff}`;
        if (!statsMap[key]) {
          statsMap[key] = {
            date: record.date,
            advertiser: record.staff, // staff 映射到 advertiser
            ad_spend: 0,
            credit_card_amount: 0,
            payment_info_count: 0,
            credit_card_orders: 0,
            cost_per_payment_info: 0,
            cost_per_order: 0,
            records: []
          };
        }
        
        const stat = statsMap[key];
        stat.ad_spend += parseFloat(record.ad_spend || 0);
        stat.credit_card_amount += parseFloat(record.credit_card_amount || 0);
        stat.payment_info_count += parseInt(record.payment_info_count || 0);
        stat.credit_card_orders += parseInt(record.credit_card_orders || 0);
        stat.records.push(record);
      });
      
      // 计算单次成本
      Object.values(statsMap).forEach(stat => {
        stat.cost_per_payment_info = stat.payment_info_count > 0 
          ? stat.ad_spend / stat.payment_info_count 
          : 0;
        stat.cost_per_order = stat.credit_card_orders > 0 
          ? stat.ad_spend / stat.credit_card_orders 
          : 0;
      });
      
      const dailyStats = Object.values(statsMap).sort((a, b) => new Date(b.date) - new Date(a.date));
      setStats(dailyStats);
    } catch (error) {
      console.error('Error loading daily stats:', error);
      setStats([]);
    } finally {
      setLoading(false);
    }
  };

  const filterStatsByDateRange = () => {
    if (!stats.length) {
      setFilteredStats([]);
      setDateRangeSummary(null);
      return;
    }

    // 筛选日期范围内的数据
    const filtered = stats.filter(stat => {
      const statDate = stat.date;
      return statDate >= startDate && statDate <= endDate;
    });

    setFilteredStats(filtered);

    // 计算日期范围汇总
    if (filtered.length > 0) {
      // 按投放人员分组汇总
      const advertiserSummary = {};
      const advertisers = ['青', '乔', '白', '丁', '妹'];

      advertisers.forEach(advertiser => {
        const advertiserStats = filtered.filter(stat => stat.advertiser === advertiser);
        if (advertiserStats.length > 0) {
          advertiserSummary[advertiser] = {
            advertiser,
            totalAdSpend: advertiserStats.reduce((sum, stat) => sum + stat.ad_spend, 0),
            totalCreditCardAmount: advertiserStats.reduce((sum, stat) => sum + stat.credit_card_amount, 0),
            totalPaymentInfoCount: advertiserStats.reduce((sum, stat) => sum + stat.payment_info_count, 0),
            totalCreditCardOrders: advertiserStats.reduce((sum, stat) => sum + stat.credit_card_orders, 0),
            daysCount: advertiserStats.length,
            avgCostPerPaymentInfo: 0,
            avgCostPerOrder: 0,
            roi: 0
          };

          // 计算平均成本和ROI
          const summary = advertiserSummary[advertiser];
          summary.avgCostPerPaymentInfo = summary.totalPaymentInfoCount > 0 
            ? summary.totalAdSpend / summary.totalPaymentInfoCount 
            : 0;
          summary.avgCostPerOrder = summary.totalCreditCardOrders > 0 
            ? summary.totalAdSpend / summary.totalCreditCardOrders 
            : 0;
          // ROI计算: 信用卡收款金额(MX$转USD) / 广告花费(USD)
          const exchangeRate = 20.0; // 1 USD = 20 MX$
          const totalCreditCardUSD = summary.totalCreditCardAmount / exchangeRate;
          summary.roi = summary.totalAdSpend > 0 ? (totalCreditCardUSD / summary.totalAdSpend) : 0;
        }
      });

      // 计算总汇总
      const totalSummary = {
        totalAdSpend: filtered.reduce((sum, stat) => sum + stat.ad_spend, 0),
        totalCreditCardAmount: filtered.reduce((sum, stat) => sum + stat.credit_card_amount, 0),
        totalPaymentInfoCount: filtered.reduce((sum, stat) => sum + stat.payment_info_count, 0),
        totalCreditCardOrders: filtered.reduce((sum, stat) => sum + stat.credit_card_orders, 0),
        totalDays: new Set(filtered.map(stat => stat.date)).size,
        advertiserSummaries: Object.values(advertiserSummary)
      };

      setDateRangeSummary(totalSummary);
    } else {
      setDateRangeSummary(null);
    }
  };

  const toggleRowExpansion = (index) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const handleDeleteRecord = async (recordId, statIndex) => {
    if (!confirm('确定要删除这条记录吗？此操作不可撤销。')) {
      return;
    }

    try {
      setDeleting(prev => new Set(prev).add(recordId));
      await adDataService.delete(recordId);
      
      // 重新加载数据
      await loadDailyStats();
      
      alert('删除成功！');
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请重试');
    } finally {
      setDeleting(prev => {
        const newDeleting = new Set(prev);
        newDeleting.delete(recordId);
        return newDeleting;
      });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
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
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">每日统计</h2>
            <p className="text-gray-600">查看每日投放数据统计（按投放人员分组）</p>
          </div>
          <button
            onClick={loadDailyStats}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            刷新数据
          </button>
        </div>

        {/* 日期范围筛选器 */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">开始日期:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">结束日期:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="text-sm text-gray-600">
              共筛选 <span className="font-semibold text-blue-600">{filteredStats.length}</span> 条记录
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  日期
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  投放人员
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  广告花费
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  信用卡收款(MX$)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  收款金额(USD)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  支付信息数量
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  信用卡订单
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  单次支付信息成本
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  单次订单成本
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ROI
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStats.length === 0 ? (
                <tr>
                  <td colSpan="12" className="px-6 py-8 text-center text-gray-500">
                    {stats.length === 0 ? '暂无统计数据，请先在"广告数据录入"中添加数据' : '所选日期范围内暂无数据'}
                  </td>
                </tr>
              ) : (
                filteredStats.map((stat, index) => (
                  <React.Fragment key={index}>
                    <tr className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleRowExpansion(index)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          {expandedRows.has(index) ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {stat.date}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {stat.advertiser}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold text-green-600">
                        {formatCurrency(stat.ad_spend)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold text-blue-600">
                        MX${formatNumber(stat.credit_card_amount)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold text-green-600">
                        {(() => {
                          const exchangeRate = 20.0;
                          const usdAmount = stat.credit_card_amount / exchangeRate;
                          return formatCurrency(usdAmount);
                        })()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(stat.payment_info_count)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(stat.credit_card_orders)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold text-orange-600">
                        {stat.payment_info_count > 0 ? formatCurrency(stat.cost_per_payment_info) : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold text-purple-600">
                        {stat.credit_card_orders > 0 ? formatCurrency(stat.cost_per_order) : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold text-red-600">
                        {(() => {
                          const exchangeRate = 20.0;
                          const creditCardUSD = stat.credit_card_amount / exchangeRate;
                          const roi = stat.ad_spend > 0 ? (creditCardUSD / stat.ad_spend) : 0;
                          return roi > 0 ? (Math.floor(roi * 100) / 100).toString() : '-';
                        })()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {stat.records?.length || 0} 条记录
                        </span>
                      </td>
                    </tr>
                    
                    {/* 展开的详细记录 */}
                    {expandedRows.has(index) && stat.records && (
                      <tr>
                        <td colSpan="12" className="px-4 py-0">
                          <div className="bg-gray-50 rounded-lg p-4 my-2">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">📋 详细记录</h4>
                            <div className="space-y-2">
                              {stat.records.map((record) => (
                                <div key={record.id} className="bg-white rounded border p-3 flex justify-between items-center">
                                  <div className="grid grid-cols-4 gap-4 flex-1 text-xs">
                                    <div>
                                      <span className="text-gray-500">账户:</span> {record.account_id || '-'}
                                    </div>
                                    <div>
                                      <span className="text-gray-500">花费:</span> {formatCurrency(record.spend_amount || 0)}
                                    </div>
                                    <div>
                                      <span className="text-gray-500">收款:</span> {formatCurrency(record.credit_card_amount || 0)}
                                    </div>
                                    <div>
                                      <span className="text-gray-500">录入时间:</span> {new Date(record.created_at).toLocaleString()}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteRecord(record.id, index)}
                                    disabled={deleting.has(record.id)}
                                    className="ml-4 bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {deleting.has(record.id) ? '删除中...' : '🗑️ 删除'}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 日期范围汇总信息 */}
      {dateRangeSummary && (
        <div className="space-y-6">
          {/* 总体汇总 */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📊 {startDate === endDate ? `${startDate} 当日汇总` : `${startDate} 至 ${endDate} 期间汇总`}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(dateRangeSummary.totalAdSpend)}
                </div>
                <div className="text-sm text-gray-600">总广告花费</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">
                  MX${formatNumber(dateRangeSummary.totalCreditCardAmount)}
                </div>
                <div className="text-lg font-bold text-green-600">
                  {formatCurrency(dateRangeSummary.totalCreditCardAmount / 20.0)}
                </div>
                <div className="text-sm text-gray-600">总收款金额(MX$/USD)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {(() => {
                    const totalROI = dateRangeSummary.totalAdSpend > 0 
                      ? (dateRangeSummary.totalCreditCardAmount / 20.0) / dateRangeSummary.totalAdSpend 
                      : 0;
                    return totalROI > 0 ? (Math.floor(totalROI * 100) / 100).toString() : '-';
                  })()}
                </div>
                <div className="text-sm text-gray-600">总ROI</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {formatNumber(dateRangeSummary.totalPaymentInfoCount)}
                </div>
                <div className="text-sm text-gray-600">总支付信息</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formatNumber(dateRangeSummary.totalCreditCardOrders)}
                </div>
                <div className="text-sm text-gray-600">总信用卡订单</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {dateRangeSummary.totalDays}
                </div>
                <div className="text-sm text-gray-600">统计天数</div>
              </div>
            </div>
          </div>

          {/* 按投放人员汇总 */}
          {dateRangeSummary.advertiserSummaries.length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">👥 投放人员期间汇总</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dateRangeSummary.advertiserSummaries.map((summary) => (
                  <div key={summary.advertiser} className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-lg text-gray-800">{summary.advertiser}</h4>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {summary.daysCount} 天
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">广告花费:</span>
                        <span className="font-semibold text-green-600">{formatCurrency(summary.totalAdSpend)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">收款金额(MX$):</span>
                        <span className="font-semibold text-blue-600">MX${formatNumber(summary.totalCreditCardAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">收款金额(USD):</span>
                        <span className="font-semibold text-green-600">{formatCurrency(summary.totalCreditCardAmount / 20.0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">支付信息:</span>
                        <span className="font-semibold text-orange-600">{formatNumber(summary.totalPaymentInfoCount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">订单数量:</span>
                        <span className="font-semibold text-purple-600">{formatNumber(summary.totalCreditCardOrders)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-600">平均单次成本:</span>
                        <span className="font-semibold text-red-600">
                          {summary.avgCostPerPaymentInfo > 0 ? formatCurrency(summary.avgCostPerPaymentInfo) : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">ROI:</span>
                        <span className="font-semibold text-indigo-600">
                          {summary.roi > 0 ? (Math.floor(summary.roi * 100) / 100).toString() : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DailyStats;