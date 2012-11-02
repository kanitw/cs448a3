(function(d3) {

  window.ORDINAL_TYPE = "ordinal";
  window.ID_TYPE = "id";

  window.COL_SPLIT = "$";

  window.dim_col_name = function(full_name){
    return full_name.substr(full_name.indexOf(COL_SPLIT)+1);
  }

  window.parallel = function(model,dimensionType) {
    var self = {},
        dimensions,
        dragging = {},
        highlighted = null,
        container = d3.select("#parallel");

    var line = d3.svg.line().interpolate('cardinal').tension(0.85),
        axis = d3.svg.axis().orient("left"),
        background,
        foreground;
  
    var mydata = model.get('data');
    var dimensionType = dimensionType;
    var checkbox = {};
    var x=null, y=null, svg=null;
    var bounds,m,w,h;
    
    self.update = function(data) {
      mydata = data;
    };

    var init = function(){

      dimensions = d3.keys(mydata[0]).filter(function(d) {
        return d != "name";
        
      });

      // FILTER DIMENSION SECTION


      dimensions.getActive = function(){
        return this.filter(function(d){
          return checkbox[d]["checked"];
        });
      }; 

      d3.select("#col-tab").selectAll("input")
        .data(dimensions)
        .enter().append("span").attr("class","dim-filter").each(function(d){

          var block = d3.select(this); 
          block.append("input").attr("type","checkbox")
            .attr("checked",true)
            .each(function(d){
            checkbox[d] = this;
          }).on("click", function(d,i){
            console.log(dimensions.getActive());
            self.render();
          });
          block.append("span").html(d);
        });

      // END OF FILTER DIMENSION SECTION

      
    };

    init();


    
    self.render = function() {
      bounds = [ $(container[0]).width(), $(container[0]).height() ];
      m = [60, 10, 10, 10];
      w = bounds[0] - m[1] - m[3];
      h = bounds[1] - m[0] - m[2];

      container.select("svg").remove();

      svg = container.append("svg:svg")
          .attr("width", w + m[1] + m[3])
          .attr("height", h + m[0] + m[2])
        .append("svg:g")
          .attr("transform", "translate(" + m[3] + "," + m[0] + ")");
      
      

      x = d3.scale.ordinal().rangePoints([0, w], 1);
      y = {};


      _(dimensions).each(function(d) {
        if(dimensionType[d]==ORDINAL_TYPE || dimensionType[d]==ID_TYPE){
          // scale data to work with ordinal
          cols = mydata.map(function(row){return row[d]}).sort().reverse();
          // console.log(cols);
          y[d] = d3.scale.ordinal()
            .domain(cols)
            .rangePoints([h, 0],1);
        } else {
          
          y[d] = d3.scale.linear()
            .domain(d3.extent(mydata, function(p) { return +p[d]; }))
            .range([h, 0]);
        }
      });
      // var margin = {top: 30, right: 10, bottom: 10, left: 10},
      //     width = 960 - margin.right - margin.left,
      //     height = 500 - margin.top - margin.bottom;


      mydata = mydata.filter(function(d){
        keys = d3.keys(mydata[0]);
        return keys.every(function(key){
          // console.log(d[key]);
          return d[key]!="NULL";
        });

      })





    // console.log(dimensionType);
    x.domain(dimensions.getActive());
    
    // Add grey background lines for context.
    background = svg.append("svg:g")
        .attr("class", "background")
      .selectAll("path")
        .data(mydata)
      .enter().append("svg:path")
        .attr("d", path);

    // Add blue foreground lines for focus.
    foreground = svg.append("svg:g")
        .attr("class", "foreground")
      .selectAll("path")
        .data(mydata)
      .enter().append("svg:path")
        .attr("d", path);

    var activeDim = dimensions.getActive();
    var axis_distance = activeDim.length > 1 ? (position_div(activeDim[1])-position_div(activeDim[0])) : w;
    var overlay_width = Math.min(150,axis_distance*0.9);
    

    var overlays = d3.select("#overlays").selectAll(".axis-overlay")
      .data(activeDim);
    overlays.style("left",position_div);
    overlays.exit().remove();
    overlays.enter().append("div")
      .attr("class","axis-overlay");
    overlays.style("left",position_div)
      .style("width",overlay_width)
      .style("margin-left",-overlay_width/2);
      
      // .call(d3.behavior.drag()
      //     .on("dragstart", dragstart)
      //     .on("drag", drag)
      //     .on("dragend",dragend))

    var bottom_overlays = d3.select("#bottom-overlays").selectAll(".bottom-overlay")
      .data(activeDim);
    bottom_overlays.style("left",position_div);
    bottom_overlays.exit().remove();
    bottom_overlays.enter().append("div")
        .attr("class","bottom-overlay")
        .style("left",position_div)
        .style("width",overlay_width)
        .style("margin-left",-overlay_width/2)
        .html(function(d){
          return "";
        });

    // Add a group element for each dimension.
    var g = svg.selectAll(".dimension")
        .data(dimensions.getActive());
      g.enter().append("svg:g")
        .attr("class", "dimension")
        .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
        .call(d3.behavior.drag()
          .on("dragstart", dragstart)
          .on("drag", drag)
          .on("dragend",dragend));

      // Add an axis and title.
      g.append("svg:g")
          .attr("class", "axis")
          .each(function(d) {
            if(dimensionType[d] == ID_TYPE){
              // d3.select(this).tickFormat("");
              d3.select(this).attr("class","axis axis-id");
            }
             d3.select(this).call(axis.scale(y[d])); 
            
          })
        .append("svg:text")
          .attr("text-anchor", "middle")
          .attr("y", -47)
          .text(String);


      // Add and store a brush for each axis.
      g.append("svg:g")
          .attr("class", "brush")
          .each(function(d) { d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brush", brush)); })
        .selectAll("rect")
          .attr("x", -12)
          .attr("width", 24);

      function dragstart(d){
        console.log("dragstart"+d);
        dragging[d] = this.__origin__ = x(d);
        background.attr("visibility", "hidden");
      }

      function drag(d){

        dragging[d] = Math.min(w, Math.max(0, this.__origin__ += d3.event.dx));
        foreground.attr("d", path);
        dimensions.sort(function(a, b) { return position(a) - position(b); });
        x.domain(dimensions);
        g.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
        bottom_overlays.style("left",position_div);
        overlays.style("left",position_div);
      }

      function dragend(d) {
        delete this.__origin__;
        delete dragging[d];
        transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");

        transition(bottom_overlays).style("left",position_div);
        transition(overlays).style("left",position_div);
        transition(foreground)
            .attr("d", path);
        background
            .attr("d", path)
            .transition()
            .delay(500)
            .duration(0)
            .attr("visibility", null);
      }
      
      function position(d) {
        var v = dragging[d];
        return v == null ? x(d) : v;
      }

      function position_div(d){
        return position(d) + m[3];
      }
      
      // Returns the path for a given data point.
      function path(d) {
        return line(dimensions.getActive().map(function(p) { return [position(p), y[p](d[p])]; }));
      }
      
      // Handles a brush event, toggling the display of foreground lines.
      function brush() {
        var actives = dimensions.getActive().filter(function(p) {
          return !y[p].brush.empty();
         })
         
        var extents = actives.map(function(p) {
          return y[p].brush.extent();
        });
        
        /** To be factored **/
        var filter = {};
        _(actives).each(function(key, i) {
          filter[key] = {
            min: extents[i][0],
            max: extents[i][1]
          }
        });

        bottom_overlays.html(function(d){
          if(!y[d].brush.empty()){
            var extent = y[d].brush.extent();
            if(dimensionType[d] == ORDINAL_TYPE || dimensionType[d]==ID_TYPE){
              return "*filtered*";
            }

            return Math.floor(extent[0]).toString() + "&lt;" + dim_col_name(d) + "&lt;" + Math.ceil(extent[1]).toString();
          }else {
            return "";
          }

        });

        model.set({filter: filter, y: y, dimensionType: dimensionType});
        /***/
        foreground.style("display", function(d) {
          return actives.every(function(p, i) {
              var data;
              if(dimensionType[p] == ORDINAL_TYPE || dimensionType[p]==ID_TYPE)
                data = y[p](d[p])
              else
                data = d[p];

              return extents[i][0] <= data && data <= extents[i][1];
          }) ? null : "none";
        });
      }
      function search(str) {
        foreground.style("display", function(d) {
          return actives.every(function(p, i) {
              return d[p] == str;
          }) ? null : "none";
        });
      }      
      function transition(g) {
        return g.transition().duration(500);
      }
      
      self.highlight = function(i) {
        if (typeof i == "undefined") {
          d3.select("#parallel .foreground").style("opacity", function(d, j) {
            return "1";
          });
          highlighted.remove();
        } else {
          d3.select("#parallel .foreground").style("opacity", function(d, j) {
            return "0.35";
          });
          if (highlighted != null) {
            highlighted.remove();
          }
          highlighted = svg.append("svg:g")
                           .attr("class", "highlight")
                         .selectAll("path")
                           .data([model.get('filtered')[i]])
                         .enter().append("svg:path")
                           .attr("d", path)
        }
      };
    }
    
    return self;
  };
  
})(d3);
