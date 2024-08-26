const { io } = require("socket.io-client");

const createClient = (username, roomName) => {
    const socket = io("http://localhost:3000");

    socket.on("connect", () => {
        console.log(`${username} connected with ID: ${socket.id}`);

        // Create or join a room
        if (roomName) {
            if (username === 'Host') {
                socket.emit("create", { user: username, room: roomName });
            } else {
                socket.emit("join", { user: username, room: roomName });
            }
        }
    });

    socket.on("success", ({ room }) => {
        console.log(`${username} successfully joined room ${room}`);
    });

    socket.on("error", ({ message }) => {
        console.log(`${username} error: ${message}`);
    });

    socket.on("roomClosed", ({ message }) => {
        console.log(`${username} received room closed message: ${message}`);
        socket.disconnect();
    });

    socket.on("disconnect", () => {
        console.log(`${username} disconnected`);
    });

    return socket;
};

// Test the server by creating clients and performing actions
const testServer = async () => {
    const hostSocket = createClient('Host', 'TestRoom');
    
    // Wait for a moment to ensure the room is created
    setTimeout(() => {
        const guest1Socket = createClient('Guest1', 'TestRoom');
        const guest2Socket = createClient('Guest2', 'TestRoom');
        const guest3Socket = createClient('Guest3', 'TestRoom');

        // Test closing the room after a while
        setTimeout(() => {
            hostSocket.emit("close", { roomId: hostSocket.id, role: 'host' });
        }, 5000);

    }, 2000);
};

// Run the test
testServer();
