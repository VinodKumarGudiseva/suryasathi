import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Maximize2,
  Compass,
  Sun,
  ShieldCheck,
  Edit3,
} from 'lucide-react';
import { RoofAnalysis, RoofSuitability, RoofFactors } from '../../types/solar';
import { roofAnalysisService } from '../../services/roofAnalysisService';
import { DEFAULT_SOLAR_ASSUMPTIONS } from '../../config/solarAssumptions';

interface StepRoofUploadProps {
  initialRoofAnalysis?: RoofAnalysis;
  onNext: (roofAnalysis?: RoofAnalysis, customRoofAreaSqM?: number) => void;
  onBack: () => void;
}

export const StepRoofUpload: React.FC<StepRoofUploadProps> = ({
  initialRoofAnalysis,
  onNext,
  onBack,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<RoofAnalysis | undefined>(initialRoofAnalysis);
  const [customAreaSqFt, setCustomAreaSqFt] = useState<number>(
    initialRoofAnalysis ? initialRoofAnalysis.usableAreaSqFt : 400
  );
  const [isConfirmed, setIsConfirmed] = useState<boolean>(
    Boolean(initialRoofAnalysis?.isUserConfirmed)
  );
  const [isAreaManuallyEdited, setIsAreaManuallyEdited] = useState<boolean>(
    initialRoofAnalysis?.source === 'user_manual'
  );
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if initialRoofAnalysis changes
  useEffect(() => {
    if (initialRoofAnalysis) {
      setCustomAreaSqFt(initialRoofAnalysis.usableAreaSqFt);
      setIsConfirmed(Boolean(initialRoofAnalysis.isUserConfirmed));
      setIsAreaManuallyEdited(initialRoofAnalysis.source === 'user_manual');
    }
  }, [initialRoofAnalysis]);

  // Derived metrics from current customAreaSqFt
  const safeAreaSqFt = Math.max(0, isNaN(customAreaSqFt) ? 0 : customAreaSqFt);
  const currentAreaSqM = Math.round((safeAreaSqFt / 10.764) * 10) / 10;
  const currentPanelCount = Math.floor(currentAreaSqM / DEFAULT_SOLAR_ASSUMPTIONS.panelAreaSqM);
  const currentCapacityKw = Math.max(
    0,
    Math.round(((currentPanelCount * DEFAULT_SOLAR_ASSUMPTIONS.panelEfficiencyWatts) / 1000) * 10) / 10
  );

  // Dynamic suitability based on current area
  const computeCurrentSuitability = (): RoofSuitability => {
    if (currentAreaSqM < DEFAULT_SOLAR_ASSUMPTIONS.areaRequiredPerKwSqM) {
      return 'Not Suitable';
    }
    if (currentAreaSqM < 20.0 || (analysisResult?.factors.obstructions === 'Moderate')) {
      return 'Partially Suitable';
    }
    return 'Suitable';
  };

  const currentSuitability = computeCurrentSuitability();

  const handleFile = async (selectedFile: File) => {
    const validExtensions = ['.jpg', '.jpeg', '.png'];
    const fileNameLower = (selectedFile.name || '').toLowerCase();
    const hasValidExt = validExtensions.some((ext) => fileNameLower.endsWith(ext));
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];

    if (!validTypes.includes(selectedFile.type) && !hasValidExt) {
      setError('Please upload a valid JPG, JPEG, or PNG photograph of your rooftop.');
      return;
    }
    if (selectedFile.size <= 0) {
      setError('Uploaded image file appears to be empty (0 bytes).');
      return;
    }
    if (selectedFile.size > 15 * 1024 * 1024) {
      setError('Image exceeds 15 MB limit. Please upload a standard compressed photo.');
      return;
    }

    setError(null);
    setFile(selectedFile);
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    setIsAnalyzing(true);
    setIsConfirmed(false);
    setIsAreaManuallyEdited(false);

    try {
      const result = await roofAnalysisService.analyzeRoof(selectedFile);
      setAnalysisResult(result);
      setCustomAreaSqFt(result.usableAreaSqFt);
    } catch (err: any) {
      setError(err?.message || 'Failed to analyze rooftop photo. You can continue with manual area adjustment.');
    } finally {
      setIsAnalyzing(false);
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
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setAnalysisResult(undefined);
    setError(null);
    setIsConfirmed(false);
    setIsAreaManuallyEdited(false);
    setCustomAreaSqFt(400);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAreaChange = (newSqFt: number) => {
    const sanitized = Math.max(0, isNaN(newSqFt) ? 0 : newSqFt);
    setCustomAreaSqFt(sanitized);
    setIsAreaManuallyEdited(true);
    setIsConfirmed(false);
  };

  const handleConfirmAssessment = () => {
    if (safeAreaSqFt <= 0) {
      setError('Please enter a valid rooftop area greater than 0 sq.ft.');
      return;
    }
    setError(null);
    setIsConfirmed(true);
  };

  const handleContinue = () => {
    if (safeAreaSqFt <= 0 || !isConfirmed) {
      setError('Please enter a valid rooftop area greater than 0 sq.ft.');
      return;
    }

    const source = isAreaManuallyEdited || !file ? 'user_manual' : 'ai_assisted_estimate';
    const factors: RoofFactors = analysisResult?.factors || {
      estimatedUsableArea: `${currentAreaSqM} m² (~${safeAreaSqFt} sq.ft)`,
      obstructions: currentAreaSqM < 15 ? 'Moderate' : 'None/Minimal',
      shading: currentAreaSqM < 15 ? 'Moderate' : 'Minimal (Favorable)',
      orientation: 'Favorable (South/South-West)',
    };

    let explanation = '';
    if (currentSuitability === 'Not Suitable') {
      explanation = `Available terrace area (${currentAreaSqM} m²) is below the minimum ~${DEFAULT_SOLAR_ASSUMPTIONS.areaRequiredPerKwSqM} m² required for standard 1 kW residential installation.`;
    } else if (currentSuitability === 'Partially Suitable') {
      explanation = `Terrace supports approximately ${currentCapacityKw} kW. Moderate shadow obstructions or roof size observed.`;
    } else {
      explanation = `Spacious terrace with approximately ${safeAreaSqFt} sq.ft usable area, supporting up to ${currentCapacityKw} kW.`;
    }

    const confirmedAnalysis: RoofAnalysis = {
      suitability: currentSuitability,
      usableAreaSqM: currentAreaSqM,
      usableAreaSqFt: safeAreaSqFt,
      estimatedPanelCount: currentPanelCount,
      estimatedCapacityKw: currentCapacityKw,
      confidence: file && !isAreaManuallyEdited ? (analysisResult?.confidence || 0.90) : 1.0,
      factors,
      explanation,
      source,
      roofType: analysisResult?.roofType || 'RCC Flat Concrete',
      shadingAssessment: factors.shading,
      orientation: factors.orientation,
      isUserConfirmed: true,
    };

    onNext(confirmedAnalysis, currentAreaSqM);
  };

  const getSuitabilityBadge = (suitability: RoofSuitability) => {
    switch (suitability) {
      case 'Suitable':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Suitable for Solar
          </span>
        );
      case 'Partially Suitable':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Partially Suitable (Moderate Area/Shade)
          </span>
        );
      case 'Not Suitable':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Not Suitable (Area below 1 kW requirement)
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Rooftop & Terrace Assessment
          </h2>
          <span className="text-xs px-2.5 py-1 bg-amber-50 text-amber-800 rounded-md font-semibold border border-amber-200">
            AI-Assisted Estimate
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Upload a photograph of your terrace to estimate usable shadow-free area and panel limits.
          You can review and manually adjust the square footage before running solar analysis.
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
            accept=".jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />

          <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 shadow-sm">
            <ImageIcon className="w-8 h-8" />
          </div>

          <h3 className="text-base font-bold text-slate-900 mb-1">
            Click to upload or drag & drop terrace photo
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Supports JPG, JPEG, or PNG photos taken from terrace entrance or overhead view (up to 15MB)
          </p>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>SageMaker CV Segmentation Adapter Interface Ready</span>
          </div>
        </div>
      ) : (
        /* Image Preview Card */
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Rooftop preview"
                  className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                />
              )}
              <div>
                <p className="text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                  {file.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  {isAnalyzing ? (
                    <span className="text-amber-600 font-medium flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Analyzing terrace surface & shading...
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Analysis complete
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRemove}
              className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors self-end sm:self-auto"
              title="Remove image"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Review Rooftop Estimate Card */}
      {!isAnalyzing && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Review Rooftop Estimate & Constraints
                </h3>
                <p className="text-xs text-slate-500">
                  AI-assisted estimate • Usable area directly limits maximum solar system capacity
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getSuitabilityBadge(currentSuitability)}
              <span className={`text-[11px] px-2.5 py-1 rounded-md font-semibold ${
                isAreaManuallyEdited || !file
                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                  : 'bg-slate-100 text-slate-700'
              }`}>
                {isAreaManuallyEdited || !file ? 'User-provided Area' : 'AI-Assisted Estimate'}
              </span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider block">
                Usable Area
              </span>
              <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                {currentAreaSqM} <span className="text-xs font-normal">m²</span>
              </div>
              <span className="text-[11px] text-slate-600">~{safeAreaSqFt} sq.ft</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider block">
                Estimated Panels
              </span>
              <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                {currentPanelCount} <span className="text-xs font-normal">modules</span>
              </div>
              <span className="text-[11px] text-slate-600">540W Mono PERC</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider block">
                Max Roof Capacity
              </span>
              <div className="text-base sm:text-lg font-black text-emerald-700 mt-0.5">
                {currentCapacityKw} <span className="text-xs font-normal">kW</span>
              </div>
              <span className="text-[11px] text-slate-600">Physical roof ceiling</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider block">
                Orientation & Shading
              </span>
              <div className="text-xs font-bold text-slate-800 mt-1 truncate">
                {analysisResult?.factors?.shading || (currentAreaSqM < 15 ? 'Moderate' : 'Minimal (Favorable)')}
              </div>
              <span className="text-[11px] text-slate-500">
                {analysisResult?.factors?.orientation || 'Favorable'}
              </span>
            </div>
          </div>

          {/* Key Factors Inspection */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Key Site Factors (Approximate)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Obstructions:</span>
                <span className="font-semibold text-slate-800">
                  {analysisResult?.factors?.obstructions || (currentAreaSqM < 15 ? 'Moderate' : 'None/Minimal')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Sunlight / Shade:</span>
                <span className="font-semibold text-slate-800">
                  {analysisResult?.factors?.shading || (currentAreaSqM < 15 ? 'Moderate' : 'Minimal (Favorable)')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Azimuth Orientation:</span>
                <span className="font-semibold text-slate-800">
                  {analysisResult?.factors?.orientation || 'Favorable (South/South-West)'}
                </span>
              </div>
            </div>
          </div>

          {/* Manual Rooftop Area Adjustment Slider */}
          <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Maximize2 className="w-4 h-4 text-amber-500" />
                Adjust Usable Terrace Area (Square Feet)
              </label>
              <span className="text-xs text-slate-600 font-medium">
                ≈ {currentAreaSqM} m² ({safeAreaSqFt} sq.ft)
              </span>
            </div>

            <div className="flex items-center gap-4">
              <input
                type="range"
                min={50}
                max={2000}
                step={25}
                value={safeAreaSqFt}
                onChange={(e) => handleAreaChange(Number(e.target.value))}
                className="flex-1 accent-amber-500 cursor-pointer"
              />
              <div className="relative w-28">
                <input
                  type="number"
                  min={10}
                  max={10000}
                  value={safeAreaSqFt || ''}
                  onChange={(e) => handleAreaChange(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm font-bold text-center focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
                <span className="absolute right-2 top-2 text-[10px] text-slate-500">sq.ft</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-600">
              Benchmark requirement: ~9.3 m² (~100 sq.ft) per 1 kW system capacity.
            </p>
          </div>

          {/* Confirmation Action */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-2 gap-3">
            <span className="text-xs text-slate-500">
              {isConfirmed ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Rooftop area confirmed for solar calculation
                </span>
              ) : (
                'Review and confirm usable area to enforce physical roof limits in solar sizing'
              )}
            </span>

            <button
              type="button"
              onClick={handleConfirmAssessment}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isConfirmed
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isConfirmed ? 'Area Confirmed' : 'Use this area for my solar plan'}</span>
            </button>
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
          disabled={isAnalyzing || safeAreaSqFt <= 0}
          className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer"
        >
          <span>Analyze Solar Potential</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
