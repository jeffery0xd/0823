import React, { useState, useEffect } from 'react';
import { personalNotesService } from '../data/personalNotesService';

const PersonalNotes = () => {
  const [currentUser, setCurrentUser] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredNotes, setFilteredNotes] = useState([]);

  // 用户密码配置
  const userPasswords = {
    '青': 'qing123',
    '乔': 'qiao123',
    '白': 'bai123',
    '丁': 'ding123',
    '妹': 'mei123'
  };

  const categories = [
    { value: 'general', label: '一般', color: 'bg-gray-100 text-gray-800' },
    { value: 'work', label: '工作', color: 'bg-blue-100 text-blue-800' },
    { value: 'personal', label: '个人', color: 'bg-green-100 text-green-800' },
    { value: 'important', label: '重要', color: 'bg-red-100 text-red-800' },
    { value: 'ideas', label: '想法', color: 'bg-purple-100 text-purple-800' },
    { value: 'todo', label: '待办', color: 'bg-yellow-100 text-yellow-800' }
  ];

  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    category: 'general',
    is_important: false
  });

  // 登录处理
  const handleLogin = () => {
    if (userPasswords[currentUser] === password) {
      setIsLoggedIn(true);
      loadNotes();
      setPassword('');
    } else {
      alert('密码错误！');
    }
  };

  // 加载笔记
  const loadNotes = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const userNotes = await personalNotesService.getUserNotes(currentUser);
      setNotes(userNotes);
    } catch (error) {
      console.error('加载笔记失败:', error);
      alert('加载笔记失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 筛选笔记
  useEffect(() => {
    let filtered = notes;

    // 按搜索词筛选
    if (searchTerm) {
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 按分类筛选
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'important') {
        filtered = filtered.filter(note => note.is_important);
      } else {
        filtered = filtered.filter(note => note.category === selectedCategory);
      }
    }

    setFilteredNotes(filtered);
  }, [notes, searchTerm, selectedCategory]);

  // 创建笔记
  const handleCreateNote = async () => {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      alert('请填写标题和内容');
      return;
    }

    try {
      await personalNotesService.createNote({
        ...newNote,
        user_name: currentUser
      });
      
      setNewNote({
        title: '',
        content: '',
        category: 'general',
        is_important: false
      });
      setShowAddForm(false);
      loadNotes();
    } catch (error) {
      alert('创建笔记失败: ' + error.message);
    }
  };

  // 更新笔记
  const handleUpdateNote = async () => {
    if (!editingNote.title.trim() || !editingNote.content.trim()) {
      alert('请填写标题和内容');
      return;
    }

    try {
      await personalNotesService.updateNote(editingNote.id, editingNote);
      setEditingNote(null);
      loadNotes();
    } catch (error) {
      alert('更新笔记失败: ' + error.message);
    }
  };

  // 删除笔记
  const handleDeleteNote = async (id) => {
    if (!confirm('确定要删除这条笔记吗？')) return;

    try {
      await personalNotesService.deleteNote(id);
      loadNotes();
    } catch (error) {
      alert('删除笔记失败: ' + error.message);
    }
  };

  // 登出
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser('');
    setNotes([]);
    setFilteredNotes([]);
    setShowAddForm(false);
    setEditingNote(null);
  };

  // 获取分类样式
  const getCategoryStyle = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.color : 'bg-gray-100 text-gray-800';
  };

  // 获取分类标签
  const getCategoryLabel = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.label : '一般';
  };

  // 格式化时间
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl text-white">📝</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">随手记</h2>
            <p className="text-gray-600">请选择用户并输入密码</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">选择用户</label>
              <select
                value={currentUser}
                onChange={(e) => setCurrentUser(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">请选择用户</option>
                {Object.keys(userPasswords).map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入密码"
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={!currentUser || !password}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              登录
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* 头部 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📝 {currentUser}的随手记</h1>
          <p className="text-gray-600">记录你的想法和重要事项</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2"
          >
            <span>➕</span>
            <span>新建笔记</span>
          </button>
          <button
            onClick={handleLogout}
            className="bg-gray-500 text-white px-4 py-3 rounded-lg font-medium hover:bg-gray-600 transition-all duration-200"
          >
            登出
          </button>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜索笔记标题或内容..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full md:w-48 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部分类</option>
              <option value="important">重要笔记</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-2xl">📄</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">总笔记</p>
              <p className="text-2xl font-bold text-gray-900">{notes.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <span className="text-2xl">⭐</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">重要笔记</p>
              <p className="text-2xl font-bold text-gray-900">{notes.filter(n => n.is_important).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="text-2xl">📂</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">分类数量</p>
              <p className="text-2xl font-bold text-gray-900">{new Set(notes.map(n => n.category)).size}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <span className="text-2xl">🔍</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">搜索结果</p>
              <p className="text-2xl font-bold text-gray-900">{filteredNotes.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 笔记列表 */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchTerm ? '没有找到匹配的笔记' : '还没有笔记'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm ? '尝试使用不同的关键词搜索' : '点击上方按钮创建你的第一条笔记'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className={`bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200 ${
                note.is_important ? 'ring-2 ring-red-200' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryStyle(note.category)}`}>
                    {getCategoryLabel(note.category)}
                  </span>
                  {note.is_important && (
                    <span className="text-red-500">⭐</span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingNote(note)}
                    className="text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{note.title}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{note.content}</p>
              
              <div className="text-xs text-gray-400">
                <p>创建: {formatTime(note.created_at)}</p>
                {note.updated_at !== note.created_at && (
                  <p>更新: {formatTime(note.updated_at)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 新建笔记弹窗 */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">新建笔记</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">标题</label>
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="输入笔记标题"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
                  <select
                    value={newNote.category}
                    onChange={(e) => setNewNote({...newNote, category: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">重要程度</label>
                  <label className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={newNote.is_important}
                      onChange={(e) => setNewNote({...newNote, is_important: e.target.checked})}
                      className="rounded text-red-500 focus:ring-red-500"
                    />
                    <span className="text-sm">标记为重要</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">内容</label>
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                  rows={6}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="输入笔记内容"
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateNote}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                >
                  创建笔记
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 编辑笔记弹窗 */}
      {editingNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">编辑笔记</h2>
              <button
                onClick={() => setEditingNote(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">标题</label>
                <input
                  type="text"
                  value={editingNote.title}
                  onChange={(e) => setEditingNote({...editingNote, title: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
                  <select
                    value={editingNote.category}
                    onChange={(e) => setEditingNote({...editingNote, category: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">重要程度</label>
                  <label className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={editingNote.is_important}
                      onChange={(e) => setEditingNote({...editingNote, is_important: e.target.checked})}
                      className="rounded text-red-500 focus:ring-red-500"
                    />
                    <span className="text-sm">标记为重要</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">内容</label>
                <textarea
                  value={editingNote.content}
                  onChange={(e) => setEditingNote({...editingNote, content: e.target.value})}
                  rows={6}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  onClick={() => setEditingNote(null)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleUpdateNote}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                >
                  更新笔记
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalNotes;