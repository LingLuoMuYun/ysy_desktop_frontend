/**
 * 项目列表 Hook
 *
 * 封装列表筛选、搜索、分页状态，调用 projectsApi，
 * 并通过 window.location.search 同步筛选条件到 URL。
 * 筛选变更时自动重置到第 1 页。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { projectsApi, type ProjectSpecs } from "../../services/projectsApi";
import type { ProjectSummary } from "../../types/domain";

const PAGE_SIZE = 5;

/** 规格加载失败时的本地回退选项 */
const FALLBACK_SPECS: ProjectSpecs = {
  projectTypes: [
    "图像分类",
    "目标检测",
    "语义分割",
    "自定义深度学习",
    "LLM 微调",
    "Embedding 微调",
    "Rerank 微调",
    "自定义项目",
  ],
  statusOptions: [
    { value: "pending_config", label: "待配置" },
    { value: "preparing", label: "准备中" },
    { value: "trainable", label: "可训练" },
    { value: "running", label: "运行中" },
    { value: "risk", label: "存在风险" },
    { value: "unavailable", label: "不可用" },
    { value: "archived", label: "已归档" },
  ],
  workspaceOptions: [],
  compatibleEnvironments: [],
};

interface ProjectListState {
  items: ProjectSummary[];
  page: number;
  total: number;
  totalPages: number;
}

/** 从当前 URL 解析筛选初始值 */
function readFiltersFromURL() {
  const params = new URLSearchParams(window.location.search);
  return {
    keyword: params.get("keyword") ?? "",
    selectedType: params.get("type") ?? "全部",
    selectedStatus: params.get("status") ?? "全部",
    currentPage: Math.max(1, Number(params.get("page")) || 1),
  };
}

/** 将筛选状态写回 URL（使用 replaceState 不产生历史记录） */
function syncFiltersToURL(
  keyword: string,
  selectedType: string,
  selectedStatus: string,
  currentPage: number,
) {
  const params = new URLSearchParams();
  if (keyword) params.set("keyword", keyword);
  if (selectedType !== "全部") params.set("type", selectedType);
  if (selectedStatus !== "全部") params.set("status", selectedStatus);
  if (currentPage > 1) params.set("page", String(currentPage));
  const query = params.toString();
  const newUrl = `${window.location.pathname}${query ? "?" + query : ""}`;
  window.history.replaceState(null, "", newUrl);
}

export function useProjectList() {
  // 从 URL 恢复初始状态（仅首次渲染）
  const initialFilters = useRef(readFiltersFromURL());

  const [keyword, setKeyword] = useState(initialFilters.current.keyword);
  const [selectedType, setSelectedType] = useState(initialFilters.current.selectedType);
  const [selectedStatus, setSelectedStatus] = useState(initialFilters.current.selectedStatus);
  const [currentPage, setCurrentPage] = useState(initialFilters.current.currentPage);

  const [specs, setSpecs] = useState<ProjectSpecs>(FALLBACK_SPECS);
  const [specsError, setSpecsError] = useState<string | null>(null);
  const [listState, setListState] = useState<ProjectListState>({
    items: [],
    page: 1,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // 根据 specs 派生筛选选项
  const typeOptions = useMemo(() => ["全部", ...specs.projectTypes], [specs.projectTypes]);
  const statusOptions = useMemo(
    () => [{ value: "", label: "全部" }, ...specs.statusOptions],
    [specs.statusOptions],
  );

  // 加载项目规格（仅挂载时一次）
  useEffect(() => {
    let ignore = false;
    projectsApi
      .specs()
      .then((nextSpecs) => {
        if (!ignore) setSpecs(nextSpecs);
      })
      .catch((error) => {
        if (!ignore) {
          setSpecsError(error instanceof Error ? error.message : "项目规格加载失败，已使用本地选项");
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  // 加载项目列表
  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setListError(null);
    try {
      const result = await projectsApi.list({
        keyword,
        type: selectedType === "全部" ? undefined : selectedType,
        status: selectedStatus === "全部" ? undefined : selectedStatus,
        page: currentPage,
        pageSize: PAGE_SIZE,
      });
      setListState({
        items: result.items,
        page: result.page,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      setListError(error instanceof Error ? error.message : "项目列表加载失败");
    } finally {
      setIsLoading(false);
    }
  }, [keyword, selectedType, selectedStatus, currentPage]);

  // 筛选或分页变化时重新加载
  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  // 筛选条件变化时重置到第 1 页
  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, selectedType, selectedStatus]);

  // URL 同步：筛选 / 分页变化时写入 URL
  useEffect(() => {
    syncFiltersToURL(keyword, selectedType, selectedStatus, currentPage);
  }, [keyword, selectedType, selectedStatus, currentPage]);

  // 浏览器前进 / 后退时从 URL 恢复状态
  useEffect(() => {
    const handlePopState = () => {
      const filters = readFiltersFromURL();
      setKeyword(filters.keyword);
      setSelectedType(filters.selectedType);
      setSelectedStatus(filters.selectedStatus);
      setCurrentPage(filters.currentPage);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return {
    // 列表状态
    listState,
    isLoading,
    listError,
    reload: loadProjects,

    // 筛选状态
    keyword,
    selectedType,
    selectedStatus,
    currentPage,
    setKeyword,
    setSelectedType,
    setSelectedStatus,
    setCurrentPage,

    // 规格
    specs,
    specsError,
    typeOptions,
    statusOptions,
  };
}
