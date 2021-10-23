'use strict'

const assert         = require('assert')
const {describe, it} = require('@popovmp/mocha-tiny')
const Schemy           = require('../assets/js/schemy.js').Schemy

const schemy = new Schemy()

describe('Eval basics', function () {
	describe('Built in constants', function () {
		it('digits: 1 → 1', function () {
			assert.strictEqual(schemy.evaluate('1'), 1)
		})
	})

	describe('Number operators', function () {
		it('add: (+ 1 2) → 3', function () {
			assert.strictEqual(schemy.evaluate('(+ 1 2)'), 3)
		})
		it('add: (+ (+ 1 2) 3) → 6', function () {
			assert.strictEqual(schemy.evaluate('(+ (+ 1 2) 3)'), 6)
		})
		it('subtract: (- 3 1) → 2', function () {
			assert.strictEqual(schemy.evaluate('(- 3 1)'), 2)
		})
		it('subtract: (- (+ 3 2) 1) → 4', function () {
			assert.strictEqual(schemy.evaluate('(- (+ 3 2) 1)'), 4)
		})
		it('modulo: (% 13 2) → 1', function () {
			assert.strictEqual(schemy.evaluate('(% 13 2)'), 1)
		})
		it('modulo: (% 14 2) → 0', function () {
			assert.strictEqual(schemy.evaluate('(% 14 2)'), 0)
		})
	})

	describe('Eval multiple expressions', function () {
		it('1 2 → 2', function () {
			assert.strictEqual(schemy.evaluate('1 2'), 2)
		})
		it('3 (+ 1 1) → 2', function () {
			assert.strictEqual(schemy.evaluate('3 (+ 1 1)'), 2)
		})
	})

	describe('pair?', function () {
		it(`(pair? (list)) → #f`, function () {
			assert.strictEqual(schemy.evaluate(`(pair? (list))`), false)
		})

		it(`(pair? (list 1)) → #t`, function () {
			assert.strictEqual(schemy.evaluate(`(pair? (list 1))`), true)
		})

		it(`(pair? (cdr '(1))) → #f`, function () {
			assert.strictEqual(schemy.evaluate(`(pair? (cdr '(1)))`), false)
		})

		it(`(pair? (cdr '(1 2))) → #t`, function () {
			assert.strictEqual(schemy.evaluate(`(pair? (cdr '(1 2)))`), true)
		})

		it(`(pair? (cdr (list 1 2))) → #t`, function () {
			assert.strictEqual(schemy.evaluate(`(pair? (cdr (list 1 2)))`), true)
		})
	})

	describe('String format', function () {
		it('(format "foo: ~S" 3) → "foo: 3"', function () {
			assert.strictEqual(schemy.evaluate(`(format "foo: ~S" 3)`), 'foo: 3')
		})

		it('(format "foo: ~S, bar: ~S" 3 4) → "foo: 3, bar: 4"', function () {
			assert.strictEqual(schemy.evaluate(`(format "foo: ~S, bar: ~S" 3 4)`), 'foo: 3, bar: 4')
		})
	})
})
