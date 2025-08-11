import { supabase } from './supabaseService.js';

// Account Requests Service
export const accountRequestsService = {
  // 获取所有申请
  async getAllRequests() {
    const { data, error } = await supabase
      .from('app_e87b41cfe355428b8146f8bae8184e10_account_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error fetching requests:', error);
      throw new Error(`获取申请数据失败: ${error.message}`);
    }
    return data || [];
  },

  // 获取待处理申请记录
  async getPendingRequests() {
    try {
      const { data, error } = await supabase
        .from('app_e87b41cfe355428b8146f8bae8184e10_account_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('获取待处理申请记录失败:', error);
      throw error;
    }
  },

  // 创建新申请
  async createRequest(requestData) {
    const { data, error } = await supabase
      .from('app_e87b41cfe355428b8146f8bae8184e10_account_requests')
      .insert([{
        user_name: requestData.requester,
        request_type: requestData.type,
        reason: requestData.reason,
        urgency: requestData.urgency,
        email: requestData.email,
        profile_link: requestData.profileLink,
        status: 'pending',
        created_at: new Date().toISOString()
      }])
      .select();
    
    if (error) {
      console.error('Supabase error creating request:', error);
      throw new Error(`创建申请失败: ${error.message}`);
    }
    return data?.[0];
  },

  // 更新申请状态
  async updateRequest(requestId, updates) {
    console.log('Updating request:', requestId, 'with updates:', updates);
    
    const { data, error } = await supabase
      .from('app_e87b41cfe355428b8146f8bae8184e10_account_requests')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select();
    
    if (error) {
      console.error('Supabase error updating request:', error);
      throw new Error(`更新申请失败: ${error.message}`);
    }
    
    console.log('Update result:', data);
    
    // Check if any records were actually updated
    if (!data || data.length === 0) {
      console.warn('No records were updated');
      throw new Error('未找到要更新的记录');
    }
    
    console.log('申请更新成功:', requestId);
    return data?.[0];
  },

  // 处理申请（批准/拒绝）
  async processRequest(requestId, action, accountInfo = null) {
    const updates = {
      status: action,
      processed_at: new Date().toISOString(),
      processed_by: 'Admin',
      account_info: action === 'approved' ? { details: accountInfo } : null
    };

    console.log('Processing request:', requestId, 'with action:', action, 'and updates:', updates);
    return await this.updateRequest(requestId, updates);
  },

  // 删除申请
  async deleteRequest(requestId) {
    console.log('Deleting request with ID:', requestId);
    
    const { data, error } = await supabase
      .from('app_e87b41cfe355428b8146f8bae8184e10_account_requests')
      .delete()
      .eq('id', requestId)
      .select(); // Add select() to return deleted data
    
    if (error) {
      console.error('Supabase error deleting request:', error);
      throw new Error(`删除申请失败: ${error.message}`);
    }
    
    console.log('Delete result:', data);
    
    // Check if any records were actually deleted
    if (!data || data.length === 0) {
      console.warn('No records were deleted');
      throw new Error('未找到要删除的记录');
    }
    
    console.log('申请删除成功:', requestId);
    return true;
  },

  // 申请清零
  async requestReset(requestId, resetData) {
    const updates = {
      reset_requested: true,
      reset_request_time: new Date().toISOString(),
      reset_status: 'pending',
      reset_info: {
        remainingBalance: resetData.balance,
        screenshot: resetData.screenshot,
        screenshotName: 'balance_screenshot.jpg'
      }
    };

    return await this.updateRequest(requestId, updates);
  },

  // 处理清零申请
  async processReset(requestId, action) {
    const updates = {
      reset_requested: false,
      reset_status: action === 'approved' ? 'completed' : 'rejected',
      account_status: action === 'approved' ? 'reset_completed' : 'reset_rejected'
    };

    if (action === 'approved') {
      updates.reset_completed_time = new Date().toISOString();
    } else {
      updates.reset_rejected_time = new Date().toISOString();
    }

    return await this.updateRequest(requestId, updates);
  },


};

// Dashboard Data Service
export const dashboardService = {
  // 获取仪表板数据
  async getDashboardData() {
    const { data, error } = await supabase
      .from('dashboard_data')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Supabase error fetching dashboard data:', error);
      throw new Error(`获取仪表板数据失败: ${error.message}`);
    }
    
    // 如果没有数据，创建并返回默认数据
    if (!data || data.length === 0) {
      const defaultData = this.getDefaultDashboardData();
      await this.updateDashboardData(defaultData);
      return defaultData;
    }
    
    return data[0].data;
  },

  // 更新仪表板数据
  async updateDashboardData(newData) {
    // 先尝试获取现有数据
    const { data: existingData } = await supabase
      .from('dashboard_data')
      .select('*')
      .limit(1);

    if (existingData && existingData.length > 0) {
      // 更新现有数据
      const { data, error } = await supabase
        .from('dashboard_data')
        .update({
          data: newData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingData[0].id)
        .select();
      
      if (error) {
        console.error('Supabase error updating dashboard data:', error);
        throw new Error(`更新仪表板数据失败: ${error.message}`);
      }
      return data?.[0]?.data;
    } else {
      // 创建新数据
      const { data, error } = await supabase
        .from('dashboard_data')
        .insert([{
          data: newData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();
      
      if (error) {
        console.error('Supabase error creating dashboard data:', error);
        throw new Error(`创建仪表板数据失败: ${error.message}`);
      }
      return data?.[0]?.data;
    }
  },

  // 默认仪表板数据
  getDefaultDashboardData() {
    return {
      totalRevenue: 2847592,
      totalCost: 1523847,
      accountsActive: 15,
      conversionRate: 3.24,
      recentTransactions: [
        { id: 1, advertiser: '青', amount: 15420, type: 'revenue', timestamp: new Date().toISOString() },
        { id: 2, advertiser: '乔', amount: -8200, type: 'cost', timestamp: new Date().toISOString() },
        { id: 3, advertiser: '白', amount: 23100, type: 'revenue', timestamp: new Date().toISOString() },
        { id: 4, advertiser: '丁', amount: -5680, type: 'cost', timestamp: new Date().toISOString() },
        { id: 5, advertiser: '妹', amount: 18900, type: 'revenue', timestamp: new Date().toISOString() }
      ],
      melonWinners: [
        { id: 1, advertiser: '青', revenue: 345200, roi: 4.2 },
        { id: 2, advertiser: '白', revenue: 289400, roi: 3.8 },
        { id: 3, advertiser: '乔', revenue: 267800, roi: 3.6 }
      ]
    };
  }
};