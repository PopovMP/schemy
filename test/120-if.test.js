'use strict'

const assert         = require('assert')
const {describe, it} = require('@popovmp/mocha-tiny')
const Schemy         = require('../assets/js/schemy.js').Schemy

const schemy = new Schemy()

describe('if', function () {
	it('(if #t 1 2) → 1', function () {
		assert.strictEqual(schemy.evaluate('(if #t 1 2)'), 1)
	})

	it('(if #f 1 2) → 2', function () {
		assert.strictEqual(schemy.evaluate('(if #f 1 2)'), 2)
	})

	it('(if (= 8 (+ 7 1)) (+ 1 2) 2) → 3', function () {
		assert.strictEqual(schemy.evaluate('(if (= 8 (+ 7 1)) (+ 1 2) 2)'), 3)
	})

	it('(if #f 1 (+ 2 2)) → 4', function () {
		assert.strictEqual(schemy.evaluate('(if #f 1 (+ 2 2))'), 4)
	})

	it('(if 1 1 2) → 1', function () {
		assert.strictEqual(schemy.evaluate('(if 1 1 2)'), 1)
	})

	it('(if 0 1 2) → 1', function () {
		assert.strictEqual(schemy.evaluate('(if 0 1 2)'), 1)
	})

	it('when truthy \'if\' evaluates only the \'than clause\'', function () {
		assert.strictEqual(schemy.evaluate('(if 1 1 a)'), 1)
	})

	it('when faulty \'if\' evaluates only the \'else clause\'', function () {
		assert.strictEqual(schemy.evaluate('(if #f a 1)'), 1)
	})

	it('truthy condition returns builtin function', function () {
		assert.strictEqual(schemy.evaluate('((if 1 + -) 4 3)'), 7)
	})

	it('faulty condition returns builtin function', function () {
		assert.strictEqual(schemy.evaluate('((if #f + -) 4 3)'), 1)
	})

	it('(if #f 1) -> undefined', function () {
		assert.strictEqual(schemy.evaluate('(if #f 1)'), undefined)
	})

	it('(define a (if #f 1)) -> throws', function () {
		assert.strictEqual(schemy.evaluate('(define a (if #f 1))'),
			'Error: cannot set unspecified value to symbol: a.')
	})
})
