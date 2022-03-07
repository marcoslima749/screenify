

//constantes para setear y recuperar el estado de la aplicación y llamar a las acciones

const ESTADO = {
    GRABANDO : "GRABAR",
    DETENIDO : "DETENER"
}

const ACCION = {
    GRABAR : "GRABAR",
    DETENER : "DETENER",
    GUARDAR : "GUARDAR",
    DESCARTAR: "DESCARTAR"
}

const TIPO_VIDEO = 'video/webm;  codecs=vp9';

//Obteniendo los elementos para manipular más tarde

const checkAudio = document.getElementById("flexSwitchCheckDefault");

const botonGrabar = document.getElementById("botonGrabar");
const botonPausarDetener = document.getElementById("botonPausarDetener");
const botonGuardar = document.getElementById("botonGuardar");
const botonDescartar = document.getElementById("botonDescartar");
const captura = document.getElementById("captura");

let estadoActual = ESTADO.DETENIDO;

let stream = null;
let grabacion = [];
let mediaRecorder = null;





const verificarEstado = ({estadoActual, accion}) => {
    //al grabar o detener
    //Verifica que estadoActual tenga algún valor
    //y que no se esté pidiendo lo que ya se está ejecutando
    //si está ok llama a la acción
    if (estadoActual === accion && estadoActual) {
        alert('Ya se está ejecutando la acción solicitada');
    } else {
        ejecutarAccion({accion})
    }
}

const ejecutarAccion = ({accion}) => {
    switch (accion) {
        case ACCION.GRABAR:
            startCapture();
            break;
        case ACCION.DETENER:
            stopCapture();
            break;
        case ACCION.GRABAR:
    }
}


const startCapture = async () => {

    //getUserMedia va a llamar a las cámaras
    //getDisplayMedia va a capturar la pantalla

    //verificar el check de audio antes de enviar la accion
    let captureOptions = {
        video : {
            cursor : 'always'
        },
        audio: checkAudio.checked
    }
    
    try {


                stream = await navigator.mediaDevices.getDisplayMedia(captureOptions);
                captura.classList.remove('no-video');
                captura.srcObject = stream; //el video tag tiene autoplay así que no hay que ejecutar .play()

                const options = {mimeType : TIPO_VIDEO};
                mediaRecorder = new MediaRecorder(stream, options);
                mediaRecorder.ondataavailable = handleDataAvailable;

            
            /*
            MediaRecorder.state:

            'inactive': Recording is not occurring — it has either not been started yet, or it has been started and then stopped.
            'recording': Recording has been started and the UA is capturing data.
            'paused': Recording has been started, then paused, but not yet stopped or resumed.

             */


           let estadoMediaRecorder =  mediaRecorder.state;
           
           if(estadoMediaRecorder && estadoMediaRecorder === 'recording') {
               alert('la grabación ya había comenzado!');
               return;
           }
            
           //grabando la captura
           if(estadoMediaRecorder && estadoMediaRecorder === 'inactive') {
               mediaRecorder.start(); //cada 1000 milisegundos emite un evento dataavailable para que se guarden los datos
           } else if (estadoMediaRecorder === 'paused') {
               mediaRecorder.resume();
           }


            estadoActual = ESTADO.GRABANDO;
            botonGrabar.classList.remove('mostrar');
            botonGrabar.classList.add('ocultar');
            botonPausarDetener.classList.remove('ocultar');
            botonPausarDetener.classList.add('mostrar');
            
        
    } catch (err) {
        console.log("error: " + err );
    }
    
};

const handleDataAvailable = (e) => {
    console.log('dataavailable');
    grabacion.push(e.data);
}




const stopCapture = async () => {
    let tracks = await captura.srcObject.getTracks();
    tracks.forEach(track => {
        track.stop();
    });
    captura.srcObject = null;
    captura.classList.add('no-video');

    mediaRecorder.pause();

    estadoActual = ESTADO.DETENIDO;

    botonGrabar.classList.remove('ocultar');
    botonGrabar.classList.add('mostrar');
    botonPausarDetener.classList.remove('mostrar');
    botonPausarDetener.classList.add('ocultar');

};

const saveCapture = async () => {
    if(grabacion.length === 0) {
        alert('no hay grabaciones!');
        return
    }
    console.log('guardando datos');
    let link = document.createElement('a');
    link.download = `${Date.now()}-capture.webm`;

    const blob =  new Blob(grabacion, {
        type: TIPO_VIDEO
    });
    
    link.href = URL.createObjectURL(blob);

    link.click();

    URL.revokeObjectURL(link.href);    
    grabacion = [];
    stream = null;
    mediaRecorder = null;

    alert('grabación descargada con éxito');
    stopCapture()
};

const discardCapture = async () => {
    
    if(grabacion.length === 0) {
        alert('no hay grabaciones!');
        return
    }

    grabacion = [];
    stream = null;
    mediaRecorder = null;
    alert('La grabación ha sido eliminada!');
    stopCapture()
}


botonGrabar.addEventListener("click", ()=> {verificarEstado({estadoActual, accion : ACCION.GRABAR})});
botonPausarDetener.addEventListener("click", ()=> {verificarEstado({estadoActual, accion : ACCION.DETENER})});
botonGuardar.addEventListener("click", saveCapture);
botonDescartar.addEventListener("click", discardCapture);

