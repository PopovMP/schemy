class ListLib implements ILib {
	private readonly inter: Interpreter
	private readonly methods: Record<string, (expr: any[], env: any[]) => any> = {
		'list': this.list,
		'cons': this.cons,
		'car' : this.car,
		'cdr' : this.cdr,
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

	// (list expr*)
	private list(expr: any[], env: any[]): any[] {
		if (expr.length === 1) {
			return []
		}

		const objects: any[] = this.inter.mapExprList(expr.slice(1), env)

		let res: any[] = []
		for (let i = objects.length - 1; i > -1; i--) {
			res = [objects[i], res]
		}

		return res
	}

	// (cons expr1 expr2)
	private cons(expr: any[], env: any[]): any[] {
		const [obj1, obj2] = <[any, any]>this.inter.evalArgs(['any', 'any'], expr, env)

		return [obj1, obj2]
	}

	// (car expr)
	private car(expr: any[], env: any[]): any | any[] {
		const [obj] = <[any]>this.inter.evalArgs(['list'], expr, env)

		return obj[0]
	}

	// (cdr expr)
	private cdr(expr: any[], env: any[]): any | any[] {
		const [obj] = <[any]>this.inter.evalArgs(['list'], expr, env)

		return obj[1]
	}
}
