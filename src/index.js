//console.log("hola, what's happening, no cap in my caption");



const ESTADO = {
    GRABANDO : "GRABANDO",
    DETENIDO : "DETENIDO",
    PAUSADO : "PAUSADO"
}

const URL_ICONO = {
    GRABAR : "/public/icons/record-fill.svg",
    PAUSAR : "/public/icons/pause-circle.svg",
    DETENER : "/public/icons/stop-circle.svg"
}


let captura = document.getElementById("captura");

let captureOptions = {
    video : {
        cursor : 'always'
    },
    audio: false
}

const startCapture = async () => {

    //getUserMedia va a llamar a las cámaras
    //getDisplayMedia va a capturar la pantalla
    
    try {
        captura.srcObject = await navigator.mediaDevices.getDisplayMedia(captureOptions);
        
    } catch (err) {
        console.log("error: " + err );
    }
    
};

const stopCapture = async () => {
    let tracks = captura.srcObject.getTracks();
    tracks.forEach(track => {
        track.stop();
    });
    captura.srcObject = null;
};

const pauseCapture = async () => {
    
};

const botonAccion = document.getElementById("botonAccion");
botonAccion.addEventListener("click", startCapture);