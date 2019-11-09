var margin = {left: 40, top: 20, right: 20, bottom: 20},	width = Math.min($("#chart").width(), 1100) - margin.left - margin.right,
	height = width*1/2;

var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

 var xScale = d3.scale.log().domain([300, 1e5]).range([0, width]),
    yScale = d3.scale.linear().domain([10, 95]).range([height, 0]),
    radiusScale = d3.scale.sqrt().domain([0, 5e8]).range([0, width * 0.05]),
    colorScale = d3.scale.category20();
var formatX = d3.format(".1s");

var xAxis = d3.svg.axis().scale(xScale).orient("bottom").ticks(8, formatX);
var yAxis = d3.svg.axis().scale(yScale).orient("left");
var format = d3.format(".2s");

svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);

svg.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height - 6)
    .text("Total income of a nation (GDP)");

svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", 6)
    .attr("dy", ".55em")
    .attr("transform", "rotate(-90)")
    .text("Population w.r.t GDP");

var label = svg.append("text")
    .attr("class", "year label")
    .attr("text-anchor", "end")
    .attr("y", height - 24)
    .attr("x", width)
		.attr("style", "font-size:" + (width * 0.2).toString() + "px")
    .text(1800);

var tip = d3.tip()
  .attr('class', 'd3-tip')
  .direction('s')
  .html(function(d) {
    return "<p><strong>" + d.name + "</strong></p><p><strong>Population: </strong>" + format(d.population) + "</p>";
  })

 function x(d) { return d.income; }
function y(d) { return d.lifeExpectancy; }
function radius(d) { return d.population; }
function color(d) { return d.region; }
function key(d) { return d.name; }

d3.json("C:\\Users\\Kunal Dhariwal\\Desktop\\csvjson.json", function(csvjson) {
  	var bisect = d3.bisector(function(d) { return d[0]; });

  	var dot = svg.append("g")
    		.call(tip)
    		.attr("class", "dots")
    	.selectAll(".dot")
    		.data(interpolateData(1800))
    	.enter().append("circle")
    		.on('mouseover', tip.show)
     		.on('mouseout', tip.hide)
    		.attr("class", function (d) { return "dot " + d.name; })
      	.style("fill", function(d) { return colorScale(color(d)); })
      	.call(position)
      	.sort(order);
  
  	var box = label.node().getBBox();
  
  	var overlay = svg.append("rect")
    		.attr("class", "overlay")
    		.attr("x", box.x)
    		.attr("y", box.y)
    		.attr("width", box.width)
    		.attr("height", box.height)
    		.on("mouseover", enableInteraction);
  
  	svg.transition()
      	.duration(15000)
      	.ease("linear")
      	.tween("year", tweenYear)
      	.each("end", enableInteraction);
  
  	function position(dot) {
      	dot.attr("cx", function(d) { return xScale(x(d)); })
          	.attr("cy", function(d) { return yScale(y(d)); })
          	.attr("r", function(d) { return radiusScale(radius(d)); });
    		}
  
  	function order(a, b) { return radius(b) - radius(a); }
  
  	function enableInteraction() {
      	var yearScale = d3.scale.linear()
        	.domain([1960, 2018])
        	.range([box.x + 12, box.x + box.width - 12])
        	.clamp(true);

      	svg.transition().duration(0);

      	overlay
          	.on("mouseover", mouseover)
          	.on("mouseout", mouseout)
          	.on("mousemove", mousemove)
          	.on("touchmove", mousemove);

      	function mouseover() { label.classed("active", true); }
      	function mouseout() { label.classed("active", false); }
      	function mousemove() { displayYear(yearScale.invert(d3.mouse(this)[0])); }
  	}
  	function tweenYear() {
      	var year = d3.interpolateNumber(1960, 2018);
      	return function(t) { displayYear(year(t)); };
    }

  	function displayYear(year) {
      	console.log(dot.data(interpolateData(year), key).call(position).sort(order))
        dot.data(interpolateData(year), key).call(position).sort(order);
      	label.text(Math.round(year));
    }

  	function interpolateData(year) {
      	return csvjson.map(function(d) {
          	return {
              	name: d.name,
              	region: d.region,
              	income: interpolateValues(d.GDP, year),
              	population: interpolateValues(d.population, year),
              	lifeExpectancy: interpolateValues(d.popgdp, year)
            };
        });
    }

  	function interpolateValues(values, year) {
      	var i = bisect.left(values, year, 0, values.length - 1),
            a = values[i];
      	if (i > 0) {
          	var b = values[i - 1],
                t = (year - a[0]) / (b[0] - a[0]);
          	return a[1] * (1 - t) + b[1] * t;
        }
      return a[1];
    }
});
