// Semicolon; IIFE wont be parsed as function parameter
;(function(){
	"use strict";

	// Exposing public Api
	window.RenderChart = function(data, selector){
		var chart = new Chart(data);
		var engine = new Engine(chart);
		engine.render(selector);
	};

	var sortByTime = function(a, b){		// Helper function to sort array by time
		if(a.year === b.year){
			return a.month > b.month;
		}
		return a.year > b.year;
	}

	var joinDate = function(year, month){	// Helper function to combine year and 
		return ((year * 12) + month);		// month
	}
	var splitDate = function(date){			// Helper function to split year and month
		return {							// joined by previous function
			year : Math.floor(date / 12),
			month : date % 12
		};
	}

	var shortNumber = function(num){
		var numDig = numberOfDigits(num);
		var suffix = "";
		var stepsDown;

		if(numDig >= 13){
			suffix = "t"
			stepsDown = 13;
		} else if(numDig >= 10){
			suffix = "b"
			stepsDown = 10;
		} else if(numDig >= 7){
			suffix = "m"
			stepsDown = 7;
		} else if(numDig >= 4){
			suffix = "k"
			stepsDown = 4;
		} else{
			suffix = ""
			stepsDown = 0;
		}

		return (num / Math.pow(10, stepsDown)) + suffix;
	}

	var numberOfDigits = function(num){
		num = num < 0 ? num * -1 : num;
		var dig = 0;
		while(num > 0){
			++dig;
			num = Math.floor(num / 10);
		}
		return dig;
	}

	function Chart(data){					// Contructor function to parse and validate data

		var i, len, key,					// Varibles for loop iteration
			item, 							// Data parsing variables
			date,
			index,
			value;

		if(typeof data === "string"){	// If data is string; convert to 
			data = JSON.parse(data);	// JSON object
		}

		this.data = {};					// Initialize Chart's data variable
		this.data.dimensions = {		// Initializing dimension property with default value
			width : 500,
			height : 600
		};

		this.data.ticks = {				// Initializing ticks property in Chart's data
			xaxis : 5,
			yaxis : 5
		}

		this.data.caption = data.caption || "";			// Fetching values for caption and
		this.data.subcaption = data.subcaption || "";	// subcaption; default "" string
		this.data.xaxisname = data.xaxisname || "Time";	// Default name for x-axis
 
		this.data.variables = data.variables || [];		// Default blank array for yaxis variables
		this.data.separator = data.separator || '|';	// Default '|' for separator

		this.data.category = {};						// An object to store array of data 
														// on basis of their yaxis variable names
		this.data.dateArray = [];						// Array to store all dates

		if(data.dimensions){							// If parameter data has dimensions, copy them over to
														// Chart's data
			this.data.dimensions.width = data.dimensions.width || this.data.dimensions.width;
			this.data.dimensions.height = data.dimensions.height || this.data.dimensions.height;
		}

		if(data.ticks){									// If parameter data has ticks, copy them over to
														// Chart's data
			this.data.ticks.xaxis = data.ticks.xaxis || this.data.ticks.xaxis;
			this.data.ticks.yaxis = data.ticks.yaxis || this.data.ticks.yaxis;
		}


		if(Array.isArray(data.data)){					// Copy over data to category if Array
			for(i = 0, len = data.data.length; i < len; ++i){
				item = data.data[i];
				date = new Date(item.time);
				for(key in item){
					if(key === "time"){
						continue;
					}

					this.data.category[key] = this.data.category[key] || [];

					this.data.category[key].push({
						year : date.getYear(),
						month : date.getMonth(),
						value : Number(item[key])
					});

				}

				// Push current date to date Array
				this.data.dateArray.push({
					year : date.getYear(),
					month : date.getMonth()
				});

			}	// End for loop
		}	// End copy data 
		
		// Sorting each category's data array by time
		for(key in this.data.category){
			this.data.category[key].sort(sortByTime);
		}
		// Sorting the date array
		this.data.dateArray.sort(sortByTime);
	}	// End Chart Constructor Function

	Chart.prototype.getMinX = function(){
		return this.data.dateArray[0];
	}	//  End getMinX

	Chart.prototype.getMaxX = function(){
		return this.data.dateArray[this.data.dateArray.length - 1];
	}	//  End getMaxX

	Chart.prototype.getMinY = function(idx){
		var i, len;									// Loop iteration variables
		var arr = this.data.category[idx];			// Fetching the required array
		var min;	
		for(i = 0, len = arr.length; i < len; ++i){
			min = min ? min : arr[i].value;			// Setting first index value of array to min

			if(min > arr[i].value){
				min = arr[i].value;
			}
		}
		return min;
	}	//  End getMinY
	
	Chart.prototype.getMaxY = function(idx){
		var i, len;									// Loop iteration variables
		var arr = this.data.category[idx];			// Fetching the required array
		var max;	
		for(i = 0, len = arr.length; i < len; ++i){
			max = max ? max : arr[i].value;			// Setting first index value of array to max

			if(max < arr[i].value){
				max = arr[i].value;
			}
		}
		return max;
	}	//  End getMaxY

	Chart.prototype.getX = function(){
		return this.data.dateArray;
	} // end getX

	Chart.prototype.getY = function(idx){
		return this.data.category[idx];
	} // end getY

	Chart.prototype.getWidth = function(){
		return this.data.dimensions.width;
	} // end getWidth
	Chart.prototype.getHeight = function(){
		return this.data.dimensions.height;
	} // end getHeight

	Chart.prototype.getAllVariables = function(){
		return Object.keys(this.data.category);
	}



	function Engine(chart){		// An object to fetch data from 'Chart' and make  
								// it more meaningful
		this.chart = chart;		// saved chart so that it can be used by other functions
	}

	Engine.prototype.__getYLimits = function(idx){	// Calculate a more good looking limit :)

		var minValue = this.chart.getMinY(idx);
		var maxValue = this.chart.getMaxY(idx);

		var difference = maxValue - minValue;

		// Algorithm to get more good looking ranges

		var numDig = numberOfDigits(difference);

		var beautyNumber = Math.pow(10, (numDig - 2)) * 5;

		/*if(difference < (Math.pow(10, numDig - 1) + ( 0.1 * Math.pow(10, numDig - 1)) )){
			beautyNumber = beautyNumber / 10;
		}*/

		minValue = Math.floor(minValue / beautyNumber) * beautyNumber;

		if((difference / maxValue) > 0.1){
			var newBeautyNumber = Math.pow(10, numberOfDigits(maxValue) - 2);
			beautyNumber = beautyNumber > newBeautyNumber ? beautyNumber : newBeautyNumber;
		}
		
		maxValue = Math.ceil(maxValue / beautyNumber) * beautyNumber;

		return { 
			min : minValue,
			max : maxValue
		};

	} // End getYLimits

	Engine.prototype.getYRange = function(idx){
		var i, j, temp;

		var rangeArray = [];			// final range array that the 
										// function will return
		var calcMin = this.__getYLimits(idx).min;
		var calcMax = this.__getYLimits(idx).max;
		var computedMin, computedMax;	// variable to store final limits of
										// calculated range
		var difference;
		var steps;						// Variable to store steps from
										// min to max

		var twoDigitMin, twoDigitMax;	// Variables to store leading 
										// two digits of max and min 

		var stepsDown = 0;				// A variable to store how 
										// many divisions were made

		twoDigitMax = calcMax;

		while(twoDigitMax > 99){
			twoDigitMax /= 10;
			++stepsDown;
		}	

		twoDigitMin = Math.floor(calcMin / (Math.pow(10, stepsDown)));

		difference = twoDigitMax - twoDigitMin;

		if(difference <= 1){
			steps = 0.2;
		} else if(difference <= 3){
			steps = 0.5;
		} else if(difference <= 6){
			steps = 1;
		} else if(difference <= 12){
			steps = 2;
		} else if(difference <= 20){
			steps = 4;
		} else if(difference <= 30){
			steps = 5;
		} else if(difference <= 40){
			steps = 7;
		} else {
			steps = 10;
		}

		computedMin = Math.floor(twoDigitMin / steps) * steps;
		computedMax = Math.ceil(twoDigitMax / steps) * steps;

		// Step up; Multiplying the value to min-max that was divided before

		steps *= Math.pow(10, stepsDown);
		computedMin *= Math.pow(10, stepsDown);
		computedMax *= Math.pow(10, stepsDown);

		temp = computedMin;

		while(temp <= computedMax){
			rangeArray.push(temp);
			temp += steps;
		}

		return rangeArray;
	} // End getYRange

	Engine.prototype.getXRange = function(){
		var minValue = joinDate(this.chart.getMinX().year, this.chart.getMinX().month);
		var maxValue = joinDate(this.chart.getMaxX().year, this.chart.getMaxX().month);

		var steps = Math.floor((maxValue - minValue) / 5) ;
		var rangeArray = [];

		while(minValue <= maxValue){
			rangeArray.push(minValue);
			minValue += steps;
		}
		if(minValue !== maxValue){
			rangeArray.push(minValue);
		}
		return rangeArray;

	} // end getXrange

	Engine.prototype.getXRangeOfVariable = function(idx){
		var i, len, item;	// Loop variables
		var dataArray = this.chart.getY(idx);
		var yDateArray = [];

		for(i = 0, len = dataArray.length; i < len; ++i){
			item = dataArray[i];
			yDateArray[i] = joinDate(item.year, item.month);
		}
		return yDateArray;

	}
	Engine.prototype.getYRangeOfVariable = function(idx){
		var i, len, item;	// Loop variables
		var dataArray = this.chart.getY(idx);
		var yDataArray = [];

		for(i = 0, len = dataArray.length; i < len; ++i){
			item = dataArray[i];
			yDataArray[i] = item.value;
		}
		return yDataArray;

	}

	Engine.prototype.render = function(selector){
		
		var i, len, key, dateItem, prevDateItem, valueItem, prevValueItem;	// Loop variables
		
		var allVariables = this.chart.getAllVariables();

		for(var idx in allVariables){
			key = allVariables[idx];
			console.log(key);
			console.log(this.getYRange(key).toString());
			console.log(this.getXRangeOfVariable(key).toString());
			console.log(this.getYRangeOfVariable(key).toString());
			var render = new RenderEngine(selector, this.chart.getWidth(), this.chart.getHeight());
			render.drawYAxis(this.getYRange(key));
			render.drawXAxis(this.getXRange());

			var dateOfVariable = this.getXRangeOfVariable(key);
			var valueOfVariable = this.getYRangeOfVariable(key);

			for(i = 1, len = dateOfVariable.length; i < len; ++i){
				dateItem = dateOfVariable[i];
				prevDateItem = dateOfVariable[i - 1];
				valueItem = valueOfVariable[i];
				prevValueItem = valueOfVariable[i - 1];
				render.plotLine(prevDateItem, prevValueItem, dateItem, valueItem);
			}
			for(i = 0, len = dateOfVariable.length; i < len; ++i){
				dateItem = dateOfVariable[i];
				valueItem = valueOfVariable[i];
				render.plotCircle(dateItem, valueItem);
			}

		}
	}

	function RenderEngine(selector, width, height){
		width = width ? width : 600;
		height = height ? height : 500;
		this.rootElement = document.getElementById(selector);				 // getting parent element
		this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");	// creating canvas
		this.svg.setAttribute("height", height);	
		this.svg.setAttribute("width", width);
		this.rootElement.appendChild(this.svg);	// adding our canvas to parent element
		this.marginX = 25;						// Margin will be used for labels
		this.marginY = 25;						// and ticks
		this.width = width;						// Storing height and width
		this.height = height;					// for future uses
		this.shiftRatio = 0.9;					// Shifting values for better
		this.shiftOriginX = 0.03 * this.width;	// screen accomodation
		this.shiftOriginY = 0.03 * this.height;
	}

	RenderEngine.prototype.__shiftX = function(coor){
		return coor * this.shiftRatio + this.shiftOriginX;
	} // End __shiftX

	RenderEngine.prototype.__shiftY = function(coor){
		return coor * this.shiftRatio + this.shiftOriginY;
	} // End __shiftY

	RenderEngine.prototype.__drawLine = function(x1, y1, x2, y2, style){	// Private function to 
																					// draw lines
		var coord1 = this.convert(x1, y1);			// Getting converted axis
		var coord2 = this.convert(x2, y2);			// according to canvas
		var lineStyle = style ? style : "stroke:rgb(255,0,0);stroke-width:0.9";
		var line = document.createElementNS("http://www.w3.org/2000/svg", "line");	// creating our 
																					// element line.

		line.setAttribute("x1", coord1.x);	// setting line 
		line.setAttribute("y1", coord1.y);	// coordinates
		line.setAttribute("x2", coord2.x);	// and styles
		line.setAttribute("y2", coord2.y);	// with shifting

		line.setAttribute("style", lineStyle);
		this.svg.appendChild(line);					// Drawing line to our canvas
	} // end constructor function

	
	RenderEngine.prototype.__drawCircle = function(x, y, r, style, tooltip){	// Private function to 
																					// draw circle
		var coord = this.convert(x, y);			// according to canvas
		var circleStyle = style ? style : "stroke:rgb(255,0,0);stroke-width:1;fill:blue";
		var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");	// creating our 
																					// element line.

		circle.setAttribute("cx", coord.x);	// setting circle 
		circle.setAttribute("cy", coord.y);	// coordinates
		circle.setAttribute("r", r);			// and styles

		circle.setAttribute("style", circleStyle);

		// Tooltip logic
		if(tooltip){
			var textEl = document.createElementNS("http://www.w3.org/2000/svg", "title");
			textEl.innerHTML = tooltip;
			circle.appendChild(textEl);
		}


		this.svg.appendChild(circle);					// Drawing line to our canvas
	} // end constructor function

	RenderEngine.prototype.convert = function (x, y){
		return {
			x : x + this.marginX,
			y : this.height - (y + this.marginY)
		};
	} // end convert

	RenderEngine.prototype.__xRangeEstimateGenerator = function(min, max){
		var _this = this;
		return function(num){
			return this.__shiftX(((num - min) / (max - min)) * _this.width);
		}
	}	// End yRangeEstimator

	RenderEngine.prototype.__yRangeEstimateGenerator = function(min, max){
		var _this = this;
		return function(num){
			return this.__shiftY(((num - min) / (max - min)) * _this.height);
		}
	}	// End yRangeEstimator

	RenderEngine.prototype.drawXAxis = function(rangeArray){
		var i, len, item;			// Loop iteration variables
		// Drawing X axis 
		var x1 = -1 * this.marginX;
		var x2 = this.width;
		var y1 = 0;
		var y2 = 0;
 		this.__drawLine(x1, y1, x2, y2);

 		// Drawing the ticks
 		var firstItem = rangeArray[0]; 
 		var lastItem = rangeArray[rangeArray.length - 1]; 

 		this.xRangeEstimator = this.__xRangeEstimateGenerator(firstItem, lastItem);

 		for(i = 0, len = rangeArray.length; i < len; ++i){
 			item = rangeArray[i];
			x1 = this.xRangeEstimator(item);
			x2 = this.xRangeEstimator(item);
			y1 = -4;
			y2 = 4;
	 		this.__drawLine(x1, y1, x2, y2); 			
 		}
	} // end draw x axis

	RenderEngine.prototype.drawYAxis = function(rangeArray){
		var i, len, item;
		var x1 = 0;
		var x2 = 0;
		var y1 = -1 * this.marginX;
		var y2 = this.height;
 		this.__drawLine(x1, y1, x2, y2, undefined, true);
 		// Drawing the ticks
 		var firstItem = rangeArray[0]; 
 		var lastItem = rangeArray[rangeArray.length - 1];

 		this.yRangeEstimator = this.__yRangeEstimateGenerator(firstItem, lastItem);

 		for(i = 0, len = rangeArray.length; i < len; ++i){
 			console.log(rangeArray.toString())
 			item = rangeArray[i];
			y1 = this.yRangeEstimator(item);
			y2 = this.yRangeEstimator(item);
			x1 = -4;
			x2 = 4;
			this.__placeText(x1, y1, shortNumber(rangeArray[len - i - 1]));
	 		this.__drawLine(x1, y1, x2, y2, undefined, true); 			
 		}
	} // end drawYAxis

	RenderEngine.prototype.__placeText = function(x, y, text){
		var textElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
		textElement.setAttribute("x", x + 5);
		textElement.setAttribute("y", y);
		textElement.setAttribute("style", "font-size: 13px; text-align : center")
		textElement.innerHTML = text;
		this.svg.appendChild(textElement);
	} // End placetext

	RenderEngine.prototype.plotLine = function(x1, y1, x2, y2, style){
		x1 = this.xRangeEstimator(x1);
		x2 = this.xRangeEstimator(x2);
		y1 = this.yRangeEstimator(y1);
		y2 = this.yRangeEstimator(y2);
		style = style ? style : "stroke:rgb(0,0,230);stroke-width:1";
		this.__drawLine(x1, y1, x2, y2, style);
	}

	RenderEngine.prototype.plotCircle = function(x, y, style){
		var value = y;
		x = this.xRangeEstimator(x);
		y = this.yRangeEstimator(y);
		style = style ? style : "stroke:rgb(0,0,230);stroke-width:1;fill: blue";

		this.__drawCircle(x, y, 3, style, value);
	}


})();