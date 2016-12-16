//imports
const catalog = require("justo").catalog;
const apt = require("justo-plugin-apt");
const fs = require("justo-plugin-fs");
const cli = require("justo-plugin-cli");
const sync = require("justo-sync");
const getos = require("getos");

//private data
const PKG = "arangodb3";
const RELEASES = ["12.04", "14.04", "16.04"];

//catalog
catalog.workflow({name: "install-arangodb", desc: "Install ArangoDB."}, function() {
  var os;

  //(1) get OS info
  os = sync((done) => getos(done));

  if (os.os != "linux" || !/Ubuntu/.test(os.dist) || RELEASES.indexOf(os.release) < 0)  {
    throw new Error("Distribution not supported by this module.");
  }

  //(2) install
  if (!apt.installed("Check whether ArangoDB installed", {name: PKG})) {
    //(2.1) install dependencies
    if (!apt.installed("Check whether wget installed", {name: "wget"})) {
      apt.install("Install wget package", {name: "wget"});
    }

    if (!apt.installed("Check whether apt-transport-https installed", {name: "apt-transport-https"})) {
      apt.install("Install apt-transport-https", {name: "apt-transport-https"});
    }

    //(2.2) add package source
    if (!fs.exists("Check whether /etc/apt/sources.list.d/arangodb.list exists", {src: "/etc/apt/sources.list.d/arangodb.list"})) {
      cli("Create /etc/apt/sources.list.d/arangodb.list", {
        cmd: "bash",
        args: ["-c", `echo 'deb https://www.arangodb.com/repositories/arangodb31/${os.release}/ /' | tee /etc/apt/sources.list.d/arangodb.list`],
      });
    }

    cli("Add APT key", {
      cmd: "bash",
      args: ["-c", `wget -qO- https://www.arangodb.com/repositories/arangodb31/xUbuntu_${os.release}/Release.key | apt-key add -`]
    });

    apt.update("Update APT index");
    if (!apt.available(`Check whether ${PKG} package available`, {name: PKG})) return;

    //(2.3) install ArangoDB
    apt.install(`Install ${PKG} package`, {name: PKG, allowUnauthenticated: true});
  }

  //(3) post
  cli("Check arangod command", {
    cmd: "bash",
    args: ["-c", "arangod --version"]
  });

  cli("Check arangosh command", {
    cmd: "bash",
    args: ["-c", "arangosh --version"]
  });

  cli("Check arangodump command", {
    cmd: "bash",
    args: ["-c", "arangodump --version"]
  });

  cli("Check arangoimp command", {
    cmd: "bash",
    args: ["-c", "arangoimp --version"]
  });

  cli("Check arangorestore command", {
    cmd: "bash",
    args: ["-c", "arangorestore --version"]
  });
});

catalog.macro({name: "default", desc: "Install ArangoDB."}, ["install-arangodb"]);
