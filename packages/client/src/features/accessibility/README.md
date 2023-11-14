# Keyboard-Only: Accessibility Features

The features presented in the following are introduced for disability-aware conceptual modeling and allow basic user model interactions to be performed only with the keyboard.

## Getting started

In order to activate and use all of the currently provided keyboard only accessibility features, the module `accessibilityModule` needs to be in use.
To activate and use only specific accessibility features, the respective module (see list below) needs to be in use.

## Features

Below is a list of the keyboard only accessibility features:<br>

| Feature                    |                                           Description                                            |                                              Shortcut                                              |            Module             |
| -------------------------- | :----------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------: | :---------------------------: |
| Tool Palette               |                                     Accessible tool palette                                      |                                    <kbd>ALT</kbd>+<kbd>P</kbd>                                     |  `keyboardToolPaletteModule`  |
| Graph                      |                                        Focus on the graph                                        |                                    <kbd>ALT</kbd>+<kbd>G</kbd>                                     |              `-`              |
| Grid & Pointer             |                   Used for positioning on the canvas for creating new elements                   |                          activated through selected _Tool Palette_ entry                           |    `keyboardControlModule`    |
| Search                     | Search for elements or edges using labels, types, etc. <br> with respective diagram highlighting |                                    <kbd>CTRL</kbd>+<kbd>F</kbd>                                    |     `searchPaletteModule`     |
| Move                       |                       Move elements, edges or viewport into the directions                       |                 <kbd>←</kbd> \|\| <kbd>↑</kbd> \|\| <kbd>→</kbd> \|\| <kbd>↓</kbd>                 |       `moveZoomModule`        |
| Zoom                       |         Zoom in or out gradually to elements or viewport or reset to default zoom level.         |                  <kbd>+</kbd> \|\| <kbd>-</kbd> \|\| <kbd>CTRL</kbd>+<kbd>0</kbd>                  |       `moveZoomModule`        |
| Zoom via Grid              |              Zoom in gradually according to the direction of the selected grid box.              | <kbd>CTRL</kbd>+<kbd>+</kbd> then <kbd>+</kbd> \|\| <kbd>-</kbd> \|\| <kbd>CTRL</kbd>+<kbd>0</kbd> |       `moveZoomModule`        |
| Resize                     |          Increase or decrease element sizes gradually or reset to default element size.          | <kbd>ALT</kbd>+<kbd>A</kbd> then <kbd>+</kbd> \|\| <kbd>-</kbd> \|\| <kbd>CTRL</kbd>+<kbd>0</kbd>  |       `resizeKeyModule`       |
| Element Navigation         |   Navigate through the elements of the diagram (**Default** or **Position-based** Navigation).   |             <kbd>N</kbd> or <kbd>ALT</kbd>+<kbd>N</kbd> then use arrow keys to iterate             | `glspElementNavigationModule` |
| Help                       |                           Display list of existing keyboard shortcuts                            |                                    <kbd>ALT</kbd>+<kbd>H</kbd>                                     |   `glspShortcutHelpModule`    |
| Focus Tracker              |                        Display the current focused element on the canvas                         |                                           no key needed                                            |   `glspFocusTrackerModule`    |
| User Notifications (Toast) |                                  Displaying user notifications                                   |                                           no key needed                                            |       `glspToastModule`       |

## Usage

### CRUD Modeling Operations

#### Focus on the Graph

-   <kbd>ALT</kbd>+<kbd>G</kbd>: Use to set the focus on the graph.

#### Tool Palette

The shortcut <kbd>ALT</kbd> + <kbd>P</kbd> sets the focus on the tool palette. Afterward, the characters <kbd>a</kbd> - <kbd>z</kbd> select an element or <kbd>1</kbd> - <kbd>5</kbd> for the header menu options.

#### Grid + Pointer

After selecting a node in the tool palette, the grid gets visible. The grid is for positioning the _pointer_ in the screen.

The following shortcuts are usable:

-   <kbd>1</kbd>- <kbd>9</kbd>: Position the pointer in the grid
-   Use arrow keys (<kbd>←</kbd> || <kbd>↑</kbd> || <kbd>→</kbd> || <kbd>↓</kbd>) to move the pointer to a direction
-   <kbd>ENTER</kbd>: Create the node
-   <kbd>CTRL</kbd> + <kbd>ENTER</kbd>: Create multiple nodes

#### Create Nodes

1. <kbd>ALT</kbd> + <kbd>P</kbd>: Focus the tool palette
2. <kbd>a</kbd> - <kbd>z</kbd>: Select a node
3. <kbd>1</kbd> - <kbd>9</kbd>: Position the pointer in a cell
4. Use arrow keys (<kbd>←</kbd> || <kbd>↑</kbd> || <kbd>→</kbd> || <kbd>↓</kbd>) to move the pointer to the correct position
5. Create the node by using either
    - <kbd>ENTER</kbd>: Create the node und finishes the operation
    - <kbd>CTRL</kbd> + <kbd>ENTER</kbd>: Create multiple nodes

#### Create Edges

1. <kbd>ALT</kbd> + <kbd>P</kbd>: Focus the tool palette
2. <kbd>a</kbd> - <kbd>z</kbd>: Select an edge
3. Type in either **type** or **name** of node for **source**
4. <kbd>ENTER</kbd>: Make selection
5. Type in either **type** or **name** of node for **target**
6. <kbd>ENTER</kbd>: Make selection

#### Search

The search palette allows to search labelled elements or edges that have a labelled node as source or target. The result set will be highlighted accordingly, to also be able to visually distinguish between the searched and the remaining parts of the given diagram.

#### Read / Select via Search

1. <kbd>CTRL</kbd> + <kbd>F</kbd>: Open the search palette
2. In the palette's input field enter either the **type** or the **label** of nodes or edges. The arrow keys can be used to navigate in the search result list.
3. <kbd>ENTER</kbd>: Select the node or edge that is highlighted in the search result list.

### Model Exploration

#### Move

The move functionality can be used to move parts of the model, such as selected nodes or edges or the whole viewport in all directions.

##### Steps

1. Select one or multiple elements or the viewport.
2. Use arrow keys (<kbd>←</kbd> || <kbd>↑</kbd> || <kbd>→</kbd> || <kbd>↓</kbd>) to move element(s) or viewport to the desired location.

#### Zoom

This zoom functionality can be used to gradually adapt the zoom level of one element, a set of elements or the
viewport.

#### Steps

1. Select one or multiple elements or the viewport.
2. Use <kbd>+</kbd> or <kbd>-</kbd> to zoom in or out gradually.
3. <kbd>CTRL</kbd>+<kbd>0</kbd>: Set the zoom level to default.

#### Zoom via Grid

This zoom functionality via Grid can be used to gradually adapt the zoom level according to the direction of the selected _Grid Box_.

#### Steps

1. <kbd>CTRL</kbd>+<kbd>+</kbd>: Display the grid.
2. <kbd>1</kbd>- <kbd>9</kbd>: Position the pointer in a cell to zoom.
3. Repeat **2.)** to reach the desired zoom level.

#### Resize element

The resize functionality helps to set the size of the nodes, by either increasing or decreasing the size of the nodes’ shape gradually.

#### Steps

1. Select one or multiple elements.
2. <kbd>ALT</kbd>+<kbd>A</kbd>: Activate the resize mode.
3. <kbd>+</kbd> or <kbd>-</kbd> to increase or decrease the size of the element(s) gradually.
4. <kbd>CTRL</kbd>+<kbd>0</kbd>: Set the size of the element(s) to default.
5. <kbd>ESC</kbd>: Deactivate the resize mode.

### Model Navigation

For navigating through the elements of the diagram two navigation algorithms are provided.

#### Default Navigation (following directions of relations)

1. Select element as starting point.
2. <kbd>N</kbd>: Activate default navigation.
3. Use arrow keys (<kbd>←</kbd> || <kbd>↑</kbd> || <kbd>→</kbd> || <kbd>↓</kbd>) to iterate through model according to the directions of the given relations.

#### Position-based Navigation (following x and y coordinates)

1. Select element as starting point.
2. <kbd>ALT</kbd>+<kbd>N</kbd>: Activate position based navigation.
3. Use arrow keys (<kbd>←</kbd> || <kbd>↑</kbd> || <kbd>→</kbd> || <kbd>↓</kbd>) to iterate through model according to the positions of the elements, i.e. depending on the order of the elements' x and y coordinates.

### Help

1. <kbd>ALT</kbd>+<kbd>H</kbd>: Display list of keyboard shortcuts.
