'use strict'

const assert         = require('assert')
const {describe, it} = require('@popovmp/mocha-tiny')
const Schemy         = require('../assets/js/schemy.js').Schemy

const schemy = new Schemy()

describe('let', function () {
	it('(let () 5)', function () {
		assert.strictEqual(schemy.evaluate(`
				(let () 5)
		`), 5)
	})

	it('(let ([a 5]) a)', function () {
		assert.strictEqual(schemy.evaluate(`
				(let ([a 5]) a)
		`), 5)
	})

	it('(let ([a 5] [b a]) b) ; Exception', function () {
		assert.strictEqual(schemy.evaluate(`
				(let ([a 5] [b a]) b)
		`), 'Error: Unbound identifier: a')
	})
})

describe('let*', function () {
	it('(let* () 5)', function () {
		assert.strictEqual(schemy.evaluate(`
			(let* () 5)
		`), 5)
	})

	it('(let* ([a 5]) a)', function () {
		assert.strictEqual(schemy.evaluate(`
			(let* ([a 5]) a)
		`), 5)
	})

	it('(let* ([a 5] [b a]) b)', function () {
		assert.strictEqual(schemy.evaluate(`
			(let* ([a 5] [b a]) b)
		`), 5)
	})
})

describe('letrec', function () {
	it('(letrec () 5)', function () {
		assert.strictEqual(schemy.evaluate(`
			(letrec () 5)
		`), 5)
	})

	it('(letrec ([a 5]) a)', function () {
		assert.strictEqual(schemy.evaluate(`
			(letrec ([a 5]) a)
		`), 5)
	})

	it('(letrec ([a 5] [b a]) b) ; Exception', function () {
		assert.strictEqual(schemy.evaluate(`
				(letrec ([a 5] [b a]) b)
		`), 'Error: unspecified value of a')
	})

	it('Mutual recursion', function () {
		assert.strictEqual(schemy.evaluate(`
			(letrec
			    ([even? (lambda (n)
			                (if (= n 0)
			                     #t
			                     (odd? (- n 1))))]
			     [odd? (lambda (n)
			               (if (= n 0)
			                   #f
			                   (even? (- n 1))))])
			    (even? 87))
		`), false)
	})

	it('mixed binding => Exception', function () {
		assert.strictEqual(schemy.evaluate(`
			(letrec ([a 5] [b a]) b)
		`), 'Error: unspecified value of a')
	})
})

describe('named let', function () {
	it('Named let 1', function () {
		assert.strictEqual(schemy.evaluate(`
			(let foo ([a 5]) a)
		`), 5)
	})

	it('Named let 2', function () {
		assert.strictEqual(schemy.evaluate(`
			(let foo ([n 5] [acc 0])
			    (if (> n 0)
			        (foo (- n 1) (+ acc n))
			         acc))
		`), 15)
	})

	it('Named let 3', function () {
		assert.deepStrictEqual(schemy.evaluate(`
		    (let loop ([nums '(1 -4 5 2 -3 0 -12 6 8 -2)]
		               [pos  '()]
		               [neg  '()])
		      (if (pair? nums)
		          (if (>= (car nums) 0)
		              (loop (cdr nums)
		                    (cons (car nums) pos)
		                    neg)
		              (loop (cdr nums)
		                    pos
		                    (cons (car nums) neg)))
		          (list pos neg))) 
		` ), [[8, 6, 0, 2, 5, 1],[-2, -12, -3, -4]])
	})
})
