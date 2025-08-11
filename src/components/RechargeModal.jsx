import React, { useState } from 'react';
import { rechargeOperationsService } from '../services/accountManagementService';
import { X, DollarSign, Loader2 } from 'lucide-react';

const RechargeModal = ({ isOpen, onClose, onSuccess, account }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !account) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setError('请输入有效的充值金额');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // 检查当天该账户的充值次数
      const todayOperations = await rechargeOperationsService.getTodayOperations();
      const todayRecharges = todayOperations.filter(operation => 
        operation.account_id === account.id
      );
      const rechargeCount = todayRecharges.length + 1; // 加1因为这是即将要添加的充值
      
      // 生成描述，包含充值次数信息
      const operatorName = account.personnel_name || '未知操作员';
      let description;
      if (rechargeCount === 1) {
        description = `充值 $${parseFloat(amount).toFixed(2)} - ${account.account_name} (${operatorName})`;
      } else if (rechargeCount === 2) {
        description = `补充充值二次 $${parseFloat(amount).toFixed(2)} - ${account.account_name} (${operatorName})`;
      } else if (rechargeCount === 3) {
        description = `补充充值三次 $${parseFloat(amount).toFixed(2)} - ${account.account_name} (${operatorName})`;
      } else {
        description = `补充充值第${rechargeCount}次 $${parseFloat(amount).toFixed(2)} - ${account.account_name} (${operatorName})`;
      }

      // 确保所有必需的字段都有值
      const personnelId = account.personnel_id || null;
      const adAccountId = account.ad_account_id || account.account_id || 'N/A';
      const accountName = account.account_name || 'Unknown Account';
      
      await rechargeOperationsService.create({
        accountId: account.id,
        personnelId: personnelId,
        accountName: accountName,
        adAccountId: adAccountId,
        amount: parseFloat(amount),
        operatorName: operatorName,
        description: description
      });
      
      console.log('充值操作已创建，正在触发刷新...');

      // 重置表单
      setAmount('');
      
      // 先关闭模态框，再调用成功回调
      onClose();
      
      // 延迟调用成功回调，避免状态冲突
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 50);
    } catch (error) {
      console.error('充值失败:', error);
      let errorMessage = '充值失败，请重试';
      
      if (error.message) {
        if (error.message.includes('personnel_id')) {
          errorMessage = '账户信息不完整，请联系管理员';
        } else if (error.message.includes('duplicate')) {
          errorMessage = '充值记录重复，请检查后重试';
        } else if (error.message.includes('network')) {
          errorMessage = '网络连接失败，请检查网络后重试';
        } else {
          errorMessage = `充值失败: ${error.message}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white border border-gray-200 rounded-xl p-4 lg:p-6 w-full max-w-md mx-auto shadow-lg transform transition-all max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
            <h3 className="text-2xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              账户充值
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-100/50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Account Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">账户名称：</span>
              <span className="text-gray-800 font-bold">{account.account_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">广告账户ID：</span>
              <span className="text-gray-800 font-mono bg-white/70 px-2 py-1 rounded text-sm">{account.ad_account_id}</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              充值金额 (美元)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-600 font-bold">
                <DollarSign size={18} />
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
                placeholder="0.00"
                className="w-full bg-white text-gray-800 rounded-lg pl-12 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none border border-gray-300 hover:border-blue-400 transition-colors font-mono text-lg"
                required
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white hover:bg-gray-50 text-gray-700 py-3 px-6 rounded-lg font-semibold transition-colors border border-gray-300 hover:border-gray-400"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="animate-spin mr-2" size={18} />
                  提交中...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <DollarSign className="mr-2" size={18} />
                  提交充值
                </div>
              )}
            </button>
          </div>
        </form>

        {/* Preview */}
        {amount && !isNaN(amount) && parseFloat(amount) > 0 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-700 font-bold mb-3 flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              公屏显示预览
            </p>
            <p className="text-gray-700 font-mono bg-white px-3 py-2 rounded text-sm">
              账户：{account.account_name}  Ad account ID: {account.ad_account_id} 充值 ${parseFloat(amount).toFixed(2)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RechargeModal;