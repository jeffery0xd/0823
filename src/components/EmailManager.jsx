import React, { useState } from 'react';
import { accountRequestsService } from '../data/accountRequestsService.js';

const EmailManager = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const showMessage = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handleSendDailyReminder = async () => {
    setLoading(true);
    try {
      const result = await accountRequestsService.sendDailyReminder();
      showMessage(`每日提醒邮件发送成功！已发送给 ${result.sent_to} 人`, 'success');
    } catch (error) {
      showMessage(`发送失败: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async (stage) => {
    setLoading(true);
    try {
      const result = await accountRequestsService.sendEmailNotification(stage, {
        requester: '测试用户',
        reason: '测试邮件通知功能',
        requestId: 'test-' + Date.now()
      });
      showMessage(`${stage} 测试邮件发送成功！已发送给 ${result.sent_to} 人`, 'success');
    } catch (error) {
      showMessage(`发送失败: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
        📧 邮件通知管理
      </h2>

      {/* 消息提示 */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          messageType === 'success' ? 'bg-green-100 border border-green-200 text-green-800' :
          messageType === 'error' ? 'bg-red-100 border border-red-200 text-red-800' :
          'bg-blue-100 border border-blue-200 text-blue-800'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 每日提醒 */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <h3 className="font-bold text-blue-800 mb-3">📅 每日数据填写提醒</h3>
          <p className="text-sm text-blue-600 mb-4">
            每天北京时间下午4点自动发送数据填写提醒邮件给团队成员
          </p>
          <button
            onClick={handleSendDailyReminder}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '发送中...' : '立即发送每日提醒'}
          </button>
        </div>

        {/* 通知设置 */}
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <h3 className="font-bold text-green-800 mb-3">⚙️ 邮件配置说明</h3>
          <div className="text-sm text-green-700 space-y-2">
            <p><strong>收件人:</strong> 团队5名成员</p>
            <p><strong>发送时机:</strong></p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>新申请提交时</li>
              <li>申请被批准/拒绝时</li>
              <li>账户信息分配时</li>
              <li>清零申请提交时</li>
              <li>每日下午4点提醒</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 测试通知 */}
      <div className="mt-6 bg-gray-50 rounded-xl p-4 border border-gray-200">
        <h3 className="font-bold text-gray-800 mb-3">🧪 测试邮件通知</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => handleTestNotification('new_request')}
            disabled={loading}
            className="px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 text-sm"
          >
            测试新申请
          </button>
          <button
            onClick={() => handleTestNotification('approved')}
            disabled={loading}
            className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 text-sm"
          >
            测试批准通知
          </button>
          <button
            onClick={() => handleTestNotification('rejected')}
            disabled={loading}
            className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 text-sm"
          >
            测试拒绝通知
          </button>
          <button
            onClick={() => handleTestNotification('account_assigned')}
            disabled={loading}
            className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 text-sm"
          >
            测试分配通知
          </button>
        </div>
      </div>

      {/* SMTP 配置说明 */}
      <div className="mt-6 bg-yellow-50 rounded-xl p-4 border border-yellow-200">
        <h3 className="font-bold text-yellow-800 mb-3">⚠️ SMTP 邮件服务配置</h3>
        <div className="text-sm text-yellow-700 space-y-2">
          <p>需要在 Supabase Edge Function 中配置以下环境变量：</p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li><code>SMTP_HOST</code>: SMTP服务器地址（如：smtp.163.com）</li>
            <li><code>SMTP_PORT</code>: SMTP端口（通常为465或587）</li>
            <li><code>SMTP_USER</code>: 邮箱账号</li>
            <li><code>SMTP_PASSWORD</code>: 邮箱密码或授权码</li>
            <li><code>SMTP_FROM</code>: 发件人邮箱</li>
          </ul>
          <p className="mt-2 text-yellow-600">
            <strong>注意：</strong> 请联系系统管理员配置SMTP环境变量后再使用邮件功能。
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailManager;