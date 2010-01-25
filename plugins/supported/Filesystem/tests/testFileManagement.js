/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1
 *
 * The contents of this file are subject to the Mozilla Public License
 * Version 1.1 (the "License"); you may not use this file except in
 * compliance with the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied.
 * See the License for the specific language governing rights and
 * limitations under the License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * ***** END LICENSE BLOCK ***** */

var t = require("PluginDev");
var fs = require("Filesystem");
var fixture = require("Filesystem:tests/fixture");

var source = exports.source = fixture.DummyFileSource.create({
    files: [
        {name: "atTheTop.js", contents: "the top file"},
        {name: "anotherAtTheTop.js", contents: "another file"},
        {name: "foo/"},
        {name: "deeply/nested/directory/andAFile.txt", contents: "text file"}
    ]
});

var getNewRoot = function() {
    return fs.Directory.create({
        source: "Filesystem:tests/testFileManagement#source"
    });
};

var genericFailureHandler = function(error) {
    console.log(error);
    t.ok(false, "Async failed: " + error.message);
    t.start();
};

exports.testRootLoading = function() {
    source.reset();
    var root = getNewRoot();
    t.equal(null, root.get("parent"), "Parent should not be set on root");
    t.equal("/", root.get("name"), "Root's name is /");
    t.equal("/", root.get("path"), "Root's path is /");
    t.deepEqual([], root.get("files"), "No files now");
    t.deepEqual([], root.get("directories", "No directories yet"));
    t.equal(fs.NEW, root.get("status"), "status should be new now");
    t.equal(0, source.requests.length);
    
    source.set("checkStatus", fs.LOADING);
    root.load(function(dir) {
        t.equal(dir, root, "should have been passed in the root directory");
        t.equal(source.requests.length, 1, "should have made a request to the source");
        t.equal(dir.get("status"), fs.READY, "Directory should be ready");
        t.equal(dir.get("files").length, 2, "Should have two files");
        t.equal(dir.get("files")[0].name, "atTheTop.js", 
            "expected specific name");
        t.equal(dir.get("directories").length, 2, 
            "should have two directories");
        t.equal(dir.get("directories")[0].name, "foo/", 
            "first should be foo/");
        t.equal(dir.get("directories")[1].name, "deeply/", 
            "second should be deeply");
        t.equal(dir.get("contents").length, 4,
            "2 files + 2 directories = 4 items");
        
        root.load(function(dir) {
            t.equal(source.requests.length, 1, 
                "should not have loaded again, because it's already loaded");
            t.start();
        });
    }, genericFailureHandler);
    
    t.stop();
};

exports.testGetObject = function() {
    source.reset();
    var root = getNewRoot();
    var myDir = root._getObject("foo/bar/");
    t.equal(myDir.name, "bar/", "final object should be created correctly");
    t.equal(root.get("directories")[0].name, "foo/",
        "new directory should be created under root");
    t.equal(myDir.parent, root.get("directories")[0], 
        "same directory object in both places");
    var myFile = root._getObject("foo/bar/file.js");
    t.equal(myFile.get("directory"), myDir, 
        "file should be populated with the same directory object");
    t.equal(myFile.get("name"), "file.js");
    
    var fooDir = root._getObject("foo/");
    t.equal(myDir.get("parent"), fooDir, 
        "should be able to retrieve the same directory");
    
    myDir = root._getObject("newtop/");
    t.equal(root.get("directories").length, 2,
        "should have two directories now");
    myFile = root._getObject("newone.txt");
    t.equal(root.get("files").length, 1, 
        "should have one file now");
};

exports.testSubdirLoading = function() {
    source.reset();
    var root = getNewRoot();
    root.loadPath("deeply/nested/", function(dir) {
        t.equal(dir.get("name"), "nested/");
        t.equal(dir.get("status"), fs.READY);
        t.equal(root.get("status"), fs.NEW);
        
        var obj = root._getObject("deeply/nested/notthere/");
        t.equal(obj, null, 
            "directory is loaded, so non-existent name should not be created");
        
        t.equal(dir.get("path"), "/deeply/nested/",
            "can get back our path");
        
        t.start();
    }, genericFailureHandler);
    
    t.stop(1500);
};
