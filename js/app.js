"use strict";

const App = class {
	constructor() {
		const urlBase = `http://localhost:3000`;
		this.api = new BskyRaffles(urlBase);
		this.parsedPost = null;
		this.drawingResults = null;
		jQuery(document).ready(() => this.startApp());
	}

	initializeMainPage() {
		this.toggleHidden(this.$formPage, false);
		this.toggleHidden(this.$resultsPage, true);
	}

	initializeDrawingResultsPage(results) {
		this.toggleHidden(this.$formPage, true);
		this.toggleHidden(this.$resultsPage, false);
	}

	async fetchDrawingResult(drawingId) {
		this.showLoading(true);
		try {
			this.drawingResults = await this.api.getDrawing(drawingId);
			this.initializeDrawingResultsPage(drawingResults);
		} catch (err) {
			this.drawingResults = null;
			this.showError(err);
			this.initializeMainPage();
		} finally {
			this.showLoading(false);
		}
	}

	showLoading(loading) {
		this.toggleHidden(this.$loading, !loading);
	}

	showError(err) {
		console.error(err);
		this.toggleHidden(this.$error, false);
	}

	startApp() {
		// Assigning common elements
		this.$loading = jQuery(`.loading`);
		this.$error = jQuery(`.error`);
		this.$formPage = jQuery(`.form-page`);
		this.$resultsPage = jQuery(`.results-page`);
		this.$postUriInput = jQuery(`#post-uri`);
		this.$postUriSubmit = jQuery(`#post-uri-submit`);

		// Setting up event handlers
		this.$postUriInput.keyup(() => this.validatePostUri());

		// Parsing URL query and loading app
		const query = window.location.search.replace(/^\?/, ``).trim();
		if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/ig.exec(query)) {
			this.fetchDrawingResult(query).catch(err => this.showError(err));
			return;
		}

		this.initializeMainPage();
	}

	toggleHidden($el, hidden) {
		if (hidden) {
			$el.addClass(`hidden`);
		} else {
			$el.removeClass(`hidden`);
		}
	}

	validatePostUri() {
		const input = this.$postUriInput.val().trim();
		const pattern = /^https:\/\/(www\.)?bsky.app\/profile\/[^/]+\/post\/[a-z0-9]+$/g;
		if(pattern.exec(input)) {
			this.$postUriSubmit.removeAttr(`disabled`);
		} else {
			this.$postUriSubmit.attr(`disabled`,`disabled`);
		}
	}
};

jQuery(document).ready(() => new App());
