$(document).ready(function() {

	var nes;
    $(function() {
        nes = new JSNES({
            'ui': $('#emulator').JSNESUI({
            	'working': [['1', '/roms/nes/Blaster Master/Blaster Master (U) [!].nes']]
            })
        });
        //select the option above and signify the change:
        $('#emulator select>optgroup>option').prop('selected', true);
        $('#emulator select').change();
        $('#emulator input.nes-zoom').click();
    });
});