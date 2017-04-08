var express = require("express");
var mongodb = require("mongodb").MongoClient;
var RSVP = require('rsvp');

var app = express();
 
var promise = new RSVP.Promise(function(resolve, reject) {
  mongodb.connect("mongodb://localhost:27017/local", function (err, database) {
        console.log("here");
        if (err) reject(err);
        return resolve(database);
    }); 
});
try {
    app.get("/new?:url", function (req, res) {
    
    try {
        promise.then(
            function(database) 
            {
            
            return database; 
            }, 
            function(err) 
            {
                res.json({error: err.message});
            }
        )
        .then(
            function(database)
            {
                var getNextSequence = new RSVP.Promise(function(resolve, reject) {
                    //https://docs.mongodb.com/v3.0/tutorial/create-an-auto-incrementing-field/
                    database.collection("counters").findAndModify({ _id: "url_id" }, [['_id', 'asc']], { $inc: { seq: 1 } }, { new: true, upsert: true }, function (err, doc) {
                        if (err) reject(err);
                    
                        console.log(doc.value.seq);
                        resolve({ database: database, id: doc.value.seq });
                    });
                });
                return getNextSequence;
            }
        )
        .then(
            function(data){
                var insert = new RSVP.Promise(
                    function(resolve, reject) 
                    {
                        data.database.collection("short_urls")
                            .insert({ _id: data.id, url: req.query.url },
                                function (result)
                                {
                                    console.log(data.id);
                                    if (result && result.hasWriteError()) reject(result.writeError.errmsg);

                                    resolve(data.id);
                                }
                            );
                    }
                );
                return insert;
            }
        )
        .then(
            function(id) 
            {
                res.json({ "original_url":req.query.url, "short_url":"http://0.0.0.0:3000/" + id });
            }
        )
        .catch(
            function(error) 
            {
                res.json({error: error.message});
            }
        );
    }
    catch(err) 
    {
        res.json({error: error.message});
    }
    });
} catch (err) {
    console.log(err.message);
}

app.get("/:id", 
    function (req, res) 
    {
        try 
        {
            mongodb.connect("mongodb://localhost:27017/local", 
                function (err, database) 
                {
                    var document = database.collection("short_urls").findOne({ id: req.params.id });
                    document.then(function(result) {
                        if (!result) 
                        {
                            res.sendStatus(404);
                        } 
                        else
                        {
                            res.redirect(result.url);
                        }
                });
            });
        } 
        catch(err) 
        {
            console.log(err.message);
        }
    }
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, 
    function () 
    {
    console.log("App listening on port " + PORT);
    }
);