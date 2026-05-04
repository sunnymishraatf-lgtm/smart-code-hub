const { v4: uuidv4 } = require('uuid');

// Store room data in memory (use Redis in production)
const rooms = new Map();

const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join or create room
    socket.on('join-room', (roomId, userData) => {
      // Create room if doesn't exist
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          id: roomId,
          users: new Map(),
          code: '// Welcome to Smart Code Hub!\n// Start coding here...',
          canvas: [],
          messages: [],
          createdAt: new Date()
        });
      }

      const room = rooms.get(roomId);

      // Add user to room
      const user = {
        id: socket.id,
        name: userData.name || `User ${Math.floor(Math.random() * 1000)}`,
        color: userData.color || getRandomColor(),
        joinedAt: new Date()
      };

      room.users.set(socket.id, user);
      socket.join(roomId);
      socket.roomId = roomId;

      // Send current room state to new user
      socket.emit('room-state', {
        code: room.code,
        canvas: room.canvas,
        messages: room.messages,
        users: Array.from(room.users.values()),
        roomId
      });

      // Notify others about new user
      socket.to(roomId).emit('user-joined', {
        user,
        users: Array.from(room.users.values()),
        message: `${user.name} joined the room`
      });

      console.log(`👤 ${user.name} joined room ${roomId}`);
    });

    // Code editor changes
    socket.on('code-change', (data) => {
      const roomId = socket.roomId;
      if (!roomId || !rooms.has(roomId)) return;

      const room = rooms.get(roomId);
      room.code = data.code;

      // Broadcast to others in room (excluding sender)
      socket.to(roomId).emit('code-update', {
        code: data.code,
        userId: socket.id,
        cursorPosition: data.cursorPosition
      });
    });

    // Canvas drawing
    socket.on('canvas-draw', (data) => {
      const roomId = socket.roomId;
      if (!roomId || !rooms.has(roomId)) return;

      const room = rooms.get(roomId);
      room.canvas.push(data);

      // Limit canvas history to prevent memory issues
      if (room.canvas.length > 10000) {
        room.canvas = room.canvas.slice(-5000);
      }

      socket.to(roomId).emit('canvas-update', data);
    });

    // Canvas clear
    socket.on('canvas-clear', () => {
      const roomId = socket.roomId;
      if (!roomId || !rooms.has(roomId)) return;

      const room = rooms.get(roomId);
      room.canvas = [];

      io.to(roomId).emit('canvas-cleared');
    });

    // Chat message
    socket.on('chat-message', (data) => {
      const roomId = socket.roomId;
      if (!roomId || !rooms.has(roomId)) return;

      const room = rooms.get(roomId);
      const user = room.users.get(socket.id);

      const message = {
        id: uuidv4(),
        text: data.text,
        user: user ? user.name : 'Anonymous',
        userId: socket.id,
        userColor: user ? user.color : '#6366f1',
        timestamp: new Date().toISOString()
      };

      room.messages.push(message);

      // Limit message history
      if (room.messages.length > 1000) {
        room.messages = room.messages.slice(-500);
      }

      io.to(roomId).emit('new-message', message);
    });

    // Cursor position tracking
    socket.on('cursor-move', (data) => {
      const roomId = socket.roomId;
      if (!roomId) return;

      socket.to(roomId).emit('cursor-update', {
        userId: socket.id,
        position: data.position,
        selection: data.selection
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const roomId = socket.roomId;
      if (roomId && rooms.has(roomId)) {
        const room = rooms.get(roomId);
        const user = room.users.get(socket.id);

        room.users.delete(socket.id);

        // Notify others
        socket.to(roomId).emit('user-left', {
          userId: socket.id,
          users: Array.from(room.users.values()),
          message: user ? `${user.name} left the room` : 'A user left'
        });

        // Clean up empty rooms after 1 hour
        if (room.users.size === 0) {
          setTimeout(() => {
            if (rooms.has(roomId) && rooms.get(roomId).users.size === 0) {
              rooms.delete(roomId);
              console.log(`🗑️ Room ${roomId} cleaned up`);
            }
          }, 3600000); // 1 hour
        }
      }

      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });
};

// Helper function
const getRandomColor = () => {
  const colors = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
    '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef',
    '#f43f5e', '#78716c'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

module.exports = { setupSocketHandlers, rooms };
