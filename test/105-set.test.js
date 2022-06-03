'use strict'

const assert         = require('assert')
const {describe, it} = require('@popovmp/mocha-tiny')
const Schemy         = require('../assets/js/schemy.js').Schemy

const schemy = new Schemy()

describe('set!', function () {
	it('when set! a variable, it has the new value', function () {
		assert.strictEqual(schemy.evaluate(`
			(define a 1)
			(set!   a 2)
			a                 `), 2)
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
