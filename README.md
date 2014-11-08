d3-Data-Spectrum
================

d3.js plugin that gives a very scaleble GUI component to see data in any type of wide spectrums ranges (Numeric renage, Time range and any other range you can think of) <b>Including Nevigating, Zooming, Sliding and more... And it Supports a very wide ranges (up to 500,000 Cells in a single html page divied to 6 spectrums (My biggest test))</b>

<b>[Example Page](https://rajesh-aranga.codio.io/d3Test.html)</b>

# What is it???

![Ex Pic 1](http://s11.postimg.org/l95l0ymdf/data_Spec_Ex1.png)

This is a [d3.js](http://d3js.org/) Based plugin that can be added to your page inside any empty `<div>` element you create in your page...
<br>
This plugin gives you a GUI component to present Data (In this case simple rectangels with text in it) in any range of data that you want!!!
<br>
<b>Note:</b> This GUI Component is a `<svg>` html element

# How To Use??? Very Simple...

## Depedencies

just import the `jquery.js`,`d3.js` and the `DSpec.js` to your html page like so:<br>
```html
<script src=".../jquery.js"></script>
<script src=".../d3.js"></script>
<script src=".../DSpec.js"></script>
```

## Markup

After that you create you place to put the spectrum in by creating an empty `<div>` with an id in the html like so:<br>
```html
<html ...>
<body>
  ...
    <div id="MyId">
    </div>
  ...
</body>
</html>
```

Now you are ready to start...<br><br>

## Data

First of all you have to get some data in this formation:<br>
A javascript object that containes `Vals` Property that containes an array of objects with `X`,`Val` an optional `Y` Properies, For example:<br>
```javascript
data = {
  Vals:
  [
    ...
    {X: 224, Val:4533},
    {X: 225, Val:43},
    {X: 226, Val:225},
    {X: 226, Val:4543},
    {X: 226, Val:999},
    {X: 226.025, Val:124},
    {X: 226.025, Val:3552},
    {X: 225.975, Val:9333},
    {X: 225.950, Val:93},
    {X: 225.950, Val:9334},
    {X: 227, Val:3},
    ...
  ]
}
```

This will provied us with the data in the spectrum (You can see the first image above)

## Options

This plugin containes Options for drawing the spectrum (Controls it size, cells, data formating, spacing, range, Inc size and alot more...), this is the Deafult options:

```javascript
{
  //defaults values...
  //maxHeight: Maximum height of the spectrum itself (without the nevigator above)
  //will be ignored if the the calculated spectrum height will be smaller
  maxHeight: 300, 
  //nevigatorHeight: Height of the nevigator (above the spectrum)
  nevigatorHeight: 80,
  //nevigatorRectSize: Size of a nevigator data rect (represents a scaled data cell of the data spectrum cell)
  nevigatorRectSize: 10,
  //width: Width of the DataSpectrum svg
  width: 1000,
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
```

If you provide an Options object with one of the above properties you will override the default.<br>
When you want to change the range (25 till 100) and the jump between units (jumps of 5 for cell) you will create the following options:

```javascript
var myOptions = {
  varsDomain: [25,100],
  diffSize: 5
}
```

## Draw it!!!

To initialize the spectrum write the following (usualy in the document.load function):<br>
```javascript
...
'Getting the data from the server or any external place:
data = ...
...

'Initializing the spectrum
var NumSpectrum = d3.select('#MyId').DataSpectrum();
'Drawing the spectrum with provided data
NumSpectrum.draw(data, myOptions);
```

And Thats it!!!<br>
Now you can see a Spectrum with your range and your data in it...

# Gestures (Zoom, pan, slide and etc)

This GUI Component Supports in:<br>
<b>Pan</b>: you can click on the spectrum and drag it to any direction <br>
<b>Slide (like in touch)</b>: You can click on the spectrum and drag it for a short time for 1 direction and the spectrum will slide regard to your drag distance and the time clicked... <br>
<b>Zoom</b>: You can use the mouse wheel to zoom in or out the data in the spectrum <br>
<b>Nevigation:</b> you use the nevigator (the top part of the spectrum) to go to any point by clicking it or drag the middle rect to any direction <br>

# Modular and scalible

Our options provided in this plugin gives us alot of freedom to decide how to show the data in the spectrum.<br><br>
## Spectrum Sizes
You can control all of this sizing options:
```javascript
//maxHeight: Maximum height of the spectrum itself (without the nevigator above)
//will be ignored if the the calculated spectrum height will be smaller
maxHeight: 300, 
//nevigatorHeight: Height of the nevigator (above the spectrum)
nevigatorHeight: 80,
//nevigatorRectSize: Size of a nevigator data rect (represents a scaled data cell of the data spectrum cell)
nevigatorRectSize: 10,
//width: Width of the DataSpectrum svg
width: 1000,
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
```
<b>Note:</b> by default the spectrum width is 1000 and the spectrum draws width regardles the parent div...

## Axis and Data
```javascript
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
```
<br>
<b>varsDomain</b>: is the range of the spectrum ([MinValue, MaxValue]) <br>
<b>diffSize</b>: is the jumping between the range value (5 or 1 or 0.025 or 10...)<br>
<b>xFormatFunction</b>: is a function that gets the X value and returns it with your format (By default is returning itself)<br>
For example if you want to show the X Axe in an hour format you can provied this function in the options:
```javascript
myOptions = {
  xFormatFunction: function(xVal) {
      var hourPart = Math.floor(xVal / 60);
      var minPart = xVal % 60;
      return hourPart + ":" + ((minPart<10)?('0' + minPart):minPart);
  },
  varsDomain: [480,720],
  diffSize: 10
}
```
Now the spectrum containes a X Axe from hour: 8:00 to 12:00 that every cell is 10 Minutes
<br>
<b>manualY</b>: if this propery is true, you must provied an Y property in the data objects with the Y ID<br>
<b>yTextArray</b>: When manualY is true you need to provide a Y Dictionary that translate Y ID to Y Text,<br>
For example if you provide yTextArray = ['Y Text 1', 'Y text 2','Other Y Text'] you will see 3 rows of data with those texts and the data objects must containes Y with ID of 1,2 or 3 value (Y Starts from 1 and not from 0)...<br>
Or you can provied the Y ID itself for example: [[150, 'Desk1'], [155, 'Desk2'], [159, 'Desk3 - Special']]
and the data objects must containes Y with ID of 150,155 or 159 value...<br>

