class Schemy {
	constructor() {
	}

	public evaluate(codeText: string, optionsParam?: Options, callback?: Function) {
		const options: Options         = optionsParam ? Options.parse(optionsParam) : new Options()
		const parser: Parser           = new Parser()
		const interpreter: Interpreter = new Interpreter()

		try {
			const ilCode = parser.parse(codeText)
			return interpreter.evalCodeTree(ilCode, options, callback)
		} catch (e: any) {
			if (typeof callback === 'function') {
				callback(e.toString())
			}
			else {
				return e.toString()
			}
		}
	}
}

if (typeof module === 'object') {
	module.exports.Schemy = Schemy
}
