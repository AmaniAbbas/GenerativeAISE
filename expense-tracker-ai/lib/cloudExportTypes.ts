export type ExportFormat = 'csv' | 'json' | 'excel' | 'pdf';

export type ExportTemplate =
  | 'full-export'
  | 'tax-report'
  | 'monthly-summary'
  | 'category-analysis'
  | 'year-in-review'
  | 'budget-overview';

export type CloudService =
  | 'google-sheets'
  | 'google-drive'
  | 'dropbox'
  | 'onedrive'
  | 'notion'
  | 'email';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';
export type ExportDestination = CloudService | 'download';

export interface CloudIntegration {
  id: CloudService;
  connected: boolean;
  accountEmail?: string;
  lastSync?: string;
  syncStatus: SyncStatus;
  autoSync: boolean;
}

export interface ExportRecord {
  id: string;
  createdAt: string;
  template: ExportTemplate;
  format: ExportFormat;
  destination: ExportDestination;
  status: 'success' | 'pending' | 'failed';
  expenseCount: number;
  sizeBytes?: number;
  filename: string;
}

export interface ScheduledExport {
  id: string;
  label: string;
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  hour: number;
  format: ExportFormat;
  template: ExportTemplate;
  destination: ExportDestination;
  createdAt: string;
  nextRun: string;
  lastRun?: string;
  lastStatus?: 'success' | 'failed';
}

export interface ShareLink {
  id: string;
  code: string;
  createdAt: string;
  expiresAt: string;
  template: ExportTemplate;
  permission: 'view' | 'download';
  accessCount: number;
  active: boolean;
}
