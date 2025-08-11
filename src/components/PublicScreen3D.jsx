import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

const PublicScreen = ({ refreshTrigger }) => {
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 加载历史操作记录
  useEffect(() => {
    loadOperations();
  }, [refreshTrigger]);

  // 设置实时订阅
  useEffect(() => {
    // 订阅充值操作
    const rechargeChannel = supabase
      .channel('recharge_operations_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'app_e87b41cfe355428b8146f8bae8184e10_recharge_operations'
        },
        (payload) => {
          console.log('新充值操作:', payload);
          handleNewOperation(payload.new, 'recharge');
        }
      )
      .subscribe();

    // 订阅清零操作
    const zeroingChannel = supabase
      .channel('zeroing_operations_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'app_e87b41cfe355428b8146f8bae8184e10_reset_operations'
        },
        (payload) => {
          console.log('新清零操作:', payload);
          handleNewOperation(payload.new, 'zeroing');
        }
      )
      .subscribe();

    return () => {
      rechargeChannel.unsubscribe();
      zeroingChannel.unsubscribe();
    };
  }, []);

  const loadOperations = async () => {
    try {
      setLoading(true);
      
      // 获取最近50条充值记录
      const { data: rechargeOps, error: rechargeError } = await supabase
        .from('app_e87b41cfe355428b8146f8bae8184e10_recharge_operations')
        .select(`
          *,
          staff:personnel_id(name, name_en)
        `)
        .order('created_at', { ascending: false })
        .limit(25);

      if (rechargeError) throw rechargeError;

      // 获取最近50条清零记录
      const { data: zeroingOps, error: zeroingError } = await supabase
        .from('app_e87b41cfe355428b8146f8bae8184e10_reset_operations')
        .select(`
          *,
          staff:personnel_id(name, name_en)
        `)
        .order('created_at', { ascending: false })
        .limit(25);

      if (zeroingError) throw zeroingError;

      // 合并并按时间排序
      const allOps = [
        ...(rechargeOps || []).map(op => ({ ...op, type: 'recharge' })),
        ...(zeroingOps || []).map(op => ({ ...op, type: 'zeroing' }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setOperations(allOps.slice(0, 50)); // 保持50条最新记录
    } catch (error) {
      console.error('加载操作记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewOperation = async (newOp, type) => {
    // 获取完整数据（包括关联的staff信息）
    try {
      const tableName = type === 'recharge' 
        ? 'app_e87b41cfe355428b8146f8bae8184e10_recharge_operations' 
        : 'app_e87b41cfe355428b8146f8bae8184e10_reset_operations';
      const { data, error } = await supabase
        .from(tableName)
        .select(`
          *,
          staff:personnel_id(name, name_en)
        `)
        .eq('id', newOp.id)
        .single();

      if (error) throw error;

      const operationWithType = { ...data, type };
      
      // 添加到列表顶部
      setOperations(prev => [operationWithType, ...prev.slice(0, 49)]);
      
      // 显示新操作通知
      showNotification(operationWithType);
    } catch (error) {
      console.error('处理新操作失败:', error);
    }
  };

  const showNotification = (operation) => {
    // 可以在这里添加通知效果，比如闪烁效果
    setIsVisible(false);
    setTimeout(() => setIsVisible(true), 100);
  };

  const formatTime = (timeString) => {
    return new Date(timeString).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow h-full">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            实时操作
          </h3>
          <div className="text-xs text-gray-500">
            {currentTime.toLocaleTimeString('zh-CN')}
          </div>
        </div>
        
        {/* 统计数据 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-blue-600 text-xs font-medium">今日充值</div>
            <div className="text-blue-900 text-lg font-bold">
              {operations.filter(op => 
                op.type === 'recharge' && 
                new Date(op.created_at).toDateString() === new Date().toDateString()
              ).length}
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="text-red-600 text-xs font-medium">今日清零</div>
            <div className="text-red-900 text-lg font-bold">
              {operations.filter(op => 
                op.type === 'zeroing' && 
                new Date(op.created_at).toDateString() === new Date().toDateString()
              ).length}
            </div>
          </div>
        </div>
      </div>

      {/* 操作列表 */}
      <div className="p-4">
        <div className="h-96 overflow-y-auto space-y-2">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-500 text-sm">加载中...</p>
            </div>
          ) : operations.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-2xl mb-2">📈</div>
              <p className="text-gray-500 text-sm">暂无记录</p>
            </div>
          ) : (
            operations.map((operation, index) => (
              <div 
                key={`${operation.type}-${operation.id}`}
                className={`border rounded-lg p-3 transition-colors duration-200 ${
                  operation.type === 'recharge' 
                    ? 'border-blue-200 bg-blue-50/50 hover:bg-blue-50' 
                    : 'border-red-200 bg-red-50/50 hover:bg-red-50'
                } ${
                  index === 0 ? 'ring-1 ring-yellow-300' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      operation.type === 'recharge' ? 'bg-blue-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <div className="text-gray-900 font-medium text-sm">
                        {operation.staff?.name || '未知人员'}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {operation.staff?.name_en}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-medium ${
                      operation.type === 'recharge' ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      {operation.type === 'recharge' ? '充值' : '清零'}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {formatTime(operation.created_at)}
                    </div>
                  </div>
                </div>
                
                <div className="pl-4 space-y-1">
                  <div className="text-gray-700 text-xs">
                    账户: {operation.account_name}
                  </div>
                  <div className="text-gray-500 text-xs font-mono">
                    {operation.ad_account_id}
                  </div>
                  {operation.type === 'recharge' && operation.amount && (
                    <div className="text-green-600 text-xs font-medium">
                      金额: {formatAmount(operation.amount)}
                    </div>
                  )}
                  {operation.type === 'zeroing' && operation.balance && (
                    <div className="text-orange-600 text-xs font-medium">
                      余额: {formatAmount(operation.balance)}
                    </div>
                  )}
                  {operation.operator_name && (
                    <div className="text-purple-600 text-xs">
                      操作人: {operation.operator_name}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicScreen;