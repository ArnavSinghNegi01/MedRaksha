// components/ProfileForm.tsx
"use client";

import { useState, useEffect } from "react";
import type { Profile } from "@/lib/types";
import { X, Plus, AlertCircle, Loader2 } from "lucide-react";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

interface Props {
  initial: Profile;
  onSave: (p: Profile) => Promise<void> | void;
  onCancel: () => void;
}

function TagInput({
  label,
  items,
  onChange,
  placeholder,
  colorClass = "bg-gray-100 text-gray-800",
}: {
  label: string;
  items: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  colorClass?: string;
}) {
  const [input, setInput] = useState("");

  function add() {
    const trimmed = input.trim();
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed]);
    }
    setInput("");
  }

  function remove(item: string) {
    onChange(items.filter((i) => i !== item));
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={add}
          className="bg-blue-600 text-white rounded-xl px-3 py-2"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {items.map((item) => (
          <span
            key={item}
            className={`inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full font-medium ${colorClass}`}
          >
            {item}
            <button type="button" onClick={() => remove(item)} className="ml-1">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function ProfileForm({ initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState<Profile>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setContact(which: "primaryContact" | "secondaryContact", field: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [which]: { ...prev[which], [field]: value },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Database requirement validations:
    // 1. Name not empty
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      setError("Please enter your full name.");
      return;
    }

    // 2. Age between 1 and 120
    const parsedAge = Number(form.age);
    if (!parsedAge || isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120 || !Number.isInteger(parsedAge)) {
      setError("Please enter a valid age between 1 and 120.");
      return;
    }

    // 3. Gender exactly Male, Female, or Other
    if (!["Male", "Female", "Other"].includes(form.gender)) {
      setError("Gender must be exactly 'Male', 'Female', or 'Other'.");
      return;
    }

    // 4. Blood group not empty and valid
    const trimmedBlood = form.bloodGroup.trim();
    if (!trimmedBlood || !BLOOD_GROUPS.includes(trimmedBlood)) {
      setError("Please select a valid blood group.");
      return;
    }

    // Contacts validation
    if (!form.primaryContact.name.trim() || !form.primaryContact.phone.trim()) {
      setError("Please provide a name and phone number for your primary emergency contact.");
      return;
    }

    if (!form.secondaryContact.name.trim() || !form.secondaryContact.phone.trim()) {
      setError("Please provide a name and phone number for your secondary emergency contact.");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...form,
        name: trimmedName,
        age: parsedAge,
        bloodGroup: trimmedBlood,
      });
    } catch (err: any) {
      console.error("Save profile error:", err);
      setError(err?.message || "Failed to save profile. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Friendly error banner if validation or saving fails */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold p-4 rounded-2xl"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Personal */}
      <div className="bg-blue-50 rounded-2xl p-4 flex flex-col gap-4">
        <h3 className="font-bold text-blue-800 text-sm uppercase tracking-wide">Personal Details</h3>
        <Field label="Full Name">
          <input
            type="text"
            required
            placeholder="e.g. Rahul Sharma"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className={inputCls}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Age">
            <input
              type="number"
              required
              min={1}
              max={120}
              placeholder="e.g. 30"
              value={form.age === 0 ? "" : form.age}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                set("age", isNaN(val) ? 0 : val);
              }}
              className={inputCls}
            />
          </Field>
          <Field label="Gender">
            <select
              value={form.gender}
              onChange={(e) => set("gender", e.target.value as Profile["gender"])}
              className={inputCls}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </Field>
        </div>
        <Field label="Blood Group">
          <select
            value={form.bloodGroup}
            onChange={(e) => set("bloodGroup", e.target.value)}
            className={inputCls}
          >
            <option value="">Select Blood Group</option>
            {BLOOD_GROUPS.map((bg) => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
        </Field>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="organDonor"
            checked={form.organDonor}
            onChange={(e) => set("organDonor", e.target.checked)}
            className="w-5 h-5 accent-blue-600"
          />
          <label htmlFor="organDonor" className="text-sm font-semibold text-gray-700">
            Organ Donor
          </label>
        </div>
      </div>

      {/* Medical */}
      <div className="bg-red-50 rounded-2xl p-4 flex flex-col gap-4">
        <h3 className="font-bold text-red-800 text-sm uppercase tracking-wide">Medical Info</h3>
        <TagInput
          label="Allergies"
          items={form.allergies}
          onChange={(v) => set("allergies", v)}
          placeholder="e.g. Penicillin"
          colorClass="bg-red-600 text-white"
        />
        <TagInput
          label="Pre-existing Conditions"
          items={form.conditions}
          onChange={(v) => set("conditions", v)}
          placeholder="e.g. Type 2 Diabetes"
          colorClass="bg-orange-100 text-orange-800"
        />
        <TagInput
          label="Current Critical Medications"
          items={form.medications}
          onChange={(v) => set("medications", v)}
          placeholder="e.g. Metformin 500 mg"
          colorClass="bg-blue-100 text-blue-800"
        />
      </div>

      {/* Contacts */}
      <div className="bg-gray-50 rounded-2xl p-4 flex flex-col gap-4">
        <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Emergency Contacts</h3>
        {(["primaryContact", "secondaryContact"] as const).map((which) => (
          <div key={which} className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-gray-500 uppercase">
              {which === "primaryContact" ? "Primary Contact" : "Secondary Contact"}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Name"
                value={form[which].name}
                onChange={(e) => setContact(which, "name", e.target.value)}
                className={inputCls}
                required
              />
              <input
                type="text"
                placeholder="Relation (e.g. Spouse)"
                value={form[which].relation}
                onChange={(e) => setContact(which, "relation", e.target.value)}
                className={inputCls}
              />
            </div>
            <input
              type="tel"
              placeholder="Phone (+91XXXXXXXXXX)"
              value={form[which].phone}
              onChange={(e) => setContact(which, "phone", e.target.value)}
              className={inputCls}
              required
            />
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex-1 rounded-2xl py-3 font-bold border-2 border-gray-300 text-gray-700 active:scale-95 transition-transform disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 font-bold bg-blue-600 text-white shadow active:scale-95 transition-transform disabled:opacity-50"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? "Saving…" : "Save Profile"}
        </button>
      </div>
    </form>
  );
}
