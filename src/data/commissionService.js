import { supabase, adDataService } from '../utils/supabase';

// 提成服务
export const commissionService = {
  // 获取数据最后更新时间
  async getDataLastUpdateTime(date = '2025-08-10') {
    try {
      const allData = await adDataService.getAll();
      const todayData = allData.filter(record => 
        record.date === date && ['乔', '白', '妹'].includes(record.staff)
      );
      
      if (todayData.length === 0) {
        return null;
      }
      
      // 找到最新的更新时间
      const latestUpdate = todayData.reduce((latest, record) => {
        const recordTime = new Date(record.updated_at);
        return recordTime > latest ? recordTime : latest;
      }, new Date(todayData[0].updated_at));
      
      return {
        lastUpdate: latestUpdate.toISOString(),
        lastUpdateFormatted: latestUpdate.toLocaleString('zh-CN'),
        recordCount: todayData.length,
        employees: todayData.map(r => r.staff)
      };
    } catch (error) {
      console.error('获取数据更新时间错误:', error);
      return null;
    }
  },

  // 检查数据是否有更新
  async checkDataUpdate(date = '2025-08-10', lastCheckTime = null) {
    try {
      const updateInfo = await this.getDataLastUpdateTime(date);
      if (!updateInfo || !lastCheckTime) {
        return { hasUpdate: true, updateInfo };
      }
      
      const lastUpdate = new Date(updateInfo.lastUpdate);
      const lastCheck = new Date(lastCheckTime);
      
      return {
        hasUpdate: lastUpdate > lastCheck,
        updateInfo,
        timeDiff: lastUpdate - lastCheck
      };
    } catch (error) {
      console.error('检查数据更新错误:', error);
      return { hasUpdate: false, updateInfo: null };
    }
  },

  // 计算指定日期的提成
  async calculateCommission(date, advertiser = null) {
    try {
      console.log('开始计算提成:', { date, advertiser });
      
      const { data, error } = await supabase.functions.invoke('commission-calculator', {
        body: { date, advertiser }
      });
      
      if (error) {
        console.error('提成计算错误:', error);
        throw error;
      }
      
      console.log('提成计算成功:', data);
      return data.data;
    } catch (error) {
      console.error('提成计算服务错误:', error);
      throw error;
    }
  },

  // 获取提成记录
  async getCommissionRecords(filters = {}) {
    try {
      console.log('查询提成记录，过滤条件:', filters);
      
      let query = supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_commission_records')
        .select('*')
        .order('date', { ascending: false });
      
      // 只查询三位员工的数据
      query = query.in('advertiser', ['乔', '白', '妹']);
      
      if (filters.date) {
        console.log('按日期过滤:', filters.date);
        query = query.eq('date', filters.date);
      }
      
      if (filters.advertiser) {
        query = query.eq('advertiser', filters.advertiser);
      }
      
      if (filters.startDate) {
        query = query.gte('date', filters.startDate);
      }
      
      if (filters.endDate) {
        query = query.lte('date', filters.endDate);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('获取提成记录错误:', error);
        throw error;
      }
      
      console.log('查询到的提成记录:', data);
      return data || [];
    } catch (error) {
      console.error('提成记录服务错误:', error);
      throw error;
    }
  },

  // 获取当日提成数据（增强版，包含数据更新信息）
  async getTodayCommission() {
    // 使用固定的今天日期，防止时区问题
    const today = '2025-08-10';
    console.log('获取今天的提成数据，日期:', today);
    
    // 获取数据更新信息
    const updateInfo = await this.getDataLastUpdateTime(today);
    
    try {
      // 直接查询提成记录表
      const result = await this.getCommissionRecords({ date: today });
      console.log('今天的提成数据结果:', result);
      
      // 确保返回数据有三位员工的完整信息
      const employees = ['乔', '白', '妹'];
      const completeResult = employees.map(emp => {
        const record = result.find(r => r.advertiser === emp);
        return record || {
          advertiser: emp,
          date: today,
          order_count: 0,
          roi: 0,
          commission_per_order: 0,
          total_commission: 0,
          commission_status: 'no_data'
        };
      });
      
      console.log('完整的当日提成数据:', completeResult);
      
      // 返回数据和更新信息
      return {
        data: completeResult,
        updateInfo: updateInfo
      };
    } catch (error) {
      console.error('获取当日提成数据失败:', error);
      return {
        data: [],
        updateInfo: null
      };
    }
  },

  // 获取本月提成汇总
  async getMonthlyCommissionSummary(year, month) {
    try {
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
      
      const records = await this.getCommissionRecords({ 
        startDate, 
        endDate 
      });
      
      // 按员工分组汇总
      const summary = {};
      const targetEmployees = ['乔', '白', '妹'];
      
      // 初始化每个员工的数据
      targetEmployees.forEach(emp => {
        summary[emp] = {
          advertiser: emp,
          totalCommission: 0,
          totalOrders: 0,
          workingDays: 0,
          avgROI: 0,
          records: []
        };
      });
      
      records.forEach(record => {
        if (targetEmployees.includes(record.advertiser)) {
          summary[record.advertiser].totalCommission += parseFloat(record.total_commission || 0);
          summary[record.advertiser].totalOrders += parseInt(record.order_count || 0);
          summary[record.advertiser].workingDays += 1;
          summary[record.advertiser].records.push(record);
        }
      });
      
      // 计算平均ROI
      Object.keys(summary).forEach(emp => {
        if (summary[emp].records.length > 0) {
          const totalROI = summary[emp].records.reduce((sum, record) => sum + parseFloat(record.roi || 0), 0);
          summary[emp].avgROI = totalROI / summary[emp].records.length;
        }
      });
      
      return Object.values(summary);
    } catch (error) {
      console.error('获取月度提成汇总错误:', error);
      throw error;
    }
  },

  // 获取指定月份提成数据
  async getCurrentMonthCommission(monthString = '2025-08') {
    // monthString格式: '2025-08' 或 '2025-07'
    console.log('获取指定月份提成数据:', monthString);
    try {
      const [year, month] = monthString.split('-').map(Number);
      const result = await this.getMonthlyCommissionSummary(year, month);
      console.log('月份提成数据结果:', result);
      
      // 添加数据范围检查
      const dataRange = await this.getDataDateRange(monthString);
      console.log('数据范围:', dataRange);
      
      return result;
    } catch (error) {
      console.error('获取月度数据错误:', error);
      return [];
    }
  },

  // 获取数据日期范围
  async getDataDateRange(monthString = '2025-08') {
    try {
      console.log('获取数据范围，月份:', monthString);
      
      // 构建月份日期范围
      const [year, month] = monthString.split('-').map(Number);
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
      
      const { data, error } = await supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_commission_records')
        .select('date')
        .in('advertiser', ['乔', '白', '妹'])
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        return {
          startDate: data[0].date,
          endDate: data[data.length - 1].date,
          totalDays: new Set(data.map(item => item.date)).size // 去重后的天数
        };
      }
      
      return { startDate: null, endDate: null, totalDays: 0 };
    } catch (error) {
      console.error('获取数据范围错误:', error);
      return { startDate: null, endDate: null, totalDays: 0 };
    }
  },

  // 获取可用的日期列表
  async getAvailableDates(monthString = '2025-08') {
    try {
      console.log('获取可用日期，月份:', monthString);
      
      // 构建月份日期范围
      const [year, month] = monthString.split('-').map(Number);
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
      
      const { data, error } = await supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_commission_records')
        .select('date')
        .in('advertiser', ['乔', '白', '妹'])
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      // 去重并返回日期列表
      const uniqueDates = [...new Set(data.map(item => item.date))].sort((a, b) => new Date(b) - new Date(a));
      return uniqueDates;
    } catch (error) {
      console.error('获取可用日期错误:', error);
      return [];
    }
  },

  // 验证日期是否有数据
  async validateDateHasData(date) {
    try {
      const { data, error } = await supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_commission_records')
        .select('id')
        .eq('date', date)
        .in('advertiser', ['乔', '白', '妹']);
      
      if (error) throw error;
      
      return {
        hasData: data && data.length > 0,
        recordCount: data ? data.length : 0
      };
    } catch (error) {
      console.error('验证日期数据错误:', error);
      return { hasData: false, recordCount: 0 };
    }
  },

  // 获取广告数据用于实时计算（从真实数据表）
  async getAdDataForCommission(date, advertiser = null) {
    try {
      const allData = await adDataService.getAll();
      
      // 筛选指定日期和员工的数据
      let filteredData = allData.filter(record => {
        const recordDate = record.date;
        const staffName = record.staff;
        
        // 只查询三位员工的数据
        const targetEmployees = ['乔', '白', '妹'];
        if (!targetEmployees.includes(staffName)) {
          return false;
        }
        
        // 日期筛选
        if (recordDate !== date) {
          return false;
        }
        
        // 员工筛选（如果指定了）
        if (advertiser && staffName !== advertiser) {
          return false;
        }
        
        return true;
      });
      
      // 转换数据格式，匹配原有字段名
      const convertedData = filteredData.map(record => {
        const exchangeRate = 20.0; // 1 USD = 20 MX$
        const creditCardUSD = parseFloat(record.credit_card_amount || 0) / exchangeRate;
        const adSpend = parseFloat(record.ad_spend || 0);
        const roi = adSpend > 0 ? (creditCardUSD / adSpend) : 0;
        
        return {
          advertiser: record.staff, // staff 映射到 advertiser
          date: record.date,
          spend_amount: record.ad_spend, // 广告花费
          credit_card_amount: creditCardUSD, // 转换为USD的收款金额
          credit_card_orders: record.credit_card_orders, // 订单数量
          roi: roi,
          // 保留原始数据
          _raw: record
        };
      });
      
      console.log(`获取到${date}的真实广告数据:`, convertedData);
      return convertedData;
    } catch (error) {
      console.error('获取真实广告数据错误:', error);
      throw error;
    }
  },

  // 实时计算提成（不保存到数据库）
  calculateCommissionRealtime(adData) {
    const groupedData = {};
    
    // 按投放人员分组
    adData.forEach(record => {
      const advertiser = record.advertiser;
      if (!groupedData[advertiser]) {
        groupedData[advertiser] = {
          advertiser,
          totalSpend: 0,
          totalRevenue: 0,
          totalOrders: 0
        };
      }
      
      groupedData[advertiser].totalSpend += parseFloat(record.spend_amount || 0);
      groupedData[advertiser].totalRevenue += parseFloat(record.credit_card_amount || 0);
      groupedData[advertiser].totalOrders += parseInt(record.credit_card_orders || 0);
    });
    
    // 计算每个员工的提成
    const commissionData = [];
    
    Object.values(groupedData).forEach(data => {
      const roi = data.totalSpend > 0 ? data.totalRevenue / data.totalSpend : 0;
      
      let commissionPerOrder = 0;
      let commissionStatus = 'calculated';
      let statusText = '';
      
      if (roi >= 1.0) {
        commissionPerOrder = 7;
        statusText = '高效投放';
      } else if (roi >= 0.8) {
        commissionPerOrder = 5;
        statusText = '合格投放';
      } else {
        commissionPerOrder = 0;
        commissionStatus = 'no_commission';
        statusText = '跑了个锤子';
      }
      
      const totalCommission = data.totalOrders * commissionPerOrder;
      
      commissionData.push({
        advertiser: data.advertiser,
        orderCount: data.totalOrders,
        roi: Math.round(roi * 10000) / 10000,
        commissionPerOrder,
        totalCommission,
        commissionStatus,
        statusText
      });
    });
    
    return commissionData;
  }
};

export default commissionService;

// 数据验证和同步功能
export const dataValidationService = {
  // 验证数据一致性（使用真实数据）
  async validateDataConsistency() {
    try {
      console.log('开始数据一致性验证(使用真实数据)...');
      
      // 获取真实广告数据
      const adData = await commissionService.getAdDataForCommission('2025-08-10');
      console.log('真实广告数据:', adData);
      
      // 获取提成数据
      const commissionData = await commissionService.getCommissionRecords({ date: '2025-08-10' });
      console.log('提成数据:', commissionData);
      
      // 检查数据一致性
      const inconsistencies = [];
      const employees = ['乔', '白', '妹'];
      
      employees.forEach(emp => {
        const adRecord = adData.find(r => r.advertiser === emp);
        const commRecord = commissionData.find(r => r.advertiser === emp);
        
        if (adRecord && commRecord) {
          // 检查订单数量一致性
          if (adRecord.credit_card_orders !== commRecord.order_count) {
            inconsistencies.push({
              employee: emp,
              adOrders: adRecord.credit_card_orders,
              commissionOrders: commRecord.order_count,
              issue: '订单数量不一致'
            });
          }
          
          // 检查ROI计算是否正确
          const expectedROI = adRecord.roi;
          const actualROI = parseFloat(commRecord.roi || 0);
          const roiDiff = Math.abs(expectedROI - actualROI);
          if (roiDiff > 0.01) { // 允许小数点误差
            inconsistencies.push({
              employee: emp,
              expectedROI: expectedROI.toFixed(3),
              actualROI: actualROI.toFixed(3),
              issue: 'ROI计算不准确'
            });
          }
        } else if (!adRecord) {
          inconsistencies.push({
            employee: emp,
            issue: '缺少真实广告数据'
          });
        } else if (!commRecord) {
          inconsistencies.push({
            employee: emp,
            issue: '缺少提成数据'
          });
        }
      });
      
      // 返回更详细的验证结果
      return {
        isConsistent: inconsistencies.length === 0,
        inconsistencies,
        adData: adData.map(record => ({
          advertiser: record.advertiser,
          credit_card_orders: record.credit_card_orders,
          roi: record.roi.toFixed(3),
          raw_credit_card_amount_mxn: record._raw ? record._raw.credit_card_amount : 'N/A',
          raw_ad_spend_usd: record._raw ? record._raw.ad_spend : 'N/A'
        })),
        commissionData
      };
    } catch (error) {
      console.error('数据验证错误:', error);
      throw error;
    }
  },
  
  // 重新计算和同步数据
  async recalculateAndSync(date = '2025-08-10') {
    try {
      console.log('重新计算提成数据:', date);
      
      // 调用Edge Function重新计算
      const result = await commissionService.calculateCommission(date);
      console.log('重新计算结果:', result);
      
      // 验证结果
      const validation = await this.validateDataConsistency();
      
      return {
        success: true,
        calculation: result,
        validation: validation
      };
    } catch (error) {
      console.error('重新计算错误:', error);
      throw error;
    }
  }
};
