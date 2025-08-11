import { supabase } from '../data/supabaseService.js';

// Account Request Management Service
export const supabaseService = {
  // Get all account requests
  async getAccountRequests() {
    console.log('Fetching account requests...');
    
    try {
      const { data, error } = await supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_account_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching account requests:', error);
        throw error;
      }

      console.log('Account requests fetched:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Error in getAccountRequests:', error);
      throw error;
    }
  },

  // Create new account request
  async createAccountRequest(requestData) {
    console.log('Creating account request:', requestData);
    
    try {
      const { data, error } = await supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_account_requests')
        .insert([{
          person_name: requestData.person_name,
          business_name: requestData.business_name,
          contact_info: requestData.contact_info,
          request_reason: requestData.request_reason,
          status: 'pending',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating account request:', error);
        throw error;
      }

      console.log('Account request created:', data);
      return data;
    } catch (error) {
      console.error('Error in createAccountRequest:', error);
      throw error;
    }
  },

  // Update account request status
  async updateAccountRequest(id, updates) {
    console.log('Updating account request:', { id, updates });
    
    try {
      const { data, error } = await supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_account_requests')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(); // Add select() to return updated data

      if (error) {
        console.error('Error updating account request:', error);
        throw error;
      }

      console.log('Account request updated:', data);
      return data;
    } catch (error) {
      console.error('Error in updateAccountRequest:', error);
      throw error;
    }
  },

  // Delete account request
  async deleteAccountRequest(id) {
    console.log('Deleting account request:', id);
    
    try {
      const { data, error } = await supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_account_requests')
        .delete()
        .eq('id', id)
        .select(); // Add select() to return deleted data

      if (error) {
        console.error('Error deleting account request:', error);
        throw error;
      }

      console.log('Account request deleted:', data);
      return data;
    } catch (error) {
      console.error('Error in deleteAccountRequest:', error);
      throw error;
    }
  },

  // Approve account request
  async approveAccountRequest(id, approverNotes = '') {
    console.log('Approving account request:', id);
    
    try {
      const { data, error } = await supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_account_requests')
        .update({
          status: 'approved',
          approver_notes: approverNotes,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (error) {
        console.error('Error approving account request:', error);
        throw error;
      }

      console.log('Account request approved:', data);
      return data;
    } catch (error) {
      console.error('Error in approveAccountRequest:', error);
      throw error;
    }
  }
};

export default supabaseService;