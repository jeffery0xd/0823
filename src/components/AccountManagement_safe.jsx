import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import PublicScreen from './PublicScreen';
import AddAccountModal from './AddAccountModal';
import RechargeModal from './RechargeModal';
import SimpleZeroingModal from './SimpleZeroingModal';
import { Plus, RefreshCw, AlertCircle, History, Trash2, Users, CreditCard, CheckCircle, XCircle, ChevronDown } from 'lucide-react';
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
        console.error('Modal Error Boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md mx-4">
                        <div className="text-center">
                            <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
                            <h3 className="text-lg font-bold text-gray-800 mb-2">操作失败</h3>
                            <p className="text-gray-600 mb-4">操作过程中出现了问题，请刷新页面重试</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
                            >
                                刷新页面
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

const AccountManagement = () => {
    const [staffs, setStaffs] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingAccounts, setLoadingAccounts] = useState(false);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isRechargeModalOpen, setRechargeModalOpen] = useState(false);
    const [isZeroingModalOpen, setZeroingModalOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [isRechargeHistoryModalOpen, setRechargeHistoryModalOpen] = useState(false);
    const [rechargeHistory, setRechargeHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [publicScreenRefreshTrigger, setPublicScreenRefreshTrigger] = useState(0);
    const [expandedStaff, setExpandedStaff] = useState(null);
    const [todayRechargeOperations, setTodayRechargeOperations] = useState([]);
    const [allStaffAccounts, setAllStaffAccounts] = useState({});

    // 使用旧的表前缀来获取用户之前的数据
    const oldTablePrefix = 'app_5c098b55fc88465db9b331c43b51ef43_';
    const newTablePrefix = 'app_e87b41cfe355428b8146f8bae8184e10_';
    const mountedRef = useRef(true);
    const retryTimeoutRef = useRef(null);

    // 从旧表获取账户数据 - 稳定版本
    const fetchAccountsFromOldTable = useCallback(async (staffName) => {
        try {
            if (!mountedRef.current) return [];
            
            const { data, error } = await supabase
                .from(`${oldTablePrefix}advertising_accounts`)
                .select('*')
                .order('created_at', { ascending: false });
            
            if (!mountedRef.current) return [];
            
            if (error) {
                console.error('查询旧表错误:', error);
                return [];
            }
            
            // 根据名称匹配账户
            let filteredAccounts = data || [];
            if (staffName) {
                const nameKeyword = staffName.charAt(0);
                filteredAccounts = data.filter(account => 
                    account.account_name && account.account_name.includes(nameKeyword)
                );
            }
            
            // 转换为新格式
            return filteredAccounts.map(account => ({
                id: account.id,
                account_name: account.account_name,
                ad_account_id: account.account_id,
                status: 'Active',
                personnel_name: staffName,
                personnel_id: null,
                balance: account.balance || '0.00',
                created_at: account.created_at,
                updated_at: account.updated_at
            }));
        } catch (error) {
            console.error('获取旧账户数据失败:', error);
            return [];
        }
    }, [oldTablePrefix]);

    // 获取今日充值记录 - 稳定版本
    const fetchTodayRechargeOperations = useCallback(async () => {
        try {
            if (!mountedRef.current) return;
            
            const todayOperations = await rechargeOperationsService.getTodayOperations();
            
            if (!mountedRef.current) return;
            
            setTodayRechargeOperations(Array.isArray(todayOperations) ? todayOperations : []);
        } catch (error) {
            console.error('获取今日充值记录失败:', error);
            if (mountedRef.current) {
                setTodayRechargeOperations([]);
            }
        }
    }, []);

    // 获取所有人员的账户信息 - 稳定版本
    const fetchAllStaffAccounts = useCallback(async (staffList) => {
        try {
            if (!mountedRef.current || !Array.isArray(staffList) || staffList.length === 0) {
                if (mountedRef.current) {
                    setAllStaffAccounts({});
                }
                return;
            }

            const accountsMap = {};
            
            for (const staff of staffList) {
                if (!mountedRef.current) break;
                
                try {
                    if (!staff || !staff.id) {
                        accountsMap[staff?.id || 'unknown'] = [];
                        continue;
                    }

                    // 优先从新表获取数据
                    const { data: newData } = await supabase
                        .from(`${newTablePrefix}account_management_ads`)
                        .select('*')
                        .eq('personnel_id', staff.id)
                        .order('created_at', { ascending: false });
                    
                    if (!mountedRef.current) break;
                    
                    let accounts = [];
                    
                    if (newData && newData.length > 0) {
                        accounts = newData.map(account => ({
                            ...account,
                            personnel_name: staff.name
                        }));
                    } else {
                        try {
                            accounts = await fetchAccountsFromOldTable(staff.name);
                        } catch (oldTableError) {
                            console.error(`从旧表获取 ${staff.name} 的账户失败:`, oldTableError);
                            accounts = [];
                        }
                    }
                    
                    if (mountedRef.current) {
                        accountsMap[staff.id] = Array.isArray(accounts) ? accounts : [];
                    }
                } catch (error) {
                    console.error(`获取 ${staff.name} 的账户失败:`, error);
                    if (mountedRef.current) {
                        accountsMap[staff.id] = [];
                    }
                }
            }
            
            if (mountedRef.current) {
                setAllStaffAccounts(accountsMap);
            }
        } catch (error) {
            console.error('获取所有人员账户信息失败:', error);
            if (mountedRef.current) {
                setAllStaffAccounts({});
            }
        }
    }, [newTablePrefix, fetchAccountsFromOldTable]);

    // 获取账户列表 - 稳定版本
    const fetchAccounts = useCallback(async (staff) => {
        if (!staff) {
            if (mountedRef.current) {
                setAccounts([]);
            }
            return;
        }
        
        try {
            if (mountedRef.current) {
                setLoadingAccounts(true);
            }
            
            // 优先从新表获取数据
            const { data: newData } = await supabase
                .from(`${newTablePrefix}account_management_ads`)
                .select('*')
                .eq('personnel_id', staff.id)
                .order('created_at', { ascending: false });
            
            if (!mountedRef.current) return;
            
            let accounts = [];
            
            if (newData && newData.length > 0) {
                accounts = newData.map(account => ({
                    ...account,
                    personnel_name: staff.name
                }));
            } else {
                accounts = await fetchAccountsFromOldTable(staff.name);
            }
            
            if (mountedRef.current) {
                setAccounts(accounts);
            }
        } catch (error) {
            console.error('获取账户列表失败:', error);
        } finally {
            if (mountedRef.current) {
                setLoadingAccounts(false);
            }
        }
    }, [newTablePrefix, fetchAccountsFromOldTable]);

    // 获取投放人员 - 稳定版本
    const fetchStaffs = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const { data, error } = await supabase
                .from(`${newTablePrefix}personnel`)
                .select('*')
                .order('name', { ascending: true });
            
            if (error) {
                console.error('Supabase 错误:', error);
                throw error;
            }
            
            if (!mountedRef.current) return;
            
            if (data && data.length > 0) {
                setStaffs(data);
                setRetryCount(0);
                
                // 延迟执行，避免同步调用
                setTimeout(async () => {
                    if (mountedRef.current) {
                        try {
                            await fetchTodayRechargeOperations();
                            await fetchAllStaffAccounts(data);
                        } catch (err) {
                            console.error('加载附加数据失败:', err);
                        }
                    }
                }, 100);
            } else {
                throw new Error('未找到投放人员数据');
            }
        } catch (error) {
            console.error('获取投放人员失败:', error);
            if (!mountedRef.current) return;
            
            setError(`加载投放人员失败：${error.message || '未知错误'}`);
            
            if (retryCount < 3) {
                setRetryCount(prev => prev + 1);
                retryTimeoutRef.current = setTimeout(() => {
                    fetchStaffs();
                }, 2000 * (retryCount + 1));
            }
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, [newTablePrefix, retryCount, fetchTodayRechargeOperations, fetchAllStaffAccounts]);

    // 挂载时执行
    useEffect(() => {
        mountedRef.current = true;
        fetchStaffs();
        
        return () => {
            mountedRef.current = false;
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
        };
    }, []); // 空依赖数组，只在组件挂载时执行一次

    // 事件处理函数 - 稳定版本
    const handleAccountAdded = useCallback(() => {
        if (selectedStaff) {
            fetchAccounts(selectedStaff);
        }
        setAddModalOpen(false);
        setPublicScreenRefreshTrigger(prev => prev + 1);
        
        // 延迟刷新，避免状态冲突
        setTimeout(() => {
            if (mountedRef.current) {
                fetchTodayRechargeOperations();
                if (staffs.length > 0) {
                    fetchAllStaffAccounts(staffs);
                }
            }
        }, 200);
    }, [selectedStaff, staffs, fetchAccounts, fetchTodayRechargeOperations, fetchAllStaffAccounts]);

    const handleRecharge = useCallback(() => {
        setRechargeModalOpen(false);
        setPublicScreenRefreshTrigger(prev => prev + 1);
        
        setTimeout(() => {
            if (mountedRef.current) {
                fetchTodayRechargeOperations();
            }
        }, 200);
    }, [fetchTodayRechargeOperations]);

    const handleZeroing = useCallback(() => {
        setZeroingModalOpen(false);
        setPublicScreenRefreshTrigger(prev => prev + 1);
    }, []);

    const handleViewRechargeHistory = async (account) => {
        setSelectedAccount(account);
        setRechargeHistoryModalOpen(true);
        setLoadingHistory(true);
        
        try {
            const history = await rechargeOperationsService.getByAccount(account.id);
            setRechargeHistory(history);
        } catch (error) {
            console.error('获取充值记录失败:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleDeleteRechargeRecord = async (recordId) => {
        if (!confirm('确定要删除这条充值记录吗？')) return;
        
        try {
            await rechargeOperationsService.delete(recordId);
            const history = await rechargeOperationsService.getByAccount(selectedAccount.id);
            setRechargeHistory(history);
            fetchTodayRechargeOperations();
            setPublicScreenRefreshTrigger(prev => prev + 1);
        } catch (error) {
            console.error('删除充值记录失败:', error);
            alert('删除失败，请重试');
        }
    };

    const handleDeleteAccount = async (account) => {
        if (!confirm(`确定要删除账户 "${account.account_name}" 吗？\n\n删除后将无法恢复，所有相关数据都将被清除。`)) return;
        
        try {
            if (account.personnel_id) {
                await accountService.delete(account.id);
            } else {
                const { error } = await supabase
                    .from(`${oldTablePrefix}advertising_accounts`)
                    .delete()
                    .eq('id', account.id);
                
                if (error) {
                    console.error('删除旧表账户失败:', error);
                    throw error;
                }
            }
            
            if (selectedStaff) {
                fetchAccounts(selectedStaff);
            }
            alert('账户删除成功');
        } catch (error) {
            console.error('删除账户失败:', error);
            alert('删除账户失败，请重试');
        }
    };

    const handleRetry = () => {
        setError(null);
        setRetryCount(0);
        fetchStaffs();
    };

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

    const getPersonnelRechargeStatus = (staff) => {
        try {
            if (!staff || !staff.id) {
                return { text: '数据错误', type: 'neutral' };
            }

            const staffAccounts = allStaffAccounts[staff.id];
            if (!Array.isArray(staffAccounts) || staffAccounts.length === 0) {
                return { text: '暂无账户', type: 'neutral' };
            }

            return { 
                text: `${staffAccounts.length}个账户`, 
                type: 'neutral' 
            };
        } catch (error) {
            console.error('获取人员状态失败:', error);
            return { text: '状态错误', type: 'neutral' };
        }
    };

    // 错误和加载状态处理
    if (error && !loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
                <div className="text-center max-w-md p-6">
                    <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
                    <div className="text-red-400 text-lg mb-2">连接错误</div>
                    <div className="text-gray-300 text-sm mb-6">{error}</div>
                    <button 
                        onClick={handleRetry}
                        className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-md transition-colors"
                    >
                        重新连接
                    </button>
                </div>
            </div>
        );
    }

    if (loading && !error) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <div className="text-lg mb-2">正在连接数据库...</div>
                    <div className="text-sm text-gray-400">正在加载投放人员信息</div>
                </div>
            </div>
        );
    }

    // 主要渲染内容
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="flex flex-col lg:flex-row h-screen">
                {/* 左侧面板 - 人员和快捷操作 */}
                <div className="w-full lg:w-80 bg-white shadow-lg border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col max-h-96 lg:max-h-none overflow-hidden">
                    {/* 头部 */}
                    <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center space-x-2 mb-3">
                            <Users className="text-blue-500" size={20} />
                            <h2 className="text-lg font-bold text-gray-900">投放团队</h2>
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                                {Array.isArray(staffs) ? staffs.length : 0}人
                            </span>
                        </div>
                        
                        {/* 今日统计 */}
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                                <CreditCard size={12} />
                                <span>今日充值：{todayRechargeOperations.length}次</span>
                            </div>
                        </div>
                    </div>

                    {/* 人员列表 - 紧凑设计 */}
                    <div className="flex-1 overflow-y-auto p-3">
                        <div className="space-y-2">
                            {Array.isArray(staffs) && staffs.map((staff) => (
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
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900">{staff.name}</span>
                                                    {(() => {
                                                        const status = getPersonnelRechargeStatus(staff);
                                                        
                                                        return (
                                                            <div className="flex items-center space-x-1 mt-1">
                                                                <span className="text-xs text-gray-500">
                                                                    {status.text}
                                                                </span>
                                                            </div>
                                                        );
                                                    })()} 
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {expandedStaff?.id === staff.id && loadingAccounts && (
                                                    <RefreshCw size={14} className="animate-spin text-blue-500" />
                                                )}
                                                <ChevronDown 
                                                    size={16} 
                                                    className={`text-gray-400 transition-transform ${
                                                        expandedStaff?.id === staff.id ? 'rotate-180' : ''
                                                    }`} 
                                                />
                                            </div>
                                        </div>
                                    </button>

                                    {/* 账户列表 - 展开时显示 */}
                                    {expandedStaff?.id === staff.id && (
                                        <div className="border-t border-gray-100 bg-gray-50">
                                            {loadingAccounts ? (
                                                <div className="p-4 text-center">
                                                    <div className="text-sm text-gray-500">加载中...</div>
                                                </div>
                                            ) : accounts.length === 0 ? (
                                                <div className="p-4 text-center">
                                                    <div className="text-sm text-gray-500 mb-2">暂无账户</div>
                                                    <button
                                                        onClick={() => setAddModalOpen(true)}
                                                        className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
                                                    >
                                                        <Plus size={12} className="inline mr-1" />
                                                        添加账户
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="p-3 space-y-2">
                                                    {accounts.map((account) => (
                                                        <div key={account.id} className="bg-white p-3 rounded border border-gray-200">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-medium text-gray-900 text-sm truncate">
                                                                        {account.account_name}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        余额: ¥{account.balance || '0.00'}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center space-x-1">
                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedAccount(account);
                                                                            setRechargeModalOpen(true);
                                                                        }}
                                                                        className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                                                                        title="充值"
                                                                    >
                                                                        <CreditCard size={14} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleViewRechargeHistory(account)}
                                                                        className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                                                                        title="充值记录"
                                                                    >
                                                                        <History size={14} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteAccount(account)}
                                                                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                                                                        title="删除账户"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    
                                                    {/* 快捷操作按钮 */}
                                                    <div className="flex space-x-2 pt-2 border-t border-gray-200">
                                                        <button
                                                            onClick={() => setAddModalOpen(true)}
                                                            className="flex-1 text-xs bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 transition-colors"
                                                        >
                                                            <Plus size={12} className="inline mr-1" />
                                                            添加账户
                                                        </button>
                                                        <button
                                                            onClick={() => setZeroingModalOpen(true)}
                                                            className="flex-1 text-xs bg-orange-500 text-white px-3 py-2 rounded hover:bg-orange-600 transition-colors"
                                                        >
                                                            清零操作
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 右侧面板 - 公屏显示 */}
                <div className="flex-1 lg:flex-1 bg-gray-100">
                    <ErrorBoundary>
                        <PublicScreen 
                            refreshTrigger={publicScreenRefreshTrigger}
                            className="h-full"
                        />
                    </ErrorBoundary>
                </div>
            </div>

            {/* 模态框组件 */}
            {isAddModalOpen && (
                <ErrorBoundary>
                    <AddAccountModal
                        staff={selectedStaff}
                        isOpen={isAddModalOpen}
                        onClose={() => setAddModalOpen(false)}
                        onAccountAdded={handleAccountAdded}
                    />
                </ErrorBoundary>
            )}

            {isRechargeModalOpen && selectedAccount && (
                <ErrorBoundary>
                    <RechargeModal
                        account={selectedAccount}
                        isOpen={isRechargeModalOpen}
                        onClose={() => setRechargeModalOpen(false)}
                        onRecharge={handleRecharge}
                    />
                </ErrorBoundary>
            )}

            {isZeroingModalOpen && (
                <ErrorBoundary>
                    <SimpleZeroingModal
                        staff={selectedStaff}
                        isOpen={isZeroingModalOpen}
                        onClose={() => setZeroingModalOpen(false)}
                        onZeroing={handleZeroing}
                    />
                </ErrorBoundary>
            )}

            {/* 充值历史模态框 */}
            {isRechargeHistoryModalOpen && (
                <ErrorBoundary>
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900">
                                    {selectedAccount?.account_name} - 充值记录
                                </h3>
                                <button
                                    onClick={() => setRechargeHistoryModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>
                            
                            {loadingHistory ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                                    <div className="text-gray-500">加载中...</div>
                                </div>
                            ) : rechargeHistory.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    暂无充值记录
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {rechargeHistory.map((record) => (
                                        <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                                            <div>
                                                <div className="font-medium">¥{record.amount}</div>
                                                <div className="text-sm text-gray-500">
                                                    {new Date(record.created_at).toLocaleString()}
                                                </div>
                                                {record.note && (
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        备注: {record.note}
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleDeleteRechargeRecord(record.id)}
                                                className="text-red-500 hover:text-red-700 p-1"
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
                </ErrorBoundary>
            )}
        </div>
    );
};

export default AccountManagement;