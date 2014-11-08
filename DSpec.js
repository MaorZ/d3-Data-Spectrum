(function() {
  d3.selection.prototype.DataSpectrum = function() {
      this.zoomLevel = 0;
      this.lastScale = 1;
      
      this.Options = {
          //defaults values...
          //maxHeight: Maximum height of the spectrum itself (without the nevigator above)
          //will be ignored if the the calculated spectrum height will be smaller
          maxHeight: 300, 
          //nevigatorHeight: Height of the nevigator (above the spectrum)
          nevigatorHeight: 80,
          //nevigatorRectSize: Size of a nevigator data rect (represents a scaled data cell of the data spectrum cell)
          nevigatorRectSize: 10,
          //width: Width of the DataSpectrum svg
          width: 612,
          //cellWidth: Width of a data rect in the data spectrum
          cellWidth: 130,
          //cellHeight: Height of a data rect in the data spectrum
          cellHeight: 50,
          //minCellWidth: Minimum size of data rect in the data spectrum (min zoomout rect size)
          minCellWidth: 30,
          //maxCellWidth: Maximum size of data rect in the data spectrum (max zoomin rect size)
          maxCellWidth: 150,
          //cellSpacing: Cell spacing between data rect in the data spectrum and the nevigator
          cellSpacing: 2,
          //padding: Padding between the spectrum itself to it surrounding rect
          padding: 15,
          //dataFontSize: Font size for the text of data inside the data rect
          dataFontSize: 12,
          //varsDomain: Range of numbers of the spectrum
          varsDomain: [224,400],
          //diffSize: The jumps between the 2 numbers in the varsDomain
          diffSize: 0.025,
          //The xFormatFunction to create X text from the val
          xFormatFunction: function(xVal) { return xVal; },
          //manualY: tell if the Y is given by user data or needs to be calculated (via the __prepereData Function)
          //if manualY is true, the user need to provide the the Y attribute in the Vals array (Y start from 1 (not 0))
          manualY: false,
          //yTextArray: if manualY is true, the user need to provide the yTextArray that containes the names of the Y axis text 
          //2 options provieded:
          //1. by the order from bottom to top (from 1 to YMax): for example yTextArray = ['Y1', 'Y Text 2', 'Bla Bla', '4 GGG']
          //2. by the Y id ([id, YText]): for example yTextArray = [[150, 'Desk1'], [155, 'Desk2'], [159, 'Desk3 - Special']]
          yTextArray: []
      }
      
      this.draw = function(data, options){
        this.Options = $.extend(this.Options, options );

        var manualY = this.manualY = this.Options.manualY;
        this.yTextArray = this.Options.yTextArray;
        var yTextArray;
        
        if(!manualY) {
            //Adding the Y attribute to each Object in Vals
            data = this.__prepereData(data);
            yTextArray = this.yTextArray;
        }
        else {
            yTextArray = this.yTextArray;
            this.maxYCount = yTextArray.length;
        }
        var yKeyObj = this.yKeyObj = {};
          
        var longestYTextLength = 0;
        var longestYText;
        for(textIndx in yTextArray) {
            var text = yTextArray[textIndx][1];
            if(text.length > longestYTextLength) {
            	longestYTextLength = text.length;
                longestYText = text;
            }
            var yKey = yTextArray[textIndx][0];
            yKeyObj[yKey] = parseInt(textIndx) + 1;
        }
        this.yKeyObj = yKeyObj;
        
        var padding = this.padding = $.fn.textWidth(longestYText, dataFontSize) + 6;
        if(padding < this.Options.padding) {
        	padding = this.padding = this.Options.padding;
        }
        
        var inSlideMotion = this.inSlideMotion = false;
        var panningAfterSlideMotion = this.panningAfterSlideMotion = false;
        var varsDomain = this.varsDomain = this.Options.varsDomain;
        var diffSize = this.diffSize = this.Options.diffSize; 
        var DomainCount = this.DomainCount = (varsDomain[1] - varsDomain[0]) * 1 / diffSize;
        var DomainMax = this.DomainMax = varsDomain[1];
        var DomainMin = this.DomainMin = varsDomain[0];
        var gHeight = this.gHeight = this.Options.maxHeight;
        var nevigatorHeight = this.nevigatorHeight = this.Options.nevigatorHeight;
        var gWidth = this.gWidth = this.Options.width;
        var cellWidth = this.cellWidth = this.Options.cellWidth;
        var cellHeight = this.cellHeight = this.Options.cellHeight;
        var cellSpacing = this.cellSpacing = this.Options.cellSpacing;
        var dataFontSize = this.dataFontSize = this.Options.dataFontSize;
        var minCellWidth = this.minCellWidth = this.Options.minCellWidth;
        var maxCellWidth = this.maxCellWidth = this.Options.maxCellWidth;
        var maxYCount = this.maxYCount;
        var xFormatFunction = this.xFormatFunction = this.Options.xFormatFunction;
          
        var maxYHeight = this.maxYHeight = maxYCount * cellHeight;
        if(this.gHeight > maxYHeight + 45){
            var gHeight = this.gHeight = maxYHeight + 45;
        }
        var nevigatorRectSize = this.nevigatorRectSize = this.Options.nevigatorRectSize;
        var nevWidth = this.nevWidth = gWidth - (padding * 2);
        var nevHeight = this.nevHeight = nevigatorHeight - 30;
        var nevRatio = this.nevRatio = nevigatorRectSize/cellWidth;
        var nevDraggerRectWidth = this.nevDraggerRectWidth = nevWidth*nevRatio;
        var nevZeroX = this.nevZeroX = nevWidth/2 - nevDraggerRectWidth/2;

        //Checking the precesion size of the range (Dealing with float precision in Javascript)
        var precision = this.precision = ((diffSize + "").indexOf('.')!=-1)?((diffSize + "").split(".")[1].length):0;

        //d3 sacle object: spectrum X domain var -> pixels in the spectrum svg
        var scaleX = this.scaleX = d3.scale.linear()
                        .domain(varsDomain)
                        .range([padding, ((DomainCount) * cellWidth) + padding]);
        var scaleXOrig = this.scaleXOrig = d3.scale.linear()
                        .domain(varsDomain)
                        .range([padding, ((DomainCount) * cellWidth) + padding]);
        //d3 sacle object: spectrum X domain var -> pixels in the nevigator svg
        var scaleNevX = this.scaleNevX = d3.scale.linear()
                        .domain(varsDomain)
                        .range([0,((DomainCount) * nevigatorRectSize)])

        //d3 sacle object: spectrum Y var -> pixels in the spectrum svg
        var scaleY = this.scaleY = d3.scale.linear()
                        .domain([0,maxYCount])
                        .range([gHeight - 30, gHeight - 30 - (cellHeight*maxYCount)]);
        var scaleYOrig = this.scaleYOrig = d3.scale.linear()
                        .domain([0,maxYCount])
                        .range([gHeight - 30, gHeight - 30 - (cellHeight*maxYCount)]);
        //d3 sacle object: spectrum Y var -> pixels in the nevigator svg
        var scaleNevY = this.scaleNevY = d3.scale.linear()
                        .domain([0,maxYCount])
                        .range([(nevHeight/2) + (maxYCount/2 * nevigatorRectSize), (nevHeight/2) - (maxYCount/2 * nevigatorRectSize)]);

        //Looking for the longest number in the spectrum, in the domain values or the data values (including precision)
        var maxValNumber = this.maxValNumber = d3.max(data.Vals, function(d) { return d.Val } );
        if((maxValNumber + "").length < DomainMax.toFixed(precision).length){
            var maxValNumber = this.maxValNumber = DomainMax.toFixed(precision)
        }
        //Calculating the longest text width for knowing when to change the zoom level
		var longestTextWidth = this.longestTextWidth = $.fn.textWidth(maxValNumber, dataFontSize) + 6;

        //Creating a d3 zoom object for controlling the spectrum svg draging and zooming
        var zoom = this.zoom = d3.behavior.zoom()
            .scaleExtent([minCellWidth/ cellWidth, maxCellWidth/ cellWidth])
            .x(scaleX)
            .y(scaleY)
            .on("zoomstart", this.__zoomStarted)
            .on("zoom", this.__panZoomed)
            .on("zoomend", this.__zoomEnded);

        //Nevigator dragger values
        var draggerActive = this.draggerActive = false;
        var draggerMovmentTimer = this.draggerMovmentTimer = null;

        //Creating the svg object for the spectrum inside the given DIV id
        var svgParent = this.svgParent = d3.select('#' + this.attr('id'))
            .append("svg")
            .attr("width", gWidth)
            .attr("height", gHeight + nevigatorHeight)
            .on('mouseup' , this.__onDraggerEnd)
            .on('touchend' , this.__onDraggerEnd)
            .on('mousemove' , this.__onDraggerMove)
            .on('touchmove' , this.__onDraggerMove);

        //Getting the dom eleemnt of the svg parent
        var svgParentDom = this.svgParentDom = svgParent[0][0];
        svgParentDom.parentSpectrumObj = this;

        //The SVG that contains the spectrum itself
        var svgContent = this.svgContent = d3.select(svgParentDom)
            .append("svg").attr('class','ContainerG')
            .attr("x", 0)
            .attr("y", nevigatorHeight)
            .attr("height", gHeight)
            .attr('overflow', 'hidden')
            .call(zoom);
          
        //Getting the dom eleemnt of the spectrum svg
        var svgContentDom = this.svgContentDom = svgContent[0][0];
        svgContentDom.parentSpectrumObj = this;

        //Creating the surrounding spectrum's rect
        svgContent.append("rect")
            .style("stroke", "black")
            .style("fill", "none")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", gWidth)
            .attr("height", gHeight)
            .style("pointer-events", "all");

        //Creating the g that containes the actual data of the spectrum
        var container = this.container = svgContent.append('g');

        //Creating the g that containes the XText values
        var gText = this.gText = container.append('g').attr('class', 'gText');

        //Creating the XText and YText G 
        var XText = this.XText = gText.append('g').attr('class', 'xText').attr("transform", "translate(" + [0, gHeight - 30 + 5 + parseInt(dataFontSize)] + ")").selectAll('text')
                .data(this.__getValsToShow(0), function(d) { return d; });
        var YText = this.YText = svgContent.append('g').attr('class', 'yText')
                .selectAll('text').data(d3.range(1, maxYCount + 1 ,1), function(d) { return d; });

        //Creating the X and Y text objects (only text objects that needed to be showen on the screen (calculated by the 'getValsToShow' function))
        XText.enter().append('text')
                .attr('class', 'xTextVal')
                .style('font-family', 'Arial')
                .style('font-size', dataFontSize)
                .style('stroke', '#000000')
                .style('text-anchor', 'middle')
                .style('-webkit-touch-callout', 'none')
                .style('-webkit-user-select', 'none')
                .style('-khtml-user-select', 'none')
                .style('-moz-user-select', 'none')
                .style('-ms-user-select', 'none')
                .style('user-select', 'none')
                .attr('x', function(d) { return scaleX(d) })
                .attr('y', 0)
                .text(function (d) { return xFormatFunction(d); });

        YText.enter().append('text')
                .attr('class', 'yTextVal')
                .style('font-family', 'Arial')
                .style('font-size', dataFontSize)
                .style('stroke', '#000000')
                .style('text-anchor', 'start')
                .style('-webkit-touch-callout', 'none')
                .style('-webkit-user-select', 'none')
                .style('-khtml-user-select', 'none')
                .style('-moz-user-select', 'none')
                .style('-ms-user-select', 'none')
                .style('user-select', 'none')
                .attr('x', 3)
                .attr('y', function(d)
                 {
                      return scaleY(d) + (cellHeight / 2);
                 })
        		.attr('dy', parseInt(dataFontSize)/2 + 'px')
                .text(function (d) { 
                    return yTextArray[d-1][1];
                });


        //Creating the g that containes the X and Y Lines of the spectrum
        var gAxes = this.gAxes = container.append('g').attr('class', 'gAxes');

        //Creating the X lines and Y lines G
        var YAxeLines = this.YAxeLines = gAxes.append('g').attr('class', 'yAxe').selectAll('line').data(d3.range(30, 31 + maxYCount * cellHeight , cellHeight));
        var XAxeLines = this.XAxeLines = gAxes.append('g').attr('class', 'xAxe').selectAll('line').data(this.__getXAxisValsToShow(0), function(d) { return d; });

        //Creating the X and Y lines objects (only line objects that needed to be showen on the screen (calculated by the 'getXAxisValsToShow' function))
        YAxeLines.enter().append('line')
                .style('fill', 'none')
                .style('stroke', '#ddd')
                .style('shape-rendering', 'crispEdges')
                .style('vector-effect', 'non-scaling-stroke')
                .attr('x1', padding)
                .attr('y1', function(d) { return gHeight - d; })
                .attr('x2', ((DomainCount) * cellWidth) + padding)
                .attr('y2', function(d) { return gHeight - d; });

        XAxeLines.enter().append('line')
                .style('fill', 'none')
                .style('stroke', function(d, i) { return (i%5 == 0)?'red':'black'; })
                .style('stroke-width', function(d, i) { return (i%5 == 0)?2:1; } )
                .style('shape-rendering', 'crispEdges')
                .style('vector-effect', 'non-scaling-stroke')
                .attr('x1', function(d, i) { 
                    return scaleX(d);
                })
                .attr('y1', function(d, i) { return (i%5 == 0)?(scaleY(0) + 5):(scaleY(0)); })
                .attr('x2', function(d, i) {
                    return scaleX(d);
                })
                .attr('y2', scaleY(maxYCount));

        //Creating the lowwer line of the spectrum 
        var XLine = this.XLine = gAxes.append('line')
                        .attr('x1', padding)
                        .attr('y1', gHeight - 30)
                        .attr('y2', gHeight - 30)
                        .attr('x2', function(d) {
                            return ((DomainCount) * cellWidth) + padding
                        })
                        .style('stroke', 'rgb(255,0,0)')
                        .style('stroke-width', 2);               

        //var minScale = this.minScale = (parseInt(svgParent.attr('width')) - (padding * 3)) / (parseInt(container.attr('width')));

        //The SVG that contains the nevigator
        var svgNevigator = this.svgNevigator = d3.select(svgParentDom)
            .append("svg").attr('class','NevigatorG');

        svgNevigator.append("rect")
            .style("stroke", "black")
            .style("fill", "none")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", gWidth)
            .attr("height", nevigatorHeight)
            .style("pointer-events", "all");

        //Creating the goToStart button
        var goToStartImg = this.goToStartImg = svgNevigator.append('image')
            .attr("x", 1)
            .attr("y", 15)
            .attr("width", 16)
            .attr("height", nevHeight)
            .attr('xlink:href', '../pics/First.bmp')
            .attr('preserveAspectRatio', 'none')
            .on('click', function () {
                container.floatInFinish = true;
                container.floatStartX = zoom.translate()[0];
                container.slideMulti = 1;
                zoom.translate([0,zoom.translate()[1]]);
                this.parentSpectrumObj.__zoomEnded(true)
            });
        goToStartImg[0][0].parentSpectrumObj = this;

        //Creating the goToEnd button
        var goToEndImg = this.goToEndImg = svgNevigator.append('image')
            .attr("x", padding + nevWidth - 2)
            .attr("y", scaleNevY(0) - nevHeight/2)
            .attr("width", 16)
            .attr("height", nevHeight)
            .attr('xlink:href', '../pics/Last.bmp')
            .attr('preserveAspectRatio', 'none')
            .on('click', function () {
                container.floatInFinish = true;
                container.floatStartX = zoom.translate()[0];
                container.slideMulti = 1;
                zoom.translate([-1*scaleX(DomainMax) * cellWidth,zoom.translate()[1]]);
                this.parentSpectrumObj.__zoomEnded(true)
            });
        goToEndImg[0][0].parentSpectrumObj = this;

        //Creating the nevigator itself
        var nevDraggerContainer = this.nevDraggerContainer = svgNevigator.append('svg')
            .attr("width", nevWidth)
            .attr("height", nevHeight)
            .attr("x", 15)
            .attr("y", 15)
            .on('click', function () {
                var event = d3.event;
                if(typeof event.offsetX === "undefined" || typeof event.offsetY === "undefined") {
                   var targetOffset = $(event.target).offset();
                   event.offsetX = event.pageX - targetOffset.left;
                   event.offsetY = event.pageY - targetOffset.top;
                }
                var diffX = nevWidth/2 - (d3.event.offsetX - 15);
                diffX = diffX * (1/(nevRatio)) * this.parentSpectrumObj.zoom.scale();
                container.floatInFinish = true;
                container.floatStartX = zoom.translate()[0];
                container.slideMulti = 1;
                zoom.translate([zoom.translate()[0] + diffX/2,zoom.translate()[1]]);
                this.parentSpectrumObj.__zoomEnded(true)
            });
        var nevDraggerContainerDom = this.nevDraggerContainerDom = nevDraggerContainer[0][0];
        nevDraggerContainerDom.parentSpectrumObj = this;

        var nevDraggerRect = this.nevDraggerRect = nevDraggerContainer.append("rect")
            .style("stroke", "red")
            .style("fill", "none")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", nevWidth)
            .attr("height", nevHeight)
            .style("pointer-events", "all");

        //Creating the nevigator G 
        var nevContainerG = this.nevContainerG = nevDraggerContainer.append("g")
            .attr("transform", "translate(" + [nevZeroX, 0] + ")");

        //Creating the nevigator X Y Lines 
        var nevGAxes = this.nevGAxes = nevContainerG.append('g').attr('class', 'nevGAxes');

        var nevYAxeLines = this.nevYAxeLines = nevGAxes.append('g').attr('class', 'nevYAxe').selectAll('line').data(d3.range(0, maxYCount, 1));
        var nevXAxeLines = this.nevXAxeLines = nevGAxes.append('g').attr('class', 'nevXAxe').selectAll('line').data(this.__getNevXAxisValsToShow(0), function(d) { return d; });

        nevYAxeLines.enter().append('line')
                .style('fill', 'none')
                .style('stroke', '#ddd')
                /*.style('shape-rendering', 'crispEdges')
                .style('vector-effect', 'non-scaling-stroke')*/
                .attr('x1', 0)
                .attr('y1', function(d) { return scaleNevY(d); })
                .attr('x2', nevigatorRectSize * (DomainCount))
                .attr('y2', function(d) { return scaleNevY(d); });

        nevXAxeLines.enter().append('line')
                .style('fill', 'none')
                .style('stroke', function(d, i) { return (i%5 == 0)?'red':'black'; })
                .style('stroke-width', function(d, i) { return (i%5 == 0)?2:1; } )
                /*.style('shape-rendering', 'crispEdges')
                .style('vector-effect', 'non-scaling-stroke')*/
                .attr('x1', function(d, i) { 
                    return scaleNevX(d);
                })
                .attr('y1', function(d, i) { return (i%5 == 0)?(scaleNevY(0) + 5):(scaleNevY(0)); })
                .attr('x2', function(d, i) {
                    return scaleNevX(d);
                })
                .attr('y2', scaleNevY(maxYCount));

        //Creating the nevigator scaled view rect
        var nevViewRect = this.nevViewRect = svgNevigator.append('rect')
            .style("stroke", "green")
            .style("fill", "green")
            .style('opacity', 0.2)
            .attr("x", 15 + nevWidth/2 - nevDraggerRectWidth/2)
            .attr("y", 15)
            .attr("width", nevDraggerRectWidth)
            .attr("height", nevHeight)
            .style("pointer-events", "all")
            .on('mousedown', this.__onDraggerStart)
            .on('touchstart', this.__onDraggerStart);
        
        nevViewRect[0][0].parentSpectrumObj = this;
        
        //Creating the d3 selection of the Data (data.Vals)
        this.__drawData(data);
      }
      
      this.updateData = function(uData)
      {
          this.__drawData(uData);
      }
      
      /******************************************************************
       ************************ Private Functions ***********************
      *******************************************************************/
      
      this.__drawData = function (dataVals) {
		  var container = this.container;
		  var cellWidth = this.cellWidth;
		  var cellSpacing = this.cellSpacing;
		  var cellHeight = this.cellHeight;
		  var scaleXOrig = this.scaleXOrig;
		  var scaleYOrig = this.scaleYOrig;
		  var diffSize = this.diffSize;
		  var dataFontSize = this.dataFontSize;
          var nevContainerG = this.nevContainerG;
          var nevigatorRectSize = this.nevigatorRectSize;
          var scaleNevX = this.scaleNevX;
          var scaleNevY = this.scaleNevY;
          var zoom = this.zoom;
          var zoomLevel = this.zoomLevel;
          var padding = this.padding;
          var manualY = this.manualY;
          var yTextArray = this.yTextArray;
          var yKeyObj = this.yKeyObj;
          
          if(!manualY) {
              //Adding the Y attribute to each Object in Vals
              data = this.__prepereData(data);
          }
          
          //Creating the Spectrum Data rects
          this.dataG = container.selectAll('.dataG').data(dataVals.Vals, function (d) { return [d.X,d.Val,d.Y] });
          var dataG = this.dataG;

          dataG.exit().remove();
          this.dataGObjGroups = dataG.enter().append('g').attr("class", "dataG");
          var dataGObjGroups = this.dataGObjGroups;

          dataGObjGroups.append('rect')
          .attr('width', function(d) { return cellWidth * d.length - cellSpacing*2} )
          .attr('height', cellHeight - cellSpacing*2)
          .attr('rx', 5)
          .attr('ry', 5)
          .style({'fill': 'blue', 'opacity': 0.65})
          .attr('x', function(d) {
              return scaleXOrig(d.X) + cellSpacing + (zoom.translate()[0] - (padding - padding * zoom.scale()));
          } )
          .attr('y', function(d) { 
              var yKey = d.Y;
              return scaleYOrig(yKeyObj[yKey]) + cellSpacing;
          } ).append('title').text(function(d) { return d.Val } );

          dataGObjGroups.append('text')
          .attr('class', 'DataGText')
          .attr('x', function(d) {
              return scaleXOrig(d.X + diffSize/2) - zoom.translate()[0];
          } )
          .attr('y', function(d) { 
              var yKey = d.Y;
              return scaleYOrig(yKeyObj[yKey] - 0.5);
          } )
          .style('font-family', 'Arial')
          .style('font-size', dataFontSize)
          .style('stroke', '#ffffff')
          .style('text-anchor', 'middle')
          .style('display', (zoomLevel==0)?'block':'none')
          .text(function(d) { return d.Val } )
          
          dataGObjGroups.select('rect').attr("transform", "scale(" + zoom.scale() + ", 1)");
          
          //Creating the nevigator Data rects
          this.dataNevG = nevContainerG.selectAll('.nevDataG').data(dataVals.Vals, function (d) { return [d.X,d.Val,d.Y] });
          var dataNevG = this.dataNevG;
          
          dataNevG.exit().remove();
          this.dataNevGEnter = dataNevG.enter().append('g').attr("class", "nevDataG");
          var dataNevGEnter = this.dataNevGEnter;
          
          dataNevGEnter.append('rect')
          .attr('width', function(d) { return nevigatorRectSize * d.length } )
          .attr('height', nevigatorRectSize)
          .attr('rx', 5)
          .attr('ry', 5)
          .style({'fill': 'blue', 'opacity': 0.65, 'stroke-width' : 1, 'stroke': 'rgb(0,0,0)'})
          .attr('x', function(d) {
              return scaleNevX(d.X);
          } )
          .attr('y', function(d) { 
              var yKey = d.Y;
              return scaleNevY(yKeyObj[yKey]);
          } );
      }
      
      //when user move the mouse after preased the scaled view rect
      this.__onDraggerMove = function () {
          var sp;
          
          if(this.hasOwnProperty('parentSpectrumObj')) {
              sp = this.parentSpectrumObj;
          }
          else {
          	  sp = this;
          }
          if(sp.draggerActive)
          {
              //configure the timer to move the nevigator in new step
              sp.draggerCurX = d3.mouse(this)[0];
              sp.draggerMovment = -1 * (sp.draggerCurX - sp.draggerStartX);
          }
      }

      //when user mouse up after preased the scaled view rect
      this.__onDraggerEnd = function () {
          //removing the timer interval that moves the nevigator
          
          var sp;
          
          if(this.hasOwnProperty('parentSpectrumObj')) {
              sp = this.parentSpectrumObj;
          }
          else {
          	  sp = this;
          }
          sp.draggerActive = false;
          $(sp.svgParentDom).css('cursor','default');
          clearInterval(sp.draggerMovmentTimer);
      }

      //when user presed the mouse on the scaled view rect
      this.__onDraggerStart = function () {
          //Creating a timer interval that moves the nevigator in a step (calculated by the offset from the first X preass)
          
          var sp;
          
          if(this.hasOwnProperty('parentSpectrumObj')) {
              sp = this.parentSpectrumObj;
          }
          else {
          	  sp = this;
          }
          sp.draggerActive = true;
          $(sp.svgParentDom).css('cursor','col-resize');
          sp.draggerStartX = d3.mouse(this)[0];
          sp.draggerMovment = 0;
          clearInterval(sp.draggerMovmentTimer);
          sp.draggerMovmentTimer = setInterval(function() { 
              sp.__DragMovmentFunc.apply(sp) 
          },100);
      }

      //the timer interval that moves the nevigator
      this.__DragMovmentFunc = function () { 
          //updating the d3 zoom object to trnslate to new location and activating the position update function (zoomEnded)
          
          var sp;
          
          if(this.hasOwnProperty('parentSpectrumObj')) {
              sp = this.parentSpectrumObj;
          }
          else {
          	  sp = this;
          }
          var diffX = sp.draggerMovment;
          var zoom = sp.zoom;
          var container = sp.container;
          container.floatInFinish = true;
          container.floatStartX = zoom.translate()[0];
          container.slideMulti = 1;
          sp.zoom.translate([zoom.translate()[0] + diffX,zoom.translate()[1]]);
          sp.__zoomEnded(true)
      }

      //returns a d3 range object for the XText values to show on screen
      this.__getValsToShow = function (xOffset) {
		  var zoomLevel = this.zoomLevel;
		  var diffSize = this.diffSize;
	  
          var ValsTS = this.__getTextValsToShowByOffset(xOffset);
          return d3.range(ValsTS[0], ValsTS[1] ,(zoomLevel == 0)?diffSize:diffSize*5);
      }

      //returns a d3 range object for the X Lines values to show on screen
      this.__getXAxisValsToShow = function (xOffset) {
		  var diffSize = this.diffSize;
		
          var ValsTS = this.__getXLinesToShowByOffset(xOffset);
          return d3.range(ValsTS[0], ValsTS[1] ,diffSize)
      }

      //returns a d3 range object for the Nevigator X Lines values to show on screen
      this.__getNevXAxisValsToShow = function (xOffset) {
		  var diffSize = this.diffSize;
	  
          var ValsTS = this.__getNevValsToShowByOffset(xOffset);
          return d3.range(ValsTS[0], ValsTS[1] ,diffSize)
      }

      //returns a array XText values to show calculated by the X offset of the spectrum
      this.__getTextValsToShowByOffset = function (xOffset) {
          var gWidth = this.gWidth;
          var cellWidth = this.cellWidth;
          var zoom = this.zoom;
          var precision = this.precision;
          var DomainMin = this.DomainMin;
          var DomainMax = this.DomainMax;
          var diffSize = this.diffSize;
		  var zoomLevel = this.zoomLevel;
          
          var valsCount = Math.floor(gWidth / cellWidth / zoom.scale()).toFixed(precision)/1;
          var valFrom = (DomainMin + (Math.floor(-1 * xOffset / cellWidth / zoom.scale()) * diffSize)).toFixed(precision)/1;
          valFrom = Math.max(valFrom, DomainMin);
          var valTo;
          
          if(zoomLevel != 0)
          {
              valFrom = (diffSize*5).toFixed(precision)/1 * Math.ceil(valFrom / (diffSize*5))
          }
          valTo = Math.min((valFrom + (valsCount * diffSize) + 2*diffSize).toFixed(precision)/1, DomainMax)
          return [valFrom, valTo];
      }

      //returns a array X Lines values to show calculated by the X offset of the spectrum
      this.__getXLinesToShowByOffset = function (xOffset) {
          var gWidth = this.gWidth;
          var cellWidth = this.cellWidth;
          var zoom = this.zoom;
          var precision = this.precision;
          var DomainMin = this.DomainMin;
          var DomainMax = this.DomainMax;
          var diffSize = this.diffSize;
          
          var valsCount = Math.floor(gWidth / cellWidth / zoom.scale()).toFixed(precision)/1;
          var valFrom = (DomainMin + (Math.floor(-1 * xOffset / cellWidth / zoom.scale()) * diffSize)).toFixed(precision)/1;
          var valTo;
          
          valFrom = Math.max(valFrom, DomainMin);
          valTo = Math.min((valFrom + (valsCount * diffSize) + 2*diffSize).toFixed(precision)/1, DomainMax)
          
          return [valFrom, valTo];
      }

      //returns a array Nevigator X Lines values to show calculated by the X offset of the spectrum
      this.__getNevValsToShowByOffset = function (xOffset) {
          	
          var zoom = this.zoom;
          var precision = this.precision;
          var DomainMin = this.DomainMin;
		  var DomainMax = this.DomainMax;
          var diffSize = this.diffSize;
		  var nevRatio = this.nevRatio;
		  var nevDraggerRectWidth = this.nevDraggerRectWidth;
		  var nevWidth = this.nevWidth;
		  var nevigatorRectSize = this.nevigatorRectSize;
          
          xOffset = (xOffset) * nevRatio - (nevDraggerRectWidth/zoom.scale()/2);
          var valsCount = Math.floor(nevWidth/nevigatorRectSize);
          var valFrom = DomainMin + (Math.floor(-1 * xOffset / nevigatorRectSize) * diffSize).toFixed(precision)/1;
          var valsCountSide = Math.ceil((valsCount/2).toFixed(precision)/1);
          var rangeArray = [Math.max((valFrom - valsCountSide*diffSize).toFixed(precision)/1, DomainMin), Math.min((valFrom + (valsCountSide * diffSize) + 2*diffSize).toFixed(precision)/1, DomainMax + diffSize)];
          return rangeArray;
      }

      //Updates the X Lines to show in the spectrum (removes old ones and add new ones)
      this.__updateXAxis = function () {
		  var scaleXOrig = this.scaleXOrig;
		  var scaleYOrig = this.scaleYOrig;
		  var diffSize = this.diffSize;
		  var padding = this.padding;
		  var zoom = this.zoom;
          var maxYCount = this.maxYCount;
          var DomainMin = this.DomainMin;
	  
          var xOffset = zoom.translate()[0] - (padding - padding * zoom.scale());
          this.XAxeLines = this.XAxeLines.data(this.__getXAxisValsToShow(xOffset), function(d) { return d; });
		  var XAxeLines = this.XAxeLines;
		  
          XAxeLines.exit().transition().duration(1000).style("opacity", 0).remove();

          XAxeLines.enter().append('line')
          .style('fill', 'none')
          .style('stroke', function(d) { return ((d - DomainMin) % (diffSize*5) == 0)?'red':'black'; })
          .style('stroke-width', function(d, i) { return ((d - DomainMin) % (diffSize*5) == 0)?2:1; } )
          .style('shape-rendering', 'crispEdges')
          .style('vector-effect', 'non-scaling-stroke')
          .attr('x1', function(d) { 
              return scaleXOrig(d);
          })
          .attr('y1', function(d) { return ((d - DomainMin) % (diffSize*5) == 0)?(scaleYOrig(0) + 5):(scaleYOrig(0)); })
          .attr('x2', function(d) {
              return scaleXOrig(d);
          })
          .attr('y2', scaleYOrig(maxYCount));
      }

      //Updates the XText to show in the spectrum (removes old ones and add new ones)
      this.__updateXText = function () {
		  var zoom = this.zoom;
		  var padding = this.padding;
		  var scaleX = this.scaleX;
		  var dataFontSize = this.dataFontSize;
          var xFormatFunction = this.xFormatFunction;
		  
          var xOffset = zoom.translate()[0] - (padding - padding * zoom.scale());
          this.XText = this.XText.data(this.__getValsToShow(xOffset), function(d) { return d; });
		  var XText = this.XText;
          XText.exit().transition().duration(1000).style("opacity", 0).remove();
          XText.text(function(d) { return xFormatFunction(d) })
          .style('text-anchor', 'middle')
          .transition()
          .attr('x', function(d) {
              return scaleX(d) - zoom.translate()[0];
          });
          XText.enter().append('text')
                .attr('class', 'xTextVal')
                .style('font-family', 'Arial')
                .style('font-size', dataFontSize)
                .style('stroke', '#000000')
                .style('text-anchor', 'middle')
                .style('-webkit-touch-callout', 'none')
                .style('-webkit-user-select', 'none')
                .style('-khtml-user-select', 'none')
                .style('-moz-user-select', 'none')
                .style('-ms-user-select', 'none')
                .style('user-select', 'none')
                .attr('x', function(d) { return scaleX(d)  - zoom.translate()[0] })
                .attr('y', 0)
                .text(function (d) { return xFormatFunction(d); });
      }

      //Updates the X Lines to show in the nevigator (removes old ones and add new ones)
      this.__updateNevXLines = function () {
		  var zoom = this.zoom;
		  var padding = this.padding;
		  var diffSize = this.diffSize;
		  var scaleNevX = this.scaleNevX;
		  var scaleNevY = this.scaleNevY;
		  var maxYCount = this.maxYCount;
	  
          var xOffset = zoom.translate()[0] - (padding - padding * zoom.scale());
          this.nevXAxeLines = this.nevXAxeLines.data(this.__getNevXAxisValsToShow(xOffset), function(d) { return d; });
		  var nevXAxeLines = this.nevXAxeLines;
          nevXAxeLines.exit().transition().duration(1000).style("opacity", 0).remove();
          nevXAxeLines.enter().append('line')
          .style('fill', 'none')
          .style('stroke', function(d) { return (d%(diffSize*5) == 0)?'red':'black'; })
          .style('stroke-width', function(d) { return (d%(diffSize*5) == 0)?2:1; } )
          /*.style('shape-rendering', 'crispEdges')
                    .style('vector-effect', 'non-scaling-stroke')*/
          .attr('x1', function(d) { 
              return scaleNevX(d);
          })
          .attr('y1', function(d) { return (d%(diffSize*5) == 0)?(scaleNevY(0) + 5):(scaleNevY(0)); })
          .attr('x2', function(d) {
              return scaleNevX(d);
          })
          .attr('y2', scaleNevY(maxYCount));
      }

      //when user starts to Zoom the spectrum (including paning)
      this.__zoomStarted = function () {
          var sp = this.parentSpectrumObj;
		  var container = sp.container;
          var nevContainerG = sp.nevContainerG;
          var YText = sp.YText;
          var zoom = sp.zoom;
          var nevZeroX = sp.nevZeroX;
          var nevRatio = sp.nevRatio;
          var padding = sp.padding;
		  
          
          sp.panningAfterSlideMotion = false;
          d3.event.sourceEvent.stopPropagation();
          
          if(d3.transform(container.attr("transform")).translate == null)
          {
              sp.zoom.translate([0,0]);
              zoom = sp.zoom;
          }
          else
          {
              sp.zoom.translate(d3.transform(container.attr("transform")).translate);
              zoom = sp.zoom;
              if(sp.inSlideMotion) {
                  sp.startedTranslate = zoom.translate();
              }
          }
          container.transition().duration( 0 );
          nevContainerG.transition().duration( 0 );
          YText.transition().duration( 0 );

          sp.__upadteView();
          
          //if the user is starting to pan the spectrum
          if($.inArray(d3.event.sourceEvent.type, ['mousedown', 'touchstart']) != -1)
          {
              //prepering the calculation of the float effect
              container.floatInFinish = true;
              container.floatStartX = zoom.translate()[0];
              container.slideMulti = 10;
              sp.fastLevelSlide =setTimeout(function () { 
                  container.slideMulti = 8;
              },100);
              sp.mediumLevelSlide =setTimeout(function () { 
                  container.slideMulti = 4;
              },150);
              sp.slowLevelSlide =setTimeout(function () { 
                  container.slideMulti = 2;
              },200);
              sp.noSlide =setTimeout(function () { 
                  container.floatInFinish = false;
              },250);
          }
          else
          {
              container.floatInFinish = false;
          }
      }

      //When user finished to pan the spectrum
      this.__zoomEnded = function (manual) {
          var sp;
          
          if(this.hasOwnProperty('parentSpectrumObj')) {
              sp = this.parentSpectrumObj;
          }
          else {
          	  sp = this;
          }
		  var container = sp.container;
          var zoom = sp.zoom;
          var startedTranslate = sp.startedTranslate;
		  var scaleX = sp.scaleX;
		  var DomainMax = sp.DomainMax;
		  var diffSize = sp.diffSize;
		  var padding = sp.padding;
		  var svgParent = sp.svgParent;
		  var maxYHeight = sp.maxYHeight;
		  var gHeight = sp.gHeight;
		  var nevContainerG = sp.nevContainerG;
		  var YText = sp.YText;
		  var nevZeroX = sp.nevZeroX;
		  var nevRatio = sp.nevRatio;
	  
          clearTimeout(sp.fastLevelSlide);
          clearTimeout(sp.mediumLevelSlide);
          clearTimeout(sp.slowLevelSlide);
          clearTimeout(sp.noSlide);
          //if need to float
          if(container.floatInFinish == true)
          {
              var xTrans;
              //float effect calculation
              if(sp.inSlideMotion && !manual) {
                  zoom.translate(startedTranslate);
                  xTrans = zoom.translate();
                  sp.inSlideMotion = false;
                  sp.panningAfterSlideMotion = false;
              }
              else {
                  xTrans = zoom.translate();
                  var xDiff = (xTrans[0] - container.floatStartX) * container.slideMulti;
                  xTrans[0] = xTrans[0] + xDiff;
                  var oldX = xTrans[0];
                  xTrans[0] = Math.max(xTrans[0], (-1 * scaleX(DomainMax)) - padding + zoom.translate()[0] + parseInt(svgParent.attr('width')));
                  xTrans[0] = Math.min(xTrans[0], padding - padding * zoom.scale());
                  xTrans[1] = Math.min(xTrans[1], 30 + maxYHeight - gHeight);
                  xTrans[1] = Math.max(xTrans[1], 0);
                  zoom.translate([xTrans[0], xTrans[1]]);
                  if(!manual) {
                      sp.inSlideMotion = true;    
                  }
              }
              if(oldX != xTrans[0])
              {
                  container.transition().duration(1000).ease("elastic").attr("transform", "translate(" + zoom.translate() + ")").each("end", function() { sp.inSlideMotion = false; sp.panningAfterSlideMotion; });
                  nevContainerG.transition().duration(1000).ease("elastic").attr("transform", "translate(" + [nevZeroX + (zoom.translate()[0] - (padding - padding * zoom.scale())) * nevRatio, 0] + ")");
                  YText.transition().duration(1000).ease("elastic").attr("transform", "translate(" + [0, zoom.translate()[1]] + ")");
              }
              else
              {
                  container.transition().duration(1000).ease("quad-out").attr("transform", "translate(" + zoom.translate() + ")").each("end", function() { sp.inSlideMotion = false; sp.panningAfterSlideMotion; });
                  nevContainerG.transition().duration(1000).ease("quad-out").attr("transform", "translate(" + [nevZeroX + (zoom.translate()[0] - (padding - padding * zoom.scale())) * nevRatio, 0] + ")");
                  YText.transition().duration(1000).ease("quad-out").attr("transform", "translate(" + [0, zoom.translate()[1]] + ")");
              }
              sp.__upadteView();
          }
      }

      //when user is panning the spectrum
      this.__panZoomed = function ()
      {
          var sp = this.parentSpectrumObj;
          var zoom = sp.zoom;
          var startedTranslate = sp.startedTranslate;
		  var scaleX = sp.scaleX;
		  var DomainMax = sp.DomainMax;
		  var diffSize = sp.diffSize;
          var svgParent = sp.svgParent;
		  var padding = sp.padding;
		  var maxYHeight = sp.maxYHeight;
		  var gHeight = sp.gHeight;
		  var cellWidth = sp.cellWidth;
		  var longestTextWidth = sp.longestTextWidth;
		  var zoomLevel = sp.zoomLevel;
		  var dataGObjGroups = sp.dataGObjGroups;
		  var nevigatorRectSize = sp.nevigatorRectSize;
		  var nevWidth = sp.nevWidth;
		  var nevDraggerRectWidth = sp.nevDraggerRectWidth;
		  var container = sp.container;
		  var nevContainerG = sp.nevContainerG;
		  var nevZeroX = sp.nevZeroX;
		  var YText = sp.YText;
		  var gAxes = sp.gAxes;
		  var nevViewRect = sp.nevViewRect;
          var nevRatio = sp.nevRatio;
          var nevZeroX = sp.nevZeroX;
	  
          //************* :-O Crazy d3 bug!!! (when i stop the spectrum in the midle of the slide animation, the padding event doesnt seems to be updated with the new zoom.translate (stoping point)
          //								   so it keeps giving me the point that the animation spposed to be finished... :-( Specnd hours on this!!!)
          if(sp.inSlideMotion) {
              sp.panningFix = zoom.translate()[0] - startedTranslate[0];
              zoom.translate(startedTranslate);
              sp.panningAfterSlideMotion = true;
              sp.inSlideMotion = false;
          }
          else if(sp.panningAfterSlideMotion) {
              zoom.translate([zoom.translate()[0] - sp.panningFix, zoom.translate()[1]]);
          }
          var xTrans = zoom.translate();
          xTrans[0] = Math.max(xTrans[0], (-1 * scaleX(DomainMax)) - padding + xTrans[0] + parseInt(svgParent.attr('width')));
          xTrans[0] = Math.min(xTrans[0], padding - padding * zoom.scale());
          xTrans[1] = Math.min(xTrans[1], 30 + maxYHeight - gHeight);
          xTrans[1] = Math.max(xTrans[1], 0);
          zoom.translate([xTrans[0], xTrans[1]]);

          //checking if the pan action is a zoom action
          if($.inArray(d3.event.sourceEvent.type, ['wheel', 'dblclick']) != -1)
          {
              sp.lastScale = zoom.scale();
              if(zoomLevel > 0)
              {
                  if(cellWidth * zoom.scale() > longestTextWidth)
                  {
                      sp.zoomLevel--;
                      zoomLevel = sp.zoomLevel;
                      if(zoomLevel == 0)
                      {
                          dataGObjGroups.select('text').style('display', 'block');
                      }
                  }
              }
              if(zoomLevel == 0)
              {
                  if(cellWidth * zoom.scale() <= longestTextWidth)
                  {
                      dataGObjGroups.select('rect').transition().attr("transform", "scale(" + zoom.scale() + ", 1)");
                      dataGObjGroups.select('text').style('display', 'none');

                      sp.zoomLevel++;
                      zoomLevel = sp.zoomLevel;
                  }
              }

              var nevRatio = sp.nevRatio = nevigatorRectSize/cellWidth*1/zoom.scale();
              var nevZeroX = sp.nevZeroX = nevWidth/2 - (nevDraggerRectWidth * (1/zoom.scale()))/2;

              container.transition().attr("transform", "translate(" + zoom.translate() + ")");
              nevContainerG.attr("transform", "translate(" + [nevZeroX + (zoom.translate()[0] - (padding - padding * zoom.scale())) * nevRatio, 0] + ")");
              YText.transition().attr("transform", "translate(" + [0, zoom.translate()[1]] + ")");

              dataGObjGroups.select('rect').transition().attr("transform", "scale(" + zoom.scale() + ", 1)");
              dataGObjGroups.select('text').transition().attr('x', function(d) { 
                  return scaleX(d.X + diffSize/2) - xTrans[0] 
              });
              gAxes.transition().attr("transform", "scale(" + zoom.scale() + ", 1)");

              sp.__upadteView();

              nevViewRect.attr("x", 15 + nevWidth/2 - (nevDraggerRectWidth * (1/zoom.scale()))/2)
              .attr("width", nevDraggerRectWidth * (1/zoom.scale()));
          }
          //else its a normal panning action
          else
          {
              container.attr("transform", "translate(" + zoom.translate() + ")");
              nevContainerG.attr("transform", "translate(" + [nevZeroX + (zoom.translate()[0] - (padding - padding * zoom.scale())) * nevRatio, 0] + ")");
              YText.attr("transform", "translate(" + [0, zoom.translate()[1]] + ")");
              sp.__upadteView();
          }
      }

      //Upadinting what is needed to be showen on the screen
      this.__upadteView = function () {
          this.__updateXText();
          this.__updateXAxis();
          this.__updateNevXLines();
      }

      //Addoing the Y attribute to the data
      this.__prepereData = function (data) {
          var maxY = 1;
          var oldVals = {};
          var yTextArray = [[1, '1']];
          
          for (index = 0; index < data.Vals.length; ++index) {
              var currVal = data.Vals[index].X;
              var YVal;
              if(oldVals.hasOwnProperty(currVal))
              {
                  oldVals[currVal] = oldVals[currVal] + 1;
                  YVal = oldVals[currVal];
                  if(maxY < YVal){
                      maxY = YVal;
                      yTextArray.push([maxY, maxY.toString()]);
                  }
              }
              else
              {
                  YVal = 1;
                  oldVals[currVal] = 1;
              }
              data.Vals[index].Y = YVal;
              data.Vals[index].length = 1;
          }
          this.maxYCount = maxY;
          if(this.yTextArray.length == 0) {
              this.yTextArray = yTextArray;
          }
          
          return data;
      }
      
      return this;
  };
})();

// Calculate width of text from DOM element or string. By Phil Freo <http://philfreo.com>
$.fn.textWidth = function(text, font) {
    if (!$.fn.textWidth.fakeEl) $.fn.textWidth.fakeEl = $('<span>').hide().appendTo(document.body);
    $.fn.textWidth.fakeEl.text(text || this.val() || this.text()).css('font', font || this.css('font'));
    return $.fn.textWidth.fakeEl.width();
};