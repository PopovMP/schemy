class Interpreter
{
	private isDebug: boolean
	private readonly libs: ILib[]
	private readonly specialForms: Record<string, (expr: any[], env: any[]) => any> = {
		'and'          : this.evalAnd,
		'apply'        : this.evalApply,
		'begin'        : this.evalBegin,
		'case'         : this.evalCase,
		'cond'         : this.evalCond,
		'debug'        : this.evalDebug,
		'define'       : this.evalDefine,
		'define-values': this.evalDefineValues,
		'display'      : this.evalDisplay,
		'do'           : this.evalDo,
		'eval'         : this.evalEval,
		'format'       : this.evalFormat,
		'if'           : this.evalIf,
		'lambda'       : this.evalLambda,
		'let'          : this.evalLet,
		'let*'         : this.evalLet,
		'let*-values'  : this.evalLet,
		'let-values'   : this.evalLet,
		'letrec'       : this.evalLet,
		'letrec*'      : this.evalLet,
		'newline'      : this.evalNewline,
		'or'           : this.evalOr,
		'parse'        : this.evalParse,
		'quasiquote'   : this.evalQuasiquote,
		'quote'        : this.evalQuote,
		'raise'        : this.evalRaise,
		'set!'         : this.evalSet,
		'unless'       : this.evalUnless,
		'values'       : this.evalValues,
		'when'         : this.evalWhen,
	}

	public readonly builtinHash: Record<string, boolean> = {}
	public options: Options

	constructor()
	{
		this.isDebug = false
		this.libs    = []
		this.options = new Options()

		for (const form of Object.keys(this.specialForms))
			this.builtinHash[form] = true
	}

	public evalCodeTree(codeTree: any[], options: Options, callback?: Function): any
	{
		this.options = options
		this.libs.push(...LibManager.getBuiltinLibs(options.libs, this))

		if (typeof callback === 'function')
			LibManager.manageImports(codeTree, () => callback( this.evalExprList(codeTree, []) ))
		else
			return this.evalExprList(codeTree, [])
	}

	public evalExprList(exprLst: any[], env: any[]): any
	{
		let res: any

		for (const expr of exprLst)
			res = this.evalExpr(expr, env)

		return res
	}

	public mapExprList(exprLst: any[], env: any[]): any[]
	{
		const res: any[] = []

		for (const expr of exprLst)
			res.push( this.evalExpr(expr, env) )

		return res
	}

	public evalExpr(expr: any | any[], env: any[]): any
	{
		// Types
		switch (typeof expr) {
			case 'number'   :
			case 'boolean'  :
			case 'undefined':
				return expr
			case 'string' :
				return Env.lookup(expr, env, this.libs)
		}

		if (this.isDebug) {
			this.isDebug = false
			this.dumpExpression(expr)
		}

		const form: any = expr[0]

		if (form === undefined)
			throw 'Error: Improper function application. Probably: ()'

		// Special form or a builtin proc
		if (typeof form === 'string') {
			if (this.builtinHash[form])
				return this.specialForms[form].call(this, expr, env)

			for (let i: number = 0; i < this.libs.length; ++i)
				if (this.libs[i].builtinHash[form])
					return this.libs[i].libEvalExpr(expr, env)
		}

		// User proc
		return this.evalApplication(expr, env)
	}

	public evalArgs(argTypes: (string | [string, any])[], expr: any[], env: any[]): any[]
	{
		const optionalCount: number = argTypes.filter(Array.isArray).length
		this.assertArity(expr, argTypes.length, optionalCount)

		return argTypes.map((argType: string | [string, any], index: number): any => {
			const isRequired: boolean = !Array.isArray(argType)
			const arg: any = isRequired || index + 1 < expr.length
				? this.evalExpr(expr[index + 1], env)
				: argTypes[index][1]

			this.assertArgType(expr[0], arg, (isRequired ? argType : argType[0]) as string)

			return arg
		})
	}

	public assertType(arg: any, argType: string): boolean
	{
		switch (argType) {
			case 'any':
				return true
			case 'list':
				return Array.isArray(arg)
			case 'scalar':
				return ['string', 'number'].includes(typeof arg)
			default:
				return typeof arg === argType
		}
	}

	public isTrue(obj: any): boolean
	{
		return typeof obj !== 'boolean' || obj
	}

	public evalCallArgs(expr: any, env: any[]): any[]
	{
		const args: any[] = Array.isArray(expr) && expr[0] === 'list'
			? expr.slice(1)
			: this.evalExpr(expr, env)

		for (let i: number = 0; i < args.length; i++) {
			const arg: any = args[i]
			if (typeof arg === 'string')
				args[i] = ['string', arg]
		}

		return args
	}

	// (proc arg*)
	// ((lambda params expr+) arg*)
	private evalApplication(expr: any[], env: any[]): any
	{
		const proc   : string | any[] = expr[0]
		const isNamed: boolean        = typeof proc === 'string'
		const procId : string         = isNamed ? proc as string : proc[0] === 'lambda' ? 'lambda' : 'expression'
		const closure: any[] | string = isNamed ? Env.lookup(proc as string, env, this.libs) : this.evalExpr(proc, env)

		if (typeof closure === 'string' && Env.has(closure, env, this.libs))
			return this.evalExpr([this.evalExpr(closure, env), ...expr.slice(1)], env)

		if (!Array.isArray(closure) || closure[0] !== 'closure')
			throw `Error: Improper function application. Given: ${Printer.stringify(closure)}`

		const args: any[] = expr.length === 1
			? []
			: expr.length === 2
				? Array.isArray(expr[1]) && expr[1][0] === 'values'
					? this.evalExpr(expr[1], env).slice(1)
					: [this.evalExpr(expr[1], env)]
				: this.mapExprList(expr.slice(1), env)

		// (closure params body env)
		const params    : any    = closure[1]
		const body      : any[]  = closure[2]
		const closureEnv: any[]  = closure[3].concat([['#scope', procId], ['#args', args], ['#name', procId]])
		const scopeStart: number = closureEnv.length - 1

		// Parameters binding
		const argsCount  : number   = args.length
		const paramsCount: number = Array.isArray(params) ? params.length : -1

		if (paramsCount >= 0) {
			// Bind args to params
			const dotIndex: number = params.indexOf('.')

			if (dotIndex >= 0) {
				if (dotIndex === 0)
					throw `Error: Unexpected dot (.) as a first param in ${procId}.`
				else if (dotIndex === params.length)
					throw `Error: Unexpected dot (.) as a last param in ${procId}.`
				else if (dotIndex > argsCount)
					throw `Error: Wrong count of arguments of proc ${procId}. Required min ${dotIndex} but given: ${argsCount}`
			}
			else if (argsCount !== paramsCount) {
				throw `Error: Wrong count of arguments of proc ${procId}. Required ${paramsCount} but given: ${argsCount}`
			}

			for (let i: number = 0; i < params.length; i++) {
				if (params[i] === '.') {
					Env.add(params[i + 1], args.slice(i), 'arg', closureEnv)
					break
				}
				else {
					Env.add(params[i], args[i], 'arg', closureEnv)
				}
			}
		}
		else {
			// Catch all ars
			if (argsCount === 0)
				throw `Error: No arguments given to proc ${procId}.`

			// Bind all arguments to the parameter
			Env.add(params, args, 'arg', closureEnv)
		}

		const res: any = this.evalExprList(body, closureEnv)

		if (Array.isArray(res) && res[0] === 'closure') {
			// Doesn't clean the scope to preserve the closure.
			// Remove only the initial scope tag
			closureEnv.splice(scopeStart, 1)
		}
		else {
			Env.clear('#scope', closureEnv)
		}

		return res
	}

	// (define name expr)        ; Variable definition
	// (define (name p*) expr+)  ; Procedure definition
	// (define (name . p) expr+) ; Procedure definition - catch all args
	private evalDefine(expr: any[], env: any[]): void
	{
		if ( Array.isArray(expr[1]) ) {
			// Define procedure
			const name   : string = expr[1][0]
			const params : any    = expr[1][1] === '.' ? expr[1][2] : expr[1].slice(1)
			const body   : any[]  = expr.slice(2)
			const lambda : any[]  = ['lambda', params, ...body]
			const closure: any    = this.evalExpr(lambda, env)
			Env.add(name, closure, 'closure', env)
		}
		else {
			// Define variable
			const name : string = expr[1]
			const value: any    = this.evalExpr(expr[2], env)
			Env.add(name, value, 'define', env)
		}
	}

	// (define-values  (v1 v2 ...) (proc-that-produces-values))
	private evalDefineValues(expr: any[], env: any[]): void
	{
		const values: any[] = this.evalExpr(expr[2], env)

		if (values[0] !== 'values')
			throw `Error: Multiple values required in 'define-values'`
		if (values.length - 1 !== expr[1].length)
			throw `Error: Values count does not match. Required: ${expr[1].length}, got: ${values.length - 1}`

		for (let i: number = 0; i < expr[1].length; ++i)
			Env.add(expr[1][i], values[i + 1], 'define-values', env)
	}

	// (set! name expr) ; Variable assignment
	private evalSet(expr: any[], env: any[]): void
	{
		const name : string = expr[1]
		const value: any    = this.evalExpr(expr[2], env)

		Env.set(name, value, 'set!', env)
	}

	// (lambda (p*)   expr+)
	// (lambda params expr+) ; Catch all args
	private evalLambda(expr: any[], env: any[]): any[]
	{
		if (expr.length < 3)
			throw `Error: Improper lambda. Given: ${ Printer.stringify(expr) }`

		// (closure params body env)
		return ['closure', expr[1], expr.slice(2), env]
	}

	// (begin expr+)
	private evalBegin(expr: any[], env: any[]): any
	{
		if (expr.length === 1)
			throw 'Error: Empty begin'

		env.push(['#scope', 'begin'])
		const scopeStart: number = env.length - 1

		const res: any = expr.length === 2
			? this.evalExpr(expr[1], env)
			: this.evalExprList(expr.slice(1), env)

		if (Array.isArray(res) && res[0] === 'closure')
			env.splice(scopeStart, 1)
		else
			Env.clear('#scope', env)

		return res
	}

	// (apply symbol (list arg*) | expr)
	private evalApply(expr: any[], env: any[]): any
	{
		const proc: any   = expr[1]
		const args: any[] = this.evalCallArgs(expr[2], env)

		return this.evalExpr([proc, ...args], env)
	}

	// (let ([name value]+) expr+)
	// (let-values ([(name+) (value+)]+) expr+)
	private evalLet(expr: any[], env: any[]): any[]
	{
		const proc: string = expr[0]

		if (expr.length < 3)
			throw `Error: Improper '${proc}' syntax. Missing body.`

		if (proc === 'let' && typeof expr[1] === 'string' && Array.isArray(expr[2]))
			return this.evalNamedLet(expr, env)

		if (! Array.isArray(expr[1]) )
			throw `Error: Improper '${proc}' bindings. Given: ${ Printer.stringify(expr[1]) }`

		env.push(['#scope', proc])
		const scopeStart: number = env.length - 1

		if (proc === 'let-values')
			this.bindLetValues(expr[1], env)
		else if (proc === 'let*-values')
			this.bindLetStarValues(expr[1], env)
		else
			this.bindLetVariables(proc, expr[1], env)

		const res: any = expr.length === 3
			? this.evalExpr(expr[2], env)
			: this.evalExprList(expr.slice(2), env)

		if (Array.isArray(res) && res[0] === 'closure')
			env.splice(scopeStart, 1)
		else
			Env.clear('#scope', env)

		return res
	}

	// (let name ([var value]+) expr+)
	private evalNamedLet(expr: any[], env: any[]): any
	{
		if (expr.length < 4)
			throw "Error: Improper named 'let' syntax. Missing body."

		const name  : any[] = expr[1]
		const vars  : any[] = expr[2].map( (binding: [string, any]): string => binding[0] )
		const values: any[] = expr[2].map( (binding: [string, any]): any    => binding[1] )
		const body  : any[] = expr.slice(3)

		const begin = ['begin',
			['define', name, ['lambda', [...vars], ...body]],
			[name, ...values]]

		return this.evalBegin(begin, env)
	}

	private bindLetVariables(form: string, bindings: [string, any][], env: any[]): void {
		switch (form) {
			case 'let': {
				const values: any[] = bindings.map( (binding: [string, any]): any => this.evalExpr(binding[1], env) )

				for (let i: number = 0; i < bindings.length; ++i)
					Env.add(bindings[i][0], values[i], form, env)

				break
			}

			case 'let*': {
				for (let i: number = 0; i < bindings.length; ++i)
					Env.add(bindings[i][0], this.evalExpr(bindings[i][1], env), form, env)

				break
			}

			case 'letrec': {
				for (let i: number = 0; i < bindings.length; ++i)
					Env.add(bindings[i][0], null, form, env)

				const values: any[] = bindings.map( (binding: [string, any]): any => this.evalExpr(binding[1], env) )

				for (let i: number = 0; i < bindings.length; ++i)
					Env.set(bindings[i][0], values[i], form, env)

				break
			}

			case 'letrec*': {
				for (let i: number = 0; i < bindings.length; ++i)
					Env.add(bindings[i][0], null, form, env)

				for (let i: number = 0; i < bindings.length; ++i)
					Env.set(bindings[i][0], this.evalExpr(bindings[i][1], env), form, env)

				break
			}
		}
	}

	// (let-values ([(name+) (value+)]+) expr+)
	private bindLetValues(bindings: [string[], any[]][], env: any[]): void {
		for (let i: number = 0; i < bindings.length; ++i) {
			const bindLine: [string[], any[]] = bindings[i]
			const formals : string[]          = bindLine[0];
			const values  : any[]             = this.evalExpr(bindLine[1], env)

			if (values[0] !== 'values')
				throw `Error: Multiple values required in 'let-values'`
			if (values.length - 1 !== formals.length)
				throw `Error: Values count does not match. Required: ${formals.length}, got: ${values.length - 1}`

			for (let i: number = 0; i < formals.length; ++i)
				Env.add(formals[i], values[i + 1], 'let-values', env)
		}
	}

	// (let*-values ([(name+) (value+)]+) expr+)
	private bindLetStarValues(bindings: [string[], any[]][], env: any[]): void {
		for (let i: number = 0; i < bindings.length; ++i) {
			const bindLine: [string[], any[]] = bindings[i]
			const formals : string[]          = bindLine[0];
			const values  : any[]             = this.evalExpr(bindLine[1], env)

			if (values[0] !== 'values')
				throw `Error: Multiple values required in 'let*-values'`
			if (values.length - 1 !== formals.length)
				throw `Error: Values count does not match. Required: ${formals.length}, got: ${values.length - 1}`

			for (let i: number = 0; i < formals.length; ++i)
				Env.add(formals[i], values[i + 1], 'let*-values', env)
		}
	}

	// (do ([name init step]+) (test res) expr+)
	private evalDo(expr: any[], env: any[]): any[]
	{
		env.push(['#scope', 'do'])

		const bindings: [string, any, any][] = expr[1]

		// Eval inits
		const inits: any[] = bindings.map( (binding: [string, any, any]): any => this.evalExpr(binding[1], env) )
		for (let i: number = 0; i < bindings.length; ++i)
			Env.add(bindings[i][0], inits[i], 'init', env)

		while(! this.isTrue( this.evalExpr(expr[2][0], env) )) {
			// Eval body
			if (expr.length === 4)
				this.evalExpr(expr[3], env)
			else if (expr.length > 4)
				this.evalExprList(expr.slice(3), env)

			// Eval steps
			const stepValues = []
			for (const binding of bindings) {
				if (binding.length === 3)
					stepValues.push( this.evalExpr(binding[2], env) )
			}
			for (const binding of bindings) {
				if (binding.length === 3)
					Env.set(binding[0], stepValues.shift(), 'step', env)
			}
		}

		const res = expr[2].length === 2
			? this.evalExpr(expr[2][1], env)
			: this.evalExprList(expr[2].slice(1), env)

		Env.clear('#scope', env)

		return res
	}

	// (and)            => true
	// (and expr)       => expr
	// (and expr expr+) => the first faulty or the last one
	private evalAnd(expr: any[], env: any[]): any
	{
		if (expr.length === 1)
			return true

		const val = this.evalExpr(expr[1], env)

		switch (expr.length) {
			case 2:
				return val
			case 3:
				return this.isTrue(val) ? this.evalExpr(expr[2], env) : val
			default:
				return this.isTrue(val) ? this.evalAnd(expr.slice(1), env) : val
		}
	}

	// (or)            => false
	// (or expr)       => expr
	// (or expr expr+) => the first truthy or the last one
	private evalOr(expr: any[], env: any[]): any
	{
		if (expr.length === 1)
			return false

		const val = this.evalExpr(expr[1], env)

		switch (expr.length) {
			case 2:
				return val
			case 3:
				return this.isTrue(val) ? val : this.evalExpr(expr[2], env)
			default:
				return this.isTrue(val) ? val : this.evalOr(expr.slice(1), env)
		}
	}

	// (if test then else)
	// (if test then)
	private evalIf(expr: any[], env: any[]): any
	{
		return this.isTrue( this.evalExpr(expr[1], env) )
				? this.evalExpr(expr[2], env)
				: this.evalExpr(expr[3], env)
	}

	// (unless test-expr
	//         expr+)
	private evalUnless(expr: any[], env: any[]): void
	{
		if (expr.length === 1)
			throw "Error: Empty 'unless'"

		if (expr.length === 2)
			throw "Error: Empty 'unless' body"

		if ( this.isTrue(this.evalExpr(expr[1], env)) )
			return

		env.push(['#scope', 'unless'])

		if (expr.length === 3)
			this.evalExpr(expr[2], env)
		else
			this.evalExprList(expr.slice(2), env)

		Env.clear('#scope', env)
	}

	// (values expr1 expr2 ...)
	private evalValues(expr: any[], env: any[]): any
	{
		return ['values', ...this.mapExprList(expr.slice(1), env)];
	}

	// (when test-expr
	//       expr+)
	private evalWhen(expr: any[], env: any[]): void
	{
		if (expr.length === 1)
			throw "Error: Empty 'when'"

		if (expr.length === 2)
			throw "Error: Empty 'when' body"

		if (! this.isTrue(this.evalExpr(expr[1], env)) )
			return

		env.push(['#scope', 'when'])

		if (expr.length === 3)
			this.evalExpr(expr[2], env)
		else
			this.evalExprList(expr.slice(2), env)

		Env.clear('#scope', env)
	}

	// (cond
	//     [test expr+]
	//     ...
	//     [else expr+])
	private evalCond(expr: any, env: any[]): any
	{
		const clauses: any[] = expr.slice(1)
		env.push(['#scope', 'cond'])

		for (const clause of clauses) {
			if (clause[0] === 'else' || this.isTrue(this.evalExpr(clause[0], env))) {
				const res = clause.length === 2
					? this.evalExpr(clause[1], env)
					: this.evalExprList(clause.slice(1), env)

				Env.clear('#scope', env)

				return res
			}
		}

		Env.clear('#scope', env)
	}

	// (case expr
	//     [(datum+) expr]
	//     ...
	//     [else     expr])
	private evalCase(expr: any, env: any[]): any
	{
		const key    : any   = this.evalExpr(expr[1], env)
		const clauses: any[] = expr.slice(2)

		for (const clause of clauses) {
			const datum: any[] | string = clause[0]
			if (!Array.isArray(datum) && datum !== 'else')
				throw `Error: 'case' requires datum to be in a list. Given: ${ Printer.stringify(datum) }`
			if (clause.length <= 1)
				throw `Error: 'case' requires a clause with one or more expressions.`

			const isMatch = datum === 'else' ||
				datum.some((e: any | any[]) => e === key || (e[0] === 'string' && e[1] === key))

			if (!isMatch)
				continue

			env.push(['#scope', 'case'])

			const res = clause.length === 2
				? this.evalExpr(clause[1], env)
				: this.evalExprList(clause.slice(1), env)

			Env.clear('#scope', env)

			return res
		}
	}

	// (display expr)
	private evalDisplay(expr: any[], env: any[]): void
	{
		const [obj] = <[any]>this.evalArgs(['any'], expr, env)

		this.options.printer(Printer.stringify(obj))
	}

	// (newline)
	private evalNewline(expr: any[], env: any[]): void
	{
		this.evalArgs([], expr, env)

		this.options.printer('\r\n')
	}

	// (quote obj) => obj
	private evalQuote(expr: any[]): any
	{
		if (expr.length !== 2)
			throw 'Error: \'quote\' requires 1 argument. Given: ' + (expr.length - 1)

		return expr[1]
	}

	// (quasiquote obj) => obj
	private evalQuasiquote(expr: any[], env: any[]): any
	{
		if (expr.length !== 2)
			throw `Error: 'quasiquote' requires 1 argument. Given: ${expr.length - 1}`

		const isUnquote         = (obj: any): boolean => obj === ','
		const isUnquoteSplicing = (obj: any): boolean => obj === '@'

		const datum : any   = expr[1]
		const output: any[] = []

		for (let i: number = 0; i < datum.length; i++) {
			if (i > 0 && isUnquote(datum[i - 1]))
				output.push(this.evalExpr(datum[i], env))
			else if (i > 0 && isUnquoteSplicing(datum[i - 1]))
				output.push(...this.evalExpr(datum[i], env))
			else if (!isUnquote(datum[i]) && !isUnquoteSplicing(datum[i]))
				output.push(datum[i])
		}

		return output
	}

	// (format pattern args...)
	// (format #t pattern args...)
	private evalFormat(expr: any[], env: any[]): string | undefined
	{
		const form   : any[]    = this.mapExprList(expr.slice(1), env)
		const isPrint: boolean  = typeof form[0] === 'boolean' && form[0]
		const pattern: string   = typeof form[0] === 'string' ? form[0] : form[1]
		const args   : string[] = form.slice(typeof form[0] === 'string' ? 1 : 2).map(Printer.stringify)

		// TODO implement different placeholders
		let index: number = 0
		const text: string = pattern.replace(/~./g, (_: string): string => args[index++])

		if (!isPrint)
			return text

		this.options.printer(text)
	}

	// (debug)
	private evalDebug(_expr: any[], env: any): void
	{
		this.isDebug = true
		const maxLen     : number   = 500
		const envDumpList: string[] = []

		for (let i: number = Math.min(env.length - 1, 20); i > -1; i--) {
			const envText : string = Printer.stringify(env[i][1])
			const textLine: string = envText.length > maxLen ? envText.slice(0, maxLen) + '...' : envText
			envDumpList.push(`${env[i][0]} = ${textLine}`)
		}

		this.options.printer(`Environment:\n${envDumpList.join('\n')}\n`)
	}

	// (raise expr)
	private evalRaise(expr: any[], env: any): void
	{
		throw this.evalExpr(expr[1], env)
	}

	// (parse src)
	private evalParse(expr: any[], env: any[]): any[]
	{
		const [scr]: [string] = <[string]>this.evalArgs(['string'], expr, env)

		return new Parser().parse(scr)
	}

	// (eval src)
	private evalEval(expr: any[], env: any[]): any[]
	{
		const [obj]: [any] = <[any]>this.evalArgs(['any'], expr, env)

		return this.evalCodeTree(obj, this.options)
	}

	private dumpExpression(expr: any[]): void
	{
		this.options.printer(`Expression:\n${Printer.stringify(expr)}\n`)
	}

	private assertArity(expr: any[], argsCount: number, optionalCount: number): void
	{
		const argText = (count: number): string => count === 1 ? '1 argument' : count + ' arguments'

		if (optionalCount === 0 && expr.length !== argsCount + 1)
			throw `Error: '${expr[0]}' requires ${argText(argsCount)}. Given: ${argText(expr.length - 1)}`

		if (optionalCount !== 0 &&
			(expr.length - 1 < argsCount - optionalCount || expr.length - 1 > argsCount)) {
			throw `Error: '${expr[0]}' requires from ${argText(argsCount - optionalCount)} to ${argText(argsCount)}.` +
					` Given: ${argText(expr.length - 1)}`
		}
	}

	private assertArgType(name: string, arg: any, argType: string): void
	{
		if (! this.assertType(arg, argType) )
			throw `Error: '${name}' requires ${argType}. Given: ${typeof arg} ${this.argToStr(arg)}`
	}

	private argToStr(arg: any): string
	{
		const maxLength: number = 25
		const argText  : string = Printer.stringify(arg)

		return argText.length > maxLength
		       ? argText.substring(0, maxLength) + '...'
		       : argText
	}
}
