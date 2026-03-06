// app/api/cron/route.ts
// Vercel Cron Job endpoint — handles all scheduled LINE messages
// Each job is identified by ?job=8am|9am|10am|12pm|5pm|8pm

import { NextRequest, NextResponse } from "next/server";
import {
  sendLineMessage,
  msg8am,
  msg9am,
  msg10amReminder,
  msg12pm,
  msg5pm,
  msg8pm,
} from "@/lib/line";
import { getChecklist } from "@/lib/storage";
import {
  TASK_GROUPS,
  MORNING_POST_IDS,
  getCompletionStats,
  getAllTasks,
} from "@/lib/checklist";

// Protect cron routes from unauthorized access
function isAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const job = req.nextUrl.searchParams.get("job");
  if (!job) {
    return NextResponse.json({ error: "Missing job param" }, { status: 400 });
  }

  try {
    const checklist = await getChecklist();

    switch (job) {
      case "8am": {
        await sendLineMessage(msg8am());
        break;
      }

      case "9am": {
        await sendLineMessage(msg9am());
        break;
      }

      case "10am": {
        // Only send if there are incomplete morning_post tasks
        const morningPostGroup = TASK_GROUPS.find(
          (g) => g.id === "morning_post"
        )!;
        const incomplete = morningPostGroup.tasks.filter(
          (t) => !checklist.tasks[t.id]
        );
        if (incomplete.length > 0) {
          const labels = incomplete.map((t) => t.label);
          await sendLineMessage(msg10amReminder(labels));
        } else {
          // All done, skip sending
          return NextResponse.json({ skipped: true, reason: "all complete" });
        }
        break;
      }

      case "12pm": {
        await sendLineMessage(msg12pm());
        break;
      }

      case "5pm": {
        await sendLineMessage(msg5pm());
        break;
      }

      case "8pm": {
        const stats = getCompletionStats(checklist);
        // Count tasks not in bedtime group that are incomplete
        const bedtimeIds = TASK_GROUPS.find(
          (g) => g.id === "bedtime"
        )!.tasks.map((t) => t.id);
        const nonBedtime = getAllTasks().filter(
          (t) => !bedtimeIds.includes(t.id)
        );
        const remaining = nonBedtime.filter(
          (t) => !checklist.tasks[t.id]
        ).length;
        await sendLineMessage(msg8pm(stats.pct, remaining));
        break;
      }

      default:
        return NextResponse.json({ error: "Unknown job" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, job });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : String(e);
    console.error(`Cron job ${job} failed:`, error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
