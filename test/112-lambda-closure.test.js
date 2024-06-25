'use strict'

const assert         = require('assert')
const {describe, it} = require('node:test')
const Schemy           = require('../assets/js/schemy.js').Schemy

const schemy = new Schemy()

describe('lambda - closure', function () {
	it('closure - 1 free param', function () {
		assert.strictEqual(schemy.evaluate(`
        (((lambda (a)
            (lambda (b)
               (+ a b)))
          1) 2)
                                            `), 3)
	})

	it('closure - variable defined in body', function () {
		assert.strictEqual(schemy.evaluate(`
        (((lambda ()
            (begin
                (define a 1)
                (lambda (b)
                    (+ a b)))))
          2)
                                            `), 3)
	})
})
