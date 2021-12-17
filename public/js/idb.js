let db;

const request = indexedDB.open('budget', 1);

request.onupgradeneeded = function (event) {
	db = event.target.result;
	db.createObjectStore('transaction', {
		autoIncrement: true,
	});
};

request.onerror = function (event) {
	console.log(event.target.errorCode);
};

request.onsuccess = function (event) {
	db = event.target.result;

	if (navigator.onLine) {
		uploadBudget();
	}
};

function saveRecord(record) {
	const transaction = db.transaction('transaction', 'readwrite');

	const store = transaction.objectStore('transaction');

	store.add(record);
}

function uploadBudget() {
	const transaction = db.transaction('transaction', 'readwrite');

	const store = transaction.objectStore('transaction');

	const getAll = transaction.getAll();

	getAll.onsuccess = function () {
		if (getAll.result.length > 0) {
			fetch('/api/transaction/bulk', {
				method: 'POST',
				body: JSON.stringify(getAll.result),
				headers: {
					Accept: 'application/json, text/plain, */*',
					'Content-Type': 'application/json',
				},
			})
				.then((response) => response.json())
				.then((serverResponse) => {
					if (serverResponse.message) {
						throw new Error(serverResponse);
					}

					const transaction = db.transaction('transaction', 'readwrite');
					const store = transaction.objectStore('transaction');

					store.clear();
				})
				.catch((err) => {
					console.log(err);
				});
		}
	};
}

window.addEventListener('online', uploadBudget);
