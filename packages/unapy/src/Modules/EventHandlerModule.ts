import { Socket } from "socket.io"
import ErrorHandler from "@uno-game/error-handler"

import GameService from "@/Services/GameService"
import ChatService from "@/Services/ChatService"
import PlayerService from "@/Services/PlayerService"
import ClientService from "@/Services/ClientService"
import SocketService from "@/Services/SocketService"
import CardBackService from "@/Services/CardBackService"

import {
	Player,
	SetPlayerDataEventInput,
	SetPlayerDataEventResponse,
	GetCardBacksEventInput,
	GetCardBacksEventResponse,
	CreateGameEventInput,
	CreateGameEventResponse,
	JoinGameEventInput,
	JoinGameEventResponse,
	BuyCardEventInput,
	PutCardEventInput,
	SendChatMessageEventInput,
	ChangePlayerStatusEventInput,
	ToggleReadyEventInput,
	ForceSelfDisconnectEventInput,
	PassTurnEventInput,
	FillWithBotsEventInput,
	ChangePlayerCardBackEventInput,
	KickPlayerEventInput,
} from "@uno-game/protocols"

class EventHandlerModule {
	clients: Map<string, Socket> = new Map()

	onConnection (client: Socket) {
		try {
			let playerData = {} as Player

			SocketService.on<SetPlayerDataEventInput, SetPlayerDataEventResponse>(client, "SetPlayerData", async ({ player }) => {
				playerData = await PlayerService.setPlayerData(player)

				SocketService.setupListener(client, "player", playerData.id)

				await ClientService.dispatchGameHistoryConsolidated(playerData.id)

				return {
					player: playerData,
				}
			})

			SocketService.on<GetCardBacksEventInput, GetCardBacksEventResponse>(client, "GetCardBacks", async () => {
				const cardBackFileNames = await CardBackService.getCardBackFileNames()
				const cardBacks = cardBackFileNames.map(fileName => ({
					fileName,
					src: CardBackService.buildCardBackSrc(fileName),
				}))

				return {
					cardBacks,
				}
			})

			SocketService.on<CreateGameEventInput, CreateGameEventResponse>(client, "CreateGame", async ({ ruleSetId }) => {
				let game = await GameService.getExistingPlayerGame(playerData.id)

				/**
				 * Prevent players from creating a lot of games.
				 */
				if (!game) {
					const chat = await ChatService.setupChat(playerData.id)

					game = await GameService.setupGame(playerData.id, chat.id, ruleSetId)
				}

				SocketService.setupListener(client, "game", game.id)
				SocketService.setupListener(client, "chat", game.chatId)

				return {
					gameId: game.id,
				}
			})

			SocketService.on<JoinGameEventInput, JoinGameEventResponse>(client, "JoinGame", async ({ gameId }) => {
				const game = await GameService.joinGame(gameId, playerData.id)
				if (!game) {
					return {
						game: null as unknown as JoinGameEventResponse["game"],
						chat: null as unknown as JoinGameEventResponse["chat"],
					}
				}

				const chat = await ChatService.joinChat(game.chatId)

				SocketService.setupListener(client, "chat", game.chatId)
				SocketService.setupListener(client, "game", gameId)

				return {
					game,
					chat,
				}
			})

			SocketService.on<BuyCardEventInput, unknown>(client, "BuyCard", async ({ gameId }) => {
				await GameService.buyCard(playerData.id, gameId)
			})

			SocketService.on<PutCardEventInput, unknown>(client, "PutCard", async ({ gameId, cardIds, selectedColor }) => {
				await GameService.putCard(playerData.id, cardIds, gameId, selectedColor)
			})

			SocketService.on<SendChatMessageEventInput, unknown>(client, "SendChatMessage", async ({ chatId, message }) => {
				await ChatService.pushMessage(playerData.id, chatId, message)
			})

			SocketService.on<ChangePlayerStatusEventInput, unknown>(client, "ChangePlayerStatus", async ({ gameId, playerStatus }) => {
				await GameService.changePlayerStatus(gameId, playerData.id, playerStatus)
			})

			SocketService.on<ToggleReadyEventInput, unknown>(client, "ToggleReady", async ({ gameId }) => {
				await GameService.toggleReady(playerData.id, gameId)
			})

			SocketService.on<ForceSelfDisconnectEventInput, unknown>(client, "ForceSelfDisconnect", async () => {
				const purgedGames = await GameService.purgePlayer(playerData.id)

				purgedGames.forEach(purgedGame => {
					SocketService.removeListener(client, "game", purgedGame.id)
					SocketService.removeListener(client, "chat", purgedGame.chatId)
				})
			})

			SocketService.on<PassTurnEventInput, unknown>(client, "PassTurn", async ({ gameId }) => {
				await GameService.passTurn(playerData.id, gameId)
			})

			SocketService.on<FillWithBotsEventInput, unknown>(client, "FillWithBots", async ({ gameId }) => {
				await GameService.fillWithBots(gameId)
			})

			SocketService.on<ChangePlayerCardBackEventInput, unknown>(client, "ChangePlayerCardBack", async ({ gameId, cardBackFileName }) => {
				await GameService.changePlayerCardBack(gameId, playerData.id, cardBackFileName)
			})

			SocketService.on<KickPlayerEventInput, unknown>(client, "KickPlayer", async ({ gameId, playerId }) => {
				await GameService.kickPlayer(gameId, playerId)
			})

			SocketService.on<unknown, unknown>(client, "disconnect", async () => {
				await GameService.purgePlayer(playerData.id)
			})
		} catch (error) {
			ErrorHandler.handle(error)
		}
	}
}

export default new EventHandlerModule()
