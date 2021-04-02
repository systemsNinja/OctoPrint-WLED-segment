/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (function() { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./octoprint_wled/static/src/wled.js":
/*!*******************************************!*\
  !*** ./octoprint_wled/static/src/wled.js ***!
  \*******************************************/
/***/ (function() {

eval("/*\n * View model for OctoPrint WLED Plugin\n *\n * Author: Charlie Powell\n * License: AGPLv3\n */\nvar ko = window.ko;\nvar OctoPrint = window.OctoPrint;\n$(function () {\n  function WLEDViewModel(parameters) {\n    var self = this;\n    var allEventNames = [\"idle\", \"disconnected\", \"started\", \"failed\", \"success\", \"paused\"];\n    self.settingsViewModel = parameters[0];\n    self.lights_on = ko.observable(true);\n\n    self.createEffectObservables = function () {\n      var u_id = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;\n      var effect = {};\n      effect.unique_id = ko.observable(u_id);\n      effect.id = ko.observable(0);\n      effect.brightness = ko.observable(200);\n      effect.color_primary = ko.observable(\"#ffffff\");\n      effect.color_secondary = ko.observable(\"#000000\");\n      effect.color_tertiary = ko.observable(\"#000000\");\n      effect.effect = ko.observable(\"Solid\");\n      effect.intensity = ko.observable(127);\n      effect.speed = ko.observable(127);\n      effect.override_on = ko.observable(false);\n      return effect;\n    };\n\n    self.setEditingObservables = function (effect, data) {\n      effect.editing(data);\n    };\n\n    self.setEffectsFromSettings = function () {\n      var settings = self.settingsViewModel.settings.plugins.wled;\n      allEventNames.forEach(function (name) {\n        self.effects[name].enabled(settings.effects[name].enabled());\n        self.effects[name].segments([]);\n        settings.effects[name].settings().forEach(function (segment, index) {\n          var observables = self.createEffectObservables();\n          observables.unique_id(settings.effects[name].settings()[index].unique_id());\n          observables.id(settings.effects[name].settings()[index].id());\n          observables.brightness(settings.effects[name].settings()[index].brightness());\n          observables.color_primary(settings.effects[name].settings()[index].color_primary());\n          observables.color_secondary(settings.effects[name].settings()[index].color_secondary());\n          observables.color_tertiary(settings.effects[name].settings()[index].color_tertiary());\n          observables.effect(settings.effects[name].settings()[index].effect());\n          observables.speed(settings.effects[name].settings()[index].speed());\n          observables.override_on(settings.effects[name].settings()[index].override_on());\n          self.effects[name].segments.push(observables);\n        });\n      });\n    };\n\n    self.effects = function () {\n      var effects = {};\n      allEventNames.forEach(function (eventName) {\n        effects[eventName] = function () {\n          var eventEffect = {};\n          eventEffect.enabled = ko.observable();\n          eventEffect.segments = ko.observableArray([]);\n          eventEffect.editing = ko.observable(self.createEffectObservables());\n          return eventEffect;\n        }();\n      });\n      return effects;\n    }();\n\n    self.addEffect = function (name) {\n      var uid = self.new_uid(name);\n      var new_effect = self.createEffectObservables(uid);\n      self.effects[name].segments.push(new_effect);\n      self.editEffect(name, new_effect);\n    };\n\n    self.new_uid = function (name) {\n      var highest_uid = 0;\n\n      _.forEach(self.effects[name].segments(), function (segment) {\n        if (segment.unique_id() > highest_uid) {\n          highest_uid = segment.unique_id();\n        }\n      });\n\n      return highest_uid + 1;\n    };\n\n    self.editEffect = function (name, data) {\n      // name: effect type (eg. 'idle')\n      // data: object for editing effect\n      var effect = self.effects[name];\n      self.setEditingObservables(effect, data);\n      self.showEditModal(name);\n    };\n\n    self.deleteEffect = function (name, data) {\n      self.effects[name].segments.remove(data);\n    };\n\n    self.showEditModal = function (name) {\n      $(\"#WLED\" + name + \"EditModal\").modal(\"show\");\n    };\n\n    self.hideEditModal = function (name) {\n      $(\"#WLED\" + name + \"EditModal\").modal(\"hide\");\n    }; // Generic state bindings\n\n\n    self.requestInProgress = ko.observable(false); // Test connection observables & logic\n\n    self.testConnectionStatus = ko.observable();\n    self.testConnectionOK = ko.observable(false);\n    self.testConnectionError = ko.observable();\n    self.testInProgress = ko.observable();\n\n    self.testConnection = function () {\n      var config = {\n        host: self.settingsViewModel.settings.plugins.wled.connection.host(),\n        password: self.settingsViewModel.settings.plugins.wled.connection.password(),\n        port: self.settingsViewModel.settings.plugins.wled.connection.port(),\n        request_timeout: self.settingsViewModel.settings.plugins.wled.connection.request_timeout(),\n        tls: self.settingsViewModel.settings.plugins.wled.connection.tls(),\n        username: self.settingsViewModel.settings.plugins.wled.connection.username(),\n        auth: self.settingsViewModel.settings.plugins.wled.connection.auth()\n      };\n      self.testInProgress(true);\n      self.testConnectionOK(true);\n      self.testConnectionStatus(\"\");\n      self.testConnectionError(\"\");\n      OctoPrint.simpleApiCommand(\"wled\", \"test\", {\n        config: config\n      });\n    };\n\n    self.fromTestResponse = function (response) {\n      self.testInProgress(false);\n\n      if (response.success) {\n        self.testConnectionOK(true);\n        self.testConnectionStatus(response.message);\n        self.testConnectionError(\"\");\n      } else {\n        self.testConnectionOK(false);\n        self.testConnectionStatus(response.error);\n        self.testConnectionError(response.exception);\n      }\n    };\n\n    self.toggle_lights = function () {\n      OctoPrint.simpleApiCommand(\"wled\", self.lights_on() ? \"lights_off\" : \"lights_on\").done(function (response) {\n        self.lights_on(response.lights_on);\n      });\n    }; // API GET response handler\n    // Response is displayed in connection status section of settings\n\n\n    self.statusConnected = ko.observable(false);\n    self.statusConnectionError = ko.observable();\n    self.statusConnectionHost = ko.observable();\n    self.statusConnectionPort = ko.observable();\n    self.statusConnectionVersion = ko.observable();\n    self.availableEffects = ko.observableArray();\n\n    self.fromGetResponse = function (response) {\n      if (response.connected) {\n        self.statusConnected(true);\n        self.statusConnectionHost(response.connection_info.host);\n        self.statusConnectionPort(response.connection_info.port);\n        self.statusConnectionVersion(response.connection_info.version);\n        self.availableEffects(self.listEffects(response.effects));\n      } else {\n        self.statusConnected(false);\n        self.statusConnectionError(response.error + \": \" + response.exception);\n      }\n\n      self.requestInProgress(false);\n    };\n\n    self.listEffects = function (effects) {\n      // parses effects from WLED data to simple list\n      var effect_list = [];\n\n      _.forEach(effects, function (effect) {\n        effect_list.push(effect.name);\n      });\n\n      return effect_list;\n    }; // Viewmodel callbacks\n\n\n    self.onAfterBinding = self.onEventSettingsUpdated = function () {\n      self.setEffectsFromSettings();\n      self.requestInProgress(true);\n      OctoPrint.simpleApiGet(\"wled\").done(function (response) {\n        self.lights_on(response.lights_on);\n      });\n    };\n\n    self.onDataUpdaterPluginMessage = function (plugin, data) {\n      if (plugin !== \"wled\") {\n        return;\n      }\n\n      if (data.type === \"api_get\") {\n        self.fromGetResponse(data.content);\n      } else if (data.type === \"api_post_test\") {\n        self.fromTestResponse(data.content);\n      }\n    };\n\n    self.onSettingsBeforeSave = function () {\n      allEventNames.forEach(function (name) {\n        self.settingsViewModel.settings.plugins.wled.effects[name].settings(self.effects[name].segments());\n        self.settingsViewModel.settings.plugins.wled.effects[name].enabled(self.effects[name].enabled());\n      });\n    };\n  }\n\n  OCTOPRINT_VIEWMODELS.push({\n    construct: WLEDViewModel,\n    dependencies: [\"settingsViewModel\"],\n    elements: [\"#settings_plugin_wled\", \"#navbar_plugin_wled\"]\n  });\n});\n\n//# sourceURL=webpack://octoprint-wled/./octoprint_wled/static/src/wled.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./octoprint_wled/static/src/wled.js"]();
/******/ 	
/******/ })()
;