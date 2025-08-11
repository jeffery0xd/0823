import React, { useState, useEffect } from 'react'
import { dashboardService } from '../data/accountRequestsService'

const ModernDashboard = ({ isDark = false }) => {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    advertiser: '',
    amount: '',
    type: 'revenue',
    date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const data = await dashboardService.getDashboardData()
      setDashboardData(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const newTransaction = {
        id: Date.now(),
        advertiser: formData.advertiser,
        amount: parseInt(formData.amount),
        type: formData.type,
        timestamp: new Date(formData.date).toISOString()
      }

      const updatedData = {
        ...dashboardData,
        recentTransactions: [newTransaction, ...dashboardData.recentTransactions.slice(0, 4)]
      }

      if (formData.type === 'revenue') {
        updatedData.totalRevenue += newTransaction.amount
      } else {
        updatedData.totalCost += Math.abs(newTransaction.amount)
      }

      await dashboardService.updateDashboardData(updatedData)
      setDashboardData(updatedData)
      setFormData({
        advertiser: '',
        amount: '',
        type: 'revenue',
        date: new Date().toISOString().split('T')[0]
      })
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className={`mt-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>加载失败</h2>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{error}</p>
          <button
            onClick={loadDashboardData}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            📊 广告数据录入
          </h1>
          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            管理和录入广告收入支出数据
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className={`rounded-2xl shadow-xl transition-all duration-300 ${
            isDark ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' : 'bg-white/70 backdrop-blur-sm border border-gray-200'
          }`}>
            <div className="p-6">
              <h2 className={`text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                💰 添加新记录
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    广告主名称
                  </label>
                  <input
                    type="text"
                    value={formData.advertiser}
                    onChange={(e) => setFormData({...formData, advertiser: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="输入广告主名称"
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    金额 (MX$)
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="输入金额"
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    类型
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="revenue">📈 收入</option>
                    <option value="cost">📉 支出</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    日期
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  🚀 添加记录
                </button>
              </form>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className={`rounded-2xl shadow-xl transition-all duration-300 ${
            isDark ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' : 'bg-white/70 backdrop-blur-sm border border-gray-200'
          }`}>
            <div className="p-6">
              <h2 className={`text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                📝 最近记录
              </h2>
              
              <div className="space-y-4">
                {dashboardData?.recentTransactions?.map((transaction, index) => (
                  <div key={transaction.id || index} className={`p-4 rounded-xl transition-all duration-200 hover:scale-102 ${
                    isDark ? 'bg-gray-700/50 hover:bg-gray-700/70' : 'bg-gray-50 hover:bg-gray-100'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                          transaction.type === 'revenue' ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          {transaction.advertiser?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {transaction.advertiser}
                          </div>
                          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {new Date(transaction.timestamp).toLocaleDateString('zh-CN')}
                          </div>
                        </div>
                      </div>
                      <div className={`font-bold ${
                        transaction.type === 'revenue' ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {transaction.type === 'revenue' ? '+' : '-'}MX${Math.abs(transaction.amount).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className={`rounded-2xl p-6 shadow-xl transition-all duration-300 ${
            isDark ? 'bg-gradient-to-br from-green-800/30 to-green-900/30 border border-green-700/50' : 'bg-gradient-to-br from-green-50 to-green-100 border border-green-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-green-300' : 'text-green-700'}`}>总收入</p>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  MX${dashboardData?.totalRevenue?.toLocaleString() || '0'}
                </p>
              </div>
              <div className="text-3xl">📈</div>
            </div>
          </div>

          <div className={`rounded-2xl p-6 shadow-xl transition-all duration-300 ${
            isDark ? 'bg-gradient-to-br from-red-800/30 to-red-900/30 border border-red-700/50' : 'bg-gradient-to-br from-red-50 to-red-100 border border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-red-300' : 'text-red-700'}`}>总支出</p>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  MX${dashboardData?.totalCost?.toLocaleString() || '0'}
                </p>
              </div>
              <div className="text-3xl">📉</div>
            </div>
          </div>

          <div className={`rounded-2xl p-6 shadow-xl transition-all duration-300 ${
            isDark ? 'bg-gradient-to-br from-blue-800/30 to-blue-900/30 border border-blue-700/50' : 'bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>净利润</p>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  MX${((dashboardData?.totalRevenue || 0) - (dashboardData?.totalCost || 0)).toLocaleString()}
                </p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModernDashboard