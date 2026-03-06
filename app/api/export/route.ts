// app/api/export/route.ts
// 匯出過去 N 天的血壓血糖記錄為 CSV
import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { DailyChecklist } from "@/lib/checklist";
import { format, subDays } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const TZ = "Asia/Taipei";

function getTodayTaipei(): Date {
  return toZonedTime(new Date(), TZ);
}

// GET /api/export?days=30
export async function GET(req: NextRequest) {
  const daysParam = req.nextUrl.searchParams.get("days");
  const days = Math.min(Math.max(parseInt(daysParam ?? "30", 10), 1), 365);

  const today = getTodayTaipei();

  // 建立日期列表（今天倒推 N 天）
  const dates: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = subDays(today, i);
    dates.push(format(d, "yyyy-MM-dd"));
  }

  // 批次讀取 Redis（pipeline 平行查詢）
  const pipeline = redis.pipeline();
  for (const date of dates) {
    pipeline.get(`checklist:${date}`);
  }
  const results = await pipeline.exec<(DailyChecklist | null)[]>();

  // 組裝 CSV 資料
  const rows: string[][] = [];

  // 表頭（含 BOM，讓 Excel 正確顯示中文）
  rows.push(["日期", "早上血壓", "早上血糖", "晚上血壓", "晚上血糖"]);

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const data = results[i] as DailyChecklist | null;

    if (!data) {
      rows.push([date, "", "", "", ""]);
      continue;
    }

    const morningBP = data.inputs?.["mp_bp"] ?? "";
    const morningBS = data.inputs?.["mp_bs"] ?? "";
    const eveningBP = data.inputs?.["bt_bp"] ?? "";
    const eveningBS = data.inputs?.["bt_bs"] ?? "";

    rows.push([date, morningBP, morningBS, eveningBP, eveningBS]);
  }

  // 轉成 CSV 字串（加 BOM 讓 Excel 能正確讀取 UTF-8）
  const bom = "\uFEFF";
  const csv =
    bom +
    rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

  const filename = `blood-pressure-sugar_${format(today, "yyyyMMdd")}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
