all:
	ssh battlehack.nilsson.io "sudo killall node || :"
	scp server.js package.json battlehack.nilsson.io:
	ssh battlehack.nilsson.io "npm install"
	ssh battlehack.nilsson.io "sudo nohup node server.js >> server.log 2>&1 &"
