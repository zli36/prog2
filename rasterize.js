/* GLOBAL CONSTANTS AND VARIABLES */

/* assignment specific globals */
const WIN_Z = 0;  // default graphics window z coord in world space
const WIN_LEFT = 0; const WIN_RIGHT = 1;  // default left and right x coords in world space
const WIN_BOTTOM = 0; const WIN_TOP = 1;  // default top and bottom y coords in world space
const INPUT_TRIANGLES_URL = "https://ncsucgclass.github.io/prog2/triangles.json"; // triangles file loc
const INPUT_SPHERES_URL = "https://ncsucgclass.github.io/prog2/ellipsoids.json"; // ellipsoids file loc
var INPUT_LIGHTS_URL = "https://ncsucgclass.github.io/prog2/lights.json"; // lights file loc


var Eye = new vec4.fromValues(0.5,0.5,-0.5,1.0); // default eye position in world space
var at = new vec3.fromValues(0,0,1);
var viewUp = new vec4.fromValues(0,1,0);
var lookAt = vec3.fromValues(0.5,0.5,0.5);

/* webgl globals */
var gl = null; // the all powerful gl object. It's all here folks!
var vertexBuffer; // this contains vertex coordinates in triples
var triangleBuffer; // this contains indices into vertexBuffer in triples
var triBufferSize = 0; // the number of indices in the triangle buffer
var vertexPositionAttrib; // where to put position for vertex shader


var coordArray = []; // 1D array of vertex coords for WebGL
var indexArray = []; // 1D array of vertex indices for WebGL
var vtxBufferSize = 0; // the number of vertices in the vertex buffer

var viewMatrix = mat4.create();
// ASSIGNMENT HELPER FUNCTIONS

// get the JSON file from the passed URL
function getJSONFile(url,descr) {
    try {
        if ((typeof(url) !== "string") || (typeof(descr) !== "string"))
            throw "getJSONFile: parameter not a string";
        else {
            var httpReq = new XMLHttpRequest(); // a new http request
            httpReq.open("GET",url,false); // init the request
            httpReq.send(null); // send the request
            var startTime = Date.now();
            while ((httpReq.status !== 200) && (httpReq.readyState !== XMLHttpRequest.DONE)) {
                if ((Date.now()-startTime) > 3000)
                    break;
            } // until its loaded or we time out after three seconds
            if ((httpReq.status !== 200) || (httpReq.readyState !== XMLHttpRequest.DONE))
                throw "Unable to open "+descr+" file!";
            else
                return JSON.parse(httpReq.response); 
        } // end if good params
    } // end try    
    
    catch(e) {
        console.log(e);
        return(String.null);
    }
} // end get json file

// set up the webGL environment
function setupWebGL() {

    // Get the canvas and context
    var canvas = document.getElementById("myWebGLCanvas"); // create a js canvas
    gl = canvas.getContext("webgl"); // get a webgl object from it
    
    try {
      if (gl == null) {
        throw "unable to create gl context -- is your browser gl ready?";
      } else {
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // use black when we clear the frame buffer
        gl.clearDepth(1.0); // use max when we clear the depth buffer
        gl.enable(gl.DEPTH_TEST); // use hidden surface removal (with zbuffering)
      }
    } // end try
    
    catch(e) {
      console.log(e);
    } // end catch
 
} // end setupWebGL

// read triangles in, load them into webgl buffers

function loadTriangles(lights) {
    var inputTriangles = getJSONFile(INPUT_TRIANGLES_URL,"triangles");

    if (inputTriangles != String.null) { 
        var whichSetVert; // index of vertex in current triangle set
        var whichSetTri; // index of triangle in current triangle set
        var vtxToAdd = []; // vtx coords to add to the coord array
        var indexOffset = vec3.create(); // the index offset for the current set
        var triToAdd = vec3.create(); // tri indices to add to the index array
        
        for (var whichSet=0; whichSet<inputTriangles.length; whichSet++) {
            vec3.set(indexOffset,vtxBufferSize,vtxBufferSize,vtxBufferSize); // update vertex offset
            
            var curobject = inputTriangles[whichSet].material;
            // set up the vertex coord array
            for (whichSetVert=0; whichSetVert<inputTriangles[whichSet].vertices.length; whichSetVert++) {
                var coord = inputTriangles[whichSet].vertices[whichSetVert];
                coord = chageView(coord,lookAt,viewMatrix); //rotate view when press key
                vtxToAdd = transform(coord,Eye); //
                var normal = inputTriangles[whichSet].normals[whichSetVert];

                for(vtxIndex=0; vtxIndex<vtxToAdd.length; vtxIndex++){
                    coordArray.push(vtxToAdd[vtxIndex]); //push vertices to buffer
                }
                var color = lighting(Eye,lights,normal,coord,curobject);
                coordArray.push(color[0],color[1],color[2]);//push color to buffer
                vtxBufferSize +=1;
            } // end for vertices in set
            
            // set up the triangle index array, adjusting indices across sets
            for (whichSetTri=0; whichSetTri<inputTriangles[whichSet].triangles.length; whichSetTri++) {
                vec3.add(triToAdd,indexOffset,inputTriangles[whichSet].triangles[whichSetTri]);
                for(triIndex=0; triIndex<vtxToAdd.length; triIndex++){
                    indexArray.push(triToAdd[triIndex]);
                    triBufferSize += 1; 
                }
            } // end for triangles in set


        } // end for each triangle set 

        // console.log("coordinates: "+coordArray.toString());
        // console.log("numverts: "+vtxBufferSize);
        // console.log("indices: "+indexArray.toString());
        // console.log("numindices: "+triBufferSize);
        


    } // end if triangles found
} // end load triangles

// read triangles in, load them into webgl buffers
// get the idea from http://learningwebgl.com/blog/?p=1253
//x = r sinθ cosφ
//y = r cosθ
//z = r sinθ sinφ
// var vertexPositionData = [];
//     var normalData = [];
//     var textureCoordData = [];
//     for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
//       var theta = latNumber * Math.PI / latitudeBands;
//       var sinTheta = Math.sin(theta);
//       var cosTheta = Math.cos(theta);

//       for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
//         var phi = longNumber * 2 * Math.PI / longitudeBands;
//         var sinPhi = Math.sin(phi);
//         var cosPhi = Math.cos(phi);

//         var x = cosPhi * sinTheta;
//         var y = cosTheta;
//         var z = sinPhi * sinTheta;
//         var u = 1 - (longNumber / longitudeBands);
//         var v = 1 - (latNumber / latitudeBands);

//         normalData.push(x);
//         normalData.push(y);
//         normalData.push(z);
//         textureCoordData.push(u);
//         textureCoordData.push(v);
//         vertexPositionData.push(radius * x);
//         vertexPositionData.push(radius * y);
//         vertexPositionData.push(radius * z);
//       }
//     }
//     For eclipse x1 = ax + x2;
//     y1 = by + y2;
//     z1 = cz + z2;

    // var indexData = [];
    // for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
    //   for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
    //     var first = (latNumber * (longitudeBands + 1)) + longNumber;
    //     var second = first + longitudeBands + 1;
    //     indexData.push(first);
    //     indexData.push(second);
    //     indexData.push(first + 1);

    //     indexData.push(second);
    //     indexData.push(second + 1);
    //     indexData.push(first + 1);
    //   }
    // }

function loadEclipse(lights) {
    var inputEclipse = getJSONFile(INPUT_SPHERES_URL,"ellipsoids");

    if (inputEclipse != String.null) { 
        var whichSetVert; // index of vertex in current triangle set
        var whichSetTri; // index of triangle in current triangle set
        var vtxToAdd = []; // vtx coords to add to the coord array
        var indexOffset = vec3.create(); // the index offset for the current set
        var triToAdd = vec3.create(); // tri indices to add to the index array

        var latitudeBands = 50;
        var longitudeBands = 50;
        
        for (var whichSet=0; whichSet<inputEclipse.length; whichSet++) {
            vec3.set(indexOffset,vtxBufferSize,vtxBufferSize,vtxBufferSize); // update vertex offset

            var curobject = inputEclipse[whichSet];
            //x2,y2,z2 for the x,y,z of the eclipse center, a,b,c is the params of the eclipse
            var x2 = inputEclipse[whichSet].x;
            var y2 = inputEclipse[whichSet].y;
            var z2 = inputEclipse[whichSet].z;
            var a = inputEclipse[whichSet].a;
            var b = inputEclipse[whichSet].b;
            var c = inputEclipse[whichSet].c;

            for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
                var theta = latNumber * Math.PI / latitudeBands;
                var sinTheta = Math.sin(theta);
                var cosTheta = Math.cos(theta);

                for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
                    var phi = longNumber * 2 * Math.PI / longitudeBands;
                    var sinPhi = Math.sin(phi);
                    var cosPhi = Math.cos(phi);

                    var x = cosPhi * sinTheta;
                    var y = cosTheta;
                    var z = sinPhi * sinTheta;

                    var x1 = a * x + x2;
                    var y1 = b * y + y2;
                    var z1 = c * z + z2;

                    var coord = vec3.fromValues(x1,y1,z1);
                    var normal = vec3.clone(calNormal(x2,y2,z2,coord,a,b,c));
                    vec3.normalize(normal,normal);
                    var color = lighting(Eye,lights,normal,coord,curobject);
                
                    //change view when press key
                    coord = chageView(coord,lookAt,viewMatrix);
                    var coord = transform(coord,Eye);

                    coordArray.push(coord[0],coord[1],coord[2]);//push vertices to buffer
                    coordArray.push(color[0],color[1],color[2]);//push color to buffer 
                }
            }

            for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
                for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
                    var first = vtxBufferSize;
                    var second = first + longitudeBands + 1;
                    vtxBufferSize +=1;

                    indexArray.push(first,second,first + 1);//pushing things left to buffer according to the tutorial
                    triBufferSize += 3;

                    indexArray.push(second,second + 1,first + 1);
                    triBufferSize += 3;    
                }
            }          
            triBufferSize -= triBufferSize/latitudeBands/longitudeBands;
        } // end for each triangle set 

        // console.log("coordinates: "+coordArray.toString());
        // console.log("numverts: "+vtxBufferSize);
        // console.log("indices: "+indexArray.toString());
        // console.log("numindices: "+triBufferSize);
        
    } // end if triangles found
} // end load triangles

//viewing and perspective transform
function transform(vtxs,eye){
    var vtx = new vec3.fromValues(vtxs[0], vtxs[1], vtxs[2]);
    var matview = mat4.create();
    var center = lookAt;
    matview = mat4.lookAt(matview, eye, center, viewUp);

    var matPers = mat4.create();
    matPers = mat4.perspective(matPers, Math.PI/2., 1, 0.1, 10);

    vec3.transformMat4(vtx, vtx, matview);
    vec3.transformMat4(vtx, vtx, matPers);
    return vtx;
}

//Ka*La + Kd*Ld*(N•L) + Ks*Ls*(R•V)n = color
//Ka*La + Kd*Ld*(N•L) + Ks*Ls*(N•H)n = color

// translate from https://github.com/zli36/prog1/blob/gh-pages/drawstuff.js(my previous program)
function lighting(eye,inputLights,normal,surfacePos,curObject){

    var color  = [0,0,0];
    for(var l=0; l<inputLights.length;l++) {

        //ka * La, ambient
        var ambientColor = [
                            curObject.ambient[0] * inputLights[l].ambient[0],
                            curObject.ambient[1] * inputLights[l].ambient[1],
                            curObject.ambient[2] * inputLights[l].ambient[2]
                        ];

        //Kd*Ld(N.L), diffuse
        var vectorLight = vec3.fromValues(inputLights[l].x, inputLights[l].y, inputLights[l].z);

        var vectorL = vec3.create();
        vec3.subtract(vectorL, vectorLight, surfacePos);
        vec3.normalize(vectorL,vectorL);

        var NdotL = Math.max(vec3.dot(normal,vectorL),0);

        var diffuseColor = [
                            curObject.diffuse[0] * inputLights[l].diffuse[0] * NdotL,
                            curObject.diffuse[1] * inputLights[l].diffuse[1] * NdotL,
                            curObject.diffuse[2] * inputLights[l].diffuse[2] * NdotL
        ];

        //Ks*Ls*(N•H)n, specular

        var vectorV = vec3.create();
        vec3.subtract(vectorV,eye,surfacePos);
        vec3.normalize(vectorV,vectorV);
        var vectorH = vec3.create();
        vec3.add(vectorH,vectorL,vectorV);
        vec3.normalize(vectorH,vectorH);

        var NdotH = Math.pow(Math.max(vec3.dot(normal,vectorH),0),curObject.n);

        var specularColor = [
                            curObject.specular[0] * inputLights[l].specular[0] * NdotH,
                            curObject.specular[1] * inputLights[l].specular[1] * NdotH,
                            curObject.specular[2] * inputLights[l].specular[2] * NdotH
        ];

        color[0] += ambientColor[0] + diffuseColor[0] + specularColor[0];
        color[1] += ambientColor[1] + diffuseColor[1] + specularColor[1];
        color[2] += ambientColor[2] + diffuseColor[2] + specularColor[2];

    }
    return color;
}

// function calNormall(center,surfacePos, a, b, c) {
//     var temp = Vector.subtract(surfacePos,center);
//     normal = Vector.scale2(temp, new Vector(2/a/a, 2/b/b, 2/c/c));
//     return normal;

// }

//using the calNormal in prog1 for extra credit
function calNormal(x,y,z,surfacePos,a,b,c) {
    var a1 = surfacePos[0] - x;
    var b1 = surfacePos[1] - y;
    var c1 = surfacePos[2] - z;

    var temp = new vec3.fromValues(a1,b1,c1);
    var params = new vec3.fromValues(2/a/a,2/b/b,2/c/c);
    return scale2(temp,params);

}

function scale2(c,v) {
    return [c[0]*v[0],c[1]*v[1],c[2]*v[2]];
}


//change view
function chageView(vtxs,center,matrix){
    var vtx = new vec3.fromValues(vtxs[0], vtxs[1], vtxs[2]);
    vec3.subtract(vtx,vtx,center);
    vec3.transformMat4(vtx, vtx, matrix);
    vec3.add(vtx,vtx,center);
    return vtx;
}


//https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode
//https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/shiftKey
document.addEventListener('keydown', function(event) {
    if(!event.shiftKey){
        switch(event.code) {
            case "KeyQ":
                vec3.add(Eye,Eye,[0,-0.1,0]);
                vec3.add(lookAt,lookAt,[0,-0.1,0]);
                break;
            case "KeyW":
                vec3.add(Eye,Eye,[0,0,0.1]);
                vec3.add(lookAt,lookAt,[0,0,0.1]);
                break;
            case "KeyE":
                vec3.add(Eye,Eye,[0,0.1,0]);
                vec3.add(lookAt,lookAt,[0,0.1,0]);
                break;
            case "KeyA":
                vec3.add(Eye,Eye,[0.1,0,0]);
                vec3.add(lookAt,lookAt,[0.1,0,0]);
                break;
            case "KeyS":
                vec3.add(Eye,Eye,[0,0,-0.1]);
                vec3.add(lookAt,lookAt,[0,0,-0.1]);
                break;
            case "KeyD":
                vec3.add(Eye,Eye,[-0.1,0,0]);
                vec3.add(lookAt,lookAt,[-0.1,0,0]);
                break;
            default:
                break;
        }
        
    }
    else{
        //calculate the degree that should rotate
        var degpos = 30*Math.PI/180;
        var degneg = (-30)*Math.PI/180;

        switch(event.code){
            case "KeyW":;
                viewMatrix = mat4.rotateX(viewMatrix,viewMatrix,degneg);
                break;
            case "KeyA":
                viewMatrix = mat4.rotateY(viewMatrix,viewMatrix,degneg);
                break;
            case "KeyD":
                viewMatrix = mat4.rotateY(viewMatrix,viewMatrix,degpos);
                break;
            case "KeyS":
                viewMatrix = mat4.rotateX(viewMatrix,viewMatrix,degpos);
                break;
        }
    }
    drawProg2(Eye); 
});

function initialize(){
    gl = null; // the all powerful gl object. It's all here folks!
    triBufferSize = 0; // the number of indices in the triangle buffer
    coordArray = []; // 1D array of vertex coords for WebGL
    indexArray = []; // 1D array of vertex indices for WebGL
    vtxBufferSize = 0; // the number of vertices in the vertex buffer
}

function BufferOptions() {
        // send the vertex coords to webGL
        vertexBuffer = gl.createBuffer(); // init empty vertex coord buffer
        gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(coordArray),gl.STATIC_DRAW); // coords to that buffer
        
        // send the triangle indices to webGL
        triangleBuffer = gl.createBuffer(); // init empty triangle index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer); // activate that buffer
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indexArray),gl.STATIC_DRAW); // indices to that buffer
}

// setup the webGL shaders
function setupShaders() {
    var fShaderCode = `

        precision lowp float;  
        varying lowp vec4 v_Color;

        void main(void) {
            gl_FragColor = v_Color; // all fragments are white
        }
    `;
    var vShaderCode = `

        precision lowp float;
        attribute vec3 vertexPosition;
        attribute vec3 vertexColor;
        varying lowp vec4 v_Color;

        void main(void) {
            gl_Position = vec4(vertexPosition, 1.0); // use the untransformed position
            v_Color = vec4(vertexColor,1.0);
        }
    `;
    
    try {
        // console.log("fragment shader: "+fShaderCode);
        var fShader = gl.createShader(gl.FRAGMENT_SHADER); // create frag shader
        gl.shaderSource(fShader,fShaderCode); // attach code to shader
        gl.compileShader(fShader); // compile the code for gpu execution

        // console.log("vertex shader: "+vShaderCode);
        var vShader = gl.createShader(gl.VERTEX_SHADER); // create vertex shader
        gl.shaderSource(vShader,vShaderCode); // attach code to shader
        gl.compileShader(vShader); // compile the code for gpu execution
            
        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) { // bad frag shader compile
            throw "error during fragment shader compile: " + gl.getShaderInfoLog(fShader);  
            gl.deleteShader(fShader);
        } else if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) { // bad vertex shader compile
            throw "error during vertex shader compile: " + gl.getShaderInfoLog(vShader);  
            gl.deleteShader(vShader);
        } else { // no compile errors
            var shaderProgram = gl.createProgram(); // create the single shader program
            gl.attachShader(shaderProgram, fShader); // put frag shader in program
            gl.attachShader(shaderProgram, vShader); // put vertex shader in program
            gl.linkProgram(shaderProgram); // link program into gl context

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) { // bad program link
                throw "error during shader program linking: " + gl.getProgramInfoLog(shaderProgram);
            } else { // no shader program link errors
                gl.useProgram(shaderProgram); // activate shader program (frag and vert)
                vertexPositionAttrib = // get pointer to vertex shader input
                    gl.getAttribLocation(shaderProgram, "vertexPosition"); 
                gl.enableVertexAttribArray(vertexPositionAttrib); // input to shader from array

                vertexColorAttrib = // get pointer to vertex shader input
                    gl.getAttribLocation(shaderProgram, "vertexColor"); 
                gl.enableVertexAttribArray(vertexColorAttrib); // input to shader from array
            } // end if no shader program link errors
        } // end if no compile errors
    } // end try 
    
    catch(e) {
        console.log(e);
    } // end catch
} // end setup shaders

function renderTriangles() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers
    
    // vertex buffer: activate and feed into vertex shader
    // gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer); // activate
    gl.vertexAttribPointer(vertexPositionAttrib,3,gl.FLOAT,false,4*6,0); // feed
    gl.vertexAttribPointer(vertexColorAttrib,3,gl.FLOAT,false,4*6,4*3); // feed

    // triangle buffer: activate and render
    // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,triangleBuffer); // activate
    // console.log(triBufferSize);
    gl.drawElements(gl.TRIANGLES,triBufferSize,gl.UNSIGNED_SHORT,0); // render

} // end render triangles


/* MAIN -- HERE is where execution begins after window load */

function drawProg2() {
  initialize();
  var lights = getJSONFile(INPUT_LIGHTS_URL,"lights");
  setupWebGL(); // set up the webGL environment
  loadTriangles(lights); // load in the triangles from tri file
  loadEclipse(lights);
  BufferOptions();
  setupShaders(); // setup the webGL shaders
  renderTriangles(); // draw the triangles using webGL
  
} // end main

function main() {
    drawProg2();
}
