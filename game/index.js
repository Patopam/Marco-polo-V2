const socket = io('http://localhost:5050', { path: '/real-time' });

let userName = '';
let myRole = '';
let players = [];

// ------------- SCREENS ----------------
const homeScreen = document.getElementById('home-welcome-screen');
const lobbyScreen = document.getElementById('lobby-screen');
const gameGround = document.getElementById('game-ground');
const gameOverScreen = document.getElementById('game-over');

homeScreen.style.display = 'flex';
lobbyScreen.style.display = 'none';
gameGround.style.display = 'none';
gameOverScreen.style.display = 'none';

// ------------- GENERAL ELEMENTS --------------------
const userNameDisplay = document.getElementById('nickname-display');
const gameUserNameDisplay = document.getElementById('game-nickname-display');

// ------------- WELCOME -SCREEN -------------
const nicknameInput = document.getElementById('nickname');
const joinButton = document.getElementById('join-button');

joinButton.addEventListener('click', joinGame);

async function joinGame() {
	userName = nicknameInput.value;
	socket.emit('joinGame', { nickname: userName });

	homeScreen.style.display = 'none';
	userNameDisplay.innerHTML = userName;
	lobbyScreen.style.display = 'flex';
}

// ------------- LOBBY -SCREEN ---------------
const startButton = document.getElementById('start-button');
const usersCount = document.getElementById('users-count');

startButton.addEventListener('click', startGame);

async function startGame() {
	socket.emit('startGame');
}

// ------------- GAMESCREEN ----------------
let polos = [];

const roleDisplay = document.getElementById('role-display');
const shoutbtn = document.getElementById('shout-button');
const shoutDisplay = document.getElementById('shout-display');
const container = document.getElementById('pool-players');

shoutbtn.style.display = 'none';
shoutbtn.addEventListener('click', shoutBtn);
roleDisplay.style.display = 'none';
shoutDisplay.style.display = 'none';

async function shoutBtn() {
	if (myRole === 'marco') {
		socket.emit('notifyMarco');
	}
	if (myRole === 'polo' || myRole === 'polo-especial') {
		socket.emit('notifyPolo');
	}
	shoutbtn.style.display = 'none';
}

container.addEventListener('click', function (event) {
	if (event.target.tagName === 'BUTTON') {
		const key = event.target.dataset.key;
		socket.emit('onSelectPolo', key);
	}
});

// ------------- GAME OVER ------------------
const gameOverText = document.getElementById('game-result');
const restartButton = document.getElementById('restart-button');

restartButton.addEventListener('click', restartGame);

async function restartGame() {
	socket.emit('startGame');
}

// ------------- POINTS DISPLAY ----------------
function updatePointsDisplay(players) {
	// Actualizar puntos en todas las pantallas
	const pointsContainers = document.querySelectorAll('.points-container');

	pointsContainers.forEach((container) => {
		container.innerHTML = `
      <div class="points-header">
        <h3>Puntuaciones</h3>
        <div class="points-count">Jugadores: ${players.length}</div>
      </div>
    `;

		const pointsList = document.createElement('ul');
		pointsList.className = 'points-list';

		// Ordenar jugadores por puntos (mayor a menor)
		const sortedPlayers = [...players].sort((a, b) => b.points - a.points);

		sortedPlayers.forEach((player) => {
			const playerItem = document.createElement('li');
			playerItem.className = 'player-points';

			// Resaltar el jugador actual
			const isCurrentPlayer = player.nickname === userName;
			if (isCurrentPlayer) {
				playerItem.classList.add('current-player');
			}

			// Añadir corona al líder
			const isLeader = player === sortedPlayers[0] && player.points > 0;
			const leaderIcon = isLeader ? '<span class="crown">👑</span>' : '';

			playerItem.innerHTML = `
        <div class="player-info">
          ${leaderIcon}
          <span class="player-nickname">${player.nickname}</span>
          ${isCurrentPlayer ? '<span class="current-player-indicator">👈</span>' : ''}
        </div>
        <span class="player-score">${player.points} puntos</span>
      `;
			pointsList.appendChild(playerItem);
		});

		container.appendChild(pointsList);
	});
}

// ------------- SOCKET LISTENERS ----------------
socket.on('userJoined', (data) => {
	usersCount.innerHTML = data?.players.length || 0;
	if (data?.players) {
		players = data.players;
		updatePointsDisplay(players);
	}
});

socket.on('updatePoints', (data) => {
	if (data?.players) {
		players = data.players;
		updatePointsDisplay(players);
	}
});

socket.on('startGame', (data) => {
	polos = [];
	container.innerHTML = '';
	gameOverScreen.style.display = 'none';
	shoutDisplay.style.display = 'none';
	lobbyScreen.style.display = 'none';
	gameGround.style.display = 'flex';
	myRole = data;

	roleDisplay.innerHTML = data;
	roleDisplay.style.display = 'block';
	gameUserNameDisplay.innerHTML = userName;
	updatePointsDisplay(players); // Actualizar puntos al iniciar el juego

	shoutbtn.innerHTML = `Gritar ${myRole}`;

	if (myRole === 'marco') {
		shoutbtn.style.display = 'block';
	}
});

socket.on('notification', (data) => {
	if (myRole === 'marco') {
		container.innerHTML = '<p>Haz click sobre el polo que quieres escoger:</p>';
		polos.push(data);
		polos.forEach((elemt) => {
			const button = document.createElement('button');
			button.innerHTML = `Un jugador gritó: ${elemt.message}`;
			button.setAttribute('data-key', elemt.userId);
			container.appendChild(button);
		});
	} else {
		shoutbtn.style.display = 'block';
		shoutDisplay.innerHTML = `Marco ha gritado: ${data.message}`;
		shoutDisplay.style.display = 'block';
	}
});

socket.on('notifyGameOver', (data) => {
	if (data?.players) {
		players = data.players;
	}
	gameGround.style.display = 'none';
	gameOverText.innerHTML = data.message;
	gameOverScreen.style.display = 'flex';
	updatePointsDisplay(players);
});
