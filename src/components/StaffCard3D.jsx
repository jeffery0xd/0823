import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

const StaffCard3D = ({ staff, onRecharge, onZeroing, onAddAccount, refreshTrigger }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  // 投放人员渐变色配置
  const gradientConfigs = {
    '青': 'from-blue-500 via-cyan-500 to-teal-500',
    '乔': 'from-purple-500 via-pink-500 to-rose-500', 
    '白': 'from-orange-500 via-red-500 to-pink-500',
    '丁': 'from-green-500 via-emerald-500 to-cyan-500',
    '妹': 'from-indigo-500 via-purple-500 to-blue-500'
  };

  // 获取当前人员的渐变色
  const gradientClass = gradientConfigs[staff.name] || 'from-gray-500 via-slate-500 to-gray-600';

  // 加载账户数据
  useEffect(() => {
    loadAccounts();
  }, [staff.id, refreshTrigger]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_e87b41cfe355428b8146f8bae8184e10_account_management_ads')
        .select('*')
        .eq('personnel_id', staff.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('加载账户失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理账户操作
  const handleAccountAction = (action, account) => {
    if (action === 'recharge') {
      onRecharge(account, staff);
    } else if (action === 'zeroing') {
      onZeroing(account, staff);
    }
  };

  return (
    <div className="group perspective-1000">
      <div 
        className={`relative w-full h-96 transition-all duration-700 transform-style-preserve-3d cursor-pointer
                    hover:scale-105 hover:-translate-y-2 ${
                      isFlipped ? 'rotate-y-180' : ''
                    }`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* 正面 - 人员信息 */}
        <div className={`absolute inset-0 w-full h-full rounded-2xl shadow-2xl backface-hidden
                        bg-gradient-to-br ${gradientClass} p-6 text-white
                        border border-white/20 backdrop-blur-sm`}>
          
          {/* 装饰性背景元素 */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-white/20"></div>
            <div className="absolute bottom-8 left-4 w-16 h-16 rounded-full bg-white/10"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-white/5"></div>
          </div>

          <div className="relative z-10 h-full flex flex-col">
            {/* 头部信息 */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm
                              flex items-center justify-center text-2xl font-bold border-2 border-white/30">
                {staff.name.charAt(0)}
              </div>
              <h3 className="text-xl font-bold mb-1">{staff.name}</h3>
              <p className="text-white/80 text-sm">{staff.name_en}</p>
            </div>

            {/* 统计信息 */}
            <div className="flex-1 space-y-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="text-sm text-white/80">账户数量</div>
                <div className="text-2xl font-bold">{accounts.length}</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="text-sm text-white/80">活跃账户</div>
                <div className="text-2xl font-bold text-green-300">
                  {accounts.filter(acc => acc.status === 'active').length}
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="mt-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddAccount(staff);
                }}
                className="w-full py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg
                           border border-white/30 transition-all duration-300 font-medium
                           transform hover:scale-105 hover:shadow-lg"
              >
                + 添加账户
              </button>
            </div>

            {/* 翻转提示 */}
            <div className="text-center mt-4 text-white/60 text-sm">
              点击查看账户列表
            </div>
          </div>
        </div>

        {/* 背面 - 账户列表 */}
        <div className={`absolute inset-0 w-full h-full rounded-2xl shadow-2xl backface-hidden rotate-y-180
                        bg-gradient-to-br from-gray-800 via-gray-900 to-black p-6 text-white
                        border border-gray-600/50 backdrop-blur-sm`}>
          
          <div className="h-full flex flex-col">
            {/* 头部 */}
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold">{staff.name} - 账户列表</h4>
              <span className="text-sm bg-blue-500/20 px-2 py-1 rounded">
                {accounts.length}个账户
              </span>
            </div>

            {/* 账户列表 */}
            <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-white/30 border-t-white rounded-full mx-auto"></div>
                  <p className="text-white/60 mt-2">加载中...</p>
                </div>
              ) : accounts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">💼</div>
                  <p className="text-white/60">暂无账户</p>
                </div>
              ) : (
                accounts.map((account) => (
                  <div 
                    key={account.id}
                    className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10
                               hover:bg-white/10 transition-all duration-200 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAccount(selectedAccount === account.id ? null : account.id);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{account.account_name}</div>
                        <div className="text-xs text-white/60">{account.ad_account_id}</div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className={`w-2 h-2 rounded-full ${
                          account.status === 'active' ? 'bg-green-400' : 'bg-red-400'
                        }`}></span>
                        <span className="text-xs">{account.status}</span>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    {selectedAccount === account.id && (
                      <div className="mt-3 flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAccountAction('recharge', account);
                          }}
                          className="flex-1 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded text-xs
                                     border border-blue-400/30 transition-colors duration-200"
                        >
                          充值
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAccountAction('zeroing', account);
                          }}
                          className="flex-1 py-2 bg-red-500/20 hover:bg-red-500/30 rounded text-xs
                                     border border-red-400/30 transition-colors duration-200"
                        >
                          清零
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* 返回按钮 */}
            <div className="mt-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(false);
                }}
                className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg
                           border border-white/20 transition-all duration-300 text-sm"
              >
                返回
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3D效果样式 */}
      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
};

export default StaffCard3D;