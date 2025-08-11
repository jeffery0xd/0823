// 投放人员数据
export const advertisers = ['青', '乔', '白', '丁', '妹'];

// 获取本地存储的数据，如果没有则返回空数组
const getStoredData = () => {
  try {
    const stored = localStorage.getItem('advertisingData');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('读取本地数据失败:', error);
    return [];
  }
};

// 保存数据到本地存储
const saveDataToStorage = (data) => {
  try {
    localStorage.setItem('advertisingData', JSON.stringify(data));
  } catch (error) {
    console.error('保存数据失败:', error);
  }
};

// 模拟广告投放数据 - 从本地存储获取，默认为空
export let mockAdvertisingData = getStoredData();

// 添加新的广告数据
export const addAdvertisingData = (newData) => {
  const id = Date.now() + Math.random().toString(36).substr(2, 5);
  const dataWithId = { ...newData, id };
  mockAdvertisingData.push(dataWithId);
  saveDataToStorage(mockAdvertisingData);
  return dataWithId;
};

// 删除指定数据
export const deleteAdvertisingData = (id) => {
  mockAdvertisingData = mockAdvertisingData.filter(item => item.id !== id);
  saveDataToStorage(mockAdvertisingData);
};

// 更新数据
export const updateAdvertisingData = (id, updatedData) => {
  const index = mockAdvertisingData.findIndex(item => item.id === id);
  if (index !== -1) {
    mockAdvertisingData[index] = { ...mockAdvertisingData[index], ...updatedData };
    saveDataToStorage(mockAdvertisingData);
    return mockAdvertisingData[index];
  }
  return null;
};

// 清空所有数据
export const clearAllData = () => {
  mockAdvertisingData.length = 0;
  saveDataToStorage(mockAdvertisingData);
};

// 重新加载数据
export const reloadData = () => {
  const newData = getStoredData();
  mockAdvertisingData.length = 0;
  mockAdvertisingData.push(...newData);
  return mockAdvertisingData;
};

// 汇率数据
export const exchangeRate = {
  mxnToUsd: 0.055, // 1 MXN = 0.055 USD (示例汇率)
  lastUpdated: '2025-01-14 10:30:00'
};

// 计算单次添加支付成本
export const calculatePaymentCost = (creditCardAmount, paymentInfoCount) => {
  return paymentInfoCount > 0 ? (creditCardAmount / paymentInfoCount).toFixed(2) : 0;
};

// 计算单次订单成本
export const calculateOrderCost = (creditCardAmount, orderCount) => {
  return orderCount > 0 ? (creditCardAmount / orderCount).toFixed(2) : 0;
};

// 获取每日龙虎榜数据
export const getDailyLeaderboard = (date) => {
  return mockAdvertisingData
    .filter(item => item.date === date)
    .sort((a, b) => b.creditCardAmount - a.creditCardAmount)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
      paymentCost: calculatePaymentCost(item.creditCardAmount, item.paymentInfoCount),
      orderCost: calculateOrderCost(item.creditCardAmount, item.orderCount)
    }));
};

// 获取每日汇总数据
export const getDailySummary = (date) => {
  const dayData = mockAdvertisingData.filter(item => item.date === date);
  
  return {
    totalAdSpend: dayData.reduce((sum, item) => sum + item.adSpend, 0),
    totalCreditCardAmount: dayData.reduce((sum, item) => sum + item.creditCardAmount, 0),
    totalPaymentInfo: dayData.reduce((sum, item) => sum + item.paymentInfoCount, 0),
    totalOrders: dayData.reduce((sum, item) => sum + item.orderCount, 0),
    totalRecharge: dayData.reduce((sum, item) => sum + item.rechargeAmount, 0),
    advertiserCount: new Set(dayData.map(item => item.advertiser)).size
  };
};