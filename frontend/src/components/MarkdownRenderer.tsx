import { Component, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

interface MarkdownRendererProps {
  /** Markdown 文本内容 */
  content: string;
  /** 是否正在流式输出中。为 true 时以纯文本渲染，避免不完整 Markdown 语法被错误解析 */
  isStreaming?: boolean;
}

/**
 * 错误边界：捕获 react-markdown 渲染异常，
 * 降级为纯文本展示，确保用户至少能看到原始内容。
 */
class MarkdownErrorBoundary extends Component<
  { children: React.ReactNode; content: string },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; content: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("[MarkdownRenderer] 渲染异常，降级为纯文本:", error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="markdown-body markdown-body--fallback">
          <pre className="markdown-body__raw">{this.props.content}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Markdown 渲染组件。
 *
 * 流式输出期间以纯文本展示，避免不完整的 Markdown 标记（如半截代码块、
 * 未闭合的粗体等）被错误解析。流式完成后自动切换为完整 Markdown 渲染，
 * 支持 GFM 表格、代码语法高亮等特性。
 *
 * 安全：使用 react-markdown 渲染为 React 组件，不依赖 dangerouslySetInnerHTML。
 * 内建错误边界：渲染异常时自动降级为纯文本展示。
 */
export function MarkdownRenderer({ content, isStreaming = false }: MarkdownRendererProps) {
  const isEmpty = useMemo(() => content.trim().length === 0, [content]);

  // 空内容：不渲染任何内容
  if (isEmpty) {
    return null;
  }

  // 流式中：纯文本展示，避免不完整 Markdown 解析问题
  if (isStreaming) {
    return <p className="markdown-body markdown-body--streaming">{content}</p>;
  }

  // 完整渲染 Markdown（含错误边界保护）
  return (
    <MarkdownErrorBoundary content={content}>
      <div className="markdown-body">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
        >
          {content}
        </ReactMarkdown>
      </div>
    </MarkdownErrorBoundary>
  );
}
