'use strict';

// Durable unit test for the token-profiler cost model. The weighting function is
// a pure business rule whose error is silent and would corrupt every ranking, so
// it earns a durable test (Node's built-in node:test, zero dependencies).
//
// Expected values are hand-computed against the shipped PRICES constant. The
// formula under test is:
//   cost = (input*inP + output*outP + cacheWrite5m*inP*1.25
//           + cacheWrite1h*inP*2.0 + cacheRead*inP*0.1) / 1e6

const test = require('node:test');
const assert = require('node:assert/strict');

const { turnCostUSD, resolveModelRate, PRICES } = require('./token-profiler.js');

// Costs are computed in floating point; compare within a tight epsilon.
function assertClose(actual, expected, msg) {
    assert.ok(Math.abs(actual - expected) < 1e-12, `${msg}: got ${actual}, want ${expected}`);
}

test('Opus turn with a full mix of token types', () => {
    // Opus rate: input 5.00, output 25.00 per MTok.
    //   input      1000 * 5           = 5000
    //   output      500 * 25          = 12500
    //   write5m    2000 * 5 * 1.25    = 12500
    //   write1h    1000 * 5 * 2.0     = 10000
    //   cacheRead 10000 * 5 * 0.1     = 5000
    //   sum = 45000 / 1e6             = 0.045
    const turn = {
        model: 'claude-opus-4-8',
        input: 1000,
        output: 500,
        cacheWrite5m: 2000,
        cacheWrite1h: 1000,
        cacheRead: 10000
    };
    assertClose(turnCostUSD(turn, PRICES), 0.045, 'opus mixed turn');
});

test('cache-read (0.1x) and output multipliers pinned explicitly', () => {
    // Isolates the two multipliers a silent bug is most likely to corrupt.
    //   output    1000 * 25       = 25000
    //   cacheRead 1000 * 5 * 0.1  = 500
    //   sum = 25500 / 1e6         = 0.0255
    // If cache-read were billed at 1.0x it would read 0.030 instead.
    const turn = {
        model: 'claude-opus-4-8',
        input: 0,
        output: 1000,
        cacheWrite5m: 0,
        cacheWrite1h: 0,
        cacheRead: 1000
    };
    assertClose(turnCostUSD(turn, PRICES), 0.0255, 'output+cacheRead pin');
});

test('Sonnet turn uses the Sonnet rate', () => {
    // Sonnet rate: input 3.00, output 15.00 per MTok.
    //   input      2000 * 3         = 6000
    //   output     1000 * 15        = 15000
    //   cacheRead 50000 * 3 * 0.1   = 15000
    //   sum = 36000 / 1e6           = 0.036
    const turn = {
        model: 'claude-sonnet-5',
        input: 2000,
        output: 1000,
        cacheRead: 50000
    };
    assertClose(turnCostUSD(turn, PRICES), 0.036, 'sonnet turn');
});

test('Haiku turn resolves a dated model-id variant leniently', () => {
    // A transcript can carry 'claude-haiku-4-5-20251001'; it must resolve to the
    // base 'claude-haiku-4-5' rate (input 1.00, output 5.00), not the fallback.
    //   input   1000 * 1  = 1000
    //   output   500 * 5  = 2500
    //   sum = 3500 / 1e6  = 0.0035
    const turn = { model: 'claude-haiku-4-5-20251001', input: 1000, output: 500 };
    const resolved = resolveModelRate(turn.model, PRICES);
    assert.equal(resolved.unknown, false, 'dated variant is a known model');
    assert.equal(resolved.model, 'claude-haiku-4-5', 'variant resolves to base key');
    assertClose(turnCostUSD(turn, PRICES), 0.0035, 'haiku variant turn');
});

test('unknown model falls back to the Opus rate and is flagged', () => {
    const unknown = { model: 'claude-mystery-9', input: 1000, output: 500 };
    const asOpus = { model: 'claude-opus-4-8', input: 1000, output: 500 };

    const resolved = resolveModelRate(unknown.model, PRICES);
    assert.equal(resolved.unknown, true, 'unknown model flagged');
    assert.equal(resolved.model, 'claude-opus-4-8', 'fallback is the Opus rate');

    // The fallback cost must equal the same turn priced as Opus.
    assertClose(
        turnCostUSD(unknown, PRICES),
        turnCostUSD(asOpus, PRICES),
        'unknown-model fallback equals Opus cost'
    );

    // A known model is not flagged.
    assert.equal(resolveModelRate('claude-opus-4-8', PRICES).unknown, false, 'known model not flagged');
});
