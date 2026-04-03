import React from "react"
import {
	Grid,
	Typography,
} from "@material-ui/core"
import {
	Star as StarIcon,
	Close as CloseIcon,
} from "@material-ui/icons"
import { IconButton } from "@material-ui/core"

import {
	Avatar,
	Divider,
} from "@/components"

import useSocket from "@/hooks/useSocket"

import useStyles from "@/pages/Room/PlayerItem/styles"
import useCustomStyles from "@/styles/custom"

type PlayerItem = {
	name: string
	ready: boolean
	playerId: string
	onKick?: () => void
}

const PlayerItem: React.FC<PlayerItem> = (props) => {
	const { name, ready, playerId, onKick } = props

	const socket = useSocket()

	const classes = useStyles({ ready })
	const customClasses = useCustomStyles({})

	return (
		<Grid
			container
			alignItems="center"
			justify="space-between"
			className={classes.container}
		>
			<Grid item>
				<Grid container>
					<Avatar
						name={name}
						size="small"
					/>

					<Divider orientation="vertical" size={2} />

					<Grid
						container
						direction="column"
						justify="center"
						style={{ flex: 1 }}
					>
						<Grid
							container
							alignItems="center"
						>
							<Typography
								variant="h3"
								className={`${classes.title} ${customClasses.limitedName}`}
							>
								{name}
							</Typography>

							{socket.currentRoundPlayer?.id === playerId && (
								<StarIcon
									fontSize="small"
									className={classes.starIcon}
								/>
							)}
						</Grid>

						{socket?.currentPlayer?.id === playerId && (
							<Typography
								variant="h2"
								className={classes.description}
							>
								(You)
							</Typography>
						)}
					</Grid>
				</Grid>
			</Grid>

			<Grid item>
				<Grid container alignItems="center">
					<Typography
						variant="h2"
						className={classes.statusText}
					>
						{ready ? "READY" : "UNREADY"}
					</Typography>

					{onKick && (
						<IconButton 
							size="small" 
							style={{ marginLeft: 8, color: "rgba(255, 255, 255, 0.5)" }}
							onClick={onKick}
							title="Kick Player"
						>
							<CloseIcon fontSize="small" />
						</IconButton>
					)}
				</Grid>
			</Grid>
		</Grid>
	)
}

export default PlayerItem
