'use strict'

const assert         = require('assert')
const {describe, it} = require('node:test')
const Schemy           = require('../assets/js/schemy.js').Schemy

const schemy = new Schemy()

describe('scope', function () {
	it('function accesses vars defined before the function definition', function () {
		assert.strictEqual(schemy.evaluate(`
            (define a 1)
            (define fun
                 (lambda () a))
            (fun)               `), 1)
	})

	it('function accesses vars defined after the function definition but before the call', function () {
		assert.strictEqual(schemy.evaluate(`
            (define fun
                 (lambda () a))
            (define a 1)
            (fun)                `), 1)
	})

	it('The vars defined in the function body doesn\'t override vars defined before the function', function () {
		assert.strictEqual(schemy.evaluate(`
            (define a 1)
            (define fun
                (lambda ()
                    (begin
                        (define a 2)
                        (define b a))))
            (fun) 
            a                    `), 1)
	})
})
