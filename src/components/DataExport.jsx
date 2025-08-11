import React, { useState, useEffect } from 'react';
import { adService, rechargeService } from '../data/supabaseService';

const DataExport = () => {
  const [exportFormat, setExportFormat] = useState('csv');
  const [dateRange, setDateRange] = useState('week');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  const exportToCSV = (data) => {
    if (!data || data.length === 0) {
      alert('没有数据可导出');
      return;
    }

    const headers = [
      '日期', '投放人员', '广告账户名称', '广告账户ID', '充值金额', 
      '信用卡收款金额', '添加支付信息数量', '信用卡订单数量', 
      '单次添加支付信息成本', '单次订单购买成本'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        Object.values(row).map(field => `"${field}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const dateRange = startDate === endDate ? startDate : `${startDate}_to_${endDate}`;
    link.setAttribute('download', `advertising_data_export_${dateRange}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = (data) => {
    // 简化版Excel导出，实际上还是CSV格式但提示用Excel打开
    exportToCSV(data);
  };

  const exportToJSON = (data) => {
    if (!data || data.length === 0) {
      alert('没有数据可导出');
      return;
    }

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const dateRange = startDate === endDate ? startDate : `${startDate}_to_${endDate}`;
    link.setAttribute('download', `advertising_data_export_${dateRange}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 加载预览数据
  const loadPreviewData = async () => {
    setDataLoading(true);
    try {
      // 获取数据
      const adData = await adService.getAdData();
      const rechargeData = await rechargeService.getRecharges();
      
      console.log('Ad Data:', adData);
      console.log('Recharge Data:', rechargeData);
      
      // 合并数据并添加计算字段
      const exportData = adData.map(ad => {
        // 查找对应的充值数据
        const recharge = rechargeData.find(r => 
          r.account_id && ad.account_name && 
          r.account_id.includes(ad.account_name) &&
          r.created_at && ad.date &&
          new Date(r.created_at).toDateString() === new Date(ad.date).toDateString()
        );
        
        // 计算单次成本
        const costPerPaymentInfo = ad.payment_info_count > 0 
          ? parseFloat(ad.ad_spend) / parseInt(ad.payment_info_count)
          : 0;
        
        const costPerOrder = ad.credit_card_orders > 0 
          ? parseFloat(ad.ad_spend) / parseInt(ad.credit_card_orders)
          : 0;
        
        return {
          date: ad.date,
          advertiser: ad.advertiser,
          accountName: ad.account_name || '',
          accountId: ad.account_id || '',
          rechargeAmount: recharge ? parseFloat(recharge.usd_amount || 0).toFixed(2) : '0.00',
          creditCardAmount: parseFloat(ad.credit_card_amount || 0).toFixed(2),
          paymentInfoCount: parseInt(ad.payment_info_count || 0),
          creditCardOrders: parseInt(ad.credit_card_orders || 0),
          costPerPaymentInfo: costPerPaymentInfo.toFixed(2),
          costPerOrder: costPerOrder.toFixed(2),
          adSpend: parseFloat(ad.ad_spend || 0).toFixed(2)
        };
      });

      setPreviewData(exportData);
    } catch (error) {
      console.error('Error loading preview data:', error);
      setPreviewData([]);
    } finally {
      setDataLoading(false);
    }
  };

  const filterDataByDateRange = () => {
    if (!previewData.length) {
      setFilteredData([]);
      return;
    }

    // 筛选日期范围内的数据
    const filtered = previewData.filter(item => {
      const itemDate = item.date;
      return itemDate >= startDate && itemDate <= endDate;
    });

    setFilteredData(filtered);
  };

  useEffect(() => {
    loadPreviewData();
  }, []);

  useEffect(() => {
    filterDataByDateRange();
  }, [previewData, startDate, endDate]);

  const handleExport = async () => {
    setLoading(true);
    try {
      // 将筛选后的数据转换为导出格式
      const exportData = filteredData.map(item => ({
        '日期': item.date,
        '投放人员': item.advertiser,
        '广告账户名称': item.accountName,
        '广告账户ID': item.accountId,
        '充值金额': item.rechargeAmount,
        '信用卡收款金额': item.creditCardAmount,
        '添加支付信息数量': item.paymentInfoCount,
        '信用卡订单数量': item.creditCardOrders,
        '单次添加支付信息成本': item.costPerPaymentInfo,
        '单次订单购买成本': item.costPerOrder
      }));

      // 根据格式导出
      if (exportFormat === 'csv') {
        exportToCSV(exportData);
      } else if (exportFormat === 'excel') {
        exportToExcel(exportData);
      } else if (exportFormat === 'json') {
        exportToJSON(exportData);
      }
      
    } catch (error) {
      console.error('Export error:', error);
      alert('导出失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">数据导出</h2>
          <p className="text-gray-600">导出广告投放数据进行进一步分析</p>
        </div>
        <button
          onClick={loadPreviewData}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          刷新数据
        </button>
      </div>

      {/* 导出配置 */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">导出设置</h3>
        
        {/* 日期范围筛选器 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">📅 日期筛选</h4>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">开始日期:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">结束日期:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div className="text-sm text-gray-600">
              将导出 <span className="font-semibold text-green-600">{filteredData.length}</span> 条记录
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">导出格式</label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="csv">CSV 格式</option>
              <option value="excel">Excel 格式</option>
              <option value="json">JSON 格式</option>
            </select>
          </div>

          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            {filteredData.length === 0 && !loading ? (
              <div className="w-full">
                <div className="bg-gray-100 text-gray-500 px-4 sm:px-6 py-2 rounded-lg text-center font-medium text-sm sm:text-base">
                  ⚠️ 暂无数据可导出
                </div>
                <p className="text-xs text-gray-400 mt-1 text-center">
                  请调整日期范围或先录入数据
                </p>
              </div>
            ) : (
              <button
                onClick={handleExport}
                disabled={loading || filteredData.length === 0}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm sm:text-base flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    导出中...
                  </>
                ) : (
                  <>
                    📤 导出数据 ({filteredData.length} 条)
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 数据预览 */}
      {dataLoading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredData.length > 0 ? (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 px-6 py-4">
            <h3 className="text-xl font-semibold text-white">
              {startDate === endDate ? `${startDate} 数据预览` : `${startDate} 至 ${endDate} 数据预览`} ({filteredData.length} 条记录)
            </h3>
          </div>

          {/* 汇总信息 */}
          <div className="p-4 sm:p-6 bg-gray-50 border-b">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-blue-600">
                  ${filteredData.reduce((sum, item) => sum + parseFloat(item.creditCardAmount), 0).toLocaleString()}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">总信用卡金额</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-purple-600">
                  ${filteredData.reduce((sum, item) => sum + parseFloat(item.adSpend), 0).toLocaleString()}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">总广告花费</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-green-600">
                  {filteredData.reduce((sum, item) => sum + parseInt(item.creditCardOrders), 0)}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">总订单数</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-yellow-600">
                  ${filteredData.reduce((sum, item) => sum + parseFloat(item.rechargeAmount), 0).toLocaleString()}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">总充值金额</div>
              </div>
            </div>
          </div>

          {/* 详细数据表格 */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">日期</th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">投放人员</th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">广告账户</th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">广告花费</th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">信用卡金额</th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">支付信息</th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">订单数</th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">充值金额</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900">{item.date}</td>
                    <td className="px-2 sm:px-4 py-3">
                      <div className="flex items-center">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-xs sm:text-sm">
                          {item.advertiser}
                        </div>
                        <span className="ml-2 font-medium text-xs sm:text-sm">{item.advertiser}</span>
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-3 font-mono text-xs sm:text-sm hidden sm:table-cell">{item.accountName}</td>
                    <td className="px-2 sm:px-4 py-3 font-semibold text-purple-600 text-xs sm:text-sm">${item.adSpend}</td>
                    <td className="px-2 sm:px-4 py-3 font-semibold text-blue-600 text-xs sm:text-sm">${item.creditCardAmount}</td>
                    <td className="px-2 sm:px-4 py-3 text-center font-medium text-xs sm:text-sm hidden lg:table-cell">{item.paymentInfoCount}</td>
                    <td className="px-2 sm:px-4 py-3 text-center font-medium text-xs sm:text-sm hidden lg:table-cell">{item.creditCardOrders}</td>
                    <td className="px-2 sm:px-4 py-3 font-semibold text-yellow-600 text-xs sm:text-sm hidden sm:table-cell">${item.rechargeAmount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : previewData.length > 0 && filteredData.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
          <div className="text-yellow-600 text-lg font-medium mb-2">📅 所选日期范围内无数据</div>
          <p className="text-yellow-700">请调整日期范围或检查是否有相应日期的数据记录。</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 shadow-lg text-center">
          <div className="text-gray-500 text-lg">暂无数据</div>
          <div className="text-gray-400 text-sm mt-2">请先在"广告数据录入"中添加数据，然后点击刷新按钮</div>
        </div>
      )}

      {/* 导出说明 */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-blue-800 mb-3">📋 导出说明</h4>
        <div className="text-blue-700 space-y-2">
          <p>• <strong>CSV格式</strong>: 适合Excel等表格软件打开，包含所有字段的详细数据</p>
          <p>• <strong>Excel格式</strong>: CSV格式，可直接用Excel打开</p>
          <p>• <strong>JSON格式</strong>: 适合程序处理，包含结构化数据</p>
          <p>• 导出字段包括：日期、投放人员、广告账户名称、广告账户ID、充值金额、信用卡收款金额、添加支付信息数量、信用卡订单数量、单次添加支付信息成本、单次订单购买成本</p>
          <p>• 数据来源：Supabase云数据库实时同步</p>
        </div>
      </div>
    </div>
  );
};

export default DataExport;