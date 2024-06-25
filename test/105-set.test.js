'use strict'

const assert         = require('assert')
const {describe, it} = require('node:test')
const Schemy         = require('../assets/js/schemy.js').Schemy

const schemy = new Schemy()

describe('set!', function () {
	it('when set! a variable, it has the new value', function () {
		assert.strictEqual(schemy.evaluate(`
			(define a 1)
			(set!   a 2)
			a                 `), 2)
	})

	it('when set! from inner scope, it works', function () {
		assert.strictEqual(schemy.evaluate(`
			(define a 42)
			(define (set n)
			  (set! a n))
			(set 2)
			a                 `), 2)
	})

	it('when set! a variable in a closure, it works', function () {
		assert.strictEqual(schemy.evaluate(`
			(define (foo a)
			  (lambda (n)
			    (set! a n)
				a))
			((foo 42) 2)      `), 2)
	})

	it('when set!, it returns an unspecified value', function () {
		assert.strictEqual(schemy.evaluate(`
		    (define a 1)
			(set!   a 2)      `), undefined)
	})

	it('when set! an undefined variable, it gets an error', function () {
		assert.strictEqual(schemy.evaluate(`
			(set! a 2)
			a                 `), 'Error: Identifier is not defined: a')
	})
})
