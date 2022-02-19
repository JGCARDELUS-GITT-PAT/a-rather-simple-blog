let entries = {};
let activeEntry = null;

const windows = {
	noEntries: "#content-no-entries",
	newEntry: "#content-new-entry",
	entry: "#content-entry",
};

const hideContentWindows = () => {
	const contentWindows = $(".content-window");

	for (let contentWindow of contentWindows) {
		if (!$(contentWindow).hasClass("hidden")) {
			$(contentWindow).addClass("hidden");
		}
	}
};

const showContentWindow = (window) => {
	// Ensure they are all hidden
	hideContentWindows();

	// Show
	const contentWindow = $(window);
	if (contentWindow.hasClass("hidden")) {
		contentWindow.removeClass("hidden");
	}
};

const showEntry = (key) => {
	const entry = entries[key];
	if (entry != undefined) {
		$("#entry-title").html(entry.title);
		$("#entry-author").html(entry.author);
		$("#entry-content").html(entry.content);
	}

	resetDeleteConfirmation();
	showContentWindow(windows.entry);
	setNavbarItemActive(key);

	activeEntry = key;
};

const setNavbarItemActive = (key) => {
	const id = `#navbar-item-${key}`;
	const navbarItems = $(".list-group-item");

	for (let navbarItem of navbarItems) {
		if ($(navbarItem).hasClass("active")) {
			$(navbarItem).removeClass("active");
		}
	}

	$(id).addClass("active");
};

const addNavbarEntriesItem = (key, entry) => {
	const id = `navbar-item-${key}`;
	const htmlItem = `
		<button class="list-group-item list-group-item-action" id="${id}">
			${entry.title}
		</button>
	`;

	$("#navbar-entries").append(htmlItem);
	$("#" + id).on("click", () => {
		showEntry(key);
	});
};

const addEntry = (key, entry) => {
	// Save entry
	entries[key] = entry;
	// Add to navbar, for navigation
	addNavbarEntriesItem(key, entry);
};

const getEntries = async () => {
	let request = await fetch(
		"https://blog-a05e0-default-rtdb.europe-west1.firebasedatabase.app/.json"
	);

	if (request.ok) {
		// Save new entries
		const requestData = await request.json();
		const requestDataKeys = Object.keys(requestData);
		if (requestDataKeys.length > 0) {
			requestDataKeys.forEach((key) => {
				addEntry(key, requestData[key]);
			});

			// On loading, show first entry
			showEntry(requestDataKeys[0]);
		} else {
			// There is no content, show
			showContentWindow(windows.noEntries);
		}
	}
};

const hideNewEntryAlerts = () => {
	const newEntryAlerts = $(".new-entry-alert");
	for (let newEntryAlert of newEntryAlerts) {
		if (!$(newEntryAlert).hasClass("hidden")) {
			$(newEntryAlert).addClass("hidden");
		}
	}
};

const showNewEntrySuccessAlert = (message) => {
	hideNewEntryAlerts();
	$("#content-success-alert").html(message);
	$("#content-success-alert").removeClass("hidden");
};

const showNewEntryErrorAlert = (message) => {
	hideNewEntryAlerts();
	$("#content-error-alert").html(message);
	$("#content-error-alert").removeClass("hidden");
};

const showNewEntry = () => {
	hideNewEntryAlerts();

	$("#new-entry-title").val("");
	$("#new-entry-author").val("");
	$("#new-entry-content").val("");

	showContentWindow(windows.newEntry);
};

const isNewEntryValid = (title, author, content) => {
	if (title.trim() === "") {
		showNewEntryErrorAlert("Tienes que poner un título");
		return false;
	}
	if (author.trim() === "") {
		showNewEntryErrorAlert(
			"No seas tan humilde. Firma esta obre de arte :)"
		);
		return false;
	}
	if (content.trim() === "") {
		showNewEntryErrorAlert(
			"No sería una entrada de blog sin su contenido. Escribe algo."
		);
		return false;
	}

	return true;
};

const postNewEntry = async () => {
	const title = $("#new-entry-title").val();
	const author = $("#new-entry-author").val();
	const content = $("#new-entry-content").val();

	if (isNewEntryValid(title, author, content)) {
		let request = await fetch(
			"https://blog-a05e0-default-rtdb.europe-west1.firebasedatabase.app/.json",
			{
				method: "POST",
				body: JSON.stringify({
					title,
					author,
					content,
				}),
				dataType: "json",
			}
		);

		if (request.status === 200) {
			showNewEntrySuccessAlert("Se ha guardado tu obra de arte :)");

			const requestData = await request.json();
			const key = requestData.name;
			addEntry(key, { title, author, content });
			// Show alert for 3 seconds before switching to it
			setTimeout(() => {
				showEntry(key);
			}, 2000);
		} else {
			showNewEntryErrorAlert("Algo ha ido mal. Inténtalo más tarde. :(");
		}
	}
};

const resetDeleteConfirmation = () => {
	const deleteRequestContainer = $("#entry-delete-request-container");
	const deleteConfirmContainer = $("#entry-delete-container");

	if (!deleteConfirmContainer.hasClass("hidden")) {
		deleteConfirmContainer.addClass("hidden");
	}

	if (deleteRequestContainer.hasClass("hidden")) {
		deleteRequestContainer.removeClass("hidden");
	}
};

const showDeleteConfirmation = () => {
	const deleteRequestContainer = $("#entry-delete-request-container");
	const deleteConfirmContainer = $("#entry-delete-container");

	if (!deleteRequestContainer.hasClass("hidden")) {
		deleteRequestContainer.addClass("hidden");
	}

	if (deleteConfirmContainer.hasClass("hidden")) {
		deleteConfirmContainer.removeClass("hidden");
	}
};

const deleteEntry = async (key) => {
	// An entry can only be delete if it's being displayed
	let request = await fetch(
		`https://blog-a05e0-default-rtdb.europe-west1.firebasedatabase.app/${key}.json`,
		{
			method: "DELETE",
		}
	);

	if (request.ok) {
		// Delete from saved data
		delete entries[key];

		// Delete from navbar items
		const id = `#navbar-item-${key}`;
		$(id).remove();

		if (Object.keys(entries).length > 0) {
			showEntry(Object.keys(entries)[0]);
		} else {
			showContentWindow(windows.noEntries);
		}
	}
};

// DOM Events
$("#no-entries-new-entry").on("click", () => {
	showNewEntry();
});

$("#navbar-new-entry").on("click", () => {
	showNewEntry();
});

$("#new-entry-post").on("click", () => {
	postNewEntry();
});

$("#entry-delete-request").on("click", () => {
	showDeleteConfirmation();
});

$("#entry-delete-cancel").on("click", () => {
	resetDeleteConfirmation();
});

$("#entry-delete-confirm").on("click", () => {
	deleteEntry(activeEntry);
});

// Load all entries on startup
$(document).ready(() => {
	getEntries();
});
