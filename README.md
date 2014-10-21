Autocomplete
=====

Autocomplete directive



## Requirements

 - AngularJS v1.2.4+

## Installing

Preview example
```html


Add js inline 
```html
	<div angucomplete id="ex1" placeholder="Auto complete..." pause="500" 
		selectedobject="searchItem" localdata="items" searchfields="name" titlefield="name" minlength="1" inputclass="form-control"  descriptionfield="age" imagefield="picture" > 
		</div>


## Example
```css

.angucomplete-holder {
    position: relative;
}

.angucomplete-dropdown {
    border-color: #ececec;
    border-width: 1px;
    border-style: solid;
    border-radius: 2px;
    width: 250px;
    padding: 6px;
    cursor: pointer;
    z-index: 9999;
    position: absolute;
    /*top: 32px;
    left: 0px;
    */
    margin-top: -6px;
    background-color: #ffffff;
}

.angucomplete-searching {
    color: #acacac;
    font-size: 14px;
}

.angucomplete-description {
    font-size: 14px;
}

.angucomplete-row {
    padding: 5px;
    color: #000000;
    margin-bottom: 4px;

}

.angucomplete-selected-row, .angucomplete-row:hover {
    background-color: lightblue;
    color: #ffffff;
}

.angucomplete-image-holder {
    padding-top: 2px;
    float: left;
    height: 34px;
    width: 34px;
    margin-right: 10px;
    margin-left: 5px;
}

.angucomplete-image {
    height: 34px;
    width: 34px;
    border-radius: 50%;
    border-color: #ececec;
    border-style: solid;
    border-width: 1px;
}
```html


<script>

/**
 * Angucomplete
 * Autocomplete directive for AngularJS
 * By Daryl Rowland
 */

test.directive('angucomplete', function ($parse, $http) {
    return {
        restrict: 'EA',
        scope: {
            "id": "@id",
            "placeholder": "@placeholder",
            "selectedObject": "=selectedobject",
            "url": "@url",
            "titleField": "@titlefield",
            "descriptionField": "@descriptionfield",
            "imageField": "@imagefield",
            "inputClass": "@inputclass",
            "userPause": "@pause",
            "localData": "=localdata",
            "searchFields": "@searchfields",
            "minLengthUser": "@minlength",
			"callback": "&onCallback"
        },
        templateUrl: 'autocomplete_tmp.html',
        controller: function ( $scope ) {
            $scope.lastFoundWord = null;
            $scope.currentIndex = null;
            $scope.justChanged = false;
            $scope.searchTimer = null;
            $scope.searching = false;
            $scope.pause = 500;
            $scope.minLength = 3;

            if ($scope.minLengthUser && $scope.minLengthUser != "") {
                $scope.minLength = $scope.minLengthUser;
            }

            if ($scope.userPause) {
                $scope.pause = $scope.userPause;
            }

            $scope.processResults = function(responseData) {
                if (responseData && responseData.length > 0) {
                    $scope.results = [];

                    var titleFields = [];
                    if ($scope.titleField && $scope.titleField != "") {
                        titleFields = $scope.titleField.split(",");
                    }

                    for (var i = 0; i < responseData.length; i++) {
                        // Get title variables
                        var titleCode = "";

                        for (var t = 0; t < titleFields.length; t++) {
                            if (t > 0) {
                                titleCode = titleCode +  " + ' ' + ";
                            }
                            titleCode = titleCode + "responseData[i]." + titleFields[t];
                        }

                        // Figure out description
                        var description = "";

                        if ($scope.descriptionField && $scope.descriptionField != "") {
                            eval("description = responseData[i]." + $scope.descriptionField);
                        }

                        // Figure out image
                        var image = "";

                        if ($scope.imageField && $scope.imageField != "") {
                            eval("image = responseData[i]." + $scope.imageField);
                        }

                        var resultRow = {
                            title: eval(titleCode),
                            description: description,
                            image: image,
                            originalObject: responseData[i]
                        }

                        $scope.results[$scope.results.length] = resultRow;
                    }


                } else {
                    $scope.results = [];
                }
            }

            $scope.searchTimerComplete = function(str) {
                // Begin the search

                if (str.length >= $scope.minLength) {
                    if ($scope.localData) {
                        var searchFields = $scope.searchFields.split(",");

                        var matches = [];

                        for (var i = 0; i < $scope.localData.length; i++) {
                            var match = false;

                            for (var s = 0; s < searchFields.length; s++) {
                                var evalStr = 'match = match || ($scope.localData[i].' + searchFields[s] + '.toLowerCase().indexOf("' + str.toLowerCase() + '") >= 0)';
                                eval(evalStr);
                            }

                            if (match) {
                                matches[matches.length] = $scope.localData[i];
                            }
                        }

                        $scope.searching = false;
                        $scope.processResults(matches);
                        $scope.$apply();


                    } else {
                        $http.get($scope.url + str, {}).
                            success(function(responseData, status, headers, config) {
                                $scope.searching = false;
                                $scope.processResults(responseData);
                            }).
                            error(function(data, status, headers, config) {
                                console.log("error");
                            });
                    }
                }

            }

            $scope.hoverRow = function(index) {
                $scope.currentIndex = index;
            }

            $scope.keyPressed = function(event) {
                if (!(event.which == 38 || event.which == 40 || event.which == 13)) {
                    if (!$scope.searchStr || $scope.searchStr == "") {
                        $scope.showDropdown = false;
                    } else {

                        if ($scope.searchStr.length >= $scope.minLength) {
                            $scope.showDropdown = true;
                            $scope.currentIndex = -1;
                            $scope.results = [];

                            if ($scope.searchTimer) {
                                clearTimeout($scope.searchTimer);
                            }

                            $scope.searching = true;

                            $scope.searchTimer = setTimeout(function() {
                                $scope.searchTimerComplete($scope.searchStr);
                            }, $scope.pause);
                        }
					}

                } else {
                    event.preventDefault();
                }
            }

            $scope.selectResult = function(result) {
                $scope.searchStr = result.title;
                $scope.selectedObject = result;
                $scope.showDropdown = false;
                $scope.results = [];
				
				$scope.callback();
                //$scope.$apply();
            }
        },

        link: function($scope, elem, attrs, ctrl) {

            elem.bind("keyup", function (event) {
                if(event.which === 40) {
                    if (($scope.currentIndex + 1) < $scope.results.length) {
                        $scope.currentIndex ++;
                        $scope.$apply();
                        event.preventDefault;
                        event.stopPropagation();
                    }

                    $scope.$apply();
                } else if(event.which == 38) {
                    if ($scope.currentIndex >= 1) {
                        $scope.currentIndex --;
                        $scope.$apply();
                        event.preventDefault;
                        event.stopPropagation();
                    }

                } else if (event.which == 13) {
                    if ($scope.currentIndex >= 0 && $scope.currentIndex < $scope.results.length) {
                        $scope.selectResult($scope.results[$scope.currentIndex]);
                        $scope.$apply();
                        event.preventDefault;
                        event.stopPropagation();
                    } else {
                        $scope.results = [];
                        $scope.$apply();
                        event.preventDefault;
                        event.stopPropagation();
                    }

                } else if (event.which == 27) {
                    $scope.results = [];
                    $scope.showDropdown = false;
                    $scope.$apply();
                } else if (event.which == 8) {
                    $scope.selectedObject = null;
                    $scope.$apply();
                }
            });


        }
    };
});







</script>


