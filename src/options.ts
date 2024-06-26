class Options
{
	public printer     : Function = console.log
	public libs        : string[] = ['core-lib', 'ext-lib', 'list-lib', 'string-lib']
	public extContext  : any      = this
	public extFunctions: any      = {}

	constructor() {}

	public static parse(options: any): Options
	{
		const evalOptions: Options = new Options()

		if (typeof options.printer === 'function')
			evalOptions.printer = options.printer

		if (Array.isArray(options.libs))
			evalOptions.libs = options.libs.slice()

		if (options.extContext)
			evalOptions.extContext = options.extContext

		if (options.extFunctions)
			evalOptions.extFunctions = options.extFunctions

		return evalOptions
	}
}
