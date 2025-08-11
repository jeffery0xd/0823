import { supabase } from './supabaseService.js';

// Account Reset Service
export const accountResetService = {
  // 获取所有清零申请
  async getAllRequests() {
    try {
      const { data, error } = await supabase
        .from('app_e87b41cfe355428b8146f8bae8184e10_account_reset')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase error fetching reset requests:', error);
        throw new Error(`获取清零申请失败: ${error.message}`);
      }
      return data || [];
    } catch (error) {
      console.error('Error in getAllRequests:', error);
      throw error;
    }
  },

  // 获取待处理申请
  async getPendingRequests() {
    try {
      const { data, error } = await supabase
        .from('app_e87b41cfe355428b8146f8bae8184e10_account_reset')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('获取待处理清零申请失败:', error);
      throw error;
    }
  },

  // 创建新的清零申请
  async createRequest(requestData) {
    try {
      console.log('Creating reset request:', requestData);
      
      // Upload screenshot to Supabase Storage
      let screenshotUrl = null;
      if (requestData.screenshot) {
        const fileExt = requestData.screenshot.name.split('.').pop().toLowerCase();
        const timestamp = Date.now();
        
        // Create a safe filename by encoding Chinese characters
        const advertiserMap = {
          '青': 'qing',
          '乔': 'qiao',  
          '白': 'bai',
          '丁': 'ding',
          '妹': 'mei'
        };
        
        const safeAdvertiser = advertiserMap[requestData.advertiser] || requestData.advertiser;
        const fileName = `${timestamp}_${safeAdvertiser}_balance.${fileExt}`;
        
        console.log('Uploading file:', fileName);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('account-reset-screenshots')
          .upload(fileName, requestData.screenshot, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Screenshot upload error:', uploadError);
          throw new Error(`截图上传失败: ${uploadError.message}`);
        }

        console.log('Upload successful:', uploadData);

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('account-reset-screenshots')
          .getPublicUrl(fileName);

        screenshotUrl = urlData.publicUrl;
      }

      // Insert request record
      const { data, error } = await supabase
        .from('app_e87b41cfe355428b8146f8bae8184e10_account_reset')
        .insert([{
          advertiser: requestData.advertiser,
          account_name: requestData.accountName,
          account_id: requestData.accountId,
          balance: parseFloat(requestData.balance),
          screenshot_url: screenshotUrl,
          status: 'pending',
          created_at: new Date().toISOString()
        }])
        .select();
      
      if (error) {
        console.error('Supabase error creating reset request:', error);
        throw new Error(`创建清零申请失败: ${error.message}`);
      }
      
      console.log('Reset request created successfully:', data[0]);
      return data[0];
    } catch (error) {
      console.error('Error in createRequest:', error);
      throw error;
    }
  },

  // 更新申请状态
  async updateRequest(requestId, updates) {
    try {
      console.log('Updating reset request:', requestId, 'with updates:', updates);
      
      const { data, error } = await supabase
        .from('app_e87b41cfe355428b8146f8bae8184e10_account_reset')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select();
      
      if (error) {
        console.error('Supabase error updating reset request:', error);
        throw new Error(`更新清零申请失败: ${error.message}`);
      }
      
      console.log('Update result:', data);
      
      // Check if any records were actually updated
      if (!data || data.length === 0) {
        console.warn('No records were updated');
        throw new Error('未找到要更新的记录');
      }
      
      console.log('清零申请更新成功:', requestId);
      return data[0];
    } catch (error) {
      console.error('Error in updateRequest:', error);
      throw error;
    }
  },

  // 处理申请（批准/拒绝）
  async processRequest(requestId, action, adminNotes = '') {
    try {
      const updates = {
        status: action,
        processed_at: new Date().toISOString(),
        processed_by: 'Admin',
        admin_notes: adminNotes
      };

      console.log('Processing reset request:', requestId, 'with action:', action);
      return await this.updateRequest(requestId, updates);
    } catch (error) {
      console.error('Error in processRequest:', error);
      throw error;
    }
  },

  // 搜索申请（按投放人员和状态）
  async searchRequests(searchTerm, status = null) {
    try {
      let query = supabase
        .from('app_e87b41cfe355428b8146f8bae8184e10_account_reset')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('advertiser', `%${searchTerm}%`);
      }

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('搜索清零申请失败:', error);
      throw error;
    }
  },

  // 按日期范围查询申请
  async getRequestsByDateRange(startDate, endDate, status = null) {
    try {
      let query = supabase
        .from('app_e87b41cfe355428b8146f8bae8184e10_account_reset')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('按日期查询清零申请失败:', error);
      throw error;
    }
  },

  // 删除申请
  async deleteRequest(requestId) {
    try {
      console.log('Deleting reset request with ID:', requestId);
      
      const { data, error } = await supabase
        .from('app_e87b41cfe355428b8146f8bae8184e10_account_reset')
        .delete()
        .eq('id', requestId)
        .select(); // Add select() to return deleted data
      
      if (error) {
        console.error('Supabase error deleting reset request:', error);
        throw new Error(`删除清零申请失败: ${error.message}`);
      }
      
      console.log('Delete result:', data);
      
      // Check if any records were actually deleted
      if (!data || data.length === 0) {
        console.warn('No records were deleted');
        throw new Error('未找到要删除的记录');
      }
      
      console.log('清零申请删除成功:', requestId);
      return true;
    } catch (error) {
      console.error('Error in deleteRequest:', error);
      throw error;
    }
  },

  // 批准清零申请
  async approveRequest(requestId, adminNotes = '') {
    try {
      return await this.processRequest(requestId, 'approved', adminNotes);
    } catch (error) {
      console.error('Error approving reset request:', error);
      throw error;
    }
  },

  // 拒绝清零申请
  async rejectRequest(requestId, adminNotes = '') {
    try {
      return await this.processRequest(requestId, 'rejected', adminNotes);
    } catch (error) {
      console.error('Error rejecting reset request:', error);
      throw error;
    }
  },

  // 账户管理功能
  async getAllAccounts() {
    try {
      const { data, error } = await supabase
        .from('app_e87b41cfe355428b8146f8bae8184e10_ad_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching accounts:', error);
        throw new Error(`获取账户列表失败: ${error.message}`);
      }
      return data || [];
    } catch (error) {
      console.error('Error in getAllAccounts:', error);
      throw error;
    }
  },

  async createAccount(accountData) {
    try {
      const { data, error } = await supabase
        .from('app_e87b41cfe355428b8146f8bae8184e10_ad_accounts')
        .insert([{
          account_name: accountData.accountName,
          account_id: accountData.accountId,
          advertiser: accountData.advertiser
        }])
        .select();

      if (error) {
        console.error('Supabase error creating account:', error);
        throw new Error(`创建账户失败: ${error.message}`);
      }
      return data[0];
    } catch (error) {
      console.error('Error in createAccount:', error);
      throw error;
    }
  },

  async deleteAccount(accountId) {
    try {
      const { error } = await supabase
        .from('app_e87b41cfe355428b8146f8bae8184e10_ad_accounts')
        .delete()
        .eq('id', accountId);

      if (error) {
        console.error('Supabase error deleting account:', error);
        throw new Error(`删除账户失败: ${error.message}`);
      }
      return true;
    } catch (error) {
      console.error('Error in deleteAccount:', error);
      throw error;
    }
  }
};

export default accountResetService;