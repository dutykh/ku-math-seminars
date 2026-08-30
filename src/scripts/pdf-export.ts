/**
 * Client-side PDF poster generation for KU Math Seminars.
 * Author: Dr. Denys Dutykh (Khalifa University of Science and Technology, Abu Dhabi, UAE)
 * License: GNU General Public License v3.0
 *
 * Produces an A4 document: one overview table, then one detail page per
 * seminar. jsPDF is bundled rather than fetched from a CDN, so the page needs
 * no third-party script and the CSP can stay strict. This module is loaded on
 * demand (dynamic import on first click) to keep it off the initial payload.
 */
import { jsPDF } from 'jspdf';
import type { Seminar, SeriesMeta, WeekData, WeekInfo } from '../lib/types';

type Doc = jsPDF;

const MARGIN = 15;
const HEADER_HEIGHT = 65;
const KU_BLUE: [number, number, number] = [30, 58, 138];
const KU_BLUE_LIGHT: [number, number, number] = [45, 73, 153];
const KU_GREEN: [number, number, number] = [5, 150, 105];
const INK: [number, number, number] = [31, 41, 55];
const SLATE: [number, number, number] = [75, 85, 99];
const GREY: [number, number, number] = [107, 114, 128];
const RULE: [number, number, number] = [229, 231, 235];

const STATUS_COLOURS: Record<string, [number, number, number]> = {
  cancelled: [220, 38, 38],
  postponed: [217, 119, 6],
  tentative: [37, 99, 235]
};

/** Cached KU logo data URL; fetched at most once per page load. */
let logoPromise: Promise<{ dataUrl: string; aspectRatio: number } | null> | null = null;

async function loadLogo(): Promise<{ dataUrl: string; aspectRatio: number } | null> {
  if (!logoPromise) {
    logoPromise = (async () => {
      try {
        const response = await fetch(`${location.origin}/assets/KUlogo.png`, { cache: 'force-cache' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();

        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });

        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('logo failed to decode'));
          img.src = dataUrl;
        });

        return { dataUrl, aspectRatio: (image.width || 1) / (image.height || 1) };
      } catch (error) {
        console.warn('Could not load KU logo for the PDF:', error);
        return null;
      }
    })();
  }
  return logoPromise;
}

/** White "KU" wordmark used when the logo image is unavailable. */
function drawFallbackLogo(doc: Doc, x: number, y: number, size: number): void {
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('KU', x + 5, y + size / 2 + 5);
}

async function drawPageHeader(doc: Doc, week: WeekInfo, pageWidth: number): Promise<void> {
  doc.setFillColor(...KU_BLUE);
  doc.rect(0, 0, pageWidth, HEADER_HEIGHT, 'F');
  doc.setFillColor(...KU_BLUE_LIGHT);
  doc.rect(0, 0, pageWidth, 2, 'F');

  const box = { x: MARGIN, y: 20, width: 22, height: 22 };
  const maxSize = 15;
  const logo = await loadLogo();

  if (logo) {
    const width = logo.aspectRatio > 1 ? maxSize * logo.aspectRatio : maxSize;
    const height = logo.aspectRatio > 1 ? maxSize : maxSize / logo.aspectRatio;
    const x = box.x + (box.width - width) / 2;
    const y = box.y + (box.height - height) / 2;
    const padding = 2;

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x - padding, y - padding, width + padding * 2, height + padding * 2, 2, 2, 'F');
    doc.addImage(logo.dataUrl, 'PNG', x, y, width, height);
  } else {
    drawFallbackLogo(doc, box.x, box.y, maxSize);
  }

  const textStartX = 42;
  const centreX = textStartX + (pageWidth - textStartX - MARGIN) / 2;

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('KHALIFA UNIVERSITY', centreX, 20, { align: 'center' });
  doc.setFontSize(14);
  doc.text('Mathematics Department', centreX, 32, { align: 'center' });
  doc.setFontSize(12);
  doc.text('Weekly Seminars Schedule', centreX, 44, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Week ${week.isoWeek}: ${week.start} – ${week.end}`, centreX, 56, { align: 'center' });
}

function drawPageFooter(doc: Doc, pageWidth: number, pageNumber: number): void {
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, pageHeight - 25, pageWidth - MARGIN, pageHeight - 25);

  doc.setTextColor(...GREY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    'For more information, visit: https://www.events.denys-dutykh.com',
    pageWidth / 2,
    pageHeight - 18,
    { align: 'center' }
  );
  doc.text('Contact: denys.dutykh@ku.ac.ae', pageWidth / 2, pageHeight - 10, { align: 'center' });

  if (pageNumber > 1) {
    doc.setFontSize(8);
    doc.text(`Page ${pageNumber}`, pageWidth - MARGIN, pageHeight - 5, { align: 'right' });
  }
}

function seriesLabelFor(series: SeriesMeta[], seminar: Seminar): string {
  return series.find((s) => s?.code === seminar.series)?.label || seminar.series.toUpperCase();
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-GB', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function drawOverviewPage(
  doc: Doc,
  seminars: Seminar[],
  series: SeriesMeta[],
  pageWidth: number
): void {
  let y = 80;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...KU_BLUE);
  doc.text('WEEKLY SEMINARS OVERVIEW', pageWidth / 2, y, { align: 'center' });
  y += 20;

  doc.setFontSize(10);

  const leftPadding = 5;
  const colWidths = [25, 22, 32, 50, 30]; // Date & Time, Series, Speaker, Title, Location
  const colSpacing = 2;
  const colX: number[] = [];
  let cursor = MARGIN + leftPadding;
  for (const width of colWidths) {
    colX.push(cursor);
    cursor += width + colSpacing;
  }

  const headings = ['Date & Time', 'Series', 'Speaker', 'Title', 'Location'];
  headings.forEach((heading, i) => {
    doc.text(heading, colX[i] + colWidths[i] / 2, y, { align: 'center' });
  });

  doc.setDrawColor(...KU_BLUE);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y + 2, pageWidth - MARGIN, y + 2);
  y += 15;

  const tableStartY = y;
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...INK);

  const sorted = [...seminars].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  for (const seminar of sorted) {
    const timeRange = seminar.end
      ? `${formatTime(seminar.start)} – ${formatTime(seminar.end)}`
      : formatTime(seminar.start);
    const statusPrefix =
      seminar.status !== 'confirmed' ? `[${seminar.status.toUpperCase()}] ` : '';

    const cells = [
      [`${formatDate(seminar.start)}`, timeRange],
      doc.splitTextToSize(seriesLabelFor(series, seminar), colWidths[1]),
      doc.splitTextToSize(seminar.speaker, colWidths[2]),
      doc.splitTextToSize(statusPrefix + seminar.title, colWidths[3]),
      doc.splitTextToSize(seminar.location, colWidths[4])
    ];

    const maxLines = Math.max(...cells.map((lines) => lines.length));
    if (y + maxLines * 5 + 15 > pageHeight - 40) break;

    cells.forEach((lines, col) => {
      lines.forEach((line: string, i: number) => {
        doc.text(line, colX[col], y + i * 5);
      });
    });

    y += maxLines * 5 + 7;
  }

  const tableEndY = y - 2;

  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.2);
  for (let i = 1; i < colX.length; i++) {
    doc.line(colX[i] - 2, tableStartY - 5, colX[i] - 2, tableEndY);
  }

  doc.setDrawColor(...KU_BLUE);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, tableStartY - 5, pageWidth - MARGIN, tableStartY - 5);
  doc.line(MARGIN, tableStartY - 5, MARGIN, tableEndY);
  doc.line(pageWidth - MARGIN, tableStartY - 5, pageWidth - MARGIN, tableEndY);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, tableEndY, pageWidth - MARGIN, tableEndY);

  y += 15;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(...GREY);
  doc.text('Detailed information for each seminar follows on subsequent pages.', pageWidth / 2, y, {
    align: 'center'
  });

  drawPageFooter(doc, pageWidth, 1);
}

async function drawSeminarDetailPage(
  doc: Doc,
  seminar: Seminar,
  series: SeriesMeta[],
  week: WeekInfo,
  pageWidth: number,
  pageNumber: number
): Promise<void> {
  await drawPageHeader(doc, week, pageWidth);

  let y = 80;
  const seriesInfo = series.find((s) => s?.code === seminar.series);

  doc.setFont('helvetica', 'bold');
  doc.setFillColor(...KU_GREEN);
  doc.rect(MARGIN, y, pageWidth - 2 * MARGIN, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(seriesLabelFor(series, seminar), pageWidth / 2, y + 8, { align: 'center' });
  y += 25;

  if (seriesInfo?.organisedBy) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...SLATE);
    const lines = doc.splitTextToSize(
      `Organized by: ${seriesInfo.organisedBy}`,
      pageWidth - 2 * MARGIN
    );
    lines.forEach((line: string, i: number) => {
      doc.text(line, pageWidth / 2, y + i * 5, { align: 'center' });
    });
    y += lines.length * 5 + 8;
  }

  if (seminar.status !== 'confirmed') {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...(STATUS_COLOURS[seminar.status] ?? GREY));
    doc.text(`[${seminar.status.toUpperCase()}]`, pageWidth / 2, y, { align: 'center' });
    y += 15;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...INK);
  doc.text(seminar.speaker, pageWidth / 2, y, { align: 'center' });
  y += 12;

  if (seminar.affiliation) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(...GREY);
    doc.text(`(${seminar.affiliation})`, pageWidth / 2, y, { align: 'center' });
    y += 15;
  } else {
    y += 10;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...KU_BLUE);
  const titleLines = doc.splitTextToSize(seminar.title, pageWidth - 2 * MARGIN - 20);
  titleLines.forEach((line: string, i: number) => {
    doc.text(line, pageWidth / 2, y + i * 8, { align: 'center' });
  });
  y += titleLines.length * 8 + 15;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(...SLATE);

  const start = new Date(seminar.start);
  const dateLabel = start.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const startTime = start.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  const endTime = seminar.end
    ? new Date(seminar.end).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    : '';

  doc.text(`Date: ${dateLabel}`, pageWidth / 2, y, { align: 'center' });
  y += 8;
  doc.text(`Time: ${endTime ? `${startTime} – ${endTime}` : startTime}`, pageWidth / 2, y, {
    align: 'center'
  });
  y += 8;
  doc.text(`Location: ${seminar.location}`, pageWidth / 2, y, { align: 'center' });
  y += 20;

  if (seminar.abstract) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...KU_BLUE);
    doc.text('ABSTRACT', pageWidth / 2, y, { align: 'center' });
    y += 12;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...INK);

    // Strip the small amount of Markdown emphasis the abstracts use.
    const plain = seminar.abstract.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
    const pageHeight = doc.internal.pageSize.getHeight();

    for (const line of doc.splitTextToSize(plain, pageWidth - 2 * MARGIN)) {
      if (y > pageHeight - 50) break;
      doc.text(line, MARGIN, y);
      y += 5;
    }
  }

  drawPageFooter(doc, pageWidth, pageNumber);
}

/** Build the weekly poster and hand it to the browser as a download. */
export async function generateSeminarPoster(weekData: WeekData): Promise<void> {
  if (!weekData?.week) {
    throw new Error('Invalid week data structure');
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const { week } = weekData;
  const seminars = Array.isArray(weekData.seminars) ? weekData.seminars : [];
  const series = Array.isArray(weekData.series) ? weekData.series : [];

  await drawPageHeader(doc, week, pageWidth);

  if (seminars.length === 0) {
    doc.setTextColor(...GREY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.text('No seminars scheduled for this week.', pageWidth / 2, 80, { align: 'center' });
    drawPageFooter(doc, pageWidth, 1);
  } else {
    drawOverviewPage(doc, seminars, series, pageWidth);

    for (let i = 0; i < seminars.length; i++) {
      doc.addPage();
      await drawSeminarDetailPage(doc, seminars[i], series, week, pageWidth, i + 2);
    }
  }

  const year = new Date(week.start).getFullYear() || new Date().getFullYear();
  doc.save(`KU-Math-Seminars-Week-${week.isoWeek}-${year}.pdf`);
}
