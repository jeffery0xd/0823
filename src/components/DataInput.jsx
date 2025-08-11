import React, { useState, useEffect } from 'react';
import { addAdvertisingData, clearAllData, mockAdvertisingData, reloadData } from '../data/advertisingData';
import { accountService, advertisingDataService } from '../data/supabaseService';

const DataInput = () => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    advertiser: '青',
    adAccountId: '',
    adSpend: '',
    creditCardAmount: '',
    paymentInfoCount: '',
    orderCount: '',
    rechargeAmount: ''
  });

  const [accounts, setAccounts] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [dataCount, setDataCount] = useState(mockAdvertisingData.length);

  const advertisers = ['青', '乔', '白', '丁', '妹'];

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const accountsData = await accountService.getAccounts();
      setAccounts(accountsData);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 验证必填字段
    if (!formData.adAccountId || !formData.adSpend || !formData.creditCardAmount) {
      alert('请填写所有必填字段！');
      return;
    }

    // 转换数据类型
    const dataToSubmit = {
      ...formData,
      adSpend: parseFloat(formData.adSpend) || 0,
      creditCardAmount: parseFloat(formData.creditCardAmount) || 0,
      paymentInfoCount: parseInt(formData.paymentInfoCount) || 0,
      orderCount: parseInt(formData.orderCount) || 0,
      rechargeAmount: parseFloat(formData.rechargeAmount) || 0
    };

    // 添加数据
    addAdvertisingData(dataToSubmit);
    setDataCount(mockAdvertisingData.length);

    // 显示成功消息
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);

    // 重置表单（保留日期和投放人员）
    setFormData({
      ...formData,
      adAccountId: '',
      adSpend: '',
      creditCardAmount: '',
      paymentInfoCount: '',
      orderCount: '',
      rechargeAmount: ''
    });
  };

  const handleClearAll = () => {
    if (window.confirm('确定要清空所有数据吗？此操作不可撤销！')) {
      clearAllData();
      setDataCount(0);
      alert('所有数据已清空！');
    }
  };

  const handleRefresh = () => {
    reloadData();
    setDataCount(mockAdvertisingData.length);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">数据录入</h2>
          <p className="text-gray-600">录入新的广告投放数据</p>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="text-sm text-gray-600">
            当前数据条数: <span className="font-semibold text-blue-600">{dataCount}</span>
          </div>
          <button
            onClick={handleRefresh}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm"
          >
            🔄 刷新
          </button>
          <button
            onClick={handleClearAll}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm"
          >
            🗑️ 清空数据
          </button>
        </div>
      </div>

      {/* 成功提示 */}
      {showSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
          ✅ 数据录入成功！
        </div>
      )}

      {/* 数据录入表单 */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* 日期 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* 投放人员 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                投放人员 <span className="text-red-500">*</span>
              </label>
              <select
                name="advertiser"
                value={formData.advertiser}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {advertisers.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            {/* 广告账户 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                广告账户 <span className="text-red-500">*</span>
              </label>
              <select
                name="adAccountId"
                value={formData.adAccountId}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">选择广告账户</option>
                {accounts.map(account => (
                  <option key={account.account_id} value={account.account_id}>
                    {account.account_name} ({account.account_id})
                  </option>
                ))}
                {/* 临时兼容选项 */}
                <option value="FB_TEMP">临时账户 (FB_TEMP)</option>
              </select>
            </div>

            {/* 广告花费 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                广告花费 (USD) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="adSpend"
                value={formData.adSpend}
                onChange={handleInputChange}
                placeholder="例如: 1500"
                min="0"
                step="0.01"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* 信用卡金额 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                信用卡金额 (MX$) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="creditCardAmount"
                value={formData.creditCardAmount}
                onChange={handleInputChange}
                placeholder="例如: 45000"
                min="0"
                step="0.01"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* 支付信息数量 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                支付信息数量
              </label>
              <input
                type="number"
                name="paymentInfoCount"
                value={formData.paymentInfoCount}
                onChange={handleInputChange}
                placeholder="例如: 12"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* 订单数量 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                订单数量
              </label>
              <input
                type="number"
                name="orderCount"
                value={formData.orderCount}
                onChange={handleInputChange}
                placeholder="例如: 15"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* 充值金额 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                充值金额 (USD)
              </label>
              <input
                type="number"
                name="rechargeAmount"
                value={formData.rechargeAmount}
                onChange={handleInputChange}
                placeholder="例如: 2000"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="flex justify-center pt-4">
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold text-sm sm:text-lg"
            >
              📝 录入数据
            </button>
          </div>
        </form>
      </div>

      {/* 使用说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">📋 使用说明</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
          <div>
            <h4 className="font-medium mb-2">必填字段：</h4>
            <ul className="space-y-1">
              <li>• 日期：数据统计日期</li>
              <li>• 投放人员：选择对应的投放人员</li>
              <li>• 广告账户ID：Facebook广告账户标识</li>
              <li>• 广告花费：当日广告支出（美元）</li>
              <li>• 信用卡金额：信用卡消费金额（墨西哥比索）</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">可选字段：</h4>
            <ul className="space-y-1">
              <li>• 支付信息数量：支付信息条数</li>
              <li>• 订单数量：完成订单数量</li>
              <li>• 充值金额：账户充值金额（美元）</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
          <p className="text-yellow-800 text-sm">
            💡 <strong>提示：</strong>数据会自动保存到浏览器本地存储，关闭浏览器后数据仍会保留。点击"清空数据"可以删除所有数据重新开始。
          </p>
        </div>
      </div>
    </div>
  );
};

export default DataInput;