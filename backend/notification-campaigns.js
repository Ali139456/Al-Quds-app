/**
 * Admin broadcast notifications + scheduled deal alerts.
 */
function createNotificationCampaigns({ run, all, getParams, pushService }) {
  function ensureTable() {
    // Created via migrations-v2.js
  }

  function listCampaigns() {
    try {
      return all(
        'SELECT id, title, body, target, link, deal_id, scheduled_at, sent_at, status, recipient_count, created_at FROM notification_campaigns ORDER BY created_at DESC LIMIT 100'
      );
    } catch (_) {
      return [];
    }
  }

  async function sendCampaign(campaign) {
    const data = {
      type: campaign.deal_id ? 'deal' : 'promo',
      link: campaign.link || '',
      dealId: campaign.deal_id || '',
    };
    const result = await pushService.broadcastToTarget(
      campaign.target || 'customers',
      campaign.title,
      campaign.body,
      data
    );
    run(
      'UPDATE notification_campaigns SET status = ?, sent_at = datetime(\'now\'), recipient_count = ? WHERE id = ?',
      ['sent', result.userCount, campaign.id]
    );
    return result;
  }

  async function createAndMaybeSend({ title, body, target, link, dealId, scheduledAt }) {
    const id = 'camp_' + Date.now();
    const trimmedTitle = String(title || '').trim();
    const trimmedBody = String(body || '').trim();
    if (!trimmedTitle || !trimmedBody) {
      return { ok: false, error: 'Title and message required' };
    }
    const tgt = ['customers', 'riders', 'all'].includes(target) ? target : 'customers';
    const schedule = scheduledAt ? String(scheduledAt).trim() : null;
    const status = schedule ? 'pending' : 'sent';

    run(
      `INSERT INTO notification_campaigns (id, title, body, target, link, deal_id, scheduled_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, trimmedTitle, trimmedBody, tgt, link || '', dealId || null, schedule, status]
    );

    if (schedule) {
      return { ok: true, id, scheduled: true };
    }

    const campaign = getParams('SELECT * FROM notification_campaigns WHERE id = ?', [id]);
    const result = await sendCampaign(campaign);
    return { ok: true, id, sent: true, ...result };
  }

  async function processScheduledCampaigns() {
    let rows = [];
    try {
      rows = all(
        "SELECT * FROM notification_campaigns WHERE status = 'pending' AND scheduled_at IS NOT NULL AND datetime(scheduled_at) <= datetime('now')"
      );
    } catch (_) {
      return 0;
    }
    for (const row of rows) {
      await sendCampaign(row);
    }
    return rows.length;
  }

  function startScheduler(intervalMs = 60 * 1000) {
    processScheduledCampaigns();
    return setInterval(() => {
      const n = processScheduledCampaigns();
      if (n > 0) console.log(`  Notifications: sent ${n} scheduled campaign(s)`);
    }, intervalMs);
  }

  function registerRoutes(app) {
    app.get('/api/admin/notification-campaigns', (req, res) => {
      try {
        res.json(listCampaigns());
      } catch (e) {
        res.status(500).json({ error: String(e.message) });
      }
    });

    app.post('/api/admin/notification-campaigns', async (req, res) => {
      try {
        const { title, body, target, link, dealId, scheduledAt } = req.body || {};
        const result = await createAndMaybeSend({ title, body, target, link, dealId, scheduledAt });
        if (!result.ok) return res.status(400).json(result);
        res.json(result);
      } catch (e) {
        res.status(500).json({ error: String(e.message) });
      }
    });

    app.delete('/api/admin/notification-campaigns/:id', (req, res) => {
      try {
        const row = getParams('SELECT id, status FROM notification_campaigns WHERE id = ?', [req.params.id]);
        if (!row) return res.status(404).json({ error: 'Not found' });
        if (row.status === 'sent') return res.status(400).json({ error: 'Cannot cancel sent campaign' });
        run('UPDATE notification_campaigns SET status = ? WHERE id = ?', ['cancelled', req.params.id]);
        res.json({ ok: true });
      } catch (e) {
        res.status(500).json({ error: String(e.message) });
      }
    });
  }

  return { registerRoutes, startScheduler, createAndMaybeSend };
}

module.exports = { createNotificationCampaigns };
