"use strict";

const assert = require("assert");
const {describe, it} = require("@popovmp/mocha-tiny");
const Schemy = require("../assets/js/schemy.js").Schemy;

const schemy = new Schemy();

describe('core-lib', function () {
    describe('+', function () {
        it('two numbers', function () {
            assert.strictEqual(schemy.evaluate(` (+ 2 3) `), 5);
        });
    });

    describe('-', function () {
        it('two args', function () {
            assert.strictEqual(schemy.evaluate(` (- 8 3) `), 5);
        });
        it('no args', function () {
            assert.strictEqual(schemy.evaluate(` (-) `),
                "Error: '-' requires 2 arguments. Given: 0 arguments");
        });
        it('three args', function () {
            assert.strictEqual(schemy.evaluate(` (- 8 3 2) `),
                "Error: '-' requires 2 arguments. Given: 3 arguments");
        });
    });

    describe('*', function () {
        it('two args', function () {
            assert.strictEqual(schemy.evaluate(` (* 2 3) `), 6);
        });
    });

    describe('/', function () {
        it('no args', function () {
            assert.strictEqual(schemy.evaluate(` (/)     `),
                "Error: '/' requires 2 arguments. Given: 0 arguments");
        });
        it('one arg', function () {
            assert.strictEqual(schemy.evaluate(` (/ 5)   `),
                "Error: '/' requires 2 arguments. Given: 1 argument");
        });
        it('divide by zero', function () {
            assert.strictEqual(schemy.evaluate(` (/ 5 0) `),
                "Error: '/' division by zero.");
        });
        it('correct division', function () {
            assert.strictEqual(schemy.evaluate(` (/ 9 3) `), 3);
        });
    });

    describe('modulo', function () {
        it('positive numb', function () {
            assert.strictEqual(schemy.evaluate(` (modulo 10 3) `), 1);
        });
        it('negative numb', function () {
            assert.strictEqual(schemy.evaluate(` (modulo -10.0 3) `), -1);
        });
        it('both args negative', function () {
            assert.strictEqual(schemy.evaluate(` (modulo -10.0 -3) `), -1);
        });
    });

    describe('=', function () {
        it('no args', function () {
            assert.strictEqual(schemy.evaluate(` (=) `), "Error: '=' requires 2 arguments. Given: 0 arguments");
        });
        it('one arg', function () {
            assert.strictEqual(schemy.evaluate(` (= 5) `), "Error: '=' requires 2 arguments. Given: 1 argument");
        });
        it('two different args', function () {
            assert.deepStrictEqual(schemy.evaluate(` (= 2 3) `), false);
        });
        it('two equal args', function () {
            assert.strictEqual(schemy.evaluate(` (= 3 3) `), true);
        });
    });
});
