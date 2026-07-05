/**
 * Utility functions for exporting the marketing database.
 */

function escapeXML(str: any): string {
  if (str === null || str === undefined) return "";
  return str.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function exportToExcel(data: any) {
  const sheets = [
    {
      name: "Digital Marketing",
      headers: [
        "Tuần", "Phân loại thời gian", "Thương hiệu", "Nhóm báo cáo",
        "Hạng mục", "Ngành hàng", "Kênh (channel)", "Chỉ số (metric)",
        "Mục tiêu (target)", "Thực tế (actual)", "Target tháng", "Tích lũy tháng"
      ],
      keys: [
        "week", "phân_loại_thời_gian", "brand", "nhóm_báo_cáo",
        "hạng_mục", "ngành_hàng", "kênh_channel", "chỉ_số_metric",
        "mục_tiêu_target", "thực_tế_actual", "target_tháng", "tích_lũy_tháng"
      ],
      rows: data.digital_marketing || []
    },
    {
      name: "KOL KOC",
      headers: [
        "Tuần", "Thương hiệu", "Hạng mục", "Ngành hàng", "Kênh (channel)",
        "Chỉ số (metric)", "KPI toàn chiến dịch", "Thực tế trong tuần", "Tích lũy chiến dịch"
      ],
      keys: [
        "week", "brand", "hạng_mục", "ngành_hàng", "kênh_channel",
        "chỉ_số_metric", "kpi_toàn_chiến_dịch", "thực_tế_trong_tuần", "tích_lũy_chiến_dịch"
      ],
      rows: data.kol_koc || []
    },
    {
      name: "BTL Trade",
      headers: [
        "Tuần", "Thương hiệu", "Hạng mục lớn", "Chi tiết hạng mục", "Phân loại",
        "Tần suất", "Đơn vị tính", "Thực hiện tháng", "Kế hoạch tháng", "Tích lũy tháng"
      ],
      keys: [
        "week", "brand", "hạng_mục_lớn", "chi_tiết_hạng_mục", "phân_loại",
        "tần_suất", "đơn_vị_tính", "thực_hiện_tháng", "kế_hoạch_tháng", "tích_lũy_tháng"
      ],
      rows: data.btl_trade || []
    },
    {
      name: "Monthly OOH PR",
      headers: [
        "Tuần", "Tháng báo cáo", "Hạng mục", "Thương hiệu", "Ngành hàng",
        "Kênh (channel)", "Chỉ số (metric)", "Mục tiêu (target)", "Thực tế (actual)"
      ],
      keys: [
        "week", "tháng_báo_cáo", "hạng_mục", "brand", "ngành_hàng",
        "kênh_channel", "chỉ_số_metric", "mục_tiêu_target", "thực_tế_actual"
      ],
      rows: data.monthly_ooh_pr || []
    }
  ];

  let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
    <Author>Marketing Dashboard</Author>
    <Created>${new Date().toISOString()}</Created>
  </DocumentProperties>
`;

  sheets.forEach(sheet => {
    xml += `  <Worksheet ss:Name="${escapeXML(sheet.name)}">
    <Table>
      <Row ss:Height="22">
`;
    sheet.headers.forEach(h => {
      xml += `        <Cell><Data ss:Type="String">${escapeXML(h)}</Data></Cell>\n`;
    });
    xml += `      </Row>\n`;

    sheet.rows.forEach((row: any) => {
      xml += `      <Row>\n`;
      sheet.keys.forEach(k => {
        const val = row[k];
        const isNum = typeof val === "number" && val !== null;
        const typeAttr = isNum ? 'ss:Type="Number"' : 'ss:Type="String"';
        const displayVal = val === null || val === undefined ? "" : val;
        xml += `        <Cell><Data ${typeAttr}>${escapeXML(displayVal)}</Data></Cell>\n`;
      });
      xml += `      </Row>\n`;
    });

    xml += `    </Table>
  </Worksheet>\n`;
  });

  xml += `</Workbook>`;

  const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `marketing_database_${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToJSON(data: any) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `marketing_database_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
