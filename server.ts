import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { normalizeMarketingData } from "./src/data";

dotenv.config();

const app = express();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "marketing_dashboard_key_32bytes_!"; // Must be 32 bytes
const IV_LENGTH = 16;

function encrypt(text: string): string {
  if (!text) return "";
  try {
    const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
  } catch (err) {
    console.error("Encryption error:", err);
    return text;
  }
}

function decrypt(text: string): string {
  if (!text) return "";
  if (!text.includes(":")) return text;
  try {
    const parts = text.split(":");
    const iv = Buffer.from(parts.shift() || "", "hex");
    const encryptedText = Buffer.from(parts.join(":"), "hex");
    const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    console.error("Decryption error:", err);
    return text;
  }
}

// Lazy-initialize SMTP transport if environment variables or database config exist
function getMailTransporter() {
  const store = getDatabaseData();
  const config = store.mail_config || {};

  const host = config.smtp_host || process.env.SMTP_HOST;
  const port = Number(config.smtp_port || process.env.SMTP_PORT || 587);
  const user = config.smtp_user || process.env.SMTP_USER;
  const encryptedPass = config.smtp_pass;
  const pass = encryptedPass ? decrypt(encryptedPass) : process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass
      }
    });
  }
  return null;
}

// Helper to send email notifications when report is published
async function sendPublishNotification(weekId: string, comments: any) {
  const store = getDatabaseData();
  const config = store.mail_config || {};

  // Check if automatic email is disabled (defaults to true)
  if (config.enabled === false) {
    console.log("[Email] Automatic email notification is disabled by admin config.");
    return { success: false, reason: "disabled" };
  }

  const recipient = config.notification_email || process.env.NOTIFICATION_EMAIL || "ntkdung1206@gmail.com";
  const senderUser = config.smtp_user || process.env.SMTP_USER || "marketing.karofi.livotec@gmail.com";
  const transporter = getMailTransporter();
  
  const weekLabel = weekId.toUpperCase();
  const subject = `[Báo cáo Marketing] Đã xuất bản báo cáo mới cho tuần ${weekLabel}`;
  
  let commentsHtml = "<h3>Báo cáo mới đã được xuất bản trực tuyến!</h3>";
  commentsHtml += `<p>Thương hiệu và tuần báo cáo: <strong>Tuần ${weekLabel}</strong></p>`;
  
  if (comments) {
    for (const [brand, data] of Object.entries(comments)) {
      const bData = data as any;
      if (bData && bData.executiveSummary) {
        commentsHtml += `
          <div style="margin-top: 15px; padding: 15px; border-left: 4px solid #4f46e5; background-color: #f9fafb; border-radius: 8px; font-family: sans-serif;">
            <h4 style="margin: 0 0 5px 0; color: #4f46e5; font-size: 16px;">Thương hiệu: ${brand}</h4>
            <p style="margin: 8px 0;"><strong>Nhận định tổng quan:</strong> ${bData.executiveSummary.evaluation || "Không có nhận định."}</p>
            <p style="margin: 8px 0;"><strong>Đề xuất tuần tới:</strong> ${bData.executiveSummary.proposals || "Không có đề xuất."}</p>
          </div>
        `;
      }
    }
  }
  
  commentsHtml += `
    <p style="margin-top: 25px; font-size: 12px; color: #6b7280; font-family: sans-serif;">
      Đây là email thông báo tự động từ hệ thống Marketing Campaign Performance Dashboard.
    </p>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"Marketing Performance Dashboard" <${senderUser}>`,
        to: recipient,
        subject,
        html: commentsHtml
      });
      console.log(`[Email] Notification sent successfully to ${recipient}`);
      return { success: true, method: "smtp" };
    } catch (err) {
      console.error("[Email] Failed to send email via SMTP, falling back to logging:", err);
    }
  }

  console.log("==================================================");
  console.log(`[EMAIL SIMULATION] Sent to: ${recipient}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body:\n${commentsHtml.replace(/<[^>]*>/g, " ").trim()}`);
  console.log("==================================================");
  return { success: true, method: "simulation" };
}
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

// Persistent JSON Database Configuration
const DB_FILE_PATH = path.join(process.cwd(), "src", "db_store.json");
const INITIAL_DATA_PATH = path.join(process.cwd(), "src", "initial_data.json");

function getDatabaseData() {
  if (fs.existsSync(DB_FILE_PATH)) {
    try {
      const raw = fs.readFileSync(DB_FILE_PATH, "utf8");
      return JSON.parse(raw);
    } catch (err) {
      console.error("Failed to read/parse db_store.json, falling back to initial data:", err);
    }
  }
  
  // Fallback to initial_data
  try {
    const raw = fs.readFileSync(INITIAL_DATA_PATH, "utf8");
    const data = JSON.parse(raw);
    // Write it initially so db_store.json exists
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), "utf8");
    return data;
  } catch (err) {
    console.error("Failed to read initial_data.json:", err);
    return { digital_marketing: [], kol_koc: [], btl_trade: [], monthly_ooh_pr: [] };
  }
}

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Gemini API Client initialized successfully.");
  } else {
    console.warn("GEMINI_API_KEY is not configured or uses placeholder value.");
  }
} catch (error) {
  console.error("Failed to initialize Gemini API Client:", error);
}

// API: Fetch file from Google Drive via direct link
app.post("/api/fetch-drive", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "Vui lòng cung cấp link Google Drive" });
    }

    // Regular expressions to extract file ID from Google Drive link
    const regId1 = /\/file\/d\/([a-zA-Z0-9_-]+)/;
    const regId2 = /[?&]id=([a-zA-Z0-9_-]+)/;
    const regId3 = /\/folders\/([a-zA-Z0-9_-]+)/; // Folders are not direct files, let the user know
    
    let fileId = "";
    const match1 = url.match(regId1);
    const match2 = url.match(regId2);
    
    if (match1 && match1[1]) {
      fileId = match1[1];
    } else if (match2 && match2[1]) {
      fileId = match2[1];
    } else {
      // Direct string can be treated as ID
      fileId = url.trim();
    }

    if (url.includes("/folders/")) {
      return res.status(400).json({ error: "Đường dẫn bạn cung cấp là Thư mục (Folder). Vui lòng cung cấp link của một tệp tin (File) JSON cụ thể ở chế độ công khai." });
    }

    if (!fileId || fileId.length < 10) {
      return res.status(400).json({ error: "Không tìm thấy ID tệp Google Drive hợp lệ từ đường dẫn." });
    }

    // Google Drive direct export download link
    const downloadUrl = `https://docs.google.com/uc?export=download&id=${fileId}`;
    console.log(`Attempting to fetch Google Drive file ID: ${fileId} from ${downloadUrl}`);

    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`Google Drive trả về mã lỗi: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "";
    const text = await response.text();

    // Verify if downloaded content is actually HTML (often Google login or permission screen)
    if (text.includes("<!DOCTYPE html>") || text.includes("<html") || text.includes("google.com/accounts/Login")) {
      return res.status(401).json({
        error: "Không thể tải trực tuyến. Tệp Google Drive phải được chia sẻ ở chế độ 'Bất kỳ ai có đường link đều có thể xem' (Anyone with link can view). Vui lòng kiểm tra lại quyền chia sẻ trên Google Drive hoặc copy-paste thủ công."
      });
    }

    try {
      const jsonData = JSON.parse(text);
      return res.json({ success: true, data: jsonData });
    } catch (parseError) {
      console.error("Failed to parse fetched content as JSON. Head:", text.substring(0, 200));
      return res.status(422).json({
        error: "Tải tệp thành công nhưng nội dung tệp không phải định dạng JSON hợp lệ. Vui lòng kiểm tra lại cấu trúc file.",
        preview: text.substring(0, 200)
      });
    }

  } catch (error: any) {
    console.error("Fetch Drive error:", error);
    return res.status(500).json({ error: `Lỗi kết nối tệp: ${error.message || error}` });
  }
});

// API: Call Gemini to analyze marketing report
app.post("/api/analyze", async (req, res) => {
  try {
    const { data, brand } = req.body;
    if (!data) {
      return res.status(400).json({ error: "Không có dữ liệu đầu vào để phân tích." });
    }

    if (!ai) {
      return res.status(503).json({
        error: "Gemini API chưa được định cấu hình. Bạn hãy cấu hình GEMINI_API_KEY trong phần Secrets, hoặc sử dụng các bản biên tập thủ công cực kỳ chi tiết có sẵn.",
      });
    }

    const brandName = brand || "Livotec";
    const dataString = typeof data === "string" ? data : JSON.stringify(data, null, 2);

    const prompt = `Bạn là một Chuyên gia Phân tích Dữ liệu Marketing (Marketing Data Analyst) chuyên nghiệp.
Hãy đọc và phân tích chuyên sâu báo cáo chiến dịch tuần này của thương hiệu "${brandName}" dựa trên dữ liệu JSON được cung cấp dưới đây.

Dưới đây là dữ liệu báo cáo chiến dịch:
${dataString}

YÊU CẦU:
Hãy xuất ra nhận định phân tích bằng tiếng Việt theo cấu trúc JSON định dạng chính xác sau đây. Các nhận xét cần chuyên sâu, kết hợp các con số thực tế có trong dữ liệu (ví dụ: số bài viết, chi phí đã tiêu, impressions, reach, CPM, organic traffic...) và đưa ra phân tích sắc bén, lời khuyên thực tế nhất.

Cấu trúc JSON phản hồi bắt buộc phải đúng 100% mẫu dưới đây, không chứa bất kỳ văn bản nào khác ngoài JSON (không bọc trong dấu markdown \`\`\`json):
{
  "executiveSummary": {
    "evaluation": "Nhận xét tổng quan cực kỳ chi tiết, đánh giá khách quan về thực trạng triển khai trong tuần (những điểm sáng và hạn chế cụ thể của thương hiệu ${brandName}). Sử dụng số liệu chứng minh từ các mảng SEO, Ads, Content, SOV.",
    "proposals": "Các đề xuất cụ thể, hành động thiết thực cho tuần kế tiếp để tối ưu hóa hiệu quả (đưa ra ít nhất 3 đề xuất ngắn gọn, trực diện)."
  },
  "categoryAnalysis": {
    "sov": "Nhận xét phân tích ngắn gọn, súc tích kèm số liệu về thị phần thảo luận (Share of Voice) của thương hiệu ${brandName} so với các đối thủ cạnh tranh như Karofi, Kangaroo, Sunhouse, Hòa Phát...",
    "kol_koc": "Nhận xét về việc triển khai KOL/KOC trong tuần của ${brandName}. Đối chiếu KPI toàn chiến dịch, tích lũy chiến dịch và số thực hiện tuần này.",
    "content": "Nhận xét về hoạt động sản xuất, xuất bản các ấn phẩm Content & Sáng tạo nội dung (ví dụ: số lượng bài viết đăng tải, clip giới thiệu sản phẩm, ooh/led, các nội dung social media khác) trong tuần của ${brandName}.",
    "tvc": "Phân tích và nhận xét chi tiết về hiệu quả phát sóng TVC (chỉ số metric là GRPS) trên các kênh truyền hình tại các thành phố/kênh sóng trọng điểm của ${brandName} như HAN, HCM, CAN, HTV & THVL.",
    "pr": "Nhận xét chi tiết về hiệu quả hoạt động PR báo chí của ${brandName} trong tuần hoặc trong tháng (đối chiếu lượng bài viết Quantity và lượng người tiếp cận Views của bài viết).",
    "ooh": "Nhận xét chi tiết hoạt động truyền thông ngoài trời OOH của thương hiệu ${brandName} theo các phân khúc: LCD Building, LED Cities, LED Airport, Pano.",
    "paid_ads": "Phân tích hiệu quả Paid Ads trong tuần (về Amount spent, Impressions, Reach, CPM, Frequency), đánh giá mức độ phủ thương hiệu và tối ưu chi phí.",
    "seo": "Phân tích hiệu quả SEO Website & SEO Content trong tuần (Traffic Organic, Impressions Organic, số lượng bài viết). So sánh thực tế đạt được so với mục tiêu đề ra.",
    "btl_trade": "Đánh giá chi tiết hoạt động BTL & Trade Marketing của thương hiệu ${brandName} (biển bảng POSM, quầy kệ, kiểm soát hình ảnh điểm bán, sự kiện activation/workshop). So sánh kế hoạch tháng 6, lũy kế đạt được và đối chiếu tăng trưởng so với thực tế thực hiện tháng 5."
  }
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "";
    try {
      const parsed = JSON.parse(text.trim());
      return res.json({ success: true, analysis: parsed });
    } catch (e) {
      console.error("Gemini raw text parse failure:", text);
      // Fallback: search for first { and last } in case it wrapped in markdown
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start >= 0 && end > start) {
        try {
          const parsedFixed = JSON.parse(text.substring(start, end + 1));
          return res.json({ success: true, analysis: parsedFixed });
        } catch (innerErr) {
          throw new Error("Không thể phân tích phản hồi JSON từ AI.");
        }
      }
      throw new Error("Phản hồi của AI không đúng định dạng JSON.");
    }

  } catch (error: any) {
    console.error("Gemini API error:", error);
    return res.status(500).json({ error: error.message || "Lỗi xử lý phân tích AI" });
  }
});

// GET /api/get-mail-config
app.get("/api/get-mail-config", (req, res) => {
  try {
    const store = getDatabaseData();
    const config = store.mail_config || {};
    const decryptedPass = config.smtp_pass ? decrypt(config.smtp_pass) : "";
    res.json({
      success: true,
      config: {
        smtp_host: config.smtp_host || "",
        smtp_port: config.smtp_port || "587",
        smtp_user: config.smtp_user || "",
        smtp_pass: decryptedPass,
        notification_email: config.notification_email || "ntkdung1206@gmail.com",
        enabled: config.enabled !== undefined ? config.enabled : true
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/save-mail-config
app.post("/api/save-mail-config", (req, res) => {
  try {
    const { smtp_host, smtp_port, smtp_user, smtp_pass, notification_email, enabled } = req.body;
    const store = getDatabaseData();
    
    const encryptedPass = smtp_pass ? encrypt(smtp_pass) : "";
    
    store.mail_config = {
      smtp_host: smtp_host || "",
      smtp_port: smtp_port || "587",
      smtp_user: smtp_user || "",
      smtp_pass: encryptedPass,
      notification_email: notification_email || "",
      enabled: enabled === true
    };
    
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(store, null, 2), "utf8");
    res.json({ success: true, message: "Cấu hình gửi mail tự động đã được lưu và mã hóa bảo mật!" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/get-data
app.get("/api/get-data", (req, res) => {
  try {
    const rawDbData = getDatabaseData();
    const normalized = normalizeMarketingData(rawDbData);
    return res.json({
      success: true,
      data: normalized,
      comments: rawDbData.comments || {}
    });
  } catch (err: any) {
    console.error("GET /api/get-data error:", err);
    return res.status(500).json({ error: `Lỗi đọc cơ sở dữ liệu: ${err.message}` });
  }
});

// POST /api/save-comments
app.post("/api/save-comments", async (req, res) => {
  try {
    const { week, comments } = req.body;
    if (!week || !comments) {
      return res.status(400).json({ error: "Thiếu thông tin tuần báo cáo hoặc nội dung nhận định." });
    }

    const rawDbData = getDatabaseData();
    if (!rawDbData.comments) {
      rawDbData.comments = {};
    }

    rawDbData.comments[week] = comments;
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(rawDbData, null, 2), "utf8");

    // Send email notification (async non-blocking or simple await)
    try {
      await sendPublishNotification(week, comments);
    } catch (mailErr) {
      console.error("Failed to process publish notification mail:", mailErr);
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error("POST /api/save-comments error:", err);
    return res.status(500).json({ error: `Lỗi lưu nhận định vào cơ sở dữ liệu: ${err.message}` });
  }
});

// POST /api/save-raw-data (Direct edit/delete row management for Admin)
app.post("/api/save-raw-data", (req, res) => {
  try {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ error: "Thiếu dữ liệu để lưu." });
    }

    const rawDbData = getDatabaseData();
    // Overwrite the specific core array lists while keeping existing comments
    rawDbData.digital_marketing = data.digital_marketing || [];
    rawDbData.kol_koc = data.kol_koc || [];
    rawDbData.btl_trade = data.btl_trade || [];
    rawDbData.monthly_ooh_pr = data.monthly_ooh_pr || [];

    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(rawDbData, null, 2), "utf8");
    const normalized = normalizeMarketingData(rawDbData);

    return res.json({ success: true, data: normalized });
  } catch (err: any) {
    console.error("POST /api/save-raw-data error:", err);
    return res.status(500).json({ error: `Lỗi cập nhật cơ sở dữ liệu: ${err.message}` });
  }
});

// POST /api/sync-data
app.post("/api/sync-data", (req, res) => {
  try {
    const { newData } = req.body;
    if (!newData) {
      return res.status(400).json({ error: "Không tìm thấy dữ liệu đồng bộ mới." });
    }

    // 1. Normalize the incoming new data
    const normalizedNew = normalizeMarketingData(newData);

    // 2. Load the existing database data
    const currentFullDb = getDatabaseData();
    const currentDb = normalizeMarketingData(currentFullDb);

    // 3. Helper to merge lists type-safely by identifying identical keys, updating matching ones, and appending new ones
    function mergeRowsByKey<T>(currentList: T[], newList: T[], keyFn: (row: T) => string): T[] {
      if (!newList || newList.length === 0) return currentList;
      const map = new Map<string, T>();
      currentList.forEach((row) => {
        map.set(keyFn(row), row);
      });
      newList.forEach((row) => {
        map.set(keyFn(row), row);
      });
      return Array.from(map.values());
    }

    // Key extraction functions for identifying duplicates
    const getDigitalKey = (row: any): string => {
      const week = (row.week || "").toString().trim().toLowerCase();
      const brand = (row.brand || "").toString().trim().toLowerCase();
      const nhom = (row.nhóm_báo_cáo || "").toString().trim().toLowerCase();
      const hm = (row.hạng_mục || "").toString().trim().toLowerCase();
      const nganh = (row.ngành_hàng || "").toString().trim().toLowerCase();
      const channel = (row.kênh_channel || "").toString().trim().toLowerCase();
      const metric = (row.chỉ_số_metric || "").toString().trim().toLowerCase();
      return `${week}|${brand}|${nhom}|${hm}|${nganh}|${channel}|${metric}`;
    };

    const getKolKey = (row: any): string => {
      const week = (row.week || "").toString().trim().toLowerCase();
      const brand = (row.brand || "").toString().trim().toLowerCase();
      const hm = (row.hạng_mục || "").toString().trim().toLowerCase();
      const nganh = (row.ngành_hàng || "").toString().trim().toLowerCase();
      const channel = (row.kênh_channel || "").toString().trim().toLowerCase();
      const metric = (row.chỉ_số_metric || "").toString().trim().toLowerCase();
      return `${week}|${brand}|${hm}|${nganh}|${channel}|${metric}`;
    };

    const getBtlKey = (row: any): string => {
      const week = (row.week || "").toString().trim().toLowerCase();
      const brand = (row.brand || "").toString().trim().toLowerCase();
      const hml = (row.hạng_mục_lớn || "").toString().trim().toLowerCase();
      const cthm = (row.chi_tiết_hạng_mục || "").toString().trim().toLowerCase();
      const pl = (row.phân_loại || "").toString().trim().toLowerCase();
      const ts = (row.tần_suất || "").toString().trim().toLowerCase();
      const dvt = (row.đơn_vị_tính || "").toString().trim().toLowerCase();
      return `${week}|${brand}|${hml}|${cthm}|${pl}|${ts}|${dvt}`;
    };

    const getOohPrKey = (row: any): string => {
      const week = (row.week || "").toString().trim().toLowerCase();
      const tbc = (row.tháng_báo_cáo || "").toString().trim().toLowerCase();
      const hm = (row.hạng_mục || "").toString().trim().toLowerCase();
      const brand = (row.brand || "").toString().trim().toLowerCase();
      const nganh = (row.ngành_hàng || "").toString().trim().toLowerCase();
      const channel = (row.kênh_channel || "").toString().trim().toLowerCase();
      const metric = (row.chỉ_số_metric || "").toString().trim().toLowerCase();
      return `${week}|${tbc}|${hm}|${brand}|${nganh}|${channel}|${metric}`;
    };

    const mergedData = {
      digital_marketing: mergeRowsByKey(currentDb.digital_marketing, normalizedNew.digital_marketing, getDigitalKey),
      kol_koc: mergeRowsByKey(currentDb.kol_koc, normalizedNew.kol_koc, getKolKey),
      btl_trade: mergeRowsByKey(currentDb.btl_trade, normalizedNew.btl_trade, getBtlKey),
      monthly_ooh_pr: mergeRowsByKey(currentDb.monthly_ooh_pr, normalizedNew.monthly_ooh_pr, getOohPrKey),
      comments: currentFullDb.comments || {} // Preserve existing comments!
    };

    // 4. Save the fully merged and normalized dataset back to the database file
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(mergedData, null, 2), "utf8");

    return res.json({ success: true, data: mergedData });
  } catch (err: any) {
    console.error("POST /api/sync-data error:", err);
    return res.status(500).json({ error: `Lỗi đồng bộ hóa dữ liệu vào DB: ${err.message}` });
  }
});

// POST /api/reset-data
app.post("/api/reset-data", (req, res) => {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      fs.unlinkSync(DB_FILE_PATH);
    }
    const data = getDatabaseData();
    const normalized = normalizeMarketingData(data);
    return res.json({ success: true, data: normalized });
  } catch (err: any) {
    console.error("POST /api/reset-data error:", err);
    return res.status(500).json({ error: `Lỗi khôi phục cơ sở dữ liệu: ${err.message}` });
  }
});

// Start server
async function startServer() {
  // Vite dev server integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
