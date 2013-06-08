var io = require('socket.io').listen(80);

io.set('log level', 1);

var clients = {};

io.sockets.on('connection', function (socket) {
  // Recieve a login
  socket.on('login', function (data) {
    //console.log("login: " + JSON.stringify(data));

    // Check if the username exists
    for (var key in clients) {
      if (clients[key].username == data.username) {
        socket.emit('login:reply', {
          status: "already_logged_in",
          clientlist: null
        });
        return;
      }
    }

    // Add client to list of clients
    clients[socket.id] = {};
    clients[socket.id].socket = socket;
    clients[socket.id].username = data.username;
    clients[socket.id].pubkey = data.pubkey;

    // Build client list.
    var client_list = [];
    for (var key in clients) {
      client_list.push({
        username: clients[key].username,
        pubkey: clients[key].pubkey
      });
    }

    // Send out login confirmation
    socket.emit('login:reply', {
      status: "ok",
      clientlist: client_list
    });

    // Build client update object
    var client_update = {
      username: data.username,
      pubkey: data.pubkey,
      status: "online"
    };

    console.log("'" + data.username + "' logged in.");

    // Broadcast the new client
    socket.broadcast.emit('client:update', client_update);
  });

  // Recieve a message
  socket.on('send:message', function (data) {
    //console.log("send:message: " + JSON.stringify(data));

    // Build message.
    var msg = {};
    msg.sender = clients[socket.id].username;
    msg.message = data.message;

    console.log("'" + msg.sender + "' send a message to '" + data.recipient.username + "'");

    for (var key in clients) {
      var client = clients[key];
      if (client.username == data.recipient.username) {
        client.socket.emit('recieve:message', msg);
      }
    }

    // Send message status
    socket.emit('send:message', {
      status: "ok"
    });
  });

  // delete the client when it disconnects
  socket.on('disconnect', function() {
    if (clients[socket.id] !== undefined) {
      console.log("'" + clients[socket.id].username + "' logged out.");
    }
    delete clients[socket.id];
  });
});