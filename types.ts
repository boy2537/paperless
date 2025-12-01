export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  APPROVER = 'APPROVER'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  department: string;
}

export enum FieldType {
  TEXT = 'text',
  NUMBER = 'number',
  TEXTAREA = 'textarea',
  DROPDOWN = 'dropdown',
  CHECKBOX = 'checkbox',
  DATE = 'date',
  SIGNATURE = 'signature',
  FILE = 'file'
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required?: boolean;
  options?: string[]; // For dropdown/checkbox
  placeholder?: string;
  condition?: {
    fieldId: string;
    value: string;
  };
}

export interface FormTemplate {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export enum SubmissionStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  REVIEWED = 'REVIEWED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface AuditLog {
  action: string;
  by: string; // User Name
  at: number;
  comment?: string;
}

export interface FormSubmission {
  id: string;
  templateId: string;
  templateTitle: string;
  data: Record<string, any>; // fieldId: value
  status: SubmissionStatus;
  submittedBy: User; // Snapshot of user info
  submittedAt: number;
  patientName: string; // Key identifier for searching
  auditLogs: AuditLog[];
}
