all:
	ssh anilsson@battlehack.nilsson.io "sudo killall node || :"
	scp server.js package.json anilsson@battlehack.nilsson.io:
	ssh anilsson@battlehack.nilsson.io "npm install"
	ssh anilsson@battlehack.nilsson.io "sudo nohup node server.js >> server.log 2>&1 &"
