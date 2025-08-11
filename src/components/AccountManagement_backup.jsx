import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import PublicScreen from './PublicScreen';
import AddAccountModal from './AddAccountModal';
import RechargeModal from './RechargeModal';
import SimpleZeroingModal from './SimpleZeroingModal';
import { Plus, RefreshCw, AlertCircle, History, Trash2, Users, CreditCard, CheckCircle, XCircle } from 'lucide-react';
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

    // 获取今日充值记录 - 简化版
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

    // 获取所有人员的账户信息
    const fetchAllStaffAccounts = useCallback(async (staffList) => {
        try {
            if (!mountedRef.current) return;
            
            if (!Array.isArray(staffList) || staffList.length === 0) {
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
                    const { data: newData, error: newError } = await supabase
                        .from(`${newTablePrefix}account_management_ads`)
                        .select('*')
                        .eq('personnel_id', staff.id)
                        .order('created_at', { ascending: false });
                    
                    if (!mountedRef.current) break;
                    
                    let accounts = [];
                    
                    if (newData && newData.length > 0) {
                        // 有新数据，使用新数据
                        accounts = newData.map(account => ({
                            ...account,
                            personnel_name: staff.name
                        }));
                    } else {
                        // 没有新数据，尝试从旧表获取
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
    }, [newTablePrefix]);

    const fetchStaffs = async () => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('正在获取投放人员数据...');
            
            const { data, error } = await supabase
                .from(`${newTablePrefix}personnel`)
                .select('*')
                .order('name', { ascending: true });
            
            if (error) {
                console.error('Supabase 错误:', error);
                throw error;
            }
            
            console.log('获取到的投放人员数据:', data?.length || 0, '条记录');
            
            if (!mountedRef.current) return;
            
            if (data && data.length > 0) {
                setStaffs(data);
                setRetryCount(0);
                // 获取今日充值记录
                await fetchTodayRechargeOperations();
                // 获取所有人员的账户信息
                await fetchAllStaffAccounts(data);
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
    };



    // 从旧表获取账户数据
    const fetchAccountsFromOldTable = useCallback(async (staffName) => {
        try {
            if (!mountedRef.current) return [];
            
            console.log('从旧表获取账户数据:', staffName);
            
            const { data, error } = await supabase
                .from(`${oldTablePrefix}advertising_accounts`)
                .select('*')
                .order('created_at', { ascending: false });
            
            if (!mountedRef.current) return [];
            
            if (error) {
                console.error('查询旧表错误:', error);
                return [];
            }
            
            // 根据名称匹配账户（简单的名称匹配逻辑）
            let filteredAccounts = data || [];
            if (staffName) {
                const nameKeyword = staffName.charAt(0); // 取名字首字符
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
                personnel_id: null, // 旧表数据没有 personnel_id，设置为 null
                balance: account.balance || '0.00',
                created_at: account.created_at,
                updated_at: account.updated_at
            }));
        } catch (error) {
            console.error('获取旧账户数据失败:', error);
            return [];
        }
    }, [oldTablePrefix]);

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
            console.log('正在获取账户数据，投放人员:', staff.name);
            
            // 优先从新表获取数据
            const { data: newData, error: newError } = await supabase
                .from(`${newTablePrefix}account_management_ads`)
                .select('*')
                .eq('personnel_id', staff.id)
                .order('created_at', { ascending: false });
            
            if (!mountedRef.current) return;
            
            let accounts = [];
            
            if (newData && newData.length > 0) {
                // 有新数据，使用新数据
                accounts = newData.map(account => ({
                    ...account,
                    personnel_name: staff.name
                }));
            } else {
                // 没有新数据，尝试从旧表获取
                accounts = await fetchAccountsFromOldTable(staff.name);
            }
            
            console.log('获取到的账户数据:', accounts?.length || 0, '个账户');
            
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

    useEffect(() => {
        mountedRef.current = true;
        fetchStaffs();
        
        return () => {
            mountedRef.current = false;
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
        };
    }, []);

    const handleAccountAdded = () => {
        if (selectedStaff) {
            fetchAccounts(selectedStaff);
        }
        setAddModalOpen(false);
        setPublicScreenRefreshTrigger(prev => prev + 1);
        fetchTodayRechargeOperations(); // 刷新今日充值记录
        if (Array.isArray(staffs)) {
            fetchAllStaffAccounts(staffs); // 刷新所有人员账户信息
        }
    };

    const handleRecharge = useCallback(() => {
        console.log('充值操作完成');
        
        // 立即关闭模态框
        setRechargeModalOpen(false);
        
        // 简单的公屏刷新
        setPublicScreenRefreshTrigger(prev => prev + 1);
        
        // 延迟刷新数据，避免状态冲突
        setTimeout(() => {
            if (!mountedRef.current) return;
            
            // 只刷新必要的数据，避免复杂的并发操作
            fetchTodayRechargeOperations().catch(err => {
                console.error('刷新今日记录失败:', err);
            });
        }, 200);
    }, []);

    const handleZeroing = useCallback(() => {
        console.log('清零操作完成');
        
        try {
            // 关闭模态框
            setZeroingModalOpen(false);
            
            // 刷新公屏显示
            setPublicScreenRefreshTrigger(prev => prev + 1);
            
            console.log('清零回调执行成功');
        } catch (error) {
            console.error('清零回调失败:', error);
        }
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
            // 刷新今日充值记录和状态提示
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
            // 判断账户来源并删除相应表的数据
            if (account.personnel_id) {
                // 来自新表，使用accountService删除
                await accountService.delete(account.id);
            } else {
                // 来自旧表，直接删除旧表中的数据
                const { error } = await supabase
                    .from(`${oldTablePrefix}advertising_accounts`)
                    .delete()
                    .eq('id', account.id);
                
                if (error) {
                    console.error('删除旧表账户失败:', error);
                    throw error;
                }
            }
            
            // 刷新账户列表
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

    // 计算人员充值状态 - 简化版
    const getPersonnelRechargeStatus = (staff) => {
        try {
            if (!staff || !staff.id) {
                return { text: '数据错误', type: 'neutral' };
            }

            const staffAccounts = allStaffAccounts[staff.id];
            if (!Array.isArray(staffAccounts) || staffAccounts.length === 0) {
                return { text: '暂无账户', type: 'neutral' };
            }

            // 简单返回账户数量，不计算复杂的充值状态
            return { 
                text: `${staffAccounts.length}个账户`, 
                type: 'neutral' 
            };
        } catch (error) {
            console.error('获取人员状态失败:', error);
            return { text: '状态错误', type: 'neutral' };
        }
    };

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

    try {
        return (
            <div className="min-h-screen bg-gray-50">
            {/* 响应式布局 */}
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
                                                        
                                                        if (status.type === 'neutral') return null;
                                                        
                                                        return (
                                                            <div className={`flex items-center space-x-1 mt-1`}>
                                                                {status.type === 'success' && <CheckCircle size={10} className="text-green-500" />}
                                                                {status.type === 'warning' && <XCircle size={10} className="text-red-500" />}
                                                                {status.type === 'partial' && <AlertCircle size={10} className="text-orange-500" />}
                                                                <span className={`text-xs ${
                                                                    status.type === 'success' ? 'text-green-600' :
                                                                    status.type === 'warning' ? 'text-red-600' :
                                                                    'text-orange-600'
                                                                }`}>
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
                                                        className="text-sm lg:text-xs bg-green-500 text-white px-4 py-2 lg:px-3 lg:py-1 rounded-full hover:bg-green-600 transition-colors min-h-8 lg:min-h-auto"
                                                    >
                                                        <Plus size={16} className="lg:w-3 lg:h-3 inline mr-1" />
                                                        添加
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="p-2 space-y-1">
                                                    {accounts.map((account) => {
                                                        const isReset = account.status === 'Reset' || account.status === 'reset';
                                                        return (
                                                            <div key={account.id} className={`rounded p-2 border ${
                                                                isReset 
                                                                    ? 'bg-gray-100 border-gray-300 opacity-70' 
                                                                    : 'bg-white border-gray-200'
                                                            }`}>
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className={`text-xs font-medium truncate ${
                                                                                isReset ? 'text-gray-500' : 'text-gray-900'
                                                                            }`}>
                                                                                {account.account_name}
                                                                            </div>
                                                                            {isReset && (
                                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-600">
                                                                                    <CheckCircle size={10} className="mr-1" />
                                                                                    已清零
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className={`text-xs font-mono ${
                                                                            isReset ? 'text-gray-400' : 'text-gray-500'
                                                                        }`}>
                                                                            {account.ad_account_id}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-1 ml-2 lg:space-x-1 lg:flex-nowrap">
                                                                        <button
                                                                            onClick={() => {
                                                                                setSelectedAccount(account);
                                                                                setRechargeModalOpen(true);
                                                                            }}
                                                                            disabled={isReset}
                                                                            className={`p-2 lg:p-1 text-white rounded transition-colors min-h-8 lg:min-h-auto ${
                                                                                isReset 
                                                                                    ? 'bg-gray-400 cursor-not-allowed' 
                                                                                    : 'bg-blue-500 hover:bg-blue-600'
                                                                            }`}
                                                                            title={isReset ? '已清零账户无需充值' : '充值'}
                                                                        >
                                                                            <CreditCard size={14} className="lg:w-2.5 lg:h-2.5" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                setSelectedAccount(account);
                                                                                setZeroingModalOpen(true);
                                                                            }}
                                                                            className={`p-2 lg:p-1 text-white rounded transition-colors min-h-8 lg:min-h-auto ${
                                                                                isReset 
                                                                                    ? 'bg-gray-500 hover:bg-gray-600' 
                                                                                    : 'bg-red-500 hover:bg-red-600'
                                                                            }`}
                                                                            title={isReset ? '查看清零历史' : '清零'}
                                                                        >
                                                                            <RefreshCw size={14} className="lg:w-2.5 lg:h-2.5" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleViewRechargeHistory(account)}
                                                                            className="p-2 lg:p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors min-h-8 lg:min-h-auto"
                                                                            title="充值记录"
                                                                        >
                                                                            <History size={14} className="lg:w-2.5 lg:h-2.5" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteAccount(account)}
                                                                            className="p-2 lg:p-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors min-h-8 lg:min-h-auto"
                                                                            title="删除账户"
                                                                        >
                                                                            <Trash2 size={14} className="lg:w-2.5 lg:h-2.5" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    <button 
                                                        onClick={() => setAddModalOpen(true)}
                                                        className="w-full text-sm lg:text-xs bg-green-500 text-white py-3 lg:py-2 rounded hover:bg-green-600 transition-colors min-h-10 lg:min-h-auto"
                                                    >
                                                        <Plus size={16} className="lg:w-3 lg:h-3 inline mr-1" />
                                                        添加新账户
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {(!Array.isArray(staffs) || staffs.length === 0) && (
                                <div className="text-center py-8 text-gray-500">
                                    <div className="text-sm">暂无投放人员数据</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 右侧主内容区域 - 公屏显示 */}
                <div className="flex-1 bg-white overflow-hidden min-h-96">
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
        );
    } catch (renderError) {
        console.error('组件渲染失败:', renderError);
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="text-center max-w-md p-6">
                    <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
                    <div className="text-red-400 text-lg mb-2">页面渲染错误</div>
                    <div className="text-gray-600 text-sm mb-6">
                        页面遇到了渲染问题，请刷新页面重试
                    </div>
                    <button 
                        onClick={() => window.location.reload()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors"
                    >
                        刷新页面
                    </button>
                </div>
            </div>
        );
    }
};

export default AccountManagement;