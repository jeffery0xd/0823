import React, { useState, useEffect, useRef } from 'react';
import { accountService } from '../services/accountManagementService';

const PersonnelCard = ({ personnel, onRecharge, onReset, onAddAccount, refreshTrigger }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [editForm, setEditForm] = useState({});
  const cardRef = useRef(null);

  // 3D effect variables
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Color gradients for each personnel
  const gradients = {
    'Qing': 'linear-gradient(135deg, #007BFF, #00BFFF)',
    'Qiao': 'linear-gradient(135deg, #6f42c1, #e83e8c)',
    'Bai': 'linear-gradient(135deg, #e9ecef, #adb5bd)',
    'Ding': 'linear-gradient(135deg, #fd7e14, #ffc107)',
    'Mei': 'linear-gradient(135deg, #20c997, #28a745)'
  };

  // Load accounts when component mounts or refreshTrigger changes
  useEffect(() => {
    loadAccounts();
  }, [personnel.id, refreshTrigger]);

  // Handle mouse move for 3D effect
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePosition({ x, y });
  };

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await accountService.getByPersonnel(personnel.id);
      setAccounts(data);
    } catch (error) {
      console.error('加载账户失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (accountId) => {
    if (confirm('确定要删除这个账户吗？此操作不可撤销。')) {
      try {
        await accountService.delete(accountId);
        await loadAccounts();
      } catch (error) {
        console.error('删除账户失败:', error);
        alert('删除账户失败，请重试');
      }
    }
  };

  const handleEditAccount = (account) => {
    setEditingAccount(account.id);
    setEditForm({
      account_name: account.account_name,
      ad_account_id: account.ad_account_id,
      status: account.status
    });
  };

  const handleSaveEdit = async (accountId) => {
    try {
      await accountService.update(accountId, editForm);
      setEditingAccount(null);
      setEditForm({});
      await loadAccounts();
      
      // Check if status was changed to Disabled and show reset prompt
      if (editForm.status === 'Disabled') {
        const account = accounts.find(acc => acc.id === accountId);
        if (account && confirm(`账户 ${editForm.account_name} 已禁用，是否立即进行清零处理？`)) {
          onReset({ ...account, ...editForm }, personnel);
        }
      }
    } catch (error) {
      console.error('更新账户失败:', error);
      alert('更新账户失败，请重试');
    }
  };

  const handleCancelEdit = () => {
    setEditingAccount(null);
    setEditForm({});
  };

  // 3D transform calculation
  const get3DTransform = () => {
    if (!isHovered || !cardRef.current) return 'rotateX(0deg) rotateY(0deg) scale(1)';
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (mousePosition.y - centerY) / 10;
    const rotateY = (centerX - mousePosition.x) / 10;
    
    return `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
  };

  return (
    <div
      ref={cardRef}
      className="relative transition-all duration-300 ease-out"
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d'
      }}
    >
      <div
        className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden cursor-pointer transition-all duration-300"
        style={{
          background: gradients[personnel.name_en] || gradients['Qing'],
          transform: get3DTransform(),
          boxShadow: isHovered 
            ? '0 20px 40px rgba(0, 123, 255, 0.3), 0 0 20px rgba(0, 123, 255, 0.2)'
            : '0 10px 20px rgba(0, 0, 0, 0.3)'
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setMousePosition({ x: 0, y: 0 });
        }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Card Header */}
        <div className="p-6 text-center relative">
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          <div className="relative z-10">
            {/* Avatar */}
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white bg-opacity-20 flex items-center justify-center backdrop-blur-sm">
              {personnel.avatar_url ? (
                <img 
                  src={personnel.avatar_url} 
                  alt={`${personnel.name}的头像`}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-white">
                  {personnel.name}
                </span>
              )}
            </div>
            
            {/* Name */}
            <h3 className="text-xl font-bold text-white mb-1">{personnel.name}</h3>
            <p className="text-white text-opacity-80 text-sm">{personnel.name_en}</p>
            
            {/* Account count */}
            <div className="mt-4 bg-white bg-opacity-20 rounded-lg px-3 py-1 inline-block backdrop-blur-sm">
              <span className="text-white text-sm font-medium">
                {accounts.length} 个账户
              </span>
            </div>
          </div>
        </div>

        {/* Expand/Collapse indicator */}
        <div className="absolute bottom-4 right-4 text-white text-opacity-60">
          <svg 
            className={`w-5 h-5 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded Account List */}
      {expanded && (
        <div className="mt-4 bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-white">账户列表</h4>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddAccount(personnel);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
            >
              + 添加账户
            </button>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>暂无账户</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddAccount(personnel);
                }}
                className="mt-2 text-blue-400 hover:text-blue-300"
              >
                点击添加第一个账户
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div key={account.id} className="bg-gray-700 rounded-lg p-4">
                  {editingAccount === account.id ? (
                    // Edit mode
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">账户名称</label>
                        <input
                          type="text"
                          value={editForm.account_name || ''}
                          onChange={(e) => setEditForm({...editForm, account_name: e.target.value})}
                          className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">广告账户ID</label>
                        <input
                          type="text"
                          value={editForm.ad_account_id || ''}
                          onChange={(e) => setEditForm({...editForm, ad_account_id: e.target.value})}
                          className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">状态</label>
                        <select
                          value={editForm.status || 'Active'}
                          onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                          className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="Active">Active</option>
                          <option value="Disabled">Disabled</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveEdit(account.id);
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          保存
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelEdit();
                          }}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h5 className="font-semibold text-white">{account.account_name}</h5>
                          <p className="text-gray-400 text-sm font-mono">{account.ad_account_id}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            account.status === 'Active' 
                              ? 'bg-green-600 text-white' 
                              : 'bg-yellow-600 text-white'
                          }`}>
                            {account.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRecharge(account, personnel);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          充值
                        </button>
                        
                        {account.status === 'Disabled' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onReset(account, personnel);
                            }}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            清零
                          </button>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditAccount(account);
                          }}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          编辑
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAccount(account.id);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PersonnelCard;
