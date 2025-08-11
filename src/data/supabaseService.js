import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://pfkqocxbvnfebuhrjnxm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBma3FvY3hidm5mZWJ1aHJqbnhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0OTMwNjksImV4cCI6MjA2ODA2OTA2OX0.B-IoA9SkLH8tmj9xXObklN9PmDj1jnj9B9lpChDDgMM'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Account management functions
export const accountService = {
  // Get all advertising accounts
  async getAccounts() {
    try {
      const { data, error } = await supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_advertising_accounts')
        .select('*')
        .order('account_name')
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching accounts:', error)
      // Fallback to localStorage
      return this.getLocalAccounts()
    }
  },

  // Create new account
  async createAccount(accountData) {
    try {
      const { data, error } = await supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_advertising_accounts')
        .insert([accountData])
        .select()
      
      if (error) throw error
      return data[0]
    } catch (error) {
      console.error('Error creating account:', error)
      return this.createLocalAccount(accountData)
    }
  },

  // Add new account (missing method)
  async addAccount(accountData) {
    try {
      console.log('添加新账户:', accountData);
      const { data, error } = await supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_advertising_accounts')
        .insert([{
          account_id: accountData.account_id,
          account_name: accountData.account_name,
          balance: accountData.balance || 0,
          created_at: accountData.created_at || new Date().toISOString()
        }])
        .select()
      
      if (error) {
        console.error('添加账户错误:', error);
        throw error;
      }
      console.log('添加账户成功:', data);
      return data[0]
    } catch (error) {
      console.error('Error adding account:', error)
      return this.createLocalAccount(accountData)
    }
  },

  // Update account balance
  async updateAccountBalance(accountId, newBalance) {
    try {
      console.log('更新账户余额:', { accountId, newBalance });
      const { data, error } = await supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_advertising_accounts')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('account_id', accountId)
        .select()
      
      if (error) {
        console.error('更新余额错误:', error);
        throw error;
      }
      console.log('更新余额成功:', data);
      return data[0]
    } catch (error) {
      console.error('Error updating balance:', error)
      return this.updateLocalBalance(accountId, newBalance)
    }
  },

  // Local storage fallback methods
  getLocalAccounts() {
    const accounts = localStorage.getItem('advertising_accounts')
    return accounts ? JSON.parse(accounts) : [
      { account_name: '青账户', account_id: 'QING_001', balance: 0 },
      { account_name: '乔账户', account_id: 'QIAO_002', balance: 0 },
      { account_name: '白账户', account_id: 'BAI_003', balance: 0 },
      { account_name: '丁账户', account_id: 'DING_004', balance: 0 },
      { account_name: '妹账户', account_id: 'MEI_005', balance: 0 }
    ]
  },

  createLocalAccount(accountData) {
    const accounts = this.getLocalAccounts()
    const newAccount = {
      ...accountData,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    }
    accounts.push(newAccount)
    localStorage.setItem('advertising_accounts', JSON.stringify(accounts))
    return newAccount
  },

  updateLocalBalance(accountId, balance) {
    const accounts = this.getLocalAccounts()
    const accountIndex = accounts.findIndex(acc => acc.account_id === accountId)
    if (accountIndex !== -1) {
      accounts[accountIndex].balance = balance
      accounts[accountIndex].updated_at = new Date().toISOString()
      localStorage.setItem('advertising_accounts', JSON.stringify(accounts))
      return accounts[accountIndex]
    }
    return null
  }
}

// 广告数据服务
export const adService = {
  // 添加广告数据
  addAdData: async (data) => {
    console.log('尝试添加数据:', data);
    try {
      // 转换字段名称以匹配数据库结构
      const dbData = {
        date: data.date,
        advertiser: data.advertiser,
        account_id: data.account_id || data.account_name || `${data.advertiser}_${Date.now()}`,
        spend_amount: parseFloat(data.ad_spend || 0),
        credit_card_amount: parseFloat(data.credit_card_amount || 0),
        payment_info_count: parseInt(data.payment_info_count || 0),
        credit_card_orders: parseInt(data.credit_card_orders || 0),
        usd_amount: parseFloat(data.ad_spend || 0),
        currency: 'USD'
      };
      
      console.log('转换后的数据库数据:', dbData);
      
      const { data: result, error } = await supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_advertising_data')
        .insert([dbData])
        .select();
      
      if (error) {
        console.error('Supabase 插入错误:', error);
        throw error;
      }
      
      console.log('Supabase 插入成功:', result);
      return result[0];
    } catch (error) {
      console.error('Error adding ad data:', error);
      // 抛出错误而不是fallback，这样前端能看到真实错误
      throw error;
    }
  },

  // 获取所有广告数据
  getAdData: async () => {
    try {
      const { data, error } = await supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_advertising_data')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      // 转换数据字段名称以匹配前端期望
      const transformedData = (data || []).map(record => ({
        id: record.id,
        date: record.date,
        advertiser: record.advertiser,
        account_name: record.account_id,
        account_id: record.account_id,
        ad_spend: record.spend_amount || record.usd_amount || 0,
        credit_card_amount: record.credit_card_amount || 0,
        payment_info_count: record.payment_info_count || 0,
        credit_card_orders: record.credit_card_orders || 0,
        created_at: record.created_at
      }));
      
      return transformedData;
    } catch (error) {
      console.error('Error fetching ad data:', error);
      return advertisingDataService.getLocalAdvertisingData();
    }
  },

  // 获取每日统计数据（按投放人员分组）
  getDailyStatsByAdvertiser: async () => {
    try {
      const { data, error } = await supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_advertising_data')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      // 按日期和投放人员分组统计
      const statsMap = {};
      
      (data || []).forEach(record => {
        const key = `${record.date}_${record.advertiser}`;
        if (!statsMap[key]) {
          statsMap[key] = {
            date: record.date,
            advertiser: record.advertiser,
            ad_spend: 0,
            credit_card_amount: 0,
            payment_info_count: 0,
            credit_card_orders: 0,
            cost_per_payment_info: 0,
            cost_per_order: 0,
            records: [] // 添加原始记录数组
          };
        }
        
        const stat = statsMap[key];
        // 使用数据库中实际的字段名
        stat.ad_spend += parseFloat(record.spend_amount || record.usd_amount || 0);
        stat.credit_card_amount += parseFloat(record.credit_card_amount || 0);
        stat.payment_info_count += parseInt(record.payment_info_count || 0);
        stat.credit_card_orders += parseInt(record.credit_card_orders || 0);
        stat.records.push(record); // 保存原始记录
      });
      
      // 计算单次成本
      Object.values(statsMap).forEach(stat => {
        stat.cost_per_payment_info = stat.payment_info_count > 0 
          ? stat.ad_spend / stat.payment_info_count 
          : 0;
        stat.cost_per_order = stat.credit_card_orders > 0 
          ? stat.ad_spend / stat.credit_card_orders 
          : 0;
      });
      
      return Object.values(statsMap).sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
      console.error('Error fetching daily stats:', error);
      return [];
    }
  },

  // 删除广告数据
  deleteAdData: async (id) => {
    try {
      const { error } = await supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_advertising_data')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      console.log('删除数据成功:', id);
      return true;
    } catch (error) {
      console.error('Error deleting ad data:', error);
      throw error;
    }
  }
};

// Recharge management functions
export const rechargeService = {
  // Add recharge record
  async addRecharge(rechargeData) {
    try {
      console.log('添加充值记录:', rechargeData);
      
      const { data, error } = await supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_recharge_records')
        .insert([rechargeData])
        .select()
      
      if (error) {
        console.error('插入充值记录错误:', error);
        throw error;
      }
      
      console.log('充值记录插入成功:', data);
      return data[0]
    } catch (error) {
      console.error('Error adding recharge:', error)
      throw error; // 抛出错误而不是fallback
    }
  },

  // 获取充值记录
  async getRechargeRecords() {
    try {
      const { data, error } = await supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_recharge_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.log('获取充值记录错误:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.log('Error fetching recharge records:', error);
      return [];
    }
  },

  // 删除充值记录
  async deleteRecharge(rechargeId) {
    try {
      const { error } = await supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_recharge_records')
        .delete()
        .eq('id', rechargeId);
      
      if (error) {
        console.error('删除充值记录错误:', error);
        throw error;
      }
      
      console.log('删除充值记录成功:', rechargeId);
      return true;
    } catch (error) {
      console.error('Error deleting recharge record:', error);
      throw error;
    }
  },

  // Get recharge history
  async getRechargeHistory(accountId = null) {
    try {
      let query = supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_recharge_records')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (accountId) {
        query = query.eq('account_id', accountId)
      }
      
      const { data, error } = await query
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching recharge history:', error)
      return this.getLocalRechargeHistory(accountId)
    }
  },

  // Local storage fallback methods
  addLocalRecharge(rechargeData) {
    const recharges = this.getLocalRechargeHistory()
    const newRecharge = {
      ...rechargeData,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    }
    recharges.unshift(newRecharge)
    localStorage.setItem('recharge_records', JSON.stringify(recharges))
    
    // Update local account balance
    accountService.updateLocalBalance(rechargeData.account_id, rechargeData.new_balance)
    
    return newRecharge
  },

  getLocalRechargeHistory(accountId = null) {
    const recharges = localStorage.getItem('recharge_records')
    const allRecharges = recharges ? JSON.parse(recharges) : []
    
    if (accountId) {
      return allRecharges.filter(r => r.account_id === accountId)
    }
    return allRecharges
  },

  // Get all recharges
  async getRecharges() {
    try {
      const { data, error } = await supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_recharge_records')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recharges:', error);
      return this.getLocalRechargeHistory();
    }
  }
}

// Advertising data functions
export const advertisingDataService = {
  // Add advertising data
  async addAdvertisingData(dataEntry) {
    try {
      const { data, error } = await supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_advertising_data')
        .insert([dataEntry])
        .select()
      
      if (error) throw error
      return data[0]
    } catch (error) {
      console.error('Error adding advertising data:', error)
      return this.addLocalAdvertisingData(dataEntry)
    }
  },

  // Get advertising data
  async getAdvertisingData(filters = {}) {
    try {
      let query = supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_advertising_data')
        .select('*')
        .order('date', { ascending: false })
      
      if (filters.account_id) {
        query = query.eq('account_id', filters.account_id)
      }
      if (filters.advertiser) {
        query = query.eq('advertiser', filters.advertiser)
      }
      if (filters.start_date) {
        query = query.gte('date', filters.start_date)
      }
      if (filters.end_date) {
        query = query.lte('date', filters.end_date)
      }
      
      const { data, error } = await query
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching advertising data:', error)
      return this.getLocalAdvertisingData(filters)
    }
  },

  // Local storage fallback methods
  addLocalAdvertisingData(dataEntry) {
    const existingData = this.getLocalAdvertisingData()
    const newEntry = {
      ...dataEntry,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    existingData.unshift(newEntry)
    localStorage.setItem('advertising_data', JSON.stringify(existingData))
    return newEntry
  },

  getLocalAdvertisingData(filters = {}) {
    const data = localStorage.getItem('advertising_data')
    let allData = data ? JSON.parse(data) : []
    
    // Apply filters
    if (filters.account_id) {
      allData = allData.filter(d => d.account_id === filters.account_id)
    }
    if (filters.advertiser) {
      allData = allData.filter(d => d.advertiser === filters.advertiser)
    }
    if (filters.start_date) {
      allData = allData.filter(d => d.date >= filters.start_date)
    }
    if (filters.end_date) {
      allData = allData.filter(d => d.date <= filters.end_date)
    }
    
    return allData
  }
}

// Daily Orders service for MX$ management
export const dailyOrderService = {
  // Add daily order record
  async addDailyOrder(orderData) {
    try {
      console.log('添加上单记录:', orderData);
      
      // 确保数据格式正确，根据实际表结构调整
      const formattedData = {
        date: orderData.date,
        new_card_amount: parseFloat(orderData.new_card_amount || 0),
        old_card_amount: parseFloat(orderData.old_card_amount || 0),
        exchange_rate: parseFloat(orderData.exchange_rate || 20.0),
        description: orderData.description || '',
        advertiser: 'system', // 添加必需的 advertiser 字段
        created_at: new Date().toISOString()
      };
      
      console.log('格式化后的数据:', formattedData);
      
      const { data, error } = await supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_daily_orders')
        .insert([formattedData])
        .select()
      
      if (error) {
        console.error('插入上单记录错误:', error);
        // 提供更详细的错误信息
        let errorMessage = '数据库插入失败';
        if (error.code === '23502') {
          errorMessage = '缺少必填字段，请检查数据格式';
        } else if (error.code === '23505') {
          errorMessage = '数据重复，请检查是否已经录入过';
        } else {
          errorMessage = `数据库错误: ${error.message}`;
        }
        throw new Error(errorMessage);
      }
      
      console.log('上单记录插入成功:', data);
      return data[0]
    } catch (error) {
      console.error('Error adding daily order:', error)
      throw error;
    }
  },

  // Get daily orders
  async getDailyOrders() {
    try {
      const { data, error } = await supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_daily_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.log('获取上单记录错误:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.log('Error fetching daily orders:', error);
      return [];
    }
  },

  // Delete daily order record
  async deleteDailyOrder(orderId) {
    try {
      const { error } = await supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_daily_orders')
        .delete()
        .eq('id', orderId);
      
      if (error) {
        console.error('删除上单记录错误:', error);
        throw error;
      }
      
      console.log('删除上单记录成功:', orderId);
      return true;
    } catch (error) {
      console.error('Error deleting daily order:', error);
      throw error;
    }
  }
};

// Ad Data Service (unified interface)
export const adDataService = {
  async getAll() {
    try {
      // 使用正确的表名
      const { data, error } = await supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_advertising_data')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('获取广告数据错误:', error);
        throw error;
      }
      
      // 转换数据字段名称以匹配前端期望
      const transformedData = (data || []).map(record => ({
        id: record.id,
        date: record.date,
        staff: record.advertiser, // advertiser -> staff
        ad_spend: parseFloat(record.spend_amount || record.usd_amount || 0),
        credit_card_amount: parseFloat(record.credit_card_amount || 0),
        payment_info_count: parseInt(record.payment_info_count || 0),
        credit_card_orders: parseInt(record.credit_card_orders || 0),
        platform: 'Meta', // 默认平台
        product: '产品推广', // 默认产品
        account: record.account_id,
        created_at: record.created_at
      }));
      
      console.log('获取到广告数据:', transformedData.length, '条');
      return transformedData;
    } catch (error) {
      console.error('adDataService.getAll 错误:', error);
      throw error;
    }
  },

  async add(adData) {
    const { data, error } = await supabase
      .from('app_e87b41cfe355428b8146f8bae8184e10_ad_data')
      .insert([adData])
      .select();
    
    if (error) throw error;
    return data[0];
  }
};

// Daily stats service  
export const dailyStatsService = {
  async getAll() {
    try {
      return await adDataService.getAll(); // 使用统一的数据服务
    } catch (error) {
      console.error('dailyStatsService.getAll 错误:', error);
      throw error;
    }
  },

  async getByDateRange(startDate, endDate) {
    const { data, error } = await supabase
      .from('app_e87b41cfe355428b8146f8bae8184e10_ad_data')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }
};

// Leaderboard service
export const leaderboardService = {
  async getAll() {
    try {
      return await adDataService.getAll(); // 使用统一的数据服务
    } catch (error) {
      console.error('leaderboardService.getAll 错误:', error);
      throw error;
    }
  },

  async getTopPerformers(limit = 10) {
    const { data, error } = await supabase
      .from('app_e87b41cfe355428b8146f8bae8184e10_ad_data')
      .select('*')
      .order('roi', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  }
};

export default {
  accountService,
  rechargeService,
  advertisingDataService,
  dailyOrderService,
  adDataService,
  dailyStatsService,
  leaderboardService
}
// 实时订单服务
const addLiveOrder = async (orderData) => {
  const { data, error } = await supabase
    .from('app_5c098b55fc88465db9b331c43b51ef43_live_orders')
    .insert([orderData])
    .select();
  
  if (error) throw error;
  return data[0];
};

const getLiveOrders = async (resetDate = null) => {
  let query = supabase
    .from('app_5c098b55fc88465db9b331c43b51ef43_live_orders')
    .select('*')
    .order('order_time', { ascending: false });
  
  if (resetDate) {
    query = query.eq('daily_reset_time', resetDate);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

const deleteLiveOrder = async (orderId) => {
  const { error } = await supabase
    .from('app_5c098b55fc88465db9b331c43b51ef43_live_orders')
    .delete()
    .eq('id', orderId);
  
  if (error) throw error;
};

// 获取当前重置日期（基于北京时间下午4点）
const getCurrentResetDate = () => {
  const now = new Date();
  const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  
  const resetHour = 16; // 下午4点
  let resetDate = new Date(beijingTime);
  if (beijingTime.getHours() < resetHour) {
    resetDate.setDate(resetDate.getDate() - 1);
  }
  
  return resetDate.toISOString().split('T')[0];
};

export const liveOrderService = {
  addLiveOrder,
  getLiveOrders,
  deleteLiveOrder,
  getCurrentResetDate
};

// Constants for Meta API
const SUPABASE_URL = supabaseUrl;
const SUPABASE_ANON_KEY = supabaseKey;

// Meta API functions
export const getMetaConfig = async () => {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/app_5c098b55fc88465db9b331c43b51ef43_meta_sync?action=config`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error getting Meta config:', error);
    throw error;
  }
};

export const saveMetaConfig = async (config) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/app_5c098b55fc88465db9b331c43b51ef43_meta_sync?action=config`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error saving Meta config:', error);
    throw error;
  }
};

export const syncMetaAds = async () => {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/app_5c098b55fc88465db9b331c43b51ef43_meta_sync?action=sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error syncing Meta ads:', error);
    throw error;
  }
};

export const getMetaAdsData = async (dateRange = 30) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateRange);

    const { data, error } = await supabase
      .from('app_5c098b55fc88465db9b331c43b51ef43_meta_ads')
      .select('*')
      .gte('date_start', startDate.toISOString().split('T')[0])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting Meta ads data:', error);
    throw error;
  }
};
// Daily Contest functions
export const dailyContestService = {
  // Get anonymous session ID
  getSessionId: () => {
    let sessionId = localStorage.getItem('contest_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('contest_session_id', sessionId);
    }
    return sessionId;
  },

  // Upload contest image
  async uploadImage(file) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('contest_images')
        .upload(filePath, file);

      if (error) throw error;

      const { data: publicUrl } = supabase.storage
        .from('contest_images')
        .getPublicUrl(filePath);

      return publicUrl.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  // Create contest entry
  async createEntry(entryData) {
    try {
      const contestDate = new Date().toISOString().split('T')[0];
      const formattedData = {
        title: entryData.title || '',
        description: entryData.description || '',
        image_url: entryData.image_url,
        anonymous_name: entryData.anonymous_name,
        contest_date: contestDate,
        likes_count: 0,
        comments_count: 0,
        created_at: new Date().toISOString()
      };
      
      console.log('Creating contest entry:', formattedData);
      
      const { data, error } = await supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_daily_contest')
        .insert([formattedData])
        .select()
        .single();

      if (error) {
        console.error('Contest entry creation error:', error);
        throw new Error(`比赛作品提交失败: ${error.message}`);
      }
      
      console.log('Contest entry created successfully:', data);
      return data;
    } catch (error) {
      console.error('Error creating contest entry:', error);
      throw error;
    }
  },

  // Get contest entries
  async getEntries(date = null) {
    try {
      let query = supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_daily_contest')
        .select('*')
        .order('likes_count', { ascending: false })
        .order('created_at', { ascending: false });

      if (date) {
        query = query.eq('contest_date', date);
      } else {
        // Get today's entries by default
        const today = new Date().toISOString().split('T')[0];
        query = query.eq('contest_date', today);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting contest entries:', error);
      throw error;
    }
  },

  // Get featured entry (most liked today)
  async getFeaturedEntry() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_daily_contest')
        .select('*')
        .eq('contest_date', today)
        .order('likes_count', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error getting featured entry:', error);
      return null;
    }
  },

  // Toggle like
  async toggleLike(entryId) {
    try {
      const sessionId = this.getSessionId();
      
      // Check if already liked
      const { data: existingLike, error: checkError } = await supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_contest_likes')
        .select('id')
        .eq('contest_entry_id', entryId)
        .eq('user_session', sessionId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (existingLike) {
        // Remove like
        const { error: deleteError } = await supabase
          .from('app_5c098b55fc88465db9b331c43b51ef43_contest_likes')
          .delete()
          .eq('id', existingLike.id);

        if (deleteError) throw deleteError;

        // Decrease likes count
        await supabase.rpc('decrement_likes', { entry_id: entryId });

        return { liked: false };
      } else {
        // Add like
        const { error: insertError } = await supabase
          .from('app_5c098b55fc88465db9b331c43b51ef43_contest_likes')
          .insert([{
            contest_entry_id: entryId,
            user_session: sessionId
          }]);

        if (insertError) throw insertError;

        // Increase likes count
        await supabase.rpc('increment_likes', { entry_id: entryId });

        return { liked: true };
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  },

  // Get user's likes
  async getUserLikes() {
    try {
      const sessionId = this.getSessionId();
      const { data, error } = await supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_contest_likes')
        .select('contest_entry_id')
        .eq('user_session', sessionId);

      if (error) throw error;
      return (data || []).map(item => item.contest_entry_id);
    } catch (error) {
      console.error('Error getting user likes:', error);
      return [];
    }
  },

  // Add comment
  async addComment(entryId, commentText, anonymousName) {
    try {
      const sessionId = this.getSessionId();
      const { data, error } = await supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_contest_comments')
        .insert([{
          contest_entry_id: entryId,
          comment_text: commentText,
          anonymous_name: anonymousName,
          user_session: sessionId
        }])
        .select()
        .single();

      if (error) throw error;

      // Increase comments count
      await supabase.rpc('increment_comments', { entry_id: entryId });

      return data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  // Get comments for entry
  async getComments(entryId) {
    try {
      const { data, error } = await supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_contest_comments')
        .select('*')
        .eq('contest_entry_id', entryId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
    }
  }
};
