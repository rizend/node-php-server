var fs = require("fs");
var fcgi = require("./fcgi_handler.js");
var url = require("url");
var vhosts;
function makeHeaders(req, filename, vhost) {
	var params, headers, parsed;
	parsed = url.parse(req.url);
	headers = req.headers;
	params = [
	["SCRIPT_FILENAME",filename],
	["QUERY_STRING", parsed.query],
	["REQUEST_METHOD", req.method],
	["SCRIPT_NAME", parsed.path], //change to filename.substr(filename.indexOf("/")+1)?
	["REQUEST_URI", "http://" + ((req.headers.hasOwnProperty("host")) ? req.headers.host : vhost.hostname) + req.url],
	["DOCUMENT_ROOT", vhost.wwwdir],
	["GATEWAY_PROTOCOL", "CGI/1.1"],
	["SERVER_SOFTWARE", "myTORcode/0.1"]];
	//	["SERVER_SOFTWARE", "nodephp/" + process.version]
    if (headers.length <= 0) {
        return params;
    }
    for (prop in headers) {
        head = headers[prop];
        prop = prop.replace(/-/, '_').toUpperCase();
        if (prop.indexOf('CONTENT_TYPE') < 0) {
            // Quick hack for PHP, might be more or less headers.
            prop = 'HTTP_' + prop;
        }

        params[params.length] = [prop, head]
    }
    return params;
}
function virtualHost(hostname, wwwdir) {
	this.fcgiOPTS = {host: "127.0.0.1", endOnError:false, showErrors:true};
	this.hostname = hostname;
	this.wwwdir = wwwdir;
	this.specialDirs = {};
	return this;
}
function isPhpFile(ext) {
	switch(ext) {
	case ".php3":
	case ".php4":
	case ".php5":
	case ".php":
		return true;
		break;
	default:
		return false;
	}
}
function _Default(req, res, filename, ext, vhost) {
	if (isPhpFile(ext)) {
		//deal with post data
		fcgi.serveFCGI(res, makeHeaders(req, filename, vhost), vhost.fcgiOPTS);
	} else {
		serveFile(res, filename, ext);
	}
}
var mimeTypes = {
	"_DEFAULT" : "text/plain",
	".3gp"   : "video/3gpp",
	".a"     : "application/octet-stream",
	".ai"    : "application/postscript",
	".aif"   : "audio/x-aiff",
	".aiff"  : "audio/x-aiff",
	".asc"   : "application/pgp-signature",
	".asf"   : "video/x-ms-asf",
	".asm"   : "text/x-asm",
	".asx"   : "video/x-ms-asf",
	".atom"  : "application/atom+xml",
	".au"    : "audio/basic",
	".avi"   : "video/x-msvideo",
	".bat"   : "application/x-msdownload",
	".bin"   : "application/octet-stream",
	".bmp"   : "image/bmp",
	".bz2"   : "application/x-bzip2",
	".c"     : "text/x-c",
	".cab"   : "application/vnd.ms-cab-compressed",
	".cc"    : "text/x-c",
	".chm"   : "application/vnd.ms-htmlhelp",
	".class" : "application/octet-stream",
	".com"   : "application/x-msdownload",
	".conf"  : "text/plain",
	".cpp"   : "text/x-c",
	".crt"   : "application/x-x509-ca-cert",
	".css"   : "text/css",
	".csv"   : "text/csv",
	".cxx"   : "text/x-c",
	".deb"   : "application/x-debian-package",
	".der"   : "application/x-x509-ca-cert",
	".diff"  : "text/x-diff",
	".djv"   : "image/vnd.djvu",
	".djvu"  : "image/vnd.djvu",
	".dll"   : "application/x-msdownload",
	".dmg"   : "application/octet-stream",
	".doc"   : "application/msword",
	".dot"   : "application/msword",
	".dtd"   : "application/xml-dtd",
	".dvi"   : "application/x-dvi",
	".ear"   : "application/java-archive",
	".eml"   : "message/rfc822",
	".eps"   : "application/postscript",
	".exe"   : "application/x-msdownload",
	".f"     : "text/x-fortran",
	".f77"   : "text/x-fortran",
	".f90"   : "text/x-fortran",
	".flv"   : "video/x-flv",
	".for"   : "text/x-fortran",
	".gem"   : "application/octet-stream",
	".gemspec": "text/x-script.ruby",
	".gif"   : "image/gif",
	".gz"    : "application/x-gzip",
	".h"     : "text/x-c",
	".hh"    : "text/x-c",
	".htm"   : "text/html",
	".html"  : "text/html",
	".ico"   : "image/vnd.microsoft.icon",
	".ics"   : "text/calendar",
	".ifb"   : "text/calendar",
	".iso"   : "application/octet-stream",
	".jar"   : "application/java-archive",
	".java"  : "text/x-java-source",
	".jnlp"  : "application/x-java-jnlp-file",
	".jpeg"  : "image/jpeg",
	".jpg"   : "image/jpeg",
	".js"    : "application/javascript",
	".json"  : "application/json",
	".log"   : "text/plain",
	".m3u"   : "audio/x-mpegurl",
	".m4v"   : "video/mp4",
	".man"   : "text/troff",
	".mathml"  : "application/mathml+xml",
	".mbox"  : "application/mbox",
	".mdoc"  : "text/troff",
	".me"    : "text/troff",
	".mid"   : "audio/midi",
	".midi"  : "audio/midi",
	".mime"  : "message/rfc822",
	".mml"   : "application/mathml+xml",
	".mng"   : "video/x-mng",
	".mov"   : "video/quicktime",
	".mp3"   : "audio/mpeg",
	".mp4"   : "video/mp4",
	".mp4v"  : "video/mp4",
	".mpeg"  : "video/mpeg",
	".mpg"   : "video/mpeg",
	".ms"    : "text/troff",
	".msi"   : "application/x-msdownload",
	".odp"   : "application/vnd.oasis.opendocument.presentation",
	".ods"   : "application/vnd.oasis.opendocument.spreadsheet",
	".odt"   : "application/vnd.oasis.opendocument.text",
	".ogg"   : "application/ogg",
	".p"     : "text/x-pascal",
	".pas"   : "text/x-pascal",
	".pbm"   : "image/x-portable-bitmap",
	".pdf"   : "application/pdf",
	".pem"   : "application/x-x509-ca-cert",
	".pgm"   : "image/x-portable-graymap",
	".pgp"   : "application/pgp-encrypted",
	".pkg"   : "application/octet-stream",
	".pl"    : "text/x-script.perl",
	".pm"    : "text/x-script.perl-module",
	".png"   : "image/png",
	".pnm"   : "image/x-portable-anymap",
	".ppm"   : "image/x-portable-pixmap",
	".pps"   : "application/vnd.ms-powerpoint",
	".ppt"   : "application/vnd.ms-powerpoint",
	".ps"    : "application/postscript",
	".psd"   : "image/vnd.adobe.photoshop",
	".py"    : "text/x-script.python",
	".qt"    : "video/quicktime",
	".ra"    : "audio/x-pn-realaudio",
	".rake"  : "text/x-script.ruby",
	".ram"   : "audio/x-pn-realaudio",
	".rar"   : "application/x-rar-compressed",
	".rb"    : "text/x-script.ruby",
	".rdf"   : "application/rdf+xml",
	".roff"  : "text/troff",
	".rpm"   : "application/x-redhat-package-manager",
	".rss"   : "application/rss+xml",
	".rtf"   : "application/rtf",
	".ru"    : "text/x-script.ruby",
	".s"     : "text/x-asm",
	".sgm"   : "text/sgml",
	".sgml"  : "text/sgml",
	".sh"    : "application/x-sh",
	".sig"   : "application/pgp-signature",
	".snd"   : "audio/basic",
	".so"    : "application/octet-stream",
	".svg"   : "image/svg+xml",
	".svgz"  : "image/svg+xml",
	".swf"   : "application/x-shockwave-flash",
	".t"     : "text/troff",
	".tar"   : "application/x-tar",
	".tbz"   : "application/x-bzip-compressed-tar",
	".tcl"   : "application/x-tcl",
	".tex"   : "application/x-tex",
	".texi"  : "application/x-texinfo",
	".texinfo" : "application/x-texinfo",
	".text"  : "text/plain",
	".tif"   : "image/tiff",
	".tiff"  : "image/tiff",
	".torrent" : "application/x-bittorrent",
	".tr"    : "text/troff",
	".txt"   : "text/plain",
	".vcf"   : "text/x-vcard",
	".vcs"   : "text/x-vcalendar",
	".vrml"  : "model/vrml",
	".war"   : "application/java-archive",
	".wav"   : "audio/x-wav",
	".weba"  : "audio/webm",
	".webm"  : "video/webm",
	".wma"   : "audio/x-ms-wma",
	".wmv"   : "video/x-ms-wmv",
	".wmx"   : "video/x-ms-wmx",
	".wrl"   : "model/vrml",
	".wsdl"  : "application/wsdl+xml",
	".xbm"   : "image/x-xbitmap",
	".xhtml"   : "application/xhtml+xml",
	".xls"   : "application/vnd.ms-excel",
	".xml"   : "application/xml",
	".xpm"   : "image/x-xpixmap",
	".xsl"   : "application/xml",
	".xslt"  : "application/xslt+xml",
	".yaml"  : "text/yaml",
	".yml"   : "text/yaml",
	".zip"   : "application/zip"};
function getMimeType(extension) {
	if(typeof extension === "string") {
		if(mimeTypes.hasOwnProperty(extension)) {
			return mimeTypes[extension];
		} else {
			return mimeTypes["_DEFAULT"];
		}
	} else {
		return mimeTypes["_DEFAULT"];
	}
}
function serveFile(res, location, extension, headers) {
	var status = 200;
	if (typeof headers === "undefined") {
		headers = {};
	}
	if (!headers.hasOwnProperty("Content-type")) {
		headers["Content-type"] = getMimeType(extension);
	}
	if (headers.hasOwnProperty("_STATUS")) {
		status = parseInt(headers("_STATUS"));
		delete(headers["_STATUS"]);
	}
	fs.stat(location, function(err, stats) {
			var stream;
			if(err) {
				switch(err.errno) {
				case 34: //404
					res.writeHead(404, {"Content-type":"text/plain"});
					res.end("404: File Not Found");
					break;
				case 3: //403
					res.writeHead(403, {"Content-type":"text/plain"});
					res.end("403: Access Denied");
					break;
				default:
					throw err;
				}
			} else {
				if (err)
					throw err;
				if(stats.isFile()) {
					headers["Content-length"] = stats.size;
					stream = fs.createReadStream(location, {bufferSize: 64 * 1024});
					//optimize buffer size?
					stream.pipe(res);
				}
			}
	});
}
