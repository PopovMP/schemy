'use strict'

const assert         = require('assert')
const {describe, it} = require('@popovmp/mocha-tiny')
const Schemy         = require('../assets/js/schemy.js').Schemy

const schemy = new Schemy()

describe('EASL design', function () {

	describe('numbers', function () {
		it('42 -> 42', function () {
			assert.strictEqual(schemy.evaluate(`  42  `), 42)
		})

		it('3.14 -> 3.14', function () {
			assert.strictEqual(schemy.evaluate(`  3.14  `), 3.14)
		})
	})

	describe('boolean truthy', function () {
		it('true', function () {
			assert.strictEqual(schemy.evaluate(`(if #t 1 0)`), 1)
		})

		it('number 0', function () {
			assert.strictEqual(schemy.evaluate(`(if 0 1 0)`), 1)
		})

		it('number different than 0', function () {
			assert.strictEqual(schemy.evaluate(`(if 500 1 0)`), 1)
		})

		it('empty list', function () {
			assert.strictEqual(schemy.evaluate(`(if '() 1 2)`), 1)
		})

		it('non empty list', function () {
			assert.strictEqual(schemy.evaluate(`(if '(1 2 3) 1 0)`), 1)
		})
	})

	describe('boolean false', function () {
		it('false', function () {
			assert.strictEqual(schemy.evaluate(`(if #f 1 2)`), 2)
		})
	})

	describe('and', function () {
		it(`(and 1 '()) -> '()` , function () {
			assert.deepStrictEqual(schemy.evaluate(`  (and 1 '())  `), [])
		})
	})

	describe('variable definition', function () {
		it('number', function () {
			assert.strictEqual(schemy.evaluate(`      (define answer 42)
                                                    answer                  `), 42)
		})

		it('boolean false', function () {
			assert.deepStrictEqual(schemy.evaluate(`  (define is-good '())
                                                    is-good                 `), [])
		})
		it('list', function () {
			assert.deepStrictEqual(schemy.evaluate(`  (define lst '(1 2 3))
                                                    lst                     `), [1, 2, 3])
		})
		it('from calculation', function () {
			assert.strictEqual(schemy.evaluate(`      (define num (+ 2 3))
                                                    num                     `), 5)
		})
		it('from function call', function () {
			assert.strictEqual(schemy.evaluate(`      (define len (+ 1 2))
                                                    len                     `), 3)
		})
		it('cannot define variable twice', function () {
			assert.strictEqual(schemy.evaluate(`      (define a 1)
                                                    (define a 2)               `),
				'Error: Identifier already defined: a')
		})
	})
})
