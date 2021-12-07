(function ()
{
	/* This runs on all "youtube.com/watch" web pages */
	console.log("----- [content_script.js] LOADED");

	const notification_toast_time = 3000;

	function load_button()
	{
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

	function send_to_anki()
	{
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
			({ ankiDeckNameSel, ankiNoteNameSel, ankiFieldScreenshot, ankiFieldURL, ankiConnectUrl }) =>
			{

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
					.then((data) =>
					{
						if (data.error !== null)
						{
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
							.then((data) =>
							{
								console.log("Fetch Return:")
								console.log(data)
								if (data.result === null)
								{
									// https://jsfiddle.net/2qasgcfd/3/
									// https://github.com/apvarun/toastify-js
									Toastify({
										text: "Error! " + data,
										duration: notification_toast_time,
										style: {
											background: "red",
										}
									}).showToast();
									return
								}
								else
								{
									/* show sucess message */
									Toastify({
										text: "Sucessfully added to ANKI",
										duration: notification_toast_time,
										style: {
											background: "light blue",
										}
									}).showToast();
								}
							})
							.catch((error) =>
							{
								/* show error message */
								Toastify({
									text: "Error! " + error,
									duration: notification_toast_time,
									style: {
										background: "red",
									}
								}).showToast();
							})
					}).catch((error) =>
					{
						/* show error message */
						Toastify({
							text: "Error! " + error,
							duration: notification_toast_time,
							style: {
								background: "red",
							}
						}).showToast();
						console.log(error)
					});
				console.log("Send to ANKI complete!\n");
			}
		);
	}

	load_button();
})();
