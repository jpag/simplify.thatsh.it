'use strict';

/**
 * The viewport utility handles window events and returns an object with the
 * current viewport height, width, scroll top, scoll bottom, scroll total and
 * scroll distance.
 *
 * @author Chris Lock
 *
 * @param {object} dispatcher Dispatcher utility.
 * @return {object} Public methods.
 */
define(['dispatcher'], function(dispatcher) {
		/** @constant Scroll to speed. */
	var SCROLL_TO_SPEED = 500;

		/** @type {int} The object of curretn viewport projects. */
	var currentViewport = {
			width: 0,
			height: 0,
			scrollStart: 0,
			scrollDistance: 0,
			scrollTop: 0,
			scrollBottom: 0,
			scrollMax: 0
		},
		/** @type {bool} Is requestAnimationFrame supported. */
		requestAnimationFrameIsSupported = false,
		/** @type {int} The id for the request animaiton frame for scroll. */
		animationFrameIdScroll = null,
		/** @type {bool} Have we requested a animation frame for scroll. */
		hasRequestedAnimationFrameScroll = false,
		/** @type {int} The id for the request animaiton frame for resize. */
		animationFrameIdResize = null,
		/** @type {bool} Have we requested a animation frame for resize. */
		hasRequestedAnimationFrameResize = false,
		/** @type {bool} Should we fire window scroll events. */
		isScrolling = true,
		/** @type {bool} Is this touch scrolling. */
		isTouchScrolling = false,
		/** @type {int} The scrollTop when touch started. */
		scrollTopTouchStart = 0,
		/** @type {int} The client y when touch started. */
		scrollTouchClientYStart = 0,
		/** @type {int} The client y durring touch events. */
		scrollTouchClientYCurrent = 0,
		/** @type {int} The page y when touch started. */
		scrollTouchPageYStart = 0,
		/** @type {int} The page y durring touch events. */
		scrollTouchPageYCurrent = 0,
		/** @type {int} The timer used to detect scroll stop. */
		scrollTimer = setTimeout(function() {}),
		/** @type {int} The number of milliseconds of inactivity considered a scroll stop. */
		scrollTimerLatency = 300,
		/** @type {object} Callback queue for each event. */
		callbacks = {
			scroll: [],
			scrollUp: [],
			scrollDown: [],
			touch: {
				scroll: [],
				scrollUp: [],
				scrollDown: []
			},
			resize: []
		},
		/** @type {object} Set scrollTop values for different namespaces. */
		scrollTop = {
			top: 0
		},
		/** @type {object} The end position for resetScrollTop. */
		resetScrollTopEnd = 0,
		/** @type {int} The current document height. */
		documentHeight = 0,
		/** @type {int} The id for timeout used in scrollTo. */
		timeoutIdScrollTo = null,
		/** @type {int} The id for request animaiton frame used in scrollTo. */
		animationFrameIdScrollTo = null;

	/**
	 * Binds window resize and scroll.
	 *
	 * @return {void}
	 */
	function load() {
		updateGetFunctions();
		updateCurrentViewport();
		bindScrollEvents();
		bindResizeEvents();
	}
	/**
	 * We update all get functions to reduce the overhead added by polyfills.
	 *
	 * @return {void}
	 */
	function updateGetFunctions() {
		updateRequestAnimationFrame();
		updateGetWindowDimensions();
		updateGetDocumentScrollTop();
		updateGetDocumentHeight();
	}
	/**
	 * Binds window scroll for default events and touch events for touch scroll.
	 *
	 * @return {void}
	 */
	function bindScrollEvents() {
		window.onscroll = handleScrollOptimized;
		addEvent('touchstart', startTouchScroll);
		addEvent('touchmove', handleTouchScroll);
		addEvent('touchend', endTouchScroll);
		addEvent('touchcancel', endTouchScroll);
	}
	/**
	 * Binds resize events and watches the dom for height changes.
	 *
	 * @return {void}
	 */
	function bindResizeEvents() {
		window.onresize = handleResizeOptimized;
		watchHtmlResize();
	}
	/**
	 * Adds support for requestAnimationFrame for older browsers. If we can't
	 * add it, then make it a warpper to simply fire the callback.
	 *
	 * @return {void}
	 */
	function updateRequestAnimationFrame() {
		var vendors = [
				'webkit',
				'moz',
				'o',
				'ms'
			];

		for(var i = vendors.length - 1; i > -1 && !window.requestAnimationFrame; i--) {
			window.requestAnimationFrame = window[vendors[i]+'RequestAnimationFrame'];
			window.cancelAnimationFrame =
				window[vendors[i]+'CancelAnimationFrame'] ||
				window[vendors[i]+'CancelRequestAnimationFrame'];
		}

		if (!window.requestAnimationFrame) {
			window.requestAnimationFrame = function(callback) {
				callback();
			};
		} else {
			requestAnimationFrameIsSupported = true;
		}

		if (!window.cancelAnimationFrame) {
			window.cancelAnimationFrame = function() {};
		}
	}
	/**
	 * Gets the window width. Set as an optimized function later.
	 *
	 * @return {int} The window width.
	 */
	var getWindowWidth;
	/**
	 * Gets the window height. Set as an optimized function later.
	 *
	 * @return {int} The window height.
	 */
	var getWindowHeight;
	/**
	 * Rather than run a polyfill inside getWindowWidth and getWindowHeight
	 * every time it's called, let's optimize it to just return the right
	 * property.
	 *
	 * @return {void}
	 */
	function updateGetWindowDimensions() {
		if (window.innerHeight) {
			getWindowWidth = function() {
				return window.innerWidth;
			};
			getWindowHeight = function() {
				return window.innerHeight;
			};
		} else if (document.documentElement.clientHeight) {
			getWindowWidth = function() {
				return document.documentElement.clientWidth;
			};
			getWindowHeight = function() {
				return document.documentElement.clientHeight;
			};
		} else if (document.body.clientHeight) {
			getWindowWidth = function() {
				return document.body.clientWidth;
			};
			getWindowHeight = function() {
				return document.body.clientHeight;
			};
		}
	}
	/**
	 * Gets the document scroll top. Set as an empty function to be optimized
	 * later.
	 *
	 * @return {int} The document scroll top.
	 */
	var getDocumentScrollTop;
	/**
	 * It's possible to run a polyfill inside getDocumentScrollTop, but let's
	 * just return the right property.
	 *
	 * @return {void}
	 */
	function updateGetDocumentScrollTop() {
		if (window.pageYOffset !== undefined) {
			getDocumentScrollTop = function() {
				return window.pageYOffset;
			};
		} else if (document.documentElement) {
			getDocumentScrollTop = function() {
				return document.documentElement.scrollTop;
			};
		} else if (document.body.parentNode) {
			getDocumentScrollTop = function() {
				return document.body.parentNode.scrollTop;
			};
		} else if (document.body) {
			getDocumentScrollTop = function() {
				return document.body.scrollTop;
			};
		}
	}
	/**
	 * Gets the document height. Set as an optimized function later.
	 *
	 * @return {int} The document height.
	 */
	var getDocumentHeight;
	/**
	 * It's possible to run Math.max inside of getDocumentHeight, but returning
	 * the proper property is far more efficient.
	 *
	 * @return {void}
	 */
	function updateGetDocumentHeight() {
		var documentHeight = 0;

		if (documentHeight <= document.body.scrollHeight) {
			documentHeight = document.body.scrollHeight;

			getDocumentHeight = function() {
				return document.body.scrollHeight;
			};
		}

		if (documentHeight <= document.body.offsetHeight) {
			documentHeight = document.body.offsetHeight;

			getDocumentHeight = function() {
				return document.body.offsetHeight;
			};
		}

		if (documentHeight <= document.documentElement.clientHeight) {
			documentHeight = document.documentElement.clientHeight;

			getDocumentHeight = function() {
				return document.documentElement.clientHeight;
			};
		}

		if (documentHeight <= document.documentElement.scrollHeight) {
			documentHeight = document.documentElement.scrollHeight;

			getDocumentHeight = function() {
				return document.documentElement.scrollHeight;
			};
		}

		if (documentHeight <= document.documentElement.offsetHeight) {
			documentHeight = document.documentElement.offsetHeight;

			getDocumentHeight = function() {
				return document.documentElement.offsetHeight;
			};
		}
	}
	/**
	 * Updates the current viewport width and height, and ensures the scrollTop
	 * is not outside the window since webkit continues firing scroll events
	 * when over scrolling.
	 *
	 * @return {void}
	 */
	function updateCurrentViewport() {
		currentViewport.width = getWindowWidth();
		currentViewport.height = getWindowHeight();
		currentViewport.scrollMax = getDocumentHeight() - currentViewport.height;
		currentViewport.scrollTop = Math.min(
			currentViewport.scrollMax,
			Math.max(
				getDocumentScrollTopAll(),
				0
			)
		);
		currentViewport.scrollBottom = currentViewport.scrollTop + currentViewport.height;
	}
	/**
	 * A wrapper to get scrollTop for both non touch and touch scrolling.
	 *
	 * @return {int} The document scroll top.
	 */
	function getDocumentScrollTopAll() {
		return (isTouchScrolling)
			? getDocumentScrollTopTouch()
			: getDocumentScrollTop();
	}
	/**
	 * Gets the approximate scroll top based on the the client y change during
	 * touch. For some reason this is consistently 10px off.
	 *
	 * @return {int} The approximate document scroll top.
	 */
	function getDocumentScrollTopTouch() {
		var scrollTouchClientYChange = scrollTouchClientYStart - scrollTouchClientYCurrent,
			scrollTouchPageYChange = scrollTouchPageYCurrent - scrollTouchPageYStart;

		return scrollTopTouchStart + scrollTouchClientYChange + scrollTouchPageYChange;
	}
	/**
	 * Wraps handleScroll in requestAnimationFrame to optimize performace and
	 * checks to see if we've already requested an animation frame to prevent
	 * stacking.
	 *
	 * @return {void}
	 */
	function handleScrollOptimized() {
		handleOptimized(
			hasRequestedAnimationFrameScroll,
			animationFrameIdScroll,
			handleScroll
		);
	}
	/**
	 * Wrapper to check if animation frame has been requested, to cancel any
	 * stacked request, and add the new request.
	 *
	 * @return {void}
	 */
	function handleOptimized(hasRequestedAnimationFrame, animationFrameId, method) {
		if (!hasRequestedAnimationFrame) {
			hasRequestedAnimationFrame = true;

			window.cancelAnimationFrame(animationFrameId);
			animationFrameId = window.requestAnimationFrame(method);
		}
	}
	/**
	 * Fires all viewport.scroll, viewport.scrollUp, and viewport.scrollDown
	 * callbacks based on the scroll direction.
	 *
	 * @return {void}
	 */
	function handleScroll() {
		hasRequestedAnimationFrameScroll = false;

		var windowTopPrev = currentViewport.scrollTop;

		if (!isScrolling) {
			watchForResetScrollTopFinish();

			return;
		}

		updateCurrentViewport();
		updateCurrentViewportScroll();

		fireCallbacks('scroll', currentViewport, isTouchScrolling);

		if (windowTopPrev > currentViewport.scrollTop) {
			fireCallbacks('scrollUp', currentViewport, isTouchScrolling);
		} else if (windowTopPrev != currentViewport.scrollTop) {
			fireCallbacks('scrollDown', currentViewport, isTouchScrolling);
		}
	}
	/**
	 * Checks the scroll top to see if resetScrollTop has finished.
	 *
	 * @return {void}
	 */
	function watchForResetScrollTopFinish() {
		var scrollFinishInterval = setInterval(function() {
			if (getDocumentScrollTop() == resetScrollTopEnd) {
				isScrolling = true;

				clearInterval(scrollFinishInterval);
			}
		}, 1);
	}
	/**
	 * Updates the scroll distance
	 *
	 * @return {void}
	 */
	function updateCurrentViewportScroll() {
		clearTimeout(scrollTimer);

		currentViewport.scrollDistance = currentViewport.scrollTop - currentViewport.scrollStart;

		scrollTimer = setTimeout(function() {
			currentViewport.scrollStart = currentViewport.scrollTop;
		}, scrollTimerLatency);
	}
	/**
	 * A wrapper for firing callbacks to handle touch and non touch callbacks.
	 *
	 * @param {string} callbackType The type of callback being fired
	 * @param {object} currentViewport The object containing the current viewport
	 * @param {bool} isTouchScrolling Is this a touch scroll event
	 * @return {void}
	 */
	function fireCallbacks(callbackType, currentViewport, isTouchScrolling) {
		dispatcher.fireCallbacks(callbacks[callbackType], currentViewport);

		if (isTouchScrolling) {
			dispatcher.fireCallbacks(callbacks.touch[callbackType], currentViewport);
		}
	}
	/**
	 * Wrapper for addEventListener since IE8 is a whiny baby and doesn't
	 * support it.
	 *
	 * @return {void}
	 */
	function addEvent(event, eventFunction) {
		if (document.addEventListener) {
			document.addEventListener(event, eventFunction);
		}
	}
	/**
	 * Wrapper for addEventListener since IE8 is a whiny baby and doesn't
	 * support it.
	 *
	 * @return {void}
	 */
	function startTouchScroll(event) {
		scrollTopTouchStart = currentViewport.scrollTop;
		scrollTouchPageYStart = scrollTouchPageYCurrent = getTouchPageY(event);
		scrollTouchClientYStart = scrollTouchClientYCurrent = getTouchClientY(event);
	}
	/**
	 * Gets the page y from the touch even.
	 *
	 * @param {object} event The touch event
	 * @return {int} The page y.
	 */
	function getTouchPageY(event) {
		return getTouch(event).pageY;
	}
	/**
	 * A wrapper to get touch events since touchstart uses event.touches and
	 * touchend uses event.changedTouches.
	 *
	 * @param {object} event The touch event
	 * @return {object} The touch.
	 */
	function getTouch(event) {
		var touches = event.touches
				|| event.changedTouches
				|| event.originalEvent.touches
				|| event.originalEvent.changedTouches;

		return touches[0];
	}
	/**
	 * Gets the client y from the touch event.
	 *
	 * @param {object} event The touch event
	 * @return {int} The client y.
	 */
	function getTouchClientY(event) {
		return getTouch(event).clientY;
	}
	/**
	 * Wrapper for addEventListener since IE8 is a whiny baby and doesn't
	 * support it.
	 *
	 * @return {void}
	 */
	function handleTouchScroll() {
		scrollTouchPageYCurrent = getTouchPageY(event);
		scrollTouchClientYCurrent = getTouchClientY(event);

		isTouchScrolling = true;

		handleScroll();

		isTouchScrolling = false;
	}
	/**
	 * Wrapper for addEventListener since IE8 is a whiny baby and doesn't
	 * support it.
	 *
	 * @param {string} listenTo Event to listen to
	 * @param {function} eventFunction The funciton to add to the event
	 * @return {void}
	 */
	function endTouchScroll() {
		handleScroll();
	}
	/**
	 * Wraps handleResize in requestAnimationFrame to optimize performace and
	 * checks to see if we've already requested an animation frame to prevent
	 * stacking.
	 *
	 * @return {void}
	 */
	function handleResizeOptimized() {
		handleOptimized(
			hasRequestedAnimationFrameResize,
			animationFrameIdResize,
			handleResize
		);
	}
	/**
	 * Fires all viewport.resize callbacks.
	 *
	 * @return {void}
	 */
	function handleResize() {
		hasRequestedAnimationFrameResize = false;

		updateCurrentViewport();
		dispatcher.fireCallbacks(callbacks.resize, currentViewport);
	}
	/**
	 * Checks to see if the html has been resized.
	 *
	 * @return {void}
	 */
	function watchHtmlResize() {
		if (requestAnimationFrameIsSupported) {
			checkHtmlSizeOptimized();
		} else {
			setInterval(checkHtmlSize, 1);
		}
	}
	/**
	 * Wraps checkHtmlSize in requestAnimationFrame to optimize performace.
	 *
	 * @return {void}
	 */
	function checkHtmlSizeOptimized() {
		checkHtmlSize();
		window.requestAnimationFrame(checkHtmlSizeOptimized);
	}
	/**
	 * Checks the html size and fires window resize if it has changed.
	 *
	 * @return {void}
	 */
	function checkHtmlSize() {
		if (documentHeight != getDocumentHeight()) {
			documentHeight = getDocumentHeight();

			handleResize();
		}
	}
	/**
	 * Gets the distance we need to scroll to to reach an alement accounting for
	 * another element like a fixed header.
	 *
	 * @param {string} selector The selector of the element we want to scroll to
	 * @param {string} selectorToOffset The selector of the element want to account for when scrolling
	 * @return {void}
	 */
	function getScrollDistance(selector, selectorToOffset) {
		var element = document.querySelector(selector),
			elementOffset = getOffset(element).y,
			elementToOffset = {},
			elementToOffsetOffset = 0;

		if (selectorToOffset) {
			elementToOffset = document.querySelector(selectorToOffset);
			elementToOffsetOffset = getOffset(elementToOffset).y;
		}

		return elementOffset - elementToOffsetOffset;
	}
	/**
	 * Gets the x and y offset for a given element.
	 *
	 * @param {object} element The element to get the offset for
	 * @return {void}
	 */
	function getOffset(element) {
		var positionX = 0,
			positionY = 0;

		while (element) {
			positionX += (element.offsetLeft - element.scrollLeft + element.clientLeft);
			positionY += (element.offsetTop - element.scrollTop + element.clientTop);
			element = element.offsetParent;
		}

		return {
			x: positionX,
			y: positionY
		};
	}
	/**
	 * Animates the window scrolling to a given position in a given time using
	 * requestAnimationFrame if available.
	 *
	 * @src http://javascript.info/tutorial/animation
	 *
	 * @param {int} scrollY The final scroll position
	 * @param {int} duration The time to scroll in
	 * @return {void}
	 */
	function scrollTo(scrollY, duration) {
		var timeStart = new Date().getTime();

		if (requestAnimationFrameIsSupported) {
			window.cancelAnimationFrame(animationFrameIdScrollTo);

			animationFrameIdScrollTo = window.requestAnimationFrame(function() {
				scrollToWithRequestAnimationFrame(scrollY, timeStart, duration);
			});
		} else {
			clearTimeout(timeoutIdScrollTo);

			scrollToWithTimeout(scrollY, duration);
		}
	}
	/**
	 * Animates the window scrolling to a given position in a given time with
	 * requestAnimationFrame.
	 *
	 * @src http://javascript.info/tutorial/animation
	 *
	 * @param {int} scrollY The final scroll position
	 * @param {int} timeStart The time the animation started
	 * @param {int} duration The time to scroll in
	 * @return {void}
	 */
	function scrollToWithRequestAnimationFrame(scrollY, timeStart, duration) {
		var time = new Date().getTime(),
			scrollYNew = ((time - timeStart) / duration * scrollY) % scrollY;

		if (time >= (timeStart + duration)) {
			scrollYNew = scrollY;
		}

		window.scrollTo(0, scrollYNew);

		if (scrollYNew < scrollY) {
			animationFrameIdScrollTo = window.requestAnimationFrame(function() {
				scrollToWithRequestAnimationFrame(scrollY, timeStart, duration);
			});
		}
	}
	/**
	 * Animates the window scrolling to a given position in a given time with
	 * setTimeout.
	 *
	 * @src http://javascript.info/tutorial/animation
	 *
	 * @param {int} scrollY The final scroll position
	 * @param {int} duration The time to scroll in
	 * @return {void}
	 */
	function scrollToWithTimeout(scrollY, duration) {
		if (duration < 0) {
			return;
		}

		var difference = scrollY - currentViewport.scrollTop,
			differencePerInterval = difference / duration * 10,
			scrollYNew = currentViewport.scrollTop + differencePerInterval;

		timeoutIdScrollTo = setTimeout(function() {
			window.scrollTo(0, scrollYNew);
			handleScroll();

			if (scrollYNew < scrollY) {
				scrollToWithTimeout(scrollY, duration - 10);
			}
		}, 10);
	}
	/**
	 * Added a callback for a scroll event and adds it to touch events if asked.
	 *
	 * @param {string} event The enter or leave event.
	 * @param {function} callback The callback to add to the queue.
	 * @param {bool} shouldAddToTouch Should the event be added to touch scroll
	 * @return {void}
	 */
	function addCallbackToEvent(event, callback, shouldAddToTouch) {
		callbacks[event].push(callback);

		if (shouldAddToTouch) {
			callbacks.touch[event].push(callback);
		}
	}
	/**
	 * All modules should load themselves.
	 */
	load();

	return {
		/**
		 * Adds a function to the scroll queue for non touch or touch events.
		 * Touch scroll events are not the most consistent or accurate.
		 *
		 * @param {function} function The callback function to add to the scroll queue
		 * @param {bool} shouldAddToTouch Should the event be added to touch scroll
		 * @return {object} Current viewport
		 */
		scroll: function(callback, shouldAddToTouch) {
			addCallbackToEvent('scroll', callback, shouldAddToTouch);
		},
		/**
		 * Adds a function to the scrollUp queue for non touch or touch events.
		 * Touch scroll events are not the most consistent or accurate.
		 *
		 * @param {function} function The callback function to add to the scrollUp queue
		 * @param {bool} shouldAddToTouch Should the event be added to touch scroll
		 * @return {object} Current viewport
		 */
		scrollUp: function(callback, shouldAddToTouch) {
			addCallbackToEvent('scrollUp', callback, shouldAddToTouch);
		},
		/**
		 * Adds a function to the scrollDown queue for non touch or touch events.
		 * Touch scroll events are not the most consistent or accurate.
		 *
		 * @param {function} function The callback function to add to the scrollDown queue
		 * @param {bool} shouldAddToTouch Should the event be added to touch scroll
		 * @return {object} Current viewport
		 */
		scrollDown: function(callback, shouldAddToTouch) {
			addCallbackToEvent('scrollDown', callback, shouldAddToTouch);
		},
		/**
		 * Adds a function to the callbacks.resize queue.
		 *
		 * @param {function} function The callback function to add to the callbacks.resize queue
		 * @return {object} Current viewport
		 */
		resize: function(callback) {
			callbacks.resize.push(callback);
		},
		/**
		 * Scrolls the viewport to a y position accomodating for the header.
		 *
		 * @param {int} position The y position to scroll to
		 * @return {void}
		 */
		scrollTo: function(selector, selectorToOffset) {
			var maxScroll = Math.min(
					getScrollDistance(selector, selectorToOffset),
					currentViewport.scrollMax
				);

			scrollTo(maxScroll, SCROLL_TO_SPEED);
		},
		/**
		 * Gets the current viewport.
		 *
		 * @return {object} Current viewport
		 */
		get: function() {
			return currentViewport;
		},
		/**
		 * Sets the scrollTop for a given namespace.
		 *
		 * @return {object} Current viewport
		 */
		setScrollTop: function(namespace) {
			scrollTop[namespace] = currentViewport.scrollTop;
		},
		/**
		 * Resets the scrollTop for a given namespace and prevents scroll events
		 * from firing.
		 *
		 * @return {object} Current viewport
		 */
		resetScrollTop: function(namespace) {
			var namespaceScrollTop = scrollTop[namespace];

			if (typeof namespaceScrollTop !== 'undefined') {
				resetScrollTopEnd = namespaceScrollTop;
				isScrolling = false;

				window.scrollTo(0, resetScrollTopEnd);
			}
		},
		/**
		 * Unsets the scrollTop for a given namespace.
		 *
		 * @return {object} Current viewport
		 */
		unsetScrollTop: function(namespace) {
			delete scrollTop[namespace];
		}
	};
});