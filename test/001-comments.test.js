'use strict'

const assert         = require('assert')
const {describe, it} = require('@popovmp/mocha-tiny')
const Schemy           = require('../assets/js/schemy.js').Schemy

const schemy = new Schemy()

describe('Line comment', function () {
	it('; line comment', function () {
		assert.strictEqual(schemy.evaluate(`
            ; line comment
            `), undefined)
	})

	it('1 ; line comment', function () {
		assert.strictEqual(schemy.evaluate(`
            1 ; line comment
            `), 1)
	})
})
