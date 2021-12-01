'use strict'

const assert         = require('assert')
const {describe, it} = require('@popovmp/mocha-tiny')
const Schemy         = require('../assets/js/schemy.js').Schemy

const schemy = new Schemy()

describe('List declaration', function () {
	describe('list constructor', function() {
		it('empty list: \'() → \'()', function () {
			assert.deepStrictEqual(schemy.evaluate('\'()'), [])
		})

		it('empty list: (list) → \'()', function () {
			assert.deepStrictEqual(schemy.evaluate('(list)'), [])
		})

		it('(list 1)', function () {
			assert.deepStrictEqual(schemy.evaluate('(list 1)'), [1])
		})

		it('(list 1 2)', function () {
			assert.deepStrictEqual(schemy.evaluate('(list 1 2)'), [1, 2])
		})

		it('non empty num list: (cons 1 2)', function () {
			assert.deepStrictEqual(schemy.evaluate('(cons 1 2)'), [1, 2])
		})
	})

	describe('cons tests', function() {
		it('cons vs list 1', function () {
			assert.deepStrictEqual(schemy.evaluate('(list 1 2)'), schemy.evaluate(`(cons 1 2)`))
		})

		it('cons vs list 2', function () {
			assert.deepStrictEqual(schemy.evaluate('(list 1)'), schemy.evaluate(`(cons 1 '())`))
		})

		it('cons vs list 3', function () {
			assert.deepStrictEqual(schemy.evaluate('(list 1 2)'), schemy.evaluate(`(cons 1 (cons 2'()))`))
		})

		it('cons vs list 4', function () {
			assert.deepStrictEqual(schemy.evaluate('(list (list 1 2) 3 4)'),
				schemy.evaluate(`(cons (cons 1 (cons 2'())) (cons 3 (cons 4'())))`))
		})
	})

	describe('quote list tests', function() {
		it('quote vs list 1', function () {
			assert.deepStrictEqual(schemy.evaluate(`'(1 2)`), schemy.evaluate(`(list 1 2)`))
		})
	})

	describe('car cdr tests', function() {
		it('car 1', function () {
			assert.deepStrictEqual(schemy.evaluate('(car (cons 1 2))'), 1)
		})

		it('car 2', function () {
			assert.deepStrictEqual(schemy.evaluate('(car (list 1 2))'), 1)
		})

		it('cdr 1', function () {
			assert.deepStrictEqual(schemy.evaluate(`(cdr (cons 1 '()))`), [])
		})

		it('cdr 2', function () {
			assert.deepStrictEqual(schemy.evaluate('(cdr (cons 1 2))'), [2])
		})

		it('cdr 3', function () {
			assert.deepStrictEqual(schemy.evaluate(`(cdr (list 1))`), [])
		})

		it('cdr 4', function () {
			assert.deepStrictEqual(schemy.evaluate(`(cdr (list))`), "Error in 'cdr': Incorrect list structure: ()")
		})

		it('caar', function () {
			assert.deepStrictEqual(schemy.evaluate('(caar (list (list 1 2) 3 4))'), 1)
		})

		it('cadr', function () {
			assert.deepStrictEqual(schemy.evaluate('(cadr (list (list 1 2) 3 4))'), 3)
		})

		it('caddr', function () {
			assert.deepStrictEqual(schemy.evaluate('(caddr (list 1 2 3 4))'), 3)
		})

		it('cadddr', function () {
			assert.deepStrictEqual(schemy.evaluate('(cadddr (list 1 2 3 4))'), 4)
		})
	})

	describe('length tests', function() {
		it(`(length '()) -> 0`, function () {
			assert.deepStrictEqual(schemy.evaluate(`(length '())`), 0)
		})

		it(`(length '(5 6)) -> 2`, function () {
			assert.deepStrictEqual(schemy.evaluate(`(length '(5 6))`), 2)
		})

		it(`(length 42) -> Error`, function () {
			assert.deepStrictEqual(schemy.evaluate(`(length 42)`), "Error: 'length' requires list. Given: number 42")
		})
	})
})
