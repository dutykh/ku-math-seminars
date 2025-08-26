/**
 * PDF Poster Generator for KU Math Seminars - Professional Multi-page Format
 * Author: Dr. Denys Dutykh (Khalifa University of Science and Technology, Abu Dhabi, UAE)
 */

import jsPDF from 'jspdf';
import type { WeekData, Seminar, SeriesMeta } from './types';
import { formatWeekRange, formatTimeRange } from './time';

export class SeminarPosterGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private currentPageNumber: number;
  
  constructor() {
    // A4 size in portrait mode
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 15;
    this.currentPageNumber = 1;
  }

  /**
   * Generate a professional multi-page PDF from week data
   */
  async generatePoster(weekData: WeekData): Promise<void> {
    const { week, seminars = [], series = [] } = weekData;
    
    // Page 1: Overview page with all seminars
    await this.drawOverviewPage(weekData);
    
    // Subsequent pages: One page per seminar with full details
    if (seminars.length > 0) {
      const seriesMap = new Map(series.map(s => [s.code, s]));
      const groupedSeminars = this.groupSeminarsBySeries(seminars);
      
      for (const [seriesCode, seriesSeminars] of groupedSeminars) {
        const seriesInfo = seriesMap.get(seriesCode);
        
        // Sort seminars by start time
        const sortedSeminars = [...seriesSeminars].sort((a, b) => 
          new Date(a.start).getTime() - new Date(b.start).getTime()
        );
        
        for (const seminar of sortedSeminars) {
          // Add new page for each seminar
          this.doc.addPage();
          this.currentPageNumber++;
          
          await this.drawSeminarDetailPage(seminar, seriesInfo, week);
        }
      }
    }
  }

  /**
   * Draw overview page with condensed schedule
   */
  private async drawOverviewPage(weekData: WeekData): Promise<void> {
    const { week, seminars = [], series = [] } = weekData;
    
    // Header
    await this.drawPageHeader(week, 'WEEKLY SEMINARS OVERVIEW');
    
    let currentY = 80;
    
    if (seminars.length === 0) {
      this.drawCenteredText('No seminars scheduled for this week.', currentY + 20, 14);
      this.drawCenteredText('Check back next week for upcoming events.', currentY + 40, 12);
      return;
    }
    
    // Table headers
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10);
    this.doc.setTextColor(30, 58, 138); // KU Primary
    
    // Column positions for table layout
    const colX = [this.margin, this.margin + 35, this.margin + 60, this.margin + 105, this.margin + 180 - 35];
    
    // Header row
    this.doc.text('Date & Time', colX[0], currentY);
    this.doc.text('Series', colX[1], currentY);
    this.doc.text('Speaker', colX[2], currentY);
    this.doc.text('Title', colX[3], currentY);
    this.doc.text('Location', colX[4], currentY);
    
    // Header underline
    this.doc.setDrawColor(30, 58, 138);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, currentY + 2, this.pageWidth - this.margin, currentY + 2);
    
    currentY += 10;
    
    // Seminar rows
    const seriesMap = new Map(series.map(s => [s.code, s]));
    const allSeminars = [...seminars].sort((a, b) => 
      new Date(a.start).getTime() - new Date(b.start).getTime()
    );
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8);
    this.doc.setTextColor(31, 41, 55);
    
    for (const seminar of allSeminars) {
      // Check if we need a new page
      if (currentY > this.pageHeight - 40) {
        this.doc.addPage();
        this.currentPageNumber++;
        await this.drawPageHeader(week, 'WEEKLY SEMINARS OVERVIEW (continued)');
        currentY = 80;
      }
      
      const startDate = new Date(seminar.start);
      const dateStr = startDate.toLocaleDateString('en-GB', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric'
      });
      const timeStr = startDate.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: week.timezone || 'Asia/Dubai'
      });
      
      const seriesInfo = seriesMap.get(seminar.series);
      const seriesLabel = seriesInfo?.label || seminar.series.toUpperCase();
      
      // Status prefix for title
      const status = seminar.status || 'confirmed';
      const statusPrefix = status !== 'confirmed' ? `[${status.toUpperCase()}] ` : '';
      
      // Row data
      const dateTime = `${dateStr}\n${timeStr}`;
      const speaker = this.truncateText(seminar.speaker, 20);
      const title = this.truncateText(statusPrefix + seminar.title, 35);
      const location = this.truncateText(seminar.location, 20);
      
      // Draw row
      const rowHeight = 12;
      this.doc.text(dateTime, colX[0], currentY);
      this.doc.text(seriesLabel, colX[1], currentY);
      this.doc.text(speaker, colX[2], currentY);
      this.doc.text(title, colX[3], currentY);
      this.doc.text(location, colX[4], currentY);
      
      currentY += rowHeight;
      
      // Light separator line
      this.doc.setDrawColor(229, 231, 235);
      this.doc.setLineWidth(0.2);
      this.doc.line(this.margin, currentY - 2, this.pageWidth - this.margin, currentY - 2);
    }
    
    // Footer note
    currentY += 10;
    this.doc.setFont('helvetica', 'italic');
    this.doc.setFontSize(9);
    this.doc.setTextColor(107, 114, 128);
    this.drawCenteredText('Detailed information for each seminar follows on subsequent pages.', currentY);
  }

  /**
   * Draw detailed page for a single seminar
   */
  private async drawSeminarDetailPage(seminar: Seminar, seriesInfo: SeriesMeta | undefined, week: any): Promise<void> {
    // Header
    const seriesLabel = seriesInfo?.label || seminar.series.toUpperCase();
    await this.drawPageHeader(week, seriesLabel);
    
    let currentY = 90;
    
    // Status badge if not confirmed
    const status = seminar.status || 'confirmed';
    if (status !== 'confirmed') {
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(12);
      
      let statusColor = [107, 114, 128]; // Default gray
      if (status === 'cancelled') statusColor = [220, 38, 38]; // Red
      else if (status === 'postponed') statusColor = [217, 119, 6]; // Amber
      else if (status === 'tentative') statusColor = [37, 99, 235]; // Blue
      
      this.doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      this.drawCenteredText(`[${status.toUpperCase()}]`, currentY, 12);
      currentY += 15;
    }
    
    // Speaker name
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(18);
    this.doc.setTextColor(31, 41, 55);
    this.drawCenteredText(seminar.speaker, currentY);
    currentY += 12;
    
    // Affiliation
    if (seminar.affiliation) {
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(12);
      this.doc.setTextColor(107, 114, 128);
      this.drawCenteredText(`(${seminar.affiliation})`, currentY);
      currentY += 15;
    } else {
      currentY += 10;
    }
    
    // Seminar title - CENTERED
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(16);
    this.doc.setTextColor(30, 58, 138); // KU Primary
    const titleLines = this.doc.splitTextToSize(seminar.title, this.pageWidth - 2 * this.margin - 20);
    
    for (let i = 0; i < titleLines.length; i++) {
      this.drawCenteredText(titleLines[i], currentY + (i * 8));
    }
    currentY += titleLines.length * 8 + 15;
    
    // Time and location - CENTERED
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(12);
    this.doc.setTextColor(75, 85, 99);
    
    // Format time range properly
    const timeRange = formatTimeRange(seminar.start, seminar.end, week.timezone);
    this.drawCenteredText(`Time: ${timeRange}`, currentY);
    currentY += 8;
    
    this.drawCenteredText(`Location: ${seminar.location}`, currentY);
    currentY += 20;
    
    // Tags if available
    if (seminar.tags && seminar.tags.length > 0) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(10);
      this.doc.setTextColor(107, 114, 128);
      const tagsText = `Tags: ${seminar.tags.join(', ')}`;
      this.drawCenteredText(tagsText, currentY);
      currentY += 15;
    }
    
    // Abstract section
    if (seminar.abstract) {
      // Section header
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(14);
      this.doc.setTextColor(30, 58, 138);
      this.drawCenteredText('ABSTRACT', currentY);
      currentY += 12;
      
      // Abstract content
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(10);
      this.doc.setTextColor(31, 41, 55);
      
      // Clean abstract text (remove markdown formatting for PDF)
      const cleanAbstract = this.cleanMarkdownText(seminar.abstract);
      const abstractLines = this.doc.splitTextToSize(cleanAbstract, this.pageWidth - 2 * this.margin);
      
      for (let i = 0; i < abstractLines.length; i++) {
        if (currentY > this.pageHeight - 40) {
          this.doc.addPage();
          this.currentPageNumber++;
          await this.drawPageHeader(week, seriesLabel + ' (continued)');
          currentY = 80;
        }
        this.doc.text(abstractLines[i], this.margin, currentY);
        currentY += 5;
      }
      currentY += 10;
    }
    
    // Speaker biography
    if (seminar.biography) {
      // Check if we need a new page
      if (currentY > this.pageHeight - 80) {
        this.doc.addPage();
        this.currentPageNumber++;
        await this.drawPageHeader(week, seriesLabel + ' (continued)');
        currentY = 80;
      }
      
      // Section header
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(14);
      this.doc.setTextColor(30, 58, 138);
      this.drawCenteredText('SPEAKER BIOGRAPHY', currentY);
      currentY += 12;
      
      // Biography content
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(10);
      this.doc.setTextColor(31, 41, 55);
      
      const cleanBiography = this.cleanMarkdownText(seminar.biography);
      const biographyLines = this.doc.splitTextToSize(cleanBiography, this.pageWidth - 2 * this.margin);
      
      for (let i = 0; i < biographyLines.length; i++) {
        if (currentY > this.pageHeight - 40) {
          this.doc.addPage();
          this.currentPageNumber++;
          await this.drawPageHeader(week, seriesLabel + ' (continued)');
          currentY = 80;
        }
        this.doc.text(biographyLines[i], this.margin, currentY);
        currentY += 5;
      }
      currentY += 10;
    }
    
    // Links section
    if (seminar.links && Object.keys(seminar.links).length > 0) {
      // Section header
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(14);
      this.doc.setTextColor(30, 58, 138);
      this.drawCenteredText('LINKS', currentY);
      currentY += 12;
      
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(10);
      this.doc.setTextColor(31, 41, 55);
      
      if (seminar.affiliationUrl) {
        this.doc.text(`University: ${seminar.affiliationUrl}`, this.margin, currentY);
        currentY += 6;
      }
      if (seminar.links.speaker) {
        this.doc.text(`Speaker Page: ${seminar.links.speaker}`, this.margin, currentY);
        currentY += 6;
      }
      if (seminar.links.zoom) {
        this.doc.text(`Join Meeting: ${seminar.links.zoom}`, this.margin, currentY);
        currentY += 6;
      }
      if (seminar.links.video) {
        this.doc.text(`Recording: ${seminar.links.video}`, this.margin, currentY);
        currentY += 6;
      }
    }
  }

  /**
   * Draw consistent page header with logo placeholder
   */
  private async drawPageHeader(week: any, subtitle: string): Promise<void> {
    // Background
    this.doc.setFillColor(30, 58, 138); // KU Primary
    this.doc.rect(0, 0, this.pageWidth, 50, 'F');
    
    // KU Logo (left side)
    try {
      const logoX = this.margin + 5;
      const logoY = 10;
      const logoSize = 30;
      
      // Logo background circle
      this.doc.setFillColor(255, 255, 255);
      this.doc.circle(logoX + logoSize/2, logoY + logoSize/2, logoSize/2, 'F');
      
      // KU text in logo
      this.doc.setTextColor(30, 58, 138);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(16);
      this.doc.text('KU', logoX + logoSize/2, logoY + logoSize/2 + 3, { align: 'center' });
    } catch (error) {
      console.warn('Could not add KU logo:', error);
    }
    
    // University name and department
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(20);
    this.drawCenteredText('KHALIFA UNIVERSITY', 18);
    
    this.doc.setFontSize(14);
    this.drawCenteredText('Mathematics Department', 28);
    
    this.doc.setFontSize(10);
    this.drawCenteredText(subtitle, 38);
    
    // Week range
    const weekRange = formatWeekRange(week.start, week.end, week.isoWeek, week.timezone);
    this.doc.setTextColor(30, 58, 138);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.drawCenteredText(weekRange, 60);
    
    // Page number (bottom right)
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8);
    this.doc.setTextColor(107, 114, 128);
    this.doc.text(`Page ${this.currentPageNumber}`, this.pageWidth - this.margin - 15, this.pageHeight - 10);
  }

  /**
   * Draw centered text utility
   */
  private drawCenteredText(text: string, y: number, fontSize?: number): void {
    if (fontSize) {
      this.doc.setFontSize(fontSize);
    }
    this.doc.text(text, this.pageWidth / 2, y, { align: 'center' });
  }

  /**
   * Clean markdown text for PDF display
   */
  private cleanMarkdownText(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1')     // Remove italic markdown
      .replace(/`([^`]+)`/g, '$1')     // Remove code markdown
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .replace(/#{1,6}\s/g, '')        // Remove headers
      .replace(/^\s*[-*]\s/gm, '• ')   // Convert bullets
      .replace(/\n\s*\n/g, '\n')       // Clean up spacing
      .trim();
  }

  /**
   * Group seminars by series
   */
  private groupSeminarsBySeries(seminars: Seminar[]): Map<string, Seminar[]> {
    const grouped = new Map<string, Seminar[]>();
    
    for (const seminar of seminars) {
      if (!grouped.has(seminar.series)) {
        grouped.set(seminar.series, []);
      }
      grouped.get(seminar.series)!.push(seminar);
    }
    
    return grouped;
  }

  /**
   * Truncate text to specified length
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Save the PDF file
   */
  save(filename: string = 'ku-math-seminars-poster.pdf'): void {
    this.doc.save(filename);
  }
}

/**
 * Generate and download a seminar poster PDF
 */
export async function generateSeminarPoster(weekData: WeekData): Promise<void> {
  const generator = new SeminarPosterGenerator();
  await generator.generatePoster(weekData);
  
  // Generate filename with week information
  const { week } = weekData;
  const startDate = new Date(week.start);
  const filename = `KU-Math-Seminars-Week-${week.isoWeek}-${startDate.getFullYear()}.pdf`;
  
  generator.save(filename);
}