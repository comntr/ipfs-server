const cmdargs = require('commander');
const sha1 = require('sha1');
const http = require('http');
const path = require('path');
const IpfsClient = require('ipfs-http-client');
const fs = require('fs');

const log = require('./log');

const GET_COMMENTS_REGEX = /^\/[0-9a-f]{40}$/;

cmdargs
  .option('-p, --port <n>', 'HTTP port.', parseInt)
  .option('-r, --root <s>', 'The root dir with the comment folder.')
  .parse(process.argv);

const rootDir = path.resolve(cmdargs.root);

log.i('The root folder:', rootDir);

log.i('Starting IPFS client.');
const ipfs = new IpfsClient({
  host: 'localhost',
  port: 5001,
  protocol: 'http',
});

async function ipfsAddR(dirPath) {
  log.i('Running ipfs add -r', dirPath);
  let items = await ipfs.addFromFs(dirPath, { recursive: true });
  let dirItem = items[items.length - 1];
  log.i('ipfs add -r ->', dirItem.hash);
  return dirItem.hash;
}

log.i('Starting HTTP server on port', cmdargs.port);

const server = http.createServer(async (req, res) => {
  log.i(req.method, req.url);
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method == 'GET' && req.url == '/') {
    let hash = await ipfsAddR(rootDir);
    res.statusCode = 200;
    res.end(hash);
    return;
  }

  if (req.method == 'GET' && GET_COMMENTS_REGEX.test(req.url)) {
    let commDir = path.join(rootDir, req.url);
    log.i('Checking comments in', commDir);

    if (!fs.existsSync(commDir)) {
      res.statusCode = 404;
      res.end();
      return;
    }

    let hash = await ipfsAddR(commDir);
    res.statusCode = 200;
    res.end(hash);
    return;
  }

  res.statusCode = 400;
  res.end();
});

server.listen(cmdargs.port, err => {
  if (err)
    log.e(err);
  else
    log.i('HTTP server started on port', cmdargs.port);
});
