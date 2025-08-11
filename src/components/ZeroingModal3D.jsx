import React, { useState } from 'react';
import { supabase } from '../utils/supabase';

const ZeroingModal = ({ account, onClose }) => {
  const [balance, setBalance] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        setError('请选择图片文件');
        return;
      }
      
      // 检查文件大小（5MB）
      if (file.size > 5 * 1024 * 1024) {
        setError('图片大小不能超过5MB');
        return;
      }

      setScreenshot(file);
      setError('');
      
      // 生成预览
      const reader = new FileReader();
      reader.onload = (e) => {
        setScreenshotPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadScreenshot = async (file) => {
    setUploading(true);
    try {
      const fileName = `${Date.now()}_${account.id}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('screenshots')
        .upload(`zeroing/${fileName}`, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      
      // 获取公共URL
      const { data: urlData } = supabase.storage
        .from('screenshots')
        .getPublicUrl(data.path);
      
      return urlData.publicUrl;
    } catch (error) {
      throw new Error('截图上传失败: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!balance || !operatorName || !screenshot) {
      setError('请填写所有必填项并上传截图');
      return;
    }

    if (isNaN(balance) || parseFloat(balance) < 0) {
      setError('请输入有效的余额金额');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // 上传截图
      const screenshotUrl = await uploadScreenshot(screenshot);

      // 插入清零记录
      const { error: insertError } = await supabase
        .from('app_e87b41cfe355428b8146f8bae8184e10_reset_operations')
        .insert({
          account_id: account.id,
          personnel_id: account.staffInfo.id,
          account_name: account.account_name,
          ad_account_id: account.ad_account_id,
          balance: parseFloat(balance),
          screenshot_url: screenshotUrl,
          operator_name: operatorName
        });

      if (insertError) throw insertError;

      // 成功后关闭弹窗
      onClose();
    } catch (error) {
      console.error('清零操作失败:', error);
      setError('清零操作失败: ' + (error.message || '请重试'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-red-900 via-red-800 to-rose-900 rounded-2xl shadow-2xl 
                      border border-red-500/30 max-w-md w-full max-h-[90vh] overflow-y-auto 
                      transform transition-all duration-300 scale-100 hover:scale-[1.02]">
        
        {/* 头部 */}
        <div className="p-6 border-b border-red-400/20 sticky top-0 bg-gradient-to-br from-red-900 via-red-800 to-rose-900">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center">
                <span className="w-3 h-3 bg-red-400 rounded-full mr-3 animate-pulse"></span>
                账户清零
              </h3>
              <p className="text-red-200 mt-1 text-sm">
                {account.staffInfo.name} - {account.account_name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-red-300 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-all duration-200"
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
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
            <h4 className="text-white font-medium mb-3">账户信息</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-red-200">投放人员:</span>
                <span className="text-white">{account.staffInfo.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-200">账户名称:</span>
                <span className="text-white">{account.account_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-200">广告账户ID:</span>
                <span className="text-white font-mono text-xs">{account.ad_account_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-200">账户状态:</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  account.status === 'active' 
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                  {account.status === 'active' ? '活跃' : '非活跃'}
                </span>
              </div>
            </div>
          </div>

          {/* 余额金额 */}
          <div>
            <label className="block text-white font-medium mb-2">
              清零前余额 *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-300">￥</span>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="请输入清零前的余额"
                step="0.01"
                min="0"
                className="w-full pl-8 pr-4 py-3 bg-white/10 border border-red-400/30 rounded-lg 
                           text-white placeholder-red-300/60 focus:outline-none focus:ring-2 
                           focus:ring-red-400 focus:border-transparent backdrop-blur-sm
                           transition-all duration-200"
                required
              />
            </div>
            <p className="text-red-200/80 text-xs mt-1">
              请输入清零操作前账户的余额金额
            </p>
          </div>

          {/* 截图上传 */}
          <div>
            <label className="block text-white font-medium mb-2">
              余额截图 * 
            </label>
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-4 py-3 bg-white/10 border border-red-400/30 rounded-lg 
                             text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg 
                             file:border-0 file:text-sm file:font-medium file:bg-red-600 
                             file:text-white hover:file:bg-red-700 file:cursor-pointer
                             focus:outline-none focus:ring-2 focus:ring-red-400 
                             focus:border-transparent backdrop-blur-sm transition-all duration-200"
                  required
                />
              </div>
              
              {/* 预览图片 */}
              {screenshotPreview && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <p className="text-white text-sm mb-2">截图预览:</p>
                  <img 
                    src={screenshotPreview} 
                    alt="截图预览" 
                    className="w-full h-48 object-cover rounded-lg border border-white/20"
                  />
                </div>
              )}
            </div>
            <p className="text-red-200/80 text-xs mt-1">
              请上传显示账户余额的截图，支持JPG、PNG等格式，大小不超过5MB
            </p>
          </div>

          {/* 操作人 */}
          <div>
            <label className="block text-white font-medium mb-2">
              操作人姓名 *
            </label>
            <input
              type="text"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              placeholder="请输入操作人姓名"
              className="w-full px-4 py-3 bg-white/10 border border-red-400/30 rounded-lg 
                         text-white placeholder-red-300/60 focus:outline-none focus:ring-2 
                         focus:ring-red-400 focus:border-transparent backdrop-blur-sm
                         transition-all duration-200"
              required
            />
            <p className="text-red-200/80 text-xs mt-1">
              请输入执行此次清零操作的人员姓名
            </p>
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-red-300 text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg 
                         border border-white/20 transition-all duration-200 font-medium"
              disabled={loading || uploading}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-800 
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
                  {uploading ? '上传中...' : '清零中...'}
                </>
              ) : (
                '确认清零'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ZeroingModal;