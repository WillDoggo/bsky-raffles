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
		this.toggleHidden(this.$optionsPage, true);
		this.toggleHidden(this.$resultsPage, true);
	}

	initializeOptionsPage() {
		this.toggleHidden(this.$formPage, true);
		this.toggleHidden(this.$optionsPage, false);
		this.toggleHidden(this.$resultsPage, true);

		this.$originalPost.find(`.profile-icon`).attr(`src`, this.parsedPost.post.author.avatar);
		this.$originalPost.find(`.profile-name`).text(this.parsedPost.post.author.displayName);
		this.$originalPost.find(`.profile-handle`).text(`@${this.parsedPost.post.author.handle}`);
		this.$originalPost.find(`.post-body`).html(this.encodeHtml(this.parsedPost.post.record.text).replaceAll(`\n`, `<br>`));
	}

	initializeDrawingResultsPage() {
		this.toggleHidden(this.$formPage, true);
		this.toggleHidden(this.$optionsPage, true);
		this.toggleHidden(this.$resultsPage, false);
	}

	encodeHtml(rawStr) {
		return rawStr.replace(/[\u00A0-\u9999<>\&]/g, (i) => `&#${i.charCodeAt(0)};`);
	}

	async fetchDrawingResult(drawingId) {
		this.showLoading(true);
		try {
			this.drawingResults = await this.api.getDrawing(drawingId);
			this.initializeDrawingResultsPage();
		} catch (err) {
			this.drawingResults = null;
			this.showError(err);
			this.initializeMainPage();
		} finally {
			this.showLoading(false);
		}
	}

	async optionsFormSubmitted(e) {
		e.preventDefault();
		this.showLoading(true);

		const options = {
			winnerCount: parseInt(this.$optionNumWinners.val()),
		};
		if (this.$optionRequireFollowing[0].checked) options[`requireFollow`] = true;
		if (this.$optionRequireReposted[0].checked) options[`requireRepost`] = true;
		if (this.$optionRequireLiked[0].checked) options[`requireLike`] = true;
		if (this.$optionRequireReplies[0].checked) options[`requireReply`] = true;
		if (this.$optionRequireImageReplies[0].checked) options[`requireReplyImage`] = true;
		if (this.$optionAppPassword.val().length > 0) options[`password`] = this.$optionAppPassword.val();

		try {
			const drawingResult = await this.api.drawWinners(this.postUri, options);
			if (!drawingResult || !drawingResult.drawingId) {
				throw new Error(`Failed to make raffle drawing due to an unknown error`);
			}
			window.location.href = `${window.location.origin}${window.location.pathname}?${drawingResult.drawingId}`;
		} catch (err) {
			this.showError(err);
			this.showLoading(false);
		}
	}

	async postUriFormSubmitted(e) {
		e.preventDefault();
		this.showLoading(true);
		const postUri = this.$postUriInput.val().trim();

		try {
			this.parsedPost = await this.api.parsePost(postUri);
			this.postUri = postUri;
			this.initializeOptionsPage();
		} catch (err) {
			this.parsedPost = null;
			this.showError(err);
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
		this.$optionsPage = jQuery(`.options-page`);
		this.$resultsPage = jQuery(`.results-page`);
		this.$postUriInput = jQuery(`#post-uri`);
		this.$postUriSubmit = jQuery(`#post-uri-submit`);
		this.$postUriForm = jQuery(`#post-uri-form`);

		this.$optionsForm = jQuery(`#options-form`);
		this.$originalPost = jQuery(`#original-post`);
		this.$optionRequireFollowing = jQuery(`#require-following`);
		this.$optionRequireReposted = jQuery(`#require-reposted`);
		this.$optionRequireLiked = jQuery(`#require-liked`);
		this.$optionRequireReplies = jQuery(`#require-replies`);
		this.$optionRequireImageReplies = jQuery(`#require-image-replies`);
		this.$optionNumWinners = jQuery(`#num-winners`);
		this.$optionAppPassword = jQuery(`#app-password`);
		this.$drawButton = jQuery(`#draw-btn`);

		// Setting up event handlers
		this.$postUriInput.keyup(() => this.validatePostUri());
		this.$postUriForm.submit(e => this.postUriFormSubmitted(e).catch(err => this.showError(err)));
		this.$optionRequireReplies.on(`change`, undefined, e => {
			if (e.target.checked) {
				this.$optionRequireImageReplies.removeAttr(`disabled`);
			} else {
				this.$optionRequireImageReplies.attr(`disabled`, `disabled`);
				this.$optionRequireImageReplies.removeAttr(`checked`);
			}
		});
		this.$optionNumWinners.keyup(() => this.validateOptionsForm());
		this.$optionNumWinners.on(`input`, () => this.validateOptionsForm());
		this.$optionAppPassword.keyup(() => this.validateOptionsForm());
		this.$optionsForm.submit(e => this.optionsFormSubmitted(e).catch(err => this.showError(err)));

		// Parsing URL query and loading app
		const query = window.location.search.replace(/^\?/, ``).trim();
		if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/ig.exec(query)) {
			this.fetchDrawingResult(query).catch(err => this.showError(err));
			return;
		}

		this.initializeMainPage();
		this.$postUriInput.focus();
	}

	toggleHidden($el, hidden) {
		if (hidden) {
			$el.addClass(`hidden`);
		} else {
			$el.removeClass(`hidden`);
		}
	}

	validateOptionsForm() {
		let valid = true;
		const numWinnersText = this.$optionNumWinners.val();
		const numWinners = parseInt(this.$optionNumWinners.val());
		if (!/^[0-9]+$/g.exec(numWinnersText) || isNaN(numWinners) || numWinners < 1) {
			valid = false;
		}
		const appPassword = this.$optionAppPassword.val();
		if (appPassword.length > 0 && !/^[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/g.exec(appPassword)) {
			valid = false;
		}

		if (valid) {
			this.$drawButton.removeAttr(`disabled`);
		} else {
			this.$drawButton.attr(`disabled`, `disabled`);
			return;
		}

		this.$drawButton.text(`Draw Winner${(numWinners == 1 ? `` : `s`)} 🎉`);
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
