// lib/line.ts
// LINE Messaging API helpers

const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN!;
const USER_ID = process.env.LINE_USER_ID!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export async function sendLineMessage(text: string): Promise<void> {
  const body = {
    to: USER_ID,
    messages: [
      {
        type: "text",
        text,
      },
    ],
  };

  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LINE API error: ${res.status} ${err}`);
  }
}

export function buildChecklistUrl(): string {
  return APP_URL || "https://your-app.vercel.app";
}

// ─── Message templates ────────────────────────────────────────────────────────

export function msg8am(): string {
  const url = buildChecklistUrl();
  return `早安！「早餐飯前」請記得：
- [ ] 熱毛巾敷臉 ＋ 表情練習
- [ ] 吸氣喘藥 ＋ 喝水
- [ ] 量血壓 ___
- [ ] 量血糖 ___
- [ ] 打胰島素
- [ ] 護胃果凍 ＋ 益生菌
- [ ] 胃藥
- [ ] 苦瓜生態

請點擊網址勾選 todo ＆記錄血壓、血糖：
${url}`;
}

export function msg9am(): string {
  const url = buildChecklistUrl();
  return `吃飽沒？「早餐飯後」請記得：
- [ ] 膳食纖維 ＋ 蛋白牛奶
- [ ] 中藥壯骨
- [ ] 中藥粉
- [ ] 西藥 ＋ 保健食品（一小時後）

請點擊網址勾選 todo：
${url}`;
}

export function msg10amReminder(incompleteItems: string[]): string {
  const url = buildChecklistUrl();
  const list = incompleteItems.map((i) => `- [ ] ${i}`).join("\n");
  return `喝中藥後一小時可以吃西藥囉！
你還沒完成以下事項：
${list}

請點擊網址勾選 todo：
${url}`;
}

export function msg12pm(): string {
  const url = buildChecklistUrl();
  return `中午飯前：
- [ ] 吸氣喘藥 ＋ 喝水
- [ ] 護胃果凍

中午飯後：
- [ ] 中藥粉
- [ ] 中藥活血

請點擊網址勾選 todo：
${url}`;
}

export function msg5pm(): string {
  const url = buildChecklistUrl();
  return `晚餐飯前：
- [ ] 吸氣喘藥 ＋ 喝水
- [ ] 打胰島素
- [ ] 益生菌

晚餐飯後：
- [ ] 膳食纖維 ＋ 蛋白牛奶
- [ ] 中藥消腫
- [ ] 溫水洗鼻子
- [ ] 西藥 ＋ 保健食品（一小時後）

請點擊網址勾選 todo：
${url}`;
}

export function msg8pm(pct: number, remaining: number): string {
  const url = buildChecklistUrl();
  const remainingText =
    remaining > 0 ? `\n其他，還有 ${remaining} 事項喔...` : "";
  return `準備休息了嗎？你今天超棒，已經完成 ${pct}% 的任務，很努力讓自己健健康康！
- [ ] 量血壓 ___
- [ ] 量血糖 ___
- [ ] 洗假牙
${remainingText}

請點擊網址勾選 todo ＆記錄血壓、血糖：
${url}`;
}
