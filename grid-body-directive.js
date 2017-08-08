/**
 * @ngdoc directive
 * @name speedwing.common.manage-module-grid:gridbodyDirective
 * @requires $window
 * @requires $rootScope
 * @requires ModuleContentService
 * @requires ModulesService
 * @requires $translate
 * @requires $compile
 * @requires MGridService
 * @requires Constants
 * @requires DragDropHandlerService
 * @requires UtilityService
 * @requires UserPermissionService
 * @requires $state
 *
 * @description
 * GridBodyDirective is responsible for creating the table in contents of manage modules tab.
 * It is responsible for creating,reading and updating the table
 
*/
define([
    'angular',
    '../../../module',
    'common/components/picker/service',
    './grid-service',
    './keystroke-nav',
    './grid-drop-directive',
    './m-grid-text',
    './m-grid-date',
    './m-grid-novalue',
    './m-grid-number',
    './m-grid-currency',
], function(angular, lazyModule) {
    'use strict';

    lazyModule
        .directive('mRowHeader', [
            '$window',
            '$rootScope',
            'ModuleContentService',
            'ModulesService',
            '$translate',
            '$timeout',
            '$compile',
            'MGridService',
            'Constants',
            'DragDropHandlerService',
            'UtilityService',
            '$state',
            'UserPermissionService',
            function($window, $rootScope,ModuleContentService, modulesService, $translate, $timeout, $compile, mGridService, constants, dragDropService, utilityService, $state, userPermissionService) {
                return {
                    restrict: 'A',
                    require: '^manageModuleGrid',
                    link: function($scope, $element, $attrs) {
                        var defaultHeightOfItem = $scope.heightOfItem =26;
                        var defaultWidthOfItem = $scope.widthOfItem =169;
                        var init,
                        $mainTable,
                        $mainTableBody,
                        $list,
                        $gridWrap,
                        _dataTypes,
                        module,
                        permission,
                        readPermission,disableField,
                        _userPreference,
                        currencyList,
                        clickOnTable,
                        bringInViewOnCLick=false,
                        checkBlurOnDateType=true,
                        clearHandlerClick=false,
                        localeDateFormat = utilityService.localeDateFormat,
                        endDateInFormat =  moment(constants.endDate, constants.momentDateFormat.YMD).format(localeDateFormat);
                        
                        $scope.cellLabelValues = {};
                         /*@ngdoc method
                        * @name speedwing.common.manage-module-grid:gridbodyDirective#init
                        * @description initialize the global variables. 
                        * @param  {[type]}  info [description]
                        */

                        init=function(){
                            $mainTable = $('div.main-table'),
                            $mainTableBody = $mainTable.find('.main-table-body'),
                            $list = $element.find('ul.list-reorder'),
                            $gridWrap = $element.parents('.grid-wrap'),
                            _dataTypes = constants.dataType,
                            module = $state.current.module,
                            permission = userPermissionService.getPermissions(module),
                            readPermission = !(permission.indexOf('C') > -1 || permission.indexOf('U') > -1),
                            disableField = readPermission ? 'true' : '',
                            _userPreference = modulesService.preferences;
                            $scope.autompleteOptions=[];
                            $scope.extAllowValues = [];
                            $scope.unitList = [];
                            currencyList = $scope.dropdownData;
                            angular.forEach(currencyList,function(obj){
                                angular.extend(obj,{value:obj.code});
                            });
                            $scope.$parent.$parent.$watch('zoomVal',function(){
                            // if($scope.$parent.$parent.zoomVal !== 13){
                               var timeout=$timeout(function(){
                                    if($mainTableBody.find("li.grid-row:first").length){
                                        $scope.heightOfItem=$mainTableBody.find("li.grid-row:first").height();
                                        $scope.widthOfItem=$mainTableBody.find('div.grid-data-cell:first').outerWidth();
                                        $rootScope.$emit("updateOnZoom");
                                    }
                                    $timeout.cancel(timeout);

                                });
                            // }
                            
                            });
                            $scope.$watch('fontSize',function(){
                                $rootScope.$emit("updateOnZoom");
                            });
                            var sliderTime=$timeout(function(){
                                var elm = angular.element('.ui-slider');
                                $(elm[0]).unbind('$destroy');
                                 $(elm[1]).unbind('$destroy');
                                $scope.$on("$destroy", function() {
                                    try{
                                        $(elm[0]).slider('destroy');
                                    }catch(err){
                                        
                                    }
                                  
                                  
                                });
                                $timeout.cancel(sliderTime);
                            });
                        };
                       
                         /* @ngdoc method
                        * @name speedwing.common.manage-module-grid:gridbodyDirective#populateAllLabels
                        * @description [set all the values of cells in grid] 
                        * @param  {[type]}  info [description]
                        */
                        var populateAllLabels=function() {
                           _.forOwn($scope.cellLabelValues, function(v,k) {
                                delete $scope.cellLabelValues[k];
                            });
                           var assemblyId;
                            angular.forEach($scope.body,function(item,rowId){
                               angular.forEach($scope.header,function(assembly,colId){
                                    if(assembly.id === null){
                                        assemblyId = assembly.key;
                                    }else{
                                        assemblyId = assembly.id;
                                    }                                   
                                    $scope.cellLabelValues[item.id+"_"+assemblyId]=prevVal(item.id,rowId,colId);
                                });
                            });
                            
                            // console.log($scope.cellLabelValues)        
                        }
                         /* @ngdoc method
                        * @name speedwing.common.manage-module-grid:gridbodyDirective#getDateTemplate
                        * @description [part of date datatype template]. 
                        * @param  {[type]}  info [description]
                        */
                        var getDateTemplate=function(){
                            var cellHtml='';
                            cellHtml += '<em ng-if="isOwnedModule" class="fa fa-times"  ng-style="{\'display\' : ((assembly.id !==null) ? (cellLabelValues[module.id + \'_\' + assembly.id][0] !== localeDateFormat):(cellLabelValues[module.id + \'_\' + assembly.key][0] !== localeDateFormat)) ? \'block\' : \'none\'}" ></em>';      
                            cellHtml += '<em ng-if="isOwnedModule" class="fa fa-calendar-o datepicker-holder"></em>';
                            
                            return cellHtml;
                        }
                         /* @ngdoc method
                        * @name speedwing.common.manage-module-grid:gridbodyDirective#isUndefined
                        * @description [checks if the condition is undefined] 
                        * @param  {[condition]}  condition [description]
                        */
                        $scope.isUndefined=function(condition){
                            return typeof(condition) === 'undefined';
                        }
                         /* @ngdoc method
                        * @name speedwing.common.manage-module-grid:gridbodyDirective#prepareTemplate
                        * @description [prepares the celss according to their datatypes] 
                        * @param  {[type]}  info [description]
                        */
                        var prepareTemplate=function(){
                            var cellHtml='';
                            //datatype= text
                            
                            cellHtml += '<span ng-if="cellTemplateDataCopy[key+startingPoint].dataType === \'Text\'" class="place-holder element-content-text tool-tip-value">{{(assembly.id !==null) ? cellLabelValues[module.id + "_" + assembly.id][0] : cellLabelValues[module.id + "_" + assembly.key][0] }}</span>';
                            
                            //datatype = currency
                            cellHtml += '<span ng-if="cellTemplateDataCopy[key+startingPoint].dataType === \'Currency\'" class="element-content split-cell place-holder tool-tip-value" data-side="0">{{ (assembly.id !==null) ? cellLabelValues[module.id + "_" + assembly.id][0] : cellLabelValues[module.id + "_" + assembly.key][0]}}</span>';
                            cellHtml += '<span ng-if="cellTemplateDataCopy[key+startingPoint].dataType === \'Currency\'" class="element-content split-cell place-holder" data-side="1">{{ (assembly.id !==null) ? cellLabelValues[module.id + "_" + assembly.id][1] : cellLabelValues[module.id + "_" + assembly.key][1]}}</span>';
                            
                            //datatype= no value
                            cellHtml += '<span ng-if="cellTemplateDataCopy[key+startingPoint].dataType === \'No value\'" class="place-holder">{{(assembly.id !==null) ? cellLabelValues[module.id + "_" + assembly.id][0] : cellLabelValues[module.id + "_" + assembly.key][0]}}</span>';           
                            
                            //datatype = date
                            cellHtml += '<span ng-if="cellTemplateDataCopy[key+startingPoint].dataType === \'Date\'" class="date-picker-container"><span class="place-holder">{{(assembly.id !==null) ? cellLabelValues[module.id + "_" + assembly.id][0] :cellLabelValues[module.id + "_" + assembly.key][0] }}</span>'+ getDateTemplate() +'</span>';

                            //datatype= number
                           
                            cellHtml += '<span ng-if="cellTemplateDataCopy[key+startingPoint].dataType === \'Number\' && !cellTemplateDataCopy[key+startingPoint].showUnitDrpdn && !cellTemplateDataCopy[key+startingPoint].msrmntDrpdn" class="element-content split-cell place-holder" data-side="0">{{(assembly.id !==null) ? cellLabelValues[module.id + "_" + assembly.id][0] : cellLabelValues[module.id + "_" + assembly.key][0]}}</span>';
                            // dropdown list on right
                            cellHtml += '<span ng-if="cellTemplateDataCopy[key+startingPoint].dataType === \'Number\' && !cellTemplateDataCopy[key+startingPoint].showUnitDrpdn && !cellTemplateDataCopy[key+startingPoint].msrmntDrpdn" class="element-content split-cell place-holder tool-tip-value" data-side="1">{{(assembly.id !==null) ? cellLabelValues[module.id + "_" + assembly.id][1] : cellLabelValues[module.id + "_" + assembly.key][1]  }}</span>';
                            // long number type 1 cell only
                            cellHtml += '<span ng-if="cellTemplateDataCopy[key+startingPoint].dataType === \'Number\' && !cellTemplateDataCopy[key+startingPoint].showUnitDrpdn && cellTemplateDataCopy[key+startingPoint].msrmntDrpdn" class="place-holder">{{(assembly.id !==null) ? cellLabelValues[module.id + "_" + assembly.id][0] : cellLabelValues[module.id + "_" + assembly.key][0]}}</span>'; 

                            cellHtml += '<span ng-if="cellTemplateDataCopy[key+startingPoint].dataType === \'Number\' && cellTemplateDataCopy[key+startingPoint].showUnitDrpdn && isUndefined(cellTemplateDataCopy[key+startingPoint].msrmntDrpdn) && isUndefined(autompleteOptions[cellTemplateDataCopy[key+startingPoint].itemId])" class="element-content split-cell place-holder" data-side="0">{{(assembly.id !==null) ? cellLabelValues[module.id + "_" + assembly.id][0] : cellLabelValues[module.id + "_" + assembly.key][0]}}</span>';
                            // input allowed value in left
                            cellHtml += '<span ng-if="cellTemplateDataCopy[key+startingPoint].dataType === \'Number\' && cellTemplateDataCopy[key+startingPoint].showUnitDrpdn && !(isUndefined(cellTemplateDataCopy[key+startingPoint].msrmntDrpdn) && isUndefined(autompleteOptions[cellTemplateDataCopy[key+startingPoint].itemId]))" class="element-content split-cell place-holder tool-tip-value" data-side="0">{{(assembly.id !==null) ? cellLabelValues[module.id + "_" + assembly.id][2] : cellLabelValues[module.id + "_" + assembly.key][2]}}</span>';

                            cellHtml += '<span ng-if="cellTemplateDataCopy[key+startingPoint].dataType === \'Number\' && cellTemplateDataCopy[key+startingPoint].showUnitDrpdn" class="element-content split-cell place-holder tool-tip-value" data-side="1">{{(assembly.id !==null) ? cellLabelValues[module.id + "_" + assembly.id][1] : cellLabelValues[module.id + "_" + assembly.key][1]}}</span>';
                            // console.log($scope.cellTemplateDataCopy)
                            // cellHtml='<span ng-bind="!(isUndefined(cellTemplateDataCopy[key+startingPoint].msrmntDrpdn) && isUndefined(autompleteOptions[cellTemplateDataCopy[key+startingPoint].itemId]))"></span>';
                            return cellHtml;
                           
                        }
                        
                        


                            /* @ngdoc method
                            * @name speedwing.common.manage-module-grid:gridbodyDirective#createRowHeader
                            * @description creates the main table structure. 
                            * @param  {[type]}  info [description]
                            */
                            var createRowHeader = function(info) {
                                createTemplate(info);
                                prepareModuleGrid();
                            },

                            // *
                            // *@ngdoc method
                            // * @name speedwing.common.manage-module-grid:gridbodyDirective#createTableTemplate
                            // * [createTableTemplate creates the template for table n cache it]
                            // * @param  {[type]}  info      [description]
                           
                            createTableTemplate=function(info){
                                var cellHtml = '', //cellHtml is for creating the table
                                    fixedCellHtml = '',//fixedcellhtml is for creating the row headers only
                                    str = '',
                                    rowHeaderStr='',checkbox;
                                   
                                    str='<li ng-if="header.length"  ng-style="{\'top\': ((itemTopPosition + (key)*heightOfItem ) / fontSize )+\'em\',\'left\':(itemLeftPosition/fontSize)+\'em\'}" style="position:absolute" ng-repeat="(key,module) in body |filter:{entityStatusId:1}| startFrom:startingPoint | limitTo:limitOfItemsInView"  data-module-id="{{module.id}}" class="grid-row alternate-cell row-reorder" ng-class="{\'alternate-cell-even\':(key+startingPoint+1)%2===0,\'alternate-cell-odd\':(key+startingPoint+1)%2!==0}">';

                                    rowHeaderStr='<div class="grid-cell col-highlight" ng-class="{\'context-menu\': {{isOwnedModule}},\'disable-highlight\' : !{{isOwnedModule}}}" ';
                               
                                    checkbox = '<span class="multi-select"><input type="checkbox" ng-checked="{{module.isSelected}}"" id="item-{{(module.mappingId)}}-{{(key)}}" data-index="{{(key)}}" name="item-{{(module.mappingId)}}"  class="module-item-list" ><label for="item-{{module.mappingId}}-{{(key)}}" class="visually-hidden" ></label></span>';
                                    rowHeaderStr += 'is-body="true" mapping-id = "{{module.mappingId}}" item-id="{{module.id}}"  menu-items="itemContextMenu">' + checkbox + '<span class="row-header-width head-truncation tool-tip-value">{{::module.name}}';
                                
                                    rowHeaderStr += '<em ng-if="isOwnedModule" class="icon-sprite right-drop-icon context-pointer">Action icon</em>';  
                                
                                    rowHeaderStr += '</span></div></li>';  
                                    fixedCellHtml += str + rowHeaderStr; 
                                
                                    // if (activeHeader && activeHeader.length > 0) {
                                    str += '<div class="grid-cell col-highlight-nested grid-cell01"><ul class="grid child-row-reorder">';
                                    // pinned columns..
                                    str += '<li class="grid-row">'
                                    cellHtml += str;                              
                                   
                                    cellHtml += '<div data-assembly-id={{assembly.id}} ng-repeat="(colId,assembly) in header|startFrom:horzStartPoint|limitTo:limitOfAssemblies" ng-if="assembly.entityStatusId !== \'99\'" id="{{(key+startingPoint)}}_{{(colId+horzStartPoint)}}_{{(header.length-1)}}_0" class="grid-cell grid-data-cell" data-index="{{(key+startingPoint)}}"> ';
                                    cellHtml +=  prepareTemplate();
                                    cellHtml += '</div>';
                                    // }
                                    str = '</li></ul></div></li>';
                                    cellHtml +=str;
                                
                                    if(typeof info !== "undefined" && info.name === "save") cellHtml = cellHtml.replace(/focused-cell/g, '');
                                     
                                    // for row headers we are not applying virtual scroll we are rendering all the row headers at once
                                    $list.html($compile(fixedCellHtml.replace("| startFrom:startingPoint | limitTo:limitOfItemsInView","").replace('ng-if="header.length"',"").replace("position:absolute","").replace("{\'top\': ((itemTopPosition + (key)*heightOfItem ) / fontSize )+\'em\',\'left\':(itemLeftPosition/fontSize)+\'em\'}",""))($scope));
                                    //for table virtual scroll is applied
                                    $mainTableBody.html($compile(cellHtml)($scope));
                                    
                                    cachedTemplate=true;
                            },
                            /* @ngdoc method
                            * @name speedwing.common.manage-module-grid:gridbodyDirective#cachedTemplate
                            * @description caches the main table structure . 
                            */
                            cachedTemplate=false,
                            /*@ngdoc method
                            * @name speedwing.common.manage-module-grid:gridbodyDirective#createTemplate
                            * @description creates the main table structure. 
                            * @param  {[type]}  info [description]
                            */
                            createTemplate = function(info) {
                                
                                var timer = utilityService.timer('grid body rederering :: ');
                               
                                $rootScope.$emit("updateVirtualScrollData");
                                populateAllLabels();
                                
                                var tempArr = [],
                                    cell = {}, headerLen = 0;

                                var omitDeletedItems=[];
                                _.each($scope.body, function(mod) {
                                    if(mod.entityStatusId === '99'){
                                        omitDeletedItems.push(mod.id);
                                    }
                                    
                                });
                                if(omitDeletedItems.length){
                                    $scope.cellTemplateDataCopy=_.filter($scope.cellTemplateData,function(item){
                                        return omitDeletedItems.indexOf(item.itemId) === -1;
                                    }); 
                                }else{
                                    $scope.cellTemplateDataCopy=$scope.cellTemplateData;
                                }

                                //incase of mappingId==null and entityStatusId 99 don't send to backend
                               var omitDeleted = _.filter($scope.body,function(item){
                                    return item.mappingId === null && item.entityStatusId === "99";
                                });
                               if(omitDeleted.length){
                                    $scope.body = _.difference($scope.body,omitDeleted);
                                    _.each(omitDeleted,function(deletedItem){
                                        var value=_.filter($scope.cellTemplateData,{"itemId":deletedItem.id})
                                        $scope.cellTemplateData = _.difference($scope.cellTemplateData,value)
                                    })
                               }
                                
                                
                                //create  main table template
                                if(!cachedTemplate){
                                    createTableTemplate(info);
                                }
                                $mainTable.scroll();
                                
                                    
                                $scope.$apply();
                                timer.stop();
                                
                                $rootScope.isLoading = false;
                                $scope.isRendered = true;
                                //JSI-12398
                                var $columnHeader = $gridWrap.find('.column-header');
                                if($mainTable[0].clientHeight < $mainTable[0].scrollHeight){
                                    $columnHeader.css('width', 'calc(100% - 17px)');
                                } else{
                                    $columnHeader.css('width', '100%');                                    
                                }
                            },
                            updateSpan=function($target,value){
                                var $isSpan,
                                    side=$target.attr('data-side'),
                                    sideIndex = $target.attr('data-side-index'),
                                    spanId = $target.get(0).classList[1].replace("I-","");
                                   
                                
                                if(ModuleContentService.selectedAllowedValue && typeof(ModuleContentService.selectedAllowedValue.valueId) !== "undefined"){
                                     var key = $target.data('key').split('_')[0], 
                                     selectedItem = _.filter($scope.cellTemplateData,{key : key});

                                    if(!_.filter(selectedItem[0].allowedValues,{"valueId" : ModuleContentService.selectedAllowedValue.valueId}).length){
                                        selectedItem[0].allowedValues.push(ModuleContentService.selectedAllowedValue);

                                    }
                                     ModuleContentService.selectedAllowedValue={};
                                }
                                
                                if(spanId.indexOf('New') === -1){
                                    spanId=spanId.replace("A-","");
                                }
                                
                                if(typeof(side) === "undefined"){
                                    side=0;
                                }
                                $isSpan=$target.parents('.element-container').siblings('span.place-holder');
                                if(!$scope.cellLabelValues[spanId]){
                                    $scope.cellLabelValues[spanId]=[];
                                }

                                if($isSpan.length > 1){
                                    $($isSpan[side]).html(value);
                                    side = sideIndex ? sideIndex : side;
                                    $scope.cellLabelValues[spanId][side]=value;
                                }else{
                                    $target.parents('.grid-data-cell').find('span.place-holder').html(value);
                                    if(value === '' && $target.hasClass('date-range')){
                                        $scope.cellLabelValues[spanId][side]= localeDateFormat;
                                    }else{
                                        $scope.cellLabelValues[spanId][side]=value;
                                    }
                                    
                                }
                            },
                             /* @ngdoc method
                            * @name speedwing.common.manage-module-grid:gridbodyDirective#updateCellData
                            * @description update the cells on change of cell value. 
                            * @param  {[type]}  event [description]
                            */
                            updateCellData = function(event,dateTypeBlur){ 
                                var value = event.target.value,
                                    mappingLabel = (event.target.id).substring((event.target.id).indexOf("_") + 1),
                                    obj = _.find($scope.cellTemplateData, {
                                        key: mappingLabel
                                    }),
                                    item = {},
                                    $target = $(event.target),
                                    isUnitSelectbox = $target.hasClass('units-selectbox'),
                                    isMeasurementSelectbox = $target.hasClass('measurements-selectbox'),
                                    assemblyValues = $scope.selectedModule.assemblyValues;    
                                    if (typeof($target.attr('readonly')) !== "undefined") {
                                        $target.removeAttr('readonly');
                                    }
                                    
                                    
                                    
                                    updateSpan($target,value);
                                    
                                if (obj.dataType === _dataTypes.TEXT) {
                                    assemblyValues[event.target.classList[1]].itemAllowedValueId = $target.data('itemkey');
                                } else if (obj.dataType === _dataTypes.CURRENCY) {
                                    if (event.target.className.indexOf("textbox") > -1) {
                                        assemblyValues[event.target.classList[1]].itemNumericValue = event.target.value;
                                    } 
                                    assemblyValues[event.target.classList[1]].itemCurrencyId = $target.data('itemkey') === ""? null: $target.data('itemkey');
                                } else if (obj.dataType === _dataTypes.DATE) {
                                    if (event.target.className.split(" ")[0] === "module-input") {
                                        assemblyValues[event.target.classList[1]].itemDateValue = event.target.value;
                                        if (event.target.value.trim()) {
                                            $target.siblings(".fa-times").removeClass("hidden");
                                        } else {
                                            $target.siblings(".fa-times").addClass("hidden");
                                        }
                                         if(event.target.value === ""){
                                            $target.parents(".grid-data-cell").find('span.place-holder').html(localeDateFormat);
                                            $target.parents(".grid-data-cell").find('em.fa-times').hide();
                                        }else{
                                            $target.parents(".grid-data-cell").find('em.fa-times').show();
                                        }
                                    }
                                    if(!checkBlurOnDateType || dateTypeBlur === false){
                                        checkBlurOnDateType=true;
                                        removeInput($target.parents('.grid-data-cell'));
                                        $target.parents('.grid-data-cell').focus();
                                    }
                                    
                                    
                                } else if (obj.dataType === _dataTypes.NOVALUE) {
                                    assemblyValues[event.target.classList[1]].itemAvailabilityId = $target.data('itemkey');

                                } else if (obj.dataType === _dataTypes.NUMBER) {
                                    if (event.target.className.indexOf("textbox") > -1) {
                                        assemblyValues[event.target.classList[1]].itemNumericValue = event.target.value;
                                    }
                                    if(isMeasurementSelectbox){
                                       assemblyValues[event.target.classList[1]].itemAllowedValueId = $target.data('itemkey');
                                    }
                                    if(isUnitSelectbox){
                                       assemblyValues[event.target.classList[1]].itemUnitId = $target.data('itemkey') === ""? null:$target.data('itemkey');
                                    }
                                    
                                }
                                if(!dateTypeBlur)
                                    setSaveDisabled();

                                // if(obj.dataType !== _dataTypes.DATE){
                                //     removeInput($target.parents('.grid-data-cell'));
                                //     $target.parents('.grid-data-cell').focus();
                                // }
                            },
                             /* @ngdoc method
                            * @name speedwing.common.manage-module-grid:gridbodyDirective#setSaveDisabled
                            * @description disables the save button. 
                            */
                            setSaveDisabled = function() {
                                $rootScope.$emit('setSaveDisabled', { hasError : ($element.parents('.grid-wrap').find('.has-error').length ? true : false) } );
                                try { $scope.$apply(); } catch(e) {}
                            },
                             /* @ngdoc method
                            * @name speedwing.common.manage-module-grid:gridbodyDirective#prepareModuleGrid
                            * @description handles the scroll events on load of table
                            */
                            prepareModuleGrid = function() {
                                //$('.main-table select').attr('disabled', 'disabled');
                                $rootScope.$emit('changeScrollPos');
                                $timeout(function() {
                                    $mainTable.scrollTop(mGridService.getScrollTop());
                                    mGridService.setScrollTop(0); // resetting

                                    // scroll the main table position on last scrolled position..
                                    var scrollPosition = mGridService.getMainTableScrollPosition();

                                    if (scrollPosition) {
                                        $mainTable.scrollLeft(scrollPosition);
                                    } else{
                                       $mainTable.scrollLeft($mainTable.get(0).scrollWidth);
                                    }

                                    setRowHeaderHeight();
                                }, 100);

                                var formElementsArr = $('.focused-cell').find('input, select');
                                if (formElementsArr[0]) {
                                    formElementsArr[0].focus();
                                }
                            },
                            setMainTableScrollPosition = function() {
                                mGridService.setMainTableScrollPosition(0);
                            },
                             /* @ngdoc method
                            * @name speedwing.common.manage-module-grid:gridbodyDirective#onScrollMainTable
                            * @description handles the scroll events if you scroll the table 
                            *              brings the cell into view when focused if cell is hidden
                            */
                            onScrollMainTable = function() {
                                //To close the cell dropdown on 
                                // if(!($('.drop-auto-complete.ui-menu:visible').length !== 1)){
                                //    $(this).find('.ui-autocomplete-input').autocomplete("close"); 
                                // }
                               
                                if(!bringInViewOnCLick && $('.drop-auto-complete.ui-menu:visible').length){
                                   $(this).find('.ui-autocomplete-input').autocomplete("close");
                                   $(this).find('.grid-data-cell.focused-cell').blur();
                                }else{
                                    bringInViewOnCLick=false;
                                }
                               
                                if (this.scrollLeft) {
                                    mGridService.setMainTableScrollPosition(this.scrollLeft+120);
                                }
                            },
                            onScrollContainer = function() {},
                             /* @ngdoc method
                            }
                            * @name speedwing.common.manage-module-grid:gridbodyDirective#getTextCellValue
                            * @description in case of data type "text" get all the required values used in template
                            *              assigned to newscope.values
                            */
                            getTextCellValue=function(item,colId){
                                var assemblyKey = $scope.header[colId].key,
                                    assemblyValues = $scope.selectedModule.assemblyValues,
                                    assemblyValue = assemblyValues[item.key + '_' + assemblyKey] || [],
                                    cellVal = assemblyValue.itemAllowedValueId || '',
                                    showVal = mGridService.setLabelVal(item.allowedValues, cellVal, item.dataType);
                                return{
                                    showVal: showVal,
                                    cellVal: cellVal,
                                    assemblyKey: assemblyKey,
                                    assemblyValue:assemblyValue,
                                    dataKey:item.key + '_' + assemblyKey,
                                    itemKey:item.key
                                };
                                
                            },
                             /* @ngdoc method
                            * @name speedwing.common.manage-module-grid:gridbodyDirective#getDateCellValue
                            * @description in case of data type "Date" get all the required values used in template
                            *              assigned to newscope.values
                            */
                            getDateCellValue=function(item,colId){
                                var assemblyValues = $scope.selectedModule.assemblyValues,
                                    assemblyKey = $scope.header[colId].key,
                                    id = item.key + '_' + assemblyKey,
                                    dateModel = assemblyValues[id] ? assemblyValues[id].itemDateValue: null,
                                    closeClass = !dateModel ? "hidden" : "";

                                    if(dateModel === endDateInFormat){
                                        dateModel = 'No end date';
                                    }
                                    return{
                                        id:id,
                                        itemKey:item.key,
                                        dateModel:dateModel,
                                        assemblyKey: assemblyKey,
                                        closeClass:closeClass
                                    }
                            },
                             /* @ngdoc method
                            * @name speedwing.common.manage-module-grid:gridbodyDirective#getNoValueCellValue
                            * @description in case of data type "No Value" get all the required values used in template
                            *              assigned to newscope.values
                            */
                            getNoValueCellValue=function(item,colId){
                                var selectedValue = $scope.header[colId],
                                    assemblyValues = $scope.selectedModule.assemblyValues,
                                    assemblyKey = selectedValue.key,
                                    assemblyValue = assemblyValues[item.key + '_' + assemblyKey] || [],
                                    cellVal = assemblyValue.itemAvailabilityId || '',
                                    showVal = mGridService.setLabelVal(item.availableValues, cellVal, item.dataType); 
                                    return{
                                        showVal: showVal,
                                        cellVal: cellVal,
                                        assemblyKey: assemblyKey,
                                        assemblyValue:assemblyValue,
                                        dataKey:item.key + '_' + assemblyKey,
                                        itemKey:item.key
                                    }
                            },
                             /* @ngdoc method
                            * @name speedwing.common.manage-module-grid:gridbodyDirective#getNumberCellValue
                            * @description in case of data type "Number" get all the required values used in template
                            *              assigned to newscope.values
                            */
                            getNumberCellValue=function(item,colId){
                                var assemblyValues = $scope.selectedModule.assemblyValues,
                                    assemblyKey = $scope.header[colId].key,
                                    selectedValue = assemblyValues[item.key + '_' + assemblyKey] || [],
                                    itemUnitIdModel = selectedValue.itemUnitId,
                                    cellVal = selectedValue.itemAllowedValueId || '',
                                    itemUnitLabel = mGridService.setLabelVal(item.units, itemUnitIdModel, item.dataType, "unit"),
                                    itemLabel = mGridService.setLabelVal(item.allowedValues, cellVal, item.dataType, "item"),
                                    // JS-16131 for unknown appearing in number item
                                    showVal =  isNaN(itemLabel) ? itemLabel : ModuleContentService.addPrecision(itemLabel,item.precision),
                                    itemNumericValueModel = selectedValue.itemNumericValue || '';
                                    
                                    return{
                                        item:item,
                                        showVal: showVal,
                                        cellVal: cellVal,
                                        assemblyKey: assemblyKey,
                                        dataKey:item.key + '_' + assemblyKey,
                                        itemKey:item.key,
                                        itemUnitLabel:itemUnitLabel,
                                        itemUnitIdModel:itemUnitIdModel,
                                        itemNumericValueModel:itemNumericValueModel,
                                        precision:item.precision,
                                        unit:item.unit
                                    }
                            },
                             /* @ngdoc method
                            * @name speedwing.common.manage-module-grid:gridbodyDirective#getCurrencyCellValue
                            * @description in case of data type "Currency" get all the required values used in template
                            *              assigned to newscope.values
                            */
                            getCurrencyCellValue=function(item,colId){
                                 var assemblyValues = $scope.selectedModule.assemblyValues,
                                    assemblyKey = $scope.header[colId].key,
                                    id = item.key + '_' + assemblyKey,
                                    selectedValue = assemblyValues[id] || [],
                                    showVal = selectedValue.itemNumericValue || '',
                                    cellVal = selectedValue.itemCurrencyId ? selectedValue.itemCurrencyId : _userPreference[constants.preferences.CURRENCY].referenceId,
                                    showLabel = mGridService.setLabelVal($scope.dropdownData, cellVal, item.dataType);
                                    selectedValue.itemCurrencyId=cellVal;
                                    return{
                                        showVal: showVal,
                                        cellVal: cellVal,
                                        assemblyKey: assemblyKey,
                                        dataKey:item.key + '_' + assemblyKey,
                                        itemKey:item.key,
                                        showLabel:showLabel,
                                        itemNumericValue:selectedValue.itemNumericValue
                                    }
                            },
                             /* @ngdoc method
                            * @name speedwing.common.manage-module-grid:gridbodyDirective#handleValueChange
                            * @description [handles change event on input on value change by selecting value from dropdown]
                            *            
                            */
                            handleValueChange=function(event){
                                if(ModuleContentService.changeFlag){
                                     ModuleContentService.changeFlag=false;
                                     updateCellData(event);
                                }
                            },
                             /* @ngdoc method
                            * @name speedwing.common.manage-module-grid:gridbodyDirective#handleTextValueChange
                            * @description [handles change event on input on value change if user enters value]
                            *            
                            */
                            handleTextValueChange=function(event){
                                updateCellData(event);
                            },
                             /* @ngdoc method
                            * @name speedwing.common.manage-module-grid:gridbodyDirective#handleListValueChange
                            * @description [description]
                            *            
                            */
                            handleListValueChange=function(event){
                                var self = $(this),
                                    selectedItem,
                                    itemId, 
                                    checkedBoxLength;

                                    itemId = self.closest('[item-id]').attr('item-id');
                                    checkedBoxLength = $element.find(".module-item-list:checked").length;

                                    mGridService.deleteMultipleFlag = (checkedBoxLength >= 1) ? true : false;

                                    selectedItem = _.find($scope.body, function(item){
                                        return item.id === itemId;
                                    });

                                    if(selectedItem){
                                        selectedItem.isSelected = self.is(":checked");
                                    }

                                    mGridService.addSelectedModule($scope.body);
                                    if(!event.isTrigger)
                                        $scope.$apply();
                            },
                            checkForExistingInput = function(event,$this){
                               
                                if($this.find('input').length > 1){
                                    var side=parseInt($(event.target).attr("data-side"));
                                    var ele=$this.find('input')[side];
                                    var $inputEle = $this.find('input');
                                    $(ele).removeAttr('readonly');
                                    if(side === 0){
                                        $($inputEle[1]).attr("readonly","readonly")
                                    }else{
                                        $($inputEle[0]).attr("readonly","readonly")
                                    }
                                    $(ele).focus();
                                }else{
                                    var autocompleteInput=$this.find('input.custom-autocomplete');
                                    if(autocompleteInput.length){                                        
                                        autocompleteInput.removeAttr('readonly');
                                        autocompleteInput.focus();
                                    }
                                        
                                    
                                    if($(event.target).hasClass('fa-times') && $this.hasClass('custom-calendar')){
                                        var $inputEle = $this.find('input');
                                        if($inputEle.hasClass('has-error')){
                                            $inputEle.removeClass('has-error');
                                             // clearHandlerClick = true;
                                             $inputEle.focus();
                                        }
                                        $this.find('.fa-times').hide();
                                        $this.removeClass('has-error');
                                        updateDateValue($this,event,$this);
                                        clearHandlerClick = false; 

                                    }
                                }
                                    
                                    
                            },
                            /**
                             * [setRowHeaderHeight description]
                             */
                            setRowHeaderHeight = function(){
                                if($mainTable.get(0).scrollWidth > $mainTable.get(0).clientWidth){
                                    $gridWrap.find('.row-header').css({
                                        height:'calc(100% - 16px)'
                                    })
                                }else{
                                    $gridWrap.find('.row-header').css({
                                        height:'calc(100%)'
                                    })
                                }
                            },
                            setFocusOnInput = function($this,event){
                                var input,
                                    length;

                                if($this.find('span.element-content').length>1){
                                    var side=parseInt($(event.target).attr("data-side"))
                                    var ele=$this.find('div.element-container.custom-auto-short')[side];
                                    input = $(ele).find('input');
                                    input.removeAttr("readonly");
                                    input.focus();
                                        
                                }else{
                                    input = $this.find('input.custom-autocomplete');
                                    
                                    if(!input.length){
                                        input=$this.find("input").focus();
                                    }else{
                                        input.removeAttr('readonly');
                                        input.focus();
                                    }
                                }
                                
                                if(input.length && input.val().length){
                                    length = input.val().length;
                                    
                                    input.get(0).setSelectionRange(length,length);
                                    input.focus();
                                }
                            },
                            enableDataTypeDate = function(item,$this,self){
                                if(item.dataType === "Date"){
                                    var $evtTarget = $(event.target);
                                    if($evtTarget.hasClass('fa-times')){
                                        $this.find('.fa-times').hide();
                                        $(self).removeClass('has-error');
                                        updateDateValue($(self),event,$this);
                                        clearHandlerClick = false;                                        
                                    }
                                    $('.main-table input, .main-table textarea').attr('readonly', true);
                                    $('.main-table input.textbox, .main-table input.date-range').removeAttr('readonly');
                                    checkBlurOnDateType=false;    
                                    $('div.main-table').find('.date-range').customdaterange({
                                        singleDatePicker: true,
                                        format: localeDateFormat,
                                        enableToggle:  true ,
                                        enableToggleLabel: $translate.instant('no_end_date'),
                                    },$translate, null, $timeout);
                                    if($evtTarget.hasClass('fa-times')){
                                        $this.find(".element-container").find(".fa-times").trigger("mousedown.datepicker");
                                    }else{
                                        $this.find(".date-range").click();
                                    }                                    
                                }   
                            },
                             /* @ngdoc method
                            * @name speedwing.common.manage-module-grid:gridbodyDirective#addTemplateToCell
                            * @description [on click on cell make it editable by adding input]
                            * todo: make it as another directive       
                            */
                            addTemplateToCell=function(event){
                                if(disableField || !$scope.isOwnedModule) {
                                    return;
                                }
                                var $this = $(this),
                                
                                itmIndex = parseInt($this.attr("data-index")),
                                item = $scope.cellTemplateDataCopy[itmIndex],
                                isOwnedModule = $scope.isOwnedModule,
                                content,res,colId,newScope;
                                
                                res=$this.attr("id");
                                colId=res.split("_")[1];
                                newScope = $rootScope.$new();
                                newScope.values={};
                                clickOnTable=res;
                                bringInViewOnCLick=true;


                                ModuleContentService.scrollFirst($(this), event);
                                if($this.find('input').length){
                                    checkForExistingInput(event,$this);
                                    return false;
                                }
                                switch(item.dataType){
                                    case _dataTypes.TEXT:
                                        if(!$scope.autompleteOptions[item.itemId] && typeof(item.allowedValues) !== "undefined"){
                                            $scope.autompleteOptions[item.itemId]= item.allowedValues;
                                            
                                        }
                                        if(!$scope.extAllowValues[item.itemId] && typeof(item.extAllowValues) !== "undefined") {
                                           $scope.extAllowValues[item.itemId] = item.extAllowValues; 
                                        } 
                                        angular.forEach($scope.autompleteOptions[item.itemId], function(obj) {
                                            if(obj.valueMedium)
                                                obj.value = obj.valueMedium;
                                        });  
                                        newScope.values=getTextCellValue(item,colId); 
                                        content= '<span class="element-container" m-grid-text values="values"  data-is-owned-module="'+isOwnedModule+'" data-disable-field="'+disableField+'" ></span>';
                                        
                                        break;
                                    case _dataTypes.DATE:
                                        newScope.values=getDateCellValue(item,colId);
                                        newScope.values.updateCellData=updateCellData;
                                        content= '<span class="element-container" m-grid-date values="values"  data-is-owned-module="'+isOwnedModule+'" data-disable-field="'+disableField+'" ></span>';
                                        
                                        break;
                                    
                                    case _dataTypes.NOVALUE:
                                        $scope.autompleteOptions[item.itemId]= item.availableValues;
                                        $scope.extAllowValues[item.itemId] = item.extAllowValues;
                                        newScope.values=getNoValueCellValue(item,colId);
                                        content = '<span class="element-container" m-grid-novalue values="values"  data-is-owned-module="'+isOwnedModule+'" data-disable-field="'+disableField+'" ></span>'; 
                                        
                                        break;
                                    case _dataTypes.CURRENCY:
                                        
                                         if(!$scope.autompleteOptions[item.itemId] && typeof(currencyList)!== "undefined"){
                                            $scope.autompleteOptions[item.itemId]=currencyList;          
                                        }  
                                      
                                        $scope.extAllowValues[item.itemId] = false;
                                        newScope.values=getCurrencyCellValue(item,colId);
                                        
                                         content = '<span class="element-container" m-grid-currency  values="values"  data-is-owned-module="'+isOwnedModule+'" data-disable-field="'+disableField+'" ></span>'; 
                                        
                                        break;
                                    case _dataTypes.NUMBER:
                                        if(!$scope.autompleteOptions[item.itemId] && typeof(item.allowedValues) !== "undefined"){
                                            $scope.autompleteOptions[item.itemId]= item.allowedValues;                                                    
                                        }  
                                        if(!$scope.extAllowValues[item.itemId] && typeof(item.extAllowValues) !== "undefined") {
                                           $scope.extAllowValues[item.itemId] = item.extAllowValues; 
                                        } 
                                        newScope.values=getNumberCellValue(item,colId);
                                        var autocompleteType= (typeof($scope.autompleteOptions[item.itemId]) === 'undefined');
                                        
                                        if(item.units && item.units.length){
                                            $scope.unitList[item.itemId] = item.units;
                                            angular.forEach($scope.unitList[item.itemId], function(obj){
                                                angular.extend(obj, {value : obj.unitName });
                                            });
                                        }
                                       
                                        
                                        content='<span class="element-container" m-grid-number  values="values"  data-auto-complete-type="'+autocompleteType+'" data-msrmnt="'+item.msrmntDrpdn+'" data-unitdrp-down="'+item.showUnitDrpdn+'" data-is-owned-module="'+isOwnedModule+'" data-disable-field="'+disableField+'" ></span>'; 
                                        break;
                                }
                                $this.find('span').hide();
                                
                                $this.append($compile(content)(newScope));
                                newScope.$apply();
                                setFocusOnInput($this,event)
                                
                                enableDataTypeDate(item,$this,this);                     
                                $rootScope.isLoading = false;
                                $scope.isRendered = true;
                            },
                            
                            updateDateValue = function($self,event,$this){
                                if(!($self.val() === 'No end date') && $self.val() !== "" && !moment($self.val(), [localeDateFormat, 'DD MMMM YYYY', 'DD MM YYYY', 'D MMM YYYY', 'D MM YYYY','D M YYYY'], true).isValid()){
                                    $self.addClass('has-error'); 
                                    setSaveDisabled();                                        
                                }else{
                                    $self.removeClass('has-error');
                                    setSaveDisabled(); 
                                    if($self.val() === ""){
                                        $this.find('.fa-times').css({"display":"none"})
                                        updateSpan($self, localeDateFormat);
                                        if (event.target.className.split(" ")[0] === "module-input") {
                                            var assemblyValues = $scope.selectedModule.assemblyValues; 
                                            assemblyValues[event.target.classList[1]].itemDateValue = event.target.value;

                                        }
                                        setSaveDisabled(); 
                                    }else if(moment($self.val(), [localeDateFormat, 'DD MMMM YYYY', 'DD MM YYYY', 'D MMM YYYY', 'D MM YYYY','D M YYYY'], true).isValid() && $self.val() !== ""){
                                        var dateVal = $self.val();
                                        var timeOut = $timeout(function(){
                                            if(ModuleContentService.isKeyEvent || ModuleContentService.isManualEntryOfDate)   {
                                                ModuleContentService.isManualEntryOfDate = false;
                                                ModuleContentService.isKeyEvent = false;
                                                updateSpan($self,dateVal);
                                                if(!$self.hasClass('has-error')){
                                                    removeInput($($self.parents('.grid-cell')[0]));
                                                    $scope.selectedModule.assemblyValues[event.target.classList[1]].itemDateValue = dateVal;
                                                }
                                                if (event.target.className.split(" ")[0] === "module-input") {
                                                    var assemblyValues = $scope.selectedModule.assemblyValues; 
                                                    assemblyValues[event.target.classList[1]].itemDateValue = dateVal;

                                                }
                                                setSaveDisabled(); 
                                            }
                                            $timeout.cancel(timeOut);
                                        });
                                    }
                                }
                            },
                             /* @ngdoc method
                            * @name speedwing.common.manage-module-grid:gridbodyDirective#addTemplateToCell
                            * @description [on click on cell make it editable by adding input]
                            * todo: make it as another directive       
                            */
                            handleBlurOnCell = function(event){
                                var timeout,$self=$(this),$this = $(this).parents('.grid-data-cell'); 
                                    var len=$this.find('input').length;
                                    var id=$this.attr("id");
                                if($('.custome-auto-complete').data("prevent-click") === "true" || $('.custome-auto-complete-short').data("prevent-click") === "true"){
                                    event.stopImmediatePropagation();
                                    event.preventDefault();
                                    return false;
                                }
                                if($self.hasClass('date-range') && !clearHandlerClick){
                                    updateDateValue($self,event,$this);
                                    return false;
                                } 
                                if($self.hasClass('date-range') && !checkBlurOnDateType && !clearHandlerClick){                                        
                                    return false;
                                }
                                if(clearHandlerClick){
                                    updateDateValue($self,event,$this);
                                    clearHandlerClick = false;
                                }
                               timeout=$timeout(function(){                                  
                                if(len>1 && clickOnTable===id){
                                    // console.log('blur1')                                      
                                    return false;
                                }else{
                                    // console.log("blur2")                                        
                                    removeInput($this); 
                                                                                          
                                }
                                
                                $timeout.cancel(timeout);
                                }); 
                            },
                             /* @ngdoc method
                            * @name speedwing.common.manage-module-grid:gridbodyDirective#bindEvent
                            * @description bind all the events in main table
                            *            
                            */
                            bindEvent = function() {                                
                                var $body = $('body'),
                                    mainTable = $element.siblings('.main-table'),
                                    $rowColHeader = $gridWrap.find('.row-col-header'),
                                    $rowHeader = $element,
                                    $columnHeader = $gridWrap.find('.column-header'),
                                    prevCellLeft,
                                    currentCellLeft,
                                    prevScrollLeft;
                                
                                mainTable.on('scroll', onScrollMainTable)
                                    .on('change', '.custom-autocomplete',handleValueChange)
                                    .on('change', '.textbox',handleTextValueChange);

                                $element.on('change', ".module-item-list", handleListValueChange);

                                $body.on("mousedown",function(event){                                    
                                    clickOnTable=$(event.target).parents(".grid-data-cell").attr("id");
                                    var $autoComplete = $('.custome-auto-complete');
                                    var $autoCompleteShort = $('.custome-auto-complete-short');
                                    var isIE = window.navigator.userAgent.indexOf("MSIE ") > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)
                                    if(!$(event.target).hasClass('ui-autocomplete') && $autoComplete.data("prevent-click") === "true") {
                                        $autoComplete.data("prevent-click","false");
                                    }
                                    if(!$(event.target).hasClass('ui-autocomplete') && $autoCompleteShort.data("prevent-click") === "true") {
                                        $autoCompleteShort.data("prevent-click","false");
                                    }       
                                    // if( (isIE && $autoComplete.length && $autoComplete.data("prevent-click") === "false") ||  (isIE && $autoCompleteShort.length && $autoCompleteShort.data("prevent-click") === "false")) {                                        
                                    //     // var timeoutVal = $timeout(function(){
                                    //     //     removeInput($mainTable.find("div.grid-data-cell.focused-cell")); 
                                    //     //     $timeout.cancel(timeoutVal);
                                    //     // },200)
                                          
                                    // }
                                                                                             
                                });
                                $('.row-header').on('wheel', onScrollContainer).resizable({  
                                    alsoResize: '.row-col-header',
                                    minWidth: 144,
                                    maxWidth: 414,
                                    handles: 'e',
                                    /*start: function() {
                                        prevScrollLeft = mainTable.scrollLeft();
                                        prevCellLeft = $rowColHeader.width() + 1;
                                    },*/
                                    resize: function() {
                                        setContentAreaWidth($rowColHeader, $rowHeader, $columnHeader, mainTable, false);
                                    },
                                    /*stop: function() {
                                        currentCellLeft = $rowColHeader.width() + 1;
                                        mainTable.scrollLeft(prevScrollLeft+currentCellLeft-prevCellLeft);
                                    }*/
                                });
                                $body.on('mouseover','.custome-auto-complete', function(){
                                    $('.custome-auto-complete').data("prevent-click","true");
                                });
                                $body.on('mouseout','.custome-auto-complete', function(){
                                    $('.custome-auto-complete').data("prevent-click","false");
                                });
                                $body.on('mouseover','.custome-auto-complete-short', function(){
                                    $('.custome-auto-complete-short').data("prevent-click","true");
                                });
                                $body.on('mouseout','.custome-auto-complete-short', function(){
                                    $('.custome-auto-complete-short').data("prevent-click","false");
                                });


                                $mainTable.on("click", ".grid-data-cell",addTemplateToCell);                        
                                
                                $mainTable.on('blur','.grid-data-cell input',handleBlurOnCell);
                                
                            },
                            setContentAreaWidth = function($rowColHeader, $rowHeader, $columnHeader, mainTable, flag) {
                                var cellLeft = flag ? (modulesService.cellLeft || 229) : $rowColHeader.width();
                                $rowColHeader.css({
                                    'width': cellLeft + 1 + 'px'
                                });
                                $rowHeader.css({
                                    'width': cellLeft + 4 + 'px'
                                }).find('.row-header-width').css({
                                    'border-right': 'none'
                                });
                                $columnHeader.find('ul li:first').css({
                                    'min-width': cellLeft + 'px',
                                    'width': cellLeft + 'px'
                                }).find('.col-header-fix').css({
                                    'min-width': cellLeft + 'px'
                                });
                                $mainTableBody.css({
                                    'margin-left': 0
                                });
                                mainTable.css({
                                    'margin-left': cellLeft + 'px'
                                });
                                modulesService.cellLeft = cellLeft;
                                if((mainTable.get(0).scrollLeft + mainTable.get(0).clientWidth+242) >= mainTable.get(0).scrollWidth ){
                                        mainTable.scrollLeft(mainTable.get(0).scrollWidth);
                                }
                            },
                             /* @ngdoc method
                            * @name speedwing.common.manage-module-grid:gridbodyDirective#removeInput
                            * @description removes the added input from cell(input is added on click on cell)
                            *            
                            */
                            removeInput=function($this){
                                $this.removeClass('focused-cell');
                                if($this.find(".element-container").length)
                                    $this.find(".element-container").remove();                                        
                                $this.find("span").show();
                            },
                             /* @ngdoc method
                            * @name speedwing.common.manage-module-grid:gridbodyDirective#checkInViewport
                            * @description checkes whether cell is in viewport or not 
                            *               brings in view if hidden
                            */
                            checkInViewport = function(child, parent) {
                                var posx1 = parent.offset().left + 170,
                                    posx2 = parent.offset().left + parent.width(),
                                    posx3 = child.offset().left,
                                    posx4 = child.offset().left + child.outerWidth();

                                if (posx3 < posx1)
                                    return {
                                        left: posx1 - posx3
                                    };
                                else if (posx4 > posx2)
                                    return {
                                        right: posx4 - posx2
                                    };
                                else
                                    return false;
                            };
                         /* @ngdoc method
                        * @name speedwing.common.manage-module-grid:gridbodyDirective#updateDate
                        * @description [description]
                        *            
                        */
                        $scope.updateDate = function(date, id) {
                            if (date && id) {
                                $scope.selectedModule.assemblyValues[id].itemDateValue = $("." + id).val();
                                $scope.$parent.isSaveDisabled = false;
                            }
                        };
                        /* @ngdoc method
                        * @name speedwing.common.manage-module-grid:gridbodyDirective#prevVal
                        * @description [on rendering of maintable grid structure,this fetches the existing values of cell]
                        *            
                        */
                        var prevVal=function(selectedItemId,i,colId,side){
                            
                            var previousVal,CellVals=[],
                                item=$scope.cellTemplateData ? _.filter($scope.cellTemplateData, function(item){
                                    return item.itemId === selectedItemId;
                                })[0] : [];
                            if(!$scope.autompleteOptions[item.itemId] && typeof(item.allowedValues) !== "undefined"){
                                $scope.autompleteOptions[item.itemId]= item.allowedValues;    

                            }  
                            if(!$scope.extAllowValues[item.itemId] && typeof(item.extAllowValues) !== "undefined") {
                               $scope.extAllowValues[item.itemId] = item.extAllowValues; 
                            } 
                            switch(item.dataType){
                                case _dataTypes.TEXT:
                                    angular.forEach($scope.autompleteOptions[item.itemId], function(obj) {
                                            if(obj.valueMedium)
                                                obj.value = obj.valueMedium;
                                        });   
                                    previousVal=getTextCellValue(item,colId);
                                    CellVals.push(previousVal.showVal)
                                    return CellVals;
                                    break;
                                case _dataTypes.DATE:
                                    previousVal=getDateCellValue(item,colId);
                                    if((previousVal.dateModel) === null){
                                        CellVals.push(localeDateFormat)
                                        return CellVals;
                                    }if((previousVal.dateModel) === endDateInFormat){
                                        CellVals.push("No end date");
                                        return CellVals;
                                    }else{
                                        CellVals.push(previousVal.dateModel)
                                        return CellVals;
                                    }                             
                                    break;
                                case _dataTypes.NOVALUE:
                                    previousVal=getNoValueCellValue(item,colId);
                                    CellVals.push(previousVal.showVal);
                                    return CellVals;
                                    break;
                                case _dataTypes.NUMBER:
                                    previousVal=getNumberCellValue(item,colId);
                                    angular.forEach($scope.autompleteOptions[item.itemId], function(obj) {
                                        if(!obj.value && obj.valueId && obj.valueMedium){
                                            obj.value = obj.valueMedium;
                                        }
                                    }); 
                                    if(item.showUnitDrpdn){
                                        CellVals.push(previousVal.itemNumericValueModel);
                                        CellVals.push(previousVal.itemUnitLabel)
                                        CellVals.push(previousVal.showVal);
                                        
                                    }else{
                                        if(item.msrmntDrpdn){
                                            CellVals.push(previousVal.showVal);
                                        }else{
                                            CellVals.push(previousVal.showVal);
                                            CellVals.push(previousVal.unit);   
                                        }
                                                                    
                                    } 
                                    return CellVals;
                                    break;
                                case _dataTypes.CURRENCY:
                                    previousVal=getCurrencyCellValue(item,colId);
                                    CellVals.push(previousVal.showVal);
                                    CellVals.push(previousVal.showLabel);
                                    return CellVals;
                                    // if(side === "L"){
                                    //     return previousVal.showVal;
                                    // }else if(side === "R"){
                                    //     return previousVal.showLabel;
                                    // }
                                    break;
                            }
                        };
                        /* @ngdoc method
                            * @name speedwing.common.manage-module-grid:gridbodyDirective#changeInRowHeader
                            * @description [starts the formation of table]
                            *            
                            */
                        

                        var changeInRowHeader = $rootScope.$on('changeInRowHeader', function(event, info){
                            createRowHeader(info);
                            var $rowColHeader = $gridWrap.find('.row-col-header'),
                                $rowHeader = $element,
                                $columnHeader = $gridWrap.find('.column-header');
                            setContentAreaWidth($rowColHeader, $rowHeader, $columnHeader, $mainTable, true);
                        });

                        var removeInputFromDate = $rootScope.$on('removeInput', function(event, info) {
                            
                            //handleBlurOnCell(info.elem);
                            if(!$(this).hasClass('has-error')){
                                removeInput(info.elem)
                            }
                        });
                        var resetFinderScrollHeight = $rootScope.$on('resetFinderScrollHeight', function(event, args) {
                               setRowHeaderHeight();
                        });
                        var changeState = $rootScope.$on('change-state', function(e, items){
                            items = _.filter(items, {isSelected: false});
                            _.each(items, function(item, i) {
                                if (!item.isSelected) {
                                    $list.find('li [item-id = '+item.id +']').find('input[type = "checkbox"]').prop('checked', false);
                                }
                            });
                            
                        });

                        var updateOnZoom = $rootScope.$on("updateOnZoom",function(){
                            $timeout(function() {
                                setRowHeaderHeight();
                            });
                        });

                        $scope.$on('$destroy', changeInRowHeader);
                        $scope.$on("$destroy", updateOnZoom);
                        $scope.$on('$destroy', removeInputFromDate);
                        $scope.$on('$destroy', resetFinderScrollHeight);
                        $scope.$on('$destroy', changeState);

                        init();
                        
                        bindEvent();

                    }
                };
            }
        ]);
});