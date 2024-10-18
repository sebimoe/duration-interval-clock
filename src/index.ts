
export class DurationIntervalClock {
  durationsSamples: number[] = [];
  intervalSamples: number[] = [];
  private lastStart: number | null = null;
  private started: boolean = false;
  
  constructor(public sampleTargetCount: number = 10) {
    if(typeof sampleTargetCount !== "number" || !(sampleTargetCount >= 1)) {
      throw new Error("DurationIntervalClock was given invalid target sample count. Positive number required.");
    }
  }

  reset() {
    if(this.started) throw new Error("Cannot reset clock while it is started.");
    this.lastStart = null;
    this.durationsSamples = [];
    this.intervalSamples = [];
  }

  start(endIfAlreadyStarted = false) {
    if(this.started) {
      if(endIfAlreadyStarted) {
        this.end();
      }else{
        throw new Error("Clock started before it was stopped.");
      }
    }
    this.started = true;

    const now = performance.now();
    if(this.lastStart !== null) {
      this.intervalSamples.push(now - this.lastStart);
      while(this.intervalSamples.length > this.sampleTargetCount) this.intervalSamples.shift();
    }
    this.lastStart = now;
  }

  end(ignoreIfNotStarted = false) {
    if(!this.started) {
      if(ignoreIfNotStarted) {
        return;
      }else{
        throw new Error("Clock stopped before it was started.");
      }
    }
    this.started = false;

    this.durationsSamples.push(performance.now() - this.lastStart!);
    while(this.durationsSamples.length > this.sampleTargetCount) this.durationsSamples.shift();
  }

  async measureAsync<T>(fn: () => Promise<T>): Promise<T> {
    this.start();
    try {
      return await fn();
    }finally{
      this.end();
    }
  }
  
  measureSync<T>(fn: () => T): T {
    this.start();
    try {
      return fn();
    }finally{
      this.end();
    }
  }

  checkHasGoodAverage(q = 0.5) {
    const requiredSamples = Math.max(1, Math.min(this.sampleTargetCount, Math.round(q * this.sampleTargetCount)));
    return this.intervalSamples.length >= requiredSamples;
  }
  
  get isStarted() {
    return this.started;
  }

  get lastDuration() {
    return this.durationsSamples.at(-1);
  }

  get lastInterval() {
    return this.intervalSamples.at(-1);
  }

  get averageDuration() {
    if(!this.durationsSamples.length) return undefined;
    return this.durationsSamples.reduce((a, b) => a + b) / this.durationsSamples.length;
  }

  get averageInterval() {
    if(!this.intervalSamples.length) return undefined;
    return this.intervalSamples.reduce((a, b) => a + b) / this.intervalSamples.length;
  }
}

