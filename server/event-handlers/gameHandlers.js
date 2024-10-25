const { assignRoles } = require('../utils/helpers');

const joinGameHandler = (socket, db, io) => {
	return (user) => {
		db.players.push({ id: socket.id, ...user, points: 0 });
		io.emit('userJoined', db);
	};
};

const startGameHandler = (socket, db, io) => {
  return () => {
    // Preserve existing points
    const existingPoints = db.players.reduce((acc, player) => {
      acc[player.id] = player.points
      return acc
    }, {})

    // Reassign roles but keep points
    db.players = assignRoles(db.players).map(player => ({
      ...player,
      points: existingPoints[player.id] || 0
    }))

    // Emitir actualización de puntos después de reasignar roles
    io.emit('updatePoints', { players: db.players });

    db.players.forEach((element) => {
      io.to(element.id).emit("startGame", element.role)
    })
  }
}

const notifyMarcoHandler = (socket, db, io) => {
	return () => {
		const rolesToNotify = db.players.filter((user) => user.role === 'polo' || user.role === 'polo-especial');

		rolesToNotify.forEach((element) => {
			io.to(element.id).emit('notification', {
				message: 'Marco!!!',
				userId: socket.id,
			});
		});
	};
};

const notifyPoloHandler = (socket, db, io) => {
	return () => {
		const rolesToNotify = db.players.filter((user) => user.role === 'marco');

		rolesToNotify.forEach((element) => {
			io.to(element.id).emit('notification', {
				message: 'Polo!!',
				userId: socket.id,
			});
		});
	};
};

const onSelectPoloHandler = (socket, db, io) => {
  return (userID) => {
    const marco = db.players.find((user) => user.id === socket.id)
    const selectedPolo = db.players.find((user) => user.id === userID)
    const poloEspecial = db.players.find((user) => user.role === "polo-especial")

    let message = ''
    let winner = null

    // Caso 1: Marco selecciona a un Polo Especial
    if (selectedPolo.role === "polo-especial") {
      // Marco gana +50 puntos por atrapar al Polo Especial
      marco.points += 50
      // Polo Especial pierde 10 puntos por ser atrapado
      selectedPolo.points -= 10
      message = `¡${marco.nickname} ha atrapado al Polo Especial ${selectedPolo.nickname}! Marco gana 50 puntos y Polo Especial pierde 10 puntos.`

      if (marco.points >= 100) {
        winner = marco
      }
    }
    // Caso 2: Marco selecciona a un Polo normal
    else {
      // Marco pierde 10 puntos por no atrapar al Polo Especial
      marco.points -= 10
      // Si hay un Polo Especial en el juego, gana 10 puntos por no ser atrapado
      if (poloEspecial) {
        poloEspecial.points += 10
        message = `${marco.nickname} ha seleccionado a ${selectedPolo.nickname} (no es Polo Especial). Marco pierde 10 puntos y ${poloEspecial.nickname} (Polo Especial) gana 10 puntos por no ser atrapado.`

        if (poloEspecial.points >= 100) {
          winner = poloEspecial
        }
      } else {
        message = `${marco.nickname} ha seleccionado a ${selectedPolo.nickname}. Marco pierde 10 puntos por no atrapar al Polo Especial.`
      }
    }

    // Emitir actualización de puntos inmediatamente después de modificarlos
    io.emit('updatePoints', { players: db.players });

    if (winner) {
      message = `¡${winner.nickname} ha ganado el juego con ${winner.points} puntos! 🏆`
    }

    io.emit("notifyGameOver", {
      message: message,
      updatedPlayers: db.players,
      winner: winner
    })
  }
}



module.exports = {
	joinGameHandler,
	startGameHandler,
	notifyMarcoHandler,
	notifyPoloHandler,
	onSelectPoloHandler,
};
