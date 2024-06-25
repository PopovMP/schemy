'use strict'

const assert         = require('assert')
const {describe, it} = require('node:test')
const Schemy         = require('../assets/js/schemy.js').Schemy

const schemy = new Schemy()

describe('do', function () {
	it('no body', function () {
		assert.strictEqual(schemy.evaluate(`
				(do ([a 0 (+ a 1)])
					((= a 5) a))
		`), 5)
	})

	it('no steps', function () {
		assert.strictEqual(schemy.evaluate(`
				(do ([a 0])
					((= a 5) a)
					(set! a (+ a 1)))
		`), 5)
	})

	it('multiple return expressions', function () {
		assert.strictEqual(schemy.evaluate(`
				(do ([a 0 (+ a 1)])
					((= a 5)
						(+ 2 3)
						42
						 a))
		`), 5)
	})

	it('no return expressions', function () {
		assert.strictEqual(schemy.evaluate(`
				(do ([a 0 (+ a 1)])
					((= a 5)))
		`), undefined)
	})

	it('make reversed range', function () {
		assert.deepStrictEqual(schemy.evaluate(`
		(do ([i 0 (+ i 1)]
			 [lst '() (cons i lst)])
		    ((= i 5) lst))
		`), [4, 3, 2, 1, 0])
	})

	it('sum list', function () {
		assert.strictEqual(schemy.evaluate(`
			(let ([x '(1 3 5 7 9)])
				(do ([x x (cdr x)]
					 [sum 0 (+ sum (car x))])
					((null? x) sum)))
		`), 25)
	})
})
