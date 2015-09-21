exports.data = {
	systems: {
		gb: {
			name: "Gameboy",
			shortname: "gameboy",
			romfileextentions: [
				'gb',
				'gbc'
			],
			retroarch: 'video_aspect_ratio = 1.11111111',
			romcount: 2087,
			gamestosuggest: 979,
			ratiotoall: 0.224
		},
		gba: {
			name: "Gameboy Advance",
			shortname: "GBA",
			romfileextentions: [
				'gba'
			],
			romcount: 2040,
			gamestosuggest: 604,
			ratiotoall: 0.138,
			retroarch: 'video_aspect_ratio = 1.5',
		},
		nes: {
			name: "Nintendo Entermainment System",
			shortname: "NES",
			romfileextentions: [
				'nes'
			],
			romcount: 1971,
			gamestosuggest: 761,
			ratiotoall: 0.174,
			retroarch: 'video_aspect_ratio = 1.06666667',
		},
		snes: {
			name: "Super Nintendo Entermainment System",
			shortname: "SNES",
			romfileextentions: [
				'smc'
			],
			romcount: 2120,
			gamestosuggest: 752,
			ratiotoall: 0.172,
			retroarch: 'video_aspect_ratio = 1.14285714',
		},
		gen: {
			name: "Sega Genesis",
			shortname: "Genesis",
			romfileextentions: [
				'bin',
				'32x'
			],
			romcount: 1112,
			gamestosuggest: 791,
			ratiotoall: 0.181,
			retroarch: 'video_aspect_ratio = 1.42857143',
		},
		sms: {
			name: "Sega Master System",
			shortname: "Master System",
			romfileextentions: [
				'sms'
			],
			romcount: 516,
			gamestosuggest: 245,
			ratiotoall: 0.056,
			retroarch: 'video_aspect_ratio = 1.33333333',
		},
		gg: {
			name: "Sega Game Gear",
			shortname: "Game Gear",
			romfileextentions: [
				'gg'
			],
			romcount: 376,
			gamestosuggest: 235,
			ratiotoall: 0.054,
			retroarch: 'video_aspect_ratio = 1.11111111',
		}
	},
	retroarch: 'input_screenshot = n\ninput_exit_emulator = end\ninput_exit_emulator=input_save_state = num1\ninput_load_state = num4\ninput_state_slot_increase = num3\ninput_state_slot_decrease = num2\ninput_audio_mute = m\ninput_reset = r\ninput_toggle_fullscreen = f12\ninput_toggle_fast_forward = t\ninput_player1_select = shift\nvideo_vsync = false\naudio_latency = 96\nvideo_font_size = 24\n',
	search: {
		notes: "dont forget to also change crazyerics.prototype._boxFrontThreshold",
		boxFrontThreshold: 63,
		searchAllThreshold: 66,
		suggestionThreshold: 89
	}
};