export type LogoPosition = 'left' | 'center' | 'right';
export type TableStyle = 'simple' | 'bordered' | 'striped';
export type StylePresetName = 'modern' | 'classic' | 'minimal' | 'bold' | 'colorful';
export type BorderStyle = 'none' | 'solid' | 'dashed' | 'dotted' | 'double';

export interface InvoiceStyles {
  headerColor: string;
  buttonColor: string;
  payButtonColor: string;
  fontFamily: string;
  spacing: string;
}

export interface InvoiceLayout {
  showLogo: boolean;
  logoPosition: LogoPosition;
  logoUrl?: string;
  showHeaderImage: boolean;
  headerImageUrl: string;
  showCompanyDetails: boolean;
  showClientDetails: boolean;
  showPaymentButton: boolean;
  showFooter: boolean;
  tableStyle: TableStyle;
  borderStyle: BorderStyle;
  borderWidth: number;
  borderColor: string;
  borderRadius: number;
  fontSize: number;
  lineHeight: number;
  headerSpacing: number;
  contentSpacing: number;
  footerSpacing: number;
}
