// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// bloodGroupColor has been intentionally removed.
// Colour lookups now live as full literal class strings inside each
// component file so Tailwind's static scanner can always find them.
