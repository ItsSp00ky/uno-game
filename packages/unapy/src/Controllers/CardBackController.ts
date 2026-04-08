import { Request, Response } from "express"

import CardBackService from "@/Services/CardBackService"

class CardBackController {
	async getCardBackList (_req: Request, res: Response) {
		const cardBackFileNames = await CardBackService.getCardBackFileNames()
		const cardBacks = cardBackFileNames.map(fileName => ({
			fileName,
			src: CardBackService.buildCardBackSrc(fileName),
		}))

		return res.status(200).json({
			cardBacks,
		})
	}
}

export default new CardBackController()
