import { MultiLayeredStore } from "./store"
import { MemoryStore } from "./memory.store-adapter"
import { firstValueFrom, interval, take, timeout } from "rxjs"


const defer = () => new Promise(resolve => setTimeout(resolve, 0))

async function* rxjsToGenerators(observable) {
    let values = [];
    let error = null;
    let done = false;
    observable.subscribe(
        data => values.push(data),
        err => error = err,
        () => done = true);
    for (; ;) {
        if (values.length) {
            for (const value of values)
                yield value;
            values = [];
        }
        if (error)
            throw error;
        if (done)
            return;
        await defer();
    }
}






describe('Multilayers Store', () => {



    it('Upserting: should auto store the value in "fast" after reading it once from "slow"', async () => {

        const fast = new MemoryStore('fast',)
        const slow = new MemoryStore('slow',)

        const cache = new MultiLayeredStore([fast, slow], { debug: true }) // the order of the stores determines the layers of the cache


        const [key, value] = ["TEST-KEY", "TEST-VALUE"]
        await slow.SET(key, value) // assume that "slow" has the value

        const r1 = await cache.FETCH(key)
        expect(r1.store).toStrictEqual('slow') //first read that triggers the upsert into "fast"

        const r2 = await cache.FETCH(key)
        expect(r2.store).toStrictEqual('fast') //assets the value is already in "fast"

    })

    it('should sync key between 2 stores', async () => {

        const fast = new MemoryStore('fast',)
        const slow = new MemoryStore('slow',)

        const cache = new MultiLayeredStore([fast, slow], { debug: true }) // the order of the stores determines the layers of the cache
        cache.track('TEST-KEY', 'slow', 'fast')


        const [key, value] = ["TEST-KEY", "TEST-VALUE"]
        await slow.SET(key, value) // assume that "slow" has the value

        const r2 = await cache.FETCH(key)
        expect(r2.store).toStrictEqual('fast') //assets the value is already in "fast"

    })


})


describe('Expiry', () => {

    it('should be auto collected after expiry time', async () => {

        const store = new MemoryStore('store', { garbageCollectionInterval: 500 }) //increase GC interval to speed up test

        const [key, value] = ["TEST-KEY", "TEST-VALUE"]
        await store.SET(key, value, { expire: 200 }) // make it expire in 200ms
        const x = await firstValueFrom(store.on('EXPIRE').pipe(timeout(600))) //by 600ms GC should have had run and emited the event
        expect(x.key).toStrictEqual(key)

        const r1 = await store.FETCH(key)
        expect(r1).toBeUndefined() // the value should have been GCed
    })

    it('GC should switch on aggressive mode', async () => {

        const store = new MemoryStore('store', { garbageCollectionInterval: 500, aggresiveThresholdPerItems: 1, markAsColdAfter: 100 }) //increase GC interval to speed up test and decrease limits to trigger aggressive GC

        const [key, value] = ["TEST-KEY", "TEST-VALUE"]
        await store.SET(key, value)
        const x = await firstValueFrom(store.on('EXPIRE').pipe(timeout(600))) //by 600ms GC should have had run and emited the event
        expect(x.key).toStrictEqual(key)

        const r1 = await store.FETCH(key)
        expect(r1).toBeUndefined() // the value should have been GCed
    })

    it('GC should not collect frequntly accessed value', async () => {

        const store = new MemoryStore('store', { garbageCollectionInterval: 500, aggresiveThresholdPerItems: 1, markAsColdAfter: 500 }) //increase GC interval to speed up test and decrease limits to trigger aggressive GC

        const [key, value] = ["TEST-KEY", "TEST-VALUE"]
        await store.SET(key, value)

        const rx = interval(200).pipe(take(10))
        for await (const _i of rxjsToGenerators(rx)) {
            await store.GET(key)
        }

        const r1 = await store.GET(key)
        expect(r1).toStrictEqual(value) // the value should have not been GCed
    })

    it('slide expire', async () => {
        const store = new MemoryStore('store', { garbageCollectionInterval: 500 })
        const [key, value] = ["TEST-KEY", "TEST-VALUE"]

        await store.SET(key, value, { expire: 400 }) // make it expire in 400ms
        const rx = interval(200).pipe(take(10))
        for await (const _i of rxjsToGenerators(rx)) {
            await store.GET(key, { expire: 'slide' })
        }

        const r1 = await store.GET(key)
        expect(r1).toStrictEqual(value)

    })


})
