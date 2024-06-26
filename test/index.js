
var assert = require('assert');
var http = require('http');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp').sync;
var Metalsmith = require('metalsmith');
var serve = require('..');

var port = 8081;

describe('metalsmith-serve', function() {

  var metalsmith;
  var servePlugin;

  before(function(done) {
    metalsmith = Metalsmith("test/fixtures/site");

    servePlugin = serve({
      verbose: false,
      "port": port,
      listDirectories: true
    });

    metalsmith
      .use(servePlugin)
      .build(function(err) {
        if (err) throw err;

        //create empty directory for testing, as metalsmith doesn't preserve empty directories
        mkdirp(path.join(metalsmith.destination(), "emptydir"));
        done();
      });

  });

  after(function(done) {
    servePlugin.shutdown(done);
  });

  it('should serve on local port', function(done){

    var req = http.request(
      { host: "localhost", "port": port, path: "/" },
      function(res) {
        var body = '';

        res.on('data', function(buf) {
          body += buf;
        });

        res.on('end', function() {
          assert.equal(res.statusCode, 200);
          var contents = fs.readFileSync(path.join(metalsmith.destination(), "index.html"), "utf8");
          assert.equal(body, contents);
          done();
        });

        res.on('error', function(e) {
          throw(e);
        });


      }
    ).end();

  });

  it('should return 404 for non-existent file', function(done){
    var req = http.request(
      { host: "localhost", "port": port, path: "/lostfile.txt" },
      function(res) {
        var body = '';

        res.on('data', function(buf) {
          body += buf;
        });

        res.on('end', function() {
          assert.equal(res.statusCode, 404);
          done();
        });

        res.on('error', function(e) {
          throw(e);
        });


      }
    ).end();

  });

  it('should return 404 for non-existent file in subdirectory', function(done){
    var req = http.request(
      { host: "localhost", "port": port, path: "/dir/lostfile.txt" },
      function(res) {
        var body = '';

        res.on('data', function(buf) {
          body += buf;
        });

        res.on('end', function() {
          assert.equal(res.statusCode, 404);
          done();
        });

        res.on('error', function(e) {
          throw(e);
        });


      }
    ).end();

  });

});


describe('metalsmith-serve with custom document_root', function(){

  var metalsmith;
  var servePlugin;
  var docRoot;

  before(function(done) {
    metalsmith = Metalsmith("test/fixtures/site");
    docRoot = 'test/fixtures/customindex/src';

    servePlugin = serve({
      document_root: docRoot,
      verbose: false,
      "port": port,
    });

    metalsmith
      .use(servePlugin)
      .build(function(err) {
        if (err) throw err;
        done();
      });
  });

  after(function(done) {
    servePlugin.shutdown(done);
  });

  it('should serve custom document root', function(done){

    var callback = function(res) {
      var body = '';

      res.on('data', function(buf) {
        body += buf;
      });

      res.on('end', function() {
        assert.equal(res.statusCode, 200);
        var contents = fs.readFileSync(path.join(docRoot, 'index.txt'), "utf8");
        assert.equal(body, contents);
        done();
      });

      res.on('error', function(e) {
        throw(e);
      });


    };

    var options = {
      host: "localhost",
      "port": port,
      path: "/index.txt"
    };

    var req = http.request(options, callback)
    req.end();

  });
});


// not_found file serving and redirects
describe('metalsmith-serve custom redirects', function() {

  var metalsmith;
  var servePlugin;

  before(function(done) {
    metalsmith = Metalsmith('test/fixtures/site');

    servePlugin = serve({
      verbose: false,
      "port": port,
      "redirects": [
          { source: "/redirect_file.txt", destination: "/index.html" },
          { source: "/redirect_file.txt?alt=true", destination: "/index.html" }
      ]
    });

    metalsmith
      .use(servePlugin)
      .build(function(err) {
        if (err) throw err;
        done();
      });

  });

  after(function(done) {
    servePlugin.shutdown(done);
  });

  it('should serve on local port', function(done){

    var req = http.request(
      { host: "localhost", "port": port, path: "/" },
      function(res) {
        var body = '';

        res.on('data', function(buf) {
          body += buf;
        });

        res.on('end', function() {
          assert.equal(res.statusCode, 200);
          var contents = fs.readFileSync(path.join(metalsmith.destination(), "index.html"), "utf8");
          assert.equal(body, contents);
          done();
        });

        res.on('error', function(e) {
          throw(e);
        });

      }
    ).end();

  });

  it('should return 301 for configured redirections', function(done){
    var req = http.request(
      { host: "localhost", "port": port, path: "/redirect_file.txt" },
      function(res) {
        var body = '';

        res.on('data', function(buf) {
          body += buf;
        });

        res.on('end', function() {
          assert.equal(res.statusCode, 301);
          assert.equal(res.headers.location, "/index.html");
          done();
        });

        res.on('error', function(e) {
          throw(e);
        });


      }
    ).end();

  });

  it('should return 301 for configured redirections with params', function(done){
    var req = http.request(
      { host: "localhost", "port": port, path: "/redirect_file.txt?alt=true" },
      function(res) {
        var body = '';

        res.on('data', function(buf) {
          body += buf;
        });

        res.on('end', function() {
          assert.equal(res.statusCode, 301);
          assert.equal(res.headers.location, "/index.html");
          done();
        });

        res.on('error', function(e) {
          throw(e);
        });


      }
    ).end();

  });

});

describe('metalsmith-serve with no options', function(){

  var metalsmith;
  var servePlugin;

  before(function(done) {
    metalsmith = Metalsmith("test/fixtures/site");

    servePlugin = serve();

    metalsmith
      .use(servePlugin)
      .build(function(err) {
        if (err) throw err;
        done();
      });
  });

  after(function(done) {
    servePlugin.shutdown(done);
  });

  it('should just work', function(done){

    var callback = function(res) {
      var body = '';

      res.on('data', function(buf) {
        body += buf;
      });

      res.on('end', function() {
        assert.equal(res.statusCode, 200);
        var contents = fs.readFileSync(path.join(metalsmith.destination(), "index.html"), "utf8");
        assert.equal(body, contents);
        done();
      });

      res.on('error', function(e) {
        throw(e);
      });

    };

    var options = {
      host: "localhost",
      "port": servePlugin.defaults.port,
      path: "/"
    };

    var req = http.request(options, callback)
    req.end();


  });

});

describe('metalsmith-serve shutdown', function () {

  var metalsmith;
  var servePlugin;

  before(function (done) {
    metalsmith = Metalsmith("test/fixtures/site");

    servePlugin = serve();

    metalsmith
      .use(servePlugin)
      .build(function (err) {
        if (err) {
          throw err;
        }
        done();
      });
  });

  it('should shutdown the server and all connected sockets', function (done) {

    var callback = function (res) {
      var body = '';

      res.on('data', function (buf) {
        assert.ok(Object.keys(servePlugin.sockets).length > 0, 'More than one socket is open');
        body += buf;
      });

      res.on('end', function () {
        assert.equal(res.statusCode, 200);
        var contents = fs.readFileSync(path.join(metalsmith.destination(), "index.html"), "utf8");
        assert.equal(body, contents);


        servePlugin.shutdown(function () {
          assert.equal(Object.keys(servePlugin.sockets).length, 0, 'All sockets are closed');

          done();
        });

      });

      res.on('error', function (e) {
        throw(e);
      });

    };

    var options = {
      host: "localhost",
      "port": servePlugin.defaults.port,
      path: "/"
    };

    var req = http.request(options, callback)
    req.end();


  });

});

