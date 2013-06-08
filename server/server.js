var io = require('socket.io').listen(80);

io.sockets.on('connection', function (socket) {
  socket.on('login', function (data) {
    socket.set('username', data.username);
    socket.set('pubkey', data.pubkey);

    // Build client list. Callback soup. Here be dragons.
    var client_list = {};
    for (var key in io.sockets.sockets) {
      io.sockets.sockets[key].get('username', function(err, name) {
        if (name != data.username) {
          io.sockets.sockets[key].get('username', function(err, key) {
            client_list[data.username] = {
              pubkey: key
            };
          });
        }
      });
    }

    // Send login success, because it will always succeed.
    socket.emit('login:reply', {
      status: 'ok',
      clientlist: client_list
    });

    // Build client update object
    var client_update = {};
    client_update[data.username] = {
      pubkey: data.pubkey,
      status: "online"
    };

    // Broadcast the new client
    socket.broadcast.emit('client:update', client_update);
  });
  socket.on('send:message', function (data) {
    // Build message.
    msg.sender = socket.get('username', function(err, name) {
      var msg = {};
      msg.id = data.id;
      msg.sender = name;
      msg.data = data.data;
      // Send message. Callback soup. Here be dragons.
      for (var key in io.sockets.sockets) {
        io.sockets.sockets[key].get('username', function(err, name) {
          if (name == data.username) {
            io.sockets.sockets[key].emit('recieve:message', msg);
          }
        });
      }
    });

    // Send message status
    socket.emit('send:message', {
      status: "ok"
    });
    console.log(data);
  });

});