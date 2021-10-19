'use strict'

const assert         = require('assert')
const {describe, it} = require('@popovmp/mocha-tiny')
const Schemy         = require('../public/js/schemy.js').Schemy

const schemy = new Schemy()

describe('define', function () {

	it('(define a 1)', function () {
		assert.strictEqual(schemy.evaluate(`
			(define a 1)
			a                 `),  1)
	})

	it('(define a (+ 1 2))', function () {
		assert.strictEqual(schemy.evaluate(`
			(define a (+ 1 2))
			a                 `),  3)
	})

	it('(define a (list 1 2))', function () {
		assert.deepStrictEqual(schemy.evaluate(`
			(define a (list 1 2))
			a                 `),  [1, [2, []]])
	})

	it('(define (foo a) a)', function () {
		assert.deepStrictEqual(schemy.evaluate(`
			(define (foo a) a)
			(foo 2)            `),  2)
	})

	it('(define (foo) 1 2)', function () {
		assert.deepStrictEqual(schemy.evaluate(`
			(define (foo) 1 2)
			(foo)            `),  2)
	})
})
