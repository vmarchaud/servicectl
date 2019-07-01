var net = require('net');

var Server = net.Server.prototype;
var PipeWrap = process.binding('pipe_wrap');
var Pipe = PipeWrap.Pipe;

var originalListen = Server.listen;
Server.listen = function () {
  if (process.env.LISTEN_FDS) {
    if (PipeWrap.constants && typeof PipeWrap.constants.SOCKET !== 'undefined') {
      this._handle = new Pipe(PipeWrap.constants.SOCKET);
    }
    else {
      this._handle = new Pipe();
    }
    this._handle.open(3);
    return this._listen2(null, -1, -1);
  } else {
    return originalListen.apply(this, arguments);
  }
};