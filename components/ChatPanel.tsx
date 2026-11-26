"use client";

import { useEffect, useRef, useState } from "react";
import { relativeTime } from "@/lib/format";
import type { ChatMessage } from "@/lib/types";
import { Icon } from "./Icon";

type Props = {
  open: boolean;
  tripTitle: string;
  messages: ChatMessage[];
  sending: boolean;
  error: string | null;
  lastApplied: { applied: number } | null;
  canUndo: boolean;
  onOpen: () => void;
  onClose: () => void;
  onSend: (text: string) => void;
  onClear: () => void;
  onUndo: () => void;
  onDismissError: () => void;
};

const SUGGESTIONS = [
  "비 오는 날처럼 실내 위주로 일정을 바꿔줘",
  "둘째 날 저녁 식당 후보 두 곳을 넣어줘",
  "숙소 근처 카페를 오전에 추가해줘",
  "테마를 sakura로 바꿔줘",
];

export function ChatPanel({
  open,
  tripTitle,
  messages,
  sending,
  error,
  lastApplied,
  canUndo,
  onOpen,
  onClose,
  onSend,
  onClear,
  onUndo,
  onDismissError,
}: Props) {
  const [text, setText] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = bodyRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, sending, error]);

  const submit = () => {
    const value = text.trim();
    if (!value || sending) return;
    onSend(value);
    setText("");
  };

  return (
    <>
      <div className={`chat-backdrop${open ? " is-visible" : ""}`} role="presentation" onClick={onClose} />
      <aside className={`chat-panel${open ? " is-open" : ""}`} aria-label="AI 여행 도우미" aria-hidden={!open}>
        <header className="chat-head">
          <div className="chat-head__title">
            <span className="chat-avatar" aria-hidden="true">
              <Icon.sparkles size={18} />
            </span>
            <div>
              <h2>AI 여행 도우미</h2>
              <p>{tripTitle}</p>
            </div>
          </div>
          <div className="chat-head__actions">
            <button
              type="button"
              className="icon-button icon-button--small"
              onClick={onUndo}
              disabled={!canUndo}
              title="마지막 변경 되돌리기"
              aria-label="마지막 변경 되돌리기"
            >
              <Icon.undo size={16} />
            </button>
            <button
              type="button"
              className="icon-button icon-button--small"
              onClick={onClear}
              title="대화 지우기"
              aria-label="대화 지우기"
            >
              <Icon.trash size={16} />
            </button>
            <button type="button" className="icon-button icon-button--small" onClick={onClose} aria-label="패널 접기">
              <Icon.arrowRight size={16} />
            </button>
          </div>
        </header>

        <div className="chat-body" ref={bodyRef}>
          {messages.length === 0 ? (
            <div className="chat-empty">
              <p className="chat-empty__lead">
                일정에 대해 말하면 왼쪽 일정표에 바로 반영합니다. 장소 추가·수정·삭제, 순서 바꾸기, 날짜
                추가, 테마 변경까지 대화로 처리하세요.
              </p>
              <div className="chat-suggestions">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="chat-suggestion"
                    onClick={() => onSend(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((message) => (
            <div key={message.id} className={`chat-message chat-message--${message.role}`}>
              <div className="chat-bubble">{message.content}</div>
              {message.warnings && message.warnings.length > 0 ? (
                <ul className="chat-warnings">
                  {message.warnings.map((warning, index) => (
                    <li key={`${message.id}-w-${index}`}>{warning}</li>
                  ))}
                </ul>
              ) : null}
              <span className="chat-time">{relativeTime(message.createdAt)}</span>
            </div>
          ))}

          {sending ? (
            <div className="chat-message chat-message--assistant">
              <div className="chat-bubble chat-bubble--typing" aria-label="답변 작성 중">
                <span />
                <span />
                <span />
              </div>
            </div>
          ) : null}

          {lastApplied && lastApplied.applied > 0 ? (
            <div className="chat-applied">
              <span>
                <Icon.check size={14} /> 일정에 {lastApplied.applied}개 변경을 적용했어요
              </span>
              {canUndo ? (
                <button type="button" className="text-button" onClick={onUndo}>
                  되돌리기
                </button>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <div className="chat-error" role="alert">
              <p>{error}</p>
              <button type="button" className="text-button" onClick={onDismissError}>
                닫기
              </button>
            </div>
          ) : null}
        </div>

        <form
          className="chat-form"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                submit();
              }
            }}
            rows={2}
            placeholder="예: 12/19 오후에 카페 하나 넣고 순서 정리해줘"
            aria-label="AI에게 보낼 메시지"
          />
          <button
            className="chat-send"
            type="submit"
            disabled={!text.trim() || sending}
            aria-label="보내기"
          >
            <Icon.send size={18} />
          </button>
        </form>
        <p className="chat-hint">AI가 바꾼 내용은 즉시 반영되고 브라우저에 자동 저장됩니다.</p>
      </aside>

      <button
        type="button"
        className={`chat-fab${open ? " is-hidden" : ""}`}
        onClick={onOpen}
        aria-label="AI 채팅 열기"
      >
        <Icon.sparkles size={20} />
        <span>AI 채팅</span>
      </button>
    </>
  );
}
