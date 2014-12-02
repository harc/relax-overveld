# Relax

This is a library for "Overveld-style" constraint relaxation. It's based on C.W.A.M van Overveld's paper
*[30 Years After Sketchpad: Relaxation of Geometric Constraints Revisited](http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.32.24)*.

## Docs

Coming soon. (Impatient? Contributions are welcome :))

## Demo

[Here](http://alexwarth.github.io/demos/relax/)'s a neat a little demo that lets you experiment with several kinds of geometric constraints.

The demo comes with a few "pre-fab" examples that you can see by clicking the buttons on the right (`rod`, `chain`, and `lazy tongs`). Give these a try, and see what happens when you move the points.

You can also make your own stuff from scratch:

* To add a point, hold down `p` and click where you want it to go.
    * If you click more than once before releasing the `p` key, the new points you create will be connected with a line.
* To remove a point, hold down `d` and click on the point you want to remove. (This will also remove any lines and constraints that reference the unwanted point.)
* To apply a constraint, hold down the appropriate key (as shown on the left of the user interface) and click on the point(s) that it should apply to.
    * E.g., to apply a coordinate constraint, hold down `f` and click on a point.
    * Notice the labels of the constraint buttons on the left of the UI, e.g., `L: length/2`. These labels tell you what key you have to press in order to apply the constraint, as well as the number of points it requires. So to apply a length constraint, you press the `l` key and then, *without releasing it*, you click on two points. This tells the system that you want the distance between these points to be constant. Now try to move one of them and see what happens.
* By default, this demo does as much work as possible before it draws each frame, which happens every 1/60th of a second. To get a better idea of how constraint relaxation works, click the `render after each iteration` button at the bottom of the screen. (Clicking that button again will toggle the demo to the original mode.)

**Got a tablet?** If you open the demo using an iPad, the user interface supports multi-touch. To add a point, you just hold down the `P: point` button in the UI and, using another finger, you tell the system where you want the new point to go. The constraint buttons also work the same way. You can move several points simultaneously, which is pretty fun.

## Future work

* Improve the UI of the demo. (Bret gave me some great feedback recently.)

## Authors

* [Alex Warth](http://github.com/alexwarth)
* [Tony Garnock-Jones](https://github.com/tonyg)

## See also

* Hesam Samimi's [Sketchpad14](https://github.com/cdglabs/sketchpad14) project, which is a fork of this library and demo that has been extended to support experiments on constraint-reactive programming.