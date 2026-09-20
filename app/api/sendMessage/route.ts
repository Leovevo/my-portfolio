import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const RESUME = `
[기본 정보]
이름: Leo (윤대호)
현재 신분/직업: 현재 직업군인으로 복무 중
목표/지향: 클라우드 보안 엔지니어 지망, 팔란티어 입사 희망
이메일: yoondaeho314@gmail.com
GitHub: https://github.com/Leovevo

[한 줄 소개]
AWS와 인프라 보안에 관심이 많고, 클라우드 보안 엔지니어가 되기 위해 공부하고 있습니다.

[기술 스택]
IT 스칼라 직업충전소에서 개인 개발자 강의를 수강하며 학습 중 (Next.js, TypeScript 등)

[프로젝트/경험]
아직 별도로 내세울 프로젝트 경력은 없음 (현재 이 포트폴리오 사이트가 첫 프로젝트)

[학습/공부 중인 것]
개발자 과정인 '알토르' 과정 튜터링 수강 중

[기타 강점/관심사]
영어를 제2외국어 수준으로 구사 가능하며, 특히 리스닝과 스피킹이 강점
`;

const SYSTEM_INSTRUCTION = `당신은 Leo의 포트폴리오 웹사이트에 있는 챗봇입니다.
아래는 Leo의 이력서 정보입니다. 방문자의 질문에는 반드시 이 정보를 근거로 답변하세요.
이력서에 없는 내용을 질문받으면, 모른다고 솔직히 답하거나 이메일로 문의하라고 안내하세요.
답변은 한국어로, 친근하고 간결하게 2~4문장 이내로 작성하세요.

${RESUME}`;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";

  if (!text) {
    return NextResponse.json({ reply: "메시지를 입력해 주세요." });
  }

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: text,
      config: { systemInstruction: SYSTEM_INSTRUCTION },
    });

    return NextResponse.json({ reply: result.text });
  } catch (error) {
    console.error("Gemini 호출 실패:", error);
    return NextResponse.json({
      reply: "죄송해요, 지금은 답변을 가져올 수 없어요.",
    });
  }
}
