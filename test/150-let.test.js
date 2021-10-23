'use strict'

const assert         = require('assert')
const {describe, it} = require('@popovmp/mocha-tiny')
const Schemy         = require('../assets/js/schemy.js').Schemy

const schemy = new Schemy()

describe('let', function () {

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
				    (even? 87))                              `), false)
	})

	it('Letrec*', function () {
		assert.strictEqual(schemy.evaluate(`
				(letrec* ([p (lambda (x)
				                (+ 1 (q (- x 1))))]
				          [q (lambda (y)
				                (if (= y 0)
				                    0
				                    (+ 1 (p (- y 1)))))]
				          [x (p 5)]
				          [y x])
				    y)                                      `), 5)
	})

	it('Named let 1', function () {
		assert.strictEqual(schemy.evaluate(`
				(let foo ([n 5])
				    n)                                      `), 5)
	})

	it('Named let 2', function () {
		assert.strictEqual(schemy.evaluate(`
				(let foo ([n 5] [acc 0])
				    (if (> n 0)
				        (foo (- n 1) (+ acc n))
				         acc))`                            ), 15)
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
