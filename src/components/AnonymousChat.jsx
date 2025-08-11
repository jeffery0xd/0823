import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import BarrageSystem from './BarrageSystem';

const supabase = createClient(
  'https://pfkqocxbvnfebuhrjnxm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBma3FvY3hidm5mZWJ1aHJqbnhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0OTMwNjksImV4cCI6MjA2ODA2OTA2OX0.B-IoA9SkLH8tmj9xXObklN9PmDj1jnj9B9lpChDDgMM'
);

const AnonymousChat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [nickname, setNickname] = useState('');
  const [isNicknameSet, setIsNicknameSet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // 生成随机昵称建议 - 使用名人名字
    if (!nickname) {
      const famousNames = [
        '扎克伯格', '马斯克', '巴菲特', '比尔盖茨', '贝佐斯',
        '马云', '马化腾', '雷军', '张一鸣', '黄峥',
        '库克', '拉里佩奇', '谢尔盖布林', '奥特曼', '英伟达黄',
        '任正非', '董明珠', '王健林', '许家印', '曹德旺'
      ];
      const randomNickname = famousNames[Math.floor(Math.random() * famousNames.length)];
      setNickname(randomNickname);
    }

    if (isNicknameSet) {
      loadMessages();
      const cleanup = setupRealtimeSubscription();
      loadOnlineUsers(); // 加载真实在线人数
      
      // 定期更新在线人数
      const interval = setInterval(loadOnlineUsers, 30000); // 每30秒更新一次
      
      return () => {
        cleanup && cleanup();
        clearInterval(interval);
      };
    }
  }, [isNicknameSet, nickname]);

  const loadMessages = async () => {
    try {
      console.log('Loading messages...');
      const { data, error } = await supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_anonymous_chat')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Error loading messages:', error);
        throw error;
      }

      console.log('Messages loaded:', data);
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      // Initialize with empty array if table doesn't exist
      setMessages([]);
    }
  };

  const loadOnlineUsers = async () => {
    try {
      // 获取最近5分钟内活跃的用户数量
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_anonymous_chat')
        .select('nickname')
        .gte('created_at', fiveMinutesAgo);

      if (!error && data) {
        // 计算唯一昵称数量作为在线人数
        const uniqueUsers = [...new Set(data.map(msg => msg.nickname))];
        setOnlineUsers(Math.max(uniqueUsers.length, 1)); // 至少显示1个在线
      } else {
        setOnlineUsers(1); // 默认值
      }
    } catch (error) {
      console.error('Error loading online users:', error);
      setOnlineUsers(1);
    }
  };

  const setupRealtimeSubscription = () => {
    console.log('Setting up real-time subscription...');
    
    const subscription = supabase
      .channel('anonymous_chat_realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'app_5c098b55fc88465db9b331c43b51ef43_anonymous_chat'
      }, (payload) => {
        console.log('Real-time message received:', payload.new);
        setMessages(prev => {
          // 避免重复消息
          const exists = prev.some(msg => msg.id === payload.new.id);
          if (!exists) {
            console.log('Adding new message to chat:', payload.new);
            return [...prev, payload.new];
          }
          console.log('Message already exists, skipping duplicate');
          return prev;
        });
        
        // 新消息时更新在线人数
        loadOnlineUsers();
      })
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to real-time updates!');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Real-time subscription error');
        }
      });

    return () => {
      console.log('Unsubscribing from real-time updates...');
      subscription.unsubscribe();
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !nickname.trim()) return;
    
    setIsLoading(true);
    
    try {
      const messageData = {
        content: newMessage.trim(),
        nickname: nickname.trim(),
        created_at: new Date().toISOString()
      };

      console.log('Sending message:', messageData);

      const { data, error } = await supabase
        .from('app_5c098b55fc88465db9b331c43b51ef43_anonymous_chat')
        .insert([messageData])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Message sent successfully:', data);
      setNewMessage('');
      
      // 临时添加到本地状态以确保立即显示，实时订阅会处理重复问题
      if (data && data.length > 0) {
        setMessages(prev => {
          const exists = prev.some(msg => msg.id === data[0].id);
          if (!exists) {
            return [...prev, data[0]];
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('发送消息失败，请重试: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return diffInMinutes <= 0 ? '刚刚' : `${diffInMinutes}分钟前`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}小时前`;
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  const getMessageBubbleStyle = (message) => {
    const isOwn = message.nickname === nickname;
    if (isOwn) {
      return 'ml-auto bg-blue-500 text-white';
    }
    return 'mr-auto bg-white text-gray-900 border border-gray-200';
  };

  return (
    <>
      <BarrageSystem messages={messages} />
      <div className="max-w-4xl mx-auto p-3 sm:p-6 bg-white rounded-lg shadow-lg flex flex-col" style={{ height: 'calc(100vh - 120px)', position: 'relative', zIndex: 10 }}>
        <div className="flex items-center justify-between mb-4 sm:mb-6 flex-shrink-0 border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">💬 匿名聊天室</h2>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">实时互动，畅所欲言</p>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <div className="flex items-center space-x-2 text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs sm:text-sm font-medium">在线 {onlineUsers}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={loadMessages}
                disabled={isLoading}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>刷新</span>
              </button>
              <div className="text-xs text-gray-500">支持云存储</div>
            </div>
          </div>
        </div>

        {!isNicknameSet ? (
          <div className="text-center py-8 sm:py-12 flex-1">
            <div className="bg-blue-50 rounded-xl p-4 sm:p-8 max-w-md mx-auto">
              <div className="text-3xl sm:text-4xl mb-4">🎭</div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">设置昵称</h3>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">为了更好的聊天体验，请设置一个昵称</p>
              <div className="space-y-4">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="输入你的昵称..."
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  maxLength={20}
                  onKeyPress={(e) => e.key === 'Enter' && nickname.trim() && setIsNicknameSet(true)}
                />
                <button
                  onClick={() => nickname.trim() && setIsNicknameSet(true)}
                  disabled={!nickname.trim()}
                  className="w-full bg-blue-500 text-white py-2 sm:py-3 text-sm sm:text-base rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  开始聊天
                </button>
                <div className="text-xs text-gray-500 mt-2">
                  💡 建议昵称：{nickname}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* 聊天区域 */}
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 flex-1 overflow-y-auto min-h-0 relative" style={{ overscrollBehavior: 'contain' }}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <div className="text-3xl sm:text-4xl mb-3">💭</div>
                  <p className="text-center text-sm sm:text-base">还没有消息，开始第一条对话吧！</p>
                  <div className="text-xs text-gray-400 mt-2">
                    💡 消息存储在云端，支持实时对话
                  </div>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {messages.map((message) => {
                    const isOwn = message.nickname === nickname;
                    return (
                      <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs sm:max-w-sm lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
                          <div className={`flex items-center space-x-2 mb-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-xs sm:text-sm font-medium text-gray-700">{message.nickname}</span>
                            <span className="text-xs text-gray-500">{formatTime(message.created_at)}</span>
                          </div>
                          <div className={`rounded-xl px-3 sm:px-4 py-2 sm:py-3 shadow-sm ${getMessageBubbleStyle(message)}`}>
                            <p className="text-sm sm:text-base break-words">{message.content}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* 输入区域 */}
            <div className="flex items-end space-x-2 sm:space-x-3 flex-shrink-0">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="输入消息..."
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  maxLength={500}
                  rows={window.innerWidth < 640 ? 2 : 1}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      !isLoading && sendMessage();
                    }
                  }}
                  disabled={isLoading}
                />
                <div className="absolute right-2 sm:right-3 bottom-1 sm:bottom-2 text-xs text-gray-400">
                  {newMessage.length}/500
                </div>
              </div>
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || isLoading}
                className="bg-blue-500 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base"
              >
                {isLoading ? (
                  <>
                    <div className="w-3 sm:w-4 h-3 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="hidden sm:inline">发送中</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">发送</span>
                    <svg className="w-3 sm:w-4 h-3 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default AnonymousChat;