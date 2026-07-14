import { Component, isValidElement, useMemo } from "react";
import type { ReactNode } from "react";
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

type FormFieldOption = string | { label?: string; value?: string };

interface FormFieldPreview {
  name: string;
  label: string;
  type: string;
  value?: string | number | boolean | null;
  placeholder?: string;
  required?: boolean;
  description?: string;
  options?: FormFieldOption[];
}

interface FormPreviewModel {
  title: string;
  description?: string;
  fields: FormFieldPreview[];
}

interface CodeElementProps {
  className?: string;
  children?: ReactNode;
}

function extractText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(extractText).join("");
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return extractText(node.props.children);
  }

  return "";
}

function getCodeLanguage(className?: string) {
  return className?.split(/\s+/).find((name) => name.startsWith("language-"))?.replace("language-", "") ?? "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringifyFieldValue(value: FormFieldPreview["value"]) {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "是" : "否";
  return String(value);
}

function normalizeOption(option: FormFieldOption) {
  if (typeof option === "string") {
    return { label: option, value: option };
  }

  return {
    label: option.label ?? option.value ?? "",
    value: option.value ?? option.label ?? "",
  };
}

function normalizeField(rawField: unknown, index: number): FormFieldPreview | null {
  if (!isRecord(rawField)) return null;

  const rawName = rawField.name ?? rawField.key ?? rawField.id ?? `field_${index + 1}`;
  const rawLabel = rawField.label ?? rawField.title ?? rawField.name ?? rawField.key ?? `字段 ${index + 1}`;
  const rawType = rawField.type ?? rawField.inputType ?? "text";
  const rawOptions = Array.isArray(rawField.options) ? rawField.options : undefined;
  const rawDescription = rawField.description ?? rawField.help ?? rawField.hint;
  const rawValue = rawField.value ?? rawField.defaultValue ?? rawField.default ?? "";

  return {
    name: String(rawName),
    label: String(rawLabel),
    type: String(rawType),
    value: typeof rawValue === "string" || typeof rawValue === "number" || typeof rawValue === "boolean" || rawValue === null
      ? rawValue
      : JSON.stringify(rawValue),
    placeholder: typeof rawField.placeholder === "string" ? rawField.placeholder : undefined,
    required: Boolean(rawField.required),
    description: typeof rawDescription === "string" ? rawDescription : undefined,
    options: rawOptions?.filter((option): option is FormFieldOption =>
      typeof option === "string" || isRecord(option),
    ),
  };
}

function payloadToFields(payload: Record<string, unknown>) {
  return Object.entries(payload).map(([name, value], index) => normalizeField({
    name,
    label: name,
    type: typeof value === "boolean" ? "checkbox" : "text",
    value: typeof value === "object" && value !== null ? JSON.stringify(value) : value,
  }, index)).filter((field): field is FormFieldPreview => Boolean(field));
}

function parseFormPreview(rawCode: string, language: string): FormPreviewModel | null {
  const normalizedLanguage = language.toLowerCase();
  const canParseAsForm = ["json", "form", "schema"].includes(normalizedLanguage);
  if (!canParseAsForm) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawCode);
  } catch {
    return null;
  }

  const source = isRecord(parsed) && isRecord(parsed.form) ? parsed.form : parsed;
  const titleSource = isRecord(parsed) ? parsed : {};

  if (Array.isArray(source)) {
    const fields = source.map(normalizeField).filter((field): field is FormFieldPreview => Boolean(field));
    return fields.length > 0 ? { title: "表单预览", fields } : null;
  }

  if (!isRecord(source)) return null;

  const rawFields = Array.isArray(source.fields) ? source.fields : undefined;
  const fields = rawFields
    ? rawFields.map(normalizeField).filter((field): field is FormFieldPreview => Boolean(field))
    : isRecord(source.payload)
      ? payloadToFields(source.payload)
      : isRecord(titleSource.payload)
        ? payloadToFields(titleSource.payload)
        : [];

  if (fields.length === 0) return null;

  const title = source.title ?? source.name ?? titleSource.title ?? titleSource.actionType ?? "表单预览";
  const description = source.description ?? titleSource.riskSummary;

  return {
    title: String(title),
    description: typeof description === "string" ? description : undefined,
    fields,
  };
}

function cleanMarkdownLabel(value: string) {
  return value
    .replace(/^[#>\s|\-–—:：]+/, "")
    .replace(/[*_`[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCheckboxOptions(line: string): FormFieldOption[] | undefined {
  const optionMatches = Array.from(line.matchAll(/[□☐☑☒]\s*([^□☐☑☒|，,。；;]+)/g));
  const options = optionMatches
    .map((match) => cleanMarkdownLabel(match[1] ?? ""))
    .filter(Boolean);

  return options.length > 0 ? options : undefined;
}

function parseMarkdownFormPreview(markdown: string): FormPreviewModel | null {
  const lines = markdown.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  const titleLine = lines.find((line) => /^#{1,4}\s+/.test(line));
  const hasTitleLine = Boolean(titleLine);
  const title = titleLine ? cleanMarkdownLabel(titleLine.replace(/^#{1,4}\s+/, "")) : "表单预览";
  const hasCodeFenceOrTable = /```|^\|.*\|/m.test(markdown);
  const fields: FormFieldPreview[] = [];
  const seen = new Set<string>();
  let hasChoiceControl = false;

  for (const line of lines) {
    const labelMatches = Array.from(line.matchAll(/\*\*([^*]+)\*\*/g));
    for (const match of labelMatches) {
      const label = cleanMarkdownLabel(match[1] ?? "");
      if (!label || seen.has(label)) continue;

      const options = parseCheckboxOptions(line);
      hasChoiceControl = hasChoiceControl || Boolean(options?.length);
      fields.push({
        name: label,
        label,
        type: options ? "select" : "text",
        value: "",
        options,
      });
      seen.add(label);
    }
  }

  const hasExplicitFormSignal = hasTitleLine && /表单|申请|请假|登记|草稿|字段|创建|新增|编辑|导入|配置/.test(title);
  const hasExplanationSignal = /对比|区别|比较|差异|说明|解释|介绍|概览|总结/.test(title);
  const formLikeFieldCount = fields.filter((field) =>
    /姓名|名称|日期|天数|理由|班级|学号|电话|邮箱|地址|项目|任务|环境|模型|数据|路径|用途/.test(field.label),
  ).length;
  const hasTechnicalExplanationSignal = hasExplanationSignal || /详解|细节|教程|原理|概念|Webpack|webpack|Vite|vite/.test(title);
  const hasFormSignal = hasExplicitFormSignal || hasChoiceControl || (!hasTechnicalExplanationSignal && !hasCodeFenceOrTable && formLikeFieldCount >= 3);

  if (fields.length < 2 || !hasFormSignal) return null;

  return {
    title,
    fields,
  };
}

function FormPreview({ model }: { model: FormPreviewModel }) {
  return (
    <section className="ai-form-preview" aria-label={model.title}>
      <div className="ai-form-preview__header">
        <h3>{model.title}</h3>
        <span>只读草稿</span>
      </div>
      {model.description ? <p className="ai-form-preview__description">{model.description}</p> : null}
      <div className="ai-form-preview__grid">
        {model.fields.map((field) => (
          <label className="ai-form-preview__field" key={field.name}>
            <span className="ai-form-preview__label">
              {field.label}
              {field.required ? <em>*</em> : null}
            </span>
            {field.type === "select" && field.options?.length ? (
              <select value={stringifyFieldValue(field.value) || normalizeOption(field.options[0]).value} disabled>
                {field.options.map((option) => {
                  const normalized = normalizeOption(option);
                  return (
                    <option key={`${field.name}-${normalized.value}`} value={normalized.value}>
                      {normalized.label}
                    </option>
                  );
                })}
              </select>
            ) : field.type === "textarea" || stringifyFieldValue(field.value).length > 72 ? (
              <textarea value={stringifyFieldValue(field.value)} placeholder={field.placeholder} rows={3} disabled />
            ) : field.type === "checkbox" ? (
              <span className="ai-form-preview__checkbox">
                <input checked={Boolean(field.value)} type="checkbox" disabled />
                <span>{stringifyFieldValue(field.value) || "否"}</span>
              </span>
            ) : (
              <input value={stringifyFieldValue(field.value)} placeholder={field.placeholder} type="text" disabled />
            )}
            {field.description ? <small>{field.description}</small> : null}
          </label>
        ))}
      </div>
    </section>
  );
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
  const markdownFormPreview = useMemo(() => parseMarkdownFormPreview(content), [content]);

  // 空内容：不渲染任何内容
  if (isEmpty) {
    return null;
  }

  // 流式中：纯文本展示，避免不完整 Markdown 解析问题
  if (isStreaming) {
    return <p className="markdown-body markdown-body--streaming">{content}</p>;
  }

  if (markdownFormPreview) {
    return (
      <MarkdownErrorBoundary content={content}>
        <div className="markdown-body">
          <FormPreview model={markdownFormPreview} />
        </div>
      </MarkdownErrorBoundary>
    );
  }

  // 完整渲染 Markdown（含错误边界保护）
  return (
    <MarkdownErrorBoundary content={content}>
      <div className="markdown-body">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            pre({ children, ...props }) {
              const codeElement = isValidElement<CodeElementProps>(children) ? children : null;
              const codeText = extractText(codeElement?.props.children).trim();
              const language = getCodeLanguage(codeElement?.props.className);
              const formPreview = parseFormPreview(codeText, language)
                ?? (["markdown", "md", "text", ""].includes(language.toLowerCase())
                  ? parseMarkdownFormPreview(codeText)
                  : null);

              if (formPreview) {
                return <FormPreview model={formPreview} />;
              }

              return <pre {...props}>{children}</pre>;
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </MarkdownErrorBoundary>
  );
}
