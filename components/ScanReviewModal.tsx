// components/ScanReviewModal.tsx
"use client";

import { useState } from "react";
import type { ScanResult, MedicationItem } from "@/lib/types";
import {
  Sparkles,
  AlertTriangle,
  X,
  Check,
  FileText,
  Pill,
  Heart,
  Activity,
  ChevronDown,
  HelpCircle,
  EyeOff,
} from "lucide-react";

interface Props {
  scanResult: ScanResult;
  onApply: (data: {
    conditions: string[];
    medications: string[];
    allergies: string[];
  }) => void;
  onCancel: () => void;
}

export function formatMedication(m: MedicationItem): string {
  const parts: string[] = [];
  if (m.name) parts.push(m.name);
  if (m.dose) parts.push(m.dose);
  let base = parts.join(" ").trim();
  if (m.frequency) {
    base = `${base} (${m.frequency})`.trim();
  }
  return base;
}

export default function ScanReviewModal({ scanResult, onApply, onCancel }: Props) {
  const [tickedConditions, setTickedConditions] = useState<boolean[]>(
    () => scanResult.conditions.map(() => true)
  );
  const [tickedMedications, setTickedMedications] = useState<boolean[]>(
    () => scanResult.medications.map(() => true)
  );
  const [tickedAllergies, setTickedAllergies] = useState<boolean[]>(
    () => scanResult.allergies.map(() => true)
  );

  const [openConditionHelp, setOpenConditionHelp] = useState<Record<number, boolean>>({});
  const [openMedicationHelp, setOpenMedicationHelp] = useState<Record<number, boolean>>({});

  function toggleCondition(index: number) {
    setTickedConditions((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }

  function toggleMedication(index: number) {
    setTickedMedications((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }

  function toggleAllergy(index: number) {
    setTickedAllergies((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }

  function toggleConditionHelp(idx: number) {
    setOpenConditionHelp((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  }

  function toggleMedicationHelp(idx: number) {
    setOpenMedicationHelp((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  }

  function handleAdd() {
    const selectedConditions = scanResult.conditions
      .filter((_, i) => tickedConditions[i])
      .map((c) => c.name);

    const selectedMedications = scanResult.medications
      .filter((_, i) => tickedMedications[i])
      .map(formatMedication);

    const selectedAllergies = scanResult.allergies.filter((_, i) => tickedAllergies[i]);

    onApply({
      conditions: selectedConditions,
      medications: selectedMedications,
      allergies: selectedAllergies,
    });
  }

  const totalDetected =
    scanResult.conditions.length +
    scanResult.medications.length +
    scanResult.allergies.length;

  const totalSelected =
    tickedConditions.filter(Boolean).length +
    tickedMedications.filter(Boolean).length +
    tickedAllergies.filter(Boolean).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="scan-review-title"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4"
    >
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h2 id="scan-review-title" className="text-base font-black text-gray-900 leading-tight">
                Scanned Medical Details
              </h2>
              <p className="text-xs text-gray-500">Untick any items you don&apos;t want to add</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="px-5 py-4 overflow-y-auto space-y-4">
          {/* Prominent Required AI Disclaimer Note */}
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-900 px-3.5 py-3 rounded-2xl text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              AI-generated, may contain mistakes. Please check before saving. Ask your doctor or pharmacist if unsure.
            </span>
          </div>

          {/* "What is this document?" Card */}
          {(scanResult.documentType || scanResult.summary) && (
            <div className="bg-indigo-50/80 border border-indigo-100 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-indigo-900 text-xs font-black uppercase tracking-wider">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>What is this document?</span>
                </div>
                {scanResult.documentType && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200/60">
                    {scanResult.documentType}
                  </span>
                )}
              </div>
              {scanResult.summary ? (
                <p className="text-xs text-indigo-950 leading-relaxed font-normal">
                  {scanResult.summary}
                </p>
              ) : (
                <p className="text-xs text-indigo-900/60 italic">
                  No summary available for this document.
                </p>
              )}
            </div>
          )}

          {/* Document Alerts (if extracted) */}
          {scanResult.alerts && scanResult.alerts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-red-800 text-xs font-bold uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Document Alerts</span>
              </div>
              <ul className="space-y-1">
                {scanResult.alerts.map((alert, i) => (
                  <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                    <span>{alert}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Unclear items note */}
          {scanResult.unclear && scanResult.unclear.length > 0 && (
            <div className="flex items-start gap-2 bg-gray-100/90 border border-gray-200 text-gray-700 px-3.5 py-2.5 rounded-2xl text-xs">
              <EyeOff className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <span className="font-bold text-gray-900">Could not read clearly: </span>
                <span>{scanResult.unclear.join(", ")}</span>
              </div>
            </div>
          )}

          {/* Empty State */}
          {totalDetected === 0 && (
            <div className="py-8 text-center flex flex-col items-center gap-2">
              <FileText className="w-10 h-10 text-gray-300" />
              <p className="font-bold text-gray-800 text-sm">No medical items found</p>
              <p className="text-xs text-gray-500 max-w-xs">
                {scanResult.documentType === "Not a medical document"
                  ? "The uploaded file does not appear to be a medical document."
                  : "The scanner could not find conditions, medications, or allergies in this document. Make sure the document is clear and readable."}
              </p>
            </div>
          )}

          {/* Conditions */}
          {scanResult.conditions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-orange-700 uppercase tracking-wide">
                <Heart className="w-3.5 h-3.5" />
                <span>Conditions ({scanResult.conditions.length})</span>
              </div>
              <div className="space-y-2">
                {scanResult.conditions.map((condition, idx) => {
                  const isChecked = tickedConditions[idx];
                  const isOpen = Boolean(openConditionHelp[idx]);
                  const explanation =
                    condition.explanation ||
                    "Could not identify this reliably. Ask your doctor or pharmacist.";

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border transition-colors ${
                        isChecked
                          ? "bg-orange-50/60 border-orange-200"
                          : "bg-gray-50 border-gray-200 opacity-75"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id={`condition-${idx}`}
                          checked={isChecked}
                          onChange={() => toggleCondition(idx)}
                          className="w-4 h-4 rounded text-orange-600 accent-orange-600 shrink-0 cursor-pointer"
                        />
                        <label
                          htmlFor={`condition-${idx}`}
                          className={`text-sm font-semibold flex-1 cursor-pointer select-none ${
                            isChecked ? "text-gray-900" : "text-gray-400 line-through"
                          }`}
                        >
                          {condition.name}
                        </label>
                      </div>

                      {/* Collapsible "What is this?" dropdown */}
                      <div className="mt-2 pl-7">
                        <button
                          type="button"
                          onClick={() => toggleConditionHelp(idx)}
                          className="text-xs text-orange-700 hover:text-orange-900 font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>What is this?</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {isOpen && (
                          <div className="mt-1.5 p-2.5 rounded-xl bg-white border border-orange-200/70 text-xs text-gray-700 space-y-1.5 shadow-xs animate-in fade-in duration-150">
                            <p className="leading-relaxed">{explanation}</p>
                            <span className="text-[10px] text-gray-500 font-medium block">
                              General information, not medical advice.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Medications */}
          {scanResult.medications.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 uppercase tracking-wide">
                <Pill className="w-3.5 h-3.5" />
                <span>Medications ({scanResult.medications.length})</span>
              </div>
              <div className="space-y-2">
                {scanResult.medications.map((med, idx) => {
                  const isChecked = tickedMedications[idx];
                  const isOpen = Boolean(openMedicationHelp[idx]);
                  const formatted = formatMedication(med);
                  const explanation =
                    med.explanation ||
                    "Could not identify this reliably. Ask your doctor or pharmacist.";

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border transition-colors ${
                        isChecked
                          ? "bg-blue-50/60 border-blue-200"
                          : "bg-gray-50 border-gray-200 opacity-75"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id={`medication-${idx}`}
                          checked={isChecked}
                          onChange={() => toggleMedication(idx)}
                          className="w-4 h-4 mt-0.5 rounded text-blue-600 accent-blue-600 shrink-0 cursor-pointer"
                        />
                        <label
                          htmlFor={`medication-${idx}`}
                          className="flex-1 min-w-0 cursor-pointer select-none"
                        >
                          <span
                            className={`text-sm font-semibold block ${
                              isChecked ? "text-gray-900" : "text-gray-400 line-through"
                            }`}
                          >
                            {formatted}
                          </span>
                          {(med.dose || med.frequency) && isChecked && (
                            <span className="text-xs text-gray-500 block mt-0.5">
                              {[
                                med.dose && `Dose: ${med.dose}`,
                                med.frequency && `Freq: ${med.frequency}`,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          )}
                        </label>
                      </div>

                      {/* Collapsible "What is this?" dropdown */}
                      <div className="mt-2 pl-7">
                        <button
                          type="button"
                          onClick={() => toggleMedicationHelp(idx)}
                          className="text-xs text-blue-700 hover:text-blue-900 font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>What is this?</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {isOpen && (
                          <div className="mt-1.5 p-2.5 rounded-xl bg-white border border-blue-200/70 text-xs text-gray-700 space-y-1.5 shadow-xs animate-in fade-in duration-150">
                            <p className="leading-relaxed">{explanation}</p>
                            <span className="text-[10px] text-gray-500 font-medium block">
                              General information, not medical advice.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Allergies */}
          {scanResult.allergies.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-700 uppercase tracking-wide">
                <Activity className="w-3.5 h-3.5" />
                <span>Allergies ({scanResult.allergies.length})</span>
              </div>
              <div className="space-y-1.5">
                {scanResult.allergies.map((allergy, idx) => {
                  const isChecked = tickedAllergies[idx];
                  return (
                    <label
                      key={idx}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                        isChecked
                          ? "bg-red-50/60 border-red-200 text-gray-900"
                          : "bg-gray-50 border-gray-200 text-gray-400 line-through"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleAllergy(idx)}
                        className="w-4 h-4 rounded text-red-600 accent-red-600 shrink-0"
                      />
                      <span className="text-sm font-semibold">{allergy}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 font-bold border-2 border-gray-200 text-gray-700 rounded-2xl active:scale-95 transition-transform text-sm"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={totalSelected === 0}
            className="flex-1 flex items-center justify-center gap-2 py-3 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow active:scale-95 transition-transform disabled:opacity-50 text-sm"
          >
            <Check className="w-4 h-4" />
            <span>Add to my profile ({totalSelected})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
