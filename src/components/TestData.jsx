import React, { useState, useEffect } from 'react';
import { adDataService } from '../utils/supabase';

const TestData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('🔄 开始加载测试数据...');
      const rawData = await adDataService.getAll();
      console.log('📊 获取到原始数据:', rawData);
      
      const today = '2025-07-19';
      const todayData = rawData.filter(record => record.date === today);
      console.log('📅 今日数据:', todayData);
      
      setData(todayData);
      setError(null);
    } catch (err) {
      console.error('❌ 加载数据失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">正在加载数据...</div>;
  if (error) return <div className="p-8 text-center text-red-600">错误: {error}</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">数据测试页面</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">原始数据 ({data.length} 条记录)</h2>
        
        {data.length === 0 ? (
          <p className="text-gray-500">没有找到今日数据</p>
        ) : (
          data.map((record, index) => (
            <div key={record.id} className="border-b pb-4 mb-4 last:border-b-0">
              <h3 className="font-bold text-lg text-blue-600">员工: {record.staff}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                <div>
                  <span className="font-medium">日期:</span> {record.date}
                </div>
                <div>
                  <span className="font-medium">广告花费:</span> ${record.ad_spend}
                </div>
                <div>
                  <span className="font-medium">信用卡金额:</span> MX${record.credit_card_amount}
                </div>
                <div>
                  <span className="font-medium">订单数:</span> {record.credit_card_orders}
                </div>
                <div>
                  <span className="font-medium">支付信息数:</span> {record.payment_info_count}
                </div>
                <div>
                  <span className="font-medium">ROI:</span> 
                  <span className={record.ad_spend > 0 ? (record.credit_card_amount > record.ad_spend ? 'text-green-600' : 'text-red-600') : 'text-gray-500'}>
                    {record.ad_spend > 0 ? (((record.credit_card_amount - record.ad_spend) / record.ad_spend * 100).toFixed(1) + '%') : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <button 
        onClick={loadData}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        重新加载数据
      </button>
    </div>
  );
};

export default TestData;