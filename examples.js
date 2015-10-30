//EXAMPLE 1 basic usage

    // 'appID' and 'apiKey' are required
    var example1 = new KnackObject( {
      'appId'     : 'your knack API ID',
      'apiKey'    : 'your knack API key',
    } );

    // get raw field response from knack API
    var rawfields1 = example1.getFields('object_1');

    // get raw record response for knack API
    var rawRecord1 = example1.getRecord('example1Record1', 'object_1' );

    // get a KnackObject for a record of your knack database 
    var knackObject1  = example1.get('example1RecordRecord2', 'object_1' );

    // get a different KnackObject 
    var knackObject1a = example1.get('example1RecordRecord1', 'object_2' );

    // get a sting of html that renders a KnackObject
    var templateString1 = example1.template(knackObject1a);

    
    //when your knack app renderes 'view_1', append the html for a KnackObject into it
    $( document ).on( 'knack-page-render.view_1', example1.render( knackObject1 ) );

    //when your knack app renderes 'view_2', append the html for a KnackObject into it
    $( document ).on( example1.eventTrigger('view_2'), example1.render( templateString1 ) );
   

// EXAMPLE 2, simple render
//   optional options 'objectID' and 'recordID' are set:
//     -allows KnackObject functions to work with no parameters
//     -allows KnackObject functions to accept different kinds of parameters as a convienience
//   optional option 'viewID' is set: 
//     -allows KnackObject.eventTrigger() to accept no arguments
//   optional option 'skipRecord' is set:
//     -allows KnackObject to skip processing fields labeled 'Owner' and 'Identifier'

    var example2 = new KnackObject( {
     'appId'      : 'your knack API ID',
     'apiKey'     : 'your knack API key',
     'objectId'   : 'object_1',
     'recordId'   : 'example1Record1',
     'viewId'     : 'view_1'
     'skipRecord' : ['Owner', 'Identifier'],
    } );

    // render the KnackObject easy peasey
    $( document ).on( example2.eventTrigger(), example2.render() );


    // get some stuff from the KnackObject
    var rawfields2  = example2.getFields();
    var rawfields2a = example2.getFields( 'object_2' );

    var rawRecord2   = example2.getRecord();
    var rawRecord2   = example2.getRecord( 'example1Record2' );
    var rawRecord2a  = example2.getRecord( 'example2Record1', 'object_2' );

    var knackObject2  = example2.get();
    var knackObject2a = example2.get( 'example1Record3' );
    var knackObject2b = example2.get( 'example2Record2', 'object_2' );

    var templateString2  = example2.template();
    var templateString2a = example2.template( knackObject2a );
    var templateString2b = example2.template( 'example1Record4' );
    var templateString2c = example2.template( 'example2Record3', 'object_2' );

    // more rendering options
    $( document )
      .on( example2.eventTrigger(),         example2.render( 'example1Record5' ) )  //render a different record in the database
      .on( example2.eventTrigger('view_2'), example2.render( knackObject2 )      )  //render a different KnackObject
      .on( 'knack-page-render.view_3',      example2.render( templateString2a  ) ); //render a different template string



    // Example 3, render KnackObject with default object
    //  optional options 'objectId' is set:
    //    --the 'recordId' is not set,
    //    ----less parameter options for KnackObject functions
    var example3 = new KnackObject( {
      'appId'     : 'your knack API ID',
      'apiKey'    : 'your knack API key',
      'objectId'  : 'object_1',
    } );

    var rawfields3    = example3.getFields();
    var rawfields3a   = example3.getFields('object_2');

    var rawRecord3   = example3.getRecord('example1Record1');
    var rawRecord3a  = example3.getRecord('example2Record1', 'object_2');

    var knackObject3  = example3.get('example1Record2'); 
    var knackObject2b = example2.get('example2Record2', 'object_2');

    var templateString3   = example3.template('exampleRecord678911');
    var templateString3a  = example3.template( knackObject );

    $( document ).on( example3.eventTrigger('view_1'), example3.render( 'exampleRecord34567' ) );
    $( document ).on( example3.eventTrigger('view_2'), example3.render( knackObject3 ) );
    $( document ).on( example3.eventTrigger('view_3'), example3.render( templateString3 ) );

 
    // Example 4: autorun KnackObject.render when knack app renders 'view_1'
    $( document ).on( 'knack-page-render.view_1', function() {
      var example1 = new KnackObject( {
        'appId'     : 'your knack API ID',
        'apiKey'    : 'your knack API key',
        'objectId'  : 'object_1',
        'recordId'  : 'example1Record1',
        'renderNow' : true
    } );