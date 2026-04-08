import { GameRuleSetDefinition } from "@uno-game/protocols"

export const GAME_RULE_SETS: GameRuleSetDefinition[] = [
	{
		id: "basic",
		name: "Basic (Classic UNO)",
		description: "Standard UNO rules for this release.",
		enabled: true,
	},
	{
		id: "stacking-chaos",
		name: "Stacking Chaos",
		description: "Coming soon: extended stacking behavior.",
		enabled: false,
	},
	{
		id: "jump-in",
		name: "Jump-In",
		description: "Coming soon: interrupt turns with matching cards.",
		enabled: false,
	},
	{
		id: "seven-zero",
		name: "7-0 Swap/Rotate",
		description: "Coming soon: seven/zero hand rotation rules.",
		enabled: false,
	},
]
