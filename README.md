# knackObject
a relational getter and templater for the KnackAPI

Knack is great! (props to http://knackhq.com)

##What does KnackObject.js do?

It is a small javascript function that queries the Knack API for a record in a database. It combines "field" and "record" data into a single object and recursively follows and queries any relational "connections".  
Also included is a simple HTML templater.

##How does KnackObject work?

###Example 1
Create 2 databases in your Knack app.  
The furst database should have a  Knack "name" and a Knack "address" field.
Create another database called "My Data" and have it hold a short text field labeled "Introduction" and a "connection" to a record in the first database you created.  
Fill in some data for both databases.  
@todo: show how to get the id of a specific record in a knack database

Now we're ready, summon the API!
```javascript
//create a new KnackObject using your KnackAPI credentials
//@todo: link to how to find your KnackAPI credentials

var example1 = new KnackObject( {
   'appId'     : 'your knack API ID',
   'apiKey'    : 'your knack API key',
} );

// get an object that represents the data for a record in "object_2" that has an ID of "exampleRecord"
var knackObject  = example1.get('exampleRecord', 'object_2' );

/*
knackObject = [ 
  {
    key: "field_21",
    label: "Introduction":
    required: false,
    type: "short_text",
    html: "Hi!",
    raw: "Hi!"
  },
  {
    key: "field_22",
    label: "My Information",
    relationship: Object,
    required: false,
    type: "connection",
    connection : [
    {
      id: "`123456780145477fe84be8",
      identifier: "My Name",
      records: [
        {
          key: "field_4"
          label: "Full Name"
          required: false
          type: "name"
          html: "Charles U Farley"
          raw: { 
            first: "Charles"
            middle:"U"
            last: "Farley"}
        },
        {
          key: "field_5",
          label: "Address",
          required: false,
          type: "address"
          html: "Seattle, WA ",
          raw: {
            city: "Seattle",
            latitude: "47.6038321",
            longitude: "-122.3300624",
            state: "WA",
            street: "",
            street2: "",
            zip: ""
          }
        }
      ]
    }
  }
]
*/
```

###A Filthy Example

This custom cose cam be put in your knack app custom javascript
```javascript

   // Example 2: autorun KnackObject.render when knack app renders 'view_1'

   $( document ).on( 'knack-page-render.view_1', function() {
      LazyLoad.js(['https://rawgit.com/jason0brien/knackObject/master/knackObject.js'], function () {
        var example2 = new KnackObject( {
          appId     : 'your knack API ID',
          apiKey    : 'your knack API key',
          objectId  : 'object_2',
          recordId  : 'exampleRecordID',
          renderNow : true
     } );
  } );
```
