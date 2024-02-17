"use strict";

const BskyRaffles = class {
	constructor(baseUrl) {
		this.baseUrl = baseUrl;
	}

	async drawWinners(postUri, options) {
		return await this._makeCall(`/draw`, `post`, {
			uri: postUri,
			options: options,
		});
	}

	async getDrawing(drawingId) {
		return await this._makeCall(`/drawing/${drawingId}`, `get`);
	}

	async parsePost(postUri) {
		return await this._makeCall(`/parse`, `post`, {
			uri: postUri
		});
	}

	async verifyHandle(handle, password) {
		return await this._makeCall(`/verify`, `post`, {
			handle: handle,
			password: password,
		});
	}

	_buildUrl(endpoint) {
		return `${this.baseUrl}${endpoint}`;
	}

	async _makeCall(endpoint, method, data) {
		return new Promise((res, rej) => {
			jQuery.ajax(this._buildUrl(endpoint), {
				data: data,
				method: method,
				error: (jqXHR, textStatus, errorThrown) => {
					rej(jqXHR.responseJSON || errorThrown || textStatus);
				},
				success: (data) => {
					if (!data) {
						rej(`Unknown`);
						return;
					}
					res(data);
				},
			});
		});
	}
};
