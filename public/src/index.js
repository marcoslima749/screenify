//constantes para setear y recuperar el estado de la aplicación y llamar a las acciones

const ESTADO = {
  GRABANDO: "GRABAR",
  DETENIDO: "DETENER",
};

const ACCION = {
  GRABAR: "GRABAR",
  DETENER: "DETENER",
  GUARDAR: "GUARDAR",
  DESCARTAR: "DESCARTAR",
};

const TIPO_VIDEO = "video/webm;  codecs=vp9";

const INACTIVE = "inactive";
const RECORDING = "recording";
const PAUSED = "paused";

//Obteniendo los elementos para manipular más tarde

const checkAudio = document.getElementById("flexSwitchCheckDefault");
const checkCamara = document.getElementById("checkCamara");

const botonGrabar = document.getElementById("botonGrabar");
const botonPausarDetener = document.getElementById("botonPausarDetener");
const botonGuardar = document.getElementById("botonGuardar");
const botonDescartar = document.getElementById("botonDescartar");
const captura = document.getElementById("captura");
const modalBackground = document.getElementById("modalBackground");
const modalConfirmar = document.getElementById("modalConfirmar");
const modalCancelar = document.getElementById("modalCancelar");
const capturaCamara = document.createElement("video");

let estadoActual = ESTADO.DETENIDO;

let stream = null;
let grabacion = [];
let mediaRecorder = null;
let streamCamara = null;

const verificarEstado = ({ estadoActual, accion }) => {
  //al grabar o detener
  //Verifica que estadoActual tenga algún valor
  //y que no se esté pidiendo lo que ya se está ejecutando
  //si está ok llama a la acción
  if (estadoActual === accion && estadoActual) {
    alert("Ya se está ejecutando la acción solicitada");
  } else {
    ejecutarAccion({ accion });
  }
};

const ejecutarAccion = ({ accion }) => {
  switch (accion) {
    case ACCION.GRABAR:
      startCapture();
      break;
    case ACCION.DETENER:
      stopCapture();
      break;
  }
};
//esto es un comentario solamente para ver si se rompe..

const startCapture = async () => {
  //getUserMedia va a llamar a las cámaras
  //getDisplayMedia va a capturar la pantalla

  //verificar el check de audio antes de enviar la accion
  let captureOptions = {
    video: {
      cursor: "always",
    },
    audio: checkAudio.checked,
  };

  try {
    if (grabacion.length === 0) {
      stream = await navigator.mediaDevices.getDisplayMedia(captureOptions);
      captura.classList.remove("no-video");
      captura.srcObject = stream; //el video tag tiene autoplay así que no hay que ejecutar .play()

      const options = { mimeType: TIPO_VIDEO };
      mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorder.ondataavailable = handleDataAvailable;
    }

    /*
    CODIGO PARA HACER PICTURE IN PICTURE
    */

    if (checkCamara.checked) {
      let constraints = { audio: checkAudio.checked, video: true };

      streamCamara = await navigator.mediaDevices.getUserMedia(constraints);

      capturaCamara.srcObject = streamCamara;

      capturaCamara.onloadedmetadata = async () => {
        capturaCamara.play();
        try {
          await capturaCamara.requestPictureInPicture();
        } catch (error) {
          console.log("error en pip", error);
          //HAY QUE HACER UN MODAL COMO LA GENTE
          modalBackground.style.display = "Flex";
        }
      };

      //el video tag tiene autoplay así que no hay que ejecutar .play()
      //NO ES NECESRIO GRABAR EL STREAM PORQUE ESTÁS GRABANDO LA PANTALLA DONDE SALDRÍA POR PIP
      //Estoy haciendo una pruba porque se está cortando el asdsafasdfasdfasdf
    }

    /*
            MediaRecorder.state:

            'inactive': Recording is not occurring — it has either not been started yet, or it has been started and then stopped.
            'recording': Recording has been started and the UA is capturing data.
            'paused': Recording has been started, then paused, but not yet stopped or resumed.

             */

    let estadoMediaRecorder = mediaRecorder.state;

    if (estadoMediaRecorder && estadoMediaRecorder === "recording") {
      alert("la grabación ya había comenzado!");
      return;
    }

    //grabando la captura
    if (estadoMediaRecorder && estadoMediaRecorder === "inactive") {
      mediaRecorder.start(1000); //cada 1000 milisegundos emite un evento dataavailable para que se guarden los datos
    } else if (estadoMediaRecorder === "paused") {
      mediaRecorder.resume(1000);
    }

    estadoActual = ESTADO.GRABANDO;
    botonGrabar.classList.remove("mostrar");
    botonGrabar.classList.add("ocultar");
    botonPausarDetener.classList.remove("ocultar");
    botonPausarDetener.classList.add("mostrar");
  } catch (err) {
    console.log("error: " + err);
  }
};

const handleDataAvailable = (e) => {
  console.log("dataavailable");
  grabacion.push(e.data);
};

const stopCapture = async () => {
  /*
    let tracks = await captura.srcObject.getTracks();
    tracks.forEach(track => {
        track.stop();
    });
    captura.srcObject = null;
    captura.classList.add('no-video');
    */

  mediaRecorder.pause();

  estadoActual = ESTADO.DETENIDO;

  botonGrabar.classList.remove("ocultar");
  botonGrabar.classList.add("mostrar");
  botonPausarDetener.classList.remove("mostrar");
  botonPausarDetener.classList.add("ocultar");
};

const saveCapture = async () => {
  if (grabacion.length === 0) {
    alert("no hay grabaciones!");
    return;
  }

  if (mediaRecorder.state !== INACTIVE) {
    await mediaRecorder.stop();
    console.log("media stop");
  }

  if (captura.srcObject !== null) {
    console.log("anulando la captura");
    let tracks = await captura.srcObject.getTracks();
    await tracks.forEach(async (track) => {
      await track.stop();
    });
    captura.srcObject = null;
  }

  if (capturaCamara.srcObject !== null) {
    console.log("anulando la capturaCamara");
    let tracks = await capturaCamara.srcObject.getTracks();
    await tracks.forEach(async (track) => {
      await track.stop();
    });
    capturaCamara.srcObject = null;
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
    }
  }

  if (![].includes.call(captura.classList, "no-video")) {
    captura.classList.add("no-video");
  }

  //nullificando el stream y el mediarecorder
  console.log("stream y mediaRecorder = null");
  stream = null;
  mediaRecorder = null;

  //APARENTEMENTE AL NULLIFICAR EL STREAM O EL MEDIARECORDER SE DISPARA UN ÚLTIMO EVENTO DATAAVAILABLE QUE QUEDA
  //PUSHEADO EN LA GRABACIÓN, Y COMO QUEDA ATRÁS EN EL STACK SE QUEDA SOLO EN LA GRABACIÓN, ENTONCES
  //PARA SALIR DEL PASO PUSE EL CÓDIGO DE GUARDAR DATOS EN UN SETTIMEOUT PARA QUE SE SALTEE UN EVENT LOOP
  //HAY QUE REFACTORIZAR MÁS ADELANTE
  setTimeout(() => {
    console.log("guardando datos");
    let link = document.createElement("a");
    link.download = `${Date.now()}-capture.webm`;

    const blob = new Blob(grabacion, {
      type: TIPO_VIDEO,
    });

    link.href = URL.createObjectURL(blob);

    link.click();

    URL.revokeObjectURL(link.href);

    grabacion = [];

    estadoActual = ESTADO.DETENIDO;

    botonGrabar.classList.remove("ocultar");
    botonGrabar.classList.add("mostrar");
    botonPausarDetener.classList.remove("mostrar");
    botonPausarDetener.classList.add("ocultar");

    console.log("listo guardar datos");
    alert("grabación descargada con éxito");
  }, 0);
};

const discardCapture = async () => {
  if (grabacion.length === 0) {
    alert("no hay grabaciones!");
    return;
  }

  await mediaRecorder.stop();

  if (captura.srcObject !== null) {
    console.log("anulando la captura");
    let tracks = await captura.srcObject.getTracks();
    await tracks.forEach(async (track) => {
      await track.stop();
    });
    captura.srcObject = null;
  }

  if (capturaCamara.srcObject !== null) {
    console.log("anulando la capturaCamara");
    let tracks = await capturaCamara.srcObject.getTracks();
    await tracks.forEach(async (track) => {
      await track.stop();
    });
    capturaCamara.srcObject = null;
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
    }
  }

  if (![].includes.call(captura.classList, "no-video")) {
    captura.classList.add("no-video");
  }

  mediaRecorder = null;
  stream = null;

  //SETTIMEOUT PARA ESPERAR AL ULTIMO DATAAVAILABLE
  setTimeout(() => {
    grabacion = [];
  }, 0);

  estadoActual = ESTADO.DETENIDO;

  botonGrabar.classList.remove("ocultar");
  botonGrabar.classList.add("mostrar");
  botonPausarDetener.classList.remove("mostrar");
  botonPausarDetener.classList.add("ocultar");

  alert("La grabación ha sido eliminada!");
};

botonGrabar.addEventListener("click", () => {
  verificarEstado({ estadoActual, accion: ACCION.GRABAR });
});
botonPausarDetener.addEventListener("click", () => {
  verificarEstado({ estadoActual, accion: ACCION.DETENER });
});
botonGuardar.addEventListener("click", saveCapture);
botonDescartar.addEventListener("click", discardCapture);

modalConfirmar.addEventListener("click", () => {
  capturaCamara.requestPictureInPicture();
  modalBackground.style.display = "none";
});

const detenerCamara = async () => {
  if (capturaCamara.srcObject !== null) {
    console.log("anulando la capturaCamara");
    let tracks = await capturaCamara.srcObject.getTracks();
    await tracks.forEach(async (track) => {
      await track.stop();
    });
    capturaCamara.srcObject = null;
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
    }
  }
};

modalCancelar.addEventListener("click", () => {
  alert("Cámara cancelada por el usuario!");
  detenerCamara();
  modalBackground.style.display = "none";
});

window.addEventListener("DOMContentLoaded", (event) => {
  console.log("DOM fully loaded and parsed");
});

/*
TODO: Para implementar capturar la camara onda Loom habría que sacar el strea en un tag o ventana aparte
que pueda tener una propiedad "always on top" o algo así. La grabación queda en la pantalla que se comparte.
No hace falta grabar aparte la camara, solo stremearla siempre encima de todo. Y que sea dragueable.
*/
