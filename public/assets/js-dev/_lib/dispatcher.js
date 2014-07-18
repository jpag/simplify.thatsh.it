'use strict';

/**
 * This is the dispatcher utility object that handles callback queues.
 *
 * @author Chris Lock
 *
 * @param {object} jquery jQuery library.
 * @return {object} Public methods.
 */
 define([], function() {
	/**
	 * Empty load function to match utility pattern.
	 *
	 * @return {void}
	 */
	function load() {}
	/**
	 * Fires a callback if it is a function and passes the callback a parameter
	 * from the utility.
	 *
	 * @param {function} funciton The callback function.
	 * @param {mixed} parameter The parameter the utility passes the callback.
	 * @return {void}
	 */
	function fireCallback(callback, parameter) {
		if (isFunction(callback)) {
			callback(parameter);
		}
	}
	/**
	 * Checks if a variable is a function.
	 *
	 * @param {function} functionToCheck The module to call the method on
	 * @return {bool} Is it a function
	 */
	function isFunction(functionToCheck) {
		var getType = {};

		return (functionToCheck && getType.toString.call(functionToCheck) === '[object Function]');
	}
	/**
	 * All modules should load themselves.
	 */
	load();

	return {
		/**
		 * Loops through the callback queue and passes them to fireCallback
		 *
		 * @param {array} callbacks The queue of callback functions.
		 * @param {mixed} parameter The parameter the utility passes the callback.
		 * @return {void}
		 */
		fireCallbacks: function(callbacks, parameter) {
			var callbacksLength = callbacks.length;

			for (var i = 0; i < callbacksLength; i++) {
				fireCallback(callbacks[i], parameter);
			}
		}
	};
});