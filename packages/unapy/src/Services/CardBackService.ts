import fs from "fs/promises"
import path from "path"

import staticFilesConfig from "@/Config/static-files"

const ALLOWED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"])
const CARD_BACKS_RELATIVE_PATH = "card-backs/custom"

class CardBackService {
	private getCardBacksDirectoryPath (): string {
		return path.join(__dirname, "..", "Assets", "card-backs", "custom")
	}

	async getCardBackFileNames (): Promise<string[]> {
		try {
			const directoryPath = this.getCardBacksDirectoryPath()
			const files = await fs.readdir(directoryPath, { withFileTypes: true })

			return files
				.filter(file => file.isFile())
				.map(file => file.name)
				.filter(fileName => ALLOWED_EXTENSIONS.has(path.extname(fileName).toLowerCase()))
		} catch (error) {
			return []
		}
	}

	async cardBackFileExists (cardBackFileName: string): Promise<boolean> {
		const safeFileName = path.basename(cardBackFileName)
		const extension = path.extname(safeFileName).toLowerCase()

		if (!ALLOWED_EXTENSIONS.has(extension)) {
			return false
		}

		const cardBackFileNames = await this.getCardBackFileNames()

		return cardBackFileNames.includes(safeFileName)
	}

	buildCardBackSrc (cardBackFileName: string): string {
		const safeFileName = path.basename(cardBackFileName)

		return `${staticFilesConfig.staticFilesBaseUrl}/${CARD_BACKS_RELATIVE_PATH}/${safeFileName}`
	}
}

export default new CardBackService()
