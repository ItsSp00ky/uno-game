import React, { createContext, useContext, useState } from "react"

import SocketService from "@/services/socket"
import serverConfig from "@/config/server"

import useDidMount from "@/hooks/useDidMount"

import { LoadingScene } from "@/components"

import { preloadCardPictures } from "@/utils/card"
import { refreshCacheIfNeeded } from "@/utils/cache"

import {
	Game,
	ChatMessage,
	Chat,
	Player,
	GameHistory,
	PlayerJoinedEventData,
	PlayerLeftEventData,
	PlayerToggledReadyEventData,
	PlayerPutCardEventData,
	PlayerChoseCardColorEventData,
	GameRoundRemainingTimeChangedEventData,
	GameHistoryConsolidatedEventData,
	PlayerBoughtCardEventData,
	PlayerCardUsabilityConsolidatedEventData,
	GameAmountToBuyChangedEventData,
	PlayerStatusChangedEventData,
	PlayerCardBackChangedEventData,
	CardData,
	PlayerData,
} from "@uno-game/protocols"

export interface SocketContextData {
	game?: Game
	chats?: Map<string, Chat>
	player?: Player
	gameHistory?: GameHistory[]
	gameRoundRemainingTimeInSeconds?: number
	addChatMessage: (chatId: string, message: ChatMessage) => void
	setGameData: (data: Game) => void
	setPlayerData: (data: Player) => void
	setChatData: (data: Chat) => void
}

const SocketStore = createContext<SocketContextData>({} as SocketContextData)

export const useSocketStore = (): SocketContextData => useContext(SocketStore)

const normalizeAssetUrl = (assetSrc?: string): string => {
	if (!assetSrc) {
		return ""
	}

	const apiBaseUrl = (serverConfig.apiUrl || "").replace(/\/$/, "")

	if (!apiBaseUrl) {
		return assetSrc
	}

	if (assetSrc.startsWith("/assets/")) {
		return `${apiBaseUrl}${assetSrc}`
	}

	return assetSrc
		.replace("http://localhost:5000/assets", `${apiBaseUrl}/assets`)
		.replace("https://localhost:5000/assets", `${apiBaseUrl}/assets`)
}

const normalizeCard = (card: CardData): CardData => {
	const normalizedPossibleColors = card.possibleColors ? {
		...card.possibleColors,
		red: normalizeAssetUrl(card.possibleColors.red),
		blue: normalizeAssetUrl(card.possibleColors.blue),
		yellow: normalizeAssetUrl(card.possibleColors.yellow),
		green: normalizeAssetUrl(card.possibleColors.green),
		black: normalizeAssetUrl(card.possibleColors.black),
	} : undefined

	return {
		...card,
		src: normalizeAssetUrl(card.src),
		possibleColors: normalizedPossibleColors,
	}
}

const normalizePlayer = (player: PlayerData): PlayerData => ({
	...player,
	cardBackSrc: normalizeAssetUrl(player.cardBackSrc),
	handCards: (player.handCards || []).map(normalizeCard),
})

const normalizeGameAssets = (gameData: Game): Game => ({
	...gameData,
	usedCards: (gameData.usedCards || []).map(normalizeCard),
	players: (gameData.players || []).map(normalizePlayer),
})

const SocketProvider: React.FC = (props) => {
	const { children } = props

	const [loading, setLoading] = useState(true)
	const [player, setPlayer] = useState<Player>({} as Player)
	const [game, setGame] = useState<Game>({} as Game)
	const [chats, setChats] = useState<Map<string, Chat>>(new Map())
	const [gameHistory, setGameHistory] = useState<GameHistory[]>([])
	const [gameRoundRemainingTimeInSeconds, setGameRoundRemainingTimeInSeconds] = useState<number>(0)

	const setPlayerData = (data: Player) => {
		setPlayer(data)
	}

	const setGameData = (data: Game) => {
		setGame(lastState => ({
			...(lastState || {}),
			...normalizeGameAssets(data || {} as Game),
		}))
	}

	const setChatData = (data: Chat) => {
		setChats(lastState => {
			const updatedChats = new Map(lastState.entries())

			updatedChats.set(data.id, data)

			return updatedChats
		})
	}

	const addChatMessage = (chatId: string, message: ChatMessage) => {
		setChats(lastState => {
			const updatedChats = new Map(lastState.entries())

			const chat = updatedChats.get(chatId)

			if (chat) {
				const isThereAnyDuplicatedMessage = chat.messages
					.some(existentMessage => existentMessage.id === message.id)

				if (!isThereAnyDuplicatedMessage) {
					chat.messages.push(message)
				}

				updatedChats.set(chatId, chat)
			}

			return updatedChats
		})
	}

	const onGameHistoryConsolidated = () => {
		SocketService.on<GameHistoryConsolidatedEventData>("GameHistoryConsolidated", ({ gameHistory }) => {
			setGameHistory(gameHistory)
		})
	}

	const onGameRoundRemainingTimeChanged = () => {
		SocketService.on<GameRoundRemainingTimeChangedEventData>("GameRoundRemainingTimeChanged", ({ roundRemainingTimeInSeconds }) => {
			setGameRoundRemainingTimeInSeconds(roundRemainingTimeInSeconds)
		})
	}

	const onPlayerJoined = () => {
		SocketService.on<PlayerJoinedEventData>("PlayerJoined", ({ player }) => {
			setGame(lastState => {
				if (!lastState?.id) {
					return lastState
				}

				const updatedData = { ...lastState }

				const playerExists = updatedData.players.some(({ id }) => id === player.id)

				if (!playerExists) {
					updatedData.players.push(player)
				}

				return updatedData
			})
		})
	}

	const onPlayerLeft = () => {
		SocketService.on<PlayerLeftEventData>("PlayerLeft", ({ playerId }) => {
			setGame(lastState => {
				if (!lastState?.id) {
					return lastState
				}

				const updatedData = { ...lastState }

				if (updatedData?.status === "waiting") {
					updatedData.players = updatedData.players.filter(({ id }) => id !== playerId)
				}

				return updatedData
			})
		})
	}

	const onPlayerToggledReady = () => {
		SocketService.on<PlayerToggledReadyEventData>("PlayerToggledReady", ({ playerId, ready }) => {
			setGame(lastState => {
				if (!lastState?.id) {
					return lastState
				}

				const updatedData = { ...lastState }

				updatedData.players = updatedData.players.map(player => {
					if (player.id === playerId) {
						return {
							...player,
							ready,
						}
					}

					return player
				})

				return updatedData
			})
		})
	}

	const onPlayerPutCard = () => {
		SocketService.on<PlayerPutCardEventData>("PlayerPutCard", ({ playerId, cards }) => {
			setGame(lastState => {
				if (!lastState?.id) {
					return lastState
				}

				const normalizedIncomingCards = cards.map(normalizeCard)
				const existingCardIds = new Set(lastState.usedCards.map(card => card.id))
				const cardsToPrepend = [...normalizedIncomingCards]
					.filter(card => !existingCardIds.has(card.id))
					.reverse()

				const usedCards = [...cardsToPrepend, ...lastState.usedCards]

				const players = lastState.players.map(player => {
					if (player.id !== playerId) {
						return player
					}

					return {
						...player,
						handCards: player.handCards.filter(handCard => {
							const handCardIsPutCard = cards.some(({ id }) => id === handCard.id)
							return !handCardIsPutCard
						}),
					}
				})

				return {
					...lastState,
					usedCards,
					players,
				}
			})
		})
	}

	const onPlayerChoseCardColor = () => {
		SocketService.on<PlayerChoseCardColorEventData>("PlayerChoseCardColor", ({ cards }) => {
			setGame(lastState => {
				if (!lastState?.id) {
					return lastState
				}

				const updatedData = { ...lastState }

				updatedData.usedCards = updatedData.usedCards.map(usedCard => {
					const card = cards.find(({ id }) => id === usedCard.id)

					if (card) {
						return normalizeCard(card)
					}

					return usedCard
				})

				return updatedData
			})
		})
	}

	const onPlayerBoughtCard = () => {
		SocketService.on<PlayerBoughtCardEventData>("PlayerBoughtCard", ({ playerId, cards }) => {
			setGame(lastState => {
				if (!lastState?.id) {
					return lastState
				}

				const players = lastState.players.map(player => {
					if (player.id !== playerId) {
						return player
					}

					const existingCardIds = new Set(player.handCards.map(card => card.id))
					const cardsToAdd = cards
						.map(normalizeCard)
						.filter(card => !existingCardIds.has(card.id))

					return {
						...player,
						handCards: [...cardsToAdd, ...player.handCards],
					}
				})

				return {
					...lastState,
					players,
				}
			})
		})
	}

	const onPlayerCardUsabilityConsolidated = () => {
		SocketService.on<PlayerCardUsabilityConsolidatedEventData>("PlayerCardUsabilityConsolidated", ({ players }) => {
			setGame(lastState => {
				if (!lastState?.id) {
					return lastState
				}

				const updatedPlayers = lastState.players.map(player => {
					const consolidatedPlayer = players.find(({ id }) => id === player.id)

					if (consolidatedPlayer) {
						const updatedHandCards = player.handCards.map(handCard => {
							const consolidatedHandCard = consolidatedPlayer.handCards.find(({ id }) => id === handCard.id)

							if (consolidatedHandCard) {
								return {
									...handCard,
									canBeCombed: consolidatedHandCard.canBeCombed,
									canBeUsed: consolidatedHandCard.canBeUsed,
								}
							}

							return handCard
						})

						return {
							...player,
							isCurrentRoundPlayer: consolidatedPlayer.isCurrentRoundPlayer,
							canBuyCard: consolidatedPlayer.canBuyCard,
							canPass: consolidatedPlayer.canPass,
							handCards: updatedHandCards,
						}
					}

					return player
				})

				return {
					...lastState,
					players: updatedPlayers,
				}
			})
		})
	}

	const onPlayerStatusChanged = () => {
		SocketService.on<PlayerStatusChangedEventData>("PlayerStatusChanged", ({ playerId, status }) => {
			setGame(lastState => {
				if (!lastState?.id) {
					return lastState
				}

				const players = lastState.players.map(player => {
					if (player.id === playerId) {
						return {
							...player,
							status,
						}
					}

					return player
				})

				return {
					...lastState,
					players,
				}
			})
		})
	}

	const onPlayerCardBackChanged = () => {
		SocketService.on<PlayerCardBackChangedEventData>("PlayerCardBackChanged", ({ playerId, cardBackSrc }) => {
			setGame(lastState => {
				if (!lastState?.id) {
					return lastState
				}

				return {
					...lastState,
					players: lastState.players.map(player => {
						if (player.id === playerId) {
							return {
								...player,
								cardBackSrc: normalizeAssetUrl(cardBackSrc),
							}
						}

						return player
					}),
				}
			})
		})
	}

	const onGameAmountToBuyChanged = () => {
		SocketService.on<GameAmountToBuyChangedEventData>("GameAmountToBuyChanged", ({ amountToBuy }) => {
			setGame(lastState => {
				if (!lastState?.id) {
					return lastState
				}

				return {
					...lastState,
					currentCardCombo: {
						...lastState.currentCardCombo,
						amountToBuy,
					},
				}
			})
		})
	}

	const connect = async () => {
		preloadCardPictures()

		refreshCacheIfNeeded()

		const playerData = await SocketService.getPlayerData()

		setPlayerData(playerData)

		setTimeout(() => {
			setLoading(false)
		}, 1000)
	}

	const setupListeners = () => {
		onGameRoundRemainingTimeChanged()
		onGameHistoryConsolidated()
		onPlayerJoined()
		onPlayerLeft()
		onPlayerToggledReady()
		onPlayerPutCard()
		onPlayerChoseCardColor()
		onPlayerBoughtCard()
		onPlayerCardUsabilityConsolidated()
		onPlayerStatusChanged()
		onPlayerCardBackChanged()
		onGameAmountToBuyChanged()
	}

	useDidMount(() => {
		connect()
		setupListeners()
	})

	return (
		<SocketStore.Provider
			value={{
				addChatMessage,
				chats,
				setPlayerData,
				player,
				setGameData,
				game,
				gameHistory,
				gameRoundRemainingTimeInSeconds,
				setChatData,
			}}
		>
			<LoadingScene loading={loading}>
				{children}
			</LoadingScene>
		</SocketStore.Provider>
	)
}

export default SocketProvider
