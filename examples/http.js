const http = require('http')

console.log(process.env)

const server = http.Server((req, res) => {
  let result = '';

  req.setEncoding('utf8');
  req.on('data', function(chunk) {
    result += chunk;
  });

  req.on('end', function() {
    res.writeHead(200);
    res.end('hello world\n');
    console.log(`Received new request on path ${req.url}`)
  });
});

server.listen(0, () => {
  console.log(`Listening on port ${JSON.stringify(server.address())}`)
});