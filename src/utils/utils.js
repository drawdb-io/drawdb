export function dataURItoBlob(dataUrl) {
  const byteString = atob(dataUrl.split(",")[1]);
  const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const intArray = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteString.length; i++) {
    intArray[i] = byteString.charCodeAt(i);
  }

  return new Blob([intArray], { type: mimeString });
}

export function arrayIsEqual(arr1, arr2) {
  return JSON.stringify(arr1) === JSON.stringify(arr2);
}

export function strHasQuotes(str) {
  if (str.length < 2) return false;

  return (
    (str[0] === str[str.length - 1] && str[0] === "'") ||
    (str[0] === str[str.length - 1] && str[0] === '"') ||
    (str[0] === str[str.length - 1] && str[0] === "`")
  );
}

export function isFunction(str) {
  return /\w+\([^)]*\)$/.test(str);
}
