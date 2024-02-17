"use strict";

const App = class {
	constructor() {
		const urlBase = `http://localhost:3000`;
		this.api = new BskyRaffles(urlBase);
		jQuery(document).ready(() => this.startApp());
	}

	startApp() {
		
	}
};

jQuery(document).ready(() => new App());
