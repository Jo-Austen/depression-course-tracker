import { DimensionDefinition, FatigueLevel } from "./types";

export const RECORD_SHEET_NAME = "记录表";
export const SUMMARY_SHEET_NAME = "每日汇总";

export const RECORD_HEADERS = [
  "ID",
  "日期",
  "时间",
  "此刻精神耗竭",
  "此刻身体疲惫",
  "此刻行动启动难度",
  "此刻情绪下沉",
  "此刻头脑迟滞",
  "此刻接触他人的难度",
  "总分",
  "等级",
  "原因摘要",
  "备注",
] as const;

export const SUMMARY_HEADERS = [
  "日期",
  "开盘等级",
  "最高等级",
  "最低等级",
  "收盘等级",
  "记录次数",
  "是否补全",
  "注释",
] as const;

export const LEVELS: FatigueLevel[] = ["N1", "N2", "N3", "N4", "N5", "N6", "N7", "N8", "N9"];

export const DIMENSIONS: DimensionDefinition[] = [
  {
    key: "sleepRecovery",
    label: "此刻精神耗竭",
    weightLabel: "现在是否有被掏空、发空、撑不住的感觉",
    options: [
      { value: 0, label: "0分", description: "现在精神基本稳得住，没有明显被掏空的感觉。" },
      { value: 1, label: "1分", description: "现在有一点空和累，但还撑得住当前这会儿。" },
      { value: 2, label: "2分", description: "现在明显发空、发累，已经影响我继续待在当前状态里。" },
      { value: 3, label: "3分", description: "现在几乎被掏空，像完全撑不住一样。" },
    ],
  },
  {
    key: "physicalFatigue",
    label: "此刻身体疲惫",
    weightLabel: "现在身体有多沉、多累、多乏力",
    options: [
      { value: 0, label: "0分", description: "现在身体基本轻松，没有明显疲惫感。" },
      { value: 1, label: "1分", description: "现在有点沉和累，但还不至于妨碍当前动作。" },
      { value: 2, label: "2分", description: "现在身体明显沉重，连维持当前状态都要用力撑。" },
      { value: 3, label: "3分", description: "现在非常沉重或发虚，连简单动作都很吃力。" },
    ],
  },
  {
    key: "activityTolerance",
    label: "此刻行动启动难度",
    weightLabel: "现在把自己启动起来、开始做事有多难",
    options: [
      { value: 0, label: "0分", description: "现在基本可以直接开始做该做的事。" },
      { value: 1, label: "1分", description: "现在启动有点拖，需要稍微推自己一下。" },
      { value: 2, label: "2分", description: "现在很难开始做事，明显卡住或拖住了。" },
      { value: 3, label: "3分", description: "现在几乎完全起不来做事，像被压住一样。" },
    ],
  },
  {
    key: "lowMood",
    label: "此刻情绪下沉",
    weightLabel: "现在心里有多低、多沉、多难受",
    options: [
      { value: 0, label: "0分", description: "现在情绪基本平稳，没有明显下沉。" },
      { value: 1, label: "1分", description: "现在有些低落或发闷，但还能勉强待住。" },
      { value: 2, label: "2分", description: "现在明显低落难受，已经影响我此刻的状态。" },
      { value: 3, label: "3分", description: "现在非常难受，像整个人都被往下拽。" },
    ],
  },
  {
    key: "cognitiveSlowing",
    label: "此刻头脑迟滞",
    weightLabel: "现在脑子是否发慢、发钝、转不起来",
    options: [
      { value: 0, label: "0分", description: "现在脑子基本清楚，能跟上当前事情。" },
      { value: 1, label: "1分", description: "现在有点慢或发散，但还能勉强拉回来。" },
      { value: 2, label: "2分", description: "现在明显迟钝或分心，思路跟不上。" },
      { value: 3, label: "3分", description: "现在脑子几乎转不动，连简单思考都吃力。" },
    ],
  },
  {
    key: "motivation",
    label: "此刻接触他人的难度",
    weightLabel: "现在面对别人、回应别人有多难",
    options: [
      { value: 0, label: "0分", description: "现在可以正常接触别人或回应别人。" },
      { value: 1, label: "1分", description: "现在有点想躲，但还可以勉强接触。" },
      { value: 2, label: "2分", description: "现在明显不想接触人，回应别人很费力。" },
      { value: 3, label: "3分", description: "现在几乎完全想躲开别人，不想被碰到或打扰。" },
    ],
  },
];
