import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "../config/database";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ParsedScheduleEntry {
  subject: string;
  code: string | null;
  teacher: string | null;
  room: string | null;
  dayOfWeek: string;   // MON, TUE, WED, THU, FRI, SAT
  startTime: string;   // HH:MM (24hr)
  endTime: string;     // HH:MM (24hr)
  type: string;        // THEORY, LAB, TUTORIAL
}

// ─── Text-based AI prompt (receives OCR text, NOT image) ──────────────────────
const TEXT_PARSE_PROMPT = `You are a timetable parser. Below is OCR-extracted text from a college timetable image.
The text is organized as rows (separated by newlines) with columns separated by " | ".
The text includes a main timetable grid AND a LEGEND TABLE at the bottom.

STEP 1: Find the LEGEND section at the bottom. It maps subjects to teachers like:
  "Cryptography 3-0-0 [23CS4ESCRP] | Prof. ROHITH VAIDYA K [RV] | Analysis and Design of Algorithms..."
Build a subject→teacher mapping from what you read. Each subject has exactly one teacher.

STEP 2: Parse the main grid. Rows contain day names (MON-SAT) and cells with:
  - Subject abbreviation (ADA, OS, SE, TFC, CRP, LAO)
  - Room number in brackets [205], [103]
  - Time headers like "8.00-8.55", "9.50-10.45"

Return a JSON array:
[{"subject":"Full subject name","code":"ADA","teacher":"Prof. Name","room":"205","dayOfWeek":"MON","startTime":"08:00","endTime":"08:55","type":"THEORY"}]

Rules:
- code = short 2-5 letter abbreviation ONLY (ADA, OS, SE). NEVER long codes like 23CS4PCOPS
- teacher MUST come from the legend text. Do NOT guess names
- SKIP anything with DIP, DIP-MATH, BREAK, LUNCH
- type = LAB if text contains LAB, TUTORIAL if text contains TUTORIAL, else THEORY
- For labs: code = "ADA LAB", teacher = same as theory subject from legend
- Convert times: "8.00-8.55" → startTime "08:00" endTime "08:55"
- One teacher per subject, consistent across all days

Return ONLY raw JSON array. No markdown, no code blocks.

OCR TEXT:
`;

// ─── Main Service ────────────────────────────────────────────────────────────────
export const timetableService = {

  /**
   * Parses OCR-extracted text using Gemini (text-only, no vision model needed).
   * This is MUCH faster than image-based parsing.
   */
  parseText: async (ocrText: string): Promise<ParsedScheduleEntry[]> => {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const fullPrompt = TEXT_PARSE_PROMPT + ocrText;

    console.log("🔍 Sending OCR text to Gemini (" + ocrText.length + " chars)...");
    const startTime = Date.now();

    const result = await model.generateContent(fullPrompt);
    const responseText = result.response.text().trim();

    console.log("✅ Gemini responded in " + (Date.now() - startTime) + "ms");

    // Strip markdown code blocks if AI wrapped the JSON
    const cleaned = responseText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let entries: ParsedScheduleEntry[];
    try {
      entries = JSON.parse(cleaned);
    } catch (e) {
      console.error("Gemini response was not valid JSON:", responseText.substring(0, 500));
      throw new Error("AI could not parse the timetable text. The OCR text may be too unclear.");
    }

    if (!Array.isArray(entries) || entries.length === 0) {
      console.error("Gemini returned empty array. Response:", responseText.substring(0, 500));
      throw new Error("No classes found in the timetable. Try a clearer image.");
    }

    // Validate and normalize each entry
    const VALID_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const VALID_TYPES = ["THEORY", "LAB", "TUTORIAL"];

    const normalized = entries
      .filter((e) => e.subject && e.dayOfWeek && e.startTime && e.endTime)
      .map((e) => ({
        subject: String(e.subject).trim(),
        code: e.code ? String(e.code).trim() : null,
        teacher: e.teacher ? String(e.teacher).trim() : null,
        room: e.room ? String(e.room).trim() : null,
        dayOfWeek: VALID_DAYS.includes(String(e.dayOfWeek).toUpperCase())
          ? String(e.dayOfWeek).toUpperCase()
          : "MON",
        startTime: String(e.startTime).trim(),
        endTime: String(e.endTime).trim(),
        type: VALID_TYPES.includes(String(e.type).toUpperCase())
          ? String(e.type).toUpperCase()
          : "THEORY",
      }));

    console.log(`📋 Parsed ${normalized.length} class entries`);
    return normalized;
  },

  /**
   * (Legacy) Sends an image buffer to Gemini Vision — kept as fallback.
   */
  parseImage: async (
    imageBuffer: Buffer,
    mimeType: string
  ): Promise<ParsedScheduleEntry[]> => {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Use 2.5-flash which is active
    
    // Gemini rejects application/octet-stream, force it to jpeg
    const safeMimeType = mimeType === 'application/octet-stream' ? 'image/jpeg' : mimeType;
    
    const imagePart = {
      inlineData: {
        data: imageBuffer.toString("base64"),
        mimeType: safeMimeType,
      },
    };
    const result = await model.generateContent([TEXT_PARSE_PROMPT, imagePart]);
    const text = result.response.text().trim();
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    return JSON.parse(cleaned);
  },

  /**
   * Replace all schedules for a user with the newly parsed entries.
   */
  replaceSchedules: async (
    userId: string,
    entries: ParsedScheduleEntry[]
  ) => {
    await prisma.schedule.deleteMany({ where: { userId } });
    const created = await prisma.schedule.createMany({
      data: entries.map((e) => ({
        userId,
        dayOfWeek: e.dayOfWeek,
        startTime: e.startTime,
        endTime: e.endTime,
        subject: e.subject,
        code: e.code,
        teacher: e.teacher,
        room: e.room,
        type: e.type,
      })),
    });
    return created;
  },

  /**
   * Get all schedule entries for a user.
   */
  getAll: async (userId: string) => {
    return prisma.schedule.findMany({
      where: { userId },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
  },
};
