define(['vexflow', 'modules/converters/MusicCSLJson/src/NoteModel_CSLJson'], function(Vex, NoteModel_CSLJson) {
	function LSNoteView(note) {
		this.vexflowNote = createVexflowNote(note);
		this.note = note;


		/**
		 * @param  {NoteModel} note
		 * @return {Vex.Flow.StaveNote}
		 */
		function createVexflowNote(note) {

			var cslNote = NoteModel_CSLJson.exportToMusicCSLJSON(note);
			if (note.isRest){
				cslNote.keys[0] = "B/4";
			}
			var vexflowNote = new Vex.Flow.StaveNote(cslNote);
			
			if (parseInt(vexflowNote.keyProps[0].octave, null) >= 5) {
				vexflowNote.setStemDirection(-1);
			}

			var accidental = [];
			var i;
			for (i = 0; i < note.numPitches; i++) {
				accidental.push(note.getAccidental(i));
			}
			//accidental can either be a string (for monphony) or an array (for polyphony)
			for (var acc in accidental) {
				if (accidental[acc] != null && accidental[acc].length != 0)
					vexflowNote.addAccidental(acc, new Vex.Flow.Accidental(accidental[acc]));
			}
			var dot = note.getDot();

			if (dot) {
				for (i = 0; i < dot; i++) vexflowNote.addDot(0);
			}
			//if (note.isRest)
			return vexflowNote;
		}

	}
	LSNoteView.prototype.getVexflowNote = function() {
		return this.vexflowNote;
	};
	LSNoteView.prototype.isBeamable = function() {
		return (/^\d+$/).test(this.vexflowNote.duration) && !this.note.isRest;
	};
	return LSNoteView;
});