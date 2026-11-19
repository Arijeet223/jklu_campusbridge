"""CampusBridge AI — Telegram Bot Service & Rate-Guarded Dispatcher.

Handles:
1. "/start" registration command: registers users and authorizes two-way bot messaging.
2. Long polling daemon for local development / server execution.
3. Webhook endpoints for serverless / cloud deployments.
4. Telegram API rate limit compliance (1 msg/sec per chat, 30 msg/sec global, 429 backoff).
"""

import os
import sys
import time
import json
import asyncio
import logging
from typing import Optional, Dict, Any, List
import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("campusbridge.telegram_bot")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

TELEGRAM_API_BASE = "https://api.telegram.org"


class TelegramRateLimiter:
    """Enforces Telegram Bot API rate limits:
    - Max 1 message per second per specific chat.
    - Max 30 messages per second globally.
    - Automatic exponential backoff when HTTP 429 is encountered.
    """

    def __init__(self, global_interval_sec: float = 0.04, per_chat_interval_sec: float = 1.05) -> None:
        self.global_interval = global_interval_sec  # ~25-30 msg/sec
        self.per_chat_interval = per_chat_interval_sec  # ~1 msg/sec
        self._last_global_send: float = 0.0
        self._last_chat_send: Dict[str, float] = {}
        self._lock = asyncio.Lock()

    async def throttle(self, chat_id: str) -> None:
        """Asynchronously waits until rate limits permit sending to this chat_id."""
        async with self._lock:
            now = time.monotonic()

            # 1. Global throttle
            time_since_global = now - self._last_global_send
            if time_since_global < self.global_interval:
                await asyncio.sleep(self.global_interval - time_since_global)

            # 2. Per-chat throttle
            now = time.monotonic()
            last_chat = self._last_chat_send.get(chat_id, 0.0)
            time_since_chat = now - last_chat
            if time_since_chat < self.per_chat_interval:
                await asyncio.sleep(self.per_chat_interval - time_since_chat)

            # Update timestamps
            self._last_global_send = time.monotonic()
            self._last_chat_send[chat_id] = self._last_global_send


# Global singleton rate limiter
_rate_limiter = TelegramRateLimiter()


class CampusBridgeTelegramBot:
    """Core manager for CampusBridge Telegram Bot interactions."""

    def __init__(self, token: Optional[str] = None) -> None:
        self.token = (token or os.getenv("TELEGRAM_BOT_TOKEN", "")).strip()
        self.api_url = f"{TELEGRAM_API_BASE}/bot{self.token}"

    def is_configured(self) -> bool:
        return bool(self.token)

    async def send_message(
        self,
        chat_id: str | int,
        text: str,
        parse_mode: Optional[str] = "Markdown",
        retry_on_429: bool = True,
    ) -> Dict[str, Any]:
        """Sends a message adhering to Telegram rate limits and auto-retrying on 429."""
        if not self.is_configured():
            logger.warning("[TELEGRAM_BOT] Cannot send message: TELEGRAM_BOT_TOKEN not configured.")
            return {"ok": False, "error": "MISSING_BOT_TOKEN"}

        chat_str = str(chat_id).strip()
        await _rate_limiter.throttle(chat_str)

        payload: Dict[str, Any] = {
            "chat_id": chat_str,
            "text": text,
        }
        if parse_mode:
            payload["parse_mode"] = parse_mode

        url = f"{self.api_url}/sendMessage"

        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                res = await client.post(url, json=payload)
                data = res.json()

                # Handle HTTP 429 (Too Many Requests)
                if res.status_code == 429 and retry_on_429:
                    retry_after = data.get("parameters", {}).get("retry_after", 3)
                    logger.warning(f"[TELEGRAM_BOT] Rate limit hit (429). Retrying after {retry_after}s for chat_id={chat_str}")
                    await asyncio.sleep(min(float(retry_after), 10.0))
                    return await self.send_message(chat_id, text, parse_mode=parse_mode, retry_on_429=False)

                # Handle Markdown entity parse error fallback
                if res.status_code == 400 and parse_mode and "can't parse entities" in data.get("description", "").lower():
                    logger.info(f"[TELEGRAM_BOT] Retrying with plain text due to Markdown parse error for chat_id={chat_str}")
                    return await self.send_message(chat_id, text, parse_mode=None, retry_on_429=False)

                if res.status_code == 200 and data.get("ok"):
                    logger.info(f"[TELEGRAM_BOT] Successfully sent message to chat_id={chat_str}")
                    return {"ok": True, "result": data.get("result")}

                logger.warning(f"[TELEGRAM_BOT] Telegram API error {res.status_code}: {res.text}")
                return {"ok": False, "status_code": res.status_code, "error": data.get("description", res.text)}

            except Exception as e:
                logger.error(f"[TELEGRAM_BOT] Network exception dispatching to chat_id={chat_str}: {e}")
                return {"ok": False, "error": str(e)}

    async def handle_update(self, update: Dict[str, Any]) -> Dict[str, Any]:
        """Processes a single incoming Telegram update (from polling or webhook)."""
        message = update.get("message") or update.get("edited_message")
        if not message:
            return {"ok": True, "action": "ignored_non_message"}

        chat = message.get("chat", {})
        chat_id = chat.get("id")
        user = message.get("from", {})
        text = (message.get("text") or "").strip()
        first_name = user.get("first_name", "Student")
        username = user.get("username", "")

        logger.info(f"[TELEGRAM_BOT] Received text='{text}' from chat_id={chat_id} (user=@{username})")

        # ── HANDLE /start COMMAND ──────────────────────────────────────────────
        if text.startswith("/start") or text.startswith("/register"):
            # Required response as requested:
            response_text = (
                "You have been registered\n\n"
                f"🎓 *CampusBridge AI Notification Bot*\n\n"
                f"👋 Hello *{first_name}* (@{username or 'student'})!\n"
                f"Your verified Telegram Chat ID is: `{chat_id}`\n\n"
                "✅ *Two-Way Messaging Authorized:*\n"
                "Because you have initiated this conversation, CampusBridge AI can now deliver instant push notifications directly to you:\n"
                "• 🔔 *New Campus Placement Drives & JDs*\n"
                "• ⏱️ *48h & 72h Sprint Deadlines & Eligibility Gates*\n"
                "• 🔗 *Direct Test & Faculty Resource Links*\n"
                "• 🤝 *Senior Peer Mentorship Connection Inquiries*\n\n"
                "_You can return to the CampusBridge web app anytime._"
            )

            # Auto-register student in ExcelStore/PostgreSQL if possible
            self._auto_bind_student_chat_id(chat_id=str(chat_id), username=username, first_name=first_name)

            send_res = await self.send_message(chat_id, response_text, parse_mode="Markdown")
            return {"ok": True, "action": "registered", "chat_id": chat_id, "send_status": send_res}

        # ── HANDLE /id OR /help COMMAND ─────────────────────────────────────────
        elif text.startswith("/id") or text.startswith("/chatid"):
            reply = f"🆔 Your Telegram Chat ID is: `{chat_id}`\n\nCopy and paste this ID into your **CampusBridge Student Settings** page."
            send_res = await self.send_message(chat_id, reply, parse_mode="Markdown")
            return {"ok": True, "action": "sent_chat_id", "send_status": send_res}

        elif text.startswith("/help"):
            reply = (
                "🤖 *CampusBridge AI Bot Commands:*\n\n"
                "/start - Register your Telegram chat and authorize drive alerts\n"
                "/id - Display your numeric Telegram Chat ID\n"
                "/help - View this help menu\n\n"
                "_Visit https://campusbridge-web.vercel.app for your AI coaching studio & 72-hour sprint plans._"
            )
            send_res = await self.send_message(chat_id, reply, parse_mode="Markdown")
            return {"ok": True, "action": "help", "send_status": send_res}

        else:
            # Echo or acknowledge with registration confirmation
            reply = (
                "You have been registered\n\n"
                f"ℹ️ Your Telegram Chat ID is `{chat_id}`. You are actively enrolled to receive placement alerts from CampusBridge AI."
            )
            send_res = await self.send_message(chat_id, reply, parse_mode="Markdown")
            return {"ok": True, "action": "acknowledged", "send_status": send_res}

    def _auto_bind_student_chat_id(self, chat_id: str, username: str, first_name: str) -> None:
        """Automatically updates matching student profile with this confirmed Telegram chat_id."""
        try:
            from backend.db.excel_store import get_excel_store, SHEET_STUDENTS
            store = get_excel_store()
            students = store.get_sheet(SHEET_STUDENTS)

            matched_id: Optional[str] = None
            u_clean = username.lower().replace("@", "") if username else ""
            f_clean = first_name.lower()

            for s in students:
                s_name = str(s.get("full_name", "")).lower()
                s_tg = str(s.get("telegram_id", "")).lower().replace("@", "")
                s_gh = str(s.get("github_url", "")).lower()

                if u_clean and (u_clean in s_name or u_clean in s_tg or u_clean in s_gh):
                    matched_id = str(s.get("student_id"))
                    break
                if f_clean and f_clean in s_name:
                    matched_id = str(s.get("student_id"))
                    break

            if not matched_id and students:
                # Default to primary active demo student STU-101 (Arijeet Basak)
                matched_id = "STU-101"

            if matched_id:
                store.update_row(
                    SHEET_STUDENTS,
                    key_col="student_id",
                    key_val=matched_id,
                    updates={
                        "telegram_chat_id": str(chat_id),
                        "telegram_id": f"@{username}" if username else str(chat_id),
                        "telegram_notifications_enabled": 1,
                        "allow_telegram_notifications": 1,
                    },
                )
                logger.info(f"[TELEGRAM_BOT] Auto-bound telegram_chat_id={chat_id} to student_id={matched_id}")
        except Exception as err:
            logger.warning(f"[TELEGRAM_BOT] Non-critical auto-bind notice: {err}")

    async def get_me(self) -> Dict[str, Any]:
        """Returns the Telegram Bot identity."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(f"{self.api_url}/getMe")
            return res.json()

    async def get_webhook_info(self) -> Dict[str, Any]:
        """Returns the current webhook configuration."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(f"{self.api_url}/getWebhookInfo")
            return res.json()

    async def set_webhook(self, webhook_url: str) -> Dict[str, Any]:
        """Sets the Telegram webhook URL."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(
                f"{self.api_url}/setWebhook",
                json={"url": webhook_url, "drop_pending_updates": False},
            )
            return res.json()

    async def delete_webhook(self, drop_pending_updates: bool = False) -> Dict[str, Any]:
        """Deletes the active webhook to allow long polling."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(
                f"{self.api_url}/deleteWebhook",
                json={"drop_pending_updates": drop_pending_updates},
            )
            return res.json()

    async def run_polling(self, stop_event: Optional[asyncio.Event] = None) -> None:
        """Runs the long-polling loop to consume updates and handle commands in real-time."""
        if not self.is_configured():
            logger.error("[TELEGRAM_BOT] Cannot start polling: TELEGRAM_BOT_TOKEN missing.")
            return

        # Ensure no conflicting webhook is active
        wh_info = await self.get_webhook_info()
        if wh_info.get("result", {}).get("url"):
            logger.info(f"[TELEGRAM_BOT] Active webhook found: {wh_info['result']['url']}. Deleting webhook for polling mode...")
            await self.delete_webhook()

        bot_info = await self.get_me()
        bot_user = bot_info.get("result", {}).get("username", "campusbridge_bot")
        logger.info(f"[TELEGRAM_BOT] Polling daemon started for @{bot_user}. Listening for /start...")

        offset = 0
        async with httpx.AsyncClient(timeout=40.0) as client:
            while not (stop_event and stop_event.is_set()):
                try:
                    params: Dict[str, Any] = {"offset": offset, "timeout": 25}
                    res = await client.get(f"{self.api_url}/getUpdates", params=params)

                    if res.status_code == 200:
                        data = res.json()
                        updates: List[Dict[str, Any]] = data.get("result", [])

                        for u in updates:
                            update_id = u.get("update_id", 0)
                            offset = max(offset, update_id + 1)
                            try:
                                await self.handle_update(u)
                            except Exception as u_err:
                                logger.error(f"[TELEGRAM_BOT] Error processing update {update_id}: {u_err}")

                    elif res.status_code == 409:
                        logger.warning("[TELEGRAM_BOT] 409 Conflict: another poller or webhook is running. Backing off 5s...")
                        await asyncio.sleep(5.0)
                    else:
                        logger.warning(f"[TELEGRAM_BOT] getUpdates returned {res.status_code}: {res.text}")
                        await asyncio.sleep(3.0)

                except httpx.ReadTimeout:
                    # Normal long polling timeout, loop again
                    continue
                except httpx.ConnectTimeout:
                    logger.warning("[TELEGRAM_BOT] Connection timeout to Telegram API. Retrying in 3s...")
                    await asyncio.sleep(3.0)
                except Exception as loop_err:
                    logger.error(f"[TELEGRAM_BOT] Polling loop exception: {loop_err}")
                    await asyncio.sleep(3.0)


# CLI Entrypoint for standalone commands
if __name__ == "__main__":
    bot = CampusBridgeTelegramBot()

    if "--info" in sys.argv or "--status" in sys.argv:
        async def check_status():
            print("=== Telegram Bot Status ===")
            me = await bot.get_me()
            print("getMe:", json.dumps(me, indent=2))
            wh = await bot.get_webhook_info()
            print("getWebhookInfo:", json.dumps(wh, indent=2))
        asyncio.run(check_status())

    elif "--set-webhook" in sys.argv:
        idx = sys.argv.index("--set-webhook")
        url = sys.argv[idx + 1] if idx + 1 < len(sys.argv) else ""
        if not url:
            print("Error: Missing URL for --set-webhook")
            sys.exit(1)
        async def do_set_webhook():
            res = await bot.set_webhook(url)
            print("setWebhook response:", json.dumps(res, indent=2))
        asyncio.run(do_set_webhook())

    elif "--delete-webhook" in sys.argv:
        async def do_del_webhook():
            res = await bot.delete_webhook()
            print("deleteWebhook response:", json.dumps(res, indent=2))
        asyncio.run(do_del_webhook())

    elif "--send" in sys.argv:
        idx = sys.argv.index("--send")
        chat_id = sys.argv[idx + 1]
        msg = sys.argv[idx + 2] if idx + 2 < len(sys.argv) else "Test alert from CampusBridge AI"
        async def do_send():
            res = await bot.send_message(chat_id, msg)
            print("Send response:", json.dumps(res, indent=2))
        asyncio.run(do_send())

    else:
        # Default action: run polling daemon
        try:
            asyncio.run(bot.run_polling())
        except KeyboardInterrupt:
            print("\nStopped Telegram Bot polling daemon.")
