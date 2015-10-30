/*jslint debug: true, loopfunc: true */

/**
 * crawls through a knack object by making the dirty API queries to mimic full relational queru responces.
 * @param {object} options [ see prototype defaults for description ]
 * @author Jason O'brien 
 * @licence MIT license
 */

( function( window, $, undefined ) {
  'use strict';

  window.KnackObject = function(options) {

    /**
     * creates a new object, based on the defaults extended by options.
     * @param  {object}           defaults [ see prototype.defaults for descriptions ]
     * @param  {object|undefined} options  [ see examples ]
     * @return {object}           the defaults extended by options.
     */
    function extend ( defaults, options ) {
      var extended = Object.create( defaults );
      if ( typeof options !== 'undefined' ) {
        Object
        .keys( options )
        .map( function ( key ) {
          if ( key in extended ) {
            extended[key] = options[key];
          }
        } );
      }
      return extended;
    }

    this.settings = extend( this.defaults, options );

    $.ajaxSetup( {

      type    : 'GET',
      cache   : true,
      async   : false,
      headers : {
        'X-Knack-Application-Id': this.settings.appId,
        'X-Knack-REST-API-Key'  : this.settings.apiKey
      }
    } );

    if ( this.settings.renderNow === true ) {
      //this.settings.showSpinner.call();
      this.render();
      //this.settings.hideSpinner.call();
    }
  };

  KnackObject.prototype = {

    constructor : KnackObject,

    defaults : {

      /* set to true to throw console logs & throw debugger requests */
      'debug'     : false,

      /* set to true get object and render as soon as the function is instantiated */
      'renderNow' : false,

      /* your knack API credentials @link @TODO: get link */
      'appId'     : '',
      'apiKey'    : '',

      /* the knack object you want to query and render */
      'objectId'  : '',

      /* the identifier of the resume to render, fetched from the URL Hash Parameter */
      'recordId'  : '',

      /* the knack view that we will dynamically render the object's html into */
      'viewId'    : '',

      /* the element ID to render object into */
      'elementId' : '',

      /* when getting the records from the server, skip any record with a label in this array */
      'skipRecord'    : [],

      'templateKey'   : 'Title',
      'templateValue' : 'Details',

      /* javascript to show a throbber while function runs */
      'showSpinner' : function() {Knack.showSpinner();},

      /* javascript to hide a throbber once function finishes */
      'hideSpinner'  : function() {Knack.hideSpinner();},
    },

    /**
     * gets the fields (labels) of a knack API object
     * @requires  JQuery
     * @param     {string} objectId the ID string of the knack API object @example 'object_2'
     * @return    {array}           array of field description objects
     */
    getFields : function( objectId ){

        var _fields = [];
        var _this = this;

        $.getJSON(
          'https://api.knackhq.com/v1/objects/' + objectId + '/fields',
          function( response ){
            _fields = response.fields.filter( function( field ) {
              return _this.settings.skipRecord.indexOf( field.label ) === -1;
            } );
        } );

        return _fields;
      },

    /**
     * gets a specific record from the knack API
     * @requires JQuery
     * @param    {string} recordId the record ID to get data for   @example 'aeei4858D38rgjr3'
     * @param    {string} objectId the name of the object to query @example 'object_2'
     * @return   {array}           an array of knackAPI record objects
     */
    getRecord : function ( recordId, objectId ) {

      var _record= [];

      // get the specific data for the record fields
      $.getJSON(
        'https://api.knackhq.com/v1/objects/' + objectId + '/records/' + recordId,
        function( response ) {
          _record = response;
        }
      );

      return _record;

    },

    /**
       * recursivly coalates a knack object to show the field labels and the records
       * if the record data is a connection (relation), then coalate its data too
       * @param  {string|undefined} objectId   @optional the identifier of the knack object to query
       * @param  {string|undefined} recordId   @optional the identifier of the record in the object to query
       * @param  {object|undefined} fieldnames @optional precomputing the fieldnames during recursion saves ajax requests
       * @return {object}                      the coalated object
       */
    get : function ( recordId, objectId, fieldnames ) {

      var _buffer = [];
      var _records = [];
      var _fieldNames = [];
      var _childFieldNames = [];


      if ( typeof recordId === 'undefined') {
        recordId = this.settings.recordId;
      }

      // get default values for passed variables if they are undefined
      if ( typeof objectId === 'undefined' ) {
        objectId = this.settings.objectId;
      }

      // Get the field names for the object's fields if not provided
      // this saves pummeling the Knack API more than necessary
      if ( typeof fieldnames === 'undefined' ) {
        _fieldNames = this.getFields( objectId );
      } else {
        _fieldNames = fieldnames;
      }

      _records = this.getRecord( recordId, objectId );

      //loop through each field object in the array
      for ( var x = 0, l = _fieldNames.length; x < l; x++ ) {

        _buffer[x] = _fieldNames[x];

        //if this field is a connection (relational)
        if ( _fieldNames[x].type === 'connection' ) {

          _childFieldNames = this.getFields( _fieldNames[x].relationship.object );

          _buffer[x].connections = [];

          // loop through each connection's records and get the "raw" data
          // their naming convention looks like this "field_21_raw"
            _records[ _fieldNames[x].key +'_raw' ].forEach( function( record, index ) {

              //recursivly cooalate the connection's records
              _buffer[x].connections[index]            = {};
              _buffer[x].connections[index].records    = [];
              _buffer[x].connections[index].id         = record.id;
              _buffer[x].connections[index].identifier = record.identifier;
              _buffer[x].connections[index].records    = this.get(
                  record.id,
                  _fieldNames[x].relationship.object,
                  _childFieldNames
              );

            }, this );

        //otherwise the record is not relational, get html and raw data
        } else {
          _buffer[x].html = _records[ _fieldNames[x].key ];
          _buffer[x].raw  = _records[ _fieldNames[x].key + '_raw' ];
        }
      }

      if (
        this.settings.debug &&
        typeof fieldnames === 'undefined'
      ) {
        console.log( 'Knack Object:' );
        console.log( _buffer );
      }
      return _buffer;
    },

    /**
     * recursively creates a string of HTML that represents the Knack object
     * @param  {Array|Object|string|undefined}    objects  @optional array of knack objects
     * @param  {boolean|undefined}                level    @optional set to true if recursing
     * @return {string}                                    HTML representing Knack object
     */
    template : function ( objects, recursionLevel ) {

      var
        _buffer = '',
        x,
        l;

      // get coallated object if object not passed as variable
      if ( typeof objects === 'undefined') {
        objects = this.get();

      // if objects is a string, then assume its a record ID 
      // get the knack object for that record id
      // assume the settings.objectID is set
      } else if ( typeof objects === 'string' ) {
        objects = this.get(objects);
      }

      if ( typeof recursionLevel === 'undefined' ) {
        recursionLevel =0;
      }

      // if objects is an array of objects, loop through them
      if ( Array.isArray( objects ) ) {

        for ( x = 0, l = objects.length; x < l; x++ ) {
            _buffer += this.template( objects[x], recursionLevel );
        }

      // otherwise if the objects is an... object,
      // check if objects variable is relational,(links to other objects)
      // @todo add object test
      } else {
        if( objects.type === 'connection' ) {


            // create header based on level of relationship,
            if ( recursionLevel === 0 ) {
              _buffer += '<h2>' + objects.label + '</h2>';
            }

            // and recurse through objects connection
            for ( x = 0, l=  objects.connections.length; x < l; x++ ) {
              _buffer += this.template( objects.connections[x], 1 );
            }
    

        // otherwise, check if the objects variable has a "records" array of objets
        // if it does, then we are inside a relational child
        // so recurse through the array of records
        } else if ( typeof objects.records !== 'undefined' ) {
          
          //check for special case
          if ( 
            this.settings.templateValue &&
            this.settings.templateKey &&
            objects.records.length   === 2 &&
            objects.records[0].label === this.settings.templateKey &&
            objects.records[1].label === this.settings.templateValue
          ) {
            _buffer += '<div class="kn-label">' + objects.records[0].html + '</div>';
            _buffer += '<div class="kn-value">' + objects.records[1].html + '</div>';
          } else if (
            this.settings.templateValue &&
            objects.records.length   === 1 &&
            objects.records[0].label === this.settings.templateValue
          ) {
            _buffer += '<div class="kn-value">' + objects.records[0].html + '</div>';

          // otherwise recurse through array of relational connection or records arrays
          } else {
            for ( x = 0, l=  objects.records.length; x < l; x++ ) {
              _buffer += this.template( objects.records[x], 2 );
            }
          }

        // otherwise objects is not relational, add ojects' label and html details to template
        } else if (
          typeof objects.label !== 'undefined' &&
          typeof objects.html  !== 'undefined'
        ) {

          var temp2 = objects.label;
          var temp3 = objects.html;
          var temp4 =  '<span class="kn-label">' + temp2 + '</span>';
          var temp5 =  '<span class="kn-value">' + temp3 + '</span>';


          _buffer += '<div>' + temp4 + temp5 + '</div>';
        } else {
          // @todo proper error
          console.log('Knack Object: unexpected error');
        }
      }

      if ( 
        this.settings.debug === true &&
        recursionLevel === 0
      ) {
        console.log( 'KnackObject HTML Template' );
        console.log( _buffer );
      }
      return _buffer;
    },

    /**
     * renders an html string into a Knack view
     * @requires  JQuery
     * @param     {string|array}      html       @optional if array, then html is a KnackObject: get string and render, 
     *                                           if string: render string
     * @param     {string|undefined}  elementId  @optional the HTML element ID to append the HTML to
     *                                           if no elementID is passed, then append an
     *                                           appropriatly wrapped element into the Knack view
     * @return    {undefined}
     */
    render : function ( html, elementId ) {
      var $element = {};
      var htmlString = '';

      if ( typeof html === 'undefined' ) {
        htmlString = this.template();
      } else if ( Array.isArray( html ) ) {
        htmlString = this.template( html );
      } else if ( typeof html === 'string' ) {
        htmlString = html;
      } else {
        console.log('unexpected type');
      }

      if ( typeof elementId === 'undefined' ) {
        $element = $('.kn-scenes:first');
      } else {
        $element = $( '#' + elementId );
      }

      if ( $element.length ) {
        $element.append( htmlString );
      
        //$('.kn-scenes:first').append( '<div class="kn_scene"><div class="kn_view">' + htmlString + '</div></div>' );
      }
    },

    eventTrigger : function ( viewId ) {
      if ( typeof viewId === 'undefined') {
        viewId = this.settings.viewId;
      }
      return 'knack-page-render.'+ viewId;
    }
  };
}( window, window.Knack.$ ) );