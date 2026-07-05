import React, { useState, useEffect } from "react";
import {
  INITIAL_MARKETING_DATA,
  DEFAULT_COMMENTS_LIVOTEC,
  DEFAULT_COMMENTS_KAROFI,
  MarketingReportData,
  BrandComments,
  CategoryComments,
  normalizeMarketingData,
} from "./data";
import { exportToExcel, exportToJSON } from "./lib/export";
import {
  TrendingUp,
  Award,
  Users,
  Video,
  Target,
  BarChart3,
  Globe,
  Settings2,
  FileSpreadsheet,
  FileJson,
  Upload,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Calendar,
  Layers,
  Percent,
  CheckSquare,
  FileText,
  DollarSign,
  Briefcase,
  Eye,
  UserCheck,
  Store,
  Shield,
  Lock,
  UserPlus,
  Trash2,
  Edit3,
  LogOut,
  UserMinus,
  Printer,
  Mail,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

// Default user metadata
const USER_EMAIL = "ntkdung1206@gmail.com";

export function getTimelines(marketingData: MarketingReportData) {
  const weeksSet = new Set<string>();
  
  if (marketingData?.digital_marketing) {
    marketingData.digital_marketing.forEach((row) => {
      if (row.week) weeksSet.add(row.week);
    });
  }
  if (marketingData?.kol_koc) {
    marketingData.kol_koc.forEach((row) => {
      if (row.week) weeksSet.add(row.week);
    });
  }
  if (marketingData?.btl_trade) {
    marketingData.btl_trade.forEach((row) => {
      if (row.week) weeksSet.add(row.week);
    });
  }
  if (marketingData?.monthly_ooh_pr) {
    marketingData.monthly_ooh_pr.forEach((row) => {
      if (row.week) weeksSet.add(row.week);
    });
  }

  // Ensure "week4", "week3", "week2" are always present as fallback if empty
  if (weeksSet.size === 0) {
    ["week4", "week3", "week2"].forEach((w) => weeksSet.add(w));
  }

  // Sort weeks in descending order (latest first)
  const sortedWeeks = Array.from(weeksSet).sort((a, b) => b.localeCompare(a));

  const TIMELINE_LABELS_MAP: { [key: string]: string } = {
    "week4": "Tuần 4 (19/06 - 25/06/2026)",
    "week3": "Tuần 3 (12/06 - 18/06/2026)",
    "week2": "Tuần 2 (05/06 - 11/06/2026)",
    "week1": "Tuần 1 (01/06 - 04/06/2026)",
  };

  return sortedWeeks.map((wk) => {
    let label = TIMELINE_LABELS_MAP[wk];
    if (!label) {
      if (wk.startsWith("week")) {
        const num = wk.substring(4);
        label = `Tuần ${num}`;
      } else {
        label = wk;
      }
    }
    const isPRWeek = marketingData?.monthly_ooh_pr?.some(
      (row) => row.week === wk && row.hạng_mục === "PR - báo chí" && (row.thực_tế_actual || 0) > 0
    ) || false;

    return {
      id: wk,
      label: label,
      isPRWeek: isPRWeek,
    };
  });
}

export function getEndOfWeekDate(weekStr: string) {
  let str = weekStr || "";
  const TIMELINE_LABELS_MAP: { [key: string]: string } = {
    "week4": "19/06 - 25/06/2026",
    "week3": "12/06 - 18/06/2026",
    "week2": "05/06 - 11/06/2026",
    "week1": "01/06 - 04/06/2026",
  };
  if (TIMELINE_LABELS_MAP[str]) {
    str = TIMELINE_LABELS_MAP[str];
  }
  
  const parts = str.split(/-|\s+-\s+/);
  if (parts.length >= 2) {
    const endDateStr = parts[parts.length - 1].trim();
    const cleaned = endDateStr.replace(/[^0-9/]/g, "");
    const dateParts = cleaned.split("/");
    if (dateParts.length === 3) {
      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10);
      const year = parseInt(dateParts[2], 10);
      return { day, month, year };
    }
  } else {
    const cleanStr = str.replace(/[^0-9/\-]/g, "");
    const p = cleanStr.split("-");
    if (p.length >= 2) {
      const endDateStr = p[p.length - 1];
      const dateParts = endDateStr.split("/");
      if (dateParts.length === 3) {
        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10);
        const year = parseInt(dateParts[2], 10);
        return { day, month, year };
      }
    }
  }
  return { day: 25, month: 6, year: 2026 };
}

export function getBtlReportMonth(weekStr: string): { month: number; year: number } {
  const endInfo = getEndOfWeekDate(weekStr);
  return { month: endInfo.month, year: endInfo.year };
}

export function getBtlRowDataValues(row: any) {
  if (!row) {
    return {
      thisMonth: 6,
      lastMonth: 5,
      lastMonthVal: null,
      planVal: null,
      accVal: null,
      lastMonthKey: "thực_hiện_tháng",
      thisMonthPlanKey: "kế_hoạch_tháng",
      thisMonthAccumulatedKey: "tích_lũy_tháng"
    };
  }
  const info = getBtlReportMonth(row.week || "");
  const thisMonth = info.month;
  const lastMonth = thisMonth === 1 ? 12 : thisMonth - 1;
  
  const lastMonthKey = "thực_hiện_tháng";
  const thisMonthPlanKey = "kế_hoạch_tháng";
  const thisMonthAccumulatedKey = "tích_lũy_tháng";

  let lastMonthVal = row.thực_hiện_tháng;
  if (lastMonthVal === undefined || lastMonthVal === null) {
    const fallbackKey = `thực_hiện_tháng_${lastMonth}`;
    lastMonthVal = row[fallbackKey] !== undefined && row[fallbackKey] !== null ? row[fallbackKey] : row.thực_hiện_tháng_5;
  }

  let planVal = row.kế_hoạch_tháng;
  if (planVal === undefined || planVal === null) {
    const fallbackKey = `kế_hoạch_tháng_${thisMonth}`;
    planVal = row[fallbackKey] !== undefined && row[fallbackKey] !== null ? row[fallbackKey] : row.kế_hoạch_tháng_6;
  }

  let accVal = row.tích_lũy_tháng;
  if (accVal === undefined || accVal === null) {
    const fallbackKey = `tích_lũy_tháng_${thisMonth}`;
    accVal = row[fallbackKey] !== undefined && row[fallbackKey] !== null ? row[fallbackKey] : row.tích_lũy_tháng;
  }

  return {
    thisMonth,
    lastMonth,
    lastMonthVal: lastMonthVal !== undefined && lastMonthVal !== null && lastMonthVal !== "" ? Number(lastMonthVal) : null,
    planVal: planVal !== undefined && planVal !== null && planVal !== "" ? Number(planVal) : null,
    accVal: accVal !== undefined && accVal !== null && accVal !== "" ? Number(accVal) : null,
    lastMonthKey,
    thisMonthPlanKey,
    thisMonthAccumulatedKey
  };
}

export interface UserAccount {
  username: string;
  password: string;
  name: string;
  role: "Admin" | "Editor" | "Viewer";
}

const DEFAULT_USERS: UserAccount[] = [
  { username: "ntkdung1206@gmail.com", password: "123", name: "Dũng Nguyễn", role: "Admin" },
  { username: "admin", password: "123", name: "Quản trị hệ thống", role: "Admin" },
  { username: "editor1", password: "123", name: "Nguyễn Biên Tập", role: "Editor" },
  { username: "viewer1", password: "123", name: "Lê Người Xem", role: "Viewer" }
];

export interface BrandKpiTarget {
  id: string;
  brandName: string;
  sovTargetRank: string;
  contentTarget: number;
  prTarget: number;
  comment: string;
}

const DEFAULT_BRAND_KPIS: BrandKpiTarget[] = [
  { id: "livotec", brandName: "Livotec", sovTargetRank: "Rank #5", contentTarget: 14, prTarget: 5, comment: "Mục tiêu mặc định cho Livotec" },
  { id: "karofi", brandName: "Karofi", sovTargetRank: "Rank #2", contentTarget: 24, prTarget: 1, comment: "Mục tiêu mặc định cho Karofi" }
];

export default function App() {
  // Authentication & Users State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem("marketing_current_user");
    return saved ? JSON.parse(saved) : null;
  });
  
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem("marketing_users_list");
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });

  // Brand KPI Targets States
  const [brandKpis, setBrandKpis] = useState<BrandKpiTarget[]>(() => {
    const saved = localStorage.getItem("marketing_brand_kpis");
    return saved ? JSON.parse(saved) : DEFAULT_BRAND_KPIS;
  });
  const [kpiBrandId, setKpiBrandId] = useState<"livotec" | "karofi">("livotec");
  const [kpiSovTargetRank, setKpiSovTargetRank] = useState("Rank #5");
  const [kpiContentTarget, setKpiContentTarget] = useState(14);
  const [kpiPrTarget, setKpiPrTarget] = useState(5);
  const [kpiComment, setKpiComment] = useState("Mục tiêu mặc định cho Livotec");

  // Database Editor States
  const [dbActiveTab, setDbActiveTab] = useState<"digital" | "kol" | "btl" | "ooh">("digital");
  const [dbSearchQuery, setDbSearchQuery] = useState("");
  const [dbBrandFilter, setDbBrandFilter] = useState<"Tất cả" | "Livotec" | "Karofi">("Tất cả");
  const [dbEditingRowIndex, setDbEditingRowIndex] = useState<number | null>(null);
  const [dbEditingRowData, setDbEditingRowData] = useState<any | null>(null);
  const [dbPage, setDbPage] = useState(1);
  const dbLimit = 15; // Number of rows per page in database manager

  // Login form inputs
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // User Manager states (Add/Edit User Form)
  const [managerUsername, setManagerUsername] = useState("");
  const [managerPassword, setManagerPassword] = useState("");
  const [managerName, setManagerName] = useState("");
  const [managerRole, setManagerRole] = useState<"Admin" | "Editor" | "Viewer">("Viewer");
  const [editingUsername, setEditingUsername] = useState<string | null>(null);

  // Navigation & Brand States
  const [activeTab, setActiveTab] = useState<"dashboard" | "control-panel">("dashboard");
  const [selectedBrand, setSelectedBrand] = useState<"Livotec" | "Karofi">("Livotec");

  // Core Data States
  const [marketingData, setMarketingData] = useState<MarketingReportData>(INITIAL_MARKETING_DATA);

  // Compute dynamic timelines list from current marketingData
  const timelines = getTimelines(marketingData);

  const [selectedTimeline, setSelectedTimeline] = useState(() => {
    const list = getTimelines(INITIAL_MARKETING_DATA);
    return list[0];
  });

  // Automatically adjust selectedTimeline if it is no longer valid in the updated timelines list
  useEffect(() => {
    const exists = timelines.find((t) => t.id === selectedTimeline.id);
    if (!exists && timelines.length > 0) {
      setSelectedTimeline(timelines[0]);
    }
  }, [marketingData]);

  const [publishedComments, setPublishedComments] = useState<{
    [weekId: string]: { Livotec: BrandComments; Karofi: BrandComments };
  }>({});

  // Helper to get active comments for a given week and brand
  const getActiveComments = (weekId: string, brand: "Livotec" | "Karofi"): BrandComments => {
    if (publishedComments[weekId] && publishedComments[weekId][brand]) {
      return publishedComments[weekId][brand];
    }
    return brand === "Livotec" ? DEFAULT_COMMENTS_LIVOTEC : DEFAULT_COMMENTS_KAROFI;
  };

  // Control Panel Draft Comments States (allows editing before publishing)
  const [draftComments, setDraftComments] = useState<BrandComments>(() => {
    return { ...DEFAULT_COMMENTS_LIVOTEC };
  });

  // UI / Interactive States
  const [categoryTimeViews, setCategoryTimeViews] = useState<{ [key: string]: "week" | "month" }>({
    paidAds: "week",
    seo: "week",
  });
  
  // Category tab state in Box 3
  const [activeCategoryTab, setActiveCategoryTab] = useState<"sov" | "kol" | "content" | "tvc" | "pr" | "ooh" | "ads" | "seo" | "btl">("sov");

  // State for filtering Paid Ads by industry
  const [selectedAdsIndustry, setSelectedAdsIndustry] = useState<string>("Tất cả");

  // Reset Paid Ads industry filter when selected brand changes
  useEffect(() => {
    setSelectedAdsIndustry("Tất cả");
  }, [selectedBrand]);

  // Auto-switch to the first tab with data if the current tab doesn't have data for the selected brand
  useEffect(() => {
    const rawDigital = marketingData?.digital_marketing || [];
    const rawBtl = marketingData?.btl_trade || [];
    const rawKol = marketingData?.kol_koc || [];
    const monthlyOohPrList = marketingData?.monthly_ooh_pr || [];

    const digital = rawDigital.filter(
      (row) => row.brand && row.brand.toLowerCase() === selectedBrand.toLowerCase()
    );
    const btl = rawBtl.filter(
      (row) => row.brand && row.brand.toLowerCase() === selectedBrand.toLowerCase()
    );
    const kol = rawKol.filter((row) => {
      if ("brand" in row && (row as any).brand) {
        return (row as any).brand.toLowerCase() === selectedBrand.toLowerCase();
      }
      return selectedBrand.toLowerCase() === "livotec";
    });

    const brandOohPr = monthlyOohPrList.filter(
      (row) => row.brand && row.brand.toLowerCase() === selectedBrand.toLowerCase()
    );

    const activeBrandSov = rawDigital.filter(
      (row) => row.hạng_mục === "Social Listening"
    ).find(
      (row) => row.kênh_channel && row.kênh_channel.toLowerCase() === selectedBrand.toLowerCase()
    );

    const hasSov = activeBrandSov ? (activeBrandSov.thực_tế_actual || 0) > 0 : false;
    const hasKol = kol.length > 0;
    const hasContent = digital.some((row) => row.nhóm_báo_cáo && row.nhóm_báo_cáo.toLowerCase() === "content");
    const hasTvc = digital.some((row) => row.hạng_mục && row.hạng_mục.toLowerCase() === "tvc" && row.chỉ_số_metric && row.chỉ_số_metric.toLowerCase() === "grps");
    const hasPr = brandOohPr.some((row) => row.hạng_mục && (row.hạng_mục.toLowerCase() === "pr" || row.hạng_mục.toLowerCase() === "pr - báo chí"));
    const hasOoh = brandOohPr.some((row) => row.hạng_mục && row.hạng_mục.toLowerCase() === "ooh");
    const hasAds = digital.some((row) => row.hạng_mục === "Paid Ads");
    const hasSeo = digital.some((row) => row.hạng_mục === "SEO Website" || row.hạng_mục === "SEO Content" || row.hạng_mục === "Product Page");
    const hasBtl = btl.length > 0;

    const tabsStatus = {
      sov: hasSov,
      kol: hasKol,
      content: hasContent,
      tvc: hasTvc,
      pr: hasPr,
      ooh: hasOoh,
      ads: hasAds,
      seo: hasSeo,
      btl: hasBtl
    };

    if (!tabsStatus[activeCategoryTab as keyof typeof tabsStatus]) {
      const firstAvailable = (Object.keys(tabsStatus) as Array<keyof typeof tabsStatus>).find(k => tabsStatus[k]);
      if (firstAvailable) {
        setActiveCategoryTab(firstAvailable as any);
      }
    }
  }, [selectedBrand, marketingData, activeCategoryTab]);

  // Control Panel Import states
  const [driveUrl, setDriveUrl] = useState("");
  const [pastedJson, setPastedJson] = useState(JSON.stringify(INITIAL_MARKETING_DATA, null, 2));
  const [isDriveLoading, setIsDriveLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false);

  // Mail configuration states
  const [mailHost, setMailHost] = useState("");
  const [mailPort, setMailPort] = useState("587");
  const [mailUser, setMailUser] = useState("");
  const [mailPass, setMailPass] = useState("");
  const [mailRecipient, setMailRecipient] = useState("");
  const [mailEnabled, setMailEnabled] = useState(true);
  const [isMailLoading, setIsMailLoading] = useState(false);

  // Load mail configuration from server on load
  useEffect(() => {
    const fetchMailConfig = async () => {
      try {
        const response = await fetch("/api/get-mail-config");
        const result = await response.json();
        if (response.ok && result.success && result.config) {
          setMailHost(result.config.smtp_host || "");
          setMailPort(result.config.smtp_port || "587");
          setMailUser(result.config.smtp_user || "");
          setMailPass(result.config.smtp_pass || "");
          setMailRecipient(result.config.notification_email || "ntkdung1206@gmail.com");
          setMailEnabled(result.config.enabled !== false);
        }
      } catch (err) {
        console.error("Failed to load mail config:", err);
      }
    };
    fetchMailConfig();
  }, [currentUser]);

  // Synchronize draftComments with published comments for current brand & week
  useEffect(() => {
    const active = getActiveComments(selectedTimeline.id, selectedBrand);
    setDraftComments(JSON.parse(JSON.stringify(active)));
    setHasUnpublishedChanges(false);
  }, [selectedTimeline.id, selectedBrand, publishedComments]);

  // Load marketing data and comments from database on load
  useEffect(() => {
    const fetchServerData = async () => {
      try {
        const response = await fetch("/api/get-data");
        const result = await response.json();
        if (response.ok && result.success) {
          const safeData = normalizeMarketingData(result.data);
          setMarketingData(safeData);
          setPastedJson(JSON.stringify(safeData, null, 2));
          localStorage.setItem("marketing_report_raw_data", JSON.stringify(safeData));

          const serverComments = result.comments || {};
          setPublishedComments(serverComments);
          localStorage.setItem("marketing_published_comments", JSON.stringify(serverComments));

          const list = getTimelines(safeData);
          if (list.length > 0) {
            setSelectedTimeline(list[0]);
          }
        } else {
          throw new Error(result.error || "Cannot retrieve data from server");
        }
      } catch (err) {
        console.error("Failed to fetch database data from server, falling back to local storage:", err);
        const savedData = localStorage.getItem("marketing_report_raw_data");
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            if (parsed) {
              const safeData = normalizeMarketingData(parsed);
              setMarketingData(safeData);
              setPastedJson(JSON.stringify(safeData, null, 2));
            }
          } catch (e) {
            console.error("Error reading saved data fallback", e);
          }
        }

        const savedPublished = localStorage.getItem("marketing_published_comments");
        if (savedPublished) {
          try {
            setPublishedComments(JSON.parse(savedPublished));
          } catch (e) {
            console.error("Error reading saved comments fallback", e);
          }
        }
      }
    };

    fetchServerData();
  }, []);

  const triggerNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Persist users to localStorage
  useEffect(() => {
    localStorage.setItem("marketing_users_list", JSON.stringify(users));
  }, [users]);

  // Persist brandKpis to localStorage
  useEffect(() => {
    localStorage.setItem("marketing_brand_kpis", JSON.stringify(brandKpis));
  }, [brandKpis]);

  // Login handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!loginUsername.trim() || !loginPassword) {
      setLoginError("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.");
      return;
    }

    const foundUser = users.find(
      (u) => u.username.toLowerCase() === loginUsername.trim().toLowerCase() && u.password === loginPassword
    );

    if (foundUser) {
      setCurrentUser(foundUser);
      localStorage.setItem("marketing_current_user", JSON.stringify(foundUser));
      triggerNotification("success", `Chào mừng ${foundUser.name} (${foundUser.role}) quay lại hệ thống!`);
      if (foundUser.role === "Viewer") {
        setActiveTab("dashboard");
      }
    } else {
      setLoginError("Tên đăng nhập hoặc mật khẩu không chính xác.");
    }
  };

  // Logout handler
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("marketing_current_user");
    setLoginUsername("");
    setLoginPassword("");
    triggerNotification("success", "Đã đăng xuất khỏi hệ thống.");
  };

  // User management handlers
  const handleAddOrEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managerUsername.trim() || !managerName.trim() || !managerPassword) {
      triggerNotification("error", "Vui lòng điền đầy đủ các thông tin người dùng.");
      return;
    }

    if (editingUsername) {
      // Editing mode
      setUsers(
        users.map((u) =>
          u.username.toLowerCase() === editingUsername.toLowerCase()
            ? { ...u, name: managerName.trim(), password: managerPassword, role: managerRole }
            : u
        )
      );

      if (currentUser && currentUser.username.toLowerCase() === editingUsername.toLowerCase()) {
        const updatedSelf = { ...currentUser, name: managerName.trim(), password: managerPassword, role: managerRole };
        setCurrentUser(updatedSelf);
        localStorage.setItem("marketing_current_user", JSON.stringify(updatedSelf));
      }

      triggerNotification("success", `Đã cập nhật thông tin người dùng ${managerUsername} thành công!`);
      setEditingUsername(null);
    } else {
      // Adding mode
      const exists = users.some((u) => u.username.toLowerCase() === managerUsername.trim().toLowerCase());
      if (exists) {
        triggerNotification("error", "Tên đăng nhập đã tồn tại trong hệ thống.");
        return;
      }

      const newUser: UserAccount = {
        username: managerUsername.trim().toLowerCase(),
        password: managerPassword,
        name: managerName.trim(),
        role: managerRole,
      };

      setUsers([...users, newUser]);
      triggerNotification("success", `Đã thêm thành viên mới: ${managerName} (${managerRole})!`);
    }

    setManagerUsername("");
    setManagerPassword("");
    setManagerName("");
    setManagerRole("Viewer");
  };

  const handleStartEditUser = (u: UserAccount) => {
    setEditingUsername(u.username);
    setManagerUsername(u.username);
    setManagerPassword(u.password);
    setManagerName(u.name);
    setManagerRole(u.role);
  };

  const handleDeleteUser = (usernameToDelete: string) => {
    if (currentUser && currentUser.username.toLowerCase() === usernameToDelete.toLowerCase()) {
      triggerNotification("error", "Bạn không thể tự xóa chính mình khi đang đăng nhập.");
      return;
    }

    if (window.confirm(`Bạn có chắc chắn muốn xóa tài khoản ${usernameToDelete} khỏi hệ thống?`)) {
      setUsers(users.filter((u) => u.username.toLowerCase() !== usernameToDelete.toLowerCase()));
      triggerNotification("success", `Đã xóa tài khoản ${usernameToDelete} thành công.`);

      if (editingUsername && editingUsername.toLowerCase() === usernameToDelete.toLowerCase()) {
        setEditingUsername(null);
        setManagerUsername("");
        setManagerPassword("");
        setManagerName("");
        setManagerRole("Viewer");
      }
    }
  };

  const handleUpdateBrandKpi = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = brandKpis.map(k => {
      if (k.id === kpiBrandId) {
        return {
          ...k,
          sovTargetRank: kpiSovTargetRank,
          contentTarget: kpiContentTarget,
          prTarget: kpiPrTarget,
          comment: kpiComment
        };
      }
      return k;
    });
    setBrandKpis(updated);
    triggerNotification("success", `Đã cập nhật mục tiêu KPI cho nhãn hàng ${kpiBrandId.toUpperCase()} thành công!`);
  };

  const handleSelectKpiBrand = (brandId: "livotec" | "karofi") => {
    setKpiBrandId(brandId);
    const found = brandKpis.find(k => k.id === brandId);
    if (found) {
      setKpiSovTargetRank(found.sovTargetRank);
      setKpiContentTarget(found.contentTarget);
      setKpiPrTarget(found.prTarget);
      setKpiComment(found.comment);
    }
  };

  // Database Editor handlers
  const handleDbDelete = async (tab: "digital" | "kol" | "btl" | "ooh", indexInOriginal: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa dòng dữ liệu này không? Hành động này sẽ được lưu ngay vào CSDL.")) return;

    const updatedData = { ...marketingData };
    if (tab === "digital") {
      updatedData.digital_marketing = updatedData.digital_marketing.filter((_, i) => i !== indexInOriginal);
    } else if (tab === "kol") {
      updatedData.kol_koc = updatedData.kol_koc.filter((_, i) => i !== indexInOriginal);
    } else if (tab === "btl") {
      updatedData.btl_trade = updatedData.btl_trade.filter((_, i) => i !== indexInOriginal);
    } else if (tab === "ooh") {
      updatedData.monthly_ooh_pr = updatedData.monthly_ooh_pr.filter((_, i) => i !== indexInOriginal);
    }

    try {
      const response = await fetch("/api/save-raw-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: updatedData })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        const safeData = normalizeMarketingData(result.data);
        setMarketingData(safeData);
        localStorage.setItem("marketing_report_raw_data", JSON.stringify(safeData));
        triggerNotification("success", "Đã xóa dòng dữ liệu và lưu vào CSDL hệ thống thành công!");
      } else {
        triggerNotification("error", result.error || "Lỗi lưu dữ liệu sau khi xóa.");
      }
    } catch (err) {
      console.error("Failed to save raw data after delete:", err);
      triggerNotification("error", "Không thể lưu thay đổi sau khi xóa.");
    }
  };

  const handleDbEditStart = (tab: "digital" | "kol" | "btl" | "ooh", indexInOriginal: number) => {
    let rowToEdit: any = null;
    if (tab === "digital") {
      rowToEdit = marketingData.digital_marketing[indexInOriginal];
    } else if (tab === "kol") {
      rowToEdit = marketingData.kol_koc[indexInOriginal];
    } else if (tab === "btl") {
      rowToEdit = marketingData.btl_trade[indexInOriginal];
    } else if (tab === "ooh") {
      rowToEdit = marketingData.monthly_ooh_pr[indexInOriginal];
    }

    if (rowToEdit) {
      setDbEditingRowIndex(indexInOriginal);
      setDbEditingRowData({ ...rowToEdit });
    }
  };

  const handleDbEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dbEditingRowIndex === null || !dbEditingRowData) return;

    const updatedData = { ...marketingData };
    if (dbActiveTab === "digital") {
      updatedData.digital_marketing = updatedData.digital_marketing.map((row, i) => 
        i === dbEditingRowIndex ? dbEditingRowData : row
      );
    } else if (dbActiveTab === "kol") {
      updatedData.kol_koc = updatedData.kol_koc.map((row, i) => 
        i === dbEditingRowIndex ? dbEditingRowData : row
      );
    } else if (dbActiveTab === "btl") {
      updatedData.btl_trade = updatedData.btl_trade.map((row, i) => 
        i === dbEditingRowIndex ? dbEditingRowData : row
      );
    } else if (dbActiveTab === "ooh") {
      updatedData.monthly_ooh_pr = updatedData.monthly_ooh_pr.map((row, i) => 
        i === dbEditingRowIndex ? dbEditingRowData : row
      );
    }

    try {
      const response = await fetch("/api/save-raw-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: updatedData })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        const safeData = normalizeMarketingData(result.data);
        setMarketingData(safeData);
        localStorage.setItem("marketing_report_raw_data", JSON.stringify(safeData));
        setDbEditingRowIndex(null);
        setDbEditingRowData(null);
        triggerNotification("success", "Đã cập nhật dòng dữ liệu và đồng bộ vào hệ thống thành công!");
      } else {
        triggerNotification("error", result.error || "Lỗi lưu thay đổi.");
      }
    } catch (err) {
      console.error("Failed to save raw data after edit:", err);
      triggerNotification("error", "Không thể đồng bộ thay đổi.");
    }
  };

  const getHeaderMinWidth = (header: string) => {
    if (header.startsWith("Thực hiện T")) return "min-w-[130px]";
    if (header.startsWith("Kế hoạch T")) return "min-w-[130px]";
    if (header.startsWith("Tích lũy T")) return "min-w-[130px]";
    switch (header) {
      case "Tuần":
      case "Tháng":
        return "min-w-[100px]";
      case "Thương hiệu":
        return "min-w-[110px]";
      case "Hạng mục":
      case "Hạng mục lớn":
      case "Metric":
      case "Chỉ số metric":
        return "min-w-[150px]";
      case "Kênh":
        return "min-w-[100px]";
      case "KPI tuần":
      case "Thực tế tuần":
      case "Tích lũy tháng":
      case "KPI":
      case "Thực tế":
      case "KPI chiến dịch":
      case "Thực tế tuần":
        return "min-w-[110px]";
      case "Chi tiết":
        return "min-w-[180px]";
      case "Thực hiện tháng trước":
      case "Kế hoạch tháng này":
      case "Tích lũy tháng này":
        return "min-w-[145px]";
      case "Thao tác":
        return "min-w-[100px] text-right";
      default:
        return "min-w-[100px]";
    }
  };

  const getHeadersForTab = () => {
    if (dbActiveTab === "digital") {
      return ["Tuần", "Thương hiệu", "Hạng mục", "Chỉ số metric", "KPI tuần", "Thực tế tuần", "Tích lũy tháng", "Thao tác"];
    } else if (dbActiveTab === "kol") {
      return ["Tuần", "Thương hiệu", "Hạng mục", "Kênh", "KPI chiến dịch", "Thực tế tuần", "Thao tác"];
    } else if (dbActiveTab === "btl") {
      const monthInfo = getBtlReportMonth(selectedTimeline.id);
      const thisM = monthInfo.month;
      const lastM = thisM === 1 ? 12 : thisM - 1;
      return [
        "Tuần",
        "Thương hiệu",
        "Hạng mục lớn",
        "Chi tiết",
        `Thực hiện T${lastM}`,
        `Kế hoạch T${thisM}`,
        `Tích lũy T${thisM}`,
        "Thao tác"
      ];
    } else { // ooh
      return ["Tháng", "Thương hiệu", "Hạng mục", "Metric", "KPI", "Thực tế", "Thao tác"];
    }
  };

  // Google Drive connection and Server DB sync
  const handleDriveImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveUrl.trim()) return;

    setIsDriveLoading(true);
    try {
      // 1. Fetch file content
      const response = await fetch("/api/fetch-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: driveUrl }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Không thể tải dữ liệu từ Google Drive.");
      }

      // 2. Send retrieved data to /api/sync-data to merge with Server DB
      const syncResponse = await fetch("/api/sync-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newData: result.data }),
      });
      const syncResult = await syncResponse.json();
      if (syncResponse.ok && syncResult.success) {
        const safeData = normalizeMarketingData(syncResult.data);
        setMarketingData(safeData);
        setPastedJson(JSON.stringify(safeData, null, 2));
        localStorage.setItem("marketing_report_raw_data", JSON.stringify(safeData));
        triggerNotification("success", "Đã kết nối và đồng bộ, sáp nhập dữ liệu tuần mới từ Google Drive thành công!");
      } else {
        throw new Error(syncResult.error || "Lỗi đồng bộ dữ liệu vào cơ sở dữ liệu.");
      }
    } catch (err: any) {
      triggerNotification("error", err.message || "Lỗi kết nối tệp trực tuyến.");
    } finally {
      setIsDriveLoading(false);
    }
  };

  // Paste raw JSON submission with Server DB sync
  const handleJsonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(pastedJson);
      
      const syncResponse = await fetch("/api/sync-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newData: parsed }),
      });
      const syncResult = await syncResponse.json();
      if (syncResponse.ok && syncResult.success) {
        const safeData = normalizeMarketingData(syncResult.data);
        setMarketingData(safeData);
        setPastedJson(JSON.stringify(safeData, null, 2));
        localStorage.setItem("marketing_report_raw_data", JSON.stringify(safeData));
        triggerNotification("success", "Đã sáp nhập và cập nhật dữ liệu tuần mới vào cơ sở dữ liệu thành công!");
      } else {
        throw new Error(syncResult.error || "Lỗi sáp nhập dữ liệu vào cơ sở dữ liệu.");
      }
    } catch (err: any) {
      triggerNotification("error", `Lỗi định dạng JSON hoặc Lỗi đồng bộ: ${err.message}`);
    }
  };

  // Reset to default initial dataset on Server DB
  const handleResetData = async () => {
    if (window.confirm("Bạn có chắc chắn muốn khôi phục toàn bộ dữ liệu báo cáo và nhận định về mặc định ban đầu không?")) {
      try {
        const response = await fetch("/api/reset-data", { method: "POST" });
        const result = await response.json();
        if (response.ok && result.success) {
          const safeData = normalizeMarketingData(result.data);
          setMarketingData(safeData);
          setPastedJson(JSON.stringify(safeData, null, 2));
          
          const defaultPublished = {
            Livotec: { ...DEFAULT_COMMENTS_LIVOTEC },
            Karofi: { ...DEFAULT_COMMENTS_KAROFI },
          };
          setPublishedComments(defaultPublished);
          setDraftComments(JSON.parse(JSON.stringify(defaultPublished)));
          
          localStorage.removeItem("marketing_report_raw_data");
          localStorage.removeItem("marketing_published_comments");
          
          setHasUnpublishedChanges(false);
          triggerNotification("success", "Đã khôi phục dữ liệu trên máy chủ và trình duyệt về trạng thái mặc định.");
        } else {
          throw new Error(result.error || "Lỗi khôi phục cơ sở dữ liệu máy chủ.");
        }
      } catch (err: any) {
        triggerNotification("error", `Lỗi khôi phục: ${err.message}`);
      }
    }
  };

  // Save mail configuration to Server DB
  const handleSaveMailConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsMailLoading(true);
    try {
      const response = await fetch("/api/save-mail-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtp_host: mailHost,
          smtp_port: mailPort,
          smtp_user: mailUser,
          smtp_pass: mailPass,
          notification_email: mailRecipient,
          enabled: mailEnabled
        }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        triggerNotification("success", "Cấu hình gửi mail tự động đã được lưu và mã hóa bảo mật!");
      } else {
        throw new Error(result.error || "Lỗi lưu cấu hình mail");
      }
    } catch (err: any) {
      triggerNotification("error", `Không thể lưu cấu hình mail: ${err.message}`);
    } finally {
      setIsMailLoading(false);
    }
  };

  // AI suggestions from Gemini API
  const handleAiSuggestions = async () => {
    setIsAiLoading(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: marketingData, brand: selectedBrand }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        const aiAnalysis = result.analysis;
        
        // Update draft with all categories
        const updatedDraft: BrandComments = {
          evaluation: aiAnalysis.executiveSummary.evaluation,
          proposals: aiAnalysis.executiveSummary.proposals,
          categories: {
            sov: aiAnalysis.categoryAnalysis.sov || "",
            kol_koc: aiAnalysis.categoryAnalysis.kol_koc || "",
            content: aiAnalysis.categoryAnalysis.content || "",
            tvc: aiAnalysis.categoryAnalysis.tvc || "",
            pr: aiAnalysis.categoryAnalysis.pr || "",
            ooh: aiAnalysis.categoryAnalysis.ooh || "",
            paid_ads: aiAnalysis.categoryAnalysis.paid_ads || "",
            seo: aiAnalysis.categoryAnalysis.seo || "",
            btl_trade: aiAnalysis.categoryAnalysis.btl_trade || "",
          }
        };

        setDraftComments(updatedDraft);
        setHasUnpublishedChanges(true);
        triggerNotification("success", `AI đã phân tích dữ liệu thực tế của ${selectedBrand} và điền các gợi ý vào biểu mẫu thành công! Bạn có thể chỉnh sửa thêm trước khi xuất bản.`);
      } else {
        throw new Error(result.error || "Không nhận được phân tích từ AI.");
      }
    } catch (err: any) {
      console.error(err);
      triggerNotification("error", `Lỗi phân tích AI: ${err.message || "Vui lòng kiểm tra cấu hình khóa API trong Secrets."}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Draft changes
  const handleDraftCommentChange = (field: "evaluation" | "proposals", value: string) => {
    setDraftComments((prev) => ({
      ...prev,
      [field]: value
    }));
    setHasUnpublishedChanges(true);
  };

  const handleDraftCategoryChange = (catKey: keyof CategoryComments, value: string) => {
    setDraftComments((prev) => ({
      ...prev,
      categories: {
        ...prev.categories,
        [catKey]: value
      }
    }));
    setHasUnpublishedChanges(true);
  };

  // Publish Draft to live reporting dashboard and save to server
  const handlePublish = async () => {
    const updatedWeekComments = {
      ...(publishedComments[selectedTimeline.id] || {
        Livotec: DEFAULT_COMMENTS_LIVOTEC,
        Karofi: DEFAULT_COMMENTS_KAROFI,
      }),
      [selectedBrand]: draftComments,
    };

    const newPublishedComments = {
      ...publishedComments,
      [selectedTimeline.id]: updatedWeekComments,
    };

    try {
      const response = await fetch("/api/save-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week: selectedTimeline.id,
          comments: updatedWeekComments,
        }),
      });
      if (response.ok) {
        setPublishedComments(newPublishedComments);
        localStorage.setItem("marketing_published_comments", JSON.stringify(newPublishedComments));
        setHasUnpublishedChanges(false);
        triggerNotification("success", `Đã xuất bản và lưu nhận định thành công cho tuần ${selectedTimeline.label}!`);
      } else {
        triggerNotification("error", "Có lỗi xảy ra khi lưu nhận định lên máy chủ.");
      }
    } catch (err) {
      console.error("Failed to save comments:", err);
      triggerNotification("error", "Không thể kết nối đến máy chủ để lưu nhận định.");
    }
  };

  // ------------------------------------------------------------
  // DYNAMIC DATA PARSING & MATHEMATICAL DERIVATIONS
  // ------------------------------------------------------------
  
  // Helper to check if a record falls within the selected timeline
  const isInSelectedTimeline = (week: string | undefined) => {
    if (!week) return false;
    return week === selectedTimeline.id;
  };

  // Safe Fallback Lists
  const digitalMarketingList = marketingData?.digital_marketing || [];
  const btlTradeList = marketingData?.btl_trade || [];
  const kolKocList = marketingData?.kol_koc || [];
  const monthlyOohPrList = marketingData?.monthly_ooh_pr || [];

  // 1. Filtered data by active brand and selected timeline
  const brandDigital = digitalMarketingList.filter(
    (row) => row.brand && row.brand.toLowerCase() === selectedBrand.toLowerCase() && isInSelectedTimeline(row.week)
  );
  const brandBtl = btlTradeList.filter(
    (row) => row.brand && row.brand.toLowerCase() === selectedBrand.toLowerCase() && isInSelectedTimeline(row.week)
  );
  const brandOohPr = monthlyOohPrList.filter(
    (row) => row.brand && row.brand.toLowerCase() === selectedBrand.toLowerCase() && isInSelectedTimeline(row.week)
  );

  // 2. Share of Voice calculation (Always show industry snapshot for selected timeline)
  // In our JSON, Livotec & Karofi share of voice are under brand "Karofi" with kênh_channel as brand name
  const sovRows = digitalMarketingList.filter(
    (row) => row.hạng_mục === "Social Listening" && 
             isInSelectedTimeline(row.week) && 
             row.thực_tế_actual !== null && 
             row.thực_tế_actual !== undefined && 
             row.thực_tế_actual !== 0
  );
  
  const sovData = sovRows.map((row) => ({
    name: row.kênh_channel,
    value: (row.thực_tế_actual || 0) * 100,
    formatted: `${((row.thực_tế_actual || 0) * 100).toFixed(1)}%`,
  })).sort((a, b) => b.value - a.value);

  const activeBrandSov = sovRows.find(
    (row) => row.kênh_channel && row.kênh_channel.toLowerCase() === selectedBrand.toLowerCase()
  );
  const sovPercentage = activeBrandSov ? (activeBrandSov.thực_tế_actual || 0) * 100 : 0;

  // 3. Content (số ấn phẩm) Weekly
  const contentRows = brandDigital.filter(
    (row) => row.nhóm_báo_cáo === "Content" && 
             row.thực_tế_actual !== null && 
             row.thực_tế_actual !== undefined && 
             row.thực_tế_actual !== 0
  );
  const weeklyContentSum = contentRows.reduce((sum, row) => sum + (row.thực_tế_actual || 0), 0);

  // Group contentRows by "hạng_mục" for the "Content & Sáng tạo" category chart
  const contentByHạngMụcMap = new Map<string, { name: string; mục_tiêu_target: number; thực_tế_actual: number; tích_lũy_tháng: number }>();
  contentRows.forEach((row) => {
    const key = row.hạng_mục || "Khác";
    if (!contentByHạngMụcMap.has(key)) {
      contentByHạngMụcMap.set(key, {
        name: key,
        mục_tiêu_target: 0,
        thực_tế_actual: 0,
        tích_lũy_tháng: 0,
      });
    }
    const item = contentByHạngMụcMap.get(key)!;
    item.mục_tiêu_target += (row.mục_tiêu_target || 0);
    item.thực_tế_actual += (row.thực_tế_actual || 0);
    item.tích_lũy_tháng += (row.tích_lũy_tháng || 0);
  });
  const contentByHạngMục = Array.from(contentByHạngMụcMap.values());

  // 3.1 TVC (GRPS) - Filter TVC with metric GRPS
  const tvcGrpsRows = brandDigital.filter(
    (row) => row.hạng_mục && row.hạng_mục.toLowerCase() === "tvc" && 
             row.chỉ_số_metric && row.chỉ_số_metric.toLowerCase() === "grps" &&
             row.thực_tế_actual !== null && 
             row.thực_tế_actual !== undefined && 
             row.thực_tế_actual !== 0
  );
  const tvcGrpsChartData = tvcGrpsRows.map(row => ({
    name: row.kênh_channel || "Khác",
    "KPI Tuần": row.mục_tiêu_target || 0,
    "Thực tế tuần": row.thực_tế_actual || 0,
    "Tích lũy tháng": row.tích_lũy_tháng || 0,
  }));

  // PR charts data - split into quantity and views
  const prQuantityRows = brandOohPr.filter(r => r.hạng_mục && (r.hạng_mục.toLowerCase() === "pr - báo chí" || r.hạng_mục.toLowerCase() === "pr") && r.chỉ_số_metric && r.chỉ_số_metric.toLowerCase() === "quantity" && r.thực_tế_actual !== null && r.thực_tế_actual !== undefined && r.thực_tế_actual !== 0);
  const prViewsRows = brandOohPr.filter(r => r.hạng_mục && (r.hạng_mục.toLowerCase() === "pr - báo chí" || r.hạng_mục.toLowerCase() === "pr") && r.chỉ_số_metric && r.chỉ_số_metric.toLowerCase() === "views" && r.thực_tế_actual !== null && r.thực_tế_actual !== undefined && r.thực_tế_actual !== 0);

  const prQuantityChartData = prQuantityRows.map(row => ({
    name: row.ngành_hàng || "Ngành hàng",
    "KPI Tuần": row.mục_tiêu_target || 0,
    "Thực tế tuần": row.thực_tế_actual || 0,
    "Tích lũy tháng": row.tích_lũy_tháng || 0,
  }));

  const prViewsChartData = prViewsRows.map(row => ({
    name: row.ngành_hàng || "Ngành hàng",
    "KPI Tuần": row.mục_tiêu_target || 0,
    "Thực tế tuần": row.thực_tế_actual || 0,
    "Tích lũy tháng": row.tích_lũy_tháng || 0,
  }));

  // OOH sub-categories charts data - LCD Building, LED Cities, LED Airport, Pano
  const oohRows = brandOohPr.filter(row => row.hạng_mục && row.hạng_mục.toLowerCase() === "ooh" && row.thực_tế_actual !== null && row.thực_tế_actual !== undefined && row.thực_tế_actual !== 0);

  const lcdBuildingRows = oohRows.filter(r => r.kênh_channel && r.kênh_channel.toLowerCase() === "lcd building");
  const ledCitiesRows = oohRows.filter(r => r.kênh_channel && r.kênh_channel.toLowerCase() === "led cities");
  const ledAirportRows = oohRows.filter(r => r.kênh_channel && r.kênh_channel.toLowerCase() === "led airport");
  const panoRows = oohRows.filter(r => r.kênh_channel && r.kênh_channel.toLowerCase() === "pano");

  const makeOohChartData = (rows: any[]) => {
    return rows.map(r => ({
      name: r.chỉ_số_metric || "Vị trí",
      "KPI Tuần": r.mục_tiêu_target || 0,
      "Thực tế tuần": r.thực_tế_actual || 0,
      "Tích lũy tháng": r.tích_lũy_tháng || 0,
    }));
  };

  const lcdBuildingChartData = makeOohChartData(lcdBuildingRows);
  const ledCitiesChartData = makeOohChartData(ledCitiesRows);
  const ledAirportChartData = makeOohChartData(ledAirportRows);
  const panoChartData = makeOohChartData(panoRows);

  // 4. SEO Organic Traffic Weekly & Monthly
  const seoTrafficRow = brandDigital.find(
    (row) => row.hạng_mục === "SEO Website" && row.chỉ_số_metric === "Traffic Organic"
  );
  const seoTrafficWeeklyTarget = seoTrafficRow ? seoTrafficRow.mục_tiêu_target || 0 : 0;
  const seoTrafficWeeklyActual = seoTrafficRow ? seoTrafficRow.thực_tế_actual || 0 : 0;
  const seoTrafficMonthlyTarget = seoTrafficRow ? seoTrafficRow.target_tháng || 0 : 0;
  const seoTrafficMonthlyActual = seoTrafficRow ? seoTrafficRow.tích_lũy_tháng || 0 : 0;

  const seoImpressionsRow = brandDigital.find(
    (row) => row.hạng_mục === "SEO Website" && row.chỉ_số_metric === "Impressions Organic"
  );
  const seoImpressionsWeeklyTarget = seoImpressionsRow ? seoImpressionsRow.mục_tiêu_target || 0 : 0;
  const seoImpressionsWeeklyActual = seoImpressionsRow ? seoImpressionsRow.thực_tế_actual || 0 : 0;
  const seoImpressionsMonthlyTarget = seoImpressionsRow ? seoImpressionsRow.target_tháng || 0 : 0;
  const seoImpressionsMonthlyActual = seoImpressionsRow ? seoImpressionsRow.tích_lũy_tháng || 0 : 0;

  // 5. PR articles quantity (Conditional weekly scorecard / accumulated)
  const prQuantityRow = brandOohPr.find(
    (row) => row.hạng_mục === "PR - báo chí" && row.chỉ_số_metric === "Quantity"
  );
  // Sum of PR quantity for the brand in the month (represented in monthly_ooh_pr)
  const prQuantitySum = brandOohPr
    .filter((row) => row.hạng_mục === "PR - báo chí" && row.chỉ_số_metric === "Quantity")
    .reduce((sum, row) => sum + (row.thực_tế_actual || 0), 0);

  // 5.5. KOL/KOC Calculations (Filtered by Brand & Timeline)
  const brandKolKoc = kolKocList.filter((row) => {
    const isBrandMatch = ("brand" in row && (row as any).brand)
      ? (row as any).brand.toLowerCase() === selectedBrand.toLowerCase()
      : selectedBrand.toLowerCase() === "livotec";
    return isBrandMatch && 
           isInSelectedTimeline(row.week) && 
           row.thực_tế_trong_tuần !== null && 
           row.thực_tế_trong_tuần !== undefined && 
           row.thực_tế_trong_tuần !== 0;
  });

  const totalKolKocKpi = brandKolKoc.reduce((sum, r) => sum + (r.kpi_toàn_chiến_dịch || 0), 0);
  const totalKolKocTichLuy = brandKolKoc.reduce((sum, r) => sum + (r.tích_lũy_chiến_dịch || 0), 0);
  const totalKolKocTrongTuan = brandKolKoc.reduce((sum, r) => sum + (r.thực_tế_trong_tuần || 0), 0);

  // 6. Paid Ads Calculations (Spent, Impressions, Reach, Frequency)
  const adsSpentRows = brandDigital.filter(
    (row) => row.hạng_mục === "Paid Ads" && row.chỉ_số_metric === "Amount spent (VNĐ)"
  );
  const adsImpressionRows = brandDigital.filter(
    (row) => row.hạng_mục === "Paid Ads" && row.chỉ_số_metric === "Impressions"
  );
  const adsReachRows = brandDigital.filter(
    (row) => row.hạng_mục === "Paid Ads" && row.chỉ_số_metric === "Reach"
  );
  const adsFreqRows = brandDigital.filter(
    (row) => row.hạng_mục === "Paid Ads" && row.chỉ_số_metric === "Frequency"
  );

  // Weekly sums (since they represent the active week)
  // If some rows are MTD in database, we only sum non-null actual or check row is weekly
  const weeklyAdsSpent = adsSpentRows
    .filter((r) => r.phân_loại_thời_gian === "Weekly" || r.thực_tế_actual !== null)
    .reduce((sum, r) => sum + (r.thực_tế_actual || 0), 0);
    
  const monthlyAdsSpent = adsSpentRows.reduce((sum, r) => sum + (r.tích_lũy_tháng || 0), 0);
  const monthlyAdsSpentTarget = adsSpentRows.reduce((sum, r) => sum + (r.target_tháng || 0), 0);

  const weeklyAdsImpressions = adsImpressionRows
    .filter((r) => r.phân_loại_thời_gian === "Weekly" || r.thực_tế_actual !== null)
    .reduce((sum, r) => sum + (r.thực_tế_actual || r.tích_lũy_tháng || 0), 0);
    
  const monthlyAdsImpressions = adsImpressionRows.reduce((sum, r) => sum + (r.tích_lũy_tháng || 0), 0);
  const monthlyAdsImpressionsTarget = adsImpressionRows.reduce((sum, r) => sum + (r.target_tháng || 0), 0);

  const weeklyAdsReach = adsReachRows
    .filter((r) => r.phân_loại_thời_gian === "Weekly" || r.thực_tế_actual !== null)
    .reduce((sum, r) => sum + (r.thực_tế_actual || r.tích_lũy_tháng || 0), 0);
    
  const monthlyAdsReach = adsReachRows.reduce((sum, r) => sum + (r.tích_lũy_tháng || 0), 0);
  const monthlyAdsReachTarget = adsReachRows.reduce((sum, r) => sum + (r.target_tháng || 0), 0);

  // Average frequency
  const activeFreqRows = adsFreqRows.filter((r) => r.thực_tế_actual !== null || r.tích_lũy_tháng !== null);
  const avgAdsFrequency = activeFreqRows.length > 0 
    ? activeFreqRows.reduce((sum, r) => sum + (r.thực_tế_actual || r.tích_lũy_tháng || 0), 0) / activeFreqRows.length
    : 0;

  // Tab data presence checking
  const hasSovData = sovPercentage > 0;
  const hasKolData = brandKolKoc.length > 0;
  const hasContentData = contentRows.length > 0;
  const hasTvcData = tvcGrpsRows.length > 0;
  const hasPrData = prQuantityRows.length > 0 || prViewsRows.length > 0;
  const hasOohData = oohRows.length > 0;
  const hasAdsData = brandDigital.some((row) => row.hạng_mục === "Paid Ads");
  const hasSeoData = brandDigital.some(
    (row) => row.hạng_mục === "SEO Website" || row.hạng_mục === "SEO Content" || row.hạng_mục === "Product Page"
  );
  const hasBtlData = brandBtl.length > 0;

  const tabsStatus: { [key: string]: boolean } = {
    sov: hasSovData,
    kol: hasKolData,
    content: hasContentData,
    tvc: hasTvcData,
    pr: hasPrData,
    ooh: hasOohData,
    ads: hasAdsData,
    seo: hasSeoData,
    btl: hasBtlData,
  };

  const hasPreviousWeek = (() => {
    const sorted = timelines.map(t => t.id).sort((a, b) => b.localeCompare(a));
    const idx = sorted.indexOf(selectedTimeline.id);
    return idx !== -1 && idx + 1 < sorted.length;
  })();

  // Render scorecard lists dynamically based on rules:
  // - Fixed: Share of Voice (SOV), Content, SEO (Organic Traffic)
  // - PR (number of articles) is shown ONLY if timeline selected has isPRWeek: true
  // - Fixed: Ads. Amount Spent, Ads. Impression, Ads. Frequency
  // - Ads. Reach is added ONLY if scorecard count is less than 8.
  
  const currentBrandKpi = brandKpis.find(k => k.brandName.toLowerCase() === selectedBrand.toLowerCase()) || {
    sovTargetRank: selectedBrand === "Livotec" ? "Rank #5" : "Rank #2",
    contentTarget: selectedBrand === "Livotec" ? 14 : 24,
    prTarget: selectedBrand === "Livotec" ? 5 : 1
  };

  const scorecards: {
    id: string;
    title: string;
    value: string;
    targetLabel?: string;
    targetVal?: string;
    percent?: number;
    icon: any;
    color: string;
    bg: string;
  }[] = [];

  // Card 1: Share Of Voice (SOV)
  if (sovPercentage > 0) {
    scorecards.push({
      id: "sov",
      title: "Share Of Voice (SOV)",
      value: `${sovPercentage.toFixed(1)}%`,
      targetLabel: "Thị phần thảo luận",
      targetVal: currentBrandKpi.sovTargetRank,
      icon: Percent,
      color: "text-indigo-600 border-indigo-100",
      bg: "bg-indigo-50/50",
    });
  }

  // Card 2: Content
  if (weeklyContentSum > 0) {
    scorecards.push({
      id: "content",
      title: "Content (Ấn phẩm)",
      value: `${weeklyContentSum} bài/video`,
      targetLabel: "Kế hoạch tuần",
      targetVal: `${currentBrandKpi.contentTarget} bài`,
      percent: Math.min(Math.round((weeklyContentSum / currentBrandKpi.contentTarget) * 100), 150),
      icon: Video,
      color: "text-pink-600 border-pink-100",
      bg: "bg-pink-50/50",
    });
  }

  // Card 3: SEO Traffic
  if (seoTrafficWeeklyActual > 0 || seoTrafficWeeklyTarget > 0) {
    scorecards.push({
      id: "seo",
      title: "SEO Organic Traffic",
      value: seoTrafficWeeklyActual.toLocaleString(),
      targetLabel: `Target: ${seoTrafficWeeklyTarget.toLocaleString()}`,
      percent: Math.round((seoTrafficWeeklyActual / seoTrafficWeeklyTarget) * 100),
      icon: Globe,
      color: "text-emerald-600 border-emerald-100",
      bg: "bg-emerald-50/50",
    });
  }

  // Card 3.5: KOL/KOC Campaigns
  if (totalKolKocKpi > 0 || totalKolKocTichLuy > 0 || totalKolKocTrongTuan > 0) {
    scorecards.push({
      id: "kol_koc",
      title: "KOL/KOC Đã Đạt",
      value: totalKolKocKpi > 0 ? `${totalKolKocTichLuy}/${totalKolKocKpi} KOC/KOL` : "0 KOC/KOL",
      targetLabel: "Thực hiện trong tuần",
      targetVal: `+${totalKolKocTrongTuan}`,
      percent: totalKolKocKpi > 0 ? Math.round((totalKolKocTichLuy / totalKolKocKpi) * 100) : 0,
      icon: Users,
      color: "text-blue-600 border-blue-100",
      bg: "bg-blue-50/50",
    });
  }

  // Card 4: PR (Conditional: Only Week 2 / After 10th and if has data)
  if (selectedTimeline.isPRWeek && prQuantitySum > 0) {
    scorecards.push({
      id: "pr",
      title: "PR - Bài viết",
      value: `${prQuantitySum} bài báo`,
      targetLabel: `Target: ${currentBrandKpi.prTarget} bài`,
      percent: Math.round((prQuantitySum / currentBrandKpi.prTarget) * 100),
      icon: FileText,
      color: "text-purple-600 border-purple-100",
      bg: "bg-purple-50/50",
    });
  }

  // Card: Retail POSM & Vật dụng - VỊ TRÍ SAU CARD PR!
  const retailRows = brandBtl.filter((row) => row.hạng_mục_lớn === "POSM");
  const retailValues = retailRows.map((row) => getBtlRowDataValues(row));
  const totalRetailTichLuy = retailValues.reduce((sum, item) => sum + (item.accVal || 0), 0);
  const totalRetailKeHoach = retailValues.reduce((sum, item) => sum + (item.planVal || 0), 0);
  const retailCompletionRate = totalRetailKeHoach > 0 ? Math.round((totalRetailTichLuy / totalRetailKeHoach) * 100) : 0;

  if (totalRetailTichLuy > 0 || totalRetailKeHoach > 0) {
    scorecards.push({
      id: "retail_posm",
      title: "Retail POSM & Vật dụng",
      value: `${totalRetailTichLuy.toLocaleString()} vật dụng`,
      targetLabel: `Kế hoạch: ${totalRetailKeHoach.toLocaleString()}`,
      percent: retailCompletionRate,
      icon: Store,
      color: "text-cyan-600 border-cyan-100",
      bg: "bg-cyan-50/50",
    });
  }

  // Card 5: Ads Amount Spent
  if (weeklyAdsSpent > 0 || monthlyAdsSpent > 0) {
    scorecards.push({
      id: "ads_spent",
      title: "Ads. Amount Spent",
      value: `${(weeklyAdsSpent / 1000000).toFixed(1)}M Đ`,
      targetLabel: "Chi tiêu lũy kế tháng",
      targetVal: `${(monthlyAdsSpent / 1000000).toFixed(0)}M/${(monthlyAdsSpentTarget / 1000000).toFixed(0)}M`,
      percent: Math.round((monthlyAdsSpent / monthlyAdsSpentTarget) * 100),
      icon: DollarSign,
      color: "text-amber-600 border-amber-100",
      bg: "bg-amber-50/50",
    });
  }

  // Card 6: Ads Impression
  if (weeklyAdsImpressions > 0 || monthlyAdsImpressions > 0) {
    scorecards.push({
      id: "ads_impression",
      title: "Ads. Impressions",
      value: weeklyAdsImpressions > 1000000 
        ? `${(weeklyAdsImpressions / 1000000).toFixed(2)}M`
        : weeklyAdsImpressions.toLocaleString(),
      targetLabel: "Lũy kế tháng",
      targetVal: `${(monthlyAdsImpressions / 1000000).toFixed(1)}M`,
      icon: Award,
      color: "text-sky-600 border-sky-100",
      bg: "bg-sky-50/50",
    });
  }

  // Card 7: Ads Frequency
  if (avgAdsFrequency > 0) {
    scorecards.push({
      id: "ads_frequency",
      title: "Ads. Frequency",
      value: `${avgAdsFrequency.toFixed(2)}x`,
      targetLabel: "Tần suất lặp trung bình",
      targetVal: `Target ~2.5x`,
      icon: RefreshCw,
      color: "text-orange-600 border-orange-100",
      bg: "bg-orange-50/50",
    });
  }

  // Card 8: Ads Reach (Added ONLY if scorecards count < 8 and has data)
  if (scorecards.length < 8 && (weeklyAdsReach > 0 || monthlyAdsReach > 0)) {
    scorecards.push({
      id: "ads_reach",
      title: "Ads. Reach (Bổ sung)",
      value: weeklyAdsReach > 1000000 
        ? `${(weeklyAdsReach / 1000000).toFixed(2)}M`
        : weeklyAdsReach.toLocaleString(),
      targetLabel: "Lũy kế tháng",
      targetVal: `${(monthlyAdsReach / 1000000).toFixed(1)}M`,
      icon: Users,
      color: "text-blue-600 border-blue-100",
      bg: "bg-blue-50/50",
    });
  }

  // WoW Comparison Helper
  const getWowComparison = (
    category: "sov" | "ads" | "seo",
    rowMetric: string,
    rowChannel?: string,
    rowIndustry?: string,
    rowHangMuc?: string
  ) => {
    // 1. Find previous week ID
    const sorted = timelines.map(t => t.id).sort((a, b) => b.localeCompare(a));
    const idx = sorted.indexOf(selectedTimeline.id);
    if (idx === -1 || idx + 1 >= sorted.length) return null; // No previous week
    const prevWeekId = sorted[idx + 1];

    // 2. Query previous week value
    let currentVal: number | null = null;
    let prevVal: number | null = null;

    if (category === "sov") {
      // rowChannel is the Brand name (e.g. "Livotec", "Karofi", "Sunhouse" etc.)
      const currentRows = digitalMarketingList.filter(
        (row) => row.hạng_mục === "Social Listening" && row.week === selectedTimeline.id
      );
      const prevRows = digitalMarketingList.filter(
        (row) => row.hạng_mục === "Social Listening" && row.week === prevWeekId
      );

      const currentMatch = currentRows.find(
        (row) => row.kênh_channel && row.kênh_channel.toLowerCase() === rowChannel?.toLowerCase()
      );
      const prevMatch = prevRows.find(
        (row) => row.kênh_channel && row.kênh_channel.toLowerCase() === rowChannel?.toLowerCase()
      );

      currentVal = currentMatch ? (currentMatch.thực_tế_actual || 0) * 100 : 0;
      prevVal = prevMatch ? (prevMatch.thực_tế_actual || 0) * 100 : 0;
      
      const diff = currentVal - prevVal;
      return {
        prevVal,
        diff,
        formatted: `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%`
      };
    } else if (category === "ads") {
      // Find row in current and prev week
      const currentRows = digitalMarketingList.filter(
        (row) => row.brand && row.brand.toLowerCase() === selectedBrand.toLowerCase() &&
                 row.hạng_mục === "Paid Ads" && row.week === selectedTimeline.id
      );
      const prevRows = digitalMarketingList.filter(
        (row) => row.brand && row.brand.toLowerCase() === selectedBrand.toLowerCase() &&
                 row.hạng_mục === "Paid Ads" && row.week === prevWeekId
      );

      const currentMatch = currentRows.find((p) => 
        p.kênh_channel === rowChannel && 
        p.ngành_hàng === rowIndustry && 
        p.chỉ_số_metric === rowMetric
      );
      const prevMatch = prevRows.find((p) => 
        p.kênh_channel === rowChannel && 
        p.ngành_hàng === rowIndustry && 
        p.chỉ_số_metric === rowMetric
      );

      if (!currentMatch || !prevMatch) return null;

      const isWeek = categoryTimeViews.paidAds === "week";
      currentVal = isWeek ? currentMatch.thực_tế_actual : currentMatch.tích_lũy_tháng;
      prevVal = isWeek ? prevMatch.thực_tế_actual : prevMatch.tích_lũy_tháng;

      if (currentVal === null || prevVal === null || prevVal === 0) return null;

      const percent = ((currentVal - prevVal) / prevVal) * 100;
      return {
        prevVal,
        percent,
        formatted: `${percent >= 0 ? "+" : ""}${percent.toFixed(1)}%`
      };
    } else if (category === "seo") {
      // Find row in current and prev week for SEO Website / Content
      const currentRows = digitalMarketingList.filter(
        (row) => row.brand && row.brand.toLowerCase() === selectedBrand.toLowerCase() &&
                 row.week === selectedTimeline.id
      );
      const prevRows = digitalMarketingList.filter(
        (row) => row.brand && row.brand.toLowerCase() === selectedBrand.toLowerCase() &&
                 row.week === prevWeekId
      );

      const currentMatch = currentRows.find((p) => 
        p.hạng_mục === rowHangMuc && 
        (rowMetric ? p.chỉ_số_metric === rowMetric : true) &&
        (rowIndustry ? p.ngành_hàng === rowIndustry : true)
      );
      const prevMatch = prevRows.find((p) => 
        p.hạng_mục === rowHangMuc && 
        (rowMetric ? p.chỉ_số_metric === rowMetric : true) &&
        (rowIndustry ? p.ngành_hàng === rowIndustry : true)
      );

      if (!currentMatch || !prevMatch) return null;

      const isWeek = categoryTimeViews.seo === "week";
      currentVal = isWeek ? currentMatch.thực_tế_actual : currentMatch.tích_lũy_tháng;
      prevVal = isWeek ? prevMatch.thực_tế_actual : prevMatch.tích_lũy_tháng;

      if (currentVal === null || prevVal === null || prevVal === 0) return null;

      const percent = ((currentVal - prevVal) / prevVal) * 100;
      return {
        prevVal,
        percent,
        formatted: `${percent >= 0 ? "+" : ""}${percent.toFixed(1)}%`
      };
    }

    return null;
  };

  // Active brand comments for display in Box 2 and Box 3
  const activeComments = getActiveComments(selectedTimeline.id, selectedBrand);

  // Helper to render formatting of Proposals in Box 2
  const renderFormattedText = (text: string) => {
    return text.split("\n").map((line, idx) => {
      // Check if it starts with bold (e.g., 1. **Title**: Content or **Title**)
      const boldMatch = line.match(/^\d*\.?\s*\*\*(.*?)\*\*(.*)$/);
      if (boldMatch) {
        return (
          <p key={idx} className="mb-2 leading-relaxed text-gray-700">
            <span className="font-semibold text-gray-900">{boldMatch[1]}</span>
            {boldMatch[2]}
          </p>
        );
      }
      return <p key={idx} className="mb-2 leading-relaxed text-gray-700">{line}</p>;
    });
  };

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 font-sans">
        <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
              <Shield className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Đăng Nhập Hệ Thống
            </h2>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
              Báo cáo hiệu suất Marketing Livotec & Karofi
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            {loginError && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-4 rounded-md shadow-sm">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                  Tên đăng nhập / Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <UserCheck className="h-4 w-4" />
                  </span>
                  <input
                    id="login_username"
                    name="username"
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="Nhập email hoặc tên tài khoản..."
                    className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                  Mật khẩu
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    id="login_password"
                    name="password"
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Nhập mật khẩu truy cập..."
                    className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                id="login_submit_btn"
                className="group relative flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition shadow-md cursor-pointer"
              >
                Đăng nhập hệ thống
              </button>
            </div>
          </form>

          {/* Reference list of accounts */}
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 text-[11px] text-slate-500 space-y-2">
            <span className="font-bold text-slate-700 block">🔐 Tài khoản truy cập demo (Vui lòng tự gõ thông tin):</span>
            <div className="grid grid-cols-1 gap-1.5 font-mono">
              <div>
                <span className="font-semibold text-indigo-700">Admin (Toàn quyền):</span>
                <span className="block text-slate-600 pl-2">• Username: ntkdung1206@gmail.com</span>
                <span className="block text-slate-600 pl-2">• Password: 123</span>
              </div>
              <div className="border-t border-slate-200/60 pt-1.5">
                <span className="font-semibold text-emerald-700">Editor (Biên tập dữ liệu):</span>
                <span className="block text-slate-600 pl-2">• Username: editor1</span>
                <span className="block text-slate-600 pl-2">• Password: 123</span>
              </div>
              <div className="border-t border-slate-200/60 pt-1.5">
                <span className="font-semibold text-amber-700">Viewer (Chỉ xem báo cáo):</span>
                <span className="block text-slate-600 pl-2">• Username: viewer1</span>
                <span className="block text-slate-600 pl-2">• Password: 123</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Notifications inside login */}
        {notification && (
          <div
            id="global_notification"
            className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl px-4 py-3 shadow-2xl transition-all duration-300 max-w-md ${
              notification.type === "success"
                ? "bg-emerald-900 text-emerald-100 border-l-4 border-emerald-400"
                : "bg-rose-900 text-rose-100 border-l-4 border-rose-400"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
            )}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div id="app_root" className="min-h-screen bg-slate-50/60 font-sans text-slate-800">
      {/* ------------------------------------------------------------
          HEADER MENU BAR
         ------------------------------------------------------------ */}
      <header id="header_navbar" className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-3 sm:flex-row sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                Báo Cáo Hiệu Suất Marketing
              </h1>
              <p className="font-mono text-xs text-slate-500 uppercase tracking-wider">
                Livotec & Karofi • Analytical Hub
              </p>
            </div>
          </div>

          {/* User metadata & timeline info */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 font-mono text-xs text-slate-600">
              <UserCheck className="h-3.5 w-3.5 text-slate-500" />
              <span className="font-semibold text-slate-950">{currentUser.name}</span>
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                currentUser.role === "Admin" ? "bg-indigo-100 text-indigo-700" :
                currentUser.role === "Editor" ? "bg-emerald-100 text-emerald-700" :
                "bg-amber-100 text-amber-700"
              }`}>
                {currentUser.role}
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 shadow-sm transition cursor-pointer"
              title="Đăng xuất khỏi tài khoản"
            >
              <LogOut className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>

            {/* Export PDF Button */}
            <button
              onClick={() => window.print()}
              className="no-print flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm transition cursor-pointer"
              title="Xuất báo cáo thành tệp PDF"
            >
              <Printer className="h-3.5 w-3.5 text-indigo-500" />
              <span>Xuất PDF</span>
            </button>

            {/* Timeline selector */}
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <select
                id="timeline_select"
                value={selectedTimeline.id}
                onChange={(e) => {
                  const found = timelines.find((t) => t.id === e.target.value);
                  if (found) setSelectedTimeline(found);
                }}
                className="bg-transparent pr-2 font-medium text-slate-800 focus:outline-none cursor-pointer"
              >
                {timelines.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center rounded-lg bg-slate-100 p-1">
              <button
                id="tab_nav_report"
                onClick={() => setActiveTab("dashboard")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "dashboard"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Báo Cáo</span>
              </button>
              
              {currentUser.role !== "Viewer" && (
                <button
                  id="tab_nav_control"
                  onClick={() => setActiveTab("control-panel")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all relative cursor-pointer ${
                    activeTab === "control-panel"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  <span>Control Panel</span>
                  {hasUnpublishedChanges && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Floating Global Notifications */}
      {notification && (
        <div
          id="global_notification"
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl px-4 py-3 shadow-2xl transition-all duration-300 max-w-md ${
            notification.type === "success"
              ? "bg-emerald-900 text-emerald-100 border-l-4 border-emerald-400"
              : "bg-rose-900 text-rose-100 border-l-4 border-rose-400"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* ------------------------------------------------------------
          BRAND SELECTION SUB-BAR
         ------------------------------------------------------------ */}
      <div className="border-b border-slate-200 bg-white/60 py-2.5">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Thương hiệu phân tích:
            </span>
            <div className="flex rounded-lg bg-slate-100/80 p-0.5 border border-slate-200/50">
              <button
                id="brand_btn_livotec"
                onClick={() => setSelectedBrand("Livotec")}
                className={`rounded-md px-4 py-1 text-xs font-bold transition-all ${
                  selectedBrand === "Livotec"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                LIVOTEC
              </button>
              <button
                id="brand_btn_karofi"
                onClick={() => setSelectedBrand("Karofi")}
                className={`rounded-md px-4 py-1 text-xs font-bold transition-all ${
                  selectedBrand === "Karofi"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                KAROFI
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-slate-500 sm:inline">Trạng thái dữ liệu:</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Đã kết nối
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------
          MAIN APPLICATION STAGE
         ------------------------------------------------------------ */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {activeTab === "dashboard" ? (
          <div className="space-y-6">
            
            {/* ------------------------------------------------------------
                BOX 1: SCORE CARDS (MAX 8 CARDS)
               ------------------------------------------------------------ */}
            <section id="box1_scorecards" className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Box 1: Scorecards Chỉ Số Chủ Chốt
                </h2>
                {selectedTimeline.isPRWeek && (
                  <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200">
                    {selectedTimeline.label.split(" ")[0]} {selectedTimeline.label.split(" ")[1]}: Có PR báo chí (+1 Card)
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {scorecards.map((card) => {
                  const IconComponent = card.icon;
                  return (
                    <div
                      key={card.id}
                      id={`card_${card.id}`}
                      className={`relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-200 group`}
                    >
                      {/* Accent Background Highlight */}
                      <div className={`absolute top-0 right-0 h-16 w-16 rounded-full -mr-6 -mt-6 transition-all duration-300 group-hover:scale-110 ${card.bg}`} />
                      
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-tight block">
                            {card.title}
                          </span>
                          <span className="font-mono text-xl font-bold text-slate-900 tracking-tight sm:text-2xl block">
                            {card.value}
                          </span>
                        </div>
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${card.color}`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
                        <span>{card.targetLabel}</span>
                        <span className="font-semibold text-slate-800">{card.targetVal || `${card.percent}% đạt`}</span>
                      </div>

                      {card.percent !== undefined && (
                        <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${
                              card.percent >= 100 ? "bg-emerald-500" : card.percent >= 70 ? "bg-amber-500" : "bg-rose-500"
                            }`}
                            style={{ width: `${Math.min(card.percent, 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ------------------------------------------------------------
                BOX 2: EXECUTIVE SUMMARY
               ------------------------------------------------------------ */}
            <section id="box2_executive_summary" className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Box 2: Đánh Giá Tổng Quan (Executive Summary)
                </h2>
                <button
                  onClick={() => {
                    setActiveTab("control-panel");
                    // Scroll to editor
                    setTimeout(() => {
                      document.getElementById("editor_title_section")?.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-900 underline flex items-center gap-1"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  Chỉnh sửa nhận định
                </button>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Real-time Status Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        <Award className="h-4 w-4" />
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        Thực Trạng Triển Khai Tuần Này
                      </h3>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200 uppercase">
                      Hoạt động tốt
                    </span>
                  </div>
                  <div className="text-sm text-slate-700 leading-relaxed font-sans prose prose-slate">
                    {renderFormattedText(activeComments.evaluation)}
                  </div>
                </div>

                {/* Recommendations Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                      <Target className="h-4 w-4" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Đề Xuất Tối Ưu Cho Tuần Kế Tiếp
                    </h3>
                  </div>
                  <div className="space-y-1.5 border-l-2 border-amber-300 pl-4 py-1 text-sm text-slate-700 leading-relaxed font-sans">
                    {renderFormattedText(activeComments.proposals)}
                  </div>
                </div>
              </div>
            </section>

            {/* ------------------------------------------------------------
                BOX 3: CATEGORY ANALYSIS
               ------------------------------------------------------------ */}
            <section id="box3_category_analysis" className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" />
                Box 3: Phân Tích Chi Tiết Từng Hạng Mục Marketing
              </h2>

              {/* Navigation Tabs for Marketing Categories */}
              <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex flex-wrap gap-1">
                    {[
                      { id: "sov", label: "Share Of Voice (SOV)" },
                      { id: "kol", label: "KOL / KOC" },
                      { id: "content", label: "Content & Sáng tạo" },
                      { id: "tvc", label: "TVC (GRPS)" },
                      { id: "pr", label: "PR - Báo chí" },
                      { id: "ooh", label: "Quảng cáo OOH" },
                      { id: "ads", label: "Paid Ads (Quảng Cáo)" },
                      { id: "seo", label: "SEO Website & Content" },
                      { id: "btl", label: "BTL & Trade Marketing" },
                    ].filter(tab => tabsStatus[tab.id as keyof typeof tabsStatus]).map((tab) => (
                      <button
                        key={tab.id}
                        id={`cat_tab_${tab.id}`}
                        onClick={() => setActiveCategoryTab(tab.id as any)}
                        className={`rounded-lg px-3.5 py-2 text-xs font-semibold tracking-tight transition-all ${
                          activeCategoryTab === tab.id
                            ? "bg-slate-900 text-white shadow-md"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Period selection toggle if active tab has monthly accumulation */}
                  {(activeCategoryTab === "ads" || activeCategoryTab === "seo") && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                      <button
                        onClick={() => {
                          const key = activeCategoryTab === "ads" ? "paidAds" : "seo";
                          setCategoryTimeViews({ ...categoryTimeViews, [key]: "week" });
                        }}
                        className={`rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-all ${
                          categoryTimeViews[activeCategoryTab === "ads" ? "paidAds" : "seo"] === "week"
                            ? "bg-white text-slate-950 shadow-sm"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        Tuần
                      </button>
                      <button
                        onClick={() => {
                          const key = activeCategoryTab === "ads" ? "paidAds" : "seo";
                          setCategoryTimeViews({ ...categoryTimeViews, [key]: "month" });
                        }}
                        className={`rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-all ${
                          categoryTimeViews[activeCategoryTab === "ads" ? "paidAds" : "seo"] === "month"
                            ? "bg-white text-slate-950 shadow-sm"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        Tháng (Lũy kế)
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-6">
                  {/* Category Assessment Comment Box */}
                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm border border-slate-100">
                      <FileText className="h-4 w-4 text-slate-600" />
                    </div>
                    <div className="space-y-1 text-sm text-slate-700 leading-relaxed font-sans">
                      <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider">
                        Đánh giá của nhà phân tích chuyên sâu:
                      </span>
                      <p>
                        {(() => {
                          const tabKeyMap: Record<string, keyof CategoryComments> = {
                            sov: "sov",
                            kol: "kol_koc",
                            content: "content",
                            tvc: "tvc",
                            pr: "pr",
                            ooh: "ooh",
                            ads: "paid_ads",
                            seo: "seo",
                            btl: "btl_trade"
                          };
                          const commentKey = tabKeyMap[activeCategoryTab];
                          return activeComments.categories[commentKey] || "Chưa có nhận định.";
                        })()}
                      </p>
                    </div>
                  </div>

                  {/* ------------------------------------------------------------
                      CATEGORY VIEW: 1. SHARE OF VOICE (SOV)
                     ------------------------------------------------------------ */}
                  {activeCategoryTab === "sov" && (
                    <div className="grid gap-6 md:grid-cols-12 items-center">
                      <div className="md:col-span-7 h-80 flex flex-col justify-center bg-white border border-slate-100 rounded-xl p-2 shadow-sm">
                        <span className="text-xs font-bold text-slate-400 block px-4 py-2 uppercase tracking-wide">
                          Thị Phần Thảo Luận Thương Hiệu Tuần {selectedTimeline.label.split(" ")[1]}
                        </span>
                        <ResponsiveContainer width="100%" height="85%">
                          <PieChart>
                            <Pie
                              data={sovData}
                              cx="50%"
                              cy="50%"
                              innerRadius={65}
                              outerRadius={95}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {sovData.map((entry, index) => {
                                // Assign distinct colors to major competitors
                                let color = "#94a3b8"; // Gray for other
                                if (entry.name.toLowerCase() === "livotec") color = "#0d9488"; // Teal
                                else if (entry.name.toLowerCase() === "karofi") color = "#2563eb"; // Blue
                                else if (entry.name.toLowerCase() === "kang") color = "#ea580c"; // Orange
                                else if (entry.name.toLowerCase() === "sunhouse") color = "#dc2626"; // Red
                                else if (entry.name.toLowerCase() === "hòa phát") color = "#4f46e5"; // Indigo
                                return <Cell key={`cell-${index}`} fill={color} />;
                              })}
                            </Pie>
                            <Tooltip
                              formatter={(value: any, name: any) => [`${parseFloat(value).toFixed(1)}%`, `Thương hiệu: ${name}`]}
                              contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                            />
                            <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Data table */}
                      <div className="md:col-span-5 space-y-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                          Bảng Dữ Liệu Thị Phần Thảo Luận (SOV)
                        </span>
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 font-bold text-slate-500 uppercase tracking-wider">
                              <tr>
                                <th className="px-4 py-3">Thương hiệu</th>
                                <th className="px-4 py-3 text-right">Thị phần SOV</th>
                                {hasPreviousWeek && <th className="px-4 py-3 text-right">WoW</th>}
                                <th className="px-4 py-3 text-right">Trạng thái</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                              {sovData.map((row) => {
                                const wow = hasPreviousWeek ? getWowComparison("sov", "", row.name) : null;
                                return (
                                  <tr
                                    key={row.name}
                                    className={`${
                                      row.name.toLowerCase() === selectedBrand.toLowerCase()
                                        ? "bg-slate-50 font-semibold text-slate-950"
                                        : ""
                                    }`}
                                  >
                                    <td className="px-4 py-3 font-sans flex items-center gap-2">
                                      <span
                                        className="h-2.5 w-2.5 rounded-full shrink-0"
                                        style={{
                                          backgroundColor:
                                            row.name.toLowerCase() === "livotec" ? "#0d9488" :
                                            row.name.toLowerCase() === "karofi" ? "#2563eb" :
                                            row.name.toLowerCase() === "kang" ? "#ea580c" :
                                            row.name.toLowerCase() === "sunhouse" ? "#dc2626" :
                                            row.name.toLowerCase() === "hòa phát" ? "#4f46e5" : "#94a3b8"
                                        }}
                                      />
                                      {row.name}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium">{row.formatted}</td>
                                    {hasPreviousWeek && (
                                      <td className="px-4 py-3 text-right font-sans font-bold">
                                        {wow ? (
                                          <span className={wow.diff >= 0 ? "text-emerald-600" : "text-rose-600"}>
                                            {wow.formatted}
                                          </span>
                                        ) : "—"}
                                      </td>
                                    )}
                                    <td className="px-4 py-3 text-right font-sans">
                                      {row.name.toLowerCase() === "livotec" && <span className="text-[10px] text-teal-600 font-bold uppercase">Nhãn hàng xem</span>}
                                      {row.name.toLowerCase() === "karofi" && <span className="text-[10px] text-blue-600 font-bold uppercase">Nhãn hàng xem</span>}
                                      {row.name.toLowerCase() !== "livotec" && row.name.toLowerCase() !== "karofi" && <span className="text-[10px] text-slate-400">Đối thủ</span>}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ------------------------------------------------------------
                      CATEGORY VIEW: 2. KOL / KOC
                     ------------------------------------------------------------ */}
                  {activeCategoryTab === "kol" && (
                    <div className="space-y-6">
                      {brandKolKoc.length === 0 ? (
                        <div id="kol_koc_empty_state" className="flex flex-col items-center justify-center py-12 px-4 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                          <Users className="h-12 w-12 text-slate-300 mb-3 animate-pulse" />
                          <h4 className="font-bold text-slate-800 text-sm">Không có dữ liệu KOL/KOC</h4>
                          <p className="text-xs text-slate-500 mt-1 max-w-sm">
                            Thương hiệu <strong>{selectedBrand}</strong> không ghi nhận chiến dịch KOL/KOC nào trong kỳ báo cáo này.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="h-80 bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                            <span className="text-xs font-bold text-slate-400 block pb-4 uppercase tracking-wide">
                              Biểu Đồ Cột So Sánh Chỉ Số KOC/KOL Toàn Chiến Dịch vs Thực Tế
                            </span>
                            <ResponsiveContainer width="100%" height="85%">
                              <BarChart data={brandKolKoc}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="ngành_hàng" tick={{ fontSize: 10 }} />
                                <YAxis />
                                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                                <Legend />
                                <Bar dataKey="kpi_toàn_chiến_dịch" name="KPI Toàn chiến dịch" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="tích_lũy_chiến_dịch" name="Lũy kế thực hiện" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="thực_tế_trong_tuần" name="Thực hiện tuần" fill="#10b981" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>

                          {/* Data table */}
                          <div className="space-y-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                              Bảng Dữ Liệu Chiến Dịch KOL/KOC
                            </span>
                            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 font-bold text-slate-500 uppercase tracking-wider">
                                  <tr>
                                    <th className="px-4 py-3">Hạng mục & Kênh</th>
                                    <th className="px-4 py-3">Ngành hàng</th>
                                    <th className="px-4 py-3 text-right">KPI toàn chiến dịch</th>
                                    <th className="px-4 py-3 text-right">Lũy kế thực hiện</th>
                                    <th className="px-4 py-3 text-right">Thực hiện tuần</th>
                                    <th className="px-4 py-3 text-right">Tỷ lệ hoàn thành</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                  {brandKolKoc.map((row, idx) => {
                                    const rate = row.kpi_toàn_chiến_dịch 
                                      ? Math.round(((row.tích_lũy_chiến_dịch || 0) / row.kpi_toàn_chiến_dịch) * 100)
                                      : 0;
                                    return (
                                      <tr key={idx} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-3 font-semibold text-slate-900">{row.hạng_mục} ({row.kênh_channel})</td>
                                        <td className="px-4 py-3">{row.ngành_hàng}</td>
                                        <td className="px-4 py-3 text-right font-mono font-medium">{row.kpi_toàn_chiến_dịch}</td>
                                        <td className="px-4 py-3 text-right font-mono font-medium text-blue-600">{row.tích_lũy_chiến_dịch}</td>
                                        <td className="px-4 py-3 text-right font-mono font-medium text-emerald-600">{row.thực_tế_trong_tuần}</td>
                                        <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">{rate}%</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* ------------------------------------------------------------
                      CATEGORY VIEW: 3. CONTENT & SÁNG TẠO
                     ------------------------------------------------------------ */}
                  {activeCategoryTab === "content" && (
                    <div className="space-y-6">
                      <div className="h-80 bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                        <span className="text-xs font-bold text-slate-400 block pb-4 uppercase tracking-wide">
                          Biểu Đồ Cột So Sánh KPI, Thực Hiện Tuần và Tích Lũy Tháng Theo Từng Hạng Mục Sáng Tạo
                        </span>
                        <ResponsiveContainer width="100%" height="85%">
                          <BarChart data={contentByHạngMục}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis />
                            <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                            <Legend />
                            <Bar dataKey="mục_tiêu_target" name="KPI Tuần" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="thực_tế_actual" name="Thực tế tuần" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="tích_lũy_tháng" name="Tích lũy tháng" fill="#6366f1" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Data table */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                          Bảng Dữ Liệu Chi Tiết Content & Sáng Tạo
                        </span>
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 font-bold text-slate-500 uppercase tracking-wider">
                              <tr>
                                <th className="px-4 py-3">Hạng mục</th>
                                <th className="px-4 py-3">Kênh & Ngành</th>
                                <th className="px-4 py-3 text-right">KPI Tuần</th>
                                <th className="px-4 py-3 text-right">Thực tế Tuần</th>
                                <th className="px-4 py-3 text-right">Tích lũy Tháng</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {contentRows.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="px-4 py-3 font-semibold text-slate-900">{row.hạng_mục}</td>
                                  <td className="px-4 py-3 text-[11px] font-sans">
                                    <div className="font-medium text-slate-800">{row.ngành_hàng}</div>
                                    <div className="text-slate-400 font-mono whitespace-pre-line">{row.kênh_channel}</div>
                                  </td>
                                  <td className="px-4 py-3 text-right font-mono font-medium">{row.mục_tiêu_target !== null ? row.mục_tiêu_target : "—"}</td>
                                  <td className="px-4 py-3 text-right font-mono font-medium text-emerald-600">{row.thực_tế_actual !== null ? row.thực_tế_actual : "—"}</td>
                                  <td className="px-4 py-3 text-right font-mono font-medium text-indigo-600">{row.tích_lũy_tháng !== null ? row.tích_lũy_tháng : "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ------------------------------------------------------------
                      CATEGORY VIEW: 3.1 TVC (GRPS)
                     ------------------------------------------------------------ */}
                  {activeCategoryTab === "tvc" && (
                    <div className="space-y-6">
                      <div className="h-80 bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                        <span className="text-xs font-bold text-slate-400 block pb-4 uppercase tracking-wide">
                          Biểu Đồ Kênh TVC (GRPS) - So Sánh Kênh Sóng
                        </span>
                        <ResponsiveContainer width="100%" height="85%">
                          <BarChart data={tvcGrpsChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis />
                            <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                            <Legend />
                            <Bar dataKey="KPI Tuần" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Thực tế tuần" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Tích lũy tháng" fill="#6366f1" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Data table */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                          Bảng Dữ Liệu Chi Tiết TVC (Chỉ số GRPS)
                        </span>
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 font-bold text-slate-500 uppercase tracking-wider">
                              <tr>
                                <th className="px-4 py-3">Kênh Sóng (Channel)</th>
                                <th className="px-4 py-3">Ngành hàng</th>
                                <th className="px-4 py-3 text-right">KPI Tuần (GRPS)</th>
                                <th className="px-4 py-3 text-right">Thực tế Tuần (GRPS)</th>
                                <th className="px-4 py-3 text-right">Tích lũy Tháng (GRPS)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {tvcGrpsRows.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="px-4 py-3 font-semibold text-slate-900">{row.kênh_channel}</td>
                                  <td className="px-4 py-3 text-slate-600 font-sans">{row.ngành_hàng}</td>
                                  <td className="px-4 py-3 text-right font-mono font-medium">{row.mục_tiêu_target !== null ? row.mục_tiêu_target : "—"}</td>
                                  <td className="px-4 py-3 text-right font-mono font-medium text-emerald-600">{row.thực_tế_actual !== null ? row.thực_tế_actual : "—"}</td>
                                  <td className="px-4 py-3 text-right font-mono font-medium text-indigo-600">{row.tích_lũy_tháng !== null ? row.tích_lũy_tháng : "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ------------------------------------------------------------
                      CATEGORY VIEW: PR - BÁO CHÍ
                     ------------------------------------------------------------ */}
                  {activeCategoryTab === "pr" && (
                    <div className="space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        {/* PR Quantity Chart */}
                        <div className="h-80 bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                          <span className="text-xs font-bold text-slate-400 block pb-4 uppercase tracking-wide">
                            Biểu Đồ PR - Số Bài Viết (Quantity)
                          </span>
                          <ResponsiveContainer width="100%" height="80%">
                            <BarChart data={prQuantityChartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                              <YAxis />
                              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                              <Legend />
                              <Bar dataKey="KPI Tuần" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="Thực tế tuần" fill="#10b981" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="Tích lũy tháng" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        {/* PR Views Chart */}
                        <div className="h-80 bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                          <span className="text-xs font-bold text-slate-400 block pb-4 uppercase tracking-wide">
                            Biểu Đồ PR - Số Lượt Xem (Views)
                          </span>
                          <ResponsiveContainer width="100%" height="80%">
                            <BarChart data={prViewsChartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                              <YAxis />
                              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                              <Legend />
                              <Bar dataKey="KPI Tuần" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="Thực tế tuần" fill="#10b981" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="Tích lũy tháng" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Data table */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                          Bảng Dữ Liệu Chi Tiết PR & Báo Chí
                        </span>
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 font-bold text-slate-500 uppercase tracking-wider">
                              <tr>
                                <th className="px-4 py-3">Ngành hàng</th>
                                <th className="px-4 py-3">Hạng mục (Kênh)</th>
                                <th className="px-4 py-3">Metric</th>
                                <th className="px-4 py-3 text-right">KPI Tuần</th>
                                <th className="px-4 py-3 text-right">Thực tế Tuần</th>
                                <th className="px-4 py-3 text-right">Tích lũy Tháng</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {[...prQuantityRows, ...prViewsRows].map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="px-4 py-3 font-semibold text-slate-900">{row.ngành_hàng}</td>
                                  <td className="px-4 py-3 text-slate-600">{row.hạng_mục} ({row.kênh_channel || "Báo chí"})</td>
                                  <td className="px-4 py-3 uppercase font-mono text-[10px] bg-slate-100 text-slate-700 rounded px-1.5 py-0.5 inline-block my-2">{row.chỉ_số_metric}</td>
                                  <td className="px-4 py-3 text-right font-mono font-medium">{row.mục_tiêu_target !== null ? row.mục_tiêu_target.toLocaleString() : "—"}</td>
                                  <td className="px-4 py-3 text-right font-mono font-medium text-emerald-600">{row.thực_tế_actual !== null ? row.thực_tế_actual.toLocaleString() : "—"}</td>
                                  <td className="px-4 py-3 text-right font-mono font-medium text-indigo-600">{row.tích_lũy_tháng !== null ? row.tích_lũy_tháng.toLocaleString() : "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ------------------------------------------------------------
                      CATEGORY VIEW: QUẢNG CÁO OOH
                     ------------------------------------------------------------ */}
                  {activeCategoryTab === "ooh" && (
                    <div className="space-y-6">
                      {/* Grid of charts, hiding those with no data */}
                      <div className="grid gap-6 md:grid-cols-2">
                        {lcdBuildingChartData.length > 0 && (
                          <div className="h-80 bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                            <span className="text-xs font-bold text-slate-400 block pb-4 uppercase tracking-wide">
                              Biểu Đồ LCD Building
                            </span>
                            <ResponsiveContainer width="100%" height="80%">
                              <BarChart data={lcdBuildingChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                <YAxis />
                                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                                <Legend />
                                <Bar dataKey="KPI Tuần" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Thực tế tuần" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Tích lũy tháng" fill="#6366f1" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        {ledCitiesChartData.length > 0 && (
                          <div className="h-80 bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                            <span className="text-xs font-bold text-slate-400 block pb-4 uppercase tracking-wide">
                              Biểu Đồ LED Cities
                            </span>
                            <ResponsiveContainer width="100%" height="80%">
                              <BarChart data={ledCitiesChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                <YAxis />
                                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                                <Legend />
                                <Bar dataKey="KPI Tuần" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Thực tế tuần" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Tích lũy tháng" fill="#6366f1" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        {ledAirportChartData.length > 0 && (
                          <div className="h-80 bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                            <span className="text-xs font-bold text-slate-400 block pb-4 uppercase tracking-wide">
                              Biểu Đồ LED Airport
                            </span>
                            <ResponsiveContainer width="100%" height="80%">
                              <BarChart data={ledAirportChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                <YAxis />
                                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                                <Legend />
                                <Bar dataKey="KPI Tuần" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Thực tế tuần" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Tích lũy tháng" fill="#6366f1" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        {panoChartData.length > 0 && (
                          <div className="h-80 bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                            <span className="text-xs font-bold text-slate-400 block pb-4 uppercase tracking-wide">
                              Biểu Đồ Pano
                            </span>
                            <ResponsiveContainer width="100%" height="80%">
                              <BarChart data={panoChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                <YAxis />
                                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                                <Legend />
                                <Bar dataKey="KPI Tuần" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Thực tế tuần" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Tích lũy tháng" fill="#6366f1" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </div>

                      {/* Data table */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                          Bảng Dữ Liệu Chi Tiết Quảng Cáo Ngoài Trời (OOH)
                        </span>
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 font-bold text-slate-500 uppercase tracking-wider">
                              <tr>
                                <th className="px-4 py-3">Hạng mục (Kênh)</th>
                                <th className="px-4 py-3">Vị trí & Chi tiết</th>
                                <th className="px-4 py-3">Ngành hàng</th>
                                <th className="px-4 py-3 text-right">KPI Tuần</th>
                                <th className="px-4 py-3 text-right">Thực tế Tuần</th>
                                <th className="px-4 py-3 text-right">Tích lũy Tháng</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {oohRows.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="px-4 py-3 font-semibold text-slate-900 uppercase text-[11px]">{row.kênh_channel}</td>
                                  <td className="px-4 py-3 font-medium text-slate-700">{row.chỉ_số_metric}</td>
                                  <td className="px-4 py-3 text-slate-500">{row.ngành_hàng}</td>
                                  <td className="px-4 py-3 text-right font-mono font-medium">{row.mục_tiêu_target !== null ? row.mục_tiêu_target : "—"}</td>
                                  <td className="px-4 py-3 text-right font-mono font-medium text-emerald-600">{row.thực_tế_actual !== null ? row.thực_tế_actual : "—"}</td>
                                  <td className="px-4 py-3 text-right font-mono font-medium text-indigo-600">{row.tích_lũy_tháng !== null ? row.tích_lũy_tháng : "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ------------------------------------------------------------
                      CATEGORY VIEW: 4. PAID ADS
                     ------------------------------------------------------------ */}
                  {activeCategoryTab === "ads" && (() => {
                    const adsRows = brandDigital.filter(
                      (row) => row.hạng_mục === "Paid Ads" &&
                               row.thực_tế_actual !== null && 
                               row.thực_tế_actual !== undefined && 
                               row.thực_tế_actual !== 0
                    );
                    const uniqueAdsIndustries = Array.from(new Set(adsRows.map((row) => row.ngành_hàng).filter(Boolean)));
                    
                    const filteredAdsRows = adsRows.filter((row) => {
                      if (selectedAdsIndustry === "Tất cả") return true;
                      return row.ngành_hàng === selectedAdsIndustry;
                    });
                    
                    return (
                      <div className="space-y-6">
                        {/* Selector/dropdown for industries */}
                        {uniqueAdsIndustries.length > 1 && (
                          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-3 border border-slate-200/60 shadow-sm">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">
                              Lọc theo ngành hàng:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                onClick={() => setSelectedAdsIndustry("Tất cả")}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold tracking-tight transition-all ${
                                  selectedAdsIndustry === "Tất cả"
                                    ? "bg-slate-900 text-white shadow-md"
                                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                              >
                                Tất cả ngành
                              </button>
                              {uniqueAdsIndustries.map((ind) => (
                                <button
                                  key={ind}
                                  onClick={() => setSelectedAdsIndustry(ind)}
                                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold tracking-tight transition-all ${
                                    selectedAdsIndustry === ind
                                      ? "bg-slate-900 text-white shadow-md"
                                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                  }`}
                                >
                                  {ind}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="h-80 bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                          <div className="flex items-center justify-between pb-4">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                              Biểu Đồ Cột Paid Ads {selectedAdsIndustry !== "Tất cả" && `(${selectedAdsIndustry})`}: So Sánh Chỉ Số ({categoryTimeViews.paidAds === "week" ? "Tuần" : "Lũy Kế Tháng"})
                            </span>
                          </div>
                          <ResponsiveContainer width="100%" height="85%">
                            <BarChart
                              data={filteredAdsRows
                                .map((row) => {
                                  const isWeek = categoryTimeViews.paidAds === "week";
                                  let target = isWeek ? row.mục_tiêu_target : row.target_tháng;
                                  let actual = isWeek ? row.thực_tế_actual : row.tích_lũy_tháng;
                                  
                                  if (row.chỉ_số_metric.toUpperCase() === "CPM") {
                                    if (target !== null && target !== undefined) target = target * 1000;
                                    if (actual !== null && actual !== undefined) actual = actual * 1000;
                                  }

                                  return {
                                    name: `${row.kênh_channel} (${row.ngành_hàng}) - ${row.chỉ_số_metric}`,
                                    metric: row.chỉ_số_metric.split(" ")[0],
                                    target: target,
                                    actual: actual,
                                  };
                                })
                                .filter(item => item.metric !== "CPM" && item.metric !== "Frequency" && (item.target !== null || item.actual !== null))
                              }
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                              <YAxis tickFormatter={(val) => val !== null && val !== undefined ? (val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : val.toLocaleString()) : ""} />
                              <Tooltip 
                                contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                                formatter={(value: any, name: any, props: any) => {
                                  const metricName = props.payload?.name || "";
                                  const numVal = Number(value);
                                  if (isNaN(numVal)) return ["—", name];
                                  if (metricName.includes("spent") || metricName.includes("Spent") || metricName.includes("VNĐ") || metricName.toUpperCase().includes("CPM")) {
                                    return [`${numVal.toLocaleString()} Đ`, name];
                                  }
                                  return [numVal.toLocaleString(), name];
                                }}
                              />
                              <Legend />
                              <Bar dataKey="target" name="KPI Mục tiêu" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="actual" name="Đạt được" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Data table */}
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                            Bảng Chi Tiết Quảng Cáo Paid Ads {selectedAdsIndustry !== "Tất cả" && `(${selectedAdsIndustry})`} ({categoryTimeViews.paidAds === "week" ? "Số liệu Tuần" : "Số liệu Lũy kế Tháng"})
                          </span>
                          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 font-bold text-slate-500 uppercase tracking-wider">
                                <tr>
                                  <th className="px-4 py-3">Kênh & Ngành</th>
                                  <th className="px-4 py-3">Chỉ số đo lường</th>
                                  <th className="px-4 py-3 text-right">KPI Mục tiêu</th>
                                  <th className="px-4 py-3 text-right">Kết quả Đạt được</th>
                                  {hasPreviousWeek && categoryTimeViews.paidAds === "week" && <th className="px-4 py-3 text-right">WoW</th>}
                                  <th className="px-4 py-3 text-right">Tỷ lệ Đạt</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                                {filteredAdsRows.map((row, idx) => {
                                  const isWeek = categoryTimeViews.paidAds === "week";
                                  let target = isWeek ? row.mục_tiêu_target : row.target_tháng;
                                  let actual = isWeek ? row.thực_tế_actual : row.tích_lũy_tháng;
                                  
                                  const isCPM = row.chỉ_số_metric.toUpperCase() === "CPM";
                                  const isAmountSpent = row.chỉ_số_metric.includes("spent") || row.chỉ_số_metric.includes("Spent") || row.chỉ_số_metric.includes("VNĐ");

                                  if (isCPM) {
                                    if (target !== null && target !== undefined) target = target * 1000;
                                    if (actual !== null && actual !== undefined) actual = actual * 1000;
                                  }

                                  const rate = target && actual
                                    ? Math.round((actual / target) * 100)
                                    : null;

                                  let formattedTarget = "—";
                                  let formattedActual = "—";

                                  if (target !== null && target !== undefined) {
                                    if (isAmountSpent || isCPM) {
                                      formattedTarget = `${target.toLocaleString()} Đ`;
                                    } else {
                                      formattedTarget = target.toLocaleString();
                                    }
                                  }

                                  if (actual !== null && actual !== undefined) {
                                    if (isAmountSpent || isCPM) {
                                      formattedActual = `${actual.toLocaleString()} Đ`;
                                    } else {
                                      formattedActual = actual.toLocaleString();
                                    }
                                  }

                                  const wow = hasPreviousWeek ? getWowComparison("ads", row.chỉ_số_metric, row.kênh_channel, row.ngành_hàng) : null;

                                  return (
                                    <tr key={idx} className="hover:bg-slate-50/50">
                                      <td className="px-4 py-3 font-sans font-semibold text-slate-900">{row.kênh_channel} ({row.ngành_hàng})</td>
                                      <td className="px-4 py-3 font-sans text-slate-500">{row.chỉ_số_metric}</td>
                                      <td className="px-4 py-3 text-right font-medium">{formattedTarget}</td>
                                      <td className="px-4 py-3 text-right font-semibold text-blue-600">{formattedActual}</td>
                                      {hasPreviousWeek && categoryTimeViews.paidAds === "week" && (
                                        <td className="px-4 py-3 text-right font-sans font-bold">
                                          {wow ? (
                                            <span className={wow.percent >= 0 ? "text-emerald-600" : "text-rose-600"}>
                                              {wow.formatted}
                                            </span>
                                          ) : "—"}
                                        </td>
                                      )}
                                      <td className="px-4 py-3 text-right font-sans font-bold">
                                        {rate !== null ? (
                                          isCPM ? (
                                            (() => {
                                              const isOptimal = actual <= target;
                                              return (
                                                <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                                  isOptimal ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                                                }`}>
                                                  {isOptimal ? "Tối ưu" : "Cần xem xét"} ({rate}%)
                                                </span>
                                              );
                                            })()
                                          ) : (
                                            <span className={rate >= 100 ? "text-emerald-600" : rate >= 70 ? "text-amber-500" : "text-rose-500"}>
                                              {rate}%
                                            </span>
                                          )
                                        ) : "—"}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ------------------------------------------------------------
                      CATEGORY VIEW: 5. SEO WEBSITE & CONTENT
                     ------------------------------------------------------------ */}
                  {activeCategoryTab === "seo" && (
                    <div className="space-y-6">
                      <div className="h-80 bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                        <span className="text-xs font-bold text-slate-400 block pb-4 uppercase tracking-wide">
                          Biểu Đồ Cột SEO Website: Impressions & Organic Traffic ({categoryTimeViews.seo === "week" ? "Tuần" : "Lũy Kế Tháng"})
                        </span>
                        <ResponsiveContainer width="100%" height="85%">
                          <BarChart
                            data={brandDigital
                              .filter((row) => row.hạng_mục === "SEO Website")
                              .map((row) => ({
                                name: row.chỉ_số_metric,
                                target: categoryTimeViews.seo === "week" ? row.mục_tiêu_target : row.target_tháng,
                                actual: categoryTimeViews.seo === "week" ? row.thực_tế_actual : row.tích_lũy_tháng,
                              }))
                            }
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val} />
                            <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                            <Legend />
                            <Bar dataKey="target" name="Mục tiêu" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="actual" name="Thực tế đạt được" fill="#10b981" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Content production list */}
                      <div className="grid gap-6 md:grid-cols-2">
                        {/* SEO Metrics Table */}
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                            Chỉ Số Lưu Lượng Website (SEO)
                          </span>
                          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 font-bold text-slate-500 uppercase tracking-wider">
                                <tr>
                                  <th className="px-4 py-3">Chỉ số</th>
                                  <th className="px-4 py-3 text-right">KPI Mục tiêu</th>
                                  <th className="px-4 py-3 text-right">Thực tế đạt</th>
                                  {hasPreviousWeek && categoryTimeViews.seo === "week" && <th className="px-4 py-3 text-right">WoW</th>}
                                  <th className="px-4 py-3 text-right">Tỷ lệ</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                                {brandDigital
                                  .filter((row) => row.hạng_mục === "SEO Website" && 
                                                   row.thực_tế_actual !== null && 
                                                   row.thực_tế_actual !== undefined && 
                                                   row.thực_tế_actual !== 0)
                                  .map((row, idx) => {
                                    const isWeek = categoryTimeViews.seo === "week";
                                    const target = isWeek ? row.mục_tiêu_target : row.target_tháng;
                                    const actual = isWeek ? row.thực_tế_actual : row.tích_lũy_tháng;
                                    const rate = target && actual ? Math.round((actual / target) * 100) : 0;
                                    const wow = hasPreviousWeek ? getWowComparison("seo", row.chỉ_số_metric, undefined, undefined, "SEO Website") : null;
                                    return (
                                      <tr key={idx}>
                                        <td className="px-4 py-3 font-sans font-semibold text-slate-900">{row.chỉ_số_metric}</td>
                                        <td className="px-4 py-3 text-right font-medium">{target !== null && target !== undefined ? target.toLocaleString() : "—"}</td>
                                        <td className="px-4 py-3 text-right font-semibold text-emerald-600">{actual !== null && actual !== undefined ? actual.toLocaleString() : "—"}</td>
                                        {hasPreviousWeek && categoryTimeViews.seo === "week" && (
                                          <td className="px-4 py-3 text-right font-sans font-bold">
                                            {wow ? (
                                              <span className={wow.percent >= 0 ? "text-emerald-600" : "text-rose-600"}>
                                                {wow.formatted}
                                              </span>
                                            ) : "—"}
                                          </td>
                                        )}
                                        <td className="px-4 py-3 text-right font-sans font-bold text-emerald-600">{rate}%</td>
                                      </tr>
                                    );
                                  })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* SEO Content Production list */}
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                            Số Lượng Bài Viết/Nội Dung SEO Đã Xuất Bản
                          </span>
                          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 font-bold text-slate-500 uppercase tracking-wider">
                                <tr>
                                  <th className="px-4 py-3">Ngành hàng</th>
                                  <th className="px-4 py-3 text-right">Mục tiêu tuần</th>
                                  <th className="px-4 py-3 text-right">Đã xuất bản</th>
                                  {hasPreviousWeek && categoryTimeViews.seo === "week" && <th className="px-4 py-3 text-right">WoW</th>}
                                  <th className="px-4 py-3 text-right">Tích lũy tháng</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                                {brandDigital
                                  .filter((row) => (row.hạng_mục === "SEO Content" || row.hạng_mục === "Product Page") && 
                                                   row.thực_tế_actual !== null && 
                                                   row.thực_tế_actual !== undefined && 
                                                   row.thực_tế_actual !== 0)
                                  .map((row, idx) => {
                                    const wow = hasPreviousWeek ? getWowComparison("seo", row.chỉ_số_metric, undefined, row.ngành_hàng, row.hạng_mục) : null;
                                    return (
                                      <tr key={idx}>
                                        <td className="px-4 py-3 font-sans font-semibold text-slate-900">
                                          {row.hạng_mục} ({row.ngành_hàng})
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium">{row.mục_tiêu_target || "—"}</td>
                                        <td className="px-4 py-3 text-right font-semibold text-emerald-600">{row.thực_tế_actual !== null ? row.thực_tế_actual : "—"}</td>
                                        {hasPreviousWeek && categoryTimeViews.seo === "week" && (
                                          <td className="px-4 py-3 text-right font-sans font-bold">
                                            {wow ? (
                                              <span className={wow.percent >= 0 ? "text-emerald-600" : "text-rose-600"}>
                                                {wow.formatted}
                                              </span>
                                            ) : "—"}
                                          </td>
                                        )}
                                        <td className="px-4 py-3 text-right font-medium text-indigo-600">{row.tích_lũy_tháng || "—"}</td>
                                      </tr>
                                    );
                                  })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ------------------------------------------------------------
                      CATEGORY VIEW: 6. BTL & TRADE MARKETING
                     ------------------------------------------------------------ */}
                  {activeCategoryTab === "btl" && (() => {
                    const weekInfo = getBtlReportMonth(selectedTimeline.id);
                    const thisMonthNum = weekInfo.month;
                    const lastMonthNum = thisMonthNum === 1 ? 12 : thisMonthNum - 1;

                    const btlMappedRows = brandBtl.map((row) => {
                      const vals = getBtlRowDataValues(row);
                      return {
                        ...row,
                        lastMonthVal: vals.lastMonthVal,
                        planVal: vals.planVal,
                        accVal: vals.accVal,
                      };
                    }).filter((row) => {
                      const hasLastMonth = row.lastMonthVal !== null && row.lastMonthVal !== undefined && row.lastMonthVal !== 0;
                      const hasPlan = row.planVal !== null && row.planVal !== undefined && row.planVal !== 0;
                      const hasAcc = row.accVal !== null && row.accVal !== undefined && row.accVal !== 0;
                      return hasLastMonth || hasPlan || hasAcc;
                    });

                    return (
                      <div className="space-y-8">
                        {/* Grid with 2 Charts as requested */}
                        <div className="grid gap-6 md:grid-cols-2">
                          {/* Chart 1: Kế hoạch tháng vs Tích lũy tháng */}
                          <div className="h-80 bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                            <span className="text-xs font-bold text-slate-400 block pb-2 uppercase tracking-wide">
                              Biểu Đồ 1: Kế Hoạch Tháng {thisMonthNum} vs Tích Lũy Đạt Được (Cái/Điểm bán)
                            </span>
                            <ResponsiveContainer width="100%" height="85%">
                              <BarChart
                                data={btlMappedRows
                                  .filter((row) => row.planVal !== null || row.accVal !== null)
                                  .map((row) => ({
                                    name: `${row.chi_tiết_hạng_mục} ${row.phân_loại ? `(${row.phân_loại})` : ""}`,
                                    plan: row.planVal || 0,
                                    accumulated: row.accVal || 0,
                                  }))
                                  .slice(0, 5) // Display major 5 for clarity
                                }
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                                <YAxis />
                                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                                <Legend />
                                <Bar dataKey="plan" name={`Kế hoạch Tháng ${thisMonthNum}`} fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="accumulated" name="Tích lũy đạt được" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>

                          {/* Chart 2: Tích lũy tháng vs Thực hiện tháng trước (So sánh tăng trưởng) */}
                          <div className="h-80 bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                            <span className="text-xs font-bold text-slate-400 block pb-2 uppercase tracking-wide">
                              Biểu Đồ 2: So Sánh Tăng Trưởng Tích Lũy Tháng {thisMonthNum} vs Thực Hiện Tháng {lastMonthNum}
                            </span>
                            <ResponsiveContainer width="100%" height="85%">
                              <BarChart
                                data={btlMappedRows
                                  .filter((row) => row.lastMonthVal !== null || row.accVal !== null)
                                  .map((row) => ({
                                    name: `${row.chi_tiết_hạng_mục} ${row.phân_loại ? `(${row.phân_loại})` : ""}`,
                                    lastMonthActual: row.lastMonthVal || 0,
                                    thisMonthAccumulated: row.accVal || 0,
                                  }))
                                  .slice(0, 5) // Display same major 5 for parity
                                }
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                                <YAxis />
                                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                                <Legend />
                                <Bar dataKey="lastMonthActual" name={`Thực hiện Tháng ${lastMonthNum}`} fill="#f43f5e" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="thisMonthAccumulated" name={`Tích lũy Tháng ${thisMonthNum}`} fill="#10b981" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Full Data table */}
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                            Bảng Dữ Liệu BTL, POSM & Trade Marketing Chi Tiết
                          </span>
                          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 font-bold text-slate-500 uppercase tracking-wider">
                                <tr>
                                  <th className="px-4 py-3">Hạng mục lớn</th>
                                  <th className="px-4 py-3">Chi tiết & Phân loại</th>
                                  <th className="px-4 py-3">Tần suất / Đơn vị</th>
                                  <th className="px-4 py-3 text-right">{`Thực hiện tháng ${lastMonthNum}`}</th>
                                  <th className="px-4 py-3 text-right">{`Kế hoạch tháng ${thisMonthNum}`}</th>
                                  <th className="px-4 py-3 text-right">{`Tích lũy tháng ${thisMonthNum}`}</th>
                                  <th className="px-4 py-3 text-right">Đạt kế hoạch</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-700">
                                {btlMappedRows.map((row, idx) => {
                                  const rate = row.planVal && row.accVal
                                    ? Math.round((row.accVal / row.planVal) * 100)
                                    : null;
                                  return (
                                    <tr key={idx} className="hover:bg-slate-50/50">
                                      <td className="px-4 py-3 font-semibold text-slate-900">{row.hạng_mục_lớn}</td>
                                      <td className="px-4 py-3 font-sans">
                                        <div className="font-medium text-slate-800">{row.chi_tiết_hạng_mục}</div>
                                        {row.phân_loại && <div className="text-slate-400 text-[10px] font-mono">{row.phân_loại}</div>}
                                      </td>
                                      <td className="px-4 py-3 font-sans text-slate-500">
                                        {row.tần_suất} / <span className="font-mono text-[10px]">{row.đơn_vị_tính}</span>
                                      </td>
                                      <td className="px-4 py-3 text-right font-mono font-medium">{row.lastMonthVal !== null && row.lastMonthVal !== undefined ? row.lastMonthVal.toLocaleString() : "—"}</td>
                                      <td className="px-4 py-3 text-right font-mono font-medium">{row.planVal !== null && row.planVal !== undefined ? row.planVal.toLocaleString() : "—"}</td>
                                      <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-600">{row.accVal !== null && row.accVal !== undefined ? row.accVal.toLocaleString() : "—"}</td>
                                      <td className="px-4 py-3 text-right font-mono font-bold">
                                        {rate !== null ? (
                                          <span className={rate >= 100 ? "text-emerald-600" : rate >= 70 ? "text-amber-500" : "text-rose-500"}>
                                            {rate}%
                                          </span>
                                        ) : "—"}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                </div>
              </div>
            </section>
          </div>
        ) : (
          /* ------------------------------------------------------------
              GIAO DIỆN CONTROL PANEL (BẢNG ĐIỀU KHIỂN RIÊNG BIỆT)
             ------------------------------------------------------------ */
          <div className="space-y-8 animate-fade-in">
            <div id="editor_title_section" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                  <Settings2 className="h-6 w-6 text-indigo-600 animate-spin-slow" />
                  Control Panel & Quản Trị Báo Cáo
                </h2>
                <p className="text-sm text-slate-500">
                  Cung cấp nguồn dữ liệu JSON mới và biên tập trực tiếp các bài nhận định tiếp thị trước khi xuất bản báo cáo.
                </p>
              </div>

              {/* Action buttons: Export & Reset */}
              <div className="flex flex-wrap gap-2 self-start sm:self-auto">
                <button
                  onClick={() => exportToExcel(marketingData)}
                  className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition shadow-sm"
                  title="Xuất cơ sở dữ liệu hiện tại thành định dạng Excel đa phân hệ (Multi-worksheet)"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-indigo-600" />
                  Xuất Excel (.xls)
                </button>

                <button
                  onClick={() => exportToJSON(marketingData)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-sm"
                  title="Xuất toàn bộ cấu trúc dữ liệu JSON để dự phòng hoặc phục hồi"
                >
                  <FileJson className="h-3.5 w-3.5 text-slate-600" />
                  Xuất JSON
                </button>

                <button
                  onClick={handleResetData}
                  className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition shadow-sm"
                  title="Xoá toàn bộ chỉnh sửa và khôi phục dữ liệu gốc mặc định"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-rose-600" />
                  Khôi phục mặc định
                </button>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-12 items-start">
              
              {/* LEFT COLUMN: JSON DATA SOURCE MANAGEMENT (5 Cols) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Option 1: Google Drive Import */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <Globe className="h-4 w-4" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      1. Kết nối Google Drive trực tuyến
                    </h3>
                  </div>

                  <form onSubmit={handleDriveImport} className="space-y-3">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Lưu trữ file JSON của bạn trên Google Drive, thiết lập chế độ chia sẻ <strong>&quot;Bất kỳ ai có liên kết đều xem được&quot; (Anyone with link)</strong>, sau đó dán link vào đây:
                    </p>
                    <div className="flex gap-2">
                      <input
                        id="drive_url_input"
                        type="text"
                        value={driveUrl}
                        onChange={(e) => setDriveUrl(e.target.value)}
                        placeholder="Dán link chia sẻ hoặc ID tệp Google Drive..."
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 shadow-inner focus:border-indigo-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={isDriveLoading || !driveUrl.trim()}
                        className="flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 shadow-sm transition shrink-0"
                      >
                        {isDriveLoading ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Upload className="h-3.5 w-3.5" />
                        )}
                        Đồng bộ
                      </button>
                    </div>
                  </form>
                  
                  {/* Public Sample Links */}
                  <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 text-[11px] text-slate-500 space-y-1.5">
                    <span className="font-semibold text-slate-800 block">💡 Cách chuẩn bị Link tệp nhanh:</span>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Bấm nút <span className="font-medium text-slate-800">Chia sẻ (Share)</span> trên file JSON ở Drive của bạn.</li>
                      <li>Chọn <span className="font-medium text-slate-800">Bất kỳ ai có đường liên kết (Anyone with link)</span>.</li>
                      <li>Copy liên kết đó dán vào khung trên và bấm <span className="font-medium text-indigo-600">Đồng bộ</span>.</li>
                    </ul>
                  </div>
                </div>

                {/* Option 2: Paste Raw JSON */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <FileJson className="h-4 w-4" />
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        2. Soạn thảo hoặc Paste JSON thủ công
                      </h3>
                    </div>
                  </div>

                  <form onSubmit={handleJsonSubmit} className="space-y-3">
                    <div className="relative">
                      <textarea
                        id="json_text_editor"
                        rows={12}
                        value={pastedJson}
                        onChange={(e) => setPastedJson(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 p-3 font-mono text-[11px] text-slate-800 bg-slate-950 text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 scrollbar"
                      />
                      <span className="absolute bottom-2 right-2 rounded bg-slate-800 px-2 py-0.5 font-mono text-[9px] text-slate-400">
                        JSON Editor
                      </span>
                    </div>

                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 shadow-sm transition"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Cập nhật dữ liệu cấu trúc
                    </button>
                  </form>
                </div>

                {/* Section 3: Quản Lý Người Dùng & Phân Quyền (Only Admin) */}
                {currentUser.role === "Admin" ? (
                  <div className="rounded-2xl border border-indigo-200 bg-white p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        <UserPlus className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">
                          Quản lý tài khoản & Phân quyền
                        </h3>
                        <p className="text-[11px] text-slate-500">Thêm, sửa, xóa người dùng hệ thống</p>
                      </div>
                    </div>

                    {/* Add / Edit Form */}
                    <form onSubmit={handleAddOrEditUser} className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                      <span className="text-xs font-bold text-indigo-900 block uppercase tracking-wider">
                        {editingUsername ? "⚡ Cập nhật người dùng" : "➕ Thêm tài khoản mới"}
                      </span>
                      
                      <div className="space-y-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block">Tên hiển thị</label>
                          <input
                            id="manager_name_input"
                            type="text"
                            required
                            value={managerName}
                            onChange={(e) => setManagerName(e.target.value)}
                            placeholder="Ví dụ: Nguyễn Văn A"
                            className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block">Tên đăng nhập (Email)</label>
                          <input
                            id="manager_username_input"
                            type="text"
                            required
                            disabled={!!editingUsername}
                            value={managerUsername}
                            onChange={(e) => setManagerUsername(e.target.value)}
                            placeholder="Ví dụ: name@gmail.com"
                            className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block">Mật khẩu</label>
                          <input
                            id="manager_password_input"
                            type="password"
                            required={!editingUsername}
                            value={managerPassword}
                            onChange={(e) => setManagerPassword(e.target.value)}
                            placeholder={editingUsername ? "Để trống nếu giữ nguyên..." : "Nhập mật khẩu..."}
                            className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block">Vai trò phân quyền</label>
                          <select
                            id="manager_role_select"
                            value={managerRole}
                            onChange={(e) => setManagerRole(e.target.value as any)}
                            className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 bg-white focus:border-indigo-500 focus:outline-none cursor-pointer"
                          >
                            <option value="Viewer">Viewer (Chỉ xem báo cáo)</option>
                            <option value="Editor">Editor (Biên tập dữ liệu)</option>
                            <option value="Admin">Admin (Toàn quyền hệ thống)</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="submit"
                          id="btn_submit_manager"
                          className="flex-1 rounded bg-indigo-600 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition cursor-pointer"
                        >
                          {editingUsername ? "Lưu thay đổi" : "Tạo tài khoản"}
                        </button>
                        {editingUsername && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUsername(null);
                              setManagerUsername("");
                              setManagerPassword("");
                              setManagerName("");
                              setManagerRole("Viewer");
                            }}
                            className="rounded bg-slate-300 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-400 transition cursor-pointer"
                          >
                            Hủy
                          </button>
                        )}
                      </div>
                    </form>

                    {/* Users list table */}
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Danh sách tài khoản ({users.length})
                      </span>
                      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white max-h-56 overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 font-bold text-slate-500 uppercase tracking-wider sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-[10px]">Tài khoản</th>
                              <th className="px-3 py-2 text-[10px]">Vai trò</th>
                              <th className="px-3 py-2 text-right text-[10px]">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
                            {users.map((u) => (
                              <tr key={u.username} className="hover:bg-slate-50 transition-colors">
                                <td className="px-3 py-2">
                                  <span className="font-semibold text-slate-900 block leading-tight">{u.name}</span>
                                  <span className="text-[10px] text-slate-400 font-mono block leading-tight">{u.username}</span>
                                </td>
                                <td className="px-3 py-2">
                                  <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-extrabold ${
                                    u.role === "Admin" ? "bg-indigo-100 text-indigo-700" :
                                    u.role === "Editor" ? "bg-emerald-100 text-emerald-700" :
                                    "bg-amber-100 text-amber-700"
                                  }`}>
                                    {u.role}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-right space-x-1.5">
                                  <button
                                    onClick={() => handleStartEditUser(u)}
                                    className="text-indigo-600 hover:text-indigo-900 text-[11px] font-semibold cursor-pointer"
                                    title="Sửa phân quyền"
                                  >
                                    Sửa
                                  </button>
                                  {/* Cannot delete oneself */}
                                  {u.username !== currentUser.username ? (
                                    <button
                                      onClick={() => handleDeleteUser(u.username)}
                                      className="text-rose-600 hover:text-rose-900 text-[11px] font-semibold cursor-pointer"
                                      title="Xóa người dùng"
                                    >
                                      Xóa
                                    </button>
                                  ) : (
                                    <span className="text-slate-300 text-[11px] select-none">Bản thân</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm space-y-2">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-slate-400" />
                      <h3 className="font-bold text-slate-700 text-sm">
                        Phân quyền & Tài khoản
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Bạn đang đăng nhập với quyền <strong className="text-emerald-600">{currentUser.role}</strong>. Chỉ có tài khoản Quản trị viên (Admin) mới có thể xem danh sách và phân quyền quản trị tài khoản người dùng khác.
                    </p>
                  </div>
                )}

                {/* Section: Automatic Email Configuration (Only Admin) */}
                {currentUser && currentUser.role === "Admin" && (
                  <div className="rounded-2xl border border-indigo-200 bg-white p-5 shadow-sm space-y-4 animate-fade-in">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">
                          Cấu hình gửi Mail tự động
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Tự động gửi email thông báo nhận định tổng quan khi lưu và xuất bản báo cáo
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleSaveMailConfig} className="space-y-4">
                      {/* Toggle Enabled */}
                      <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                        <div className="space-y-0.5">
                          <label className="text-xs font-bold text-slate-700 block">Kích hoạt gửi Email tự động</label>
                          <span className="text-[10px] text-slate-400 block">Bật/tắt tự động gửi thông báo qua email</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={mailEnabled}
                            onChange={(e) => setMailEnabled(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Máy chủ SMTP (Host) <span className="text-[9px] text-slate-400 lowercase">(tùy chọn nếu cấu hình .env)</span></label>
                          <input
                            type="text"
                            required={false}
                            disabled={!mailEnabled}
                            value={mailHost}
                            onChange={(e) => setMailHost(e.target.value)}
                            placeholder="smtp.gmail.com"
                            className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 disabled:bg-slate-50 disabled:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Cổng (Port) <span className="text-[9px] text-slate-400 lowercase">(mặc định: 587)</span></label>
                          <input
                            type="text"
                            required={false}
                            disabled={!mailEnabled}
                            value={mailPort}
                            onChange={(e) => setMailPort(e.target.value)}
                            placeholder="587"
                            className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 disabled:bg-slate-50 disabled:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tài khoản SMTP (User) <span className="text-[9px] text-slate-400 lowercase">(tùy chọn nếu cấu hình .env)</span></label>
                          <input
                            type="text"
                            required={false}
                            disabled={!mailEnabled}
                            value={mailUser}
                            onChange={(e) => setMailUser(e.target.value)}
                            placeholder="marketing.karofi.livotec@gmail.com"
                            className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 disabled:bg-slate-50 disabled:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Mật khẩu (App Password - Secret) <span className="text-[9px] text-slate-400 lowercase">(tùy chọn nếu cấu hình .env)</span></label>
                          <input
                            type="password"
                            required={false}
                            disabled={!mailEnabled}
                            value={mailPass}
                            onChange={(e) => setMailPass(e.target.value)}
                            placeholder="Nhập mật khẩu SMTP hoặc App Password..."
                            className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 disabled:bg-slate-50 disabled:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Email nhận thông báo <span className="text-[9px] text-slate-400 lowercase">(tùy chọn nếu cấu hình .env)</span></label>
                        <input
                          type="email"
                          required={false}
                          disabled={!mailEnabled}
                          value={mailRecipient}
                          onChange={(e) => setMailRecipient(e.target.value)}
                          placeholder="ntkdung1206@gmail.com"
                          className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 disabled:bg-slate-50 disabled:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isMailLoading}
                        className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 shadow-sm transition cursor-pointer"
                      >
                        {isMailLoading ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        Lưu cấu hình & Mã hóa bảo mật
                      </button>
                    </form>
                  </div>
                )}

                {/* Section 4: Advanced Database Row Manager (Only Admin) */}
                {currentUser && currentUser.role === "Admin" && (
                  <div className="rounded-2xl border border-indigo-200 bg-white p-5 shadow-sm space-y-4 animate-fade-in">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                          <Layers className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">
                            Trình Quản Trị Cơ Sở Dữ Liệu
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            Chỉnh sửa, xóa dữ liệu các bảng đang có trong hệ thống CSDL
                          </p>
                        </div>
                      </div>

                      {/* Collection Selector Tabs */}
                      <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                        <button
                          type="button"
                          onClick={() => {
                            setDbActiveTab("digital");
                            setDbPage(1);
                            setDbEditingRowIndex(null);
                          }}
                          className={`rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
                            dbActiveTab === "digital" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          Digital Marketing
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDbActiveTab("kol");
                            setDbPage(1);
                            setDbEditingRowIndex(null);
                          }}
                          className={`rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
                            dbActiveTab === "kol" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          KOL/KOC
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDbActiveTab("btl");
                            setDbPage(1);
                            setDbEditingRowIndex(null);
                          }}
                          className={`rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
                            dbActiveTab === "btl" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          BTL & POSM
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDbActiveTab("ooh");
                            setDbPage(1);
                            setDbEditingRowIndex(null);
                          }}
                          className={`rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
                            dbActiveTab === "ooh" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          OOH & PR
                        </button>
                      </div>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex-1 min-w-[200px]">
                        <input
                          type="text"
                          value={dbSearchQuery}
                          onChange={(e) => {
                            setDbSearchQuery(e.target.value);
                            setDbPage(1);
                          }}
                          placeholder="Tìm kiếm dòng dữ liệu trong bảng này..."
                          className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-800 bg-white focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <select
                          value={dbBrandFilter}
                          onChange={(e) => {
                            setDbBrandFilter(e.target.value as any);
                            setDbPage(1);
                          }}
                          className="rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-800 bg-white focus:border-indigo-500 focus:outline-none"
                        >
                          <option value="Tất cả">Tất cả nhãn hàng</option>
                          <option value="Livotec">Livotec</option>
                          <option value="Karofi">Karofi</option>
                        </select>
                      </div>
                    </div>

                    {/* Interactive Edit Panel */}
                    {dbEditingRowIndex !== null && dbEditingRowData && (
                      <form
                        onSubmit={handleDbEditSave}
                        className="space-y-4 bg-indigo-50/40 p-4 rounded-xl border border-indigo-100 animate-fade-in"
                      >
                        <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                          <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider block">
                            ✏️ Hiệu Chỉnh Dòng Dữ Liệu (Bản ghi gốc #{dbEditingRowIndex})
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setDbEditingRowIndex(null);
                              setDbEditingRowData(null);
                            }}
                            className="text-xs text-slate-500 hover:text-slate-800 underline font-semibold"
                          >
                            Hủy bỏ
                          </button>
                        </div>

                        {/* Fields list mapping */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {(() => {
                            const fields =
                              dbActiveTab === "digital"
                                ? [
                                    { key: "week", label: "Tuần báo cáo (week)", type: "text" },
                                    { key: "phân_loại_thời_gian", label: "Phân loại TG", type: "text" },
                                    { key: "brand", label: "Nhãn hàng (brand)", type: "select", options: ["Livotec", "Karofi"] },
                                    { key: "nhóm_báo_cáo", label: "Nhóm báo cáo", type: "text" },
                                    { key: "hạng_mục", label: "Hạng mục", type: "text" },
                                    { key: "ngành_hàng", label: "Ngành hàng", type: "text" },
                                    { key: "kênh_channel", label: "Kênh (channel)", type: "text" },
                                    { key: "chỉ_số_metric", label: "Chỉ số metric", type: "text" },
                                    { key: "mục_tiêu_target", label: "KPI tuần (target)", type: "number" },
                                    { key: "thực_tế_actual", label: "Thực tế tuần (actual)", type: "number" },
                                    { key: "target_tháng", label: "Target tháng", type: "number" },
                                    { key: "tích_lũy_tháng", label: "Lũy kế tháng", type: "number" },
                                  ]
                                : dbActiveTab === "kol"
                                ? [
                                    { key: "week", label: "Tuần báo cáo", type: "text" },
                                    { key: "brand", label: "Nhãn hàng (brand)", type: "select", options: ["Livotec", "Karofi"] },
                                    { key: "hạng_mục", label: "Hạng mục", type: "text" },
                                    { key: "ngành_hàng", label: "Ngành hàng", type: "text" },
                                    { key: "kênh_channel", label: "Kênh (channel)", type: "text" },
                                    { key: "chỉ_số_metric", label: "Chỉ số metric", type: "text" },
                                    { key: "kpi_toàn_chiến_dịch", label: "KPI Chiến dịch", type: "number" },
                                    { key: "thực_tế_trong_tuần", label: "Thực tế tuần", type: "number" },
                                    { key: "tích_lũy_chiến_dịch", label: "Tích lũy chiến dịch", type: "number" },
                                  ]
                                : dbActiveTab === "btl"
                                ? (() => {
                                    const btlInfo = getBtlRowDataValues(dbEditingRowData);
                                    return [
                                      { key: "week", label: "Tuần báo cáo", type: "text" },
                                      { key: "brand", label: "Nhãn hàng", type: "select", options: ["Livotec", "Karofi"] },
                                      { key: "hạng_mục_lớn", label: "Hạng mục lớn", type: "text" },
                                      { key: "chi_tiết_hạng_mục", label: "Chi tiết hạng mục", type: "text" },
                                      { key: "phân_loại", label: "Phân loại", type: "text" },
                                      { key: "tần_suất", label: "Tần suất", type: "text" },
                                      { key: "đơn_vị_tính", label: "Đơn vị tính", type: "text" },
                                      { key: btlInfo.lastMonthKey, label: `Thực hiện T${btlInfo.lastMonth}`, type: "number" },
                                      { key: btlInfo.thisMonthPlanKey, label: `Kế hoạch T${btlInfo.thisMonth}`, type: "number" },
                                      { key: btlInfo.thisMonthAccumulatedKey, label: `Tích lũy T${btlInfo.thisMonth}`, type: "number" },
                                    ];
                                  })()
                                : [
                                    { key: "week", label: "Tuần báo cáo", type: "text" },
                                    { key: "tháng_báo_cáo", label: "Tháng báo cáo", type: "text" },
                                    { key: "brand", label: "Nhãn hàng", type: "select", options: ["Livotec", "Karofi"] },
                                    { key: "hạng_mục", label: "Hạng mục", type: "text" },
                                    { key: "ngành_hàng", label: "Ngành hàng", type: "text" },
                                    { key: "kênh_channel", label: "Kênh (channel)", type: "text" },
                                    { key: "chỉ_số_metric", label: "Chỉ số metric", type: "text" },
                                    { key: "mục_tiêu_target", label: "Target", type: "number" },
                                    { key: "thực_tế_actual", label: "Thực tế", type: "number" },
                                  ];

                            return fields.map((f) => (
                              <div key={f.key}>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                                  {f.label}
                                </label>
                                {f.type === "select" ? (
                                  <select
                                    value={dbEditingRowData[f.key] || ""}
                                    onChange={(e) =>
                                      setDbEditingRowData({ ...dbEditingRowData, [f.key]: e.target.value })
                                    }
                                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-800 bg-white focus:border-indigo-500 focus:outline-none"
                                  >
                                    {(f.options || []).map((opt) => (
                                      <option key={opt} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type={f.type}
                                    value={dbEditingRowData[f.key] !== null ? dbEditingRowData[f.key] : ""}
                                    onChange={(e) => {
                                      const val = f.type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value;
                                      setDbEditingRowData({ ...dbEditingRowData, [f.key]: val });
                                    }}
                                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-800 bg-white focus:border-indigo-500 focus:outline-none"
                                  />
                                )}
                              </div>
                            ));
                          })()}
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            type="submit"
                            className="flex-1 rounded bg-indigo-600 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition cursor-pointer"
                          >
                            Đồng bộ thay đổi vào CSDL
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDbEditingRowIndex(null);
                              setDbEditingRowData(null);
                            }}
                            className="px-4 rounded bg-slate-200 text-slate-800 hover:bg-slate-300 text-xs font-bold transition cursor-pointer"
                          >
                            Hủy
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Data List Table */}
                    <div className="space-y-2">
                      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 font-bold text-slate-500 uppercase tracking-wider">
                            <tr>
                              {getHeadersForTab().map((h, i) => (
                                <th key={i} className={`px-3 py-2 text-[10px] ${getHeaderMinWidth(h)}`}>
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
                            {(() => {
                              // Build filtered rows
                              let activeDbRows: any[] = [];
                              if (dbActiveTab === "digital") {
                                activeDbRows = marketingData.digital_marketing || [];
                              } else if (dbActiveTab === "kol") {
                                activeDbRows = marketingData.kol_koc || [];
                              } else if (dbActiveTab === "btl") {
                                activeDbRows = marketingData.btl_trade || [];
                              } else if (dbActiveTab === "ooh") {
                                activeDbRows = marketingData.monthly_ooh_pr || [];
                              }

                              const mappedDbRows = activeDbRows.map((row, originalIndex) => ({
                                row,
                                originalIndex,
                              }));

                              const filteredMappedRows = mappedDbRows.filter(({ row }) => {
                                if (dbBrandFilter !== "Tất cả") {
                                  if (!row.brand || row.brand.toLowerCase() !== dbBrandFilter.toLowerCase()) {
                                    return false;
                                  }
                                }
                                if (dbSearchQuery.trim()) {
                                  const query = dbSearchQuery.toLowerCase();
                                  const matchVal = Object.values(row)
                                    .map((val) => (val !== null && val !== undefined ? val.toString().toLowerCase() : ""))
                                    .join(" ");
                                  return matchVal.includes(query);
                                }
                                return true;
                              });

                              const totalDbRows = filteredMappedRows.length;
                              const totalDbPages = Math.ceil(totalDbRows / dbLimit) || 1;
                              const safeDbPage = Math.min(dbPage, totalDbPages);
                              const startIndex = (safeDbPage - 1) * dbLimit;
                              const paginatedDbRows = filteredMappedRows.slice(startIndex, startIndex + dbLimit);

                              if (paginatedDbRows.length === 0) {
                                return (
                                  <tr>
                                    <td colSpan={10} className="px-3 py-6 text-center text-slate-400 italic font-sans">
                                      Không tìm thấy dòng dữ liệu nào khớp với bộ lọc tìm kiếm.
                                    </td>
                                  </tr>
                                );
                              }

                              return (
                                <>
                                  {paginatedDbRows.map(({ row, originalIndex }) => (
                                    <tr key={originalIndex} className="hover:bg-slate-50/75 transition-colors">
                                      {dbActiveTab === "digital" && (
                                        <>
                                          <td className={`px-3 py-2 font-mono font-bold text-slate-500 ${getHeaderMinWidth("Tuần")}`}>{row.week}</td>
                                          <td className={`px-3 py-2 font-semibold text-slate-800 ${getHeaderMinWidth("Thương hiệu")}`}>{row.brand}</td>
                                          <td className={`px-3 py-2 text-slate-600 truncate max-w-[110px] ${getHeaderMinWidth("Hạng mục")}`} title={row.hạng_mục}>{row.hạng_mục}</td>
                                          <td className={`px-3 py-2 text-slate-600 truncate max-w-[120px] ${getHeaderMinWidth("Chỉ số metric")}`} title={row.chỉ_số_metric}>{row.chỉ_số_metric}</td>
                                          <td className={`px-3 py-2 font-mono ${getHeaderMinWidth("KPI tuần")}`}>{row.mục_tiêu_target !== null ? row.mục_tiêu_target.toLocaleString() : "—"}</td>
                                          <td className={`px-3 py-2 font-mono text-emerald-600 font-semibold ${getHeaderMinWidth("Thực tế tuần")}`}>{row.thực_tế_actual !== null ? row.thực_tế_actual.toLocaleString() : "—"}</td>
                                          <td className={`px-3 py-2 font-mono text-indigo-600 ${getHeaderMinWidth("Tích lũy tháng")}`}>{row.tích_lũy_tháng !== null ? row.tích_lũy_tháng.toLocaleString() : "—"}</td>
                                        </>
                                      )}

                                      {dbActiveTab === "kol" && (
                                        <>
                                          <td className={`px-3 py-2 font-mono font-bold text-slate-500 ${getHeaderMinWidth("Tuần")}`}>{row.week}</td>
                                          <td className={`px-3 py-2 font-semibold text-slate-800 ${getHeaderMinWidth("Thương hiệu")}`}>{row.brand}</td>
                                          <td className={`px-3 py-2 text-slate-600 ${getHeaderMinWidth("Hạng mục")}`}>{row.hạng_mục}</td>
                                          <td className={`px-3 py-2 text-slate-600 ${getHeaderMinWidth("Kênh")}`}>{row.kênh_channel}</td>
                                          <td className={`px-3 py-2 font-mono ${getHeaderMinWidth("KPI chiến dịch")}`}>{row.kpi_toàn_chiến_dịch !== null ? row.kpi_toàn_chiến_dịch.toLocaleString() : "—"}</td>
                                          <td className={`px-3 py-2 font-mono text-emerald-600 font-semibold ${getHeaderMinWidth("Thực tế tuần")}`}>{row.thực_tế_trong_tuần !== null ? row.thực_tế_trong_tuần.toLocaleString() : "—"}</td>
                                        </>
                                      )}

                                      {dbActiveTab === "btl" && (() => {
                                        const btlInfo = getBtlRowDataValues(row);
                                        return (
                                          <>
                                            <td className={`px-3 py-2 font-mono font-bold text-slate-500 ${getHeaderMinWidth("Tuần")}`}>{row.week}</td>
                                            <td className={`px-3 py-2 font-semibold text-slate-800 ${getHeaderMinWidth("Thương hiệu")}`}>{row.brand}</td>
                                            <td className={`px-3 py-2 text-slate-600 truncate max-w-[120px] ${getHeaderMinWidth("Hạng mục lớn")}`} title={row.hạng_mục_lớn}>{row.hạng_mục_lớn}</td>
                                            <td className={`px-3 py-2 text-slate-600 ${getHeaderMinWidth("Chi tiết")}`}>
                                              <div className="font-medium text-slate-800 leading-tight">{row.chi_tiết_hạng_mục}</div>
                                              {row.phân_loại && <div className="text-[9px] text-slate-400 font-mono leading-none">{row.phân_loại}</div>}
                                            </td>
                                            <td className={`px-3 py-2 font-mono ${getHeaderMinWidth(`Thực hiện T${btlInfo.lastMonth}`)}`}>{btlInfo.lastMonthVal !== null && btlInfo.lastMonthVal !== undefined ? btlInfo.lastMonthVal.toLocaleString() : "—"}</td>
                                            <td className={`px-3 py-2 font-mono ${getHeaderMinWidth(`Kế hoạch T${btlInfo.thisMonth}`)}`}>{btlInfo.planVal !== null && btlInfo.planVal !== undefined ? btlInfo.planVal.toLocaleString() : "—"}</td>
                                            <td className={`px-3 py-2 font-mono text-emerald-600 font-semibold ${getHeaderMinWidth(`Tích lũy T${btlInfo.thisMonth}`)}`}>{btlInfo.accVal !== null && btlInfo.accVal !== undefined ? btlInfo.accVal.toLocaleString() : "—"}</td>
                                          </>
                                        );
                                      })()}

                                      {dbActiveTab === "ooh" && (
                                        <>
                                          <td className={`px-3 py-2 font-mono font-bold text-slate-500 ${getHeaderMinWidth("Tháng")}`}>{row.tháng_báo_cáo}</td>
                                          <td className={`px-3 py-2 font-semibold text-slate-800 ${getHeaderMinWidth("Thương hiệu")}`}>{row.brand}</td>
                                          <td className={`px-3 py-2 text-slate-600 truncate max-w-[120px] ${getHeaderMinWidth("Hạng mục")}`} title={row.hạng_mục}>{row.hạng_mục}</td>
                                          <td className={`px-3 py-2 text-slate-600 truncate max-w-[120px] ${getHeaderMinWidth("Metric")}`} title={row.chỉ_số_metric}>{row.chỉ_số_metric}</td>
                                          <td className={`px-3 py-2 font-mono ${getHeaderMinWidth("KPI")}`}>{row.mục_tiêu_target !== null ? row.mục_tiêu_target.toLocaleString() : "—"}</td>
                                          <td className={`px-3 py-2 font-mono text-emerald-600 font-semibold ${getHeaderMinWidth("Thực tế")}`}>{row.thực_tế_actual !== null ? row.thực_tế_actual.toLocaleString() : "—"}</td>
                                        </>
                                      )}

                                      <td className={`px-3 py-2 text-right ${getHeaderMinWidth("Thao tác")}`}>
                                        <div className="flex items-center justify-end gap-2.5">
                                          <button
                                            type="button"
                                            onClick={() => handleDbEditStart(dbActiveTab, originalIndex)}
                                            className="text-indigo-600 hover:text-indigo-900 font-semibold cursor-pointer"
                                          >
                                            Sửa
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDbDelete(dbActiveTab, originalIndex)}
                                            className="text-rose-600 hover:text-rose-900 font-semibold cursor-pointer"
                                          >
                                            Xóa
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}

                                  {/* Pagination controls inside table rendering context to avoid nested state dependency errors */}
                                  {totalDbPages > 1 && (
                                    <tr>
                                      <td colSpan={10} className="px-3 py-3 bg-slate-50">
                                        <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                                          <span>
                                            Hiển thị {startIndex + 1} - {Math.min(startIndex + dbLimit, totalDbRows)} trong số{" "}
                                            <strong>{totalDbRows}</strong> dòng dữ liệu
                                          </span>
                                          <div className="flex items-center gap-1">
                                            <button
                                              type="button"
                                              disabled={safeDbPage === 1}
                                              onClick={() => setDbPage((p) => Math.max(1, p - 1))}
                                              className="px-2 py-1 rounded bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed text-[11px] font-bold"
                                            >
                                              Trang trước
                                            </button>
                                            <span className="px-2 font-sans font-semibold">
                                              Trang {safeDbPage} / {totalDbPages}
                                            </span>
                                            <button
                                              type="button"
                                              disabled={safeDbPage >= totalDbPages}
                                              onClick={() => setDbPage((p) => Math.min(totalDbPages, p + 1))}
                                              className="px-2 py-1 rounded bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed text-[11px] font-bold"
                                            >
                                              Trang sau
                                            </button>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </>
                              );
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* RIGHT COLUMN: REVIEWS & SUGGESTIONS WRITER (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Assessment Editor Box */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 text-base">
                        Biên tập nhận định & Đề xuất tuần này
                      </h3>
                      <p className="text-xs text-slate-500">
                        Đang sửa nhận xét cho nhãn hàng: <strong className="text-indigo-600">{selectedBrand.toUpperCase()}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* AI Suggestion Generator */}
                      <button
                        onClick={handleAiSuggestions}
                        disabled={isAiLoading}
                        className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 shadow-sm transition"
                      >
                        {isAiLoading ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" />
                        )}
                        💡 Gợi ý bởi AI
                      </button>

                      {/* State status badge */}
                      {hasUnpublishedChanges ? (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-600 border border-amber-200 uppercase tracking-wider shrink-0">
                          Bản Nháp (Draft)
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600 border border-emerald-200 uppercase tracking-wider shrink-0">
                          Đã Xuất Bản (Live)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Executive Summary: Evaluation */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                        Đánh giá Thực Trạng Triển Khai (Box 2 - Cột 1)
                      </label>
                      <textarea
                        id="edit_eval_textarea"
                        rows={3}
                        value={draftComments.evaluation}
                        onChange={(e) => handleDraftCommentChange("evaluation", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 shadow-inner focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    {/* Executive Summary: Proposals */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                        Đề xuất Tối Ưu Tuần Kế Tiếp (Box 2 - Cột 2)
                      </label>
                      <textarea
                        id="edit_prop_textarea"
                        rows={3}
                        value={draftComments.proposals}
                        onChange={(e) => handleDraftCommentChange("proposals", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 shadow-inner focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    {/* Category Analysis Individual Tab Comments */}
                    <div className="border-t border-slate-100 pt-4 space-y-4">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                        Nhận xét chi tiết cho từng danh mục (Box 3)
                      </span>

                      <div className="grid gap-4 sm:grid-cols-2">
                        {/* SOV */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <Percent className="h-3.5 w-3.5 text-indigo-500" />
                            Nhận xét Share of Voice (SOV)
                          </label>
                          <textarea
                            id="edit_sov_textarea"
                            rows={3}
                            value={draftComments.categories.sov || ""}
                            onChange={(e) => handleDraftCategoryChange("sov", e.target.value)}
                            className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 shadow-inner focus:border-indigo-500 focus:outline-none"
                          />
                        </div>

                        {/* KOL/KOC */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-indigo-500" />
                            Nhận xét KOL / KOC
                          </label>
                          <textarea
                            id="edit_kol_textarea"
                            rows={3}
                            value={draftComments.categories.kol_koc || ""}
                            onChange={(e) => handleDraftCategoryChange("kol_koc", e.target.value)}
                            className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 shadow-inner focus:border-indigo-500 focus:outline-none"
                          />
                        </div>

                        {/* Content & Creative */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5 text-indigo-500" />
                            Nhận xét Content & Sáng tạo
                          </label>
                          <textarea
                            id="edit_content_textarea"
                            rows={3}
                            value={draftComments.categories.content || ""}
                            onChange={(e) => handleDraftCategoryChange("content", e.target.value)}
                            className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 shadow-inner focus:border-indigo-500 focus:outline-none"
                          />
                        </div>

                        {/* TVC */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <Video className="h-3.5 w-3.5 text-indigo-500" />
                            Nhận xét TVC (GRPS)
                          </label>
                          <textarea
                            id="edit_tvc_textarea"
                            rows={3}
                            value={draftComments.categories.tvc || ""}
                            onChange={(e) => handleDraftCategoryChange("tvc", e.target.value)}
                            className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 shadow-inner focus:border-indigo-500 focus:outline-none"
                          />
                        </div>

                        {/* PR - Báo chí */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <Award className="h-3.5 w-3.5 text-indigo-500" />
                            Nhận xét PR - Báo chí
                          </label>
                          <textarea
                            id="edit_pr_textarea"
                            rows={3}
                            value={draftComments.categories.pr || ""}
                            onChange={(e) => handleDraftCategoryChange("pr", e.target.value)}
                            className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 shadow-inner focus:border-indigo-500 focus:outline-none"
                          />
                        </div>

                        {/* OOH */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <Store className="h-3.5 w-3.5 text-indigo-500" />
                            Nhận xét Quảng cáo OOH
                          </label>
                          <textarea
                            id="edit_ooh_textarea"
                            rows={3}
                            value={draftComments.categories.ooh || ""}
                            onChange={(e) => handleDraftCategoryChange("ooh", e.target.value)}
                            className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 shadow-inner focus:border-indigo-500 focus:outline-none"
                          />
                        </div>

                        {/* Paid Ads */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <Target className="h-3.5 w-3.5 text-indigo-500" />
                            Nhận xét Paid Ads (Quảng cáo)
                          </label>
                          <textarea
                            id="edit_ads_textarea"
                            rows={3}
                            value={draftComments.categories.paid_ads || ""}
                            onChange={(e) => handleDraftCategoryChange("paid_ads", e.target.value)}
                            className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 shadow-inner focus:border-indigo-500 focus:outline-none"
                          />
                        </div>

                        {/* SEO */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <Globe className="h-3.5 w-3.5 text-indigo-500" />
                            Nhận xét SEO Website & Content
                          </label>
                          <textarea
                            id="edit_seo_textarea"
                            rows={3}
                            value={draftComments.categories.seo || ""}
                            onChange={(e) => handleDraftCategoryChange("seo", e.target.value)}
                            className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 shadow-inner focus:border-indigo-500 focus:outline-none"
                          />
                        </div>

                        {/* BTL & Trade */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <Briefcase className="h-3.5 w-3.5 text-indigo-500" />
                            Nhận xét BTL & Trade Marketing
                          </label>
                          <textarea
                            id="edit_btl_textarea"
                            rows={3}
                            value={draftComments.categories.btl_trade || ""}
                            onChange={(e) => handleDraftCategoryChange("btl_trade", e.target.value)}
                            className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 shadow-inner focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Draft to Live reporting database */}
                  <div className="border-t border-slate-100 pt-5 flex items-center justify-end gap-3">
                    <button
                      onClick={() => {
                        const active = getActiveComments(selectedTimeline.id, selectedBrand);
                        setDraftComments(JSON.parse(JSON.stringify(active)));
                        setHasUnpublishedChanges(false);
                        triggerNotification("success", "Đã hủy bỏ toàn bộ các thay đổi nháp.");
                      }}
                      disabled={!hasUnpublishedChanges}
                      className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
                    >
                      Hủy bản nháp
                    </button>
                    
                    <button
                      id="publish_btn"
                      onClick={handlePublish}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-md transition"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Xuất bản báo cáo chính thức
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}
      </main>

      {/* Footer credits */}
      <footer className="mt-20 border-t border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-slate-400 sm:px-6">
          <p>© 2026 Livotec & Karofi Marketing Reporting Console. All rights reserved.</p>
          <p className="mt-1 font-mono">Dữ liệu phân tích tuần • Thiết kế với triết lý tối giản tinh tế</p>
        </div>
      </footer>
    </div>
  );
}
