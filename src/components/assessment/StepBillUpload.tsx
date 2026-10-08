import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Zap,
  Building,
  Edit3,
  Calendar,
  IndianRupee,
  ShieldCheck,
} from 'lucide-react';
import { BillData } from '../../types/solar';
import { billExtractionService } from '../../services/billExtractionService';
import { validateBillData } from '../../services/billValidation';

interface StepBillUploadProps {
  initialBillData?: BillData;
  initialConsumption: number;
  initialBillAmount: number;
  onNext: (billData?: BillData, consumption?: number, billAmount?: number) => void;
  onBack: () => void;
}

export const StepBillUpload: React.FC<StepBillUploadProps> = ({
  initialBillData,
  initialConsumption,
  initialBillAmount,
  onNext,
  onBack,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<BillData | undefined>(initialBillData);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editable review fields
  const [editConsumption, setEditConsumption] = useState<number>(
    initialBillData?.monthlyConsumptionKwh || initialConsumption || 250
  );
  const [editBillAmount, setEditBillAmount] = useState<number>(
    initialBillData?.billAmount || initialBillAmount || 2000
  );
  const [editProvider, setEditProvider] = useState<string>(
    initialBillData?.provider || 'State Electricity Distribution Company'
  );
  const [editPeriod, setEditPeriod] = useState<string>(
    initialBillData?.billingPeriod || 'Last 30 Days'
  );

  // Confirmation state
  const [isConfirmed, setIsConfirmed] = useState<boolean>(
    Boolean(initialBillData?.isUserConfirmed)
  );

  // Validation state
  const validation = validateBillData(editConsumption, editBillAmount);

  // Sync state if initialBillData changes
  useEffect(() => {
    if (initialBillData) {
      setEditConsumption(initialBillData.monthlyConsumptionKwh);
      setEditBillAmount(initialBillData.billAmount || Math.round(initialBillData.monthlyConsumptionKwh * 7.8));
      if (initialBillData.provider) setEditProvider(initialBillData.provider);
      if (initialBillData.billingPeriod) setEditPeriod(initialBillData.billingPeriod);
      setIsConfirmed(Boolean(initialBillData.isUserConfirmed));
    }
  }, [initialBillData]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFile = async (selectedFile: File) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    const fileNameLower = (selectedFile.name || '').toLowerCase();
    const hasValidExt = validExtensions.some((ext) => fileNameLower.endsWith(ext));

    if (!validTypes.includes(selectedFile.type) && !hasValidExt) {
      setError('Please upload a valid PDF, JPG, or PNG bill file');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10 MB limit');
      return;
    }

    setError(null);
    setFile(selectedFile);
    setIsProcessing(true);
    setIsConfirmed(false);

    try {
      const result = await billExtractionService.extractBillData(selectedFile);
      setExtractedData(result);
      setEditConsumption(result.monthlyConsumptionKwh);
      setEditBillAmount(result.billAmount || Math.round(result.monthlyConsumptionKwh * 7.8));
      if (result.provider) setEditProvider(result.provider);
      if (result.billingPeriod) setEditPeriod(result.billingPeriod);
    } catch (err: any) {
      setError(err?.message || 'OCR extraction could not parse this document. You can easily enter your bill details manually below.');
      // Prepare fallback manual review
      setExtractedData({
        provider: 'State Electricity Board',
        monthlyConsumptionKwh: editConsumption,
        billAmount: editBillAmount,
        billingPeriod: 'Manual Entry',
        confidence: 0,
        source: 'user_manual',
        isUserConfirmed: false,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setExtractedData(undefined);
    setError(null);
    setIsConfirmed(false);
    setEditConsumption(initialConsumption || 250);
    setEditBillAmount(initialBillAmount || 2000);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmDetails = () => {
    if (!validation.isValid) return;

    setIsConfirmed(true);
  };

  const handleContinue = () => {
    if (!validation.isValid) return;

    const confirmedBillData: BillData = {
      ...(extractedData || {
        confidence: 1.0,
        source: 'user_manual',
      }),
      monthlyConsumptionKwh: validation.sanitizedConsumptionKwh,
      unitsConsumedKwh: validation.sanitizedConsumptionKwh,
      billAmount: validation.sanitizedBillAmount,
      provider: editProvider,
      billingPeriod: editPeriod,
      tariffRate: Math.round((validation.sanitizedBillAmount / validation.sanitizedConsumptionKwh) * 10) / 10,
      tariffRatePerKwh: Math.round((validation.sanitizedBillAmount / validation.sanitizedConsumptionKwh) * 10) / 10,
      isUserConfirmed: true,
      source: extractedData && extractedData.confidence > 0.6 ? 'extracted' : 'user_manual',
    };

    onNext(confirmedBillData, validation.sanitizedConsumptionKwh, validation.sanitizedBillAmount);
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Upload Electricity Bill
          </h2>
          <span className="text-xs px-2.5 py-1 bg-amber-50 text-amber-800 rounded-md font-semibold border border-amber-200">
            OCR & Review
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Our bill adapter extracts consumption history and DISCOM category.
          You can review, edit, or enter details manually if no bill scan is available.
        </p>
      </div>

      {/* Upload Zone */}
      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
            dragActive
              ? 'border-amber-500 bg-amber-50/50 scale-[1.01]'
              : 'border-slate-300 hover:border-amber-400 bg-slate-50/50 hover:bg-white'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />

          <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 shadow-sm">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-base font-bold text-slate-900 mb-1">
            Click to upload or drag & drop bill
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Supports PDF, JPG, or PNG (MSEDCL, BESCOM, BSES, TANGEDCO, UGVCL, etc.) up to 10MB
          </p>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>AWS Textract Adapter Interface Ready</span>
          </div>
        </div>
      ) : (
        /* Selected File Card */
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                  {file.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{formatFileSize(file.size)}</span>
                  <span>•</span>
                  {isProcessing ? (
                    <span className="text-amber-600 font-medium flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Parsing bill document...
                    </span>
                  ) : error ? (
                    <span className="text-rose-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Manual Entry Fallback
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Extracted (Confidence: {Math.round((extractedData?.confidence || 0.9) * 100)}%)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRemove}
              className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="Remove file"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Error / Fallback Notice */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">{error}</p>
            <p className="text-rose-700">
              Your solar assessment is not blocked. You can verify and adjust the details in the review section below.
            </p>
          </div>
        </div>
      )}

      {/* Extraction Review & Manual Confirmation Form */}
      {(file || extractedData) && !isProcessing && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Review & Confirm Bill Details
                </h3>
                <p className="text-xs text-slate-500">
                  Verify or edit extracted figures before calculating solar sizing
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                extractedData && extractedData.confidence >= 0.7
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {extractedData && extractedData.confidence >= 0.7
                  ? `Extracted from bill (${Math.round(extractedData.confidence * 100)}% confidence)`
                  : 'User-provided / Manual Entry'}
              </span>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Field 1: Monthly Consumption */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Monthly Consumption (kWh)
                </label>
                <span className="text-[10px] text-slate-500 font-semibold">Editable</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={editConsumption || ''}
                  onChange={(e) => {
                    setEditConsumption(Number(e.target.value));
                    setIsConfirmed(false);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-bold text-base focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">units</span>
              </div>
            </div>

            {/* Field 2: Bill Amount */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-500" />
                  Monthly Bill Amount (₹)
                </label>
                <span className="text-[10px] text-slate-500 font-semibold">Editable</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  min={0}
                  max={100000}
                  value={editBillAmount || ''}
                  onChange={(e) => {
                    setEditBillAmount(Number(e.target.value));
                    setIsConfirmed(false);
                  }}
                  className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-bold text-base focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>
            </div>

            {/* Field 3: DISCOM Provider */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-500" />
                  Electricity Provider (DISCOM)
                </label>
              </div>
              <input
                type="text"
                value={editProvider}
                onChange={(e) => {
                  setEditProvider(e.target.value);
                  setIsConfirmed(false);
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
              />
            </div>

            {/* Field 4: Billing Period */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Billing Period
                </label>
              </div>
              <input
                type="text"
                value={editPeriod}
                onChange={(e) => {
                  setEditPeriod(e.target.value);
                  setIsConfirmed(false);
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
              />
            </div>
          </div>

          {/* Validation Warnings */}
          {validation.warnings.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1">
              {validation.warnings.map((warn, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{warn}</span>
                </div>
              ))}
            </div>
          )}

          {/* Validation Errors */}
          {validation.errors.length > 0 && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
              {validation.errors.map((errText, i) => (
                <div key={i} className="flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>{errText}</span>
                </div>
              ))}
            </div>
          )}

          {/* Confirm Button */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              {isConfirmed ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Bill details verified & ready for solar engine
                </span>
              ) : (
                'Confirm values to proceed with this bill profile'
              )}
            </span>

            <button
              type="button"
              onClick={handleConfirmDetails}
              disabled={!validation.isValid}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isConfirmed
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isConfirmed ? 'Details Confirmed' : 'Confirm Bill Details'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Manual Fallback Card when no file is uploaded */}
      {!file && !extractedData && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-sm text-slate-900">
                Current Electricity Baseline
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">
              User-provided information
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 font-bold block uppercase text-[10px]">
                Monthly Consumption
              </span>
              <span className="text-base font-black text-slate-900 mt-0.5 block">
                {editConsumption} units / month
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 font-bold block uppercase text-[10px]">
                Estimated Bill
              </span>
              <span className="text-base font-black text-emerald-700 mt-0.5 block">
                ₹{editBillAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-3 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold text-sm transition-colors flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={handleContinue}
          disabled={isProcessing || !validation.isValid}
          className="px-7 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer"
        >
          <span>Continue to Rooftop Photo</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
