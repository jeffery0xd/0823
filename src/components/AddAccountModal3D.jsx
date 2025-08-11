import React, { useState } from 'react';
import { supabase } from '../utils/supabase';

const AddAccountModal3D = ({ staff, onClose }) => {
  const [accountName, setAccountName] = useState('');
  const [adAccountId, setAdAccountId] = useState('');
  const [status, setStatus] = useState('active');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!accountName || !adAccountId) {
      setError('请填写所有必填项');
      return;
    }

    // 检查广告账户ID格式
    if (!/^\d+$/.test(adAccountId)) {
      setError('广告账户ID只能包含数字');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // 检查广告账户ID是否已存在（检查新表）
      const { data: existingNewAccount, error: checkNewError } = await supabase
        .from('app_e87b41cfe355428b8146f8bae8184e10_account_management_ads')
        .select('id, account_name, personnel_id')
        .eq('ad_account_id', adAccountId.trim())
        .single();

      if (checkNewError && checkNewError.code !== 'PGRST116') {
        throw checkNewError;
      }

      // 检查广告账户ID是否已存在（检查旧表）
      const { data: existingOldAccount, error: checkOldError } = await supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_advertising_accounts')
        .select('id, account_name, account_id')
        .eq('account_id', adAccountId.trim())
        .single();

      if (checkOldError && checkOldError.code !== 'PGRST116') {
        console.log('检查旧表时出现错误:', checkOldError);
        // 旧表错误不阻止流程，只记录日志
      }

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

      if (existingOldAccount) {
        setError(`该广告账户ID已存在！在历史数据中找到账户 "${existingOldAccount.account_name}"。如需添加，请先联系管理员处理历史数据，或使用其他ID。`);
        return;
      }

      // 插入新账户
      const { error: insertError } = await supabase
        .from('app_e87b41cfe355428b8146f8bae8184e10_account_management_ads')
        .insert({
          personnel_id: staff.id,
          account_name: accountName.trim(),
          ad_account_id: adAccountId.trim(),
          status: status
        });

      if (insertError) throw insertError;

      // 成功后关闭弹窗
      onClose();
    } catch (error) {
      console.error('添加账户失败:', error);
      setError('添加账户失败: ' + (error.message || '请重试'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900 rounded-2xl shadow-2xl 
                      border border-green-500/30 max-w-md w-full transform transition-all duration-300 
                      scale-100 hover:scale-[1.02]">
        
        {/* 头部 */}
        <div className="p-6 border-b border-green-400/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center">
                <span className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></span>
                添加新账户
              </h3>
              <p className="text-green-200 mt-1 text-sm">
                为 {staff.name} 添加广告账户
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-green-300 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 投放人员信息 */}
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
            <h4 className="text-white font-medium mb-3">投放人员信息</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-200">中文名:</span>
                <span className="text-white">{staff.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-200">英文名:</span>
                <span className="text-white">{staff.name_en}</span>
              </div>
            </div>
          </div>

          {/* 账户名称 */}
          <div>
            <label className="block text-white font-medium mb-2">
              账户名称 *
            </label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="请输入账户名称，如：Facebook-主账户"
              className="w-full px-4 py-3 bg-white/10 border border-green-400/30 rounded-lg 
                         text-white placeholder-green-300/60 focus:outline-none focus:ring-2 
                         focus:ring-green-400 focus:border-transparent backdrop-blur-sm
                         transition-all duration-200"
              required
            />
            <p className="text-green-200/80 text-xs mt-1">
              请输入易于识别的账户名称，建议包含平台和类型
            </p>
          </div>

          {/* 广告账户ID */}
          <div>
            <label className="block text-white font-medium mb-2">
              广告账户ID *
            </label>
            <input
              type="text"
              value={adAccountId}
              onChange={(e) => {
                // 只允许数字
                const value = e.target.value.replace(/\D/g, '');
                setAdAccountId(value);
              }}
              placeholder="请输入广告账户ID（仅数字）"
              className="w-full px-4 py-3 bg-white/10 border border-green-400/30 rounded-lg 
                         text-white placeholder-green-300/60 focus:outline-none focus:ring-2 
                         focus:ring-green-400 focus:border-transparent backdrop-blur-sm
                         transition-all duration-200 font-mono"
              required
            />
            <p className="text-green-200/80 text-xs mt-1">
              请输入广告平台提供的账户ID，只能包含数字
            </p>
          </div>

          {/* 账户状态 */}
          <div>
            <label className="block text-white font-medium mb-2">
              账户状态
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-green-400/30 rounded-lg 
                         text-white focus:outline-none focus:ring-2 focus:ring-green-400 
                         focus:border-transparent backdrop-blur-sm transition-all duration-200"
            >
              <option value="active" className="bg-gray-800">活跃</option>
              <option value="inactive" className="bg-gray-800">非活跃</option>
              <option value="suspended" className="bg-gray-800">暂停</option>
              <option value="pending" className="bg-gray-800">待审核</option>
            </select>
            <p className="text-green-200/80 text-xs mt-1">
              设置账户的初始状态，可后续修改
            </p>
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="bg-red-500/10 border-l-4 border-red-400 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-300">账户ID冲突</h3>
                  <div className="mt-1 text-sm text-red-200">
                    {error}
                  </div>
                  <div className="mt-2">
                    <div className="text-xs text-red-300/80">
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

          {/* 创建指南 */}
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <h5 className="text-green-300 font-medium mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              创建指南
            </h5>
            <ul className="text-green-200/80 text-xs space-y-1">
              <li>• 账户名称应对应具体的广告平台和用途</li>
              <li>• 广告账户ID必须是平台提供的唯一数字ID</li>
              <li>• 建议选择“活跃”状态，除非账户正在审核中</li>
            </ul>
          </div>

          {/* 操作按钮 */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg 
                         border border-white/20 transition-all duration-200 font-medium"
              disabled={loading}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-green-800 
                         disabled:opacity-50 text-white rounded-lg transition-all duration-200 
                         font-medium flex items-center justify-center transform hover:scale-105 
                         disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  创建中...
                </>
              ) : (
                '创建账户'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAccountModal3D;