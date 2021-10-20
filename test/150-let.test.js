'use strict'

const assert         = require('assert')
const {describe, it} = require('@popovmp/mocha-tiny')
const Schemy           = require('../public/js/schemy.js').Schemy

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
})
