import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationBanner = () => {
  const [requests, setRequests] = useState([]);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    loadRequests();
    
    // 每5秒刷新一次数据
    const interval = setInterval(() => {
      loadRequests();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const loadRequests = () => {
    try {
      const savedRequests = JSON.parse(localStorage.getItem('accountRequests') || '[]');
      setRequests(savedRequests);
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const urgentRequests = pendingRequests.filter(r => r.urgency === 'high');
  const resetRequests = requests.filter(r => r.resetRequested && r.resetStatus === 'pending');

  // 如果没有待处理的请求，不显示横幅
  if (pendingRequests.length === 0 && resetRequests.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`fixed top-0 left-0 right-0 z-[9999] ${
            urgentRequests.length > 0 
              ? 'bg-gradient-to-r from-red-500 via-orange-500 to-red-500' 
              : 'bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500'
          } text-white shadow-lg`}
          style={{ zIndex: 9999 }}
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* 动画图标 */}
                <motion.div
                  animate={{ 
                    rotate: urgentRequests.length > 0 ? [0, 10, -10, 0] : 0,
                    scale: urgentRequests.length > 0 ? [1, 1.1, 1] : 1
                  }}
                  transition={{ 
                    repeat: urgentRequests.length > 0 ? Infinity : 0, 
                    duration: urgentRequests.length > 0 ? 1 : 0 
                  }}
                  className="text-2xl"
                >
                  {urgentRequests.length > 0 ? '🚨' : '📋'}
                </motion.div>

                {/* 通知内容 */}
                <div className="flex flex-wrap items-center space-x-6">
                  {pendingRequests.length > 0 && (
                    <motion.div
                      animate={urgentRequests.length > 0 ? { opacity: [1, 0.7, 1] } : {}}
                      transition={{ repeat: urgentRequests.length > 0 ? Infinity : 0, duration: 1.5 }}
                      className="flex items-center space-x-2"
                    >
                      <span className="font-semibold">
                        📋 待处理申请: {pendingRequests.length} 个
                      </span>
                      {urgentRequests.length > 0 && (
                        <motion.span
                          animate={{ 
                            scale: [1, 1.2, 1],
                            color: ['#ffffff', '#ffff00', '#ffffff']
                          }}
                          transition={{ repeat: Infinity, duration: 1 }}
                          className="bg-red-600 px-2 py-1 rounded-full text-xs font-bold"
                        >
                          🔥 紧急: {urgentRequests.length} 个
                        </motion.span>
                      )}
                    </motion.div>
                  )}

                  {resetRequests.length > 0 && (
                    <motion.div
                      animate={{ opacity: [1, 0.8, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="flex items-center space-x-2"
                    >
                      <span className="font-semibold">
                        🔄 清零申请: {resetRequests.length} 个
                      </span>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* 关闭按钮 */}
              <button
                onClick={() => setShowBanner(false)}
                className="text-white hover:text-gray-200 transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 详细信息（紧急时显示） */}
            {urgentRequests.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                className="mt-2 pt-2 border-t border-white/30"
              >
                <div className="text-sm">
                  <span className="font-medium">紧急申请人: </span>
                  {urgentRequests.map((req, index) => (
                    <motion.span
                      key={req.id}
                      animate={{ color: ['#ffffff', '#ffff00', '#ffffff'] }}
                      transition={{ repeat: Infinity, duration: 1.5, delay: index * 0.2 }}
                      className="mr-2 font-semibold"
                    >
                      {req.requester}
                      {index < urgentRequests.length - 1 && ', '}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* 脉冲效果（紧急时） */}
          {urgentRequests.length > 0 && (
            <motion.div
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 bg-red-400 pointer-events-none"
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationBanner;