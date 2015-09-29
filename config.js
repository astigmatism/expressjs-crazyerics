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
			titles: 2087,
			suggestions: 848,
			ratiotoall: 0.203
		},
		gba: {
			name: "Gameboy Advance",
			shortname: "GBA",
			romfileextentions: [
				'gba'
			],
			titles: 2040,
			suggestions: 586,
			ratiotoall: 0.140,
			retroarch: 'video_aspect_ratio = 1.5',
		},
		nes: {
			name: "Nintendo Entermainment System",
			shortname: "NES",
			romfileextentions: [
				'nes'
			],
			titles: 1971,
			suggestions: 692,
			ratiotoall: 0.166,
			retroarch: 'video_aspect_ratio = 1.06666667'
		},
		snes: {
			name: "Super Nintendo Entermainment System",
			shortname: "SNES",
			romfileextentions: [
				'smc'
			],
			titles: 2120,
			suggestions: 704,
			ratiotoall: 0.169,
			retroarch: 'video_aspect_ratio = 1.14285714',
		},
		gen: {
			name: "Sega Genesis",
			shortname: "Genesis",
			romfileextentions: [
				'bin',
				'32x'
			],
			titles: 1112,
			suggestions: 721,
			ratiotoall: 0.173,
			retroarch: 'video_aspect_ratio = 1.42857143'
		},
		sms: {
			name: "Sega Master System",
			shortname: "Master System",
			romfileextentions: [
				'sms'
			],
			titles: 516,
			suggestions: 99,
			ratiotoall: 0.023,
			retroarch: 'video_aspect_ratio = 1.33333333'
		},
		gg: {
			name: "Sega Game Gear",
			shortname: "Game Gear",
			romfileextentions: [
				'gg'
			],
			titles: 376,
			suggestions: 214,
			ratiotoall: 0.051,
			retroarch: 'video_aspect_ratio = 1.11111111'
		},
		n64: {
			name: "Nintendo 64",
			shortname: "N64",
			romfileextentions: [
				'z64',
				'bin'
			],
			titles: 414,
			suggestions: 297,
			ratiotoall: 0.071,
			retroarch: 'video_aspect_ratio = 1.142857143'
		}
	},
	retroarch: 'input_screenshot = t\ninput_exit_emulator = end\ninput_save_state = num1\ninput_load_state = num4\ninput_state_slot_increase = num3\ninput_state_slot_decrease = num2\ninput_audio_mute = m\ninput_reset = h\ninput_toggle_fullscreen = f12\ninput_toggle_fast_forward = space\ninput_player1_select = shift\nvideo_vsync = false\naudio_latency = 96\nvideo_font_size = 32\nvideo_force_aspect = true\nvideo_smooth = true\nrewind_enable = true\n',
	search: {
		notes: "dont forget to also change crazyerics.prototype._boxFrontThreshold",
		boxFrontThreshold: 63,
		searchAllThreshold: 66,
		suggestionThreshold: 89
	}
};