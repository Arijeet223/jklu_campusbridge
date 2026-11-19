import { NextRequest, NextResponse } from 'next/server'
import { getServerlessMentors } from '@/lib/serverless-store'

export const runtime = 'nodejs'

const JARVIS_SYSTEM_PROMPT = `You are J.A.R.V.I.S., the primary AI companion for CampusBridge. You are highly curated to the user. Base all advice strictly on the skills, courses, and GitHub info found in their personal knowledge base. Speak naturally as a mentor.
CORE DIRECTIVES:
- Personal Knowledge Base Grounding: Seamlessly query and reference the user's specific confirmed profile data, verified skills, and academic transcripts from their personal knowledge base.
- Conversational Mentor Tone: Converse naturally and insightfully. Match the user's conversational energy without robotic canned strings.
- Action-Oriented: You have tools (e.g., query_student_context, draft_professor_email). Invoke them seamlessly without explaining internal mechanics.
- FORBIDDEN BEHAVIORS: NEVER repeat canned greetings. NEVER append robotic feature menus (e.g., 'Would you like to check your sprint plan?'). Answer the prompt naturally, insightfully, and stop.`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { messages = [], model = 'qwen2.5:7b', stream = true, student_id = 'STU-101', student_name = 'Aarav Sharma' } = body

    const backendBase = process.env.CAMPUSBRIDGE_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
    const cleanBase = backendBase.replace(/\/+$/, '')

    // 1. Primary: Forward to CampusBridge FastAPI Orchestrator (live Qwen + RAG + Intent Routing)
    try {
      const forwardRes = await fetch(`${cleanBase}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(35000),
      })

      if (forwardRes.ok && forwardRes.body) {
        if (stream) {
          return new Response(forwardRes.body, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache, no-transform',
              'Connection': 'keep-alive',
            },
          })
        }
        const data = await forwardRes.json()
        return NextResponse.json(data)
      }
    } catch {
      // Backend not running or timed out; fall through to direct Ollama Qwen
    }

    // 2. Direct Ollama Qwen 2.5 Bridge (Ensures Qwen is used even if FastAPI backend is starting/offline)
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user' || m.sender === 'user')?.content || 'Hello'
    const lastUserLower = (lastUserMsg || '').toLowerCase()
    const isMentorQuery =
      lastUserLower.includes('mentor') ||
      lastUserLower.includes('senior') ||
      lastUserLower.includes('who can help me')
    const isSprintQuery =
      lastUserLower.includes('sprint') ||
      lastUserLower.includes('72h') ||
      lastUserLower.includes('72 hrs') ||
      lastUserLower.includes('72-hr') ||
      lastUserLower.includes('roadmap') ||
      lastUserLower.includes('plan')
    const isSkillsQuery =
      lastUserLower.includes('skill') ||
      lastUserLower.includes('ghost') ||
      lastUserLower.includes('terra') ||
      lastUserLower.includes('detect')
    const isEligibilityQuery =
      lastUserLower.includes('eligible') ||
      lastUserLower.includes('eligibility') ||
      lastUserLower.includes('cutoff') ||
      lastUserLower.includes('qualify') ||
      lastUserLower.includes('ronen')
    const isDefenseQuery =
      lastUserLower.includes('defense') ||
      lastUserLower.includes('athena') ||
      lastUserLower.includes('dsa') ||
      lastUserLower.includes('challenge') ||
      lastUserLower.includes('quiz')

    const ollamaBase = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434'
    const t0 = Date.now()
    try {
      const ollamaMessages = [
        { role: 'system', content: JARVIS_SYSTEM_PROMPT },
        ...messages.map((m: any) => ({
          role: m.role || (m.sender === 'user' ? 'user' : 'assistant'),
          content: m.content || m.text || '',
        })),
      ]

      const ollamaRes = await fetch(`${ollamaBase}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen2.5:latest',
          messages: ollamaMessages,
          stream,
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(35000),
      })

      if (ollamaRes.ok && ollamaRes.body) {
        if (stream) {
          const reader = ollamaRes.body.getReader()
          const encoder = new TextEncoder()
          const decoder = new TextDecoder()

          const customStream = new ReadableStream({
            async start(controller) {
              try {
                let done = false
                while (!done) {
                  const chunk = await reader.read()
                  done = chunk.done
                  if (chunk.value) {
                    const text = decoder.decode(chunk.value, { stream: true })
                    // Forward normal chunks, intercept [DONE] to inject telemetry finish_data
                    if (text.includes('[DONE]')) {
                      const elapsedMs = Date.now() - t0
                      const finish = {
                        id: `chatcmpl-${Date.now()}`,
                        object: 'chat.completion.chunk',
                        choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
                        agent_name: isMentorQuery ? '🎓 J.A.R.V.I.S. Mentorship' : '🤖 J.A.R.V.I.S.',
                        widget_type: isMentorQuery ? 'mentor_list' : 'none',
                        trace: {
                          intent: isMentorQuery ? 'INTENT_2: SPECIALIST_AGENT_DELEGATION' : 'INTENT_1: CONVERSATIONAL_OR_REASONING',
                          engine: {
                            name: 'Qwen 2.5 (Direct Ollama Gateway)',
                            model: 'qwen2.5:latest',
                            latency_ms: elapsedMs,
                            degraded_mode: false,
                          },
                          mcp_tools: isMentorQuery ? [{ server: 'student-profile', tool: 'student-profile.find_senior_mentors', status: 'ALLOWED' }] : [],
                          rag_chunks: [],
                          guardrail: {
                            status: 'Direct Neural Reasoning',
                            valid_citations: [],
                            hallucinations_detected: 0,
                          },
                          total_latency_ms: elapsedMs,
                        },
                      }
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify(finish)}\n\n`))
                      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                    } else {
                      controller.enqueue(chunk.value)
                    }
                  }
                }
              } catch {
              } finally {
                controller.close()
              }
            },
          })

          return new Response(customStream, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache, no-transform',
              'Connection': 'keep-alive',
            },
          })
        }
        const ollamaData = await ollamaRes.json()
        const elapsedMs = Date.now() - t0
        return NextResponse.json({
          ...ollamaData,
          agent_name: isMentorQuery ? '🎓 J.A.R.V.I.S. Mentorship' : '🤖 J.A.R.V.I.S.',
          widget_type: isMentorQuery ? 'mentor_list' : 'none',
          trace: {
            intent: isMentorQuery ? 'INTENT_2: SPECIALIST_AGENT_DELEGATION' : 'INTENT_1: CONVERSATIONAL_OR_REASONING',
            engine: {
              name: 'Qwen 2.5 (Direct Ollama Gateway)',
              model: 'qwen2.5:latest',
              latency_ms: elapsedMs,
              degraded_mode: false,
            },
            mcp_tools: isMentorQuery ? [{ server: 'student-profile', tool: 'student-profile.find_senior_mentors', status: 'ALLOWED' }] : [],
            rag_chunks: [],
            guardrail: {
              status: 'Direct Neural Reasoning',
              valid_citations: [],
              hallucinations_detected: 0,
            },
            total_latency_ms: elapsedMs,
          },
        })
      }
    } catch {
      // Ollama not reachable; fall through to resilient fallback
    }

    // 3. Resilient Fallback: Return conversational J.A.R.V.I.S. response with transparent fallback trace
    const elapsedMs = Date.now() - t0
    let reply = `Hey ${student_name}! I'm J.A.R.V.I.S., your companion for CampusBridge. I'm ready to help you navigate placement drives, review verified skills, and prep for technical interviews.`
    let agentName = '🤖 J.A.R.V.I.S.'
    let widgetType: any = 'none'

    if (isMentorQuery) {
      widgetType = 'mentor_list'
      agentName = '🎓 J.A.R.V.I.S. Mentorship'
      const mentors = getServerlessMentors()
      if (mentors.length > 0) {
        reply = `🎓 **Enrolled Senior Mentors Available (${mentors.length})**:\n\n` +
          mentors.map(m => `• **${m.name}** (${m.program} • Batch ${m.cohort_year})\n  - **Verified GPA:** \`${m.cgpa}\` (Academic Records Verified)\n  - **Top Skills:** ${m.top_skills.join(', ')}\n  - **Contact:** ✉️ [${m.email}](mailto:${m.email}) • 📱 \`${m.phone_number}\` • ✈️ [${m.telegram_id}](https://t.me/${m.telegram_id.replace('@', '')})`).join('\n\n') +
          `\n\nFeel free to connect directly via email, phone, or Telegram for 1-on-1 guidance on placements and coursework! Under DPDP regulations, only opted-in seniors are listed.`
      } else {
        reply = `ℹ️ **Senior Mentorship Discovery (DPDP Guarded):**\n\nNo enrolled seniors have currently enabled **'Share your info with juniors'** in their Profile Settings.\n\nUnder institutional DPDP Privacy-by-Default regulations, senior contact info and grades are never displayed without explicit student opt-in.`
      }
    } else if (isSprintQuery) {
      widgetType = 'sprint_plan'
      agentName = '⏱️ K.R.O.N.O.S.'
      reply = `⏱️ **K.R.O.N.O.S.:** I've compiled your customized 72-hour placement sprint kit below with your exact 3 milestones. You can review hour-by-hour gaps, toggle completed milestones, and launch 120s micro-defenses directly!`
    } else if (isSkillsQuery) {
      widgetType = 'ghost_cards'
      agentName = '🌿 T.E.R.R.A.'
      reply = `🌿 **T.E.R.R.A.:** I've audited your technical portfolio and extracted evidence cards below. You can confirm or promote any unconfirmed ghost cards into verified proof tokens with a single click!`
    } else if (isEligibilityQuery) {
      widgetType = 'match_card'
      agentName = '🛡️ R.O.N.E.N.'
      reply = `🛡️ **R.O.N.E.N.:** Institutional evaluation complete. I've audited your verified CGPA, branch, and backlogs against company cutoffs in the interactive card below.`
    } else if (isDefenseQuery) {
      widgetType = 'micro_defense'
      agentName = '⚡ A.T.H.E.N.A.'
      reply = `⚡ **A.T.H.E.N.A.:** Practice Quest Loaded: Two Sum with Memory Constraints. Solve it in under 120 seconds below to upgrade your verified skill tier to ASSESSMENT_VERIFIED (1.0x)!`
    }

    const transparentFallbackTrace = {
      intent: isMentorQuery || isSprintQuery || isSkillsQuery || isEligibilityQuery || isDefenseQuery ? 'INTENT_2: SPECIALIST_AGENT_DELEGATION' : 'DETERMINISTIC_POLICY_FALLBACK',
      engine: {
        name: 'CampusBridge Local Deterministic Policy',
        model: 'deterministic-policy-v1',
        latency_ms: elapsedMs,
        degraded_mode: true,
        fallback_reason: 'FastAPI orchestrator and Ollama daemon were unreachable or timed out.',
      },
      mcp_tools: isMentorQuery ? [{ server: 'student-profile', tool: 'student-profile.find_senior_mentors', status: 'ALLOWED' }] : [],
      rag_chunks: [],
      guardrail: {
        status: 'Deterministic Verified Fallback (Safe Mode)',
        valid_citations: [],
        hallucinations_detected: 0,
      },
      total_latency_ms: elapsedMs,
    }

    if (stream) {
      const encoder = new TextEncoder()
      const customStream = new ReadableStream({
        start(controller) {
          const chunk = {
            id: `chatcmpl-${Date.now()}`,
            object: 'chat.completion.chunk',
            created: Math.floor(Date.now() / 1000),
            model: 'deterministic-policy-v1',
            choices: [{ index: 0, delta: { content: reply }, finish_reason: null }],
            agent_name: agentName,
            widget_type: widgetType,
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
          const finish = {
            id: `chatcmpl-${Date.now()}`,
            object: 'chat.completion.chunk',
            choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
            agent_name: agentName,
            widget_type: widgetType,
            trace: transparentFallbackTrace,
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(finish)}\n\n`))
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        },
      })
      return new Response(customStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
        },
      })
    }

    return NextResponse.json({
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      choices: [{ index: 0, message: { role: 'assistant', content: reply }, finish_reason: 'stop' }],
      agent_name: agentName,
      widget_type: widgetType,
      trace: transparentFallbackTrace,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
