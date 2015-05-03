var http = require("http");
var fs = require('fs');
var path = require('path');
var args = process.argv;
var portArg = /^(--port|--p)=(\d+)/;
var port = args.filter(function (arg) {
  return !!(arg.match(portArg));
})[0].match(portArg)[2] || 3000;

function doStuff(req, res) {
  var dirs, headers, status, fsData, resBuffer, rs;
  status = 200;
  headers = {
    "Content-Type": "text/html; charset=UTF-8",
    "Transfer-Encoding": "chunked"
  };

  try {
    fsData = fs.statSync(path.join(process.cwd(), req.url))
  } catch (e) {
    status = 404;
    res.writeHead(status, headers);
    res.end("NOT FOUND");
    return undefined;
  } 

  if (fsData.isDirectory()) {
    dirs = fs.
        readdirSync(path.join(process.cwd(), req.url)).
        map(function (f) {
          var fname = path.join(process.cwd(), req.url, f);
          return f + (fs.statSync(fname).isDirectory() ?  "/" : "");
        });

    if ( req.url === "/" && dirs.indexOf("index.html") !== -1 )  {
      resBuffer = fs.readFileSync(path.join(process.cwd(), "index.html")).toString();
    } else {
      resBuffer = dirs.reduce(function (prev, dir) {
        return prev + "<div><a href='" +path.join(req.url, dir) +"'>" +dir + "</a></div>";
      }, "");
      resBuffer = "<!DOCTYPE html><html><head></head><body>" + 
                  resBuffer +
                  "</body></html>";
    }
    console.log("SENT", status, req.headers.host, req.method, req.url);
    res.writeHead(status, headers);
    res.end(resBuffer);
  } else if (path.basename(req.url).match(/^\./) === null) {
    rs = fs.createReadStream(path.join(process.cwd(), req.url));
    res.writeHead(status, headers);
    rs.pipe(res);
    if (!path.extname(req.url) === ".html") {
      headers["Content-Type"] = "text/plain";
      headers["Content-Length"] = fsData.size;
    }
  } else {
    status = 403;
    headers["Content-Type"] = "text/plain";
    resBuffer = "FORBIDDEN";
    res.writeHead(status, headers);
    res.end(resBuffer);
  }
  console.log("SENT", status,"to", req.headers.host, req.method, req.url,"|", (new Date).toTimeString());
}

var server = http.createServer(doStuff);

server.listen(port, function () {
  console.log("LISTENING ON ", port);
});
