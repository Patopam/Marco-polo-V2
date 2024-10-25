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
            <ul id="scores-list" class="scores-list"></ul>
        </div>
    `;

	let players = [];

	const handleGameOver = (data) => {
		console.log('Received notifyGameOver event:', data);
		players = data.updatedPlayers;
		updateWinnerAnnouncement(players);
		renderPlayersList(players);
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

	// Event Listeners
	socket.on('notifyGameOver', handleGameOver);
	document.getElementById('sortAlpha').addEventListener('click', handleSortByName);
	document.getElementById('sortScore').addEventListener('click', handleSortByScore);
}

function renderPlayersList(players) {
	const scoresList = document.getElementById('scores-list');
	scoresList.innerHTML = players
		.map(
			(player) => `
            <li class="score-item">
                <span class="player-name">${player.nickname}</span>:
                <span class="player-points">${player.points} points</span>
            </li>
        `
		)
		.join('');
}
