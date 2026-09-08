"use client";

import { useState, useRef, useEffect } from "react";

/* ══════════════════════════════════════════════════════════
   ① 여기만 고치시면 됩니다.
   ══════════════════════════════════════════════════════════
   질문(q)과 답변(a)을 한 묶음씩 { } 안에 적고, 쉼표로 이어 주세요.
   keywords 는 "이런 단어가 들어오면 이 답변을 보여줘" 목록입니다.
   답변 안에서 줄을 바꾸고 싶으면 \n 을 넣으세요.
────────────────────────────────────────────────────────── */

type QA = { q: string; a: string; keywords?: string[] };

const QA_LIST: QA[] = [
  {
    q: "당신은 누구인가요?",
    a: "저는 현재 직업군인으로 복무하고 있는 윤대호입니다.\n현재 클라우드 보안 엔지니어가 되기 위한 공부를 하고 있습니다.\nAWS와 인프라 보안 쪽에 관심이 많아요.",
    keywords: ["공부", "전공", "관심", "분야", "보안", "클라우드"],
  },
  {
    q: "어떤 기술을 다룰 수 있나요?",
    a: "Next.js와 TypeScript로 웹을 만들고 있고,\n리눅스와 네트워크 기초를 앞으로 익힐 것입니다.",
    keywords: ["기술", "스택", "스킬", "언어", "할수있", "다룰"],
  },
  {
    q: "포트폴리오나 깃허브를 보고 싶어요",
    a: "위쪽 'GitHub 방문하기' 버튼을 눌러 주세요.\ngithub.com/Leovevo 에서 작업물을 보실 수 있습니다.",
    keywords: ["깃허브", "github", "포트폴리오", "작업물", "프로젝트", "코드"],
  },
  {
    q: "연락은 어떻게 하나요?",
    a: "제 이메일로 연락 주시면 가장 빠릅니다.\nyour@email.com",
    keywords: ["연락", "이메일", "메일", "문의", "컨택"],
  },
];

const CONFIG = {
  title: "무엇이든 물어보세요",
  subtitle: "아래 질문을 눌러 보시거나, 직접 입력해 주세요.",
  greeting: "안녕하세요! 자주 묻는 질문을 정리해 두었어요.",
  fallback:
    "죄송해요, 그 질문은 제가 아직 답을 못 드려요.\n아래 질문 중에서 골라 주시겠어요?",
};

/* ══════════════════════════════════════════════════════════
   아래는 건드리지 않으셔도 됩니다.
   ══════════════════════════════════════════════════════════ */

type Msg = { text: string; mine: boolean };

const normalize = (s: string) =>
  s.toLowerCase().replace(/[\s.,!?~·'"()\-]/g, "");

function findAnswer(input: string): QA | null {
  const n = normalize(input);
  if (!n) return null;

  for (const it of QA_LIST) if (normalize(it.q) === n) return it;
  for (const it of QA_LIST) {
    const q = normalize(it.q);
    if (q.includes(n) || n.includes(q)) return it;
  }

  let best: QA | null = null;
  let bestScore = 0;
  for (const it of QA_LIST) {
    let score = 0;
    for (const k of it.keywords ?? []) {
      if (n.includes(normalize(k))) score += k.length;
    }
    if (score > bestScore) {
      bestScore = score;
      best = it;
    }
  }
  return bestScore >= 2 ? best : null;
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { text: CONFIG.greeting, mine: false },
  ]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false); //
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [msgs, open]);

 const send = async (text: string) => {
    const t = text.trim();
    if (!t || isLoading) return;

    setMsgs((m) => [...m, { text: t, mine: true }]);
    setDraft("");
    setIsLoading(true);

    try {
      const response = await fetch("https://api.myfortfolio.xyz/sendMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: t }),
      });

      if (!response.ok) throw new Error(`서버 에러: ${response.status}`);

      const data = await response.json();
      const aiReply = data.reply || data.response || data.answer || data.message || data.text;
      
      if (aiReply) {
        setMsgs((m) => [...m, { text: aiReply, mine: false }]);
      } else {
        throw new Error("답변 텍스트를 찾을 수 없음");
      }
    } catch (error) {
      console.error("[ChatBot] API 호출 실패:", error);
      const hit = findAnswer(t);
      setMsgs((m) => [...m, { text: hit ? hit.a : CONFIG.fallback, mine: false }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      {open && (
        <div
          role="dialog"
          aria-label="자주 묻는 질문"
          className="absolute bottom-[74px] right-0 flex max-h-[70vh] w-[340px] max-w-[calc(100vw-40px)] flex-col overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 shadow-2xl"
        >
          <div className="relative border-b border-gray-700 px-5 py-4">
            <h3 className="text-sm font-bold tracking-tight text-white">
              {CONFIG.title}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-gray-400">
              {CONFIG.subtitle}
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="닫기"
              className="absolute right-3 top-3 h-7 w-7 rounded-lg text-lg leading-none text-gray-400 hover:bg-gray-700 hover:text-white"
            >
              ×
            </button>
          </div>

          <div
            ref={logRef}
            aria-live="polite"
            className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-4"
          >
            {msgs.map((m, i) => (
              <div
                key={i}
                className={
                  "max-w-[82%] whitespace-pre-wrap break-words px-3.5 py-2.5 text-sm leading-relaxed " +
                  (m.mine
                    ? "self-end rounded-2xl rounded-br-sm bg-blue-500 text-white"
                    : "self-start rounded-2xl rounded-bl-sm bg-gray-700 text-gray-100")
                }
              >
                {m.text}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5 px-4 pb-3">
            {QA_LIST.map((it) => (
              <button
                key={it.q}
                type="button"
                onClick={() => send(it.q)}
                className="rounded-full border border-gray-600 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
              >
                {it.q}
              </button>
            ))}
          </div>

           <div className="flex gap-2 border-t border-gray-700 px-4 py-3">
            <input
              ref={inputRef}
              value={draft}
              disabled={isLoading} // 🔥 추가: 로딩 중 입력 방지
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send(draft);
              }}
              placeholder="질문을 입력하세요"
              aria-label="질문 입력"
              className="min-w-0 flex-1 rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => send(draft)}
              disabled={isLoading} // 🔥 추가: 로딩 중 클릭 방지
              className="rounded-lg bg-blue-500 px-3.5 text-xs font-semibold text-white hover:bg-blue-400 disabled:opacity-50"
            >
              {isLoading ? "..." : "보내기"} {/* 🔥 수정: 통신 중에는 ... 으로 표시 */}
            </button>
          </div> 
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="문의 열기"
        aria-expanded={open}
        className="grid h-[60px] w-[60px] place-items-center rounded-full bg-blue-500 text-white shadow-xl transition-transform hover:-translate-y-0.5 hover:bg-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
        >
          <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 21l1.9-5a8.4 8.4 0 0 1-.9-3.8 8.4 8.4 0 0 1 8.4-9h.6a8.4 8.4 0 0 1 8 8v.3z" />
        </svg>
      </button>
    </div>
  );
}
