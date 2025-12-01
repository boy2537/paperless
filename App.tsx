import React, { useState, useEffect } from 'react';
import { UserRole, User, FormTemplate, FormSubmission, SubmissionStatus } from './types';
import { StorageService } from './services/storageService';
import FormBuilder from './components/FormBuilder';
import FormRenderer from './components/FormRenderer';

// Icons
const Icons = {
  Home: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  Plus: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  List: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
  Check: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  User: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
};

enum View {
  DASHBOARD,
  FORM_BUILDER,
  FORM_FILLER,
  FORM_VIEWER,
  SUBMISSION_LIST
}

const App: React.FC = () => {
  const [user, setUser] = useState<User>(StorageService.getCurrentUser());
  const [view, setView] = useState<View>(View.DASHBOARD);
  
  // State for Navigation handling
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);

  useEffect(() => {
    refreshData();
  }, [view]);

  const refreshData = () => {
    setTemplates(StorageService.getTemplates());
    setSubmissions(StorageService.getSubmissions());
  };

  const handleCreateForm = () => {
    setView(View.FORM_BUILDER);
  };

  const handleSaveTemplate = (template: FormTemplate) => {
    StorageService.saveTemplate(template);
    refreshData();
    setView(View.DASHBOARD);
  };

  const handleFillForm = (template: FormTemplate) => {
    setSelectedTemplate(template);
    setSelectedSubmission(null);
    setView(View.FORM_FILLER);
  };

  const handleViewSubmission = (sub: FormSubmission) => {
    const tmpl = StorageService.getTemplateById(sub.templateId);
    if (tmpl) {
      setSelectedTemplate(tmpl);
      setSelectedSubmission(sub);
      setView(View.FORM_VIEWER);
    }
  };

  const handleSubmitForm = (data: any, status: SubmissionStatus) => {
    if (!selectedTemplate) return;

    // Extract patient name from hacky data payload
    const patientName = data._patientName;
    const cleanData = { ...data };
    delete cleanData._patientName;

    const newSubmission: FormSubmission = {
      id: selectedSubmission ? selectedSubmission.id : `sub_${Date.now()}`,
      templateId: selectedTemplate.id,
      templateTitle: selectedTemplate.title,
      data: cleanData,
      status: status,
      submittedBy: user,
      submittedAt: Date.now(),
      patientName: patientName,
      auditLogs: selectedSubmission ? selectedSubmission.auditLogs : []
    };
    
    // Add log
    newSubmission.auditLogs.push({
      action: selectedSubmission ? 'Updated' : 'Created',
      by: user.name,
      at: Date.now()
    });

    StorageService.saveSubmission(newSubmission);
    refreshData();
    setView(View.SUBMISSION_LIST);
  };

  const handleApproval = (id: string, status: SubmissionStatus) => {
    StorageService.updateStatus(id, status, user);
    refreshData();
    if (selectedSubmission && selectedSubmission.id === id) {
        setView(View.SUBMISSION_LIST); // Close viewer
    }
  };

  const exportCSV = () => {
    const headers = ['ID', 'Form', 'Patient', 'Status', 'Date', 'By'];
    const rows = submissions.map(s => [
      s.id, s.templateTitle, s.patientName, s.status, new Date(s.submittedAt).toLocaleDateString(), s.submittedBy.name
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "mediform_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- RENDER HELPERS ---

  const renderDashboard = () => (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">ยินดีต้อนรับ, {user.name}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="text-gray-500 text-sm">แบบฟอร์มทั้งหมด</div>
          <div className="text-3xl font-bold">{templates.length}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="text-gray-500 text-sm">ส่งแล้ว (เดือนนี้)</div>
          <div className="text-3xl font-bold">{submissions.filter(s => s.status === SubmissionStatus.SUBMITTED).length}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="text-gray-500 text-sm">รออนุมัติ</div>
          <div className="text-3xl font-bold">{submissions.filter(s => s.status === SubmissionStatus.SUBMITTED).length}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-4">แบบฟอร์มที่มีอยู่</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button 
             onClick={handleCreateForm}
             className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors"
          >
            <Icons.Plus />
            <span className="mt-2 font-medium">สร้างฟอร์มใหม่</span>
          </button>
          {templates.map(tmpl => (
            <div key={tmpl.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50">
              <h3 className="font-bold text-lg truncate">{tmpl.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-2">{tmpl.description}</p>
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={() => handleFillForm(tmpl)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  กรอกข้อมูล
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSubmissionList = () => {
    // Filter logic based on role
    let displaySubs = submissions;
    if (user.role === UserRole.STAFF) {
        // Staff sees their own or draft
        displaySubs = submissions.filter(s => s.submittedBy.id === user.id || s.status === SubmissionStatus.DRAFT);
    }

    return (
      <div className="p-6 h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">รายการที่ส่ง (Submissions)</h1>
          <button onClick={exportCSV} className="text-sm bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700">Export CSV</button>
        </div>
        
        <div className="bg-white shadow rounded-lg overflow-hidden flex-1 overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ผู้ป่วย</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">แบบฟอร์ม</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displaySubs.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500">ไม่พบข้อมูล</td></tr>
              )}
              {displaySubs.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{sub.patientName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.templateTitle}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${sub.status === SubmissionStatus.APPROVED ? 'bg-green-100 text-green-800' : 
                        sub.status === SubmissionStatus.REJECTED ? 'bg-red-100 text-red-800' : 
                        sub.status === SubmissionStatus.DRAFT ? 'bg-gray-100 text-gray-800' : 
                        'bg-yellow-100 text-yellow-800'}`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(sub.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleViewSubmission(sub)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      ดูรายละเอียด
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSidebar = () => (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-full shrink-0 print:hidden">
      <div className="p-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          🏥 MediForm
        </h1>
        <div className="mt-4 p-3 bg-slate-800 rounded-lg">
          <p className="text-xs text-slate-400 uppercase">Current User</p>
          <p className="font-bold truncate">{user.name}</p>
          <p className="text-xs text-blue-400">{user.role}</p>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        <button 
          onClick={() => setView(View.DASHBOARD)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === View.DASHBOARD ? 'bg-blue-600' : 'hover:bg-slate-800'}`}
        >
          <Icons.Home /> Dashboard
        </button>
        <button 
          onClick={() => setView(View.SUBMISSION_LIST)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === View.SUBMISSION_LIST ? 'bg-blue-600' : 'hover:bg-slate-800'}`}
        >
          <Icons.List /> รายการฟอร์ม
        </button>
        {/* Approver Only Link */}
        {user.role === UserRole.APPROVER && (
           <button 
             onClick={() => setView(View.SUBMISSION_LIST)} // Ideally a separate filter view
             className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-yellow-400"
           >
             <Icons.Check /> รออนุมัติ
           </button>
        )}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <p className="text-xs text-slate-500 mb-2">Switch Role (Demo)</p>
        <div className="flex gap-2">
          <button onClick={() => StorageService.switchUser(UserRole.STAFF)} className="flex-1 text-xs bg-slate-700 p-1 rounded hover:bg-slate-600">Staff</button>
          <button onClick={() => StorageService.switchUser(UserRole.APPROVER)} className="flex-1 text-xs bg-slate-700 p-1 rounded hover:bg-slate-600">Admin</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-slate-50">
      {renderSidebar()}
      
      <main className="flex-1 overflow-hidden relative">
        {view === View.DASHBOARD && renderDashboard()}
        
        {view === View.FORM_BUILDER && (
          <div className="absolute inset-0 z-10 bg-white">
            <FormBuilder 
              currentUser={user.id}
              onSave={handleSaveTemplate}
              onCancel={() => setView(View.DASHBOARD)}
            />
          </div>
        )}

        {view === View.FORM_FILLER && selectedTemplate && (
          <div className="absolute inset-0 z-10 bg-gray-100 p-4">
            <FormRenderer 
              template={selectedTemplate}
              currentUser={user}
              initialData={selectedSubmission || undefined}
              onSubmit={handleSubmitForm}
              onCancel={() => setView(View.DASHBOARD)}
            />
          </div>
        )}

        {view === View.SUBMISSION_LIST && renderSubmissionList()}

        {view === View.FORM_VIEWER && selectedTemplate && selectedSubmission && (
          <div className="absolute inset-0 z-10 bg-gray-100 p-4 flex flex-col md:flex-row gap-4">
            <div className="flex-1 h-full overflow-hidden rounded-lg shadow-lg">
                <FormRenderer 
                    template={selectedTemplate}
                    currentUser={user}
                    initialData={selectedSubmission}
                    onSubmit={handleSubmitForm} // Allows editing if draft
                    onCancel={() => setView(View.SUBMISSION_LIST)}
                    readOnly={selectedSubmission.status !== SubmissionStatus.DRAFT}
                />
            </div>
            {/* Sidebar for Approval/Audit Log */}
            <div className="w-full md:w-80 bg-white rounded-lg shadow-lg p-4 flex flex-col print:hidden overflow-y-auto">
               <h3 className="font-bold text-lg mb-4">สถานะ: {selectedSubmission.status}</h3>
               
               {user.role === UserRole.APPROVER && selectedSubmission.status === SubmissionStatus.SUBMITTED && (
                   <div className="mb-6 p-4 bg-yellow-50 rounded border border-yellow-200">
                       <h4 className="font-bold text-sm mb-2">การอนุมัติ</h4>
                       <div className="flex gap-2">
                           <button 
                            onClick={() => handleApproval(selectedSubmission.id, SubmissionStatus.APPROVED)}
                            className="flex-1 bg-green-500 text-white py-2 rounded text-sm hover:bg-green-600"
                           >
                               อนุมัติ
                           </button>
                           <button 
                            onClick={() => handleApproval(selectedSubmission.id, SubmissionStatus.REJECTED)}
                            className="flex-1 bg-red-500 text-white py-2 rounded text-sm hover:bg-red-600"
                           >
                               ไม่อนุมัติ
                           </button>
                       </div>
                   </div>
               )}

               <div className="flex-1">
                   <h4 className="font-bold text-sm text-gray-500 mb-2">ประวัติการทำงาน (Audit Log)</h4>
                   <div className="space-y-3">
                       {selectedSubmission.auditLogs.map((log, idx) => (
                           <div key={idx} className="text-xs border-l-2 border-gray-300 pl-3 py-1">
                               <p className="font-semibold">{log.action}</p>
                               <p className="text-gray-500">โดย: {log.by}</p>
                               <p className="text-gray-400">{new Date(log.at).toLocaleString()}</p>
                               {log.comment && <p className="italic text-gray-600 mt-1">"{log.comment}"</p>}
                           </div>
                       ))}
                   </div>
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
