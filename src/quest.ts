import { MINUTE, TimeOptions, timeOptionsToMS } from 'time-remaining'
import { QuestTypeKeys, QuestTypes } from './config'

import db from './db'
import { ExpireMap } from './expire'
import { Timestamp } from './types'

export type HTML = string
export type ID = string

export const enum QuestStates {
    INITIALIZATION,
    STARTED,
    COMPLETED,
    FAILED,
}

const QUEST_EXPIRE_MAP = new ExpireMap<ID, (value: any) => void>(360)

function emitEvents<T>(names: ID[], value: T): void {
    let cb: (value: any) => void | null
    names.forEach((id: ID) => {
        cb = QUEST_EXPIRE_MAP.get(id)
        cb && cb(value)
    })
}

function setEvent<T>(name: ID, callback: (value: T) => void): void {
    QUEST_EXPIRE_MAP.set(name, callback)
}

function patchId<T extends { id?: string }>(options: T): void {
    if (!options.id) options.id = db.createId()
}

function patchType<T extends { type?: QuestTypes }>(
    options: T,
    type: QuestTypes
): void {
    if (!options.type) options.type = type
}

function patchState<T extends { state?: QuestStates }>(options: T): void {
    if (!options.state) options.state = QuestStates.INITIALIZATION
}

function patchNumber<T extends { number?: string }>(
    options: T,
    type: QuestTypes
) {
    if (!options.number) options.number = getQuestNumber(type)
}

function patchTime<
    T extends {
        finish?: Timestamp
        creation?: Timestamp
    }
>(options: T) {
    if (!options.creation) options.creation = Date.now()
    if (!options.finish) options.finish = -1
}

function patchEvents<T extends { events?: ID[] }>(options: T): void {
    if (!options.events) options.events = []
}

type Data<T> = Required<T>

function patchOptions<T extends Quest<R>, R extends QuestTypes>(
    options: T,
    type: R,
    ...patchOthers: ((options: Data<Quest<R>>, type: R) => boolean)[]
): options is Data<T> {
    patchId(options)
    patchTime(options)
    patchType(options, type)
    patchState(options)
    patchNumber(options, type)
    patchEvents(options)
    patchOthers &&
        patchOthers.every((fn) => {
            return fn(options as any, type)
        })
    return true
}

function getQuestNumber(type: QuestTypes) {
    const lastNumber = db.get<number>('quest_number')
    const arr = new Array(lastNumber)
    let numberString = '00000000'
    if (arr.length < 8) {
        numberString.slice(arr.length)
        numberString += lastNumber
    }
    db.set('quest_number', lastNumber + 1)
    return `${type}${numberString}`
}

export interface Quest<T = any> {
    name: string
    description: HTML
    id?: string
    type?: T
    state?: QuestStates
    number?: string
    events?: ID[]
    finish?: Timestamp
    creation?: Timestamp
}

export function findQuest<T extends Quest>(
    id: string,
    type: QuestTypes
): void | Data<T> {
    return db.find<Data<T>>(QuestTypeKeys[type], { id } as any)
}

export function updateQuest<T extends Quest>(
    query: Partial<T>,
    data: Partial<T>,
    type: QuestTypes
): void | Data<T> {
    return db.update<Data<T>>(QuestTypeKeys[type], query, data)
}

export function pushQuest<T extends Quest>(
    data: Data<T>,
    type: QuestTypes
): void | Data<T>[] {
    return db.push<Data<T>>(QuestTypeKeys[type], data)
}

export interface ClickQuest extends Quest<QuestTypes.CLICK_QUEST> { }

export function createClickQuest(options: ClickQuest): void {
    if (!patchOptions(options, QuestTypes.CLICK_QUEST)) return
    pushQuest(options, QuestTypes.CLICK_QUEST)
}

export function completeClickQuest(id: string): boolean {
    const quest = findQuest<ClickQuest>(id, QuestTypes.CLICK_QUEST)
    if (!quest) return false
    if (quest.state != QuestStates.INITIALIZATION) return false

    updateQuest<ClickQuest>(
        { id },
        {
            state: QuestStates.COMPLETED,
            finish: Date.now(),
        },
        QuestTypes.CLICK_QUEST
    )

    if (quest.events.length > 0) emitEvents(quest.events, quest)
    return true
}

export interface TimerQuest extends Quest<QuestTypes.TIMER_QUEST> {
    start?: Timestamp
    MS?: number
}

export function createTimerQuest(options: TimerQuest, time?: TimeOptions) {
    const patchOthers = () => {
        if (!options.MS)
            if (time) options.MS = timeOptionsToMS(time)
            else options.MS = MINUTE * 60
        if (!options.start) options.start = -1
        return true
    }
    if (!patchOptions(options, QuestTypes.TIMER_QUEST, patchOthers)) return
    pushQuest(options, QuestTypes.TIMER_QUEST)
}

export function startTimerQuest(id: string): boolean {
    const quest = findQuest<TimerQuest>(id, QuestTypes.TIMER_QUEST)
    if (!quest) return false
    if (quest.state != QuestStates.INITIALIZATION) return false

    updateQuest<TimerQuest>(
        { id },
        {
            state: QuestStates.STARTED,
            start: Date.now(),
        },
        QuestTypes.TIMER_QUEST
    )

    if (quest.events.length > 0) emitEvents(quest.events, quest)

    return true
}

export function failTimerQuest(id: string): boolean {
    const quest = findQuest<TimerQuest>(id, QuestTypes.TIMER_QUEST)
    const now = Date.now()
    if (!quest) return false
    if (quest.state != QuestStates.STARTED) return false
    if (now <= quest.start + quest.MS) return false

    updateQuest<TimerQuest>(
        { id },
        {
            state: QuestStates.FAILED,
            finish: Date.now(),
        },
        QuestTypes.TIMER_QUEST
    )

    if (quest.events.length > 0) emitEvents(quest.events, quest)

    return true
}

export function completeTimerQuest(id: string): boolean {
    const quest = findQuest<TimerQuest>(id, QuestTypes.TIMER_QUEST)
    const now = Date.now()
    if (!quest) return false
    if (quest.state != QuestStates.STARTED) return false
    if (now > quest.start + quest.MS) {
        updateQuest<TimerQuest>(
            { id },
            {
                state: QuestStates.FAILED,
                finish: Date.now(),
            },
            QuestTypes.TIMER_QUEST
        )
        return false
    }

    updateQuest<TimerQuest>(
        { id },
        {
            state: QuestStates.COMPLETED,
            finish: Date.now(),
        },
        QuestTypes.TIMER_QUEST
    )

    if (quest.events.length > 0) emitEvents(quest.events, quest)

    return true
}

export interface SidelineQuest extends Quest<QuestTypes.SIDELINE_QUEST> {
    head?: ID
    order: ID[] | null
    dep?: ID[]
    start?: number
}

export function createSidelineQuest(options: SidelineQuest) {
    if (
        !patchOptions(
            options,
            QuestTypes.SIDELINE_QUEST,
            (opt) => {
                if (options.state === QuestStates.INITIALIZATION && !options.start)
                    options.start = -1
                if (!options.head) options.head = opt.id
                if (options.head === opt.id) {
                    options.order = []
                    options.state = QuestStates.STARTED
                    options.start = Date.now()
                } else {
                    options.order = null
                    const head = findQuest<SidelineQuest>(
                        options.head,
                        QuestTypes.SIDELINE_QUEST
                    )
                    if (!head) return false
                    head.order.push(opt.id)
                    updateQuest<SidelineQuest>(
                        { id: head.id },
                        {
                            order: head.order,
                        },
                        QuestTypes.SIDELINE_QUEST
                    )
                }
                return true
            }
        )
    ) return
    pushQuest(options, QuestTypes.SIDELINE_QUEST)
}

export function completeSidelineQuest(id: string) {

}

export interface MainlineQuest extends Quest<QuestTypes.MAINLINE_QUEST> { }

export function createMainlineQuest(options: MainlineQuest) {
    db.push('mainline_quest', options)
}

export interface ActivityQuest extends Quest<QuestTypes.ACTIVITY_QUEST> { }

export function createActivityQuest(options: ActivityQuest) {
    db.push('activity_quest', options)
}

export interface DailyQuest extends Quest<QuestTypes.DAILY_QUEST> { }

export function createDailyQuest(options: DailyQuest) {
    db.push('daily_quest', options)
}

export interface WeeklyQuest extends Quest<QuestTypes.WEEKLY_QUEST> { }

export function createWeeklyQuest(options: WeeklyQuest) {
    db.push('weekly_quest', options)
}

export interface MonthlyQuest extends Quest<QuestTypes.MONTHLY_QUEST> { }

export function createMonthlyQuest(options: MonthlyQuest) {
    db.push('monthly_quest', options)
}
