;(function(window, angular) {

  'use strict';

  // Application module
  angular.module('app', [
    'ui.router',
    'app.common'
  ])

  /* Application config */
  .config([
    '$stateProvider', 
    '$urlRouterProvider', 
    function($stateProvider, $urlRouterProvider) {

      $stateProvider
        .state('home', {
          url: '/',
          templateUrl: './html/home.html',
          controller: 'homeController'
        })
        .state('gallery', {
          url: '/gallery',
          templateUrl: './html/gallery.html',
          controller: 'galleryController'
        })
        .state('login', {
          url: '/login',
          templateUrl: './html/login.html',
          controller: 'loginController'
        })
        .state('register', {
          url: '/register',
          templateUrl: './html/register.html',
          controller: 'registerController'
        })
        .state('reservation', {
          url: '/reservation',
          templateUrl: './html/reservation.html',
          controller: 'reservationController'
        });
      
      $urlRouterProvider.otherwise('/');
    }
  ])

  // Application run
  .run([
    '$rootScope',
    '$timeout',
    'util',
    'http', 
    'lang', 
    function($rootScope, $timeout, util, http, lang) {
      
      // Set current state
      $rootScope.state = {id: null};

      // Set frirst run
      $rootScope.firstRun = true;

      // Set user identifier
      $rootScope.user = {id: 0};

      // Get html language identifier
      let langID = lang.getId();

      // Get language properties
      http.requiest({
        moduleName  : 'language',
        className   : 'Language',
        methodName  : 'get_properties',
        argsToClass : true,
        args        : langID
      }).done(function(data) {

        // Merge language properties with default
        util.objectMerge({
          id: null,
          available: [],
          index: -1,
          data: null
        }, data, true).done(function(data) {

          // Set language properties, and apply change
          $rootScope.lang = data;
          $rootScope.$applyAsync();

          // Reset asynchronicity
          $timeout( function() {

            // Check language identifier changed
            if ($rootScope.lang.index !== -1 && 
              $rootScope.lang.id !== langID) {

              // Set html title
              lang.setTitle();
            }

            // Trigger event language changed
            $rootScope.$broadcast('languageChanged');

          }, 100);
        });
      });
    }
  ])
  
  // Application controller
  .controller('appController', [
    '$rootScope',
    '$state',
    '$element',
    '$timeout',
    'util',
    'type',
    'lang',
    function($rootScope, $state, $element, $timeout, util, type, lang) {

      // Set common methods
      $rootScope.methods = {
        
        // Check is first run
        isFirstRun: function() {

          // Check is frirst run
          if ($rootScope.firstRun) {

            // Set frirst run to false
            $rootScope.firstRun = false;

            // When state is not home, then go to home
            if ($state.current.name !== 'home') {
                    $state.go('home');
                    return true;
            } else  return false;
          } else    return false;
        },

        // Change language
        changeLanguage: function(event) {
          
          // Get item identifier
          $rootScope.lang.id = $(event.currentTarget).data('itemId');

          // Change language
          lang.change().done( function() {
            $rootScope.$applyAsync();
          });
        },

        // Logout
        logout: function(event) {
          $rootScope.user = {id: 0};
          $rootScope.$applyAsync();
        },

        // Show page
        showPage: function() {
          
          // Reset asynchronicity
          $timeout(function () {

            // Apply change again
            $rootScope.$applyAsync();

            // Get page container, and add class show
            $element.find('#page-container')
                    .first().addClass('show');
          }, 100);  
        },

        // Previous state
        prevState: function() {
          if (util.isObjectHasKey($rootScope.state, 'prev') &&
                                  $rootScope.state.prev)
                $state.go($rootScope.state.prev);
          else  $state.go('home');
        },

        // Set modal
        modal: function(id) {

          // Reset asynchronicity
          $timeout( function() {
            
            // Get modal element, and check exist
            let element = $('body').find('#' + id).first();
            if (type.isNodElement(element)) {
            
              // Create new nodal
              $rootScope[id] = new bootstrap.Modal(element.get(0), {
                keyboard: false
              });
            } else $rootScope[id] = null;
          });
        },

        // Show dialog room properties
        showDialog: function(event) {
          
          // When dialog modal is not exist, then create it
          if (!util.isObjectHasKey($rootScope, 'dialog') ||
              !util.isObjectHasKey($rootScope.dialog, '_dialog'))
            $rootScope.methods.modal('dialog');

          // Reset modal data
          $rootScope.room = null;
        
          // Get/Check current element
          let element = $(event.currentTarget);
          if (type.isNodElement(element)) {
            
            // Get/Set room properties, and apply change
            $rootScope.room = element.data('room');
            $rootScope.$applyAsync();
          
            // Reset asynchronicity, and show dialog
            $timeout( function() {

              // Check exist
              if (util.isObjectHasKey($rootScope.dialog, '_dialog'))
                    $rootScope.dialog.show();
              else  console.log('Modal dialog is not exist!')
            });
          }
        },

        // Show message
        showMessage: function(msg) {
          
          // When message modal is not exist, then create it
          if (!util.isObjectHasKey($rootScope, 'message') ||
              !util.isObjectHasKey($rootScope.message, '_dialog'))
            $rootScope.methods.modal('message');

          // Merge message properties with default
          util.objectMerge({
            icon: '',
            title: '',
            langId: null,
            content: null,
            btn: null
          }, msg, true).done( function(msg) {

            // Define deferred object completed
            let keys      = ['content','btn'],
                count     = keys.length,
                completed = new $.Deferred();

            // Check properties
            $.each(keys, function(i, key) {

              // Convert type
              if (type.isString(msg[key]))
                msg[key] = [{text:msg[key]}]

              // Check has items
              if (type.isArray(msg[key]) && msg[key].length > 0) {

                // Merge items with default property 
                $.each(msg[key], function(j, item) {
                  util.objectMerge({
                    text:'',
                    langId:null,
                    ngClass:'',
                  }, item, true).done( function(item) {

                    // Set item, and check completed
                    msg[key][j] = item
                    if (!--count) completed.resolve()
                  });
                });
              } else if (!--count) completed.resolve()
            });

            // When completed
		        $.when(completed).done( function() {

              // Set message data
              $rootScope.msg = msg;

              // Apply change
              $rootScope.$applyAsync();

              // Reset asynchronicity, and show message
              $timeout( function() {

                // Check modal is not exist
                if (util.isObjectHasKey($rootScope.message, '_dialog'))
                      $rootScope.message.show();
                else  console.log('Modal message is not exist!')
              });
            });
          });
        },

        // Get test code
	      getCode: function (codeLength) {
        
	      	/* Check parameters */
	      	codeLength = type.isNumber(codeLength) && codeLength > 0 ? codeLength : 5;
	      	codeLength = codeLength <= 34 ? codeLength : 34;
        
	      	let letters		= 'ABCDEFGHJKMNPQRSTUVWXYZ'.split(''),
	      			numbers		= '123456789'.split(''),
	      			testCode	= [];
        
	      	let ind = Math.floor(Math.random()*letters.length);
	      	testCode.push(letters[ind]);
	      	letters.splice(ind, 1);
        
	      	ind = Math.floor(Math.random()*letters.length);
	      	testCode.push(letters[ind].toLowerCase());
	      	letters.splice(ind, 1);
        
	      	ind = Math.floor(Math.random()*numbers.length);
	      	testCode.push(numbers[ind]);
	      	numbers.splice(ind, 1);
        
	      	let merged	= [].concat.apply([], [numbers, numbers, letters])
	      									.sort(function() {return 0.5-Math.random();}),
	      										filter = function(a, c) {
	      											return $.map(a, function(v) {if (v !== c) return v;});
	      										};
                          
	      	if (testCode.length < codeLength) {
	      		for (let i=testCode.length; i < codeLength; i++) {
	      			ind = Math.floor(Math.random()*merged.length);
	      			let c	= merged[ind];
	      			testCode.push(c[Math.random() < 0.5 ? 'toLowerCase' : 'toUpperCase']());
	      			merged = filter(merged, c);
	      		}
	      	}
	      	return testCode.sort(function() {return 0.5-Math.random();})
	      								 .join('').substring(0, codeLength);
	      },

        // Register
        register: function(event) {
          console.log('Register')
          if ($rootScope.user.id>0)
                $state.go('register');
          else  $state.go('register');
        }
      };

      // Set message
      $rootScope.methods.modal('message');

      // Set dialog
      $rootScope.methods.modal('dialog');
    }
  ])

  // Home controller
  .controller('homeController', [
    '$scope',
    'http',
    function($scope, http) {
      
      // Check is first run
      if ($scope.methods.isFirstRun())
        return

      // Set methods
      let methods = {

        // Initialize
        init: function() {

          // Get data
          methods.get().done( function() {

            // Show page
            $scope.methods.showPage();
          });
        },

        // Get data
        get: function() {

          // Define deferred objects completed
          let completed = new $.Deferred(),
              response  = { carousel    : new $.Deferred(),
                            services    : new $.Deferred(),
                            information : new $.Deferred()};
          
          // Set data
          $scope.data = {}

          // Each response keys
          $.each(Object.keys(response), function(i, key) {

            // Get data
            http.requiest(null, {
              url     : './data/' + key + '.json',
              dataType: "json"
            }).done(function(data) {

              // Set data, apply change, and resolve copleted
              $scope.data[key] = data;
              $scope.$applyAsync();
              response[key].resolve();
            });
          });

          // Wait for all completed
          $.when(
            response.carousel, 
            response.services, 
            response.information
          ).done( function() {
            completed.resolve();
          });

          // Return when completed
		      return $.when(completed).done().promise();
        }
      }

      // Initialize
      methods.init()
    }
  ])
  
  // Gallery controller
  .controller('galleryController', [
    '$scope',
    'http',
    function($scope, http) {
      
      // Check is first run
      if ($scope.methods.isFirstRun())
        return

      // Set methods
      let methods = {

        // Initialize
        init: function() {

          // Get data
          methods.get().done( function() {

            // Show page
            $scope.methods.showPage();

            // Set dialog
            //$scope.methods.modal('dialog');
          });
        },

        // Get data
        get: function() {

          // Define deferred objects completed
          let completed = new $.Deferred(),
              response  = { rooms   : new $.Deferred(),
                            common  : new $.Deferred(),
                            carousel: new $.Deferred()};
        
          // Set data
          $scope.data = {};
          
          // Each response keys
          $.each(Object.keys(response), function(i, key) {

            // Get data
            http.requiest(null, {
              url     : './data/' + key + '.json',
              dataType: "json"
            }).done(function(data) {
              if (key === 'rooms') {
                $.each([
                  'singleRoom',
                  'doubleRoom',
                  'family',
                  'suites',
                  'honey'
                ], function(i, k) {
                  $scope.data[k] = data.filter(function(i) {
                    return i.type == k;
                  });
                });
              } else $scope.data[key] = data;

              // Apply change, and resolve copleted
              $scope.$applyAsync();
              response[key].resolve();
            });
          });

          // Wait for all completed
          $.when( 
            response.rooms,
            response.common,
            response.carousel
          ).done( function() {
            completed.resolve();
          });

          // Return when completed
		      return $.when(completed).done().promise();
        }
      }

      // Initialize
      methods.init()
    }
  ])

  // Login controller
  .controller('loginController', [
    '$rootScope',
    '$scope',
    '$element',
    'util',
    'type',
    'http',
    function($rootScope, $scope, $element, util, type, http) {
      
      // Check is first run
      if ($scope.methods.isFirstRun())
        return

      // Input changed
      $scope.methods.changed = function() {

        // Define accept button disabled variable, 
        // Get user property count, 
        // Define deferred objects completed 
        let isDisabled    = false,
            propCount     = Object.keys($scope.model).length,
            propCompleted = new $.Deferred(),
            completed     = new $.Deferred();

        // Each user properties
        $.each($scope.model, function (prop) {

          // When has property, then remove all white space, otherwise set to empty
          $scope.model[prop] = $scope.model[prop] === undefined ? '' : 
                               $scope.model[prop].split(' ').join('');
          
          // Check is not valid
          if ($scope.model[prop] === '' ||
             (prop === 'code' && $scope.model[prop] !== $scope.testCode)) {

            // Set accept button disabled to true
            isDisabled = true;
          }

          // Show/Hide input clear icon
          $element.find('.input-group#user-' + prop + ' .input-clear-icon')
            [util.addRemoveClass($scope.model[prop] !== '')]('show');
          
          // Check is completed
          if (!--propCount) propCompleted.resolve(isDisabled);
        });

        // When is all property completed
        $.when(propCompleted).done( function(isDisabled) {

          // Get accept, cancel button
          let acceptBtn = $element.find('button#accept'),
              cancelBtn = $element.find('button#cancel');

          // Add/remove accept, cancel button class btn-color
          if (isDisabled) {
            acceptBtn.addClass('btn-secondary')
                     .removeClass('btn-primary');
            cancelBtn.removeClass('btn-secondary')
                     .addClass('btn-primary');
          } else {
            acceptBtn.removeClass('btn-secondary')
                     .addClass('btn-primary');
            cancelBtn.addClass('btn-secondary')
                     .removeClass('btn-primary');
          }

          // Add/remove disabled
          acceptBtn.prop('disabled', isDisabled)

          // Resolve completed
          completed.resolve();
        });

        /* Return when completed */
				return $.when(completed).done().promise();
      };

      // Refresh code
      $scope.methods.refresh = function() {
        
        // Get test code
        $scope.testCode = $scope.methods.getCode();

        // Reset model user code, and apply change
        $scope.model.code = '';
        $scope.$applyAsync();

        // Call method input changed
        $scope.methods.changed();

        // Set input focus
        $element.find('input#code').focus();
      };

      // Show/Hide password
      $scope.methods.show = function(isChecked) {
        $element.find('input.input-password')
                [util.addRemoveClass(isChecked)]('show');
      };

      // Check user
      $scope.methods.check = function() {

        // Set arguments
        util.objectMerge({
            user: null,
            password: null
          }, $scope.model, true).done( function(args) {
        
          // Check user
          http.requiest({
            "moduleName":"user",
            "className":"User",
            "methodName":"getUser",
            "argsToClass":true,
            "args": args
          }).done(function(data) {

            // Check user
            if (!type.isNull(data)) {

              // Set user properties, apply change
              $rootScope.user = data;
              $scope.$applyAsync();

              // Go to previous state
              $scope.methods.prevState()

            } else {

              // Reset model, and apply changed
              methods.set().done( function() {
                $scope.methods.changed();
              });
            }
          });
        });
      };

      // Set methods
      let methods = {

        // Initialize
        init: function() {

          // Set model
          methods.set().done( function() {
            
            // Set events
            methods.events();

            // Show page
            $scope.methods.showPage();
          });
        },

        // Set model
        set: function() {
          
          // Define deferred object completed
          let completed = new $.Deferred();

          // Input models
          $scope.model = {
            user: '',
            password: '',
            code: ''
          };

          // Get test code
          $scope.testCode = $scope.methods.getCode();

          // Apply change, and resolve completed
          $scope.$applyAsync();
          completed.resolve();

          // Return when completed
		      return $.when(completed).done().promise();
        },

        // Set events
        events: function() {

          // Set input clear icon on click event
          $element.find('.input-clear-icon')
                  .on('click', function(event) {

            // Event prevent default
            event.preventDefault();

            // Get/Check current input clear icon element
            let element = $(event.target);
            if (!type.isNodElement(element)) return;

            // Get/Check proper input element
            let inputElement = element.closest('.input-group').find('input');
            if (!type.isNodElement(inputElement)) return;

            // Set proper input element focus
            inputElement.focus();

            // Get proper input element identifier
            let inputElementId  = inputElement.attr('id');

            // Clear value, and apply change
            $scope.model[inputElementId] = '';
            $scope.$applyAsync();

            // Call method input changed
            $scope.methods.changed();
          });

          // Key up event
          $(document).keyup(function (event) {

            // Get event key code
			  		let keyCode = event.keyCode || event.which;

            // Enter
			  		if (keyCode === 13) {
            
              // Event prevent default
              event.preventDefault()

              // Ge/Check input elements
              let inputElements	= $element.find('input, button')
                                          .not(':checkbox')
                                          .not(':disabled');
              if (type.isNodElement(inputElements)) {

                // Get/Check focused element
                let focusedElement = inputElements.filter(':focus');
                if (type.isNodElement(focusedElement)) {

                  // Get index of focused element, and define next input
                  let index     = inputElements.index(focusedElement),
                      nextInput = null;

                  // Check position of focused element, and set next element
                  if (inputElements.last().is(focusedElement))
                        nextInput = inputElements.first();
                  else  nextInput = $(inputElements.get(index+1));

                  // Set focus
                  nextInput.focus();
                }
              }

            // Initialize test code (ctrl-alt-c)
			  		} else if (event.ctrlKey  && 
                       event.altKey   && 
                       event.keyCode === 67) {
            
              // Event prevent default
              event.preventDefault()

              // Set user test code, and apply change
              $scope.model.code = $scope.testCode;
			  			$scope.$applyAsync();

              // Call method input changed
              $scope.methods.changed();
			  		}
          });
        }
      };

      // Initialize
      methods.init()
    }
  ])

  // Register controller
  .controller('registerController', [
    '$rootScope',
    '$scope',
    '$element',
    'util',
    'type',
    'http',
    function($rootScope, $scope, $element, util, type, http) {
      
      // Check is first run
      if ($scope.methods.isFirstRun())
        return

      // Input changed
      $scope.methods.changed = function() {

        // Define accept button disabled variable, 
        // Get user property count, 
        // Define deferred objects completed 
        let isDisabled    = false,
            propCount     = Object.keys($scope.model).length,
            propCompleted = new $.Deferred(),
            completed     = new $.Deferred();

        // Each user properties
        $.each($scope.model, function (prop) {

          // Get input element, and check is required
          let element     = $element.find('input#' + prop),
              isRequired  = type.isNodElement(element) && element.prop('required');

          // When has property, then remove all white space, otherwise set to empty
          if (!['birthday','gender'].includes(prop))
            $scope.model[prop] =  $scope.model[prop] === undefined ? '' : 
                                  $scope.model[prop].split(' ').join('');
          
          // Check is not valid
          if (($scope.model[prop] === '' && isRequired) ||
              (prop === 'code' && $scope.model[prop] !== $scope.testCode) ||
              (prop === 'birthday' && (!moment($scope.model[prop], "YYYY-MM-DD").isValid() ||
              $scope.helper.adultMaxBorn.diff(moment($scope.model[prop]), 'days') < 0)) ||
              (prop === 'email' && !type.isEmail($scope.model[prop])) ||
              (prop === 'passwordAgain' && $scope.model[prop] !== $scope.model.password) ||
              (prop === 'gender' && !$scope.helper.genderMail.prop("checked") && 
                                    !$scope.helper.genderFemail.prop("checked"))) {

            // Set accept button disabled to true
            isDisabled = true;
          }

          // Show/Hide input clear icon
          $element.find('.input-group#user-' + prop + ' .input-clear-icon')
            [util.addRemoveClass($scope.model[prop] !== '')]('show');
          
          // Check is completed
          if (!--propCount) propCompleted.resolve(isDisabled);
        });

        // When is all property completed
        $.when(propCompleted).done( function(isDisabled) {

          // Get accept, cancel button
          let acceptBtn = $element.find('button#accept'),
              cancelBtn = $element.find('button#cancel');

          // Add/remove accept, cancel button class btn-color
          if (isDisabled) {
            acceptBtn.addClass('btn-secondary')
                     .removeClass('btn-primary');
            cancelBtn.removeClass('btn-secondary')
                     .addClass('btn-primary');
          } else {
            acceptBtn.removeClass('btn-secondary')
                     .addClass('btn-primary');
            cancelBtn.addClass('btn-secondary')
                     .removeClass('btn-primary');
          }

          // Add/remove disabled
          acceptBtn.prop('disabled', isDisabled)

          // Resolve completed
          completed.resolve();
        });

        /* Return when completed */
				return $.when(completed).done().promise();
      };

      // Refresh code
      $scope.methods.refresh = function() {
        
        // Get test code
        $scope.testCode = $scope.methods.getCode();

        // Reset model user code, and apply change
        $scope.model.code = '';
        $scope.$applyAsync();

        // Call method input changed
        $scope.methods.changed();

        // Set input focus
        $element.find('input#code').focus();
      };

      // Show/Hide password
      $scope.methods.show = function(isChecked) {
        $element.find('input.input-password')
                [util.addRemoveClass(isChecked)]('show');
      };

      // Registration
      $scope.methods.registration = function() {
        
        // Define deferred object completed
        let completed = new $.Deferred();

        // Copy model
        let args = util.objectCopy($scope.model);

        // Check gender
        if ($scope.helper.genderMail.prop("checked"))
          args.gender = "M"
        else if ($scope.helper.genderFemail.prop("checked"))
          args.gender = "F"

        // Set birthday 
        args.birthday = moment(args.birthday, "YYYY-MM-DD").format("YYYY-MM-DD")

        // Check user exist
        if ($scope.user.id > 0)
          args.id = $scope.user.id

        // Unset not neccessary keys
        delete args.passwordAgain
        delete args.code

        // Registration
        http.requiest({
          "moduleName":"user",
          "className":"User",
          "methodName": $scope.user.id === 0 ? "registration": 'modify',
          "argsToClass":true,
          "args": args
        }).done(function(data) {

          // Check data
          if (!type.isNull(data)) {

            // Set user properties, apply change, and go to previous state
            $rootScope.user = data;
            $scope.$applyAsync();
            $scope.methods.prevState()
          
          } else {

            // Reset model, and apply changed
            methods.set().done( function() {
              $scope.methods.changed();
            });
          }
        });

        // Return when completed
        return $.when(completed).done().promise();
      };

      // Set methods
      let methods = {

        // Initialize
        init: function() {

          // Set model
          methods.set().done( function() {
            
            // Set events
            methods.events();

            // Show page
            $scope.methods.showPage();
          });
        },

        // Set model
        set: function() {
          
          // Set helper
          $scope.helper = {
            adultMaxBorn: moment().subtract(18, 'years').startOf('day'),
            genderMail  : $element.find('#user-mail'),
            genderFemail: $element.find('#user-femail')
          }

          // Get day maximum for adult, get input, and define deferred object completed
          let bornStr   = moment($scope.helper.adultMaxBorn._d, "YYYY-MM-DD").format("YYYY-MM-DD"),
              birthday  = $element.find('input#birthday'),
              completed = new $.Deferred();

          // Set birthday input maximum value
          birthday.attr("max", bornStr);

          // Get test code
          $scope.testCode = $scope.methods.getCode();

          // Get data
          methods.get().done( function(data) {
            
            // Input models
            $scope.model = data;

            // Set model test code
            $scope.model.code = '';

            // Apply change, and resolve completed
            $scope.$applyAsync();
            $scope.methods.changed();
            completed.resolve();
          });

          // Return when completed
		      return $.when(completed).done().promise();
        },

        // Get data
        get: function() {

          // Set model data default, and define deferred object completed
          let model    = {prefixName: '',
                          firstName: '',
                          middleName: '',
                          lastName: '',
                          postfixName: '',
                          gender: '',
                          birthday: '',
                          email: '',
                          loginName: '',
                          password: '',
                          passwordAgain: ''},
              completed = new $.Deferred();

          // Check user exist
          if ($scope.user.id > 0) {

            // Check user
            http.requiest({
              "moduleName":"user",
              "className":"User",
              "methodName":"getUserData",
              "argsToClass":true,
              "args": {id: $scope.user.id}
            }).done(function(data) {
              
              // Check user
              if (!type.isNull(data)) {

                // Get data property keys count
                let count = Object.keys(data).length;

                // Each property keys
                $.each(Object.keys(data), function(i, k) {

                  // Check/Set data property
                  if (data[k] == null)
                    data[k] = '';
                  else if (k == 'birthday')
                    data[k] = moment(data[k], "YYYY-MM-DD").startOf('day')._d;
                  else if (k == 'gender') {
                    $scope.helper.genderMail.prop("checked", data[k]==='M');
                    $scope.helper.genderFemail.prop("checked", data[k]==='F');
                  }
                  
                  // Check completed
                  if (!--count) completed.resolve(data);
                });
              } else completed.resolve(model);
            });
          } else completed.resolve(model);
          
          // Return when completed
		      return $.when(completed).done().promise();
        },

        // Set events
        events: function() {

          // Disable input type date key down event
          $element.find('input[type="date"]')
                  .on('keydown', function(event) {

            // Event prevent default
            event.preventDefault();
          });

          // Set input clear icon on click event
          $element.find('.input-clear-icon')
                  .on('click', function(event) {

            // Event prevent default
            event.preventDefault();

            // Get/Check current input clear icon element
            let element = $(event.target);
            if (!type.isNodElement(element)) return;

            // Get/Check proper input element
            let inputElement = element.closest('.input-group').find('input');
            if (!type.isNodElement(inputElement)) return;

            // Set proper input element focus
            inputElement.focus();

            // Get proper input element identifier
            let inputElementId  = inputElement.attr('id');

            // Clear value, and apply change
            $scope.model[inputElementId] = '';
            $scope.$applyAsync();

            // Call method input changed
            $scope.methods.changed();
          });

          // Key up event
          $(document).keyup(function (event) {

            // Get event key code
			  		let keyCode = event.keyCode || event.which;

            // Enter
			  		if (keyCode === 13) {
            
              // Event prevent default
              event.preventDefault()

              // Ge/Check input elements
              let inputElements	= $element.find('input, button')
                                          .not(':checkbox')
                                          .not(':disabled');
              if (type.isNodElement(inputElements)) {

                // Get/Check focused element
                let focusedElement = inputElements.filter(':focus');
                if (type.isNodElement(focusedElement)) {

                  // Get index of focused element, and define next input
                  let index     = inputElements.index(focusedElement),
                      nextInput = null;

                  // Check position of focused element, and set next element
                  if (inputElements.last().is(focusedElement))
                        nextInput = inputElements.first();
                  else  nextInput = $(inputElements.get(index+1));

                  // Set focus
                  nextInput.focus();
                }
              }

            // Initialize test code (ctrl-alt-c)
			  		} else if (event.ctrlKey  && 
                       event.altKey   && 
                       event.keyCode === 67) {
            
              // Event prevent default
              event.preventDefault()

              // Set user test code, and apply change
              $scope.model.code = $scope.testCode;
			  			$scope.$applyAsync();

              // Call method input changed
              $scope.methods.changed();
			  		}
          });
        }
      }

      // Initialize
      methods.init()
    }
  ])

  // Reservation controller
  .controller('reservationController', [
    '$scope',
    '$element',
    'util',
    'http',
    function($scope, $element, util, http) {
      
      // Check is first run
      if ($scope.methods.isFirstRun())
        return

      // Search for free rooms
      $scope.methods.search = function() {

        // Get free rooms
        http.requiest({
          "moduleName":"reservation",
          "className":"Reservation",
          "methodName":"getRooms",
          "argsToClass":true,
          "args": methods.arguments()
        }).done(function(data) {

          // Check response valid
          if (util.isObjectHasKey(data, 'rows'))
                $scope.data.rooms = data['rows'];
          else  $scope.data.rooms = null;
          $scope.$applyAsync();
        });
      };

      // Changed
      $scope.methods.changed = function() {

        // Get date now, and set is valid to false
        let today   = moment().startOf('day'),
            isValid = false;
        
        // Get arrival day, and check valid
        let arrival = moment($scope.reservation.arrival);
        if (arrival.isValid()) {

          // When arrival is before today, then set to today
          if (arrival.diff(today, 'days') <= 0)
            arrival = moment(today)

          // Get leaving day, and check valid
          let leaving = moment($scope.reservation.leaving);
          if (leaving.isValid()) {

            // When leaving is before arrival, then set to arrival + 1 day
            if (arrival.diff(leaving, 'days') >= 0)
              leaving = moment(arrival).add(1,'days').startOf('day')

            // Set days
            $scope.reservation.arrival = arrival._d;
            $scope.reservation.leaving = leaving._d

            // Check number of adults
            if (!$scope.reservation.adults || 
                 $scope.reservation.adults < 1)
                 $scope.reservation.adults = 1
            
            // Check number of children
            if (!$scope.reservation.children ||
                 $scope.reservation.children < 0)
                 $scope.reservation.children = 0

            // Apply change
            $scope.$applyAsync();

            // Set is valid to true
            isValid = true;
          }
        }

        // When is valid, then search for room(s)
        if (isValid)
              $scope.methods.search();
        else  $scope.data.rooms = null;
      };

      // Booking
      $scope.methods.booking = function(event) {

        // Check is logged in
        if ($scope.user.id > 0) {

          // Set arguments
          let args = methods.arguments()

          // Set room identifier from reservation properties
          args['roomId'] = $(event.currentTarget).data('roomId')

          // Set guest id
          args['guest'] = $scope.user.id;

          // Booking
          methods.booking(args).done( function(success) {

            // Check is success
            if (success) {

              // Search for free rooms
              $scope.methods.search()
            }
          });
          
        } else {

          // Show message
          $scope.methods.showMessage({
            icon: "fas fa-exclamation-circle text-danger",
            langId: "error",
            content: [{langId:"notLoggedIn",ngClass:"fs-3"}],
            btn: [{langId:"ok",ngClass:"btn-primary"}]
          });
        }
      };

      // Set methods
      let methods = {

        // Initialize
        init: function() {
          
          // Set model
          methods.set().done( function() {

            // Get data
            methods.get().done( function() {
              
              // Set events
              methods.events();

              // Show page
              $scope.methods.showPage();
            });
          });
        },

        // Set model
        set: function() {

          // Set days default, get inputs, and define deferred object completed
          let today         = moment().startOf('day')._d,
              tomorrow      = moment().add(1,'days').startOf('day')._d,
              todayStr      = moment(today, "YYYY-MM-DD").format("YYYY-MM-DD"),
              tomorrowStr   = moment(tomorrow, "YYYY-MM-DD").format("YYYY-MM-DD"),
              arrival       = $element.find('input#arrival'),
              leaving       = $element.find('input#leaving'),
              completed     = new $.Deferred();

          // Set date input minimum values
          arrival.attr("min", todayStr);
          leaving.attr("min", tomorrowStr);

          // Input defaults
          $scope.reservation = {
            arrival: today,
            leaving: tomorrow,
            adults: 1,
            children: 0
          };
          
          // Run methods changed, and resolve completed
          $scope.methods.changed()
          completed.resolve();

          // Return when completed
		      return $.when(completed).done().promise();
        },

        // Get data
        get: function() {

          // Define deferred object completed
          let completed = new $.Deferred();
          
          // Set data
          $scope.data = {};

          // Get data
          http.requiest(null, {
            url     : './data/carousel.json',
            dataType: "json"
          }).done(function(data) {

            // Set data, apply change, and resolve copleted
            $scope.data.carousel = data;
            $scope.$applyAsync();
            completed.resolve();
          });

          // Return when completed
		      return $.when(completed).done().promise();
        },

        // Booking
        booking: function(args) {

          // Define deferred object completed
          let completed = new $.Deferred();

          // Get free rooms
          http.requiest({
            "moduleName":"reservation",
            "className":"Reservation",
            "methodName":"booking",
            "argsToClass":true,
            "args": args
          }).done(function(data) {
            completed.resolve(true)
          });

          // Return when completed
		      return $.when(completed).done().promise();
        },

        // Set arguments
        arguments: function() {
          return {
            arrival:  moment($scope.reservation.arrival, "YYYY-MM-DD").format("YYYY-MM-DD"),
            leaving:  moment($scope.reservation.leaving, "YYYY-MM-DD").format("YYYY-MM-DD"),
            adults:   $scope.reservation.adults,
            children: $scope.reservation.children
          }
        },

        // Set events
        events: function() {

          // Disable input type date key down event
          $element.find('input[type="date"]')
                  .on('keydown', function(event) {

            // Event prevent default
            event.preventDefault();
          });
        }
      }

      // Initialize
      methods.init()
    }
  ]);

})(window, angular);