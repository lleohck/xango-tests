export type ComparisonReportRow = {
  model: string;
  ndoc: string;
  result1Equal: boolean | null;
  result2Equal: boolean | null;
  beforeElapsed1: number | null;
  beforeElapsed2: number | null;
  afterElapsed1: number | null;
  afterElapsed2: number | null;
  elapsed1Delta: number | null;
  elapsed2Delta: number | null;
};

export type ComparisonReportPdfInput = {
  rows: ComparisonReportRow[];
  applicationName: string;
  environmentName: string;
  applicationCode?: string;
  environmentCode?: string;
  badgesWithBackground?: boolean;
  beforeFileName: string | null;
  afterFileName: string | null;
  userName: string;
  userEmail: string;
  comparedAt: Date;
  generatedAt?: Date;
};

function formatNumber(value: number | null, digits = 0) {
  if (value === null || Number.isNaN(value)) return "-";
  return value.toFixed(digits);
}

function formatDelta(value: number | null, digits = 0) {
  if (value === null || Number.isNaN(value)) return "-";
  const fixed = value.toFixed(digits);
  return value > 0 ? `+${fixed}` : fixed;
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .format(value)
    .replace(",", "");
}

function truncateValue(value: string, max = 52) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3)}...`;
}

function sanitizeFileNamePart(value: string) {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "_");
}

type BadgeTone = "improved" | "regressed" | "neutral";

function getToneFromDelta(value: number | null, digits = 2): BadgeTone {
  const formatted = formatDelta(value, digits);
  if (formatted.startsWith("-")) return "improved";
  if (formatted.startsWith("+")) return "regressed";
  return "neutral";
}

function toneColors(tone: BadgeTone) {
  if (tone === "improved") {
    return {
      fill: [220, 252, 231] as const,
      border: [134, 239, 172] as const,
      text: [22, 101, 52] as const,
    };
  }
  if (tone === "regressed") {
    return {
      fill: [254, 226, 226] as const,
      border: [252, 165, 165] as const,
      text: [185, 28, 28] as const,
    };
  }
  return {
    fill: [241, 245, 249] as const,
    border: [203, 213, 225] as const,
    text: [51, 65, 85] as const,
  };
}

function ellipsizeText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  if (!text) return "";
  if (ctx.measureText(text).width <= maxWidth) return text;

  let trimmed = text;
  while (trimmed.length > 0) {
    const candidate = `${trimmed}...`;
    if (ctx.measureText(candidate).width <= maxWidth) return candidate;
    trimmed = trimmed.slice(0, -1);
  }
  return "...";
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256(input: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return toHex(digest);
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error(`Falha ao carregar imagem para report: ${src}`));
    image.src = src;
  });
}

async function loadSerasaLogoPngDataUrl() {
  const response = await fetch("/serasa-logo.svg");
  if (!response.ok) return null;

  const svgText = await response.text();
  const svgBlob = new Blob([svgText], { type: "image/svg+xml" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await loadImage(svgUrl);
    const logoCanvas = document.createElement("canvas");
    logoCanvas.width = image.width;
    logoCanvas.height = image.height;

    const context = logoCanvas.getContext("2d");
    if (!context) return null;

    context.clearRect(0, 0, logoCanvas.width, logoCanvas.height);
    context.drawImage(image, 0, 0);
    return logoCanvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

function buildComparisonTableCanvas(rows: ComparisonReportRow[]) {
  const headers = [
    "Modelo",
    "Documento",
    "Resultado 1",
    "Resultado 2",
    "T1 Antes",
    "T2 Antes",
    "T1 Depois",
    "T2 Depois",
    "Δ T1",
    "Δ T2",
  ];

  const widths = [160, 160, 94, 94, 84, 84, 84, 84, 74, 74];
  const rowHeight = 24;
  const headerHeight = 28;
  const paddingX = 6;
  const tableWidth = widths.reduce((acc, value) => acc + value, 0);
  const tableHeight = headerHeight + rows.length * rowHeight;
  const scale = 2;

  const canvas = document.createElement("canvas");
  canvas.width = tableWidth * scale;
  canvas.height = tableHeight * scale;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Não foi possível desenhar a tabela para o report.");
  }

  ctx.scale(scale, scale);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, tableWidth, tableHeight);

  ctx.fillStyle = "#f1f5f9";
  ctx.fillRect(0, 0, tableWidth, headerHeight);

  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1;

  let xCursor = 0;
  for (let i = 0; i <= widths.length; i += 1) {
    ctx.beginPath();
    ctx.moveTo(xCursor + 0.5, 0);
    ctx.lineTo(xCursor + 0.5, tableHeight);
    ctx.stroke();
    xCursor += widths[i] ?? 0;
  }

  for (let y = 0; y <= rows.length + 1; y += 1) {
    const yLine = headerHeight + y * rowHeight + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, yLine);
    ctx.lineTo(tableWidth, yLine);
    ctx.stroke();
  }

  ctx.font = "bold 11px Arial";
  ctx.fillStyle = "#0f172a";

  let headerX = 0;
  headers.forEach((header, index) => {
    const width = widths[index];
    const text = ellipsizeText(ctx, header, width - paddingX * 2);
    const textWidth = ctx.measureText(text).width;
    ctx.fillText(text, headerX + (width - textWidth) / 2, 18);
    headerX += width;
  });

  const rowToCells = (row: ComparisonReportRow) => [
    row.model,
    row.ndoc,
    row.result1Equal === null ? "-" : row.result1Equal ? "Iguais" : "Dif.",
    row.result2Equal === null ? "-" : row.result2Equal ? "Iguais" : "Dif.",
    formatNumber(row.beforeElapsed1, 0),
    formatNumber(row.beforeElapsed2, 0),
    formatNumber(row.afterElapsed1, 0),
    formatNumber(row.afterElapsed2, 0),
    formatDelta(row.elapsed1Delta, 0),
    formatDelta(row.elapsed2Delta, 0),
  ];

  rows.forEach((row, rowIndex) => {
    const y = headerHeight + rowHeight * rowIndex;
    const isEven = rowIndex % 2 === 0;
    if (!isEven) {
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, y, tableWidth, rowHeight);
    }

    const cells = rowToCells(row);
    let cellX = 0;
    cells.forEach((cell, columnIndex) => {
      const width = widths[columnIndex];
      const statusColumn = columnIndex === 2 || columnIndex === 3;
      const deltaColumn = columnIndex === 8 || columnIndex === 9;

      ctx.font = "10px Arial";
      if (statusColumn) {
        if (cell === "Iguais") ctx.fillStyle = "#166534";
        else if (cell === "Dif.") ctx.fillStyle = "#b91c1c";
        else ctx.fillStyle = "#334155";
      } else if (deltaColumn) {
        if (cell.startsWith("-")) ctx.fillStyle = "#166534";
        else if (cell.startsWith("+")) ctx.fillStyle = "#b91c1c";
        else ctx.fillStyle = "#334155";
      } else {
        ctx.fillStyle = "#1e293b";
      }

      const text = ellipsizeText(ctx, cell, width - paddingX * 2);
      const textY = y + 16;
      const textWidth = ctx.measureText(text).width;
      ctx.fillText(text, cellX + (width - textWidth) / 2, textY);

      cellX += width;
    });
  });

  return canvas;
}

export async function generateComparisonReportPdf(
  input: ComparisonReportPdfInput,
) {
  if (input.rows.length === 0) {
    throw new Error("Não há linhas para gerar o report.");
  }

  const { jsPDF } = await import("jspdf");

  const reportDate = input.generatedAt ?? new Date();
  const tableCanvas = buildComparisonTableCanvas(input.rows);
  const logoDataUrl = await loadSerasaLogoPngDataUrl();
  const checksum = await sha256(
    JSON.stringify({
      title: "Report - Serasa API Testing",
      beforeFile: input.beforeFileName,
      afterFile: input.afterFileName,
      applicationName: input.applicationName,
      environmentName: input.environmentName,
      applicationCode: input.applicationCode ?? null,
      environmentCode: input.environmentCode ?? null,
      userName: input.userName,
      userEmail: input.userEmail,
      comparedAt: input.comparedAt.toISOString(),
      generatedAt: reportDate.toISOString(),
      rows: input.rows,
    }),
  );

  const doc = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  const firstPageContentY = 64;
  const otherPageContentY = 10;
  const footerReservedHeight = 16;
  const pxPerMm = tableCanvas.width / contentWidth;
  const badgesWithBackground = input.badgesWithBackground ?? false;

  const elapsed1Deltas = input.rows
    .map((row) => row.elapsed1Delta)
    .filter((value): value is number => value !== null);
  const elapsed2Deltas = input.rows
    .map((row) => row.elapsed2Delta)
    .filter((value): value is number => value !== null);

  const elapsed1AvgDelta =
    elapsed1Deltas.length > 0
      ? elapsed1Deltas.reduce((sum, value) => sum + value, 0) /
        elapsed1Deltas.length
      : null;
  const elapsed2AvgDelta =
    elapsed2Deltas.length > 0
      ? elapsed2Deltas.reduce((sum, value) => sum + value, 0) /
        elapsed2Deltas.length
      : null;

  const summaryBadges: Array<{ label: string; tone: BadgeTone }> = [
    {
      label: `média T1: ${formatDelta(elapsed1AvgDelta, 2)} ms`,
      tone: getToneFromDelta(elapsed1AvgDelta, 2),
    },
    {
      label: `média T2: ${formatDelta(elapsed2AvgDelta, 2)} ms`,
      tone: getToneFromDelta(elapsed2AvgDelta, 2),
    },
  ];

  const drawHeader = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(
      "Relatório - Testes de API Serasa",
      pageWidth / 2,
      17,
      {
        align: "center",
      },
    );

    if (logoDataUrl) {
      doc.addImage(logoDataUrl, "PNG", margin, 10, 28, 10);
    }

    const requesterTitleY = 13;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Solicitante", pageWidth - margin, requesterTitleY, {
      align: "right",
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(
      `Nome: ${truncateValue(input.userName, 42)}`,
      pageWidth - margin,
      requesterTitleY + 5,
      { align: "right" },
    );
    doc.text(
      `Email: ${truncateValue(input.userEmail, 48)}`,
      pageWidth - margin,
      requesterTitleY + 10,
      { align: "right" },
    );

    const detailsStartY = 30;
    const leftColumnX = margin;
    const rightColumnX = pageWidth - margin;
    const maxColValueChars = 70;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(
      `Aplicação: ${truncateValue(input.applicationName, maxColValueChars)}`,
      leftColumnX,
      detailsStartY + 5,
    );
    doc.text(
      `Ambiente: ${truncateValue(input.environmentName, maxColValueChars)}`,
      leftColumnX,
      detailsStartY + 10,
    );
    doc.setFontSize(9);
    doc.text(
      `Arquivo ANTES: ${truncateValue(
        input.beforeFileName ?? "N/A",
        maxColValueChars,
      )}`,
      rightColumnX,
      detailsStartY + 5,
      { align: "right" },
    );
    doc.text(
      `Arquivo DEPOIS: ${truncateValue(
        input.afterFileName ?? "N/A",
        maxColValueChars,
      )}`,
      rightColumnX,
      detailsStartY + 10,
      { align: "right" },
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const resultsTitleY = firstPageContentY - 8;
    doc.text("Comparação dos resultados", pageWidth / 2, resultsTitleY, {
      align: "center",
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.6);
    const paddingX = 2.2;
    const badgeHeight = 5;
    const badgeGap = 1.6;
    const maxTextWidth = Math.max(
      ...summaryBadges.map((badge) => doc.getTextWidth(badge.label)),
    );
    const badgeWidth = maxTextWidth + paddingX * 2;
    const totalBadgesWidth =
      summaryBadges.length * badgeWidth +
      (summaryBadges.length - 1) * badgeGap;
    const badgeInset = 0.8;
    let badgeX = pageWidth - margin - totalBadgesWidth - badgeInset;
    const badgeY = firstPageContentY - badgeHeight - badgeInset;

    summaryBadges.forEach((badge) => {
      const colors = toneColors(badge.tone);
      const [fillR, fillG, fillB] = colors.fill;
      const [borderR, borderG, borderB] = colors.border;
      const [textR, textG, textB] = colors.text;
      if (badgesWithBackground) {
        doc.setFillColor(fillR, fillG, fillB);
        doc.setDrawColor(borderR, borderG, borderB);
        doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1, 1, "FD");
      }

      doc.setTextColor(textR, textG, textB);
      const textWidth = doc.getTextWidth(badge.label);
      doc.text(badge.label, badgeX + (badgeWidth - textWidth) / 2, badgeY + 3.4);
      doc.setTextColor(0, 0, 0);

      badgeX += badgeWidth + badgeGap;
    });
  };

  const drawFooter = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.text(
      `Checksum SHA-256: ${checksum}.`,
      margin,
      pageHeight - 6,
      { align: "left" },
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(
      `Comparação realizada em: ${formatDateTime(input.comparedAt)}`,
      pageWidth - margin,
      pageHeight - 6,
      { align: "right" },
    );
  };

  let renderedHeightPx = 0;
  let pageIndex = 0;

  while (renderedHeightPx < tableCanvas.height) {
    const isFirstPage = pageIndex === 0;

    if (pageIndex > 0) {
      doc.addPage();
    }

    if (isFirstPage) {
      drawHeader();
    }

    const contentStartY = isFirstPage ? firstPageContentY : otherPageContentY;
    const usableHeightMm = pageHeight - contentStartY - footerReservedHeight;
    const usableHeightPx = Math.max(1, Math.floor(usableHeightMm * pxPerMm));
    const sliceHeightPx = Math.min(
      usableHeightPx,
      tableCanvas.height - renderedHeightPx,
    );

    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = tableCanvas.width;
    sliceCanvas.height = sliceHeightPx;
    const sliceCtx = sliceCanvas.getContext("2d");

    if (!sliceCtx) {
      throw new Error("Não foi possível gerar imagem da tabela.");
    }

    sliceCtx.fillStyle = "#ffffff";
    sliceCtx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
    sliceCtx.drawImage(
      tableCanvas,
      0,
      renderedHeightPx,
      tableCanvas.width,
      sliceHeightPx,
      0,
      0,
      tableCanvas.width,
      sliceHeightPx,
    );

    const sliceHeightMm = sliceHeightPx / pxPerMm;
    doc.addImage(
      sliceCanvas.toDataURL("image/png"),
      "PNG",
      margin,
      contentStartY,
      contentWidth,
      sliceHeightMm,
      undefined,
      "FAST",
    );

    drawFooter();
    renderedHeightPx += sliceHeightPx;
    pageIndex += 1;
  }

  const dateStr = [
    String(reportDate.getDate()).padStart(2, "0"),
    String(reportDate.getMonth() + 1).padStart(2, "0"),
    reportDate.getFullYear(),
  ].join("-");
  const timeStr = [
    String(reportDate.getHours()).padStart(2, "0"),
    String(reportDate.getMinutes()).padStart(2, "0"),
    String(reportDate.getSeconds()).padStart(2, "0"),
  ].join("-");

  const fileName = `report_serasa_api_testing_${sanitizeFileNamePart(input.applicationCode || input.applicationName)}_${sanitizeFileNamePart(input.environmentCode || input.environmentName)}_${dateStr}_${timeStr}.pdf`;
  doc.save(fileName);

  return { fileName, checksum };
}