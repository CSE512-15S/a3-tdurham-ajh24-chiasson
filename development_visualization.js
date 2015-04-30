/****************************************************************
* 3D C. Elegans Development
* Melissa Chiasson, Timothy Durham, Andrew Hill
* CSE 512, Spring 2015
* Javascript file to initialize and control visualizations of 
* C. Elegans Development.
****************************************************************/


/****************************************************************
GLOBAL VARIABLES
****************************************************************/

//contains the data for each timepoint/cell
var csvdata = [];

//maps cell name to an index into this.csvdata for each time point
var namemap = [];

//detect when all time points are loaded
var ready = false;

//blastomere predecessors are not as systematic as their daughters
var blastpred = {P0:'', AB:'P0', P1:'P0', EMS:'P1', P2:'P1',
                 MS:'EMS', E:'EMS', P3:'P2', C:'P2', P4:'P3', 
                 D:'P3', Z2:'P4', Z3:'P4'};

//timepoint counter for automated iteration through time points
var timepoint = 0;

//interval id for playback of development
var playback_id;

//3d variables
var x3d, scene;

//other variables from scatterplot3D
var axisRange = [-1000, 1000];
var scales = [];
var initialDuration = 0;
var ease = 'linear';
var axisKeys = ["x", "y", "z"];

var load_idx = 0;

/****************************************************************
Lineage Highlighting Functions
****************************************************************/
function initializeLineagePicker() {
    //Text box and color picker
    var textbox = d3.select('body')
        .append('div').attr('class', 'lineageinput')
        .append('input').attr('type', 'text').attr('id', 'hicell').attr('size', 20).attr('placeholder', 'Enter lineage...')
        .text("Type cell name here.");
    var colorpicker = d3.select('div.lineageinput')
        .append('input').attr('type', 'color').attr("value", "#ff0000").attr('id', 'hicellcolor');
    //use jQuery to initialize the color picker on the hicellcolor input
    //$("#hicellcolor").val("#ff0000")
}

/****************************************************************
GRAPHICAL HELPER FUNCTIONS FOR 3D DEVELOPMENT PLOT
****************************************************************/
// Used to make 2d elements visible
function makeSolid(selection, color) {
    selection.append("appearance")
        .append("material")
        .attr("diffuseColor", color||"black")
    return selection;
}

// Initialize the axes lines and labels.
function initializePlot() {
    initializeAxis(0);
    initializeAxis(1);
    initializeAxis(2);
}

function initializeAxis( axisIndex ){
    var key = axisKeys[axisIndex];
    drawAxis( axisIndex, key, initialDuration );

    var scaleMin = axisRange[0];
    var scaleMax = axisRange[1];

    // the axis line
    var newAxisLine = scene.append("transform")
        .attr("class", axisKeys[axisIndex])
        .attr("rotation", ([[0,0,0,0],[0,0,1,Math.PI/2],[0,1,0,-Math.PI/2]][axisIndex]))
        .append("shape")
    newAxisLine
        .append("appearance")
        .append("material")
        .attr("emissiveColor", "lightgray")
    newAxisLine
        .append("polyline2d")
         // Line drawn along y axis does not render in Firefox, so draw one
         // along the x axis instead and rotate it (above).
        .attr("lineSegments", scaleMin + " 0," + scaleMax + " 0")
}

// Assign key to axis, creating or updating its ticks, grid lines, and labels.
function drawAxis( axisIndex, key, duration ) {
    var scale = d3.scale.linear()
        .domain( [-1000,1000] ) // demo data range
        .range( axisRange )
    
    scales[axisIndex] = scale;
}

// Update the data points (spheres) and stems.
function plotData( time_point, duration ) {
    if (!this.csvdata){
     console.log("no rows to plot.")
     return;
    }

    var x = scales[0], y = scales[1], z = scales[2];

    // Draw a sphere at each x,y,z coordinate.
    var timepoint_data = csvdata[time_point];
    var datapoints = scene.selectAll(".datapoint").data( timepoint_data, function(d){return d.name;});
    datapoints.exit().remove();

    var new_data = datapoints.enter().append('transform')
        .attr('translation', function(d){
            if (d.pred == -1){
                return x(d.x) + " " + y(d.y) + " " + z(d.z);
            }else{
                return x(d.pred.x) + " " + y(d.pred.y) + " " + z(d.pred.z);
        }})
        .attr('class', 'datapoint')
        .attr('id', function(d){return d.name})
        .attr('scale', function(d){var ptrad = d.radius * 0.5; return [ptrad, ptrad, ptrad]})
        .append('shape');
    
    new_data.append('appearance')
        .append('material').attr('diffuseColor', 'steelblue');
    
    new_data.append('sphere');

    //Code to highlight a specific lineage in green
//    var highlight = d3.select('#hicell').html(this.value);
    var highlight = document.getElementById('hicell').value;
    var color = $('#hicellcolor').val();
    console.log(color)
    console.log(highlight)
    if(highlight){
        datapoints.select(function(d){return d.name.substr(0, highlight.length) == highlight ? this : null;}).selectAll('shape appearance material').attr('diffuseColor', color);
        //make non-highlighted lineages more transparent
        datapoints.select(function(d){return d.name.substr(0, highlight.length) == highlight ? null : this;}).selectAll('shape appearance material').attr('transparency', 0.8);
    }

    datapoints.transition().ease(ease).duration(duration)
        .attr("translation", function(row) {
            return x(row.x) + " " + y(row.y) + " " + z(row.z);
        });
}

/****************************************************************
HELPER FUNCTIONS FOR DATA PARSING AND INITIALIZATION
****************************************************************/
function parseCSV(csvdata_in) {
    var rows = d3.csv.parseRows(csvdata_in);
    var filtered_rows = [], parsed_data = [];
    var row;
    var xmean = 0, ymean = 0, zmean = 0;
    for (var i=0; i < rows.length; i++){
        row = rows[i];
        if(row[9].trim()){
            var x = +row[5], y = +row[6], z = +row[7] * 11.1, r = +row[8];
            xmean += x;
            ymean += y;
            zmean += z;
            filtered_rows.push([x, y, z, r, row[9]]);
        }
    }

    xmean = xmean/filtered_rows.length;
    ymean = ymean/filtered_rows.length;
    zmean = zmean/filtered_rows.length;
    for (var i=0; i < filtered_rows.length; i++){
        row = filtered_rows[i];
        parsed_data.push({'succ': [],
                          'x': row[0] - xmean,
                          'y': row[1] - ymean,
                          'z': row[2] - zmean,
                          'radius': row[3],
                          'name': row[4].trim()
        });
    }
    return parsed_data;
}

function loadTimePoints(idx){
//    if (idx == max){
//        ready = true;
//
//        var cellLineage = getCellLineageMap(this.csvdata, idx)
//        plotCellLineageTree(cellLineage)
//
//        return;
//    }

    var basename = 't' + ("000" + (idx + 1)).substr(-3) + '-nuclei';
    var url = 'http://localhost:2255/timepoints/nuclei/' + basename;
    d3.text(url, function(tpdata){
        if (!tpdata){
            ready = true;
            d3.select('#timerange').attr('max', csvdata.length);
            // TODO this is here temporarily -- will be moved once updating of the tree is
            // implemented
            var cellLineage = getCellLineageMap(csvdata, idx);
            plotCellLineageTree(cellLineage);
            return;
        }
        csvdata[idx] = parseCSV(tpdata);
        namemap[idx] = {};
        for(var i = 0; i < this.csvdata[idx].length; i++){
            //make entry in namemap for this cell at this timepoint
            var cell = this.csvdata[idx][i];
            this.namemap[idx][cell.name] = i;
            //get predecessor
            var pred_idx = this.namemap[idx-1][cell.name];
            if(typeof pred_idx == 'undefined'){
                var pred_name;
                //blastomere names are not systematic, so we have to look them up
                if(cell.name in blastpred){
                    pred_name = blastpred[cell.name];
                }else{
                    pred_name = cell.name.substr(0, cell.name.length - 1);
                }
                pred_idx = this.namemap[idx-1][pred_name];
            }
            if(typeof pred_idx == 'undefined'){
                cell.pred = -1;
            }else{
                cell.pred = this.csvdata[idx-1][pred_idx];
                //add cell to its predecessor's successor array
                cell.pred.succ.push(cell);
            }
        }
        loadTimePoints(idx + 1);
    });
}

/****************************************************************
INITIALIZATION AND CALLBACKS FOR VISUALIZATION
****************************************************************/
//Function to handle start/stop playback of development
function playpausedev(){
    var button = document.getElementById('playpause');
    if(button.innerHTML === "Play"){
        playback_id = setInterval(development, 1000);
        button.innerHTML = "Pause";
    }else{
        clearInterval(playback_id);
        button.innerHTML = "Play";
    }
}

function initializeEmbryo() {
    d3.text('http://localhost:2255/timepoints/nuclei/t001-nuclei', function(t0data){
        csvdata[0] = parseCSV(t0data);
        namemap[0] = {};
        for(var i = 0; i < csvdata[0].length; i++){
            namemap[0][csvdata[0][i].name] = i;
            csvdata[0][i].pred = -1;
        }
        console.log("Got data:")

        console.log("Init Plot")
        initializePlot();
        initializeLineagePicker();
        console.log("Plot data")
        plotData(0, 5);
        loadTimePoints(1);

        // Build and plot the tree (Not yet working)
        //var cellLineage = getCellLineageMap(this.csvdata, 0)
        //plotCellLineageTree(cellLineage)

//        setInterval( development, 1000 );
    });
  }

function development() {
    if (ready && x3d.node() && x3d.node().runtime ) {
        var t_idx = timepoint % csvdata.length;
        plotData(t_idx,1000);
        timepoint = t_idx + 1;
        document.getElementById('timerange').value = timepoint;

        // Update and plot the tree (Not yet working)
        //var cellLineage = getCellLineageMap(this.csvdata, t_idx)
        //plotCellLineageTree(cellLineage)

    } else {
        console.log('x3d not ready.')
    }
}

//update the timepoint variable to match the slider value and run plotData
function updatetime() {
    timepoint = document.getElementById('timerange').value;
    plotData(timepoint, 500);
}

/****************************************************************
HELPER FUNCTIONS FOR LINEAGE TREE PLOTTING
****************************************************************/
function getCellLineageMap(endTimepoint) {
  // Create a list of {'name': name, 'parent': parent} from the loaded time points
  cell_lineage = []
  cell_lineage.push({'name': "root", "parent":'null'})

  // Loop over all time points 
  for (j = 0; j < this.csvdata.length; j++) {
    flat_data = this.csvdata[j]

    // For each cell in time point, record the nodes next to the root and any transitions
    for (i = 0; i < flat_data.length; i++) {
      var name = flat_data[i].name
      var parent_name = flat_data[i].pred.name
  
      if (name === parent_name && j == 1) {
        parent_name = "root"
        cell_lineage.push({"name": name, "parent": parent_name})
      } else if(j > 1 &&  name != parent_name){
        cell_lineage.push({"name": name, "parent": parent_name})
      }
    }
  }
  return cell_lineage;
}

function plotCellLineageTree(cell_lineage) {
  // create a name: node map
  var dataMap = cell_lineage.reduce(function(map, node) {
    map[node.name] = node;
    return map;
  }, {});

  // create the tree array
  var treeData = [];
  cell_lineage.forEach(function(node) {
    // add to parent
    var parent = dataMap[node.parent];
    if (parent) {
      // create child array if it doesn't exist
      (parent.children || (parent.children = []))
        // add node to child array
        .push(node);
    } else {
      // parent is null or missing
      treeData.push(node);
    }
  });

  // ************** Generate the tree diagram    *****************

 // Chart dimensions
var margin = {top: 10, right: 10, bottom: 10, left: 10},
    width = 2000 - margin.right - margin.left,
    height = 600 - margin.top - margin.bottom;

  // Various scales and distortions.
  var xScale = d3.fisheye.scale(d3.scale.linear).domain([-10, 300]).range([0, 1900]),
      yScale = d3.fisheye.scale(d3.scale.linear).domain([-20, 100]).range([1000, 0]),
      radiusScale = d3.scale.sqrt().domain([0, 5e8]).range([0, 40])

  // The x & y axes.
  var xAxis = d3.svg.axis().orient("bottom").scale(xScale),
      yAxis = d3.svg.axis().scale(yScale).orient("left");

  // Set up the SVG element
  var svg = d3.select("body")
    .append('div')
    .attr("class", 'lineage_tree')
    .append("svg")
      .attr("width", "100%")
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


      var distortion_slider = d3.select('.lineage_tree')
        .append('input')
          .attr('type', 'range')
          .attr('id', 'distortion_slider')
          .attr('defaultValue', 0)
          .attr('min', 0)
          .attr('max', width)
          .attr('step', 1)
          .attr('value', 0)

  // Now create the tree    
  var tree = d3.layout.tree()
      .size([height/2, width]);

  var diagonal = d3.svg.diagonal()
      .projection(function(d) { return [xScale(d.x), d.y]; });

  root = treeData[0];

  // Compute the tree layout.
  var nodes = tree.nodes(root).reverse(),
      links = tree.links(nodes);

  // Normalize for fixed-depth.
  nodes.forEach(function(d) { d.y = d.depth * 50;});

  // Enter the nodes.
  var node = svg.append("g")
    .attr("class", "nodes")
    .selectAll(".n")
      .data(nodes, function(d) { return d.id || (d.id = ++i); })
        .enter().append("circle")
        .attr("class", "node")
        .attr("r", 10)
        .attr("fill", "steelblue")
        .attr("transform", function(d) { 
          return "translate(" + 0 + "," + d.y + ")"; }) // 0 is required for x to make edges match up with nodes
        .call(position_node)

  // TODO not working -- no text is displayed
  svg.selectAll(".node").append('text')
    .attr('class', 'text')
    .text(function(d) {return d.name})
    .call(position_node)

  // Declare the links…
  var link = svg.selectAll("path.link")
    .data(links)
    .enter().insert("path", "g")
      .attr("class", "link")
      .attr("d", diagonal)
      .call(position_links)

  // Functions to position nodes and edges
  function position_node(node) {
    node 
      .attr("cx", function(d) {return xScale(d.x);});
        //.attr("cy", function(d) { return yScale(y(d)); }) // TODO commenting this out made tree height issues go away
        //.attr("r", function(d) { return radiusScale(radius(d)); });
  }

  function position_links(link) {
      diagonal.projection(function(d) {return [xScale(d.x), d.y]; }) 
      link.attr("d", diagonal);
  }

  // Function to call when distortion slider is moved
  distortion_slider.on("input", function() {
    setting = document.getElementById('distortion_slider').value
    console.log(setting)
    xScale.distortion(40).focus(setting);

    node.call(position_node);
    link.call(position_links)
    svg.select(".x.axis").call(xAxis);
    svg.select(".y.axis").call(yAxis);
  });

  return;
}

/****************************************************************
Main Thread of execution
****************************************************************/
function scatterPlot3d( parent ) {
    x3d = parent  
        .append("x3d")
        .style( "width", parseInt(parent.style("width"))+"px" )
        .style( "height", parseInt(parent.style("height"))+"px" )
        .style( "border", "none" )

    scene = x3d.append("scene")

    scene.append("orthoviewpoint")
        .attr( "centerOfRotation", [0, 0, 0])
        .attr( "fieldOfView", [-300, -300, 800, 800])
        .attr( "orientation", [-0.5, 1, 0.2, 1.12*Math.PI/4])
        .attr( "position", [600, 300, 800])

    console.log("Reading in embryo positions.");
    initializeEmbryo();
    console.log("Loading data")
    
    // Add play button for time points
    d3.select('body').append('button')
        .attr('id', 'playpause')
        .attr('onclick', "playpausedev()")
        .html("Play");
    // Add slider for time points
    d3.select('body').append('input')
        .attr('type', 'range')
        .attr('id', 'timerange')
        .attr('defaultValue', 0)
        .attr('min', 0)
        .attr('step', 1)
        .attr('value', 0)
        .attr('onchange', 'updatetime()')
}

/****************************************************************
* Fisheye Distortion Plugin
* https://github.com/d3/d3-plugins/blob/master/fisheye/fisheye.js
****************************************************************/
(function() {
  d3.fisheye = {
    scale: function(scaleType) {
      return d3_fisheye_scale(scaleType(), 3, 0);
    },
    circular: function() {
      var radius = 200,
          distortion = 2,
          k0,
          k1,
          focus = [0, 0];

      function fisheye(d) {
        var dx = d.x - focus[0],
            dy = d.y - focus[1],
            dd = Math.sqrt(dx * dx + dy * dy);
        if (!dd || dd >= radius) return {x: d.x, y: d.y, z: dd >= radius ? 1 : 10};
        var k = k0 * (1 - Math.exp(-dd * k1)) / dd * .75 + .25;
        return {x: focus[0] + dx * k, y: focus[1] + dy * k, z: Math.min(k, 10)};
      }

      function rescale() {
        k0 = Math.exp(distortion);
        k0 = k0 / (k0 - 1) * radius;
        k1 = distortion / radius;
        return fisheye;
      }

      fisheye.radius = function(_) {
        if (!arguments.length) return radius;
        radius = +_;
        return rescale();
      };

      fisheye.distortion = function(_) {
        if (!arguments.length) return distortion;
        distortion = +_;
        return rescale();
      };

      fisheye.focus = function(_) {
        if (!arguments.length) return focus;
        focus = _;
        return fisheye;
      };

      return rescale();
    }
  };

  function d3_fisheye_scale(scale, d, a) {

    function fisheye(_) {
      var x = scale(_),
          left = x < a,
          range = d3.extent(scale.range()),
          min = range[0],
          max = range[1],
          m = left ? a - min : max - a;
      if (m == 0) m = max - min;
      return (left ? -1 : 1) * m * (d + 1) / (d + (m / Math.abs(x - a))) + a;
    }

    fisheye.distortion = function(_) {
      if (!arguments.length) return d;
      d = +_;
      return fisheye;
    };

    fisheye.focus = function(_) {
      if (!arguments.length) return a;
      a = +_;
      return fisheye;
    };

    fisheye.copy = function() {
      return d3_fisheye_scale(scale.copy(), d, a);
    };

    fisheye.nice = scale.nice;
    fisheye.ticks = scale.ticks;
    fisheye.tickFormat = scale.tickFormat;
    return d3.rebind(fisheye, scale, "domain", "range");
  }
})();