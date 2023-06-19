# Keyboard-Only: Accessibility Features

The features presented in the following are introduced for disability-aware conceptual modeling and allow basic user model interactions to be performed only with the keyboard.

## Getting started

In order to activate and use all of the currently provided keyboard only accessibility features, the module `glspAccessibilityModule` needs to be in use.
To activate and use only specific accessibility features, the respective module (see list below) needs to be in use.

## Features

Below is a list of the keyboard only accessibility features:<br>

| Feature |                                           Description                                            |                                             Shortcut                                              |          Module           |
| ------- | :----------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------: | :-----------------------: |
| Search  | Search for elements or edges using labels, types, etc. <br> with respective diagram highlighting |                                   <kbd>CTRL</kbd>+<kbd>F</kbd>                                    | `glspSearchPaletteModule` |
| Move    |                       Move elements, edges or viewport into the directions                       |                <kbd>←</kbd> \|\| <kbd>↑</kbd> \|\| <kbd>→</kbd> \|\| <kbd>↓</kbd>                 |   `glspMoveZoomModule`    |
| Zoom    |         Zoom in or out gradually to elements or viewport or reset to default zoom level.         |                 <kbd>+</kbd> \|\| <kbd>-</kbd> \|\| <kbd>CTRL</kbd>+<kbd>0</kbd>                  |   `glspMoveZoomModule`    |
| Resize  |          Increase or decrease element sizes gradually or reset to default element size.          | <kbd>ALT</kbd>+<kbd>A</kbd> then <kbd>+</kbd> \|\| <kbd>-</kbd> \|\| <kbd>CTRL</kbd>+<kbd>0</kbd> |   `glspResizeKeyModule`   |

## Usage

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

### Resize element

The resize functionality helps to set the size of the nodes, by either increasing or decreasing the size of the nodes’ shape gradually.

#### Steps

1. Select one or multiple elements.
2. <kbd>ALT</kbd>+<kbd>A</kbd>: Activate the resize mode.
3. <kbd>+</kbd> or <kbd>-</kbd> to increase or decrease the size of the element(s) gradually.
4. <kbd>CTRL</kbd>+<kbd>0</kbd>: Set the size of the element(s) to default.
5. <kbd>ESC</kbd>: Deactivate the resize mode.
