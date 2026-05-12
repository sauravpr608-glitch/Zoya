import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // Real-time Device Bridge Logic
  io.on("connection", (socket) => {
    console.log("Device connected:", socket.id);

    // Join a room based on user identity (Saurav Coder)
    socket.on("join-bridge", (userId) => {
      console.log(`User ${userId} joining bridge room`);
      socket.join(userId);
      // Notify other devices in the room
      socket.to(userId).emit("device-joined", { id: socket.id });
    });

    // Send command to remote device
    socket.on("send-remote-command", ({ userId, command }) => {
      console.log(`Relaying command to ${userId}:`, command);
      socket.to(userId).emit("remote-action", command);
    });

    socket.on("disconnect", () => {
      console.log("Device disconnected:", socket.id);
    });
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", sockets: io.engine.clientsCount });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Zoya Server running on http://localhost:${PORT}`);
  });
}

startServer();
