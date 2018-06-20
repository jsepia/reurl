const log = console.log.bind (console)
function compose (fn1, fn2, fn3, __) { 
  const fns = arguments
  return function () {
    var x = arguments
    for (let i = fns.length-1; i >= 0; i--)
      x = [fns[i].apply (null, x)]
    return x[0] } }


const percentEncode = require ('./utf')


// Authority parser
// ----------------

// the last @ is the userinfo-host separator
// the first : before the userinfo-host separator is the username-password separator
// the first : after the userinfo-host separator is the host-port separator

// TODO: fileAuth should be handled differently? Should not have a port?
// Yes, see, file auth is parsed as an opaque host. simply, without userinfo, yet, converting 'localhost' to ''

function parseAuth (string) {
  let last_at = -1
  let port_col = -1
  let first_col = -1

  for (let i=0, l=string.length; i<l; i++) {
    if (string[i] === '@')
      last_at = i
    else if (string[i] === ':') {
      first_col = first_col < 0 ? i : first_col
      port_col = port_col <= last_at ? i : port_col
    }
  }

  const auth = { _auth:string, user:null, pass:null, host:'', port:null }

  if (last_at >= 0) {
    if (0 <= first_col && first_col < last_at) {
      auth.user = string.substring (0, first_col)
      auth.pass = string.substring (first_col + 1, last_at)
    }
    else
      auth.user = string.substring (0, last_at)
  }
  if (port_col > last_at) {
    auth.host = string.substring (last_at + 1, port_col)
    auth.port = string.substr (port_col + 1)
  }
  else
    auth.host = string.substr (last_at + 1)

  return auth
}


// Normalize auth
// --------------

const specialSchemes = 
  { ftp: 21
  , file: null 
  , gopher: 70
  , http: 80
  , https: 443
  , ws: 80
  , wss: 443 }

// Only for non-file
function normalizeAuth (auth, scheme) {
  const r = { user:null, pass:null, host:auth.host, port:null }
  r.user = auth.user ? auth.user : null
  r.pass = auth.pass ? auth.pass : null
  const _port = /^[0-9]+$/.test (auth.port) ? parseInt (auth.port, 10) : auth.port
  r.port = scheme in specialSchemes && _port === specialSchemes [scheme] ? null : _port
  if (r.port !== null) r.port += ''
  return r
}


const USER_ESC = /[\x00-\x1F\x7F-\xFF "<>`#?{}/:;=@\[\\\]^|]/g

function printAuth (auth) {
  //log (auth)
  let r = auth.host
  let userinfo = ''

  if (auth.port)
    r += ':' + auth.port

  if (auth.user)
    userinfo += _userinfo_esc (auth.user)
  if (auth.pass)
    userinfo += ':' + _userinfo_esc (auth.pass)

  return userinfo ? userinfo + '@' + r : r
}


function _userinfo_esc (v) {
  return percentEncode (v) .replace (USER_ESC, _esc)
}

function _esc (char) {
  var b = char.charCodeAt (0)
  return (b > 0xf ? '%' : '%0') + b.toString (16) .toUpperCase ()
}



// var sample = 'foo:bar:baz@haz:baz:bar@haz:baz:bar'
// var sample = 'foo:bar:baz@haz:baz:bar@haz:baz:bar'
// var sample = 'foo:bar@haz:90'
// var sample = 'foo:bar:baz@haz:90'
// var sample = 'foo:bar@haz@host:80'
// var sample = 'foo:bar'
// var sample = 'foo@bar:baz@host'
// var sample = 'foo@bar:baz:bee@host'
// var sample = '@::'
// var sample = '::@@'
// var sample = '@@::'
//var sample = 'foo:bar@host:80'
//var sample = 'f:00000000000000000000080'
var sample = 'asd:@foo'
var sample = '@@@foo'

//compose (log, parseAuth) (sample)
//compose (log, printAuth, _ => normalizeAuth (_, 'http'), parseAuth) (sample)


module.exports = { parse:parseAuth, print:printAuth, normalize:normalizeAuth }