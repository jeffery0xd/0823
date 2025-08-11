import React, { useState, useEffect } from 'react';
import { dailyMenuService } from '../services/accountManagementService';
import DishForm from './DishForm';

const DailyMenuManager = ({ onClose }) => {
  const [menus, setMenus] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMenuType, setSelectedMenuType] = useState('breakfast');
  const [loading, setLoading] = useState(false);
  const [showDishForm, setShowDishForm] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [editingMenuId, setEditingMenuId] = useState(null);

  const menuTypeNames = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐'
  };

  useEffect(() => {
    loadMenus();
  }, [selectedDate]);

  const loadMenus = async () => {
    try {
      setLoading(true);
      const data = await dailyMenuService.getByDate(selectedDate);
      setMenus(data);
    } catch (error) {
      console.error('Failed to load menus:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMenu = async () => {
    try {
      await dailyMenuService.create({
        date: selectedDate,
        menu_type: selectedMenuType,
        dishes: [],
        created_by: 'admin'
      });
      await loadMenus();
    } catch (error) {
      console.error('Failed to create menu:', error);
      alert('创建菜单失败：' + error.message);
    }
  };

  const handleDeleteMenu = async (menuId) => {
    if (!confirm('确定要删除这个菜单吗？')) return;
    
    try {
      await dailyMenuService.delete(menuId);
      await loadMenus();
    } catch (error) {
      console.error('Failed to delete menu:', error);
      alert('删除菜单失败：' + error.message);
    }
  };

  const handleAddDish = (menuId) => {
    setEditingMenuId(menuId);
    setEditingDish(null);
    setShowDishForm(true);
  };

  const handleEditDish = (menuId, dish, dishIndex) => {
    setEditingMenuId(menuId);
    setEditingDish({ ...dish, index: dishIndex });
    setShowDishForm(true);
  };

  const handleSaveDish = async (dishData) => {
    try {
      const menu = menus.find(m => m.id === editingMenuId);
      if (!menu) return;

      let updatedDishes = [...(menu.dishes || [])];
      
      if (editingDish && editingDish.index !== undefined) {
        // Edit existing dish
        updatedDishes[editingDish.index] = dishData;
      } else {
        // Add new dish
        updatedDishes.push(dishData);
      }

      await dailyMenuService.update(editingMenuId, {
        dishes: updatedDishes
      });
      
      await loadMenus();
      setShowDishForm(false);
      setEditingDish(null);
      setEditingMenuId(null);
    } catch (error) {
      console.error('Failed to save dish:', error);
      alert('保存菜品失败：' + error.message);
    }
  };

  const handleDeleteDish = async (menuId, dishIndex) => {
    if (!confirm('确定要删除这个菜品吗？')) return;
    
    try {
      const menu = menus.find(m => m.id === menuId);
      if (!menu) return;

      const updatedDishes = menu.dishes.filter((_, index) => index !== dishIndex);
      
      await dailyMenuService.update(menuId, {
        dishes: updatedDishes
      });
      
      await loadMenus();
    } catch (error) {
      console.error('Failed to delete dish:', error);
      alert('删除菜品失败：' + error.message);
    }
  };

  const copyFromPreviousWeek = async () => {
    try {
      setLoading(true);
      const previousWeekDate = new Date(selectedDate);
      previousWeekDate.setDate(previousWeekDate.getDate() - 7);
      const previousDate = previousWeekDate.toISOString().split('T')[0];
      
      const previousMenus = await dailyMenuService.getByDate(previousDate);
      
      for (const menu of previousMenus) {
        const existingMenu = menus.find(m => m.menu_type === menu.menu_type);
        if (!existingMenu) {
          await dailyMenuService.create({
            date: selectedDate,
            menu_type: menu.menu_type,
            dishes: menu.dishes,
            created_by: 'admin'
          });
        }
      }
      
      await loadMenus();
      alert('复制上周菜单成功！');
    } catch (error) {
      console.error('Failed to copy from previous week:', error);
      alert('复制上周菜单失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getDatesArray = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const formatDateDisplay = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) return '今天';
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  if (showDishForm) {
    return (
      <DishForm
        dish={editingDish}
        onSave={handleSaveDish}
        onCancel={() => {
          setShowDishForm(false);
          setEditingDish(null);
          setEditingMenuId(null);
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">菜单管理</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Date and Controls */}
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">选择日期</label>
                <select 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {getDatesArray().map(date => (
                    <option key={date} value={date}>
                      {formatDateDisplay(date)} ({date})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">菜单类型</label>
                <select 
                  value={selectedMenuType}
                  onChange={(e) => setSelectedMenuType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {Object.entries(menuTypeNames).map(([key, name]) => (
                    <option key={key} value={key}>{name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end gap-2">
                <button 
                  onClick={handleCreateMenu}
                  disabled={loading}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  创建菜单
                </button>
                
                <button 
                  onClick={copyFromPreviousWeek}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  复制上周
                </button>
              </div>
            </div>
          </div>

          {/* Menu List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">加载中...</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {['breakfast', 'lunch', 'dinner'].map(menuType => {
                const menu = menus.find(m => m.menu_type === menuType);
                return (
                  <div key={menuType} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-gray-800">
                        {menuTypeNames[menuType]}
                      </h3>
                      {menu && (
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleAddDish(menu.id)}
                            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded transition-colors duration-200"
                          >
                            添加菜品
                          </button>
                          <button 
                            onClick={() => handleDeleteMenu(menu.id)}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-colors duration-200"
                          >
                            删除菜单
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {menu ? (
                      menu.dishes && menu.dishes.length > 0 ? (
                        <div className="grid gap-3">
                          {menu.dishes.map((dish, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                              <div className="flex-1">
                                <h4 className="font-medium">{dish.name}</h4>
                                {dish.description && (
                                  <p className="text-sm text-gray-600">{dish.description}</p>
                                )}
                                {dish.price && (
                                  <p className="text-sm text-orange-600 font-semibold">¥{dish.price}</p>
                                )}
                              </div>
                              <div className="flex space-x-2">
                                <button 
                                  onClick={() => handleEditDish(menu.id, dish, index)}
                                  className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors duration-200"
                                >
                                  编辑
                                </button>
                                <button 
                                  onClick={() => handleDeleteDish(menu.id, index)}
                                  className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-colors duration-200"
                                >
                                  删除
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          暂无菜品，点击“添加菜品”来添加新菜品
                        </div>
                      )
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        暂无{menuTypeNames[menuType]}，点击“创建菜单”来创建
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyMenuManager;