/**
 * Central push + in-app notification helpers (Expo Push API).
 */
function createPushService({ run, all, getParams, allParams }) {
  async function sendExpoPushMessages(messages) {
    if (!messages.length) return 0;
    let sent = 0;
    for (let i = 0; i < messages.length; i += 100) {
      const chunk = messages.slice(i, i + 100);
      try {
        const res = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify(chunk),
        });
        if (res.ok) sent += chunk.length;
      } catch (_) {}
    }
    return sent;
  }

  function insertNotification(userId, title, body) {
    if (!userId || userId === 'guest') return;
    try {
      run('INSERT INTO notifications (user_id, title, body) VALUES (?, ?, ?)', [
        userId,
        String(title || ''),
        String(body || ''),
      ]);
    } catch (_) {}
  }

  async function notifyUser(userId, title, body, data = {}) {
    if (!userId || userId === 'guest') return;
    insertNotification(userId, title, body);
    const tokens = allParams('SELECT token FROM push_tokens WHERE user_id = ?', [userId]);
    if (!tokens.length) return;
    const messages = tokens.map((t) => ({
      to: t.token,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
      channelId: 'default',
    }));
    await sendExpoPushMessages(messages);
  }

  function getUserIdsForTarget(target) {
    if (target === 'riders') {
      return allParams("SELECT id FROM users WHERE role = 'rider'", []).map((r) => r.id);
    }
    if (target === 'customers') {
      return allParams(
        "SELECT id FROM users WHERE role IS NULL OR role = '' OR role = 'customer'",
        []
      ).map((r) => r.id);
    }
    return all("SELECT id FROM users").map((r) => r.id);
  }

  async function broadcastToTarget(target, title, body, data = {}) {
    const userIds = getUserIdsForTarget(target);
    let pushCount = 0;
    for (const userId of userIds) {
      insertNotification(userId, title, body);
    }
    let tokenQuery =
      "SELECT DISTINCT token FROM push_tokens WHERE user_id != 'guest' AND user_id IS NOT NULL AND user_id != ''";
    if (target === 'riders') {
      tokenQuery =
        "SELECT DISTINCT pt.token FROM push_tokens pt JOIN users u ON u.id = pt.user_id WHERE u.role = 'rider'";
    } else if (target === 'customers') {
      tokenQuery =
        "SELECT DISTINCT pt.token FROM push_tokens pt JOIN users u ON u.id = pt.user_id WHERE u.role IS NULL OR u.role = '' OR u.role = 'customer'";
    }
    const tokens = all(tokenQuery);
    if (tokens.length) {
      const messages = tokens.map((t) => ({
        to: t.token,
        sound: 'default',
        title,
        body,
        data,
        priority: 'high',
        channelId: 'default',
      }));
      pushCount = await sendExpoPushMessages(messages);
    }
    return { userCount: userIds.length, pushCount };
  }

  async function notifyRidersNewOrder(orderId, customerName, addressLine, total) {
    const riders = allParams("SELECT id FROM users WHERE role = 'rider'", []);
    const title = 'New delivery request!';
    const shortId = orderId.replace('order_', '#');
    const body = `${customerName || 'Customer'} · ${addressLine || 'Address'} · Rs. ${total}`;
    for (const rider of riders) {
      await notifyUser(rider.id, title, `${body} (${shortId})`, {
        orderId,
        type: 'new_order',
      });
    }
  }

  return {
    notifyUser,
    broadcastToTarget,
    notifyRidersNewOrder,
    insertNotification,
    sendExpoPushMessages,
  };
}

module.exports = { createPushService };
