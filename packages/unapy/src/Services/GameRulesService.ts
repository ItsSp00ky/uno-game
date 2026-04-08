import { GameRuleSetDefinition, GameRuleSetId } from "@uno-game/protocols"

const RULE_SET_DEFINITIONS: GameRuleSetDefinition[] = [
	{
		id: "basic",
		name: "Basic (Classic UNO)",
		description: "Standard UNO rules currently used by the game.",
		enabled: true,
	},
	{
		id: "stacking-chaos",
		name: "Stacking Chaos",
		description: "Placeholder for expanded stacking and combo variants.",
		enabled: false,
	},
	{
		id: "jump-in",
		name: "Jump-In",
		description: "Placeholder for same-card interruption mechanics.",
		enabled: false,
	},
	{
		id: "seven-zero",
		name: "7-0 Swap/Rotate",
		description: "Placeholder for seven/zero hand rotation rules.",
		enabled: false,
	},
]

class GameRulesService {
	getRuleSets (): GameRuleSetDefinition[] {
		return RULE_SET_DEFINITIONS
	}

	resolveRuleSetId (ruleSetId?: GameRuleSetId): GameRuleSetId {
		const selectedRuleSet = RULE_SET_DEFINITIONS.find(rule => rule.id === ruleSetId && rule.enabled)

		return selectedRuleSet?.id || "basic"
	}
}

export default new GameRulesService()
