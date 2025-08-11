import React, { useState, useEffect } from 'react';
import { adService } from '../data/supabaseService';

const AdvertisingDataInput = () => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    advertiser: '青',
    account_name: '',
    account_id: '',
    ad_spend: '',
    credit_card_amount: '',
    payment_info_count: '',
    credit_card_orders: ''
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [dataCount, setDataCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const advertisers = ['青', '乔', '白', '丁', '妹'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 验证必填字段
    if (!formData.ad_spend || !formData.credit_card_amount) {
      alert('请填写广告花费和信用卡收款金额！');
      return;
    }

    setLoading(true);
    try {
      // 转换数据类型
      const dataToSubmit = {
        date: formData.date,
        advertiser: formData.advertiser,
        account_name: formData.account_name || '',
        account_id: formData.account_id || '',
        ad_spend: parseFloat(formData.ad_spend) || 0,
        credit_card_amount: parseFloat(formData.credit_card_amount) || 0,
        payment_info_count: parseInt(formData.payment_info_count) || 0,
        credit_card_orders: parseInt(formData.credit_card_orders) || 0
      };

      // 添加数据到Supabase
      await adService.addAdData(dataToSubmit);
      
      // 更新数据计数
      await loadDataCount();

      // 显示成功消息
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      // 重置表单（保留日期和投放人员）
      setFormData({
        date: formData.date,
        advertiser: formData.advertiser,
        account_name: '',
        account_id: '',
        ad_spend: '',
        credit_card_amount: '',
        payment_info_count: '',
        credit_card_orders: ''
      });
    } catch (error) {
      console.error('Error submitting data:', error);
      alert(`数据提交失败: ${error.message || '请重试！'}`);
    } finally {
      setLoading(false);
    }
  };

  const loadDataCount = async () => {
    try {
      const data = await adService.getAdData();
      setDataCount(data.length);
    } catch (error) {
      console.error('Error loading data count:', error);
      setDataCount(0);
    }
  };

  useEffect(() => {
    loadDataCount();
  }, []);

  const handleRefresh = () => {
    loadDataCount();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">广告数据录入</h2>
          <p className="text-gray-600">录入广告投放相关数据</p>
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

        </div>
      </div>

      {/* 成功提示 */}
      {showSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
          ✅ 广告数据录入成功！
        </div>
      )}

      {/* 广告数据录入表单 */}
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

            {/* 广告账户名称 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                广告账户名称
              </label>
              <input
                type="text"
                name="account_name"
                value={formData.account_name}
                onChange={handleInputChange}
                placeholder="例如: 青账户"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* 广告账户ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                广告账户ID
              </label>
              <input
                type="text"
                name="account_id"
                value={formData.account_id}
                onChange={handleInputChange}
                placeholder="例如: FB_12345"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* 广告花费 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                广告花费 ($) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="ad_spend"
                value={formData.ad_spend}
                onChange={handleInputChange}
                placeholder="例如: 1500"
                min="0"
                step="0.01"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* 信用卡收款金额 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                信用卡收款金额 (MX$) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="credit_card_amount"
                value={formData.credit_card_amount}
                onChange={handleInputChange}
                placeholder="例如: 2500"
                min="0"
                step="0.01"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* 添加支付信息数量 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                添加支付信息数量
              </label>
              <input
                type="number"
                name="payment_info_count"
                value={formData.payment_info_count}
                onChange={handleInputChange}
                placeholder="例如: 12"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* 信用卡订单数量 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                信用卡订单数量
              </label>
              <input
                type="number"
                name="credit_card_orders"
                value={formData.credit_card_orders}
                onChange={handleInputChange}
                placeholder="例如: 15"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="flex justify-center pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-sm sm:text-lg flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  提交中...
                </>
              ) : (
                <>
                  📝 录入广告数据
                </>
              )}
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
              <li>• 广告花费：当日广告支出（美元）</li>
              <li>• 信用卡收款金额：信用卡收款金额（美元）</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">可选字段：</h4>
            <ul className="space-y-1">
              <li>• 广告账户名称：账户显示名称</li>
              <li>• 广告账户ID：账户唯一标识</li>
              <li>• 添加支付信息数量：支付信息条数</li>
              <li>• 信用卡订单数量：完成订单数量</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
          <p className="text-yellow-800 text-sm">
            💡 <strong>提示：</strong>此页面专门用于录入广告投放相关数据，包括广告花费、收款金额等。充值操作请前往"充值录入"页面。
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdvertisingDataInput;