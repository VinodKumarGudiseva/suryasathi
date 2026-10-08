import React, { useState } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  Circle,
  AlertCircle,
  FileText,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { DocumentItem } from '../../types/solar';

interface DocumentChecklistProps {
  documents: DocumentItem[];
}

export const DocumentChecklist: React.FC<DocumentChecklistProps> = ({ documents }) => {
  const [checkedIds, setCheckedIds] = useState<{ [key: string]: boolean }>({});

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const requiredDocs = documents.filter((d) => d.category === 'Required');
  const recommendedDocs = documents.filter((d) => d.category === 'Recommended');
  const nextStepDocs = documents.filter((d) => d.category === 'Next step');

  const renderCategory = (title: string, list: DocumentItem[], categoryColor: string) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${categoryColor}`} />
        <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
          {title} ({list.length})
        </h4>
      </div>

      <div className="space-y-2.5">
        {list.map((doc) => {
          const isChecked = Boolean(checkedIds[doc.id]);

          return (
            <div
              key={doc.id}
              onClick={() => toggleCheck(doc.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                isChecked
                  ? 'bg-emerald-50/60 border-emerald-300'
                  : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isChecked ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300" />
                )}
              </div>

              <div className="space-y-1 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span
                    className={`font-bold text-sm ${
                      isChecked ? 'text-emerald-900 line-through' : 'text-slate-900'
                    }`}
                  >
                    {doc.name}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md self-start sm:self-auto">
                    Source: {doc.officialSource}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {doc.description}
                </p>
                {doc.tips && (
                  <p className="text-[11px] text-amber-800 bg-amber-50/70 p-2 rounded-lg border border-amber-200/60">
                    💡 <strong>Tip:</strong> {doc.tips}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <ClipboardCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Personalized Document Checklist & Readiness
            </h3>
            <p className="text-xs text-slate-500">
              Keep these ready before registering on pmsuryaghar.gov.in
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Checked: {Object.values(checkedIds).filter(Boolean).length} / {documents.length}
        </div>
      </div>

      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          <strong>Guidance Note:</strong> This checklist is provided for user guidance. Please verify exact DISCOM verification requirements on the National Portal.
        </span>
      </div>

      <div className="space-y-6">
        {requiredDocs.length > 0 &&
          renderCategory('Required Documents', requiredDocs, 'bg-rose-500')}

        {recommendedDocs.length > 0 &&
          renderCategory('Recommended for Smooth Approval', recommendedDocs, 'bg-amber-500')}

        {nextStepDocs.length > 0 &&
          renderCategory('Next Step Documents', nextStepDocs, 'bg-blue-500')}
      </div>
    </div>
  );
};
