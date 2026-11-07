'use client'

import { useState, useEffect } from 'react'
import {
  LiveKitRoom,
  RoomAudioRenderer,
  BarVisualizer,
  useVoiceAssistant,
  useLocalParticipant,
} from '@livekit/components-react'
import { Mic, MicOff, PhoneOff, Sparkles, Volume2, X, AlertCircle } from 'lucide-react'

interface LiveKitVoiceModalProps {
  isOpen: boolean
  onClose: () => void
  studentId: string
  studentName: string
}

function InnerVoiceSession({
  studentName,
  onDisconnect,
}: {
  studentName: string
  onDisconnect: () => void
}) {
  const { state, audioTrack, agentTranscriptions } = useVoiceAssistant()
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant()
  const [isMuted, setIsMuted] = useState(!isMicrophoneEnabled)

  useEffect(() => {
    setIsMuted(!isMicrophoneEnabled)
  }, [isMicrophoneEnabled])

  const toggleMic = async () => {
    if (localParticipant) {
      const nextState = !isMicrophoneEnabled
      await localParticipant.setMicrophoneEnabled(nextState)
      setIsMuted(!nextState)
    }
  }

  const getStatusText = () => {
    switch (state) {
      case 'listening':
        return 'Listening to you... Speak naturally'
      case 'thinking':
        return 'Thinking & retrieving knowledge...'
      case 'speaking':
        return 'J.A.R.V.I.S. is speaking'
      case 'connecting':
        return 'Connecting to neural voice agent...'
      case 'initializing':
        return 'Initializing WebRTC media pipelines...'
      default:
        return 'LiveKit WebRTC Audio Active'
    }
  }

  const getStatusBadge = () => {
    switch (state) {
      case 'listening':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          dot: 'bg-emerald-500 animate-ping',
          label: 'Listening',
        }
      case 'thinking':
        return {
          bg: 'bg-purple-50 border-purple-200 text-purple-800',
          dot: 'bg-purple-500 animate-pulse',
          label: 'Reasoning',
        }
      case 'speaking':
        return {
          bg: 'bg-sky-50 border-sky-200 text-sky-800',
          dot: 'bg-sky-500 animate-bounce',
          label: 'Speaking',
        }
      default:
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          dot: 'bg-amber-500',
          label: 'Ready',
        }
    }
  }

  const badge = getStatusBadge()
  const lastTranscript = agentTranscriptions?.[agentTranscriptions.length - 1]?.text

  return (
    <div className="flex flex-col items-center justify-between p-6 h-[460px]">
      {/* Top Status */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <div>
            <div className="text-xs font-bold text-ink-primary font-display flex items-center gap-1.5">
              <span>J.A.R.V.I.S. Real-Time Voice Agent</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                {badge.label}
              </span>
            </div>
            <p className="text-[11px] text-ink-muted">Candidate: {studentName} • Interruptible Barge-In</p>
          </div>
        </div>
      </div>

      {/* Central Animated Orb & Waveform */}
      <div className="flex flex-col items-center justify-center my-auto w-full">
        {/* Pulsing Visual Orb */}
        <div className="relative flex items-center justify-center w-36 h-36">
          <div
            className={`absolute inset-0 rounded-full transition-all duration-700 ${
              state === 'speaking'
                ? 'bg-sky-400/20 scale-125 animate-pulse'
                : state === 'listening'
                ? 'bg-emerald-400/20 scale-110 animate-ping'
                : state === 'thinking'
                ? 'bg-purple-400/20 scale-115 animate-spin-slow'
                : 'bg-oxford/10 scale-100'
            }`}
          />
          <div
            className={`absolute inset-3 rounded-full transition-all duration-500 ${
              state === 'speaking'
                ? 'bg-sky-300/30 scale-110'
                : state === 'listening'
                ? 'bg-emerald-300/30 scale-105'
                : state === 'thinking'
                ? 'bg-purple-300/30 scale-110'
                : 'bg-oxford/15'
            }`}
          />
          <div
            className={`relative flex items-center justify-center w-24 h-24 rounded-full shadow-lg transition-transform duration-300 ${
              state === 'speaking'
                ? 'bg-gradient-to-tr from-sky-500 to-indigo-600 text-white scale-105 shadow-sky-200'
                : state === 'listening'
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white scale-105 shadow-emerald-200'
                : state === 'thinking'
                ? 'bg-gradient-to-tr from-purple-500 to-rose-600 text-white scale-105 shadow-purple-200'
                : 'bg-gradient-to-tr from-slate-700 to-slate-900 text-white shadow-slate-200'
            }`}
          >
            {state === 'speaking' ? (
              <Volume2 className="w-10 h-10 animate-pulse" />
            ) : state === 'thinking' ? (
              <Sparkles className="w-10 h-10 animate-spin-slow" />
            ) : (
              <Mic className="w-10 h-10" />
            )}
          </div>
        </div>

        {/* Status Prompt */}
        <p className="mt-4 text-xs font-semibold text-ink-primary tracking-wide text-center">
          {getStatusText()}
        </p>

        {/* Live Bar Visualizer */}
        <div className="mt-3 w-48 h-8 flex items-center justify-center gap-1">
          {audioTrack ? (
            <BarVisualizer
              state={state}
              trackRef={audioTrack}
              barCount={7}
              className="flex items-center justify-center gap-1.5 h-6"
            />
          ) : (
            <div className="flex items-center gap-1 h-6">
              {[40, 70, 100, 85, 60, 90, 50].map((h, i) => (
                <span
                  key={i}
                  style={{ height: `${h}%` }}
                  className={`w-1 rounded-full transition-all duration-300 ${
                    state === 'speaking'
                      ? 'bg-sky-500 animate-pulse'
                      : state === 'listening'
                      ? 'bg-emerald-500 animate-pulse'
                      : 'bg-border-hairline'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Live Agent Transcript Preview */}
        {lastTranscript && (
          <div className="mt-2 max-w-sm rounded-lg bg-surface/90 border border-border-hairline px-3 py-1.5 text-center shadow-2xs">
            <p className="text-[11px] text-ink-secondary italic line-clamp-2">
              "{lastTranscript}"
            </p>
          </div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className="flex items-center justify-center gap-4 w-full pt-4 border-t border-border-hairline">
        <button
          type="button"
          onClick={toggleMic}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs border transition-all cursor-pointer shadow-2xs active:translate-y-0.5 ${
            isMuted
              ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
              : 'bg-surface border-border-hairline text-ink-primary hover:bg-subtle'
          }`}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <MicOff className="w-4 h-4 text-rose-600" /> : <Mic className="w-4 h-4 text-emerald-600" />}
          <span>{isMuted ? 'Microphone Muted' : 'Mute'}</span>
        </button>

        <button
          type="button"
          onClick={onDisconnect}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-xs bg-rose-600 hover:bg-rose-700 text-white transition-all cursor-pointer shadow-2xs active:translate-y-0.5"
          title="Disconnect LiveKit Voice Session"
        >
          <PhoneOff className="w-4 h-4" />
          <span>End Call</span>
        </button>
      </div>
    </div>
  )
}

export default function LiveKitVoiceModal({
  isOpen,
  onClose,
  studentId,
  studentName,
}: LiveKitVoiceModalProps) {
  const [token, setToken] = useState<string | null>(null)
  const [url, setUrl] = useState<string>('wss://first-w4gv5xp4.livekit.cloud')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setToken(null)
      setError(null)
      return
    }

    let isMounted = true
    setLoading(true)
    setError(null)

    // Request voice JWT from API route or backend
    fetch(`/api/v1/voice/token?student_id=${encodeURIComponent(studentId)}&student_name=${encodeURIComponent(studentName)}`)
      .then(async (res) => {
        if (!res.ok) {
          // Fallback to Next.js route
          return fetch(`/api/livekit-token?student_id=${encodeURIComponent(studentId)}&student_name=${encodeURIComponent(studentName)}`)
        }
        return res
      })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return
        if (data.token) {
          setToken(data.token)
          if (data.url) setUrl(data.url)
        } else {
          setError(data.error || 'Failed to obtain signed LiveKit token')
        }
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err.message || 'Could not connect to LiveKit token dispatcher')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, studentId, studentName])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in-50 duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-border-hairline bg-surface shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-hairline bg-canvas">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-oxford/10 text-oxford">🎙️</span>
            <div>
              <h3 className="text-xs font-bold text-ink-primary font-display">
                Real-Time Voice Assistant
              </h3>
              <p className="text-[10px] text-ink-muted">
                Powered by LiveKit WebRTC & Qwen 2.5
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink-primary hover:bg-subtle transition-colors"
            aria-label="Close voice modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 h-[420px] text-center">
            <div className="w-10 h-10 border-2 border-oxford border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-xs font-semibold text-ink-primary">
              Connecting to LiveKit Cloud...
            </p>
            <p className="text-[11px] text-ink-muted mt-1">
              Establishing audio session for {studentName} ({studentId})
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-8 h-[420px] text-center">
            <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
            <p className="text-xs font-semibold text-rose-900">
              Connection Error
            </p>
            <p className="text-[11px] text-ink-muted mt-1 max-w-xs">
              {error}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 px-4 py-2 rounded-xl text-xs font-medium bg-oxford text-white hover:bg-oxford/90 shadow-2xs"
            >
              Close
            </button>
          </div>
        ) : token ? (
          <LiveKitRoom
            serverUrl={url}
            token={token}
            connect={true}
            audio={true}
            video={false}
            onDisconnected={onClose}
          >
            <RoomAudioRenderer />
            <InnerVoiceSession studentName={studentName} onDisconnect={onClose} />
          </LiveKitRoom>
        ) : null}
      </div>
    </div>
  )
}

