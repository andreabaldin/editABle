/*  editABle.js - by Andrea Baldin @ ab SoftLab LTD (NZ) 
    ver: 0.1 Apr 2016 - MIT license (MIT)
*/
$.fn.editABle = function (parameters) {
    'use strict';
    return $(this).each(

        function () {

            var ARROW_LEFT = 37, ARROW_UP = 38, ARROW_RIGHT = 39, ARROW_DOWN = 40, ENTER = 13, ESC = 27, TAB = 9,
                shift = false,
                value,
                text,
                boolValue,
                keyCode,
                activeGrid = $(this),
                activeRow,
                activeCell,
                rowTemplate = parameters.template || $(this).first().find("tr[role='template']"),
                cellTemplate,
                template,
                inputType,
                inputElement = {},
                lastText,
                lastValue,

                showEditor = function (e) {

                    if (activeGrid.find('tbody td:focus').length > 0) {
                        activeCell = activeGrid.find('tbody td:focus');
                        activeRow = activeCell.closest("tr");
                        var _ci = activeCell.index();
                        cellTemplate = rowTemplate.find("td").eq(_ci);                                      // ... Get details at same-index cellTemplate first-row

                        if (parameters.behaviours.debug)
                            console.log("showEditor cell index:" + _ci);

                        var tableMode = activeGrid.attr('data-role') || "edit";
                        if (tableMode.indexOf("locked") >= 0 ||
                        tableMode.indexOf("insert") >= 0 && !activeRow.hasClass("newRow") ||
                            activeCell.data('role') == "locked" ||
                                activeCell.data('role') != "edit" && cellTemplate.data('role') == "locked" ||
                                    activeRow.data('role') == "locked") {
                            if (parameters.behaviours.debug)
                                console.log("showEditor cell not for editing");
                            return false;
                        }

                        activeGrid.attr("data-currentRow", activeRow.index());                              // ... trace the current row on <table data-currentRow="n">

                        inputType = activeCell.attr("type") || cellTemplate.attr("type") || "text";
                        template = activeCell[0].hasAttribute("template") ? activeCell.attr("template") : cellTemplate[0].innerHTML;

                        if (parameters.behaviours.debug)
                            console.log("showEditor inputType=" + inputType);

                        if (activeCell.length > 0) {

                            activeCell.Name = activeCell.attr("Name") || cellTemplate.attr("Name");
                            activeRow.addClass('selectedRow').siblings().removeClass('selectedRow');

                            lastText = activeCell.text();
                            lastValue = activeCell.attr("value");
                            // ... preserve original value on cell attribute
                            if (activeCell.attr("originalText") == undefined) {
                                activeCell.attr('originalText', lastText);
                                if (lastValue)
                                    activeCell.attr('originalValue', lastValue);            // ... preserve the original value
                            }

                            activeCell
                                .addClass("editABle")
                                .removeClass("invalid")
                                .empty();                                                   // ... empty the Cell


                            // ... switch the proper input element
                            switch (inputType) {
                                case "combobox":
                                    var injOptions = parameters.comboBoxOptions[activeCell.Name] || activeCell.attr("data-options") || cellTemplate.attr("data-options");
                                    inputElement = $('<select autofocus>');
                                    inputElement
                                        .html(injOptions)
                                        .val(lastValue);
                                    break;
                                default:
                                    inputElement = $('<input>');
                                    if (inputType == "checkbox") {
                                        if (Boolean((lastValue || lastText) == "true"))
                                            inputElement.attr("checked", true);
                                    }
                                    else
                                        inputElement.val(lastValue || lastText)
                                    break;
                            }

                            // ... inherit attributes from cellTemplate to the inputElement
                            cellTemplate.each(function () {
                                $.each(this.attributes,
                                function (i, attrib) {
                                    inputElement.attr(attrib.name, attrib.value);
                                });
                            });

                            // ... inherit overriding attributes with those from the cell to the inputElement
                            activeCell.each(function () {
                                $.each(this.attributes,
                                function (i, attrib) {
                                    inputElement.attr(attrib.name, attrib.value);
                                });
                            });

                            inputElement
                                .attr("tabindex", "-1")
                                .addClass('editABle')
                                .attr('lastText', lastText)
                                .attr("type", inputType)
                                .blur(function (e) {
                                    console.log("blur");
                                    setCellContent();
                                });
                            if (lastValue)
                                inputElement.attr('lastValue', lastValue);

                            activeCell.html(inputElement);                                                  // ... finally inject the input element
                            if (inputType != "combobox" &&
                                    inputType != "checkbox" &&
                                        (activeCell.attr('selectText') || cellTemplate.attr('selectText') || true)) {
                                inputElement.select();
                            }
                            inputElement.focus();
                        }
                    }
                },

                afterUpdate = function (_afterupdate) {
                    if (_afterupdate)
                        invokeFunction(_afterupdate, window);
                },

                // ... Eg. invokeFunction("My.Namespace.functionName(a, b)", window)
                invokeFunction = function (functionName, context) {
                    var _parts = functionName.split("(");                                           // ... ["My.Namespace.functionName", " a, b)"]
                    var _namespaces = _parts.shift().split(".");                                    // ... ["My", "Namespace", "functionName"]    /    [" a, b)"]
                    var _functionName = _namespaces.pop();                                          // ... "functionName"    /    ["My", "Namespace"]
                    for (var i = 0; i < _namespaces.length; i++)
                        context = context[_namespaces[i]];                                          // ... window["My"]["Namespace"]
                    var _params = "[ " + _parts[0].replace(")", "") + " ]";                         // ... "[ a, b ]"
                    var _args = Object(eval(_params));                                              // ... { <a_value>, <b_value> }
                    return context[_functionName].apply(context, _args);                            // ... window["My"]["Namespace"]["functionName"](<a_value>, <b_value>)
                },

                setCellContent = function (_txt, _val) {

                    _val = _val || (inputType == "checkbox" ? inputElement.is(':checked') : inputElement.val());
                    _txt = _txt || (inputType == "combobox" ? inputElement.find("option:selected").text() : undefined);

                    boolValue = Boolean(_val || _txt);
                    var _checkValidity = inputElement[0].checkValidity();
                    if (parameters.behaviours.debug)
                        console.log("setCellContent, template='" + template + "'   text='" + _txt + "'   value='" + _val + "'   boolValue=" + boolValue + "'   checkValidity=" + _checkValidity);

                    // ... writing final attributes to table cell
                    activeCell
                        .removeClass("editABle")
                        .addClass("edited")
                        .toggleClass("invalid", !_checkValidity);

                    activeCell.attr("lastText", _txt != undefined ? _txt : _val);
                    if (activeCell[0].hasAttribute("value")) {
                        activeCell
                            .attr("value", _val != undefined ? _val : _txt)
                            .attr("lastValue", _val != undefined ? _val : _txt);
                    }

                    // ... finalise td content
                    if (template) {
                        _txt = template.replace("$text", _txt);
                        _txt = _txt.replace("$value", _val);
                        _txt = _txt.replace("$boolValue", boolValue);
                    }

                    value = _val;
                    text = _txt;
                    if (!parameters.behaviours.leave) {
                        inputElement.remove();
                        activeCell.html(_txt != undefined ? _txt : _val);
                    }

                    afterUpdate(inputElement.attr("afterUpdate"));                                  // ... invoke cell afterupdate function, if any

                    inputType = null;
                    inputElement = null;
                };


            // ... Activate editing
            activeGrid
                .on('keypress click dblclick', showEditor)
                .css('cursor', 'text')
                .keydown(function (e) {

                    var _currentCell = $(e.target),
                        _nextCell,
                        _nextRow,
                        _editMode = !!inputType,
                        _focused = document.activeElement;
                    keyCode = e.keyCode || e.which;

                    if (parameters.behaviours.debug)
                        console.log("activeGrid.keydown  (" + _focused.tagName + ")  cell.index=" + _currentCell.index() + "   key=" + keyCode + "   _editMode=" + _editMode);

                    switch (keyCode) {

                        case ESC:
                            if (_editMode) {
                                _currentCell = inputElement.closest('td');
                                setCellContent(inputElement.attr('lastText'), inputElement.attr('lastValue'));
                                _currentCell.focus();
                                return false;
                            }
                            break;

                        case TAB:
                            if (_editMode) {
                                e.stopPropagation();
                                e.preventDefault();
                                _currentCell = inputElement.closest('td');
                                if (e.shiftKey)
                                    _nextCell = _currentCell.prev("td[data-role!='locked']");
                                else
                                    _nextCell = _currentCell.next("td[data-role!='locked']");
                                setCellContent();
                                if (_nextCell.index() >= 0) {
                                    _nextCell.focus();
                                    var _e = $.Event('keypress');
                                    _e.which = 13;
                                    activeGrid.trigger(_e);
                                    inputElement.focus();
                                } else {
                                    _currentCell.focus();
                                    afterUpdate(rowTemplate.attr("afterUpdate"));                   // ... invoke row template afterupdate function, if any
                                }
                                return false;
                            }
                            break;

                        case ENTER:
                            if (_editMode) {
                                _currentCell = inputElement.closest('td');
                                _nextCell = _currentCell.next("td[data-role!='locked']");
                                if (_nextCell.index() < 0) {
                                    setCellContent();
                                    _currentCell.focus();
                                    afterUpdate(rowTemplate.attr("afterUpdate"));                   // ... invoke row template afterupdate function, if any
                                    return false;
                                }
                            }
                            break;

                        case ARROW_LEFT:
                            if (_editMode) {
                                if (inputType == "combobox" || inputElement.val() == "") {
                                    _currentCell = inputElement.closest('td');
                                    _nextCell = _currentCell.prev("td[data-role!='locked']");
                                }
                            } else
                                _nextCell = _currentCell.prev("td[data-role!='locked']");
                            break;

                        case ARROW_RIGHT:
                            _nextCell = _currentCell.next("td[data-role!='locked']");
                            break;

                        case ARROW_UP:
                            if (_editMode)
                                _currentCell = inputElement.closest('td');

                            if (e.ctrlKey || inputType != "combobox") {
                                _nextRow = _currentCell.parent().prev();
                                _nextCell = _nextRow.children().eq(_currentCell.index());
                                afterUpdate(rowTemplate.attr("afterUpdate"));                       // ... invoke row template afterupdate function, if any
                            }
                            break;

                        case ARROW_DOWN:
                            if (_editMode)
                                _currentCell = inputElement.closest('td');

                            if (e.ctrlKey || inputType != "combobox") {
                                _nextRow = _currentCell.parent().next();
                                _nextCell = _nextRow.children().eq(_currentCell.index());
                                afterUpdate(rowTemplate.attr("afterUpdate"));                       // ... invoke row template afterupdate function, if any
                            }
                            break;

                    }

                    if (_nextCell) {
                        _nextCell.focus();
                        _nextCell.closest('tr').addClass('selectedRow').siblings().removeClass('selectedRow');           // ... table-row highlighting
                    }

                }
            );

            // ... Set tabindex to enabled cells
            activeGrid.find("tbody tr[data-role='edit']").each(
                function () {
                    $(this).find("td[data-role!='locked']").prop('tabindex', 0);
                }
            );

        }
    );
};
