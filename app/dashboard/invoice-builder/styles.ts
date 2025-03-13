// styles.js
import type { InvoiceStyles, InvoiceLayout } from './types';

export const defaultStyles: InvoiceStyles = {
  headerColor: '#4f46e5', // Indigo
  buttonColor: '#4f46e5', // Indigo
  payButtonColor: '#10b981', // Emerald
  fontFamily: 'Arial, sans-serif',
  spacing: '20px',
};

export const defaultLayout: Partial<InvoiceLayout> = {
  showLogo: false,
  logoPosition: 'left',
  logoUrl: '',
  showHeaderImage: false,
  headerImageUrl: '',
  showCompanyDetails: true,
  showClientDetails: true,
  showPaymentButton: true,
  showFooter: true,
  tableStyle: 'simple',
  borderStyle: 'solid',
  borderWidth: 1,
  borderColor: '#dddddd',
  borderRadius: 4,
  fontSize: 14,
  lineHeight: 1.5,
  headerSpacing: 40,
  contentSpacing: 30,
  footerSpacing: 40,
};

export const stylePresets: Record<string, Partial<InvoiceStyles & Partial<InvoiceLayout>>> = {
  modern: {
    headerColor: '#4f46e5', // Indigo
    buttonColor: '#4f46e5', // Indigo
    payButtonColor: '#10b981', // Emerald
    fontFamily: "'Helvetica Neue', Helvetica, sans-serif",
    spacing: '24px',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    fontSize: 14,
    lineHeight: 1.6,
  },
  classic: {
    headerColor: '#1e3a8a', // Dark blue
    buttonColor: '#1e3a8a', // Dark blue
    payButtonColor: '#047857', // Dark green
    fontFamily: "'Times New Roman', serif",
    spacing: '20px',
    borderStyle: 'double',
    borderWidth: 3,
    borderColor: '#d1d5db',
    borderRadius: 0,
    fontSize: 15,
    lineHeight: 1.5,
  },
  minimal: {
    headerColor: '#ffffff', // White
    buttonColor: '#f3f4f6', // Light gray
    payButtonColor: '#111827', // Dark gray
    fontFamily: "'Helvetica Neue', Helvetica, sans-serif",
    spacing: '16px',
    borderStyle: 'none',
    borderWidth: 0,
    borderColor: 'transparent',
    borderRadius: 0,
    fontSize: 14,
    lineHeight: 1.4,
  },
  bold: {
    headerColor: '#18181b', // Almost black
    buttonColor: '#18181b', // Almost black
    payButtonColor: '#ef4444', // Red
    fontFamily: 'Arial, sans-serif',
    spacing: '24px',
    borderStyle: 'solid',
    borderWidth: 2,
    borderColor: '#18181b',
    borderRadius: 4,
    fontSize: 16,
    lineHeight: 1.5,
  },
  colorful: {
    headerColor: '#8b5cf6', // Purple
    buttonColor: '#3b82f6', // Blue
    payButtonColor: '#f59e0b', // Amber
    fontFamily: 'Verdana, sans-serif',
    spacing: '20px',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#c4b5fd',
    borderRadius: 12,
    fontSize: 14,
    lineHeight: 1.6,
  },
};