import React, { useState, useEffect } from 'react';
import { rechargeService } from '../data/supabaseService';

const RechargeHistory = () => {
  const [rechargeHistory, setRechargeHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadRechargeHistory = async () => {
    setLoading(true);
    try {
      const data = await rechargeService.getRechargeRecords();
      console.log('充值历史数据:', data);
      setRechargeHistory(data);
    } catch (error) {
      console.error('Error loading recharge history:', error);
      alert('加载充值历史失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRechargeHistory();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const formatCurrency = (amount, currency) => {
    return `${amount.toLocaleString()} ${currency}`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">充值记录</h2>
        <button
          onClick={loadRechargeHistory}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? '刷新中...' : '刷新'}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      ) : rechargeHistory.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          暂无充值记录
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  充值时间
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  账户名称
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  账户ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  充值金额
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  USD金额
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  描述
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  充值后余额
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rechargeHistory.map((record, index) => (
                <tr key={record.id || index} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                    {formatDate(record.created_at)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                    {record.app_5c098b55fc88465db9b331c43b51ef43_advertising_accounts?.account_name || '未知账户'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 border-b">
                    {record.account_id}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-green-600 border-b">
                    {formatCurrency(record.amount, record.currency)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                    ${record.usd_amount?.toLocaleString() || 0}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 border-b max-w-xs truncate">
                    {record.description}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600 border-b">
                    ${record.new_balance?.toLocaleString() || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        共 {rechargeHistory.length} 条记录
      </div>
    </div>
  );
};

export default RechargeHistory;