import React, { useState, useEffect } from 'react';
import { resetOperationsService } from '../services/accountManagementService';
import { supabase } from '../utils/supabase';

const SimpleZeroingModal = ({ isOpen, onClose, onSuccess, account }) => {
  const [balance, setBalance] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // 初始化操作人为投放人员名称
  useEffect(() => {
    if (account && account.personnel_name) {
      setOperatorName(account.personnel_name);
    }
  }, [account]);

  if (!isOpen || !account) return null;

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
    const extension = fileName.split('.').pop() || 'png';
    // 移除中文字符和特殊字符，只保留字母、数字、下划线和连字符
    const cleanName = fileName
      .replace(/\.[^/.]+$/, '') // 移除扩展名
      .replace(/[^a-zA-Z0-9_-]/g, '_') // 替换非安全字符为下划线
      .replace(/_+/g, '_') // 合并多个下划线
      .replace(/^_|_$/g, '') // 移除开头和结尾的下划线
      .substring(0, 50); // 限制长度
    
    return cleanName ? `${cleanName}.${extension}` : `screenshot.${extension}`;
  };

  const uploadScreenshot = async (file) => {
    setUploading(true);
    try {
      // 获取文件扩展名
      const fileExt = file.name.split('.').pop() || 'png';
      
      // 生成安全的文件名，完全避免中文字符
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const sanitizedFileName = `screenshot_${timestamp}_${randomId}.${fileExt}`;
      
      // 确保使用 personnel_id 作为文件夹名，如果没有则使用 'unassigned'
      let personnelFolder = 'unassigned';
      if (account.personnel_id) {
        // 使用 personnel_id，确保是有效的字符串
        personnelFolder = String(account.personnel_id).replace(/[^a-zA-Z0-9_-]/g, '_');
      } else if (account.personnel_name && account.personnel_name.trim()) {
        // 备选方案：使用清理后的 personnel_name
        personnelFolder = account.personnel_name
          .trim()
          .replace(/[^a-zA-Z0-9_-]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '')
          .substring(0, 20);
        
        if (!personnelFolder) {
          personnelFolder = 'unassigned';
        }
      }
      
      const filePath = `zeroing/${personnelFolder}/${sanitizedFileName}`;
      
      console.log('上传文件路径:', filePath);
      console.log('账户信息:', { personnel_id: account.personnel_id, personnel_name: account.personnel_name });
      
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
    
    if (!balance || !operatorName || !screenshot) {
      setError('请填写所有必填项并上传截图');
      return;
    }

    if (isNaN(balance) || parseFloat(balance) < 0) {
      setError('请输入有效的余额金额');
      return;
    }

    setLoading(true);
    setError('');

    try {
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
        balance: parseFloat(balance),
        screenshotUrl: screenshotUrl,
        operatorName: operatorName
      };
      
      console.log('创建清零记录:', resetData);

      // 创建清零记录
      const result = await resetOperationsService.create(resetData);
      console.log('清零记录创建成功:', result);

      // 关闭模态框
      onClose();
      
      // 执行成功回调
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error('清零操作失败:', error);
      
      let errorMessage = '清零操作失败，请重试';
      
      if (error.message) {
        if (error.message.includes('screenshot') || error.message.includes('upload')) {
          errorMessage = '截图上传失败，请检查图片格式和大小';
        } else if (error.message.includes('account')) {
          errorMessage = '账户信息异常，请联系管理员';
        } else if (error.message.includes('network')) {
          errorMessage = '网络连接失败，请检查网络连接';
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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg p-4 lg:p-6 w-full max-w-md mx-auto max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">账户清零</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Account Info */}
        <div className="bg-blue-50 p-3 rounded mb-4">
          <div className="text-sm">
            <div><strong>账户:</strong> {account.account_name}</div>
            <div><strong>ID:</strong> {account.ad_account_id}</div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              清零前余额 (美元)
            </label>
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
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              余额截图
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full border rounded px-3 py-2 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-red-600 file:text-white hover:file:bg-red-700"
              required
            />
            {screenshotPreview && (
              <div className="mt-2">
                <img 
                  src={screenshotPreview} 
                  alt="截图预览" 
                  className="w-full h-32 object-cover rounded border"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              操作人姓名 <span className="text-xs text-gray-500">(自动填充为投放人员)</span>
            </label>
            <input
              type="text"
              value={operatorName}
              readOnly
              placeholder="投放人员名称"
              className="w-full border rounded px-3 py-2 bg-gray-50 cursor-not-allowed"
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-2">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded"
              disabled={loading || uploading}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded disabled:opacity-50"
            >
              {loading || uploading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {uploading ? '上传中...' : '清零中...'}
                </div>
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

export default SimpleZeroingModal;
