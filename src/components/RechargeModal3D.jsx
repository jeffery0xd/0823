import React, { useState } from 'react';
import { supabase } from '../utils/supabase';

const RechargeModal = ({ account, onClose }) => {
  const [amount, setAmount] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!amount || !operatorName) {
      setError('请填写所有必填项');
      return;
    }

    if (isNaN(amount) || parseFloat(amount) <= 0) {
      setError('请输入有效的充值金额');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // 插入充值记录
      const { error: insertError } = await supabase
        .from('app_e87b41cfe355428b8146f8bae8184e10_recharge_operations')
        .insert({
          account_id: account.id,
          personnel_id: account.staffInfo.id,
          account_name: account.account_name,
          ad_account_id: account.ad_account_id,
          amount: parseFloat(amount),
          operator_name: operatorName
        });

      if (insertError) throw insertError;

      // 成功后关闭弹窗
      onClose();
    } catch (error) {
      console.error('充值操作失败:', error);
      setError('充值操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        
        {/* 头部 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                账户充值
              </h3>
              <p className="text-gray-600 text-sm">
                {account.staffInfo.name} - {account.account_name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 账户信息 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-gray-900 font-medium mb-3">账户信息</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">投放人员:</span>
                <span className="text-gray-900 font-medium">{account.staffInfo.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">账户名称:</span>
                <span className="text-gray-900">{account.account_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">广告账户ID:</span>
                <span className="text-gray-900 font-mono text-xs">{account.ad_account_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">账户状态:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  account.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {account.status === 'active' ? '活跃' : '非活跃'}
                </span>
              </div>
            </div>
          </div>

          {/* 充值金额 */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              充值金额 *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="请输入充值金额"
                step="0.01"
                min="0"
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg 
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                           transition-all duration-200"
                required
              />
            </div>
            <p className="text-gray-500 text-xs mt-1">
              请输入需要充值的金额（美元），支持小数
            </p>
          </div>

          {/* 操作人 */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              操作人姓名 *
            </label>
            <input
              type="text"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              placeholder="请输入操作人姓名"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         transition-all duration-200"
              required
            />
            <p className="text-gray-500 text-xs mt-1">
              请输入执行此次充值操作的人员姓名
            </p>
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg 
                         hover:bg-gray-50 transition-colors duration-200 font-medium"
              disabled={loading}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 
                         disabled:opacity-50 text-white rounded-lg transition-colors duration-200 
                         font-medium flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  充值中...
                </>
              ) : (
                '确认充值'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RechargeModal;