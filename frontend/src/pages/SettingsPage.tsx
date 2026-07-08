import { Activity, Bot, CheckCircle2, FolderOpen, Pencil, Plus, RotateCw, Save, Star, Trash2, User, X, XCircle } from "lucide-react";
import { useRef, useState } from "react";
import { StatusBadge } from "../components/StatusBadge";
import { assistantModelDetails, assistantModels, runtimeEnvironmentDetails, runtimeEnvironments } from "../mocks/prototypeData";
import type { AssistantModelDetail, RuntimeEnvironmentDetail } from "../types/domain";

type SettingsTab = "environment" | "assistant" | "profile";

const tabs: Array<{ key: SettingsTab; label: string }> = [
  { key: "environment", label: "环境" },
  { key: "assistant", label: "AI助手" },
  { key: "profile", label: "个人信息" },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("environment");
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  const isViewingDetail =
    (activeTab === "environment" && selectedEnvironmentId !== null) ||
    (activeTab === "assistant" && selectedModelId !== null);

  return (
    <section className={`settings-page${isViewingDetail ? " settings-page--detail" : ""}`}>
      {!isViewingDetail ? (
        <header className="settings-topbar">
          <div className="settings-topbar__left">
            <div className="settings-tabs">
              {tabs.map((tab) => (
                <button
                  className={activeTab === tab.key ? "is-active" : ""}
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          {activeTab !== "profile" ? (
            <div className="settings-topbar__right">
              <button className="settings-action-button settings-action-button--primary" type="button">
                <Plus size={15} />
                {activeTab === "assistant" ? "添加模型" : "创建环境"}
              </button>
            </div>
          ) : null}
        </header>
      ) : null}

      <div className="settings-content">
        <div className="settings-main">
          {activeTab === "environment" ? (
            <EnvironmentSettings
              selectedEnvironmentId={selectedEnvironmentId}
              onSelectEnvironment={setSelectedEnvironmentId}
              onBack={() => setSelectedEnvironmentId(null)}
            />
          ) : null}
          {activeTab === "assistant" ? (
            <AssistantModelSettings
              selectedModelId={selectedModelId}
              onSelectModel={setSelectedModelId}
              onBack={() => setSelectedModelId(null)}
            />
          ) : null}
          {activeTab === "profile" ? <ProfileSettings /> : null}
        </div>
      </div>
    </section>
  );
}

function EnvironmentSettings({
  selectedEnvironmentId,
  onSelectEnvironment,
  onBack,
}: {
  selectedEnvironmentId: string | null;
  onSelectEnvironment: (id: string) => void;
  onBack: () => void;
}) {
  const selectedDetail: RuntimeEnvironmentDetail | null =
    selectedEnvironmentId && runtimeEnvironmentDetails[selectedEnvironmentId]
      ? runtimeEnvironmentDetails[selectedEnvironmentId]
      : null;

  // 详情页
  if (selectedDetail) {
    return (
      <EnvironmentDetail
        detail={selectedDetail}
        onBack={onBack}
      />
    );
  }

  // 列表页
  return (
    <div className="environment-list" aria-label="运行环境列表">
      {runtimeEnvironments.map((env) => (
        <article
          className="environment-card"
          key={env.id}
          onClick={() => onSelectEnvironment(env.id)}
        >
          <div className="environment-card__icon" aria-hidden="true">
            <span />
          </div>
          <div className="environment-card__body">
            <div className="environment-card__heading">
              <h2>{env.name}</h2>
              <StatusBadge label={env.status} tone={env.tone} />
              {env.isDefault ? <span className="default-pill">默认</span> : null}
            </div>
            <p>{env.purpose}</p>
            <div className="environment-card__meta">
              <span>{env.python}</span>
              <span>{env.framework}</span>
              <span>{env.cuda}</span>
            </div>
          </div>
          <div className="environment-card__side">
            <time>{env.updatedAt}</time>
            <div className="environment-card__actions">
              <button type="button" onClick={(e) => { e.stopPropagation(); }}>
                <RotateCw size={13} />
                检测环境
              </button>
              <button className="environment-card__danger" type="button" onClick={(e) => { e.stopPropagation(); }}>
                <Trash2 size={13} />
                删除
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

/** 环境详情页（整页替换列表） */
function EnvironmentDetail({
  detail,
  onBack,
}: {
  detail: RuntimeEnvironmentDetail;
  onBack: () => void;
}) {
  return (
    <div className="env-detail-page">
      {/* 头部 */}
      <div className="env-detail__header">
        <div className="env-detail__header-left">
          <button className="env-detail__back-btn" onClick={onBack} type="button" title="返回环境列表">
            <X size={18} />
          </button>
          <div className="env-detail__icon" aria-hidden="true">
            <span />
          </div>
          <div className="env-detail__titles">
            <h2>{detail.name}</h2>
            <div className="env-detail__badges">
              <span className="env-detail__purpose-tag">{detail.purpose}</span>
              <StatusBadge label={detail.status} tone={detail.tone} />
            </div>
          </div>
        </div>
        <div className="env-detail__header-actions">
          <button className="settings-action-button settings-action-button--primary" type="button">
            <RotateCw size={15} />
            检测环境
          </button>
          <button className="settings-action-button settings-action-button--danger" type="button">
            <Trash2 size={15} />
            删除
          </button>
        </div>
      </div>

      {/* 主体内容 */}
      <div className="env-detail__body">
        {/* 基础信息 */}
        <section className="env-detail__section">
          <h3>基础信息</h3>
          <div className="env-detail__info-grid">
            <div className="env-detail__info-item">
              <span className="env-detail__info-label">环境名称</span>
              <span className="env-detail__info-value">{detail.name}</span>
            </div>
            <div className="env-detail__info-item">
              <span className="env-detail__info-label">环境用途</span>
              <span className="env-detail__info-value">{detail.purpose}</span>
            </div>
            <div className="env-detail__info-item">
              <span className="env-detail__info-label">Python 版本</span>
              <span className="env-detail__info-value">{detail.python}</span>
            </div>
            <div className="env-detail__info-item">
              <span className="env-detail__info-label">框架</span>
              <span className="env-detail__info-value">{detail.framework}</span>
            </div>
            <div className="env-detail__info-item">
              <span className="env-detail__info-label">CUDA 版本</span>
              <span className="env-detail__info-value">{detail.cuda}</span>
            </div>
            <div className="env-detail__info-item">
              <span className="env-detail__info-label">最近检测时间</span>
              <span className="env-detail__info-value">{detail.lastCheckTime}</span>
            </div>
            <div className="env-detail__info-item">
              <span className="env-detail__info-label">最近检测结果</span>
              <span className={`env-detail__info-value env-detail__info-value--${detail.tone}`}>
                {detail.lastCheckResult}
              </span>
            </div>
          </div>
        </section>

        {/* 检测结果 */}
        <section className="env-detail__section">
          <h3>检测结果</h3>
          <div className="env-detail__check-list">
            {detail.checkItems.map((item) => (
              <div className="env-detail__check-item" key={item.label}>
                {item.passed ? (
                  <CheckCircle2 className="env-detail__check-icon env-detail__check-icon--pass" size={18} />
                ) : (
                  <XCircle className="env-detail__check-icon env-detail__check-icon--fail" size={18} />
                )}
                <span className="env-detail__check-label">{item.label}</span>
                <span className={`env-detail__check-status env-detail__check-status--${item.passed ? "pass" : "fail"}`}>
                  {item.passed ? "通过" : "未通过"}
                </span>
                {item.detail ? (
                  <span className="env-detail__check-detail">{item.detail}</span>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        {/* 使用建议 */}
        <section className="env-detail__section">
          <h3>使用建议</h3>
          <div className={`env-detail__suggestion env-detail__suggestion--${detail.tone}`}>
            <p>{detail.suggestion}</p>
          </div>
        </section>
      </div>
    </div>
  );
}

function AssistantModelSettings({
  selectedModelId,
  onSelectModel,
  onBack,
}: {
  selectedModelId: string | null;
  onSelectModel: (id: string) => void;
  onBack: () => void;
}) {
  const selectedDetail: AssistantModelDetail | null =
    selectedModelId && assistantModelDetails[selectedModelId]
      ? assistantModelDetails[selectedModelId]
      : null;

  // 详情页
  if (selectedDetail) {
    return <ModelDetail detail={selectedDetail} onBack={onBack} />;
  }

  // 列表页
  return (
    <section className="model-management">
      <div className="settings-section-heading">
        <h2>模型管理</h2>
        <p>管理模型来源、连接检测、默认模型和适用场景。</p>
      </div>
      <div className="assistant-model-grid" aria-label="AI 助手模型列表">
        {assistantModels.map((model) => (
          <article
            className={`assistant-model-card${
              model.isDefault ? " assistant-model-card--selected" : ""
            }`}
            key={model.id}
            onClick={() => onSelectModel(model.id)}
            style={{ cursor: "pointer" }}
          >
            <div className={`assistant-model-card__icon assistant-model-card__icon--${model.variant}`}>
              <Bot size={20} />
            </div>
            <StatusBadge label={model.status} tone={model.tone} />
            <h3>{model.name}</h3>
            <span className="model-provider">{model.provider}</span>
            <span className="model-context">{model.context}</span>
            <div className="model-card-actions">
              <button type="button">检测模型</button>
              <button type="button">
                <Star size={15} />
                设为默认
              </button>
              <button type="button">编辑</button>
              <button className="model-icon-action" type="button" title="删除">
                <X size={15} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/** AI 助手模型详情页（整页替换列表） */
function ModelDetail({
  detail,
  onBack,
}: {
  detail: AssistantModelDetail;
  onBack: () => void;
}) {
  return (
    <div className="env-detail-page">
      {/* 头部 */}
      <div className="env-detail__header">
        <div className="env-detail__header-left">
          <button className="env-detail__back-btn" onClick={onBack} type="button" title="返回模型列表">
            <X size={18} />
          </button>
          <div className={`env-detail__model-icon env-detail__model-icon--${detail.variant}`}>
            <Bot size={22} />
          </div>
          <div className="env-detail__titles">
            <h2>{detail.name}</h2>
            <div className="env-detail__badges">
              <span className="env-detail__purpose-tag">{detail.provider}</span>
              <StatusBadge label={detail.status} tone={detail.tone} />
              {detail.isDefault ? <span className="default-pill">默认</span> : null}
            </div>
          </div>
        </div>
        <div className="env-detail__header-actions">
          <button className="settings-action-button" type="button">
            <Pencil size={15} />
            编辑
          </button>
          <button className="settings-action-button settings-action-button--danger" type="button">
            <Trash2 size={15} />
            删除
          </button>
          <button className="settings-action-button settings-action-button--primary" type="button">
            <Activity size={15} />
            连接测试
          </button>
        </div>
      </div>

      {/* 主体内容 */}
      <div className="env-detail__body">
        {/* 链接信息 */}
        <section className="env-detail__section">
          <h3>链接信息</h3>
          <div className="env-detail__info-card">
            <div className="env-detail__info-grid">
              <div className="env-detail__info-item">
                <span className="env-detail__info-label">模型名称</span>
                <span className="env-detail__info-value">{detail.name}</span>
              </div>
              <div className="env-detail__info-item">
                <span className="env-detail__info-label">模型厂商</span>
                <span className="env-detail__info-value">{detail.provider}</span>
              </div>
              <div className="env-detail__info-item env-detail__info-item--full">
                <span className="env-detail__info-label">API Base URL</span>
                <span className="env-detail__info-value env-detail__info-value--mono">{detail.apiBaseUrl}</span>
              </div>
              <div className="env-detail__info-item">
                <span className="env-detail__info-label">模型标识</span>
                <span className="env-detail__info-value env-detail__info-value--mono">{detail.modelId}</span>
              </div>
              <div className="env-detail__info-item">
                <span className="env-detail__info-label">API Key</span>
                {detail.apiKeyConfigured ? (
                  <span className="env-detail__info-value env-detail__info-value--mono env-detail__api-key">
                    {detail.apiKey}
                  </span>
                ) : (
                  <span className="env-detail__info-value env-detail__info-value--warning">未配置</span>
                )}
              </div>
              <div className="env-detail__info-item">
                <span className="env-detail__info-label">连接状态</span>
                <span className={`env-detail__info-value env-detail__info-value--${detail.tone}`}>
                  <span className={`env-detail__status-dot env-detail__status-dot--${detail.tone}`} />
                  {detail.connectionStatus}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 生成参数 */}
        <section className="env-detail__section">
          <h3>生成参数</h3>
          <div className="env-detail__info-card">
            <div className="env-detail__info-grid">
              <div className="env-detail__info-item">
                <span className="env-detail__info-label">上下文长度</span>
                <span className="env-detail__info-value">{detail.context}</span>
              </div>
              <div className="env-detail__info-item">
                <span className="env-detail__info-label">最大输出长度</span>
                <span className="env-detail__info-value">{detail.maxOutputLength}</span>
              </div>
              <div className="env-detail__info-item">
                <span className="env-detail__info-label">Temperature</span>
                <span className="env-detail__info-value">{detail.temperature}</span>
              </div>
              <div className="env-detail__info-item">
                <span className="env-detail__info-label">超时时间</span>
                <span className="env-detail__info-value">{detail.timeout}</span>
              </div>
              <div className="env-detail__info-item">
                <span className="env-detail__info-label">重试次数</span>
                <span className="env-detail__info-value">{detail.retryCount}</span>
              </div>
              <div className="env-detail__info-item">
                <span className="env-detail__info-label">默认模型</span>
                <span className={`env-detail__info-value env-detail__bool-pill${detail.isDefault ? " env-detail__bool-pill--true" : ""}`}>
                  {detail.isDefault ? "是" : "否"}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function ProfileSettings() {
  const [profile, setProfile] = useState({
    username: "admin",
    account: "local-user@example.com",
    workspace: "D:/workspace",
    datasetPath: "D:/datasets",
    modelPath: "D:/models",
    exportPath: "D:/reports",
    project: "工业缺陷检测实验",
    density: "标准",
    pathDisplay: "显示盘符，隐藏用户名",
  });

  function updateProfile(key: keyof typeof profile, value: string) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="profile-settings">
      <div className="profile-account">
        <div className="profile-card-head">
          <span className="profile-avatar">
            <User size={30} />
          </span>
          <div>
            <h2>admin</h2>
            <p>本机账户</p>
          </div>
        </div>
        <div className="profile-field-grid">
          <EditableField
            label="用户名"
            onChange={(value) => updateProfile("username", value)}
            value={profile.username}
          />
          <EditableField
            label="账号信息"
            onChange={(value) => updateProfile("account", value)}
            value={profile.account}
          />
          <PathField
            label="默认工作区"
            onChange={(value) => updateProfile("workspace", value)}
            value={profile.workspace}
          />
          <PathField
            label="默认数据路径"
            onChange={(value) => updateProfile("datasetPath", value)}
            value={profile.datasetPath}
          />
          <PathField
            label="默认模型路径"
            onChange={(value) => updateProfile("modelPath", value)}
            value={profile.modelPath}
          />
          <PathField
            label="默认导出路径"
            onChange={(value) => updateProfile("exportPath", value)}
            value={profile.exportPath}
          />
        </div>
      </div>
      <div className="profile-preferences">
        <h2>偏好配置</h2>
        <SelectField
          label="默认项目"
          onChange={(value) => updateProfile("project", value)}
          options={["工业缺陷检测实验", "客服问答 SFT", "自然场景分类实验", "知识库 Rerank 实验"]}
          value={profile.project}
        />
        <SelectField
          label="界面密度"
          onChange={(value) => updateProfile("density", value)}
          options={["紧凑", "标准", "宽松"]}
          value={profile.density}
        />
        <SelectField
          label="路径显示"
          onChange={(value) => updateProfile("pathDisplay", value)}
          options={["显示完整路径", "显示盘符，隐藏用户名", "仅显示目录名"]}
          value={profile.pathDisplay}
        />
        <div className="profile-actions">
          <button type="button">恢复默认</button>
          <button type="button">
            <Save size={15} />
            保存偏好
          </button>
        </div>
      </div>
    </section>
  );
}

function EditableField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="profile-field">
      <span>{label}</span>
      <input onChange={(event) => onChange(event.target.value)} value={value} />
    </label>
  );
}

function PathField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <label className="profile-field">
      <span>{label}</span>
      <div className="profile-path-control">
        <input onChange={(event) => onChange(event.target.value)} value={value} />
        <button
          onClick={() => inputRef.current?.click()}
          type="button"
          title="选择文件夹"
        >
          <FolderOpen size={15} />
        </button>
        <input
          ref={inputRef}
          className="profile-folder-input"
          onChange={(event) => {
            const file = event.target.files?.[0];
            const electronPath = file ? (file as File & { path?: string }).path : "";
            const path = electronPath || (file ? file.webkitRelativePath.split("/")[0] : "");
            if (path) {
              onChange(path);
            }
          }}
          type="file"
          // @ts-expect-error webkitdirectory is supported by Chromium/Electron.
          webkitdirectory=""
        />
      </div>
    </label>
  );
}

function SelectField({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <label className="profile-field">
      <span>{label}</span>
      <select onChange={(event) => onChange(event.target.value)} value={value}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
