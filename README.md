a3-tdurham-ajh24-chiasson 
============

## Team Members 

1. Timothy Durham tdurham@uw.edu 2. Andrew Hill ajh24@uw.edu 3. Melissa
Chiasson chiasson@uw.edu

## Project Name

_Caenorhabditis elegans_ (_C. elegans_) embryo development. _Caenorhabditis
elegans_ (_C. elegans_) is small roundworm used widely as a model organism
in genetics and genomics. Its development has been well studied; each
worm takes around 14 hours to grow from a single fertilized cell to a
hatched larvae with 558 cells. This process of embryonic development
progresses in a stereotyped pattern that follows an invariant cell
lineage; the same branches in this tree always produce the same tissues
in the hatched worm. We have a dataset that describes the spatial
orientation of every cell throughout _C. elegans_ embryo development time
points, along with their lineages (which cell derives from which) and
cell type. Despite intense study of _C. elegans_, currently there does not
exist a resource where one can interactively visualize _C. elegans_ embryo
development through time and interrogate what cells are located where,
which lineages they are in, and what cell type they are.

## Running Instructions

Access our visualization at
http://cse512-15s.github.io/a3-tdurham-ajh24-chiasson/ or download this
repository and run `python -m SimpleHTTPServer 2255` and access this
from http://localhost:2255/.

We recommend using either Chrome or Opera for ideal viewing.

## Storyboard

We wanted to address this lack of resource, since it would be a great
tool for the _C. elegans_ community.  In initial discussions, we decided
we wanted to show both a 3D representation of the worm embryo throughout
development and the classic _C. elegans_ cell lineage tree (Figure 1).

Most of our understandings of cell-cell connections and spatial
relationships in development comes from two-dimensional representations,
either views through a microscope or in other representations like the
lineage tree. While these representations can be very effective, we
sought to address two important limitations with our 3D approach. First,
embryogenesis is a biological process takes place in three dimensions,
and the orientations and connections among cells play an essential role
in this process. Being able to identify cells and to watch them undergo
divisions and migrations in three dimensions, from any orientation, can
greatly facilitate our understanding of which lineages are close
together and which cell-cell connections might be important in forming
different tissues. For example, at the gastrulation stage of development
the cells that go on to form the intestine migrate dorsally from ventral
locations on the outside of the embryo to locations inside the embryo,
with other cells migrating ventrally to fill in the space left by their
migration. When the intestinal cell type is highlighted in our 3D plot,
this migration can be observed clearly from any orientation, and other
interacting lineages and cell types can be identified by using the
multiple lineage highlighting feature. 

Another interesting lineage is the C lineage. By the end of our time
series, cells from the C lineage migrate to the posterior-dorsal edge of
the embryo, forming a complex curvature around the back of the embryo
from left to right. Patterns like this are much harder to understand in
two-dimensions, and our 3D plot provides a more natural way to gain this
insight. Despite the advantages of the ability to view the developing
embryo in three dimensions, we wanted a more familiar plot to help
ground this visualization in a visual language that is more familiar to
the C. elegans community. To this end, we decided that we should show
the lineage tree to help facilitate the identification of specific cells
and lineages and to provide this familiar context.

We thought it would be ideal if you could highlight specific cells and
their lineages or cell types with color and get their locations on the
lineage tree (Figure 2). We also wanted to add a slider that you could
use to navigate back and forth through developmental time (Figure 2).
Since we were all unfamiliar with D3, we figured our first goal would be
to get the 3D embryo visualization working with a lineage map displayed
next to it, with the aim that if we got this to work and still had more
time, we could implement additional features.
 
### Changes between Storyboard and the Final Implementation
Our final design exceeded our initial goals. We have a slider that one
can use to navigate the 3D embryo animation visualization in time, plus
a dropdown menu to control the speed at which this animation plays. In
synchrony with the 3D visualization, the lineage tree colors in nodes of
cells as they appear. We also have a dropdown menu with a quick search
function to highlight specific cell lineages or cell types within the
animation and within the lineage tree (this can also be hidden with a
collapse button). Cells are highlighted throughout the animation, and
cells that aren’t of interest can be hidden by clicking “Hide
non-highlighted.” Highlight color can be changed using a color menu.
Multiple highlights can be applied by pressing the “+” below the menu
bar. One challenge we faced with the lineage tree is that it is
extremely wide and information-rich. In order to display both the
broader tree context and information about specific nodes and branches,
we implemented a Cartesian distortion that expands the tree like an
accordion along the x-axis, zooming in to show details. The user can the
distortion back and forth along the breadth of the tree using a slider
bar. 

## Development Process 
For the development process, we discussed the initial data set and
storyboard idea together, then reconvened later to discuss the next set
of goals once we had the basics of the original storyboard programmed.
In all, we spent approximately 125 hours putting this visualization
together. For all three members, a significant portion of time was spent
getting familiar with javascript and D3. The elements of this project
that took the most time were data loading (both the cell coordinates and
cell type to cell name mappings), the cell and cell type highlighting,
synchronization of the animation with the lineage tree, applying
distortion to the tree, and general styling of the graphics. All members
collaborated on designing the visualization and addressing features of
interest. Tim worked on data loading, synchronization of the 3D
animation and tree, and cell highlighting features. Andrew worked on
making the lineage tree, finding the best representation of it, and then
implementing distortion to further improve tree presentation. Melissa
worked on the animation playback feature and prepared the final write-up.

