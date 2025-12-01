import React, { useState } from 'react';
import { FormField, FieldType, FormTemplate } from '../types';
import { generateFormSchema } from '../services/geminiService';

interface Props {
  onSave: (template: FormTemplate) => void;
  onCancel: () => void;
  currentUser: string;
}

const FormBuilder: React.FC<Props> = ({ onSave, onCancel, currentUser }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type,
      label: `New ${type}`,
      required: false,
      options: type === FieldType.DROPDOWN || type === FieldType.CHECKBOX ? ['Option 1', 'Option 2'] : undefined
    };
    setFields([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    const generatedFields = await generateFormSchema(aiPrompt);
    setFields([...fields, ...generatedFields]);
    setIsGenerating(false);
  };

  const handleSave = () => {
    if (!title) return alert('Please enter a form title');
    const template: FormTemplate = {
      id: `tmpl_${Date.now()}`,
      title,
      description,
      fields,
      createdBy: currentUser,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    onSave(template);
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center bg-blue-600 text-white rounded-t-lg">
        <h2 className="text-xl font-bold">สร้างแบบฟอร์มใหม่ (Form Builder)</h2>
        <div className="space-x-2">
          <button onClick={onCancel} className="px-4 py-2 text-sm bg-blue-700 hover:bg-blue-800 rounded">ยกเลิก</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm bg-white text-blue-600 font-bold rounded hover:bg-gray-100">บันทึกฟอร์ม</button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Sidebar Controls */}
        <div className="w-full md:w-64 bg-gray-50 border-r p-4 overflow-y-auto">
          
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-2">🤖 Gemini AI Generator</h3>
            <textarea 
              className="w-full p-2 text-sm border rounded mb-2 h-20"
              placeholder="เช่น แบบฟอร์มซักประวัติผู้ป่วยนอก มีชื่อ อาการ และสัญญาณชีพ..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
            />
            <button 
              onClick={handleAiGenerate}
              disabled={isGenerating || !aiPrompt}
              className="w-full py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-bold rounded shadow-sm hover:from-purple-600 hover:to-indigo-700 flex justify-center items-center"
            >
              {isGenerating ? 'กำลังสร้าง...' : '✨ สร้างด้วย AI'}
            </button>
          </div>

          <h3 className="text-sm font-bold text-gray-700 mb-2">เครื่องมือ (Fields)</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(FieldType).map(type => (
              <button
                key={type}
                onClick={() => addField(type)}
                className="p-2 bg-white border rounded text-xs hover:bg-blue-50 hover:border-blue-300 text-left capitalize"
              >
                + {type}
              </button>
            ))}
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 p-6 overflow-y-auto bg-gray-100">
          <div className="max-w-3xl mx-auto bg-white shadow-lg p-8 min-h-[500px] rounded">
            <input 
              type="text" 
              placeholder="ชื่อแบบฟอร์ม"
              className="w-full text-3xl font-bold border-b-2 border-gray-200 focus:border-blue-500 outline-none pb-2 mb-4"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input 
              type="text" 
              placeholder="คำอธิบายแบบฟอร์ม"
              className="w-full text-gray-500 border-none focus:ring-0 mb-8"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="space-y-4">
              {fields.length === 0 && (
                <div className="text-center py-12 text-gray-400 border-2 border-dashed rounded-lg">
                  เพิ่มฟิลด์จากด้านซ้าย หรือใช้ AI สร้างให้
                </div>
              )}
              {fields.map((field, index) => (
                <div key={field.id} className="group relative border rounded-lg p-4 bg-gray-50 hover:bg-white hover:shadow-md transition-all">
                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => removeField(field.id)} className="text-red-500 hover:bg-red-50 p-1 rounded">🗑️</button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Label</label>
                      <input 
                        type="text" 
                        value={field.label} 
                        onChange={(e) => updateField(field.id, { label: e.target.value })}
                        className="w-full p-2 border rounded text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Type</label>
                      <select 
                        value={field.type} 
                        onChange={(e) => updateField(field.id, { type: e.target.value as FieldType })}
                        className="w-full p-2 border rounded text-sm bg-white"
                      >
                        {Object.values(FieldType).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Field Specific Options */}
                  <div className="flex items-center gap-4 mt-2">
                    <label className="flex items-center text-sm text-gray-600">
                      <input 
                        type="checkbox" 
                        checked={field.required} 
                        onChange={(e) => updateField(field.id, { required: e.target.checked })}
                        className="mr-2"
                      />
                      จำเป็น (Required)
                    </label>
                  </div>

                  {(field.type === FieldType.DROPDOWN || field.type === FieldType.CHECKBOX) && (
                    <div className="mt-2">
                      <label className="text-xs font-bold text-gray-500 uppercase">ตัวเลือก (คั่นด้วย comma)</label>
                      <input 
                        type="text" 
                        value={field.options?.join(', ')} 
                        onChange={(e) => updateField(field.id, { options: e.target.value.split(',').map(s => s.trim()) })}
                        className="w-full p-2 border rounded text-sm"
                        placeholder="Option 1, Option 2, Option 3"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormBuilder;
