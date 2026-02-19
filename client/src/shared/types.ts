export interface Product {
  id: number;
  name: string;
}

export interface User {
  id: number;
  name: string;
}

export interface WorkOrder {
  id: number;
  title: string;
  productId: number;
}

export interface ChecklistItem {
  id: number;
  text: string;
  done: boolean;
  releaseHistoryId: number;
  order: number;
}

export interface ReleaseHistory {
  id: number;
  releaseId: number;
  status: string;
  environment: string;
  releaseManagerUserId: number;
  approvedByUserId: number | null;
  dateOfApproval: string | null;
  comment: string | null;
  server: string | null;
  port: number | null;
  releaseDate: string | null;
  releaseNotes: string | null;
  releaseVideo: string | null;
  smokeTestDate: string | null;
  smokeTestResult: string | null;
  createdAt: string;
  releaseManager?: User;
  approvedByUser?: User;
  checklistItems?: ChecklistItem[];
}

export interface Release {
  id: number;
  version: string;
  description: string | null;
  environment: string;
  status: string;
  projectJiraIssue: string | null;
  customerContact: string | null;
  plannedReleaseDate: string | null;
  productId: number | null;
  workOrderId: number | null;
  userId: number | null;
  sortOrder?: number;
  createdAt: string;
  latestStatus?: string;
  product?: Product;
  user?: User;
  workOrder?: WorkOrder;
  histories?: ReleaseHistory[];
  latestHistory?: ReleaseHistory;
  checklistItems?: ChecklistItem[];
}

export interface ReleasesListResponse {
  data: Release[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ReleaseDetailResponse {
  release: Release;
}

export interface ChecklistTemplateItem {
  id: number;
  text: string;
  order: number;
  templateId: number;
}

export interface ChecklistTemplate {
  id: number;
  name: string;
  items?: ChecklistTemplateItem[];
}

export interface ReleaseFormValues {
  version: string;
  description?: string;
  environment: string;
  status: string;
  projectJiraIssue?: string;
  customerContact?: string;
  plannedReleaseDate?: string;
  productId?: string;
  workOrderId?: string;
  userId?: string;
}

export interface HistoryFormValues {
  status: string;
  environment: string;
  releaseManagerUserId: string;
  approvedByUserId?: string;
  dateOfApproval?: string;
  comment?: string;
  server?: string;
  port?: string;
  releaseDate?: string;
  releaseNotes?: string;
  releaseVideo?: string;
  smokeTestDate?: string;
  smokeTestResult?: string;
}
