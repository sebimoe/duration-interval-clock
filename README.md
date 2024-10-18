# `duration-interval-clock` [github](https://github.com/sebimoe/duration-interval-clock), [npm](https://www.npmjs.com/package/duration-interval-clock)

A small library to measure the duration and interval of execution, including averaging.

Measures time between `start()`, `end()` to provide duration, and between `start()` and the subsequent `start()` to provide interval, both with built-in window-averaging.


## Usage

Simple usage:

```ts
import { DurationIntervalClock } from 'duration-interval-clock';

// defaults to average over 10 last measurements
const dic = new DurationIntervalClock();

dic.start();
// perform some task
dic.end();

// number of milliseconds taken by the task
dic.lastDuration

// average, after one measurement will be equal to lastDuration
dic.averageDuration

// both will be undefined, start() needs to be called at least twice
dic.lastInterval, dic.averageInterval
```

Example:

```ts
import { DurationIntervalClock } from 'duration-interval-clock';

// average over last 5 measurements
const dic = new DurationIntervalClock(5);

for(let i = 0; i <= 20; i++) {
    const ret = await dic.measureAsync(async () => {
        // some async task
        await new Promise(r => setTimeout(r, 100 + i * 10));
        return "ret value";
    });

    new Promise(r => setTimeout(r, 50));

    if(i % 5 === 0) {
        console.log("\nIteration", i)
        console.log("  lastDuration:", dic.lastDuration);
        console.log("  averageDuration:", dic.averageDuration);
        console.log("  lastInterval:", dic.lastInterval);
        console.log("  averageInterval:", dic.averageInterval);
    }
}
```
Types:
```ts
class DurationIntervalClock {
    sampleTargetCount: number;
    durationsSamples: number[];
    intervalSamples: number[];

    constructor(sampleTargetCount?: number = 10);
    
    reset(): void;
    
    start(endIfAlreadyStarted?: boolean = false): void;
    end(ignoreIfNotStarted?: boolean = false): void;
    
    measureAsync<T>(fn: () => Promise<T>): Promise<T>;
    measureSync<T>(fn: () => T): T;
    
    checkHasGoodAverage(q?: number = 0.5): boolean;
    get isStarted(): boolean;
    get lastDuration(): number | undefined;
    get lastInterval(): number | undefined;
    get averageDuration(): number | undefined;
    get averageInterval(): number | undefined;
}
```

## FAQ

### 1. What is interval and duration?

Last interval measures start()-to-start(), last duration measures subsequent start()-to-end().

### 2. Why is my last interval smaller than last duration?

It means duration of the _previous_ measurement must have been shorter than the duration of the _current_ measurement.
