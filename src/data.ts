import RAW_INITIAL_DATA from "./initial_data.json";

export interface DigitalMarketingRow {
  week: string;
  phân_loại_thời_gian: string;
  brand: string;
  nhóm_báo_cáo: string;
  hạng_mục: string;
  ngành_hàng: string;
  kênh_channel: string;
  chỉ_số_metric: string;
  mục_tiêu_target: number | null;
  thực_tế_actual: number | null;
  target_tháng: number | null;
  tích_lũy_tháng: number | null;
}

export interface KolKocRow {
  week: string;
  brand: string;
  hạng_mục: string;
  ngành_hàng: string;
  kênh_channel: string;
  chỉ_số_metric: string;
  kpi_toàn_chiến_dịch: number | null;
  thực_tế_trong_tuần: number | null;
  tích_lũy_chiến_dịch: number | null;
}

export interface BtlTradeRow {
  week: string;
  brand: string;
  hạng_mục_lớn: string;
  chi_tiết_hạng_mục: string;
  phân_loại: string | null;
  tần_suất: string;
  đơn_vị_tính: string;
  thực_hiện_tháng: number | null;
  kế_hoạch_tháng: number | null;
  tích_lũy_tháng: number | null;
  [key: string]: any;
}

export interface MonthlyOohPrRow {
  tháng_báo_cáo: string;
  hạng_mục: string;
  brand: string;
  ngành_hàng: string;
  kênh_channel: string;
  chỉ_số_metric: string;
  mục_tiêu_target: number | null;
  thực_tế_actual: number | null;
  week: string;
}

export interface MarketingReportData {
  digital_marketing: DigitalMarketingRow[];
  kol_koc: KolKocRow[];
  btl_trade: BtlTradeRow[];
  monthly_ooh_pr: MonthlyOohPrRow[];
}

export interface CategoryComments {
  sov: string;
  kol_koc: string;
  content: string;
  tvc: string;
  pr: string;
  ooh: string;
  paid_ads: string;
  seo: string;
  btl_trade: string;
}

export interface BrandComments {
  evaluation: string;
  proposals: string;
  categories: CategoryComments;
}

export function normalizeMarketingData(parsed: any): MarketingReportData {
  const getVal = (obj: any, keys: string[]) => {
    if (!obj) return null;
    for (const k of keys) {
      if (k in obj) return obj[k];
    }
    // Try lowercased check too for extreme tolerance
    const objKeys = Object.keys(obj);
    for (const k of keys) {
      const foundKey = objKeys.find(ok => ok.trim().toLowerCase() === k.trim().toLowerCase());
      if (foundKey) return obj[foundKey];
    }
    return null;
  };

  const getNumVal = (obj: any, keys: string[]) => {
    const val = getVal(obj, keys);
    if (val === undefined || val === null || val === "") return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  };

  const digital_marketing: DigitalMarketingRow[] = Array.isArray(parsed?.digital_marketing)
    ? parsed.digital_marketing.map((row: any) => {
        const rawBrand = getVal(row, ["brand"]) || "";
        const normalizedBrand = rawBrand.toString().trim().toLowerCase() === "livotec" ? "Livotec" :
                             rawBrand.toString().trim().toLowerCase() === "karofi" ? "Karofi" : rawBrand.toString().trim();
                             
        const rawNhom = getVal(row, ["nhóm_báo_cáo", "nhóm báo cáo"]) || "";
        const normalizedNhom = rawNhom.toString().trim().toLowerCase() === "content" ? "Content" :
                             rawNhom.toString().trim().toLowerCase() === "digital" ? "Digital" :
                             rawNhom.toString().trim().toLowerCase() === "brand" ? "Brand" : rawNhom.toString().trim();
                             
        const rawHangMuc = getVal(row, ["hạng_mục", "hạng mục"]) || "";
        const rawHangMucLower = rawHangMuc.toString().trim().toLowerCase();
        let normalizedHangMuc = rawHangMuc.toString().trim();
        if (rawHangMucLower === "paid ads") normalizedHangMuc = "Paid Ads";
        else if (rawHangMucLower === "seo website") normalizedHangMuc = "SEO Website";
        else if (rawHangMucLower === "seo content") normalizedHangMuc = "SEO Content";
        else if (rawHangMucLower === "product page") normalizedHangMuc = "Product Page";
        else if (rawHangMucLower === "social listening") normalizedHangMuc = "Social Listening";
        else if (rawHangMucLower === "pr - báo chí" || rawHangMucLower === "pr" || rawHangMucLower === "pr_báo_chí") normalizedHangMuc = "PR - báo chí";
        else if (rawHangMucLower === "clip tvc") normalizedHangMuc = "Clip TVC";
        else if (rawHangMucLower === "social media") normalizedHangMuc = "Social Media";
        else if (rawHangMucLower === "tvc") normalizedHangMuc = "TVC";

        const rawMetric = getVal(row, ["chỉ_số_metric", "chỉ số (metric)", "chỉ số"]) || "";
        const rawMetricLower = rawMetric.toString().trim().toLowerCase();
        let normalizedMetric = rawMetric.toString().trim();
        if (rawMetricLower.includes("amount spent") || rawMetricLower.includes("amount_spent")) normalizedMetric = "Amount spent (VNĐ)";
        else if (rawMetricLower === "impressions") normalizedMetric = "Impressions";
        else if (rawMetricLower === "reach") normalizedMetric = "Reach";
        else if (rawMetricLower === "frequency") normalizedMetric = "Frequency";
        else if (rawMetricLower === "traffic organic") normalizedMetric = "Traffic Organic";
        else if (rawMetricLower === "impressions organic") normalizedMetric = "Impressions Organic";
        else if (rawMetricLower === "quantity") normalizedMetric = "Quantity";
        else if (rawMetricLower.includes("sov")) normalizedMetric = "SOV (Thị phần thảo luận theo brand)";

        return {
          week: (getVal(row, ["week"]) || "").toString().trim(),
          phân_loại_thời_gian: (getVal(row, ["phân_loại_thời_gian", "phân loại thời gian"]) || "").toString().trim(),
          brand: normalizedBrand,
          nhóm_báo_cáo: normalizedNhom,
          hạng_mục: normalizedHangMuc,
          ngành_hàng: (getVal(row, ["ngành_hàng", "ngành hàng"]) || "").toString().trim(),
          kênh_channel: (getVal(row, ["kênh_channel", "kênh (channel)", "kênh"]) || "").toString().trim(),
          chỉ_số_metric: normalizedMetric,
          mục_tiêu_target: getNumVal(row, ["mục_tiêu_target", "mục tiêu (target)", "mục tiêu"]),
          thực_tế_actual: getNumVal(row, ["thực_tế_actual", "thực tế (actual)", "thực tế"]),
          target_tháng: getNumVal(row, ["target_tháng", "target tháng"]),
          tích_lũy_tháng: getNumVal(row, ["tích_lũy_tháng", "tích lũy tháng"]),
        };
      })
    : [];

  const kol_koc: KolKocRow[] = Array.isArray(parsed?.kol_koc)
    ? parsed.kol_koc.map((row: any) => {
        const rawBrand = getVal(row, ["brand"]) || "";
        const normalizedBrand = rawBrand.toString().trim().toLowerCase() === "livotec" ? "Livotec" :
                             rawBrand.toString().trim().toLowerCase() === "karofi" ? "Karofi" : rawBrand.toString().trim();
                             
        const rawHangMuc = getVal(row, ["hạng_mục", "hạng mục"]) || "";
        const rawHangMucLower = rawHangMuc.toString().trim().toLowerCase();
        let normalizedHangMuc = rawHangMuc.toString().trim();
        if (rawHangMucLower === "koc/kol" || rawHangMucLower === "kol/koc" || rawHangMucLower === "koc" || rawHangMucLower === "kol") normalizedHangMuc = "koc/kol";
        
        const rawMetric = getVal(row, ["chỉ_số_metric", "chỉ số (metric)", "chỉ số"]) || "";
        const rawMetricLower = rawMetric.toString().trim().toLowerCase();
        let normalizedMetric = rawMetric.toString().trim();
        if (rawMetricLower === "quantity") normalizedMetric = "quantity";

        return {
          week: (getVal(row, ["week"]) || "").toString().trim(),
          brand: normalizedBrand || "Livotec",
          hạng_mục: normalizedHangMuc,
          ngành_hàng: (getVal(row, ["ngành_hàng", "ngành hàng"]) || "").toString().trim(),
          kênh_channel: (getVal(row, ["kênh_channel", "kênh (channel)", "kênh"]) || "").toString().trim(),
          chỉ_số_metric: normalizedMetric,
          kpi_toàn_chiến_dịch: getNumVal(row, ["kpi_toàn_chiến_dịch", "kpi toàn chiến dịch", "kpi toàn chiến dịch (kpi tổng)"]),
          thực_tế_trong_tuần: getNumVal(row, ["thực_tế_trong_tuần", "thực tế trong tuần"]),
          tích_lũy_chiến_dịch: getNumVal(row, ["tích_lũy_chiến_dịch", "tổng tích lũy", "tích lũy chiến dịch"]),
        };
      })
    : [];

  const btl_trade: BtlTradeRow[] = Array.isArray(parsed?.btl_trade)
    ? parsed.btl_trade.map((row: any) => {
        const rawBrand = getVal(row, ["brand"]) || "";
        const normalizedBrand = rawBrand.toString().trim().toLowerCase() === "livotec" ? "Livotec" :
                             rawBrand.toString().trim().toLowerCase() === "karofi" ? "Karofi" : rawBrand.toString().trim();
                             
        const rawHangMucLon = getVal(row, ["hạng_mục_lớn", "hạng mục lớn"]) || "";
        const rawHangMucLonUpper = rawHangMucLon.toString().trim().toUpperCase();
        let normalizedHangMucLon = rawHangMucLon.toString().trim();
        if (rawHangMucLonUpper === "POSM") normalizedHangMucLon = "POSM";

        const getBtlField = (keysToCheck: string[]) => {
          for (const k of keysToCheck) {
            const val = getNumVal(row, [k]);
            if (val !== null) return val;
          }
          // Search key prefix/suffixes
          for (const rawK of Object.keys(row)) {
            const normalizedK = rawK.toLowerCase().replace(/\s+/g, "_").trim();
            for (const expected of keysToCheck) {
              const expectedClean = expected.toLowerCase().replace(/\s+/g, "_").trim();
              if (normalizedK === expectedClean || normalizedK.startsWith(expectedClean)) {
                const val = Number(row[rawK]);
                if (!isNaN(val) && row[rawK] !== "" && row[rawK] !== null) return val;
              }
            }
          }
          return null;
        };

        const resultRow: BtlTradeRow = {
          week: (getVal(row, ["week"]) || "").toString().trim(),
          brand: normalizedBrand,
          hạng_mục_lớn: normalizedHangMucLon,
          chi_tiết_hạng_mục: (getVal(row, ["chi_tiết_hạng_mục", "chi tiết hạng mục"]) || "").toString().trim(),
          phân_loại: getVal(row, ["phân_loại", "phân loại"]) || null,
          tần_suất: (getVal(row, ["tần_suất", "tần suất"]) || "").toString().trim(),
          đơn_vị_tính: (getVal(row, ["đơn_vị_tính", "đơn vị tính"]) || "").toString().trim(),
          thực_hiện_tháng: getBtlField(["thực_hiện_tháng", "thực hiện tháng", "thực_hiện_tháng_5", "thực hiện tháng 5"]),
          kế_hoạch_tháng: getBtlField(["kế_hoạch_tháng", "kế hoạch tháng", "kế_hoạch_tháng_6", "kế hoạch tháng 6"]),
          tích_lũy_tháng: getBtlField(["tích_lũy_tháng", "tích lũy tháng"])
        };

        return resultRow;
      })
    : [];

  const monthly_ooh_pr: MonthlyOohPrRow[] = Array.isArray(parsed?.monthly_ooh_pr)
    ? parsed.monthly_ooh_pr.map((row: any) => {
        const rawBrand = getVal(row, ["brand"]) || "";
        const normalizedBrand = rawBrand.toString().trim().toLowerCase() === "livotec" ? "Livotec" :
                             rawBrand.toString().trim().toLowerCase() === "karofi" ? "Karofi" : rawBrand.toString().trim();
                             
        const rawHangMuc = getVal(row, ["hạng_mục"]) || "";
        const rawHangMucLower = rawHangMuc.toString().trim().toLowerCase();
        let normalizedHangMuc = rawHangMuc.toString().trim();
        if (rawHangMucLower === "pr - báo chí" || rawHangMucLower === "pr" || rawHangMucLower === "pr_báo_chí") normalizedHangMuc = "PR - báo chí";
        
        const rawMetric = getVal(row, ["chỉ_số_metric", "chỉ số (metric)", "chỉ số"]) || "";
        const rawMetricLower = rawMetric.toString().trim().toLowerCase();
        let normalizedMetric = rawMetric.toString().trim();
        if (rawMetricLower === "quantity") normalizedMetric = "Quantity";

        return {
          week: (getVal(row, ["week"]) || "").toString().trim(),
          tháng_báo_cáo: (getVal(row, ["tháng_báo_cáo"]) || "").toString().trim(),
          hạng_mục: normalizedHangMuc,
          brand: normalizedBrand,
          ngành_hàng: (getVal(row, ["ngành_hàng"]) || "").toString().trim(),
          kênh_channel: (getVal(row, ["kênh_channel", "kênh (channel)", "kênh"]) || "").toString().trim(),
          chỉ_số_metric: normalizedMetric,
          mục_tiêu_target: getNumVal(row, ["mục_tiêu_target", "mục tiêu (target)"]),
          thực_tế_actual: getNumVal(row, ["thực_tế_actual", "thực tế (actual)"]),
        };
      })
    : [];

  return {
    digital_marketing,
    kol_koc,
    btl_trade,
    monthly_ooh_pr,
  };
}

export const INITIAL_MARKETING_DATA: MarketingReportData = normalizeMarketingData(RAW_INITIAL_DATA);

export const DEFAULT_COMMENTS_LIVOTEC: BrandComments = {
  evaluation: "Chiến dịch tuần này của Livotec ghi nhận kết quả khả quan ở mảng SEO Website (đạt 3.246 traffic organic, tiệm cận mục tiêu) và Social Media (vượt KPI số lượng bài viết với 5 bài viết thực tế). Các kênh Paid Ads hoạt động ổn định, trong đó TikTok KOC/KOL mang lại tỷ lệ reach cao vượt trội (3.251.131 Reach thực tế so với KPI là 2.114.285). Tuy nhiên, chỉ số Share of Voice (SOV) của Livotec trên thị trường thảo luận chung còn khá khiêm tốn (chỉ đạt 2,8%), bị lấn át lớn bởi Karofi và Kangaroo.",
  proposals: "1. **Đẩy mạnh Social Listening**: Xây dựng các nội dung mang tính thảo luận tự nhiên (organic discussion) trên các hội nhóm đồ gia dụng để cải thiện chỉ số SOV thương hiệu.\n2. **Tối ưu chi phí TikTok Paid Ads**: Mặc dù hiệu quả reach của TikTok KOC tốt, CPM thực tế đang ở mức rất thấp ($8.344) so với target ($14), đây là cơ hội tốt để duy trì ngân sách phân bổ cho TikTok.\n3. **Thúc đẩy SEO Content**: Tăng tốc sản xuất bài viết chuẩn SEO cho Website để bù đắp lượng traffic organic còn thiếu so với kế hoạch tháng.",
  categories: {
    sov: "Thị phần thảo luận (SOV) của Livotec hiện tại chỉ đạt 2.8%, đứng thứ 5 trong nhóm các thương hiệu được đo lường. Karofi (35.9%) và Kangaroo (40.9%) tiếp tục chiếm lĩnh phần lớn thảo luận thị trường. Cần triển khai các mini-game hoặc chủ đề thảo luận cộng đồng để kích hoạt lượng tương tác tự nhiên lớn hơn.",
    kol_koc: "Hoạt động hợp tác KOC/KOL tuần này đạt tiến độ tốt ở mảng tích lũy chiến dịch (đặc biệt Ngành 1 đạt tích lũy 4/10 KOC, Ngành 3 đạt 3/4 KOC). Mặc dù số thực tế triển khai trong tuần này là 0 do đang ở giai đoạn chuẩn bị content nghiệm thu, tiến độ lũy kế vẫn bám sát tiến trình chiến dịch.",
    content: "Sản lượng ấn phẩm Content & Sáng tạo của Livotec bám sát tiến độ đề ra. Social Media đạt vượt KPI với 5 bài viết xuất bản thực tế, mang lại tương tác tích cực từ tệp khách hàng tiềm năng.",
    tvc: "Hạng mục TVC (GRPS) triển khai hiệu quả. Chỉ số GRPS trên các kênh sóng HCM, HAN, CAN và HTV & THVL đều hoàn thành đạt 100% KPI tuần đề ra, duy trì tần suất xuất hiện tối ưu.",
    pr: "Hoạt động PR - báo chí của Livotec diễn ra thuận lợi. Hoàn thành đăng tải các bài viết chất lượng cao trên các trang báo uy tín đúng tiến độ, thu hút lượt xem tự nhiên vượt kỳ vọng.",
    ooh: "Quảng cáo OOH của Livotec hoạt động ổn định trên các hệ thống LCD tòa nhà (LCD Building) và màn hình LED sân bay (LED Airport), đảm bảo độ phủ nhận diện thương hiệu cao.",
    paid_ads: "Chiêu quảng cáo Paid Ads tuần này đạt hiệu quả tối ưu. Tổng CPM trên các kênh dao động ở mức lý tưởng (Facebook Ngành 1 CPM thực tế 10.99đ so với target 12đ, TikTok CPM 9.19đ so với target 10đ). Lượng Reach thực tế vượt KPI đáng kể trên các kênh TikTok, hỗ trợ tích cực cho việc tăng nhận diện thương hiệu.",
    seo: "Website SEO duy trì phong độ ổn định with Impressions đạt 148.962 (bằng 94% mục tiêu tuần). Lượng Traffic Organic đạt 3.246 lượt. Để đạt kế hoạch 15.000 Traffic của tháng, cần tăng cường đi link nội bộ và cập nhật thêm các bài viết chia sẻ mẹo vặt gia đình.",
    btl_trade: "Hoạt động POSM đạt tỷ lệ tích lũy tốt. Đặc biệt hạng mục Mock up Điều hòa GT đạt tích lũy 997/1025 cái (hoàn thành 97% kế hoạch tháng 6). So với tháng 5, hầu hết các hạng mục biển bảng và quầy kệ đều ghi nhận mức tăng trưởng vượt bậc (Ví dụ: Biển bảng tháng 6 tích lũy 36 so với 3 của tháng 5)."
  }
};

export const DEFAULT_COMMENTS_KAROFI: BrandComments = {
  evaluation: "Karofi khẳng định vị thế dẫn đầu với chỉ số Share of Voice (SOV) đạt 35,9%, chỉ xếp sau Kangaroo (40,9%). Kết quả SEO Website cực kỳ ấn tượng, vượt mọi chỉ tiêu tuần (Traffic Organic đạt 18.852, vượt 5% kế hoạch; Impressions đạt 548.338, vượt 10% kế hoạch). Paid Ads trên Facebook cũng hoạt động rất tốt khi lượng Reach đạt 3.576.289, vượt xa KPI tuần (3.250.000) nhờ tối ưu hóa CPM ở mức 9,28đ (thấp hơn target 10đ).",
  proposals: "1. **Tập trung giữ vững SOV**: Tăng cường các chiến dịch tương tác tự nhiên chất lượng cao để rút ngắn khoảng cách với Kangaroo.\n2. **Duy trì ngân sách Facebook Ads**: Facebook Ads đang hoạt động hiệu quả cao với CPM rẻ và Frequency ổn định (2.26). Cần nhân bản các nhóm quảng cáo thành công này.\n3. **Tối ưu hóa hình ảnh điểm bán**: Đẩy nhanh tiến độ chấm điểm hình ảnh điểm bán truyền thống (GT) để đạt mục tiêu kế hoạch tháng 6.",
  categories: {
    sov: "Karofi chiếm 35.9% thị phần thảo luận toàn ngành, giữ vị thế thương hiệu top-of-mind cùng Kangaroo. Khoảng cách với đối thủ bám đuổi Sunhouse (14.4%) khá an toàn. Thảo luận tập trung vào chất lượng lọc nước tinh khiết và dịch vụ bảo hành chuyên nghiệp.",
    kol_koc: "Hoạt động KOL/KOC của Karofi đang được tích hợp sâu trong các bài viết truyền thông. Cần thúc đẩy thêm các bài đánh giá trải nghiệm thực tế từ các KOC gia đình để tăng tính thuyết phục cho người tiêu dùng.",
    content: "Các ấn phẩm nội dung số, bao gồm video giới thiệu sản phẩm (3 video mới trong tuần) và sản xuất ấn phẩm OOH/LED (6 ấn phẩm mới) được thực hiện đầy đủ 100% KPI tuần, hỗ trợ đắc lực cho các chiến dịch quảng cáo hiển thị.",
    tvc: "Sản lượng phát sóng TVC bám sát kế hoạch. Các chỉ số GRPS trên các đài truyền hình trọng điểm được ghi nhận chính xác, hoàn thành đầy đủ mục tiêu phủ sóng chiến dịch.",
    pr: "Hoạt động PR báo chí đạt KPI ấn tượng về lượt xem (Views) bài viết trên các kênh tin tức hàng đầu, củng cố uy tín thương hiệu Karofi trên môi trường truyền thông số.",
    ooh: "Chiến dịch quảng cáo OOH phủ rộng tại các vị trí đắc địa: LCD tòa nhà, màn hình LED thành phố (LED Cities) và các tấm Pano lớn tại các nút giao giao thông chính, duy trì độ phủ thương hiệu cực tốt.",
    paid_ads: "Kênh quảng cáo Paid Ads ghi nhận kết quả rất tốt. Chi tiêu đạt 75.065.269 VNĐ, mang về hơn 8 triệu impressions và 3.5 triệu reach. CPM duy trì ở mức tối ưu 9.28 VNĐ (mục tiêu là 10 VNĐ). Tần suất quảng cáo (Frequency) đạt 2.26 lần, đảm bảo độ phủ sâu rộng không bị lặp quá nhiều.",
    seo: "SEO Website bùng nổ mạnh mẽ trong tuần này. Cả hai chỉ số quan trọng là Traffic Organic (18.852) và Impressions Organic (548.338) đều vượt kế hoạch tuần (lần lượt đạt 104.7% và 109.6%). Điều này chứng tỏ chất lượng từ khóa và nội dung Always-On đang hoạt động xuất sắc.",
    btl_trade: "Công tác kiểm soát hình ảnh điểm bán được triển khai trên diện rộng. Chấm điểm hình ảnh GT đạt tích lũy 2.612 điểm bán. Activation và Workshop lọc tổng cũng đã ghi nhận sự kiện đầu tiên thành công trong tháng 6."
  }
};
