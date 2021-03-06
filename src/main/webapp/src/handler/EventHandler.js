/**
 * Event Handler
 *
 * @class
 * @requires OG.renderer.*
 *
 * @param {OG.renderer.IRenderer} renderer 렌더러
 * @param {Object} config Configuration
 * @author <a href="mailto:hrkenshin@gmail.com">Seungbaek Lee</a>
 */
OG.handler.EventHandler = function (renderer, config) {
    this._RENDERER = renderer;
    this._CONFIG = config;
};

OG.handler.EventHandler.prototype = {
    /**
     * 주어진 Shape Element 의 라벨을 수정 가능하도록 한다.
     *
     * @param {Element} element Shape Element
     */
    enableEditLabel: function (element) {
        var me = this;

        $(element).bind({
            dblclick: function (event) {
                var container = me._RENDERER.getContainer(),
                    envelope = element.shape.geom.getBoundary(),
                    upperLeft = envelope.getUpperLeft(),
                    bBox,
                    left = (upperLeft.x - 1) * me._CONFIG.SCALE,
                    top = (upperLeft.y - 1) * me._CONFIG.SCALE,
                    width = envelope.getWidth() * me._CONFIG.SCALE,
                    height = envelope.getHeight() * me._CONFIG.SCALE,
                    editorId = element.id + OG.Constants.LABEL_EDITOR_SUFFIX,
                    labelEditor,
                    textAlign = "center",
                    fromLabel,
                    toLabel,
                    /**
                     * 라인(꺽은선)의 중심위치를 반환한다.
                     *
                     * @param {Element} element Edge 엘리먼트
                     * @return {OG.Coordinate}
                     */
                    getCenterOfEdge = function (element) {
                        var vertices, from, to, lineLength, distance = 0, i, intersectArray;

                        if (element.shape.geom.style.get("edge-type") === OG.Constants.EDGE_TYPE.BEZIER) {
                            vertices = element.shape.geom.getControlPoints();
                            from = vertices[0];
                            to = vertices[vertices.length - 1];
                            return new OG.geometry.Coordinate(OG.Util.round((from.x + to.x) / 2), OG.Util.round((from.y + to.y) / 2));
                        } else {

                            // Edge Shape 인 경우 라인의 중간 지점 찾기
                            vertices = element.shape.geom.getVertices();
                            lineLength = element.shape.geom.getLength();

                            for (i = 0; i < vertices.length - 1; i++) {
                                distance += vertices[i].distance(vertices[i + 1]);
                                if (distance > lineLength / 2) {
                                    intersectArray = element.shape.geom.intersectCircleToLine(
                                        vertices[i + 1], distance - lineLength / 2, vertices[i + 1], vertices[i]
                                    );

                                    break;
                                }
                            }

                            return intersectArray[0];
                        }
                    },
                    centerOfEdge;

                if (element.shape.isCollapsed === false) {
                    // textarea
                    $(container).append("<textarea id='" + element.id + OG.Constants.LABEL_EDITOR_SUFFIX + "'></textarea>");
                    labelEditor = $("#" + editorId);

                    // text-align 스타일 적용
                    switch (element.shape.geom.style.get("text-anchor")) {
                        case "start":
                            textAlign = "left";
                            break;
                        case "middle":
                            textAlign = "center";
                            break;
                        case "end":
                            textAlign = "right";
                            break;
                        default:
                            textAlign = "center";
                            break;
                    }

                    if ($(element).attr("_shape") === OG.Constants.SHAPE_TYPE.HTML) {
                        // Html Shape
                        $(labelEditor).css(OG.Util.apply(me._CONFIG.DEFAULT_STYLE.LABEL_EDITOR, {
                            left: left,
                            top: top,
                            width: width,
                            height: height,
                            "text-align": 'left',
                            overflow: "hidden",
                            resize: "none"
                        }));
                        $(labelEditor).focus();
                        $(labelEditor).val(element.shape.html);

                        $(labelEditor).bind({
                            focusout: function () {
                                element.shape.html = this.value;
                                if (element.shape.html) {
                                    me._RENDERER.redrawShape(element);
                                    this.parentNode.removeChild(this);
                                } else {
                                    me._RENDERER.removeShape(element);
                                    this.parentNode.removeChild(this);
                                }
                            }
                        });
                    } else if ($(element).attr("_shape") === OG.Constants.SHAPE_TYPE.TEXT) {
                        // Text Shape
                        $(labelEditor).css(OG.Util.apply(me._CONFIG.DEFAULT_STYLE.LABEL_EDITOR, {
                            left: left,
                            top: top,
                            width: width,
                            height: height,
                            "text-align": textAlign,
                            overflow: "hidden",
                            resize: "none"
                        }));
                        $(labelEditor).focus();
                        $(labelEditor).val(element.shape.text);

                        $(labelEditor).bind({
                            focusout: function () {
                                element.shape.text = this.value;
                                if (element.shape.text) {
                                    me._RENDERER.redrawShape(element);
                                    this.parentNode.removeChild(this);
                                } else {
                                    me._RENDERER.removeShape(element);
                                    this.parentNode.removeChild(this);
                                }
                            }
                        });
                    } else if ($(element).attr("_shape") === OG.Constants.SHAPE_TYPE.EDGE) {
                        // Edge Shape
                        if (element.shape.label && me._RENDERER.isSVG()) {
                            $(element).children('[id$=_LABEL]').each(function (idx, item) {
                                $(item).find("text").each(function (idx2, item2) {
                                    bBox = me._RENDERER.getBBox(item2);
                                    left = bBox.x - 10;
                                    top = bBox.y;
                                    width = bBox.width + 20;
                                    height = bBox.height;
                                });
                            });
                        } else {
                            centerOfEdge = getCenterOfEdge(element);
                            left = centerOfEdge.x - me._CONFIG.LABEL_EDITOR_WIDTH / 2;
                            top = centerOfEdge.y - me._CONFIG.LABEL_EDITOR_HEIGHT / 2;
                            width = me._CONFIG.LABEL_EDITOR_WIDTH;
                            height = me._CONFIG.LABEL_EDITOR_HEIGHT;
                        }

                        // 시작점 라벨인 경우
                        $(event.srcElement).parents('[id$=_FROMLABEL]').each(function (idx, item) {
                            $(item).find("text").each(function (idx2, item2) {
                                bBox = me._RENDERER.getBBox(item2);
                                left = bBox.x - 10;
                                top = bBox.y;
                                width = bBox.width + 20;
                                height = bBox.height;
                                fromLabel = element.shape.fromLabel;
                            });
                        });

                        // 끝점 라벨인 경우
                        $(event.srcElement).parents('[id$=_TOLABEL]').each(function (idx, item) {
                            $(item).find("text").each(function (idx2, item2) {
                                bBox = me._RENDERER.getBBox(item2);
                                left = bBox.x - 10;
                                top = bBox.y;
                                width = bBox.width + 20;
                                height = bBox.height;
                                toLabel = element.shape.toLabel;
                            });
                        });

                        $(labelEditor).css(OG.Util.apply(me._CONFIG.DEFAULT_STYLE.LABEL_EDITOR, {
                            left: left * me._CONFIG.SCALE,
                            top: top * me._CONFIG.SCALE,
                            width: width * me._CONFIG.SCALE,
                            height: height * me._CONFIG.SCALE,
                            overflow: "hidden",
                            resize: "none"
                        }));
                        $(labelEditor).focus();

                        if (fromLabel || toLabel) {
                            $(labelEditor).val(fromLabel ? element.shape.fromLabel : element.shape.toLabel);
                        } else {
                            $(labelEditor).val(element.shape.label);
                        }

                        $(labelEditor).bind({
                            focusout: function () {
                                if (fromLabel) {
                                    me._RENDERER.drawEdgeLabel(element, this.value, 'FROM');
                                } else if (toLabel) {
                                    me._RENDERER.drawEdgeLabel(element, this.value, 'TO');
                                } else {
                                    me._RENDERER.drawLabel(element, this.value);
                                }

                                this.parentNode.removeChild(this);
                            }
                        });
                    } else {
                        $(labelEditor).css(OG.Util.apply(me._CONFIG.DEFAULT_STYLE.LABEL_EDITOR, {
                            left: left,
                            top: top,
                            width: width,
                            height: height,
                            "text-align": textAlign,
                            overflow: "hidden",
                            resize: "none"
                        }));
                        $(labelEditor).focus();
                        $(labelEditor).val(element.shape.label);

                        $(labelEditor).bind({
                            focusout: function () {
                                me._RENDERER.drawLabel(element, this.value);
                                this.parentNode.removeChild(this);
                            }
                        });
                    }
                }
            }
        });
    },

    /**
     * 주어진 Shape Element 를 연결가능하도록 한다.
     *
     * @param {Element} element Shape Element
     */
    enableConnect: function (element) {
        var me = this, terminalGroup, root = me._RENDERER.getRootGroup();

        $(element).bind({
            mouseover: function () {
                if (element.shape.isCollapsed === false) {


                    terminalGroup = me._RENDERER.drawTerminal(element,
                        $(root).data("dragged_guide") === "to" ? OG.Constants.TERMINAL_TYPE.IN : OG.Constants.TERMINAL_TYPE.OUT);

                    if (terminalGroup && terminalGroup.terminal && terminalGroup.terminal.childNodes.length > 0) {
                        // 센터 연결 터미널 찾기
                        if ($(root).data("edge")) {
                            $.each(terminalGroup.terminal.childNodes, function (idx, item) {
                                var fromTerminal = $(root).data("from_terminal"),
                                    fromShape = fromTerminal && OG.Util.isElement(fromTerminal) ? me._getShapeFromTerminal(fromTerminal) : null,
                                    isSelf = element && fromShape && element.id === fromShape.id;

                                if (item.terminal && item.terminal.direction.toLowerCase() === "c"
                                    && (($(root).data("dragged_guide") === "to" && item.terminal.inout.indexOf(OG.Constants.TERMINAL_TYPE.IN) >= 0) ||
                                    ($(root).data("dragged_guide") === "from" && item.terminal.inout.indexOf(OG.Constants.TERMINAL_TYPE.OUT) >= 0))
                                    && (!isSelf || me._isSelfConnectable(element.shape))) {
                                    me._RENDERER.drawDropOverGuide(element);
                                    $(root).data("edge_terminal", item);
                                    return false;
                                }
                            });
                        }

                        $(terminalGroup.bBox).bind({
                            mouseout: function () {
                                if (!$(root).data("edge")) {
                                    me._RENDERER.removeTerminal(element);
                                }
                            }
                        });

                        $.each(terminalGroup.terminal.childNodes, function (idx, item) {
                            if (item.terminal) {
                                $(item).bind({
                                    mouseover: function (event) {
                                        var fromTerminal = $(root).data("from_terminal"),
                                            fromShape = fromTerminal && OG.Util.isElement(fromTerminal) ? me._getShapeFromTerminal(fromTerminal) : null,
                                            isSelf = element && fromShape && element.id === fromShape.id;

                                        if ((($(root).data("dragged_guide") === "to" && item.terminal.inout.indexOf(OG.Constants.TERMINAL_TYPE.IN) >= 0) ||
                                            ($(root).data("dragged_guide") === "from" && item.terminal.inout.indexOf(OG.Constants.TERMINAL_TYPE.OUT) >= 0) ||
                                            (!$(root).data("dragged_guide") && item.terminal.inout.indexOf(OG.Constants.TERMINAL_TYPE.OUT) >= 0))
                                            && (!isSelf || me._isSelfConnectable(element.shape))) {
                                            me._RENDERER.setAttr(item, me._CONFIG.DEFAULT_STYLE.TERMINAL_OVER);
                                            $(root).data("edge_terminal", item);
                                        }
                                    },
                                    mouseout: function () {
                                        me._RENDERER.setAttr(item, me._CONFIG.DEFAULT_STYLE.TERMINAL);
                                        $(root).removeData("edge_terminal");
                                    }
                                });

                                $(item).draggable({
                                    start: function (event) {
                                        var x = item.terminal.position.x, y = item.terminal.position.y,
                                            edge = me._RENDERER.drawShape(null, new OG.EdgeShape([x, y], [x, y]), null,
                                                me._CONFIG.DEFAULT_STYLE.EDGE_SHADOW);

                                        $(root).data("edge", edge);
                                        $(root).data("from_terminal", item);
                                        $(root).data("dragged_guide", "to");

                                        me._RENDERER.removeRubberBand(me._RENDERER.getRootElement());
                                        $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "][_selected=true]").each(function (n, selectedItem) {
                                            if (selectedItem.id) {
                                                me._RENDERER.removeGuide(selectedItem);
                                            }
                                        });
                                    },
                                    drag: function (event) {
                                        var eventOffset = me._getOffset(event),
                                            edge = $(root).data("edge"),
                                            fromTerminal = $(root).data("from_terminal"),
                                            toTerminal = $(root).data("edge_terminal"),
                                            fromXY = [fromTerminal.terminal.position.x, fromTerminal.terminal.position.y],
                                            toXY = toTerminal ?
                                                [toTerminal.terminal.position.x, toTerminal.terminal.position.y] :
                                                [eventOffset.x, eventOffset.y],
                                            fromDrct = fromTerminal.terminal.direction.toLowerCase(),
                                            toDrct = toTerminal ? toTerminal.terminal.direction.toLowerCase() : "c",
                                            toShape = toTerminal ? me._getShapeFromTerminal(toTerminal) : null,
                                            orgFromXY, orgToXY, intersectionInfo, isSelf;

                                        $(this).css({"position": "", "left": "", "top": ""});

                                        // backup edge-direction
                                        orgFromXY = fromXY;
                                        orgToXY = toXY;

                                        // direction 이 c 인 경우에 대한 처리(센터 연결)
                                        if (!element.shape.geom.getBoundary().isContains(toXY) && fromDrct === "c") {
                                            intersectionInfo = me._RENDERER.intersectionEdge(
                                                edge.shape.geom.style.get("edge-type"), element, [orgFromXY[0], orgFromXY[1]], [orgToXY[0], orgToXY[1]], true
                                            );
                                            fromXY = intersectionInfo.position;
                                            fromDrct = intersectionInfo.direction;
                                        }
                                        if (toShape && toDrct === "c") {
                                            intersectionInfo = me._RENDERER.intersectionEdge(
                                                edge.shape.geom.style.get("edge-type"), toShape, [orgFromXY[0], orgFromXY[1]], [orgToXY[0], orgToXY[1]], false
                                            );
                                            toXY = intersectionInfo.position;
                                            toDrct = intersectionInfo.direction;
                                        }

                                        isSelf = element && toShape && element.id === toShape.id;
                                        if (isSelf) {
                                            fromXY = toXY = element.shape.geom.getBoundary().getRightCenter();
                                        }

                                        if (!isSelf || me._isSelfConnectable(element.shape)) {
                                            me._RENDERER.drawEdge(new OG.Line(fromXY, toXY),
                                                OG.Util.apply(edge.shape.geom.style.map, {"edge-direction": fromDrct + " " + toDrct}), edge.id, isSelf);
                                        }
                                    },
                                    stop: function (event) {
                                        var to = me._getOffset(event),
                                            edge = $(root).data("edge"),
                                            fromTerminal = $(root).data("from_terminal"),
                                            toTerminal = $(root).data("edge_terminal") || [to.x, to.y],
                                            toShape = OG.Util.isElement(toTerminal) ? me._getShapeFromTerminal(toTerminal) : null,
                                            boundary, clonedElement, terminalGroup, childTerminals, guide, i, isSelf;

                                        $(this).css({"position": "absolute", "left": "0px", "top": "0px"});

                                        // 연결대상이 없으면 복사후 연결
                                        if (!$(root).data("edge_terminal") && me._isConnectCloneable(element.shape)) {
                                            boundary = element.shape.geom.getBoundary();
                                            clonedElement = me._RENDERER.drawShape([to.x, to.y], element.shape.clone(),
                                                [boundary.getWidth(), boundary.getHeight()], element.shapeStyle);

                                            // enable event
                                            me.setClickSelectable(clonedElement, me._isSelectable(clonedElement.shape));
                                            me.setMovable(clonedElement, me._isMovable(clonedElement.shape));
                                            me.setConnectGuide(clonedElement, me._isConnectable(clonedElement.shape));
                                            if (me._CONFIG.GROUP_DROPABLE && clonedElement.shape.GROUP_DROPABLE) {
                                                me.enableDragAndDropGroup(clonedElement);
                                            }
                                            if (me._CONFIG.GROUP_COLLAPSIBLE && clonedElement.shape.GROUP_COLLAPSIBLE) {
                                                me.enableCollapse(clonedElement);
                                            }
                                            if (me._isConnectable(clonedElement.shape)) {
                                                me.enableConnect(clonedElement);
                                            }
                                            if (me._isLabelEditable(clonedElement.shape)) {
                                                me.enableEditLabel(clonedElement);
                                            }

                                            // 센터 연결 터미널 찾기
                                            terminalGroup = me._RENDERER.drawTerminal(clonedElement, OG.Constants.TERMINAL_TYPE.IN);
                                            childTerminals = terminalGroup.terminal.childNodes;
                                            toTerminal = childTerminals[0];
                                            for (i = 0; i < childTerminals.length; i++) {
                                                if (childTerminals[i].terminal && childTerminals[i].terminal.direction.toLowerCase() === "c") {
                                                    toTerminal = childTerminals[i];
                                                    break;
                                                }
                                            }
                                        }

                                        isSelf = element && toShape && element.id === toShape.id;

                                        if (toTerminal && (OG.Util.isElement(toTerminal) || !me._isConnectRequired(element.shape))
                                            && (!isSelf || me._isSelfConnectable(element.shape))) {
                                            // connect
                                            edge = me._RENDERER.connect(fromTerminal, toTerminal, edge);
                                            if (edge) {
                                                guide = me._RENDERER.drawGuide(edge);

                                                if (edge && guide) {
                                                    // enable event
                                                    me.setClickSelectable(edge, me._isSelectable(edge.shape));
                                                    me.setMovable(edge, me._isMovable(edge.shape));
                                                    me.setConnectGuide(edge, me._isConnectable(edge.shape));
                                                    me.setResizable(edge, guide, me._isResizable(edge.shape));
                                                    if (me._isLabelEditable(edge.shape)) {
                                                        me.enableEditLabel(edge);
                                                    }

                                                    me._RENDERER.toFront(guide.group);
                                                }
                                            }
                                        } else {
                                            me._RENDERER.removeShape(edge);
                                        }

                                        // clear
                                        $(root).removeData("edge");
                                        $(root).removeData("from_terminal");
                                        $(root).removeData("edge_terminal");
                                        $(root).removeData("dragged_guide");
                                        if (toShape) {
                                            me._RENDERER.remove(toShape.id + OG.Constants.DROP_OVER_BBOX_SUFFIX);
                                        }
                                    }
                                });
                            }
                        });
                    } else {
                        me._RENDERER.removeTerminal(element);
                    }
                }
            },
            mouseout: function (event) {
                if ($(element).attr("_shape") !== OG.Constants.SHAPE_TYPE.EDGE && $(root).data("edge")) {
                    me._RENDERER.remove(element.id + OG.Constants.DROP_OVER_BBOX_SUFFIX);
                    $(root).removeData("edge_terminal");
                }
            }
        });
    },

    /**
     * 주어진 Shape Element 를 Drag & Drop 으로 그룹핑 가능하도록 한다.
     *
     * @param {Element} element Shape Element
     */
    enableDragAndDropGroup: function (element) {
        var me = this, root = me._RENDERER.getRootGroup(), isSelf;
        if (element && $(element).attr("_shape") === OG.Constants.SHAPE_TYPE.GROUP) {
            $(element).bind({
                mouseover: function () {
                    if (element.shape.isCollapsed === false) {
                        // Drag & Drop 하여 그룹핑하는 경우 가이드 표시
                        if ($(root).data("bBoxArray")) {
                            isSelf = false;
                            $.each($(root).data("bBoxArray"), function (idx, item) {
                                if (element.id === item.id) {
                                    isSelf = true;
                                }
                            });

                            if (!isSelf) {
                                $(root).data("groupTarget", element);
                                me._RENDERER.drawDropOverGuide(element);
                            }
                        }
                    }
                },
                mouseout: function (event) {
                    // Drag & Drop 하여 그룹핑하는 경우 가이드 제거
                    me._RENDERER.remove(element.id + OG.Constants.DROP_OVER_BBOX_SUFFIX);
                    $(root).removeData("groupTarget");
                }
            });
        }
    },

    /**
     * 주어진 Shape Element 를 Collapse/Expand 가능하도록 한다.
     *
     * @param {Element} element Shape Element
     */
    enableCollapse: function (element) {
        var me = this, collapseObj, clickHandle;

        clickHandle = function (_element, _collapsedOjb) {
            if (_collapsedOjb && _collapsedOjb.bBox && _collapsedOjb.collapse) {
                $(_collapsedOjb.collapse).bind("click", function (event) {
                    if (_element.shape.isCollapsed === true) {
                        me._RENDERER.expand(_element);
                        _collapsedOjb = me._RENDERER.drawCollapseGuide(_element);
                        clickHandle(_element, _collapsedOjb);
                    } else {
                        me._RENDERER.collapse(_element);
                        _collapsedOjb = me._RENDERER.drawCollapseGuide(_element);
                        clickHandle(_element, _collapsedOjb);
                    }
                });

                $(_collapsedOjb.bBox).bind("mouseout", function (event) {
                    me._RENDERER.remove(_element.id + OG.Constants.COLLAPSE_BBOX);
                    me._RENDERER.remove(_element.id + OG.Constants.COLLAPSE_SUFFIX);
                });
            }
        };

        if (element && $(element).attr("_shape") === OG.Constants.SHAPE_TYPE.GROUP) {
            $(element).bind({
                mouseover: function () {
                    collapseObj = me._RENDERER.drawCollapseGuide(this);
                    if (collapseObj && collapseObj.bBox && collapseObj.collapse) {
                        clickHandle(element, collapseObj);
                    }
                }
            });
        }
    },

    /**
     * Shape 엘리먼트의 이동 가능여부를 설정한다.
     *
     * @param {Element} element Shape 엘리먼트
     * @param {Boolean} isMovable 가능여부
     */
    setMovable: function (element, isMovable) {
        var me = this, root = me._RENDERER.getRootGroup();

        if (!element) {
            return;
        }

        //엣지는 무빙하지 않는다.
        if ($(element).attr("_shape") === OG.Constants.SHAPE_TYPE.EDGE) {
            return;
        }

        if (isMovable === true) {
            $(element).draggable({
                start: function (event) {

                    var eventOffset = me._getOffset(event), guide;

                    // 선택되지 않은 Shape 을 drag 시 다른 모든 Shape 은 deselect 처리
                    if (me._RENDERER.getElementById(element.id + OG.Constants.GUIDE_SUFFIX.GUIDE) === null) {
                        $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "][_selected=true]").each(function (index, item) {
                            if (OG.Util.isElement(item) && item.id) {
                                me._RENDERER.removeGuide(item);
                            }
                        });
                        me._RENDERER.removeAllTerminal();
                    }

                    // redraw guide
                    me._RENDERER.removeGuide(element);
                    guide = me._RENDERER.drawGuide(element);

                    $(this).data("start", {x: eventOffset.x, y: eventOffset.y});
                    $(this).data("offset", {
                        x: eventOffset.x - me._num(me._RENDERER.getAttr(guide.bBox, "x")),
                        y: eventOffset.y - me._num(me._RENDERER.getAttr(guide.bBox, "y"))
                    });

                    $(root).data("bBoxArray", me._getMoveTargets());
                    me._RENDERER.removeRubberBand(me._RENDERER.getRootElement());
                    me._RENDERER.removeAllTerminal();
                },
                drag: function (event) {
                    var eventOffset = me._getOffset(event),
                        start = $(this).data("start"),
                        bBoxArray = $(root).data("bBoxArray"),
                        dx = me._grid(eventOffset.x - start.x),
                        dy = me._grid(eventOffset.y - start.y);

                    // Canvas 영역을 벗어나서 드래그되는 경우 Canvas 확장
                    me._autoExtend(eventOffset.x, eventOffset.y);

                    $(this).css({"position": "", "left": "", "top": ""});
                    $.each(bBoxArray, function (k, item) {
                        me._RENDERER.setAttr(item.box, {transform: "t" + dx + "," + dy});
                    });
                    me._RENDERER.removeAllTerminal();
                },
                stop: function (event) {
                    var eventOffset = me._getOffset(event),
                        start = $(this).data("start"),
                        bBoxArray = $(root).data("bBoxArray"),
                        dx = me._grid(eventOffset.x - start.x),
                        dy = me._grid(eventOffset.y - start.y),
                        groupTarget = $(root).data("groupTarget"),
                        eleArray,
                        guide;

                    // 이동 처리
                    $(this).css({"position": "", "left": "", "top": ""});
                    eleArray = me._moveElements(bBoxArray, dx, dy);

                    // group target 이 있는 경우 grouping 처리
                    if (groupTarget && OG.Util.isElement(groupTarget)) {
                        // grouping
                        me._RENDERER.addToGroup(groupTarget, eleArray);

                        // guide
                        $.each(eleArray, function (k, item) {
                            me._RENDERER.removeGuide(item);
                        });
                        guide = me._RENDERER.drawGuide(groupTarget);
                        // enable event
                        me.setResizable(groupTarget, guide, me._isResizable(groupTarget.shape));
                        me._RENDERER.toFront(guide.group);

                        me._RENDERER.remove(groupTarget.id + OG.Constants.DROP_OVER_BBOX_SUFFIX);
                        $(root).removeData("groupTarget");
                    } else {
                        // ungrouping
                        me._RENDERER.addToGroup(root, eleArray);

                        // guide
                        $.each(eleArray, function (k, item) {
                            me._RENDERER.removeGuide(item);
                            guide = me._RENDERER.drawGuide(item);
                            // enable event
                            me.setResizable(item, guide, me._isResizable(item.shape));
                            me._RENDERER.toFront(guide.group);
                        });
                    }

                    $(root).removeData("bBoxArray");
                }
            });
            me._RENDERER.setAttr(element, {cursor: 'move'});
            OG.Util.apply(element.shape.geom.style.map, {cursor: 'move'});
        } else {
            $(element).draggable("destroy");
            me._RENDERER.setAttr(element, {cursor: me._isSelectable(element.shape) ? 'pointer' : me._CONFIG.DEFAULT_STYLE.SHAPE.cursor});
            OG.Util.apply(element.shape.geom.style.map, {cursor: me._isSelectable(element.shape) ? 'pointer' : me._CONFIG.DEFAULT_STYLE.SHAPE.cursor});
        }
    },

    /**
     * Shape 엘리먼트의 리사이즈 가능여부를 설정한다.
     *
     * @param {Element} element Shape 엘리먼트
     * @param {Object} guide JSON 포맷 가이드 정보
     * @param {Boolean} isResizable 가능여부
     */
    setResizable: function (element, guide, isResizable) {
        var me = this, root = me._RENDERER.getRootGroup();

        if (!element || !guide) {
            return;
        }

        if (isResizable === true) {
            if ($(element).attr("_shape") === OG.Constants.SHAPE_TYPE.EDGE) {
                // resize handle
                $(guide.from).draggable({
                    start: function (event) {
                        var isBezier, vertices, _style = {},
                            toTerminalId = $(element).attr("_to"), toShape, toTerminal, edge;

                        _style = OG.Util.apply(_style, me._CONFIG.DEFAULT_STYLE.EDGE_SHADOW, element.shape.geom.style.map);
                        isBezier = _style["edge-type"].toLowerCase() === OG.Constants.EDGE_TYPE.BEZIER;

                        vertices = isBezier ? element.shape.geom.getControlPoints() : element.shape.geom.getVertices();
                        edge = me._RENDERER.drawEdge(isBezier ? new OG.BezierCurve(vertices) : new OG.PolyLine(vertices), _style);

                        toTerminal = [vertices[vertices.length - 1].x, vertices[vertices.length - 1].y];

                        if (toTerminalId) {
                            toShape = me._getShapeFromTerminal(toTerminalId);
                            me._RENDERER.drawTerminal(toShape);
                            toTerminal = me._RENDERER.getElementById(toTerminalId);
                        }

                        $(root).data("to_terminal", toTerminal);
                        $(root).data("edge", edge);
                        $(root).data("dragged_guide", "from");

                        me._RENDERER.removeRubberBand(me._RENDERER.getRootElement());
                        $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "][_selected=true]").each(function (n, selectedItem) {
                            if (selectedItem.id && $(selectedItem).attr("_shape") !== OG.Constants.SHAPE_TYPE.EDGE) {
                                me._RENDERER.removeGuide(selectedItem);
                            }
                        });
                    },
                    drag: function (event) {
                        var eventOffset = me._getOffset(event),
                            edge = $(root).data("edge"),
                            fromTerminal = $(root).data("edge_terminal"),
                            toTerminal = $(root).data("to_terminal"),
                            fromXY = fromTerminal ?
                                [fromTerminal.terminal.position.x, fromTerminal.terminal.position.y] : [eventOffset.x, eventOffset.y],
                            toXY = OG.Util.isElement(toTerminal) ?
                                [toTerminal.terminal.position.x, toTerminal.terminal.position.y] : toTerminal,
                            fromDrct = fromTerminal ? fromTerminal.terminal.direction.toLowerCase() : "c",
                            toDrct = OG.Util.isElement(toTerminal) ? toTerminal.terminal.direction.toLowerCase() : "c",
                            fromShape = fromTerminal ? me._getShapeFromTerminal(fromTerminal) : null,
                            toShape = OG.Util.isElement(toTerminal) ? me._getShapeFromTerminal(toTerminal) : null,
                            orgFromXY, orgToXY, intersectionInfo, isSelf;

                        $(this).css({"position": "", "left": "", "top": ""});

                        // backup edge-direction
                        orgFromXY = fromXY;
                        orgToXY = toXY;

                        // direction 이 c 인 경우에 대한 처리(센터 연결)
                        if (fromShape && fromDrct === "c") {
                            intersectionInfo = me._RENDERER.intersectionEdge(
                                edge.geom.style.get("edge-type"), fromShape, [orgFromXY[0], orgFromXY[1]], [orgToXY[0], orgToXY[1]], true
                            );
                            fromXY = intersectionInfo.position;
                            fromDrct = intersectionInfo.direction;
                        }
                        if (toShape && toDrct === "c") {
                            intersectionInfo = me._RENDERER.intersectionEdge(
                                edge.geom.style.get("edge-type"), toShape, [orgFromXY[0], orgFromXY[1]], [orgToXY[0], orgToXY[1]], false
                            );
                            toXY = intersectionInfo.position;
                            toDrct = intersectionInfo.direction;
                        }

                        isSelf = fromShape && toShape && fromShape.id === toShape.id;
                        if (isSelf) {
                            fromXY = toXY = fromShape.shape.geom.getBoundary().getRightCenter();
                        }

                        if (!isSelf || me._isSelfConnectable(fromShape.shape)) {
                            me._RENDERER.drawEdge(new OG.Line(fromXY, toXY),
                                OG.Util.apply(edge.geom.style.map, {"edge-direction": fromDrct + " " + toDrct}), edge.id, isSelf);
                        }
                    },
                    stop: function (event) {
                        var eventOffset = me._getOffset(event),
                            fromTerminal = $(root).data("edge_terminal") || [eventOffset.x, eventOffset.y],
                            toTerminal = $(root).data("to_terminal"),
                            fromShape = OG.Util.isElement(fromTerminal) ? me._getShapeFromTerminal(fromTerminal) : null,
                            toShape = OG.Util.isElement(toTerminal) ? me._getShapeFromTerminal(toTerminal) : null,
                            edge = $(root).data("edge"), isSelf;

                        $(this).css({"position": "absolute", "left": "0px", "top": "0px"});

                        // clear
                        $(root).removeData("to_terminal");
                        $(root).removeData("edge");
                        $(root).removeData("edge_terminal");
                        $(root).removeData("dragged_guide");
                        me._RENDERER.remove(edge);
                        me._RENDERER.removeGuide(element);
                        if (fromShape) {
                            me._RENDERER.remove(fromShape.id + OG.Constants.DROP_OVER_BBOX_SUFFIX);
                        }

                        isSelf = fromShape && toShape && fromShape.id === toShape.id;

                        if (!isSelf || me._isSelfConnectable(fromShape.shape)) {
                            // draw
                            element = me._RENDERER.connect(fromTerminal, toTerminal, element, element.shape.geom.style);
                            if (element) {
                                guide = me._RENDERER.drawGuide(element);
                                if (element && guide) {
                                    me.setResizable(element, guide, true);
                                    me._RENDERER.toFront(guide.group);
                                }
                            }
                        }
                    }
                });

                $(guide.to).draggable({
                    start: function (event) {
                        var isBezier, vertices, _style = {},
                            fromTerminalId = $(element).attr("_from"), fromShape, fromTerminal, edge;

                        _style = OG.Util.apply(_style, me._CONFIG.DEFAULT_STYLE.EDGE_SHADOW, element.shape.geom.style.map);
                        isBezier = _style["edge-type"].toLowerCase() === OG.Constants.EDGE_TYPE.BEZIER;

                        vertices = isBezier ? element.shape.geom.getControlPoints() : element.shape.geom.getVertices();
                        edge = me._RENDERER.drawEdge(isBezier ? new OG.BezierCurve(vertices) : new OG.PolyLine(vertices), _style);

                        fromTerminal = [vertices[0].x, vertices[0].y];

                        if (fromTerminalId) {
                            fromShape = me._getShapeFromTerminal(fromTerminalId);
                            me._RENDERER.drawTerminal(fromShape);
                            fromTerminal = me._RENDERER.getElementById(fromTerminalId);
                        }

                        $(root).data("from_terminal", fromTerminal);
                        $(root).data("edge", edge);
                        $(root).data("dragged_guide", "to");

                        me._RENDERER.removeRubberBand(me._RENDERER.getRootElement());
                        $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "][_selected=true]").each(function (n, selectedItem) {
                            if (selectedItem.id && $(selectedItem).attr("_shape") !== OG.Constants.SHAPE_TYPE.EDGE) {
                                me._RENDERER.removeGuide(selectedItem);
                            }
                        });
                    },
                    drag: function (event) {
                        var eventOffset = me._getOffset(event),
                            edge = $(root).data("edge"),
                            fromTerminal = $(root).data("from_terminal"),
                            toTerminal = $(root).data("edge_terminal"),
                            fromXY = OG.Util.isElement(fromTerminal) ?
                                [fromTerminal.terminal.position.x, fromTerminal.terminal.position.y] : fromTerminal,
                            toXY = toTerminal ?
                                [toTerminal.terminal.position.x, toTerminal.terminal.position.y] : [eventOffset.x, eventOffset.y],
                            fromDrct = OG.Util.isElement(fromTerminal) ? fromTerminal.terminal.direction.toLowerCase() : "c",
                            toDrct = toTerminal ? toTerminal.terminal.direction.toLowerCase() : "c",
                            fromShape = OG.Util.isElement(fromTerminal) ? me._getShapeFromTerminal(fromTerminal) : null,
                            toShape = toTerminal ? me._getShapeFromTerminal(toTerminal) : null,
                            orgFromXY, orgToXY, intersectionInfo, isSelf;

                        $(this).css({"position": "", "left": "", "top": ""});

                        // backup edge-direction
                        orgFromXY = fromXY;
                        orgToXY = toXY;

                        // direction 이 c 인 경우에 대한 처리(센터 연결)
                        if (fromShape && fromDrct === "c") {
                            intersectionInfo = me._RENDERER.intersectionEdge(
                                edge.geom.style.get("edge-type"), fromShape, [orgFromXY[0], orgFromXY[1]], [orgToXY[0], orgToXY[1]], true
                            );
                            fromXY = intersectionInfo.position;
                            fromDrct = intersectionInfo.direction;
                        }
                        if (toShape && toDrct === "c") {
                            intersectionInfo = me._RENDERER.intersectionEdge(
                                edge.geom.style.get("edge-type"), toShape, [orgFromXY[0], orgFromXY[1]], [orgToXY[0], orgToXY[1]], false
                            );
                            toXY = intersectionInfo.position;
                            toDrct = intersectionInfo.direction;
                        }

                        isSelf = (fromShape !== null) && (toShape !== null) && fromShape.id === toShape.id;
                        if (isSelf) {
                            fromXY = toXY = toShape.shape.geom.getBoundary().getRightCenter();
                        }

                        if (!isSelf || me._isSelfConnectable(toShape.shape)) {
                            me._RENDERER.drawEdge(new OG.Line(fromXY, toXY),
                                OG.Util.apply(edge.geom.style.map, {"edge-direction": fromDrct + " " + toDrct}), edge.id, isSelf);
                        }
                    },
                    stop: function (event) {
                        var eventOffset = me._getOffset(event),
                            fromTerminal = $(root).data("from_terminal"),
                            toTerminal = $(root).data("edge_terminal") || [eventOffset.x, eventOffset.y],
                            fromShape = OG.Util.isElement(fromTerminal) ? me._getShapeFromTerminal(fromTerminal) : null,
                            toShape = OG.Util.isElement(toTerminal) ? me._getShapeFromTerminal(toTerminal) : null,
                            edge = $(root).data("edge"), isSelf;

                        $(this).css({"position": "absolute", "left": "0px", "top": "0px"});

                        // clear
                        $(root).removeData("from_terminal");
                        $(root).removeData("edge");
                        $(root).removeData("edge_terminal");
                        $(root).removeData("dragged_guide");
                        me._RENDERER.remove(edge);
                        me._RENDERER.removeGuide(element);
                        if (toShape) {
                            me._RENDERER.remove(toShape.id + OG.Constants.DROP_OVER_BBOX_SUFFIX);
                        }

                        isSelf = fromShape && toShape && fromShape.id === toShape.id;

                        if (!isSelf || me._isSelfConnectable(toShape.shape)) {
                            // draw
                            element = me._RENDERER.connect(fromTerminal, toTerminal, element, element.shape.geom.style);
                            if (element) {
                                guide = me._RENDERER.drawGuide(element);
                                if (guide) {
                                    me.setResizable(element, guide, true);
                                    me._RENDERER.toFront(guide.group);
                                }
                            }
                        }
                    }
                });

                $.each(guide.controls, function (idx, item) {
                    $(item).draggable({
                        start: function (event) {
                            var eventOffset = me._getOffset(event);
                            $(this).data("start", {x: eventOffset.x, y: eventOffset.y});
                            $(this).data("offset", {
                                x: eventOffset.x - me._num(me._RENDERER.getAttr(item, "x")),
                                y: eventOffset.y - me._num(me._RENDERER.getAttr(item, "y"))
                            });
                            me._RENDERER.remove(guide.bBox);
                            me._RENDERER.removeRubberBand(me._RENDERER.getRootElement());
                        },
                        drag: function (event) {
                            var eventOffset = me._getOffset(event),
                                start = $(this).data("start"),
                                offset = $(this).data("offset"),
                                newX = eventOffset.x - offset.x,
                                newY = eventOffset.y - offset.y,
                                vertices = element.shape.geom.getVertices(),
                                isHorizontal = item.id.indexOf(OG.Constants.GUIDE_SUFFIX.CTL_H) >= 0,
                                num = isHorizontal ?
                                    parseInt(item.id.replace(element.id + OG.Constants.GUIDE_SUFFIX.CTL_H, ""), 10) :
                                    parseInt(item.id.replace(element.id + OG.Constants.GUIDE_SUFFIX.CTL_V, ""), 10);

                            $(this).css({"position": "", "left": "", "top": ""});

                            if (isHorizontal) {
                                vertices[num].x = newX;
                                vertices[num + 1].x = newX;
                            } else {
                                vertices[num].y = newY;
                                vertices[num + 1].y = newY;
                            }

                            element = me._RENDERER.drawEdge(new OG.PolyLine(vertices), element.shape.geom.style, element.id);
                            me._RENDERER.drawGuide(element);

                            me._RENDERER.removeAllTerminal();

                            // Draw Label
                            me._RENDERER.drawLabel(element);
                            me._RENDERER.drawEdgeLabel(element, null, 'FROM');
                            me._RENDERER.drawEdgeLabel(element, null, 'TO');
                        },
                        stop: function (event) {
                            var eventOffset = me._getOffset(event),
                                start = $(this).data("start"),
                                offset = $(this).data("offset"),
                                newX = eventOffset.x - offset.x,
                                newY = eventOffset.y - offset.y,
                                vertices = element.shape.geom.getVertices(),
                                isHorizontal = item.id.indexOf(OG.Constants.GUIDE_SUFFIX.CTL_H) >= 0,
                                num = isHorizontal ?
                                    parseInt(item.id.replace(element.id + OG.Constants.GUIDE_SUFFIX.CTL_H, ""), 10) :
                                    parseInt(item.id.replace(element.id + OG.Constants.GUIDE_SUFFIX.CTL_V, ""), 10);

                            $(this).css({"position": "absolute", "left": "0px", "top": "0px"});

                            if (isHorizontal) {
                                vertices[num].x = newX;
                                vertices[num + 1].x = newX;
                            } else {
                                vertices[num].y = newY;
                                vertices[num + 1].y = newY;
                            }

                            element = me._RENDERER.drawEdge(new OG.PolyLine(vertices), element.shape.geom.style, element.id);
                            me._RENDERER.drawGuide(element);

                            // Draw Label
                            me._RENDERER.drawLabel(element);
                            me._RENDERER.drawEdgeLabel(element, null, 'FROM');
                            me._RENDERER.drawEdgeLabel(element, null, 'TO');
                        }
                    });
                });
            } else {
                // resize handle
                $(guide.rc).draggable({
                    start: function (event) {
                        var eventOffset = me._getOffset(event);
                        $(this).data("start", {x: eventOffset.x, y: eventOffset.y});
                        $(this).data("offset", {
                            x: eventOffset.x - me._num(me._RENDERER.getAttr(guide.rc, "x")),
                            y: eventOffset.y - me._num(me._RENDERER.getAttr(guide.rc, "y"))
                        });
                        me._RENDERER.removeRubberBand(me._RENDERER.getRootElement());
                    },
                    drag: function (event) {
                        var eventOffset = me._getOffset(event),
                            start = $(this).data("start"),
                            offset = $(this).data("offset"),
                            newX = me._grid(eventOffset.x - offset.x),
                            newWidth = me._grid(newX - me._num(me._RENDERER.getAttr(guide.lc, "x")));
                        $(this).css({"position": "", "left": "", "top": ""});
                        if (newWidth >= me._CONFIG.GUIDE_MIN_SIZE) {
                            me._RENDERER.setAttr(guide.rc, {x: newX});
                            me._RENDERER.setAttr(guide.ur, {x: newX});
                            me._RENDERER.setAttr(guide.lr, {x: newX});
                            me._RENDERER.setAttr(guide.uc, {x: OG.Util.round((me._num(me._RENDERER.getAttr(guide.lc, "x")) + newX) / 2)});
                            me._RENDERER.setAttr(guide.lwc, {x: OG.Util.round((me._num(me._RENDERER.getAttr(guide.lc, "x")) + newX) / 2)});
                            me._RENDERER.setAttr(guide.bBox, {width: newWidth});
                        }
                        me._RENDERER.removeAllTerminal();
                    },
                    stop: function (event) {
                        var eventOffset = me._getOffset(event),
                            start = $(this).data("start"),
                            dx = eventOffset.x - start.x;
                        $(this).css({"position": "absolute", "left": "0px", "top": "0px"});
                        if (element && element.shape.geom) {
                            // resizing
                            if (element.shape.geom.getBoundary().getWidth() + dx < me._CONFIG.GUIDE_MIN_SIZE) {
                                dx = me._CONFIG.GUIDE_MIN_SIZE - element.shape.geom.getBoundary().getWidth();
                            }
                            me._RENDERER.resize(element, [0, 0, 0, me._grid(dx)]);
                            me._RENDERER.drawGuide(element);
                        }
                    }
                });

                $(guide.lwc).draggable({
                    start: function (event) {
                        var eventOffset = me._getOffset(event);
                        $(this).data("start", {x: eventOffset.x, y: eventOffset.y});
                        $(this).data("offset", {
                            x: eventOffset.x - me._num(me._RENDERER.getAttr(guide.lwc, "x")),
                            y: eventOffset.y - me._num(me._RENDERER.getAttr(guide.lwc, "y"))
                        });
                        me._RENDERER.removeRubberBand(me._RENDERER.getRootElement());
                    },
                    drag: function (event) {
                        var eventOffset = me._getOffset(event),
                            start = $(this).data("start"),
                            offset = $(this).data("offset"),
                            newY = me._grid(eventOffset.y - offset.y),
                            newHeight = me._grid(newY - me._num(me._RENDERER.getAttr(guide.uc, "y")));
                        $(this).css({"position": "", "left": "", "top": ""});
                        if (newHeight >= me._CONFIG.GUIDE_MIN_SIZE) {
                            me._RENDERER.setAttr(guide.lwc, {y: newY});
                            me._RENDERER.setAttr(guide.ll, {y: newY});
                            me._RENDERER.setAttr(guide.lr, {y: newY});
                            me._RENDERER.setAttr(guide.lc, {y: OG.Util.round((me._num(me._RENDERER.getAttr(guide.uc, "y")) + newY) / 2)});
                            me._RENDERER.setAttr(guide.rc, {y: OG.Util.round((me._num(me._RENDERER.getAttr(guide.uc, "y")) + newY) / 2)});
                            me._RENDERER.setAttr(guide.bBox, {height: newHeight});
                        }
                        me._RENDERER.removeAllTerminal();
                    },
                    stop: function (event) {
                        var eventOffset = me._getOffset(event),
                            start = $(this).data("start"),
                            dy = eventOffset.y - start.y;
                        $(this).css({"position": "absolute", "left": "0px", "top": "0px"});
                        if (element && element.shape.geom) {
                            // resizing
                            if (element.shape.geom.getBoundary().getHeight() + dy < me._CONFIG.GUIDE_MIN_SIZE) {
                                dy = me._CONFIG.GUIDE_MIN_SIZE - element.shape.geom.getBoundary().getHeight();
                            }
                            me._RENDERER.resize(element, [0, me._grid(dy), 0, 0]);
                            me._RENDERER.drawGuide(element);
                        }
                    }
                });

                $(guide.lr).draggable({
                    start: function (event) {
                        var eventOffset = me._getOffset(event);
                        $(this).data("start", {x: eventOffset.x, y: eventOffset.y});
                        $(this).data("offset", {
                            x: eventOffset.x - me._num(me._RENDERER.getAttr(guide.lr, "x")),
                            y: eventOffset.y - me._num(me._RENDERER.getAttr(guide.lr, "y"))
                        });
                        me._RENDERER.removeRubberBand(me._RENDERER.getRootElement());
                    },
                    drag: function (event) {
                        var eventOffset = me._getOffset(event),
                            start = $(this).data("start"),
                            offset = $(this).data("offset"),
                            newX = me._grid(eventOffset.x - offset.x),
                            newWidth = me._grid(newX - me._num(me._RENDERER.getAttr(guide.lc, "x"))),
                            newY = me._grid(eventOffset.y - offset.y),
                            newHeight = me._grid(newY - me._num(me._RENDERER.getAttr(guide.uc, "y")));
                        $(this).css({"position": "", "left": "", "top": ""});
                        if (newWidth >= me._CONFIG.GUIDE_MIN_SIZE) {
                            me._RENDERER.setAttr(guide.rc, {x: newX});
                            me._RENDERER.setAttr(guide.ur, {x: newX});
                            me._RENDERER.setAttr(guide.lr, {x: newX});
                            me._RENDERER.setAttr(guide.uc, {x: OG.Util.round((me._num(me._RENDERER.getAttr(guide.lc, "x")) + newX) / 2)});
                            me._RENDERER.setAttr(guide.lwc, {x: OG.Util.round((me._num(me._RENDERER.getAttr(guide.lc, "x")) + newX) / 2)});
                            me._RENDERER.setAttr(guide.bBox, {width: newWidth});
                        }
                        if (newHeight >= me._CONFIG.GUIDE_MIN_SIZE) {
                            me._RENDERER.setAttr(guide.lwc, {y: newY});
                            me._RENDERER.setAttr(guide.ll, {y: newY});
                            me._RENDERER.setAttr(guide.lr, {y: newY});
                            me._RENDERER.setAttr(guide.lc, {y: OG.Util.round((me._num(me._RENDERER.getAttr(guide.uc, "y")) + newY) / 2)});
                            me._RENDERER.setAttr(guide.rc, {y: OG.Util.round((me._num(me._RENDERER.getAttr(guide.uc, "y")) + newY) / 2)});
                            me._RENDERER.setAttr(guide.bBox, {height: newHeight});
                        }
                        me._RENDERER.removeAllTerminal();
                    },
                    stop: function (event) {
                        var eventOffset = me._getOffset(event),
                            start = $(this).data("start"),
                            dx = eventOffset.x - start.x,
                            dy = eventOffset.y - start.y;
                        $(this).css({"position": "absolute", "left": "0px", "top": "0px"});
                        if (element && element.shape.geom) {
                            // resizing
                            if (element.shape.geom.getBoundary().getWidth() + dx < me._CONFIG.GUIDE_MIN_SIZE) {
                                dx = me._CONFIG.GUIDE_MIN_SIZE - element.shape.geom.getBoundary().getWidth();
                            }
                            if (element.shape.geom.getBoundary().getHeight() + dy < me._CONFIG.GUIDE_MIN_SIZE) {
                                dy = me._CONFIG.GUIDE_MIN_SIZE - element.shape.geom.getBoundary().getHeight();
                            }
                            me._RENDERER.resize(element, [0, me._grid(dy), 0, me._grid(dx)]);
                            me._RENDERER.drawGuide(element);
                        }
                        me._RENDERER.removeAllTerminal();
                    }
                });

                $(guide.lc).draggable({
                    start: function (event) {
                        var eventOffset = me._getOffset(event);
                        $(this).data("start", {x: eventOffset.x, y: eventOffset.y});
                        $(this).data("offset", {
                            x: eventOffset.x - me._num(me._RENDERER.getAttr(guide.lc, "x")),
                            y: eventOffset.y - me._num(me._RENDERER.getAttr(guide.lc, "y"))
                        });
                        me._RENDERER.removeRubberBand(me._RENDERER.getRootElement());
                    },
                    drag: function (event) {
                        var eventOffset = me._getOffset(event),
                            start = $(this).data("start"),
                            offset = $(this).data("offset"),
                            newX = me._grid(eventOffset.x - offset.x),
                            newWidth = me._grid(me._num(me._RENDERER.getAttr(guide.rc, "x")) - newX);
                        $(this).css({"position": "", "left": "", "top": ""});
                        if (newWidth >= me._CONFIG.GUIDE_MIN_SIZE) {
                            me._RENDERER.setAttr(guide.lc, {x: newX});
                            me._RENDERER.setAttr(guide.ul, {x: newX});
                            me._RENDERER.setAttr(guide.ll, {x: newX});
                            me._RENDERER.setAttr(guide.uc, {x: OG.Util.round((me._num(me._RENDERER.getAttr(guide.rc, "x")) + newX) / 2)});
                            me._RENDERER.setAttr(guide.lwc, {x: OG.Util.round((me._num(me._RENDERER.getAttr(guide.rc, "x")) + newX) / 2)});
                            me._RENDERER.setAttr(guide.bBox, {
                                x: OG.Util.round(newX + me._num(me._RENDERER.getAttr(guide.lc, "width")) / 2),
                                width: newWidth
                            });
                        }
                        me._RENDERER.removeAllTerminal();
                    },
                    stop: function (event) {
                        var eventOffset = me._getOffset(event),
                            start = $(this).data("start"),
                            dx = start.x - eventOffset.x;
                        $(this).css({"position": "absolute", "left": "0px", "top": "0px"});
                        if (element && element.shape.geom) {
                            // resizing
                            if (element.shape.geom.getBoundary().getWidth() + dx < me._CONFIG.GUIDE_MIN_SIZE) {
                                dx = me._CONFIG.GUIDE_MIN_SIZE - element.shape.geom.getBoundary().getWidth();
                            }
                            me._RENDERER.resize(element, [0, 0, me._grid(dx), 0]);
                            me._RENDERER.drawGuide(element);
                        }
                    }
                });

                $(guide.ll).draggable({
                    start: function (event) {
                        var eventOffset = me._getOffset(event);
                        $(this).data("start", {x: eventOffset.x, y: eventOffset.y});
                        $(this).data("offset", {
                            x: eventOffset.x - me._num(me._RENDERER.getAttr(guide.ll, "x")),
                            y: eventOffset.y - me._num(me._RENDERER.getAttr(guide.ll, "y"))
                        });

                        me._RENDERER.removeRubberBand(me._RENDERER.getRootElement());
                    },
                    drag: function (event) {
                        var eventOffset = me._getOffset(event),
                            start = $(this).data("start"),
                            offset = $(this).data("offset"),
                            newX = me._grid(eventOffset.x - offset.x),
                            newY = me._grid(eventOffset.y - offset.y),
                            newWidth = me._grid(me._num(me._RENDERER.getAttr(guide.rc, "x")) - newX),
                            newHeight = me._grid(newY - me._num(me._RENDERER.getAttr(guide.uc, "y")));
                        $(this).css({"position": "", "left": "", "top": ""});
                        if (newWidth >= me._CONFIG.GUIDE_MIN_SIZE) {
                            me._RENDERER.setAttr(guide.lc, {x: newX});
                            me._RENDERER.setAttr(guide.ul, {x: newX});
                            me._RENDERER.setAttr(guide.ll, {x: newX});
                            me._RENDERER.setAttr(guide.uc, {x: OG.Util.round((me._num(me._RENDERER.getAttr(guide.rc, "x")) + newX) / 2)});
                            me._RENDERER.setAttr(guide.lwc, {x: OG.Util.round((me._num(me._RENDERER.getAttr(guide.rc, "x")) + newX) / 2)});
                            me._RENDERER.setAttr(guide.bBox, {
                                x: OG.Util.round(newX + me._num(me._RENDERER.getAttr(guide.lc, "width")) / 2),
                                width: newWidth
                            });
                        }
                        if (newHeight >= me._CONFIG.GUIDE_MIN_SIZE) {
                            me._RENDERER.setAttr(guide.lwc, {y: newY});
                            me._RENDERER.setAttr(guide.ll, {y: newY});
                            me._RENDERER.setAttr(guide.lr, {y: newY});
                            me._RENDERER.setAttr(guide.lc, {y: OG.Util.round((me._num(me._RENDERER.getAttr(guide.uc, "y")) + newY) / 2)});
                            me._RENDERER.setAttr(guide.rc, {y: OG.Util.round((me._num(me._RENDERER.getAttr(guide.uc, "y")) + newY) / 2)});
                            me._RENDERER.setAttr(guide.bBox, {height: newHeight});
                        }
                        me._RENDERER.removeAllTerminal();
                    },
                    stop: function (event) {
                        var eventOffset = me._getOffset(event),
                            start = $(this).data("start"),
                            dx = start.x - eventOffset.x,
                            dy = eventOffset.y - start.y;
                        $(this).css({"position": "absolute", "left": "0px", "top": "0px"});
                        if (element && element.shape.geom) {
                            // resizing
                            if (element.shape.geom.getBoundary().getWidth() + dx < me._CONFIG.GUIDE_MIN_SIZE) {
                                dx = me._CONFIG.GUIDE_MIN_SIZE - element.shape.geom.getBoundary().getWidth();
                            }
                            if (element.shape.geom.getBoundary().getHeight() + dy < me._CONFIG.GUIDE_MIN_SIZE) {
                                dy = me._CONFIG.GUIDE_MIN_SIZE - element.shape.geom.getBoundary().getHeight();
                            }
                            me._RENDERER.resize(element, [0, me._grid(dy), me._grid(dx), 0]);
                            me._RENDERER.drawGuide(element);
                        }
                    }
                });

                $(guide.uc).draggable({
                    start: function (event) {
                        var eventOffset = me._getOffset(event);
                        $(this).data("start", {x: eventOffset.x, y: eventOffset.y});
                        $(this).data("offset", {
                            x: eventOffset.x - me._num(me._RENDERER.getAttr(guide.uc, "x")),
                            y: eventOffset.y - me._num(me._RENDERER.getAttr(guide.uc, "y"))
                        });

                        me._RENDERER.removeRubberBand(me._RENDERER.getRootElement());
                    },
                    drag: function (event) {
                        var eventOffset = me._getOffset(event),
                            start = $(this).data("start"),
                            offset = $(this).data("offset"),
                            newY = me._grid(eventOffset.y - offset.y),
                            newHeight = me._grid(me._num(me._RENDERER.getAttr(guide.lwc, "y")) - newY);
                        $(this).css({"position": "", "left": "", "top": ""});
                        if (newHeight >= me._CONFIG.GUIDE_MIN_SIZE) {
                            me._RENDERER.setAttr(guide.uc, {y: newY});
                            me._RENDERER.setAttr(guide.ul, {y: newY});
                            me._RENDERER.setAttr(guide.ur, {y: newY});
                            me._RENDERER.setAttr(guide.lc, {y: OG.Util.round((me._num(me._RENDERER.getAttr(guide.lwc, "y")) + newY) / 2)});
                            me._RENDERER.setAttr(guide.rc, {y: OG.Util.round((me._num(me._RENDERER.getAttr(guide.lwc, "y")) + newY) / 2)});
                            me._RENDERER.setAttr(guide.bBox, {
                                y: OG.Util.round(newY + me._num(me._RENDERER.getAttr(guide.uc, "width")) / 2),
                                height: newHeight
                            });
                        }
                        me._RENDERER.removeAllTerminal();
                    },
                    stop: function (event) {
                        var eventOffset = me._getOffset(event),
                            start = $(this).data("start"),
                            dy = start.y - eventOffset.y;
                        $(this).css({"position": "absolute", "left": "0px", "top": "0px"});
                        if (element && element.shape.geom) {
                            // resizing
                            if (element.shape.geom.getBoundary().getHeight() + dy < me._CONFIG.GUIDE_MIN_SIZE) {
                                dy = me._CONFIG.GUIDE_MIN_SIZE - element.shape.geom.getBoundary().getHeight();
                            }
                            me._RENDERER.resize(element, [me._grid(dy), 0, 0, 0]);
                            me._RENDERER.drawGuide(element);
                        }
                    }
                });

                $(guide.ul).draggable({
                    start: function (event) {
                        var eventOffset = me._getOffset(event);
                        $(this).data("start", {x: eventOffset.x, y: eventOffset.y});
                        $(this).data("offset", {
                            x: eventOffset.x - me._num(me._RENDERER.getAttr(guide.ul, "x")),
                            y: eventOffset.y - me._num(me._RENDERER.getAttr(guide.ul, "y"))
                        });

                        me._RENDERER.removeRubberBand(me._RENDERER.getRootElement());
                    },
                    drag: function (event) {
                        var eventOffset = me._getOffset(event),
                            start = $(this).data("start"),
                            offset = $(this).data("offset"),
                            newX = me._grid(eventOffset.x - offset.x),
                            newY = me._grid(eventOffset.y - offset.y),
                            newWidth = me._grid(me._num(me._RENDERER.getAttr(guide.rc, "x")) - newX),
                            newHeight = me._grid(me._num(me._RENDERER.getAttr(guide.lwc, "y")) - newY);
                        $(this).css({"position": "", "left": "", "top": ""});
                        if (newWidth >= me._CONFIG.GUIDE_MIN_SIZE) {
                            me._RENDERER.setAttr(guide.lc, {x: newX});
                            me._RENDERER.setAttr(guide.ul, {x: newX});
                            me._RENDERER.setAttr(guide.ll, {x: newX});
                            me._RENDERER.setAttr(guide.uc, {x: OG.Util.round((me._num(me._RENDERER.getAttr(guide.rc, "x")) + newX) / 2)});
                            me._RENDERER.setAttr(guide.lwc, {x: OG.Util.round((me._num(me._RENDERER.getAttr(guide.rc, "x")) + newX) / 2)});
                            me._RENDERER.setAttr(guide.bBox, {
                                x: OG.Util.round(newX + me._num(me._RENDERER.getAttr(guide.lc, "width")) / 2),
                                width: newWidth
                            });
                        }
                        if (newHeight >= me._CONFIG.GUIDE_MIN_SIZE) {
                            me._RENDERER.setAttr(guide.uc, {y: newY});
                            me._RENDERER.setAttr(guide.ul, {y: newY});
                            me._RENDERER.setAttr(guide.ur, {y: newY});
                            me._RENDERER.setAttr(guide.lc, {y: OG.Util.round((me._num(me._RENDERER.getAttr(guide.lwc, "y")) + newY) / 2)});
                            me._RENDERER.setAttr(guide.rc, {y: OG.Util.round((me._num(me._RENDERER.getAttr(guide.lwc, "y")) + newY) / 2)});
                            me._RENDERER.setAttr(guide.bBox, {
                                y: OG.Util.round(newY + me._num(me._RENDERER.getAttr(guide.uc, "height")) / 2),
                                height: newHeight
                            });
                        }
                        me._RENDERER.removeAllTerminal();
                    },
                    stop: function (event) {
                        var eventOffset = me._getOffset(event),
                            start = $(this).data("start"),
                            dx = start.x - eventOffset.x,
                            dy = start.y - eventOffset.y;
                        $(this).css({"position": "absolute", "left": "0px", "top": "0px"});
                        if (element && element.shape.geom) {
                            // resizing
                            if (element.shape.geom.getBoundary().getWidth() + dx < me._CONFIG.GUIDE_MIN_SIZE) {
                                dx = me._CONFIG.GUIDE_MIN_SIZE - element.shape.geom.getBoundary().getWidth();
                            }
                            if (element.shape.geom.getBoundary().getHeight() + dy < me._CONFIG.GUIDE_MIN_SIZE) {
                                dy = me._CONFIG.GUIDE_MIN_SIZE - element.shape.geom.getBoundary().getHeight();
                            }
                            me._RENDERER.resize(element, [me._grid(dy), 0, me._grid(dx), 0]);
                            me._RENDERER.drawGuide(element);
                        }
                    }
                });

                $(guide.ur).draggable({
                    start: function (event) {
                        var eventOffset = me._getOffset(event);
                        $(this).data("start", {x: eventOffset.x, y: eventOffset.y});
                        $(this).data("offset", {
                            x: eventOffset.x - me._num(me._RENDERER.getAttr(guide.ur, "x")),
                            y: eventOffset.y - me._num(me._RENDERER.getAttr(guide.ur, "y"))
                        });

                        me._RENDERER.removeRubberBand(me._RENDERER.getRootElement());
                    },
                    drag: function (event) {
                        var eventOffset = me._getOffset(event),
                            start = $(this).data("start"),
                            offset = $(this).data("offset"),
                            newX = me._grid(eventOffset.x - offset.x),
                            newY = me._grid(eventOffset.y - offset.y),
                            newWidth = me._grid(newX - me._num(me._RENDERER.getAttr(guide.lc, "x"))),
                            newHeight = me._grid(me._num(me._RENDERER.getAttr(guide.lwc, "y")) - newY);
                        $(this).css({"position": "", "left": "", "top": ""});
                        if (newWidth >= me._CONFIG.GUIDE_MIN_SIZE) {
                            me._RENDERER.setAttr(guide.rc, {x: newX});
                            me._RENDERER.setAttr(guide.ur, {x: newX});
                            me._RENDERER.setAttr(guide.lr, {x: newX});
                            me._RENDERER.setAttr(guide.uc, {x: OG.Util.round((me._num(me._RENDERER.getAttr(guide.lc, "x")) + newX) / 2)});
                            me._RENDERER.setAttr(guide.lwc, {x: OG.Util.round((me._num(me._RENDERER.getAttr(guide.lc, "x")) + newX) / 2)});
                            me._RENDERER.setAttr(guide.bBox, {width: newWidth});
                        }
                        if (newHeight >= me._CONFIG.GUIDE_MIN_SIZE) {
                            me._RENDERER.setAttr(guide.uc, {y: newY});
                            me._RENDERER.setAttr(guide.ul, {y: newY});
                            me._RENDERER.setAttr(guide.ur, {y: newY});
                            me._RENDERER.setAttr(guide.lc, {y: OG.Util.round((me._num(me._RENDERER.getAttr(guide.lwc, "y")) + newY) / 2)});
                            me._RENDERER.setAttr(guide.rc, {y: OG.Util.round((me._num(me._RENDERER.getAttr(guide.lwc, "y")) + newY) / 2)});
                            me._RENDERER.setAttr(guide.bBox, {
                                y: OG.Util.round(newY + me._num(me._RENDERER.getAttr(guide.uc, "width")) / 2),
                                height: newHeight
                            });
                        }
                        me._RENDERER.removeAllTerminal();
                    },
                    stop: function (event) {
                        var eventOffset = me._getOffset(event),
                            start = $(this).data("start"),
                            dx = eventOffset.x - start.x,
                            dy = start.y - eventOffset.y;
                        $(this).css({"position": "absolute", "left": "0px", "top": "0px"});
                        if (element && element.shape.geom) {
                            // resizing
                            if (element.shape.geom.getBoundary().getWidth() + dx < me._CONFIG.GUIDE_MIN_SIZE) {
                                dx = me._CONFIG.GUIDE_MIN_SIZE - element.shape.geom.getBoundary().getWidth();
                            }
                            if (element.shape.geom.getBoundary().getHeight() + dy < me._CONFIG.GUIDE_MIN_SIZE) {
                                dy = me._CONFIG.GUIDE_MIN_SIZE - element.shape.geom.getBoundary().getHeight();
                            }
                            me._RENDERER.resize(element, [me._grid(dy), 0, 0, me._grid(dx)]);
                            me._RENDERER.drawGuide(element);
                        }
                    }
                });
            }
        } else {
            if ($(element).attr("_shape") === OG.Constants.SHAPE_TYPE.EDGE) {
                me._RENDERER.setAttr(guide.from, {cursor: 'default'});
                me._RENDERER.setAttr(guide.to, {cursor: 'default'});
                $.each(guide.controls, function (idx, item) {
                    me._RENDERER.setAttr(item, {cursor: 'default'});
                });
            } else {
                me._RENDERER.setAttr(guide.ul, {cursor: 'default'});
                me._RENDERER.setAttr(guide.ur, {cursor: 'default'});
                me._RENDERER.setAttr(guide.ll, {cursor: 'default'});
                me._RENDERER.setAttr(guide.lr, {cursor: 'default'});
                me._RENDERER.setAttr(guide.lc, {cursor: 'default'});
                me._RENDERER.setAttr(guide.uc, {cursor: 'default'});
                me._RENDERER.setAttr(guide.rc, {cursor: 'default'});
                me._RENDERER.setAttr(guide.lwc, {cursor: 'default'});
            }
        }
    },

    /**
     * 주어진 Shape Element 를 마우스 클릭하여 선택가능하도록 한다.
     * 선택가능해야 리사이즈가 가능하다.
     *
     * @param {Element} element Shape Element
     * @param {Boolean} isSelectable 선택가능여부
     */
    setClickSelectable: function (element, isSelectable) {
        var me = this;
        if (isSelectable === true) {
            // 마우스 클릭하여 선택 처리
            $(element).bind("click", function (event) {
                var guide;

                $(me._RENDERER.getContainer()).focus();

                if (element.shape) {
                    if (!event.shiftKey && !event.ctrlKey) {
                        $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "][_selected=true]").each(function (index, item) {
                            if (item.id) {
                                me._RENDERER.removeGuide(item);
                            }
                        });
                    }

                    if ($(element).attr("_selected") === "true") {
                        if (event.shiftKey || event.ctrlKey) {
                            me._RENDERER.removeGuide(element);
                        }
                    } else {
                        me._deselectChildren(element);
                        if (!me._isParentSelected(element)) {
                            guide = me._RENDERER.drawGuide(element);
                            if (guide) {
                                // enable event
                                me.setResizable(element, guide, me._isResizable(element.shape));
                                me._RENDERER.removeAllTerminal();
                                me._RENDERER.toFront(guide.group);
                            }
                        }
                    }

                    return false;
                }
            });

            // 마우스 우클릭하여 선택 처리
            if (me._CONFIG.ENABLE_CONTEXTMENU) {
                $(element).bind("contextmenu", function (event) {
                    var guide;
                    if (element.shape) {
                        if ($(element).attr("_selected") !== "true") {
                            $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "][_selected=true]").each(function (index, item) {
                                if (item.id) {
                                    me._RENDERER.removeGuide(item);
                                }
                            });

                            me._deselectChildren(element);
                            if (!me._isParentSelected(element)) {
                                guide = me._RENDERER.drawGuide(element);
                                if (guide) {
                                    // enable event
                                    me.setResizable(element, guide, me._isResizable(element.shape));
                                    me._RENDERER.removeAllTerminal();
                                    me._RENDERER.toFront(guide.group);
                                }
                            }
                        }

                        return true;
                    }
                });
            }

            if (isSelectable && me._isMovable(element.shape)) {
                me._RENDERER.setAttr(element, {cursor: 'move'});
                OG.Util.apply(element.shape.geom.style.map, {cursor: 'move'});
            } else {
                me._RENDERER.setAttr(element, {cursor: 'pointer'});
                OG.Util.apply(element.shape.geom.style.map, {cursor: 'pointer'});
            }
        } else {
            $(element).unbind('click');
            me._RENDERER.setAttr(element, {cursor: me._CONFIG.DEFAULT_STYLE.SHAPE.cursor});
            OG.Util.apply(element.shape.geom.style.map, {cursor: me._CONFIG.DEFAULT_STYLE.SHAPE.cursor});
        }
    },

    /**
     * 마우스 드래그 영역지정 선택가능여부를 설정한다.
     * 선택가능해야 리사이즈가 가능하다.
     *
     * @param {Boolean} isSelectable 선택가능여부
     */
    setDragSelectable: function (isSelectable) {
        var me = this, rootEle = me._RENDERER.getRootElement();

        // 배경클릭한 경우 deselect 하도록
        $(rootEle).bind("click", function (event) {
            var dragBox = $(this).data("dragBox");
            $(me._RENDERER.getContainer()).focus();
            if (!dragBox || (dragBox && dragBox.width < 1 && dragBox.height < 1)) {
                $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "][_selected=true]").each(function (index, item) {
                    if (OG.Util.isElement(item) && item.id) {
                        me._RENDERER.removeGuide(item);
                    }
                });
                $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "]").each(function (index, item) {
                    if (OG.Util.isElement(item) && item.id) {
                        me._RENDERER.removeConnectGuide(item);
                        me._RENDERER.removeVirtualSpot(item);
                    }
                });
                me._RENDERER.removeAllTerminal();

                $(me._RENDERER.getRootGroup()).data(OG.Constants.CONNECT_GUIDE_SUFFIX.SPOT_EVENT_DRAG, false);
                $(me._RENDERER.getRootGroup()).data(OG.Constants.CONNECT_GUIDE_SUFFIX.SPOT_EVENT_MOUSEROVER, false);
            }
        });

        if (isSelectable === true) {
            // 마우스 영역 드래그하여 선택 처리
            $(rootEle).bind("mousedown", function (event) {
                var eventOffset = me._getOffset(event);
                $(this).data("dragBox_first", {x: eventOffset.x, y: eventOffset.y});
                me._RENDERER.drawRubberBand([eventOffset.x, eventOffset.y]);
            });
            $(rootEle).bind("mousemove", function (event) {
                var first = $(this).data("dragBox_first"),
                    eventOffset, width, height, x, y;
                if (first) {
                    eventOffset = me._getOffset(event);
                    width = eventOffset.x - first.x;
                    height = eventOffset.y - first.y;
                    x = width <= 0 ? first.x + width : first.x;
                    y = height <= 0 ? first.y + height : first.y;
                    me._RENDERER.drawRubberBand([x, y], [Math.abs(width), Math.abs(height)]);
                }
            });
            $(rootEle).bind("mouseup", function (event) {
                var first = $(this).data("dragBox_first"),
                    eventOffset, width, height, x, y, envelope, guide;
                me._RENDERER.removeRubberBand(rootEle);
                if (first) {
                    eventOffset = me._getOffset(event);
                    width = eventOffset.x - first.x;
                    height = eventOffset.y - first.y;
                    x = width <= 0 ? first.x + width : first.x;
                    y = height <= 0 ? first.y + height : first.y;
                    envelope = new OG.Envelope([x, y], Math.abs(width), Math.abs(height));
                    $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "]").each(function (index, element) {
                        if (element.shape.geom && envelope.isContainsAll(element.shape.geom.getVertices())) {
                            me._deselectChildren(element);
                            if (!me._isParentSelected(element)) {
                                guide = me._RENDERER.drawGuide(element);
                                if (guide) {
                                    // enable event
                                    me.setResizable(element, guide, me._isResizable(element.shape));
                                    me._RENDERER.removeAllTerminal();
                                }
                            }
                        }
                    });

                    $(this).data("dragBox", {width: width, height: height, x: x, y: y});
                }
            });

            $(rootEle).bind("contextmenu", function (event) {
                me._RENDERER.removeRubberBand(rootEle);
            });
        } else {
            $(rootEle).unbind("mousedown");
            $(rootEle).unbind("mousemove");
            $(rootEle).unbind("mouseup");
            $(rootEle).unbind("contextmenu");
        }
    },

    /**
     * HotKey 사용 가능여부를 설정한다. (Delete, Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+G, Ctrl+U)
     *
     * @param {Boolean} isEnableHotKey 핫키가능여부
     */
    setEnableHotKey: function (isEnableHotKey) {
        var me = this;
        if (isEnableHotKey === true) {
            // delete, ctrl+A
            $(me._RENDERER.getContainer()).bind("keydown", function (event) {
                // 라벨수정중엔 keydown 이벤트무시
                if (!/^textarea$/i.test(event.srcElement.tagName) && !/^input$/i.test(event.srcElement.tagName)) {
                    // Delete : 삭제
                    if (me._CONFIG.ENABLE_HOTKEY_DELETE && event.keyCode === KeyEvent.DOM_VK_DELETE) {
                        event.preventDefault();
                        me.deleteSelectedShape();
                    }

                    // Ctrl+A : 전체선택
                    if (me._CONFIG.ENABLE_HOTKEY_CTRL_A && me._CONFIG.SELECTABLE && (event.ctrlKey || event.metaKey) && event.keyCode === KeyEvent.DOM_VK_A) {
                        event.preventDefault();
                        me.selectAll();
                    }

                    // Ctrl+C : 복사
                    if (me._CONFIG.ENABLE_HOTKEY_CTRL_C && (event.ctrlKey || event.metaKey) && event.keyCode === KeyEvent.DOM_VK_C) {
                        event.preventDefault();
                        me.copySelectedShape();
                    }

                    // Ctrl+X : 잘라내기
                    if (me._CONFIG.ENABLE_HOTKEY_CTRL_C && (event.ctrlKey || event.metaKey) && event.keyCode === KeyEvent.DOM_VK_X) {
                        event.preventDefault();
                        me.cutSelectedShape();
                    }

                    // Ctrl+V: 붙여넣기
                    if (me._CONFIG.ENABLE_HOTKEY_CTRL_V && (event.ctrlKey || event.metaKey) && event.keyCode === KeyEvent.DOM_VK_V) {
                        event.preventDefault();
                        me.pasteSelectedShape();
                    }

                    // Ctrl+D: 복제하기
                    if (me._CONFIG.ENABLE_HOTKEY_CTRL_D && (event.ctrlKey || event.metaKey) && event.keyCode === KeyEvent.DOM_VK_D) {
                        event.preventDefault();
                        me.duplicateSelectedShape();
                    }

                    // Ctrl+G : 그룹
                    if (me._CONFIG.ENABLE_HOTKEY_CTRL_G && (event.ctrlKey || event.metaKey) && event.keyCode === KeyEvent.DOM_VK_G) {
                        event.preventDefault();
                        me.groupSelectedShape();
                    }

                    // Ctrl+U : 언그룹
                    if (me._CONFIG.ENABLE_HOTKEY_CTRL_U && (event.ctrlKey || event.metaKey) && event.keyCode === KeyEvent.DOM_VK_U) {
                        event.preventDefault();
                        me.ungroupSelectedShape();
                    }

                    if (me._CONFIG.ENABLE_HOTKEY_SHIFT_ARROW) {
                        // Shift+화살표 : 이동
                        if (event.shiftKey && event.keyCode === KeyEvent.DOM_VK_LEFT) {
                            event.preventDefault();
                            me._moveElements(me._getMoveTargets(), -1 * (me._CONFIG.DRAG_GRIDABLE ? me._CONFIG.MOVE_SNAP_SIZE : 1), 0);
                        }
                        if (event.shiftKey && event.keyCode === KeyEvent.DOM_VK_RIGHT) {
                            event.preventDefault();
                            me._moveElements(me._getMoveTargets(), (me._CONFIG.DRAG_GRIDABLE ? me._CONFIG.MOVE_SNAP_SIZE : 1), 0);
                        }
                        if (event.shiftKey && event.keyCode === KeyEvent.DOM_VK_UP) {
                            event.preventDefault();
                            me._moveElements(me._getMoveTargets(), 0, -1 * (me._CONFIG.DRAG_GRIDABLE ? me._CONFIG.MOVE_SNAP_SIZE : 1));
                        }
                        if (event.shiftKey && event.keyCode === KeyEvent.DOM_VK_DOWN) {
                            event.preventDefault();
                            me._moveElements(me._getMoveTargets(), 0, (me._CONFIG.DRAG_GRIDABLE ? me._CONFIG.MOVE_SNAP_SIZE : 1));
                        }
                    }
                    if (me._CONFIG.ENABLE_HOTKEY_ARROW) {
                        // 화살표 : 이동
                        if (!event.shiftKey && event.keyCode === KeyEvent.DOM_VK_LEFT) {
                            event.preventDefault();
                            me._moveElements(me._getMoveTargets(), -1 * me._CONFIG.MOVE_SNAP_SIZE, 0);
                        }
                        if (!event.shiftKey && event.keyCode === KeyEvent.DOM_VK_RIGHT) {
                            event.preventDefault();
                            me._moveElements(me._getMoveTargets(), me._CONFIG.MOVE_SNAP_SIZE, 0);
                        }
                        if (!event.shiftKey && event.keyCode === KeyEvent.DOM_VK_UP) {
                            event.preventDefault();
                            me._moveElements(me._getMoveTargets(), 0, -1 * me._CONFIG.MOVE_SNAP_SIZE);
                        }
                        if (!event.shiftKey && event.keyCode === KeyEvent.DOM_VK_DOWN) {
                            event.preventDefault();
                            me._moveElements(me._getMoveTargets(), 0, me._CONFIG.MOVE_SNAP_SIZE);
                        }
                    }
                }
            });
        } else {
            $(me._RENDERER.getContainer()).unbind("keydown");
        }
    },

    /**
     * 캔버스에 마우스 우클릭 메뉴를 가능하게 한다.
     */
    enableRootContextMenu: function () {
        var me = this;
        $.contextMenu({
            selector: '#' + me._RENDERER.getRootElement().id,
            build: function ($trigger, e) {
                var root = me._RENDERER.getRootGroup(), copiedElement = $(root).data("copied");
                $(me._RENDERER.getContainer()).focus();
                return {
                    items: {
                        'selectAll': {
                            name: 'Select All', callback: function () {
                                me.selectAll();
                            }
                        },
                        'sep1': '---------',
                        'paste': {
                            name: 'Paste', callback: function () {
                                me.pasteSelectedShape();
                            },
                            disabled: (copiedElement ? false : true)
                        },
                        'sep2': '---------',
                        'view': {
                            name: 'View',
                            items: {
                                'view_actualSize': {
                                    name: 'Actual Size', callback: function () {
                                        me._RENDERER.setScale(1);
                                    }
                                },
                                'sep2_1': '---------',
                                'view_fitWindow': {
                                    name: 'Fit Window', callback: function () {
                                        me.fitWindow();
                                    }
                                },
                                'sep2_2': '---------',
                                'view_25': {
                                    name: '25%', callback: function () {
                                        me._RENDERER.setScale(0.25);
                                    }
                                },
                                'view_50': {
                                    name: '50%', callback: function () {
                                        me._RENDERER.setScale(0.5);
                                    }
                                },
                                'view_75': {
                                    name: '75%', callback: function () {
                                        me._RENDERER.setScale(0.75);
                                    }
                                },
                                'view_100': {
                                    name: '100%', callback: function () {
                                        me._RENDERER.setScale(1);
                                    }
                                },
                                'view_150': {
                                    name: '150%', callback: function () {
                                        me._RENDERER.setScale(1.5);
                                    }
                                },
                                'view_200': {
                                    name: '200%', callback: function () {
                                        me._RENDERER.setScale(2);
                                    }
                                },
                                'view_300': {
                                    name: '300%', callback: function () {
                                        me._RENDERER.setScale(3);
                                    }
                                },
                                'view_400': {
                                    name: '400%', callback: function () {
                                        me._RENDERER.setScale(4);
                                    }
                                },
                                'sep2_3': '---------',
                                'view_zoomin': {
                                    name: 'Zoom In', callback: function () {
                                        me.zoomIn();
                                    }
                                },
                                'view_zoomout': {
                                    name: 'Zoom Out', callback: function () {
                                        me.zoomOut();
                                    }
                                }
                            }
                        }
                    }
                };
            }
        });
    },

    /**
     * Shape 에 마우스 우클릭 메뉴를 가능하게 한다.
     */
    enableShapeContextMenu: function () {
        var me = this;
        $.contextMenu({
            selector: '#' + me._RENDERER.getRootElement().id + ' [_type=SHAPE]',
            build: function ($trigger, e) {
                $(me._RENDERER.getContainer()).focus();
                return {
                    items: {
                        'delete': {
                            name: 'Delete', callback: function () {
                                me.deleteSelectedShape();
                            }
                        },
                        'sep1': '---------',
                        'cut': {
                            name: 'Cut', callback: function () {
                                me.cutSelectedShape();
                            }
                        },
                        'copy': {
                            name: 'Copy', callback: function () {
                                me.copySelectedShape();
                            }
                        },
                        'sep2': '---------',
                        'duplicate': {
                            name: 'Duplicate', callback: function () {
                                me.duplicateSelectedShape();
                            }
                        },
                        'sep3': '---------',
                        'group': {
                            name: 'Group', callback: function () {
                                me.groupSelectedShape();
                            }
                        },
                        'unGroup': {
                            name: 'UnGroup', callback: function () {
                                me.ungroupSelectedShape();
                            }
                        },
                        'sep4': '---------',
                        'shapeRotate': {
                            name: 'Rotate',
                            items: {
                                'rotate_select': {
                                    name: 'Select',
                                    type: 'select',
                                    options: {
                                        '0': '0',
                                        '45': '45',
                                        '90': '90',
                                        '135': '135',
                                        '180': '180',
                                        '-45': '-45',
                                        '-90': '-90',
                                        '-135': '-135',
                                        '-180': '-180'
                                    },
                                    selected: '0',
                                    events: {
                                        change: function (e) {
                                            me.rotateSelectedShape(e.target.value);
                                        }
                                    }
                                },
                                'sep5_6_1': '---------',
                                'rotate_custom': {
                                    name: 'Custom',
                                    type: 'text',
                                    events: {
                                        keyup: function (e) {
                                            if (e.target.value !== '') {
                                                me.rotateSelectedShape(e.target.value);
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        'sep5': '---------',
                        'format': {
                            name: 'Format',
                            items: {
                                'fillColor': {
                                    name: 'Fill Color',
                                    items: {
                                        'fillColor_select': {
                                            name: 'Select',
                                            type: 'select',
                                            options: {
                                                '': '',
                                                'white': 'white',
                                                'gray': 'gray',
                                                'blue': 'blue',
                                                'red': 'red',
                                                'yellow': 'yellow',
                                                'orange': 'orange',
                                                'green': 'green',
                                                'black': 'black'
                                            },
                                            selected: '',
                                            events: {
                                                change: function (e) {
                                                    if (e.target.value !== '') {
                                                        me.setFillColorSelectedShape(e.target.value);
                                                    }
                                                }
                                            }
                                        },
                                        'sep5_1_1': '---------',
                                        'fillColor_custom': {
                                            name: 'Custom',
                                            type: 'text',
                                            events: {
                                                keyup: function (e) {
                                                    if (e.target.value !== '') {
                                                        me.setFillColorSelectedShape(e.target.value);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                'fillOpacity': {
                                    name: 'Fill Opacity',
                                    items: {
                                        'fillOpacity_select': {
                                            name: 'Select',
                                            type: 'select',
                                            options: {
                                                '': '',
                                                '0.0': '0%',
                                                '0.1': '10%',
                                                '0.2': '20%',
                                                '0.3': '30%',
                                                '0.4': '40%',
                                                '0.5': '50%',
                                                '0.6': '60%',
                                                '0.7': '70%',
                                                '0.8': '80%',
                                                '0.9': '90%',
                                                '1.0': '100%'
                                            },
                                            selected: '',
                                            events: {
                                                change: function (e) {
                                                    if (e.target.value !== '') {
                                                        me.setFillOpacitySelectedShape(e.target.value);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                'sep5_1': '---------',
                                'lineType': {
                                    name: 'Line Type',
                                    items: {
                                        'lineType_straight': {
                                            name: 'Straight',
                                            type: 'radio',
                                            radio: 'lineType',
                                            value: 'straight',
                                            events: {
                                                change: function (e) {
                                                    me.setLineTypeSelectedShape(e.target.value);
                                                }
                                            }
                                        },
                                        'lineType_plain': {
                                            name: 'Plain',
                                            type: 'radio',
                                            radio: 'lineType',
                                            value: 'plain',
                                            events: {
                                                change: function (e) {
                                                    me.setLineTypeSelectedShape(e.target.value);
                                                }
                                            }
                                        },
                                        'lineType_bezier': {
                                            name: 'Curve',
                                            type: 'radio',
                                            radio: 'lineType',
                                            value: 'bezier',
                                            events: {
                                                change: function (e) {
                                                    me.setLineTypeSelectedShape(e.target.value);
                                                }
                                            }
                                        }
                                    }
                                },
                                'lineStyle': {
                                    name: 'Line Style',
                                    items: {
                                        'lineStyle_1': {
                                            name: '──────',
                                            type: 'radio',
                                            radio: 'lineStyle',
                                            value: '',
                                            events: {
                                                change: function (e) {
                                                    me.setLineStyleSelectedShape(e.target.value);
                                                }
                                            }
                                        },
                                        'lineStyle_2': {
                                            name: '---------',
                                            type: 'radio',
                                            radio: 'lineStyle',
                                            value: '-',
                                            events: {
                                                change: function (e) {
                                                    me.setLineStyleSelectedShape(e.target.value);
                                                }
                                            }
                                        },
                                        'lineStyle_3': {
                                            name: '············',
                                            type: 'radio',
                                            radio: 'lineStyle',
                                            value: '.',
                                            events: {
                                                change: function (e) {
                                                    me.setLineStyleSelectedShape(e.target.value);
                                                }
                                            }
                                        },
                                        'lineStyle_4': {
                                            name: '-·-·-·-·-·',
                                            type: 'radio',
                                            radio: 'lineStyle',
                                            value: '-.',
                                            events: {
                                                change: function (e) {
                                                    me.setLineStyleSelectedShape(e.target.value);
                                                }
                                            }
                                        },
                                        'lineStyle_5': {
                                            name: '-··-··-··-',
                                            type: 'radio',
                                            radio: 'lineStyle',
                                            value: '-..',
                                            events: {
                                                change: function (e) {
                                                    me.setLineStyleSelectedShape(e.target.value);
                                                }
                                            }
                                        },
                                        'lineStyle_6': {
                                            name: '· · · · · ·',
                                            type: 'radio',
                                            radio: 'lineStyle',
                                            value: '. ',
                                            events: {
                                                change: function (e) {
                                                    me.setLineStyleSelectedShape(e.target.value);
                                                }
                                            }
                                        },
                                        'lineStyle_7': {
                                            name: '- - - - -',
                                            type: 'radio',
                                            radio: 'lineStyle',
                                            value: '- ',
                                            events: {
                                                change: function (e) {
                                                    me.setLineStyleSelectedShape(e.target.value);
                                                }
                                            }
                                        },
                                        'lineStyle_8': {
                                            name: '─ ─ ─ ─',
                                            type: 'radio',
                                            radio: 'lineStyle',
                                            value: '--',
                                            events: {
                                                change: function (e) {
                                                    me.setLineStyleSelectedShape(e.target.value);
                                                }
                                            }
                                        },
                                        'lineStyle_9': {
                                            name: '- ·- ·- ·-',
                                            type: 'radio',
                                            radio: 'lineStyle',
                                            value: '- .',
                                            events: {
                                                change: function (e) {
                                                    me.setLineStyleSelectedShape(e.target.value);
                                                }
                                            }
                                        },
                                        'lineStyle_10': {
                                            name: '--·--·--·-',
                                            type: 'radio',
                                            radio: 'lineStyle',
                                            value: '--.',
                                            events: {
                                                change: function (e) {
                                                    me.setLineStyleSelectedShape(e.target.value);
                                                }
                                            }
                                        },
                                        'lineStyle_11': {
                                            name: '--··--··--',
                                            type: 'radio',
                                            radio: 'lineStyle',
                                            value: '--..',
                                            events: {
                                                change: function (e) {
                                                    me.setLineStyleSelectedShape(e.target.value);
                                                }
                                            }
                                        }
                                    }
                                },
                                'lineColor': {
                                    name: 'Line Color',
                                    items: {
                                        'lineColor_select': {
                                            name: 'Select',
                                            type: 'select',
                                            options: {
                                                '': '',
                                                'white': 'white',
                                                'gray': 'gray',
                                                'blue': 'blue',
                                                'red': 'red',
                                                'yellow': 'yellow',
                                                'orange': 'orange',
                                                'green': 'green',
                                                'black': 'black'
                                            },
                                            selected: '',
                                            events: {
                                                change: function (e) {
                                                    if (e.target.value !== '') {
                                                        me.setLineColorSelectedShape(e.target.value);
                                                    }
                                                }
                                            }
                                        },
                                        'sep5_4_1': '---------',
                                        'lineColor_custom': {
                                            name: 'Custom',
                                            type: 'text',
                                            events: {
                                                keyup: function (e) {
                                                    if (e.target.value !== '') {
                                                        me.setLineColorSelectedShape(e.target.value);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                'lineWidth': {
                                    name: 'Line Width',
                                    items: {
                                        'lineWidth_select': {
                                            name: 'Select',
                                            type: 'select',
                                            options: {
                                                0: '',
                                                1: '1px',
                                                2: '2px',
                                                3: '3px',
                                                4: '4px',
                                                5: '5px',
                                                6: '6px',
                                                8: '8px',
                                                10: '10px',
                                                12: '12px',
                                                16: '16px',
                                                24: '24px'
                                            },
                                            selected: 0,
                                            events: {
                                                change: function (e) {
                                                    if (e.target.value !== 0) {
                                                        me.setLineWidthSelectedShape(e.target.value);
                                                    }
                                                }
                                            }
                                        },
                                        'sep5_5_1': '---------',
                                        'lineWidth_custom': {
                                            name: 'Custom',
                                            type: 'text',
                                            events: {
                                                keyup: function (e) {
                                                    if (e.target.value !== '') {
                                                        me.setLineWidthSelectedShape(e.target.value);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        'sep6': '---------',
                        'text': {
                            name: 'Text',
                            items: {
                                'fontFamily': {
                                    name: 'Font Family',
                                    items: {
                                        'fontFamily_1': {
                                            name: '<span style="font-family: Arial">Arial</span>',
                                            type: 'radio',
                                            radio: 'fontFamily',
                                            value: 'Arial',
                                            events: {
                                                change: function (e) {
                                                    me.setFontFamilySelectedShape(e.target.value);
                                                }
                                            }
                                        },
                                        'fontFamily_2': {
                                            name: '<span style="font-family: \'Comic Sans MS\'">Comic Sans MS</span>',
                                            type: 'radio',
                                            radio: 'fontFamily',
                                            value: 'Comic Sans MS',
                                            events: {
                                                change: function (e) {
                                                    me.setFontFamilySelectedShape(e.target.value);
                                                }
                                            }
                                        },
                                        'fontFamily_3': {
                                            name: '<span style="font-family: \'Courier New\'">Courier New</span>',
                                            type: 'radio',
                                            radio: 'fontFamily',
                                            value: 'Courier New',
                                            events: {
                                                change: function (e) {
                                                    me.setFontFamilySelectedShape(e.target.value);
                                                }
                                            }
                                        },
                                        'fontFamily_4': {
                                            name: '<span style="font-family: Garamond">Garamond</span>',
                                            type: 'radio',
                                            radio: 'fontFamily',
                                            value: 'Garamond',
                                            events: {
                                                change: function (e) {
                                                    me.setFontFamilySelectedShape(e.target.value);
                                                }
                                            }
                                        },
                                        'fontFamily_5': {
                                            name: '<span style="font-family: Georgia">Georgia</span>',
                                            type: 'radio',
                                            radio: 'fontFamily',
                                            value: 'Georgia',
                                            events: {
                                                change: function (e) {
                                                    me.setFontFamilySelectedShape(e.target.value);
                                                }
                                            }
                                        },
                                        'fontFamily_6': {
                                            name: '<span style="font-family: \'Lucida Console\'">Lucida Console</span>',
                                            type: 'radio',
                                            radio: 'fontFamily',
                                            value: 'Lucida Console',
                                            events: {
                                                change: function (e) {
                                                    me.setFontFamilySelectedShape(e.target.value);
                                                }
                                            }
                                        },
                                        'fontFamily_7': {
                                            name: '<span style="font-family: \'MS Gothic\'">MS Gothic</span>',
                                            type: 'radio',
                                            radio: 'fontFamily',
                                            value: 'MS Gothic',
                                            events: {
                                                change: function (e) {
                                                    me.setFontFamilySelectedShape(e.target.value);
                                                }
                                            }
                                        },
                                        'fontFamily_8': {
                                            name: '<span style="font-family: \'MS Sans Serif\'">MS Sans Serif</span>',
                                            type: 'radio',
                                            radio: 'fontFamily',
                                            value: 'MS Sans Serif',
                                            events: {
                                                change: function (e) {
                                                    me.setFontFamilySelectedShape(e.target.value);
                                                }
                                            }
                                        },
                                        'fontFamily_9': {
                                            name: '<span style="font-family: Verdana">Verdana</span>',
                                            type: 'radio',
                                            radio: 'fontFamily',
                                            value: 'Verdana',
                                            events: {
                                                change: function (e) {
                                                    me.setFontFamilySelectedShape(e.target.value);
                                                }
                                            }
                                        },
                                        'fontFamily_10': {
                                            name: '<span style="font-family: \'Times New Roman\'">Times New Roman</span>',
                                            type: 'radio',
                                            radio: 'fontFamily',
                                            value: 'Times New Roman',
                                            events: {
                                                change: function (e) {
                                                    me.setFontFamilySelectedShape(e.target.value);
                                                }
                                            }
                                        },
                                        'sep6_1_1': '---------',
                                        'fontFamily_custom': {
                                            name: 'Custom',
                                            type: 'text',
                                            events: {
                                                keyup: function (e) {
                                                    if (e.target.value !== '') {
                                                        me.setFontFamilySelectedShape(e.target.value);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                'fontColor': {
                                    name: 'Font Color',
                                    items: {
                                        'fontColor_select': {
                                            name: 'Select',
                                            type: 'select',
                                            options: {
                                                '': '',
                                                'white': 'white',
                                                'gray': 'gray',
                                                'blue': 'blue',
                                                'red': 'red',
                                                'yellow': 'yellow',
                                                'orange': 'orange',
                                                'green': 'green',
                                                'black': 'black'
                                            },
                                            selected: '',
                                            events: {
                                                change: function (e) {
                                                    if (e.target.value !== '') {
                                                        me.setFontColorSelectedShape(e.target.value);
                                                    }
                                                }
                                            }
                                        },
                                        'sep6_1_2': '---------',
                                        'fontColor_custom': {
                                            name: 'Custom',
                                            type: 'text',
                                            events: {
                                                keyup: function (e) {
                                                    if (e.target.value !== '') {
                                                        me.setFontColorSelectedShape(e.target.value);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                'fontSize': {
                                    name: 'Font Size',
                                    items: {
                                        'fontSize_select': {
                                            name: 'Select',
                                            type: 'select',
                                            options: {
                                                '': '',
                                                '6': '6',
                                                '8': '8',
                                                '9': '9',
                                                '10': '10',
                                                '11': '11',
                                                '12': '12',
                                                '14': '14',
                                                '18': '18',
                                                '24': '24',
                                                '36': '36',
                                                '48': '48',
                                                '72': '72'
                                            },
                                            selected: '',
                                            events: {
                                                change: function (e) {
                                                    if (e.target.value !== '') {
                                                        me.setFontSizeSelectedShape(e.target.value);
                                                    }
                                                }
                                            }
                                        },
                                        'sep6_1_3': '---------',
                                        'fontSize_custom': {
                                            name: 'Custom',
                                            type: 'text',
                                            events: {
                                                keyup: function (e) {
                                                    if (e.target.value !== '') {
                                                        me.setFontSizeSelectedShape(e.target.value);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                'sep6_1': '---------',
                                'fontWeight_bold': {
                                    name: '<span style="font-weight: bold">Bold</span>',
                                    type: 'checkbox',
                                    events: {
                                        change: function (e) {
                                            if (e.target.checked) {
                                                me.setFontWeightSelectedShape('bold');
                                            } else {
                                                me.setFontWeightSelectedShape('normal');
                                            }
                                        }
                                    }
                                },
                                'fontWeight_italic': {
                                    name: '<span style="font-style: italic">Italic</span>',
                                    type: 'checkbox',
                                    events: {
                                        change: function (e) {
                                            if (e.target.checked) {
                                                me.setFontStyleSelectedShape('italic');
                                            } else {
                                                me.setFontStyleSelectedShape('normal');
                                            }
                                        }
                                    }
                                },
//								// TODO : 라파엘이 text-decoration 을 지원안함
//								'fontWeight_underline': {
//									name  : '<span style="text-decoration: underline">Underline</span>',
//									type  : 'checkbox',
//									events: {
//										change: function (e) {
//											if (e.target.checked) {
//												me.setTextDecorationSelectedShape('underline');
//											} else {
//												me.setTextDecorationSelectedShape('none');
//											}
//										}
//									}
//								},
                                'sep6_2': '---------',
                                'position': {
                                    name: 'Text Position',
                                    items: {
                                        'position_left': {
                                            name: 'Left',
                                            type: 'radio',
                                            radio: 'position',
                                            value: 'left',
                                            events: {
                                                change: function (e) {
                                                    me.setLabelPositionSelectedShape(e.target.value);
                                                }
                                            }
                                        },
                                        'position_center': {
                                            name: 'Center',
                                            type: 'radio',
                                            radio: 'position',
                                            value: 'center',
                                            events: {
                                                change: function (e) {
                                                    me.setLabelPositionSelectedShape(e.target.value);
                                                }
                                            }
                                        },
                                        'position_right': {
                                            name: 'Right',
                                            type: 'radio',
                                            radio: 'position',
                                            value: 'right',
                                            events: {
                                                change: function (e) {
                                                    me.setLabelPositionSelectedShape(e.target.value);
                                                }
                                            }
                                        },
                                        'position_top': {
                                            name: 'Top',
                                            type: 'radio',
                                            radio: 'position',
                                            value: 'top',
                                            events: {
                                                change: function (e) {
                                                    me.setLabelPositionSelectedShape(e.target.value);
                                                }
                                            }
                                        },
                                        'position_bottom': {
                                            name: 'Bottom',
                                            type: 'radio',
                                            radio: 'position',
                                            value: 'bottom',
                                            events: {
                                                change: function (e) {
                                                    me.setLabelPositionSelectedShape(e.target.value);
                                                }
                                            }
                                        }
                                    }
                                },
                                'vertical': {
                                    name: 'Vertical Align',
                                    items: {
                                        'vertical_top': {
                                            name: 'Top',
                                            type: 'radio',
                                            radio: 'vertical',
                                            value: 'top',
                                            events: {
                                                change: function (e) {
                                                    me.setLabelVerticalSelectedShape(e.target.value);
                                                }
                                            }
                                        },
                                        'vertical_middle': {
                                            name: 'Middle',
                                            type: 'radio',
                                            radio: 'vertical',
                                            value: 'middle',
                                            events: {
                                                change: function (e) {
                                                    me.setLabelVerticalSelectedShape(e.target.value);
                                                }
                                            }
                                        },
                                        'vertical_bottom': {
                                            name: 'Bottom',
                                            type: 'radio',
                                            radio: 'vertical',
                                            value: 'bottom',
                                            events: {
                                                change: function (e) {
                                                    me.setLabelVerticalSelectedShape(e.target.value);
                                                }
                                            }
                                        }
                                    }
                                },
                                'horizontal': {
                                    name: 'Horizontal Align',
                                    items: {
                                        'vertical_start': {
                                            name: 'Left',
                                            type: 'radio',
                                            radio: 'horizontal',
                                            value: 'start',
                                            events: {
                                                change: function (e) {
                                                    me.setLabelHorizontalSelectedShape(e.target.value);
                                                }
                                            }
                                        },
                                        'horizontal_middle': {
                                            name: 'Middle',
                                            type: 'radio',
                                            radio: 'horizontal',
                                            value: 'middle',
                                            events: {
                                                change: function (e) {
                                                    me.setLabelHorizontalSelectedShape(e.target.value);
                                                }
                                            }
                                        },
                                        'horizontal_end': {
                                            name: 'Right',
                                            type: 'radio',
                                            radio: 'horizontal',
                                            value: 'end',
                                            events: {
                                                change: function (e) {
                                                    me.setLabelHorizontalSelectedShape(e.target.value);
                                                }
                                            }
                                        }
                                    }
                                },
                                'sep6_5': '---------',
                                'textRotate': {
                                    name: 'Text Rotate',
                                    items: {
                                        'textRotate_select': {
                                            name: 'Select',
                                            type: 'select',
                                            options: {
                                                '0': '0',
                                                '45': '45',
                                                '90': '90',
                                                '135': '135',
                                                '180': '180',
                                                '-45': '-45',
                                                '-90': '-90',
                                                '-135': '-135',
                                                '-180': '-180'
                                            },
                                            selected: '0',
                                            events: {
                                                change: function (e) {
                                                    me.setLabelAngleSelectedShape(e.target.value);
                                                }
                                            }
                                        },
                                        'sep6_6_1': '---------',
                                        'textRotate_custom': {
                                            name: 'Custom',
                                            type: 'text',
                                            events: {
                                                keyup: function (e) {
                                                    if (e.target.value !== '') {
                                                        me.setLabelAngleSelectedShape(e.target.value);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        'sep7': '---------',
                        'label': {
                            name: 'Label',
                            items: {
                                'label_shape': {
                                    name: 'Cell Label',
                                    type: 'text',
                                    events: {
                                        keyup: function (e) {
                                            me.setLabelSelectedShape(e.target.value);
                                        }
                                    }
                                },
                                'sep7_1': '---------',
                                'label_from': {
                                    name: 'Edge From',
                                    type: 'text',
                                    events: {
                                        keyup: function (e) {
                                            me.setEdgeFromLabelSelectedShape(e.target.value);
                                        }
                                    }
                                },
                                'label_to': {
                                    name: 'Edge To',
                                    type: 'text',
                                    events: {
                                        keyup: function (e) {
                                            me.setEdgeToLabelSelectedShape(e.target.value);
                                        }
                                    }
                                }
                            }
                        }
                    }
                };
            }
        });
    },

    /**
     * 주어진 Shape Element 를 선택된 상태로 되게 한다.
     *
     * @param {Element} element Shape 엘리먼트
     */
    selectShape: function (element) {
        var me = this, guide;
        if ($(element.parentNode).attr("_shape") !== OG.Constants.SHAPE_TYPE.GROUP && me._isSelectable(element.shape)) {
            guide = me._RENDERER.drawGuide(element);
            if (guide) {
                // enable event
                me.setResizable(element, guide, me._isResizable(element.shape));
                me._RENDERER.removeTerminal(element);
            }
        }
    },

    /**
     * 메뉴 : 선택된 Shape 들을 삭제한다.
     */
    deleteSelectedShape: function () {
        var me = this;
        $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "][_shape=EDGE][_selected=true]").each(function (index, item) {
            if (item.id) {
                me._RENDERER.removeShape(item);
            }
        });
        $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "][_selected=true]").each(function (index, item) {
            if (item.id) {
                me._RENDERER.removeShape(item);
            }
        });
    },

    /**
     * 메뉴 : 모든 Shape 들을 선택한다.
     */
    selectAll: function () {
        var me = this;
        $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "]").each(function (index, element) {
            me.selectShape(element);
        });
    },

    /**
     * 메뉴 : 선택된 Shape 들을 복사한다.
     */
    copySelectedShape: function () {
        var me = this, root = me._RENDERER.getRootGroup(), selectedElement = [];
        $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "][_selected=true]").each(function (index, element) {
            selectedElement.push(element);
        });
        $(root).data("copied", selectedElement);
    },

    /**
     * 메뉴 : 선택된 Shape 들을 잘라내기한다.
     */
    cutSelectedShape: function () {
        var me = this;
        me.copySelectedShape();
        me.deleteSelectedShape();
    },

    /**
     * 메뉴 : 선택된 Shape 들을 붙여넣기 한다.
     */
    pasteSelectedShape: function () {
        var me = this, root = me._RENDERER.getRootGroup(),
            copiedElement = $(root).data("copied"),
            selectedElement = [];
        if (copiedElement) {
            $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "][_selected=true]").each(function (index, item) {
                if (item.id) {
                    me._RENDERER.removeGuide(item);
                }
            });

            // TODO : 연결된 Shape 인 경우 연결성 유지토록
            $.each(copiedElement, function (idx, item) {
                // copy
                var boundary = item.shape.geom.getBoundary(), newShape, newElement, newGuide;
                newShape = item.shape.clone();

                if ($(item).attr("_shape") === OG.Constants.SHAPE_TYPE.EDGE) {
                    if (item.shape.geom instanceof OG.geometry.BezierCurve) {
                        newShape.geom = new OG.BezierCurve(item.shape.geom.getControlPoints());
                    } else {
                        newShape.geom = new OG.PolyLine(item.shape.geom.getVertices());
                    }
                    newShape.geom.style = item.shape.geom.style;
                    newShape.geom.move(me._CONFIG.COPY_PASTE_PADDING, me._CONFIG.COPY_PASTE_PADDING);
                    newElement = me._RENDERER.drawShape(
                        null, newShape,
                        null, item.shapeStyle
                    );

                } else {
                    newElement = me._RENDERER.drawShape(
                        [boundary.getCentroid().x + me._CONFIG.COPY_PASTE_PADDING, boundary.getCentroid().y + me._CONFIG.COPY_PASTE_PADDING],
                        newShape, [boundary.getWidth(), boundary.getHeight()], item.shapeStyle
                    );
                }

                // custom data
                newElement.data = item.data;

                // enable event
                newGuide = me._RENDERER.drawGuide(newElement);
                me.setClickSelectable(newElement, me._isSelectable(newElement.shape));
                me.setMovable(newElement, me._isMovable(newElement.shape));
                me.setConnectGuide(newElement, me._isConnectable(newElement.shape));
                me.setResizable(newElement, newGuide, me._isResizable(newElement.shape));
                if (me._CONFIG.GROUP_DROPABLE && newElement.shape.GROUP_DROPABLE) {
                    me.enableDragAndDropGroup(newElement);
                }
                if (me._CONFIG.GROUP_COLLAPSIBLE && newElement.shape.GROUP_COLLAPSIBLE) {
                    me.enableCollapse(newElement);
                }
                if (me._isConnectable(newElement.shape)) {
                    me.enableConnect(newElement);
                }
                if (me._isLabelEditable(newElement.shape)) {
                    me.enableEditLabel(newElement);
                }

                // copy children
                me._copyChildren(item, newElement);

                selectedElement.push(newElement);
            });
            $(root).data("copied", selectedElement);
        }
    },

    /**
     * 메뉴 : 선택된 Shape 들을 복제한다.
     */
    duplicateSelectedShape: function () {
        var me = this;
        me.copySelectedShape();
        me.pasteSelectedShape();
    },

    /**
     * 메뉴 : 선택된 Shape 들을 그룹핑한다.
     */
    groupSelectedShape: function () {
        var me = this, guide,
            groupElement = me._RENDERER.group($(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "][_selected=true]"));

        if (groupElement) {
            $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "][_selected=true]").each(function (idx, item) {
                me._RENDERER.removeGuide(item);
            });

            guide = me._RENDERER.drawGuide(groupElement);
            if (guide) {
                // enable event
                me.setClickSelectable(groupElement, me._isSelectable(groupElement.shape));
                me.setMovable(groupElement, me._isMovable(groupElement.shape));
                me.setConnectGuide(groupElement, me._isConnectable(groupElement.shape));
                me.setResizable(groupElement, guide, me._isResizable(groupElement.shape));
                if (me._CONFIG.GROUP_DROPABLE && groupElement.shape.GROUP_DROPABLE) {
                    me.enableDragAndDropGroup(groupElement);
                }

                me._RENDERER.removeAllTerminal();
                me._RENDERER.toFront(guide.group);
            }
        }
    },

    /**
     * 메뉴 : 선택된 Shape 들을 그룹해제한다.
     */
    ungroupSelectedShape: function () {
        var me = this, guide,
            ungroupedElements = me._RENDERER.ungroup($(me._RENDERER.getRootElement()).find("[_shape=" + OG.Constants.SHAPE_TYPE.GROUP + "][_selected=true]"));
        $.each(ungroupedElements, function (idx, item) {
            guide = me._RENDERER.drawGuide(item);
            if (guide) {
                me._RENDERER.removeAllTerminal();
                me._RENDERER.toFront(guide.group);
            }
        });
    },

    /**
     * 메뉴 : 선택된 Shape 들을 회전한다.
     *
     * @param {Number} angle 회전각도
     */
    rotateSelectedShape: function (angle) {
        var me = this, guide;
        $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "][_shape=" + OG.Constants.SHAPE_TYPE.EDGE + "][_selected=true]").each(function (idx, edge) {
            me._RENDERER.removeGuide(edge);
        });
        $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "][_selected=true]").each(function (idx, item) {
            if (item.shape && item.shape.TYPE !== OG.Constants.SHAPE_TYPE.EDGE &&
                item.shape.TYPE !== OG.Constants.SHAPE_TYPE.GROUP) {
                me._RENDERER.rotate(item, angle);

                me._RENDERER.removeGuide(item);
                guide = me._RENDERER.drawGuide(item);
                me.setResizable(item, guide, me._isResizable(item.shape));
                me._RENDERER.toFront(guide.group);
            }
        });
    },

    /**
     * 메뉴 : 선택된 Shape 들의 Line Width 를 설정한다.
     *
     * @param {Number} lineWidth
     */
    setLineWidthSelectedShape: function (lineWidth) {
        var me = this;
        $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "][_selected=true]").each(function (idx, item) {
            me._RENDERER.setShapeStyle(item, {"stroke-width": lineWidth});
        });
    },

    /**
     * 메뉴 : 선택된 Shape 들의 Line Color 를 설정한다.
     *
     * @param {String} lineColor
     */
    setLineColorSelectedShape: function (lineColor) {
        var me = this;
        $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "][_selected=true]").each(function (idx, item) {
            me._RENDERER.setShapeStyle(item, {"stroke": lineColor});
        });
    },

    /**
     * 메뉴 : 선택된 Shape 들의 Line Type 을 설정한다.
     *
     * @param {String} lineType ['straight' | 'plain' | 'bezier']
     */
    setLineTypeSelectedShape: function (lineType) {
        var me = this, guide;
        $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "][_shape=" + OG.Constants.SHAPE_TYPE.EDGE + "][_selected=true]").each(function (idx, edge) {
            OG.Util.apply(edge.shape.geom.style.map, {"edge-type": lineType});
            edge.shapeStyle = edge.shapeStyle || {};
            OG.Util.apply(edge.shapeStyle, {"edge-type": lineType});

            me._RENDERER.redrawEdge(edge);

            me._RENDERER.removeGuide(edge);
            guide = me._RENDERER.drawGuide(edge);
            me.setResizable(edge, guide, me._isResizable(edge.shape));
            me._RENDERER.toFront(guide.group);
        });
    },

    /**
     * 메뉴 : 선택된 Shape 들의 Line Style 을 설정한다.
     *
     * @param {String} lineStyle ['' | '-' | '.' | '-.' | '-..' | '. ' | '- ' | '--' | '- .' | '--.' | '--..']
     */
    setLineStyleSelectedShape: function (lineStyle) {
        var me = this;
        $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "][_selected=true]").each(function (idx, item) {
            me._RENDERER.setShapeStyle(item, {"stroke-dasharray": lineStyle});
        });
    },

    /**
     * 메뉴 : 선택된 Edge Shape 들의 시작점 화살표 스타일을 설정한다.
     *
     * @param {String} arrowType ['block' | 'open_block' | 'classic' | 'diamond' | 'open_diamond' | 'open' | 'oval' | 'open_oval']
     */
    setArrowStartSelectedShape: function (arrowType) {
        var me = this;
        $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "][_selected=true]").each(function (idx, item) {
            me._RENDERER.setShapeStyle(item, {"arrow-start": arrowType + '-wide-long'});
        });
    },

    /**
     * 메뉴 : 선택된 Edge Shape 들의 끝점 화살표 스타일을 설정한다.
     *
     * @param {String} arrowType [] ['block' | 'open_block' | 'classic' | 'diamond' | 'open_diamond' | 'open' | 'oval' | 'open_oval']
     */
    setArrowEndSelectedShape: function (arrowType) {
        var me = this;
        $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "][_selected=true]").each(function (idx, item) {
            me._RENDERER.setShapeStyle(item, {"arrow-end": arrowType + '-wide-long'});
        });
    },

    /**
     * 메뉴 : 선택된 Shape 들의 Fill Color 를 설정한다.
     *
     * @param {String} fillColor
     */
    setFillColorSelectedShape: function (fillColor) {
        var me = this;
        $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "][_selected=true]").each(function (idx, item) {
            me._RENDERER.setShapeStyle(item, {"fill": fillColor, "fill-opacity": 1});
        });
    },

    /**
     * 메뉴 : 선택된 Shape 들의 Fill Opacity 를 설정한다.
     *
     * @param {Number} fillOpacity [0 ~ 1]
     */
    setFillOpacitySelectedShape: function (fillOpacity) {
        var me = this;
        $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "][_selected=true]").each(function (idx, item) {
            me._RENDERER.setShapeStyle(item, {"fill-opacity": fillOpacity});
        });
    },

    /**
     * 메뉴 : 선택된 Shape 들의 Font Family 를 설정한다.
     *
     * @param {String} fontFamily
     */
    setFontFamilySelectedShape: function (fontFamily) {
        var me = this;
        $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "][_selected=true]").each(function (idx, item) {
            me._RENDERER.setShapeStyle(item, {"font-family": fontFamily});
        });
    },

    /**
     * 메뉴 : 선택된 Shape 들의 Font Size 를 설정한다.
     *
     * @param {Number} fontSize
     */
    setFontSizeSelectedShape: function (fontSize) {
        var me = this;
        $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "][_selected=true]").each(function (idx, item) {
            me._RENDERER.setShapeStyle(item, {"font-size": fontSize});
        });
    },

    /**
     * 메뉴 : 선택된 Shape 들의 Font Color 를 설정한다.
     *
     * @param {String} fontColor
     */
    setFontColorSelectedShape: function (fontColor) {
        var me = this;
        $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "][_selected=true]").each(function (idx, item) {
            me._RENDERER.setShapeStyle(item, {"font-color": fontColor});
        });
    },

    /**
     * 메뉴 : 선택된 Shape 들의 Font Weight 를 설정한다.
     *
     * @param {String} fontWeight ['bold' | 'normal']
     */
    setFontWeightSelectedShape: function (fontWeight) {
        var me = this;
        $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "][_selected=true]").each(function (idx, item) {
            me._RENDERER.setShapeStyle(item, {"font-weight": fontWeight});
        });
    },

    /**
     * 메뉴 : 선택된 Shape 들의 Font Style 을 설정한다.
     *
     * @param {String} fontStyle ['italic' | 'normal']
     */
    setFontStyleSelectedShape: function (fontStyle) {
        var me = this;
        $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "][_selected=true]").each(function (idx, item) {
            me._RENDERER.setShapeStyle(item, {"font-style": fontStyle});
        });
    },

    /**
     * 메뉴 : 선택된 Shape 들의 Text Decoration 을 설정한다.
     *
     * @param {String} textDecoration ['underline' | 'none']
     */
    setTextDecorationSelectedShape: function (textDecoration) {
        var me = this;
        $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "][_selected=true]").each(function (idx, item) {
            me._RENDERER.setShapeStyle(item, {"text-decoration": textDecoration});
        });
    },

    /**
     * 메뉴 : 선택된 Shape 들의 Label Direction 을 설정한다.
     *
     * @param {String} labelDirection ['vertical' | 'horizontal']
     */
    setLabelDirectionSelectedShape: function (labelDirection) {
        var me = this;
        $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "][_selected=true]").each(function (idx, item) {
            me._RENDERER.setShapeStyle(item, {"label-direction": labelDirection});
        });
    },

    /**
     * 메뉴 : 선택된 Shape 들의 Label Angle 을 설정한다.
     *
     * @param {Number} labelAngle
     */
    setLabelAngleSelectedShape: function (labelAngle) {
        var me = this;
        $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "][_selected=true]").each(function (idx, item) {
            me._RENDERER.setShapeStyle(item, {"label-angle": labelAngle});
        });
    },

    /**
     * 메뉴 : 선택된 Shape 들의 Label Position 을 설정한다.
     *
     * @param {String} labelPosition ['top' | 'bottom' | 'left' | 'right' | 'center']
     */
    setLabelPositionSelectedShape: function (labelPosition) {
        var me = this;
        $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "][_selected=true]").each(function (idx, item) {
            if (labelPosition === 'top') {
                me._RENDERER.setShapeStyle(item, {
                    "label-position": labelPosition,
                    "text-anchor": "middle",
                    "vertical-align": "bottom"
                });
            } else if (labelPosition === 'bottom') {
                me._RENDERER.setShapeStyle(item, {
                    "label-position": labelPosition,
                    "text-anchor": "middle",
                    "vertical-align": "top"
                });
            } else if (labelPosition === 'left') {
                me._RENDERER.setShapeStyle(item, {
                    "label-position": labelPosition,
                    "text-anchor": "end",
                    "vertical-align": "center"
                });
            } else if (labelPosition === 'right') {
                me._RENDERER.setShapeStyle(item, {
                    "label-position": labelPosition,
                    "text-anchor": "start",
                    "vertical-align": "center"
                });
            } else if (labelPosition === 'center') {
                me._RENDERER.setShapeStyle(item, {
                    "label-position": labelPosition,
                    "text-anchor": "middle",
                    "vertical-align": "center"
                });
            }
        });
    },

    /**
     * 메뉴 : 선택된 Shape 들의 라벨 Vertical Align 를 설정한다.
     *
     * @param {String} verticalAlign ['top' | 'middle' | 'bottom']
     */
    setLabelVerticalSelectedShape: function (verticalAlign) {
        var me = this;
        $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "][_selected=true]").each(function (idx, item) {
            me._RENDERER.setShapeStyle(item, {"vertical-align": verticalAlign});
        });
    },

    /**
     * 메뉴 : 선택된 Shape 들의 라벨 Horizontal Align 를 설정한다.
     *
     * @param {String} horizontalAlign ['start' | 'middle' | 'end']
     */
    setLabelHorizontalSelectedShape: function (horizontalAlign) {
        var me = this;
        $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "][_selected=true]").each(function (idx, item) {
            me._RENDERER.setShapeStyle(item, {"text-anchor": horizontalAlign});
        });
    },

    /**
     * 메뉴 : 선택된 Shape 의 라벨을 설정한다.
     *
     * @param {String} label
     */
    setLabelSelectedShape: function (label) {
        var me = this;
        $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "][_selected=true]").each(function (idx, item) {
            me._RENDERER.drawLabel(item, label);
        });
    },

    /**
     * 메뉴 : 선택된 Edge Shape 의 시작점 라벨을 설정한다.
     *
     * @param {String} label
     */
    setEdgeFromLabelSelectedShape: function (label) {
        var me = this;
        $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "][_shape=" + OG.Constants.SHAPE_TYPE.EDGE + "][_selected=true]").each(function (idx, item) {
            me._RENDERER.drawEdgeLabel(item, label, 'FROM');
        });
    },

    /**
     * 메뉴 : 선택된 Edge Shape 의 끝점 라벨을 설정한다.
     *
     * @param {String} label
     */
    setEdgeToLabelSelectedShape: function (label) {
        var me = this;
        $(me._RENDERER.getRootElement()).find("[_type=" + OG.Constants.NODE_TYPE.SHAPE + "][_shape=" + OG.Constants.SHAPE_TYPE.EDGE + "][_selected=true]").each(function (idx, item) {
            me._RENDERER.drawEdgeLabel(item, label, 'TO');
        });
    },

    /**
     * 메뉴 : Zoom In
     */
    zoomIn: function () {
        var me = this;
        if (me._CONFIG.SCALE + me._CONFIG.SCALE * 0.1 <= me._CONFIG.SCALE_MAX) {
            me._RENDERER.setScale(me._CONFIG.SCALE + me._CONFIG.SCALE * 0.1);
        }
    },

    /**
     * 메뉴 : Zoom Out
     */
    zoomOut: function () {
        var me = this;
        if (me._CONFIG.SCALE - me._CONFIG.SCALE * 0.1 >= me._CONFIG.SCALE_MIN) {
            me._RENDERER.setScale(me._CONFIG.SCALE - me._CONFIG.SCALE * 0.1);
        }
    },

    /**
     * 메뉴 : 그려진 Shape 들을 캔버스 사이즈에 맞게 조절한다.
     */
    fitWindow: function () {
        var me = this, container = me._RENDERER.getContainer();
        me._RENDERER.fitCanvasSize([container.clientWidth, container.clientHeight], true);
    },

    /**
     * Edge 와 선택된 Shape 정보들과의 시작, 끝점 연결 정보를 반환한다.
     *
     * @param {Element} edgeEle
     * @param {Array} bBoxArray
     * @return {Object} 연결 정보. {none, all, either, attrEither}
     * @private
     */
    _isContainsConnectedShape: function (edgeEle, bBoxArray) {
        var me = this, fromTerminalId, toTerminalId, fromShape, toShape, isContainsFrom = false, isContainsTo = false, i;

        fromTerminalId = $(edgeEle).attr("_from");
        toTerminalId = $(edgeEle).attr("_to");
        if (fromTerminalId) {
            fromShape = me._getShapeFromTerminal(fromTerminalId);
        }
        if (toTerminalId) {
            toShape = me._getShapeFromTerminal(toTerminalId);
        }

        for (i = 0; i < bBoxArray.length; i++) {
            if (fromShape && bBoxArray[i].id === fromShape.id) {
                isContainsFrom = true;
            }
            if (toShape && bBoxArray[i].id === toShape.id) {
                isContainsTo = true;
            }
        }

        return {
            none: !isContainsFrom && !isContainsTo,
            all: isContainsFrom && isContainsTo,
            any: isContainsFrom || isContainsTo,
            either: (isContainsFrom && !isContainsTo) || (!isContainsFrom && isContainsTo),
            attrEither: (fromTerminalId && !toTerminalId) || (!fromTerminalId && toTerminalId)
        };
    },

    /**
     * 주어진 터미널 정보로 이를 포함하는 Shape 엘리먼트를 반환한다.
     *
     * @param {OG.shape.Terminal} terminal 연결 터미널
     * @return {Element} Shape 엘리먼트
     * @private
     */
    _getShapeFromTerminal: function (terminal) {
        var me = this, terminalId = OG.Util.isElement(terminal) ? terminal.id : terminal;
        return me._RENDERER.getElementById(terminalId.substring(0, terminalId.indexOf(OG.Constants.TERMINAL_SUFFIX.GROUP)));
    },

    /**
     * Page 및 Scroll offset 과 Scale 을 반영한 이벤트의 실제 offset 좌표를 반환한다.
     *
     * @param {Event} event
     * @return {Object} offset 정보. {x, y}
     * @private
     */
    _getOffset: function (event) {
        var me = this, container = me._RENDERER.getContainer();

        return {
            x: (event.pageX - $(container).offset().left + container.scrollLeft) / me._CONFIG.SCALE,
            y: (event.pageY - $(container).offset().top + container.scrollTop) / me._CONFIG.SCALE
        };
    },

    /**
     * 이동할 대상 즉, 선택된 Shape 정보를 반환한다.
     *
     * @return {Array} 선택된 Shape 정보. {id, box}' Array
     * @private
     */
    _getMoveTargets: function () {
        var me = this, bBoxArray = [], box, newBBoxArray = [];
        $(me._RENDERER.getRootElement()).find("[id$=" + OG.Constants.GUIDE_SUFFIX.BBOX + "]").each(function (index, item) {
            if (item.id && item.id.indexOf(OG.Constants.CONNECT_GUIDE_SUFFIX.BBOX) == -1) {
                box = me._RENDERER.clone(item);
                me._RENDERER.setAttr(box, me._CONFIG.DEFAULT_STYLE.GUIDE_SHADOW);

                bBoxArray.push({
                    id: item.id.replace(OG.Constants.GUIDE_SUFFIX.BBOX, ""),
                    box: box
                });
            }
        });

        // Edge 인 경우 먼저 등록, 연결된 Shape 이 있는 경우 목록에서 제거
        $.each(bBoxArray, function (k, item) {
            var ele = me._RENDERER.getElementById(item.id), isContainsResult;
            if ($(ele).attr("_shape") === OG.Constants.SHAPE_TYPE.EDGE) {
                isContainsResult = me._isContainsConnectedShape(ele, bBoxArray);
                if (isContainsResult.all || isContainsResult.none || (isContainsResult.either && isContainsResult.attrEither)) {
                    newBBoxArray.push(item);
                } else {
                    me._RENDERER.remove(item.box);
                    me._RENDERER.removeGuide(ele);
                }
            }
        });

        // Edge 이외 목록에 등록
        $.each(bBoxArray, function (k, item) {
            var ele = me._RENDERER.getElementById(item.id);
            if ($(ele).attr("_shape") !== OG.Constants.SHAPE_TYPE.EDGE) {
                newBBoxArray.push(item);
            }
        });

        return newBBoxArray;
    },

    /**
     * 가로, 세로 Offset 만큼 주어진 Shape을 이동한다.
     *
     * @param {Array} bBoxArray 선택된 Shape 정보. {id, box}' Array
     * @param {Number} dx 가로 Offset
     * @param {Number} dy 세로 Offset
     * @return {Array} 이동된 Shape 정보. {id, box}' Array
     * @private
     */
    _moveElements: function (bBoxArray, dx, dy) {
        var me = this, excludeEdgeId = [], eleArray = [];

        $.each(bBoxArray, function (k, item) {
            var ele = me._RENDERER.getElementById(item.id);
            if ($(ele).attr("_shape") === OG.Constants.SHAPE_TYPE.EDGE) {
                excludeEdgeId.push(item.id);
            }
        });

        $.each(bBoxArray, function (k, item) {
            var ele = me._RENDERER.getElementById(item.id);

            // cloned box 삭제
            me._RENDERER.remove(item.box);

            // 이동
            me._RENDERER.move(ele, [dx, dy], excludeEdgeId);
            me._RENDERER.drawGuide(ele);

            // Edge 인 경우 disconnect 처리(연결된 Shape 이 없는 경우)
            if ($(ele).attr("_shape") === OG.Constants.SHAPE_TYPE.EDGE) {
                if (me._isContainsConnectedShape(ele, bBoxArray).none) {
                    me._RENDERER.disconnect(ele);
                }
            }

            eleArray.push(ele);
        });

        return eleArray;
    },

    /**
     * Canvas 영역을 벗어나서 드래그되는 경우 Canvas 확장한다.
     *
     * @param {Number} currentX
     * @param {Number} currentY
     * @private
     */
    _autoExtend: function (currentX, currentY) {
        var me = this, rootBBox = me._RENDERER.getRootBBox();

        // Canvas 영역을 벗어나서 드래그되는 경우 Canvas 확장
        if (me._CONFIG.AUTO_EXTENSIONAL && rootBBox.width < currentX * me._CONFIG.SCALE) {
            me._RENDERER.setCanvasSize([rootBBox.width + me._CONFIG.AUTO_EXTENSION_SIZE, rootBBox.height]);
        }
        if (me._CONFIG.AUTO_EXTENSIONAL && rootBBox.height < currentY * me._CONFIG.SCALE) {
            me._RENDERER.setCanvasSize([rootBBox.width, rootBBox.height + me._CONFIG.AUTO_EXTENSION_SIZE]);
        }
    },

    /**
     * 그룹 Shape 인 경우 포함된 하위 Shape 들을 복사한다.
     *
     * @param {Element} element 원본 부모 Shape 엘리먼트
     * @param {Element} newCopiedElement 복사된 부모 Shape 엘리먼트
     * @private
     */
    _copyChildren: function (element, newCopiedElement) {
        var me = this, children = element.childNodes;
        $.each(children, function (idx, item) {
            if ($(item).attr("_type") === OG.Constants.NODE_TYPE.SHAPE) {
                // copy
                var boundary = item.shape.geom.getBoundary(), newShape, newElement, newGuide;
                newShape = item.shape.clone();

                if ($(item).attr("_shape") === OG.Constants.SHAPE_TYPE.EDGE) {
                    newShape.geom = new OG.PolyLine(item.shape.geom.getVertices());
                    newShape.geom.style = item.shape.geom.style;
                    newShape.geom.move(me._CONFIG.COPY_PASTE_PADDING, me._CONFIG.COPY_PASTE_PADDING);
                    newElement = me._RENDERER.drawShape(
                        null, newShape,
                        null, item.shapeStyle
                    );

                } else {
                    newElement = me._RENDERER.drawShape(
                        [boundary.getCentroid().x + me._CONFIG.COPY_PASTE_PADDING, boundary.getCentroid().y + me._CONFIG.COPY_PASTE_PADDING],
                        newShape, [boundary.getWidth(), boundary.getHeight()], item.shapeStyle
                    );
                }

                // custom data
                newElement.data = item.data;

                // append child
                newCopiedElement.appendChild(newElement);

                // enable event
                me.setClickSelectable(newElement, me._isSelectable(newElement.shape));
                me.setMovable(newElement, me._isMovable(newElement.shape));
                me.setConnectGuide(newElement, me._isConnectable(newElement.shape));
                if (me._CONFIG.GROUP_DROPABLE && newElement.shape.GROUP_DROPABLE) {
                    me.enableDragAndDropGroup(newElement);
                }
                if (me._CONFIG.GROUP_COLLAPSIBLE && newElement.shape.GROUP_COLLAPSIBLE) {
                    me.enableCollapse(newElement);
                }
                if (me._isConnectable(newElement.shape)) {
                    me.enableConnect(newElement);
                }
                if (me._isLabelEditable(newElement.shape)) {
                    me.enableEditLabel(newElement);
                }

                // recursive call
                if (item.childNodes.length > 0) {
                    me._copyChildren(item, newElement);
                }
            }
        });
    },

    /**
     * 하위 Shape 자식노드를 모두 deselect 처리한다.
     *
     * @param {Element} element
     * @private
     */
    _deselectChildren: function (element) {
        var me = this, children = element.childNodes;
        $.each(children, function (idx, item) {
            if ($(item).attr("_type") === OG.Constants.NODE_TYPE.SHAPE) {
                if (item.childNodes.length > 0) {
                    me._deselectChildren(item);
                }

                if ($(item).attr("_selected") === "true") {
                    me._RENDERER.removeGuide(item);
                    $(item).draggable("destroy");
                }
            }
        });
    },

    /**
     * 선택되어진 Shape 부모노드가 하나라도 있다면 true 를 반환한다.
     *
     * @param {Element} element
     * @return {Boolean}
     * @private
     */
    _isParentSelected: function (element) {
        var me = this, parentNode = element.parentNode;
        if (parentNode) {
            if (me._isParentSelected(parentNode)) {
                return true;
            }

            if ($(parentNode).attr("_type") === OG.Constants.NODE_TYPE.SHAPE &&
                $(parentNode).attr("_selected") === "true") {
                return true;
            }
        }

        return false;
    },

    _num: function (str) {
        return parseInt(str, 10);
    },

    _grid: function (value) {
        var me = this;
        return me._CONFIG.DRAG_GRIDABLE ? OG.Util.roundGrid(value, me._CONFIG.MOVE_SNAP_SIZE) : value;
    },

    _isSelectable: function (shape) {
        var me = this;
        return me._CONFIG.SELECTABLE && shape.SELECTABLE;
    },

    _isConnectable: function (shape) {
        var me = this;
        return me._CONFIG.CONNECTABLE && shape.CONNECTABLE;
    },

    _isSelfConnectable: function (shape) {
        var me = this;
        return me._CONFIG.SELF_CONNECTABLE && shape.SELF_CONNECTABLE;
    },

    _isConnectCloneable: function (shape) {
        var me = this;
        return me._CONFIG.CONNECT_CLONEABLE && shape.CONNECT_CLONEABLE;
    },

    _isConnectRequired: function (shape) {
        var me = this;
        return me._CONFIG.CONNECT_REQUIRED && shape.CONNECT_REQUIRED;
    },

    _isMovable: function (shape) {
        var me = this;
        return (me._CONFIG.SELECTABLE && shape.SELECTABLE) &&
            (me._CONFIG.MOVABLE && me._CONFIG.MOVABLE_[shape.TYPE] && shape.MOVABLE);
    },

    _isResizable: function (shape) {
        var me = this;
        return (me._CONFIG.SELECTABLE && shape.SELECTABLE) &&
            (me._CONFIG.RESIZABLE && me._CONFIG.RESIZABLE_[shape.TYPE] && shape.RESIZABLE);
    },

    _isLabelEditable: function (shape) {
        var me = this;
        return me._CONFIG.LABEL_EDITABLE && me._CONFIG.LABEL_EDITABLE_[shape.TYPE] && shape.LABEL_EDITABLE;
    },


    /**
     * Shape 엘리먼트의 setConnectGuide 에 관련된 이벤트
     *
     * @param {Element} element Shape 엘리먼트
     * @param {Boolean} isConnectable 가능여부
     */
    setConnectGuide: function (element, isConnectable) {
        var me = this, spotBBOX, spots, circleSpots, eventOffset, skipRemove, root = me._RENDERER.getRootGroup();

        //스팟 이동량 보정치의 범위조건을 설정한다.
        //드래그시작시에 한번만 계산된다.
        var calculateSpotCorrectionConditions = function (spot) {

            //이동 딜레이
            var delay = me._CONFIG.EDGE_MOVE_DELAY_SIZE;
            //조건집합
            var correctionConditions = [];
            //스팟 기준으로 이웃한 변곡점
            var reativePoints = [];
            var type = $(spot).data('type');
            var vertices = element.shape.geom.getVertices();

            //서클타입 스팟인 경우 이웃한 변곡점 집합
            if (type === OG.Constants.CONNECT_GUIDE_SUFFIX.SPOT_CIRCLE) {
                var index = $(spot).data('index');
                if (vertices[index - 1]) {
                    reativePoints.push(vertices[index - 1]);
                }
                if (vertices[index + 1]) {
                    reativePoints.push(vertices[index + 1]);
                }
            }

            //사각타입 스팟인 경우 선분의 양 변곡과 그 이웃한 변곡의 집합.
            if (type === OG.Constants.CONNECT_GUIDE_SUFFIX.SPOT_RECT) {
                var prev = $(spot).data('prev');
                var next = $(spot).data('next');
                if (vertices[prev - 1]) {
                    reativePoints.push(vertices[prev - 1]);
                }
                if (vertices[prev]) {
                    reativePoints.push(vertices[prev]);
                }
                if (vertices[next]) {
                    reativePoints.push(vertices[next]);
                }
                if (vertices[next + 1]) {
                    reativePoints.push(vertices[next + 1]);
                }
            }
            //변곡점 보정치 조건은 x 또는 y 가 일치할 경우
            $.each(reativePoints, function (idx, point) {
                correctionConditions.push({
                    condition: {
                        minX: point.x - delay,
                        maxX: point.x + delay,
                    },
                    fixedPosition: {
                        x: point.x
                    },
                    id: idx
                });
                correctionConditions.push({
                    condition: {
                        minY: point.y - delay,
                        maxY: point.y + delay,
                    },
                    fixedPosition: {
                        y: point.y
                    },
                    id: idx
                });
            })

            // spot 에 데이터 저장
            $(spot).data('correctionConditions', correctionConditions);

        }

        //스팟이 가지고있는 범위조건에 따라 새로운 포지션을 계산한다.
        var correctionConditionAnalysis = function (spot, offset) {
            var fixedPosition = {
                x: offset.x,
                y: offset.y
            };
            var calculateFixedPosition = function (expectedPosition) {
                if (!expectedPosition) {
                    return fixedPosition;
                }
                if (expectedPosition.x && !expectedPosition.y) {
                    return {
                        x: expectedPosition.x,
                        y: fixedPosition.y
                    }
                }
                if (expectedPosition.y && !expectedPosition.x) {
                    return {
                        x: fixedPosition.x,
                        y: expectedPosition.y
                    }
                }
                if (expectedPosition.x && expectedPosition.y) {
                    return expectedPosition;
                }
                return fixedPosition;
            };
            var correctionConditions = $(spot).data('correctionConditions');
            if (!correctionConditions) {
                return fixedPosition;
            }

            var conditionsPassCandidates = [];
            $.each(correctionConditions, function (index, correctionCondition) {
                var condition = correctionCondition.condition;

                var conditionsPass = true;
                if (condition.minX) {
                    if (offset.x < condition.minX) {
                        conditionsPass = false;
                    }
                }
                if (condition.maxX) {
                    if (offset.x > condition.maxX) {
                        conditionsPass = false;
                    }
                }
                if (condition.minY) {
                    if (offset.y < condition.minY) {
                        conditionsPass = false;
                    }
                }
                if (condition.maxY) {
                    if (offset.y > condition.maxY) {
                        conditionsPass = false;
                    }
                }

                if (conditionsPass) {
                    conditionsPassCandidates.push(correctionCondition);
                }
            })
            if (conditionsPassCandidates.length === 0) {
                return fixedPosition;
            }
            if (conditionsPassCandidates.length === 1) {
                $(spot).data('lastCorrectionId', conditionsPassCandidates[0].id);
                return calculateFixedPosition(conditionsPassCandidates[0].fixedPosition);
            }
            if (conditionsPassCandidates.length > 1) {

                //범위조건 후보군들이 중복된 x좌표나 중복된 y좌표를 가지고 있지 않을경우,
                //각자가 가지고 있는 x,y 모두 충족하는 좌표를 되돌려준다.
                var IntersectionPosition = {};
                var isIntersection = false;
                $.each(conditionsPassCandidates, function (idx, correctionCondition) {
                    if (correctionCondition.fixedPosition.x) {
                        if (IntersectionPosition.x) {
                            isIntersection = true;
                        } else {
                            IntersectionPosition.x = correctionCondition.fixedPosition.x
                        }
                    }
                    if (correctionCondition.fixedPosition.y) {
                        if (IntersectionPosition.y) {
                            isIntersection = true;
                        } else {
                            IntersectionPosition.y = correctionCondition.fixedPosition.y
                        }
                    }
                });
                if (!isIntersection) {
                    return calculateFixedPosition(IntersectionPosition);
                }

                //범위조건 후보군들이 중복된 x좌표나 중복된 y좌표를 가지고 있을 경우,하나의 범위조건을 되돌린다.
                //후보 선정 기준은 마지막 사용된 범위조건의 캐쉬값이다.
                var selectedCorrection;
                var lastCorrectionId = $(spot).data('lastCorrectionId');
                if (lastCorrectionId) {
                    $.each(conditionsPassCandidates, function (idx, correctionCondition) {
                        if (correctionCondition.id === lastCorrectionId) {
                            selectedCorrection = correctionCondition;
                        }
                    });
                    if (!selectedCorrection) {
                        selectedCorrection = conditionsPassCandidates[0];
                    }
                } else {
                    selectedCorrection = conditionsPassCandidates[0];
                }
                return calculateFixedPosition(selectedCorrection.fixedPosition);
            }
        }

        $(element).bind({
            mousemove: function (event) {
                if ($(root).data(OG.Constants.CONNECT_GUIDE_SUFFIX.SPOT_EVENT_MOUSEROVER)
                    || $(root).data(OG.Constants.CONNECT_GUIDE_SUFFIX.SPOT_EVENT_DRAG)
                ) {
                    return;
                }

                if ($(element).attr("_shape") === OG.Constants.SHAPE_TYPE.EDGE) {
                    eventOffset = me._getOffset(event);
                    var virtualSpot = me._RENDERER.createVirtualSpot(eventOffset.x, eventOffset.y, element);
                    if (virtualSpot) {

                        $(virtualSpot).bind({
                            mousedown: function () {
                                $(root).data(OG.Constants.CONNECT_GUIDE_SUFFIX.SPOT_EVENT_MOUSEROVER, true);
                            },
                            mouseup: function () {
                                $(root).data(OG.Constants.CONNECT_GUIDE_SUFFIX.SPOT_EVENT_MOUSEROVER, false);
                            }
                        });

                        $(virtualSpot).draggable({
                            start: function (event) {
                                $(root).data(OG.Constants.CONNECT_GUIDE_SUFFIX.SPOT_EVENT_DRAG, true);

                                var eventOffset = me._getOffset(event);
                                var vertice = $(this).data('vertice');
                                $(this).data('offset', {
                                    x: eventOffset.x - vertice.x,
                                    y: eventOffset.y - vertice.y
                                });

                                var prev = $(this).data('prev');
                                var next = $(this).data('next');
                                var vertices = element.shape.geom.getVertices();

                                var offset = $(this).data('offset');
                                var newX = eventOffset.x - offset.x;
                                var newY = eventOffset.y - offset.y;
                                var newVertice = element.shape.geom.convertCoordinate([newX, newY]);

                                //기존 변곡점 스팟들의 인덱스값을 업데이트한다.
                                circleSpots = me._RENDERER.getCircleSpots(element);
                                $.each(circleSpots, function (index, circleSpot) {
                                    var circleSpotIndex = $(circleSpot).data('index');
                                    if (circleSpotIndex >= next) {
                                        $(circleSpot).data('index', circleSpotIndex + 1);
                                    }
                                });

                                //Edge 의 geometry 의 vertieces를 업데이트한다.
                                vertices.splice(next, 0, newVertice);
                                element.shape.geom.setVertices(vertices);

                                //가상스팟을 고정스팟으로 변경한다.
                                $(this).attr('name', OG.Constants.CONNECT_GUIDE_SUFFIX.SPOT);
                                $(this).data('index', next);
                                $(this).data('corrections', calculateSpotCorrectionConditions(virtualSpot));


                                element = me._RENDERER.drawEdge(new OG.PolyLine(vertices), element.shape.geom.style, element.id);

                                me._RENDERER.removeRubberBand(me._RENDERER.getRootElement());
                            },
                            drag: function (event) {

                                var eventOffset = me._getOffset(event);
                                var offset = $(this).data("offset");
                                var newX = eventOffset.x - offset.x;
                                var newY = eventOffset.y - offset.y;
                                var vertices = element.shape.geom.getVertices();

                                var analysisPosition = correctionConditionAnalysis(virtualSpot, {x: newX, y: newY});
                                newX = analysisPosition.x;
                                newY = analysisPosition.y;

                                me._RENDERER.setAttr(virtualSpot, {cx: newX});
                                me._RENDERER.setAttr(virtualSpot, {cy: newY});

                                var index = $(this).data("index");

                                vertices[index].x = newX;
                                vertices[index].y = newY;

                                element = me._RENDERER.drawEdge(new OG.PolyLine(vertices), element.shape.geom.style, element.id);

                                me._RENDERER.removeAllTerminal();

                                // Draw Label
                                me._RENDERER.drawLabel(element);
                                me._RENDERER.drawEdgeLabel(element, null, 'FROM');
                                me._RENDERER.drawEdgeLabel(element, null, 'TO');
                            },
                            stop: function (event) {

                                //두가지 이벤트 모두 off 하는 이유가 있으니 나중에라도 이상히 여기지 말자.
                                //드래그 플로우를 타면 mouseup eventfire 가 일어나지 않기 때문.
                                $(root).data(OG.Constants.CONNECT_GUIDE_SUFFIX.SPOT_EVENT_DRAG, false);
                                $(root).data(OG.Constants.CONNECT_GUIDE_SUFFIX.SPOT_EVENT_MOUSEROVER, false);

                                var eventOffset = me._getOffset(event);
                                var offset = $(this).data("offset");
                                var index = $(this).data("index");
                                var newX = eventOffset.x - offset.x;
                                var newY = eventOffset.y - offset.y;
                                var vertices = element.shape.geom.getVertices();

                                var analysisPosition = correctionConditionAnalysis(virtualSpot, {x: newX, y: newY});
                                newX = analysisPosition.x;
                                newY = analysisPosition.y;

                                vertices[index].x = newX;
                                vertices[index].y = newY;

                                element = me._RENDERER.drawEdge(new OG.PolyLine(vertices), element.shape.geom.style, element.id);

                                me._RENDERER.removeAllTerminal();

                                // Draw Label
                                me._RENDERER.drawLabel(element);
                                me._RENDERER.drawEdgeLabel(element, null, 'FROM');
                                me._RENDERER.drawEdgeLabel(element, null, 'TO')

                                me._RENDERER.removeConnectGuide(element);
                                me._RENDERER.removeVirtualSpot(element);
                                me._RENDERER.trimSpot(element);
                            }
                        });
                    }
                }
            },
            mouseout: function (event) {
                if ($(element).attr("_shape") === OG.Constants.SHAPE_TYPE.EDGE) {
                    //스팟이 선택되어 바운더리 영역 밖으로 나갔다고 판단될 경우 예외처리한다.
                    skipRemove = false;
                    eventOffset = me._getOffset(event);
                    spots = me._RENDERER.getSpots(element);
                    $(spots).each(function (index, spot) {
                        spotBBOX = me._RENDERER.getBBox(spot);
                        if (eventOffset.x >= spotBBOX.x && eventOffset.x <= spotBBOX.x2
                            && eventOffset.y >= spotBBOX.y && eventOffset.y <= spotBBOX.y2) {
                            skipRemove = true;
                        }
                    })

                    //가상스팟이 선택되어 바운더리 영역 밖으로 나갔다고 판단될 경우 예외처리한다.
                    var virtualSpot = me._RENDERER.getVirtualSpot(element);
                    if (virtualSpot) {
                        spotBBOX = me._RENDERER.getBBox(virtualSpot);
                        if (eventOffset.x >= spotBBOX.x && eventOffset.x <= spotBBOX.x2
                            && eventOffset.y >= spotBBOX.y && eventOffset.y <= spotBBOX.y2) {
                            skipRemove = true;
                        }
                    }

                    //스팟이 드래그중일경우 예외처리한다.
                    if ($(root).data(OG.Constants.CONNECT_GUIDE_SUFFIX.SPOT_EVENT_DRAG)) {
                        skipRemove = true;
                    }

                    if (!skipRemove) {
                        me._RENDERER.removeConnectGuide(element);
                        me._RENDERER.removeVirtualSpot(element);
                    }

                } else {
                    me._RENDERER.removeConnectGuide(element);
                }
            },
            mouseover: function () {
                //다른 Edge의 Spot이 드래그중일때 커넥트가이드 생성을 막는다.
                if ($(root).data(OG.Constants.CONNECT_GUIDE_SUFFIX.SPOT_EVENT_DRAG)) {
                    return;
                }
                var guide = me._RENDERER.drawConnectGuide(element);
                if (guide && guide.spots) {

                    $(guide.spots).each(function (index, spot) {
                        $(spot).bind({
                            mouseover: function () {
                                var skipRemove = false;

                                //드래그중일때는 예외처리한다.
                                if ($(root).data(OG.Constants.CONNECT_GUIDE_SUFFIX.SPOT_EVENT_DRAG)) {
                                    skipRemove = true;
                                }
                                if (!skipRemove) {
                                    me._RENDERER.selectSpot(spot);
                                    $(root).data(OG.Constants.CONNECT_GUIDE_SUFFIX.SPOT_EVENT_MOUSEROVER, true);
                                }
                            },
                            mouseout: function () {

                                var skipRemove = false;

                                //드래그중일때는 예외처리한다.
                                if ($(root).data(OG.Constants.CONNECT_GUIDE_SUFFIX.SPOT_EVENT_DRAG)) {
                                    skipRemove = true;
                                }
                                if (!skipRemove) {
                                    //me._RENDERER.remove(spot);
                                    $(root).data(OG.Constants.CONNECT_GUIDE_SUFFIX.SPOT_EVENT_MOUSEROVER, false);
                                }
                            }
                        });

                        $(spot).draggable({
                            start: function (event) {
                                $(root).data(OG.Constants.CONNECT_GUIDE_SUFFIX.SPOT_EVENT_DRAG, true);

                                var eventOffset = me._getOffset(event);
                                var vertice = $(this).data("vertice");
                                $(this).data("offset", {
                                    x: eventOffset.x - vertice.x,
                                    y: eventOffset.y - vertice.y
                                });

                                if ($(this).data('type') === OG.Constants.CONNECT_GUIDE_SUFFIX.SPOT_CIRCLE) {
                                    $(this).data('corrections', calculateSpotCorrectionConditions(spot));
                                    me._RENDERER.remove(guide.bBox);
                                    me._RENDERER.removeRubberBand(me._RENDERER.getRootElement());
                                }

                                if ($(this).data('type') === OG.Constants.CONNECT_GUIDE_SUFFIX.SPOT_RECT) {
                                    var prev = $(this).data('prev');
                                    var next = $(this).data('next');
                                    var vertices = element.shape.geom.getVertices();

                                    if (prev === 0) {
                                        var newPreVertice =
                                            element.shape.geom.convertCoordinate([vertices[0].x, vertices[0].y]);
                                        vertices.splice(prev, 0, newPreVertice);
                                        $(this).data('prev', prev + 1);
                                        $(this).data('next', next + 1);
                                        next = next + 1;
                                    }
                                    if (next === vertices.length - 1) {
                                        var newNextVertice =
                                            element.shape.geom.convertCoordinate(
                                                [vertices[vertices.length - 1].x, vertices[vertices.length - 1].y]);
                                        vertices.splice(next, 0, newNextVertice);
                                    }

                                    //Edge 의 geometry 의 vertieces를 업데이트한다.
                                    element.shape.geom.setVertices(vertices);
                                    $(this).data('corrections', calculateSpotCorrectionConditions(spot));
                                    //element = me._RENDERER.drawEdge(new OG.PolyLine(vertices), element.shape.geom.style, element.id);
                                    me._RENDERER.remove(guide.bBox);
                                    me._RENDERER.removeRubberBand(me._RENDERER.getRootElement());
                                }
                            },
                            drag: function (event) {
                                var eventOffset = me._getOffset(event);
                                var offset = $(this).data("offset");
                                var newX = eventOffset.x - offset.x;
                                var newY = eventOffset.y - offset.y;
                                var vertices = element.shape.geom.getVertices();

                                var analysisPosition = correctionConditionAnalysis(spot, {x: newX, y: newY});

                                if ($(this).data('type') === OG.Constants.CONNECT_GUIDE_SUFFIX.SPOT_CIRCLE) {
                                    newX = analysisPosition.x;
                                    newY = analysisPosition.y;

                                    me._RENDERER.setAttr(spot, {cx: newX});
                                    me._RENDERER.setAttr(spot, {cy: newY});

                                    var index = $(this).data("index");
                                    vertices[index].x = newX;
                                    vertices[index].y = newY;
                                }
                                if ($(this).data('type') === OG.Constants.CONNECT_GUIDE_SUFFIX.SPOT_RECT) {
                                    var spotRectStyle = me._CONFIG.DEFAULT_STYLE.CONNECT_GUIDE_SPOT_RECT;
                                    var height = spotRectStyle.h;
                                    var direction = $(this).data('direction');
                                    var prev = $(this).data("prev");
                                    var next = $(this).data("next");
                                    if(direction === 'vertical'){
                                        vertices[prev].x = newX;
                                        vertices[next].x = newX;
                                        me._RENDERER.setAttr(spot, {x: newX - (height/2)});
                                    }
                                    if(direction === 'horizontal'){
                                        vertices[prev].y = newY;
                                        vertices[next].y = newY;
                                        me._RENDERER.setAttr(spot, {y: newY - (height/2)});
                                    }
                                }

                                element = me._RENDERER.drawEdge(new OG.PolyLine(vertices), element.shape.geom.style, element.id);

                                me._RENDERER.removeAllTerminal();

                                // Draw Label
                                me._RENDERER.drawLabel(element);
                                me._RENDERER.drawEdgeLabel(element, null, 'FROM');
                                me._RENDERER.drawEdgeLabel(element, null, 'TO');
                            },
                            stop: function (event) {
                                $(root).data(OG.Constants.CONNECT_GUIDE_SUFFIX.SPOT_EVENT_DRAG, false);
                                var eventOffset = me._getOffset(event);
                                var offset = $(this).data("offset");
                                var index = $(this).data("index");
                                var newX = eventOffset.x - offset.x;
                                var newY = eventOffset.y - offset.y;
                                var vertices = element.shape.geom.getVertices();

                                var analysisPosition = correctionConditionAnalysis(spot, {x: newX, y: newY});
                                if ($(this).data('type') === OG.Constants.CONNECT_GUIDE_SUFFIX.SPOT_CIRCLE) {
                                    newX = analysisPosition.x;
                                    newY = analysisPosition.y;

                                    me._RENDERER.setAttr(spot, {cx: newX});
                                    me._RENDERER.setAttr(spot, {cy: newY});

                                    var index = $(this).data("index");
                                    vertices[index].x = newX;
                                    vertices[index].y = newY;
                                }
                                if ($(this).data('type') === OG.Constants.CONNECT_GUIDE_SUFFIX.SPOT_RECT) {
                                    var spotRectStyle = me._CONFIG.DEFAULT_STYLE.CONNECT_GUIDE_SPOT_RECT;
                                    var height = spotRectStyle.h;
                                    var direction = $(this).data('direction');
                                    var prev = $(this).data("prev");
                                    var next = $(this).data("next");
                                    if(direction === 'vertical'){
                                        vertices[prev].x = newX;
                                        vertices[next].x = newX;
                                        me._RENDERER.setAttr(spot, {x: newX - (height/2)});
                                    }
                                    if(direction === 'horizontal'){
                                        vertices[prev].y = newY;
                                        vertices[next].y = newY;
                                        me._RENDERER.setAttr(spot, {y: newY - (height/2)});
                                    }
                                }

                                element = me._RENDERER.drawEdge(new OG.PolyLine(vertices), element.shape.geom.style, element.id);

                                me._RENDERER.removeAllTerminal();

                                // Draw Label
                                me._RENDERER.drawLabel(element);
                                me._RENDERER.drawEdgeLabel(element, null, 'FROM');
                                me._RENDERER.drawEdgeLabel(element, null, 'TO')

                                me._RENDERER.removeConnectGuide(element);
                                me._RENDERER.removeVirtualSpot(element);
                                me._RENDERER.trimSpot(element);
                            }
                        });

                    })
                }
            }
        })

    }
};
OG.handler.EventHandler.prototype.constructor = OG.handler.EventHandler;
OG.EventHandler = OG.handler.EventHandler;