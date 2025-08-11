import React, { useState, useEffect } from 'react';
import { dailyContestService } from '../data/supabaseService';

const DailyContest = () => {
  const [entries, setEntries] = useState([]);
  const [allEntries, setAllEntries] = useState([]); // 所有日期的作品
  const [loading, setLoading] = useState(true);
  const [userLikes, setUserLikes] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [comments, setComments] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAllDates, setShowAllDates] = useState(false);

  useEffect(() => {
    loadData();
    loadAllData();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadDataByDate(selectedDate);
    }
  }, [selectedDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [entriesData, likesData] = await Promise.all([
        dailyContestService.getEntries(selectedDate),
        dailyContestService.getUserLikes()
      ]);
      
      setEntries(entriesData);
      setUserLikes(likesData);
    } catch (error) {
      console.error('Error loading contest data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDataByDate = async (date) => {
    try {
      setLoading(true);
      const entriesData = await dailyContestService.getEntries(date);
      setEntries(entriesData);
    } catch (error) {
      console.error('Error loading contest data for date:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllData = async () => {
    try {
      // 获取所有日期的作品（不传日期参数）
      const allEntriesData = await dailyContestService.getAllEntries();
      setAllEntries(allEntriesData);
    } catch (error) {
      console.error('Error loading all contest data:', error);
    }
  };

  const handleLike = async (entryId) => {
    try {
      const result = await dailyContestService.toggleLike(entryId);
      
      // Update local state
      setEntries(prev => prev.map(entry => 
        entry.id === entryId 
          ? { ...entry, likes_count: entry.likes_count + (result.liked ? 1 : -1) }
          : entry
      ));
      
      setUserLikes(prev => 
        result.liked 
          ? [...prev, entryId]
          : prev.filter(id => id !== entryId)
      );
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const loadComments = async (entryId) => {
    try {
      const commentsData = await dailyContestService.getComments(entryId);
      setComments(prev => ({ ...prev, [entryId]: commentsData }));
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleComment = async (entryId, commentText, anonymousName) => {
    try {
      await dailyContestService.addComment(entryId, commentText, anonymousName);
      
      // Update comments count
      setEntries(prev => prev.map(entry => 
        entry.id === entryId 
          ? { ...entry, comments_count: entry.comments_count + 1 }
          : entry
      ));
      
      // Reload comments
      await loadComments(entryId);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-500 p-2 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">每日大赛</h2>
              <p className="text-gray-600">匿名分享精彩瞬间，点赞最多者登上首页！</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>参加大赛</span>
          </button>
        </div>
      </div>

      {/* Date Selector */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">选择日期：</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showAllDates"
                checked={showAllDates}
                onChange={(e) => setShowAllDates(e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="showAllDates" className="text-sm font-medium text-gray-700">
                显示所有日期
              </label>
            </div>
          </div>
          
          <button
            onClick={() => {
              loadData();
              loadAllData();
            }}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>刷新</span>
          </button>
        </div>
        
        <div className="text-center mt-4">
          <h3 className="text-lg font-semibold text-gray-700">
            {showAllDates ? '所有日期的精彩作品' : `${formatDate(selectedDate)} 的精彩作品`}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            共 {showAllDates ? allEntries.length : entries.length} 件作品参赛
          </p>
        </div>
      </div>

      {/* Contest Entries Grid */}
      {(showAllDates ? allEntries : entries).length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500">{showAllDates ? '还没有作品参赛' : '该日期还没有作品参赛'}</p>
          <p className="text-sm text-gray-400 mt-1">成为第一个参赛者吧！</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {(showAllDates ? allEntries : entries).map((entry, index) => (
            <ContestEntryCard
              key={entry.id}
              entry={entry}
              index={index}
              isLiked={userLikes.includes(entry.id)}
              onLike={() => handleLike(entry.id)}
              onViewComments={async () => {
                setSelectedEntry(entry);
                if (!comments[entry.id]) {
                  await loadComments(entry.id);
                }
              }}
              formatTime={formatTime}
              showDate={showAllDates}
            />
          ))}
        </div>
      )}

      {/* Show All Images Gallery */}
      {(showAllDates ? allEntries : entries).length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            📸 {showAllDates ? '所有参赛作品图库' : '当日所有参赛作品'}
            <span className="text-sm font-normal text-gray-600 ml-2">
              ({(showAllDates ? allEntries : entries).length} 张图片)
            </span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {(showAllDates ? allEntries : entries).map((entry, index) => (
              <div 
                key={`gallery-${entry.id}`} 
                className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 relative group"
                onClick={() => {
                  setSelectedEntry(entry);
                  if (!comments[entry.id]) {
                    loadComments(entry.id);
                  }
                }}
              >
                <img
                  src={entry.image_url}
                  alt={entry.title || `作品 ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                  onError={(e) => {
                    console.error('Image failed to load:', entry.image_url);
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm" style={{display: 'none'}}>
                  图片加载失败
                </div>
                
                {/* 悬浮信息层 */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 flex items-end">
                  <div className="w-full p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <p className="text-xs font-semibold truncate">{entry.title || '无标题'}</p>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span>{entry.anonymous_name}</span>
                      {showAllDates && (
                        <span className="bg-purple-500 px-1 py-0.5 rounded text-xs">
                          {entry.contest_date}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            loadData();
          }}
        />
      )}

      {/* Comments Modal */}
      {selectedEntry && (
        <CommentsModal
          entry={selectedEntry}
          comments={comments[selectedEntry.id] || []}
          onClose={() => setSelectedEntry(null)}
          onComment={(commentText, anonymousName) => 
            handleComment(selectedEntry.id, commentText, anonymousName)
          }
          formatTime={formatTime}
        />
      )}
    </div>
  );
};

// Contest Entry Card Component
const ContestEntryCard = ({ entry, index, isLiked, onLike, onViewComments, formatTime, showDate = false }) => {
  const getBadgeColor = (index) => {
    if (index === 0) return 'bg-yellow-500 text-white'; // Gold
    if (index === 1) return 'bg-gray-400 text-white'; // Silver
    if (index === 2) return 'bg-amber-600 text-white'; // Bronze
    return 'bg-gray-200 text-gray-700';
  };

  const getBadgeIcon = (index) => {
    if (index < 3) {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      {/* Ranking Badge */}
      <div className="relative">
        <div className={`absolute top-2 left-2 z-10 px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1 ${getBadgeColor(index)}`}>
          {getBadgeIcon(index)}
          <span>#{index + 1}</span>
        </div>
        
        {/* Image */}
        <div className="aspect-square bg-gray-100">
          <img
            src={entry.image_url}
            alt={entry.title || '参赛作品'}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-800 truncate">
            {entry.title || '无标题'}
          </h3>
          <span className="text-xs text-gray-500">
            {formatTime(entry.created_at)}
          </span>
        </div>
        
        {showDate && (
          <div className="mb-2">
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
              📅 {entry.contest_date}
            </span>
          </div>
        )}
        
        {entry.description && (
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
            {entry.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-purple-600 truncate">
            by {entry.anonymous_name}
          </span>
          
          <div className="flex items-center space-x-3">
            {/* Like Button */}
            <button
              onClick={onLike}
              className={`flex items-center space-x-1 transition-colors ${
                isLiked 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <svg className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-xs font-medium">{entry.likes_count}</span>
            </button>
            
            {/* Comments Button */}
            <button
              onClick={onViewComments}
              className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-xs font-medium">{entry.comments_count}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Upload Modal Component
const UploadModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    anonymous_name: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile || !formData.anonymous_name.trim()) return;

    try {
      setUploading(true);
      
      // Upload image
      const imageUrl = await dailyContestService.uploadImage(selectedFile);
      
      // Create contest entry
      await dailyContestService.createEntry({
        ...formData,
        image_url: imageUrl
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error submitting entry:', error);
      alert('提交失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">参加每日大赛</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              上传图片 <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              {preview ? (
                <div className="space-y-2">
                  <img src={preview} alt="预览" className="max-h-32 mx-auto rounded" />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreview(null);
                    }}
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    重新选择
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-500">点击选择图片</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              作品标题
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="为你的作品起个名字"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              作品描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="介绍一下你的作品..."
            />
          </div>

          {/* Anonymous Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              匿名昵称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.anonymous_name}
              onChange={(e) => setFormData({...formData, anonymous_name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="给自己起个匿名昵称"
              required
            />
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={uploading || !selectedFile || !formData.anonymous_name.trim()}
              className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? '提交中...' : '提交作品'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Comments Modal Component
const CommentsModal = ({ entry, comments, onClose, onComment, formatTime }) => {
  const [newComment, setNewComment] = useState('');
  const [anonymousName, setAnonymousName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !anonymousName.trim()) return;

    try {
      setSubmitting(true);
      await onComment(newComment, anonymousName);
      setNewComment('');
      // Keep anonymous name for convenience
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">评论区</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Entry Info */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center space-x-4">
            <img
              src={entry.image_url}
              alt={entry.title}
              className="w-12 h-12 object-cover rounded-lg"
            />
            <div>
              <h4 className="font-semibold">{entry.title || '无标题'}</h4>
              <p className="text-sm text-gray-600">by {entry.anonymous_name}</p>
              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                <span>❤️ {entry.likes_count}</span>
                <span>💬 {entry.comments_count}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {comments.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>还没有评论</p>
              <p className="text-sm">来做第一个评论的人吧！</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-purple-600">{comment.anonymous_name}</span>
                  <span className="text-xs text-gray-500">{formatTime(comment.created_at)}</span>
                </div>
                <p className="text-gray-700">{comment.comment_text}</p>
              </div>
            ))
          )}
        </div>

        {/* Comment Form */}
        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex space-x-3">
              <input
                type="text"
                value={anonymousName}
                onChange={(e) => setAnonymousName(e.target.value)}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                placeholder="匿名昵称"
                required
              />
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="写下你的评论..."
                required
              />
              <button
                type="submit"
                disabled={submitting || !newComment.trim() || !anonymousName.trim()}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? '发送中...' : '发送'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DailyContest;