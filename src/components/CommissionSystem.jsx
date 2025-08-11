import React, { useState, useEffect } from 'react';
import { commissionService } from '../data/commissionService';

const CommissionSystem = () => {
  const [loading, setLoading] = useState(false);
  const [displayData, setDisplayData] = useState([]); // 当前显示的提成数据
  const [displayDate, setDisplayDate] = useState('2025-08-10'); // 当前显示的日期
  const [monthlyCommission, setMonthlyCommission] = useState([]);
  const [selectedDate, setSelectedDate] = useState('2025-08-10'); // 提成计算工具选择的日期
  const [selectedMonth, setSelectedMonth] = useState('2025-08'); // 当前选择的月份
  const [isCalculating, setIsCalculating] = useState(false);
  const [lastCalculatedDate, setLastCalculatedDate] = useState('');
  const [dataRange, setDataRange] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [dataUpdateInfo, setDataUpdateInfo] = useState(null); // 数据更新信息
  const [lastRefreshTime, setLastRefreshTime] = useState(null); // 最后刷新时间
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true); // 自动刷新开关
  
  // 员工列表
  const employees = ['乔', '白', '妹'];
  const currentYear = 2025;
  
  // 可选月份
  const availableMonths = [
    { value: '2025-07', label: '2025年7月', dateRange: { min: '2025-07-14', max: '2025-07-31' } },
    { value: '2025-08', label: '2025年8月', dateRange: { min: '2025-08-01', max: '2025-08-10' } }
  ];
  
  // 获取当前选择月份的信息
  const getCurrentMonthInfo = () => {
    return availableMonths.find(month => month.value === selectedMonth) || availableMonths[1];
  };

  // 加载指定日期的提成数据（增强版，包含数据更新信息）
  const loadCommissionDataForDate = async (date) => {
    try {
      console.log('加载日期的提成数据:', date);
      
      // 先验证日期是否有数据
      const validation = await commissionService.validateDateHasData(date);
      console.log('日期验证结果:', validation);
      
      const data = await commissionService.getCommissionRecords({ date: date });
      console.log('提成数据结果:', data);
      
      // 获取数据更新信息
      const updateInfo = await commissionService.getDataLastUpdateTime(date);
      console.log('数据更新信息:', updateInfo);
      setDataUpdateInfo(updateInfo);
      
      // 确保返回三位员工的完整数据
      const completeData = employees.map(emp => {
        const record = data.find(r => r.advertiser === emp);
        return record || {
          advertiser: emp,
          date: date,
          order_count: 0,
          roi: 0,
          commission_per_order: 0,
          total_commission: 0,
          commission_status: 'no_data'
        };
      });
      
      setDisplayData(completeData);
      setDisplayDate(date);
      setLastRefreshTime(new Date().toISOString());
      
      return { hasData: validation.hasData, recordsFound: data.length };
    } catch (error) {
      console.error('加载提成数据失败:', error);
      throw error;
    }
  };

  // 加载基础数据（月度数据、可用日期等）
  const loadBaseData = async () => {
    setLoading(true);
    try {
      console.log('加载基础数据...当前月份:', selectedMonth);
      
      // 并行加载月度数据和其他基础数据
      const [monthlyData, range, dates] = await Promise.all([
        commissionService.getCurrentMonthCommission(selectedMonth),
        commissionService.getDataDateRange(selectedMonth),
        commissionService.getAvailableDates(selectedMonth)
      ]);
      
      console.log('加载到的月度数据:', monthlyData);
      console.log('数据范围:', range);
      console.log('可用日期:', dates);
      
      setMonthlyCommission(monthlyData);
      setDataRange(range);
      setAvailableDates(dates);
      
      // 加载当前月份的默认日期数据
      const monthInfo = getCurrentMonthInfo();
      const defaultDate = selectedMonth === '2025-08' ? '2025-08-10' : '2025-07-31';
      await loadCommissionDataForDate(defaultDate);
      
    } catch (error) {
      console.error('加载基础数据失败:', error);
      alert(`加载数据失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 计算指定日期的提成
  const calculateCommissionForDate = async () => {
    if (!selectedDate) {
      alert('请选择日期！');
      return;
    }
    
    setIsCalculating(true);
    try {
      await commissionService.calculateCommission(selectedDate);
      setLastCalculatedDate(selectedDate);
      alert('提成计算完成！');
      
      // 重新加载选择日期的数据并显示
      await loadCommissionDataForDate(selectedDate);
      
      // 重新加载月度数据
      const monthlyData = await commissionService.getCurrentMonthCommission();
      setMonthlyCommission(monthlyData);
      
    } catch (error) {
      console.error('计算提成失败:', error);
      alert(`计算失败: ${error.message}`);
    } finally {
      setIsCalculating(false);
    }
  };

  // 快捷查看指定日期的数据
  const viewDateData = async (date) => {
    try {
      setLoading(true);
      await loadCommissionDataForDate(date);
    } catch (error) {
      alert(`加载 ${date} 数据失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 获取提成等级样式
  const getCommissionLevelStyle = (roi, commissionStatus) => {
    if (commissionStatus === 'no_commission' || roi < 0.8) {
      return {
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        borderColor: 'border-red-300',
        statusText: '跑了个锤子'
      };
    } else if (roi >= 1.0) {
      return {
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-300',
        statusText: '高效投放'
      };
    } else {
      return {
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-300',
        statusText: '合格投放'
      };
    }
  };

  // 组件加载时获取数据
  useEffect(() => {
    loadBaseData();
  }, []);
  
  // 月份切换时重新加载数据
  useEffect(() => {
    if (selectedMonth) {
      loadBaseData();
      // 更新选择的日期为当前月份的默认日期
      const defaultDate = selectedMonth === '2025-08' ? '2025-08-10' : '2025-07-31';
      setSelectedDate(defaultDate);
    }
  }, [selectedMonth]);
  
  // 自动刷新功能，每30秒检查一次数据更新
  useEffect(() => {
    if (!autoRefreshEnabled) return;
    
    const checkForUpdates = async () => {
      try {
        if (displayDate && lastRefreshTime) {
          const updateCheck = await commissionService.checkDataUpdate(displayDate, lastRefreshTime);
          
          if (updateCheck.hasUpdate) {
            console.log('检测到数据更新，自动刷新...', updateCheck);
            await loadCommissionDataForDate(displayDate);
          }
        }
      } catch (error) {
        console.error('自动刷新检查错误:', error);
      }
    };
    
    const interval = setInterval(checkForUpdates, 30000); // 30秒检查一次
    return () => clearInterval(interval);
  }, [autoRefreshEnabled, displayDate, lastRefreshTime]);
  
  // 手动刷新数据
  const handleManualRefresh = async () => {
    if (!displayDate) return;
    
    try {
      setLoading(true);
      await loadCommissionDataForDate(displayDate);
      console.log('手动刷新完成');
    } catch (error) {
      console.error('手动刷新失败:', error);
      alert(`刷新失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && displayData.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">提成系统</h2>
          <p className="text-gray-600">员工提成计算与统计系统</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            {availableMonths.map(month => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
          
          {/* 自动刷新开关 */}
          <label className="flex items-center space-x-1 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={autoRefreshEnabled}
              onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>🔄 自动刷新</span>
          </label>
          
          {/* 手动刷新按钮 */}
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm flex items-center gap-1"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                刷新中
              </>
            ) : (
              <>
                🔄 刷新
              </>
            )}
          </button>
          
          <button
            onClick={loadBaseData}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                重新加载...
              </>
            ) : (
              '📋 重新加载'
            )}
          </button>
        </div>
      </div>

      {/* 数据范围和更新信息 */}
      {(dataRange || dataUpdateInfo) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dataRange && (
              <div className="text-sm text-blue-700">
                📅 数据范围：{dataRange.startDate} 至 {dataRange.endDate} （共{dataRange.totalDays}天）
              </div>
            )}
            {dataUpdateInfo && (
              <div className="text-sm text-green-700">
                🔄 数据更新：{dataUpdateInfo.lastUpdateFormatted} 
                <span className="ml-2 text-xs bg-green-100 px-2 py-1 rounded">
                  已同步 {dataUpdateInfo.recordCount} 条记录
                </span>
              </div>
            )}
          </div>
          {autoRefreshEnabled && (
            <div className="mt-2 text-xs text-gray-600">
              ℹ️ 自动刷新已开启，每30秒检查一次数据更新
            </div>
          )}
        </div>
      )}

      {/* 提成计算工具 */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 提成计算工具</h3>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择日期
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={getCurrentMonthInfo().dateRange.min}
              max={getCurrentMonthInfo().dateRange.max}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={calculateCommissionForDate}
            disabled={isCalculating || !selectedDate}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold flex items-center gap-2"
          >
            {isCalculating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                计算中...
              </>
            ) : (
              <>
                💰 计算提成
              </>
            )}
          </button>
        </div>
        {lastCalculatedDate && (
          <div className="mt-3 text-sm text-green-600">
            ✅ 最后计算日期: {lastCalculatedDate}
          </div>
        )}
      </div>

      {/* 快捷日期选择 */}
      {availableDates.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📅 快捷查看</h3>
          <div className="flex flex-wrap gap-2">
            {availableDates.slice(0, 10).map(date => (
              <button
                key={date}
                onClick={() => viewDateData(date)}
                disabled={loading}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  displayDate === date
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50'
                }`}
              >
                {date}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 当前显示的提成数据 */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">📅 {displayDate} 提成数据</h3>
            {lastRefreshTime && (
              <div className="text-xs text-gray-500 mt-1">
                最后刷新：{new Date(lastRefreshTime).toLocaleString('zh-CN')}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">
              数据条数：{displayData.length}
            </div>
            <button
              onClick={() => handleManualRefresh()}
              disabled={loading}
              className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 mt-1"
            >
              点击刷新
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {employees.map(employee => {
            const record = displayData.find(r => r.advertiser === employee);
            console.log(`员工 ${employee} 的记录:`, record);
            
            let style;
            if (!record || record.commission_status === 'no_data') {
              style = { bgColor: 'bg-gray-100', textColor: 'text-gray-600', borderColor: 'border-gray-300', statusText: '暂无数据' };
            } else {
              style = getCommissionLevelStyle(parseFloat(record.roi || 0), record.commission_status);
            }
            
            return (
              <div 
                key={employee} 
                className={`${style.bgColor} ${style.borderColor} border-2 rounded-xl p-4 transition-all duration-200 hover:shadow-md`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`text-lg font-bold ${style.textColor}`}>{employee}</h4>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${style.bgColor} ${style.textColor} border ${style.borderColor}`}>
                    {style.statusText}
                  </span>
                </div>
                
                {record && record.commission_status !== 'no_data' ? (
                  <div className={`space-y-2 ${style.textColor}`}>
                    <div className="flex justify-between">
                      <span className="text-sm">订单数:</span>
                      <span className="font-semibold">{record.order_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">ROI:</span>
                      <span className="font-semibold">{parseFloat(record.roi || 0).toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">单价提成:</span>
                      <span className="font-semibold">¥{parseFloat(record.commission_per_order || 0).toFixed(0)}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">当日提成:</span>
                        <span className="text-lg font-bold">¥{parseFloat(record.total_commission || 0).toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`text-center py-4 ${style.textColor}`}>
                    <div className="text-2xl mb-1">📊</div>
                    <p className="text-sm">暂无数据</p>
                    <p className="text-xs mt-1">请先计算该日期的提成</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 月度提成汇总 */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">📆 月度提成汇总 ({getCurrentMonthInfo().label})</h3>
          {dataRange && (
            <div className="text-sm text-gray-500">
              数据范围：{dataRange.startDate} ~ {dataRange.endDate}
            </div>
          )}
        </div>
        
        {monthlyCommission.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📉</div>
            <p className="text-gray-500">暂无月度提成数据</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 汇总信息 */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    ¥{monthlyCommission.reduce((sum, emp) => sum + emp.totalCommission, 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">月总提成</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {monthlyCommission.reduce((sum, emp) => sum + emp.totalOrders, 0)}
                  </div>
                  <div className="text-sm text-gray-600">月总订单</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.max(...monthlyCommission.map(emp => emp.workingDays))}
                  </div>
                  <div className="text-sm text-gray-600">最多工作日</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {(monthlyCommission.reduce((sum, emp) => sum + emp.avgROI, 0) / Math.max(monthlyCommission.length, 1)).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">平均ROI</div>
                </div>
              </div>
            </div>

            {/* 员工详细数据 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {employees.map(employee => {
                const summary = monthlyCommission.find(s => s.advertiser === employee) || {
                  advertiser: employee,
                  totalCommission: 0,
                  totalOrders: 0,
                  workingDays: 0,
                  avgROI: 0
                };
                
                return (
                  <div key={employee} className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-gray-800">{employee}</h4>
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold">{employee}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">月总提成:</span>
                        <span className="text-lg font-bold text-green-600">¥{summary.totalCommission.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">月总订单:</span>
                        <span className="font-semibold text-blue-600">{summary.totalOrders}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">工作天数:</span>
                        <span className="font-semibold text-purple-600">{summary.workingDays}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">平均ROI:</span>
                        <span className="font-semibold text-orange-600">{summary.avgROI.toFixed(3)}</span>
                      </div>
                      {summary.workingDays > 0 && (
                        <div className="pt-2 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">日均提成:</span>
                            <span className="text-sm font-medium text-gray-700">¥{(summary.totalCommission / summary.workingDays).toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 提成规则说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">📜 提成规则说明</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-green-100 border border-green-300 rounded-lg p-3">
            <div className="font-semibold text-green-800 mb-1">🏆 高效投放</div>
            <div className="text-green-700">
              <div>ROI ≥ 1.0</div>
              <div className="font-bold">每单提成: ¥7元</div>
            </div>
          </div>
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
            <div className="font-semibold text-yellow-800 mb-1">💪 合格投放</div>
            <div className="text-yellow-700">
              <div>0.8 ≤ ROI &lt; 1.0</div>
              <div className="font-bold">每单提成: ¥5元</div>
            </div>
          </div>
          <div className="bg-red-100 border border-red-300 rounded-lg p-3">
            <div className="font-semibold text-red-800 mb-1">🔨 跑了个锤子</div>
            <div className="text-red-700">
              <div>ROI &lt; 0.8</div>
              <div className="font-bold">每单提成: ¥0元</div>
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
          <p className="text-blue-800 text-sm">
            📊 <strong>计算公式：</strong>
            ROI = 信用卡收款金额 / 广告花费；提成金额 = 订单数量 × 单价提成
          </p>
        </div>
        <div className="mt-2 p-3 bg-green-100 border border-green-300 rounded-lg">
          <p className="text-green-800 text-sm">
            🔄 <strong>实时同步：</strong>
            系统已连接实时数据源，新录入的广告数据将自动反映在提成计算中。可手动刷新或开启自动刷新获取最新数据。
          </p>
        </div>
      </div>
    </div>
  );
};

export default CommissionSystem;