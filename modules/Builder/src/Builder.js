define([
	"modules/AudioComments/src/AudioCommentsController",
	"modules/ChordEdition/src/ChordEdition",
	"modules/chordSequence/src/SongView_chordSequence",
	"modules/Constraint/src/Constraint",
	"modules/Cursor/src/Cursor",
	"modules/Edition/src/Edition",
	"modules/FileEdition/src/FileEdition",
	"modules/History/src/HistoryC",
	"modules/HarmonicAnalysis/src/HarmonicAnalysis",
	"modules/Harmonizer/src/Harmonizer",
	"modules/LSViewer/src/main",
	"modules/MainMenu/src/MainMenu",
	"modules/MidiCSL/src/main",
	"modules/NoteEdition/src/NoteEdition",
	'modules/core/src/SongModel',
	'modules/converters/MusicCSLJson/src/SongModel_CSLJson',
	"modules/StructureEdition/src/StructureEdition",
	"modules/Wave/src/WaveController",
	"jquery"
], function(
	AudioComments,
	ChordEdition,
	chordSequence,
	Constraint,
	Cursor,
	Edition,
	FileEdition,
	HistoryC,
	HarmonicAnalysis,
	Harmonizer,
	LSViewer,
	MainMenu,
	MidiCSL,
	NoteEdition,
	SongModel,
	SongModel_CSLJson,
	StructureEdition,
	Wave,
	$
) {
	var Builder = {};
	Builder.easyInit = function(name, MusicCSLJSON, parentHTML, params) {
		console.log(name, MusicCSLJSON, parentHTML, params);
	};
	Builder.init = function(MusicCSLJSON, params) {
		if (typeof MusicCSLJSON === "undefined" || typeof params === "undefined") {
			return;
		}

		/**
		 * In first Part we read options
		 */
		// Viewer
		var useViewer = false;
		if (typeof params.viewer !== "undefined") {
			if (typeof params.viewer.HTMLElement !== "undefined") {
				useViewer = true;
				var viewerHTML = params.viewer.HTMLElement;
				var displayTitle = (typeof params.viewer.displayTitle !== "undefined") ? params.viewer.displayTitle : true;
				var displayComposer = (typeof params.viewer.displayComposer !== "undefined") ? params.viewer.displayComposer : true;
				var layer = (typeof params.viewer.layer !== "undefined") ? params.viewer.layer : false;
				var typeResize = (typeof params.viewer.typeResize !== "undefined") ? params.viewer.typeResize : "scale";
				var heightOverflow = (typeof params.viewer.heightOverflow !== "undefined") ? params.viewer.heightOverflow : "auto";
				var width = (typeof params.viewer.width !== "undefined") ? params.viewer.width : "auto";
			}
		}

		// Player
		var usePlayer = false;
		if (typeof params.player !== "undefined") {
			if (typeof params.player.HTMLElement !== "undefined") {
				usePlayer = true;
				var playerHTML = params.player.HTMLElement;
				var soundfontUrl = (typeof params.player.soundfontUrl !== "undefined") ? soundfontUrl : undefined;
				var displayMetronome = (typeof params.player.displayMetronome !== "undefined") ? displayMetronome : true;
				var displayLoop = (typeof params.player.displayLoop !== "undefined") ? displayLoop : true;
				var displayTempo = (typeof params.player.displayTempo !== "undefined") ? displayTempo : true;
				var changeInstrument = (typeof params.player.changeInstrument !== "undefined") ? changeInstrument : true;
				var autoload = (typeof params.player.autoload !== "undefined") ? autoload : false;
				var progressBar = (typeof params.player.progressBar !== "undefined") ? progressBar : true;
			}
		}

		// Edition
		allowEdition = false;
		if (typeof params.edition !== "undefined") {
			allowEdition = true;
			var editNotes = (typeof params.edition.notes !== "undefined") ? params.edition.notes : true;
			var editChords = (typeof params.edition.chords !== "undefined") ? params.edition.chords : true;
			var editStructure = (typeof params.edition.structure !== "undefined") ? params.edition.structure : true;
			var allowHistory = false;
			if (typeof params.history !== "undefined") {
				if (params.history.enable) {
					allowHistory = true;
					// if not precised, then it doesn't display history but keyboard ctrl+z and y are working
					historyHTML = (typeof params.history.HTMLElement !== "undefined") ? params.edition.history.HTMLElement : undefined;
				}
			}
		}

		// Menu
		var useMenu = false;
		if (typeof params.menu !== "undefined") {
			if (typeof params.menu.HTMLElement !== "undefined") {
				useMenu = true;
				var menuHTML = params.menu.HTMLElement;
			}
		}



		/**
		 * On second Part we use options to initialize modules
		 */
		var songModel = SongModel_CSLJson.importFromMusicCSLJSON(MusicCSLJSON);

		doLoadMidiPlayer = false; // only for debug false true

		var loadedModules = {}; // we store loaded modules in this object, this object is return for developer
		var viewer;
		if (useViewer) {
			// Reading only
			viewer = Builder._loadViewer(songModel, viewerHTML);
			loadedModules.viewer = viewer;
			if (useMenu) {
				// Load menus
				var menu = Builder._loadMenu(menuHTML);
				loadedModules.menu = menu;
			}
			if (allowEdition) {
				if (allowHistory) {
					Builder._loadHistory(songModel, historyHTML);
				}
				if (useMenu) {
					var edition = Builder._loadEditionModules(viewer, songModel, menu); // TODO menu shouldn't be required here
					// Harmonize menu
					var harm = new Harmonizer(songModel, menu.model);
					// Harmonic Analysis menu
					var harmAn = new HarmonicAnalysis(songModel, edition.noteEdition.noteSpaceMng);
					// Edit files menu
					var fileEdition = new FileEdition(songModel, viewer.canvas);
					menu.model.addMenu({
						title: 'Harmonizer',
						view: harm.view,
						order: 5
					});

					menu.model.addMenu({
						title: 'Harmonic Analysis',
						view: harmAn.view,
						order: 6
					});
				}
			}
			if (useMenu) {
				var fileEdition = new FileEdition(songModel, viewer.canvas);
				menu.model.addMenu({
					title: 'File',
					view: fileEdition.view,
					order: 1
				});
				Builder._loadActiveMenuOrDefault(menu, 'File');
			}
		} else {
			viewer = undefined;
		}
		if (usePlayer) {
			var cursorNoteModel;
			if (typeof edition !== "undefined" && typeof edition.cursorNote.model !== "undefined") {
				cursorNoteModel = edition.cursorNote.model;
			} else {
				cursorNoteModel = (new Cursor(songModel.getComponent('notes'), songModel, 'notes', 'arrow')).model;
			}
			// Load players (midi and audio)
			Builder._loadMidiPlayer(songModel, playerHTML, doLoadMidiPlayer, soundfontUrl, cursorNoteModel);
			if (useViewer) {
				var wave = Builder._loadAudioPlayer(songModel, cursorNoteModel, viewer); // audio player is use to get audio wave, it's why it needs viewer
				loadedModules.audioPlayer = wave;

				var audioComments = Builder._loadComments(wave, viewer, songModel);
				loadedModules.audioComments = audioComments;
			}
		}
		if (useViewer) {
			viewer.draw(songModel);
		}

		/*
		if (allowEdition === false) {
			// Reading only
			var viewer = Builder._loadViewer(songModel, viewerHTML);
			var cursorNote = new Cursor(songModel.getComponent('notes'), songModel, 'notes', 'arrow');

			// Load players (midi and audio)
			Builder._loadMidiPlayer(songModel, playerHTML, doLoadMidiPlayer, soundfontUrl, edition.cursorNote.model);
			var wave = Builder._loadAudioPlayer(songModel, cursorNote.model, viewer);

			// Load menus
			var menu = Builder._loadMenu(menuHTML);
			var fileEdition = new FileEdition(songModel, viewer.canvas);
			menu.model.addMenu({
				title: 'File',
				view: fileEdition.view,
				order: 1
			});
			Builder._loadActiveMenuOrDefault(menu, 'File');
			var audioComments = Builder._loadComments(wave, viewer, songModel);
			Builder._addComment(audioComments);
			viewer.draw(songModel);
		} else {
			// Read and write
			var viewer = Builder._loadViewer(songModel, viewerHTML);
			var menu = Builder._loadMenu(menuHTML);
			Builder._loadHistory(songModel, historyHTML);
			var edition = Builder._loadEditionModules(viewer, songModel, menu);
			// Load players (midi and audio)
			Builder._loadMidiPlayer(songModel, playerHTML, doLoadMidiPlayer, soundfontUrl, edition.cursorNote.model);
			var wave = Builder._loadAudioPlayer(songModel, edition.cursorNote.model, viewer);

			// Harmonize menu
			var harm = new Harmonizer(songModel, menu.model);
			// Harmonic Analysis menu
			var harmAn = new HarmonicAnalysis(songModel, edition.noteEdition.noteSpaceMng);
			// Edit files menu
			var fileEdition = new FileEdition(songModel, viewer.canvas);
			menu.model.addMenu({
				title: 'Harmonizer',
				view: harm.view,
				order: 5
			});

			menu.model.addMenu({
				title: 'Harmonic Analysis',
				view: harmAn.view,
				order: 6
			});

			menu.model.addMenu({
				title: 'File',
				view: fileEdition.view,
				order: 1
			});
			Builder._loadActiveMenuOrDefault(menu, 'File');
			var audioComments = Builder._loadComments(wave, viewer, songModel);
			Builder._addComment(audioComments);
			viewer.draw(songModel);
		}
		*/
		return loadedModules;
	};



	Builder._loadHistory = function(songModel, HTMLElement) {
		new HistoryC(songModel, HTMLElement, 20, true, false);
		$.publish('ToHistory-add', 'Open song - ' + songModel.getTitle());
	};

	Builder._loadChordSequence = function() {
		var optionChediak = {
			displayTitle: true,
			displayComposer: true,
			displaySection: true,
			displayBar: true,
			delimiterBar: "",
			delimiterBeat: "/",
			unfoldSong: false, //TODO unfoldSong is not working yet
			fillEmptyBar: false,
			fillEmptyBarCharacter: "%",
		};
		new chordSequence($('#chordSequence1')[0], songModel, optionChediak);
	};

	Builder._loadViewer = function(songModel, HTMLElement) {
		var viewer = new LSViewer.LSViewer(HTMLElement, {
			/*displayTitle: false,
			displayComposer: false,*/
			layer: true
		});
		LSViewer.OnWindowResizer(songModel);
		return viewer;
	};

	Builder._loadMenu = function(HTMLElement) {
		var menu = new MainMenu(HTMLElement);
		return menu;
	};

	Builder._loadEditionModules = function(viewer, songModel, menu) {
		//ALTERNATIVE WAY TO CREATE EDITION if not using edition constructor
		// var KeyboardManager = require('modules/Edition/src/KeyboardManager');
		// new KeyboardManager(true);

		// // Edit notes on view
		// var cursorNote = new Cursor(songModel.getComponent('notes'), 'notes', 'arrow');
		// var noteEdition = new NoteEdition(songModel, cursorNote.model, viewer, '/modules/NoteEdition/img');

		// // // Edit chords on view
		// var cursorChord = new Cursor(songModel.getSongTotalBeats(), 'chords', 'tab');
		// cursorChord.model.setEditable(false);

		// var chordEdition = new ChordEdition(songModel, cursorChord.model, viewer, '/modules/NoteEdition/img');
		//bars edition 
		//var structEdition = new StructureEdition(songModel, edition.cursorNote.model, '/modules/StructureEdition/img');

		var edition = new Edition(viewer, songModel, menu.model, {
			notes: {
				active: true,
				menu: {
					title: 'Notes',
					order: 2
				},
				imgPath: '/modules/NoteEdition/img'
			},
			chords: {
				active: true,
				menu: {
					title: 'Chords',
					order: 3
				},
				imgPath: '/modules/NoteEdition/img'
					// menu: false /* if we don't want menu*/
			},
			structure: {
				active: true,
				menu: {
					title: 'Structure',
					order: 4
				},
				imgPath: '/modules/StructureEdition/img'
			},
			composer: {
				suggestions: ['Adam Smith', 'Kim Jong-il', 'Iñigo Errejón', 'Mia Khalifa', 'Jose Monge']
			}
		});
		return edition;
	};

	Builder._loadMidiPlayer = function(songModel, HTMLPlayer, loadMidi, soundfontUrl, cursorModel) {
		// Create a song from testSong
		var pV = new MidiCSL.PlayerView(HTMLPlayer, '/modules/MidiCSL/img', {
			displayMetronome: true,
			displayLoop: true,
			displayTempo: true,
			changeInstrument: true,
			autoload: false,
			progressBar: true
		});
		if (typeof loadMidi === "undefined" || loadMidi === true) {
			var player = new MidiCSL.PlayerModel_MidiCSL(songModel, soundfontUrl, {
				'cursorModel': cursorModel
			});
			var pC = new MidiCSL.PlayerController(player, pV);
		}
	};

	Builder._loadAudioPlayer = function(songModel, cursorModel, viewer) {
		var params = {
			showHalfWave: true,
			//drawMargins: true,
			topAudio: -120,
			heightAudio: 75,
			file: '/tests/audio/solar.wav',
			tempo: 170
		};
		var waveMng = new Wave(songModel, cursorModel, viewer, params);
		$.publish('ToPlayer-disableAll');
		waveMng.enable();
		return waveMng;
	};


	Builder._loadActiveMenuOrDefault = function(menu, defaultMenu) {
		menu.controller.loadStateTab();
		if (typeof menu.model.getCurrentMenu() === "undefined") {
			menu.controller.activeMenu(defaultMenu);
		}
	};

	Builder._loadComments = function(waveMng, viewer, songModel) {
		var audioComments = new AudioComments(waveMng, viewer, songModel);
		return audioComments;
	};


	return Builder;
});