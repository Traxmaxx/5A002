var io = require('socket.io').listen(80);
var winston = require('winston');

var log = new (winston.Logger)();

log.add(winston.transports.Console, {
  colorize: true,
  timestamp: true
});

io.set('log level', 1);

var clients = {};

function buildClientList() {
  var client_list = [];
  for (var key in clients) {
    client_list.push({
      username: clients[key].username,
      pubkey: clients[key].pubkey
    });
  }
  return client_list;
}

function buildUserList() {
  var user_list = "";
  for (var key in clients) {
    user_list += clients[key].username + " ";
  }
  return user_list;
}

function userLoggedIn (username) {
  for (var key in clients) {
    if (clients[key].username == username) {
      return true;
    }
  }
  return false;
}

io.sockets.on('connection', function (socket) {
  // Recieve a login
  socket.on('login', function (data) {

    // Check if the username exists
    if (userLoggedIn(data.username)) {
      socket.emit('login:reply', {
        status: "username_taken",
        clientlist: null
      });
      return;
    }

    // Add client to list of clients
    clients[socket.id] = {};
    clients[socket.id].socket = socket;
    clients[socket.id].username = data.username;
    clients[socket.id].pubkey = data.pubkey;

    var client_list = buildClientList();

    // Send out login confirmation
    socket.emit('login:reply', {
      status: "ok",
      clientlist: client_list
    });

    client_list2 = {};
    client_list2.clientlist = buildClientList();

    // Broadcast the new client
    //socket.broadcast.emit('client:update', client_list2);
    io.sockets.emit('client:update', client_list2);

    log.info("'" + data.username + "' logged in.");
  });

  // Recieve a message
  socket.on('send:message', function (data) {

    if (clients[socket.id] === undefined) {
      socket.emit('send:messagereply', {
        status: "not_logged_in"
      });
      log.warn("socket id '" + socket.id + "' tried to send a message without being logged in");
      return;
    }

    // Build message.
    var msg = {};
    msg.sender = clients[socket.id].username;
    msg.message = data.message;

    // Send message to the specified user
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

    log.info("'" + msg.sender + "' send a message to '" + data.recipient.username + "'");
  });

  // delete the client when it disconnects
  socket.on('disconnect', function() {
    if (clients[socket.id] !== undefined) {
      log.info("'" + clients[socket.id].username + "' disconnected.");
      // Build client update object
      var client_update = {
        username: clients[socket.id].username,
        pubkey: clients[socket.id].pubkey
      };

      client_list = {};
      client_list.clientlist = buildClientList();

      //socket.broadcast.emit('client:update', client_list);
      io.sockets.emit('client:update', client_list);
    }
    delete clients[socket.id];
  });

  // delete the client when it disconnects
  socket.on('logout', function(derp) {
    if (clients[socket.id] !== undefined) {
      log.info("'" + clients[socket.id].username + "' logged out.");
      // Build client update object
      var client_update = {
        username: clients[socket.id].username,
        pubkey: clients[socket.id].pubkey
      };

      client_list = {};
      client_list.clientlist = buildClientList();

      //socket.broadcast.emit('client:update', client_list);
      io.sockets.emit('client:update', client_list);
    }
    delete clients[socket.id];
  });
});

setInterval(function() {log.info("active users: " + buildUserList())},5000);
