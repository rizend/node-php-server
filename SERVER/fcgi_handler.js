var fastcgi = require("./../lib/fastcgi.js");
var net     = require("net");
var sys = require("sys");

var FCGI_RESPONDER = fastcgi.constants.role.FCGI_RESPONDER;
var FCGI_BEGIN     = fastcgi.constants.record.FCGI_BEGIN;
var FCGI_STDIN     = fastcgi.constants.record.FCGI_STDIN;
var FCGI_STDOUT    = fastcgi.constants.record.FCGI_STDOUT;
var FCGI_PARAMS    = fastcgi.constants.record.FCGI_PARAMS;
var FCGI_END       = fastcgi.constants.record.FCGI_END;


function serveFCGI(response, params, options) {
	var connection = new net.Stream();
	var doingHeaders=true;//are we still handling headers for the request?
	connection.setNoDelay(true);

	var writer = null;
	var parser = null;
	var header = {
		"version": fastcgi.constants.version,
		"type": FCGI_BEGIN,
		"recordId": 1,//represented by fourth byte of buffer
		"contentLength": 0,
		"paddingLength": 0
	};
	var begin = {
		"role": FCGI_RESPONDER,
		"flags": 0
	};

	function sendRequest (connection) {
		writer = new fastcgi.writer();
		header.type = FCGI_BEGIN;
		header.contentLength = 8;
		writer.writeHeader(header);
		writer.writeBegin(begin);
		connection.write(writer.tobuffer());
		
		header.type = FCGI_PARAMS;
		header.contentLength = fastcgi.getParamLength(params);
		writer.writeHeader(header);
		writer.writeParams(params);
		connection.write(writer.tobuffer());
		
		header.type = FCGI_STDIN;
		header.contentLength=10;
		writer.writeHeader(header);
		writer.writeBody("true=false");
		console.log(writer.tobuffer());
		connection.write(writer.tobuffer());

		connection.end();//why are we ending the connection here, I dont know.
	};

	connection.ondata = function (buffer, start, end) {
		parser.execute(buffer, start, end);
	};

	connection.on("connect", function() {
			var fcgiHeaders = {};
			var i;
			parser = new fastcgi.parser();
			parser.onRecord = function(record) {
				var tHeaders;
				switch(record.header.type) {
				case 7:
					//log error here
					if(options.endOnError) {
						response.writeHead({"Content-type":"text/plain", "Content-length":"37"});
						response.end("Error, fcgi script returned an error.");
						break;
					}
					if(options.showErrors!==true) {
						break;
					}//this may seem reduntant, but you can supress errors, while allowing the rest of the output to return to the user.
				case 6:
					if (doingHeaders) {
						if (record.body.indexOf("\r\n\r\n")>=0) {
							doingHeaders=false;
							tHeaders = record.body.substr(0, record.body.indexOf("\r\n\r\n")).split("\r\n");
						} else {
							tHeaders = record.body.split("\r\n");
						}
						i = 0;
						while(i<tHeaders.length) {
							fcgiHeaders[tHeaders[i].split(": ")[0]] = tHeaders[i].split(": ")[1];//should ": " be just ":"?
							i++;
						}
						if (! doingHeaders) {
							//catch error in status header:
							if (fcgiHeaders.hasOwnProperty("Status")) {
								//catch 404 not found here with if(headers.Status === " 404 Not Found")
								console.log("ERROR: "+fcgiHeaders.Status.substr(0,3));
								//deal with error
							} else {
								response.writeHead(fcgiHeaders);
								response.write(record.body.substr(record.body.indexOf("\r\n\r\n")+4));
							}
						}
						//console.log(JSON.stringify(tHeaders));
						//console.log(JSON.stringify(record));
					} else {
						response.write(record.body);
					}
					break;
				case 3:
					//end the response:
					response.end();
					break;
				default:
					//we should not get here
					console.log("ERROR, defaulted in fcgi state switch");
				}
			}

		parser.onError = function(err) {
			console.log(err);
			//OMG an error on parsing! (this has never happened to me yet.)
		};

		sendRequest(connection);
	});
				

	connection.on("close", function() {
		connection.end();
		//console.log(headers);
		//console.log(body);
	});

	connection.on("error", function(err) {
		sys.puts(sys.inspect(err.stack));//oh no, an error!
		connection.end();
	});

	connection.connect(options.port, options.host);
}

var mparams = [
	["SCRIPT_FILENAME","/home/www-data/njsc/index.php"],
	["QUERY_STRING", "roy=true&table=false"],
	["REQUEST_METHOD", "POST"],
	["SCRIPT_NAME", "index.php"],
	["REQUEST_URI", "http://192.168.1.202:9001/index.php?roy=true&table=false"],
	["DOCUMENT_ROOT", "/home/www-data/njsc/"],
	["GATEWAY_PROTOCOL", "CGI/1.1"],
	["SERVER_SOFTWARE", "nodephp/" + process.version]
];

var moptions = {host: '127.0.0.1', port: 8000, endOnError:false, showErrors:true};
serveFCGI({"writeHead" : function(headers) {//fake version of response for logging
	console.log(JSON.stringify(headers));
}, "end" : function(data) {
	console.log("\n\n"+data);
}, "write" : function(data) {
	console.log("\n\n"+data);
}}, mparams, moptions);

exports.serveFCGI = serveFCGI;
