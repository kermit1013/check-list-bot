// app/api/checklist/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getChecklist, saveChecklist } from "@/lib/storage";
import { DailyChecklist } from "@/lib/checklist";

// GET /api/checklist?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") ?? undefined;
  try {
    const checklist = await getChecklist(date);
    return NextResponse.json(checklist);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST /api/checklist — body: Partial<DailyChecklist>
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as DailyChecklist;
    const saved = await saveChecklist(body);
    return NextResponse.json(saved);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
