//CONSTANT
var ORDINAL_TYPE = "ORDINAL_TYPE";
var ID_TYPE = "ID_TYPE";

var margin = {top: 30, right: 10, bottom: 10, left: 10},
    width = 960 - margin.right - margin.left,
    height = 500 - margin.top - margin.bottom;

var x = d3.scale.ordinal()
    .rangePoints([0, width], 1);

var y = {};

var dimensionType={
  age_range: ORDINAL_TYPE,
  location: ORDINAL_TYPE,
  gender: ORDINAL_TYPE,
  team_id: ID_TYPE,
  user_id: ID_TYPE
};

var line = d3.svg.line(),
    axis = d3.svg.axis().orient("left"),
    background,
    foreground;

var svg = null;

d3.csv("test02.csv", function(data) {
  this.data = data;
  this.dimensions =null;
  this.checkbox = {};
  
  this.init = function(){
    //Filter Data
    data = data.filter(function(d){
      keys = d3.keys(data[0]);
      return keys.every(function(key){
        // console.log(d[key]);
        return d[key]!="NULL";
      });

    })

    //setup dimension
    this.dimensions = d3.keys(data[0]).filter(function(d) {
      if(dimensionType[d]==ORDINAL_TYPE || dimensionType[d]==ID_TYPE ){
        
        // console.log(data[d]);
        // scale data to work with ordinal
        cols = data.map(function(row){return row[d]}).sort().reverse();
        // console.log(cols);
        return d != "name" && (y[d] = d3.scale.ordinal()
          .domain(cols)
          .rangePoints([height, 0]),1);
      }
      else {
        
        return d != "name" && (y[d] = d3.scale.linear()
          .domain(d3.extent(data, function(p) { return +p[d]; }))
          .range([height, 0]));
      }
    });

    
    dimensions.getActive = function(){
    return this.filter(function(d){
      return checkbox[d]["checked"];
    });
  }
    
    // add input box for each data
    d3.select("#control").selectAll("input")
      .data(dimensions)
      .enter().append("div").each(function(d){

        var div = d3.select(this); 
        div.append("input").attr("type","checkbox")
          .attr("checked",true)
          .each(function(d){
          checkbox[d] = this;
        }).on("click", function(d,i){
          // console.log(dimensions.getActive());
          render();
        });
        div.append("span").html(d);
      });
  }

  this.render = function (){
    x.domain(dimensions.getActive());
    d3.select("#view svg").remove();
    svg = d3.select("#view").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

    // Add grey background lines for context.
    background = svg.append("g")
        .attr("class", "background")
      .selectAll("path")
        .data(data)
      .enter().append("path")
        .attr("d", path);

    // Add blue foreground lines for focus.
    foreground = svg.append("g")
        .attr("class", "foreground")
      .selectAll("path")
        .data(data)
      .enter().append("path")
        .attr("d", path);

    // Add a group element for each dimension.
    var g = svg.selectAll(".dimension")
        .data(dimensions.getActive())
      .enter().append("g")
        .attr("class", "dimension")
        .attr("transform", function(d) { return "translate(" + x(d) + ")"; });

    // Add an axis and title.
    g.append("g")
        .attr("class", "axis")
        .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
      .append("text")
        .attr("text-anchor", "middle")
        .attr("y", -9)
        .text(String);

    // Add and store a brush for each axis.
    g.append("g")
        .attr("class", "brush")
        .each(function(d) { d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brush", brush)); })
      .selectAll("rect")
        .attr("x", -8)
        .attr("width", 16);

  }
  //Create Data Dimension with Dimension Types
  init();
  render();

  
});


// Returns the path for a given data point.
function path(d) {
  return line(dimensions.getActive().map(function(p) { return [x(p), y[p](d[p])]; }));
}

// Handles a brush event, toggling the display of foreground lines.
function brush() {
  var actives = dimensions.getActive().filter(function(p) { return !y[p].brush.empty(); }),
      extents = actives.map(function(p) { return y[p].brush.extent(); });
  console.log("brush activated");
  foreground.style("display", function(d) {
    return actives.every(function(p, i) {
      // console.log(p + "," + d[p]);
      if(dimensionType[p] == ORDINAL_TYPE || dimensionType[p] == ID_TYPE){
        var _y  = y[p](d[p]);
        return extents[i][0] <=  _y && _y <= extents[i][1];
      }else {
        return extents[i][0] <= d[p] && d[p] <= extents[i][1];
      }
    }) ? null : "none";
  });
}