'use strict';

/*global require*/
//var CameraFlightPath = require('terriajs-cesium/Source/Scene/CameraFlightPath');
//var Cartesian2 = require('terriajs-cesium/Source/Core/Cartesian2');
//var Cartesian3 = require('terriajs-cesium/Source/Core/Cartesian3');
//var CesiumMath = require('terriajs-cesium/Source/Core/Math');
////var defined = require('terriajs-cesium/Source/Core/defined');
//var Ellipsoid = require('terriajs-cesium/Source/Core/Ellipsoid');
//var getTimestamp = require('terriajs-cesium/Source/Core/getTimestamp');
//requirejs(['Knockout'], function(){});
////var knockout = require('Knockout');
//var Matrix4 = require('terriajs-cesium/Source/Core/Matrix4');
//var Ray = require('terriajs-cesium/Source/Core/Ray');
//var Transforms = require('terriajs-cesium/Source/Core/Transforms');

//var loadView = require('loadView');
//var ResetViewNavigationControl = require('ResetViewNavigationControl');
//var ZoomInNavigationControl = require('ZoomInNavigationControl');
//var ZoomOutNavigationControl = require('ZoomOutNavigationControl');
//
//var svgCompassOuterRing = require('svgCompassOuterRing');
//var svgCompassGyro = require('svgCompassGyro');
//var svgCompassRotationMarker = require('svgCompassRotationMarker');
define('NavigationViewModel', ['Knockout', 'loadView', 'inherit', 'ResetViewNavigationControl', 'ZoomInNavigationControl', 'ZoomOutNavigationControl', 'svgCompassOuterRing', 'svgCompassGyro', 'svgCompassRotationMarker'], function (Knockout, loadView, inherit, ResetViewNavigationControl, ZoomInNavigationControl, ZoomOutNavigationControl, svgCompassOuterRing, svgCompassGyro, svgCompassRotationMarker)

//define('NavigationViewModel', ['Knockout', 'loadView', 'inherit', 'ResetViewNavigationControl', 'ZoomInNavigationControl', 'ZoomOutNavigationControl', 'svgCompassOuterRing', 'svgCompassGyro', 'svgCompassRotationMarker', 'navigatorTemplate'], function (Knockout, loadView, inherit, ResetViewNavigationControl, ZoomInNavigationControl, ZoomOutNavigationControl, svgCompassOuterRing, svgCompassGyro, svgCompassRotationMarker, navigatorTemplate)
{




    var NavigationViewModel = function (options) {

        this.terria = options.terria;
        this.eventHelper = new Cesium.EventHelper();

        this.controls = options.controls;
        if (!Cesium.defined(this.controls)) {
            this.controls = [
                new ZoomInNavigationControl(this.terria),
                new ResetViewNavigationControl(this.terria),
                new ZoomOutNavigationControl(this.terria)
            ];
        }

        this.svgCompassOuterRing = svgCompassOuterRing;
        this.svgCompassGyro = svgCompassGyro;
        this.svgCompassRotationMarker = svgCompassRotationMarker;

        this.showCompass = Cesium.defined(this.terria);
        this.heading = this.showCompass ? this.terria.scene.camera.heading : 0.0;

        this.isOrbiting = false;
        this.orbitCursorAngle = 0;
        this.orbitCursorOpacity = 0.0;
        this.orbitLastTimestamp = 0;
        this.orbitFrame = undefined;
        this.orbitIsLook = false;
        this.orbitMouseMoveFunction = undefined;
        this.orbitMouseUpFunction = undefined;

        this.isRotating = false;
        this.rotateInitialCursorAngle = undefined;
        this.rotateFrame = undefined;
        this.rotateIsLook = false;
        this.rotateMouseMoveFunction = undefined;
        this.rotateMouseUpFunction = undefined;

        this._unsubcribeFromPostRender = undefined;

        Knockout.track(this, ['controls', 'showCompass', 'heading', 'isOrbiting', 'orbitCursorAngle', 'isRotating']);

        var that = this;

        function viewerChange() {
            if (Cesium.defined(that.terria)) {
                if (that._unsubcribeFromPostRender) {
                    that._unsubcribeFromPostRender();
                    that._unsubcribeFromPostRender = undefined;
                }

                that.showCompass = true;

                that._unsubcribeFromPostRender = that.terria.scene.postRender.addEventListener(function () {
                    that.heading = that.terria.scene.camera.heading;
                });
            } else {
                if (that._unsubcribeFromPostRender) {
                    that._unsubcribeFromPostRender();
                    that._unsubcribeFromPostRender = undefined;
                }
                that.showCompass = false;
            }
        }
        this.eventHelper.add(this.terria.afterViewerChanged, viewerChange, this);
        //this.terria.afterViewerChanged.addEventListener(viewerChange);

        viewerChange();
    };


    NavigationViewModel.prototype.destroy = function () {

        this.eventHelper.removeAll();

        //loadView(require('fs').readFileSync(baseURLEmpCesium + 'js-lib/terrajs/lib/Views/Navigation.html', 'utf8'), container, this);

    };

    NavigationViewModel.prototype.show = function (container) {
        var testing = '<div class="compass" title="Drag outer ring: rotate view. ' +
'Drag inner gyroscope: free orbit.' +
'Double-click: reset view.' +
'TIP: You can also free orbit by holding the CTRL key and dragging the map." data-bind="visible: showCompass, event: { mousedown: handleMouseDown, dblclick: handleDoubleClick }">' +
    '<div class="compass-outer-ring-background"></div>' +
   ' <div class="compass-rotation-marker" data-bind="visible: isOrbiting, style: { transform: \'rotate(-\' + orbitCursorAngle + \'rad)\', \'-webkit-transform\': \'rotate(-\' + orbitCursorAngle + \'rad)\', opacity: orbitCursorOpacity }, cesiumSvgPath: { path: svgCompassRotationMarker, width: 145, height: 145 }"></div>' +
   ' <div class="compass-outer-ring" title="Click and drag to rotate the camera" data-bind="style: { transform: \'rotate(-\' + heading + \'rad)\', \'-webkit-transform\': \'rotate(-\' + heading + \'rad)\' }, cesiumSvgPath: { path: svgCompassOuterRing, width: 145, height: 145 }"></div>' +
   ' <div class="compass-gyro-background"></div>' +
   ' <div class="compass-gyro" data-bind="cesiumSvgPath: { path: svgCompassGyro, width: 145, height: 145 }, css: { \'compass-gyro-active\': isOrbiting }"></div>' +
'</div>' +
'<div class="navigation-controls">' +
    '<!-- ko foreach: controls -->' +
    '<div data-bind="click: activate, attr: { title: $data.name }, css: $root.isLastControl($data) ? \'navigation-control-last\' : \'navigation-control\' ">' +
     '   <!-- ko if: $data.hasText -->' +
     '   <div data-bind="text: $data.text, css: $data.isActive ?  \'navigation-control-icon-active \' + $data.cssClass : $data.cssClass"></div>' +
     '   <!-- /ko -->' +
      '  <!-- ko ifnot: $data.hasText -->' +
      '  <div data-bind="cesiumSvgPath: { path: $data.svgIcon, width: $data.svgWidth, height: $data.svgHeight }, css: $data.isActive ?  \'navigation-control-icon-active \' + $data.cssClass : $data.cssClass"></div>' +
      '  <!-- /ko -->' +
   ' </div>' +
   ' <!-- /ko -->' +
'</div>';
        loadView(testing, container, this);
        // loadView(navigatorTemplate, container, this);
        //loadView(require('fs').readFileSync(baseURLEmpCesium + 'js-lib/terrajs/lib/Views/Navigation.html', 'utf8'), container, this);

    };

    /**
     * Adds a control to this toolbar.
     * @param {NavControl} The control to add.
     */
    NavigationViewModel.prototype.add = function (control) {
        this.controls.push(control);
    };

    /**
     * Removes a control from this toolbar.
     * @param {NavControl} The control to remove.
     */
    NavigationViewModel.prototype.remove = function (control) {
        this.controls.remove(control);
    };

    /**
     * Checks if the control given is the last control in the control array.
     * @param {NavControl} The control to remove.
     */
    NavigationViewModel.prototype.isLastControl = function (control) {
        return (control === this.controls[this.controls.length - 1]);
    };

    var vectorScratch = new Cesium.Cartesian2();

    NavigationViewModel.prototype.handleMouseDown = function (viewModel, e) {
        var compassElement = e.currentTarget;
        var compassRectangle = e.currentTarget.getBoundingClientRect();
        var maxDistance = compassRectangle.width / 2.0;
        var center = new Cesium.Cartesian2((compassRectangle.right - compassRectangle.left) / 2.0, (compassRectangle.bottom - compassRectangle.top) / 2.0);
        var clickLocation = new Cesium.Cartesian2(e.clientX - compassRectangle.left, e.clientY - compassRectangle.top);
        var vector = Cesium.Cartesian2.subtract(clickLocation, center, vectorScratch);
        var distanceFromCenter = Cesium.Cartesian2.magnitude(vector);

        var distanceFraction = distanceFromCenter / maxDistance;

        var nominalTotalRadius = 145;
        var norminalGyroRadius = 50;

        if (distanceFraction < norminalGyroRadius / nominalTotalRadius) {
            orbit(this, compassElement, vector);
        } else if (distanceFraction < 1.0) {
            rotate(this, compassElement, vector);
        } else {
            return true;
        }
    };

    var oldTransformScratch = new Cesium.Matrix4();
    var newTransformScratch = new Cesium.Matrix4();
    var centerScratch = new Cesium.Cartesian3();
    var windowPositionScratch = new Cesium.Cartesian2();

    NavigationViewModel.prototype.handleDoubleClick = function (viewModel, e) {
        var scene = this.terria.scene;
        var camera = scene.camera;

        var windowPosition = windowPositionScratch;
        windowPosition.x = scene.canvas.clientWidth / 2;
        windowPosition.y = scene.canvas.clientHeight / 2;
        
        var center = camera.pickEllipsoid(windowPosition, scene.globe.ellipsoid, centerScratch);
        
        if (!Cesium.defined(center)) {
            // Globe is barely visible, so reset to home view.

            this.controls[1].resetView();
            return;
        }

        var rotateFrame = Cesium.Transforms.eastNorthUpToFixedFrame(center, scene.globe.ellipsoid);

        var cameraPosition = scene.globe.ellipsoid.cartographicToCartesian(camera.positionCartographic, new Cesium.Cartesian3());
        var lookVector = Cesium.Cartesian3.subtract(center, cameraPosition, new Cesium.Cartesian3());

        var destination = Cesium.Matrix4.multiplyByPoint(rotateFrame, new Cesium.Cartesian3(0, 0, Cesium.Cartesian3.magnitude(lookVector)), new Cesium.Cartesian3());

        // quick&dirty workaround to avoid bug in flyTo (https://github.com/AnalyticalGraphicsInc/cesium/issues/3457)
        // should be removed when bug is fixed (most probably in next release)
        if(scene.mode === Cesium.SceneMode.SCENE2D) {
            camera.position.x += 10;
        }

        camera.flyTo({
            destination: destination,
            duration: 1.5
        });
    };

    NavigationViewModel.create = function (options) {
        var result = new NavigationViewModel(options);
        result.show(options.container);
        return result;
    };

    function orbit(viewModel, compassElement, cursorVector) {
        // Remove existing event handlers, if any.
        document.removeEventListener('mousemove', viewModel.orbitMouseMoveFunction, false);
        document.removeEventListener('mouseup', viewModel.orbitMouseUpFunction, false);

        if (Cesium.defined(viewModel.orbitTickFunction)) {
            viewModel.terria.clock.onTick.removeEventListener(viewModel.orbitTickFunction);
        }

        viewModel.orbitMouseMoveFunction = undefined;
        viewModel.orbitMouseUpFunction = undefined;
        viewModel.orbitTickFunction = undefined;

        viewModel.isOrbiting = true;
        viewModel.orbitLastTimestamp = Cesium.getTimestamp();

        var scene = viewModel.terria.scene;
        var camera = scene.camera;

        var windowPosition = windowPositionScratch;
        windowPosition.x = scene.canvas.clientWidth / 2;
        windowPosition.y = scene.canvas.clientHeight / 2;

        var center = camera.pickEllipsoid(windowPosition, scene.globe.ellipsoid, centerScratch);

        if (!Cesium.defined(center)) {
            viewModel.orbitFrame = Cesium.Transforms.eastNorthUpToFixedFrame(camera.positionWC, scene.globe.ellipsoid, newTransformScratch);
            viewModel.orbitIsLook = true;
        } else {
            viewModel.orbitFrame = Cesium.Transforms.eastNorthUpToFixedFrame(center, scene.globe.ellipsoid, newTransformScratch);
            viewModel.orbitIsLook = false;
        }

        viewModel.orbitTickFunction = function (e) {
            var timestamp = Cesium.getTimestamp();
            var deltaT = timestamp - viewModel.orbitLastTimestamp;
            var rate = (viewModel.orbitCursorOpacity - 0.5) * 2.5 / 1000;
            var distance = deltaT * rate;

            var angle = viewModel.orbitCursorAngle + Cesium.Math.PI_OVER_TWO;
            var x = Math.cos(angle) * distance;
            var y = Math.sin(angle) * distance;

            var scene = viewModel.terria.scene;
            var camera = scene.camera;

            var oldTransform = Cesium.Matrix4.clone(camera.transform, oldTransformScratch);

            camera.lookAtTransform(viewModel.orbitFrame);

            if (viewModel.orbitIsLook) {
                camera.look(Cesium.Cartesian3.UNIT_Z, -x);

                // do not look up/down in 2D mode
                if(scene.mode !== Cesium.SceneMode.SCENE2D) {
                    camera.look(camera.right, -y);
                }
            } else {
                camera.rotateLeft(x);

                // do not look up/down in 2D mode
                if(scene.mode !== Cesium.SceneMode.SCENE2D) {
                    camera.rotateUp(y);
                }
            }

            camera.lookAtTransform(oldTransform);

            // viewModel.terria.cesium.notifyRepaintRequired();

            viewModel.orbitLastTimestamp = timestamp;
        };

        function updateAngleAndOpacity(vector, compassWidth) {
            var angle = Math.atan2(-vector.y, vector.x);
            viewModel.orbitCursorAngle = Cesium.Math.zeroToTwoPi(angle - Cesium.Math.PI_OVER_TWO);

            var distance = Cesium.Cartesian2.magnitude(vector);
            var maxDistance = compassWidth / 2.0;
            var distanceFraction = Math.min(distance / maxDistance, 1.0);
            var easedOpacity = 0.5 * distanceFraction * distanceFraction + 0.5;
            viewModel.orbitCursorOpacity = easedOpacity;

            //viewModel.terria.cesium.notifyRepaintRequired();
        }

        viewModel.orbitMouseMoveFunction = function (e) {
            var compassRectangle = compassElement.getBoundingClientRect();
            var center = new Cesium.Cartesian2((compassRectangle.right - compassRectangle.left) / 2.0, (compassRectangle.bottom - compassRectangle.top) / 2.0);
            var clickLocation = new Cesium.Cartesian2(e.clientX - compassRectangle.left, e.clientY - compassRectangle.top);
            var vector = Cesium.Cartesian2.subtract(clickLocation, center, vectorScratch);
            updateAngleAndOpacity(vector, compassRectangle.width);
        };

        viewModel.orbitMouseUpFunction = function (e) {
            // TODO: if mouse didn't move, reset view to looking down, north is up?

            viewModel.isOrbiting = false;
            document.removeEventListener('mousemove', viewModel.orbitMouseMoveFunction, false);
            document.removeEventListener('mouseup', viewModel.orbitMouseUpFunction, false);

            if (Cesium.defined(viewModel.orbitTickFunction)) {
                viewModel.terria.clock.onTick.removeEventListener(viewModel.orbitTickFunction);
            }

            viewModel.orbitMouseMoveFunction = undefined;
            viewModel.orbitMouseUpFunction = undefined;
            viewModel.orbitTickFunction = undefined;
        };

        document.addEventListener('mousemove', viewModel.orbitMouseMoveFunction, false);
        document.addEventListener('mouseup', viewModel.orbitMouseUpFunction, false);
        viewModel.terria.clock.onTick.addEventListener(viewModel.orbitTickFunction);

        updateAngleAndOpacity(cursorVector, compassElement.getBoundingClientRect().width);
    }

    function rotate(viewModel, compassElement, cursorVector) {
        // Remove existing event handlers, if any.
        document.removeEventListener('mousemove', viewModel.rotateMouseMoveFunction, false);
        document.removeEventListener('mouseup', viewModel.rotateMouseUpFunction, false);

        viewModel.rotateMouseMoveFunction = undefined;
        viewModel.rotateMouseUpFunction = undefined;

        viewModel.isRotating = true;
        viewModel.rotateInitialCursorAngle = Math.atan2(-cursorVector.y, cursorVector.x);

        var scene = viewModel.terria.scene;
        var camera = scene.camera;

        var windowPosition = windowPositionScratch;
        windowPosition.x = scene.canvas.clientWidth / 2;
        windowPosition.y = scene.canvas.clientHeight / 2;

        var viewCenter = camera.pickEllipsoid(windowPosition, scene.globe.ellipsoid, centerScratch);

        if (!Cesium.defined(viewCenter)) {
            viewModel.rotateFrame = Cesium.Transforms.eastNorthUpToFixedFrame(camera.positionWC, scene.globe.ellipsoid, newTransformScratch);
            viewModel.rotateIsLook = true;
        } else {
            viewModel.rotateFrame = Cesium.Transforms.eastNorthUpToFixedFrame(viewCenter, scene.globe.ellipsoid, newTransformScratch);
            viewModel.rotateIsLook = false;
        }

        var oldTransform = Cesium.Matrix4.clone(camera.transform, oldTransformScratch);
        camera.lookAtTransform(viewModel.rotateFrame);
        viewModel.rotateInitialCameraAngle = -camera.heading;
        viewModel.rotateInitialCameraDistance = Cesium.Cartesian3.magnitude(new Cesium.Cartesian3(camera.position.x, camera.position.y, 0.0));
        camera.lookAtTransform(oldTransform);

        viewModel.rotateMouseMoveFunction = function (e) {
            var compassRectangle = compassElement.getBoundingClientRect();
            var center = new Cesium.Cartesian2((compassRectangle.right - compassRectangle.left) / 2.0, (compassRectangle.bottom - compassRectangle.top) / 2.0);
            var clickLocation = new Cesium.Cartesian2(e.clientX - compassRectangle.left, e.clientY - compassRectangle.top);
            var vector = Cesium.Cartesian2.subtract(clickLocation, center, vectorScratch);
            var angle = Math.atan2(-vector.y, vector.x);

            var angleDifference = angle - viewModel.rotateInitialCursorAngle;
            var newCameraAngle = Cesium.Math.zeroToTwoPi(viewModel.rotateInitialCameraAngle - angleDifference);

            var camera = viewModel.terria.scene.camera;

            var oldTransform = Cesium.Matrix4.clone(camera.transform, oldTransformScratch);
            camera.lookAtTransform(viewModel.rotateFrame);
            var currentCameraAngle = -camera.heading;
            camera.rotateRight(newCameraAngle - currentCameraAngle);
            camera.lookAtTransform(oldTransform);

            // viewModel.terria.cesium.notifyRepaintRequired();
        };

        viewModel.rotateMouseUpFunction = function (e) {
            viewModel.isRotating = false;
            document.removeEventListener('mousemove', viewModel.rotateMouseMoveFunction, false);
            document.removeEventListener('mouseup', viewModel.rotateMouseUpFunction, false);

            viewModel.rotateMouseMoveFunction = undefined;
            viewModel.rotateMouseUpFunction = undefined;
        };

        document.addEventListener('mousemove', viewModel.rotateMouseMoveFunction, false);
        document.addEventListener('mouseup', viewModel.rotateMouseUpFunction, false);
    }
    return NavigationViewModel;

}//define
);

//module.exports = NavigationViewModel;
