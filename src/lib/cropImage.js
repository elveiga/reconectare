const loadImage = (src) => new Promise((resolve, reject) => {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('Nao foi possivel carregar a imagem para recorte.'));
  image.src = src;
});

export const getCroppedImageFile = async (
  imageSrc,
  pixelCrop,
  fileName = 'imagem-produto.jpg',
  options = {}
) => {
  const image = await loadImage(imageSrc);
  const outputWidth = options.outputWidth || 1200;
  const outputHeight = options.outputHeight || 900;
  const mimeType = options.mimeType || 'image/jpeg';
  const quality = options.quality || 0.92;

  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Nao foi possivel preparar o recorte da imagem.');
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  context.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputWidth,
    outputHeight
  );

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) {
        resolve(result);
      } else {
        reject(new Error('Nao foi possivel gerar a imagem recortada.'));
      }
    }, mimeType, quality);
  });

  return new File([blob], fileName, { type: mimeType });
};
