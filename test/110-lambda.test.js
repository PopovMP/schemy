'use strict'

const assert         = require('assert')
const {describe, it} = require('@popovmp/mocha-tiny')
const Schemy           = require('../public/js/schemy.js').Schemy

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
