import { Validator } from "jsonschema";
import { ddbSchema, jsonSchema } from "../schemas";

const enterFullscreen = () => {
  const element = document.documentElement;
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
};

const exitFullscreen = () => {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
};

const jsonDiagramIsValid = (obj) => {
  return new Validator().validate(obj, jsonSchema).valid;
};

const ddbDiagramIsValid = (obj) => {
  return new Validator().validate(obj, ddbSchema).valid;
};

function dataURItoBlob(dataUrl) {
  const byteString = atob(dataUrl.split(",")[1]);
  const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const intArray = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteString.length; i++) {
    intArray[i] = byteString.charCodeAt(i);
  }

  return new Blob([intArray], { type: mimeString });
}

export {
  enterFullscreen,
  exitFullscreen,
  jsonDiagramIsValid,
  ddbDiagramIsValid,
  dataURItoBlob,
};
