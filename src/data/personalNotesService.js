import { supabase } from '../utils/supabase';

const TABLE_NAME = 'app_e87b41cfe355428b8146f8bae8184e10_personal_notes';

export const personalNotesService = {
  // 获取用户的所有笔记
  async getUserNotes(userName) {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('user_name', userName)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('获取笔记失败:', error);
      throw new Error('获取笔记失败: ' + error.message);
    }
  },

  // 创建新笔记
  async createNote(noteData) {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert([{
          user_name: noteData.user_name,
          title: noteData.title,
          content: noteData.content,
          category: noteData.category || 'general',
          is_important: noteData.is_important || false
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('创建笔记失败:', error);
      throw new Error('创建笔记失败: ' + error.message);
    }
  },

  // 更新笔记
  async updateNote(id, noteData) {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update({
          title: noteData.title,
          content: noteData.content,
          category: noteData.category,
          is_important: noteData.is_important,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('更新笔记失败:', error);
      throw new Error('更新笔记失败: ' + error.message);
    }
  },

  // 删除笔记
  async deleteNote(id) {
    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('删除笔记失败:', error);
      throw new Error('删除笔记失败: ' + error.message);
    }
  },

  // 搜索笔记
  async searchNotes(userName, searchTerm) {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('user_name', userName)
        .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('搜索笔记失败:', error);
      throw new Error('搜索笔记失败: ' + error.message);
    }
  },

  // 按分类获取笔记
  async getNotesByCategory(userName, category) {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('user_name', userName)
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('获取分类笔记失败:', error);
      throw new Error('获取分类笔记失败: ' + error.message);
    }
  }
};