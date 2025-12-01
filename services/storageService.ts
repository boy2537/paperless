import { FormTemplate, FormSubmission, User, UserRole, SubmissionStatus } from '../types';

// Initial Mock Data
const MOCK_USER: User = {
  id: 'u1',
  name: 'พยาบาล สมศรี (Staff)',
  role: UserRole.STAFF,
  department: 'ER'
};

const STORAGE_KEYS = {
  TEMPLATES: 'mediform_templates',
  SUBMISSIONS: 'mediform_submissions',
  USER: 'mediform_current_user'
};

export const StorageService = {
  // User Management
  getCurrentUser: (): User => {
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    return stored ? JSON.parse(stored) : MOCK_USER;
  },
  
  switchUser: (role: UserRole) => {
    let newUser: User;
    switch(role) {
      case UserRole.ADMIN:
        newUser = { id: 'admin1', name: 'Admin Somchai', role: UserRole.ADMIN, department: 'IT' };
        break;
      case UserRole.APPROVER:
        newUser = { id: 'doc1', name: 'นพ. สมศักดิ์ (Director)', role: UserRole.APPROVER, department: 'Management' };
        break;
      default:
        newUser = { id: 'staff1', name: 'พยาบาล สมศรี (Staff)', role: UserRole.STAFF, department: 'ER' };
    }
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
    window.location.reload(); // Simple reload to reset app state
  },

  // Template Management
  saveTemplate: (template: FormTemplate) => {
    const templates = StorageService.getTemplates();
    const existingIndex = templates.findIndex(t => t.id === template.id);
    if (existingIndex >= 0) {
      templates[existingIndex] = template;
    } else {
      templates.push(template);
    }
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  },

  getTemplates: (): FormTemplate[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    return stored ? JSON.parse(stored) : [];
  },

  getTemplateById: (id: string): FormTemplate | undefined => {
    return StorageService.getTemplates().find(t => t.id === id);
  },

  // Submission Management
  saveSubmission: (submission: FormSubmission) => {
    const submissions = StorageService.getSubmissions();
    const existingIndex = submissions.findIndex(s => s.id === submission.id);
    
    if (existingIndex >= 0) {
      submissions[existingIndex] = submission;
    } else {
      submissions.push(submission);
    }
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
  },

  getSubmissions: (): FormSubmission[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
    return stored ? JSON.parse(stored) : [];
  },

  updateStatus: (id: string, status: SubmissionStatus, user: User, comment?: string) => {
    const submissions = StorageService.getSubmissions();
    const sub = submissions.find(s => s.id === id);
    if (sub) {
      sub.status = status;
      sub.auditLogs.push({
        action: `Status changed to ${status}`,
        by: user.name,
        at: Date.now(),
        comment
      });
      StorageService.saveSubmission(sub);
    }
  }
};
