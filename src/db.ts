import lowdb from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync'
import shortid from 'shortid'

import config, { QuestTypeKeys } from './config'

export class DB {
    private db: lowdb.LowdbSync<any>

    constructor(
        path: string = config.DB_PATH,
        workerCount: number = config.WORKER_COUNT,
        seed: number = config.ID_SEED
    ) {
        const adapter = new FileSync<any>(path)
        this.db = lowdb(adapter)
        shortid.seed(seed)
        shortid.worker(workerCount)

        Object.keys(QuestTypeKeys).forEach((key) => {
            const table = QuestTypeKeys[key]
            if (!this.has(table)) this.set(table, [])
        })

        if (!this.has('quest_number')) this.set('quest_number', 0)
    }

    public read(): lowdb.LowdbSync<any> {
        return this.db.read()
    }

    public createId(): string {
        return shortid.generate()
    }

    public push<T>(key: string, data: T): T[] {
        return (
            this.read()
                .get(key)
                //@ts-ignore
                .push(data)
                .write()
        )
    }

    public delete<T = any>(key: string, id: string): T[] {
        return (
            this.read()
                .get(key)
                //@ts-ignore
                .remove({
                    id,
                })
                .write()
        )
    }

    public find<T>(key: string, query: Partial<T>): void | T {
        return (
            this.read()
                .get(key)
                //@ts-ignore
                .find(query)
                .value()
        )
    }

    public update<T>(key: string, query: Partial<T>, data: Partial<T>): T {
        return (
            this.read()
                .get(key)
                //@ts-ignore
                .find(query)
                .assign(data)
                .write()
        )
    }

    public get<T>(key: string = ''): T {
        return this.read().get(key).value()
    }

    public set<T>(key: string, value: T) {
        return this.read().set(key, value).write()
    }

    public has(key: string): boolean {
        return this.read().has(key).value()
    }
}

const db = new DB()
export default db
