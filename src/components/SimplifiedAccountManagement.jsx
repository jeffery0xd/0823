import React, { useState, useEffect } from 'react';
import PublicScreen from './PublicScreen';
import AddAccountModal from './AddAccountModal';
import RechargeModal from './RechargeModal';
import SimpleZeroingModal from './SimpleZeroingModal';
import { Plus, RefreshCw, AlertCircle, History, Trash2, Users, CreditCard, CheckCircle } from 'lucide-react';
import { rechargeOperationsService, accountService, personnelService } from '../services/accountManagementService';

// 错误边界组件
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('AccountManagement Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center shadow-lg">
                        <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
                        <h3 className="text-lg font-bold text-gray-800 mb-2">页面加载失败</h3>
                        <p className="text-gray-600 mb-4">账户管理页面遇到问题，请刷新页面重试</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
                        >
                            刷新页面
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

const SimplifiedAccountManagement = () => {
    // 基础状态
    const [staffs, setStaffs] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // 模态框状态
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isRechargeModalOpen, setRechargeModalOpen] = useState(false);
    const [isZeroingModalOpen, setZeroingModalOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [isRechargeHistoryModalOpen, setRechargeHistoryModalOpen] = useState(false);
    const [rechargeHistory, setRechargeHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    
    // 公屏刷新触发器
    const [publicScreenRefreshTrigger, setPublicScreenRefreshTrigger] = useState(0);
    
    // 展开状态
    const [expandedStaff, setExpandedStaff] = useState(null);

    // 获取投放人员数据
    const fetchStaffs = async () => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('获取投放人员数据...');
            const staffData = await personnelService.getAll();
            
            if (Array.isArray(staffData) && staffData.length > 0) {
                setStaffs(staffData);
                console.log('成功获取投放人员:', staffData.length, '个');
            } else {
                console.warn('未获取到投放人员数据');
                setStaffs([]);
            }
        } catch (error) {
            console.error('获取投放人员失败:', error);
            setError(`加载投放人员失败：${error.message || '未知错误'}`);
            setStaffs([]);
        } finally {
            setLoading(false);
        }
    };

    // 获取指定人员的账户
    const fetchAccounts = async (staff) => {
        if (!staff || !staff.id) {
            setAccounts([]);
            return;
        }
        
        try {
            console.log('获取账户数据，投放人员:', staff.name);
            const accountData = await accountService.getByPersonnel(staff.id);
            
            const processedAccounts = (accountData || []).map(account => ({
                ...account,
                personnel_name: staff.name
            }));
            
            setAccounts(processedAccounts);
            console.log('获取到的账户数据:', processedAccounts.length, '个账户');
        } catch (error) {
            console.error('获取账户列表失败:', error);
            setAccounts([]);
        }
    };

    // 组件初始化
    useEffect(() => {
        fetchStaffs();
    }, []);

    // 处理人员选择
    const handleStaffToggle = (staff) => {
        if (expandedStaff?.id === staff.id) {
            setExpandedStaff(null);
            setSelectedStaff(null);
            setAccounts([]);
        } else {
            setExpandedStaff(staff);
            setSelectedStaff(staff);
            fetchAccounts(staff);
        }
    };

    // 账户添加成功处理
    const handleAccountAdded = () => {
        if (selectedStaff) {
            fetchAccounts(selectedStaff);
        }
        setAddModalOpen(false);
        setPublicScreenRefreshTrigger(prev => prev + 1);
    };

    // 充值成功处理
    const handleRecharge = () => {
        setRechargeModalOpen(false);
        setPublicScreenRefreshTrigger(prev => prev + 1);
    };

    // 清零成功处理
    const handleZeroing = () => {
        setZeroingModalOpen(false);
        setPublicScreenRefreshTrigger(prev => prev + 1);
        // 重新获取账户以更新状态
        if (selectedStaff) {
            fetchAccounts(selectedStaff);
        }
    };

    // 查看充值记录
    const handleViewRechargeHistory = async (account) => {
        setSelectedAccount(account);
        setRechargeHistoryModalOpen(true);
        setLoadingHistory(true);
        
        try {
            const history = await rechargeOperationsService.getByAccount(account.id);
            setRechargeHistory(history || []);
        } catch (error) {
            console.error('获取充值记录失败:', error);
            setRechargeHistory([]);
        } finally {
            setLoadingHistory(false);
        }
    };

    // 删除充值记录
    const handleDeleteRechargeRecord = async (recordId) => {
        if (!confirm('确定要删除这条充值记录吗？')) return;
        
        try {
            await rechargeOperationsService.delete(recordId);
            const history = await rechargeOperationsService.getByAccount(selectedAccount.id);
            setRechargeHistory(history || []);
            setPublicScreenRefreshTrigger(prev => prev + 1);
        } catch (error) {
            console.error('删除充值记录失败:', error);
            alert('删除失败，请重试');
        }
    };

    // 删除账户
    const handleDeleteAccount = async (account) => {
        if (!confirm(`确定要删除账户 "${account.account_name}" 吗？\n\n删除后将无法恢复。`)) return;
        
        try {
            await accountService.delete(account.id);
            if (selectedStaff) {
                fetchAccounts(selectedStaff);
            }
            alert('账户删除成功');
        } catch (error) {
            console.error('删除账户失败:', error);
            alert('删除账户失败，请重试');
        }
    };

    // 获取头像
    const getAvatarForOperator = (operatorName) => {
        if (!operatorName) return '👤';
        const avatarMap = {
            '丁': '🐶', '青': '🦊', '妹': '🐱', '白': '🐨',
            '小丁': '🐶', '小青': '🦊', '小妹': '🐱', '小白': '🐨'
        };
        for (const [name, avatar] of Object.entries(avatarMap)) {
            if (operatorName.includes(name)) return avatar;
        }
        return '👤';
    };

    // 重试加载
    const handleRetry = () => {
        setError(null);
        fetchStaffs();
    };

    // 错误状态
    if (error && !loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center shadow-lg">
                    <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
                    <h3 className="text-lg font-bold text-gray-800 mb-2">连接错误</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button 
                        onClick={handleRetry}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors"
                    >
                        重新连接
                    </button>
                </div>
            </div>
        );
    }

    // 加载状态
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <div className="text-lg mb-2">正在连接数据库...</div>
                    <div className="text-sm text-gray-400">正在加载投放人员信息</div>
                </div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-gray-50">
                <div className="flex flex-col lg:flex-row h-screen">
                    {/* 左侧面板 - 人员管理 */}
                    <div className="w-full lg:w-80 bg-white shadow-lg border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col">
                        {/* 头部 */}
                        <div className="p-4 border-b border-gray-100">
                            <div className="flex items-center space-x-2 mb-3">
                                <Users className="text-blue-500" size={20} />
                                <h2 className="text-lg font-bold text-gray-900">投放团队</h2>
                                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                                    {staffs.length}人
                                </span>
                            </div>
                        </div>

                        {/* 人员列表 */}
                        <div className="flex-1 overflow-y-auto p-3">
                            <div className="space-y-2">
                                {staffs.map((staff) => (
                                    <div key={staff.id} className="border border-gray-200 rounded-lg">
                                        {/* 人员头部 */}
                                        <button
                                            onClick={() => handleStaffToggle(staff)}
                                            className={`w-full text-left p-3 rounded-lg transition-all ${
                                                expandedStaff?.id === staff.id
                                                    ? 'bg-blue-50 border-blue-200'
                                                    : 'hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-lg">{getAvatarForOperator(staff.name)}</span>
                                                    <span className="font-medium text-gray-900">{staff.name}</span>
                                                </div>
                                                <div className="text-gray-400">
                                                    {expandedStaff?.id === staff.id ? '▼' : '▶'}
                                                </div>
                                            </div>
                                        </button>

                                        {/* 账户列表 - 展开时显示 */}
                                        {expandedStaff?.id === staff.id && (
                                            <div className="border-t border-gray-100 bg-gray-50">
                                                {accounts.length === 0 ? (
                                                    <div className="p-4 text-center">
                                                        <div className="text-sm text-gray-500 mb-2">暂无账户</div>
                                                        <button 
                                                            onClick={() => setAddModalOpen(true)}
                                                            className="text-sm bg-green-500 text-white px-4 py-2 rounded-full hover:bg-green-600 transition-colors"
                                                        >
                                                            <Plus size={16} className="inline mr-1" />
                                                            添加
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="p-2 space-y-1">
                                                        {accounts.map((account) => {
                                                            // 修复后的清零状态判断
                                                            const isReset = account.status === 'Reset' || account.status === 'reset' || account.status === 'cleared';
                                                            return (
                                                                <div key={account.id} className={`rounded p-3 border transition-all ${
                                                                    isReset 
                                                                        ? 'bg-gray-100 border-gray-300' // 修复：灰色背景
                                                                        : 'bg-white border-gray-200'
                                                                }`}>
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className={`text-sm font-medium truncate ${
                                                                                    isReset ? 'text-gray-600' : 'text-gray-900'
                                                                                }`}>
                                                                                    {account.account_name}
                                                                                </div>
                                                                                {isReset && (
                                                                                    // 修复：绿色"已清零"标签
                                                                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                                                                        <CheckCircle size={12} className="mr-1" />
                                                                                        已清零
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div className={`text-xs font-mono ${
                                                                                isReset ? 'text-gray-500' : 'text-gray-600'
                                                                            }`}>
                                                                                {account.ad_account_id}
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex gap-1 ml-2">
                                                                            <button
                                                                                onClick={() => {
                                                                                    setSelectedAccount(account);
                                                                                    setRechargeModalOpen(true);
                                                                                }}
                                                                                disabled={isReset}
                                                                                className={`p-2 text-white rounded transition-colors ${
                                                                                    isReset 
                                                                                        ? 'bg-gray-400 cursor-not-allowed' 
                                                                                        : 'bg-blue-500 hover:bg-blue-600'
                                                                                }`}
                                                                                title={isReset ? '已清零账户无需充值' : '充值'}
                                                                            >
                                                                                <CreditCard size={14} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => {
                                                                                    setSelectedAccount(account);
                                                                                    setZeroingModalOpen(true);
                                                                                }}
                                                                                className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                                                                title={isReset ? '查看清零历史' : '清零'}
                                                                            >
                                                                                <RefreshCw size={14} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleViewRechargeHistory(account)}
                                                                                className="p-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                                                                title="充值记录"
                                                                            >
                                                                                <History size={14} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDeleteAccount(account)}
                                                                                className="p-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                                                                                title="删除账户"
                                                                            >
                                                                                <Trash2 size={14} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                        <button 
                                                            onClick={() => setAddModalOpen(true)}
                                                            className="w-full text-sm bg-green-500 text-white py-3 rounded hover:bg-green-600 transition-colors"
                                                        >
                                                            <Plus size={16} className="inline mr-1" />
                                                            添加新账户
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {staffs.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        <div className="text-sm">暂无投放人员数据</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 右侧主内容区域 - 公屏显示 */}
                    <div className="flex-1 bg-white overflow-hidden">
                        <PublicScreen refreshTrigger={publicScreenRefreshTrigger} />
                    </div>
                </div>

                {/* 模态框 */}
                <AddAccountModal 
                    isOpen={isAddModalOpen} 
                    onClose={() => setAddModalOpen(false)} 
                    onSuccess={handleAccountAdded}
                    staffId={selectedStaff?.id}
                    staffName={selectedStaff?.name}
                />
                
                <RechargeModal 
                    isOpen={isRechargeModalOpen} 
                    onClose={() => setRechargeModalOpen(false)} 
                    onSuccess={handleRecharge}
                    account={selectedAccount}
                />
                
                <SimpleZeroingModal 
                    isOpen={isZeroingModalOpen} 
                    onClose={() => setZeroingModalOpen(false)} 
                    onSuccess={handleZeroing}
                    account={selectedAccount}
                />

                {/* 充值记录模态框 */}
                {isRechargeHistoryModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-96 overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold">充值记录</h3>
                                <button
                                    onClick={() => setRechargeHistoryModalOpen(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            {loadingHistory ? (
                                <div className="text-center py-8">
                                    <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                                    <div>加载中...</div>
                                </div>
                            ) : rechargeHistory.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">暂无充值记录</div>
                            ) : (
                                <div className="space-y-2">
                                    {rechargeHistory.map((record) => (
                                        <div key={record.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                            <div>
                                                <div className="font-medium">${record.amount}</div>
                                                <div className="text-sm text-gray-500">
                                                    {new Date(record.created_at).toLocaleString()}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteRechargeRecord(record.id)}
                                                className="text-red-500 hover:text-red-700"
                                                title="删除记录"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </ErrorBoundary>
    );
};

export default SimplifiedAccountManagement;
