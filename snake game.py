import turtle as t
import random
import time

d = 0.1
s = 0
hs = 0
run = True

# screen
sc = t.Screen()
sc.title("Snake Game")
sc.bgcolor("#add8e6")
sc.setup(width=600, height=600)
sc.tracer(0)

# snake head
h = t.Turtle()
h.shape("square")
h.color("white")
h.penup()
h.goto(0, 0)
h.direction = "Stop"

# food
f = t.Turtle()
f.shape(random.choice(["circle", "square", "triangle"]))
f.color(random.choice(["red", "green", "black"]))
f.penup()
f.goto(0, 100)

# scoreboard
p = t.Turtle()
p.hideturtle()
p.penup()
p.goto(0, 250)
p.write("Score : 0  High Score : 0", align="center", font=("candara", 24, "bold"))
