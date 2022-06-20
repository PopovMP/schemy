class Env
{
	public static add(symbol: string, value: any, modifier: string, env: any[]): void
	{
		if (value === undefined)
			throw `Error: Cannot set unspecified value to identifier: ${symbol}.`

		for (let i = env.length - 1; i > -1; i--) {
			const cellKey = env[i][0]

			if (cellKey === '#scope')
				break

			if (cellKey === symbol)
				throw `Error: Identifier already defined: ${symbol}`
		}

		env.push([symbol, value, modifier])
	}

	public static set(symbol: string, value: any, modifier: string, env: any[]): void
	{
		if (value === undefined)
			throw `Error: Cannot set unspecified value to identifier: ${symbol}.`

		for (let i = env.length - 1; i > -1; i--) {
			const cellKey = env[i][0]

			if (cellKey === symbol) {
				env[i][1] = value
				env[i][2] = modifier
				return
			}
		}

		throw `Error: Identifier is not defined: ${symbol}`
	}

	public static lookup(symbol: string, env: any[], libs: any[]): any
	{
		for (let i = env.length - 1; i > -1; i--) {
			if (symbol === env[i][0]) {
				const val: any = env[i][1]

				if (val === null)
					throw `Error: Unspecified value of identifier: ${symbol}`

				return  val
			}
		}

		for (const lib of libs) {
			if (lib.builtinHash[symbol])
				return symbol
		}

		throw `Error: Unbound identifier: ${symbol}`
	}

	public static has(symbol: string, env: any[], libs: any[]): boolean
	{
		for (let i = env.length - 1; i > -1; i--) {
			if (symbol === env[i][0])
				return true
		}

		for (const lib of libs) {
			if (lib.builtinHash[symbol])
				return true
		}

		return false
	}

	public static clear(tag: string, env: any[]): void
	{
		let cell: [string, any]
		do {
			cell = env.pop()
		} while (cell[0] !== tag)
	}
}