import { describe, expect, it } from "vitest";
import { buildDailyCandles, levelFromScore, scoreEntry } from "./scoring";

describe("levelFromScore", () => {
  it("maps core score bands to N levels", () => {
    expect(
      levelFromScore(0, {
        sleepRecovery: 0,
        physicalFatigue: 0,
        activityTolerance: 0,
        lowMood: 0,
        cognitiveSlowing: 0,
        motivation: 0,
      }),
    ).toBe("N1");

    expect(
      levelFromScore(10, {
        sleepRecovery: 2,
        physicalFatigue: 2,
        activityTolerance: 2,
        lowMood: 2,
        cognitiveSlowing: 1,
        motivation: 1,
      }),
    ).toBe("N5");
  });

  it("raises a level at the upper boundary when severe physical fatigue is present", () => {
    expect(
      levelFromScore(10, {
        sleepRecovery: 1,
        physicalFatigue: 3,
        activityTolerance: 2,
        lowMood: 1,
        cognitiveSlowing: 2,
        motivation: 1,
      }),
    ).toBe("N6");
  });
});

describe("buildDailyCandles", () => {
  it("builds OHLC values by date order and imputes missing days", () => {
    const first = scoreEntry({
      date: "2026-06-20",
      time: "08:00",
      scores: {
        sleepRecovery: 0,
        physicalFatigue: 1,
        activityTolerance: 1,
        lowMood: 0,
        cognitiveSlowing: 0,
        motivation: 0,
      },
    });

    const second = scoreEntry({
      date: "2026-06-20",
      time: "20:00",
      scores: {
        sleepRecovery: 2,
        physicalFatigue: 2,
        activityTolerance: 2,
        lowMood: 2,
        cognitiveSlowing: 1,
        motivation: 1,
      },
    });

    const third = scoreEntry({
      date: "2026-06-22",
      time: "10:00",
      scores: {
        sleepRecovery: 3,
        physicalFatigue: 3,
        activityTolerance: 3,
        lowMood: 2,
        cognitiveSlowing: 2,
        motivation: 1,
      },
    });

    const candles = buildDailyCandles([third, second, first]);
    expect(candles).toHaveLength(3);
    expect(candles[0]).toMatchObject({
      date: "2026-06-20",
      open: first.level,
      close: second.level,
      isImputed: false,
    });
    expect(candles[1]).toMatchObject({
      date: "2026-06-21",
      open: second.level,
      close: second.level,
      isImputed: true,
    });
    expect(candles[2].annotation).toBeTruthy();
  });
});
