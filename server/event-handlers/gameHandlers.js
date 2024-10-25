
const { assignRoles } = require("../utils/helpers")

const joinGameHandler = (socket, db, io) => {
  return (user) => {
    db.players.push({ id: socket.id, ...user, points: 0 })
    io.emit("userJoined", db)
  }
}

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

    db.players.forEach((element) => {
      io.to(element.id).emit("startGame", element.role)
    })
  }
}

const notifyMarcoHandler = (socket, db, io) => {
  return () => {
    const rolesToNotify = db.players.filter(
      (user) => user.role === "polo" || user.role === "polo-especial"
    )

    rolesToNotify.forEach((element) => {
      io.to(element.id).emit("notification", {
        message: "Marco!!!",
        userId: socket.id,
      })
    })
  }
}

const notifyPoloHandler = (socket, db, io) => {
  return () => {
    const rolesToNotify = db.players.filter((user) => user.role === "marco")

    rolesToNotify.forEach((element) => {
      io.to(element.id).emit("notification", {
        message: "Polo!!",
        userId: socket.id,
      })
    })
  }
}

const onSelectPoloHandler = (socket, db, io) => {
  return (userID) => {
    const myUser = db.players.find((user) => user.id === socket.id)
    const poloSelected = db.players.find((user) => user.id === userID)
    const poloEspecial = db.players.find((user) => user.role === "polo-especial")

    let message = ''
    let winner = null

    if (poloSelected.role !== "polo-especial") {
      if (poloEspecial) {
        poloEspecial.points += 10
        message = `El marco ${myUser.nickname} ha seleccionado a ${poloSelected.nickname}. ${poloEspecial.nickname} (polo especial) ha ganado 10 puntos!`

        if (poloEspecial.points >= 100) {
          winner = poloEspecial
        }
      } else {
        myUser.points += 10
        message = `El marco ${myUser.nickname} ha ganado 10 puntos! ${poloSelected.nickname} ha sido capturado`

        if (myUser.points >= 100) {
          winner = myUser
        }
      }
    } else {
      db.players.forEach(player => {
        if (player.id !== poloSelected.id) {
          player.points += 10
          if (player.points >= 100) {
            winner = player
          }
        }
      })
      message = `El marco ${myUser.nickname} ha seleccionado al polo especial ${poloSelected.nickname}. ¡Todos los demás jugadores han ganado 10 puntos!`
    }

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
}
