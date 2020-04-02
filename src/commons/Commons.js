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
 *
 * 1.0.1
 * [New] Extend String for Verify CHN ID Card Code and CHN Social Credit Code
 *
 * 1.0.0
 * [New] Extend Element/String/Number/Array/Date
 *
 */
var BASE64 = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '/', '='
];

var BASE16 = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];

var CHN_SOCIAL_CREDIT_CODE = [
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F',
    'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'T', 'U', 'W', 'X', 'Y'
];

var Comment = {
    Version:    "1.0.1",
    Language:   (navigator.language|| navigator.userLanguage).substring(0, 2),
    Html5:      !!window.applicationCache,
    MaxWidth :  Math.max(document.documentElement.scrollWidth, document.documentElement.clientWidth),
    MaxHeight : Math.max(document.documentElement.scrollHeight, document.documentElement.clientHeight),
    GPS : !!navigator.geolocation,
    Browser: {
        //	Internet Explorer
        IE:     	!!window.ActiveXObject || "ActiveXObject" in window,
        //	Internet Explorer Under Version 8
        IE8:		(parseInt(navigator.appVersion) >= 8),
        //	Internet Explorer 11
        IE11:		(!(navigator.userAgent.toUpperCase().indexOf('TRIDENT') > -1
            && navigator.userAgent.toUpperCase().indexOf('RV:') > -1
            && parseInt(navigator.appVersion) === 11)),
        //	Microsoft Edge
        Edge:		navigator.userAgent.indexOf('Edge') > -1,
        //	Opera Explorer
        Opera:  	!!window.opera && navigator.userAgent.toUpperCase().indexOf('OPERA') > -1,
        //	Firefox Explorer
        Firefox: 	!!document.getBoxObjectFor && navigator.userAgent.toUpperCase().indexOf('FIREFOX') > -1,
        // 	Apple Safari Explorer
        Safari:		!!window.openDatabase && navigator.userAgent.toUpperCase().indexOf('SAFARI') > -1,
        //	Chrome Explorer
        Chrome:		!!window.MessageEvent && !document.getBoxObjectFor,
        //	Apple Safari and Google Chrome
        WebKit: 	navigator.userAgent.indexOf('AppleWebKit/') > -1,
        //	Mozilla Firefox, Apple Safari and Google Chrome
        Gecko:  	navigator.userAgent.indexOf('Gecko') > -1 && navigator.userAgent.indexOf('KHTML') === -1,
        Version:	parseInt(navigator.appVersion)
    },
    HtmlTag : [
        "a", "abbr", "acronym", "address", "appvar", "area", "b", "base", "bdo", "big", "blockquote", "body", "br", "button", "caption", "center", "cite",
        "code", "col", "colgroup", "dd", "del", "div", "dfn", "dl", "dt", "em", "embed", "fieldset", "form", "frame", "frameset", "h1", "h2", "h3", "h4", "h5", "h6",
        "head", "html", "i", "iframe", "img", "input", "ins", "kbd", "label", "legend", "li", "link", "map", "meta", "noframes", "noscript", "object", "ol",
        "optgroup", "option", "p", "param", "pre", "q", "s", "samp", "script", "select", "small", "span", "strong", "style", "sub", "sup", "table", "tbody",
        "td", "textarea", "tfoot", "th", "thead", "title", "tr", "tt", "ul", "var"
    ],
    Html5Tag : [
        "a", "abbr", "address", "area", "article", "aside", "audio", "b", "base", "bdi", "bdo", "big", "blockquote", "body", "br", "button", "canvas", "caption",
        "center", "cite", "code", "col", "colgroup", "data", "datalist", "dd", "del", "details", "div", "dfn", "dialog", "dl", "dt", "em", "embed", "fieldset", "figcaption",
        "figure", "footer", "form", "frame", "frameset", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "html", "i", "iframe", "img", "input", "ins", "kbd",
        "keygen", "label", "legend", "li", "link", "main", "map", "mark", "meta", "meter", "nav", "noframes", "noscript", "object", "ol", "optgroup", "option", "output", "p",
        "param", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "script", "section", "select", "small", "source", "span", "strong", "style", "sub", "summary",
        "sup", "table", "tbody", "td", "textarea", "template", "tfoot", "th", "thead", "time", "title", "tr", "track", "tt", "ul", "var", "video", "wbr"
    ],
    Author: [
        {"Name":"Steven Wee", "EMail":"wmkm0113@Hotmail.com", "ORG":"Nervousync Studio"}
    ]
};

var RegexLibrary = {
    E_Mail : /[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\\.)+(?:[A-Z]{2}|asia|com|org|net|gov|mil|biz|info|mobi|name|aero|jobs|museum|travel)\b/g,
    UUID : /^([0-9a-f]{8}((-[0-9a-f]{4}){3})-[0-9a-f]{12})|([0-9a-f]{32})\b/g,
    TrimBlank : /(^\s*)|(\s*$)/g,
    BlankText : /[\s]+/ig,
    Number : /\b\d+\b/g,
    Color : /^#[0-9A-F]{6}$/i,
    XML : /<[a-zA-Z0-9]+[^>]*>(?:.|[\r\n])*?<\/[a-zA-Z0-9]+>/ig,
    HtmlTag : /<[a-zA-Z0-9]+[^>]*>/ig,
    Date: /^((((19|20)\d{2})-(0?(1|[3-9])|1[012])-(0?[1-9]|[12]\d|30))|(((19|20)\d{2})-(0?[13578]|1[02])-31)|(((19|20)\d{2})-0?2-(0?[1-9]|1\d|2[0-8]))|((((19|20)([13579][26]|[2468][048]|0[48]))|(2000))-0?2-29))$/ig,
    CHN_ID_Card : /^[1-9]([0-9]{17}|([0-9]{16}X))$/g,
    CHN_Social_Credit : /^([1-9]|A|N|Y)[0-9A-Z]{17}$/g
};

Object.extend = function(destination, source) {
    for (var _property in source) {
        if (source.hasOwnProperty(_property)
            && (typeof source[_property]).toString().toLowerCase() === 'object') {
            Object.extend(destination[_property], source[_property]);
        } else {
            destination[_property] = source[_property];
        }
    }
    return destination;
};

Object.extend(Element.prototype, {
    getClass : function() {
        var _className;
        if (Comment.Browser.IE && !Comment.Browser.IE11) {
            _className = this.getAttribute("className");
        } else {
            _className = this.getAttribute("class");
        }

        if (_className == null) {
            _className = "";
        }

        return _className;
    },

    hasClass : function(_className) {
        if (Comment.Html5) {
            return this.classList.contains(_className);
        }

        if (_className) {
            return this.getClass().indexOf(_className) !== -1;
        }
        return false;
    },

    appendClass : function(_className) {
        if (Comment.Html5) {
            this.classList.add(_className);
        } else {
            if (_className && !this.hasClass(_className)) {
                this.setClass(this.getClass() + " " + _className);
            }
        }
    },

    removeClass : function(_className) {
        if (Comment.Html5) {
            this.classList.remove(_className);
        } else {
            if (_className && this.hasClass(_className)) {
                this.setClass(this.getClass().replace(_className, ""));
            }
        }
    },

    setClass : function(_className) {
        if (_className !== null) {
            _className = _className.replace(RegexLibrary.BlankText, " ").trim();
            if (Comment.Browser.IE8) {
                this.setAttribute("className", _className);
            } else {
                this.setAttribute("class", _className);
            }
        }
    },

    setStyle : function(_cssText) {
        if (_cssText) {
            if (Comment.Browser.IE8) {
                this.setAttribute("cssText",
                    this.hasAttribute("cssText") ? this.getAttribute("cssText") + _cssText : _cssText);
            } else {
                this.setAttribute("style",
                    this.hasAttribute("style") ? this.getAttribute("style") + _cssText : _cssText);
            }
        }
    },

    getStyle : function() {
        if (Comment.Browser.IE8) {
            return this.hasAttribute("cssText") ? this.getAttribute("cssText") : "";
        } else {
            return this.hasAttribute("style") ? this.getAttribute("style") : "";
        }
    },

    addEvent : function(_eventName, _operateFunc) {
        if (Comment.Browser.IE && !Comment.Browser.IE11) {
            this.attachEvent("on" + _eventName, _operateFunc);
        } else {
            this.addEventListener(_eventName, _operateFunc, false);
        }
    },

    removeEvent : function(_eventName, _operateFunc) {
        if (Comment.Browser.IE && !Comment.Browser.IE11) {
            this.detachEvent("on" + _eventName, _operateFunc);
        } else {
            this.removeEventListener(_eventName, _operateFunc, false);
        }
    },

    clearChildNodes : function() {
        var _childCount = this.childNodes.length;
        while (_childCount > 0) {
            this.removeChild(this.childNodes[0]);
            _childCount--;
        }
    },

    hide : function() {
        this.appendClass("hidden");
    },

    show : function() {
        this.removeClass("hidden");
    },

    formData : function() {
        if (this.tagName.toLowerCase() === "form") {
            var _formData = new FormData();
            _formData.uploadFile = false;
            var _nodeList = this.querySelectorAll("input, select, textarea"),
                _length = _nodeList.length, _element, _inputName, _inputValue;
            for (var i = 0 ; i < _length ; i++) {
                _element = _nodeList[i];
                _inputName = _element.name;
                _inputValue = _element.tagName.toLowerCase() === "textarea" ? _element.innerHTML : _element.value;
                if (_inputValue !== null && _inputValue.length > 0) {
                    if (_element.tagName.toLowerCase() === "input") {
                        switch (_element.type.toLowerCase()) {
                            case "password":
                                _inputValue = Cell.encryptPassword(_inputValue);
                                break;
                            case "date":
                            case "datetime-local":
                                _inputValue = Cell.convertDateTime(_inputValue);
                                break;
                            case "file":
                                _formData.uploadFile = true;
                                break;
                        }
                        _formData.append(_inputName, _inputValue);
                    } else if (_element.tagName.toLowerCase() === "select") {
                        _formData.append(_inputName, _inputValue);
                    } else {
                        _formData.append(_inputName, _inputValue.encodeByRegExp());
                    }
                }
            }
            return _formData;
        }
    },

    validate : function() {
        var _result = true;
        if (this.tagName.toLowerCase() === "form") {
            var _elementList = this.querySelectorAll("input, select, textarea"), _length = _elementList.length, i;
            for ( i = 0 ; i < _length ; i++) {
                _result = _result && _elementList[i].validate();
            }
        } else if (this.dataset.validate === "true"
            && (this.tagName.toLowerCase() === "input" || this.tagName.toLowerCase() === "select")) {
            if (this.value.length > 0) {
                var _value = this.value;
                if (this.dataset.regex) {
                    _result = _result && (_value.match(this.dataset.regex) !== null);
                }
                if (this.dataset.minValue && this.dataset.minValue.isNum() && _value.isNum()) {
                    _result = _result && (Number(this.dataset.minValue) <= Number(_value));
                }
                if (this.dataset.maxValue && this.dataset.maxValue.isNum() && _value.isNum()) {
                    _result = _result && (Number(_value) <= Number(this.dataset.maxValue));
                }
                if (this.dataset.email === "true") {
                    _result = _result && _value.isEmail();
                }
                if (this.dataset.idCard === "true") {
                    _result = _result && _value.isIDCardCode();
                }
                if (this.dataset.socialCredit === "true") {
                    _result = _result && _value.isSocialCreditCode();
                }
            } else {
                _result = this.dataset.notNull === undefined || this.dataset.notNull === "false";
            }

            this.dataset.verifyResult = _result.toString();
        }
        return _result;
    },

    sortChildrenBy : function(tagName, attributeName, _sortDesc) {
        if (!attributeName || !tagName) {
            return;
        }

        var _sortFunc = function(a, b) {
            try {
                var aValue = a.getAttribute(attributeName);
                var bValue = b.getAttribute(attributeName);

                var sortValue = 0;
                if (aValue.toString().toLowerCase() < bValue.toString().toLowerCase()) {
                    sortValue = -1;
                } else if (aValue.toString().toLowerCase() > bValue.toString().toLowerCase()) {
                    sortValue = 1;
                }

                if (_sortDesc != null && _sortDesc) {
                    sortValue *= -1;
                }

                return sortValue;
            } catch (e) {
                return 0;
            }
        };

        if (this.hasChildNodes()) {
            var sortNodes = this.getElementsByTagName(tagName);
            sortNodes = sortNodes.sort(_sortFunc);

            var childNodes = this.childNodes;
            tagName = tagName.toLowerCase();

            for (var i = 0 ; i < childNodes.length ; i++) {
                if (childNodes[i].tagName && childNodes[i].tagName.toLowerCase() === tagName) {
                    this.removeChild(childNodes[i]);
                }
            }

            while (sortNodes.length > 0) {
                this.appendChild(sortNodes.shift());
            }
        }
    },

    attrNames : function() {
        if (Comment.Browser.IE || Comment.Browser.IE11) {
            var _attrNames = [], _attrList = this.attributes, _length = _attrList.length, i;
            for (i = 0 ; i < _length ; i++) {
                _attrNames.push(_attrList[i].name);
            }
            return _attrNames;
        } else {
            return this.getAttributeNames();
        }
    },

    childList : function() {
        if (Comment.Browser.IE || Comment.Browser.IE11) {
            var _children = [], _nodeList = this.childNodes, _length = _nodeList.length, i;
            for (i = 0 ; i < _length ; i++) {
                if (_nodeList[i].nodeType === 1) {
                    _children.push(_nodeList[i]);
                }
            }
            return _children;
        } else {
            return this.children;
        }
    },

    render : function() {
        if (Comment.Browser.IE || Comment.Browser.IE11) {
            var _html = "<" + this.tagName;
            var _attributes = this.attributes, _attrLength = _attributes.length, i;
            for (i = 0 ; i < _attrLength ; i++) {
                _html += (" " + _attributes[i].name + "=\"" + this.getAttribute(_attributes[i].name) + "\"");
            }

            if (this.tagName.toLowerCase() === "input") {
                _html += "/>";
            } else {
                _html += ">";
                var _childList = this.childList(), _childLength = _childList.length;
                if (_childLength > 0) {
                    for (i = 0 ; i < _childLength ; i++) {
                        _html += _childList[i].render();
                    }
                } else if (this.innerHTML !== undefined) {
                    _html += this.innerHTML;
                }
                _html += ("</" + this.tagName + ">");
            }
            return _html;
        } else {
            return this.outerHTML;
        }
    }
});

Object.extend(String.prototype, {

    trim : function() {
        return this.replace(RegexLibrary.TrimBlank, "");
    },

    reverse : function() {
        return Array.from(this).reverse().join('');
    },

    cleanBlank : function() {
        return this.isEmpty() ? "" : this.replace(RegexLibrary.BlankText, "");
    },

    isEmpty : function() {
        return this === "" || this.trim() === "";
    },

    startsWith : function(startString) {
        if (startString == null || startString.length === 0
            || this.length === 0 || startString.length > this.length) {
            return false;
        }
        return this.indexOf(startString) === 0;
    },

    endsWith : function(endString) {
        if (endString == null || endString.length === 0
            || this.length === 0 || endString.length > this.length) {
            return false;
        }

        return this.substr(this.length - endString.length) === endString;
    },

    isEmail : function() {
        return RegexLibrary.E_Mail.test(this.cleanBlank());
    },

    isJSON : function() {
        var _string = this.replace(/\\["\\\/bfnrtu]/g, '@');
        _string = _string.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']');
        _string = _string.replace(/(?:^|:|,)(?:\s*\[)+/g, '');
        return /^[\],:{}\s]*$/.test(_string);
    },

    parseJSON : function() {
        if (!this.isJSON()) {
            throw new Error(Cell.message("Core", "Data.Invalid.JSON"));
        }
        if (typeof JSON !== 'undefined') {
            return JSON.parse(this);
        }

        if (Comment.Browser.Gecko) {
            return new Function("return " + this)();
        }

        return eval('(' + this + ')');
    },

    isIDCardCode : function() {
        if (this.trim().search(RegexLibrary.CHN_ID_Card) !== -1) {
            var _sigma = 0, _code, i;
            for (i = 0 ; i < 17 ; i++) {
                _code = this.charAt(i).parseInt();
                if (_code !== 0) {
                    _sigma += _code * (Math.pow(2, 17 - i) % 11);
                }
            }
            var _authCode = (12 - (_sigma % 11)) % 11;
            return (_authCode === 10) ? this.toUpperCase().endsWith("X") : (this.charAt(17).parseInt() === _authCode);
        }
        return false;
    },

    isSocialCreditCode : function() {
        if (this.trim().search(RegexLibrary.CHN_Social_Credit) !== -1) {
            var _sigma = 0, _validateCode = CHN_SOCIAL_CREDIT_CODE.indexOf(this.charAt(17)),_code, i;
            for (i = 0 ; i < 17 ; i++) {
                _code = CHN_SOCIAL_CREDIT_CODE.indexOf(this.charAt(i));
                if (_code !== 0) {
                    _sigma += _code * (Math.pow(3, i) % 31);
                }
            }
            var _authCode = 31 - (_sigma % 31);
            return (_authCode === 31) ? (_validateCode === 0) : (_authCode === _validateCode);
        }
        return false;
    },

    isColorCode : function() {
        return this.trim().search(RegexLibrary.Color) !== -1;
    },

    isXml : function() {
        return this.trim().search(RegexLibrary.XML) !== -1;
    },

    isHtml : function() {
        var _matchResult = this.isXml();
        if (_matchResult) {
            var _length = RegexLibrary.HtmlTag.length, _tagName;
            for (var i = 0 ; i < _length ; i++) {
                _tagName = this.match(RegexLibrary.HtmlTag[i]);
                if (_tagName !== null) {
                    _tagName = _tagName.substr(1, _tagName.length - 2);
                    if (_tagName.indexOf(" ") > 0) {
                        _tagName = _tagName.substr(0, _tagName.indexOf(" "));
                    }
                    if (Comment.Html5) {
                        if (Comment.Html5Tag.indexOf(_tagName) === -1) {
                            _matchResult = false;
                        }
                    } else {
                        if (Comment.HtmlTag.indexOf(_tagName) === -1) {
                            _matchResult = false;
                        }
                    }
                }
            }
        }
        return _matchResult;
    },

    parseXml : function() {
        var _xmlDoc = null;
        if (Comment.Browser.IE && !Comment.Browser.IE11) {
            var _xmlDomVersions = [
                    "MSXML.2.DOMDocument.6.0",
                    "MSXML.2.DOMDocument.3.0",
                    "Microsoft.XMLDOM"
                ],
                _length = _xmlDomVersions.length;

            for (var i = 0 ; i < _length ; i++) {
                try {
                    _xmlDoc = new ActiveXObject(_xmlDomVersions[i]);
                    _xmlDoc.async = false;
                    _xmlDoc.loadXML(this);
                    break;
                } catch (e) {
                    _xmlDoc = null;
                }
            }

            if (_xmlDoc == null) {
                console.log(Cell.message("Core", "Data.Invalid.XML"));
            }
        } else {
            try {
                _xmlDoc = new DOMParser().parseFromString(this, "text/xml");
            } catch (e) {
                console.log(Cell.message("Core", "Data.Invalid.XML") + e);
            }
        }

        return _xmlDoc;
    },

    isNum : function() {
        return (this.trim().search(RegexLibrary.Number) !== -1);
    },

    parseInt : function(radix) {
        return parseInt(this, radix === null ? 10 : radix);
    },

    parseFloat : function() {
        return parseFloat(this);
    },

    setTitle : function() {
        document.title = this;
    },

    setKeywords : function() {
        var _keyWords = document.querySelector("keywords");
        if (_keyWords) {
            _keyWords.setAttribute("content", this);
        }
    },

    setDescription : function() {
        var _description = document.querySelector("description");
        if (_description) {
            _description.setAttribute("content", this);
        }
    },

    encodeBase64 : function() {
        if (typeof btoa === "function") {
            return btoa(unescape(encodeURIComponent(this)));
        }
        return this.toByteArray().base64();
    },

    decodeBase64 : function() {
        if (typeof atob === "function") {
            return decodeURIComponent(escape(atob(this)));
        }
        var _result = [], i = 0, _length = this.length;
        while (i < _length) {
            _result.push((BASE64.indexOf(this.charAt(i)) << 2) | BASE64.indexOf(this.charAt(i + 1)) >> 4);
            var _code = BASE64.indexOf(this.charAt(i + 2));
            if (_code !== 64) {
                _result.push(((BASE64.indexOf(this.charAt(i + 1)) & 0xF) << 4) | (BASE64.indexOf(this.charAt(i + 2)) >> 2));
            }
            _code = BASE64.indexOf(this.charAt(i + 2));
            if (_code !== 64) {
                _result.push(((BASE64.indexOf(this.charAt(i + 2)) & 0x3) << 6) | BASE64.indexOf(this.charAt(i + 3)));
            }
            i += 4;
        }
        return _result;
    },

    encodeByRegExp : function () {
        var _result = "";
        if(this.length > 0) {
            _result = this.replace(/&/g,"&amp;");
            _result = _result.replace(/</g,"&lt;");
            _result = _result.replace(/>/g,"&gt;");
            _result = _result.replace(/ /g,"&nbsp;");
            _result = _result.replace(/'/g,"&#39;");
            _result = _result.replace(/"/g,"&quot;");
        }
        return _result;
    },

    decodeByRegExp : function () {
        var _result = "";
        if(this.length > 0) {
            _result = this.replace(/&amp;/g,"&");
            _result = _result.replace(/&lt;/g,"<");
            _result = _result.replace(/&gt;/g,">");
            _result = _result.replace(/&nbsp;/g," ");
            _result = _result.replace(/&#39;/g,"\'");
            _result = _result.replace(/&quot;/g,"\"");
        }
        return _result;
    },

    toUTF8 : function() {
        return /[\u0080-\uFFFF]/.test(this) ? unescape(encodeURIComponent(this)) : this;
    },

    toByteArray : function() {
        var _array = this.split(''), _length = _array.length, _result = [], _tmp, i, j;
        for (i = 0 ; i < _length ; i++) {
            _tmp = encodeURI(_array[i]);
            if (_tmp.length === 1) {
                _result.push(_tmp.charCodeAt(0));
            } else {
                _tmp = _tmp.split('%');
                var _itemLen = _tmp.length;
                for (j = 0 ; j < _itemLen ; j++) {
                    if (_tmp[j].length > 0) {
                        _result.push(parseInt('0x' + _tmp[j]));
                    }
                }
            }
        }
        return _result;
    },

    getBytes : function(littleEndian) {
        var _dataBytes = [];
        var _charCode, _cnt = 0, _intOffset;
        var _length = this.length * 8;
        for (var _index = 0 ; _index < _length ; _index += 8) {
            var _tmpBytes = [];
            _charCode = this.charCodeAt(_index / 8);
            if (_charCode < 0x80) {
                _tmpBytes.push(_charCode);
            } else if (_charCode < 0x800) {
                _tmpBytes.push((_charCode >>> 6) | 0xC0);
                _tmpBytes.push((_charCode & 0x3F) | 0x80);
            } else if ((_charCode < 0xD800) || (_charCode >= 0xE000)) {
                _tmpBytes.push((_charCode >>> 12) | 0xE0);
                _tmpBytes.push(((_charCode >>> 6) & 0x3F) | 0x80);
                _tmpBytes.push((_charCode & 0x3F) | 0x80);
            } else {
                //  Using for UTF-16
                _index += 1;
                _charCode = 0x10000 + (((_charCode & 0x3FF) << 10) | (this.charCodeAt(_index) & 0x3FF));
                _tmpBytes.push((_charCode >>> 18) | 0xF0);
                _tmpBytes.push(((_charCode >>> 12) & 0x3F) | 0x80);
                _tmpBytes.push(((_charCode >>> 6) & 0x3F) | 0x80);
                _tmpBytes.push((_charCode & 0x3F) | 0x80);
            }

            for (var j = 0; j < _tmpBytes.length; j++) {
                _intOffset = _cnt >>> 2;
                while (_dataBytes.length <= _intOffset) {
                    _dataBytes.push(0);
                }
                if (littleEndian === null || littleEndian) {
                    _dataBytes[_intOffset] |= _tmpBytes[j] << (24 - (8 * (_cnt % 4)));
                } else {
                    _dataBytes[_intOffset] |= _tmpBytes[j] << (8 * (_cnt % 4));
                }
                _cnt++;
            }
        }
        return _dataBytes;
    }
});

Object.extend(Number.prototype, {
    parseTime : function(utc) {
        var offset = 0;
        if (utc === null || utc) {
            offset = (new Date().getTimezoneOffset() * 60 * 1000);
        }
        var _date = new Date();
        _date.setTime(this - offset);
        return _date;
    },

    toHex : function () {
        if (this >= 48 && this <= 57) {
            return this - 48;
        } else if (this >= 65 && this <= 90) {
            return 10 + this - 65;
        } else if (this >= 97 && this <= 122) {
            return 10 + this - 97;
        } else {
            return 0;
        }
    },

    safeRotateLeft : function(_count) {
        return (this << _count) | (this >>> (32 - _count));
    },

    safeRotateRight : function(_count) {
        return (this >>> _count) | (this << (32 - _count));
    },

    rotateRight : function(_count) {
        return this >>> _count;
    }
});

Object.extend(Date.prototype, {
    format : function(pattern) {
        var Pattern = {
            "y+" : this.getFullYear(),
            "M+" : this.getMonth() + 1,
            "d+" : this.getDate(),
            "H+" : this.getHours(),
            "m+" : this.getMinutes(),
            "s+" : this.getSeconds(),
            "S+"  : this.getMilliseconds(),
            "q+" : Math.floor((this.getMonth() + 3) / 3)
        };

        if (pattern === null) {
            pattern = "MM/dd/yyyy";
        }

        for (var regex in Pattern) {
            if (new RegExp("(" + regex + ")").test(pattern)) {
                var replaceValue = "" + Pattern[regex];
                if (RegExp.$1.length > replaceValue.length) {
                    var _limit = RegExp.$1.length - replaceValue.length;
                    for (var i = 0 ; i < _limit ; i++) {
                        replaceValue = "0" + replaceValue;
                    }
                }

                pattern = pattern.replace(RegExp.$1, replaceValue);
            }
        }

        return pattern;
    },

    /**
     * Calculate sunrise/sunset/noon by given gps location
     * @param posLon    GPS longitude
     * @param posLat    GPS latitude
     * @return Sun      Sun.Polar:  "Night" for Polar Night, SunRise: -1, SunSet: -1, Noon: -1
     *                              "Day" for Polar Day,     SunRise: -1, SunSet: -1, Noon: 12:00
     *                              "Normal" for Calculate,  SunRise: sunrise UTC time,
     *                                                       SunSet: sunset UTC time,
     *                                                       Noon: noon UTC time,
     *                                                       data unit: milliseconds
     */
    sunTime : function(posLon, posLat) {
        if (posLon === null || posLon < -180 || posLon > 180
            || posLat === null || posLat < -90 || posLat > 90) {
            throw new Error(Cell.message("Core", "Location.GPS.Unknown"));
        }

        var _fixTime = Math.floor(Math.abs(posLon) / 15) * 60 * 60 * 1000;
        if (Math.abs(posLon) % 15 > 7.5) {
            _fixTime += 60 * 60 * 1000;
        }
        if (posLon < 0) {
            _fixTime *= -1;
        }

        var _currentUTC = new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000,
            _gpsTime = new Date(_currentUTC + _fixTime),
            _gpsMonth = _gpsTime.getMonth() + 1, _gpsDay = _gpsTime.getDate(),
            RD = 180 / Math.PI, B5 = Math.PI * posLat / 180,
            N = (275 * _gpsMonth / 9) - 2 * ((_gpsMonth + 9) / 12) + _gpsDay - 30,
            L0 = 4.8771 + 0.0172 * (N + 0.5 - posLon / 360), C = 0.03342 * Math.sin(L0 + 1.345),
            C2 = RD * (Math.atan(Math.tan(L0 + C)) - Math.atan(0.9175 * Math.tan(L0 + C)) - C),
            SD = 0.3978 * Math.sin(L0 + C), CD = Math.sqrt(1 - SD * SD),
            SC = (SD * Math.sin(B5) + 0.0145) / (Math.cos(B5) * CD);

        var Sun = {};

        var UTC;
        if (SC < -1) {
            //  Polar Night
            Sun.Polar = "Night";
            Sun.SunRise = -1;
            Sun.SunSet = -1;
            Sun.Noon = -1;
        } else if (SC > 1) {
            //  Polar Day
            Sun.Polar = "Day";
            Sun.SunRise = -1;
            Sun.SunSet = -1;
            UTC = new Date(_currentUTC);
            UTC.setHours(12);
            UTC.setMinutes(0);
            Sun.Noon = UTC.getTime();
        } else {
            Sun.Polar = "Normal";
            var C3 = RD * Math.atan(SC / Math.sqrt(1 - Math.pow(SC, 2))), R1 = 6 - (posLon + C2 + C3) / 15,
                HR = Math.floor(R1), MR = Math.floor((R1 - HR) * 60);
            UTC = new Date(_currentUTC);
            UTC.setHours(HR);
            UTC.setMinutes(MR);
            Sun.SunRise = UTC.getTime();
            var S1 = 18 - (posLon + C2 - C3) / 15,
                HS = Math.floor(S1), MS = Math.floor((S1 - HS) * 60);
            UTC = new Date(_currentUTC);
            UTC.setHours(HS);
            UTC.setMinutes(MS);
            Sun.SunSet = UTC.getTime();
            Sun.Noon = Math.floor((Sun.SunRise + Sun.SunSet) / 2);
        }

        return Sun;
    }
});

Object.extend(Array.prototype, {
    toHex : function(littleEndian) {
        var _result = "", _byte;
        for (var i = 0 ; i < this.length ; i++) {
            _byte = this[i];
            for (var j = 0 ; j < 4 ; j++) {
                if (littleEndian === null || littleEndian) {
                    _result += BASE16[(_byte >> ((2 * j + 1) * 4)) & 0x0F] + BASE16[(_byte >> ((2 * j) * 4)) & 0x0F];
                } else {
                    _result += BASE16[(_byte >> (28 - ((2 * j) * 4))) & 0x0F] + BASE16[(_byte >> (28 - ((2 * j + 1) * 4))) & 0x0F];
                }
            }
        }
        return _result;
    },

    base64 : function(padding) {
        var _result = "", _length = this.length, i;
        for (i = 0 ; i < _length ; i += 3) {
            _result += (BASE64[this[i] >> 2] + BASE64[((this[i] & 0x3) << 4) | (this[i + 1] >> 4)]);
            if (i + 1 < _length) {
                _result += BASE64[((this[i + 1] & 0xF) << 2) | (this[i + 2] >> 6)];
            }
            if (i + 2 < _length) {
                _result += BASE64[this[i + 2] & 0x3F];
            }
        }
        while (_result.length % 4 !== 0) {
            _result += ((padding !== null) ? padding : BASE64[64]);
        }

        return _result;
    },

    toString : function() {
        var _result = "", i = 0, _length = this.length;
        while (i < _length) {
            if (this[i] < 0x80) {
                _result += String.fromCharCode(this[i]);
                i++;
            } else if (this[i] >= 0xC0 && this[i] < 0xE0) {
                _result += String.fromCharCode(((this[i] & 0x1F) << 6) | (this[i + 1] & 0x80));
                i += 2;
            } else if (this[i] >= 0xE0 && this[i] < 0xF0) {
                _result += String.fromCharCode(((this[i] & 0xF) << 12) | ((this[i + 1] & 0x3F) << 6) | (this[i + 2] & 0x3F));
                i += 3;
            } else {
                //  Using for UTF-16
                _result += String.fromCharCode(((this[i] & 0x7) << 18) | ((this[i + 1] & 0x3F) << 12) | ((this[i + 2] & 0x3F) << 6) | (this[i + 3] & 0x3F));
                i += 4;
            }
        }
        return _result;
    }
});

var Class = {
    create : function() {
        return function() {
            this.constructor.apply(this, arguments);
        }
    }
};

function safeAdd(x, y) {
    if (x == null) {
        x = 0;
    }
    if (y == null) {
        y = 0;
    }
    var _low = (x & 0xFFFF) + (y & 0xFFFF);
    var _high = (x >> 16) + (y >> 16) + (_low >> 16);
    return (_high << 16) | (_low & 0xFFFF);
}
