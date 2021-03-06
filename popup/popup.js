
var fetchOptions = function (selectId, url, action, params = {}) {
	var selectEl = document.getElementById(selectId);

	return new Promise((resolve, reject) => {
		chrome.storage.local.get(selectId, (stored) => {
			var storedVal = stored[selectId] || 'Basic';
			fetch(url, { method: "POST", body: JSON.stringify({ "action": action, "params": params }) }).then(r => r.json()).then(data => {
				data.forEach((item) => {
					e = document.createElement("option");
					e.value = item;
					e.text = item;
					if (item === storedVal) e.selected = true;
					selectEl.appendChild(e);
				})
				if (action === "modelFieldNames") {
					e = document.createElement("option");
					e.value = " ";
					e.text = " ";
					if (storedVal === " ") e.selected = true;
					selectEl.add(e);
				}

			}).then(r => resolve(r)).catch(e => reject(e));
		});
	});
}

var saveOption = function (selectId) {
	var selectEl = document.getElementById(selectId);
	console.log({[selectId]: selectEl.value})
	return chrome.storage.local.set({ [selectId]: selectEl.value })
}

document.addEventListener("DOMContentLoaded", function () {
	var urlEl = document.getElementById('ankiConnectUrl');
	var model_Name = document.getElementById('ankiNoteNameSel');
	var submit_button = document.getElementById('saveAnkiBtn');

	chrome.storage.local.get('ankiConnectUrl', ({ ankiConnectUrl }) => {
		var url = ankiConnectUrl || 'http://localhost:8765';
		urlEl.classList.add('focused');
		urlEl.value = url;

		Promise.all([
			/* Get All Deck names and all Note Types */
			fetchOptions('ankiDeckNameSel', url, 'deckNames'),
			fetchOptions('ankiNoteNameSel', url, 'modelNames') /* note type */
		]).then(() => {
			/* Then we get all the Field's for the selected Note type */
			/*      dont change 'modelFieldNames' - this is for ankiconnect */
			fetchOptions('ankiFieldScreenshot', url, 'modelFieldNames', { "modelName": model_Name.value })
			fetchOptions('ankiFieldURL', url, 'modelFieldNames', { "modelName": model_Name.value })

			model_Name.addEventListener("change", function () {
				console.log("-- CHANGE")
				var array = ["ankiFieldScreenshot", "ankiFieldURL"];
				array.forEach((item) => {
					document.getElementById(item).length = 0;
					fetchOptions(item, url, 'modelFieldNames', { "modelName": model_Name.value });
				})
			});

			submit_button.addEventListener('click', (e) => {
				console.log("-- CLICK")
				Promise.all([
					saveOption('ankiDeckNameSel'),
					saveOption('ankiNoteNameSel'),

					saveOption('ankiFieldScreenshot'),
					saveOption('ankiFieldURL'),

					saveOption('ankiConnectUrl')
				])
					.then(() => alert(`Options saved!`))
					.catch(error => alert(`Cannot save options: ${error}`))
			});
		}).catch(error => alert(`Cannot fetch options via AnkiConnect: ${error}`))
	})
})