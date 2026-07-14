import { Bot } from "lucide-react";
import aliyunVendorIcon from "../assets/vendor-icons/aliyun.png";
import deepseekVendorIcon from "../assets/vendor-icons/deepseek.png";
import minimaxVendorIcon from "../assets/vendor-icons/minimax.png";
import moonshotVendorIcon from "../assets/vendor-icons/moonshot.png";
import siliconflowVendorIcon from "../assets/vendor-icons/siliconflow.png";
import stepfunVendorIcon from "../assets/vendor-icons/stepfun.png";
import volcengineVendorIcon from "../assets/vendor-icons/volcengine.png";
import xiaomiVendorIcon from "../assets/vendor-icons/xiaomi.png";
import zhipuVendorIcon from "../assets/vendor-icons/zhipu.png";
import type { AssistantModelSummary } from "../types/domain";

const MODEL_VENDOR_ICON_MAP: Record<string, string> = {
  aliyun: aliyunVendorIcon,
  dashscope: aliyunVendorIcon,
  "阿里云": aliyunVendorIcon,
  "阿里云百炼": aliyunVendorIcon,
  deepseek: deepseekVendorIcon,
  minimax: minimaxVendorIcon,
  moonshot: moonshotVendorIcon,
  "月之暗面": moonshotVendorIcon,
  siliconflow: siliconflowVendorIcon,
  "硅基流动": siliconflowVendorIcon,
  stepfun: stepfunVendorIcon,
  "阶跃星辰": stepfunVendorIcon,
  volcengine: volcengineVendorIcon,
  "火山引擎": volcengineVendorIcon,
  xiaomi: xiaomiVendorIcon,
  xiaomi_mimo: xiaomiVendorIcon,
  "小米": xiaomiVendorIcon,
  zhipu: zhipuVendorIcon,
  "智谱": zhipuVendorIcon,
};

function normalizeVendorIconKey(value: string) {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

export function getModelVendorIcon(provider: string) {
  const direct = MODEL_VENDOR_ICON_MAP[provider] || MODEL_VENDOR_ICON_MAP[provider.trim()];
  if (direct) return direct;

  const normalizedProvider = normalizeVendorIconKey(provider);
  const matched = Object.entries(MODEL_VENDOR_ICON_MAP).find(([key]) => {
    const normalizedKey = normalizeVendorIconKey(key);
    return normalizedProvider === normalizedKey || normalizedProvider.includes(normalizedKey);
  });
  return matched?.[1] ?? null;
}

export function ModelVendorOptionIcon({ provider }: { provider: string }) {
  const iconUrl = getModelVendorIcon(provider);
  return (
    <span className={`model-vendor-option-icon${iconUrl ? " model-vendor-option-icon--image" : ""}`} aria-hidden="true">
      {iconUrl ? <img src={iconUrl} alt="" /> : provider.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function ModelVendorAvatar({
  provider,
  variant,
  className = "",
}: {
  provider: string;
  variant: AssistantModelSummary["variant"];
  className?: string;
}) {
  const iconUrl = getModelVendorIcon(provider);
  const classNames = `${className} assistant-model-card__icon assistant-model-card__icon--${variant}${
    iconUrl ? " assistant-model-card__icon--image" : ""
  }`.trim();

  return (
    <div className={classNames} title={provider} aria-label={`${provider} 图标`}>
      {iconUrl ? <img src={iconUrl} alt="" /> : <Bot size={20} />}
    </div>
  );
}
