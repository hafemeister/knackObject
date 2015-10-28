/*jslint debug: true, loopfunc: true */

/**
 * crawls through a knack object by making the dirty API queries to mimic full relational queru responces.
 * @param {object} options [ see prototype defaults for description ]
 * @example
 * ,,,javascript
 * var resume = new KnackObject({
    'debug'              : true,
    'appId'              : '562c434ff0d6ccc53cd77925',
    'apiKey'             : '652e2800-7d44-11e5-90be-45cb5dc27cc2',
    'objectId'           : 'object_8',
    'recordId'           : document.URL.split('#view/')[1],
    'viewId'             : 'scene_67',
    'templateSkipRecord' : 'identifier',
});

$( document ).on( resume.eventTrigger, resume.render );
 */

( function( window, $, undefined ) {
  'use strict';

  window.KnackObject = function(options) {

    /**
     * creates a new object, based on the defaults extended by options.
     * @param  {object} defaults [ see prototype.defaults for descriptions ]
     * @param  {object|undefined} options  [ see examples ]
     * @return {object}          the defaults extended by options.
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
      this.settings.showSpinner.call();
      this.render();
      this.settings.hideSpinner.call();
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

      /* when rendering the object to HTML, skip any record with a label in this array */
      'templateSkipRecord' : [],

      /* when getting the records from the server, skip any record with a label in this array */
      'skipRecord'      : [],

      /* javascript to show a throbber while function runs */
      'showSpinner' : function() {Knack.showSpinner();},

      /* javascript to hide a throbber once function finishes */
      'hideSpinner'  : function() {Knack.hideSpinner();},
    },

    /**
       * recursivly coalates a knack object to show the field labels and the records
       * if the record data is a connection (relation), then coalate its data too
       * @requires  JQuery
       * @param  {string|undefined} objectId   @optional the identifier of the knack object to query
       * @param  {string|undefined} recordId   @optional the identifier of the record in the object to query
       * @param  {object|undefined} fieldnames @optional precomputing the fieldnames saves ajax requests
       * @return {object}                      the coalated object
       */
    get : function ( objectId, recordId, fieldnames ) {

      var _buffer = [];
      var _record = [];
      var childFieldNames = [];

      // get default values for passed variables if they are undefined
      if ( typeof objectId === 'undefined' ) {
        objectId = this.settings.objectId;
      }

      if ( typeof recordId === 'undefined') {
        recordId = this.settings.recordId;
      }

      // Get the field names for the object's fields if not provided
      // this saves pummeling the Knack API more than necessary
      if ( typeof fieldnames === 'undefined' ) {
        $.getJSON(
          'https://api.knackhq.com/v1/objects/' + objectId + '/fields',
          function( response ){

            // loop through the returned fields array of objects
            for ( var x = 0, l = response.fields.length; x < l; x++){

              // only copy the field is not supposed to be skipped
              if ( this.settings.skipRecord.indexOf( response.fields[x].label ) !== -1 ) {

                // then add the field to the buffer
                _buffer[x] = response.fields[x];
              }
            }
          }.bind(this)
        );
      } else {
        _buffer = fieldnames;
      }

      // get the specific data for the object fields
      $.getJSON(
        'https://api.knackhq.com/v1/objects/' + objectId + '/records/' + recordId,
        function(response) {
          _record = response;
        }
      );

      //loop through each field in the object
      for ( var x = 0, l = buffer.length; x < l; x++ ) {

        //if this field is not a connection (relational)
        if ( _buffer[x].type !== 'connection' ) {

          //then just store the server compiled html and raw data
          _buffer[x].html = _record[ _buffer[x].key ];
          _buffer[x].raw  = _record[ _buffer[x].key + '_raw' ];

        //otherwise this is a relational field (connection)
        } else {

          //create the connection array in this buffer element
          buffer[x].connection = [];

          //get the labels for the related records
          $.getJSON(
            'https://api.knackhq.com/v1/objects/' + buffer[x].relationship.object + '/fields',
            function(response) {
              childFieldNames = response.fields;
            }
          );

          //loop through each connection's records
          tempRecord[ buffer[x].key +'_raw' ].forEach( 
            function( child, index ) {

              //recursivly cooalate the connection's records
              buffer[x].connection[index]            = {};
              buffer[x].connection[index].records    = {};
              buffer[x].connection[index].records    = this.get( buffer[x].relationship.object, child.id, childFieldNames );
              buffer[x].connection[index].id         = child.id;
              buffer[x].connection[index].identifier = child.identifier;
            }, 
            this 
          );
        }
      }

      if ( 
        this.settings.debug && 
        typeof fieldnames === 'undefined'
      ) {
        console.log( 'Knack Object:' );
        console.log( buffer );
      }
      return buffer;
    },

    /**
     * recursively creates a string of HTML that represents the Knack object
     * @param  {array|object}          objects  array of knack objects
     * @param  {boolean|undefined}     level    @optional set to true if recursing
     * @return {string}                         HTML representing Knack object
     */
    template : function ( objects, recursionLevel ) {

      var
        _buffer = {},
        x,
        l;

      // get coallated object if object not passed as variable
      if ( typeof objects === 'undefined') {
        objects = this.get();
      } 

      // if objects is an array of objects,
      if ( objects.isArray() ) {

      // check for a special case
      // if there are 3 connection and they are labeled "Identifier", "Title" and "Details"
      // then render
        if (
          objects.connection.length   === 3 &&
          objects.connection[0].label === 'Identifier' &&
          objects.connection[1].label === 'Title' &&
          objects.connection[2].label === 'Detail'
        ) {
          _buffer += '<div class="knackObjectLabel">' + objects.connection[1].html + '</div>' +
            '<div class="knackObjectDetails">' + objects.connection[1].html + '</div>';

        // otherwise recurse through array of relational connection or records arrays
        } else {
          for ( x = 0, l = objects.length; x < l; x++ ) {

            // only recurse through records not in settings.templateSkipRecord
            if ( ! ( object[x].label in this.settings.templateSkipRecord ) ) {
              _buffer += this.template( objects[x], level );
            }
          }
        }

      // otherwise if the objects variable is an object,

      // check if objects variable is relational,(links to other objects)
      } else if ( objects.type === 'connection' ) {

        // create header based on level of relationship,
        if ( typeof recursionLevel === 'undefined' ) {
          _buffer += '<h3>' + objects.label + '</h3>';
        }

        // and recurse through objects connection
        for ( x = 0, l=  objects.connection.length; x < l; x++ ) {
          _buffer += template( objects.connection[x], 1 );
        }

      // otherwise, check if the objects variable has a "records" key
      // if it does, then we are inside a relational child
      // so recurse through the array of records
      } else if ( typeof objects.records !== 'undefined' ) {
          for ( x = 0, l=  objects.records.length; x < l; x++ ) {
          _buffer += template( objects.records[x], 1 );
        }

      // otherwise objects is not relational, add ojects' label and html details to template
      } else {
        _buffer += '<div><span class="knackObjectLabel">' + objects.label + '</span>' +
        '<span class="knackObjectDetails'> + objects.html + '</span></div>';
      }
      return _buffer;
    },

    /**
     * renders an html string into a Knack view
     *
     * @param  {string}            htmlString ...erm, this is a string of HTML
     * @param  {string|undefined}  elementId   @optional the HTML element ID to append the HTML to
     *                                         if no elementID is passed, then append an
     *                                         appropriatly wrapped element into the Knack view
     * @return {undefined}         
     */
    render : function ( htmlString, elementId ) {
      var $element = {};

      if ( typeof htmlString === 'undefined') {
        htmlString = this.template();
      }

      if ( typeof elementId === 'undefined' ) {
        elementId = this.settings.elementId;
      }

      $element = $( '#' + elementId );

      if ( $element.length ) {
        $element.append( htmlString );
      } else {
        $('.kn_scenes:first').append( '<div class="kn_scene"><div class="kn_view">' + htmlString + '</div></div>' );
      }
    },

    eventTrigger : function () {
      return 'knack-page-render.'+ this.settings. viewId;
    }
  };
}( window, window.Knack.$ ) );