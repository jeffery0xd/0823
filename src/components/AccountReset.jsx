import React, { useState, useEffect } from 'react';
import { accountResetService } from '../data/accountResetService';

const AccountReset = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  
  // 管理员状态
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const ADMIN_PASSWORD = '19990403';
  
  // 4步骤申请流程状态
  const [showWizard, setShowWizard] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [wizardData, setWizardData] = useState({
    advertiser: '',
    accountName: '',
    accountId: '',
    balance: '',
    screenshot: null,
    screenshotPreview: null
  });

  const advertisers = ['青', '乔', '白', '丁', '妹'];

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await accountResetService.getAllRequests();
      setRequests(data || []);
    } catch (error) {
      console.error('Failed to load requests:', error);
      setError('加载申请失败: ' + error.message);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const handleAdminLogin = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminPassword('');
      showNotification('管理员登录成功！', 'success');
    } else {
      showNotification('密码错误！', 'error');
    }
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setWizardData({
      advertiser: '',
      accountName: '',
      accountId: '',
      balance: '',
      screenshot: null,
      screenshotPreview: null
    });
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return wizardData.advertiser !== '';
      case 2:
        return wizardData.accountName.trim() !== '' && wizardData.accountId.trim() !== '';
      case 3:
        return wizardData.balance !== '' && parseFloat(wizardData.balance) >= 0;
      case 4:
        return wizardData.screenshot !== null;
      default:
        return false;
    }
  };

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showNotification('图片文件大小不能超过10MB', 'error');
        return;
      }
      
      setWizardData(prev => ({
        ...prev,
        screenshot: file,
        screenshotPreview: URL.createObjectURL(file)
      }));
    }
  };

  const submitRequest = async () => {
    try {
      await accountResetService.createRequest(wizardData);
      showNotification('清零申请提交成功！等待管理员审批', 'success');
      setShowWizard(false);
      resetWizard();
      await loadRequests();
    } catch (error) {
      console.error('Failed to submit request:', error);
      showNotification('提交申请失败: ' + error.message, 'error');
    }
  };

  const handleApprove = async (requestId) => {
    if (!window.confirm('确定要批准这个清零申请吗？')) return;
    
    try {
      await accountResetService.processRequest(requestId, 'approved', '管理员批准清零');
      showNotification('申请已批准！', 'success');
      await loadRequests();
    } catch (error) {
      console.error('Failed to approve request:', error);
      showNotification('批准失败: ' + error.message, 'error');
    }
  };

  const handleReject = async (requestId) => {
    const reason = prompt('请输入拒绝原因：');
    if (reason === null) return;
    
    try {
      await accountResetService.processRequest(requestId, 'rejected', reason || '管理员拒绝清零');
      showNotification('申请已拒绝！', 'success');
      await loadRequests();
    } catch (error) {
      console.error('Failed to reject request:', error);
      showNotification('拒绝失败: ' + error.message, 'error');
    }
  };

  const handleDelete = async (requestId) => {
    if (!window.confirm('确定要删除这个申请吗？此操作无法撤销！')) return;
    
    try {
      await accountResetService.deleteRequest(requestId);
      showNotification('申请已删除！', 'success');
      await loadRequests();
    } catch (error) {
      console.error('Failed to delete request:', error);
      showNotification('删除失败: ' + error.message, 'error');
    }
  };

  const getStepTitle = (step) => {
    switch (step) {
      case 1: return '选择投放人员';
      case 2: return '录入账户信息';
      case 3: return '录入账户余额';
      case 4: return '上传余额截图';
      default: return '';
    }
  };

  const showImage = (imageUrl, requestInfo) => {
    setSelectedImage({ url: imageUrl, info: requestInfo });
    setShowImageModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">加载中...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      {notification.show && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-lg shadow-lg transform transition-all duration-300 ${
          notification.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            <div className="p-1 rounded-full mr-3">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-medium text-gray-900">
                账户清零管理
              </h2>
              <p className="text-gray-600">4步申请流程 + 管理员审批系统</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setShowWizard(true);
                resetWizard();
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新建清零申请
            </button>
            {!isAdmin ? (
              <button
                onClick={() => setShowAdminLogin(true)}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                管理员登录
              </button>
            ) : (
              <div className="flex items-center bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">管理员已登录</span>
                <button
                  onClick={() => setIsAdmin(false)}
                  className="ml-3 text-sm text-green-600 hover:text-green-800 transition-colors font-medium"
                >
                  退出
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-full">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {showAdminLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">管理员登录</h3>
              </div>
              <button
                onClick={() => {
                  setShowAdminLogin(false);
                  setAdminPassword('');
                }}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">管理员密码</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入管理员密码"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleAdminLogin}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  登录
                </button>
                <button
                  onClick={() => {
                    setShowAdminLogin(false);
                    setAdminPassword('');
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">清零申请列表</h3>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请信息</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">账户信息</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">余额</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">余额截图</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请时间</th>
                {isAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">管理员操作</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="p-6 bg-gray-100 rounded-lg">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900">暂无清零申请</p>
                        <p className="text-sm text-gray-500 mt-1">点击"新建清零申请"开始4步申请流程</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {request.advertiser}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">投放人员: {request.advertiser}</div>
                          <div className="text-sm text-gray-500">ID: #{request.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">账户名称: {request.account_name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">ID: {request.account_id || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ${parseFloat(request.balance || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {request.screenshot_url ? (
                        <div className="flex items-center space-x-2">
                          <img
                            src={request.screenshot_url}
                            alt="余额截图"
                            className="w-12 h-12 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-75 transition-opacity"
                            onClick={() => showImage(request.screenshot_url, request)}
                            title="点击查看大图"
                          />
                          <button
                            onClick={() => showImage(request.screenshot_url, request)}
                            className="text-blue-600 hover:text-blue-800 text-xs"
                          >
                            查看大图
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">无截图</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'approved' ? 'bg-green-100 text-green-800' :
                        request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {request.status === 'pending' ? '⏳ 待审批' :
                         request.status === 'approved' ? '✅ 已批准' :
                         request.status === 'rejected' ? '❌ 已拒绝' : '❓ 未知'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {request.created_at ? new Date(request.created_at).toLocaleString('zh-CN') : 'N/A'}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-sm space-x-2">
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(request.id)}
                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              批准
                            </button>
                            <button
                              onClick={() => handleReject(request.id)}
                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              拒绝
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(request.id)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                          删除
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">余额截图</h3>
                <p className="text-sm text-gray-600">
                  投放人员: {selectedImage.info.advertiser} | 
                  账户: {selectedImage.info.account_name || 'N/A'} | 
                  余额: ${parseFloat(selectedImage.info.balance || 0).toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowImageModal(false);
                  setSelectedImage(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="text-center">
              <img
                src={selectedImage.url}
                alt="余额截图"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
              <div className="mt-4 flex justify-center space-x-3">
                <button
                  onClick={() => window.open(selectedImage.url, '_blank')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  在新窗口打开
                </button>
                <a
                  href={selectedImage.url}
                  download={`balance_screenshot_${selectedImage.info.advertiser}_${new Date(selectedImage.info.created_at).toLocaleDateString()}.jpg`}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors inline-block"
                >
                  下载图片
                </a>
                <button
                  onClick={() => {
                    setShowImageModal(false);
                    setSelectedImage(null);
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  关闭图片
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountReset;