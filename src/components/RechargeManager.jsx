import React, { useState, useEffect } from 'react';
import { rechargeService, accountService } from '../data/supabaseService';

const RechargeManager = () => {
  const [accounts, setAccounts] = useState([]);
  const [rechargeHistory, setRechargeHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateStats, setDateStats] = useState({});
  
  // 充值录入相关状态
  const [selectedAccount, setSelectedAccount] = useState(''); // 账户名称
  const [selectedAccountId, setSelectedAccountId] = useState(''); // 账户ID
  const [selectedAdvertiser, setSelectedAdvertiser] = useState(''); // 投放人员
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargeDescription, setRechargeDescription] = useState(''); // 描述
  const [multipleRechargeAmounts, setMultipleRechargeAmounts] = useState({});

  // 投放人员列表
  const advertisers = ['青', '乔', '白', '丁', '妹'];

  // Load accounts and recharge data
  const loadData = async () => {
    setLoading(true);
    try {
      const [accountsData, rechargeData] = await Promise.all([
        accountService.getAccounts(),
        rechargeService.getRechargeRecords()
      ]);
      
      setAccounts(accountsData);
      setRechargeHistory(rechargeData);
      
      // Calculate daily recharge amounts for each account
      calculateDailyStats(accountsData, rechargeData);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  // Calculate daily recharge statistics by advertiser
  const calculateDailyStats = (accountsData, rechargeData) => {
    const stats = {};
    
    // 只统计5位投放人员的充值情况
    advertisers.forEach(advertiser => {
      const dailyRecharges = rechargeData.filter(recharge => 
        recharge.advertiser === advertiser && 
        recharge.created_at.split('T')[0] === selectedDate
      );
      
      const totalAmount = dailyRecharges.reduce((sum, recharge) => sum + parseFloat(recharge.amount || 0), 0);
      
      // 按账户ID分组统计
      const accountStats = {};
      dailyRecharges.forEach(recharge => {
        const accountId = recharge.account_id;
        if (!accountStats[accountId]) {
          // 查找账户名称
          const account = accountsData.find(acc => acc.account_id === accountId);
          accountStats[accountId] = {
            account_id: accountId,
            account_name: account?.account_name || accountId,
            total_amount: 0,
            recharge_count: 0
          };
        }
        accountStats[accountId].total_amount += parseFloat(recharge.amount || 0);
        accountStats[accountId].recharge_count += 1;
      });
      
      stats[advertiser] = {
        advertiser: advertiser,
        daily_recharge_amount: totalAmount,
        daily_count: dailyRecharges.length,
        account_details: Object.values(accountStats) // 账户详细统计
      };
    });
    
    setDateStats(stats);
  };

  // 单个充值处理
  const handleSingleRecharge = async () => {
    if (!selectedAccount || !selectedAccountId || !selectedAdvertiser || !rechargeAmount) {
      alert('请输入账户名称、账户ID、选择投放人员和充值金额');
      return;
    }

    try {
      const amount = parseFloat(rechargeAmount);
      
      // 检查当天该账户的充值次数
      const today = new Date().toISOString().split('T')[0];
      const todayRecharges = rechargeHistory.filter(recharge => 
        recharge.account_id === selectedAccountId && 
        recharge.created_at.split('T')[0] === today
      );
      const rechargeCount = todayRecharges.length + 1; // 加1因为这是即将要添加的充值
      
      // 生成描述，包含充值次数信息
      let description = rechargeDescription;
      if (!description) {
        if (rechargeCount === 1) {
          description = `充值 $${amount} - ${selectedAccount} (${selectedAdvertiser})`;
        } else if (rechargeCount === 2) {
          description = `补充充值二次 $${amount} - ${selectedAccount} (${selectedAdvertiser})`;
        } else if (rechargeCount === 3) {
          description = `补充充值三次 $${amount} - ${selectedAccount} (${selectedAdvertiser})`;
        } else {
          description = `补充充值第${rechargeCount}次 $${amount} - ${selectedAccount} (${selectedAdvertiser})`;
        }
      }
      
      // 检查是否已存在该账户，如果不存在则创建
      let account = accounts.find(acc => acc.account_id === selectedAccountId);
      let newBalance = amount;
      
      if (account) {
        newBalance = parseFloat(account.balance || 0) + amount;
        await accountService.updateAccountBalance(selectedAccountId, newBalance);
      } else {
        // 创建新账户
        const newAccount = {
          account_id: selectedAccountId,
          account_name: selectedAccount,
          balance: amount,
          created_at: new Date().toISOString()
        };
        await accountService.addAccount(newAccount);
      }

      const rechargeData = {
        account_id: selectedAccountId,
        amount: amount,
        currency: 'USD',
        usd_amount: amount,
        advertiser: selectedAdvertiser,
        description: description,
        new_balance: newBalance,
        created_at: new Date().toISOString()
      };

      await rechargeService.addRecharge(rechargeData);
      
      alert('充值成功！');
      setSelectedAccount('');
      setSelectedAccountId('');
      setSelectedAdvertiser('');
      setRechargeAmount('');
      setRechargeDescription('');
      loadData();
    } catch (error) {
      console.error('充值失败:', error);
      alert('充值失败，请重试');
    }
  };

  // 批量充值处理
  const handleMultipleRecharge = async () => {
    const rechargeEntries = Object.entries(multipleRechargeAmounts).filter(([_, data]) => 
      data && data.accountName && data.accountId && data.advertiser && data.amount && parseFloat(data.amount) > 0
    );
    
    if (rechargeEntries.length === 0) {
      alert('请至少为一个账户输入完整信息（账户名称、账户ID、投放人员、充值金额）');
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      
      for (const [key, data] of rechargeEntries) {
        const { accountName, accountId, advertiser, amount } = data;
        const rechargeAmount = parseFloat(amount);
        
        // 检查当天该账户的充值次数
        const todayRecharges = rechargeHistory.filter(recharge => 
          recharge.account_id === accountId && 
          recharge.created_at.split('T')[0] === today
        );
        const rechargeCount = todayRecharges.length + 1; // 加1因为这是即将要添加的充值
        
        // 生成描述，包含充值次数信息
        let description;
        if (rechargeCount === 1) {
          description = `批量充值 $${rechargeAmount} - ${accountName} (${advertiser})`;
        } else if (rechargeCount === 2) {
          description = `批量补充充值二次 $${rechargeAmount} - ${accountName} (${advertiser})`;
        } else if (rechargeCount === 3) {
          description = `批量补充充值三次 $${rechargeAmount} - ${accountName} (${advertiser})`;
        } else {
          description = `批量补充充值第${rechargeCount}次 $${rechargeAmount} - ${accountName} (${advertiser})`;
        }
        
        // 检查是否已存在该账户，如果不存在则创建
        let account = accounts.find(acc => acc.account_id === accountId);
        let newBalance = rechargeAmount;
        
        if (account) {
          newBalance = parseFloat(account.balance || 0) + rechargeAmount;
          await accountService.updateAccountBalance(accountId, newBalance);
        } else {
          // 创建新账户
          const newAccount = {
            account_id: accountId,
            account_name: accountName,
            balance: rechargeAmount,
            created_at: new Date().toISOString()
          };
          await accountService.addAccount(newAccount);
        }

        const rechargeData = {
          account_id: accountId,
          amount: rechargeAmount,
          currency: 'USD',
          usd_amount: rechargeAmount,
          advertiser: advertiser,
          description: description,
          new_balance: newBalance,
          created_at: new Date().toISOString()
        };

        await rechargeService.addRecharge(rechargeData);
      }
      
      alert('批量充值成功！');
      setMultipleRechargeAmounts({});
      loadData();
    } catch (error) {
      console.error('批量充值失败:', error);
      alert('批量充值失败，请重试');
    }
  };

  // Delete recharge record
  const handleDeleteRecharge = async (rechargeId) => {
    if (!window.confirm('确认删除这条充值记录吗？')) {
      return;
    }
    
    try {
      await rechargeService.deleteRecharge(rechargeId);
      alert('删除成功！');
      loadData();
    } catch (error) {
      console.error('Error deleting recharge:', error);
      alert('删除失败，请重试');
    }
  };

  // Filter recharge history by selected date
  const getFilteredRecharges = () => {
    return rechargeHistory.filter(recharge => 
      recharge.created_at.split('T')[0] === selectedDate
    );
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (accounts.length > 0 && rechargeHistory.length > 0) {
      calculateDailyStats(accounts, rechargeHistory);
    }
  }, [selectedDate, accounts, rechargeHistory]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const filteredRecharges = getFilteredRecharges();

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">充值管理</h1>
        
        {/* Date Filter */}
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">选择日期：</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? '刷新中...' : '刷新数据'}
          </button>
        </div>
      </div>

      {/* 单个充值录入 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">单个账户充值</h2>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">账户名称</label>
            <input
              type="text"
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入账户名称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">账户ID</label>
            <input
              type="text"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入账户ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">投放人员</label>
            <select
              value={selectedAdvertiser}
              onChange={(e) => setSelectedAdvertiser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">选择投放人员</option>
              {advertisers.map((advertiser) => (
                <option key={advertiser} value={advertiser}>
                  {advertiser}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">充值金额($)</label>
            <input
              type="number"
              value={rechargeAmount}
              onChange={(e) => setRechargeAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入美元金额"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
            <input
              type="text"
              value={rechargeDescription}
              onChange={(e) => setRechargeDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="充值描述"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSingleRecharge}
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              确认充值
            </button>
          </div>
        </div>
      </div>

      {/* 批量充值录入 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">批量账户充值</h2>
        
        {/* 批量账户输入区域 */}
        <div className="space-y-4 mb-6">
          {Object.keys(multipleRechargeAmounts).map((key, index) => (
            <div key={key} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg border">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">账户名称</label>
                <input
                  type="text"
                  value={multipleRechargeAmounts[key]?.accountName || ''}
                  onChange={(e) => setMultipleRechargeAmounts(prev => ({
                    ...prev,
                    [key]: { ...prev[key], accountName: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入账户名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">账户ID</label>
                <input
                  type="text"
                  value={multipleRechargeAmounts[key]?.accountId || ''}
                  onChange={(e) => setMultipleRechargeAmounts(prev => ({
                    ...prev,
                    [key]: { ...prev[key], accountId: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入账户ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">投放人员</label>
                <select
                  value={multipleRechargeAmounts[key]?.advertiser || ''}
                  onChange={(e) => setMultipleRechargeAmounts(prev => ({
                    ...prev,
                    [key]: { ...prev[key], advertiser: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">选择投放人员</option>
                  {advertisers.map((advertiser) => (
                    <option key={advertiser} value={advertiser}>
                      {advertiser}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">充值金额($)</label>
                <input
                  type="number"
                  value={multipleRechargeAmounts[key]?.amount || ''}
                  onChange={(e) => setMultipleRechargeAmounts(prev => ({
                    ...prev,
                    [key]: { ...prev[key], amount: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入美元金额"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    const newAmounts = { ...multipleRechargeAmounts };
                    delete newAmounts[key];
                    setMultipleRechargeAmounts(newAmounts);
                  }}
                  className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 添加账户和批量充值按钮 */}
        <div className="flex space-x-4">
          <button
            onClick={() => {
              const newKey = `batch_${Date.now()}`;
              setMultipleRechargeAmounts(prev => ({
                ...prev,
                [newKey]: { accountName: '', accountId: '', advertiser: '', amount: '' }
              }));
            }}
            className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            + 添加账户
          </button>
          <button
            onClick={handleMultipleRecharge}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            批量充值
          </button>
        </div>
      </div>

      {/* Advertiser Daily Recharge Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {selectedDate} 各投放人员充值统计
        </h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">加载中...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {advertisers.map((advertiser) => {
              const stats = dateStats[advertiser] || { 
                advertiser, 
                daily_recharge_amount: 0, 
                daily_count: 0, 
                account_details: [] 
              };
              return (
                <div key={advertiser} className="bg-gray-50 rounded-lg p-6 border">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-800 text-xl">{advertiser}</h3>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        总充值: ${stats.daily_recharge_amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {stats.daily_count} 次充值
                      </p>
                    </div>
                  </div>
                  
                  {stats.account_details.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-700 text-sm">充值账户详情:</h4>
                      <div className="grid grid-cols-1 gap-3">
                        {stats.account_details.map((account, index) => (
                          <div key={account.account_id} className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-gray-800">{account.account_name}</p>
                                <p className="text-sm text-gray-500">ID: {account.account_id}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-green-600">
                                  ${account.total_amount.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {account.recharge_count} 次
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      当日无充值记录
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recharge History */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {selectedDate} 充值记录 ({filteredRecharges.length} 条)
        </h2>
        
        {filteredRecharges.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            该日期暂无充值记录
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    充值时间
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    账户ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    投放人员
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    充值金额
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    描述
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    充值后余额
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecharges.map((record, index) => (
                  <tr key={record.id || index} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                      {formatDate(record.created_at)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 border-b">
                      {record.account_id}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-purple-600 border-b">
                      {record.advertiser || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-green-600 border-b">
                      ${parseFloat(record.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 border-b max-w-xs truncate">
                      {record.description}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600 border-b">
                      ${parseFloat(record.new_balance || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm border-b">
                      <button
                        onClick={() => handleDeleteRecharge(record.id)}
                        className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                        title="删除记录"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RechargeManager;