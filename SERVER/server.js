var url = require("url");
var http = require("http");
var path = require("path");
var handler = require("./handler.js");

function router(req, res) {//routes requests based on: virtual hosts; directory; and then extension
	var charCode, url="";
	var host, port;
	var i = 0;
	if (req.url.length<4096) {//4 kb
		if (req.headers.host.length<4096) {//TODO: decrease values if attack occurs
			/*
			//process everything
			if(req.url[0] !== "/") {
				req.url = "/"+req.url;
			}
			while(i<req.url.length) {
				if(req.url[i] === "%") {
					charCode = parseInt(req.url.substr(i+1, i+2),16);
					if ((charCode>31)&&(charCode<127)) {
						url += String.fromCharCode(charCode);
					} else {
						url += req.url.substr(i, i+2);
					}
					i++;//skip a total of three rounds to skip all the characters
					i++;
				} else {
					url += req.url[i];
				}
				i++;
			}
			url = path.normalize(url);
			url = url.substr(1);
			console.log(url);
			extension = url.indexOf("/");//use extension a temporary variable
			if(extension>0) {
				dir = url.substr(0,extension+1);
			} else {
				dir = "/";
			}
			extension = url.lastIndexOf(".");
			if (extension>0) {
				extension = url.substr(extension);
				if(extension.lastIndexOf("?")>=0) {
					extension = extension.substr(0,extension.lastIndexOf("?"));
				}
			}*/
			if (req.headers.hasOwnProperty("host")) {
				host = req.headers.host;
				if(host.indexOf(":")>0) {
					host = host.split(":");
					port = host[1];
					host = host[0];
				}
			} else {
				port = 80;
				host = "_DEFAULT";
			}
			
			//console.log("url: "+url+", extension: "+extension+", host: "+host+", port: "+port+", dir: "+dir);
			res.writeHead(200, {"Content-type":"text/plain"});
			res.end("Hello World");
		} else {
			res.writeHead(414, {"Content-type":"text/plain"});
			res.end("The host header was tooooooo long for us, sorry.");
		}
	} else {
		res.writeHead(414, {"Content-type":"text/plain"});
		res.end("The URL was tooooooo long for us, sorry.");
	}
}
var httpServer = http.createServer(router);
httpServer.listen(8888);
