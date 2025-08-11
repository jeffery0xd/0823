import React, { useState, useEffect } from 'react';
import { accountRequestsService } from '../data/accountRequestsService';

const AccountRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [dateFilter, setDateFilter] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [personFilter, setPersonFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [resetStatusFilter, setResetStatusFilter] = useState('');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetDialogStep, setResetDialogStep] = useState(1);
  const [resetFormData, setResetFormData] = useState({
    requestId: '',
    balance: '',
    screenshot: null,
    screenshotPreview: null
  });
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newRequest, setNewRequest] = useState({
    requester: '',
    type: 'advertising',
    reason: '',
    urgency: 'normal',
    email: '',
    profileLink: ''
  });

  const advertisers = ['青', '乔', '白', '丁', '妹'];
  const ADMIN_PASSWORD = '19990403';

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    applyDateFilter();
  }, [requests, dateRangeFilter, personFilter, searchQuery, statusFilter, resetStatusFilter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await accountRequestsService.getAllRequests();
      setRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
      alert(`加载申请数据失败: ${error.message}`);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const saveRequests = (updatedRequests) => {
    setRequests(updatedRequests);
  };

  const applyDateFilter = () => {
    let filtered = requests;
    
    // 按搜索查询筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(request => 
        (request.user_name || request.requester || '').toLowerCase().includes(query) ||
        (request.reason || '').toLowerCase().includes(query) ||
        (request.email && request.email.toLowerCase().includes(query)) ||
        (request.account_info && request.account_info.details && 
         request.account_info.details.toLowerCase().includes(query))
      );
    }
    
    // 按人员筛选
    if (personFilter) {
      filtered = filtered.filter(request => (request.user_name || request.requester) === personFilter);
    }
    
    // 按状态筛选
    if (statusFilter) {
      filtered = filtered.filter(request => request.status === statusFilter);
    }
    
    // 按清零状态筛选
    if (resetStatusFilter) {
      if (resetStatusFilter === 'resetting') {
        // 清零中：已批准的广告账户且正在申请清零
        filtered = filtered.filter(request => 
          request.status === 'approved' && 
          request.type === 'advertising' && 
          request.resetRequested === true && 
          request.resetStatus === 'pending'
        );
      } else if (resetStatusFilter === 'reset_completed') {
        // 已清零完成
        filtered = filtered.filter(request => 
          request.accountStatus === 'reset_completed'
        );
      } else if (resetStatusFilter === 'reset_rejected') {
        // 清零被拒绝
        filtered = filtered.filter(request => 
          request.accountStatus === 'reset_rejected'
        );
      }
    }
    
    // 按日期范围筛选
    if (dateRangeFilter.startDate && dateRangeFilter.endDate) {
      const startDate = new Date(dateRangeFilter.startDate);
      const endDate = new Date(dateRangeFilter.endDate);
      filtered = filtered.filter(request => {
        const requestDate = new Date(request.created_at);
        return requestDate >= startDate && requestDate <= endDate;
      });
    }
    
    setFilteredRequests(filtered);
  };

  const handleResetRequest = (requestId) => {
    setResetFormData({
      requestId: requestId,
      balance: '',
      screenshot: null,
      screenshotPreview: null
    });
    setResetDialogStep(1);
    setShowResetDialog(true);
  };

  const handleResetStep1 = () => {
    if (!resetFormData.balance.trim()) {
      alert('请填写账户剩余余额！');
      return;
    }
    setResetDialogStep(2);
  };

  const handleScreenshotUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setResetFormData({
        ...resetFormData,
        screenshot: event.target.result,
        screenshotPreview: event.target.result
      });
    };
    reader.readAsDataURL(file);
  };

  const submitResetRequest = () => {
    if (!resetFormData.screenshot) {
      alert('请上传账户余额截图！');
      return;
    }

    if (window.confirm('确定要提交清零申请吗？此操作将通知管理员进行清零处理。')) {
      const updatedRequests = requests.map(request => {
        if (request.id === resetFormData.requestId) {
          return {
            ...request,
            resetRequested: true,
            resetRequestTime: new Date().toISOString(),
            resetStatus: 'pending',
            resetInfo: {
              remainingBalance: resetFormData.balance,
              screenshot: resetFormData.screenshot,
              screenshotName: 'balance_screenshot.jpg'
            }
          };
        }
        return request;
      });
      
      saveRequests(updatedRequests);
      setShowResetDialog(false);
      
      // 重置表单数据
      setResetFormData({
        requestId: '',
        balance: '',
        screenshot: null,
        screenshotPreview: null
      });
      setResetDialogStep(1);
      
      alert('✅ 清零申请已成功提交！管理员将会审核您的申请，请耐心等待处理结果。');
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    
    if (!newRequest.requester || !newRequest.reason) {
      alert('请填写完整的申请信息！');
      return;
    }

    if (newRequest.type === 'advertising') {
      if (!newRequest.email || !newRequest.profileLink) {
        alert('申请广告账户需要填写Facebook个人邮箱和个人主页链接！');
        return;
      }
    }

    try {
      await accountRequestsService.createRequest(newRequest);
      await loadRequests();

      setNewRequest({
        requester: '',
        type: 'advertising',
        reason: '',
        urgency: 'normal',
        email: '',
        profileLink: ''
      });
      setShowNewRequest(false);
      alert('申请已提交，等待管理员处理！');
    } catch (error) {
      console.error('Error submitting request:', error);
      alert(`❌ ${error.message}`);
    }
  };

  const handleAdminLogin = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowAdminPanel(false);
      setAdminPassword('');
      alert('管理员登录成功！');
    } else {
      alert('密码错误！');
      setAdminPassword('');
    }
  };

  const handleProcessRequest = async (requestId, action, accountInfo) => {
    try {
      await accountRequestsService.processRequest(requestId, action, accountInfo);
      // 重新加载数据
      await loadRequests();
      const actionText = action === 'approved' ? '已批准' : '已拒绝';
      alert(`申请${actionText}！`);
    } catch (error) {
      console.error('处理申请失败:', error);
      alert('处理失败: ' + error.message);
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (window.confirm('确定要删除这个申请吗？此操作不可撤销！')) {
      try {
        await accountRequestsService.deleteRequest(requestId);
        // 重新加载数据
        await loadRequests();
        alert('申请已删除！');
      } catch (error) {
        console.error('删除申请失败:', error);
        alert('删除失败: ' + error.message);
      }
    }
  };

  const handleProcessReset = (requestId, action) => {
    const updatedRequests = requests.map(request => {
      if (request.id === requestId) {
        if (action === 'approved') {
          return {
            ...request,
            resetRequested: false,
            resetStatus: 'completed',
            resetCompletedTime: new Date().toISOString(),
            accountStatus: 'reset_completed'
          };
        } else {
          return {
            ...request,
            resetRequested: false,
            resetStatus: 'rejected',
            resetRejectedTime: new Date().toISOString(),
            accountStatus: 'reset_rejected'
          };
        }
      }
      return request;
    });
    
    saveRequests(updatedRequests);
    const actionText = action === 'approved' ? '✅ 账户清零操作已完成！用户将看到清零成功状态。' : '❌ 清零申请已被拒绝！';
    alert(`${actionText}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="backdrop-blur-xl bg-white/30 border border-white/20 rounded-3xl p-12 shadow-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-700 font-medium text-lg mt-4">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-6 lg:p-8 pt-2">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="backdrop-blur-xl bg-white/40 border border-white/20 rounded-3xl p-8 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                账户申请管理
              </h1>
              <p className="text-slate-600 text-lg font-medium">管理广告账户和Facebook个号申请</p>
            </div>
            
            <div className="flex flex-wrap gap-2 md:gap-4 items-center">
              <div className="flex items-center gap-2 md:gap-3">
                <label className="text-xs md:text-sm font-semibold text-slate-700">人员:</label>
                <select
                  value={personFilter}
                  onChange={(e) => setPersonFilter(e.target.value)}
                  className="bg-white/60 border border-white/30 rounded-xl px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm min-w-[80px]"
                >
                  <option value="">全部</option>
                  {advertisers.map(advertiser => (
                    <option key={advertiser} value={advertiser}>{advertiser}</option>
                  ))}
                </select>
                {personFilter && (
                  <button
                    onClick={() => setPersonFilter('')}
                    className="px-2 md:px-3 py-1 md:py-2 bg-slate-500 text-white rounded-xl text-xs md:text-sm"
                  >
                    清除
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-2 md:gap-3">
                <label className="text-xs md:text-sm font-semibold text-slate-700">状态:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white/60 border border-white/30 rounded-xl px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm min-w-[90px]"
                >
                  <option value="">全部状态</option>
                  <option value="pending">申请中</option>
                  <option value="approved">已批准</option>
                  <option value="rejected">未批准</option>
                </select>
                {statusFilter && (
                  <button
                    onClick={() => setStatusFilter('')}
                    className="px-2 md:px-3 py-1 md:py-2 bg-slate-500 text-white rounded-xl text-xs md:text-sm"
                  >
                    清除
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-2 md:gap-3">
                <label className="text-xs md:text-sm font-semibold text-slate-700">清零:</label>
                <select
                  value={resetStatusFilter}
                  onChange={(e) => setResetStatusFilter(e.target.value)}
                  className="bg-white/60 border border-white/30 rounded-xl px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm min-w-[90px]"
                >
                  <option value="">全部</option>
                  <option value="resetting">清零中</option>
                  <option value="reset_completed">已清零</option>
                  <option value="reset_rejected">拒绝清零</option>
                </select>
                {resetStatusFilter && (
                  <button
                    onClick={() => setResetStatusFilter('')}
                    className="px-2 md:px-3 py-1 md:py-2 bg-slate-500 text-white rounded-xl text-xs md:text-sm"
                  >
                    清除
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-2 md:gap-3">
                <label className="text-xs md:text-sm font-semibold text-slate-700">日期:</label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => {setDateFilter(e.target.value); setDateRangeFilter({startDate: '', endDate: ''});}}
                  className="bg-white/60 border border-white/30 rounded-xl px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm"
                />
                {dateFilter && (
                  <button
                    onClick={() => setDateFilter('')}
                    className="px-2 md:px-3 py-1 md:py-2 bg-slate-500 text-white rounded-xl text-xs md:text-sm"
                  >
                    清除
                  </button>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-1 md:gap-3">
                <label className="text-xs md:text-sm font-semibold text-slate-700 whitespace-nowrap">范围:</label>
                <input
                  type="date"
                  value={dateRangeFilter.startDate}
                  onChange={(e) => {setDateRangeFilter({...dateRangeFilter, startDate: e.target.value}); setDateFilter('');}}
                  className="bg-white/60 border border-white/30 rounded-xl px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm"
                />
                <span className="text-slate-600 text-xs md:text-sm">至</span>
                <input
                  type="date"
                  value={dateRangeFilter.endDate}
                  onChange={(e) => {setDateRangeFilter({...dateRangeFilter, endDate: e.target.value}); setDateFilter('');}}
                  className="bg-white/60 border border-white/30 rounded-xl px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm"
                />
                {(dateRangeFilter.startDate || dateRangeFilter.endDate) && (
                  <button
                    onClick={() => setDateRangeFilter({startDate: '', endDate: ''})}
                    className="px-2 md:px-3 py-1 md:py-2 bg-slate-500 text-white rounded-xl text-xs md:text-sm whitespace-nowrap"
                  >
                    清除
                  </button>
                )}
              </div>
              
              <button
                onClick={() => setShowNewRequest(true)}
                className="px-3 md:px-6 py-2 md:py-3 bg-blue-600 text-white font-semibold rounded-xl md:rounded-2xl text-xs md:text-sm whitespace-nowrap"
              >
                新建申请
              </button>
              

              
              {!isAdmin ? (
                <button
                  onClick={() => setShowAdminPanel(true)}
                  className="px-3 md:px-6 py-2 md:py-3 bg-purple-600 text-white font-semibold rounded-xl md:rounded-2xl text-xs md:text-sm whitespace-nowrap"
                >
                  管理员
                </button>
              ) : (
                <button
                  onClick={() => {setIsAdmin(false); setShowAdminPanel(false);}}
                  className="px-3 md:px-6 py-2 md:py-3 bg-slate-600 text-white font-semibold rounded-xl md:rounded-2xl text-xs md:text-sm whitespace-nowrap"
                >
                  退出管理
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 搜索框 */}
        <div className="backdrop-blur-xl bg-white/40 border border-white/20 rounded-3xl p-6 shadow-2xl">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索申请人、原因、邮箱或账户详情..."
                className="w-full bg-white/60 border border-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => {/* 搜索功能已经实时生效 */}}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              🔍 搜索
            </button>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-3 bg-slate-500 text-white font-semibold rounded-xl hover:bg-slate-600 transition-colors"
              >
                清除
              </button>
            )}
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/30 border border-white/20 rounded-3xl overflow-hidden shadow-2xl">
          {filteredRequests.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-2xl font-bold text-slate-700 mb-2">
                {(personFilter || statusFilter || resetStatusFilter || dateRangeFilter.startDate || dateRangeFilter.endDate || searchQuery) ? '没有找到符合条件的申请记录' : '暂无申请记录'}
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {filteredRequests.map((request) => (
                <div key={request.id} className="bg-white/50 border border-white/30 rounded-2xl p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">{request.user_name || request.requester}</h3>
                      <p className="text-slate-600">
                        {(request.request_type || request.type) === 'advertising' ? '广告账户' : 
                         (request.request_type || request.type) === 'page' ? '公共主页' : 
                         (request.request_type || request.type) === 'bm' ? 'Facebook BM' : 'Facebook个人号'}
                      </p>
                    </div>
                    
                    <div className="flex gap-2 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        request.urgency === 'high' ? 'bg-red-100 text-red-800' :
                        request.urgency === 'normal' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {request.urgency === 'high' ? '紧急' : request.urgency === 'normal' ? '普通' : '低'}
                      </span>
                      
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        request.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                        request.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {request.status === 'pending' ? '待处理' : 
                         request.status === 'approved' ? '已批准' : '已拒绝'}
                      </span>
                    </div>
                  </div>

                  {/* 申请进度跟踪 */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 mb-4">
                    <h4 className="font-bold text-blue-800 mb-3 flex items-center">
                      <span className="mr-2">📋</span>申请进度跟踪
                    </h4>
                    <div className="space-y-3">
                      {/* 进度条 */}
                      <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                            true ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                          }`}>
                            ✓
                          </div>
                          <div className={`flex-1 h-1 mx-2 ${
                            request.status !== 'pending' ? 'bg-green-500' : 'bg-gray-300'
                          } rounded`}></div>
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                            request.status !== 'pending' ? 'bg-green-500 text-white' : 
                            request.status === 'pending' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
                          }`}>
                            {request.status === 'pending' ? '⏳' : request.status === 'approved' ? '✓' : '✗'}
                          </div>
                          <div className={`flex-1 h-1 mx-2 ${
                            request.status === 'approved' && request.account_info ? 'bg-green-500' : 'bg-gray-300'
                          } rounded`}></div>
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                            request.status === 'approved' && request.account_info ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                          }`}>
                            {request.status === 'approved' && request.account_info ? '🎯' : '⏳'}
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-slate-600">
                          <span>提交成功</span>
                          <span>处理中</span>
                          <span>已完成</span>
                        </div>
                      </div>

                      {/* 详细状态 */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                        <div className="bg-white/60 rounded-lg p-3 text-center">
                          <div className="text-green-600 font-bold text-sm mb-1">✅ 申请已提交</div>
                          <div className="text-xs text-slate-500">
                            {request.created_at ? new Date(request.created_at).toLocaleDateString('zh-CN') : '未知'}
                          </div>
                        </div>
                        
                        <div className={`rounded-lg p-3 text-center ${
                          request.status === 'pending' ? 'bg-blue-100 border-2 border-blue-300' : 
                          request.status === 'approved' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <div className={`font-bold text-sm mb-1 ${
                            request.status === 'pending' ? 'text-blue-600' : 
                            request.status === 'approved' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {request.status === 'pending' ? '⏳ 管理员处理中' : 
                             request.status === 'approved' ? '✅ 申请已批准' : '❌ 申请被拒绝'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {request.processed_at ? 
                              new Date(request.processed_at).toLocaleDateString('zh-CN') : 
                              '等待处理中...'
                            }
                          </div>
                        </div>
                        
                        <div className={`rounded-lg p-3 text-center ${
                          request.status === 'approved' && request.account_info ? 'bg-purple-100' : 'bg-gray-100'
                        }`}>
                          <div className={`font-bold text-sm mb-1 ${
                            request.status === 'approved' && request.account_info ? 'text-purple-600' : 'text-gray-500'
                          }`}>
                            {request.status === 'approved' && request.account_info ? '🎯 账户已分配' : '⏳ 等待分配'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {request.status === 'approved' && request.account_info ? '可以开始使用' : '审批后分配'}
                          </div>
                        </div>
                      </div>

                      {/* 当前状态说明 */}
                      <div className="bg-white/80 rounded-lg p-3 border-l-4 border-blue-500">
                        <div className="text-sm font-medium text-slate-700 mb-1">当前状态：</div>
                        <div className="text-sm text-slate-600">
                          {request.status === 'pending' ? 
                            '您的申请已成功提交，管理员正在审核中，请耐心等待处理结果...' :
                           request.status === 'approved' ? 
                            (request.account_info ? 
                              '恭喜！您的申请已获批准，账户信息已分配，现在可以开始使用了。' : 
                              '您的申请已获批准，管理员正在为您分配账户信息，请稍候...') :
                            '很抱歉，您的申请未获批准，如有疑问请联系管理员了解详情。'
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-bold text-slate-700 mb-2">申请原因</h4>
                      <p className="text-slate-600 bg-white/60 rounded-xl p-3">{request.reason}</p>
                      {request.email && (
                        <p className="text-sm text-slate-500 mt-2">📧 {request.email}</p>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-bold text-slate-700 mb-2">时间信息</h4>
                      <div className="bg-white/60 rounded-xl p-3 space-y-1">
                        <p className="text-slate-600 text-sm">
                          <strong>申请时间:</strong> {request.created_at ? new Date(request.created_at).toLocaleString('zh-CN') : '未知时间'}
                        </p>
                        {request.processedAt && (
                          <p className="text-slate-600 text-sm">
                            <strong>处理时间:</strong> {request.processed_at ? new Date(request.processed_at).toLocaleString('zh-CN') : '未处理'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {!isAdmin && request.status === 'approved' && request.account_info && request.type === 'advertising' && (
                    <div className="border-t pt-4 mb-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                          <div>
                            <h4 className="font-bold text-blue-800 mb-1">账户管理操作</h4>
                            <p className="text-sm text-blue-600">
                              {request.accountStatus === 'reset_completed' ? 
                                '✅ 账户已清零完成，账户已废弃' : 
                                request.accountStatus === 'reset_rejected' ?
                                  '❌ 清零申请被拒绝，如有疑问请联系管理员' :
                                request.resetRequested ? 
                                  '⏳ 清零申请已提交，等待管理员处理...' : 
                                  '如需清零Facebook广告账户，请点击右侧按钮申请'
                              }
                            </p>
                          </div>
                          {!request.resetRequested && request.accountStatus !== 'reset_completed' && (
                            <button
                              onClick={() => handleResetRequest(request.id)}
                              className="px-4 py-2 bg-orange-600 text-white font-semibold rounded-xl whitespace-nowrap"
                            >
                              申请清零
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {isAdmin && (
                    <div className="border-t pt-4 space-y-3">
                      {request.resetRequested && request.resetStatus === 'pending' && (
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                            <div className="flex-1">
                              <h4 className="font-bold text-orange-800 mb-2">🔥 清零申请待处理</h4>
                              <div className="space-y-2">
                                <p className="text-sm text-orange-600">
                                  申请时间: {new Date(request.resetRequestTime).toLocaleString('zh-CN')}
                                </p>
                                {request.resetInfo && (
                                  <div className="bg-white/60 rounded-lg p-3">
                                    <p className="text-sm text-slate-700 mb-2">
                                      <strong>剩余余额:</strong> {request.resetInfo.remainingBalance}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <strong className="text-sm text-slate-700">余额截图:</strong>
                                      <img 
                                        src={request.resetInfo.screenshot} 
                                        alt="账户余额截图" 
                                        className="max-w-32 max-h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => {
                                          setModalImageSrc(request.resetInfo.screenshot);
                                          setShowImageModal(true);
                                        }}
                                      />
                                      <span className="text-xs text-slate-500">点击查看大图</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <button
                                onClick={() => handleProcessReset(request.id, 'approved')}
                                className="px-4 py-2 bg-green-600 text-white font-semibold rounded-xl text-sm"
                              >
                                清零成功
                              </button>
                              <button
                                onClick={() => handleProcessReset(request.id, 'rejected')}
                                className="px-4 py-2 bg-red-600 text-white font-semibold rounded-xl text-sm"
                              >
                                拒绝清零
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {request.status === 'pending' ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                          <h4 className="font-bold text-slate-800 mb-3">🔧 管理员操作</h4>
                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={() => {
                                const accountInfo = prompt('请输入分配的账户信息:');
                                if (accountInfo) {
                                  handleProcessRequest(request.id, 'approved', accountInfo);
                                }
                              }}
                              className="flex-1 min-w-[120px] px-4 py-2 md:px-6 md:py-3 bg-green-600 text-white font-bold rounded-xl text-sm"
                            >
                              批准申请
                            </button>
                            <button
                              onClick={() => handleProcessRequest(request.id, 'rejected')}
                              className="flex-1 min-w-[120px] px-4 py-2 md:px-6 md:py-3 bg-red-600 text-white font-bold rounded-xl text-sm"
                            >
                              拒绝申请
                            </button>
                            <button
                              onClick={() => handleDeleteRequest(request.id)}
                              className="px-4 py-2 md:px-6 md:py-3 bg-slate-600 text-white font-bold rounded-xl text-sm whitespace-nowrap"
                            >
                              删除记录
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                          <h4 className="font-bold text-slate-800 mb-2">🗑️ 记录管理</h4>
                          <button
                            onClick={() => handleDeleteRequest(request.id)}
                            className="px-6 py-3 bg-red-500 text-white font-semibold rounded-xl"
                          >
                            删除记录
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {request.account_info && request.status === 'approved' && (
                    <div className="border-t pt-4 mt-4">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                        <h4 className="font-bold text-emerald-800 mb-3 text-sm md:text-base">📋 账户详情信息</h4>
                        <div className="bg-white/60 rounded-xl p-3">
                          <div className="text-xs md:text-sm text-slate-600 break-words whitespace-pre-wrap">
                            <strong>详情:</strong> {request.account_info.details}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {showNewRequest && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-blue-600">新建账户申请</h3>
                <button
                  onClick={() => setShowNewRequest(false)}
                  className="w-8 h-8 bg-slate-500 text-white rounded-full"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">申请人</label>
                  <select
                    value={newRequest.requester}
                    onChange={(e) => setNewRequest({...newRequest, requester: e.target.value})}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3"
                    required
                  >
                    <option value="">请选择申请人</option>
                    {advertisers.map(advertiser => (
                      <option key={advertiser} value={advertiser}>{advertiser}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">申请类型</label>
                  <select
                    value={newRequest.type}
                    onChange={(e) => setNewRequest({...newRequest, type: e.target.value})}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3"
                  >
                    <option value="advertising">广告账户</option>
                    <option value="page">公共主页</option>
                    <option value="facebook">Facebook个人号</option>
                    <option value="bm">Facebook BM</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">紧急程度</label>
                  <select
                    value={newRequest.urgency}
                    onChange={(e) => setNewRequest({...newRequest, urgency: e.target.value})}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3"
                  >
                    <option value="low">低</option>
                    <option value="normal">普通</option>
                    <option value="high">紧急</option>
                  </select>
                </div>
                
                {newRequest.type === 'advertising' && (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Facebook邮箱</label>
                      <input
                        type="email"
                        value={newRequest.email}
                        onChange={(e) => setNewRequest({...newRequest, email: e.target.value})}
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3"
                        placeholder="请输入Facebook个人邮箱"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">个人主页链接</label>
                      <input
                        type="url"
                        value={newRequest.profileLink}
                        onChange={(e) => setNewRequest({...newRequest, profileLink: e.target.value})}
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3"
                        placeholder="请输入Facebook个人主页链接"
                        required
                      />
                    </div>
                  </>
                )}
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">申请原因</label>
                  <textarea
                    value={newRequest.reason}
                    onChange={(e) => setNewRequest({...newRequest, reason: e.target.value})}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 h-32 resize-none"
                    placeholder="请详细说明申请原因..."
                    required
                  />
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl"
                  >
                    提交申请
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewRequest(false)}
                    className="px-6 py-3 bg-slate-500 text-white font-bold rounded-xl"
                  >
                    取消
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showAdminPanel && !isAdmin && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl md:text-2xl font-bold text-purple-600">管理员登录</h3>
                <button
                  onClick={() => setShowAdminPanel(false)}
                  className="w-8 h-8 bg-slate-500 text-white rounded-full"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">管理员密码</label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3"
                    placeholder="请输入管理员密码"
                  />
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleAdminLogin}
                    className="flex-1 px-6 py-3 bg-purple-600 text-white font-bold rounded-xl"
                  >
                    登录
                  </button>
                  <button
                    onClick={() => setShowAdminPanel(false)}
                    className="px-6 py-3 bg-slate-500 text-white font-bold rounded-xl"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showResetDialog && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl md:text-2xl font-bold text-orange-600">申请账户清零</h3>
                <button
                  onClick={() => setShowResetDialog(false)}
                  className="w-8 h-8 bg-slate-500 text-white rounded-full"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center space-x-4">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${resetDialogStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                    1
                  </div>
                  <div className={`flex-1 h-1 ${resetDialogStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'} rounded`}></div>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${resetDialogStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                    2
                  </div>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-sm font-medium text-slate-600">填写余额</span>
                  <span className="text-sm font-medium text-slate-600">上传截图</span>
                </div>
              </div>

              {resetDialogStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">第一步：填写账户剩余余额</label>
                    <input
                      type="text"
                      value={resetFormData.balance}
                      onChange={(e) => setResetFormData({...resetFormData, balance: e.target.value})}
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3"
                      placeholder="请输入账户剩余余额，例如：$123.45"
                    />
                    <p className="text-xs text-slate-500 mt-1">请准确填写当前账户的剩余金额</p>
                  </div>
                  
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={handleResetStep1}
                      className="flex-1 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl"
                    >
                      下一步
                    </button>
                    <button
                      onClick={() => setShowResetDialog(false)}
                      className="px-6 py-3 bg-slate-500 text-white font-bold rounded-xl"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}

              {resetDialogStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">第二步：上传账户余额截图</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                      {resetFormData.screenshotPreview ? (
                        <div>
                          <img 
                            src={resetFormData.screenshotPreview} 
                            alt="账户余额截图" 
                            className="max-w-full max-h-48 mx-auto rounded-lg border"
                          />
                          <p className="text-sm text-green-600 mt-2">✓ 截图已上传</p>
                        </div>
                      ) : (
                        <div>
                          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <p className="mt-2 text-sm text-gray-600">点击选择账户余额截图</p>
                          <p className="text-xs text-gray-500">支持 JPG, PNG 格式</p>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotUpload}
                      className="hidden"
                      id="screenshot-upload"
                    />
                    <label
                      htmlFor="screenshot-upload"
                      className="mt-2 inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
                    >
                      {resetFormData.screenshotPreview ? '重新选择' : '选择文件'}
                    </label>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>已填写余额：</strong>{resetFormData.balance}
                    </p>
                  </div>
                  
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => setResetDialogStep(1)}
                      className="px-6 py-3 bg-gray-500 text-white font-bold rounded-xl"
                    >
                      上一步
                    </button>
                    <button
                      onClick={submitResetRequest}
                      className="flex-1 px-6 py-3 bg-orange-600 text-white font-bold rounded-xl"
                    >
                      提交申请
                    </button>
                    <button
                      onClick={() => setShowResetDialog(false)}
                      className="px-6 py-3 bg-slate-500 text-white font-bold rounded-xl"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 图片查看模态框 */}
        {showImageModal && modalImageSrc && (
          <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
            onClick={() => setShowImageModal(false)}
          >
            <div className="max-w-4xl max-h-[90vh] relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute -top-12 right-0 w-10 h-10 bg-white/20 text-white rounded-full hover:bg-white/40 transition-colors z-10 flex items-center justify-center text-xl font-bold"
              >
                ×
              </button>
              <img 
                src={modalImageSrc} 
                alt="账户余额截图大图" 
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl cursor-pointer"
                onClick={() => setShowImageModal(false)}
                onError={(e) => {
                  console.error('Image failed to load:', modalImageSrc);
                  e.target.style.display = 'none';
                }}
              />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
                点击图片或背景关闭
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountRequests;