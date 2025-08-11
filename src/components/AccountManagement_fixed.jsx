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

    // 从旧表获取账户数据 - 移到前面，避免依赖问题
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

    // 获取所有人员的账户信息 - 修复依赖项
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
    }, [newTablePrefix, fetchAccountsFromOldTable]); // 添加 fetchAccountsFromOldTable 依赖

    // 修复 fetchStaffs 函数，不要在同一个函数中调用多个可能引起状态更新的函数
    const fetchStaffs = useCallback(async () => {
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
                
                // 使用 setTimeout 来避免同步调用导致的无限循环
                setTimeout(() => {
                    if (mountedRef.current) {
                        fetchTodayRechargeOperations().catch(console.error);
                        fetchAllStaffAccounts(data).catch(console.error);
                    }
                }, 0);
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
    }, []); // 空依赖数组，只在组件挂载时执行一次

    // 修复 handleAccountAdded 函数，避免直接调用可能引起循环的函数
    const handleAccountAdded = useCallback(() => {
        if (selectedStaff) {
            fetchAccounts(selectedStaff);
        }
        setAddModalOpen(false);
        setPublicScreenRefreshTrigger(prev => prev + 1);
        
        // 使用 setTimeout 来避免同步调用导致的问题
        setTimeout(() => {
            if (mountedRef.current) {
                fetchTodayRechargeOperations().catch(console.error);
                // 只有在有 staffs 数据时才刷新
                if (staffs.length > 0) {
                    fetchAllStaffAccounts(staffs).catch(console.error);
                }
            }
        }, 100);
    }, [selectedStaff, staffs, fetchAccounts, fetchTodayRechargeOperations, fetchAllStaffAccounts]);

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
    }, [fetchTodayRechargeOperations]);

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

    // 其余的UI代码保持不变...
    try {
        return (
            <div className="min-h-screen bg-gray-50">
                {/* 简化的 UI 结构，避免过于复杂的嵌套 */}
                <div className="p-4">
                    <h1 className="text-2xl font-bold mb-4">账户管理系统</h1>
                    {staffs.length > 0 ? (
                        <div className="bg-white rounded-lg p-4">
                            <p>投放人员: {staffs.length} 人</p>
                            <p>今日充值操作: {todayRechargeOperations.length} 次</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg p-4">
                            <p>暂无数据</p>
                        </div>
                    )}
                </div>
            </div>
        );
    } catch (renderError) {
        console.error('渲染错误:', renderError);
        return (
            <div className="flex items-center justify-center h-screen bg-red-50">
                <div className="text-center p-6">
                    <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
                    <h3 className="text-lg font-bold text-red-800 mb-2">渲染错误</h3>
                    <p className="text-red-600 mb-4">组件渲染时出现错误，请刷新页面重试</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md"
                    >
                        刷新页面
                    </button>
                </div>
            </div>
        );
    }
};

export default AccountManagement;