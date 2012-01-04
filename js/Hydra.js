(function (win, doc) {
	'use strict';
	/**
	 * oModules is an object where the modules will be saved.
	 * Empty object declared by default.
	 * @private
	 * @author Tomás Corral Casas
	 * @version 1.1
	 * @type Object
	 */
	var oModules = {},
		/**
		 * Hydra is the private declaration of the Hydra object.
		 * Hydra is declared null by default.
		 * @private
		 * @type Hydra
		 */
		Hydra = null,
		/**
		 * bDebug is a flag to wrap the module methods to avoid cascade failing.
		 * true: The code will fail.
		 * false: The code will log errors.
		 * @private
		 * @type Boolean
		 */
		bDebug = false,
		/**
		 * ErrorHandler is the class that will handle the errors on your code.
		 * Can be changed using setErrorHandler method.
		 * Default ErrorHandler will log messages in console if exist.
		 * If console doesn't exist the error will be logged in a hidden layer.
		 * @private
		 * @type Object
		 */
		ErrorHandler = null,
		/**
		 * BasicErrorHandler is the class that will handle the errors if no ErrorHandler is assigned
		 * @private
		 * @class BasicErrorHandler
		 * @constructor
		 */
		BasicErrorHandler = function () {},
		/**
		* Module is the class that will manage the module system.
		 * @private
		 * @class Module
		 * @constructor
		 */
		Module = function () {},
		/**
		 * Action is the class that will manage the action listeners and notifications.
		 * @private
		 * @class Action
		 * @constructor
		 */
		Action = function () {},
		Promise = null,
		Deferred = null,
		When = null;

	/**
	 * isFunction is a method to know if the object passed as parameter is a Function object.
	 * @private
	 * @param {Object} fpCallback
	 * @return Boolean
	 */
	function isFunction(fpCallback) {
		return Object.prototype.toString.call(fpCallback) === "[object Function]";
	}

	/**
	 * wrapMethod is a method to wrap the original method to avoid failing code.
	 * This will be only called if bDebug flag is setted to false.
	 * @private
	 * @param {Object} oInstance is the module instance to be wrapped
	 * @param {String} sName is the name of the method to be wrapped
	 * @param {String} sModuleId is the module id
	 * @param {Function} fpMethod is the method itself
	 */
	function wrapMethod(oInstance, sName, sModuleId, fpMethod) {
		oInstance[sName] = (function (sName, fpMethod) {
			return function () {
				var aArgs = Array.prototype.slice.call(arguments, 0);
				try {
					return fpMethod.apply(this, aArgs);
				} catch (erError) {
					if (ErrorHandler && isFunction(ErrorHandler.addError)) {
						ErrorHandler.addError(
							new ErrorHandler.Hermes.error(
								ErrorHandler.level.DEBUG,
								"Error inside module.",
								"Module: " + sModuleId + ", Method name:" + sName +
								", Error message: " + erError.message +
								", Error stringified: " + JSON.stringify(erError),
								"Hydra.js"
							)
						);
					} else {
						BasicErrorHandler.log(sModuleId, sName, erError);
					}
				} finally {
					aArgs = null;
				}
			};
		}(sName, fpMethod));
	}

	/**
	 * createInstance is the method that will create the module instance and wrap the method if needed.
	 * @private
	 * @param {String} sModuleId is the module id to be instanced
	 * @return {Object} Module instance
	 */
	function createInstance(sModuleId) {
		if (typeof oModules[sModuleId] === "undefined") {
			throw new Error("The module is not registered!");
		}
		var oAction = new Action(),
			oInstance = oModules[sModuleId].creator(oAction),
			sName = '',
			fpMethod = function () {
			};

		oInstance.__action__ = oInstance.__sandbox__ = oAction;

		if (!bDebug) {
			for (sName in oInstance) {
				if (oInstance.hasOwnProperty(sName)) {
					fpMethod = oInstance[sName];
					if (!isFunction(fpMethod)) {
						continue;
					}
					wrapMethod(oInstance, sName, sModuleId, fpMethod);
				}
			}
		}
		return oInstance;
	}

	/**
	 * type is a property to be able to know the class type.
	 * @member BasicErrorHandler
	 * @static
	 * @type String
	 */
	BasicErrorHandler.type = 'BasicErrorHandler';
	/**
	 * list is a property that will store the DOM object list reference.
	 * Null by default.
	 * @member BasicErrorHandler
	 * @static
	 * @type DOM
	 */
	BasicErrorHandler.list = null;
	BasicErrorHandler.error = function(nLevel, sCategory, sMessage, sFile, nLineNumber) {
		return new Error("Error Category: " + sCategory + ", Message: " + sMessage + ", File: " + sFile + ", Line: " + nLineNumber);
	};
	/**
	 * create_dom is the method that will create the hidden layer to log the errors
	 * on system without console.
	 * @member BasicErrorHandler
	 * @static
	 */
	BasicErrorHandler.create_dom = function () {
		var oLayer = doc.createElement("div"),
			oList = doc.createElement("ul"),
			oLayerStyle = oLayer.style;
		oLayerStyle.display = 'none';
		oLayerStyle.position = "fixed";
		oLayerStyle.height = "100px";
		oLayerStyle.width = "100%";
		oLayerStyle.bottom = "0px";
		this.list = oList;
		oLayer.appendChild(oList);
		doc.body.appendChild(oLayer);
		oLayer = oList = oLayerStyle = null;
	};
	/**
	 * addItem is the method that will add a new item to the list to log the errors
	 * on system without console.
	 * @member BasicErrorHandler
	 * @static
	 * @param {String} sModuleId
	 * @param {String} sMethod
	 * @param {Error} erError
	 */
	BasicErrorHandler.addItem = function (sModuleId, sMethod, erError) {
		var oItem = doc.createElement("li");
		oItem.appendChild(doc.createTextNode(sModuleId + "/" + sMethod + ": " + erError.message));
		this.list.appendChild(oItem);
		oItem = null;
	};
	/**
	 * log is the method that will differenciate the system if they had console or not.
	 * if window.console exist cons ole.log will be called
	 * if window.console not exist then the log on layer will be activated.
	 * Lazy pattern will be used to avoid extra work on next calls.
	 * Arguments are sent to the methods that will be applied.
	 * @member BasicErrorHandler
	 * @static
	 */
	BasicErrorHandler.log = function () {
		var aArgs = Array.prototype.slice.call(arguments, 0);

		if (typeof win.console === "undefined" || (typeof aArgs[aArgs.length - 1] == 'boolean' && !aArgs[aArgs.length - 1])) {
			if (this.list === null) {
				this.create_dom();
			}
			this.addItem.apply(this, aArgs);
			BasicErrorHandler.__old_log__ = BasicErrorHandler.log;
			this.log = function () {
				var aArgs = Array.prototype.slice.call(arguments, 0);
				this.addItem.apply(this, aArgs);
				aArgs = null;
			};
		} else {
			BasicErrorHandler.__old_log__ = BasicErrorHandler.log;
			this.log = function () {
				var aArgs = Array.prototype.slice.call(arguments, 0);
				win["cons" + "ole"].log.apply(win.console, aArgs);
				aArgs = null;
			};
			this.log(aArgs);
		}
		aArgs = null;
	};
	/**
	 * toString returns [object Core] only for instances in Softonic
	 * @return {String}
	 */
	Module.prototype.toString = function() {
		return "[object Core]";
	};
	/**
	 * type is a property to be able to know the class type.
	 * @member Module.prototype
	 * @type String
	 */
	Module.prototype.type = "Module";
	/**
	 * register is the method that will add the new module to the oModules object.
	 * sModuleId will be the key where it will be stored.
	 * @member Module.prototype
	 * @param {String} sModuleId
	 * @param {Function} fpCreator
	 */
	Module.prototype.register = function (sModuleId, fpCreator) {
		oModules[sModuleId] = {
			creator: fpCreator,
			instance: null
		};
	};
	/**
	 * _merge is the method that gets the base module and the extended and returns the merge of them
	 * @private
	 * @param {Object} oModuleBase
	 * @param {Object} oModuleExtended
	 * @param {Boolean} bKeepParent If we keep parent calls to be callable via __super__.
	 * @return Object
	 */
	Module.prototype._merge = function (oModuleBase, oModuleExtended, bKeepParent) {
		var oFinalModule = {};
		if (bKeepParent) {
			oFinalModule.__super__ = {};
			oFinalModule.__super__.__instance__ = oModuleBase;
			oFinalModule.__super__.__call__ = function(sKey, aArgs) {
				var oObject = this;
				while (!(sKey in oObject)) {
					oObject = oObject.__instance__.__super__;
				}
				oObject[sKey].apply(oFinalModule, aArgs);
			};
		}
		var sKey = '';
		for (sKey in oModuleBase) {
			if (oModuleBase.hasOwnProperty(sKey)) {
				if (sKey === "__super__") {
					continue;
				}
				oFinalModule[sKey] = oModuleBase[sKey];
			}
		}
		function callInSupper(fpCallback) {
			return function() {
				var aArgs = Array.prototype.slice.call(arguments, 0);
				fpCallback.apply(this, aArgs);
			};
		}

		for (sKey in oModuleExtended) {
			if (oModuleExtended.hasOwnProperty(sKey)) {
				if (typeof oFinalModule.__super__ !== "undefined" && Object.prototype.toString.call(oFinalModule[sKey]) === "[object Function]") {
					oFinalModule.__super__[sKey] = (callInSupper(oFinalModule[sKey]));

					oFinalModule[sKey] = oModuleExtended[sKey];
				} else {
					oFinalModule[sKey] = oModuleExtended[sKey];
				}
			}
		}
		return oFinalModule;
	};
	/**
	 * extend is the method that will be used to extend a module with new features.
	 * can be used to remove some features too, withou touching the original code.
	 * You can extend a module and create a extended module with a different name.
	 * @member Module.prototype
	 * @param {String} sModuleId
	 * @param {Function/String} oSecondParameter can be the name of the new module that extends the baseModule or a function if we want to extend an existant module.
	 * @param {Function} oThirdParameter [optional] this must exist only if we need to create a new module that extends the baseModule.
	 */
	Module.prototype.extend = Module.prototype.extendModule = function(sModuleId, oSecondParameter, oThirdParameter) {
		var oModule = oModules[sModuleId];
		var sFinalModuleId = sModuleId;
		var fpCreator = function() {
		};
		var oBaseModule = null;
		var oExtendedModule = null;
		var oFinalModule = null;
		var oAction = null;

		// Function "overloading".
		// If the 2nd paraemter is a string,
		if ("string" === typeof oSecondParameter) {
			sFinalModuleId = oSecondParameter;
			fpCreator = oThirdParameter;
		}
		else {
			fpCreator = oSecondParameter;
		}

		if (typeof oModule === "undefined") {
			return;
		}

		oAction = new Action();

		oExtendedModule = fpCreator(oAction);
		oBaseModule = oModule.creator(oAction);

		// If we extend the module with the different name, we
		// create proxy class for the original methods.
		oFinalModule = this._merge(oBaseModule, oExtendedModule, (sFinalModuleId !== sModuleId));

		// This gives access to the Action instance used to listen and notify.
		oFinalModule.__action__ = oAction;

		oModules[sFinalModuleId] =
		{
			creator: function(oAction) {
				return oFinalModule;
			},
			instance: null
		};
	};
	/**
	 * test is a method that will return the module without wrapping their methods.
	 * It's called test because it was created to be able to test the modules with unit testing.
	 * @member Module.prototype
	 * @param {String} sModuleId
	 * @param {Function} fpCallback
	 */
	Module.prototype.test = Module.prototype.testModule = function (sModuleId, fpCallback) {
		bDebug = true;
		fpCallback(createInstance(sModuleId));
		bDebug = false;
	};
	/**
	 * start is the method that will initialize the module.
	 * When start is called the module instance will be created and the init method is called.
	 * @member Module.prototype
	 * @param {String} sModuleId
	 * @param {Object} oData
	 */
	Module.prototype.start = function (sModuleId, oData, bSingle) {
		var oModule = oModules[sModuleId];
		if (bSingle && this.isModuleStarted(sModuleId)) {
			this.stop(sModuleId);
		}
		if (typeof oModule !== "undefined") {
			oModule.instance = createInstance(sModuleId);
			oModule.instance.init(oData);
		}
		oModule = null;
	};
	/**
	 * Checks if module was already successfully started
	 *
	 * @member Module.prototype
	 * @param {String}sModuleId Name of the module
	 * @return boolean
	 */
	Module.prototype.isModuleStarted = function(sModuleId) {
		return ("undefined" !== typeof oModules[sModuleId] && null !== oModules[sModuleId].instance);
	};
	/**
	 * startAll is the method that will initialize all the registered modules.
	 * @member Module.prototype
	 */
	Module.prototype.startAll = function () {
		var sModuleId = '';
		for (sModuleId in oModules) {
			if (oModules.hasOwnProperty(sModuleId)) {
				this.start(sModuleId);
			}
		}
		sModuleId = null;
	};
	/**
	 * stop is the method that will finish the module if it was registered and started.
	 * When stop is called the module will call the destroy method and will nullify the instance.
	 * @member Module.prototype
	 * @param {String} sModuleId
	 */
	Module.prototype.stop = function (sModuleId) {
		var oModule = oModules[sModuleId];
		if (typeof oModule !== "undefined" && oModule.instance !== null) {
			oModule.instance.destroy();
			oModule.instance = null;
		}
	};
	/**
	 * stopAll is the method that will finish all the registered and started modules.
	 * @member Module.prototype
	 */
	Module.prototype.stopAll = function () {
		var sModuleId = '';
		for (sModuleId in oModules) {
			if (oModules.hasOwnProperty(sModuleId)) {
				this.stop(sModuleId);
			}
		}
		sModuleId = null;
	};
	/**
	 * _delete is a wrapper method that will call the native delete javascript function
	 * It's important to test the full code.
	 * @member Module.prototype
	 * @param {String} sModuleId
	 */
	Module.prototype._delete = function (sModuleId) {
		delete oModules[sModuleId];
	};
	/**
	 * remove is the method that will remove the full module from the oModules object
	 * @member Module.prototype
	 * @param {String} sModuleId
	 */
	Module.prototype.remove = function (sModuleId) {
		var oModule = oModules[sModuleId];
		if (typeof oModule !== "undefined") {
			oModules[sModuleId] = null;
			this._delete(sModuleId);
		}
	};
	/**
	 * removeAll is the method that will reset the oModules object
	 * @member Module.prototype
	 * @param {String} sModuleId
	 */
	Module.prototype.removeAll = function () {
		oModules = {};
	};
	/**
	 * type is a property to be able to know the class type.
	 * @member Action.prototype
	 * @type String
	 */
	Action.type = "Action";
	/**
	 * toString overwritte native method
	 * @member Action.prototype
	 * @type String
	 */
	Action.prototype.toString = function() {
		return "[object Sandbox]";
	};
	/**
	 * oActions is the property that will save the actions to be listened
	 * @member Action.prototype
	 * @type Object
	 */
	Action.oActions = Action.aActions = {};
	/**
	 * listen is the method that will add a new action to the oActions object
	 * and that will activate the listener.
	 * @member Action.prototype
	 * @param {Array} aNotificationsToListen
	 * @param {Function} fpHandler
	 * @param {Object} oModule
	 */
	Action.prototype.listen = function (aNotificationsToListen, fpHandler, oModule) {
		var sNotification = '',
			nNotification = 0,
			nLenNotificationsToListen = aNotificationsToListen.length;

		for (; nNotification < nLenNotificationsToListen; nNotification++) {
			sNotification = aNotificationsToListen[nNotification];
			if (typeof Action.oActions[sNotification] === "undefined") {
				Action.oActions[sNotification] = [];
			}
			Action.oActions[sNotification].push({
				module: oModule,
				handler: fpHandler
			});
		}
	};
	/**
	 * notify is the method that will launch the actions that are listening the notified action
	 * @member Action.prototype
	 * @param oNotifier - Notifier.type and Notifier.data are needed
	 */
	Action.prototype.notify = function (oNotifier) {
		var sType = oNotifier.type,
			oAction = null,
			nAction = 0,
			nLenActions = 0,
			oActions = Action.oActions;

		if (typeof oActions[sType] === "undefined") {
			return;
		}

		nLenActions = oActions[sType].length;
		for (; nAction < nLenActions; nAction++) {
			oAction = oActions[sType][nAction];
			if (oAction && oAction.handler) {
				oAction.handler.call(oAction.module, oNotifier);
			}
		}
		sType = oAction = nAction = nLenActions = null;
	};
	/**
	 * stopListen removes the actions that are listening the aNotificationsToStopListen in the oModule
	 * @member Action.prototype
	 * @param {Array} aNotificationsToStopListen
	 * @param {Object} oModule
	 */
	Action.prototype.stopListen = function (aNotificationsToStopListen, oModule) {
		var sNotification = '',
			aArrActions = [],
			aAuxActions = [],
			nNotification = 0,
			nLenNotificationsToListen = aNotificationsToStopListen.length,
			nAction = 0,
			nLenActions = 0,
			oActions = Action.oActions;

		for (; nNotification < nLenNotificationsToListen; nNotification++) {
			aAuxActions = [];
			sNotification = aNotificationsToStopListen[nNotification];
			aArrActions = oActions[sNotification];
			if (typeof aArrActions === "undefined") {
				continue;
			}
			nLenActions = oActions[sNotification].length;

			for (nAction = 0; nAction < nLenActions; nAction++) {
				if (oModule !== oActions[sNotification][nAction].module) {
					aAuxActions.push(oActions[sNotification][nAction]);
				}
			}
			oActions[sNotification] = aAuxActions;
			if (typeof oActions[sNotification] !== "undefined" && oActions[sNotification].length === 0) {
				delete oActions[sNotification];
			}
		}
	};
	/**
	 * __restore__ is a private method to reset the oActions object to an empty object.
	 * @private
	 * @member Action.prototype
	 */
	Action.prototype.__restore__ = function() {
		Action.oActions = Action.aActions = {};
	};
	/**
	 * getAction is a method to gain access to the private Action constructor.
	 * @private
	 * @return Action class
	 */
	function getAction() {
		return new Action();
	}

	/**
	 * Promise is a class that must be used from Deferred object.
	 * Promise object manage an asynchronous execution.
	 * When the execution has gone well is needed to call the Promise instance resolve method
	 * When the execution has gone wrong is needed to call the Promise instance reject method
	 * When one of this methods has been called.
	 * @class Promise
	 * @constructor
	 */
	Promise = function()
    {
        var self = this;
        // Pending callbacks
        this.aPending = [];
        this.bCompleted = false;
        this.sType = '';
        this.oResult = null;
        this.oAction = Hydra.action();
        // Called when something finished successfully
        this.resolve = function(oResult) {
            self.bCompleted = true;
            self.sType = 'resolve';
            self.oResult = oResult;
            self.oAction.notify({type: 'complete'});
        };
        // Called when something broke
        this.reject = function(oResult) {
            self.bCompleted = true;
            self.sType = 'reject';
            self.oResult = oResult;
            self.oAction.notify({type: 'complete'});
        };
    };
	/**
	 * This method sets the success and failure callbacks to be executed when all the promises in deferred object are complete.
	 * @member Promise.prototype
	 * @param fpSuccess
	 * @param fpFailure
	 */
    Promise.prototype.then = function(fpSuccess, fpFailure) {
        this.aPending.push({ resolve: fpSuccess, reject: fpFailure});
        return this;
    };
	/**
	 * Deferred is the class that manages the completion of all the added Promises.
	 * Implements a notify
	 * @class Deferred
	 * @constructor
	 */
    Deferred = function () {
        this.aPromises = [];
        this.aPending = [];
        this.sType = '';
        this.oAction = Hydra.action();
        this.oAction.listen(['complete'], this.checkCompleted, this);
    };
	/**
	 * This method adds a new Promise to the aPromises stack.
	 * @member Deferred.prototype
	 * @param oPromise
	 */
    Deferred.prototype.add = function(oPromise) {
        this.aPromises.push(oPromise);
        return this;
    };
	/**
	 * This method is called when complete is notified it checks if all the Promises are completed.
	 * @member Deferred.prototype
	 */
    Deferred.prototype.checkCompleted = function()
    {
        var nPromise = 0;
        var nLenPromise = this.aPromises.length;
        var oPromise = null;
        for(; nPromise < nLenPromise; nPromise++)
        {
            oPromise = this.aPromises[nPromise];
            if(!oPromise.bCompleted)
            {
                return false;
            }
        }
        this.complete(this.getType());
    };
	/**
	 * This method returns the correct type of callbacks to be executed.
	 * @member Deferred.prototype
	 * @returns {String}
	 */
    Deferred.prototype.getType = function()
    {
        var nPromise = 0;
        var nLenPromises = this.aPromises.length;
        var oPromise = null;
        var aTypes = [];
        var sTypes = '';
        for(; nPromise < nLenPromises; nPromise++)
        {
            oPromise = this.aPromises[nPromise];
            if(oPromise.bCompleted)
            {
                aTypes.push(oPromise.sType);
            }
        }
        if(aTypes.length === 0)
        {
            return "";
        }
        return aTypes.join("").replace(/resolve/g, "").length > 0? 'reject' : 'resolve';
    };
	/**
	 * This method is called only when all the Promises are completed.
	 * Launch all the callbacks in promises and all the callbacks in deferred objects but only the correct type
	 * @member Deferred.prototype
	 * @param sType - Type of callback to be executed -
	 */
    Deferred.prototype.complete = function(sType)
    {
        if(sType.length === 0)
        {
            return false;
        }
        var nPromise = 0;
        var nLenPromises = this.aPromises.length;
        var oPromise = null;
        for(nPromise = 0; nPromise < nLenPromises; nPromise++)
        {
            oPromise = this.aPromises[nPromise];
            while (oPromise.aPending[0]) {
                oPromise.aPending.shift()[sType](oPromise.oResult);
            }
        }
        while(this.aPending[0])
        {
            this.aPending.shift()[sType]();
        }
    };
	/**
	 * This method sets the success and failure callbacks to be executed when all the promises in deferred object are complete.
	 * @member Deferred.prototype
	 * @param fpSuccess
	 * @param fpFailure
	 */
    Deferred.prototype.then = function(fpSuccess, fpFailure) {
        this.aPending.push({ resolve: fpSuccess, reject: fpFailure});
        return this;
    };
	/**
	 * When is a helper method to sets a deferred object
	 * You can use all the deferred methods because if returns a Deferred object instance
	 * @returns {Deferred}
	 */
    When = function()
    {
        this.oDeferred = new Deferred();
        var aArgs = [].slice.call(arguments);
        var nArg = 0;
        var nLenArgs = aArgs.length;
        var oArg = null;
        for(; nArg < nLenArgs; nArg++)
        {
            oArg = aArgs[nArg];
            if(oArg instanceof Promise)
            {
                this.oDeferred.add(oArg);
            }else
            {
                this.oDeferred.complete('resolved');
                return this.oDeferred;
            }
        }
        return this.oDeferred;
    };
	/**
	 * getErrorHandler is a method to gain access to the private ErrorHandler constructor.
	 * @private
	 * @return ErrorHandler class
	 */
	function getErrorHandler() {
		return ErrorHandler;
	}

	/**
	 * setErrorHandler is a method to set the ErrorHandler to a new object to add more logging logic.
	 * @private
	 * @param {Object} oErrorHandler
	 */
	function setErrorHandler(oErrorHandler) {
		ErrorHandler = oErrorHandler;
	}

	/**
	 * setDebug is a method to set the bDebug flag.
	 * @private
	 * @param {Boolean} _bDebug
	 */
	function setDebug(_bDebug) {
		bDebug = _bDebug;
	}

	/*
	 * Hydra is the api that will be available to use by developers
	 */
	Hydra = {
		action: getAction,
		basicErrorHandler: BasicErrorHandler,
		errorHandler: getErrorHandler,
		setErrorHandler: setErrorHandler,
		module: new Module(),
		setDebug: setDebug,
		promise: Promise,
		deferred: Deferred,
		when: When
	};
	/*
	 * This line exposes the private object to be accessible from outside of this code.
	 */
	win.Hydra = Hydra;
	win.Core = Hydra.module;
	win.Sandbox = Action;
}(window, document));
