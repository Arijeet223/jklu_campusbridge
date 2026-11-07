"""CampusBridge AI — LiveKit Real-Time Multi-Modal Voice Agent Worker.

Powered by LiveKit Agents v1.8+, Silero VAD, STT, TTS, and local Qwen 2.5 / OpenAI.
Orchestrates real-time voice consultations for campus placement preparation.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Add project root and backend to system path for standalone execution
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
BACKEND_DIR = PROJECT_ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import asyncio
import json
import logging
import os
from typing import Any

from dotenv import load_dotenv

# Load credentials from backend/.env if present
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    load_dotenv(env_path)
load_dotenv()

from livekit import rtc
from livekit.agents import (
    AutoSubscribe,
    JobContext,
    WorkerOptions,
    cli,
    llm,
)
from livekit.agents.voice import Agent, AgentSession
from livekit.plugins import silero

try:
    from livekit.plugins import deepgram
    DEEPGRAM_AVAILABLE = True
except ImportError:
    DEEPGRAM_AVAILABLE = False

try:
    from livekit.plugins import cartesia
    CARTESIA_AVAILABLE = True
except ImportError:
    CARTESIA_AVAILABLE = False

try:
    from livekit.plugins import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

try:
    from backend.db.excel_store import get_excel_store, SHEET_STUDENTS, SHEET_EVIDENCE
except ModuleNotFoundError:
    from db.excel_store import get_excel_store, SHEET_STUDENTS, SHEET_EVIDENCE

logger = logging.getLogger("campusbridge-voice-agent")
logging.basicConfig(level=logging.INFO)

LIVEKIT_URL = os.environ.get("LIVEKIT_URL", "wss://first-w4gv5xp4.livekit.cloud")
LIVEKIT_API_KEY = os.environ.get("LIVEKIT_API_KEY", "APINi6TrE9hzACu")
LIVEKIT_API_SECRET = os.environ.get("LIVEKIT_API_SECRET", "Qhdedtc0cFM0jJ9nBF7n6J3bqzz1ifR4kTY6Ro32zI7")


def get_student_voice_profile(student_id: str) -> dict[str, Any]:
    """Retrieve verified candidate academic and evidence standing."""
    try:
        store = get_excel_store()
        students = store.get_sheet(SHEET_STUDENTS)
        student = next(
            (s for s in students if str(s.get("student_id", "")).strip().lower() == student_id.lower()
             or str(s.get("email", "")).strip().lower() == student_id.lower()),
            None,
        )
        if student:
            evidence = store.get_sheet(SHEET_EVIDENCE)
            matched_ev = [
                str(e.get("skill_name", ""))
                for e in evidence
                if str(e.get("student_id", "")).strip().lower() == student_id.lower()
            ]
            return {
                "name": student.get("full_name", "Candidate"),
                "program": student.get("program", "B.Tech Computer Science"),
                "cgpa": float(student.get("cgpa", 8.42)),
                "readiness": int(student.get("readiness_index", 85)),
                "target_role": student.get("target_roles", "AI / Software Engineer"),
                "skills": matched_ev[:6] if matched_ev else ["Python", "SQL", "Docker"],
            }
    except Exception as e:
        logger.warning(f"Could not load profile from excel store: {e}")

    return {
        "name": "Candidate",
        "program": "B.Tech Computer Science",
        "cgpa": 8.42,
        "readiness": 88,
        "target_role": "AI / Software Engineer",
        "skills": ["Python", "PyTorch", "SQL", "FastAPI", "Docker"],
    }


def create_agent_instructions(profile: dict[str, Any]) -> str:
    name = profile["name"]
    program = profile["program"]
    cgpa = profile["cgpa"]
    readiness = profile["readiness"]
    role = profile["target_role"]
    top_skills = ", ".join(profile["skills"][:5])

    return f"""You are J.A.R.V.I.S., the Lead AI Career & Placement Orchestrator for CampusBridge AI.
You are speaking via real-time WebRTC audio with {name}, a {program} student with {cgpa:.2f} CGPA and {readiness}% readiness index.
Their target career role is {role}, and their top verified skills include {top_skills}.

Conversational Guidelines:
1. Speak as a sharp, warm, and encouraging senior engineer peer.
2. Keep your spoken responses crisp, natural, and punchy: 1 to 3 sentences maximum per turn.
3. Never recite long lists, Markdown tables, or rigid bullet points over audio.
4. When discussing their 72-hour placement sprint, break it down conversationally (e.g., 'You have a 15-minute SQL challenge and your 2-minute project defense left before Friday's drive. Ready to practice?').
5. When skills or document evidence are mentioned, acknowledge your partner agent T.E.R.R.A.: 'That's right in T.E.R.R.A.'s domain—she verified your {top_skills} extractions.'
6. When company eligibility or academic cutoffs are asked, reference R.O.N.E.N.: 'R.O.N.E.N. ran your {cgpa:.2f} CGPA against institutional gates and you're fully cleared.'
7. Support natural interruptions and conversational barge-in gracefully.
"""


async def entrypoint(ctx: JobContext):
    """LiveKit Agents entrypoint: initializes room connection and voice assistant."""
    logger.info(f"Connecting to LiveKit room: {ctx.room.name}")
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # Extract student ID from room name (format: campusbridge-{student_id}-{timestamp} or campusbridge-{student_id})
    room_name = ctx.room.name or "campusbridge-STU-101"
    clean_name = room_name.replace("campusbridge-", "").strip()
    parts = clean_name.split("-")
    if len(parts) >= 2 and parts[0].upper().startswith("STU"):
        student_id = f"{parts[0]}-{parts[1]}"
    elif len(parts) >= 1 and parts[0]:
        student_id = parts[0]
    else:
        student_id = "STU-101"
    profile = get_student_voice_profile(student_id)
    instructions = create_agent_instructions(profile)

    logger.info(f"Configuring voice agent for {profile['name']} ({student_id})")

    # 1. Silero VAD
    vad = silero.VAD.load()

    # 2. STT Setup
    stt = None
    if DEEPGRAM_AVAILABLE and os.environ.get("DEEPGRAM_API_KEY"):
        stt = deepgram.STT()
    elif OPENAI_AVAILABLE and os.environ.get("OPENAI_API_KEY"):
        stt = openai.STT()
    else:
        logger.warning("No DEEPGRAM_API_KEY or OPENAI_API_KEY found. STT might fail unless configured.")

    # 3. TTS Setup
    tts = None
    if CARTESIA_AVAILABLE and os.environ.get("CARTESIA_API_KEY"):
        tts = cartesia.TTS(voice="79a125e8-cd45-4c13-8a67-188112f4dd22")
    elif OPENAI_AVAILABLE and os.environ.get("OPENAI_API_KEY"):
        tts = openai.TTS(voice="alloy")
    else:
        logger.warning("No CARTESIA_API_KEY or OPENAI_API_KEY found. TTS might fail unless configured.")

    # 4. LLM Setup (Qwen 2.5 local or OpenAI)
    llm_instance = None
    if OPENAI_AVAILABLE:
        base_url = os.environ.get("LLM_BASE_URL", "http://localhost:11434/v1")
        model = os.environ.get("LLM_MODEL", "qwen2.5:latest")
        api_key = os.environ.get("OPENAI_API_KEY", "ollama")
        llm_instance = openai.LLM(
            base_url=base_url,
            model=model,
            api_key=api_key,
        )

    # 5. Pipeline Voice Agent
    agent = Agent(
        instructions=instructions,
    )

    session = AgentSession(
        vad=vad,
        stt=stt,
        llm=llm_instance,
        tts=tts,
        allow_interruptions=True,
    )

    # Start audio session in the room
    await session.start(agent, room=ctx.room)

    # Initial spoken greeting
    greeting_text = f"Hey {profile['name']}! 👋 J.A.R.V.I.S. here on real-time voice. Ready to check your readiness or 72-hour sprint?"
    await session.say(greeting_text)

def start_worker():
    """Launch the LiveKit voice agent worker process without restricted agent_name."""
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            ws_url=LIVEKIT_URL,
            api_key=LIVEKIT_API_KEY,
            api_secret=LIVEKIT_API_SECRET,
            agent_name="campusbridge-local",
        )
    )


if __name__ == "__main__":
    start_worker()