/* This runs on all "youtube.com/watch" web pages */
console.log("----- [content_script.js] LOADED");

load_button();

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
	chrome.storage.local.get(["ankiDeckNameSel", "ankiModelNameSel", "ankiFieldScreenshot", "ankiFieldURL",],
		({ ankiDeckNameSel, ankiModelNameSel, ankiFieldScreenshot, ankiFieldURL, ankiConnectUrl, }) => {

			url = ankiConnectUrl || "http://localhost:8765/";
			model = ankiModelNameSel || "Basic";
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
									"tags": ["Youtube2Anki"],
								},
							},
						},
					],
				},
			};

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
					console.log("Permission Granted")
					console.log(data);

					fetch(url, {
						method: "POST",
						body: JSON.stringify(card_data),
					})
						.then((res) => res.json())
						.then((data) => {
							console.log("Fetch Return:")
							if (data.result === null) {
								alert("Error!\n" + data.error)
							}
							console.log("Sucess")
						})
						.catch((error) => console.log(error));
				});
			console.log("Sent to ANKI complete!\n");	
		}
	);
}