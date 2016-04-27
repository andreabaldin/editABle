/*  editABle.js - by Andrea Baldin @ ab SoftLab LTD (NZ) 
    ver: 0.2 Apr 2016 - MIT license (MIT)
    NOTICE: type="number" uses Numeral.js library, see: http://numeraljs.com/ for details.  Include it from cdnjs.com
*/
$.fn.editABle = function (parameters) {
    'use strict';
    var _move = "td[role!='locked']:first";
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
                rowTemplate = $(this).first().find("tr[role='template']"),
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
                        cellTemplate = parameters.template ? parameters.templateparameters.template[_ci] : rowTemplate.find("td").eq(_ci);  // ... Get details at same-index cellTemplate first-row

                        if (parameters.behaviours.debug)
                            console.log("showEditor cell index:" + _ci);

                        var tableMode = activeGrid.attr("role") || "edit";
                        if (tableMode.indexOf("locked") >= 0 ||
                                tableMode.indexOf("insert") >= 0 && !activeRow.hasClass("newRow") ||
                                    activeCell.attr("role") == "locked" ||
                                        activeCell.attr("role") != "edit" && cellTemplate.attr("role") == "locked" ||
                                            activeRow.attr("role") == "locked") {
                            if (parameters.behaviours.debug)
                                console.log("showEditor cell not for editing");
                            return false;
                        }

                        activeGrid.attr("data-currentRow", activeRow.index());                      // ... trace the current row on <table data-currentRow="n">

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
                    if (_afterupdate) {
                        if (parameters.behaviours.debug)
                            console.log("afterUpdate: " + _afterupdate);
                        return invokeFunction(_afterupdate.trim(), window);
                    }
                },

                // ... Eg. invokeFunction("My.Namespace.functionName(a, b)", window)
                invokeFunction = function (functionName, context) {
                    var _opIdx = functionName.indexOf("(");                                         // ... 25
                    var _clIdx = functionName.lastIndexOf(")");                                     // ... 30
                    var _params = "[" + functionName.substr(_opIdx + 1, _clIdx - _opIdx - 1) + "]"; // ... "[a,b]"
                    var _namespaces = functionName.substr(0, _opIdx).split(".");                    // ... ["My", "Namespace", "functionName"]
                    var _functionName = _namespaces.pop();                                          // ... "functionName"    /    ["My", "Namespace"]
                    for (var i = 0; i < _namespaces.length; i++)
                        context = context[_namespaces[i]];                                          // ... window["My"]["Namespace"]
                    var _args = Object(eval(_params));                                              // ... { <a_value>, <b_value> }
                    return context[_functionName].apply(context, _args);                            // ... window["My"]["Namespace"]["functionName"](<a_value>, <b_value>)
                },

                setCellContent = function (_txt, _val) {

                    if (!inputElement)
                        return false;

                    switch (inputType) {

                        case "combobox":
                            value = _val || inputElement.is(':checked');
                            text = _txt || inputElement.find("option:selected").text();
                            break;

                        case "number":
                            var _viewStr = inputElement.attr("view");
                            var _frmtStr = inputElement.attr("format");
                            value = _val || inputElement.val();
                            if (_frmtStr)
                                value = numeral(value).format(_frmtStr)
                            text = _viewStr ? numeral(value).format(_viewStr) : undefined;
                            break;

                        default:
                            value = _val || inputElement.val();
                            text = _txt || undefined;
                            break;
                    }

                    afterUpdate(inputElement.attr("afterUpdate"));                              // ... invoke cell afterupdate function, if any
                    boolValue = Boolean(value || text);

                    var _checkValidity = inputElement[0].checkValidity();
                    if (parameters.behaviours.debug)
                        console.log("setCellContent, template='" + template + "'   text='" + text + "'   value='" + value + "'   boolValue=" + boolValue + "'   checkValidity=" + _checkValidity);

                    // ... writing final attributes to table cell
                    activeCell
                        .removeClass("editABle")
                        .addClass("edited")
                        .toggleClass("invalid", !_checkValidity);

                    activeCell.attr("lastText", text != undefined ? text : value);
                    if (activeCell[0].hasAttribute("value")) {
                        activeCell
                            .attr("value", value != undefined ? value : text)
                            .attr("lastValue", value != undefined ? value : text);
                    }

                    // ... finalise td content
                    if (template) {
                        text = template.replace("$text", text);
                        text = text.replace("$value", value);
                        text = text.replace("$boolValue", boolValue);
                    }

                    if (!parameters.behaviours.leave) {
                        inputElement.remove();
                        activeCell.html(text != undefined ? text : value);
                    }

                    if (parameters) {
                        parameters.lastCell = {};
                        parameters.lastCell.boolValue = boolValue;
                        parameters.lastCell.value = value;
                        parameters.lastCell.text = text;
                    }

                    inputType = null;
                    inputElement = null;
                },

                rowsRender = function () {

                };


            if (parameters.behaviours.render && parameters.data.length > 0) {

                if (parameters.behaviours.debug)
                    console.log("Grid rendering Start");

                var _tbodycontent = [];
                for (var _r = 0; _r < parameters.data.length; _r++) {
                    var _row = $('<tr>');
                    for (var _c = 0; _c < parameters.data[_r].data.length; _c++) {

                        var _cell = $('<td>');
                        var _id = parameters.template.id || "$row_$col";
                        _id = _id.replace(/\$row/g, _r).replace(/\$col/g, _c);
                        _cell.attr("id", _id);

                        for (var _key in parameters.template.celltemplate[_r]) {
                            if (parameters.template.celltemplate[_r].hasOwnProperty(_key))
                                _cell.attr(_key, parameters.template.celltemplate[_r][_key]);
                        }

                        var _x = parameters.data[_r].data[_c];
                        if (_x && typeof _x == "object")
                            for (var _key in _x) {
                                if (_x.hasOwnProperty(_key))
                                    _cell.attr(_key, _x[_key]);
                            }
                        else
                            _cell.text(_x);
                        _row.append(_cell);

                    }
                    _tbodycontent.push(_row);
                }
                activeGrid
                    .find("tbody")
                    .replaceWith(_tbodycontent);

                if (parameters.behaviours.debug)
                    console.log("Grid rendering End");
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
                        case ENTER:
                            if (_editMode) {
                                e.stopPropagation();
                                e.preventDefault();
                                _currentCell = inputElement.closest('td');
                                if (e.shiftKey)
                                    _nextCell = _currentCell.prevAll(_move);
                                else
                                    _nextCell = _currentCell.nextAll("td[role != 'locked']").first();
                                setCellContent();
                                if (_nextCell.index() >= 0) {
                                    _nextCell.focus();
                                    var _e = $.Event('keypress');
                                    _e.which = 13;
                                    activeGrid.trigger(_e);
                                    inputElement.focus();
                                } else {
                                    afterUpdate(rowTemplate.attr("afterUpdate"));                   // ... invoke row template afterupdate function, if any
                                    _currentCell.focus();
                                }
                                return false;
                            }
                            break;

                        case ARROW_LEFT:
                            if (_editMode) {
                                if (inputType == "combobox" || inputElement.val() == "") {
                                    _currentCell = inputElement.closest('td');
                                    _nextCell = _currentCell.prev(_move);
                                }
                            } else
                                _nextCell = _currentCell.prev(_move);
                            break;

                        case ARROW_RIGHT:
                            _nextCell = _currentCell.next(_move);
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
            activeGrid.find("tbody tr[role!='locked']").each(
                function () {
                    $(this).find("td[role != 'locked']").prop('tabindex', 0);
                }
            );

            // ... Equivalent to C# String.format()
            if (!String.format) {
                String.format = function (format) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    return format.replace(/{(\d+)}/g, function (match, number) {
                        return typeof args[number] != 'undefined'
                          ? args[number]
                          : match
                        ;
                    });
                };
            }
        }
    );
};
