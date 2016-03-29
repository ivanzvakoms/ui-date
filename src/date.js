import jQuery from 'jquery';
import angular from 'angular';
import _datePicker from 'jquery-ui/datepicker'; // sets up jQuery with the datepicker plugin

export default angular.module('ui.date', [])
  .constant('UI_DATE_CONFIG', {})
  .constant('UI_DATE_FORMAT', 'yy-mm-dd')
  .directive('uiDate', ['UI_DATE_CONFIG','UI_DATE_FORMAT', function uiDateDirective(UI_DATE_CONFIG, UI_DATE_FORMAT) {

    return {
      require: '?ngModel',
      priority: 1,
      link: function link(scope, element, attrs, ngModelCtrl) {
        var modelDateFormat = attrs.uiDateFormat;
        var $element = angular.element(element);

        var getOptions = function() {
          return angular.extend({}, UI_DATE_CONFIG, scope.$eval(attrs.uiDate));
        };

        var initDateWidget = function() {
          var showing = false;
          var opts = getOptions();

          function setVal(date) {
            ngModelCtrl.$setViewValue(new Date(date));
            ngModelCtrl.$render();
          }

          // If we have a ngModelCtrl (i.e. ngModelController) then wire it up
          if (ngModelCtrl) {
            // Set the view value in a $apply block when users selects
            // (calling directive user's function too if provided)
            var _onSelect = opts.onSelect || angular.noop;
            opts.onSelect = function(value, picker) {
              showing = true;
              value = parseDateWithCurrentFormat(value);
              setVal(value);
              $element.blur();
              _onSelect(value, picker, $element);
            };

            var _beforeShow = opts.beforeShow || angular.noop;
            opts.beforeShow = function(input, picker) {
              showing = true;
              _beforeShow(input, picker, $element);
            };

            var _onClose = opts.onClose || angular.noop;
            opts.onClose = function(value, picker) {
              showing = false;
              // $element.focus();
              _onClose(value, picker, $element);
            };

            element.on('focus', function(focusEvent) {
              if (attrs.readonly) {
                focusEvent.stopImmediatePropagation();
              }
            });

            $element.off('blur.datepicker').on('blur.datepicker', function() {
              if (!showing) {}
            });



            // Update the date picker when the model changes
            ngModelCtrl.$render = function() {
              $element.datepicker('setDate', new Date(ngModelCtrl.$modelValue));
            };


            ngModelCtrl.$parsers.push(uiDateParser);
            ngModelCtrl.$validators.uiDateValidator = uiDateValidator;
            ngModelCtrl.$formatters.push(uiDateFormatter);
          }

          // Check if the $element already has a datepicker.
          if ($element.data('datepicker')) {
            // Updates the datepicker options
            $element.datepicker('option', opts);
            $element.datepicker('refresh');
          } else {
            // Creates the new datepicker widget
            $element.datepicker(opts);

            // Cleanup on destroy, prevent memory leaking
            $element.on('$destroy', function() {
              $element.datepicker('hide');
              $element.datepicker('destroy');
            });
          }

          if (ngModelCtrl) {
            setVal(Date.parse(ngModelCtrl.$modelValue));
          }


          function uiDateParser(valueToParse) {
            var parsedDate = Date.parse(valueToParse);

            if (isNaN(parsedDate) && valueToParse.length) {
              try {
                parsedDate = Date.parse(parseDateWithCurrentFormat(valueToParse));
              }
              catch (error) {}
            }

            return modelDateFormat && !isNaN(parsedDate) ?
              $.datepicker.formatDate(modelDateFormat, new Date(parsedDate)) :
              parsedDate;
          }


          function uiDateValidator(modelValue, viewValue) {
            console.warn('uiDateValidator , modelValue, viewValue', modelValue, viewValue);
            var isValidDate = !isNaN(Date.parse(viewValue)) || !isNaN(modelValue);

            if (modelDateFormat && viewValue.length) {
              try {
                console.info('uiDateValidator try', viewValue);
                isValidDate = !isNaN(Date.parse(parseDateWithCurrentFormat(viewValue)));
              }
              catch (error) {}
            }

            console.info('uiDateValidator isValidDate', isValidDate);

            return   viewValue === null
              || viewValue === ''
              || isValidDate;
          }


          function uiDateFormatter(modelToFormat) {
            modelToFormat = new Date(modelToFormat);
            modelToFormat = $.datepicker.formatDate(opts.dateFormat || UI_DATE_FORMAT, modelToFormat);
            return modelToFormat;
          }


          function parseDateWithCurrentFormat(valueToParse) {
            var currentDateFormat = $element.datepicker( "option", "dateFormat" );
            return $.datepicker.parseDate(currentDateFormat, valueToParse);
          }
        };

        // Watch for changes to the directives options
        scope.$watch(getOptions, initDateWidget, true);

      },
    };
  }]);