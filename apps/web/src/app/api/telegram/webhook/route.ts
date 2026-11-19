import { NextRequest, NextResponse } from 'next/server'
import {
  saveServerlessStudentSettings,
  getServerlessStudentSettings,
} from '@/lib/serverless-store'

export const runtime = 'nodejs'

const TELEGRAM_API_BASE = 'https://api.telegram.org'

/**
 * Telegram Webhook Handler for @campusbridge_bot
 * Handles /start command and registers students for dual-channel alerts.
 */
export async function POST(req: NextRequest) {
  const token =
    process.env.TELEGRAM_BOT_TOKEN || '9206892743:AAFUijN1IWruCy_pY3w5vjZ0ZZNWxgWqgu0'

  try {
    const update = await req.json().catch(() => null)
    if (!update) {
      return NextResponse.json({ ok: false, error: 'Empty update body' }, { status: 400 })
    }

    const message = update.message || update.edited_message
    if (!message) {
      return NextResponse.json({ ok: true, action: 'ignored_non_message' })
    }

    const chat = message.chat || {}
    const chatId = chat.id
    const user = message.from || {}
    const text = (message.text || '').trim()
    const firstName = user.first_name || 'Student'
    const username = user.username || ''

    if (!chatId) {
      return NextResponse.json({ ok: true, action: 'missing_chat_id' })
    }

    console.log(`[Telegram Webhook] Received text="${text}" from chat_id=${chatId} (@${username})`)

    // Handle /start or /register
    if (text.startsWith('/start') || text.startsWith('/register')) {
      const replyText =
        'You have been registered\n\n' +
        '🎓 *CampusBridge AI Notification Bot*\n\n' +
        `👋 Welcome *${firstName}* (@${username || 'student'})!\n` +
        `Your verified Telegram Chat ID is: \`${chatId}\`\n\n` +
        '✅ *Two-Way Messaging Active:*\n' +
        'You have successfully initiated contact with CampusBridge AI. The bot is now authorized to deliver:\n' +
        '• 📢 *New Campus Placement Drives & JDs*\n' +
        '• ⏱️ *48-Hour & 72-Hour Sprint Deadlines*\n' +
        '• 🛡️ *Institutional Eligibility & Cutoff Passes*\n' +
        '• 🤝 *Peer & Senior Mentorship Alerts*\n\n' +
        '_Return to https://campusbridge-web.vercel.app to view your 72-hour sprint roadmap._'

      // Save student's telegram chat ID in serverless store
      try {
        saveServerlessStudentSettings('STU-101', {
          telegram_chat_id: String(chatId),
          telegram_notifications_enabled: true,
          allow_telegram_notifications: true,
          telegram_id: username ? `@${username}` : String(chatId),
        })
      } catch (err) {
        console.warn('[Telegram Webhook] Non-critical save error:', err)
      }

      // Send response message back via Telegram API
      await sendTelegramMessage(token, chatId, replyText)

      return NextResponse.json({
        ok: true,
        action: 'registered',
        chat_id: chatId,
        status: 'You have been registered',
      })
    }

    // Handle /id command
    if (text.startsWith('/id') || text.startsWith('/chatid')) {
      const idReply =
        `🆔 Your Telegram Chat ID is: \`${chatId}\`\n\n` +
        'Copy and paste this ID into your **CampusBridge Account Settings** page to receive real-time placement alerts.'
      await sendTelegramMessage(token, chatId, idReply)
      return NextResponse.json({ ok: true, action: 'sent_id', chat_id: chatId })
    }

    // Default acknowledgement
    const defaultReply =
      'You have been registered\n\n' +
      `ℹ️ Your Telegram Chat ID is \`${chatId}\`. CampusBridge AI will notify you when new drives or sprint tasks become available.`
    await sendTelegramMessage(token, chatId, defaultReply)

    return NextResponse.json({ ok: true, action: 'acknowledged', chat_id: chatId })
  } catch (error: any) {
    console.error('[Telegram Webhook Error]:', error)
    // Always return 200 to Telegram to prevent retry storms, per Telegram Bot API guidelines
    return NextResponse.json({ ok: false, error: error.message }, { status: 200 })
  }
}

/**
 * Helper to dispatch message adhering to Telegram rate limits.
 */
async function sendTelegramMessage(token: string, chatId: string | number, text: string) {
  try {
    const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      // If Markdown failed, retry plain text
      if (err.description && err.description.includes("can't parse entities")) {
        await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text,
          }),
        })
      }
    }
  } catch (err) {
    console.warn('[sendTelegramMessage Error]:', err)
  }
}

export async function GET() {
  const token =
    process.env.TELEGRAM_BOT_TOKEN || '9206892743:AAFUijN1IWruCy_pY3w5vjZ0ZZNWxgWqgu0'
  try {
    const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/getWebhookInfo`)
    const data = await res.json()
    return NextResponse.json({
      status: 'CampusBridge Telegram Webhook Active',
      webhook_info: data,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
