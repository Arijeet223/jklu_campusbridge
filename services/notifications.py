"""CampusBridge AI — Modular Notification Service (services/notifications.py).

Dual-channel notification architecture supporting:
1. In-App Notifications (PostgreSQL / Excel store)
2. Twilio SMS (Trial-safe Strategy implementation)
3. Telegram Bot Messaging (@campusbridge_bot)

Uses the Strategy Pattern (BaseNotificationProvider) so delivery channels operate
independently. Twilio trial restrictions or unverified phone numbers are caught
gracefully without crashing or blocking Telegram and In-App delivery.
"""

from __future__ import annotations

import asyncio
import logging
import os
import re
import uuid
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import httpx

try:
    from dotenv import load_dotenv
    load_dotenv()
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", "backend", ".env"))
except ImportError:
    pass

logger = logging.getLogger("campusbridge.notifications")

# ═══════════════════════════════════════════════════════════════════════════
# 1. Strategy Pattern Base Provider
# ═══════════════════════════════════════════════════════════════════════════

class BaseNotificationProvider(ABC):
    """Abstract Base Class for notification dispatch channels."""

    @abstractmethod
    async def dispatch(self, recipient: str, message: str) -> Dict[str, Any]:
        """Dispatch a message to the given recipient.
        
        Args:
            recipient: Destination phone number, chat ID, or handle.
            message: Text body of the alert.
            
        Returns:
            Dict containing channel status, delivery result, and metadata.
        """
        pass


# ═══════════════════════════════════════════════════════════════════════════
# 2. Twilio SMS Provider (Trial-Account Safe)
# ═══════════════════════════════════════════════════════════════════════════

class TwilioSMSProvider(BaseNotificationProvider):
    """Dispatches SMS messages via Twilio REST API.
    
    Robustly handles Trial Account restrictions (e.g. unverified numbers,
    template constraints, rate limits) without raising unhandled exceptions.
    """

    def __init__(self) -> None:
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID", "").strip()
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN", "").strip()
        self.from_phone = os.getenv("TWILIO_PHONE_NUMBER", "").strip()
        self._client = None

        if self.account_sid and self.auth_token:
            try:
                from twilio.rest import Client
                self._client = Client(self.account_sid, self.auth_token)
            except Exception as e:
                logger.warning(f"[TWILIO_INIT_WARN] Failed to instantiate Twilio Client: {e}")

    def _normalize_phone(self, phone: str) -> str:
        """Standardize phone format to E.164 (+91...)."""
        clean = re.sub(r"[^\d+]", "", phone.strip())
        if clean.startswith("0"):
            clean = clean[1:]
        if not clean.startswith("+"):
            # Default to India (+91) if 10-digit number is provided
            if len(clean) == 10:
                clean = f"+91{clean}"
            else:
                clean = f"+{clean}"
        return clean

    async def dispatch(self, recipient: str, message: str) -> Dict[str, Any]:
        """Send SMS via Twilio, with trial error capture."""
        if not recipient or not recipient.strip():
            return {
                "channel": "sms",
                "recipient": recipient,
                "success": False,
                "status": "SKIPPED_EMPTY_RECIPIENT",
            }

        target_phone = self._normalize_phone(recipient)

        if not self._client or not self.from_phone:
            logger.warning("[TWILIO_DISPATCH_WARN] Twilio credentials or phone number missing. Skipping SMS.")
            return {
                "channel": "sms",
                "recipient": target_phone,
                "success": False,
                "status": "SKIPPED_MISSING_CREDENTIALS",
            }

        try:
            # Twilio client create is synchronous; run in threadpool executor to remain non-blocking
            loop = asyncio.get_running_loop()
            msg_obj = await loop.run_in_executor(
                None,
                lambda: self._client.messages.create(
                    body=message,
                    from_=self.from_phone,
                    to=target_phone,
                ),
            )
            logger.info(f"[TWILIO_SMS_SUCCESS] Sent SMS to {target_phone} (SID: {msg_obj.sid})")
            return {
                "channel": "sms",
                "recipient": target_phone,
                "success": True,
                "message_sid": msg_obj.sid,
                "status": "DELIVERED",
            }

        except Exception as e:
            # Check for TwilioRestException
            from twilio.base.exceptions import TwilioRestException
            if isinstance(e, TwilioRestException):
                logger.warning(
                    f"[TWILIO_TRIAL_RESTRICTION] Safely caught Twilio trial constraint for {target_phone}: "
                    f"code={e.code}, msg={e.msg}"
                )
                return {
                    "channel": "sms",
                    "recipient": target_phone,
                    "success": False,
                    "status": f"TWILIO_REST_ERROR_{e.code}",
                    "error": str(e.msg),
                }
            logger.warning(f"[TWILIO_SMS_EXCEPTION] Unexpected SMS error for {target_phone}: {e}")
            return {
                "channel": "sms",
                "recipient": target_phone,
                "success": False,
                "status": "FAILED_SMS",
                "error": str(e),
            }


# ═══════════════════════════════════════════════════════════════════════════
# 3. Telegram Bot Provider (@campusbridge_bot)
# ═══════════════════════════════════════════════════════════════════════════

class TelegramProvider(BaseNotificationProvider):
    """Dispatches real-time alerts via Telegram Bot API."""

    def __init__(self) -> None:
        self.bot_token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()

    async def dispatch(self, recipient: str, message: str) -> Dict[str, Any]:
        """Send Markdown formatted message to Telegram chat ID."""
        chat_id = str(recipient).strip()
        if not chat_id:
            return {
                "channel": "telegram",
                "recipient": recipient,
                "success": False,
                "status": "SKIPPED_EMPTY_CHAT_ID",
            }

        if not self.bot_token:
            logger.warning("[TELEGRAM_DISPATCH_WARN] TELEGRAM_BOT_TOKEN missing in environment.")
            return {
                "channel": "telegram",
                "recipient": chat_id,
                "success": False,
                "status": "SKIPPED_MISSING_TOKEN",
            }

        api_url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": message,
            "parse_mode": "Markdown",
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(api_url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    logger.info(f"[TELEGRAM_DISPATCH_SUCCESS] Alert delivered to chat_id={chat_id}")
                    return {
                        "channel": "telegram",
                        "recipient": chat_id,
                        "success": True,
                        "status": "DELIVERED",
                        "message_id": data.get("result", {}).get("message_id"),
                    }
                else:
                    logger.warning(
                        f"[TELEGRAM_DISPATCH_API_ERROR] Status {res.status_code} for chat_id={chat_id}: {res.text}"
                    )
                    return {
                        "channel": "telegram",
                        "recipient": chat_id,
                        "success": False,
                        "status": f"TELEGRAM_HTTP_{res.status_code}",
                        "error": res.text,
                    }
        except Exception as e:
            logger.warning(f"[TELEGRAM_DISPATCH_EXCEPTION] Failed to send Telegram alert to {chat_id}: {e}")
            return {
                "channel": "telegram",
                "recipient": chat_id,
                "success": False,
                "status": "NETWORK_EXCEPTION",
                "error": str(e),
            }


# ═══════════════════════════════════════════════════════════════════════════
# 4. Notification Dispatcher & Broadcast Engine
# ═══════════════════════════════════════════════════════════════════════════

class NotificationDispatcher:
    """Orchestrates in-app notification insertion and concurrent external delivery."""

    def __init__(self) -> None:
        self.sms_provider = TwilioSMSProvider()
        self.telegram_provider = TelegramProvider()

    async def save_in_app_notification(
        self,
        user_id: str,
        title: str,
        message: str,
        tag: str = "Job Drive",
        link: str = "/student/matches",
    ) -> Dict[str, Any]:
        """Persist in-app alert into PostgreSQL and Excel Store."""
        notif_id = f"notif-{uuid.uuid4().hex[:10]}"
        now_iso = datetime.now(timezone.utc).isoformat()

        # 1. Primary: PostgreSQL
        try:
            from backend.db.session import AsyncSessionLocal
            from backend.db.crud import create_notification
            async with AsyncSessionLocal() as session:
                await create_notification(session, {
                    "id": notif_id,
                    "user_id": user_id,
                    "title": title,
                    "message": message,
                    "tag": tag,
                    "link": link,
                    "is_read": False,
                })
                await session.commit()
                logger.info(f"[IN_APP_NOTIF_PG] Saved notification {notif_id} for user {user_id}")
        except Exception as e:
            logger.debug(f"[IN_APP_NOTIF_PG_NOTE] PostgreSQL persistence note: {e}")

        # 2. Two-way fallback: Excel Store
        try:
            from backend.db.excel_store import get_excel_store
            store = get_excel_store()
            store.add_notification(
                user_id=user_id,
                title=title,
                message=message,
                tag=tag,
                link=link,
                notif_id=notif_id,
            )
        except Exception as e:
            logger.debug(f"[IN_APP_NOTIF_EXCEL_NOTE] Excel store note: {e}")

        return {
            "id": notif_id,
            "user_id": user_id,
            "title": title,
            "message": message,
            "is_read": False,
            "tag": tag,
            "link": link,
            "created_at": now_iso,
        }

    async def dispatch_to_student(
        self,
        student_id: str,
        title: str,
        message: str,
        sms_text: Optional[str] = None,
        telegram_text: Optional[str] = None,
        tag: str = "Job Drive",
        link: str = "/student/matches",
        student_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Dispatches an alert to a student across in-app and opted-in external channels."""
        # 1. Always persist In-App notification
        in_app_result = await self.save_in_app_notification(
            user_id=student_id,
            title=title,
            message=message,
            tag=tag,
            link=link,
        )

        # 2. Resolve student contact info & preferences
        data = student_data or {}
        if not data:
            try:
                from backend.db.excel_store import get_excel_store, SHEET_STUDENTS
                store = get_excel_store()
                row = store.get_row(SHEET_STUDENTS, "student_id", student_id)
                if row:
                    data = row
            except Exception:
                pass

        phone_number = data.get("phone_number") or ""
        sms_enabled = bool(data.get("sms_notifications_enabled") in (True, 1, "True", "true", "1"))

        telegram_chat_id = data.get("telegram_chat_id") or data.get("telegram_id") or ""
        telegram_enabled = bool(
            data.get("telegram_notifications_enabled") in (True, 1, "True", "true", "1")
            or data.get("allow_telegram_notifications") in (True, 1, "True", "true", "1")
        )

        tasks = []
        task_names = []

        # Twilio SMS channel
        sms_body = sms_text or f"CampusBridge Alert: {title}\n{message}"
        if sms_enabled and phone_number:
            tasks.append(self.sms_provider.dispatch(phone_number, sms_body))
            task_names.append("sms")

        # Telegram channel
        tg_body = telegram_text or f"🔔 *CampusBridge Alert*\n\n*{title}*\n{message}"
        if telegram_enabled and telegram_chat_id:
            tasks.append(self.telegram_provider.dispatch(telegram_chat_id, tg_body))
            task_names.append("telegram")

        channel_results = {}
        if tasks:
            results = await asyncio.gather(*tasks, return_exceptions=True)
            for name, res in zip(task_names, results):
                if isinstance(res, Exception):
                    channel_results[name] = {"success": False, "error": str(res)}
                else:
                    channel_results[name] = res

        return {
            "student_id": student_id,
            "in_app": in_app_result,
            "external_channels": channel_results,
        }

    async def broadcast_new_jd_alert(
        self,
        company_name: str,
        role_title: str,
        min_cgpa: float = 7.0,
        ctc_band: str = "Competitive",
        job_id: str = "",
    ) -> List[Dict[str, Any]]:
        """Broadcasts a placement drive notification to registered students."""
        title = f"New Placement Drive: {company_name} — {role_title}"
        message = (
            f"A new placement opportunity at {company_name} for the role of {role_title} has been published. "
            f"Min CGPA: {min_cgpa}. CTC: {ctc_band}. Check your match alignment and apply now!"
        )
        sms_text = (
            f"CampusBridge Alert: New placement drive uploaded for {company_name} - {role_title}! "
            f"Min CGPA: {min_cgpa}. Check your eligibility & apply now!"
        )
        telegram_text = (
            f"🎯 *CampusBridge Placement Alert*\n\n"
            f"New placement drive uploaded for *{company_name}* — *{role_title}*!\n"
            f"• *Min CGPA Required*: {min_cgpa}\n"
            f"• *Package Band*: {ctc_band}\n\n"
            f"Check your eligibility & apply now on CampusBridge!"
        )
        link = "/student/matches"

        # Fetch students from excel store
        students: List[Dict[str, Any]] = []
        try:
            from backend.db.excel_store import get_excel_store, SHEET_STUDENTS
            store = get_excel_store()
            students = store.get_all_rows(SHEET_STUDENTS)
        except Exception as e:
            logger.warning(f"[BROADCAST_STUDENT_QUERY_WARN] Could not read students: {e}")

        # Fallback: if empty, default to active demo student STU-101
        if not students:
            students = [{
                "student_id": "STU-101",
                "full_name": "Arijeet Basak",
                "phone_number": "+919358817045",
                "sms_notifications_enabled": True,
                "telegram_chat_id": "9358817045",
                "telegram_notifications_enabled": True,
            }]

        broadcast_outcomes = []
        for s in students:
            sid = str(s.get("student_id") or "STU-101")
            outcome = await self.dispatch_to_student(
                student_id=sid,
                title=title,
                message=message,
                sms_text=sms_text,
                telegram_text=telegram_text,
                tag="Job Drive",
                link=link,
                student_data=s,
            )
            broadcast_outcomes.append(outcome)

        logger.info(f"[BROADCAST_COMPLETE] Dispatched new JD alerts to {len(broadcast_outcomes)} students.")
        return broadcast_outcomes


# Global Singleton Dispatcher
_NOTIFICATION_DISPATCHER: Optional[NotificationDispatcher] = None

def get_notification_dispatcher() -> NotificationDispatcher:
    global _NOTIFICATION_DISPATCHER
    if _NOTIFICATION_DISPATCHER is None:
        _NOTIFICATION_DISPATCHER = NotificationDispatcher()
    return _NOTIFICATION_DISPATCHER
