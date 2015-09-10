exports.data = {
	systems: {
		gb: {
			name: "Gameboy",
			shortname: "gameboy",
			romfileextentions: [
				'gb',
				'gbc'
			],
			gamestosuggest: 1075,
			ratiotoall: 0.205 
		},
		gba: {
			name: "Gameboy Advance",
			shortname: "GBA",
			romfileextentions: [
				'gba'
			],
			gamestosuggest: 1157,
			ratiotoall: 0.221
		},
		nes: {
			name: "Nintendo Entermainment System",
			shortname: "NES",
			romfileextentions: [
				'nes'
			],
			gamestosuggest: 826,
			ratiotoall: 0.158
		},
		snes: {
			name: "Super Nintendo Entermainment System",
			shortname: "SNES",
			romfileextentions: [
				'smc'
			],
			gamestosuggest: 836,
			ratiotoall: 0.159
		},
		gen: {
			name: "Sega Genesis",
			shortname: "Genesis",
			romfileextentions: [
				'bin',
				'32x'
			],
			gamestosuggest: 823,
			ratiotoall: 0.157
		},
		sms: {
			name: "Sega Master System",
			shortname: "Master System",
			romfileextentions: [
				'sms'
			],
			gamestosuggest: 259,
			ratiotoall: 0.049
		},
		gg: {
			name: "Sega Game Gear",
			shortname: "Game Gear",
			romfileextentions: [
				'gg'
			],
			gamestosuggest: 267,
			ratiotoall: 0.0509
		}
	},
	search: {
		boxFrontThreshold: 63,
		suggestionThreshold: 66
	}
};