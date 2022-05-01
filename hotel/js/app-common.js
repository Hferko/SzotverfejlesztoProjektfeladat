;(function(window, angular) {

  'use strict';

  // Application common module
  angular.module('app.common', [])

  // Capitalize
  .filter('capitalize', [
    'type', 
    function(type) {
      return function(str) {
        if (!type.isString(str))  return "";
        str = str.trim();
        if      (str.length == 0) return str;
        else if (str.length == 1) return str.toUpperCase();
        else return str.charAt(0).toUpperCase() + 
                    str.substr(1).toLowerCase();
      }
    }
  ])

  // Number thousand separator
  .filter('num-sep', [
    'type',
    function (type) {
      return function(number, separator) {
      
		  	// Check parameters
		  	if (!type.isNumber(number)) number = 0;
		  	if (!type.isString(separator)) separator = ' ';
      
		  	// Return number thousand separated
        return number.toString()
		  							 .replace(/(\d)(?=(\d{3})+(?!\d))/g,
		  											'$1' + separator.charAt(0)); 
      };
    }
  ])

  // Number leading zero
  .filter('numPad', [
    'type',
    function (type) {
      return function(number, len) {
      
		  	// Check parameters
		  	if (!type.isNumber(number)) number = 0;
        if (!type.isNumber(len) || len < 2) len = 2;

        // Return number leading zero
        return ('0'.repeat(len) + number.toString()).slice (-1 * len);
      };
    }
  ])

  // Room properties
  .filter('roomProp', [
    'type',
    function (type) {
      return function(obj) {
        
        // Check valid
        if (type.isObject(obj)) {
          let keys = ['id','img','type','floor','television','description',
                      'airConditioner','WiFi','extraBed','title'];
          return Object.keys(obj).filter((k) => keys.includes(k))
                       .reduce((o, k) => { 
                         return Object.assign(o, {[k]: obj[k] })
                        }, {});
        } else return obj;
      };
    }
  ])

  // Check variable type
  .factory('type', [ 
    function() {

      // Set service
      let service = {

        // Check variable is undefined
        isUndefined: function(checkedVar) {
          return (Object.prototype.toString.call(checkedVar) === '[object Undefined]');
        },

        // Check variable is boolean
        isBoolean: function(checkedVar) {
          return (Object.prototype.toString.call(checkedVar) === '[object Boolean]');
        },
        
        // Check variable is number
        isNumber: function(checkedVar) {
          return (Object.prototype.toString.call(checkedVar) === '[object Number]');
        },

        // Check variable is number or string number
        isVarNumber: function(checkedVar) {
          return service.isNumber(checkedVar) ||
					      (service.isString(checkedVar) &&
						!isNaN(Number(checkedVar)));
        },

        // Check variable is integer
        isInt: function(checkedVar) {
          return service.isNumber(checkedVar) && checkedVar % 1 === 0;
        },

        // Check variable is float
        isFloat: function(checkedVar) {
          return service.isNumber(checkedVar) && checkedVar % 1 !== 0;
        },

        // Check variable is string
        isString: function(checkedVar) {
		      return (Object.prototype.toString.call(checkedVar) === '[object String]');
        },

        // Check variable is array
        isArray: function(checkedVar) {
          return (Object.prototype.toString.call(checkedVar) === '[object Array]');
        },

        // Check variable is object
        isObject: function(checkedVar) {
          return (Object.prototype.toString.call(checkedVar) === '[object Object]');
        },

        // Check variable is json string
        isJson: function(checkedVar) {
          if (service.isString(checkedVar)) {
            try {
              let value = JSON.parse(checkedVar);
              return !service.isUndefined(value);
            } catch (e) {return false;}
          } else return false;
        },
      
        // Check variable is null
        isNull: function(checkedVar) {
          return (Object.prototype.toString.call(checkedVar) === '[object Null]');
        },

        // Check variable is function
        isFunction: function(checkedVar) {
          return (Object.prototype.toString.call(checkedVar) === '[object Function]');
        },

        // Check variable is jquery nod element
        isNodElement: function(checkedVar, nodType) {
          nodType = service.isNumber(nodType) && nodType >= 1 ? parseInt(nodType) : 1;
          if (service.isObject(checkedVar)) {
                  return  checkedVar.length > 0 && 'nodeType' in checkedVar.get(0) && 
                          checkedVar.get(0).nodeType === nodType;
          } else  return  false;
        },

        // Check variable is dom element
        isDomElement: function(checkedVar, nodType) {
          nodType = service.isNumber(nodType) && nodType >= 1 ? parseInt(nodType) : 1;
          if (service.isObject(checkedVar))
                return 'nodeType' in checkedVar && checkedVar.nodeType === nodType;
          else  return false;
        },

        // Check variable is valid email
        isEmail: function(checkedVar) {
          var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/; 
          return regex.test(checkedVar);
        },
      };

      // Return scope
      return service;
    }
  ])

  // Utilities
  .factory('util', [
    'type', 
    function(type) {

      // Set service
      let service = {
      
        // Check object has key property
        isObjectHasKey: function(checkedVar, key) {
          if (!type.isObject(checkedVar)) return false
          if (!type.isString(key)) return false
          return key in checkedVar
        },

        // Deep merge two objects
        objectMerge: function(target, source, isExistKeys=false) {

          //Check parameters
          if (!type.isObject(target))       target      = {};
          if (!type.isObject(source))       source      = {};
          if (!type.isBoolean(isExistKeys)) isExistKeys = false;

          // Get source keys, keys count, and define deferred object completed
          let keys      = Object.keys(source),
              keysCount = keys.length,
              completed	= new $.Deferred();

          // Check not empty
          if (keysCount > 0) {

            // Each source keys
            $.each(keys, function(i, key) {

              // Check target key property exist
              if (service.isObjectHasKey(target, key)) {

                // Check target key property is not null
                if (!type.isNull(target[key])) {

                  // Check target key type is same source key type
		    	  		  if (typeof target[key] === typeof source[key]) {

                    // Check source key type is object
                    if (type.isObject(source[key])) {

                      // Merge objects key recursive
                      service.objectMerge(target[key], source[key], isExistKeys)
                             .done( function(response) {
                          
                        // Set target key
                        target[key] = response

                        // Check completed
                        if (!--keysCount) {
                          completed.resolve(target);
                          return false
                        }
                      });
                    } else  target[key] = source[key];
                  }
                } else  target[key] =  source[key];
              } else if (!isExistKeys) target[key] = source[key];

              // Check completed
              if (!--keysCount) completed.resolve(target);
            });
          } else completed.resolve(target);

          // When completed return
		      return $.when(completed).done().promise();
        },

        // Get index of array object key value
        indexOfKey: function(arr, key, id=null) {

          // Define deferred object completed
          let completed	= new $.Deferred();

          // Check parameters
          if (type.isArray(arr) && arr.length > 0 && 
              type.isString(key)) {

            // Get count of array
            let count = arr.length;

            // Each array item
            $.each(arr, function(i, obj) {

              // Check found
              if (service.isObjectHasKey(obj, key) && obj[key] === id)
                                  completed.resolve(i);
              else if (!--count)  completed.resolve(-1);
            });
          } else completed.resolve(-1);

          // When completed return
		      return $.when(completed).done().promise();
        },

        // Copy object
        objectCopy: function(source) {
          if (!type.isObject(source)) return source;
          return JSON.parse(JSON.stringify(source));
        },

        // Capitalize
        capitalize: function(str) {
          return str.charAt(0).toUpperCase()+str.slice(1).toLowerCase();
        },

        // Sleep until 
        sleepUntil: function(options, condition, element) {
          
          // Define deferred object completed
          let completed	= new $.Deferred();

          // Check options
          if (type.isString(options))
            options = {errorMsg: options};
          else if (type.isBoolean(options))
            options = {showError: options};
          else if (type.isNumber(options) && parseInt(options) > 0)
            options = {delay: parseInt(options)};

          // Get options, and merge with defaults
          service.objectMerge({
            timeout: 6000,
            delay: 1,
            showError: true,
            errorMsg: null
          }, options, true).done(function(options) {

            // Define counter, and interval identifier
            let counter 		= 0,
                intervalId	= null;

            // Execute condition
            let execute = function (condition) {

              // Define deferred object completed
              let completed	= new $.Deferred();

              // Call method
              condition().done( function (response) {

                // Check response type valid
                if (type.isBoolean(response))
                      completed.resolve(response);
                else	completed.resolve(false);
              });

              // When completed return
              return $.when(completed).done().promise();
            };

            // Show error
            let showError = function(msg=null) {
              if (!type.isString(msg))
                msg = "TIME OVERFLOW !";
              else  options.showError = true;
              if (type.isString(options.errorMsg))
                msg += ("\n"  + options.errorMsg);
              if (options.showError)
                console.log(msg + options.errorMsg);
            };

            // Check condition function valid
            if (type.isFunction(condition)) {

              // Check condition immediately
              execute(condition).done( function (isConditionOk) {

                // Check if necessary to sleep
                if (!isConditionOk) {

                  // Check element exist
                  if (type.isNodElement(element)) {

                    // Set event once to weak up
                    element.one('sleepWeakUp', function (event) {

                      // Event prevent default
                      event.preventDefault();

                      // Clear interval
                      clearInterval(intervalId);

                      // Resolve completed
                      completed.resolve(true);
                    });
                  }

                  // Set interval to check ready
                  intervalId = setInterval( function() {

                    // Check condition again, and again...
                    execute(condition).done( function(isConditionOk) {

                      // Check it`s time to weak up
                      if  (isConditionOk || 
                          (counter += options.delay) > options.timeout) {

                        // Check element exist, then remove event weak up
                        if (type.isNodElement(element))
                          element.off('sleepWeakUp');

                        // Clear interval
                        clearInterval(intervalId);

                        // If overflow
                        if (!isConditionOk) showError()

                        // Resolve completed
                        completed.resolve(isConditionOk);
                      }
                    });
                  }, options.delay);

                  // Resolve completed
                }	else completed.resolve(true);
              });
            } else {
              showError('Condition function not valid!');
              completed.resolve(false);
            }
          });
          
          // When completed return
          return $.when(completed).done().promise();
        },

        // Add remove class
        addRemoveClass: function (terms) {
          return terms ? 'addClass' : 'removeClass';
        }
      };

      // Return service
      return service;
    }
  ])
  
  // Http factory
  .factory('http', [
    '$rootScope',
    'type', 
    'util', 
    function($rootScope, type, util) {
    
      // Set service
      let service = {
      
        // Check arguments
        checkArguments: function(args) {

          // Define deferred object completed
          let completed = new $.Deferred();

          // Chec arguments has not args property
          if (!util.isObjectHasKey(args, 'args')) {

                  // Set arguments
                  args = {args: args};

                  // Resolve completed
                  completed.resolve(args);
          } else  completed.resolve(args);

          // Return when completed
		      return $.when(completed).done().promise();
        },

        // Check options
        checkOptions: function(options) {

          // Define deferred object completed
          let completed = new $.Deferred();

          // Check/Convert options
          if (type.isString(options))
            options = {url:options.trim()};
          else if (type.isBoolean(options))
            options = {isAsync:options};

          // Merge options with default
          util.objectMerge({
            url						: './py/common.py',
            ajaxType    	: 'GET',
		    	  ajaxSetup			: false,
            isAsync     	: true,
		    	  crossDomain 	: true,
		    	  timeout     	: 300000,
            cache       	: true,
            contentType 	: undefined,
            processData 	: true,
            dataType    	: undefined,
          }, options, true).done( function(options) {

            // Check ajax type
            options.ajaxType = options.ajaxType.trim().toUpperCase();
            if (!['GET','POST'].includes(options.ajaxType))
              options.ajaxType = 'GET';

            // Resolve completed
            completed.resolve(options);
          });

          // Return when completed
		      return $.when(completed).done().promise();
        },

        // Check/Set response
        checkResponse: function(response) {

          // Define deferred object completed
          let completed = new $.Deferred();

          // When response is JSON, then parse
          if (type.isJson(response))
            response = JSON.parse(response);

          // Check is response standard type
          if (util.isObjectHasKey(response, "isError") &&
              util.isObjectHasKey(response, "data")) {
              
            // Check is error
            if (response.isError) {

              // Check error message exist
              if (!util.isObjectHasKey(response, "errorMsg")) {
                response.errorMsg = "Unknown error occurred!";
                response.langId   = "unknownError";
              } else if (!util.isObjectHasKey(response, "langId"))
                response.langId   = null;

              // Show error message
              $rootScope.methods.showMessage({
                icon: "fas fa-exclamation-circle text-danger",
                langId: "error",
                content: [{
                  text:response.errorMsg, 
                  langId:response.langId, 
                  ngClass:"fs-3"
                }],
                btn: [{langId:"ok",ngClass:"btn-primary"}]
              }); 

                    // Resolve completed
                    completed.resolve(null);
            } else  completed.resolve(response.data);
          } else    completed.resolve(response);

          // Return when completed
		      return $.when(completed).done().promise();
        },

        // Requiest
        requiest: function(args, options=null) {

          // Define deferred object completed
          let completed = new $.Deferred();

          // Check arguments
          service.checkArguments(args).done(function(args) {

            // Check options
            service.checkOptions(options).done(function(options) {

              // Set json data, clear data properties
		    			let jsonData = {data: JSON.stringify(args)};
		    			args = undefined;

              // Http requiest
              $.ajax({
                type    		:	options.ajaxType,
		    	  		url     		:	options.url,
		    	  		async   		:	options.isAsync,
		    	  		crossDomain	:	options.crossDomain,
		    	  		timeout			:	options.timeout,
		    	  		cache       :	options.cache,
		    	  		contentType :	options.contentType,
		    	  		processData :	options.processData,
		    	  		dataType    :	options.dataType,
                data    		:	jsonData,
                success :	function(response) {

                  // Liberate memory
		    					jsonData  = undefined;
                  options   = undefined

                  // Check/Set response
                  service.checkResponse(response).done(function(result) {

                    // Resolve completed
                    completed.resolve(result);                  
                  });
                },

                // Error
                error: function(jqXHR) {

                  // Show error
                  console.log(jqXHR.statusText);

                  // Resolve completed
                  completed.resolve(null);
                }
              });
            });
          });

          // Return when completed
		      return $.when(completed).done().promise();
        }
      };

      // Return scope
      return service;
    }
  ])

  // Language factory
  .factory('lang', [
    '$rootScope',
    '$timeout', 
    'http',
    'type', 
    'util', 
    function($rootScope, $timeout, http, type, util) {

      // Set service
      let service = {

        // Get html language property
        getId: function() {
          return $('html').get(0).lang
        },

        // Set html language property
        setId: function(id) {
          $('html').get(0).setAttribute('lang', id);
        },

        // Set title
        setTitle: function() {

          // Get title, and check exist
		  		let title = $('html').find('title').first();
		  		if (type.isNodElement(title)) {
          
		  			// Get attribute language key, and check exist
		  			let langKey = title.data('langKey');
		  			if (type.isString(langKey) &&
                util.isObjectHasKey($rootScope.lang.data, langKey)) {

              // Set title
		  				title.text(util.capitalize($rootScope.lang.data[langKey]));
            }
          }
        },

        // Change language
        change: function(id) {

          // Define deferred object completed
          let completed = new $.Deferred();

          // Check languege id
          if (!type.isString(id))
            id = $rootScope.lang.id;

          // Set language id
          service.setId(id);

          // Set language index
          service.setIndex().done(function() {

            // Get data
            service.getData().done(function() {

              // Set title, and resolve completed
              service.setTitle()
              completed.resolve();
            });
          });

          // Return when completed
		      return $.when(completed).done().promise();
        },

        // Set language index
        setIndex: function() {
        
          // Define deferred object completed
          let completed = new $.Deferred();

          // Get index of current language id from available language
          util.indexOfKey($rootScope.lang.available, 'id', $rootScope.lang.id)
              .done( function(index) {

            // Set index, and resolve completed
            $rootScope.lang.index = index;
            completed.resolve();
          });

        // Return when completed
		    return $.when(completed).done().promise();
        },

        // Get language data
        getData: function() {

          // Set language file, and define deferred object completed
          let url = './lang/' + $rootScope.lang.id + '.json',
              completed = new $.Deferred();

          // Get language data
          http.requiest(null, {
            url     : url,
            dataType: "json"
          }).done(function(data) {

            // Set language data
            $rootScope.lang.data = data;
            $rootScope.$applyAsync();

            // Reset asynchronicity
            $timeout( function() {
              
              // Trigger event language changed
              $rootScope.$broadcast('languageChanged');

              // Resolve completed
              completed.resolve();

            }, 100);
          });

          // Return when completed
		      return $.when(completed).done().promise();
        }
      };

      // Return service
      return service;
    }
  ])

  // Scroll to
  .directive('ngScrollTo', [
    'type',
    '$location', 
    '$anchorScroll',
    function(type, $location, $anchorScroll) {
      return {
        link: function(scope, element, attrs) {
          if (type.isString(attrs.ngScrollTo)) {
            element.off('click')
                    .on('click', function(event) {
              event.preventDefault();
              $location.hash(attrs.ngScrollTo);
              $anchorScroll();      
            });
          }
        }
      };
  }])

  // Change state
  .directive('ngChangeState', [
    '$state',
    '$rootScope', 
    function($state, $rootScope) {
      return {
        link: function() {

          // Set current, and previous state identifier
          $rootScope.state = {
            id  : $state.current.name,
            prev: $rootScope.state.id
          };

          // Trigger event state changed
          $rootScope.$broadcast('stateChanged');
        }
      };
  }])

  // Language name
	.directive('ngLangName', [
    '$rootScope',
    '$timeout',
    'type',
    'util',
    function($rootScope, $timeout, type, util) {
      return {
        restrict: 'EA',
        scope: {},
        template: '<span ng-if="rule.key!=null">' +
                    '<span class="me-1" ' + 
                          'ng-repeat="k in rule[rule.key]" ' +
                          'data-name-type="{{k}}" ' + 
                          'ng-if="name[k]">' +
                      '{{name[k]}}' +
                    '</span>' +
                  '</span>',
        link: function(scope, element, attrs) {
          
          // Set rule key
          let setRuleKey = function(key) {

            // Check is changed
            if (scope.rule.key !== key) {

              // Set language type key, and apply change
              scope.rule.key = key;
              scope.$applyAsync();
            }
          };

          // Set rule
          scope.rule = {
            west:['prefix','first','middle','last','postfix'],
            east:['prefix','last','middle','first','postfix'],
            key: null
          };

          // Get/Convert name properties
          let name = attrs.ngLangName;
          if (type.isJson(name))
            name = JSON.parse(name);

          // Check name properties
          if (type.isString(name))
            name = {first:name};
          
          // Merge name properties with default
          util.objectMerge({
            first: null,
            last: null,
            middle: null,
            prefix: null,
            postfix: null
          }, name, true).done( function(name) {

            // Set name
            scope.name = name;
            name = undefined;

            // Sleep until language initialized
            util.sleepUntil(null, function () {
              let completed = new $.Deferred();
              completed.resolve(util.isObjectHasKey($rootScope, 'lang'));
              return $.when(completed).done().promise();			
            }).done(function(success) {
              if (success && $rootScope.lang.index !== -1) 
                setRuleKey($rootScope.lang.available[$rootScope.lang.index].type);
            });
            
            // Set events on language changed
					  scope.$on('languageChanged', function () {
              if ($rootScope.lang.index !== -1)
                setRuleKey($rootScope.lang.available[$rootScope.lang.index].type);
            });
          });
        }
      };
    }
  ]);

})(window, angular);