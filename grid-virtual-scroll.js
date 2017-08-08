/**
 * @ngdoc directive
 * @name speedwing.common.manage-module-grid:grid-virtual-scroll dir
 * @requires $window
 * @requires $rootScope
 * @description
 * mVirtualScrollDir is responsible for virtual scroll in the modules grid.
 * It helps in loading limited items and assemblies at a time thus reducing the DOM.
 
*/



define([
        'angular',
        '../../../module',
        './grid-service'
    ], function(angular, lazyModule) {
        'use strict';

        lazyModule
            .directive('mVirtualScrollDir', [
                    '$rootScope',
                    '$timeout',
                    function($rootScope,$timeout) {
                        return {
                            restrict: 'A',
                            controller: ['$scope', function($scope) {
                                $scope.startingPoint=0;            
                                $scope.limitOfItemsInView=12;
                                $scope.itemTopPosition=0;
                                $scope.itemLeftPosition=0;
                                $scope.horzStartPoint=0;
                                $scope.limitOfAssemblies=10
                            }],
                            link: function($scope, $element, $attrs) {
                                
                                var holdingUlSelector =$attrs.holder,
                                    holdingUL = $element.find(holdingUlSelector),
                                    dataList,dataAssemblies,minNumberOfItemsThatCanFit,minNumberOfAssemblyThatCanFit,numberOfItemsToShow=10,numberOfAssemblyToShow,
                                    defaultHeight=26,
                                    defaultWidth=141,
                                    heightOfSingleItem,
                                    widthOfSingleItem,
                                    lastVerticalScroll=0,
                                    lastHorzScroll=0,
                                    handleScroll,
                                    $colHeader = $('.column-header');



                                 /*@ngdoc method
                                * @name speedwing.common.manage-module-grid:mVirtualScrollDir#updateHeightWidth
                                * @description [resets the height and width of grid on events like zoom] 
                                * 
                                */
                                var updateHeightWidth=function(){
                                    // $scope.fontSize=$scope.fontSize*0.9230769230769231;
                                    var colHeaderAddBtnWidth,$ele=$(holdingUlSelector).find('li:first');
                                    heightOfSingleItem = $ele.outerHeight() || defaultHeight;
                                    widthOfSingleItem = $ele.find('div.grid-data-cell:first').outerWidth() || defaultWidth;
                                    $scope.widthOfItem = widthOfSingleItem;
                                    $scope.heightOfItem = heightOfSingleItem;
                                    if($colHeader.find('li.addLi').length){
                                            colHeaderAddBtnWidth = 1.2;
                                        }else{
                                            colHeaderAddBtnWidth = 0;
                                        }
                                     holdingUL.css("height", (((dataList.length * heightOfSingleItem)) / $scope.fontSize) + 2 + "em").css("width", ((dataAssemblies.length) * (widthOfSingleItem / $scope.fontSize)) + colHeaderAddBtnWidth+"em");
                                        $($attrs.rowheader).css("height", (((dataList.length * heightOfSingleItem) + heightOfSingleItem) / $scope.fontSize) + 2 + "em");
                                };
                                 /*@ngdoc method
                                * @name speedwing.common.manage-module-grid:mVirtualScrollDir#updateDataList
                                * @description [sets the total number of items and assemblies available in selected module]
                                * 
                                */
                                var updateDataList=function(){
                                    var colHeaderAddBtnWidth;
                                    dataList=_.filter($scope.body,function(mod){
                                        return mod.entityStatusId != "99";
                                    });
                                    dataAssemblies=_.filter($scope.header,function(assembly){
                                        return assembly.entityStatusId != "99";
                                    });
                                    if (dataList && dataList.length) {
                                    updateHeightWidth();
                                    }
                                    if($colHeader.find('li.addLi').length){
                                            colHeaderAddBtnWidth = 1.2;
                                        }else{
                                            colHeaderAddBtnWidth = 0;
                                        }
                                    if (dataList && dataList.length) {
                                        holdingUL.css("height", (((dataList.length * heightOfSingleItem)) / $scope.fontSize) + 2 +"em").css("width", ((dataAssemblies.length) * (widthOfSingleItem / $scope.fontSize)) + colHeaderAddBtnWidth+"em");
                                        $($attrs.rowheader).css("height", (((dataList.length * heightOfSingleItem) + heightOfSingleItem) / $scope.fontSize) + 2 +"em");
                                    }else{
                                        holdingUL.css("height", 0 + "em").css("width", ((dataAssemblies.length) * (widthOfSingleItem / $scope.fontSize)) + colHeaderAddBtnWidth+"em");
                                        $($attrs.rowheader).css("height", ((0 + heightOfSingleItem) / 13) + "em");
                                    }
                                    
                                };
                                 /*@ngdoc method
                                * @name speedwing.common.manage-module-grid:mVirtualScrollDir#updateNumberOfItemsThatCanFit
                                * @description [sets number of items and assemblies visible in a view]
                                * @param  {[type]}  info [description]
                                */
                                var updateNumberOfItemsThatCanFit=function() {
                                    var clientHeight = $element.get(0).clientHeight;
                                    var clientWidth = $element.get(0).clientWidth;
                                    if (clientHeight === 0) {
                                        return;
                                    }
                                    minNumberOfItemsThatCanFit = Math.floor((clientHeight) / heightOfSingleItem) +5;
                                    minNumberOfAssemblyThatCanFit = Math.floor((clientWidth) / widthOfSingleItem) +5 ;
                                    numberOfItemsToShow = Math.ceil(clientHeight / heightOfSingleItem) + 8;
                                    numberOfAssemblyToShow= Math.ceil(clientWidth / widthOfSingleItem) + 8;
                                    $scope.limitOfItemsInView=numberOfItemsToShow;
                                    $scope.limitOfAssemblies = numberOfAssemblyToShow;
                                    
                                };
                                 /*@ngdoc method
                                * @name speedwing.common.manage-module-grid:mVirtualScrollDir#updateFilteredList
                                * @description [sets the starting position of items]. 
                                * @param  {[type]}  info [description]
                                */
                                var updateFilteredList=function(){
                                    var ele=$element;
                                    var scrolled = ele.scrollTop(),
                                        scrollHeight = ele.get(0).scrollHeight,
                                        clientHeight = ele.get(0).clientHeight,
                                        percentScrolled = Math.floor((scrolled / (scrollHeight - clientHeight)) * 100);
                                        //$('div.row-header').scrollTop(scrolled);
                                        updateHeightWidth();
                                        updateNumberOfItemsThatCanFit();
                                    if (isNaN(percentScrolled)) {
                                        percentScrolled = 0;
                                    } else if (percentScrolled > 100) {
                                        percentScrolled = 100;
                                    }
                                    var itemPosition = Math.floor((percentScrolled * Math.max(Math.min(dataList.length - minNumberOfItemsThatCanFit, dataList.length), 0)) / 100);
                                    $scope.startingPoint=itemPosition;
                                    $scope.itemTopPosition= (itemPosition * heightOfSingleItem);
                                    $scope.$digest();
                                };
                                 /*@ngdoc method
                                * @name speedwing.common.manage-module-grid:mVirtualScrollDir#updateAssemblyList
                                * @description [sets the starting point of assemblies] 
                                * @param  {[type]}  info [description]
                                */
                                var updateAssemblyList=function(){
                                    var scrolled = $element.scrollLeft(),
                                        scrollWidth = $element.get(0).scrollWidth,
                                        clientWidth = $element.get(0).clientWidth,
                                        percentScrolled = Math.floor((scrolled / (scrollWidth - clientWidth)) * 100);
                                    updateHeightWidth();
                                    updateNumberOfItemsThatCanFit();
                                    if (isNaN(percentScrolled)) {
                                        percentScrolled = 0;
                                    } else if (percentScrolled > 100) {
                                        percentScrolled = 100;
                                    }
                                    // var itemPosition= Math.floor((scrolled - 20*$scope.fontSize - 1.2 * $scope.fontSize)/widthOfSingleItem);

                                    var itemPosition=Math.floor((percentScrolled * Math.max(Math.min(dataAssemblies.length - minNumberOfAssemblyThatCanFit, dataAssemblies.length), 0)) / 100);
                                    $scope.horzStartPoint=itemPosition;
                                    $scope.itemLeftPosition = (itemPosition * widthOfSingleItem);
                                    $scope.$digest();
                                };
                                 /*@ngdoc method
                                * @name speedwing.common.manage-module-grid:mVirtualScrollDir#handleScroll
                                * @description [handles the scroll events of table(vertical and horizontal)]. 
                                * @param  {[event]}  info [scroll event]
                                */
                                handleScroll=_.debounce(function(e) {
                                    
                                    // console.log(e.currentTarget.scrollTop,e.currentTarget.scrollLeft);
                                        if(e.currentTarget.scrollTop !== lastVerticalScroll){                            
                                            if(!dataList) {
                                                updateDataList();
                                            }
                                            if((dataList) && (dataList.length))
                                                updateFilteredList();
                                        }
                                        if(e.currentTarget.scrollLeft!==lastHorzScroll){
                                            
                                            if(!dataAssemblies){
                                                updateDataList();
                                            }
                                            if((dataAssemblies) && (dataAssemblies.length)){
                                                updateAssemblyList();
                                            }
                                        }
                                        lastVerticalScroll=e.currentTarget.scrollTop;
                                        lastHorzScroll=e.currentTarget.scrollLeft;
                                        
                                        var timeout = $timeout(function() {
                                            $('.column-header-inner').sortable( "refresh" );
                                            $('.column-header-inner').sortable( "refreshPositions" );
                                            $timeout.cancel(timeout);
                                        }, 1000);
                                        
                                    }, 50);
                            
                                updateDataList();
                                updateNumberOfItemsThatCanFit();
                                
                                 /*@ngdoc 
                                * @name speedwing.common.manage-module-grid:mVirtualScrollDir#bindevents
                                * @description [binds the events]. 
                                * 
                                */
                                $element.on('scroll',handleScroll);


                                var updateVirtualScrollData=$rootScope.$on("updateVirtualScrollData",function(){
                                    updateDataList();
                                });

                                var updateOnZoom=$rootScope.$on("updateOnZoom",function(){
                                    
                                    var timeoutDelay = $timeout(function(){
                                        updateHeightWidth();
                                    
                                        updateNumberOfItemsThatCanFit();
                                        lastHorzScroll = lastHorzScroll +1;
                                        lastVerticalScroll = lastVerticalScroll+1;
                                        $element.scroll();
                                        $timeout.cancel(timeoutDelay);
                                    },10);

                                });
                                 /*@ngdoc 
                                * @name speedwing.common.manage-module-grid:destroy methods
                                * @description [unbinds the events] 
                                * 
                                */
                                $scope.$on("$destroy",updateVirtualScrollData);
                                $scope.$on("$destroy",updateOnZoom);
                                $scope.$on("$destroy",function(){
                                    $element.off('scroll',handleScroll)
                                });
                            }
                        };
                    }]).filter('startFrom', function () {
                        return function (input, start) {
                            if(input !== undefined){
                            start = +start;
                            return input.slice(start);
                        }else{
                            return;
                        }
                        }
                    });
        });