import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pfkqocxbvnfebuhrjnxm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBma3FvY3hidm5mZWJ1aHJqbnhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0OTMwNjksImV4cCI6MjA2ODA2OTA2OX0.B-IoA9SkLH8tmj9xXObklN9PmDj1jnj9B9lpChDDgMM';

export const supabase = createClient(supabaseUrl, supabaseKey);

// App-specific table names
const APP_ID = 'e87b41cfe355428b8146f8bae8184e10';
export const TABLES = {
  AD_DATA_ENTRIES: `app_${APP_ID}_ad_data_entries`,
  PRODUCTS: `app_${APP_ID}_products`,
  GENERATED_IMAGES: `app_${APP_ID}_generated_images`
};

// Helper functions for common operations
export const adDataService = {
  // Get all ad data entries
  async getAll() {
    const { data, error } = await supabase
      .from(TABLES.AD_DATA_ENTRIES)
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Insert or update ad data entry
  async upsert(entry) {
    // 正确的字段映射：
    // 当日广告花费金额 (美元) -> ad_spend
    // 当日信用卡订单金额 (MX$) -> credit_card_amount (信用卡收款金额)
    // 当日添加支付信息数量 -> payment_info_count
    // 当日订单数量 -> credit_card_orders (信用卡订单数量)
    
    const entryData = {
      date: entry.date,
      staff: entry.staff,
      ad_spend: entry.adSpend,                    // 广告花费 (美元)
      credit_card_amount: entry.creditCardOrders, // 信用卡收款金额 (MX$)
      payment_info_count: entry.paymentInfoCount, // 支付信息数量
      credit_card_orders: entry.orderCount,       // 信用卡订单数量
      updated_at: new Date().toISOString()
    };

    let data, error;
    
    if (entry.id) {
      // 更新现有记录
      ({ data, error } = await supabase
        .from(TABLES.AD_DATA_ENTRIES)
        .update(entryData)
        .eq('id', entry.id)
        .select());
    } else {
      // 插入新记录
      ({ data, error } = await supabase
        .from(TABLES.AD_DATA_ENTRIES)
        .upsert(entryData, { 
          onConflict: 'date,staff',
          ignoreDuplicates: false 
        })
        .select());
    }
    
    if (error) throw error;
    return data[0];
  },

  // Delete ad data entry
  async delete(id) {
    const { error } = await supabase
      .from(TABLES.AD_DATA_ENTRIES)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

export const productsService = {
  // Clear all products
  async clearAll() {
    const { error } = await supabase
      .from(TABLES.PRODUCTS)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (error) throw error;
  },

  // Insert multiple products
  async insertMany(products) {
    const productsData = products.map(product => ({
      spu: product.spu,
      price: product.price,
      images: product.images || [],
      links: product.links || []
    }));

    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .insert(productsData)
      .select();
    
    if (error) throw error;
    return data;
  },

  // Get all products
  async getAll() {
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  }
};

export const generatedImagesService = {
  // Save generated image
  async save(imageData) {
    const { data, error } = await supabase
      .from(TABLES.GENERATED_IMAGES)
      .insert({
        filename: imageData.filename,
        image_data: imageData.url,
        image_type: imageData.type,
        products_used: imageData.products || []
      })
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Get all generated images
  async getAll() {
    const { data, error } = await supabase
      .from(TABLES.GENERATED_IMAGES)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Delete all generated images
  async clearAll() {
    const { error } = await supabase
      .from(TABLES.GENERATED_IMAGES)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (error) throw error;
  }
};