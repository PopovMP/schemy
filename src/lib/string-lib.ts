class StringLib implements ILib {
	private readonly inter: Interpreter
	private readonly methods: Record<string, (expr: any[], env: any[]) => any> = {
		'string': this.string,
	}

	public readonly builtinFunc: string[]
	public readonly builtinHash: Record<string, boolean> = {}

	constructor(interpreter: Interpreter) {
		this.inter = interpreter

		this.builtinFunc = Object.keys(this.methods)
		for (const func of this.builtinFunc) {
			this.builtinHash[func] = true
		}
	}

	public libEvalExpr(expr: any[], env: any[]): any | any[] {
		return this.methods[expr[0]].call(this, expr, env)
	}

	// (string expr*)
	private string(expr: any[], _env: any[]): any[] {
		if (expr.length !== 2) {
			throw "Error: 'string' requires 1 argument. Given: " + (expr.length - 1);
		}

		return expr[1];
	}
}
