import React, { useEffect, useState } from "react"
import {
	SwipeableDrawer as Drawer,
	Grid,
	Typography,
	FormHelperText,
	List,
	ListItemIcon,
	ListItemText,
	Button,
	IconButton,
	FormControl,
	Select,
	MenuItem,
	InputLabel,
} from "@material-ui/core"
import {
	SportsEsports as GameIcon,
	ExitToApp as LogoutIcon,
	Menu as MenuIcon,
	ArrowBackIos as BackIcon,
} from "@material-ui/icons"

import {
	Avatar,
	Divider,
	PopConfirm,
} from "@/components"

import Auth from "@/services/auth"
import { onEvent } from "@/services/event"
import SocketService from "@/services/socket"

import DeviceUtil from "@/utils/device"
import { orderByCreatedAtDesc } from "@/utils/game"

import { useSocketStore } from "@/store/Socket"
import useSocket from "@/hooks/useSocket"

import useStyles from "@/components/Menu/styles"
import useCustomStyles from "@/styles/custom"

import useDidMount from "@/hooks/useDidMount"
import {
	GetCardBacksEventInput,
	GetCardBacksEventResponse,
} from "@uno-game/protocols"
import serverConfig from "@/config/server"


import GameItem from "@/components/Menu/GameItem"
import ListItem from "@/components/Menu/ListItem"

const Menu: React.FC = () => {
	const socketStore = useSocketStore()
	const socket = useSocket()

	const [opened, setOpened] = useState(false)
	const [isTablePage, setIsTablePage] = useState(false)
	const [cardBackOptions, setCardBackOptions] = useState<Array<{ fileName: string, src: string }>>([])
	const [selectedCardBackFileName, setSelectedCardBackFileName] = useState("")

	const customClasses = useCustomStyles({})
	const classes = useStyles()

	const isTablePagePath = window.location.pathname.includes("table")

	if (!isTablePagePath && isTablePage) {
		setIsTablePage(false)
	}

	const handleLogout = () => {
		PopConfirm.open({
			title: "Logout",
			message: "Are you sure you want to logout?",
			onConfirm: () => {
				Auth.logout()
			},
		})
	}

	const handleCloseMenu = () => {
		setOpened(false)
	}

	const loadCardBackOptions = async () => {
		try {
			// Use HTTP first because it is more reliable than socket callbacks during connection setup.
			const response = await fetch(`${serverConfig.apiUrl}/card-backs`)
			const responseData = await response.json()
			const cardBacks = responseData?.cardBacks || []

			setCardBackOptions(cardBacks)
		} catch (error) {
			try {
				const getCardBacksWithTimeout = Promise.race<GetCardBacksEventResponse>([
					SocketService.emit<GetCardBacksEventInput, GetCardBacksEventResponse>("GetCardBacks", {}),
					new Promise<GetCardBacksEventResponse>((_, reject) => {
						setTimeout(() => reject(new Error("GetCardBacks timeout")), 3000)
					}),
				])
				const { cardBacks } = await getCardBacksWithTimeout
				setCardBackOptions(cardBacks || [])
			} catch (fallbackError) {
				setCardBackOptions([])
			}
		}
	}

	const handleOpenMenu = async () => {
		setOpened(true)
		await loadCardBackOptions()
	}

	const handleToggleMenu = () => {
		setOpened(lastState => {
			const willOpen = !lastState
			if (willOpen) {
				loadCardBackOptions()
			}
			return willOpen
		})
	}

	const handleChangeCardBack = async (cardBackFileName: string) => {
		setSelectedCardBackFileName(cardBackFileName)

		const selectedOption = cardBackOptions.find(option => option.fileName === cardBackFileName)

		if (!socketStore.game?.id || !selectedOption) {
			return
		}

		// Optimistic local preview; server broadcast remains source of truth.
		socketStore.setGameData({
			...socketStore.game,
			players: (socketStore.game.players || []).map(player => {
				if (player.id === socketStore.player?.id) {
					return {
						...player,
						cardBackSrc: selectedOption.src,
					}
				}

				return player
			}),
		})

		await socket.changePlayerCardBack(socketStore.game.id, cardBackFileName)
	}

	useEffect(() => {
		if (!socketStore.game?.id || !selectedCardBackFileName) {
			return
		}

		socket.changePlayerCardBack(socketStore.game.id, selectedCardBackFileName)
	}, [socketStore.game?.id, selectedCardBackFileName])

	useDidMount(() => {
		onEvent("GameTableOpened", () => {
			setIsTablePage(true)
			setOpened(false)
		})
	})

	const currentPlayer = socketStore?.game?.players?.find(player => player.id === socketStore?.player?.id)

	return (
		<>
			<Grid
				container
				className={classes.menuIconContainer}
			>
				<IconButton
					onClick={handleToggleMenu}
					className={classes.menuIcon}
				>
					<MenuIcon />
				</IconButton>
			</Grid>

			<Drawer
				open={opened}
				onClose={handleCloseMenu}
				onOpen={handleOpenMenu}
				variant="temporary"
				anchor="left"
				style={{
					zIndex: 99999,
				}}
				PaperProps={{
					className: classes.drawerPaper,
				}}
			>
				<Grid
					container
					direction="column"
					justify="space-between"
					className={classes.content}
				>
					<Grid
						container
						direction="column"
					>
						<Grid
							container
							justify="space-between"
						>
							<Grid
								container
								justify="flex-start"
								alignItems="center"
								className={classes.avatarContainer}
							>
								<Avatar
									size="large"
									name={socketStore?.player?.name || ""}
								/>

								<Typography
									variant="h3"
									className={`${classes.avatarName} ${customClasses.limitedName}`}
								>
									{socketStore?.player?.name}
								</Typography>
							</Grid>

							{(DeviceUtil.isMobile || isTablePage) && (
								<IconButton
									onClick={handleCloseMenu}
									className={classes.backIcon}
								>
									<BackIcon />
								</IconButton>
							)}
						</Grid>

						<Divider orientation="horizontal" size={4} />

						<Typography
							variant="h2"
							className={classes.menuTitle}
						>
							PAGES
						</Typography>

						<Divider orientation="horizontal" size={1} />

						<List onClick={handleCloseMenu}>
							<ListItem to="/">
								<ListItemIcon>
									<GameIcon
										fontSize="large"
										className={classes.listItemIcon}
									/>
								</ListItemIcon>
								<ListItemText
									primary="Games"
									primaryTypographyProps={{
										variant: "h3",
										className: classes.listItemText,
									}}
								/>
							</ListItem>
						</List>

						<Divider orientation="horizontal" size={4} />

						<Typography
							variant="h2"
							className={classes.menuTitle}
						>
							LAST GAMES
						</Typography>

						<Divider orientation="horizontal" size={1} />

						<List onClick={handleCloseMenu}>
							{socketStore.gameHistory
							?.sort(orderByCreatedAtDesc)
							.slice(0, 3)
							.map((gameHistory) => (
								<ListItem
									to={`/${gameHistory.gameId}`}
									status={gameHistory.status}
								>
									<GameItem
										playersCount={gameHistory.playersCount}
										name={gameHistory.name}
										status={gameHistory.status}
									/>
								</ListItem>
							))}
						</List>

						<Divider orientation="horizontal" size={3} />

						<Typography
							variant="h2"
							className={classes.menuTitle}
						>
							CARD BACK
						</Typography>

						<Divider orientation="horizontal" size={1} />

						<Grid
							container
							className={classes.cardBackSelectorContainer}
						>
							<FormControl
								fullWidth
								disabled={cardBackOptions.length === 0}
							>
								<InputLabel id="card-back-select-label">Select card back</InputLabel>
								<Select
									labelId="card-back-select-label"
									value={selectedCardBackFileName || (currentPlayer?.cardBackSrc || "").split("/").pop() || ""}
									onChange={event => handleChangeCardBack(event.target.value as string)}
									MenuProps={{
										disablePortal: true,
									}}
								>
									{cardBackOptions.map(option => (
										<MenuItem key={option.fileName} value={option.fileName}>
											{option.fileName.replace(/\.[^/.]+$/, "")}
										</MenuItem>
									))}
								</Select>
								<FormHelperText>
									Only other players can see your card back during a match.
								</FormHelperText>
								{cardBackOptions.length === 0 && (
									<FormHelperText>
										No card-back files found. Add images to `unapy/src/Assets/card-backs/custom` and restart backend.
									</FormHelperText>
								)}
							</FormControl>
						</Grid>

					</Grid>

					<Grid
						container
						direction="column"
						alignItems="center"
					>
						<Divider orientation="horizontal" size={2} />

						<Button
							startIcon={<LogoutIcon />}
							className={classes.logoutButton}
							onClick={handleLogout}
						>
							LOGOUT
						</Button>

						<Divider orientation="horizontal" size={1} />
					</Grid>
				</Grid>
			</Drawer>
		</>
	)
}

export default Menu
