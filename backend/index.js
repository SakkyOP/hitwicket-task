const { Server } = require("socket.io");
const {v7: uuidv7} = require('uuid');

const io = new Server();

const clients = [];
const clientIds = {};

const rooms = {}; 
const roomIds = {};

const deleteRoom = (roomId) => {
    if (rooms[roomId]) {
        // Notify all participants in the room that the room is being closed
        rooms[roomId].participants.forEach((participantId) => {
            const socket = io.sockets.sockets.get(participantId);
            if (socket) {
                socket.emit("roomClosed", { message: "The room has been closed by the host." });
                socket.disconnect(0);
            }
        });

        // Remove room data
        const roomName = rooms[roomId].name;
        delete roomIds[roomName];
        delete rooms[roomId];
    }
};

const leaveRoom = (socketId) => {
    const user = clientIds[socketId];
    if (user) {
        // Remove user from clients array
        const clientIndex = clients.indexOf(socketId);
        if (clientIndex !== -1) {
            clients.splice(clientIndex, 1);
        }

        // Remove user from the room's participant list
        for (const roomId in rooms) {
            const participantIndex = rooms[roomId].participants.indexOf(user);
            if (participantIndex !== -1) {
                rooms[roomId].participants.splice(participantIndex, 1);

                // If the room is empty after the user leaves, delete the room
                if (rooms[roomId].participants.length === 0) {
                    deleteRoom(roomId);
                }
                break;
            }
        }

        // Clean up client IDs mapping
        delete clientIds[socketId];
    }
};

io.on("connection", (socket) => {
    console.log("New Connection!");

    // user: Name of the user, room: Room name / special code
    socket.on("create", ({user, room})=>{
        if (Object.values(rooms).some(r => r.name === room)) {
            socket.emit("error", { message: "Room Already Exists!" });
            return;
        }

        if (Object.values(clientIds).includes(user)) {
            socket.emit("error", { message: "User Already Exists!" });
            return;
        }

        clients.push(socket.id);
        clientIds[socket.id] = user;

        const idx = uuidv7();
        rooms[idx] = {name: room, participants: [clientIds[socket.id]]};

        roomIds[room] = idx;

        socket.emit("success", {room: idx});
    });

    // user: Name of the user, room: Room name / special code
    socket.on("join", ({user, room})=>{
        if (Object.values(clientIds).includes(user)) {
            socket.emit("error", { message: "User Already Exists!" });
            return;
        }

        const idx = roomIds[room];
        if (!idx || !rooms[idx]) {
            socket.emit("error", { message: "Room Does Not Exist!" });
            return;
        }

        if (rooms[idx].participants.length >= 2) {
            socket.emit("error", { message: "Room is Full!" });
            return;
        }

        clients.push(socket.id);
        clientIds[socket.id] = user;
        
        rooms[idx].participants.push(clientIds[socket.id]);

        socket.emit("success", {room: idx});
    });



    // user: Name of the user, roomId: Room id, role: host / guest
    socket.on("close", ({roomId, role})=>{
        if (role === "host") {
            deleteRoom(roomId);
            socket.disconnect(0);
        }
        leaveRoom(socket.id);
        socket.disconnect(0);
    })

    
});

// Later add authentication based on client ids ( host / guest auth ).
// 1. Store user name and role w.r.t. their socket.id while room creation / joining while adding user

io.listen(3000);
