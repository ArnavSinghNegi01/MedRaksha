// components/ProfileForm.tsx
"use client";

import { useState } from "react";
import type { Profile } from "@/lib/types";
import { saveProfile } from "@/lib/profileStorage";
import { X, Plus } from "lucide-react";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

interface Props {
  initial: Profile;
  onSave: (p: Profile) => void;
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

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setContact(which: "primaryContact" | "secondaryContact", field: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [which]: { ...prev[which], [field]: value },
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    saveProfile(form);
    onSave(form);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Personal */}
      <div className="bg-blue-50 rounded-2xl p-4 flex flex-col gap-4">
        <h3 className="font-bold text-blue-800 text-sm uppercase tracking-wide">Personal Details</h3>
        <Field label="Full Name">
          <input
            type="text"
            required
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
              value={form.age}
              onChange={(e) => set("age", parseInt(e.target.value))}
              className={inputCls}
            />
          </Field>
          <Field label="Gender">
            <select
              value={form.gender}
              onChange={(e) => set("gender", e.target.value as Profile["gender"])}
              className={inputCls}
            >
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </Field>
        </div>
        <Field label="Blood Group">
          <select
            value={form.bloodGroup}
            onChange={(e) => set("bloodGroup", e.target.value)}
            className={inputCls}
          >
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
              {which === "primaryContact" ? "Primary" : "Secondary"}
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
                placeholder="Relation"
                value={form[which].relation}
                onChange={(e) => setContact(which, "relation", e.target.value)}
                className={inputCls}
              />
            </div>
            <input
              type="tel"
              placeholder="+91XXXXXXXXXX"
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
          className="flex-1 rounded-2xl py-3 font-bold border-2 border-gray-300 text-gray-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 rounded-2xl py-3 font-bold bg-blue-600 text-white shadow"
        >
          Save Profile
        </button>
      </div>
    </form>
  );
}
