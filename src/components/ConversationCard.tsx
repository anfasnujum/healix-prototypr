import { Bot, ChevronDown, Headset } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Conversation } from '../types'
import { PriorityBadge } from './PriorityBadge'

function kindMeta(kind: Conversation['kind']) {
  if (kind === 'ai')
    return {
      icon: <Bot className="h-4 w-4" />,
      label: 'AI Intake',
      chip: 'bg-purple-50 text-purple-800 ring-purple-200',
    }
  return {
    icon: <Headset className="h-4 w-4" />,
    label: 'Case Manager',
    chip: 'bg-healix-teal/10 text-healix-navy ring-healix-teal/20',
  }
}

export function ConversationCard({ conversation }: { conversation: Conversation }) {
  const [open, setOpen] = useState(false)
  const meta = useMemo(() => kindMeta(conversation.kind), [conversation.kind])

  return (
    <div className="healix-card overflow-hidden">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition-all duration-200 hover:bg-gray-50/60"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl bg-gray-100 text-slate-700">
            {meta.icon}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={[
                  'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1',
                  meta.chip,
                ].join(' ')}
              >
                {meta.label}
              </span>
              <div className="text-sm font-semibold text-slate-900">
                {new Date(conversation.createdAt).toLocaleString()}
              </div>
              <PriorityBadge level={conversation.priorityAfter} />
            </div>
            <div className="mt-2 line-clamp-2 text-sm text-slate-600">
              {conversation.summary}
            </div>
          </div>
        </div>
        <ChevronDown
          className={[
            'h-5 w-5 shrink-0 text-slate-500 transition-all duration-200',
            open ? 'rotate-180' : '',
          ].join(' ')}
        />
      </button>

      {open ? (
        <div className="border-t border-gray-100 px-5 py-5">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="healix-frost p-4">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Transcript
              </div>
              <div className="max-h-72 space-y-2 overflow-auto pr-2">
                {conversation.transcript.map((t) => {
                  const right = t.speaker === 'case_manager'
                  const bubble =
                    t.speaker === 'case_manager'
                      ? 'bg-healix-teal text-healix-navy'
                      : t.speaker === 'ai'
                        ? 'bg-purple-50 text-purple-900'
                        : 'bg-gray-100 text-slate-900'
                  return (
                    <div
                      key={t.id}
                      className={['flex', right ? 'justify-end' : 'justify-start'].join(' ')}
                    >
                      <div
                        className={[
                          'max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm',
                          bubble,
                        ].join(' ')}
                      >
                        {t.text}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="healix-frost p-4">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Case Form
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-slate-500">Zone</div>
                  <div className="font-medium text-slate-900">
                    {conversation.caseForm.zone ?? '—'}
                  </div>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div className="pt-0.5 text-slate-500">Symptoms</div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {conversation.caseForm.symptoms.length ? (
                      conversation.caseForm.symptoms.map((s) => (
                        <span
                          key={s}
                          className="rounded-full bg-healix-teal/10 px-2.5 py-1 text-xs font-semibold text-healix-navy"
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </div>
                </div>
                {conversation.caseForm.aiRecommendation ? (
                  <div className="rounded-2xl border border-healix-teal/20 bg-white/80 p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-healix-teal">
                      ✦ AI Recommendation
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">
                      {conversation.caseForm.aiRecommendation.department}
                    </div>
                    <div className="mt-2 text-xs text-slate-600">
                      Confidence:{' '}
                      {Math.round(conversation.caseForm.aiRecommendation.confidence * 100)}%
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

