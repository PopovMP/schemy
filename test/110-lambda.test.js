'use strict'

const assert         = require('assert')
const {describe, it} = require('node:test')
const Schemy           = require('../assets/js/schemy.js').Schemy

const schemy = new Schemy()

describe('lambda', function () {
	it('((lambda () 5) ) → 5', function () {
		assert.strictEqual(schemy.evaluate('((lambda () 5) )'), 5)
	})

	it('((lambda () (+ 2 3)) ) → 5', function () {
		assert.strictEqual(schemy.evaluate('((lambda () (+ 2 3)) )'), 5)
	})

	it('((lambda (a) a) 5) → 5', function () {
		assert.strictEqual(schemy.evaluate('((lambda (a) a) 5)'), 5)
	})

	it('((lambda (a) 1 2 a) 5) → 5', function () {
		assert.strictEqual(schemy.evaluate('((lambda (a) 1 2 a) 5)'), 5)
	})

	it('((lambda (a) (* 2 a)) 5) → 10', function () {
		assert.strictEqual(schemy.evaluate('((lambda (a) (* 2 a)) 5)'), 10)
	})

	it('((lambda (a) (+ a 1)) 5) → 6', function () {
		assert.strictEqual(schemy.evaluate('((lambda (a) (+ a 1)) 5)'), 6)
	})

	it('((lambda (a b) (+ a b)) 5 6) → 11', function () {
		assert.strictEqual(schemy.evaluate('((lambda (a b) (+ a b)) 5 6)'), 11)
	})

	it('((lambda (a b) (+ a b)) (+ 2 3) (- 10 4) ) → 11', function () {
		assert.strictEqual(schemy.evaluate('((lambda (a b) (+ a b)) (+ 2 3) (- 10 4))'), 11)
	})

	it('(((lambda () (lambda (a b) (+ a b)))) 2 3) → 5', function () {
		assert.strictEqual(schemy.evaluate(`
            (((lambda ()
                  (lambda (a b)
                      (+ a b))))
                2 3)`), 5)
	})

	it('lambda catch all args', function () {
		assert.deepStrictEqual(schemy.evaluate('((lambda a a) 1 2 3)'), [1, 2, 3])
	})

	it('lambda rest args 1', function () {
		assert.deepStrictEqual(schemy.evaluate('((lambda (h . t) t) 1 2 3)'), [2, 3])
	})

	it('lambda rest args 2', function () {
		assert.deepStrictEqual(schemy.evaluate('((lambda (h . t) t) 1 2)'), [2])
	})

	it('lambda rest args 3', function () {
		assert.deepStrictEqual(schemy.evaluate('((lambda (h . t) t) 1)'), [])
	})

	it('lambda rest args 4', function () {
		assert.deepStrictEqual(schemy.evaluate('((lambda (f  s . t) t) 1 2)'), [])
	})

	it('lambda rest args 5', function () {
		assert.deepStrictEqual(schemy.evaluate('((lambda (f  s . t) t) 1)'),
			'Error: Wrong count of arguments of proc lambda. Required min 2 but given: 1')
	})

	it('lambda func-name', function () {
		assert.strictEqual(schemy.evaluate('((lambda (a b) #name) 1 2)'), 'lambda')
	})

	it('lambda func-args', function () {
		assert.deepStrictEqual(schemy.evaluate('((lambda (a b) #args) 1 2)'), [1, 2])
	})

	it('Improper function', function () {
		assert.strictEqual(schemy.evaluate('( (lambda () (5)) )'),
			'Error: Improper function application. Given: 5')
	})

	it('No params function', function () {
		assert.strictEqual(schemy.evaluate('(lambda (+ 2 3))'),
			'Error: Improper lambda. Given: (lambda (+ 2 3))')
	})

	it('No body', function () {
		assert.strictEqual(schemy.evaluate('(lambda (a b))'),
			'Error: Improper lambda. Given: (lambda (a b))')
	})

	it('lambda returns a builtin function', function () {
		assert.strictEqual(schemy.evaluate('(((lambda () +)) 2 3)'), 5)
	})

	it('lambda lambda returns a builtin function', function () {
		assert.strictEqual(schemy.evaluate('((((lambda () (lambda () +)))) 2 3)'), 5)
	})
})
