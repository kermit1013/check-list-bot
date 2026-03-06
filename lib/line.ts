// lib/line.ts
// LINE Messaging API helpers — uses Flex Messages for rich card UI

const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN!;
// LINE_TARGET_ID 可以是個人 User ID（U 開頭）或群組 Group ID（C 開頭）
const TARGET_ID = process.env.LINE_TARGET_ID!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

// Send any LINE message object (text or flex)
export async function sendLineMessage(message: object): Promise<void> {
  const body = {
    to: TARGET_ID,
    messages: [message],
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

export function buildChecklistUrl(anchor?: string): string {
  const base = APP_URL || "https://your-app.vercel.app";
  return anchor ? `${base}/#${anchor}` : base;
}

// ─── Flex Message Helpers ─────────────────────────────────────────────────────

function taskItem(label: string, accentColor: string, note?: string): object {
  const contents: object[] = [
    {
      type: "text",
      text: "☐",
      size: "sm",
      color: accentColor,
      flex: 0,
    },
    {
      type: "text",
      text: label,
      size: "sm",
      color: "#333333",
      wrap: true,
      flex: 1,
    },
  ];
  if (note) {
    contents.push({
      type: "text",
      text: note,
      size: "xxs",
      color: accentColor,
      flex: 0,
      align: "end" as const,
    });
  }
  return {
    type: "box",
    layout: "horizontal",
    contents,
    spacing: "sm",
    paddingTop: "4px",
    paddingBottom: "4px",
  };
}

function sectionLabel(title: string, color: string): object {
  return {
    type: "box",
    layout: "vertical",
    contents: [
      {
        type: "text",
        text: title,
        size: "xs",
        color: "#ffffff",
        weight: "bold",
      },
    ],
    backgroundColor: color,
    cornerRadius: "4px",
    paddingAll: "4px",
    paddingStart: "8px",
    margin: "md",
  };
}

function separator(): object {
  return { type: "separator", margin: "md", color: "#E5E7EB" };
}

interface BubbleOpts {
  altText: string;
  headerEmoji: string;
  headerTitle: string;
  headerSubtitle: string;
  headerColor: string;
  bodyContents: object[];
  url: string;
  buttonLabel?: string;
}

function createBubble(opts: BubbleOpts): object {
  return {
    type: "flex",
    altText: opts.altText,
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "text",
            text: opts.headerEmoji,
            size: "xxl",
            flex: 0,
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: opts.headerTitle,
                weight: "bold",
                size: "md",
                color: "#ffffff",
              },
              {
                type: "text",
                text: opts.headerSubtitle,
                size: "xxs",
                color: "#ffffff99",
              },
            ],
            spacing: "none",
            justifyContent: "center",
          },
        ],
        spacing: "md",
        alignItems: "center",
        backgroundColor: opts.headerColor,
        paddingAll: "16px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: opts.bodyContents,
        paddingAll: "14px",
        spacing: "xs",
        backgroundColor: "#FAFAFA",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: {
              type: "uri",
              label: opts.buttonLabel || "📋 前往勾選清單",
              uri: opts.url,
            },
            style: "primary",
            color: opts.headerColor,
            height: "sm",
          },
        ],
        paddingAll: "12px",
        backgroundColor: "#FAFAFA",
      },
      styles: {
        footer: { separator: true },
      },
    },
  };
}

// ─── Message Templates ────────────────────────────────────────────────────────

export function msg8am(): object {
  const url = buildChecklistUrl("morning_pre");
  const c = "#7C3AED";
  return createBubble({
    altText: "早安！早餐飯前請記得量血壓、吃藥 💊",
    headerEmoji: "🌅",
    headerTitle: "早安！早餐飯前",
    headerSubtitle: "08:00　量血壓血糖 & 服藥",
    headerColor: c,
    bodyContents: [
      taskItem("熱毛巾敷臉 ＋ 表情練習", c),
      taskItem("吸氣喘藥 ＋ 喝水", c),
      taskItem("量血壓 ___", c),
      taskItem("量血糖 ___", c),
      taskItem("打胰島素", c),
      taskItem("護胃果凍 ＋ 益生菌", c),
      taskItem("胃藥", c),
      taskItem("苦瓜生態", c),
    ],
    url,
    buttonLabel: "📋 記錄血壓血糖 & 勾選",
  });
}

export function msg9am(): object {
  const url = buildChecklistUrl("morning_post");
  const c = "#0891B2";
  return createBubble({
    altText: "吃飽沒？早餐飯後記得吃藥 ☕",
    headerEmoji: "☕",
    headerTitle: "吃飽沒？早餐飯後",
    headerSubtitle: "09:00　飯後用藥",
    headerColor: c,
    bodyContents: [
      taskItem("膳食纖維 ＋ 蛋白牛奶", c),
      taskItem("中藥壯骨", c),
      taskItem("中藥粉", c),
      taskItem("西藥 ＋ 保健食品", c, "一小時後"),
    ],
    url,
  });
}

export function msg10amReminder(incompleteItems: string[]): object {
  const url = buildChecklistUrl("morning_post");
  const c = "#D97706";
  return createBubble({
    altText: "⏰ 中藥後一小時到囉！還有事項未完成",
    headerEmoji: "⏰",
    headerTitle: "可以吃西藥了！",
    headerSubtitle: "10:00　中藥後一小時提醒",
    headerColor: c,
    bodyContents: [
      {
        type: "text",
        text: "你還沒完成的事項：",
        size: "xs",
        color: "#888888",
      },
      ...incompleteItems.map((item) => taskItem(item, c)),
    ],
    url,
    buttonLabel: "✅ 前往勾選",
  });
}

export function msg12pm(): object {
  const url = buildChecklistUrl("lunch_pre");
  const c = "#059669";
  return createBubble({
    altText: "午餐時間！飯前飯後提醒 🥗",
    headerEmoji: "🥗",
    headerTitle: "午餐時間！",
    headerSubtitle: "12:00　飯前 & 飯後用藥",
    headerColor: c,
    bodyContents: [
      sectionLabel("飯前", c),
      taskItem("吸氣喘藥 ＋ 喝水", c),
      taskItem("護胃果凍", c),
      sectionLabel("飯後", c),
      taskItem("中藥粉", c),
      taskItem("中藥活血", c),
    ],
    url,
  });
}

export function msg5pm(): object {
  const url = buildChecklistUrl("dinner_pre");
  const c = "#DC2626";
  return createBubble({
    altText: "晚餐時間！飯前飯後提醒 🍽️",
    headerEmoji: "🍽️",
    headerTitle: "晚餐時間！",
    headerSubtitle: "17:00　飯前 & 飯後用藥",
    headerColor: c,
    bodyContents: [
      sectionLabel("飯前", c),
      taskItem("吸氣喘藥 ＋ 喝水", c),
      taskItem("打胰島素", c),
      taskItem("益生菌", c),
      sectionLabel("飯後", c),
      taskItem("膳食纖維 ＋ 蛋白牛奶", c),
      taskItem("中藥消腫", c),
      taskItem("溫水洗鼻子", c),
      taskItem("西藥 ＋ 保健食品", c, "一小時後"),
    ],
    url,
  });
}

export function msg8pm(pct: number, remaining: number): object {
  const url = buildChecklistUrl("bedtime");
  const c = "#4338CA";
  const pctColor = pct >= 80 ? "#059669" : pct >= 50 ? "#D97706" : "#DC2626";
  const emoji = pct >= 80 ? "🎉" : pct >= 50 ? "💪" : "🤗";

  return createBubble({
    altText: `準備休息了嗎？今天完成 ${pct}% 的任務！🌙`,
    headerEmoji: "🌙",
    headerTitle: "準備休息了嗎？",
    headerSubtitle: "20:00　今日收尾",
    headerColor: c,
    bodyContents: [
      {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: `${emoji} 今日完成 ${pct}%`,
            size: "lg",
            weight: "bold",
            color: pctColor,
            align: "center",
          },
          {
            type: "text",
            text:
              remaining > 0
                ? `還有 ${remaining} 項未完成，加油！`
                : "今日任務全部完成！超讚 🌟",
            size: "xxs",
            color: "#888888",
            align: "center",
          },
        ],
        backgroundColor: "#F3F4F6",
        cornerRadius: "8px",
        paddingAll: "12px",
      },
      separator(),
      sectionLabel("睡前", c),
      taskItem("量血壓 ___", c),
      taskItem("量血糖 ___", c),
      taskItem("洗假牙", c),
    ],
    url,
    buttonLabel: "📋 記錄血壓血糖 & 勾選",
  });
}
