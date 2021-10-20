(function (mod) {
	mod(CodeMirror)
})(function (CodeMirror) {
	'use strict'

	CodeMirror.defineMode('schemy-mode', function (options) {
		const BUILTIN = 'builtin', COMMENT = 'comment', STRING = 'string', ATOM = 'atom', NUMBER = 'number',
		      BRACKET = 'bracket', KEYWORD = 'keyword', VAR = 'variable'
		const INDENT_WORD_SKIP   = options.indentUnit || 2
		const NORMAL_INDENT_UNIT = options.indentUnit || 2

		function makeKeywords(str) {
			const obj = {}, words = str.split(' ')

			for (let i = 0; i < words.length; ++i) {
				obj[words[i]] = true
			}

			return obj
		}

		const constants = makeKeywords('\'() #t #f #args #name')

		const keywords = makeKeywords(
			'\' ` , @ . define λ lambda begin ' +
			'and or if cond case ' +
			'display newline print ' +
			'quote quasiquote ' +
		    'parse eval debug raise'
		)

		const builtinFunc = makeKeywords(
			// Core lib
			'number? boolean? null? pair?  + - * / = %  > < != >= <= % eq? ' +
			// list
			'list cons car cdr',
		)

		const indentKeys = makeKeywords(
			'begin define if lambda parse eval λ',
		)

		const tests = {
			digit       : /\d/,
			sign        : /[+-]/,
			keyword_char: /[^\s(\[;)\]]/,
			symbol      : /[\w*+!\-._?:<>\/\xa1-\uffff]/,
			block_indent: /^(?:def|with)[^\/]+$|\/(?:def|with)/,
		}

		function StateStack(indent, type, prev) { // represents a state stack object
			this.indent = indent
			this.type   = type
			this.prev   = prev
		}

		function pushStack(state, indent, type) {
			state.indentStack = new StateStack(indent, type, state.indentStack)
		}

		function popStack(state) {
			state.indentStack = state.indentStack.prev
		}

		function isNumber(ch, stream) {
			// leading sign
			if ((ch === '+' || ch === '-') && (tests.digit.test(stream.peek()))) {
				stream.eat(tests.sign)
				ch = stream.next()
			}

			if (tests.digit.test(ch)) {
				stream.eat(ch)
				stream.eatWhile(tests.digit)

				if ('.' === stream.peek()) {
					stream.eat('.')
					stream.eatWhile(tests.digit)
				}

				return true
			}

			return false
		}

		return {
			startState: function () {
				return {
					indentStack: null,
					indentation: 0,
					mode       : false,
				}
			},

			token: function (stream, state) {
				if (state.indentStack == null && stream.sol()) {
					// update indentation, but only if indentStack is empty
					state.indentation = stream.indentation()
				}

				// skip spaces
				if (state.mode !== 'string' && stream.eatSpace()) {
					return null
				}
				let returnType

				switch (state.mode) {
					case 'string': // multi-line string parsing mode
						let next, escaped = false
						while ((next = stream.next()) != null) {
							if (next === '"' && !escaped) {

								state.mode = false
								break
							}
							escaped = !escaped && next === '\\'
						}
						returnType = STRING // continue on in string mode
						break
					default: // default parsing mode
						const ch = stream.next()

						if (ch === '"') {
							state.mode = 'string'
							returnType = STRING
						}
						else if (ch === ';') { // comment
							stream.skipToEnd() // rest of the line is a comment
							returnType = COMMENT
						}
						else if (isNumber(ch, stream)) {
							returnType = NUMBER
						}
						else if (ch === '(' || ch === '[' || ch === '{') {
							let keyWord      = ''
							const indentTemp = stream.column()
							let letter

							if (ch === '(') {
								while ((letter = stream.eat(tests.keyword_char)) != null) {
									keyWord += letter
								}
							}

							if (keyWord.length > 0 && (indentKeys.propertyIsEnumerable(keyWord) ||
								tests.block_indent.test(keyWord))) { // indent-word
								pushStack(state, indentTemp + INDENT_WORD_SKIP, ch)
							}
							else { // non-indent word
								// we continue eating the spaces
								stream.eatSpace()
								if (stream.eol() || stream.peek() === ';') {
									// nothing significant after
									// we restart indentation the user defined spaces after
									pushStack(state, indentTemp + NORMAL_INDENT_UNIT, ch)
								}
								else {
									pushStack(state, indentTemp + stream.current().length, ch) // else we match
								}
							}
							stream.backUp(stream.current().length - 1) // undo all the eating

							returnType = BRACKET
						}
						else if (ch === ')' || ch === ']' || ch === '}') {
							returnType = BRACKET
							if (state.indentStack != null && state.indentStack.type === (ch === ')' ? '(' : (ch === ']' ? '[' : '{'))) {
								popStack(state)
							}
						}
						else {
							stream.eatWhile(tests.symbol)

							if (keywords && keywords.propertyIsEnumerable(stream.current())) {
								returnType = KEYWORD
							}
							else if (builtinFunc && builtinFunc.propertyIsEnumerable(stream.current())) {
								returnType = BUILTIN
							}
							else if (constants && constants.propertyIsEnumerable(stream.current())) {
								returnType = ATOM
							}
							else {
								returnType = VAR
							}
						}
				}

				return returnType
			},

			indent: function (state) {
				if (state.indentStack == null) {
					return state.indentation
				}
				return state.indentStack.indent
			},

			closeBrackets: {pairs: '()[]{}""'},
			lineComment  : ";"
		};
	});

});
