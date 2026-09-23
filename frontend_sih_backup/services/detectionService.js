/**
 * Sends a captured video frame blob to the FastAPI detection endpoint.
 * Supports both local YOLO and Roboflow Serverless Cloud API engines.
 * 
 * @param {Blob} imageBlob - JPEG image blob captured from the video element
 * @param {string} [engine] - Optional engine identifier ('yolo' or 'roboflow')
 * @returns {Promise<Object>} Detection results containing detections array and latency
 */
export async function detectObjectsFromFrame(imageBlob, engine = null) {
  const formData = new FormData();
  formData.append('file', imageBlob, 'frame.jpg');

  const endpoint = engine
    ? `/api/v1/detect?engine=${encodeURIComponent(engine)}`
    : '/api/v1/detect';

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Detection API error (${response.status}): ${errorText || 'Server error'}`);
  }

  return await response.json();
}
