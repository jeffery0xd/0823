import React, { useState, useEffect } from 'react';
import { resetOperationsService } from '../services/accountManagementService';
import { supabase } from '../utils/supabase';

const ZeroingModal = ({ isOpen, onClose, onSuccess, account }) => {
  const [balance, setBalance] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !account) return null;

  // 初始化操作人为投放人员名称
  useEffect(() => {
    if (account && account.personnel_name) {
      setOperatorName(account.personnel_name);
    }
  }, [account]);

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

  const sanitizeFileName = (fileName) => {
    // 获取文件扩展名
    const extension = fileName.split('.').pop();
    // 移除中文字符和特殊字符，只保留字母、数字、下划线和连字符
    const cleanName = fileName
      .replace(/\.[^/.]+$/, '') // 移除扩展名
      .replace(/[^a-zA-Z0-9_-]/g, '_') // 替换非安全字符为下划线
      .replace(/_+/g, '_') // 合并多个下划线
      .replace(/^_|_$/g, ''); // 移除开头和结尾的下划线
    
    return `${cleanName}.${extension}`;
  };

  const uploadScreenshot = async (file) => {
    setUploading(true);
    try {
      const cleanFileName = sanitizeFileName(file.name);
      const fileName = `${Date.now()}_${account.id}_${cleanFileName}`;
      // 按投放人员名称创建文件夹结构
      const personnelFolder = account.personnel_name ? 
        account.personnel_name.replace(/[^a-zA-Z0-9_-]/g, '_') : 
        'unassigned';
      const filePath = `zeroing/${personnelFolder}/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('account-screenshots')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      
      // 获取公共URL
      const { data: urlData } = supabase.storage
        .from('account-screenshots')
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
    
    try {
      // 表单验证
      if (!balance || !operatorName || !screenshot) {
        setError('请填写所有必填项并上传截图');
        return;
      }

      const balanceNum = parseFloat(balance);
      if (isNaN(balanceNum) || balanceNum < 0) {
        setError('请输入有效的余额金额');
        return;
      }

      // 账户数据验证
      if (!account || !account.id) {
        setError('账户信息无效，请刷新页面重试');
        return;
      }

      setLoading(true);
      setError('');
      console.log('开始清零操作...');

      // 上传截图
      console.log('上传截图...');
      const screenshotUrl = await uploadScreenshot(screenshot);
      console.log('截图上传成功:', screenshotUrl);

      // 准备清零记录数据
      const resetData = {
        accountId: account.id,
        personnelId: account.personnel_id || null,
        accountName: account.account_name || 'Unknown Account',
        adAccountId: account.ad_account_id || account.account_id || 'N/A',
        balance: balanceNum,
        screenshotUrl: screenshotUrl,
        operatorName: operatorName
      };
      
      console.log('准备创建清零记录:', resetData);

      // 创建清零记录（包含状态更新）
      const result = await resetOperationsService.create(resetData);
      console.log('清零记录创建成功:', result);

      // 成功后只关闭模态框
      onClose();
      
      // 延迟执行回调，避免状态冲突
      setTimeout(() => {
        if (onSuccess) {
          try {
            onSuccess();
          } catch (callbackError) {
            console.error('回调执行出错:', callbackError);
          }
        }
      }, 100);
      
    } catch (error) {
      console.error('清零操作详细错误:', error);
      console.error('错误堆栈:', error.stack);
      
      let errorMessage = '清零操作失败，请重试';
      
      if (error.message) {
        if (error.message.includes('screenshot') || error.message.includes('upload')) {
          errorMessage = '截图上传失败，请检查图片格式和大小';
        } else if (error.message.includes('account') || error.message.includes('Account')) {
          errorMessage = '账户信息异常，请联系管理员';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = '网络连接失败，请检查网络连接';
        } else if (error.message.includes('Duplicate') || error.message.includes('unique')) {
          errorMessage = '数据重复，请稍后重试';
        } else {
          errorMessage = `操作失败: ${error.message}`;
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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 border border-gray-200 max-h-[90vh] overflow-y-auto shadow-lg">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">账户清零</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Account Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">投放人员：</span>
              <span className="text-gray-800 font-medium">{account.personnel_name || '未分配'}</span>
            </div>
            <div>
              <span className="text-gray-600">账户名称：</span>
              <span className="text-gray-800 font-medium">{account.account_name}</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600">广告账户ID：</span>
              <span className="text-gray-800 font-mono text-sm">{account.ad_account_id}</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600">账户状态：</span>
              <span className={`inline-block ml-2 px-2 py-1 rounded text-xs font-medium ${
                account.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {account.status === 'active' ? '活跃' : '非活跃'}
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Balance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              清零前余额 (美元)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-semibold">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={balance}
                onChange={(e) => {
                  setBalance(e.target.value);
                  setError('');
                }}
                placeholder="0.00"
                className="w-full bg-white text-gray-800 rounded-lg pl-8 pr-4 py-3 focus:ring-2 focus:ring-red-500 focus:outline-none border border-gray-300"
                required
              />
            </div>
          </div>

          {/* Screenshot Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              余额截图
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full bg-white text-gray-800 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 focus:outline-none border border-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-red-600 file:text-white hover:file:bg-red-700"
              required
            />
            {screenshotPreview && (
              <div className="mt-3">
                <img 
                  src={screenshotPreview} 
                  alt="截图预览" 
                  className="w-full h-48 object-cover rounded-lg border border-gray-300"
                />
              </div>
            )}
          </div>

          {/* Operator Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              操作人姓名 <span className="text-sm text-gray-500">(自动填充为投放人员)</span>
            </label>
            <input
              type="text"
              value={operatorName}
              readOnly
              placeholder="投放人员名称"
              className="w-full bg-gray-50 text-gray-800 rounded-lg px-4 py-3 border border-gray-300 cursor-not-allowed"
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-lg transition-colors border border-gray-300 hover:border-gray-400"
              disabled={loading || uploading}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading || uploading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {uploading ? '上传中...' : '清零中...'}
                </div>
              ) : (
                '确认清零'
              )}
            </button>
          </div>
        </form>

        {/* Preview */}
        {balance && !isNaN(balance) && parseFloat(balance) > 0 && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm font-medium">公屏显示预览：</p>
            <p className="text-gray-800 text-sm font-mono mt-1">
              账户：{account.account_name}  Ad account ID: {account.ad_account_id} 清零余额 ${parseFloat(balance).toFixed(2)}
            </p>
            <div className="mt-2">
              <span className="inline-block px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">
                清零金额: ${parseFloat(balance).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ZeroingModal;