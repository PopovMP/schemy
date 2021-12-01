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

		'append'   : this.append,
		'length'   : this.length,
		'list-ref' : this.listRef,
		'list-tail': this.listTail,
		'make-list': this.makeList,
		'map'      : this.map,
		'reverse'  : this.reverse,
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
		const [obj] = <[any[]]>this.inter.evalArgs(['list'], expr, env)

		if (!Array.isArray(obj) || obj.length === 0) {
			throw `Error in 'car': Incorrect list structure: ${Printer.stringify(obj)}`
		}

		return obj[0]
	}

	// (cdr expr)
	private cdr(expr: any[], env: any[]): any | any[] {
		const [obj] = <[any[]]>this.inter.evalArgs(['list'], expr, env)

		if (!Array.isArray(obj) || obj.length === 0) {
			throw `Error in 'cdr': Incorrect list structure: ${Printer.stringify(obj)}`
		}

		return obj.slice(1)
	}

	// (caar expr)
	private caar(expr: any[], env: any[]): any | any[] {
		const [obj] = <[any[]]>this.inter.evalArgs(['list'], expr, env)

		if (!Array.isArray(obj) || !Array.isArray(obj[0]) || obj[0].length === 0) {
			throw `Error in 'caar': Incorrect list structure: ${Printer.stringify(obj)}`
		}

		return obj[0][0]
	}

	// (cdar expr)
	private cdar(expr: any[], env: any[]): any | any[] {
		const [obj] = <[any[]]>this.inter.evalArgs(['list'], expr, env)

		if (!Array.isArray(obj) || !Array.isArray(obj[0]) || obj[0].length === 0) {
			throw `Error in 'cdar': Incorrect list structure: ${Printer.stringify(obj)}`
		}

		return obj[0].slice(1)
	}

	// (cadr expr)
	private cadr(expr: any[], env: any[]): any | any[] {
		const [obj] = <[any[]]>this.inter.evalArgs(['list'], expr, env)

		if (!Array.isArray(obj) || obj.length < 2) {
			throw `Error in 'cadr': Incorrect list structure: ${Printer.stringify(obj)}`
		}

		return obj[1]
	}

	// (cddr expr)
	private cddr(expr: any[], env: any[]): any | any[] {
		const [obj] = <[any[]]>this.inter.evalArgs(['list'], expr, env)

		if (!Array.isArray(obj) || obj.length < 2) {
			throw `Error in 'cddr': Incorrect list structure: ${Printer.stringify(obj)}`
		}

		return obj.slice(2)
	}

	// (caddr expr)
	private caddr(expr: any[], env: any[]): any | any[] {
		const [obj] = <[any[]]>this.inter.evalArgs(['list'], expr, env)

		if (!Array.isArray(obj) || obj.length < 3) {
			throw `Error in 'caddr': Incorrect list structure: ${Printer.stringify(obj)}`
		}

		return obj[2]
	}

	// (cadddr expr)
	private cadddr(expr: any[], env: any[]): any | any[] {
		const [obj] = <[any[]]>this.inter.evalArgs(['list'], expr, env)

		if (!Array.isArray(obj) || obj.length < 4) {
			throw `Error in 'cadddr': Incorrect list structure: ${Printer.stringify(obj)}`
		}

		return obj[3]
	}

	// (caddddr expr)
	private caddddr(expr: any[], env: any[]): any | any[] {
		const [obj] = <[any[]]>this.inter.evalArgs(['list'], expr, env)

		if (!Array.isArray(obj) || obj.length < 5) {
			throw `Error in 'caddddr': Incorrect list structure: ${Printer.stringify(obj)}`
		}

		return obj[4]
	}

	// (append list expr)
	private append(expr: any[], env: any[]): any[] {
		const [list, item] = <[any[], any]>this.inter.evalArgs(['list', 'any'], expr, env)

		return list.length === 0 ? item : list.concat(item)
	}

	// (length expr)
	private length(expr: any[], env: any[]): number {
		const [list] = <[any[]]>this.inter.evalArgs(['list'], expr, env)

		return list.length
	}

	// (reverse expr)
	private reverse(expr: any[], env: any[]): any[] {
		const [list] = <[any[]]>this.inter.evalArgs(['list'], expr, env)

		return list.reverse()
	}

	// (make-list size fill)
	private makeList(expr: any[], env: any[]): any[] {
		const [size, fill] = <[number, any]>this.inter.evalArgs(['number', 'scalar'], expr, env)

		const res = []
		for (let i = 0; i < size; i++) {
			res.push(fill)
		}

		return res
	}

	// (list-tail list k)
	private listTail(expr: any[], env: any[]): any[] {
		const [lst, k] = <[any[], number]>this.inter.evalArgs(['list', 'number'], expr, env)

		return lst.slice(k)
	}

	// (list-ref list k)
	private listRef(expr: any[], env: any[]): any[] {
		const [lst, k] = <[any[], number]>this.inter.evalArgs(['list', 'number'], expr, env)

		return lst[k]
	}

	// (map proc lst)
	private map(expr: any[], env: any[]): any[] {
		const proc: any   = expr[1]
		const args: any[] = this.inter.evalCallArgs(expr[2], env)

		return args.map( item => this.inter.evalExpr([proc, item], env) )
	}
}
