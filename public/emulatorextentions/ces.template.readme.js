/**
 * Emulator Extention class: everything on the prototype (public) will be extended to the cesEmulator (ces.emulator.js) class.
 * Use this file to override functionality.
 * Never change its name from cesEmulatorExtention, it is expected to extend with this name.
 * retroarch Module definition begins here as well since it might be specific to the emulator scripts you are using
 * Try copying an existing module definition from the previous version to see if it still works!
 * KEEP IN MIND: that the instace of this class has visibility into its baseclass, but the baseclass will not have visiblity into this!!!
 * @param  {Object} _Compression compression library
 * @param  {Object} config       ces config
 * @param  {Object} module       the module class built from the emulator extention file
 * @param  {string} system       gen, nes, gb, ...
 * @param  {string} title        Super Mario Bros. 3
 * @param  {string} file         Super Mario Bros. 3 (U)[!].nes
 * @return {undef}
 */
var cesEmulator = (function(_Compression, config, module, system, title, file, key) {

    // private members
    var self = this;

    // public/protected members (on prototytpe)

    // public/protected methods

    // private methods

    //since this function acts as a constrctor body, instantiate the module here, after its definition.
    return new (function() {

        this.noInitialRun = true;
        this.preRun = [];
        this.postRun = [];
        this.canvas = document.getElementById('emulator');

        return this;
    });
});
