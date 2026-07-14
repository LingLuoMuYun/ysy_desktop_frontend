import { X } from "lucide-react";
import { useCallback } from "react";

export interface ChatAttachment {
  name: string;
  path: string;
  kind?: "file" | "directory";
  /** 浏览器回退：保留原始 File 对象，当 path 为空时用它生成 blob URL 打开。 */
  file?: File;
}

interface FileFormatIconMeta {
  label: string;
  title: string;
  tone: "archive" | "code" | "data" | "document" | "folder" | "image" | "markdown" | "model" | "script" | "default";
}

const FILE_FORMAT_ICONS: Record<string, FileFormatIconMeta> = {
  "": { label: "FILE", title: "文件", tone: "default" },
  bmp: { label: "IMG", title: "图片文件", tone: "image" },
  ckpt: { label: "MDL", title: "模型权重文件", tone: "model" },
  csv: { label: "CSV", title: "CSV 数据文件", tone: "data" },
  doc: { label: "DOC", title: "Word 文档", tone: "document" },
  docx: { label: "DOC", title: "Word 文档", tone: "document" },
  gif: { label: "IMG", title: "图片文件", tone: "image" },
  gz: { label: "ZIP", title: "压缩包", tone: "archive" },
  ipynb: { label: "NB", title: "Notebook 文件", tone: "code" },
  jpeg: { label: "IMG", title: "图片文件", tone: "image" },
  jpg: { label: "IMG", title: "图片文件", tone: "image" },
  json: { label: "JSON", title: "JSON 数据文件", tone: "data" },
  jsonl: { label: "JSL", title: "JSONL 数据文件", tone: "data" },
  log: { label: "LOG", title: "日志文件", tone: "document" },
  md: { label: "MD", title: "Markdown 文件", tone: "markdown" },
  markdown: { label: "MD", title: "Markdown 文件", tone: "markdown" },
  onnx: { label: "MDL", title: "ONNX 模型文件", tone: "model" },
  pdf: { label: "PDF", title: "PDF 文档", tone: "document" },
  png: { label: "IMG", title: "图片文件", tone: "image" },
  ppt: { label: "PPT", title: "演示文稿", tone: "document" },
  pptx: { label: "PPT", title: "演示文稿", tone: "document" },
  py: { label: "PY", title: "Python 脚本", tone: "script" },
  rar: { label: "ZIP", title: "压缩包", tone: "archive" },
  safetensors: { label: "MDL", title: "模型权重文件", tone: "model" },
  sh: { label: "SH", title: "Shell 脚本", tone: "script" },
  tar: { label: "TAR", title: "归档文件", tone: "archive" },
  toml: { label: "CFG", title: "配置文件", tone: "code" },
  ts: { label: "TS", title: "TypeScript 文件", tone: "code" },
  tsx: { label: "TSX", title: "TSX 文件", tone: "code" },
  txt: { label: "TXT", title: "文本文件", tone: "document" },
  webp: { label: "IMG", title: "图片文件", tone: "image" },
  xls: { label: "XLS", title: "表格文件", tone: "data" },
  xlsx: { label: "XLS", title: "表格文件", tone: "data" },
  yaml: { label: "YML", title: "YAML 配置文件", tone: "code" },
  yml: { label: "YML", title: "YAML 配置文件", tone: "code" },
  zip: { label: "ZIP", title: "压缩包", tone: "archive" },
};

const DEFAULT_FILE_FORMAT_ICON: FileFormatIconMeta = {
  label: "FILE",
  title: "文件",
  tone: "default",
};

export function mapFilesToChatAttachments(files: File[]): ChatAttachment[] {
  return files.map((file) => ({
    name: file.name,
    path: window.ysyDesktop?.getFilePath?.(file) ?? "",
    file,
  }));
}

function getAttachmentExtension(attachment: ChatAttachment) {
  const source = attachment.name || attachment.path.split(/[\\/]/).pop() || "";
  const cleanSource = source.split(/[?#]/)[0] ?? "";
  const dotIndex = cleanSource.lastIndexOf(".");
  if (dotIndex <= 0 || dotIndex === cleanSource.length - 1) return "";
  return cleanSource.slice(dotIndex + 1).toLowerCase();
}

export function AttachmentFormatIcon({ attachment }: { attachment: ChatAttachment }) {
  if (attachment.kind === "directory") {
    const folderIcon: FileFormatIconMeta = { label: "DIR", title: "文件夹", tone: "folder" };
    return (
      <span
        className={`file-format-icon file-format-icon--${folderIcon.tone}`}
        aria-hidden="true"
        title={folderIcon.title}
      >
        <svg viewBox="0 0 24 24" focusable="false">
          <path className="file-format-icon__sheet" d="M4 6.5h6.1l1.75 2H20v10.75H4V6.5Z" />
          <path className="file-format-icon__fold" d="M4 9h16" />
          <text className="file-format-icon__label" x="12" y="16.5" textAnchor="middle">
            {folderIcon.label}
          </text>
        </svg>
      </span>
    );
  }

  const extension = getAttachmentExtension(attachment);
  const icon = FILE_FORMAT_ICONS[extension] ?? DEFAULT_FILE_FORMAT_ICON;

  return (
    <span
      className={`file-format-icon file-format-icon--${icon.tone}`}
      aria-hidden="true"
      title={icon.title}
    >
      <svg viewBox="0 0 24 24" focusable="false">
        <path className="file-format-icon__sheet" d="M6 2.75h8.25L19 7.5v13.75H6V2.75Z" />
        <path className="file-format-icon__fold" d="M14.25 2.75V7.5H19" />
        <text className="file-format-icon__label" x="12" y="16.2" textAnchor="middle">
          {icon.label}
        </text>
      </svg>
    </span>
  );
}

export function useOpenChatAttachment() {
  return useCallback(async (attachment: ChatAttachment) => {
    if (attachment.path) {
      try {
        await window.ysyDesktop?.openFile?.(attachment.path);
        return;
      } catch (error) {
        console.error("打开文件失败:", attachment.path, error);
      }
    }

    if (attachment.file) {
      const blobUrl = URL.createObjectURL(attachment.file);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = attachment.file.name;
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      return;
    }

    console.warn("无法打开文件：没有路径也没有 File 对象", attachment.name);
  }, []);
}

export function SelectedAttachmentList({
  attachments,
  onRemove,
  onAfterOpen,
}: {
  attachments: ChatAttachment[];
  onRemove: (index: number) => void;
  onAfterOpen?: () => void;
}) {
  const openAttachment = useOpenChatAttachment();
  if (attachments.length === 0) return null;

  return (
    <div className="prompt-attachments" aria-label="已选择附件">
      {attachments.map((attachment, index) => (
        <span className="prompt-attachment" key={`${attachment.name}-${attachment.path}-${index}`}>
          <button
            className="prompt-attachment__open"
            type="button"
            title={attachment.path ? `打开 ${attachment.name}` : attachment.file ? `在浏览器中打开 ${attachment.name}` : `无法打开 ${attachment.name}`}
            disabled={!attachment.path && !attachment.file}
            onClick={(event) => {
              event.stopPropagation();
              void openAttachment(attachment).then(onAfterOpen);
            }}
          >
            <AttachmentFormatIcon attachment={attachment} />
            <span className="prompt-attachment__name">{attachment.name}</span>
          </button>
          <button
            className="prompt-attachment__remove"
            type="button"
            title={`移除 ${attachment.name}`}
            aria-label={`移除 ${attachment.name}`}
            onClick={() => onRemove(index)}
          >
            <X size={12} />
          </button>
        </span>
      ))}
    </div>
  );
}

export function MessageAttachmentList({ attachments }: { attachments?: ChatAttachment[] }) {
  const openAttachment = useOpenChatAttachment();
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="chat-message__attachments" aria-label="消息附件">
      {attachments.map((attachment, index) => (
        <button
          className="chat-message__attachment"
          key={`${attachment.name}-${attachment.path}-${index}`}
          type="button"
          title={attachment.path ? `打开 ${attachment.name}` : attachment.file ? `在浏览器中打开 ${attachment.name}` : `无法打开 ${attachment.name}`}
          disabled={!attachment.path && !attachment.file}
          onClick={(event) => {
            event.stopPropagation();
            void openAttachment(attachment);
          }}
        >
          <AttachmentFormatIcon attachment={attachment} />
          <span className="chat-message__attachment-name">{attachment.name}</span>
        </button>
      ))}
    </div>
  );
}
