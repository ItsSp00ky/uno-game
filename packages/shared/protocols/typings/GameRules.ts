export type GameRuleSetId =
"basic" |
"stacking-chaos" |
"jump-in" |
"seven-zero"

export type GameRuleSetDefinition = {
	id: GameRuleSetId
	name: string
	description: string
	enabled: boolean
}
