import React from 'react';

const StaffCard = ({ staff, isSelected, onSelect, accountCount }) => {
  // 投放人员配色方案
  const colorSchemes = {
    '青': 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100',
    '乔': 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100',
    '白': 'bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100',
    '丁': 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100',
    '妹': 'bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100'
  };

  const selectedSchemes = {
    '青': 'bg-blue-100 border-blue-300 text-blue-900',
    '乔': 'bg-purple-100 border-purple-300 text-purple-900',
    '白': 'bg-orange-100 border-orange-300 text-orange-900',
    '丁': 'bg-green-100 border-green-300 text-green-900',
    '妹': 'bg-indigo-100 border-indigo-300 text-indigo-900'
  };

  const avatarSchemes = {
    '青': 'bg-blue-500',
    '乔': 'bg-purple-500',
    '白': 'bg-orange-500',
    '丁': 'bg-green-500',
    '妹': 'bg-indigo-500'
  };

  const baseColorClass = colorSchemes[staff.name] || 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100';
  const selectedColorClass = selectedSchemes[staff.name] || 'bg-gray-100 border-gray-300 text-gray-900';
  const avatarClass = avatarSchemes[staff.name] || 'bg-gray-500';

  return (
    <button
      onClick={onSelect}
      className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
        isSelected ? selectedColorClass : baseColorClass
      } ${isSelected ? 'shadow-md transform scale-[1.02]' : 'hover:shadow-sm'}`}
    >
      <div className="flex items-center space-x-3">
        {/* 头像 */}
        <div className={`w-10 h-10 rounded-full ${avatarClass} flex items-center justify-center text-white font-bold`}>
          {staff.name}
        </div>
        
        {/* 信息 */}
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{staff.name}</div>
          <div className="text-xs opacity-75 truncate">{staff.name_en}</div>
        </div>
        
        {/* 账户数量徽章 */}
        <div className="flex flex-col items-end space-y-1">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            isSelected 
              ? 'bg-white/60 text-current' 
              : 'bg-white/80 text-current'
          }`}>
            {accountCount} 个
          </span>
          {isSelected && (
            <div className={`w-2 h-2 rounded-full ${
              avatarClass
            }`}></div>
          )}
        </div>
      </div>
    </button>
  );
};

export default StaffCard;