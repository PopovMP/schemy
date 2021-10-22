class ListLib implements ILib {
	private readonly inter: Interpreter
	private readonly methods: Record<string, (expr: any[], env: any[]) => any> = {
		'list': this.list,
		'cons': this.cons,
		'car' : this.car,
		'cdr' : this.cdr,

		'caar' : this.caar,
		'cadr' : this.cadr,
		'cdar' : this.cdar,
		'cddr' : this.cddr,

		'caddr'   : this.caddr,
		'cadddr'  : this.cadddr,
		'caddddr' : this.caddddr,
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

		return this.inter.mapExprList(expr.slice(1), env)
	}

	// (cons expr1 expr2)
	private cons(expr: any[], env: any[]): any[] {
		const [obj1, obj2] = <[any, any]>this.inter.evalArgs(['any', 'any'], expr, env)
		return Array.isArray(obj2)
			? obj2.length === 0
				? [obj1]
				: [obj1, ...obj2]
			: [obj1, obj2]
	}

	// (car expr)
	private car(expr: any[], env: any[]): any | any[] {
		return this.inter.evalArgs(['list'], expr, env)[0][0]
	}

	// (cdr expr)
	private cdr(expr: any[], env: any[]): any | any[] {
		const [obj] = <[any]>this.inter.evalArgs(['list'], expr, env)
		if (!Array.isArray(obj) || obj.length === 0) {
			throw 'Error: Required a pair. Given: ' + Printer.stringify(obj)
		}

		return obj.slice(1)
	}

	// (caar expr)
	private caar(expr: any[], env: any[]): any | any[] {
		return this.inter.evalArgs(['list'], expr, env)[0][0][0]
	}

	// (cdar expr)
	private cdar(expr: any[], env: any[]): any | any[] {
		const [obj] = <[any]>this.inter.evalArgs(['list'], expr, env)
		if (!Array.isArray(obj) || !Array.isArray(obj[0]) || obj[0].length === 0) {
			throw 'Error: Required a pair. Given: ' + Printer.stringify(obj)
		}

		return obj[0].length === 2 ? obj[0][1] : obj[0].slice(1)
	}

	// (cadr expr)
	private cadr(expr: any[], env: any[]): any | any[] {
		return this.inter.evalArgs(['list'], expr, env)[0][1]
	}

	// (cddr expr)
	private cddr(expr: any[], env: any[]): any | any[] {
		const [obj] = <[any]>this.inter.evalArgs(['list'], expr, env)
		if (!Array.isArray(obj) || !Array.isArray(obj[1]) || obj[1].length === 0) {
			throw 'Error: Required a pair. Given: ' + Printer.stringify(obj)
		}

		return obj[1].slice(1)
	}

	// (caddr expr)
	private caddr(expr: any[], env: any[]): any | any[] {
		return this.inter.evalArgs(['list'], expr, env)[0][2]
	}

	// (cadddr expr)
	private cadddr(expr: any[], env: any[]): any | any[] {
		return this.inter.evalArgs(['list'], expr, env)[0][3]
	}

	// (caddddr expr)
	private caddddr(expr: any[], env: any[]): any | any[] {
		return this.inter.evalArgs(['list'], expr, env)[0][4]
	}
}
