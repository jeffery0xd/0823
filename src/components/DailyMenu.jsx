import React, { useState, useEffect } from 'react';
import { dailyMenuService } from '../services/accountManagementService';
import DailyMenuManager from './DailyMenuManager';

const DailyMenu = ({ isAdmin = false }) => {
  const [todayMenus, setTodayMenus] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [showManager, setShowManager] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const menuTypeNames = {
    breakfast: '早餐',
    lunch: '午餐', 
    dinner: '晚餐'
  };

  const menuTypeIcons = {
    breakfast: '🌅',
    lunch: '🌞',
    dinner: '🌙'
  };

  useEffect(() => {
    loadMenus();
  }, [selectedDate]);

  const loadMenus = async () => {
    try {
      setLoading(true);
      const menus = await dailyMenuService.getByDate(selectedDate);
      setTodayMenus(menus);
    } catch (error) {
      console.error('Failed to load menus:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return `¥${parseFloat(price).toFixed(2)}`;
  };

  const getDatesArray = () => {
    const dates = [];
    const today = new Date();
    for (let i = -2; i <= 5; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const formatDateDisplay = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    if (dateStr === today) return '今天';
    if (dateStr === tomorrowStr) return '明天';
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  if (showManager && isAdmin) {
    return (
      <DailyMenuManager 
        onClose={() => {
          setShowManager(false);
          loadMenus();
        }}
      />
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 transition-all duration-300">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <span className="text-2xl">🍽️</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">每日菜单</h2>
            <p className="text-gray-600 text-sm">为您精心准备的美味佳肴</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors duration-200"
          >
            {expanded ? '收起' : '展开'}
          </button>
          {isAdmin && (
            <button 
              onClick={() => setShowManager(true)}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors duration-200"
            >
              管理菜单
            </button>
          )}
        </div>
      </div>

      {/* Date Selector */}
      <div className="mb-6">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {getDatesArray().map(date => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors duration-200 ${
                selectedDate === date 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {formatDateDisplay(date)}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Content */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      ) : todayMenus.length === 0 ? (
        <div className="text-center py-8">
          <span className="text-6xl mb-4 block">🍽️</span>
          <p className="text-gray-500 text-lg">暂无菜单信息</p>
          <p className="text-gray-400 text-sm mt-2">管理员可以添加今日菜单</p>
        </div>
      ) : (
        <div className={`grid gap-6 ${
          expanded 
            ? 'grid-cols-1 lg:grid-cols-3' 
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}>
          {['breakfast', 'lunch', 'dinner'].map(menuType => {
            const menu = todayMenus.find(m => m.menu_type === menuType);
            return (
              <div key={menuType} className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-4 border border-orange-100">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-2xl">{menuTypeIcons[menuType]}</span>
                  <h3 className="text-xl font-semibold text-gray-800">{menuTypeNames[menuType]}</h3>
                </div>
                
                {menu && menu.dishes && menu.dishes.length > 0 ? (
                  <div className="space-y-3">
                    {menu.dishes.map((dish, index) => (
                      <div key={index} className={`bg-white rounded-lg p-3 shadow-sm border ${
                        expanded ? 'border-orange-200' : 'border-gray-200'
                      }`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800">{dish.name}</h4>
                            {expanded && dish.description && (
                              <p className="text-sm text-gray-600 mt-1">{dish.description}</p>
                            )}
                          </div>
                          {dish.price && (
                            <span className="text-orange-600 font-semibold ml-2">
                              {formatPrice(dish.price)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <span className="text-3xl block mb-2">🤔</span>
                    <p className="text-gray-500 text-sm">暂无{menuTypeNames[menuType]}信息</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Stats */}
      {!loading && todayMenus.length > 0 && expanded && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {todayMenus.reduce((total, menu) => total + (menu.dishes?.length || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">今日菜品</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {todayMenus.length}
              </div>
              <div className="text-sm text-gray-600">可用餐次</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatPrice(
                  todayMenus.reduce((total, menu) => {
                    return total + (menu.dishes?.reduce((sum, dish) => sum + (parseFloat(dish.price) || 0), 0) || 0);
                  }, 0)
                )}
              </div>
              <div className="text-sm text-gray-600">总价值</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyMenu;