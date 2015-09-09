exports.data = {
	systems: {
		gb: {
			name: "Gameboy",
			shortname: "gameboy",
			romfileextentions: [
				'gb',
				'gbc'
			]
		},
		gba: {
			name: "Gameboy Advance",
			shortname: "GBA",
			romfileextentions: [
				'gba'
			]
		},
		nes: {
			name: "Nintendo Entermainment System",
			shortname: "NES",
			romfileextentions: [
				'nes'
			]
		},
		snes: {
			name: "Super Nintendo Entermainment System",
			shortname: "SNES",
			romfileextentions: [
				'smc'
			]
		},
		gen: {
			name: "Sega Genesis",
			shortname: "Genesis",
			romfileextentions: [
				'bin',
				'32x'
			]
		},
		sms: {
			name: "Sega Master System",
			shortname: "Master System",
			romfileextentions: [
				'sms'
			]
		},
		gg: {
			name: "Sega Game Gear",
			shortname: "Game Gear",
			romfileextentions: [
				'gg'
			]
		}
	},
	search: {
		notes: "Rank Skip is passing over the japanese and translated titles with [!]",
		boxFrontThreshold: 63,
		searchAllThreshold: 63,
		searchAllRankSkip: [
			82,
			83
		],
		suggestionThreshold: 65,
		suggestionRankSkip: [
			82,
			83
		]
	}
};