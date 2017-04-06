var express = require("express");
var mongodb = require("mongodb").MongoClient;
var app = express();

app.get("/new?:url", function(req, res) {
    mongodb.connect("mongodb://localhost:27017/local", function(err, database) {
        var collection = database.collection("short_urls");
        var id = getNextSequence(database, "url_id");
        collection.insert({_id: id, url: req.query.url}, function(result) {
            res.json({ "original_url":req.query.url, "short_url":"http://0.0.0.0/" + id });
        });
        
        database.close();
    });
});
app.get("/:id", function(req, res){
    mongodb.connect("mongodb://localhost:27017/local", function(err, database) {
        var document = database.collection("short_urls").find({id: req.query.id });
        res.redirect(document.url);
    });
});

//https://docs.mongodb.com/v3.0/tutorial/create-an-auto-incrementing-field/
function getNextSequence(database, name) {
    var ret = database.collection("counters").findAndModify(
          
    {_id: name},
    [['_id','asc']],
    { $inc: { seq: 1 } },
    {new: true, upsert: true}, 
    function(err, doc){
        console.log('find and modified  ' +doc);
    }
  );
}

app.listen("3000", "0.0.0.0");