import json
import time
import os
import re
from typing import Optional
from fastapi import APIRouter, Query, HTTPException, Response
from livekit.api import AccessToken, VideoGrants, RoomConfiguration, RoomAgentDispatch

try:
    import edge_tts
    EDGE_TTS_AVAILABLE = True
except ImportError:
    EDGE_TTS_AVAILABLE = False

router = APIRouter(prefix="/voice", tags=["voice"])

LIVEKIT_URL = os.getenv("LIVEKIT_URL", "wss://first-w4gv5xp4.livekit.cloud")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY", "APINi6TrE9hzACu")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET", "Qhdedtc0cFM0jJ9nBF7n6J3bqzz1ifR4kTY6Ro32zI7")

# Distinct Multi-Voice Neural Persona Mappings (edge-tts)
AGENT_VOICE_CONFIG = {
    "JARVIS": {"voice": "en-GB-RyanNeural", "rate": "+8%"},
    "TERRA": {"voice": "en-US-AriaNeural", "rate": "+5%"},
    "RONEN": {"voice": "en-US-ChristopherNeural", "rate": "+6%"},
    "VECTOR": {"voice": "en-US-GuyNeural", "rate": "+5%"},
    "ATHENA": {"voice": "en-US-GuyNeural", "rate": "+5%"},
    "INTERVIEWER": {"voice": "en-US-GuyNeural", "rate": "+5%"},
    "DEFAULT": {"voice": "en-GB-RyanNeural", "rate": "+8%"},
}


def sanitize_spoken_text(raw_text: str) -> str:
    """Preprocesses conversational text for natural, punchy neural speech synthesis."""
    if not raw_text:
        return ""

    # Remove markdown code blocks, links, tables, citations, and agent prefixes
    text = re.sub(r"```[\s\S]*?```", " Code block omitted. ", raw_text)
    text = re.sub(r"`([^`]+)`", r"\1", text)
    text = re.sub(r"\[(?:📄|chunk-|⚡|https?://)[^\]]+\]", "", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    text = re.sub(r"\*([^*]+)\*", r"\1", text)
    text = re.sub(r"#{1,6}\s+", "", text)
    text = re.sub(r"\|[^\n]+\|", "", text)
    text = re.sub(r"^(?:🤖|🌿|🛡️|⚡|⏱️)\s*\*\*[^*]+\*\*:\s*", "", text)
    text = re.sub(r"---[\s\S]*", "", text)  # Drop post-separator specialist dumps in voice

    # Remove emojis and non-alphanumeric unicode clutter
    text = re.sub(r"[\U00010000-\U0010ffff]", "", text)
    text = re.sub(r"[🤖🌿🛡️⚡⏱️📊🔍💡✨✓📎❌✅👋]", "", text)
    text = re.sub(r"\s+", " ", text).strip()

    # Limit spoken speech to first 2-3 punchy sentences
    sentences = re.split(r"(?<=[.!?])\s+", text)
    spoken_sentences = sentences[:3] if len(sentences) > 3 else sentences
    return " ".join(spoken_sentences).strip()


@router.get("/speak")
@router.post("/speak")
async def synthesize_speech(
    text: str = Query(..., description="Text to synthesize with neural TTS"),
    agent: str = Query("JARVIS", description="Agent persona (JARVIS, TERRA, RONEN, VECTOR, ATHENA)"),
):
    """
    Streams or returns high-fidelity MP3 neural audio using edge-tts.
    Uses distinct voices per agent:
    - J.A.R.V.I.S.: en-GB-RyanNeural (+8% tactical rhythm)
    - T.E.R.R.A.: en-US-AriaNeural (+5% analytical)
    - R.O.N.E.N.: en-US-ChristopherNeural (+6% authoritative)
    - V.E.C.T.O.R. / ATHENA: en-US-GuyNeural (+5% FAANG coach)
    """
    clean_text = sanitize_spoken_text(text)
    if not clean_text:
        clean_text = "I'm ready to assist with your placement readiness."

    agent_key = (agent or "JARVIS").upper().replace(".", "").strip()
    voice_cfg = AGENT_VOICE_CONFIG.get(agent_key) or AGENT_VOICE_CONFIG["DEFAULT"]
    voice_name = voice_cfg["voice"]
    voice_rate = voice_cfg["rate"]

    if not EDGE_TTS_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="edge-tts is not available on this server.",
        )

    try:
        communicate = edge_tts.Communicate(clean_text, voice_name, rate=voice_rate)
        audio_buffer = bytearray()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_buffer.extend(chunk["data"])

        return Response(
            content=bytes(audio_buffer),
            media_type="audio/mpeg",
            headers={
                "Cache-Control": "public, max-age=3600",
                "X-Agent-Persona": agent_key,
                "X-Voice-Used": voice_name,
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Neural TTS synthesis failed: {str(e)}")


@router.get("/token")
async def get_voice_token(
    student_id: str = Query("STU-101", description="Student ID for room context"),
    student_name: Optional[str] = Query(None, description="Candidate display name"),
    job_id: Optional[str] = Query(None, description="Optional Job ID to trigger recruiter persona with dynamic JD RAG"),
    room: Optional[str] = Query(None, description="Optional custom room name"),
    agent_name: Optional[str] = Query(None, description="Target LiveKit agent name (defaults to campusbridge-local)"),
):
    """
    Dispatches a signed JWT AccessToken for real-time WebRTC LiveKit voice connection
    to J.A.R.V.I.S. with dynamic unique room name, job metadata, and explicit agent dispatch
    to 'campusbridge-local'.
    """
    try:
        if not LIVEKIT_API_KEY or not LIVEKIT_API_SECRET:
            raise HTTPException(status_code=500, detail="LiveKit API credentials missing on cloud backend")

        # Normalize parameters for direct function calls and HTTP queries
        clean_student_id = student_id if isinstance(student_id, str) else "STU-101"
        clean_job_id = job_id.strip() if isinstance(job_id, str) and job_id.strip() else None
        clean_room = room.strip() if isinstance(room, str) and room.strip() else None
        target_agent = (agent_name if isinstance(agent_name, str) and agent_name.strip() else os.getenv("LIVEKIT_AGENT_NAME", "campusbridge-local")).strip()

        # Resolve student name if missing
        display_name = student_name if isinstance(student_name, str) else None
        if not display_name:
            try:
                from backend.db.excel_store import excel_store
                student = excel_store.get_student_by_id(clean_student_id)
                if student:
                    display_name = student.get("full_name") or student.get("name")
            except Exception:
                pass
        if not display_name:
            display_name = "Aarav Sharma"

        # Dynamic unique room name per session prevents stale LiveKit Cloud room reuse
        clean_job_suffix = f"-{clean_job_id}" if clean_job_id else ""
        unique_room = clean_room or f"campusbridge-{clean_student_id}{clean_job_suffix}-{int(time.time())}"

        # Construct room and agent metadata payload
        metadata_dict = {
            "student_id": clean_student_id,
            "student_name": display_name,
        }
        if clean_job_id:
            metadata_dict["job_id"] = clean_job_id

        metadata_json = json.dumps(metadata_dict)

        grants = VideoGrants(
            room_join=True,
            room=unique_room,
            can_publish=True,
            can_subscribe=True,
            can_publish_data=True,
        )

        token = (
            AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
            .with_identity(clean_student_id)
            .with_name(display_name)
            .with_metadata(metadata_json)
            .with_grants(grants)
            .with_room_config(
                RoomConfiguration(
                    agents=[
                        RoomAgentDispatch(
                            agent_name=target_agent,
                            metadata=metadata_json,
                        )
                    ]
                )
            )
            .to_jwt()
        )

        return {
            "token": token,
            "room_name": unique_room,
            "room": unique_room,
            "url": LIVEKIT_URL,
            "identity": clean_student_id,
            "name": display_name,
            "agent_dispatched": target_agent,
            "job_id": clean_job_id,
            "metadata": metadata_dict,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate voice token: {str(e)}")


@router.get("/worker-config")
async def get_worker_config():
    """Returns LiveKit Cloud connection metadata for local GPU workers (campusbridge-local)."""
    return {
        "status": "CONFIGURED" if (LIVEKIT_API_KEY and LIVEKIT_API_SECRET) else "MISSING_CREDENTIALS",
        "livekit_url": LIVEKIT_URL,
        "default_agent_name": os.getenv("LIVEKIT_AGENT_NAME", "campusbridge-local"),
        "cloud_backend": True,
        "server_time": time.time(),
    }


@router.get("/worker-token")
async def get_worker_token(
    worker_name: str = Query("campusbridge-local", description="Local worker agent identifier"),
    room: Optional[str] = Query(None, description="Optional room restriction"),
):
    """Generates an authenticated agent worker token for the local machine LiveKit worker."""
    if not LIVEKIT_API_KEY or not LIVEKIT_API_SECRET:
        raise HTTPException(status_code=500, detail="LiveKit credentials missing on cloud backend")

    try:
        grants = VideoGrants(
            agent=True,
            room_join=bool(room),
            room=room,
            room_list=True,
            can_publish=True,
            can_subscribe=True,
            can_publish_data=True,
        )

        token = (
            AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
            .with_identity(f"agent-{worker_name}")
            .with_name(f"CampusBridge Voice Worker ({worker_name})")
            .with_grants(grants)
            .to_jwt()
        )

        return {
            "token": token,
            "livekit_url": LIVEKIT_URL,
            "agent_name": worker_name,
            "identity": f"agent-{worker_name}",
            "room": room,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate worker token: {str(e)}")


@router.get("/health")
async def voice_health():
    """Reports LiveKit Cloud integration health."""
    has_creds = bool(LIVEKIT_API_KEY and LIVEKIT_API_SECRET and LIVEKIT_URL)
    return {
        "status": "ONLINE" if has_creds else "DEGRADED",
        "livekit_url": LIVEKIT_URL,
        "agent_name": os.getenv("LIVEKIT_AGENT_NAME", "campusbridge-local"),
        "edge_tts_available": EDGE_TTS_AVAILABLE,
        "cloud_dispatch_ready": has_creds,
    }
