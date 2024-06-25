'use strict'

const assert         = require('assert')
const {describe, it} = require('node:test')
const Schemy           = require('../assets/js/schemy.js').Schemy

const schemy = new Schemy()

describe('function closure', function () {

	it('return closure as first expression ', function () {
		assert.strictEqual(schemy.evaluate(` 
            (define make-adder
                (lambda (m)
                   (lambda (n) (+ m n))))

            (define add2 (make-adder 2))
            (add2 3)                        `), 5)
	})

	it('return a closure as a first expression begin', function () {
		assert.strictEqual(schemy.evaluate(` 
            (define make-adder 
                (lambda (m)
	                (begin
	                    (define dummy 'null)
	                    (lambda (n) (+ m n)) )))

            (define add2 (make-adder 2))
            (add2 3)                        `), 5)
	})

	it('return a closure as a nested expression begin', function () {
		assert.strictEqual(schemy.evaluate(` 
            (define make-adder
                (lambda (m)
	                (begin
		                (begin
		                    (lambda (n) (+ m n)) ))))

            (define add2 (make-adder 2))
            (add2 3)                        `), 5)
	})
})
