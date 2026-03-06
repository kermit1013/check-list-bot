// lib/storage.ts
// Upstash Redis storage for daily checklist

import { Redis } from "@upstash/redis";
import { DailyChecklist, getEmptyChecklist } from "./checklist";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export function getTodayKey(): string {
  const tz = "Asia/Taipei";
  const now = toZonedTime(new Date(), tz);
  return `checklist:${format(now, "yyyy-MM-dd")}`;
}

export function getDateKey(date: string): string {
  return `checklist:${date}`;
}

export async function getChecklist(date?: string): Promise<DailyChecklist> {
  const key = date ? getDateKey(date) : getTodayKey();
  const dateStr = date ?? key.replace("checklist:", "");
  const data = await redis.get<DailyChecklist>(key);
  if (!data) return getEmptyChecklist(dateStr);
  return data;
}

export async function saveChecklist(
  checklist: DailyChecklist
): Promise<DailyChecklist> {
  const key = getDateKey(checklist.date);
  checklist.updatedAt = new Date().toISOString();
  await redis.set(key, checklist, { ex: 60 * 60 * 24 * 30 }); // 30 days TTL
  return checklist;
}
