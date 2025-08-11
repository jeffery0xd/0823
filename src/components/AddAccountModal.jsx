import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import { X, Plus, Loader2 } from 'lucide-react';

const AddAccountModal = ({ isOpen, onClose, onSuccess, staffId, staffName }) => {
  const [formData, setFormData] = useState({
    accountName: '',
    adAccountId: '',
    status: 'Active'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.accountName.trim()) {
      setError('请输入账户名称');
      return;
    }

    if (!formData.adAccountId.trim()) {
      setError('请输入广告账户ID');
      return;
    }

    // 检查广告账户ID格式
    if (!/^\d+$/.test(formData.adAccountId.trim())) {
      setError('广告账户ID只能包含数字');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // 检查广告账户ID是否已存在（只检查当前使用的新表）
      const { data: existingNewAccount, error: checkNewError } = await supabase
        .from('app_e87b41cfe355428b8146f8bae8184e10_account_management_ads')
        .select('id, account_name, personnel_id')
        .eq('ad_account_id', formData.adAccountId.trim())
        .single();

      if (checkNewError && checkNewError.code !== 'PGRST116') {
        throw checkNewError;
      }

      // 检查新表中的重复 - 这是真正的冲突
      if (existingNewAccount) {
        // 如果找到重复账户，获取人员信息
        let personName = '未知人员';
        if (existingNewAccount.personnel_id) {
          try {
            const { data: personData } = await supabase
              .from('app_e87b41cfe355428b8146f8bae8184e10_personnel')
              .select('name')
              .eq('id', existingNewAccount.personnel_id)
              .single();
            if (personData) {
              personName = personData.name;
            }
          } catch (error) {
            console.log('获取人员信息失败:', error);
          }
        }
        setError(`该广告账户ID已存在！已被 "${personName}" 的账户 "${existingNewAccount.account_name}" 使用。请检查ID是否正确或使用其他ID。`);
        return;
      }

      // 可选：检查历史数据表（但不阻止添加）
      // 这里可以添加一个警告提示，但允许用户继续添加
      let hasHistoryWarning = false;
      try {
        const { data: oldData, error: checkOldError } = await supabase
          .from('app_5c098b55fc88465db9b331c43b51ef43_advertising_accounts')
          .select('id, account_name, account_id')
          .eq('account_id', formData.adAccountId.trim())
          .single();

        if (oldData && !checkOldError) {
          // 发现历史数据，但不阻止添加，只是记录日志
          console.log(`发现历史账户数据: ${oldData.account_name}，继续添加新账户`);
          hasHistoryWarning = true;
        }
      } catch (error) {
        // 历史数据查询失败时，忽略错误继续添加
        console.log('历史数据查询失败，继续添加流程:', error);
      }

      // 插入新账户
      const { error: insertError } = await supabase
        .from('app_e87b41cfe355428b8146f8bae8184e10_account_management_ads')
        .insert({
          personnel_id: staffId,
          account_name: formData.accountName.trim(),
          ad_account_id: formData.adAccountId.trim(),
          status: formData.status
        });

      if (insertError) throw insertError;

      // 重置表单
      setFormData({
        accountName: '',
        adAccountId: '',
        status: 'Active'
      });
      
      // 调用成功回调
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('添加账户失败:', error);
      setError('添加账户失败: ' + (error.message || '请重试'));
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
      className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="backdrop-blur-xl bg-white/95 border border-white/30 rounded-2xl p-6 lg:p-8 w-full max-w-md mx-auto shadow-2xl shadow-indigo-100/50 transform transition-all max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
            <h3 className="text-2xl font-bold text-gray-800 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              添加新账户
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-100/50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Staff Info */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-5 mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">{staffName.charAt(0)}</span>
            </div>
            <div>
              <p className="text-gray-800 font-bold text-lg">{staffName}</p>
              <p className="text-indigo-600 text-sm font-medium">为该投放人员添加新账户</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              账户名称
            </label>
            <input
              type="text"
              value={formData.accountName}
              onChange={(e) => handleInputChange('accountName', e.target.value)}
              placeholder="请输入账户名称，如：Facebook-主账户"
              className="w-full bg-white/70 text-gray-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none border border-gray-200 hover:border-indigo-300 transition-all backdrop-blur-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              广告账户ID
            </label>
            <input
              type="text"
              value={formData.adAccountId}
              onChange={(e) => {
                // 只允许数字
                const value = e.target.value.replace(/\D/g, '');
                handleInputChange('adAccountId', value);
              }}
              placeholder="请输入广告账户ID（仅数字）"
              className="w-full bg-white/70 text-gray-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none border border-gray-200 hover:border-indigo-300 transition-all font-mono backdrop-blur-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              账户状态
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full bg-white/70 text-gray-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none border border-gray-200 hover:border-indigo-300 transition-all backdrop-blur-sm"
            >
              <option value="Active">活跃</option>
              <option value="Inactive">非活跃</option>
              <option value="Suspended">暂停</option>
              <option value="Pending">待审核</option>
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">账户ID冲突</h3>
                  <div className="mt-1 text-sm text-red-700">
                    {error}
                  </div>
                  <div className="mt-2">
                    <div className="text-xs text-red-600">
                      <strong>解决方案：</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>检查输入的账户ID是否正确</li>
                        <li>确认这不是重复添加的账户</li>
                        <li>如需使用相同ID，请先删除现有账户</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/80 hover:bg-white/95 text-gray-700 py-3 px-6 rounded-xl font-semibold transition-all border border-gray-200 hover:border-gray-300 backdrop-blur-sm"
              disabled={loading}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-3 px-6 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="animate-spin mr-2" size={18} />
                  添加中...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Plus className="mr-2" size={18} />
                  添加账户
                </div>
              )}
            </button>
          </div>
        </form>

        {/* Preview */}
        {formData.accountName && formData.adAccountId && (
          <div className="mt-6 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-emerald-700 font-bold mb-3 flex items-center">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
              账户预览
            </p>
            <div className="text-gray-700 space-y-2">
              <p><span className="font-medium text-gray-600">名称：</span><span className="font-semibold">{formData.accountName}</span></p>
              <p><span className="font-medium text-gray-600">ID：</span><span className="font-mono bg-white/70 px-2 py-1 rounded">{formData.adAccountId}</span></p>
              <p><span className="font-medium text-gray-600">状态：</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ml-2 ${
                  formData.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 
                  formData.status === 'Inactive' ? 'bg-gray-100 text-gray-700' :
                  formData.status === 'Suspended' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {formData.status === 'Active' ? '活跃' : 
                   formData.status === 'Inactive' ? '非活跃' :
                   formData.status === 'Suspended' ? '暂停' : '待审核'}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddAccountModal;