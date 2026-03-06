// lib/checklist.ts
// All daily task definitions and group structure

export type TaskId = string;

export interface Task {
  id: TaskId;
  label: string;
  hasInput?: boolean; // for blood pressure / blood sugar
  inputPlaceholder?: string;
  note?: string; // extra note like "(一小時後)"
}

export interface TaskGroup {
  id: string;
  title: string;
  tasks: Task[];
}

export interface DailyChecklist {
  date: string; // YYYY-MM-DD
  tasks: Record<TaskId, boolean>;
  inputs: Record<TaskId, string>; // blood pressure, blood sugar values
  updatedAt: string;
}

export const TASK_GROUPS: TaskGroup[] = [
  {
    id: "morning_pre",
    title: "🌅 早餐飯前",
    tasks: [
      { id: "mp_face", label: "熱毛巾敷臉 ＋ 表情練習" },
      { id: "mp_inhaler", label: "吸氣喘藥 ＋ 喝水" },
      {
        id: "mp_bp",
        label: "量血壓",
        hasInput: true,
        inputPlaceholder: "輸入血壓值 e.g. 120/80",
      },
      {
        id: "mp_bs",
        label: "量血糖",
        hasInput: true,
        inputPlaceholder: "輸入血糖值 e.g. 110",
      },
      { id: "mp_insulin", label: "打胰島素" },
      { id: "mp_jelly", label: "護胃果凍 ＋ 益生菌" },
      { id: "mp_stomach", label: "胃藥" },
      { id: "mp_bittermelon", label: "苦瓜生態" },
    ],
  },
  {
    id: "morning_post",
    title: "☕ 早餐飯後",
    tasks: [
      { id: "mpost_fiber", label: "膳食纖維 ＋ 蛋白牛奶" },
      { id: "mpost_tcm1", label: "中藥壯骨" },
      { id: "mpost_tcm2", label: "中藥粉" },
      {
        id: "mpost_medicine",
        label: "西藥 ＋ 保健食品",
        note: "（中藥一小時後）",
      },
    ],
  },
  {
    id: "lunch_pre",
    title: "🥗 中午飯前",
    tasks: [
      { id: "lp_inhaler", label: "吸氣喘藥 ＋ 喝水" },
      { id: "lp_jelly", label: "護胃果凍" },
    ],
  },
  {
    id: "lunch_post",
    title: "🍱 中午飯後",
    tasks: [
      { id: "lpost_tcm1", label: "中藥粉" },
      { id: "lpost_tcm2", label: "中藥活血" },
    ],
  },
  {
    id: "dinner_pre",
    title: "🌆 晚餐飯前",
    tasks: [
      { id: "dp_inhaler", label: "吸氣喘藥 ＋ 喝水" },
      { id: "dp_insulin", label: "打胰島素" },
      { id: "dp_probiotic", label: "益生菌" },
    ],
  },
  {
    id: "dinner_post",
    title: "🍽️ 晚餐飯後",
    tasks: [
      { id: "dpost_fiber", label: "膳食纖維 ＋ 蛋白牛奶" },
      { id: "dpost_tcm1", label: "中藥消腫" },
      { id: "dpost_nose", label: "溫水洗鼻子" },
      {
        id: "dpost_medicine",
        label: "西藥 ＋ 保健食品",
        note: "（中藥一小時後）",
      },
    ],
  },
  {
    id: "bedtime",
    title: "🌙 睡前",
    tasks: [
      {
        id: "bt_bp",
        label: "量血壓",
        hasInput: true,
        inputPlaceholder: "輸入血壓值 e.g. 120/80",
      },
      {
        id: "bt_bs",
        label: "量血糖",
        hasInput: true,
        inputPlaceholder: "輸入血糖值 e.g. 110",
      },
      { id: "bt_denture", label: "洗假牙" },
    ],
  },
];

export function getAllTasks(): Task[] {
  return TASK_GROUPS.flatMap((g) => g.tasks);
}

export function getEmptyChecklist(date: string): DailyChecklist {
  const tasks: Record<TaskId, boolean> = {};
  const inputs: Record<TaskId, string> = {};
  getAllTasks().forEach((t) => {
    tasks[t.id] = false;
    if (t.hasInput) inputs[t.id] = "";
  });
  return { date, tasks, inputs, updatedAt: new Date().toISOString() };
}

export function getCompletionStats(checklist: DailyChecklist) {
  const all = getAllTasks();
  const total = all.length;
  const done = all.filter((t) => checklist.tasks[t.id]).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return { total, done, pct };
}

// Which tasks belong to the 9AM group (for 10AM conditional reminder)
export const MORNING_POST_IDS = TASK_GROUPS.find(
  (g) => g.id === "morning_post"
)!.tasks.map((t) => t.id);
