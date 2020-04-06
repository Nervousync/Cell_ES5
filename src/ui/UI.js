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
 * [New] UI Design
 */
(function(processors) {
    if (typeof Cell !== "undefined" && Array.isArray(processors)) {
        Cell.registerUIProcessors(processors);
    }
})(function() {
    var processors = [];
    processors["*[data-bind-updater]"] = function (element) {
        if (element.id && element.id.length > 0) {
            var name = element.dataset.template || "";
            if (name.length > 0 && !Cell.hasTemplate(name)) {
                throw new Error(Cell.message("Core", "Template.Not.Exists", name));
            }
            Object.defineProperty(element, "data", {
                set: function (data) {
                    if (!data.isJSON()) {
                        throw new Error(Cell.message("Core", "Data.Invalid.JSON"));
                    }
                    var _jsonData = data.parseJSON();
                    if (this.tagName.toLowerCase() === "form") {
                        var _inputList = this.querySelectorAll("input, select, datalist"),
                            _inputLength = _inputList.length, j, input;
                        for (j = 0; j < _inputLength; j++) {
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
                        Cell.renderTemplate(element, _jsonData, (this.dataset.override === "true"));
                    }
                    Cell.processOnload();
                    if (_jsonData.hasOwnProperty("title")) {
                        _jsonData["title"].setTitle();
                    }
                    if (_jsonData.hasOwnProperty("keywords")) {
                        _jsonData["keywords"].setKeywords();
                    }
                    if (_jsonData.hasOwnProperty("description")) {
                        _jsonData["description"].setDescription();
                    }
                    if (this.dataset.floatWindow) {
                        openCover();
                        this.show();
                        if (_jsonData.hasOwnProperty("timeout") && _jsonData["timeout"].isNum()) {
                            setTimeout(function () {
                                this.hide();
                                closeCover();
                            }, _jsonData["timeout"].parseInt());
                        }
                    }
                }
            });
        }
    };
    processors["*[data-float-window='true']"] = function (element) {
        element.hide();
    };
    processors["*[href][data-element-id]"] = function (element) {
        if (element.dataset.elementId !== null && element.hasAttribute("href")) {
            element.addEvent("click", function (event) {
                Cell.sendRequest(event);
            });
        }
        if (element.dataset.disabled === "true" && element.dataset.activeDelay
            && element.dataset.activeDelay.isNum()) {
            setTimeout(Cell.enableElement(element), element.dataset.activeDelay.parseInt());
        }
    };
    processors["a[data-form-id], button[data-form-id]"] = function (element) {
        if (element.dataset.formId !== null) {
            element.addEvent("click", function (event) {
                Cell.submitForm(event);
            })
        }
    };
    processors["input[data-validate='true'], select[data-validate='true'], textarea[data-validate='true']"] =
        function (element) {
            element.addEvent("blur", function (event) {
                event.target.validate();
            })
        };
    return processors;
}());
