import React, { useState, useEffect } from 'react';
import { adDataService } from '../utils/supabase';

const AdDataEntry = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null); // 编辑状态
  const [adData, setAdData] = useState({
    adSpend: '',
    creditCardOrders: '',
    paymentInfoCount: '',
    orderCount: ''
  });
  const [entries, setEntries] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 投放人员列表
  const staffList = [
    '青',
    '乔',
    '白',
    '丁',
    '妹'
  ];

  useEffect(() => {
    // 从Supabase加载数据
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const data = await adDataService.getAll();
      // 转换数据格式以匹配前端期望的格式
      const formattedData = data.map(entry => ({
        id: entry.id,
        date: entry.date,
        staff: entry.staff,
        adSpend: entry.ad_spend,                        // 广告花费
        creditCardOrders: entry.credit_card_amount,     // 信用卡收款金额(MX$)
        paymentInfoCount: entry.payment_info_count,     // 支付信息数量  
        orderCount: entry.credit_card_orders,           // 信用卡订单数量
        timestamp: entry.created_at
      }));
      setEntries(formattedData);
    } catch (error) {
      console.error('加载数据失败:', error);
      alert('加载数据失败，请刷新页面重试');
    }
  };

  const handleStartEntry = () => {
    if (!selectedDate || !selectedStaff) {
      alert('请选择日期和投放人员');
      return;
    }
    setShowEntryForm(true);
    setAdData({
      adSpend: '',
      creditCardOrders: '',
      paymentInfoCount: '',
      orderCount: ''
    });
  };

  const handleInputChange = (field, value) => {
    setAdData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!adData.adSpend || !adData.creditCardOrders || !adData.paymentInfoCount || !adData.orderCount) {
      alert('请填写所有字段');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const entryData = {
        date: selectedDate,
        staff: selectedStaff,
        adSpend: parseFloat(adData.adSpend),
        creditCardOrders: parseFloat(adData.creditCardOrders),
        paymentInfoCount: parseInt(adData.paymentInfoCount),
        orderCount: parseInt(adData.orderCount)
      };

      // 如果是编辑模式，添加ID
      if (editingEntry) {
        entryData.id = editingEntry.id;
      }

      await adDataService.upsert(entryData);
      
      // 重新加载数据
      await loadEntries();

      // 重置表单
      setAdData({
        adSpend: '',
        creditCardOrders: '',
        paymentInfoCount: '',
        orderCount: ''
      });
      setShowEntryForm(false);
      setEditingEntry(null);
      
      const message = editingEntry ? '数据更新成功！' : '数据录入成功！';
      alert(message);
    } catch (error) {
      console.error('保存数据失败:', error);
      alert('保存数据失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEntry = async (id) => {
    if (confirm('确定要删除这条记录吗？')) {
      try {
        await adDataService.delete(id);
        await loadEntries(); // 重新加载数据
        alert('删除成功！');
      } catch (error) {
        console.error('删除失败:', error);
        alert('删除失败，请重试');
      }
    }
  };

  // 开始编辑数据
  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setSelectedDate(entry.date);
    setSelectedStaff(entry.staff);
    setAdData({
      adSpend: entry.adSpend.toString(),
      creditCardOrders: entry.creditCardOrders.toString(),
      paymentInfoCount: entry.paymentInfoCount.toString(),
      orderCount: entry.orderCount.toString()
    });
    setShowEntryForm(true);
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingEntry(null);
    setShowEntryForm(false);
    setAdData({
      adSpend: '',
      creditCardOrders: '',
      paymentInfoCount: '',
      orderCount: ''
    });
  };

  const filteredEntries = entries.filter(entry => {
    if (selectedDate && entry.date !== selectedDate) return false;
    if (selectedStaff && entry.staff !== selectedStaff) return false;
    return true;
  });

  const totalStats = filteredEntries.reduce((acc, entry) => ({
    adSpend: acc.adSpend + entry.adSpend,
    creditCardOrders: acc.creditCardOrders + entry.creditCardOrders,
    paymentInfoCount: acc.paymentInfoCount + entry.paymentInfoCount,
    orderCount: acc.orderCount + entry.orderCount
  }), { adSpend: 0, creditCardOrders: 0, paymentInfoCount: 0, orderCount: 0 });

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">广告数据录入</h1>
          <p className="text-gray-600">记录每日广告投放数据和业绩指标</p>
        </div>

        {/* 筛选器 */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">数据筛选与录入</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* 日期选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">选择日期</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* 投放人员选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">投放人员</label>
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">请选择投放人员</option>
                {staffList.map(staff => (
                  <option key={staff} value={staff}>{staff}</option>
                ))}
              </select>
            </div>

            {/* 开始录入按钮 */}
            <div className="flex items-end">
              <button
                onClick={handleStartEntry}
                disabled={!selectedDate || !selectedStaff}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                开始录入数据
              </button>
            </div>
          </div>
        </div>

        {/* 数据录入表单 */}
        {showEntryForm && (
          <div className="bg-blue-50 rounded-2xl p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {editingEntry ? '编辑数据' : '数据录入'} - {selectedDate} - {selectedStaff}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* 当日广告花费金额 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  当日广告花费金额 (美元)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500 font-semibold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={adData.adSpend}
                    onChange={(e) => handleInputChange('adSpend', e.target.value)}
                    className="w-full p-3 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* 当日信用卡订单金额 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  当日信用卡订单金额 (MX$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="请输入信用卡订单金额"
                  value={adData.creditCardOrders}
                  onChange={(e) => handleInputChange('creditCardOrders', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* 当日添加支付信息数量 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  当日添加支付信息数量
                </label>
                <input
                  type="number"
                  placeholder="请输入添加支付信息数量"
                  value={adData.paymentInfoCount}
                  onChange={(e) => handleInputChange('paymentInfoCount', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* 当日订单数量 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  当日订单数量
                </label>
                <input
                  type="number"
                  placeholder="请输入当日订单数量"
                  value={adData.orderCount}
                  onChange={(e) => handleInputChange('orderCount', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-semibold"
              >
                {isSubmitting ? (
                  editingEntry ? '更新中...' : '提交中...'
                ) : (
                  editingEntry ? '更新数据' : '提交数据'
                )}
              </button>
              <button
                onClick={handleCancelEdit}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors font-semibold"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 统计概览 */}
        {filteredEntries.length > 0 && (
          <div className="bg-gray-50 rounded-2xl p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">统计概览</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-red-600">${totalStats.adSpend.toFixed(2)}</div>
                <div className="text-sm text-gray-600">总广告花费 (美元)</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-600">MX${totalStats.creditCardOrders.toFixed(2)}</div>
                <div className="text-sm text-gray-600">信用卡订单总额</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{totalStats.paymentInfoCount}</div>
                <div className="text-sm text-gray-600">添加支付信息总数</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{totalStats.orderCount}</div>
                <div className="text-sm text-gray-600">订单总数</div>
              </div>
            </div>
          </div>
        )}

        {/* 数据记录表格 */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              数据记录 ({filteredEntries.length}条)
            </h3>
          </div>

          {filteredEntries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-lg overflow-hidden shadow-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">日期</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">投放人员</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">广告花费 ($)</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">信用卡订单金额 (MX$)</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">添加支付信息数量</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">订单数量</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.staff}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">${entry.adSpend.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">{entry.creditCardOrders.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">{entry.paymentInfoCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-semibold">{entry.orderCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleEditEntry(entry)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">暂无数据记录</h3>
              <p className="mt-1 text-sm text-gray-500">请选择日期和投放人员开始录入数据</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdDataEntry;