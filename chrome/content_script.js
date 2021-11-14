/* This runs on all "youtube.com/watch" web pages */
console.log("----- [content_script.js] LOADED");

load_button();

var tata_settings = {
	position: "tr",
	duration: 1000,
	progress: false,
	animation: 'slide',
	holding: false
}

function load_button() {
	// Create Screen Shot Button
	var ss_btn = document.createElement("button");
	ss_btn.innerHTML = "Anki";
	ss_btn.className = "btn_save_screenshot ytp-button";
	ss_btn.style.width = "auto";
	ss_btn.style.cssFloat = "left";
	ss_btn.style.marginRight = "10px";
	ss_btn.onclick = send_to_anki;
	document.getElementsByClassName("ytp-right-controls")[0].prepend(ss_btn);

	console.log("Loaded Button");
}

function send_to_anki() {
	console.log("\nSending to ANKI");

	var canvas = document.createElement("canvas");
	var video = document.querySelector("video");
	var ctx = canvas.getContext("2d");

	// Change the size here
	canvas.width = 640;
	canvas.height = 360;

	ctx.drawImage(video, 0, 0, 640, 360);

	var dataURL = canvas.toDataURL("image/png");
	dataURL = dataURL.replace(/^data:image\/(png|jpg);base64,/, "");

	/* making time stamped url */
	var short_url = document.querySelectorAll('[rel="shortlinkUrl"]')[0].href;
	var videoId = document.querySelectorAll('[itemprop="videoId"]')[0].content;
	var current_time = document.querySelector(".video-stream").currentTime.toFixed();
	var youtube_url = short_url + "?t=" + current_time;

	/* screenshot file name */
	const imageFilename = "Youtube2Anki_" + canvas.width + "x" + canvas.height + "-" + videoId + "_" + current_time + ".png";

	var youtube_share_url = "https://youtu.be/" + videoId + "?t=" + current_time; /* https://youtu.be/RksaXQ4C1TA */
	console.log("VIDEOID =", videoId)
	console.log(youtube_share_url)
	console.log(youtube_url)

	console.log("loading user settings")
	chrome.storage.local.get(["ankiDeckNameSel", "ankiNoteNameSel", "ankiFieldScreenshot", "ankiFieldURL", "ankiConnectUrl"],
		({ ankiDeckNameSel, ankiNoteNameSel, ankiFieldScreenshot, ankiFieldURL, ankiConnectUrl }) => {

			console.log("local.get Data:")
			console.log({ ankiDeckNameSel, ankiNoteNameSel, ankiFieldScreenshot, ankiFieldURL, ankiConnectUrl })

			url = ankiConnectUrl || "http://localhost:8765/";
			model = ankiNoteNameSel || "Basic";
			deck = ankiDeckNameSel || "Default";

			var fields = {
				[ankiFieldScreenshot]: '<img src="' + imageFilename + '" />',
				[ankiFieldURL]: "<a href=" + youtube_share_url + ">" + youtube_share_url + "</a>"
			};

			var card_data = {
				"action": "multi",
				"params": {
					"actions": [
						{
							"action": "storeMediaFile",
							"params": {
								"filename": imageFilename,
								"data": dataURL,
							},
						},
						{
							"action": "addNote",
							"params": {
								"note": {
									"modelName": model,
									"deckName": deck,
									"fields": fields,
									"options": {
										"allowDuplicate": false
									},
									"tags": ["Youtube2Anki"],
								},
							},
						},
					],
				},
			};

			console.log("Card Data...")
			console.log(card_data)

			var permission_data = {
				"action": "requestPermission",
				"version": 6,
			};

			console.log("Fetching...")

			fetch(url, {
				method: "POST",
				body: JSON.stringify(permission_data),
			})
				.then((res) => res.json())
				.then((data) => {
					if (data.error !== null) {
						console.log("Permission Failed")
						console.log(data);
						return
					}
					console.log("Permission Granted")
					console.log(data);
					
					fetch(url, {
						method: "POST",
						body: JSON.stringify(card_data),
					})
						.then((res) => res.json())
						.then((data) => {
							console.log("Fetch Return:")
							console.log(data)
							if (data[0].result === null) {
								tata.error('Error', data.error, tata_settings)
								return
							}
							if (data[1].result === null) {
								tata.error('Error', data[1].error, tata_settings)
								return
							}

							/* show sucess message */
							tata.success('Sucess', 'Sucessfully sent to Anki.', tata_settings)
							console.log(data)
						})
						.catch((error) => {
							/* show error message */
							tata.error('Error', error, tata_settings)
							console.log(error)
						})
				}).catch((error) => {
					/* show error message */
					tata.error('Error', error, tata_settings)
					console.log(error)
				});
			console.log("Sent to ANKI complete!\n");
		}
	);
}