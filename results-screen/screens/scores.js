import { router, socket } from '../routes.js';

export default function renderScreen1() {
	const app = document.getElementById('app');

	app.innerHTML = `
        <div class="game-container">
            <h1 class="game-title">Game Results</h1>
            <div class="controls">
                <button id="sortAlpha" class="sort-button">Sort by Name</button>
                <button id="sortScore" class="sort-button">Sort by Score</button>
            </div>
            <div id="winner-announcement" class="winner-container"></div>
            <ul id="scores-list" class="scores-list">
                <li class="score-item">No hay jugadores conectados</li>
            </ul>
        </div>
    `;

	let players = [];

	const handleGameOver = (data) => {
		console.log('Received notifyGameOver event:', data);
		players = data.updatedPlayers;
		updateWinnerAnnouncement(players);
		renderPlayersList(players);
	};

	const handleUserJoined = (data) => {
		console.log('Received userJoined event:', data);
		if (data?.players) {
			players = data.players;
			renderPlayersList(players);
		}
	};

	const handleUpdatePoints = (data) => {
		console.log('Received updatePoints event:', data);
		if (data?.players) {
			players = data.players;
			renderPlayersList(players);
		}
	};

	const updateWinnerAnnouncement = (players) => {
		const winnerAnnouncement = document.getElementById('winner-announcement');
		const winner = players.find((player) => player.points >= 100);

		if (winner) {
			winnerAnnouncement.innerHTML = `
                <div class="winner-message">
                    <h2>¡Felicidades ${winner.nickname}!</h2>
                    <p>🎉 ¡Has ganado el juego! 🏆</p>
                </div>
            `;
		} else {
			winnerAnnouncement.innerHTML = '';
		}
	};

	const handleSortByName = () => {
		players.sort((a, b) => a.nickname.localeCompare(b.nickname));
		renderPlayersList(players);
	};

	const handleSortByScore = () => {
		players.sort((a, b) => b.points - a.points);
		renderPlayersList(players);
	};

	function renderPlayersList(players) {
		const scoresList = document.getElementById('scores-list');

		if (!players || players.length === 0) {
			scoresList.innerHTML = `
                <li class="score-item">No hay jugadores conectados</li>
            `;
			return;
		}

		scoresList.innerHTML = players
			.map((player, index) => {
				const isLeader = index === 0 && player.points > 0;
				const crown = isLeader ? '<span class="crown">👑</span>' : '';

				return `
                    <li class="score-item">
                        ${crown}
                        <span class="player-name">${player.nickname}</span>:
                        <span class="player-points">${player.points} points</span>
                    </li>
                `;
			})
			.join('');
	}

	// Event Listeners para el socket
	socket.on('notifyGameOver', handleGameOver);
	socket.on('userJoined', handleUserJoined);
	socket.on('updatePoints', handleUpdatePoints);

	// Event Listeners para los botones
	document.getElementById('sortAlpha').addEventListener('click', handleSortByName);
	document.getElementById('sortScore').addEventListener('click', handleSortByScore);

	// Función de limpieza para remover event listeners cuando se desmonte el componente
	return () => {
		socket.off('notifyGameOver', handleGameOver);
		socket.off('userJoined', handleUserJoined);
		socket.off('updatePoints', handleUpdatePoints);

		document.getElementById('sortAlpha')?.removeEventListener('click', handleSortByName);
		document.getElementById('sortScore')?.removeEventListener('click', handleSortByScore);
	};
}
