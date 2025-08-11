import React, { useState, useEffect } from 'react';
import { accountService, rechargeService } from '../data/supabaseService';

const RechargeInput = () => {
  const [accounts, setAccounts] = useState([]);
  const [rechargeMode, setRechargeMode] = useState('single'); // 'single' or 'multiple'
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    advertiser: '青',
    accountId: '',
    accountName: '',
    amount: ''
  });
  const [multipleRecharges, setMultipleRecharges] = useState([
    { 
      date: new Date().toISOString().split('T')[0],
      advertiser: '青',
      accountId: '', 
      accountName: '', 
      amount: ''
    }
  ]);
  const [loading, setLoading] = useState(false);

  const advertisers = ['青', '乔', '白', '丁', '妹'];
  const exchangeRate = 0.055; // MX$ to USD

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const accountsData = await accountService.getAccounts();
      setAccounts(accountsData);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addMultipleRechargeRow = () => {
    setMultipleRecharges([
      ...multipleRecharges,
      { 
        date: new Date().toISOString().split('T')[0],
        advertiser: '青',
        accountId: '', 
        accountName: '', 
        amount: ''
      }
    ]);
  };

  const removeMultipleRechargeRow = (index) => {
    if (multipleRecharges.length > 1) {
      const newRecharges = multipleRecharges.filter((_, i) => i !== index);
      setMultipleRecharges(newRecharges);
    }
  };

  const updateMultipleRecharge = (index, field, value) => {
    const newRecharges = [...multipleRecharges];
    newRecharges[index][field] = value;
    setMultipleRecharges(newRecharges);
  };

  const handleSingleRecharge = async (e) => {
    e.preventDefault();
    if (!formData.accountId || !formData.accountName || !formData.amount) {
      alert('请填写广告账户信息并输入充值金额！');
      return;
    }

    setLoading(true);
    try {
      const usdAmount = parseFloat(formData.amount);
      const amount = usdAmount / exchangeRate;
      
      // 先获取充值记录来检查当天充值次数
      const rechargeHistory = await rechargeService.getRechargeRecords();
      
      // 检查当天该账户的充值次数
      const todayRecharges = rechargeHistory.filter(recharge => 
        recharge.account_id === formData.accountId && 
        recharge.created_at.split('T')[0] === formData.date
      );
      const rechargeCount = todayRecharges.length + 1; // 加1因为这是即将要添加的充值
      
      // 生成描述，包含充值次数信息
      let description;
      if (rechargeCount === 1) {
        description = `单个充值 ${usdAmount} USD - ${formData.advertiser} - ${formData.date}`;
      } else if (rechargeCount === 2) {
        description = `单个补充充值二次 ${usdAmount} USD - ${formData.advertiser} - ${formData.date}`;
      } else if (rechargeCount === 3) {
        description = `单个补充充值三次 ${usdAmount} USD - ${formData.advertiser} - ${formData.date}`;
      } else {
        description = `单个补充充值第${rechargeCount}次 ${usdAmount} USD - ${formData.advertiser} - ${formData.date}`;
      }
      
      // Get current account balance
      const account = accounts.find(acc => acc.account_id === formData.accountId);
      const currentBalance = account ? account.balance : 0;
      const newBalance = currentBalance + amount;

      const rechargeData = {
        account_id: formData.accountId,
        amount: amount,
        currency: 'MX$',
        usd_amount: usdAmount,
        description: description,
        new_balance: newBalance
      };

      await rechargeService.addRecharge(rechargeData);
      
      // Refresh data
      await loadAccounts();
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        advertiser: '青',
        accountId: '',
        accountName: '',
        amount: ''
      });
      
      alert('单个账户充值录入成功！');
    } catch (error) {
      console.error('Error processing single recharge:', error);
      alert('充值录入失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleMultipleRecharge = async (e) => {
    e.preventDefault();
    
    // 验证所有输入
    const validRecharges = multipleRecharges.filter(r => r.accountId && r.accountName && r.amount);
    if (validRecharges.length === 0) {
      alert('请至少填写一个完整的充值信息（包括账户名称、账户ID和金额）');
      return;
    }

    setLoading(true);
    try {
      const results = [];
      
      // 先获取充值记录来检查当天充值次数
      const rechargeHistory = await rechargeService.getRechargeRecords();
      
      for (const recharge of validRecharges) {
        const usdAmount = parseFloat(recharge.amount);
        const amount = usdAmount / exchangeRate;
        
        // 检查当天该账户的充值次数
        const todayRecharges = rechargeHistory.filter(record => 
          record.account_id === recharge.accountId && 
          record.created_at.split('T')[0] === recharge.date
        );
        const rechargeCount = todayRecharges.length + 1; // 加1因为这是即将要添加的充值
        
        // 生成描述，包含充值次数信息
        let description;
        if (rechargeCount === 1) {
          description = `批量充值 ${usdAmount} USD - ${recharge.advertiser} - ${recharge.date} - ${recharge.accountName}`;
        } else if (rechargeCount === 2) {
          description = `批量补充充值二次 ${usdAmount} USD - ${recharge.advertiser} - ${recharge.date} - ${recharge.accountName}`;
        } else if (rechargeCount === 3) {
          description = `批量补充充值三次 ${usdAmount} USD - ${recharge.advertiser} - ${recharge.date} - ${recharge.accountName}`;
        } else {
          description = `批量补充充值第${rechargeCount}次 ${usdAmount} USD - ${recharge.advertiser} - ${recharge.date} - ${recharge.accountName}`;
        }
        
        // Get current account balance
        const account = accounts.find(acc => acc.account_id === recharge.accountId);
        const currentBalance = account ? account.balance : 0;
        const newBalance = currentBalance + amount;

        const rechargeData = {
          account_id: recharge.accountId,
          amount: amount,
          currency: 'MX$',
          usd_amount: usdAmount,
          description: description,
          new_balance: newBalance
        };

        const result = await rechargeService.addRecharge(rechargeData);
        results.push(result);
        
        // 将新添加的记录也加入到rechargeHistory中，确保后续记录的计数正确
        rechargeHistory.push(result);
      }
      
      // Refresh data
      await loadAccounts();
      
      // Reset form
      setMultipleRecharges([
        { 
          date: new Date().toISOString().split('T')[0],
          advertiser: '青',
          accountId: '', 
          accountName: '', 
          amount: ''
        }
      ]);
      
      alert(`批量充值录入成功！共录入 ${results.length} 个账户充值记录`);
    } catch (error) {
      console.error('Error processing multiple recharge:', error);
      alert('批量充值录入失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency === 'USD' ? 'USD' : 'MXN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">充值录入</h2>
          <p className="text-gray-600">录入广告账户充值信息</p>
        </div>
      </div>

      {/* 每日账户充值概览 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          每日账户充值概览
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <div key={account.account_id} className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold text-gray-800">{account.account_name}</div>
                  <div className="text-sm text-gray-500">{account.account_id}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-green-600">
                    {formatCurrency(account.balance || 0, 'MX$')}
                  </div>
                  <div className="text-xs text-gray-500">
                    ≈ {formatCurrency((account.balance || 0) * exchangeRate, 'USD')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 充值录入表单 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
          充值录入
        </h3>

        {/* 充值模式选择 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            录入模式
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="single"
                checked={rechargeMode === 'single'}
                onChange={(e) => setRechargeMode(e.target.value)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">单个账户充值</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="multiple"
                checked={rechargeMode === 'multiple'}
                onChange={(e) => setRechargeMode(e.target.value)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">多个账户充值</span>
            </label>
          </div>
        </div>

        {/* 单个账户充值表单 */}
        {rechargeMode === 'single' && (
          <form onSubmit={handleSingleRecharge} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  日期 *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  投放人员 *
                </label>
                <select
                  name="advertiser"
                  value={formData.advertiser}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {advertisers.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  广告账户名称 *
                </label>
                <input
                  type="text"
                  name="accountName"
                  value={formData.accountName}
                  onChange={handleInputChange}
                  placeholder="请输入广告账户名称"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  广告账户ID *
                </label>
                <input
                  type="text"
                  name="accountId"
                  value={formData.accountId}
                  onChange={handleInputChange}
                  placeholder="请输入广告账户ID"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  充值金额 (USD) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="输入美金金额"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {formData.amount && (
                  <div className="text-xs text-gray-500 mt-1">
                    ≈ {formatCurrency(parseFloat(formData.amount) / exchangeRate, 'MX$')}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-md hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? '处理中...' : '录入单个充值'}
            </button>
          </form>
        )}

        {/* 多个账户充值表单 */}
        {rechargeMode === 'multiple' && (
          <form onSubmit={handleMultipleRecharge} className="space-y-4">
            <div className="space-y-3">
              {multipleRecharges.map((recharge, index) => (
                <div key={index} className="border border-gray-200 rounded-md p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-medium text-gray-700">
                      充值记录 {index + 1}
                    </h4>
                    {multipleRecharges.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMultipleRechargeRow(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        删除
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        日期 *
                      </label>
                      <input
                        type="date"
                        value={recharge.date}
                        onChange={(e) => updateMultipleRecharge(index, 'date', e.target.value)}
                        required
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        投放人员 *
                      </label>
                      <select
                        value={recharge.advertiser}
                        onChange={(e) => updateMultipleRecharge(index, 'advertiser', e.target.value)}
                        required
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {advertisers.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        广告账户名称 *
                      </label>
                      <input
                        type="text"
                        value={recharge.accountName}
                        onChange={(e) => updateMultipleRecharge(index, 'accountName', e.target.value)}
                        placeholder="输入账户名称"
                        required
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        广告账户ID *
                      </label>
                      <input
                        type="text"
                        value={recharge.accountId}
                        onChange={(e) => updateMultipleRecharge(index, 'accountId', e.target.value)}
                        placeholder="输入账户ID"
                        required
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        充值金额 (USD) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={recharge.amount}
                        onChange={(e) => updateMultipleRecharge(index, 'amount', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="输入美金金额"
                        required
                      />
                      {recharge.amount && (
                        <div className="text-xs text-gray-500 mt-1">
                          ≈ {formatCurrency(parseFloat(recharge.amount) / exchangeRate, 'MX$')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={addMultipleRechargeRow}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200"
              >
                + 添加充值记录
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white py-2 px-4 rounded-md hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? '批量处理中...' : '录入批量充值'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 使用说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">📋 使用说明</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
          <div>
            <h4 className="font-medium mb-2">单个账户充值：</h4>
            <ul className="space-y-1">
              <li>• 日期：充值日期</li>
              <li>• 投放人员：选择对应的投放人员</li>
              <li>• 广告账户：选择要充值的账户</li>
              <li>• 充值金额：输入充值金额（墨西哥比索）</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">多个账户充值：</h4>
            <ul className="space-y-1">
              <li>• 可同时为多个账户录入充值信息</li>
              <li>• 每行一个账户充值记录</li>
              <li>• 可动态添加和删除充值记录</li>
              <li>• 自动显示账户ID和USD换算</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
          <p className="text-yellow-800 text-sm">
            💡 <strong>提示：</strong>此页面专门用于录入充值信息。广告投放数据请前往"广告数据录入"页面。充值金额请输入美金(USD)，系统会自动换算墨西哥比索。汇率：1 USD = 18.18 MX$
          </p>
        </div>
      </div>
    </div>
  );
};

export default RechargeInput;