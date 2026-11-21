// app/api/scan/route.ts
// AI Medical Document Scanner route (POST)
// Accepts an image (PNG/JPEG) or PDF up to 5 MB as multipart form data.
// Calls the Gemini API server-side using GEMINI_API_KEY.
// Does NOT store the uploaded file anywhere.

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ScanResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB limit
const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "application/pdf",
];

const CANDIDATE_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-flash-lite-latest",
  "gemma-4-31b-it",
  "gemini-3.8-flash",
];

async function callModel(
  model: string,
  apiKey: string,
  payload: any,
  timeoutMs: number = 20000
): Promise<{ ok: boolean; status: number; data?: any; error?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs); // 20-second timeout per attempt

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);
    const data = await res.json().catch(() => null);

    if (res.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return { ok: true, status: res.status, data };
    }

    const errorMessage =
      data?.error?.message ||
      (res.ok ? "No text returned in candidates" : `HTTP ${res.status}`);

    console.error(
      `[Scan API] Model failed - model: ${model}, status: ${res.status}, error.message: ${errorMessage}`
    );

    return {
      ok: false,
      status: res.status,
      error: errorMessage,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const isTimeout = err?.name === "AbortError" || controller.signal.aborted;
    const status = isTimeout ? 408 : 500;
    const errorMessage = isTimeout
      ? `Timeout (${Math.round(timeoutMs / 1000)}s exceeded)`
      : err?.message || "Network error";

    console.error(
      `[Scan API] Model failed - model: ${model}, status: ${status}, error.message: ${errorMessage}`
    );

    return {
      ok: false,
      status,
      error: errorMessage,
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user via Supabase session
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to scan documents." },
        { status: 401 }
      );
    }

    // 2. Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No document provided. Please choose a medical document or photo." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 5 MB. Please upload a smaller image or PDF." },
        { status: 400 }
      );
    }

    // Determine real MIME type (normalize image/jpg to image/jpeg, fallback to file extension)
    let mimeType = (file.type || "").toLowerCase().split(";")[0].trim();
    if (mimeType === "image/jpg" || mimeType === "image/pjpeg") {
      mimeType = "image/jpeg";
    }
    if (!mimeType) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "png") mimeType = "image/png";
      else if (ext === "jpg" || ext === "jpeg") mimeType = "image/jpeg";
      else if (ext === "pdf") mimeType = "application/pdf";
    }

    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: "Invalid file format. Please upload a PNG, JPEG, or PDF." },
        { status: 400 }
      );
    }

    // 3. Convert file to plain Base64 in memory (never saved to disk or database)
    const arrayBuffer = await file.arrayBuffer();
    let base64Data = Buffer.from(arrayBuffer).toString("base64");
    if (base64Data.startsWith("data:")) {
      base64Data = base64Data.replace(/^data:[^;]+;base64,/, "");
    }

    // 4. Verify Gemini API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Medical document scanner is not configured (missing API key)." },
        { status: 500 }
      );
    }

    // 5. System prompt: strictly extract JSON matching specified shape
    const systemPrompt = `You are a medical document reading assistant. Read the provided document and return ONLY a valid JSON object with this exact shape:
{
  "documentType": string,
  "summary": string,
  "conditions": [{ "name": string, "explanation": string }],
  "medications": [{ "name": string, "dose": string, "frequency": string, "explanation": string }],
  "allergies": string[],
  "alerts": string[],
  "unclear": string[]
}

Strict Rules:
- If the image is not a medical document, return documentType "Not a medical document", an empty summary and empty arrays.
- "documentType": what kind of document it is, e.g. "Prescription", "Lab report", "Discharge summary", "Other".
- "summary": 3-5 plain sentences for a non-medical reader: what this document is, what it is about, and what it asks the patient to do, ONLY as written in the document.
- List a condition ONLY if the document explicitly names it. List a medication ONLY if the document explicitly names it. Never infer a condition from a medicine, or a medicine from a condition. If the document has none, return an empty array.
- "dose" is the amount per intake as written (for example "1 tablet" or "500 mg"), and "frequency" is the schedule as written (for example "once daily before meals, 7 AM"). Do not repeat the same text in both. Copy doses and frequencies exactly as written; use "" if not written. Never guess an illegible word: put it in "unclear" instead.
- Medication "explanation": the user is not from a medical background and wants to know what each medicine is for. For each medicine named in the document, if you recognise the brand or generic name, write ONE or TWO plain sentences: "Likely a [generic name / drug class if you know it], generally used for [purpose]." Use hedged wording like "likely" or "usually", and end with: "Brand names can differ, so confirm with your pharmacist." Only if you genuinely do not recognise the name at all, use "Could not identify this reliably. Ask your doctor or pharmacist." Never invent a drug name or purpose. Never advise starting, stopping or changing a medicine, and never give a dose recommendation.
- Condition "explanation": explain in one or two plain sentences for a non-medical reader what the condition is, but only for conditions explicitly written in the document. It is general information, not advice for this patient. Never give a diagnosis. If the name is illegible or ambiguous, set explanation to "Could not identify this reliably. Ask your doctor or pharmacist."
- "unclear": anything hard to read or illegible in the document. Never guess illegible words; put them in "unclear" instead.
- "allergies": explicitly documented drug/substance allergies. If none, return an empty array.
- "alerts": critical patient alerts explicitly mentioned. If none, return an empty array.
- Return ONLY the JSON object. Do not include markdown code block syntax (like \`\`\`json), explanations, or conversational text.`;

    const requestPayload = {
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data,
              },
            },
            {
              text: "Read this document carefully according to the system prompt and strict rules. Output ONLY the JSON object with the requested shape.",
            },
          ],
        },
      ],
      generationConfig: {
        response_mime_type: "application/json",
      },
    };

    // 6. Try candidate models in order: gemini-3.5-flash-lite, gemini-flash-lite-latest, gemma-4-31b-it, gemini-3.8-flash
    // 20s timeout per attempt, no retry on 408, 1 retry on 503 after 2s, stop after 55s total
    let responseData: any = null;
    const TOTAL_BUDGET_MS = 55000;
    const startTime = Date.now();

    for (const model of CANDIDATE_MODELS) {
      const elapsed = Date.now() - startTime;
      if (elapsed >= TOTAL_BUDGET_MS) {
        console.warn(
          `[Scan API] Total elapsed time exceeded 55s. Stopping attempts.`
        );
        break;
      }

      const attemptTimeout = Math.min(20000, Math.max(1000, TOTAL_BUDGET_MS - elapsed));
      let attempt = await callModel(model, apiKey, requestPayload, attemptTimeout);

      if (attempt.ok && attempt.data) {
        responseData = attempt.data;
        break; // Stop at the first success
      }

      // If a model rejects image input, log that and move on to the next one
      const errorMsgLower = (attempt.error || "").toLowerCase();
      const rejectsImage =
        errorMsgLower.includes("image") ||
        errorMsgLower.includes("multimodal") ||
        errorMsgLower.includes("modality") ||
        errorMsgLower.includes("vision") ||
        errorMsgLower.includes("inline") ||
        errorMsgLower.includes("mime") ||
        errorMsgLower.includes("media") ||
        errorMsgLower.includes("text only") ||
        errorMsgLower.includes("only supports text") ||
        errorMsgLower.includes("unsupported input");

      if (rejectsImage) {
        console.warn(
          `[Scan API] Model ${model} rejected image input (${attempt.error}). Moving on to the next model.`
        );
        continue;
      }

      // One retry on 503 after 2 seconds (no retry on 408)
      if (attempt.status === 503) {
        const timeBeforeRetry = Date.now() - startTime;
        if (timeBeforeRetry + 2000 >= TOTAL_BUDGET_MS) {
          console.warn(
            `[Scan API] 55s total limit reached. Skipping 503 retry for ${model}.`
          );
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));

        const timeAfterWait = Date.now() - startTime;
        if (timeAfterWait >= TOTAL_BUDGET_MS) {
          console.warn(
            `[Scan API] 55s total limit reached after wait. Stopping attempts.`
          );
          break;
        }

        const retryTimeout = Math.min(
          20000,
          Math.max(1000, TOTAL_BUDGET_MS - timeAfterWait)
        );
        attempt = await callModel(model, apiKey, requestPayload, retryTimeout);

        if (attempt.ok && attempt.data) {
          responseData = attempt.data;
          break;
        }
      }
    }

    if (!responseData) {
      return NextResponse.json(
        {
          error: "The AI service is busy. Please try again in a minute.",
        },
        { status: 503 }
      );
    }

    // 7. Parse response safely (strip code fences)
    let rawText = responseData.candidates[0].content.parts[0].text.trim();
    rawText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch (parseErr) {
      console.error("[Scan API] Failed to parse JSON from AI response:", rawText);
      return NextResponse.json(
        {
          error:
            "Could not clearly read the document content. Please ensure the document is legible and well-lit.",
        },
        { status: 500 }
      );
    }

    // Clean and validate exact shape
    const cleanResult: ScanResult = {
      documentType: String(parsed?.documentType || "Other").trim(),
      summary: String(parsed?.summary || "").trim(),
      conditions: Array.isArray(parsed?.conditions)
        ? parsed.conditions
            .map((c: any) => {
              if (typeof c === "string") {
                return {
                  name: c.trim(),
                  explanation: "Could not identify this reliably. Ask your doctor or pharmacist.",
                };
              }
              return {
                name: String(c?.name || "").trim(),
                explanation: String(c?.explanation || "").trim(),
              };
            })
            .filter((c: any) => c.name.length > 0)
        : [],
      medications: Array.isArray(parsed?.medications)
        ? parsed.medications
            .map((m: any) => ({
              name: String(m?.name || "").trim(),
              dose: String(m?.dose || "").trim(),
              frequency: String(m?.frequency || "").trim(),
              explanation: String(m?.explanation || "").trim(),
            }))
            .filter((m: any) => m.name.length > 0)
        : [],
      allergies: Array.isArray(parsed?.allergies)
        ? parsed.allergies.map(String).map((s: string) => s.trim()).filter(Boolean)
        : [],
      alerts: Array.isArray(parsed?.alerts)
        ? parsed.alerts.map(String).map((s: string) => s.trim()).filter(Boolean)
        : [],
      unclear: Array.isArray(parsed?.unclear)
        ? parsed.unclear.map(String).map((s: string) => s.trim()).filter(Boolean)
        : [],
    };

    return NextResponse.json(cleanResult);
  } catch (error: any) {
    console.error("[Scan API] Unexpected server error:", error);
    return NextResponse.json(
      {
        error:
          "An error occurred while scanning the document. Please try again.",
      },
      { status: 500 }
    );
  }
}
