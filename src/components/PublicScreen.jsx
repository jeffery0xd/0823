import React, { useState, useEffect } from 'react';
import { rechargeOperationsService, resetOperationsService, subscriptions, accountService, personnelService } from '../services/accountManagementService';
import ImagePreviewModal from './ImagePreviewModal';

const PublicScreen = ({ refreshTrigger }) => {
  const [operations, setOperations] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'recharge', 'reset'
  const [dateFilter, setDateFilter] = useState('today'); // 'today', 'week', 'all'
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(false);
  const [subscriptionChannels, setSubscriptionChannels] = useState([]);
  const [todayStats, setTodayStats] = useState({ totalRecharge: 0, totalReset: 0 });
  const [allAccounts, setAllAccounts] = useState([]);
  const [allPersonnel, setAllPersonnel] = useState([]);
  const [alerts, setAlerts] = useState({
    personnelRechargeStatus: [],
    accountsWithoutRecharge: [],
    disabledAccountsWithoutReset: []
  });
  const [imagePreview, setImagePreview] = useState({
    isOpen: false,
    imageUrl: '',
    imageName: ''
  });
  const [deletingOperations, setDeletingOperations] = useState(new Set());

  // 投放人员固定头像映射
  const getAvatarForOperator = (operatorName) => {
    if (!operatorName) return '👤';
    
    // 固定映射关系
    const fixedAvatarMapping = {
      '丁': '🐶',
      '青': '🦊', 
      '妹': '🐱',
      '小丁': '🐶',
      '小青': '🦊',
      '小妹': '🐱',
      '阿丁': '🐶',
      '阿青': '🦊',
      '阿妹': '🐱'
    };
    
    // 检查是否有固定映射
    for (const [name, avatar] of Object.entries(fixedAvatarMapping)) {
      if (operatorName.includes(name)) {
        return avatar;
      }
    }
    
    // 默认头像池
    const defaultAvatars = ['🐼', '🐰', '🐿️', '🐨', '🐹', '🐸'];
    const hash = operatorName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return defaultAvatars[Math.abs(hash) % defaultAvatars.length];
  };

  // 按投放人员分组操作记录
  const getGroupedOperations = () => {
    const grouped = {};
    operations.forEach(op => {
      const operator = op.operator_name || '未分配';
      if (!grouped[operator]) {
        grouped[operator] = [];
      }
      grouped[operator].push(op);
    });
    
    // 按时间排序每个组内的记录
    Object.keys(grouped).forEach(operator => {
      grouped[operator].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    });
    
    return grouped;
  };

  useEffect(() => {
    loadAllData();
    setupRealtimeSubscriptions();

    return () => {
      // Cleanup subscriptions
      subscriptionChannels.forEach(channel => {
        channel.unsubscribe();
      });
    };
  }, [refreshTrigger]);

  useEffect(() => {
    loadAllData();
  }, [filter, dateFilter, customDateRange]);

  // 加载所有数据
  const loadAllData = async () => {
    try {
      // 并行加载所有数据
      const [accountsData, personnelData] = await Promise.all([
        accountService.getAll(),
        personnelService.getAll()
      ]);
      
      setAllAccounts(accountsData);
      setAllPersonnel(personnelData);
      
      // 加载操作记录
      await loadOperations();
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const setupRealtimeSubscriptions = () => {
    try {
      // Subscribe to recharge operations
      const rechargeChannel = subscriptions.subscribeToRechargeOperations((payload) => {
        console.log('New recharge operation detected, reloading...');
        // 立即重新加载操作记录
        setTimeout(() => {
          loadOperations();
        }, 100); // 短暂延迟确保数据已写入
      });

      // Subscribe to reset operations
      const resetChannel = subscriptions.subscribeToResetOperations((payload) => {
        console.log('New reset operation detected, reloading...');
        // 立即重新加载操作记录
        setTimeout(() => {
          loadOperations();
        }, 100); // 短暂延迟确保数据已写入
      });

      setSubscriptionChannels([rechargeChannel, resetChannel]);
    } catch (error) {
      console.error('设置实时订阅失败:', error);
    }
  };

  const loadOperations = async () => {
    try {
      setLoading(true);
      
      let rechargeOps = [];
      let resetOps = [];

      // 总是获取所有数据，然后在前端过滤，避免时区问题
      if (filter === 'all' || filter === 'recharge') {
        rechargeOps = await rechargeOperationsService.getAll();
      }

      if (filter === 'all' || filter === 'reset') {
        resetOps = await resetOperationsService.getAll();
      }

      // Combine and sort operations
      const allOps = [
        ...rechargeOps.map(op => ({ ...op, type: 'recharge' })),
        ...resetOps.map(op => ({ ...op, type: 'reset' }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Apply date filter
      let filteredOps = allOps;
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          const today = new Date().toISOString().split('T')[0];
          filteredOps = allOps.filter(op => {
            if (!op.created_at) return false;
            const opDate = new Date(op.created_at).toISOString().split('T')[0];
            return opDate === today;
          });
          break;
        case 'week':
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          filteredOps = allOps.filter(op => {
            if (!op.created_at) return false;
            return new Date(op.created_at) >= weekAgo;
          });
          break;
        case 'month':
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          filteredOps = allOps.filter(op => {
            if (!op.created_at) return false;
            return new Date(op.created_at) >= monthAgo;
          });
          break;
        case 'custom':
          if (customDateRange.start && customDateRange.end) {
            const startDate = new Date(customDateRange.start);
            const endDate = new Date(customDateRange.end);
            endDate.setHours(23, 59, 59, 999); // 包含结束日期的整天
            filteredOps = allOps.filter(op => {
              if (!op.created_at) return false;
              const opDate = new Date(op.created_at);
              return opDate >= startDate && opDate <= endDate;
            });
          }
          break;
        case 'all':
        default:
          filteredOps = allOps;
          break;
      }

      console.log('加载的操作记录:', 
        '总计:', allOps.length, 
        '筛选后:', filteredOps.length, 
        '日期筛选:', dateFilter
      );

      setOperations(filteredOps);
      
      // 计算今日统计数据，使用所有数据而不是过滤后的数据
      calculateTodayStats(allOps);
      
      // 计算提醒信息，使用所有数据而不是过滤后的数据
      calculateAlerts(allOps);
    } catch (error) {
      console.error('加载操作记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 计算今日统计数据
  const calculateTodayStats = (allOperations) => {
    const today = new Date().toISOString().split('T')[0];
    const todayOps = allOperations.filter(op => 
      new Date(op.created_at).toISOString().split('T')[0] === today
    );

    const totalRecharge = todayOps
      .filter(op => op.type === 'recharge')
      .reduce((sum, op) => sum + (parseFloat(op.amount) || 0), 0);

    const totalReset = todayOps.filter(op => op.type === 'reset').length;

    setTodayStats({ totalRecharge, totalReset });
  };

  // 计算提醒信息 - 按人员统计账户充值状态
  const calculateAlerts = (allOperations) => {
    // 安全检查
    if (!Array.isArray(allOperations)) {
      console.warn('calculateAlerts: allOperations is not an array');
      return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const todayRechargeOps = allOperations.filter(op => 
      op.type === 'recharge' && 
      new Date(op.created_at).toISOString().split('T')[0] === today
    );
    const todayResetOps = allOperations.filter(op => 
      op.type === 'reset' && 
      new Date(op.created_at).toISOString().split('T')[0] === today
    );

    // 按人员分组统计账户充值状态
    const personnelRechargeStatus = [];
    const rechargedAccountsToday = new Set(todayRechargeOps.map(op => op.ad_account_id));
    
    allPersonnel.forEach(person => {
      // 获取该人员的所有活跃账户（排除已清零账户）
      const personAccounts = allAccounts.filter(account => 
        account.personnel_id === person.id && 
        (account.status === 'Active' || account.status === 'active') &&
        account.status !== 'Reset' && account.status !== 'reset'
      );
      
      if (personAccounts.length > 0) {
        // 计算未充值的账户
        const unchargedAccounts = personAccounts.filter(account => 
          !rechargedAccountsToday.has(account.ad_account_id)
        );
        
        personnelRechargeStatus.push({
          personnel: person,
          totalAccounts: personAccounts.length,
          rechargedAccounts: personAccounts.length - unchargedAccounts.length,
          unchargedAccounts: unchargedAccounts.length,
          unchargedAccountsList: unchargedAccounts
        });
      }
    });

    // 2. 计算今日没有充值的账户（全局视图，排除已清零账户）
    const accountsWithoutRecharge = allAccounts.filter(account => 
      (account.status === 'Active' || account.status === 'active') && 
      account.status !== 'Reset' && account.status !== 'reset' &&
      !rechargedAccountsToday.has(account.ad_account_id)
    );

    // 3. 计算禁用状态但未清零的账户
    const resetAccountsToday = new Set(todayResetOps.map(op => op.ad_account_id));
    const disabledAccounts = allAccounts.filter(account => 
      account.status === 'Disabled' || account.status === 'disabled'
    );
    const disabledAccountsWithoutReset = disabledAccounts.filter(account => 
      !resetAccountsToday.has(account.ad_account_id)
    );

    setAlerts({
      personnelRechargeStatus,
      accountsWithoutRecharge,
      disabledAccountsWithoutReset
    });
  };

  const formatOperationText = (operation) => {
    if (operation.type === 'recharge') {
      return `账户：${operation.account_name}  Ad account ID: ${operation.ad_account_id} 充值 $${operation.amount}`;
    } else {
      // 清零操作显示余额金额 - 修复0值显示问题
      let balanceAmount = '未知金额';
      if (operation.balance !== undefined && operation.balance !== null && operation.balance !== '') {
        const balance = parseFloat(operation.balance);
        if (!isNaN(balance)) {
          balanceAmount = `$${balance.toFixed(2)}`;
        }
      }
      return `账户：${operation.account_name}  Ad account ID: ${operation.ad_account_id} 清零余额 ${balanceAmount}`;
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // Show temporary success message
      const button = event.target;
      const originalText = button.textContent;
      button.textContent = '已复制!';
      button.classList.add('bg-green-600');
      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('bg-green-600');
      }, 1000);
    } catch (error) {
      console.error('复制失败:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const copyAllOperations = async (type) => {
    const filteredOps = operations.filter(op => type === 'all' || op.type === type);
    const text = filteredOps.map(op => formatOperationText(op)).join('\n');
    await copyToClipboard(text);
  };

  const getTodayOperations = (type) => {
    const today = new Date().toISOString().split('T')[0];
    return operations.filter(op => {
      const opDate = new Date(op.created_at).toISOString().split('T')[0];
      return opDate === today && (type === 'all' || op.type === type);
    });
  };

  // 删除操作记录
  const deleteOperation = async (operation) => {
    if (!confirm(`确定要删除这条${operation.type === 'recharge' ? '充值' : '清零'}记录吗？`)) {
      return;
    }

    try {
      setDeletingOperations(prev => new Set([...prev, operation.id]));

      if (operation.type === 'recharge') {
        await rechargeOperationsService.delete(operation.id);
      } else {
        await resetOperationsService.delete(operation.id);
      }

      // 从当前显示列表中移除
      setOperations(prev => {
        if (!Array.isArray(prev)) return [];
        return prev.filter(op => op.id !== operation.id);
      });
      
      // 重新计算统计数据
      const updatedOperations = operations.filter(op => op.id !== operation.id);
      calculateAlerts(updatedOperations);
      
    } catch (error) {
      console.error('删除操作失败:', error);
      alert('删除失败: ' + (error.message || '请重试'));
    } finally {
      setDeletingOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(operation.id);
        return newSet;
      });
    }
  };

  // 预览图片 - 增强错误处理和URL验证
  const previewImage = (imageUrl, imageName) => {
    console.log('开始预览图片:', { imageUrl, imageName });
    
    // 基础验证
    if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
      console.error('图片地址无效:', imageUrl);
      alert('图片地址无效，无法预览');
      return;
    }
    
    let processedUrl = imageUrl.trim();
    
    // URL格式验证
    try {
      const url = new URL(processedUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('不支持的协议');
      }
    } catch (error) {
      console.error('URL格式错误:', error, imageUrl);
      alert('图片URL格式错误，无法预览');
      return;
    }
    
    // Supabase storage URL 特殊处理
    if (processedUrl.includes('supabase.co/storage/') || processedUrl.includes('supabase')) {
      console.log('检测到Supabase存储URL，进行格式优化');
      
      // 确保URL包含时间戳以避免缓存问题
      if (!processedUrl.includes('_retry=') && !processedUrl.includes('t=')) {
        const separator = processedUrl.includes('?') ? '&' : '?';
        processedUrl = `${processedUrl}${separator}t=${Date.now()}`;
      }
      
      console.log('优化后的Supabase URL:', processedUrl);
    }
    
    // 预检查图片是否可访问（异步）
    const testImage = new Image();
    testImage.onload = () => {
      console.log('图片预检查成功，尺寸:', testImage.naturalWidth, 'x', testImage.naturalHeight);
    };
    testImage.onerror = (e) => {
      console.warn('图片预检查失败，但仍然尝试在模态框中加载:', e);
    };
    testImage.src = processedUrl;
    
    // 设置预览状态
    setImagePreview({
      isOpen: true,
      imageUrl: processedUrl,
      imageName: imageName || '清零截图'
    });
    
    console.log('图片预览模态框已打开:', { 
      processedUrl, 
      imageName: imageName || '清零截图' 
    });
  };

  // 关闭图片预览
  const closeImagePreview = () => {
    console.log('关闭图片预览模态框');
    setImagePreview({
      isOpen: false,
      imageUrl: '',
      imageName: ''
    });
  };

  return (
    <div className="h-full bg-gray-50 overflow-hidden">
      {/* 紧凑的头部区域 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="text-xl font-bold text-gray-800">实时公屏</h3>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              实时更新
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => copyAllOperations('recharge')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 text-sm rounded transition-colors"
              title="复制今日所有充值"
            >
              📊 充值({getTodayOperations('recharge').length})
            </button>
            <button
              onClick={() => copyAllOperations('reset')}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 text-sm rounded transition-colors"
              title="复制今日所有清零"
            >
              🔄 清零({getTodayOperations('reset').length})
            </button>
            <button
              onClick={() => copyAllOperations('all')}
              className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 text-sm rounded transition-colors"
              title="复制今日所有操作"
            >
              📋 全部({getTodayOperations('all').length})
            </button>
          </div>
        </div>
      </div>

      {/* 今日数据总览 - 重新设计 */}
      <div className="px-6 py-3 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-base font-semibold text-gray-700">📊 今日数据</span>
              <span className="text-xs text-gray-500 bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                {new Date().toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">充值:</span>
                <span className="text-lg font-bold text-blue-600">
                  ${todayStats.totalRecharge.toFixed(2)}
                </span>
                <span className="text-xs text-gray-500">({getTodayOperations('recharge').length}笔)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600">清零:</span>
                <span className="text-lg font-bold text-red-600">
                  {todayStats.totalReset}
                </span>
                <span className="text-xs text-gray-500">次</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 智能提醒区域 - 紧凑设计 */}
      {(alerts.personnelRechargeStatus?.some(p => p.unchargedAccounts > 0) || 
        alerts.disabledAccountsWithoutReset?.length > 0) && (
        <div className="px-6 py-3 bg-orange-50 border-l-4 border-orange-400">
          <h5 className="text-sm font-semibold text-orange-700 mb-2 flex items-center gap-1">
            ⚠️ 智能提醒
          </h5>
          <div className="space-y-2">
            {/* 按人员显示账户充值状态 - 紧凑设计 */}
            {alerts.personnelRechargeStatus?.map(status => {
              if (status.unchargedAccounts === 0) {
                // 所有账户都已充值
                return (
                  <div key={status.personnel.id} className="flex items-center gap-2 text-sm">
                    <span className="text-green-600">✅</span>
                    <span className="text-green-700">
                      {getAvatarForOperator(status.personnel.name)} {status.personnel.name}：
                      所有账户充值已完成 ({status.totalAccounts}个)
                    </span>
                  </div>
                );
              } else {
                // 有未充值的账户
                return (
                  <div key={status.personnel.id} className="text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-orange-600">👤</span>
                      <span className="text-orange-700 font-medium">
                        {getAvatarForOperator(status.personnel.name)} {status.personnel.name}：
                        {status.unchargedAccounts}个账户未充值
                        {status.rechargedAccounts > 0 && (
                          <span className="text-green-600 ml-1">
                            (已充值{status.rechargedAccounts}个)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 ml-6">
                      {status.unchargedAccountsList.map(account => (
                        <span key={account.id} className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs">
                          {account.account_name}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              }
            })}

            {/* 禁用账户未清零提醒 - 紧凑设计 */}
            {alerts.disabledAccountsWithoutReset?.length > 0 && (
              <div className="text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-red-600">🚫</span>
                  <span className="text-red-700 font-medium">
                    禁用状态但未清零的账户 ({alerts.disabledAccountsWithoutReset.length}个)
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 ml-6">
                  {alerts.disabledAccountsWithoutReset.map(account => (
                    <span key={account.id} className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">
                      {account.account_name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 筛选区域 - 紧凑设计 */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-white border border-gray-300 text-gray-700 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">全部操作</option>
              <option value="recharge">仅充值</option>
              <option value="reset">仅清零</option>
            </select>
            
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-white border border-gray-300 text-gray-700 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="today">今日</option>
              <option value="week">近7天</option>
              <option value="month">近30天</option>
              <option value="custom">自定义</option>
              <option value="all">全部</option>
            </select>
            
            {dateFilter === 'custom' && (
              <>
                <input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="bg-white border border-gray-300 text-gray-700 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <span className="text-gray-500 text-sm">至</span>
                <input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="bg-white border border-gray-300 text-gray-700 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </>
            )}
          </div>
          
          <button
            onClick={loadOperations}
            disabled={loading}
            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 text-sm rounded transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? '刷新中' : '刷新'}
          </button>
        </div>
      </div>

      {/* 操作记录列表 - 重新设计 */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">正在加载操作记录...</p>
            </div>
          </div>
        ) : operations.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📊</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-700 mb-2">暂无操作记录</h4>
              <p className="text-sm text-gray-500 mb-4">
                {dateFilter === 'today' ? '今日还没有充值或清零操作' : '选择的时间范围内没有操作记录'}
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <div className="text-xs text-blue-700 space-y-1">
                  <div>• 充值和清零操作将实时显示</div>
                  <div>• 支持一键复制导出记录</div>
                  <div>• 可按时间范围筛选查看</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto px-6 py-4 space-y-4">
            {Object.entries(getGroupedOperations()).map(([operator, operatorOps]) => (
              <div key={operator} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* 投放人员区域头部 - 紧凑设计 */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getAvatarForOperator(operator)}</span>
                      <span className="font-semibold text-gray-800">{operator}</span>
                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                        {operatorOps.length}条记录
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const text = operatorOps.map(op => formatOperationText(op)).join('\n');
                        copyToClipboard(text);
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs transition-colors"
                      title={`复制${operator}的所有记录`}
                    >
                      📋 复制
                    </button>
                  </div>
                </div>
                
                {/* 操作记录列表 - 紧凑设计 */}
                <div className="p-3 space-y-2">
                  {operatorOps.map((operation) => (
                    <div key={`${operation.type}-${operation.id}`} className="bg-gray-50 rounded p-3 hover:bg-gray-100 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              operation.type === 'recharge' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {operation.type === 'recharge' ? '💰 充值' : '🔄 清零'}
                            </span>
                            <span className="text-gray-500 text-xs">
                              {new Date(operation.created_at).toLocaleString('zh-CN', {
                                month: 'numeric',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          
                          <div className="text-gray-800 text-sm font-mono bg-white p-2 rounded border break-all">
                            <span>{formatOperationText(operation)}</span>
                            {/* 特别突出清零金额 - 修复0值显示 */}
                            {operation.type === 'reset' && (
                              <span className="inline-block ml-2 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">
                                {(() => {
                                  if (operation.balance !== undefined && operation.balance !== null && operation.balance !== '') {
                                    const balance = parseFloat(operation.balance);
                                    if (!isNaN(balance)) {
                                      return `余额: $${balance.toFixed(2)}`;
                                    }
                                  }
                                  return '余额: 未知金额';
                                })()}
                              </span>
                            )}
                          </div>

                          {/* 清零截图预览 */}
                          {operation.type === 'reset' && operation.screenshot_url && (
                            <div className="mt-2">
                              <button
                                onClick={() => previewImage(
                                  operation.screenshot_url, 
                                  `${operation.account_name}_清零截图_${new Date(operation.created_at).toLocaleString('zh-CN')}`
                                )}
                                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs transition-colors"
                                title="点击预览截图"
                              >
                                🖼️ 查看截图
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-1 ml-2">
                          <button
                            onClick={() => copyToClipboard(formatOperationText(operation))}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs transition-colors flex-shrink-0"
                            title="复制此条记录"
                          >
                            📋
                          </button>
                          
                          <button
                            onClick={() => deleteOperation(operation)}
                            disabled={deletingOperations.has(operation.id)}
                            className="bg-red-100 hover:bg-red-200 text-red-600 px-2 py-1 rounded text-xs transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={`删除此条${operation.type === 'recharge' ? '充值' : '清零'}记录`}
                          >
                            {deletingOperations.has(operation.id) ? '⏳' : '🗑️'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 图片预览模态框 */}
      <ImagePreviewModal
        isOpen={imagePreview.isOpen}
        onClose={closeImagePreview}
        imageUrl={imagePreview.imageUrl}
        imageName={imagePreview.imageName}
      />
    </div>
  );
};

export default PublicScreen;
