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
        foreground, 
        charts,
        overlay_width;
  
    var mydata = model.get('data');
    var dimensionType = dimensionType;
    var dim_group={};

    var dim_group_key=[];
    var checkbox = {};
    var x=null, y=null, svg=null;
    var bounds,m,w,h;
    
    self.update = function(data) {
      mydata = data;
    };

    var init = function(){
      mydata = mydata.filter(function(d){
        keys = d3.keys(mydata[0]);
        return keys.every(function(key){
          // console.log(d[key]);
          return d[key]!="NULL";
        });

      })


      dimensions = d3.keys(mydata[0]).filter(function(d) {
        return d != "name";
      });

      dimensions.getActive = function(){
        return this.filter(function(d){
          return checkbox[d]["checked"];
        });
      }; 

      // FILTER DIMENSION SECTION

      _(dimensions).each(function(d){
        var grp = d.substr(0,d.indexOf(COL_SPLIT));
        if(!dim_group[grp]){
          dim_group[grp] = [d];
          dim_group_key.push(grp);
        }else {
          dim_group[grp].push(d);
        }
      });

      d3.select("#col-tab").selectAll("div")
        .data(dim_group_key)
        .enter().append("div")
        .attr("class","col-row")
        .each(function(grp){
          var grp_div = d3.select(this);
          grp_div.append("span").attr("class","grp-header").html(grp);
          var grp_sel = grp_div.append("span").attr("class","grp-sel");
          
          grp_sel.selectAll("span")
            .data(dim_group[grp]).enter()
            .append("span").attr("class","dim-filter")
            .each(function(d){

              var block = d3.select(this); 
              block.append("input").attr("type","checkbox")
                .attr("checked",true)
                .each(function(d){
                checkbox[d] = this;
              }).on("click", function(d,i){
                console.log(dimensions.getActive());
                self.render();
              });
              block.append("span").html(dim_col_name(d));
            });
        });


       

      // d3.select("#col-tab").selectAll("input")
      //   .data(dimensions)
      //   .enter().append("span").attr("class","dim-filter").each(function(d){

      //     var block = d3.select(this); 
      //     block.append("input").attr("type","checkbox")
      //       .attr("checked",true)
      //       .each(function(d){
      //       checkbox[d] = this;
      //     }).on("click", function(d,i){
      //       console.log(dimensions.getActive());
      //       self.render();
      //     });
      //     block.append("span").html(d);
      //   });

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
    overlay_width = Math.min(150,axis_distance*0.9);
    
    //overlay

    var overlays = d3.select("#overlays").selectAll(".axis-overlay")
      .data(activeDim);
    overlays.style("left",position_div);
    overlays.exit().remove();
    overlays.enter().append("div")
      .attr("class","axis-overlay")
      .append("a").attr("class","btn btn-mini btn-super-mini btn-toggle").html("<i class='icon-signal'></i>").on("click",function(d){

      });
    overlays.style("left",position_div)
      .style("width",overlay_width)
      .style("margin-left",-overlay_width/2);
      
      // does not work yet.
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
          .attr("class","axis-head")
          .attr("text-anchor", "middle")
          .attr("y", -47)
          .text(String);

      chart = g.append("svg:g")
        .attr("class", "chart");

      drawChart();
        

      var brushgroup = {};


      // Add and store a brush for each axis.
      g.append("svg:g")
          .attr("class", "brush")
          .each(function(d) { 
            (brushgroup[d] = d3.select(this))
              .call(y[d].brush = d3.svg.brush().y(y[d]).on("brush", brush)); 
          })
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

        bottom_overlays.each(function(d){
          var b_overlay = d3.select(this);
          b_overlay.selectAll("span").remove();
          if(!y[d].brush.empty()){
            var extent = y[d].brush.extent();
            var detail = ""
            if(dimensionType[d] == ORDINAL_TYPE || dimensionType[d]==ID_TYPE){
              detail = "*filtered*";
            }else{
              detail = Math.floor(extent[0]).toString() + "&lt;" + dim_col_name(d) + "&lt;" + Math.ceil(extent[1]).toString();
            }
            b_overlay.append("span").attr("class","detail").html(detail);
            b_overlay.append("span").attr("class","cleaner")
              .append("a").attr("class","close").attr("href","#")
              .html("&times;").on("click",function(d){
                y[d].brush.clear();
                y[d].brush(brushgroup[d]);
                brush();
              });
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
        drawChart();
      }

      function drawChart(){
        console.log("drawChart");
        chart.each(function(d){
          var dist = {};

          model.get('filtered').forEach(function(row){
              if(!dist[row[d]]){
                dist[row[d]] =1;
              }else {
                dist[row[d]]++;
              }
            });

          // console.log(_(dist).values());
          var dist_keys = _(dist).keys();
          var dist_values = _(dist).values();
          var dist_pairs = _(dist).pairs();
          var cx = d3.scale.linear().range([0,overlay_width*0.25]).domain(d3.extent(dist_values));
          // console.log("_"+_(dist).pairs);

          
          var height = 2;
          if(dimensionType[d] == ID_TYPE || dimensionType[d] == ORDINAL_TYPE){
            height = Math.min(h/_.uniq(dist_keys).length-1,10);
          }

          var bars = d3.select(this).selectAll(".bar")
            .data(dist_pairs);
          bars.exit().remove();
          bars.enter().append("rect").on("mouseover",function(p){
            console.log(d+":"+p[0]+","+p[1]);
          })

          bars.attr("class","bar")
              .attr("x",function(p){ return 0; })
              .attr("width",function(p){return cx(p[1]); /*cx(p[1]);*/})
              .attr("y",function(p){ return y[d](p[0])-height/2; })
              .attr("height",height);



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
          d3.select("#parallel .foreground").classed("faded",false);
          highlighted.remove();
        } else {
          d3.select("#parallel .foreground").classed("faded",true);
          console.log("fg"+d3.select("#parallel .foreground").attr("class"));
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
