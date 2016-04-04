import $ from 'jquery';
import angular from 'angular';
import _datePicker from 'jquery-ui/datepicker'; // sets up jQuery with the datepicker plugin

export default angular.module('ui.date', [])
  .service('uiDateHelper', function () {
    //TODO(edge case) separate storage by scope.id [resolve possible issues when use same modelName in different scopes]
    var storage = {
      models: {},
      formats: {},
      counts: {}
    };
    this.initUiDate = function (modelName, options, format) {
      if (!storage.models[modelName]) {
        storage.models[modelName] = options || true;
        storage.formats[modelName] = format;
        storage.counts[modelName] = 1;
      }
      else if (storage.models[modelName] !== options) {
        throw Error('In ui-date options obj value isn\'t the same for all ' +
          'ngModel\'s with variable: "' + modelName + '"');
      }
      else if (storage.formats[modelName] !== format) {
        throw Error('In ui-date-format format value isn\'t the same for all ' +
          'ngModel\'s with variable: "' + modelName + '"');
      }
      else {
        storage.counts[modelName] += 1;
      }
    };

    this.clearUiDate = function (modelName) {
      if (storage.counts[modelName] > 1) {
        storage.counts[modelName] -= 1;
      }
      else {
        delete storage.counts[modelName];
        delete storage.formats[modelName];
        delete storage.models[modelName];
      }
    }
  })
  .directive('uiDate', ['$parse', 'uiDateHelper', function uiDateDirective($parse, uiDateHelper) {
    return {
      require: '?ngModel',
      link: function link(scope, element, attrs, ngModelCtrl) {
        var modelDateFormat = attrs.uiDateFormat; //format model
        var dateFormat; //format view(default $.datepicker value or provided as option)
        var modelGetter = $parse(attrs.ngModel);
        var modelSetter = modelGetter.assign;
        var showing = false;


        init();


        //- IMPLEMENTATION
        function init() {
          if (!ngModelCtrl) {
            //just init datepicker on element
            datepicker(getOptions());
            return;
          }

          uiDateHelper.initUiDate(attrs.ngModel, getOptions(), modelDateFormat);

          var value = modelGetter(scope);

          if (value && !(value instanceof Date)) {
            parseNonDateValue(value)
          }


          scope.$watch(getOptions, setDatepicker, true);
          attrs.$observe('uiDateFormat', function (dateOptions) {
            modelDateFormat = dateOptions;
          });

          setDatepicker(getOptions(), true);


          ngModelCtrl.$render = renderFn;
          ngModelCtrl.$parsers.push(parser);
          ngModelCtrl.$formatters.push(formatter);

          //ngModel value change from outside detection
          scope.$watch(attrs.ngModel, function (date) {
            if (typeof date === 'boolean') {
              throw Error('Boolean isn\'t a valid date type');
            }

            if (date && !validateDate(modelDateFormat || null, date)) {
              if (!(date instanceof Date)) {
                setDateToModel(parseNonDateValue(date));
              }
              else {
                setDateToModel(date);
              }
            }
          });

        }


        function setDateToModel(date) {
          var formattedDate = $.datepicker.formatDate(dateFormat, date);

          //initial onSelect emulate
          element.datepicker('setDate', formattedDate);
          scope.$applyAsync(function () {
            ngModelCtrl.$setViewValue(formattedDate);
          });
        }


        function parseNonDateValue(value) {
          console.warn('The ng-model for ui-date have to be a Date instance. ' +
            'Currently the model is a: ' + typeof value);
          console.warn('Trying convert to new Date(' + value + ')');
          var dateInstance = new Date(value);
          if (dateInstance === 'Invalid Date') {
            throw Error('Unable to parse ng-model for ui-date');
          }
          else {
            return modelSetter(scope, dateInstance);
          }
        }


        function getOptions() {
          return scope.$eval(attrs.uiDate);
        }


        function setDatepicker(opts, oldOpts) {
          if (opts === oldOpts) {
            return;
          }
          // we must copy options to prevent sharing options like 'onSelect' between scope.dateFormat which
          // might be used for different ng-model's
          var opts = opts ? angular.copy(opts) : {};

          // Set the view value in a $apply block when users selects
          // (calling directive user's function too if provided)
          var _onSelect = opts.onSelect || angular.noop;
          opts.onSelect = function (dateText, picker) {
            scope.$apply(function () {
              showing = true;
              ngModelCtrl.$setViewValue(dateText);
              element.blur();
              _onSelect(dateText, picker, element);
            });
          };

          var _beforeShow = opts.beforeShow || angular.noop;
          opts.beforeShow = function (input, picker) {
            showing = true;
            _beforeShow(input, picker, element);
          };

          var _onClose = opts.onClose || angular.noop;
          opts.onClose = function (dateText, picker) {
            showing = false;
            _onClose(dateText, picker, element);
          };

          datepicker(opts);
        }


        function datepicker(opts) {
          // Check if the $element already has a datepicker.
          if (element.data('datepicker')) {
            // Updates the datepicker options
            element.datepicker('option', opts);
            element.datepicker('refresh');
          } else {
            // Creates the new datepicker widget
            element.datepicker(opts);

            // Cleanup on destroy, prevent memory leaking
            element.on('$destroy', function () {
              uiDateHelper.clearUiDate(attrs.ngModel);
              element.off('focus');
              element.datepicker('hide');
              element.datepicker('destroy');
            });
          }

          dateFormat = element.datepicker('option', 'dateFormat');

          element.on('focus', function (focusEvent) {
            if (attrs.readonly) {
              focusEvent.stopImmediatePropagation();
            }
          });

          element.off('blur.datepicker').on('blur.datepicker', function() {
            if (!showing) {
              scope.$apply(function() {
                element.datepicker('setDate', element.datepicker('getDate'));
                ngModelCtrl.$render();
              });
            }
          });

        }


        function renderFn() {
          if (ngModelCtrl.$viewValue) {
            var getDate = $.datepicker.parseDate(dateFormat, ngModelCtrl.$viewValue);
            element.datepicker('setDate', getDate);
          }
          else if (ngModelCtrl.$viewValue === '') {
            element.datepicker('setDate', null);
          }
        }


        function parser(viewValue) {
          var validatedDate;

          if (ngModelCtrl.$isEmpty(viewValue)) {
            return viewValue;
          }

          if (modelDateFormat) {
            validatedDate = validateDate(dateFormat, viewValue);
            //here we going to format our value with modelDateFormat
            return validatedDate ? $.datepicker.formatDate(modelDateFormat, new Date(validatedDate)) : validatedDate;
          }
          else {
            return validateDate(dateFormat, viewValue);
          }

        }


        function validateDate(format, date) {
          try {
            ngModelCtrl.$setValidity(attrs.ngModel + '_datePicker', true);
            if (format === null && date instanceof Date) {
              return date;
            }
            else {
              return $.datepicker.parseDate(format, date);
            }
          }
          catch (error) {
            // console.warn('error', error);
            ngModelCtrl.$setValidity(attrs.ngModel + '_datePicker', false);
            return undefined;
          }
        }


        function formatter(modelValue) {
          var validatedDate;

          if (typeof modelValue === 'undefined') { //some other directive with same model
            element.datepicker('setDate', null);
          }

          if (ngModelCtrl.$isEmpty(modelValue) || typeof modelValue === 'boolean') {
            return '';//modelValue
          }

          //revert value from formatted by parser(modelDateFormat is used for $viewModel format) to datepicker opts view
          if (modelDateFormat) {
            validatedDate = validateDate(modelDateFormat, modelValue);
            return validatedDate ? $.datepicker.formatDate(dateFormat, new Date(validatedDate)) : validatedDate
          }
          else {
            validatedDate = validateDate(null, modelValue);
            return validatedDate ? $.datepicker.formatDate(dateFormat, new Date(modelValue)) : validatedDate;
          }

        }

      }
    }
  }]);