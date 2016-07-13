define([
	'modules/Unfold/src/PointLabel'
	], function(PointLabel) {

	var EndLabel = PointLabel.create();

	EndLabel.TOCODA = "Coda";
	EndLabel.TOCODA2 = "Coda2";
	EndLabel.FINE = "Fine";
	EndLabel.END = "End";
	
	/*EndLabel.TOCODA = {
		name: 'coda',
		string: "Coda"
	};
	EndLabel.TOCODA2 = {
		name: 'coda2',
		string: "Coda2"
	};
	EndLabel.FINE = {
		name: 'fine',
		string: "Fine"
	};
	EndLabel.END = {
		name: 'end',
		string: "End"
	};*/

	EndLabel.TOCODAS.push(EndLabel.TOCODA);
	EndLabel.TOCODAS.push(EndLabel.TOCODA2);
	EndLabel.addSoloLabel(EndLabel.FINE, 'end');
	
	EndLabel.fromString = function(name){
		switch (name.toLowerCase()) {
			case "coda": return EndLabel.TOCODA;
			case "coda2": return EndLabel.TOCODA2;
			case "fine": return EndLabel.FINE;
			case "end": return EndLabel.END;
			default: return null;
		}
	};


	return EndLabel;
});