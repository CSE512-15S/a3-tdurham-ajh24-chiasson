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
                 D:'P3', Z2:'P4', Z3:'P4'}

//timepoint counter for automated iteration through time points
var timepoint = 0;


/****************************************************************
Main Thread of execution
****************************************************************/
function scatterPlot3d( parent )
{

  /****************************************************************
  SLIDER INITIALIZATION AND CALLBACKS
  ****************************************************************/
  function initializeSlider() {
    // Define callbacks on dragging behavior
    var drag = d3.behavior.drag()
                .origin(Object)
                .on("drag", sliderMoveCallback)
                .on('dragend', endSliderDragCallback);

    // Define a SVG element for the slider
    var svg = d3.select('body')
                    .append('svg')
                    .attr("height", 200)
                    .attr("width", 300);

    var g = svg.selectAll('g')
                .data([{x: 100, y : 20}])
                .enter()
                    .append('g')
                    .attr("height", 200)
                    .attr("width", 300)
                    .attr('transform', 'translate(20, 10)');

    // Add the rectangle for slider
    var rect = g
                    .append('rect')
                    .attr('y', 17)
                    .attr("height", 5)
                    .attr("width", 242)
                    .attr('fill', '#C0C0C0');

    // Add the circle for the slider and attach the callback for drag events to it
    g.append("circle")
        .attr("r", 10)
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; })
        .attr("fill", "#2394F5")
        .call(drag);
  }


  function sliderMoveCallback(d) {
    // Update the position of the circle
      d3.select(this)
          .attr("cx", d.x = Math.max(0, Math.min(242, d3.event.x)))
          .attr("cy", d.y = 20);

      // Get the current timepoint as the x position
      var timepoint = d3.select(this).attr("cx")

      // Update the data displayed
      plotData(timepoint,5);
  }

  function endSliderDragCallback() {
      d3.select(this)
          .attr('opacity', 1)
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

  function initializeAxis( axisIndex )
  {
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
    var highlight = 'MS'
    datapoints.select(function(d){return d.name.substr(0, highlight.length) == highlight ? this : null;}).selectAll('shape appearance material').attr('diffuseColor', 'green');
    //make non-highlighted lineages more transparent
    datapoints.select(function(d){return d.name.substr(0, highlight.length) == highlight ? null : this;}).selectAll('shape appearance material').attr('transparency', 0.8);


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

  function loadTimePoints(idx, max){
    if (idx == max){
        ready = true;

        // TODO this is here temporarily -- will be moved once updating of the tree is
        // implemented
        var cellLineage = getCellLineageMap(this.csvdata, idx)
        plotCellLineageTree(cellLineage)

        return;
    }

    var basename = 't' + ("000" + (idx + 1)).substr(-3) + '-nuclei';
    var url = 'http://localhost:2255/timepoints/nuclei/' + basename;
    d3.text(url, function(tpdata){
        this.csvdata[idx] = parseCSV(tpdata);
        this.namemap[idx] = {};
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
        loadTimePoints(idx + 1, max);
    });
  }

  /****************************************************************
  INITIALIZATION AND CALLBACKS FOR VISUALIZATION
  ****************************************************************/
  function initializeEmbryo() {
    d3.text('http://localhost:2255/timepoints/nuclei/t001-nuclei', function(t0data){
        this.csvdata[0] = parseCSV(t0data);
        this.namemap[0] = {};
        for(var i = 0; i < this.csvdata[0].length; i++){
            this.namemap[0][this.csvdata[0][i].name] = i;
            this.csvdata[0][i].pred = -1;
        }
        console.log("Got data:")

        console.log("Init Plot")
        initializePlot();
        console.log("Plot data")
        plotData(0, 5);
        loadTimePoints(1, 243);

        // Set up the slider
        initializeSlider();

        // Build and plot the tree (Not yet working)
        //var cellLineage = getCellLineageMap(this.csvdata, 0)
        //plotCellLineageTree(cellLineage)

        //setInterval( development, 1000 );
    });
  }

function development() {
    if (ready && x3d.node() && x3d.node().runtime ) {
        var t_idx = this.timepoint % this.csvdata.length;
        plotData(t_idx,800);
        this.timepoint += 1;

        console.log(t_idx)

        // Update and plot the tree (Not yet working)
        //var cellLineage = getCellLineageMap(this.csvdata, t_idx)
        //plotCellLineageTree(cellLineage)

    } else {
        console.log('x3d not ready.')
    }
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

  var margin = {top: 20, right: 120, bottom: 20, left: 120},
      width = 960 - margin.right - margin.left,
      height = 800 - margin.top - margin.bottom;
      
  var i = 0,
      duration = 750,
      root;

  var tree = d3.layout.tree()
      .size([1200, width]);

  var diagonal = d3.svg.diagonal()
      .projection(function(d) { return [d.x, d.y]; });

  var svg = d3.select("body").append("svg")
      .attr("overflow", "scroll")
      .attr("width", "95%")
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")


  root = treeData[0];

    function collapse(d) {
      if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
      }
    }

    root.children.forEach(collapse);
    
    update(root);

    function update(source) {

      // Compute the new tree layout.
      var nodes = tree.nodes(root).reverse(),
          links = tree.links(nodes);

      // Normalize for fixed-depth.
      nodes.forEach(function(d) { d.y = d.depth * 50; });

      // Update the nodes…
      var node = svg.selectAll("g.node")
          .data(nodes, function(d) { return d.id || (d.id = ++i); });

      // Enter any new nodes at the parent's previous position.
      var nodeEnter = node.enter().append("g")
          .attr("class", "node")
          .attr("transform", function(d) { return "translate(" + source.x0 + "," + source.y0 + ")"; })
          .on("click", click);

      nodeEnter.append("circle")
          .attr("r", 1e-6)
          .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

      nodeEnter.append("text")
          .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
          .attr("dy", ".35em")
          .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
          .text(function(d) { return d.name; })
          .style("fill-opacity", 1e-6);

      // Transition nodes to their new position.
      var nodeUpdate = node.transition()
          .duration(duration)
          .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

      nodeUpdate.select("circle")
          .attr("r", 4.5)
          .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

      nodeUpdate.select("text")
          .style("fill-opacity", 1);

      // Transition exiting nodes to the parent's new position.
      var nodeExit = node.exit().transition()
          .duration(duration)
          .attr("transform", function(d) { return "translate(" + source.x + "," + source.y + ")"; })
          .remove();

      nodeExit.select("circle")
          .attr("r", 1e-6);

      nodeExit.select("text")
          .style("fill-opacity", 1e-6);

      // Update the links…
      var link = svg.selectAll("path.link")
          .data(links, function(d) { return d.target.id; });

      // Enter any new links at the parent's previous position.
      link.enter().insert("path", "g")
          .attr("class", "link")
          .attr("d", function(d) {
            var o = {x: source.x0, y: source.y0};
            return diagonal({source: o, target: o});
          });

      // Transition links to their new position.
      link.transition()
          .duration(duration)
          .attr("d", diagonal);

      // Transition exiting nodes to the parent's new position.
      link.exit().transition()
          .duration(duration)
          .attr("d", function(d) {
            var o = {x: source.x, y: source.y};
            return diagonal({source: o, target: o});
          })
          .remove();

      // Stash the old positions for transition.
      nodes.forEach(function(d) {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }

    // Toggle children on click.
    function click(d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else {
        d.children = d._children;
        d._children = null;
      }
      update(d);
    }

    return;
  }


  /****************************************************************
  MAIN THREAD OF EXECUTION

  Set up the the scene for 3D plot
  ****************************************************************/
  var x3d = parent  
    .append("x3d")
      .style( "width", parseInt(parent.style("width"))+"px" )
      .style( "height", parseInt(parent.style("height"))+"px" )
      .style( "border", "none" )
      
  var scene = x3d.append("scene")

  
  scene.append("orthoviewpoint")
     .attr( "centerOfRotation", [0, 0, 0])
     .attr( "fieldOfView", [-300, -300, 800, 800])
     .attr( "orientation", [-0.5, 1, 0.2, 1.12*Math.PI/4])
     .attr( "position", [600, 300, 800])


  /****************************************************************
  FUNCTION LEVEL VARIABLES
  ****************************************************************/
  var rows = [];
  var axisRange = [-1000, 1000];
  var scales = [];
  var initialDuration = 0;
  var ease = 'linear';
  var axisKeys = ["x", "y", "z"]

  console.log("Reading in embryo positions.");
  initializeEmbryo();
  console.log("Loading data")

}
