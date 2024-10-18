import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { DurationIntervalClock } from '../src/index';

test('constructor - default', () => {
  assert.is(new DurationIntervalClock().sampleTargetCount, 10, "default sampleTargetCount should be 10");
  assert.is(new DurationIntervalClock(undefined).sampleTargetCount, 10, "default sampleTargetCount should be 10");
});

test('constructor - valid sample target count', () => {
  for(let count of [1, 100, 10000, 1000000]) {
    assert.is(new DurationIntervalClock(count).sampleTargetCount, count, "sampleTargetCount parameter not respected");
  }
});

test('constructor - invalid sample target count should throw', () => {
  for(let count of [null, NaN, 0, -1, -100, -Infinity, "1", "test", [1], { '1': 1 }, true, Symbol(), () => 1, Promise.resolve(1)]) {
    assert.throws(() => new DurationIntervalClock(count as any), `invalid sampleTargetCount parameter ${JSON.stringify(count)} should not be accepted`);
  }
});

test('expected sample counts', async () => {
  const clock = new DurationIntervalClock(5);
  let expectedIntervalCount = 0, expectedDurationCount = 0;

  for(let i = 0; i < 10; i++) {
    assert.is(clock.intervalSamples.length, expectedIntervalCount);
    assert.is(clock.durationsSamples.length, expectedDurationCount);
    clock.start();
    clock.end();

    if(i <= 2) {
      assert.is(clock.checkHasGoodAverage(0.6), false, `checkHasGoodAverage(0.6) should return false after ${i}/5 measurements`);
    }else if(i >= 4) {
      assert.is(clock.checkHasGoodAverage(0.4), true, `checkHasGoodAverage(0.4) should return true after ${i}/5 measurements`);
    }

    if(i !== 0 && expectedIntervalCount < 5) expectedIntervalCount++;
    if(expectedDurationCount < 5) expectedDurationCount++;
  }

  clock.reset()

  expectedIntervalCount = 0, expectedDurationCount = 0
  for(let i = 0; i < 10; i++) {
    assert.is(clock.intervalSamples.length, expectedIntervalCount);
    assert.is(clock.durationsSamples.length, expectedDurationCount);
    clock.measureSync(() => {});
    if(i !== 0 && expectedIntervalCount < 5) expectedIntervalCount++;
    if(expectedDurationCount < 5) expectedDurationCount++;
  }
  
  clock.reset()

  expectedIntervalCount = 0, expectedDurationCount = 0
  for(let i = 0; i < 10; i++) {
    assert.is(clock.intervalSamples.length, expectedIntervalCount);
    assert.is(clock.durationsSamples.length, expectedDurationCount);
    await clock.measureAsync(() => new Promise(r => setTimeout(r, 1)));
    if(i !== 0 && expectedIntervalCount < 5) expectedIntervalCount++;
    if(expectedDurationCount < 5) expectedDurationCount++;
  }
});

test('methods throw and reset', () => {
  const clock = new DurationIntervalClock(5);

  assert.not.throws(() => clock.end(true), "end(true) should not throw");
  assert.throws(() => clock.end(), "end() should throw");
  assert.is(clock.isStarted, false);
  assert.not.throws(() => clock.start(), "start() should not throw");

  assert.is(clock.isStarted, true);
  assert.throws(() => clock.start(), "start() should throw");
  assert.not.throws(() => clock.start(true), "start(true) should not throw");

  assert.throws(() => clock.reset(), "reset() should throw");
  assert.not.throws(() => clock.end(), "end() should not throw");

  assert.is(clock.isStarted, false);
  
  assert.is(clock.durationsSamples.length, 2);
  assert.is(clock.intervalSamples.length, 1);

  assert.not.throws(() => clock.reset(), "reset() should not throw");
  
  assert.is(clock.lastDuration, undefined);
  assert.is(clock.lastInterval, undefined);
});


test('sane measurements', async () => {
  const clock = new DurationIntervalClock(10);

  const startPerf = performance.now();

  for(let i = 0; i < 10; i++) {
    clock.start();
    await new Promise(r => setTimeout(r, 150));
    clock.end();
    
    const error = 150 - clock.lastDuration!;
    assert.ok(Math.abs(error) < 25, "150ms setTimeout timer duration measured with more than 25ms error! error=" + error.toFixed(1));
  }

  const endPerf = performance.now();

  const errorDuration = 150 - clock.averageDuration!;
  assert.ok(Math.abs(errorDuration) < 15, "10x 150ms setTimeout timer duration averaged with more than 15ms error! error=" + errorDuration.toFixed(1));

  const errorInterval = (endPerf - startPerf)/10 - clock.averageInterval!;
  assert.ok(Math.abs(errorInterval) < 5, "average interval over 10 iterations miscalulated by over 5ms! error=" + errorInterval.toFixed(2));
});


test('readme examples', async () => {
  {
    // average over last 5 measurements
    const dic = new DurationIntervalClock(5);

    dic.start();
    // perform some task
    dic.end();

    // number of milliseconds taken by the task
    dic.lastDuration

    // average, after one measurement will be equal to lastDuration
    dic.averageDuration

    // both will be undefined, start() needs to be called at least twice
    dic.lastInterval, dic.averageInterval
  }

  {
    // average over last 5 measurements
    const dic = new DurationIntervalClock(5);

    for(let i = 0; i <= 20; i++) {
        const ret = await dic.measureAsync(async () => {
            // some async task
            await new Promise(r => setTimeout(r, 100 + i * 10));
            return "ret value";
        });

        // await new Promise(r => setTimeout(r, 100));

        if(i % 5 === 0) {
            console.log("\nIteration", i)
            console.log("  lastDuration:", dic.lastDuration);
            console.log("  averageDuration:", dic.averageDuration);
            console.log("  lastInterval:", dic.lastInterval);
            console.log("  averageInterval:", dic.averageInterval);
        }
    }
  }
});

test.run();
