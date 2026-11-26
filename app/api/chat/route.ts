import { NextResponse } from "next/server";
import { PATCH_TOOL, PATCH_TOOL_NAME } from "@/lib/ai/schema";
import { buildSystemPrompt } from "@/lib/ai/prompt";
import { normalizeOps, type Op } from "@/lib/ops";
import { coerceTrip } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 60;

type ChatTurn = { role: "user" | "assistant"; content: string };

type Provider = "anthropic" | "gemini";

const NO_KEY_MESSAGE = [
  "AI 채팅을 쓰려면 API 키가 필요해요. Vercel 프로젝트의 Environment Variables에",
  "`ANTHROPIC_API_KEY`(권장) 또는 `GEMINI_API_KEY`를 추가하고 다시 배포해 주세요.",
  "로컬에서는 `.env.local`에 같은 이름으로 넣고 개발 서버를 다시 시작하면 됩니다.",
].join(" ");

const MAX_TURNS = 12;
const MAX_MESSAGE = 4000;
const TIMEOUT_MS = 45000;

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function sanitizeHistory(raw: unknown): ChatTurn[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((turn): turn is ChatTurn => {
      if (!turn || typeof turn !== "object") return false;
      const candidate = turn as Partial<ChatTurn>;
      return (
        (candidate.role === "user" || candidate.role === "assistant") &&
        typeof candidate.content === "string"
      );
    })
    .map((turn) => ({ role: turn.role, content: turn.content.slice(0, MAX_MESSAGE) }))
    .slice(-MAX_TURNS);
}

/** Anthropic and Gemini both want the conversation to start with the user. */
function startWithUser(turns: ChatTurn[]): ChatTurn[] {
  const firstUser = turns.findIndex((turn) => turn.role === "user");
  return firstUser <= 0 ? turns : turns.slice(firstUser);
}

async function callAnthropic(apiKey: string, system: string, turns: ChatTurn[]) {
  const model = process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-5";
  // ANTHROPIC_BASE_URL is only for gateways/proxies and local testing.
  const url = process.env.ANTHROPIC_BASE_URL?.trim() || "https://api.anthropic.com/v1/messages";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      system,
      messages: turns.map((turn) => ({ role: turn.role, content: turn.content })),
      tools: [PATCH_TOOL],
      tool_choice: { type: "auto" },
      temperature: 0.4,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new ProviderError(await describeError(response, "Anthropic"));
  }

  const payload = (await response.json()) as {
    content?: Array<{ type: string; text?: string; name?: string; input?: unknown }>;
  };

  const blocks = Array.isArray(payload.content) ? payload.content : [];
  const texts = blocks
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text as string)
    .join("\n")
    .trim();
  const toolUse = blocks.find((block) => block.type === "tool_use" && block.name === PATCH_TOOL_NAME);

  if (toolUse && toolUse.input && typeof toolUse.input === "object") {
    const input = toolUse.input as { reply?: unknown; ops?: unknown };
    return {
      reply: typeof input.reply === "string" && input.reply.trim() ? input.reply.trim() : texts,
      rawOps: input.ops,
      provider: "anthropic" as Provider,
    };
  }

  return { reply: texts, rawOps: [], provider: "anthropic" as Provider };
}

async function callGemini(apiKey: string, system: string, turns: ChatTurn[]) {
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  const baseUrl = process.env.GEMINI_BASE_URL?.trim() || "https://generativelanguage.googleapis.com/v1beta";
  const url = `${baseUrl.replace(/\/$/, "")}/models/${encodeURIComponent(model)}:generateContent`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: turns.map((turn) => ({
        role: turn.role === "assistant" ? "model" : "user",
        parts: [{ text: turn.content }],
      })),
      tools: [{ functionDeclarations: [PATCH_TOOL] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new ProviderError(await describeError(response, "Gemini"));
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string; functionCall?: { name?: string; args?: unknown } }>;
      };
    }>;
  };

  const parts = payload.candidates?.[0]?.content?.parts ?? [];
  const texts = parts
    .map((part) => (typeof part.text === "string" ? part.text : ""))
    .join("\n")
    .trim();
  const call = parts.find((part) => part.functionCall?.name === PATCH_TOOL_NAME);

  if (call?.functionCall?.args && typeof call.functionCall.args === "object") {
    const args = call.functionCall.args as { reply?: unknown; ops?: unknown };
    return {
      reply: typeof args.reply === "string" && args.reply.trim() ? args.reply.trim() : texts,
      rawOps: args.ops,
      provider: "gemini" as Provider,
    };
  }

  return { reply: texts, rawOps: [], provider: "gemini" as Provider };
}

class ProviderError extends Error {}

async function describeError(response: Response, provider: string): Promise<string> {
  let detail = "";
  try {
    const text = await response.text();
    detail = text.slice(0, 240);
  } catch {
    detail = "";
  }

  if (response.status === 401 || response.status === 403) {
    return `${provider} API 키가 거부되었습니다. Vercel 환경변수(${provider === "Anthropic" ? "ANTHROPIC_API_KEY" : "GEMINI_API_KEY"})를 확인해 주세요.`;
  }
  if (response.status === 429) {
    return `${provider} 요청 한도에 걸렸습니다. 잠시 뒤 다시 시도해 주세요.`;
  }
  if (response.status === 404) {
    return `${provider} 모델을 찾지 못했습니다. 모델 이름 환경변수를 확인해 주세요.`;
  }
  return `${provider} 응답 오류 (${response.status})${detail ? `: ${detail}` : ""}`;
}

export async function POST(request: Request) {
  let body: { message?: unknown; messages?: unknown; trip?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail("요청을 읽지 못했습니다.");
  }

  const message = typeof body.message === "string" ? body.message.trim().slice(0, MAX_MESSAGE) : "";
  if (!message) return fail("메시지가 비어 있습니다.");

  const trip = coerceTrip(body.trip);
  if (!trip) return fail("여행 데이터를 읽지 못했습니다.");

  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();

  if (!anthropicKey && !geminiKey) {
    return NextResponse.json({
      reply: NO_KEY_MESSAGE,
      ops: [] as Op[],
      notice: "missing_api_key",
    });
  }

  const system = buildSystemPrompt(trip, new Date());
  const history = startWithUser(sanitizeHistory(body.messages));
  const turns: ChatTurn[] = [...history, { role: "user", content: message }];

  try {
    const result = anthropicKey
      ? await callAnthropic(anthropicKey, system, turns)
      : await callGemini(geminiKey as string, system, turns);

    const { ops, dropped } = normalizeOps(result.rawOps, trip);
    const reply =
      result.reply ||
      (ops.length > 0 ? "일정에 반영했습니다." : "요청을 이해하지 못했어요. 조금 더 구체적으로 말씀해 주세요.");

    return NextResponse.json({
      reply,
      ops,
      provider: result.provider,
      warnings: dropped,
    });
  } catch (error) {
    const message =
      error instanceof ProviderError
        ? error.message
        : error instanceof Error && error.name === "TimeoutError"
          ? "AI 응답이 너무 오래 걸려 중단했습니다. 다시 시도해 주세요."
          : "AI 요청 중 문제가 생겼습니다. 잠시 뒤 다시 시도해 주세요.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
