'use strict'

const assert         = require('assert')
const {describe, it} = require('node:test')
const Schemy         = require('../assets/js/schemy.js').Schemy

const schemy = new Schemy()

describe('values', function () {
    it('values are accepted by let-values', function () {
        assert.strictEqual(schemy.evaluate(`
			(let-values ([(a b) (values 3 4)])
			    (+ a b))
        `), 7)
    })

    it('values are accepted by proc', function () {
        assert.strictEqual(schemy.evaluate(`
            ((lambda (a b) (+ a b)) (values 3 4))
        `), 7)
    })
})
