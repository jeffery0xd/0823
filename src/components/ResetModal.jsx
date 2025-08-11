import React, { useState } from 'react';
import { resetOperationsService, fileUploadService } from '../services/accountManagementService';

const ResetModal = ({ account, onClose }) => {
  const [balance, setBalance] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('请选择图片文件');
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('图片大小不能超过5MB');
        return;
      }

      setScreenshot(file);
      setError('');
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setScreenshotPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!balance || isNaN(balance) || parseFloat(balance) < 0) {
      setError('请输入有效的账户余额');
      return;
    }

    if (!screenshot) {
      setError('请上传账户余额截图');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Upload screenshot first
      setUploading(true);
      const screenshotUrl = await fileUploadService.uploadScreenshot(
        screenshot, 
        `${account.account_name}_${Date.now()}.${screenshot.name.split('.').pop()}`
      );
      setUploading(false);

      // Create reset operation
      await resetOperationsService.create({
        accountId: account.id,
        personnelId: account.personnelInfo.id,
        accountName: account.account_name,
        adAccountId: account.ad_account_id,
        balance: parseFloat(balance),
        screenshotUrl: screenshotUrl,
        operatorName: account.personnelInfo.name
      });

      // Show success message
      alert('清零信息已提交！');
      onClose();
    } catch (error) {
      console.error('清零失败:', error);
      setError('清零失败，请重试');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4 border border-gray-700 max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">账户清零</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Account Info */}
        <div className="bg-gray-700 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">投放人员：</span>
              <span className="text-white font-medium">{account.personnelInfo.name}</span>
            </div>
            <div>
              <span className="text-gray-400">账户名称：</span>
              <span className="text-white font-medium">{account.account_name}</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-400">广告账户ID：</span>
              <span className="text-white font-mono text-sm">{account.ad_account_id}</span>
            </div>
            <div className="col-span-2">
              <span className="text-yellow-400 text-xs">⚠️ 账户已禁用，需要进行清零处理</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Balance Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              账户当前余额 (美元)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-semibold">$</span>
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
                className="w-full bg-gray-700 text-white rounded-lg pl-8 pr-4 py-3 focus:ring-2 focus:ring-yellow-500 focus:outline-none border border-gray-600"
                required
              />
            </div>
          </div>

          {/* Screenshot Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              账户余额截图
            </label>
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-gray-500 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="screenshot-upload"
              />
              <label htmlFor="screenshot-upload" className="cursor-pointer">
                {screenshotPreview ? (
                  <div className="space-y-2">
                    <img 
                      src={screenshotPreview} 
                      alt="余额截图预览" 
                      className="max-w-full max-h-32 mx-auto rounded-lg"
                    />
                    <p className="text-green-400 text-sm">截图已选择，点击更换</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <svg className="w-10 h-10 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-gray-400 text-sm">点击上传账户余额截图</p>
                    <p className="text-gray-500 text-xs">支持 JPG、PNG 等格式，最大5MB</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-900 bg-opacity-20 rounded-lg p-3">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {uploading ? '上传中...' : '提交中...'}
                </div>
              ) : (
                '提交清零'
              )}
            </button>
          </div>
        </form>

        {/* Preview */}
        {balance && !isNaN(balance) && parseFloat(balance) >= 0 && (
          <div className="mt-4 bg-yellow-900 bg-opacity-20 rounded-lg p-3 border border-yellow-700">
            <p className="text-yellow-300 text-sm font-medium">公屏显示预览：</p>
            <p className="text-white text-sm font-mono mt-1">
              账户：{account.account_name}  Ad account ID: {account.ad_account_id} 清零
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetModal;
