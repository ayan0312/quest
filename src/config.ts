export const enum QuestTypes {
    CLICK_QUEST,
    TIMER_QUEST,
    SIDELINE_QUEST,
    MAINLINE_QUEST,
    ACTIVITY_QUEST,
    DAILY_QUEST,
    WEEKLY_QUEST,
    MONTHLY_QUEST,
}

export const QuestTypeKeys: Record<QuestTypes, string> = {
    [QuestTypes.CLICK_QUEST]: 'click_quest',
    [QuestTypes.TIMER_QUEST]: 'timer_quest',
    [QuestTypes.SIDELINE_QUEST]: 'sideline_quest',
    [QuestTypes.MAINLINE_QUEST]: 'mainline_quest',
    [QuestTypes.ACTIVITY_QUEST]: 'activity_quest',
    [QuestTypes.DAILY_QUEST]: 'daily_quest',
    [QuestTypes.WEEKLY_QUEST]: 'weekly_quest',
    [QuestTypes.MONTHLY_QUEST]: 'monthly_quest',
}

export default {
    DB_PATH: './quest.json',
    WORKER_COUNT: 2,
    ID_SEED: 100,
}
