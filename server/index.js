const app = require("express")();
const cors = require("cors");
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: { origin: "*" },
});
const router = require("./router");
const { addUser, removeUser, getUser, getUsersInRoom } = require("./Users");

const PORT = process.env.PORT || 5000;

io.on("connection", (socket) => {
  console.log("we have a new connection");

  socket.on("join", ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });

    if (error) return callback(error);

    socket.join(user.room);

    socket.emit("message", {
      user: "admin",
      text: `${user.name}, welcome to room ${user.room}.`,
    });
    socket.broadcast
      .to(user.room)
      .emit("message", { user: "admin", text: `${user.name} has joined!` });

    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit("message", { user: user.name, text: message });

    callback();
  });

  socket.on("disconnect", () => {
    console.log("User had left");
  });
});

app.use(cors({ origin: "http://localhost:3000" }));
// app.use(express.json());

app.use(router);

http.listen(PORT, () => {
  console.log(`server listen in PORT ${PORT}`);
});
