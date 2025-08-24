/**
 * PDF Poster Generator for KU Math Seminars
 * Author: Dr. Denys Dutykh (Khalifa University of Science and Technology, Abu Dhabi, UAE)
 */

import jsPDF from 'jspdf';
import type { WeekData, Seminar } from './types';
import { formatWeekRange, formatTimeRange } from './time';

// Professional color scheme (KU branding) - defined inline where needed

export class SeminarPosterGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  
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
  }

  /**
   * Generate a professional poster PDF from week data
   */
  async generatePoster(weekData: WeekData): Promise<void> {
    const { week, seminars = [], series = [] } = weekData;
    
    // Header section
    this.drawHeader(week);
    
    // Content section
    let currentY = 70;
    
    if (seminars.length === 0) {
      this.drawNoSeminars(currentY);
    } else {
      // Group seminars by series
      const seriesMap = new Map(series.map(s => [s.code, s]));
      const groupedSeminars = this.groupSeminarsBySeries(seminars);
      
      // Draw each series
      for (const [seriesCode, seriesSeminars] of groupedSeminars) {
        const seriesInfo = seriesMap.get(seriesCode);
        currentY = this.drawSeriesSection(
          seriesInfo?.label || seriesCode.toUpperCase(),
          seriesSeminars,
          currentY,
          week.timezone
        );
        currentY += 8; // Space between series
        
        // Check if we need a new page
        if (currentY > this.pageHeight - 40) {
          this.doc.addPage();
          currentY = this.margin;
        }
      }
    }
    
    // Footer
    this.drawFooter();
  }

  /**
   * Draw the poster header with KU branding
   */
  private drawHeader(week: any): void {
    // Background gradient effect (simplified)
    this.doc.setFillColor(30, 58, 138); // KU Primary
    this.doc.rect(0, 0, this.pageWidth, 50, 'F');
    
    // University name
    this.doc.setTextColor(255, 255, 255); // White text
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(24);
    this.doc.text('KHALIFA UNIVERSITY', this.pageWidth / 2, 20, { align: 'center' });
    
    // Department
    this.doc.setFontSize(16);
    this.doc.text('Mathematics Department', this.pageWidth / 2, 30, { align: 'center' });
    
    // Seminars title
    this.doc.setFontSize(14);
    this.doc.text('Weekly Seminars Schedule', this.pageWidth / 2, 40, { align: 'center' });
    
    // Week information
    const weekRange = formatWeekRange(week.start, week.end, week.isoWeek, week.timezone);
    this.doc.setTextColor(30, 58, 138); // KU Primary
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(18);
    this.doc.text(weekRange, this.pageWidth / 2, 60, { align: 'center' });
  }

  /**
   * Draw a series section with its seminars
   */
  private drawSeriesSection(
    seriesLabel: string, 
    seminars: Seminar[], 
    startY: number,
    timezone?: string
  ): number {
    let currentY = startY;
    
    // Series header
    this.doc.setFillColor(5, 150, 105); // KU Accent
    this.doc.rect(this.margin, currentY, this.pageWidth - 2 * this.margin, 12, 'F');
    
    this.doc.setTextColor(255, 255, 255); // White text
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(14);
    this.doc.text(seriesLabel, this.margin + 5, currentY + 8);
    
    currentY += 18;
    
    // Sort seminars by start time
    const sortedSeminars = [...seminars].sort((a, b) => 
      new Date(a.start).getTime() - new Date(b.start).getTime()
    );
    
    // Draw each seminar
    for (const seminar of sortedSeminars) {
      currentY = this.drawSeminarCard(seminar, currentY, timezone);
      
      // Check if we need a new page
      if (currentY > this.pageHeight - 60) {
        this.doc.addPage();
        currentY = this.margin;
      }
    }
    
    return currentY;
  }

  /**
   * Draw an individual seminar card
   */
  private drawSeminarCard(seminar: Seminar, startY: number, timezone?: string): number {
    let currentY = startY;
    const cardWidth = this.pageWidth - 2 * this.margin;
    const cardHeight = this.calculateSeminarCardHeight(seminar);
    
    // Card background
    this.doc.setFillColor(249, 250, 251); // Light gray background
    this.doc.rect(this.margin, currentY, cardWidth, cardHeight, 'F');
    
    // Border
    this.doc.setDrawColor(229, 231, 235); // Light border
    this.doc.rect(this.margin, currentY, cardWidth, cardHeight, 'S');
    
    currentY += 8;
    
    // Speaker and title
    this.doc.setTextColor(31, 41, 55); // Dark text
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.text(`${seminar.speaker}`, this.margin + 5, currentY);
    
    if (seminar.affiliation) {
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(9);
      this.doc.setTextColor(107, 114, 128); // Light text
      this.doc.text(`(${seminar.affiliation})`, this.margin + 5, currentY + 5);
      currentY += 8;
    } else {
      currentY += 3;
    }
    
    // Title
    this.doc.setTextColor(30, 58, 138); // KU Primary
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(11);
    const titleLines = this.doc.splitTextToSize(seminar.title, cardWidth - 10);
    this.doc.text(titleLines, this.margin + 5, currentY + 5);
    currentY += titleLines.length * 4 + 5;
    
    // Time and location
    const timeRange = formatTimeRange(seminar.start, seminar.end, timezone);
    this.doc.setTextColor(107, 114, 128); // Light text
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.text(`⏰ ${timeRange}`, this.margin + 5, currentY);
    this.doc.text(`📍 ${seminar.location}`, this.margin + 5, currentY + 4);
    currentY += 12;
    
    // Abstract (truncated if too long)
    if (seminar.abstract) {
      const abstractText = this.truncateText(seminar.abstract, 200);
      this.doc.setFontSize(8);
      this.doc.setTextColor(75, 85, 99);
      const abstractLines = this.doc.splitTextToSize(abstractText, cardWidth - 10);
      this.doc.text(abstractLines, this.margin + 5, currentY);
      currentY += Math.min(abstractLines.length * 3, 12); // Max 4 lines
    }
    
    return currentY + 5;
  }

  /**
   * Calculate the height needed for a seminar card
   */
  private calculateSeminarCardHeight(seminar: Seminar): number {
    let height = 35; // Base height for speaker, title, time, location
    
    if (seminar.affiliation) height += 5;
    
    // Add space for title (estimate)
    const titleLength = seminar.title.length;
    if (titleLength > 50) height += 8;
    if (titleLength > 100) height += 8;
    
    // Add space for abstract
    if (seminar.abstract) height += 15;
    
    return Math.min(height, 60); // Max height to prevent oversized cards
  }

  /**
   * Draw "no seminars" message
   */
  private drawNoSeminars(startY: number): void {
    this.doc.setTextColor(107, 114, 128);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(14);
    this.doc.text('No seminars scheduled for this week.', this.pageWidth / 2, startY + 20, { align: 'center' });
    this.doc.text('Check back next week for upcoming events.', this.pageWidth / 2, startY + 35, { align: 'center' });
  }

  /**
   * Draw footer with contact information
   */
  private drawFooter(): void {
    const footerY = this.pageHeight - 25;
    
    // Separator line
    this.doc.setDrawColor(229, 231, 235);
    this.doc.line(this.margin, footerY - 5, this.pageWidth - this.margin, footerY - 5);
    
    // Contact information
    this.doc.setTextColor(107, 114, 128);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.text('For more information, visit: math.ku.ac.ae/seminars', this.pageWidth / 2, footerY + 5, { align: 'center' });
    this.doc.text('Contact: denys.dutykh@ku.ac.ae', this.pageWidth / 2, footerY + 10, { align: 'center' });
    
    // Generation timestamp
    const now = new Date();
    const timestamp = now.toLocaleDateString('en-GB') + ' ' + now.toLocaleTimeString('en-GB');
    this.doc.setFontSize(7);
    this.doc.text(`Generated: ${timestamp}`, this.pageWidth / 2, footerY + 15, { align: 'center' });
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
export function generateSeminarPoster(weekData: WeekData): void {
  const generator = new SeminarPosterGenerator();
  generator.generatePoster(weekData);
  
  // Generate filename with week information
  const { week } = weekData;
  const filename = `KU-Math-Seminars-Week-${week.isoWeek}-${new Date(week.start).getFullYear()}.pdf`;
  
  generator.save(filename);
}