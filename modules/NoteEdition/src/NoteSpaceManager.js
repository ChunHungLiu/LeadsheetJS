define([
	'modules/core/src/SongModel',
	'modules/core/src/NoteModel',
	'modules/NoteEdition/src/NoteSpaceView',
	'modules/Cursor/src/CursorModel',
	'utils/UserLog',
	'pubsub',
], function(SongModel, NoteModel, NoteSpaceView, CursorModel, UserLog, pubsub) {

	function NoteSpaceManager(songModel, cursor) {
		this.songModel = songModel || new SongModel();
		this.cursor = cursor || new CursorModel();
		this.noteSpace = [];
		this.initSubscribe();

		this.CURSOR_HEIGHT = 80;
		this.CURSOR_MARGIN_TOP = 20;
		this.CURSOR_MARGIN_LEFT = 6;
		this.CURSOR_MARGIN_RIGHT = 9;
	}

	/**
	 * Subscribe to view events
	 */
	NoteSpaceManager.prototype.initSubscribe = function() {

		var self = this;
		$.subscribe('CanvasLayer-mousemove', function(el, position) {

			if (self.isInPath(position) !== false) {
				if (typeof myApp !== 'undefined'){	//TODO: refactor, get rid of 'myApp'
					myApp.viewer.el.style.cursor = 'pointer';
				}

			} else {
				if (typeof myApp !== 'undefined'){
					myApp.viewer.el.style.cursor = 'default';	
				}

			}
		});
		$.subscribe('CanvasLayer-selection',function(el,coords){
			$.publish('ToAllCursors-setEditable', false);
			var notes = self.getNotesInPath(coords);
			if (notes){
				self.cursor.setEditable(true);
				self.cursor.setPos(notes);
				$.publish('ToViewer-draw', self.songModel);
			}
		});

		$.subscribe('LSViewer-drawEnd', function(el, viewer) {
			if (self.cursor.getEditable()) {
				self.refresh(viewer);
			}
		});
	};

	NoteSpaceManager.prototype.updateNote = function(noteString, noteModel, noteSpace) {
		if (typeof noteModel === "undefined" && typeof noteSpace !== "undefined") {
			noteModel = new NoteModel({
				'beat': noteSpace.beatNumber,
				'barNumber': noteSpace.barNumber,
			});
			this.songModel.getComponent('notes').addnote(noteModel);
		}
		noteModel.setnoteFromString(noteString);
	};

	NoteSpaceManager.prototype.refresh = function(viewer) {
		this.noteSpace = this.createNoteSpace(viewer);
		this.draw(viewer);
	};
	/**
	 * 
	 * @param  {Object}  area can be in two forms :
	 *                        {x: 10, y: 10, xe: 20, ye: 20} / xe and ye are absolute positions (not relative to x and y)
	 *                        {x: 10, y:10}
	 * @return {Boolean}      
	 */
	NoteSpaceManager.prototype.isInPath = function(area) {
		
		for (var i in this.noteSpace) {
			if (typeof this.noteSpace[i] !== "undefined") {
				if (this.noteSpace[i].isInPath(area)) {
					return i;
				}
			}
		}
		return false;
	};
	NoteSpaceManager.prototype.getNotesInPath = function(coords) {
		var note, 
			min = null,
			max = null;
		for (var i in this.noteSpace) {
			if (this.noteSpace[i].isInPath(coords)) {
				if (min == null){
					min = Number(i);	
				}
				if (max == null || max < i){
					max = Number(i);	
				} 
			}
		}
		return (min === null && max === null) ? false : [min, max];
	};

	NoteSpaceManager.prototype.createNoteSpace = function(viewer) {
		var noteSpace = [];
		if (typeof viewer.vxfBars === "undefined") {
			return;
		}
		var area;
		var scale = viewer.SCALE;
		for (var i = 0, c = viewer.vxfNotes.length; i < c; i++) {
			currentNote = viewer.vxfNotes[i];
			currentNoteStaveY = currentNote.stave.y;
			boundingBox = currentNote.getBoundingBox();
			area = {
				x: boundingBox.x - this.CURSOR_MARGIN_LEFT,
				y: currentNoteStaveY + this.CURSOR_MARGIN_TOP,
				w: boundingBox.w + this.CURSOR_MARGIN_LEFT + this.CURSOR_MARGIN_RIGHT,
				h: this.CURSOR_HEIGHT
			};
			noteSpace.push(new NoteSpaceView(area,viewer.scaler));
		}
		return noteSpace;
	};


	/**
	 * Returns several areas to indicate which notes are selected, usefull for cursor or selection
	 * @param  {[Integer, Integer] } Array with initial position and end position
	 * @return {Array of Objects}, Object in this form: {area.x, area.y, area.xe, area.ye}
	 */
	NoteSpaceManager.prototype.getNotesAreasFromCursor = function(viewer, cursor) {
		var areas = [];
		var cInit = cursor[0];
		var cEnd = cursor[1];
		if (typeof viewer.vxfNotes[cInit] === "undefined") {
			return areas;
		}
		var x, y, xe;

		var currentNote, currentNoteStaveY, nextNoteStaveY;
		var firstNoteLine, lastNoteLine;
		firstNoteLine = viewer.vxfNotes[cInit];
		while (cInit <= cEnd) {
			currentNote = viewer.vxfNotes[cInit];
			currentNoteStaveY = currentNote.stave.y;
			if (typeof viewer.vxfNotes[cInit + 1] !== "undefined") {
				nextNoteStaveY = viewer.vxfNotes[cInit + 1].stave.y;
			}
			if (currentNoteStaveY != nextNoteStaveY || cInit == cEnd) {
				lastNoteLine = currentNote.getBoundingBox();
				x = firstNoteLine.getBoundingBox().x - this.CURSOR_MARGIN_LEFT;
				xe = lastNoteLine.x - x + lastNoteLine.w + this.CURSOR_MARGIN_RIGHT;
				areas.push({
					x: x,
					y: currentNoteStaveY + this.CURSOR_MARGIN_TOP,
					w: xe,
					h: this.CURSOR_HEIGHT
				});
				if (cInit != cEnd) {
					firstNoteLine = viewer.vxfNotes[cInit + 1];
				}
			}

			cInit++;
		}
		return areas;
	};

	NoteSpaceManager.prototype.draw = function(viewer) {
		var self = this;
		var ctx = viewer.ctx ;
		viewer.drawElem(function(ctx){
		
			var position = self.cursor.getPos();
			var saveFillColor = ctx.fillStyle;
			ctx.fillStyle = "#0099FF";
			ctx.globalAlpha = 0.2;
			var currentNoteSpace;
			var areas = [];
			if (position[0] === position[1]) {
				areas.push({
					x: self.noteSpace[position[0]].position.x,
					y: self.noteSpace[position[0]].position.y,
					w: self.noteSpace[position[0]].position.w,
					h: self.noteSpace[position[0]].position.h
				});
			} else {
				areas = self.getNotesAreasFromCursor(viewer, position);
			}
			for (i = 0, c = areas.length; i < c; i++) {
				ctx.fillRect(
					areas[i].x,
					areas[i].y,
					areas[i].w,
					areas[i].h
				);
			}
			ctx.fillStyle = saveFillColor;
			ctx.globalAlpha = 1;
		});
	};

	return NoteSpaceManager;
});