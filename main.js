#!/usr/bin/env node

var fs = require('fs');

// CLI Options
var program = require('commander');
// Queue
var Queue = require('./queue');
// Build queue syncron
var queue = new Queue();

var packageJson = require('./package.json');

// VARIABLES
var argPath = process.argv[2];
var meteor = require('./meteor.js');

program
    .version(packageJson.version)
    .option('-t, --template <file path>', 'Provide a custom index.html template. Use {{> head}}, {{> css}} and {{> scripts}} to place the meteor resources.')
    .option('-u, --url <url>', 'The Root URL of your app.')
    // .option('-d, --ddp <url>', 'The URL of your Meteor DDP server, e.g. "ddp+sockjs://ddp.myapp.com/sockjs". If you don\'t add any it will also add call "Meteor.disconnect();" to prevent the app from conneting.')
    .parse(process.argv);


// RUN TASKS

// TODO: get meteor apps basepath and set it as cwd
// console.log(process.cwd());
// process.chdir('new cwd');

if(!argPath) {
    console.error('You need to provide a path for the build output, for example:');
    console.error('$ meteor-build-client myBuildFolder');

} else {

    (function(){

        if(program.template) {
            try {
                if(!fs.lstatSync(program.template).isFile())
                    throw new Error();
                
            } catch(e) {
                console.error('The template file "'+ program.template +'" doesn\'t exist or is not a valid template file');
                return;  
            }
        }

        // build meteor
        queue.add(function(callback){
            console.log('Bundling app with Meteor...');
            meteor.build(callback);
        });

        // unpack the bundle
        queue.add(function(callback){
            console.log('Extracting the bundle...');
            meteor.unpack(callback);
        });

        // move the files into the build folder
        queue.add(function(callback){
            console.log('Generating the index.html...');
            meteor.move(callback);
        });

        // create the index.html
        queue.add(function(callback){
            meteor.addIndexFile(program, callback);
        });

        // delete unecessary fiels
        queue.add(function(callback){
            meteor.cleanUp(function(){
                console.log('Done!');
                console.log('-----');
                console.log('You can find your files in "'+ require('path').resolve(argPath) +'".');

                callback();
            });
        });

        queue.run();
    })()
}





