/*
 * Licensed to the Nervousync Studio (NSYC) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/*
 * 1.0.0
 * [New] Send Ajax Request
 * [New] Encode form data,
 * [New] Template Render
 * [New] Multilingual Support
 * [New] Core CellJS
 */
var HttpClient = Class.create();
HttpClient.prototype = {
    constructor : function(url, options) {
        this._options = {
            method : "get",
            elementId : "",
            userName : null,
            passWord : null,
            asynchronous : true,
            onCreate : null,
            onComplete : null,
            onError : null,
            onFinished : null
        };
        Object.extend(this._options, options || {});
        this._request = HttpClient._initialize(url, this._options);
    },

    addHeader : function(headerName, headerValue) {
        this._request.setRequestHeader(headerName, headerValue);
    },

    send : function(parameters) {
        this.addHeader("cache-control", "no-cache");
        this.addHeader("X-Requested-With", "XMLHttpRequest");
        var _jwtToken = sessionStorage.getItem("JWTToken");
        if (_jwtToken != null) {
            this.addHeader("Authorization", _jwtToken);
        }

        if (parameters != null && parameters.uploadFile) {
            var uploadEvent = Cell.uploadEvent();
            if (uploadEvent.onProgress) {
                this._request.upload.onprogress = uploadEvent.onProgress;
            }
            if (uploadEvent.onLoadStart) {
                this._request.upload.onloadstart = uploadEvent.onLoadStart;
            }
            if (uploadEvent.onLoadEnd) {
                this._request.upload.onloadend = uploadEvent.onLoadEnd;
            }
            if (uploadEvent.onError) {
                this._request.upload.onerror = uploadEvent.onError;
            }
            if (uploadEvent.onAbort) {
                this._request.upload.onabort = uploadEvent.onAbort;
            }
        }

        this._request.send(parameters);

        if (!this._options.asynchronous) {
            return HttpClient._parseResponse(this._request, this._options);
        }
    }
};

HttpClient._parseResponse = function(_request, _options) {
    if (_options.onFinished) {
        _options.onFinished(_request);
    }

    if (_request.status === 200) {
        if (_options.onComplete) {
            return _options.onComplete(_request);
        }

        if (_options.elementId.length > 0) {
            var _element = $(_options.elementId);
            if (_element) {
                _element.data = _request.responseText;
            }
        }
    } else if (_request.status === 301 || _request.status === 302 || _request.status === 307) {
        var _redirectPath = _request.getResponseHeader("Location");
        if (_redirectPath.length !== 0) {
            var _newOption = {};
            Object.extend(_newOption, _options || {});
            _newOption.method = "GET";
            new HttpClient(_redirectPath, _newOption).send();
        }
    } else {
        if (_options.onError) {
            _options.onError(_request);
        }
    }
};

HttpClient._initialize = function(url, _options) {
    var _request;
    // If XMLHttpRequest is a javascript object in the local
    if (window.XMLHttpRequest) {
        _request = new XMLHttpRequest();
    } else if (window.ActiveXObject) { // Support the ActiveX
        try {
            // Create XMLHttpRequest object by instance an ActiveXObject
            _request = new ActiveXObject("Microsoft.XMLHTTP"); // higher than msxml3
        } catch (e) {
            // Create XMLHttpRequest object by instance an ActiveXObject
            _request = new ActiveXObject("Msxml2.XMLHTTP"); // lower than msxml3
        }
    }

    if (_options.asynchronous) {
        _request.onreadystatechange = function() {
            switch (this.readyState) {
                case 1:
                    if (_options.onCreate) {
                        _options.onCreate(this);
                    }
                    break;
                case 2:
                    var _jwtToken = this.getResponseHeader("Authentication");
                    if (_jwtToken !== null) {
                        sessionStorage.setItem("JWTToken", _jwtToken);
                    }
                    break;
                case 4:
                    HttpClient._parseResponse(this, _options);
                    break;
            }
        };
    }

    if (_options.userName !== null && _options.passWord !== null) {
        _request.open(_options.method, url, _options.asynchronous,
            _options.userName, _options.passWord);
    } else {
        _request.open(_options.method, url, _options.asynchronous);
    }

    return _request;
};

var CellJS = Class.create();
CellJS.prototype = {
    constructor : function() {
        this._config = {
            developmentMode: false,
            //  Internationalization
            i18n : {
                //  Current language
                language : Comment.Language,
                resPath : ""
            },
            //  Template Config
            templates : "",
            darkMode : {
                enabled : false,
                styleClass : "darkMode"
            },
            form : {
                encryptPassword : true,
                //  Form password encrypt method
                //  Options:    MD5/RSA/SHA1/SHA224/SHA256/SHA384/SHA512/SHA512_224/SHA512_256
                //              SHA3_224/SHA3_256/SHA3_384/SHA3_512/SHAKE128/SHAKE256
                //              Keccak224/Keccak256/Keccak384/Keccak512
                encryptMethod : "MD5",
                convertDateTime : false
            },
            security : {
                //  RSA Key Config
                RSA : {
                    exponent : "",
                    modulus : "",
                    radix : 16,
                    keySize : 1024
                }
            },
            uploadEvent : {
                onProgress : null,
                onLoadStart : null,
                onLoadEnd : null,
                onError : null,
                onAbort : null
            }
        };
        Object.extend(this._config, (Config || {}));
        if (this._config.security.RSA.exponent.length > 0
            && this._config.security.RSA.modulus.length > 0 && Cell.hasOwnProperty("RSA")) {
            this._rsa = new Cell.RSA(this._config.security.RSA.exponent, this._config.security.RSA.modulus,
                this._config.security.RSA.radix, this._config.security.RSA.keySize);
        }
        this._resources = {};
        this._templates = {};
        this._components = {"Core" : true};
        this.language(this._config.i18n.language);
        if (((typeof this._config.templates) === 'string') && this._config.templates.length > 0) {
            new HttpClient(this._config.templates, {
                onComplete : function(_request) {
                    var _responseText = _request.responseText, _length, i, _template;
                    if (_responseText.isXml()) {
                        var _templates = _responseText.parseXml().documentElement.getElementsByTagName("template");
                        _length = _templates.length;
                        for (i = 0 ; i < _length ; i++) {
                            _template = _templates[i];
                            if (_template.textContent && _template.textContent.length > 0
                                && _template.hasAttribute("name")) {
                                Cell.registerTemplate(_template.getAttribute("name"),
                                    _template.textContent.decodeByRegExp());
                            }
                        }
                    } else if (_responseText.isJSON()) {
                        var _jsonObj = _responseText.parseJSON()["templates"];
                        if (Array.isArray(_jsonObj)) {
                            _length = _jsonObj.length;
                            for (i = 0 ; i < _length ; i++) {
                                _template = _jsonObj[i];
                                if (_template.hasOwnProperty("name") && _template.hasOwnProperty("url")) {
                                    Cell.registerTemplate(_template["name"], _template["url"]);
                                }
                            }
                        }
                    } else {
                        console.log(Cell.message("Core", "Template.Unknown"));
                    }
                }
            }).send();
        }

        if (this._config.darkMode.enabled && Comment.GPS) {
            navigator.geolocation.getCurrentPosition(function (position) {
                Cell.registerDarkMode(position.coords.longitude, position.coords.latitude);
            });
        }
        this._darkMode = false;
    },

    developmentMode : function() {
        return this._config.developmentMode;
    },

    sendRequest : function(event) {
        if (!Comment.Browser.IE || Comment.Browser.IE11) {
            event.preventDefault();
            event.stopPropagation();
        }

        if (event.target.dataset.disabled == null || event.target.dataset.disabled === "false") {
            new HttpClient(event.target.getAttribute("href"), {
                elementId: event.target.dataset.elementId
            }).send();
        }
        if (event.target.tagName.toLowerCase() === "a" && Comment.Browser.IE && !Comment.Browser.IE11) {
            return false;
        }
    },

    submitForm : function(event) {
        if (!Comment.Browser.IE || Comment.Browser.IE11) {
            event.preventDefault();
            event.stopPropagation();
        }
        if (event.target.dataset.disabled == null || event.target.dataset.disabled === "false") {
            var _formElement = $(event.target.dataset.formId);
            if (_formElement) {
                new HttpClient(_formElement.action, {
                    method : _formElement.method,
                    elementId : _formElement.dataset.elementId,
                    onCreate: Cell.coverWindow,
                    onFinished: Cell.closeCover
                }).send(_formElement.formData());
            }
        }
    },

    uploadEvent : function() {
        return this._config.uploadEvent;
    },

    registerDarkMode : function(posLon, posLat) {
        if (this._config.darkMode.enabled) {
            var Sun = new Date().sunTime(posLon, posLat);
            if (Sun.SunRise === -1 || Sun.SunSet === -1) {
                return;
            }
            this._sunRise = Sun.SunRise;
            this._sunSet = Sun.SunSet;
            this.switchDarkMode();
            setInterval(function() {
                Cell.switchDarkMode();
            }, 60 * 1000);
        }
    },

    switchDarkMode : function() {
        if (this._config.darkMode.enabled) {
            var _currDate = new Date(), _currTime = _currDate.getTime() + (_currDate.getTimezoneOffset() * 60 * 1000);
            if (_currTime > this._sunRise && this._darkMode) {
                document.body.removeClass(this._config.darkMode.styleClass);
            } else if (_currTime > this._sunSet && !this._darkMode) {
                document.body.appendClass(this._config.darkMode.styleClass);
            }
        }
    },

    registerComponent : function(bundle, component, loadResource) {
        if (!this._components.hasOwnProperty(bundle)) {
            this[bundle] = component;
            if ((typeof loadResource) === "boolean" && loadResource) {
                this.loadResource(bundle);
            }
            this._components[bundle] = loadResource;
        }
    },

    registerTemplate : function(name, urlAddress) {
        if (Cell.developmentMode()) {
            console.log(Cell.message("Core", "Template.Register", name, urlAddress));
        }
        var _template = {
            urlAddress : urlAddress,
            content : null};
        if (this._templates.hasOwnProperty(name)) {
            console.log(Cell.message("Core", "Template.Exists", name));
        }
        this._templates[name] = _template;
    },

    coverWindow : function() {
        var _processed = false;
        var _elementList = document.querySelectorAll("div[data-cover-window='true']"),
            _length = _elementList.length, i, element;
        for (i = 0 ; i < _length ; i++) {
            element = _elementList[i];
            if (element.getStyle().length === 0) {
                var _cssText = "width: 100%; height: 100%; position: absolute; top: 0; left: 0;";
                _cssText += ("background-color: " + element.dataset.backgroundColor + "; ");
                _cssText += ("opacity: " + element.dataset.opacity + "; ");
                _cssText += ("z-index: " + element.dataset.zIndex + ";");
                element.setStyle(_cssText);
            }
            element.show();
            _processed = true;
        }

        if (_processed) {
            document.body.style.overflow = "hidden";
        }
    },

    closeCover : function() {
        var _elementList = document.querySelectorAll("div[data-cover-window='true']"),
            _length = _elementList.length, i;
        for (i = 0 ; i < _length ; i++) {
            _elementList[i].hide();
        }
        document.body.style.overflow = "auto";
    },

    loadResource : function(bundle) {
        var _url = this._config.i18n.resPath;
        _url += this._config.i18n.resPath.endsWith("/") ? "" : "/";
        _url += bundle + "/" + this._config.i18n.language + ".json";
        this._resources[bundle] = new HttpClient(_url, {
            asynchronous: false,
            onComplete : function (_request) {
                var _responseText = _request.responseText;
                return _responseText.isJSON ? _responseText.parseJSON() : {};
            },
            onError : function (_request) {
                return {};
            }
        }).send();
    },

    message : function(bundle, key) {
        if ((typeof bundle) !== "string") {
            throw new Error(Cell.message("Core", "Multi.Bundle.Type"));
        }
        if (this._resources.hasOwnProperty(bundle)) {
            if (this._resources[bundle].hasOwnProperty(key)) {
                var _resource = this._resources[bundle][key], _length = arguments.length - 2;
                for (var i = 0 ; i < _length ; i++) {
                    _resource = _resource.replace("{" + i + "}", arguments[i + 2]);
                }
                return _resource;
            }
        }
        return bundle + "." + key;
    },

    language : function(language) {
        this._config.i18n.language = language;
        this._resources = {};
        for (var bundle in this._components) {
            if (this._components[bundle]) {
                this.loadResource(bundle);
            }
        }
    },

    encryptPassword : function(password) {
        if (!this._config.form.encryptPassword) {
            return password;
        }
        if (this._config.form.encryptMethod === "RSA" && this._rsa !== null) {
            return this._rsa.encrypt(password);
        }
        return this.calculateData(this._config.form.encryptMethod, password);
    },

    calculateData : function(method, data, key) {
        var encryptor;
        if (method.startsWith("CRC")) {
            encryptor = Cell.CRC.newInstance(method);
        } else {
            switch (method) {
                case "MD5":
                    encryptor = Cell.MD5.newInstance(key);
                    break;
                case "SHA1":
                    encryptor = Cell.SHA1.newInstance(key);
                    break;
                case "SHA224":
                    encryptor = Cell.SHA224.newInstance(key);
                    break;
                case "SHA256":
                    encryptor = Cell.SHA256.newInstance(key);
                    break;
                case "SHA384":
                    encryptor = Cell.SHA384.newInstance(key);
                    break;
                case "SHA512":
                    encryptor = Cell.SHA512.newInstance(key);
                    break;
                case "SHA512_224":
                    encryptor = Cell.SHA512.SHA512_224(key);
                    break;
                case "SHA512_256":
                    encryptor = Cell.SHA512.SHA512_256(key);
                    break;
                case "SHA3_224":
                    encryptor = Cell.SHA3.SHA3_224(key);
                    break;
                case "SHA3_256":
                    encryptor = Cell.SHA3.SHA3_256(key);
                    break;
                case "SHA3_384":
                    encryptor = Cell.SHA3.SHA3_384(key);
                    break;
                case "SHA3_512":
                    encryptor = Cell.SHA3.SHA3_512(key);
                    break;
                case "SHAKE128":
                    encryptor = Cell.SHA3.SHAKE128();
                    break;
                case "SHAKE256":
                    encryptor = Cell.SHA3.SHAKE256();
                    break;
                case "Keccak224":
                    encryptor = Cell.SHA3.Keccak224(key);
                    break;
                case "Keccak256":
                    encryptor = Cell.SHA3.Keccak256(key);
                    break;
                case "Keccak384":
                    encryptor = Cell.SHA3.Keccak384(key);
                    break;
                case "Keccak512":
                    encryptor = Cell.SHA3.Keccak512(key);
                    break;
                default:
                    return data;
            }
        }
        encryptor.append(data);
        return encryptor.finish();
    },

    convertDateTime : function(value) {
        if (value != null && (typeof value === "string")) {
            return this._config.form.convertDateTime ? Date.parse(value) : value;
        }
        return value == null ? "" : value.toString();
    },

    processOnload : function() {
        var _elementList = document.querySelectorAll("*[data-bind-updater]"),
            _length = _elementList.length, i, element;
        for (i = 0 ; i < _length ; i++) {
            element = _elementList[i];
            if (element.dataset.bindProcessed !== "true" && element.id && element.id.length > 0) {
                var name = element.dataset.template || "";
                if (name.length > 0 && !Cell._templates.hasOwnProperty(name)) {
                    throw new Error(Cell.message("Core", "Template.Not.Exists", name));
                }
                Object.defineProperty(element, "data", {
                    set : function(data) {
                        if (!data.isJSON()) {
                            throw new Error(Cell.message("Core", "Data.Invalid.JSON"));
                        }
                        var _jsonData = data.parseJSON();
                        if (this.tagName.toLowerCase() === "form") {
                            var _inputList = this.querySelectorAll("input, select, datalist"),
                                _inputLength = _inputList.length, j, input;
                            for (j = 0 ; j < _inputLength ; j++) {
                                input = _inputList[j];
                                var _name = input.getAttribute("name"),
                                    _tagName = input.tagName.toLowerCase();
                                if (_name && _jsonData.hasOwnProperty(_name)) {
                                    switch (_tagName) {
                                        case "input":
                                            Render.processInput(_jsonData[_name], input);
                                            break;
                                        case "select":
                                        case "datalist":
                                            input.setAttribute("value", _jsonData[_name]);
                                    }
                                }

                                if ((_tagName === "select" || _tagName === "datalist")
                                    && input.hasAttribute("data-iterator")) {
                                    var _paramName = input.getAttribute("data-iterator");
                                    if (_jsonData.hasOwnProperty(_paramName)) {
                                        input.clearChildNodes();
                                        Render.appendOptions(input, _jsonData[_paramName]);
                                    }
                                }
                            }
                        } else {
                            var _template = Cell._templates[this.dataset.template];
                            if (_template.content === null) {
                                var content = new HttpClient(_template.urlAddress, {
                                    asynchronous : false,
                                    onComplete : function (_request) {
                                        var content = _request.responseText;
                                        if (content && content.isXml()) {
                                            return content;
                                        }
                                        return null;
                                    }
                                }).send();
                                if (content != null && content.isHtml()) {
                                    _template.content = content.parseXml().documentElement;
                                    Cell._templates[this.dataset.template] = _template;
                                }
                            }
                            if (_template.content === null) {
                                throw new Error(Cell.message("Core", "Template.Not.Exists", this.dataset.template));
                            }
                            Render.processRender(this, _jsonData, (this.dataset.override === "true"), _template.content);
                        }
                        Cell.processOnload();
                        if (_jsonData["title"] !== null) {
                            _jsonData["title"].setTitle();
                        }
                        if (_jsonData["keywords"] !== null) {
                            _jsonData["keywords"].setKeywords();
                        }
                        if (_jsonData["description"] !== null) {
                            _jsonData["description"].setDescription();
                        }
                        if (this.dataset.floatWindow) {
                            Cell.coverWindow();
                            this.show();
                            if (_jsonData["timeout"] && _jsonData["timeout"].isNum()) {
                                setTimeout(function() {
                                    this.hide();
                                    Cell.closeCover();
                                }, parseInt(_jsonData["timeout"]));
                            }
                        }
                    }
                });
                element.dataset.bindProcessed = "true";
            }
        }
        _elementList = document.querySelectorAll("*[data-float-window='true'], *[data-disabled='true'], *[href][data-element-id], a[data-form-id], button[data-form-id], input[data-validate='true']");
        _length = _elementList.length;
        for (i = 0 ; i < _length ; i++) {
            element = _elementList[i];
            var tagName = element.tagName.toLowerCase();
            if (element.dataset.floatWindow === "true") {
                element.hide();
            }
            if (element.dataset.disabled === "true" && element.dataset.activeDelay
                && element.dataset.activeDelay.isNum()) {
                setTimeout(Cell.enableElement(element), element.dataset.activeDelay.parseInt());
            }
            if (element.dataset.elementId !== null && element.hasAttribute("href")) {
                element.addEvent("click", function(event) {
                    Cell.sendRequest(event);
                })
            }
            if ((tagName === "a" || tagName === "button") && element.dataset.formId !== null) {
                element.addEvent("click", function(event) {
                    Cell.submitForm(event);
                })
            }
            if ((tagName === "input" || tagName === "select") && element.dataset.validate === "true") {
                element.addEvent("blur", function(event) {
                    event.target.validate();
                })
            }
        }
    },

    enableElement : function(element) {
        return function() {
            element.dataset.disabled = "false";
            if (Comment.Browser.IE) {
                document.body.style.overflow = "hidden";
                document.body.style.overflow = "auto";
            }
        }
    }
};

CellJS.$ = function() {
    if (arguments.length <= 0) {
        return null;
    } else {
        var argCount = arguments.length;
        if (argCount === 1) {
            return document.getElementById(arguments[0]);
        } else {
            var returnElements = [];
            for (var i = 0 ; i < argCount ; i++) {
                var element = null;
                var elementId = arguments[i];
                if (typeof elementId === 'string') {
                    element = document.getElementById(elementId);
                }
                returnElements.push(element);
            }
            return returnElements;
        }
    }
};

(function() {
    if (typeof window.Cell === "undefined") {
        window.Cell = new CellJS();
        window.$ = CellJS.$;
    }
    var _onload = window.onload;
    if (_onload) {
        window.onload = function () {
            _onload.apply(this);
            Cell.processOnload();
        }
    } else {
        window.onload = Cell.processOnload;
    }
})();

var Render = Class.create();
Render.prototype = {
    constructor : function() {
    }
};
Render.processRender = function(element, jsonData, override, template) {
    if (template == null) {
        return;
    }
    if (override == null || ((typeof override === "boolean") && override)) {
        element.clearChildNodes();
    }

    var _childList = template.childList(), _length = _childList.length , i;
    for (i = 0 ; i < _length ; i++) {
        if (_childList[i].hasAttribute("data-iterator")) {
            var _dataName = _childList[i].getAttribute("data-iterator");
            _dataName = _dataName.substring(1, _dataName.length - 1).trim();
            var _dataList = jsonData[_dataName], _dataLength = _dataList.length, j, jsonItem, _childElement;
            for (j = 0 ; j < _dataLength ; j++) {
                jsonItem = _dataList[j];
                _childElement = Render.processTemplate(_childList[i], jsonItem);
                _childElement.removeAttribute("data-iterator");
                Render.processBasicElement(element, _childElement.render(), false);
            }
        } else {
            Render.processBasicElement(element,
                Render.processTemplate(_childList[i], jsonData).render(), false);
        }
    }
};

Render.cloneTemplate = function(template, jsonData) {
    var _node = template.cloneNode(false), _attrNameList = template.attrNames(),
        _length = _attrNameList.length, i, attrName;
    for (i = 0 ; i < _length ; i++) {
        attrName = _attrNameList[i];
        var _attrValue = template.getAttribute(attrName);
        if (_attrValue !== null) {
            _attrValue = _attrValue.trim();
            var paramName;
            while ((paramName = Render.match(_attrValue)) !== null) {
                _attrValue = _attrValue.replace(paramName,
                    jsonData[paramName.substring(1, paramName.length - 1).trim()] || "");
            }
            _node.setAttribute(attrName, _attrValue);
        }
    }
    return _node;
};

Render.processTemplate = function(template, jsonData) {
    var _node = Render.cloneTemplate(template, jsonData);
    var _childList = template.childList();
    var _length, i;
    if (_childList.length > 0) {
        _length = _childList.length;
        for (i = 0 ; i < _length ; i++) {
            if (_childList[i].hasAttribute("data-iterator")) {
                var _dataName = _childList[i].getAttribute("data-iterator");
                var _dataList = jsonData[_dataName.substring(1, _dataName.length - 1).trim()],
                    _dataLength = _dataList.length, j;
                for (j = 0 ; j < _dataLength ; j++) {
                    var _child = Render.processTemplate(_childList[i], _dataList[j], false);
                    _child.removeAttribute("data-iterator");
                    _node.appendChild(_child);
                }
            } else {
                _node.appendChild(Render.processTemplate(_childList[i], jsonData));
            }
        }
    } else if (template.textContent.length > 0) {
        var _content = template.textContent.trim(), paramName;
        if (_content.length > 0) {
            while ((paramName = Render.match(_content)) !== null) {
                _content = _content.replace(paramName,
                    jsonData[paramName.substring(1, paramName.length - 1).trim()] || "");
            }
            Render.processBasicElement(_node, _content, true);
        }
    } else if (Array.isArray(jsonData)) {
        _length = jsonData.length;
        for (i = 0 ; i < _length ; i++) {
            Render.processBasicElement(_node, jsonData[i], false);
        }
    } else {
        Render.processBasicElement(_node, jsonData, false);
    }


    return _node;
};

Render.processInput = function(data, element) {
    if (element.getAttribute("type") === null) {
        return;
    }

    var _type = element.getAttribute("type").toLowerCase();
    switch (_type) {
        case "checkbox":
        case "radio":
            var _name = element.getAttribute("name");
            var _elementList = document.querySelectorAll("input[type='" + _type + "'][name='" + _name + "']"),
                _length = _elementList.length, i, _element;
            for (i = 0 ; i < _length ; i++) {
                _element = _elementList[i];
                var _value = _element.getAttribute("value");
                if (Array.isArray(data)) {
                    _element.checked = (data.indexOf(_value) !== -1);
                } else {
                    _element.checked = (_value === data);
                }
            }
            break;
        case "color":
            if (((typeof data) === "string") && data.isColorCode()) {
                element.setAttribute("value", data);
            }
            break;
        case "email":
            if (((typeof data) === "string") && data.isEmail()) {
                element.setAttribute("value", data);
            }
            break;
        case "image":
            element.src = data;
            break;
        case "date":
            if (((typeof data) === "string") && data.isNum()) {
                element.setAttribute("value", data.parseInt().parseTime().format("yyyy-MM-dd"));
            } else {
                element.setAttribute("value", data);
            }
            break;
        case "time":
            if (((typeof data) === "string") && data.isNum()) {
                element.setAttribute("value", data.parseInt().parseTime().format("HH:mm"));
            } else {
                element.setAttribute("value", data);
            }
            break;
        case "datetime-local":
            if (((typeof data) === "string") && data.isNum()) {
                element.setAttribute("value", data.parseInt().parseTime().format("yyyy-MM-ddTHH:mm"));
            } else {
                element.setAttribute("value", data);
            }
            break;
        case "file":
        case "password":
            //  Ignore for data bind
            break;
        default:
            element.setAttribute("value", data);
            break;

    }
};

Render.appendOptions = function(element, dataList) {
    var _currentValue = element.hasAttribute("value") ? element.getAttribute("value") : "",
        _length = dataList.length, i, dataItem;
    for (i = 0 ; i < _length ; i++) {
        dataItem = dataList[i];
        var _option = document.createElement("option");
        _option.value = dataItem["value"];
        _option.text = dataItem["text"];
        _option.selected = _currentValue === _option.value;
        element.options.add(_option);
    }
};

Render.match = function(content) {
    var startIndex = content.indexOf('{'), endIndex = content.indexOf('}');
    if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
        return null;
    }
    return content.substring(startIndex, endIndex + 1);
};

Render.processBasicElement = function(element, data, override) {
    if (element.hasAttribute("data-pattern") && data.isNum()) {
        var _date = data.parseInt().parseTime(element.hasAttribute("data-utc"));
        data = _date.format(element.getAttribute("data-pattern"));
    }
    switch (element.tagName.toLowerCase()) {
        case "select":
        case "datalist":
            if (element.hasAttribute("data-iterator")) {
                var _dataName = element.getAttribute("data-iterator");
                _dataName = _dataName.substring(1, _dataName.length - 1).trim();
                if (data.hasOwnProperty(_dataName)) {
                    if (override) {
                        element.clearChildNodes();
                    }
                    Render.appendOptions(element, data[_dataName]);
                }
            }
            break;
        case "input":
            var _value = element.getAttribute("value");
            if ((_value == null || _value.length === 0) && element.hasAttribute("name")) {
                _value = data[element.getAttribute("name")];
            }
            Render.processInput(_value, element);
            break;
        default:
            if ((typeof data) === "string") {
                var _innerHTML = element.innerHTML;
                if (_innerHTML === undefined) {
                    _innerHTML = "";
                }
                element.innerHTML = override ? data : (_innerHTML + data);
            }
            break;
    }
};