import React, { useState, useEffect } from 'react';
import { FormTemplate, FieldType, FormSubmission, SubmissionStatus, User } from '../types';
import SignaturePad from './SignaturePad';

interface Props {
  template: FormTemplate;
  currentUser: User;
  initialData?: FormSubmission;
  onSubmit: (data: Record<string, any>, status: SubmissionStatus) => void;
  onCancel: () => void;
  readOnly?: boolean;
}

const FormRenderer: React.FC<Props> = ({ template, currentUser, initialData, onSubmit, onCancel, readOnly }) => {
  const [formData, setFormData] = useState<Record<string, any>>(initialData?.data || {});
  const [patientName, setPatientName] = useState(initialData?.patientName || '');

  const handleChange = (fieldId: string, value: any) => {
    if (readOnly) return;
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleFileChange = (fieldId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Convert to Base64 for localstorage demo
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange(fieldId, { name: file.name, data: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const isVisible = (condition?: { fieldId: string, value: string }) => {
    if (!condition) return true;
    return formData[condition.fieldId] === condition.value;
  };

  const handleSubmit = (status: SubmissionStatus) => {
    if (!patientName) return alert('กรุณาระบุชื่อผู้ป่วย');
    
    // Basic validation
    if (status === SubmissionStatus.SUBMITTED) {
      const missing = template.fields
        .filter(f => f.required && isVisible(f.condition) && !formData[f.id])
        .map(f => f.label);
      
      if (missing.length > 0) {
        alert(`กรุณากรอกข้อมูลให้ครบถ้วน: ${missing.join(', ')}`);
        return;
      }
    }
    
    // Pass both data map and patient name is handled by parent constructing submission
    // We hackily attach patientName to the data payload for the parent callback
    onSubmit({ ...formData, _patientName: patientName }, status);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-full">
      <div className="p-6 bg-blue-600 text-white flex justify-between items-center print:bg-white print:text-black print:border-b-2">
        <div>
          <h2 className="text-2xl font-bold">{template.title}</h2>
          <p className="opacity-80 text-sm">{template.description}</p>
        </div>
        <div className="text-right text-xs print:hidden">
          <p>Created: {new Date(template.createdAt).toLocaleDateString()}</p>
          <p>ID: {template.id}</p>
        </div>
      </div>

      <div className="p-8 overflow-y-auto flex-1 space-y-6">
        {/* Meta Section */}
        <div className="bg-gray-50 p-4 rounded border mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-1">ชื่อ-นามสกุล ผู้ป่วย (Patient Name) <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            disabled={readOnly}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="ระบุชื่อผู้ป่วย..."
          />
        </div>

        {template.fields.map(field => {
          if (!isVisible(field.condition)) return null;

          return (
            <div key={field.id} className="mb-4 break-inside-avoid">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>

              {field.type === FieldType.TEXT && (
                <input
                  type="text"
                  value={formData[field.id] || ''}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  disabled={readOnly}
                  className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                />
              )}

              {field.type === FieldType.NUMBER && (
                <input
                  type="number"
                  value={formData[field.id] || ''}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  disabled={readOnly}
                  className="w-full p-2 border rounded w-32"
                />
              )}

              {field.type === FieldType.TEXTAREA && (
                <textarea
                  value={formData[field.id] || ''}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  disabled={readOnly}
                  rows={3}
                  className="w-full p-2 border rounded"
                />
              )}

              {field.type === FieldType.DROPDOWN && (
                <select
                  value={formData[field.id] || ''}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  disabled={readOnly}
                  className="w-full p-2 border rounded bg-white"
                >
                  <option value="">เลือก...</option>
                  {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              )}

              {field.type === FieldType.CHECKBOX && (
                <div className="space-y-2">
                  {field.options?.map(opt => (
                    <label key={opt} className="flex items-center">
                      <input
                        type="radio" // Simplifying to radio for single selection within group for this demo, or checkbox logic needs array handling
                        name={field.id}
                        value={opt}
                        checked={formData[field.id] === opt}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        disabled={readOnly}
                        className="mr-2"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              )}

              {field.type === FieldType.DATE && (
                <input
                  type="date"
                  value={formData[field.id] || ''}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  disabled={readOnly}
                  className="p-2 border rounded"
                />
              )}

              {field.type === FieldType.SIGNATURE && (
                <SignaturePad 
                  value={formData[field.id]}
                  onChange={(val) => handleChange(field.id, val)}
                  disabled={readOnly}
                />
              )}

              {field.type === FieldType.FILE && (
                <div>
                   {formData[field.id] ? (
                     <div className="flex items-center gap-2 p-2 bg-gray-100 rounded">
                       <span className="text-sm truncate max-w-xs">{formData[field.id].name}</span>
                       {!readOnly && <button onClick={() => handleChange(field.id, null)} className="text-red-500 text-xs">ลบ</button>}
                       <a href={formData[field.id].data} download={formData[field.id].name} className="text-blue-500 text-xs underline">ดาวน์โหลด</a>
                     </div>
                   ) : (
                     !readOnly && <input type="file" onChange={(e) => handleFileChange(field.id, e)} className="text-sm" accept="image/*,.pdf" />
                   )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t bg-gray-50 flex justify-between items-center print:hidden">
        <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:text-gray-800">กลับ</button>
        {!readOnly && (
          <div className="space-x-2">
             <button 
              onClick={() => handleSubmit(SubmissionStatus.DRAFT)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              บันทึกร่าง (Draft)
            </button>
            <button 
              onClick={() => handleSubmit(SubmissionStatus.SUBMITTED)}
              className="px-6 py-2 bg-blue-600 text-white font-bold rounded shadow hover:bg-blue-700"
            >
              ส่งข้อมูล (Submit)
            </button>
          </div>
        )}
        {readOnly && (
           <button onClick={() => window.print()} className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800">
             🖨️ พิมพ์ / PDF
           </button>
        )}
      </div>
    </div>
  );
};

export default FormRenderer;
