`
// 1. Define Scalar and Point Variables
X = 10
Y = 20
Z_HEIGHT = 5
P1 = 10, 20, 5 
PL = 0, 65, 0 
PR = 64, 0, 0 
PT = 64, 64, 0 
PB = 0, 0, 0 
PBL = 0.5, 0, 0 


// ---------------
LINE  
FILL #000000
64,    0, 200,
64+64, 0, 200,
64+64, 0, -200,
64,    0, -200,

LINE
0, 65,      200,
0, 65+64,   200,
0, 65+64,  -200,
0, 65,     -200,

LINE
  0,   0,   0,
  0,  65,   0,
-64,  65,   0,
-64,   0,   0,

LINE
-128,   0,   0,
-128, -128,   0,
 64,  -128,   0,
 64,   0,   0,

TOP = 79
LINE
-128,   64,   TOP,
-128, +128,  TOP,
 64,  +128,  TOP,
 64,  64,    TOP,

TOP = 79
LINE
+256,  256,   TOP,
+256, -256,  TOP,
 64,  -256,  TOP,
 64,   256,    TOP,


// ---------------
LINE #FF0000 
FILL 
// PL,PB, PR, PT,

// ---------------
// 2. Define Height
SIZE 2
HTOP = 0, 0, 79.5
HTOPa = 0, 0, 71.5
HTOPb = 0, 0, 64.5
HTOPp = 0, 0, 60.5 

// ---------------
LINE #00FF00 
// HTOP, HTOP >> 0, 64, 0
// HTOPa, HTOPa >> 0, 64, 0
// HTOPb, HTOPb >> 0, 64, 0


// ---------------
// 3. Define Height
LINE #FFFF00
PBL,PBL >>  HTOPb

// ---------------
// 3. Define Height
PIL_L = 0, 64-4, 0 
PIL_R = 0, 0+7, 0 

TOP_L = 0, 64-14, 0 
TOP_R = 0, 0+14, 0 
TOPB_L = 0, 54, 0 


// ---------------
// ---------------
// FUNC SIDE_E (TOP) {}
LINE #000000 FILL

PIL_R
PIL_R >> HTOPp,
TOP_R >> HTOPa,
TOP_L >> HTOPa,
PIL_L >> HTOPp,
PIL_L,
PL, PL >> HTOPb,
TOP_L >> HTOP,
TOP_R >> HTOP,
PB >> HTOPb,
PB

Pe =   6,   0, 0
Pw =  -6,   0, 0
Ps =   0,  -6, 0
Pn =   0,   6, 0


// ---------------
// FUNC SIDE_TOP (TOP) {}

TOP = 0, 0, 79.5
L =  0, 65, 0 >> TOP
R = 64,  0, 0 >> TOP
T = 64, 65, 0 >> TOP
B =  0,  0, 0 >> TOP

// LINE #000000
// L, B, R, T

De =  13,   0, 0
Dw = -12,   0, 0
Ds =   0, -13, 0
Dn =   0,  13, 0

LINE #000000
L >> De, L >> De >> Ds, L >> Ds, 
B >> Dn, B >> Dn >> De, B >> De, 
R >> Dw, R >> Dw >> Dn, R >> Dn,
T >> Ds, T >> Ds >> Dw, T >> Dw,

Ce =  20,   0, 0
Cw = -18,   0, 0
Cs =   0, -20, 0
Cn =   0,  21, 0

LINE #000000
L >> Ce, L >> Ce >> Cs, L >> Cs, 
B >> Cn, B >> Cn >> Ce, B >> Ce, 
R >> Cw, R >> Cw >> Cn, R >> Cn,
T >> Cs, T >> Cs >> Cw, T >> Cw,

// ---------------
// FUNC SIDE_S() {}

LINE #000000
PB, 
PB >> HTOPp >> 0, 0, 5, 
PB >> HTOP >> De, 
PR >> HTOP >> Dw, 
PR >> HTOPp >> 0, 0, 4,
PR,
PR >> Pw,
PR >> Pw >> HTOPp,
PR >> Cw >> HTOPa >> 3, 0, 0,
PB >> Ce >> HTOPa >> -4, 0, 0,
PB >> Pe >> HTOPp,
PB >> Pe
`