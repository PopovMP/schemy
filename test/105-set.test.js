'use strict'

const assert         = require('assert')
const {describe, it} = require('@popovmp/mocha-tiny')
const Schemy         = require('../assets/js/schemy.js').Schemy

const schemy = new Schemy()

describe('set!', function () {

	it('(set! a 2)', function () {
		assert.strictEqual(schemy.evaluate(`
			(define a 1)
			(set!   a 2)
			a                 `), 2)
	})
})
