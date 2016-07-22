define([
	'modules/core/src/SectionModel',
	'modules/Unfold/src/SectionStartPoint',
	'modules/Unfold/src/StartLabel',
	'modules/Unfold/src/SectionEndPoint',
	'modules/Unfold/src/EndLabel'
], function(SectionModel, SectionStartPoint, StartLabel, SectionEndPoint, EndLabel) {
	var SectionSegment = function(song, fromPoint, toPoint, playIndex) {


		this.song = song;
		this.fromPoint = fromPoint;
		this.toPoint = toPoint;
		this.sectionIndex = fromPoint.section;
		// this.playIndex = playIndex;
		this.section = this.song.getSection(this.sectionIndex);
		this.bars = this.section.getPartPlayBarNumbers(playIndex, fromPoint.bar, toPoint.bar);

		/**
		 * @return {Integer} the number of the first bar in the folded version
		 */
		this.getSectionStartBarNumber = function() {
			return this.song.getStartBarNumberFromSectionNumber(this.sectionIndex);
		};

		this.addUnfoldedSection = function(unfoldedSong) {
			
			function getSectionName(sectionName, fromPoint, toPoint) {
				//endings
				if (sectionName && playIndex > 0) sectionName += " (" + (playIndex + 1) + ")";
				//from 
				if (Object.getPrototypeOf(fromPoint) !== SectionStartPoint && 
					!fromPoint.hasLabel(StartLabel.CAPO) && !fromPoint.hasLabel(StartLabel.CODATO)) {
					sectionName += " from " + fromPoint.label;
				}
				//to
				if (Object.getPrototypeOf(toPoint) !== SectionEndPoint && !toPoint.hasLabel(EndLabel.END)){
					sectionName += " to " + toPoint.label;
				}
				return sectionName;
			}
			var sectionName = getSectionName(this.section.getName(), this.fromPoint, this.toPoint);
			
			var numberOfBars = this.bars.length;

			unfoldedSong.addSection(new SectionModel({
				name: sectionName,
				numberOfBars: numberOfBars
			}));
		};

		this.addUnfoldedSectionBars = function(unfoldedSong, foldedBarIdx) {

			var barMng = this.song.getComponent('bars');
			var unfoldedBarMng = unfoldedSong.getComponent('bars');

			for (var i = 0; i < this.bars.length; i++) {
				unfoldedBarMng.addBar(barMng.getBar(foldedBarIdx + this.bars[i]).clone(true));
			}
		};

		this.addUnfoldedSectionNotes = function(unfoldedSong, foldedBarIdx) {
			var noteMng = this.song.getComponent('notes');
			var unfoldedNoteMng = unfoldedSong.getComponent('notes');
			var notes;
			for (var i = 0; i < this.bars.length; i++) {
				notes = noteMng.cloneNotesAtBarNumber(foldedBarIdx + this.bars[i], this.song);
				unfoldedNoteMng.addNotes(notes);
			}

		};
		this.addUnfoldedSectionChords = function(unfoldedSong, foldedBarIdx, unfoldedBarIdx) {
			var chordMng = this.song.getComponent('chords');
			var unfoldedChordMng = unfoldedSong.getComponent('chords');
			var chords, chord;

			for (var i = 0; i < this.bars.length; i++) {
				chords = chordMng.getChordsByBarNumber(foldedBarIdx + this.bars[i]);
				for (var j = 0; j < chords.length; j++) {
					chord = chords[j].clone();
					chord.setBarNumber(i + unfoldedBarIdx);
					unfoldedChordMng.addChord(chord);
				}
			}
		};
	};

	return SectionSegment;
});