import React, { useState, useEffect } from 'react';
import { dailyOrderService } from '../data/supabaseService';

const DailyOrders = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [exchangeRate, setExchangeRate] = useState(20.0); // MX$ to USD 汇率
  const [loading, setLoading] = useState(false);
  const [orderHistory, setOrderHistory] = useState([]);
  const [dailyStats, setDailyStats] = useState({});
  
  // 录入相关状态
  const [newCardAmount, setNewCardAmount] = useState('');
  const [oldCardAmount, setOldCardAmount] = useState('');
  const [description, setDescription] = useState('');

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const orders = await dailyOrderService.getDailyOrders();
      setOrderHistory(orders);
      calculateDailyStats(orders);
    } catch (error) {
      console.error('加载数据失败:', error);
      alert('加载数据失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 计算每日统计
  const calculateDailyStats = (orders) => {
    const dailyOrders = orders.filter(order => order.date === selectedDate);
    
    const newCardTotal = dailyOrders.reduce((sum, order) => sum + parseFloat(order.new_card_amount || 0), 0);
    const oldCardTotal = dailyOrders.reduce((sum, order) => sum + parseFloat(order.old_card_amount || 0), 0);
    const newCardCount = dailyOrders.filter(order => parseFloat(order.new_card_amount || 0) > 0).length;
    const oldCardCount = dailyOrders.filter(order => parseFloat(order.old_card_amount || 0) > 0).length;
    
    const stats = {
      new_card: {
        count: newCardCount,
        amount: newCardTotal,
        usd_amount: newCardTotal / exchangeRate
      },
      old_card: {
        count: oldCardCount,
        amount: oldCardTotal,
        usd_amount: oldCardTotal / exchangeRate
      },
      total: {
        amount: newCardTotal + oldCardTotal,
        usd_amount: (newCardTotal + oldCardTotal) / exchangeRate,
        record_count: dailyOrders.length
      }
    };
    
    setDailyStats(stats);
  };

  // 添加订单记录
  const handleAddOrder = async () => {
    if (!newCardAmount && !oldCardAmount) {
      alert('请至少输入一项金额');
      return;
    }

    try {
      const orderData = {
        date: selectedDate,
        new_card_amount: parseFloat(newCardAmount || 0),
        old_card_amount: parseFloat(oldCardAmount || 0),
        exchange_rate: exchangeRate,
        description: description || `${selectedDate} 上单记录`,
        created_at: new Date().toISOString()
      };

      await dailyOrderService.addDailyOrder(orderData);
      
      alert('添加成功！');
      setNewCardAmount('');
      setOldCardAmount('');
      setDescription('');
      loadData();
    } catch (error) {
      console.error('添加失败:', error);
      alert('添加失败，请重试');
    }
  };

  // 删除记录
  const handleDeleteOrder = async (orderId) => {
    if (!confirm('确定要删除这条记录吗？')) {
      return;
    }

    try {
      await dailyOrderService.deleteDailyOrder(orderId);
      alert('删除成功！');
      loadData();
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请重试');
    }
  };

  // 筛选当日记录
  const getFilteredOrders = () => {
    return orderHistory.filter(order => order.date === selectedDate);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (orderHistory.length > 0) {
      calculateDailyStats(orderHistory);
    }
  }, [selectedDate, exchangeRate, orderHistory]);

  const formatCurrency = (amount, currency = 'MX$') => {
    return `${currency}${parseFloat(amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const filteredOrders = getFilteredOrders();

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">💰 每日上单金额管理</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">选择日期：</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">MX$ 汇率 (对USD)：</label>
            <input
              type="number"
              step="0.01"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 20.0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="如: 20.00"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={loadData}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? '刷新中...' : '刷新数据'}
            </button>
          </div>
        </div>
      </div>

      {/* 数据录入 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">📝 录入上单金额</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">新卡金额 (MX$)</label>
            <input
              type="number"
              step="0.01"
              value={newCardAmount}
              onChange={(e) => setNewCardAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入新卡金额"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">老卡金额 (MX$)</label>
            <input
              type="number"
              step="0.01"
              value={oldCardAmount}
              onChange={(e) => setOldCardAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入老卡金额"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="备注信息"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">USD 等值</label>
            <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
              ${((parseFloat(newCardAmount || 0) + parseFloat(oldCardAmount || 0)) / exchangeRate).toFixed(2)}
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleAddOrder}
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              确认录入
            </button>
          </div>
        </div>
      </div>

      {/* 每日统计 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          📊 {selectedDate} 上单统计
        </h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">加载中...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 新卡统计 */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">💳 新卡</h3>
                <p className="text-2xl font-bold text-blue-600 mb-1">
                  {dailyStats.new_card?.count || 0} 单
                </p>
                <p className="text-xl font-semibold text-blue-600 mb-1">
                  {formatCurrency(dailyStats.new_card?.amount || 0)}
                </p>
                <p className="text-sm text-blue-500">
                  (${(dailyStats.new_card?.usd_amount || 0).toFixed(2)} USD)
                </p>
              </div>
            </div>

            {/* 老卡统计 */}
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-purple-800 mb-2">🎯 老卡</h3>
                <p className="text-2xl font-bold text-purple-600 mb-1">
                  {dailyStats.old_card?.count || 0} 单
                </p>
                <p className="text-xl font-semibold text-purple-600 mb-1">
                  {formatCurrency(dailyStats.old_card?.amount || 0)}
                </p>
                <p className="text-sm text-purple-500">
                  (${(dailyStats.old_card?.usd_amount || 0).toFixed(2)} USD)
                </p>
              </div>
            </div>

            {/* 总计统计 */}
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-green-800 mb-2">📈 总计</h3>
                <p className="text-2xl font-bold text-green-600 mb-1">
                  {dailyStats.total?.record_count || 0} 条记录
                </p>
                <p className="text-xl font-semibold text-green-600 mb-1">
                  {formatCurrency(dailyStats.total?.amount || 0)}
                </p>
                <p className="text-sm text-green-500">
                  (${(dailyStats.total?.usd_amount || 0).toFixed(2)} USD)
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 详细记录 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          📋 {selectedDate} 详细记录 ({filteredOrders.length} 条)
        </h2>
        
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            该日期暂无上单记录
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    时间
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    新卡金额
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    老卡金额
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    总计 (MX$)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    USD 等值
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    描述
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((record, index) => (
                  <tr key={record.id || index} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                      {formatDate(record.created_at)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600 border-b">
                      {formatCurrency(record.new_card_amount)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-purple-600 border-b">
                      {formatCurrency(record.old_card_amount)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-green-600 border-b">
                      {formatCurrency(parseFloat(record.new_card_amount || 0) + parseFloat(record.old_card_amount || 0))}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-b">
                      ${((parseFloat(record.new_card_amount || 0) + parseFloat(record.old_card_amount || 0)) / (record.exchange_rate || exchangeRate)).toFixed(2)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 border-b max-w-xs truncate">
                      {record.description}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm border-b">
                      <button
                        onClick={() => handleDeleteOrder(record.id)}
                        className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                        title="删除记录"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyOrders;