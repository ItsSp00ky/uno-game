import React, { useEffect, useRef, useState } from "react"
import { makeStyles } from "@material-ui/core"
import { Game } from "@uno-game/protocols"
import colors from "@/styles/colors"
import useSocket from "@/hooks/useSocket"

const useStyles = makeStyles(theme => ({
	container: {
		position: "absolute",
		top: "50%",
		left: "50%",
		width: 320,
		height: 320,
		marginLeft: -160,
		marginTop: -160,
		zIndex: 0,
		pointerEvents: "none",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		[theme.breakpoints.down("sm")]: {
			width: 200,
			height: 200,
			marginLeft: -100,
			marginTop: -100,
		},
	},
	svg: {
		width: "100%",
		height: "100%",
		overflow: "visible",
		transition: "transform 320ms ease-in-out",
	},
	ring: {
		fill: "none",
		stroke: "rgba(255, 255, 255, 0.1)",
		strokeWidth: 1,
		strokeDasharray: "4 4",
	},
	arrow: {
		fill: "rgba(255, 255, 255, 0.2)",
		transition: "fill 0.5s ease, filter 0.5s ease",
	},
	activeArrow: {
		fill: colors.palette.yellow1,
		filter: `drop-shadow(0 0 8px ${colors.palette.yellow1})`,
		animation: "$pulse 1s ease-in-out infinite",
	},
	"@keyframes pulse": {
		"0%": { opacity: 0.5 },
		"50%": { opacity: 1 },
		"100%": { opacity: 0.5 },
	},
}))

interface DirectionIndicatorProps {
	game: Game
}

const DirectionIndicator: React.FC<DirectionIndicatorProps> = ({ game }) => {
	const classes = useStyles()
	const { layoutedOtherPlayers } = useSocket()

	const normalizeAngle = (angle: number): number => {
		const normalized = angle % 360
		return normalized < 0 ? normalized + 360 : normalized
	}

	const getShortestDelta = (fromAngle: number, toAngle: number): number => {
		let delta = normalizeAngle(toAngle) - normalizeAngle(fromAngle)

		if (delta > 180) delta -= 360
		if (delta < -180) delta += 360

		return delta
	}
	
	// Map layout positions to angles (degrees)
	const angleMap: Record<string, number> = {
		bottom: 90,
		bottomRight: 45,
		right: 0,
		topRight: 315,
		top: 270,
		topLeft: 225,
		left: 180,
		bottomLeft: 135,
	}

	const arrows = [0, 45, 90, 135, 180, 225, 270, 315]

	const activePosition = Object.entries(layoutedOtherPlayers)
		.find(([, player]) => player.isCurrentRoundPlayer)?.[0]

	const activeAngle = activePosition ? angleMap[activePosition] : 90
	const targetAngle = normalizeAngle(activeAngle)

	const [rotationAngle, setRotationAngle] = useState<number>(targetAngle)
	const previousAngleRef = useRef<number>(targetAngle)

	useEffect(() => {
		const previousAngle = previousAngleRef.current
		const delta = getShortestDelta(previousAngle, targetAngle)
		const nextAngle = previousAngle + delta

		previousAngleRef.current = nextAngle
		setRotationAngle(nextAngle)
	}, [targetAngle])

	const arrowRotation = game.direction === "clockwise" ? 90 : -90

	return (
		<div className={classes.container}>
			<svg 
				className={classes.svg}
				viewBox="0 0 100 100"
				style={{ transform: `rotate(${rotationAngle}deg)` }}
			>
				<circle cx="50" cy="50" r="48" className={classes.ring} />
				{arrows.map((angle) => {
					const isActive = angle === 90
					
					return (
						<g 
							key={angle} 
							transform={`rotate(${angle} 50 50)`}
						>
							{/* Current arrow shape pointing along the circle */}
							<path
								d="M 50 2 L 55 10 L 50 7 L 45 10 Z"
								transform={`rotate(${arrowRotation} 50 6)`}
								className={`${classes.arrow} ${isActive ? classes.activeArrow : ""}`}
							/>
						</g>
					)
				})}
			</svg>
		</div>
	)
}

export default DirectionIndicator
