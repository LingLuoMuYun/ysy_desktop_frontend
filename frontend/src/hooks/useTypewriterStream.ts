import { useCallback, useEffect, useMemo, useRef } from "react";

const DEFAULT_INTERVAL_MS = 24;
const DEFAULT_CHARS_PER_TICK = 2;

interface TypewriterStreamOptions {
  intervalMs?: number;
  charsPerTick?: number;
}

/**
 * 将网络流式片段缓冲为稳定的打字机输出。
 * done/error 时调用 flush，可确保剩余字符不会滞留到下一轮对话。
 */
export function useTypewriterStream(
  onText: (text: string) => void,
  {
    intervalMs = DEFAULT_INTERVAL_MS,
    charsPerTick = DEFAULT_CHARS_PER_TICK,
  }: TypewriterStreamOptions = {},
) {
  const onTextRef = useRef(onText);
  const bufferRef = useRef("");
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    onTextRef.current = onText;
  }, [onText]);

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    const nextChunk = bufferRef.current.slice(0, charsPerTick);
    bufferRef.current = bufferRef.current.slice(nextChunk.length);

    if (nextChunk) {
      onTextRef.current(nextChunk);
    }

    if (!bufferRef.current) {
      stopTimer();
    }
  }, [charsPerTick, stopTimer]);

  const startTimer = useCallback(() => {
    if (timerRef.current === null) {
      timerRef.current = window.setInterval(tick, intervalMs);
    }
  }, [intervalMs, tick]);

  const enqueue = useCallback((text: string) => {
    if (!text) return;
    bufferRef.current += text;
    startTimer();
  }, [startTimer]);

  const flush = useCallback(() => {
    if (bufferRef.current) {
      const remaining = bufferRef.current;
      bufferRef.current = "";
      onTextRef.current(remaining);
    }
    stopTimer();
  }, [stopTimer]);

  const reset = useCallback(() => {
    bufferRef.current = "";
    stopTimer();
  }, [stopTimer]);

  useEffect(() => reset, [reset]);

  return useMemo(() => ({ enqueue, flush, reset }), [enqueue, flush, reset]);
}
