const express = require("express");
const scrapeRouter = require("./routers/scrape");
const socketio = require("socket.io");

const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002", // add more origins
  ],
  methods: "*",
};

app.use(cors());

app.use(express.json());
app.use(scrapeRouter);

const server = app.listen(port, () => {
  console.log("Server is up on the port " + port);
});

const io = socketio(server, { cors: corsOptions });
const connectedClients = new Map();

io.on("connection", (socket) => {
  console.log("New Websocket connnection! SocketId:", socket.id);
  const socketId = socket.id;
  connectedClients.set(socketId, socket);

  socket.emit("socketId", { socketId: socket.id });

  socket.on("connected", (res) => {
    console.log(res);
    console.log("\nOnline Clients: ", connectedClients.keys());
  });

  socket.on("disconnect", () => {
    connectedClients.delete(socketId);
    console.log("\nClient disconnected!, SocketID:", socketId);
    console.log("\nOnline Clients: ", connectedClients.keys());
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

module.exports.connectedClients = connectedClients;
