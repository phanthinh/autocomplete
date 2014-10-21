/**!
 * AngularJS file upload/drop directive with http post and progress
 * @author  Danial  <danial.farid@gmail.com>
 * @version 1.6.12
 */
test.directive('ngFileSelect', function($parse, $timeout) {
	return function(scope, elem, attr) {
		var fn = $parse(attr['ngFileSelect']);
		if (elem[0].tagName.toLowerCase() !== 'input' || (elem.attr('type') && elem.attr('type').toLowerCase()) !== 'file') {
			var fileElem = angular.element('<input type="file">')
			var attrs = elem[0].attributes;
			for (var i = 0; i < attrs.length; i++) {
				if (attrs[i].name.toLowerCase() !== 'type') {
					fileElem.attr(attrs[i].name, attrs[i].value);
				}
			}
			if (attr["multiple"]) fileElem.attr("multiple", "true");
			fileElem.css("width", "1px").css("height", "1px").css("opacity", 0).css("position", "absolute").css('filter', 'alpha(opacity=0)')
					.css("padding", 0).css("margin", 0).css("overflow", "hidden");
			fileElem.attr('__wrapper_for_parent_', true);
			
			elem.append(fileElem);
			elem[0].__file_click_fn_delegate_  = function() {
				fileElem[0].click();
			}; 
			elem.bind('click', elem[0].__file_click_fn_delegate_);
			elem.css("overflow", "hidden");
			elem = fileElem;
		}
		elem.bind('change', function(evt) {
			var files = [], fileList, i;
			fileList = evt.__files_ || evt.target.files;
			if (fileList != null) {
				for (i = 0; i < fileList.length; i++) {
					files.push(fileList.item(i));
				}
			}
			$timeout(function() {
				fn(scope, {
					$files : files,
					$event : evt
				});
			});
		});
	};
});





test.directive('ngFileDrop', function($parse, $timeout, $location) {
	return function(scope, elem, attr) {
		if ('draggable' in document.createElement('span')) {
			var leaveTimeout = null;
			elem[0].addEventListener("dragover", function(evt) {
				evt.preventDefault();
				$timeout.cancel(leaveTimeout);
				if (!elem[0].__drag_over_class_) {
					if (attr['ngFileDragOverClass'] && attr['ngFileDragOverClass'].search(/\) *$/) > -1) {
						var dragOverClass = $parse(attr['ngFileDragOverClass'])(scope, {
							$event : evt
						});					
						elem[0].__drag_over_class_ = dragOverClass; 
					} else {
						elem[0].__drag_over_class_ = attr['ngFileDragOverClass'] || "dragover";
					}
				}
				elem.addClass(elem[0].__drag_over_class_);
			}, false);
			elem[0].addEventListener("dragenter", function(evt) {
				evt.preventDefault();
			}, false);
			elem[0].addEventListener("dragleave", function(evt) {
				leaveTimeout = $timeout(function() {
					elem.removeClass(elem[0].__drag_over_class_);
					elem[0].__drag_over_class_ = null;
				}, attr['ngFileDragOverDelay'] || 1);
			}, false);
			var fn = $parse(attr['ngFileDrop']);
			elem[0].addEventListener("drop", function(evt) {
				evt.preventDefault();
				elem.removeClass(elem[0].__drag_over_class_);
				elem[0].__drag_over_class_ = null;
				extractFiles(evt, function(files) {
					fn(scope, {
						$files : files,
						$event : evt
					});					
				});
			}, false);
						
			function isASCII(str) {
				return /^[\000-\177]*$/.test(str);
			}

			function extractFiles(evt, callback) {
				var files = [], items = evt.dataTransfer.items;
				if (items && items.length > 0 && items[0].webkitGetAsEntry && $location.protocol() != 'file' && 
						items[0].webkitGetAsEntry().isDirectory) {
					for (var i = 0; i < items.length; i++) {
						var entry = items[i].webkitGetAsEntry();
						if (entry != null) {
							//fix for chrome bug https://code.google.com/p/chromium/issues/detail?id=149735
							if (isASCII(entry.name)) {
								traverseFileTree(files, entry);
							} else if (!items[i].webkitGetAsEntry().isDirectory) {
								files.push(items[i].getAsFile());
							}
						}
					}
				} else {
					var fileList = evt.dataTransfer.files;
					if (fileList != null) {
						for (var i = 0; i < fileList.length; i++) {
							files.push(fileList.item(i));
						}
					}
				}
				(function waitForProcess(delay) {
					$timeout(function() {
						if (!processing) {
							callback(files);
						} else {
							waitForProcess(10);
						}
					}, delay || 0)
				})();
			}
			
			var processing = 0;
			function traverseFileTree(files, entry, path) {
				if (entry != null) {
					if (entry.isDirectory) {
						var dirReader = entry.createReader();
						processing++;
						dirReader.readEntries(function(entries) {
							for (var i = 0; i < entries.length; i++) {
								traverseFileTree(files, entries[i], (path ? path : "") + entry.name + "/");
							}
							processing--;
						});
					} else {
						processing++;
						entry.file(function(file) {
							processing--;
							file._relativePath = (path ? path : "") + file.name;
							files.push(file);
						});
					}
				}
			}
		}
	};
});






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













test.directive("ladda", ["$compile", function(a) {
	return {
		restrict: "A",
		link: function(b, c, d) {
			c.addClass("ladda-button"), angular.isUndefined(c.attr("data-style")) && c.attr("data-style", "zoom-out");
			var e = Ladda.create(c[0]);
			a(angular.element(c.children()[0]).contents())(b), b.$watch(d.ladda, function(a) {
				a || angular.isNumber(a) ? (e.isLoading() || e.start(), angular.isNumber(a) && e.setProgress(a)) : e.stop()
			})
		}
	}
}]);





test.directive('infiniteScroll', function($rootScope, $window, $timeout) {
	return {
		link: function(scope, elem, attrs) {
			var checkWhenEnabled, handler, scrollDistance, scrollEnabled;
			$window = angular.element($window);
			scrollDistance = 0;
			if (attrs.infiniteScrollDistance != null) {
				scope.$watch(attrs.infiniteScrollDistance, function(value) {
					return scrollDistance = parseInt(value, 10);
				});
			}
			scrollEnabled = true;
			checkWhenEnabled = false;
			if (attrs.infiniteScrollDisabled != null) {
				scope.$watch(attrs.infiniteScrollDisabled, function(value) {
					scrollEnabled = !value;
					if (scrollEnabled && checkWhenEnabled) {
						checkWhenEnabled = false;
						return handler();
					}
				});
			}
			handler = function() {
				var elementBottom, remaining, shouldScroll, windowBottom;
				windowBottom = $window.height() + $window.scrollTop();
				elementBottom = elem.offset().top + elem.height();
				remaining = elementBottom - windowBottom;
				shouldScroll = remaining <= $window.height() * scrollDistance;
				shouldScroll = false;
				if ($(window).scrollTop() + $(window).height() > $(document).height() - 100) {
					shouldScroll = true;
				}

				if (shouldScroll && scrollEnabled) {
					if ($rootScope.$$phase) {
						return scope.$eval(attrs.infiniteScroll);
					} else {
						return scope.$apply(attrs.infiniteScroll);
					}
				} else if (shouldScroll) {
					return checkWhenEnabled = true;
				}
			};
			$window.on('scroll', handler);
			scope.$on('$destroy', function() {
				return $window.off('scroll', handler);
			});
			return $timeout((function() {
				if (attrs.infiniteScrollImmediateCheck) {
					if (scope.$eval(attrs.infiniteScrollImmediateCheck)) {
						return handler();
					}
				} else {
					return handler();
				}
			}), 2000);
		}
	};
});