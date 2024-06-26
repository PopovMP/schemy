class StringLib implements ILib {
	private readonly inter: Interpreter
	private readonly methods: Record<string, (expr: any[], env: any[]) => any> = {
		'string'           : this.string,
		'string-append'    : this.stringAppend,
		'string-length'    : this.stringLength,
		'string->number'   : this.stringToNumber,
		'string->uppercase': this.stringToUppercase,
		'string->downcase' : this.stringToDowncase,
	}

	public readonly builtinFunc: string[]
	public readonly builtinHash: Record<string, boolean> = {}

	constructor(interpreter: Interpreter) {
		this.inter = interpreter

		this.builtinFunc = Object.keys(this.methods)
		for (const func of this.builtinFunc)
			this.builtinHash[func] = true
	}

	public libEvalExpr(expr: any[], env: any[]): any | any[] {
		return this.methods[expr[0]].call(this, expr, env)
	}

	// (string expr)
	private string(expr: any[], _env: any[]): string {
		if (expr.length !== 2)
			throw 'Error: \'string\' requires 1 argument. Given: ' + (expr.length - 1)

		return expr[1]
	}

	// (string-append expr*)
	private stringAppend(expr: any[], env: any[]): string {
		return this.inter.mapExprList(expr.slice(1), env)
			.map(Printer.stringify)
			.reduce((acc: string, e: string) => acc + e)
	}

	// (string-length str)
	private stringLength(expr: any[], env: any): number {
		const [str]: [string] = <[string]>this.inter.evalArgs(['string'], expr, env)

		return str.length
	}

	// (string->number expr)
	private stringToNumber(expr: any[], env: any[]): number {
		const [str]: [string] = <[string]>this.inter.evalArgs(['string'], expr, env)

		return Number(str)
	}

	// (string->uppercase expr)
	private stringToUppercase(expr: any[], env: any[]): string {
		const [str]: [string] = <[string]>this.inter.evalArgs(['string'], expr, env)

		return str.toUpperCase()
	}

	// (string->downcase expr)
	private stringToDowncase(expr: any[], env: any[]): string {
		const [str]: [string] = <[string]>this.inter.evalArgs(['string'], expr, env)

		return str.toLowerCase()
	}
}
