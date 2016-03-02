define(['jquery', 'pubsub'], function($, pubsub) {
	function StructureEditionModel() {
		this.unfolded = false;
		this.selectedSection = undefined;
		this.selectedBar = undefined;
	}

	StructureEditionModel.prototype.setUnfolded = function(value) {
		this.unfolded = !!value;
		$.publish('StructureEditionModel-setUnfolded', this.unfolded);
	};

	StructureEditionModel.prototype.setSelectedBar = function(bar) {
		if (typeof bar === "undefined") {
			throw 'StructureEditionModel - setSelectedBar - bar is not defined';
		}
		this.selectedBar = bar;
		$.publish('StructureEditionModel-setSelectedBar', bar);
	};

	StructureEditionModel.prototype.setSelectedSection = function(section) {
		if (typeof section === "undefined") {
			throw 'StructureEditionModel - setSelectedSection - section is not defined';
		}
		this.selectedSection = section;
		$.publish('StructureEditionModel-setSelectedSection', section);
	};

	StructureEditionModel.prototype.toggleUnfolded = function() {
		var unfolded = !this.unfolded;
		this.setUnfolded(unfolded);
	};

	return StructureEditionModel;
});