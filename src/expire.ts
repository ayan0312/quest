import { Second, Timestamp } from './types'

interface MapData<T> {
    expire: Timestamp
    data: T
}

export class ExpireMap<T extends string | symbol | number, R> {
    private _map: Map<T, MapData<R>> = new Map()
    private _expire: Second

    constructor(expire: Second = 180) {
        this._expire = expire
    }

    public get(key: T): R | null {
        if (!this.has(key)) return null
        return this._map.get(key).data
    }

    public set(key: T, value: R, expire?: Second): void {
        if (this.has(key)) return
        this._map.set(key, {
            expire: Date.now() + (expire || this._expire),
            data: value,
        })
    }

    public has(key: T): boolean {
        if (!this._map.has(key)) return false
        const data = this._map.get(key)
        if (data.expire < Date.now()) {
            this._map.delete(key)
            return false
        }
        return true
    }
}
