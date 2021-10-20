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
				    (even? 87)) `),                      false)
	})
})
